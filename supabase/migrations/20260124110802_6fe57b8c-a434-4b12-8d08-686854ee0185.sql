-- Create storage bucket for estimate attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('estimate-attachments', 'estimate-attachments', false);

-- Create estimate_attachments table
CREATE TABLE public.estimate_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on estimate_attachments
ALTER TABLE public.estimate_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for estimate_attachments (match estimate access patterns)
CREATE POLICY "Admin/staff can view estimate attachments"
  ON public.estimate_attachments
  FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage estimate attachments"
  ON public.estimate_attachments
  FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_estimate_attachments_updated_at
  BEFORE UPDATE ON public.estimate_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for estimate-attachments bucket
CREATE POLICY "Admin/staff can view estimate attachment files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'estimate-attachments' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can upload estimate attachment files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'estimate-attachments' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can update estimate attachment files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'estimate-attachments' AND is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can delete estimate attachment files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'estimate-attachments' AND is_admin_or_staff(auth.uid()));