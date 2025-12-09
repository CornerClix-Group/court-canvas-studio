-- Add pdf_url column to invoices for storing generated PDF links
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pdf_url text;

-- Create bank_transactions table for Mercury sync
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mercury_id text NOT NULL UNIQUE,
  account_id text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL,
  counterparty_name text,
  counterparty_id text,
  description text,
  bank_description text,
  transaction_type text,
  posted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  matched_invoice_id uuid REFERENCES public.invoices(id),
  matched_payment_id uuid REFERENCES public.payments(id)
);

-- Enable RLS on bank_transactions
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bank_transactions
CREATE POLICY "Admin/staff can view bank transactions"
ON public.bank_transactions
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage bank transactions"
ON public.bank_transactions
FOR ALL
USING (is_admin_or_staff(auth.uid()));

-- Add index for faster matching
CREATE INDEX IF NOT EXISTS idx_bank_transactions_amount ON public.bank_transactions(amount);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_posted_at ON public.bank_transactions(posted_at DESC);