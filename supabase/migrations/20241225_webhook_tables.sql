-- Webhook Integration Tables
-- This migration adds tables for webhook management and job processing

-- Webhook configurations table
CREATE TABLE public.webhook_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service TEXT NOT NULL UNIQUE CHECK (service IN ('shopify', 'lulu')),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs table
CREATE TABLE public.webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('shopify', 'lulu')),
  event_type TEXT NOT NULL,
  reference_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job queue table for order processing
CREATE TABLE public.job_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_type TEXT NOT NULL,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  job_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add additional columns to existing orders table for webhook integration
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shopify_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS financial_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_data JSONB;

-- Add additional columns to existing print_jobs table
ALTER TABLE public.print_jobs ADD COLUMN IF NOT EXISTS lulu_order_id TEXT;
ALTER TABLE public.print_jobs ADD COLUMN IF NOT EXISTS status_data JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source_created ON public.webhook_logs(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status_created ON public.webhook_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_queue_status_scheduled ON public.job_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_job_type ON public.job_queue(job_type);
CREATE INDEX IF NOT EXISTS idx_orders_shopify_order_id ON public.orders(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_print_jobs_lulu_order_id ON public.print_jobs(lulu_order_id);

-- Row Level Security (RLS) policies

-- Webhook configs - only service role can access
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage webhook configs" ON public.webhook_configs
  FOR ALL USING (auth.role() = 'service_role');

-- Webhook logs - only service role can write, authenticated users can read their related logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage webhook logs" ON public.webhook_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view webhook logs for their orders" ON public.webhook_logs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.order_number = webhook_logs.reference_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Job queue - only service role can access
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage job queue" ON public.job_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for webhook processing

-- Function to update job queue timestamps
CREATE OR REPLACE FUNCTION update_job_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for job queue updated_at
CREATE TRIGGER trigger_job_queue_updated_at
  BEFORE UPDATE ON public.job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_job_queue_updated_at();

-- Function to update webhook config timestamps
CREATE OR REPLACE FUNCTION update_webhook_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for webhook config updated_at
CREATE TRIGGER trigger_webhook_config_updated_at
  BEFORE UPDATE ON public.webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_config_updated_at();

-- Function to clean up old webhook logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old completed jobs (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.job_queue 
  WHERE status IN ('completed', 'dead') 
  AND processed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get webhook health statistics
CREATE OR REPLACE FUNCTION get_webhook_health_stats(
  source_filter TEXT DEFAULT NULL,
  hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  source TEXT,
  total_events INTEGER,
  success_events INTEGER,
  error_events INTEGER,
  success_rate NUMERIC,
  last_event_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wl.source,
    COUNT(*)::INTEGER as total_events,
    COUNT(*) FILTER (WHERE wl.status = 'success')::INTEGER as success_events,
    COUNT(*) FILTER (WHERE wl.status = 'error')::INTEGER as error_events,
    ROUND(
      (COUNT(*) FILTER (WHERE wl.status = 'success')::NUMERIC / COUNT(*)) * 100, 
      2
    ) as success_rate,
    MAX(wl.created_at) as last_event_at
  FROM public.webhook_logs wl
  WHERE 
    wl.created_at > NOW() - (hours_back || ' hours')::INTERVAL
    AND (source_filter IS NULL OR wl.source = source_filter)
  GROUP BY wl.source
  ORDER BY wl.source;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job queue statistics
CREATE OR REPLACE FUNCTION get_job_queue_stats()
RETURNS TABLE (
  job_type TEXT,
  pending_count INTEGER,
  processing_count INTEGER,
  completed_count INTEGER,
  failed_count INTEGER,
  dead_count INTEGER,
  avg_processing_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jq.job_type,
    COUNT(*) FILTER (WHERE jq.status = 'pending')::INTEGER as pending_count,
    COUNT(*) FILTER (WHERE jq.status = 'processing')::INTEGER as processing_count,
    COUNT(*) FILTER (WHERE jq.status = 'completed')::INTEGER as completed_count,
    COUNT(*) FILTER (WHERE jq.status = 'failed')::INTEGER as failed_count,
    COUNT(*) FILTER (WHERE jq.status = 'dead')::INTEGER as dead_count,
    AVG(jq.processed_at - jq.created_at) FILTER (WHERE jq.status = 'completed') as avg_processing_time
  FROM public.job_queue jq
  WHERE jq.created_at > NOW() - INTERVAL '24 hours'
  GROUP BY jq.job_type
  ORDER BY jq.job_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.webhook_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_webhook_health_stats TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_job_queue_stats TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_webhook_logs TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_jobs TO service_role; 