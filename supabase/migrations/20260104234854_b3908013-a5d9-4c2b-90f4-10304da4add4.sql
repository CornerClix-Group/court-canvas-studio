-- Fix RLS policy: Allow owners to view all profiles (not just admins)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Owners and admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
  );

-- Create team_invitations table to track invitations
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  invited_by UUID NOT NULL,
  roles TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_login' CHECK (status IN ('pending_login', 'logged_in')),
  first_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_invitations
CREATE POLICY "Owners and admins can view invitations"
  ON public.team_invitations FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Owners and admins can manage invitations"
  ON public.team_invitations FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );