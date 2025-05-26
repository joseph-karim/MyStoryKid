import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client for JWT verification
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lulu Direct configuration from environment
const LULU_CLIENT_KEY = Deno.env.get('LULU_CLIENT_KEY');
const LULU_CLIENT_SECRET = Deno.env.get('LULU_CLIENT_SECRET');
const LULU_API_BASE = Deno.env.get('LULU_API_BASE') || 'https://api.lulu.com';
const LULU_OAUTH_ENDPOINT = Deno.env.get('LULU_OAUTH_ENDPOINT') || 'https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token';

// Token cache to avoid repeated OAuth2 calls
let cachedToken: { token: string; expires: number } | null = null;

// Rate limiting storage
const rateLimiter = new Map<string, number[]>();

interface ProxyRequest {
  method: string;
  endpoint: string;
  body?: any;
}

// Verify Supabase JWT token
async function verifyToken(authHeader: string): Promise<string | null> {
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Get OAuth2 access token for Lulu Direct
async function getLuluAccessToken(): Promise<string | null> {
  try {
    // Check if we have a valid cached token
    if (cachedToken && cachedToken.expires > Date.now()) {
      return cachedToken.token;
    }

    // Get new token
    const credentials = btoa(`${LULU_CLIENT_KEY}:${LULU_CLIENT_SECRET}`);
    
    const response = await fetch(LULU_OAUTH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      console.error('Lulu OAuth2 failed:', response.status, await response.text());
      return null;
    }

    const tokenData = await response.json();
    
    // Cache the token (expires in 1 hour, cache for 50 minutes)
    cachedToken = {
      token: tokenData.access_token,
      expires: Date.now() + (50 * 60 * 1000) // 50 minutes
    };

    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting Lulu access token:', error);
    return null;
  }
}

// Rate limiting check
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 20) { // Max 20 requests per minute for Lulu Direct
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}

// Validate request endpoint
function validateEndpoint(endpoint: string): boolean {
  const allowedEndpoints = [
    '/print-jobs',
    '/print-job-cost-calculations',
    '/webhooks',
    '/account',
    '/shipping-options'
  ];
  
  return allowedEndpoints.some(allowed => endpoint.startsWith(allowed));
}

// Log API call for monitoring
async function logApiCall(userId: string, endpoint: string, method: string, success: boolean, error?: string) {
  try {
    await supabase
      .from('api_logs')
      .insert({
        user_id: userId,
        service: 'lulu',
        endpoint,
        method,
        success,
        error_message: error,
        timestamp: new Date().toISOString()
      });
  } catch (logError) {
    console.error('Failed to log API call:', logError);
  }
}

// Main handler
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check if Lulu Direct is configured
    if (!LULU_CLIENT_KEY || !LULU_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Lulu Direct not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = await verifyToken(authHeader);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      await logApiCall(userId, '', '', false, 'Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 20 requests per minute.' }), 
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const proxyRequest: ProxyRequest = await req.json();
    const { method, endpoint, body } = proxyRequest;

    // Validate endpoint
    if (!validateEndpoint(endpoint)) {
      await logApiCall(userId, endpoint, method, false, 'Endpoint not allowed');
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Lulu Direct access token
    const accessToken = await getLuluAccessToken();
    if (!accessToken) {
      await logApiCall(userId, endpoint, method, false, 'Failed to get Lulu access token');
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Lulu Direct' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Make request to Lulu Direct API
    const luluUrl = `${LULU_API_BASE}${endpoint}`;
    const luluResponse = await fetch(luluUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const responseText = await luluResponse.text();
    const success = luluResponse.ok;

    // Log the API call
    await logApiCall(
      userId, 
      endpoint, 
      method, 
      success, 
      success ? undefined : `HTTP ${luluResponse.status}: ${responseText}`
    );

    // Return response
    return new Response(responseText, {
      status: luluResponse.status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '19' // Indicate rate limit info
      }
    });

  } catch (error) {
    console.error('Lulu proxy error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 