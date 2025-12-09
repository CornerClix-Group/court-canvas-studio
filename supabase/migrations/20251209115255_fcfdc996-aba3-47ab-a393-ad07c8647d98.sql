-- Phase 1A: Expand Role System - Add new roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'crew_lead';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'accounting';