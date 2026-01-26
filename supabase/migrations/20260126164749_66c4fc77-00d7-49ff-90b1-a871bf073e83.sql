-- Add RLS policies for chat_rate_limits table
-- This table is used by edge functions to rate limit public chat requests

-- Allow edge functions (service role) to manage rate limits
-- Public users don't need direct access - the edge function handles this with service role

CREATE POLICY "Service role can manage rate limits"
ON public.chat_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow public insert for rate limit tracking (edge function uses anon key for initial request)
CREATE POLICY "Allow public insert for rate limiting"
ON public.chat_rate_limits
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow public select to check rate limits
CREATE POLICY "Allow public select for rate limit checks"
ON public.chat_rate_limits
FOR SELECT
TO anon
USING (true);