-- Create email_logs table to track email delivery status
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id TEXT UNIQUE,
  email_type TEXT NOT NULL,
  related_id UUID,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin/staff can view email logs"
ON public.email_logs
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage email logs"
ON public.email_logs
FOR ALL
USING (is_admin_or_staff(auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_email_logs_resend_id ON public.email_logs(resend_email_id);
CREATE INDEX idx_email_logs_related_id ON public.email_logs(related_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);