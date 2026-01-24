-- Create table for custom estimate items (free-form entries with flexible pricing modes)
CREATE TABLE public.estimate_custom_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  vendor_name TEXT, -- Optional: internal tracking of subcontractor
  vendor_cost DECIMAL(12,2), -- Cost from subcontractor (for Cost + Markup mode)
  markup_percent DECIMAL(5,2) DEFAULT 15, -- Markup percentage (for Cost + Markup mode)
  customer_price DECIMAL(12,2) NOT NULL, -- Final price shown to customer
  notes TEXT, -- Internal notes (not shown to customer)
  pricing_mode TEXT NOT NULL DEFAULT 'direct' CHECK (pricing_mode IN ('direct', 'markup')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.estimate_custom_items ENABLE ROW LEVEL SECURITY;

-- Create policies for admin/staff access
CREATE POLICY "Admin and staff can view custom items" 
ON public.estimate_custom_items 
FOR SELECT 
USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin and staff can create custom items" 
ON public.estimate_custom_items 
FOR INSERT 
WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin and staff can update custom items" 
ON public.estimate_custom_items 
FOR UPDATE 
USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin and staff can delete custom items" 
ON public.estimate_custom_items 
FOR DELETE 
USING (public.is_admin_or_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_estimate_custom_items_updated_at
BEFORE UPDATE ON public.estimate_custom_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_estimate_custom_items_estimate_id ON public.estimate_custom_items(estimate_id);