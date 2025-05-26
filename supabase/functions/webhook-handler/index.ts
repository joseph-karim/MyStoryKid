import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Webhook secrets for verification
const SHOPIFY_WEBHOOK_SECRET = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
const LULU_WEBHOOK_SECRET = Deno.env.get('LULU_WEBHOOK_SECRET');

interface ShopifyOrderEvent {
  id: number;
  order_number: string;
  email: string;
  financial_status: string;
  fulfillment_status: string;
  total_price: string;
  currency: string;
  created_at: string;
  updated_at: string;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
  }>;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
  };
}

interface LuluPrintStatusEvent {
  order_id: string;
  status: 'CREATED' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'ERROR';
  tracking_number?: string;
  tracking_url?: string;
  estimated_delivery_date?: string;
  updated_at: string;
  line_items?: Array<{
    line_item_id: string;
    status: string;
    tracking_number?: string;
  }>;
}

// Verify Shopify webhook signature
async function verifyShopifySignature(body: string, signature: string): Promise<boolean> {
  if (!SHOPIFY_WEBHOOK_SECRET || !signature) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SHOPIFY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const receivedHex = signature.replace('sha256=', '');
  return expectedHex === receivedHex;
}

// Verify Lulu webhook signature
async function verifyLuluSignature(body: string, signature: string): Promise<boolean> {
  if (!LULU_WEBHOOK_SECRET || !signature) {
    return false;
  }

  // Implement Lulu's signature verification logic
  // This will depend on Lulu's specific signature format
  return true; // Placeholder - implement based on Lulu's documentation
}

// Handle Shopify order webhooks
async function handleShopifyWebhook(req: Request): Promise<Response> {
  try {
    const body = await req.text();
    const signature = req.headers.get('X-Shopify-Hmac-Sha256');
    const topic = req.headers.get('X-Shopify-Topic');

    // Verify webhook signature
    if (!await verifyShopifySignature(body, signature || '')) {
      console.error('Invalid Shopify webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const orderData: ShopifyOrderEvent = JSON.parse(body);
    console.log(`Processing Shopify webhook: ${topic} for order ${orderData.order_number}`);

    // Process different webhook topics
    switch (topic) {
      case 'orders/create':
        await handleOrderCreated(orderData);
        break;
      case 'orders/updated':
        await handleOrderUpdated(orderData);
        break;
      case 'orders/paid':
        await handleOrderPaid(orderData);
        break;
      case 'orders/cancelled':
        await handleOrderCancelled(orderData);
        break;
      case 'orders/fulfilled':
        await handleOrderFulfilled(orderData);
        break;
      default:
        console.log(`Unhandled Shopify webhook topic: ${topic}`);
    }

    // Log webhook receipt
    await logWebhookEvent('shopify', topic || 'unknown', orderData.id.toString(), 'success');

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing Shopify webhook:', error);
    await logWebhookEvent('shopify', 'error', '', 'error', error.message);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Handle Lulu Direct print status webhooks
async function handleLuluWebhook(req: Request): Promise<Response> {
  try {
    const body = await req.text();
    const signature = req.headers.get('X-Lulu-Signature');

    // Verify webhook signature
    if (!await verifyLuluSignature(body, signature || '')) {
      console.error('Invalid Lulu webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const printStatusData: LuluPrintStatusEvent = JSON.parse(body);
    console.log(`Processing Lulu webhook: status ${printStatusData.status} for order ${printStatusData.order_id}`);

    await handlePrintStatusUpdate(printStatusData);

    // Log webhook receipt
    await logWebhookEvent('lulu', 'print_status_update', printStatusData.order_id, 'success');

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing Lulu webhook:', error);
    await logWebhookEvent('lulu', 'print_status_update', '', 'error', error.message);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Shopify webhook handlers
async function handleOrderCreated(orderData: ShopifyOrderEvent) {
  console.log(`Creating new order record for Shopify order ${orderData.order_number}`);
  
  // Create order record in database
  const { error } = await supabase
    .from('orders')
    .insert({
      shopify_order_id: orderData.id.toString(),
      order_number: orderData.order_number,
      customer_email: orderData.email,
      customer_name: `${orderData.customer?.first_name || ''} ${orderData.customer?.last_name || ''}`.trim(),
      total_amount: parseFloat(orderData.total_price),
      currency: orderData.currency,
      status: 'pending',
      financial_status: orderData.financial_status,
      fulfillment_status: orderData.fulfillment_status || 'unfulfilled',
      order_data: orderData,
      created_at: new Date(orderData.created_at).toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error creating order record:', error);
    throw error;
  }

  // Queue order processing job
  await queueOrderProcessing(orderData.id.toString(), 'process_new_order');
}

async function handleOrderUpdated(orderData: ShopifyOrderEvent) {
  console.log(`Updating order record for Shopify order ${orderData.order_number}`);
  
  const { error } = await supabase
    .from('orders')
    .update({
      financial_status: orderData.financial_status,
      fulfillment_status: orderData.fulfillment_status || 'unfulfilled',
      total_amount: parseFloat(orderData.total_price),
      order_data: orderData,
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', orderData.id.toString());

  if (error) {
    console.error('Error updating order record:', error);
    throw error;
  }
}

async function handleOrderPaid(orderData: ShopifyOrderEvent) {
  console.log(`Order paid: ${orderData.order_number}`);
  
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      financial_status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', orderData.id.toString());

  if (error) {
    console.error('Error updating order status to paid:', error);
    throw error;
  }

  // Queue print job creation
  await queueOrderProcessing(orderData.id.toString(), 'create_print_job');
}

async function handleOrderCancelled(orderData: ShopifyOrderEvent) {
  console.log(`Order cancelled: ${orderData.order_number}`);
  
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', orderData.id.toString());

  if (error) {
    console.error('Error updating order status to cancelled:', error);
    throw error;
  }

  // Queue cancellation processing
  await queueOrderProcessing(orderData.id.toString(), 'process_cancellation');
}

async function handleOrderFulfilled(orderData: ShopifyOrderEvent) {
  console.log(`Order fulfilled: ${orderData.order_number}`);
  
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'fulfilled',
      fulfillment_status: 'fulfilled',
      updated_at: new Date().toISOString()
    })
    .eq('shopify_order_id', orderData.id.toString());

  if (error) {
    console.error('Error updating order status to fulfilled:', error);
    throw error;
  }
}

// Lulu webhook handlers
async function handlePrintStatusUpdate(printStatusData: LuluPrintStatusEvent) {
  console.log(`Updating print job status for order ${printStatusData.order_id} to ${printStatusData.status}`);
  
  // Update print job status
  const { error: printJobError } = await supabase
    .from('print_jobs')
    .update({
      status: printStatusData.status.toLowerCase(),
      tracking_number: printStatusData.tracking_number,
      tracking_url: printStatusData.tracking_url,
      estimated_delivery_date: printStatusData.estimated_delivery_date,
      status_data: printStatusData,
      updated_at: new Date().toISOString()
    })
    .eq('lulu_order_id', printStatusData.order_id);

  if (printJobError) {
    console.error('Error updating print job status:', printJobError);
    throw printJobError;
  }

  // Update corresponding order status
  let orderStatus = 'processing';
  switch (printStatusData.status) {
    case 'CREATED':
      orderStatus = 'processing';
      break;
    case 'IN_PRODUCTION':
      orderStatus = 'printing';
      break;
    case 'SHIPPED':
      orderStatus = 'shipped';
      break;
    case 'DELIVERED':
      orderStatus = 'delivered';
      break;
    case 'CANCELLED':
      orderStatus = 'cancelled';
      break;
    case 'ERROR':
      orderStatus = 'error';
      break;
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: orderStatus,
      tracking_number: printStatusData.tracking_number,
      tracking_url: printStatusData.tracking_url,
      estimated_delivery_date: printStatusData.estimated_delivery_date,
      updated_at: new Date().toISOString()
    })
    .eq('id', (await supabase
      .from('print_jobs')
      .select('order_id')
      .eq('lulu_order_id', printStatusData.order_id)
      .single()
    ).data?.order_id);

  if (orderError) {
    console.error('Error updating order status from print job:', orderError);
    throw orderError;
  }

  // Queue notification sending
  await queueOrderProcessing(printStatusData.order_id, 'send_status_notification');
}

// Queue management functions
async function queueOrderProcessing(orderId: string, jobType: string) {
  try {
    const { error } = await supabase
      .from('job_queue')
      .insert({
        job_type: jobType,
        order_id: orderId,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        created_at: new Date().toISOString(),
        scheduled_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error queuing job:', error);
      throw error;
    }

    console.log(`Queued job ${jobType} for order ${orderId}`);
  } catch (error) {
    console.error('Error in queueOrderProcessing:', error);
    throw error;
  }
}

// Logging function
async function logWebhookEvent(
  source: string,
  event_type: string,
  reference_id: string,
  status: 'success' | 'error',
  error_message?: string
) {
  try {
    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        source,
        event_type,
        reference_id,
        status,
        error_message,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging webhook event:', error);
    }
  } catch (error) {
    console.error('Error in logWebhookEvent:', error);
  }
}

// Main handler
serve(async (req) => {
  const { pathname } = new URL(req.url);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-lulu-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Route webhooks
  if (pathname === '/webhook/shopify' && req.method === 'POST') {
    const response = await handleShopifyWebhook(req);
    return new Response(response.body, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } else if (pathname === '/webhook/lulu' && req.method === 'POST') {
    const response = await handleLuluWebhook(req);
    return new Response(response.body, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } else if (pathname === '/health' && req.method === 'GET') {
    return new Response('OK', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } else {
    return new Response('Not Found', {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
}); 