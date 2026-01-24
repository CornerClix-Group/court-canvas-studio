-- Schedule the expire-estimates edge function to run daily at 6 AM UTC
SELECT cron.schedule(
  'expire-estimates-daily',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://hhtmqsgntrazmtoaxvis.supabase.co/functions/v1/expire-estimates',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhodG1xc2dudHJhem10b2F4dmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODExMzksImV4cCI6MjA3Njc1NzEzOX0.XNW93VY9zXF6RpNameIwOMUQDTNNKsHTjWeI9zn5b1Y"}'::jsonb,
        body:='{}'::jsonb
    ) AS request_id;
  $$
);