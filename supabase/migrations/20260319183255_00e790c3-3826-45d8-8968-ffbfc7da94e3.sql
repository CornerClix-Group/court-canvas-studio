-- Increase file size limit on bid-documents bucket to 100MB
UPDATE storage.buckets 
SET file_size_limit = 104857600 
WHERE id = 'bid-documents';

-- Add project_id column to bid_documents
ALTER TABLE public.bid_documents 
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_bid_documents_project_id ON public.bid_documents(project_id);