
-- Drop the overly permissive public update policies
DROP POLICY IF EXISTS "Public can update court approvals" ON public.project_courts;
DROP POLICY IF EXISTS "Public can update color approval fields" ON public.projects;

-- Security definer function: approve a single court by project_number + court id + initials
CREATE OR REPLACE FUNCTION public.approve_court_by_number(
  _project_number text,
  _court_id uuid,
  _initials text,
  _approved boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_id uuid;
  _result jsonb;
BEGIN
  IF _project_number IS NULL OR length(trim(_project_number)) = 0 THEN
    RAISE EXCEPTION 'Project number required';
  END IF;

  SELECT id INTO _project_id
  FROM public.projects
  WHERE project_number = _project_number;

  IF _project_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Verify court belongs to this project
  IF NOT EXISTS (
    SELECT 1 FROM public.project_courts
    WHERE id = _court_id AND project_id = _project_id
  ) THEN
    RAISE EXCEPTION 'Court not found in project';
  END IF;

  IF _approved THEN
    IF _initials IS NULL OR length(trim(_initials)) < 2 THEN
      RAISE EXCEPTION 'Initials required (2-4 chars)';
    END IF;

    UPDATE public.project_courts
    SET approved = true,
        approved_initials = upper(trim(_initials)),
        approved_at = now(),
        updated_at = now()
    WHERE id = _court_id;
  ELSE
    UPDATE public.project_courts
    SET approved = false,
        approved_initials = NULL,
        approved_at = NULL,
        updated_at = now()
    WHERE id = _court_id;
  END IF;

  -- Update project rollup status
  UPDATE public.projects
  SET color_approval_status = CASE
    WHEN (SELECT COUNT(*) FROM public.project_courts WHERE project_id = _project_id AND approved = false) = 0
      THEN 'partial'  -- "all approved" only flipped on finalize_project_approval
    WHEN (SELECT COUNT(*) FROM public.project_courts WHERE project_id = _project_id AND approved = true) > 0
      THEN 'partial'
    ELSE 'pending'
  END,
  updated_at = now()
  WHERE id = _project_id
    AND color_approval_status <> 'approved';  -- never demote a fully-approved project

  SELECT jsonb_build_object(
    'success', true,
    'project_id', _project_id,
    'court_id', _court_id
  ) INTO _result;

  RETURN _result;
END;
$$;

-- Security definer function: change colors on an unapproved court (auto-save during design)
CREATE OR REPLACE FUNCTION public.update_court_colors_by_number(
  _project_number text,
  _court_id uuid,
  _inner_color text,
  _outer_color text,
  _line_color text,
  _court_label text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_id uuid;
BEGIN
  SELECT id INTO _project_id
  FROM public.projects
  WHERE project_number = _project_number;

  IF _project_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Block edits on already-approved courts
  IF EXISTS (
    SELECT 1 FROM public.project_courts
    WHERE id = _court_id AND project_id = _project_id AND approved = true
  ) THEN
    RAISE EXCEPTION 'Court already approved; unapprove first to edit';
  END IF;

  UPDATE public.project_courts
  SET inner_color = COALESCE(_inner_color, inner_color),
      outer_color = COALESCE(_outer_color, outer_color),
      line_color = COALESCE(_line_color, line_color),
      court_label = COALESCE(NULLIF(trim(_court_label), ''), court_label),
      updated_at = now()
  WHERE id = _court_id AND project_id = _project_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Security definer function: finalize project approval (only when all courts approved)
CREATE OR REPLACE FUNCTION public.finalize_project_approval(
  _project_number text,
  _approval_ip text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_id uuid;
  _unapproved_count integer;
BEGIN
  SELECT id INTO _project_id
  FROM public.projects
  WHERE project_number = _project_number;

  IF _project_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  SELECT COUNT(*) INTO _unapproved_count
  FROM public.project_courts
  WHERE project_id = _project_id AND approved = false;

  IF _unapproved_count > 0 THEN
    RAISE EXCEPTION 'All courts must be approved before finalizing';
  END IF;

  UPDATE public.projects
  SET color_approval_status = 'approved',
      color_approved_at = now(),
      color_approval_ip = _approval_ip,
      updated_at = now()
  WHERE id = _project_id;

  RETURN jsonb_build_object('success', true, 'project_id', _project_id);
END;
$$;

-- Grant execute to anon and authenticated for the public flow
GRANT EXECUTE ON FUNCTION public.approve_court_by_number(text, uuid, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_court_colors_by_number(text, uuid, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_project_approval(text, text) TO anon, authenticated;
