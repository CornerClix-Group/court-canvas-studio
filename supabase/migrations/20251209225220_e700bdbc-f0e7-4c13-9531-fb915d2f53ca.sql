-- Add receipt_sent_at column to track when receipt emails are sent
ALTER TABLE public.payments 
ADD COLUMN receipt_sent_at timestamp with time zone DEFAULT NULL;