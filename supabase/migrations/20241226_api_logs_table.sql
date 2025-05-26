-- API Logs Table for Secure Proxy Monitoring
-- This migration adds a table to track all API calls made through the secure proxy functions

-- Create API logs table
CREATE TABLE public.api_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('shopify', 'lulu')),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_api_logs_user_id ON public.api_logs(user_id);
CREATE INDEX idx_api_logs_service ON public.api_logs(service);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX idx_api_logs_success ON public.api_logs(success);
CREATE INDEX idx_api_logs_user_service ON public.api_logs(user_id, service);

-- Row Level Security (RLS) policies
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API logs
CREATE POLICY "Users can view their own API logs" ON public.api_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all API logs
CREATE POLICY "Service role can manage API logs" ON public.api_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up old API logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API usage statistics for a user
CREATE OR REPLACE FUNCTION get_user_api_stats(
  target_user_id UUID DEFAULT auth.uid(),
  hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  service TEXT,
  total_calls INTEGER,
  successful_calls INTEGER,
  failed_calls INTEGER,
  success_rate NUMERIC,
  avg_response_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.service,
    COUNT(*)::INTEGER as total_calls,
    COUNT(*) FILTER (WHERE al.success = true)::INTEGER as successful_calls,
    COUNT(*) FILTER (WHERE al.success = false)::INTEGER as failed_calls,
    ROUND(
      (COUNT(*) FILTER (WHERE al.success = true)::NUMERIC / COUNT(*)) * 100, 
      2
    ) as success_rate,
    ROUND(AVG(al.response_time_ms), 2) as avg_response_time
  FROM public.api_logs al
  WHERE 
    al.user_id = target_user_id
    AND al.created_at > NOW() - (hours_back || ' hours')::INTERVAL
  GROUP BY al.service
  ORDER BY al.service;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system-wide API health statistics (admin only)
CREATE OR REPLACE FUNCTION get_system_api_health(
  hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  service TEXT,
  total_calls INTEGER,
  unique_users INTEGER,
  success_rate NUMERIC,
  avg_response_time NUMERIC,
  error_rate NUMERIC
) AS $$
BEGIN
  -- Only allow service role to access system-wide stats
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    al.service,
    COUNT(*)::INTEGER as total_calls,
    COUNT(DISTINCT al.user_id)::INTEGER as unique_users,
    ROUND(
      (COUNT(*) FILTER (WHERE al.success = true)::NUMERIC / COUNT(*)) * 100, 
      2
    ) as success_rate,
    ROUND(AVG(al.response_time_ms), 2) as avg_response_time,
    ROUND(
      (COUNT(*) FILTER (WHERE al.success = false)::NUMERIC / COUNT(*)) * 100, 
      2
    ) as error_rate
  FROM public.api_logs al
  WHERE al.created_at > NOW() - (hours_back || ' hours')::INTERVAL
  GROUP BY al.service
  ORDER BY al.service;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.api_logs TO authenticated;
GRANT ALL ON public.api_logs TO service_role;
GRANT EXECUTE ON FUNCTION get_user_api_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_api_health TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_api_logs TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.api_logs IS 'Tracks all API calls made through secure proxy functions for monitoring and rate limiting';
COMMENT ON FUNCTION get_user_api_stats IS 'Returns API usage statistics for a specific user';
COMMENT ON FUNCTION get_system_api_health IS 'Returns system-wide API health statistics (admin only)';
COMMENT ON FUNCTION cleanup_old_api_logs IS 'Removes API logs older than 30 days'; 