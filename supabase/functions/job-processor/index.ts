import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// External service configurations
const LULU_API_BASE = Deno.env.get('LULU_API_BASE') || 'https://api.lulu.com';
const LULU_API_KEY = Deno.env.get('LULU_API_KEY');
const LULU_CLIENT_KEY = Deno.env.get('LULU_CLIENT_KEY');
const LULU_CLIENT_SECRET = Deno.env.get('LULU_CLIENT_SECRET');
const SHOPIFY_API_BASE = Deno.env.get('SHOPIFY_API_BASE');
const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN');

interface JobRecord {
  id: string;
  job_type: string;
  order_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead';
  attempts: number;
  max_attempts: number;
  error_message?: string;
  job_data?: any;
  created_at: string;
  scheduled_at: string;
  processed_at?: string;
}

// Main job processor
async function processJobs(): Promise<Response> {
  try {
    console.log('Starting job processing cycle...');
    
    // Get pending jobs that are ready to be processed
    const { data: jobs, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10); // Process up to 10 jobs at a time

    if (error) {
      console.error('Error fetching jobs:', error);
      return new Response('Error fetching jobs', { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      console.log('No pending jobs found');
      return new Response('No jobs to process', { status: 200 });
    }

    console.log(`Found ${jobs.length} jobs to process`);

    // Process each job
    const results = await Promise.allSettled(
      jobs.map(job => processJob(job as JobRecord))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Job processing complete: ${successful} successful, ${failed} failed`);

    return new Response(`Processed ${jobs.length} jobs: ${successful} successful, ${failed} failed`, {
      status: 200
    });
  } catch (error) {
    console.error('Error in job processor:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Process individual job
async function processJob(job: JobRecord): Promise<void> {
  console.log(`Processing job ${job.id}: ${job.job_type} for order ${job.order_id}`);

  // Mark job as processing
  await updateJobStatus(job.id, 'processing');

  try {
    switch (job.job_type) {
      case 'process_new_order':
        await processNewOrder(job);
        break;
      case 'create_print_job':
        await createPrintJob(job);
        break;
      case 'process_cancellation':
        await processCancellation(job);
        break;
      case 'send_status_notification':
        await sendStatusNotification(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }

    // Mark job as completed
    await updateJobStatus(job.id, 'completed');
    console.log(`Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    await handleJobError(job, error.message);
  }
}

// Job handlers
async function processNewOrder(job: JobRecord): Promise<void> {
  console.log(`Processing new order: ${job.order_id}`);
  
  // Get order details
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shopify_order_id', job.order_id)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${job.order_id}`);
  }

  // Validate order data
  if (!order.customer_email) {
    throw new Error('Order missing customer email');
  }

  // Update order status to processing
  await supabase
    .from('orders')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString()
    })
    .eq('id', order.id);

  console.log(`Order ${job.order_id} marked as processing`);
}

async function createPrintJob(job: JobRecord): Promise<void> {
  console.log(`Creating print job for order: ${job.order_id}`);
  
  // Get order details with book information
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      books (
        id,
        title,
        pages,
        art_style_code,
        characters
      )
    `)
    .eq('shopify_order_id', job.order_id)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${job.order_id}`);
  }

  // Extract book information from order
  const bookData = order.books?.[0];
  if (!bookData) {
    throw new Error('No book data found for order');
  }

  // Create print job with Lulu Direct
  const printJobData = {
    contact_email: order.customer_email,
    external_id: order.order_number,
    line_items: [{
      external_id: `book-${bookData.id}`,
      printable_normalization: {
        pod_package_id: determinePODPackage(bookData),
        cover: {
          source_url: bookData.pages?.find(p => p.type === 'cover')?.imageUrl
        },
        interior: {
          source_url: generateInteriorPDF(bookData)
        }
      },
      quantity: 1
    }],
    shipping_address: order.order_data?.shipping_address
  };

  // Call Lulu API using client key for authentication
  const response = await fetch(`${LULU_API_BASE}/print-jobs/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LULU_CLIENT_KEY || LULU_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(printJobData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lulu API error: ${response.status} ${errorText}`);
  }

  const luluResponse = await response.json();
  
  // Save print job record
  await supabase
    .from('print_jobs')
    .insert({
      order_id: order.id,
      lulu_order_id: luluResponse.id,
      status: 'created',
      print_job_data: luluResponse,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  console.log(`Print job created for order ${job.order_id}: ${luluResponse.id}`);
}

async function processCancellation(job: JobRecord): Promise<void> {
  console.log(`Processing cancellation for order: ${job.order_id}`);
  
  // Get order and associated print job
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      print_jobs (*)
    `)
    .eq('shopify_order_id', job.order_id)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${job.order_id}`);
  }

  // Cancel print job if it exists
  if (order.print_jobs?.[0]?.lulu_order_id) {
    const luluOrderId = order.print_jobs[0].lulu_order_id;
    
    try {
      const response = await fetch(`${LULU_API_BASE}/print-jobs/${luluOrderId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${LULU_CLIENT_KEY || LULU_API_KEY}`
        }
      });

      if (response.ok) {
        console.log(`Cancelled Lulu print job: ${luluOrderId}`);
      } else {
        console.warn(`Failed to cancel Lulu print job: ${response.status}`);
      }
    } catch (error) {
      console.warn('Error cancelling Lulu print job:', error);
    }
  }

  // Update print job status
  if (order.print_jobs?.[0]) {
    await supabase
      .from('print_jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.print_jobs[0].id);
  }

  console.log(`Cancellation processed for order ${job.order_id}`);
}

async function sendStatusNotification(job: JobRecord): Promise<void> {
  console.log(`Sending status notification for order: ${job.order_id}`);
  
  // Get order details
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', job.order_id)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${job.order_id}`);
  }

  // Queue email notification (this would integrate with the email service)
  await supabase
    .from('job_queue')
    .insert({
      job_type: 'send_email',
      order_id: job.order_id,
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
      job_data: {
        email_type: 'status_update',
        recipient: order.customer_email,
        order_status: order.status,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url
      },
      created_at: new Date().toISOString(),
      scheduled_at: new Date().toISOString()
    });

  console.log(`Status notification queued for order ${job.order_id}`);
}

// Helper functions
function determinePODPackage(bookData: any): string {
  // Determine the appropriate POD package based on book specifications
  const pageCount = bookData.pages?.length || 24;
  const hasColor = bookData.pages?.some((p: any) => p.imageUrl) || false;
  
  if (pageCount <= 24) {
    return hasColor ? 'color-24-page-book' : 'bw-24-page-book';
  } else if (pageCount <= 48) {
    return hasColor ? 'color-48-page-book' : 'bw-48-page-book';
  } else {
    return hasColor ? 'color-standard-book' : 'bw-standard-book';
  }
}

function generateInteriorPDF(bookData: any): string {
  // This would generate a PDF from the book pages
  // For now, return a placeholder URL
  return `https://your-domain.com/api/generate-pdf/${bookData.id}`;
}

// Job management functions
async function updateJobStatus(
  jobId: string, 
  status: JobRecord['status'], 
  errorMessage?: string
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'completed' || status === 'failed') {
    updateData.processed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('job_queue')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job status:', error);
  }
}

async function handleJobError(job: JobRecord, errorMessage: string): Promise<void> {
  const newAttempts = job.attempts + 1;
  
  if (newAttempts >= job.max_attempts) {
    // Move to dead letter queue
    await updateJobStatus(job.id, 'dead', errorMessage);
    console.log(`Job ${job.id} moved to dead letter queue after ${newAttempts} attempts`);
  } else {
    // Schedule retry with exponential backoff
    const backoffMinutes = Math.pow(2, newAttempts) * 5; // 5, 10, 20 minutes
    const scheduledAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();
    
    await supabase
      .from('job_queue')
      .update({
        status: 'pending',
        attempts: newAttempts,
        error_message: errorMessage,
        scheduled_at: scheduledAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    console.log(`Job ${job.id} scheduled for retry in ${backoffMinutes} minutes (attempt ${newAttempts})`);
  }
}

// Health check endpoint
async function healthCheck(): Promise<Response> {
  try {
    // Test database connection
    const { error } = await supabase
      .from('job_queue')
      .select('count')
      .limit(1);

    if (error) {
      return new Response('Database connection failed', { status: 503 });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    return new Response('Health check failed', { status: 503 });
  }
}

// Main handler
serve(async (req) => {
  const { pathname } = new URL(req.url);

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

  // Route requests
  if (pathname === '/process' && req.method === 'POST') {
    const response = await processJobs();
    return new Response(response.body, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } else if (pathname === '/health' && req.method === 'GET') {
    const response = await healthCheck();
    return new Response(response.body, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  } else {
    return new Response('Not Found', {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
}); 