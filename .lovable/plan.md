

# Plan: Contractor/Subcontractor Portal

## Overview

Create a dedicated portal for contractors (crew leads and project managers) to view their assigned jobs, update milestone status, and upload progress photos - all from their mobile devices in the field.

---

## Current State

| Component | Status |
|-----------|--------|
| `crew_lead` role | Exists in database |
| `project_manager` role | Exists in database |
| `assigned_to` column on projects | Exists but not used in UI |
| RLS policy for assigned users | Exists: "Assigned users can view their projects" |
| Milestone/Photo RLS for contractors | Missing - only admin/staff can access |

---

## What We're Building

### 1. Contractor Portal Page (`/admin/portal`)

A mobile-friendly view showing:
- List of assigned projects (cards with key info)
- Quick status indicators (on track, behind schedule)
- Tap to view project details

### 2. Contractor Project Detail View

Limited view compared to admin, showing:
- Project name, location, schedule
- Milestone checklist (can toggle complete)
- Photo upload section
- Notes field for daily updates
- NO access to: contract values, customer contact, financial data

### 3. Assignment UI in Admin

Add to existing ProjectDetail page:
- Team member selector to assign contractor
- Filter to show only crew_lead/project_manager users

---

## Database Changes

### New RLS Policies

**project_milestones table:**
```sql
-- Assigned users can view milestones for their projects
CREATE POLICY "Assigned users can view project milestones"
ON project_milestones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_milestones.project_id 
    AND projects.assigned_to = auth.uid()
  )
);

-- Assigned users can update milestone status
CREATE POLICY "Assigned users can update project milestones"
ON project_milestones FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_milestones.project_id 
    AND projects.assigned_to = auth.uid()
  )
);
```

**project_photos table:**
```sql
-- Assigned users can view photos for their projects
CREATE POLICY "Assigned users can view project photos"
ON project_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.assigned_to = auth.uid()
  )
);

-- Assigned users can upload photos to their projects
CREATE POLICY "Assigned users can insert project photos"
ON project_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.assigned_to = auth.uid()
  )
);
```

---

## UI Components

### New Files

| File | Purpose |
|------|---------|
| `src/pages/admin/ContractorPortal.tsx` | Main portal page - list of assigned jobs |
| `src/pages/admin/ContractorJobDetail.tsx` | Limited job view for contractors |
| `src/components/admin/AssignContractorSelect.tsx` | Dropdown to assign team member |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add routes for `/admin/portal` and `/admin/portal/:id` |
| `src/components/admin/AdminLayout.tsx` | Add "My Jobs" nav item for crew_lead/project_manager roles |
| `src/pages/admin/ProjectDetail.tsx` | Add contractor assignment dropdown |
| `src/hooks/useUserRole.ts` | Add `isContractor` helper |

---

## Navigation Logic

The sidebar will show different items based on role:

```
┌─────────────────────────────────────────────────────────────┐
│ Role                  │ Navigation Items                    │
├───────────────────────┼─────────────────────────────────────┤
│ owner, admin, staff   │ Full navigation (all items)         │
│ crew_lead             │ My Jobs only                        │
│ project_manager       │ My Jobs + Projects (read-only)      │
│ sales                 │ Leads, Customers, Estimates         │
│ accounting            │ Invoices, Payments                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Contractor Portal UI

### Job List View (Mobile-First)

```
┌─────────────────────────────────────────┐
│  🔧 My Assigned Jobs                    │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Johnson Residence - Pickleball     │ │
│ │ 📍 Augusta, GA                      │ │
│ │ 📅 Start: Jan 28 | Due: Feb 15     │ │
│ │ ━━━━━━━━━━━━━━━━━━░░░░ 67%         │ │
│ │ 🟡 In Progress                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ City Park Tennis Courts            │ │
│ │ 📍 Martinez, GA                     │ │
│ │ 📅 Start: Feb 1 | Due: Feb 28      │ │
│ │ ░░░░░░░░░░░░░░░░░░░░ 0%            │ │
│ │ 🔵 Scheduled                        │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Job Detail View (Mobile-First)

```
┌─────────────────────────────────────────┐
│ ← Back                                  │
├─────────────────────────────────────────┤
│ Johnson Residence - Pickleball          │
│ 📍 123 Oak Street, Augusta, GA 30909    │
│                                         │
│ ┌─ Schedule ─────────────────────────┐  │
│ │ Start: Jan 28, 2026                │  │
│ │ Target: Feb 15, 2026               │  │
│ └────────────────────────────────────┘  │
│                                         │
│ ┌─ Milestones ───────────────────────┐  │
│ │ ✅ Site Preparation                │  │
│ │ ✅ Base Work                       │  │
│ │ ✅ Concrete Pour                   │  │
│ │ ✅ Curing Period                   │  │
│ │ ⬜ Surface Coating          [TAP] │  │
│ │ ⬜ Color Coating                   │  │
│ │ ⬜ Line Striping                   │  │
│ │ ⬜ Net Posts & Hardware            │  │
│ │ ⬜ Final Walkthrough               │  │
│ └────────────────────────────────────┘  │
│                                         │
│ ┌─ Progress Photos ──────────────────┐  │
│ │ [📷 Add Photo]                     │  │
│ │                                    │  │
│ │ ┌────┐ ┌────┐ ┌────┐              │  │
│ │ │    │ │    │ │    │              │  │
│ │ └────┘ └────┘ └────┘              │  │
│ └────────────────────────────────────┘  │
│                                         │
│ ┌─ Notes ────────────────────────────┐  │
│ │ Add update...                      │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Technical Details

### useUserRole Hook Update

```typescript
// Add to existing hook
const isContractor = hasRole("crew_lead") || hasRole("project_manager");
const isCrewLead = hasRole("crew_lead");
```

### Navigation Filtering

The AdminLayout will conditionally render nav items:

```typescript
const getNavItems = () => {
  if (isOwner || isAdmin || hasRole("staff")) {
    return fullNavItems;
  }
  
  const items = [];
  
  if (hasRole("crew_lead") || hasRole("project_manager")) {
    items.push({ href: "/admin/portal", label: "My Jobs", icon: HardHat });
  }
  
  if (hasRole("project_manager")) {
    items.push({ href: "/admin/projects", label: "All Projects", icon: FolderKanban });
  }
  
  if (hasRole("sales")) {
    items.push(...salesNavItems);
  }
  
  if (hasRole("accounting")) {
    items.push(...accountingNavItems);
  }
  
  return items;
};
```

---

## Security Considerations

1. **RLS Policies**: Contractors can only see/update their assigned projects
2. **No Financial Data**: Contract values hidden from contractor views
3. **No Customer Contact**: Customer details not shown to contractors
4. **Photo Upload**: Contractors can only upload to their projects
5. **Milestone Updates**: Only status changes allowed, no deletion

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/pages/admin/ContractorPortal.tsx` | Job list for contractors |
| Create | `src/pages/admin/ContractorJobDetail.tsx` | Job detail for contractors |
| Create | `src/components/admin/AssignContractorSelect.tsx` | Team member assignment UI |
| Create | `supabase/migrations/xxx_contractor_rls.sql` | RLS policies for contractors |
| Modify | `src/App.tsx` | Add new routes |
| Modify | `src/components/admin/AdminLayout.tsx` | Role-based navigation |
| Modify | `src/pages/admin/ProjectDetail.tsx` | Add assignment dropdown |
| Modify | `src/hooks/useUserRole.ts` | Add `isContractor` helper |

