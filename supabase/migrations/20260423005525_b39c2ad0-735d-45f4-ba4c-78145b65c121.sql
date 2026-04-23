-- Allow anonymous SELECT on invoice rows that have a payment_link_token
DROP POLICY IF EXISTS "Public can view invoice via payment link" ON public.invoices;

CREATE POLICY "Public can view invoice via payment link"
  ON public.invoices
  FOR SELECT
  TO anon
  USING (payment_link_token IS NOT NULL);

-- Allow anonymous SELECT on customer rows that are referenced by an invoice with a payment_link_token
DROP POLICY IF EXISTS "Public can view customer via invoice payment link" ON public.customers;

CREATE POLICY "Public can view customer via invoice payment link"
  ON public.customers
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.customer_id = customers.id
        AND i.payment_link_token IS NOT NULL
    )
  );