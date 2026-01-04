-- Create function to update invitation status on first login
CREATE OR REPLACE FUNCTION public.update_invitation_on_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if this is the first time last_sign_in_at is being set
  IF OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL THEN
    UPDATE public.team_invitations
    SET 
      status = 'logged_in',
      first_login_at = NEW.last_sign_in_at
    WHERE user_id = NEW.id
      AND status = 'pending_login';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (using Supabase's recommended approach)
-- Note: We'll handle this via the application layer instead since we can't attach triggers to auth.users directly