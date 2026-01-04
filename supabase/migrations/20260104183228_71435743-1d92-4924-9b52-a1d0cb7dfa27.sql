-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read receipts" ON storage.objects;

-- Replace with admin/staff restricted policy
CREATE POLICY "Admin/staff can read receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin_or_staff(auth.uid()));