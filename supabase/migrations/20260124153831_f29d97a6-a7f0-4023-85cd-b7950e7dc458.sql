-- Add display_format column to estimates table
ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS display_format TEXT DEFAULT 'lump_sum';

-- Create estimate_scope_bullets table for marketing bullet points
CREATE TABLE IF NOT EXISTS estimate_scope_bullets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  bullet_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE estimate_scope_bullets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for estimate_scope_bullets
CREATE POLICY "Admin/staff can view scope bullets"
  ON estimate_scope_bullets
  FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage scope bullets"
  ON estimate_scope_bullets
  FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_estimate_scope_bullets_estimate_id 
  ON estimate_scope_bullets(estimate_id);