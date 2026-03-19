
-- Create bid_documents table
CREATE TABLE public.bid_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  extracted_data jsonb,
  document_text text,
  status text NOT NULL DEFAULT 'uploading',
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create bid_document_messages table
CREATE TABLE public.bid_document_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_document_id uuid NOT NULL REFERENCES public.bid_documents(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bid_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_document_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for bid_documents
CREATE POLICY "Admin/staff can manage bid documents" ON public.bid_documents FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can view bid documents" ON public.bid_documents FOR SELECT TO authenticated USING (is_admin_or_staff(auth.uid()));

-- RLS policies for bid_document_messages
CREATE POLICY "Admin/staff can manage bid messages" ON public.bid_document_messages FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can view bid messages" ON public.bid_document_messages FOR SELECT TO authenticated USING (is_admin_or_staff(auth.uid()));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('bid-documents', 'bid-documents', false);

-- Storage RLS
CREATE POLICY "Admin/staff can upload bid documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bid-documents' AND is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can read bid documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'bid-documents' AND is_admin_or_staff(auth.uid()));
CREATE POLICY "Admin/staff can delete bid documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bid-documents' AND is_admin_or_staff(auth.uid()));
