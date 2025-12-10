-- Create table for persistent rate limiting
CREATE TABLE public.chat_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_chat_rate_limits_ip_created ON public.chat_rate_limits(ip_address, created_at);

-- Enable RLS (but allow service role full access)
ALTER TABLE public.chat_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only (used by edge function)
-- No policies needed for regular users - only service role accesses this table

-- Create a function to clean up old rate limit entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.chat_rate_limits
  WHERE created_at < now() - INTERVAL '5 minutes';
END;
$$;