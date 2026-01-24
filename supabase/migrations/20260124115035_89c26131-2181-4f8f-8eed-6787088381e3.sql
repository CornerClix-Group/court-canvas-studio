-- Add Stripe tracking columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS convenience_fee_amount NUMERIC DEFAULT 0;

-- Add payment link columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_link_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_link_created_at TIMESTAMPTZ;

-- Create index on payment_link_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_invoices_payment_link_token ON public.invoices(payment_link_token);