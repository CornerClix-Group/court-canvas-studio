-- One-time cleanup: Delete test data
-- Delete email log first (references payment)
DELETE FROM public.email_logs WHERE id = 'f8b0d774-2483-42aa-8abc-f8fcc6b00b7f';

-- Delete payment (references customer)
DELETE FROM public.payments WHERE id = '46f9e99a-4f94-4947-b475-ed2e3ad586d8';

-- Delete customer
DELETE FROM public.customers WHERE id = '060e7ee0-5c03-4dd2-aa40-cbbae1be11b4';