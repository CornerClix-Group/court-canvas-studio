DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'payments'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%payment_method%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped existing payment_method check constraint: %', constraint_name;
  END IF;
END $$;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN (
    'cash',
    'check',
    'card',
    'ach',
    'us_bank_account',
    'klarna',
    'cashapp',
    'amazon_pay',
    'link',
    'affirm',
    'other'
  ));