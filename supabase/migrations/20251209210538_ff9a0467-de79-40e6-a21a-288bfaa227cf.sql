-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for invoice PDFs
CREATE POLICY "Admin/staff can upload invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' 
  AND is_admin_or_staff(auth.uid())
);

CREATE POLICY "Admin/staff can view invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices' 
  AND is_admin_or_staff(auth.uid())
);

CREATE POLICY "Admin/staff can update invoices"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'invoices' 
  AND is_admin_or_staff(auth.uid())
);

CREATE POLICY "Admin/staff can delete invoices"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'invoices' 
  AND is_admin_or_staff(auth.uid())
);