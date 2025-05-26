import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client for JWT verification
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Shopify configuration from environment
const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN');
const SHOPIFY_API_BASE = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10`;

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

// Rate limiting check
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 30) { // Max 30 requests per minute
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}

// Validate request endpoint
function validateEndpoint(endpoint: string): boolean {
  const allowedEndpoints = [
    '/shop',
    '/orders',
    '/products',
    '/webhooks',
    '/customers',
    '/inventory_levels'
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
        service: 'shopify',
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
    // Check if Shopify is configured
    if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE_DOMAIN) {
      return new Response(
        JSON.stringify({ error: 'Shopify not configured' }), 
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
        JSON.stringify({ error: 'Rate limit exceeded. Max 30 requests per minute.' }), 
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

    // Make request to Shopify API
    const shopifyUrl = `${SHOPIFY_API_BASE}${endpoint}`;
    const shopifyResponse = await fetch(shopifyUrl, {
      method,
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const responseText = await shopifyResponse.text();
    const success = shopifyResponse.ok;

    // Log the API call
    await logApiCall(
      userId, 
      endpoint, 
      method, 
      success, 
      success ? undefined : `HTTP ${shopifyResponse.status}: ${responseText}`
    );

    // Return response
    return new Response(responseText, {
      status: shopifyResponse.status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '29' // Indicate rate limit info
      }
    });

  } catch (error) {
    console.error('Shopify proxy error:', error);
    
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