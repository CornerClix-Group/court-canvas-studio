-- F2: Atomic, year-scoped invoice number generator (race-safe)

CREATE TABLE IF NOT EXISTS public.invoice_number_sequences (
  year INTEGER PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_number_sequences ENABLE ROW LEVEL SECURITY;
-- No policies — accessed only via SECURITY DEFINER function below

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM now())::INTEGER;
  next_seq INTEGER;
BEGIN
  INSERT INTO public.invoice_number_sequences (year, last_seq)
    VALUES (current_year, 1)
  ON CONFLICT (year)
    DO UPDATE SET last_seq = invoice_number_sequences.last_seq + 1,
                  updated_at = now()
  RETURNING last_seq INTO next_seq;

  RETURN 'INV-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO authenticated;

-- Seed current year's sequence from existing invoice count
INSERT INTO public.invoice_number_sequences (year, last_seq)
SELECT
  EXTRACT(YEAR FROM now())::INTEGER AS year,
  COALESCE(
    (SELECT COUNT(*) FROM public.invoices
     WHERE invoice_number LIKE 'INV-' || EXTRACT(YEAR FROM now())::TEXT || '-%'),
    0
  ) AS last_seq
ON CONFLICT (year) DO NOTHING;