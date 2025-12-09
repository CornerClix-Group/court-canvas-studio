-- Make invoice_id nullable to allow standalone payments
ALTER TABLE public.payments 
ALTER COLUMN invoice_id DROP NOT NULL;

-- Add payment_type column to distinguish payment types
ALTER TABLE public.payments 
ADD COLUMN payment_type text NOT NULL DEFAULT 'invoice_payment';

-- Add description column for standalone payments
ALTER TABLE public.payments 
ADD COLUMN description text;

-- Add customer_id column for standalone payments (when not linked to invoice)
ALTER TABLE public.payments 
ADD COLUMN customer_id uuid REFERENCES public.customers(id);

-- Add a check constraint for valid payment types
ALTER TABLE public.payments 
ADD CONSTRAINT valid_payment_type 
CHECK (payment_type IN ('invoice_payment', 'deposit', 'prepayment', 'miscellaneous'));

-- Add comment for clarity
COMMENT ON COLUMN public.payments.payment_type IS 'Type of payment: invoice_payment, deposit, prepayment, or miscellaneous';