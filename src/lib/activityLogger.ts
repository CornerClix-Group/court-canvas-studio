import { supabase } from "@/integrations/supabase/client";

export type ActivityAction = 
  | "login" 
  | "logout"
  | "create" 
  | "update" 
  | "delete" 
  | "view"
  | "send_email"
  | "download"
  | "record_payment"
  | "invite_member"
  | "reset_password"
  | "change_password"
  | "status_changed"
  | "converted_to_project"
  | "converted_to_invoice";

export type EntityType = 
  | "customer" 
  | "lead" 
  | "estimate" 
  | "invoice" 
  | "payment" 
  | "project"
  | "team_member"
  | "receipt"
  | "session";

interface LogActivityParams {
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
}

export async function logActivity({
  action,
  entityType,
  entityId,
  entityName,
  details,
}: LogActivityParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("Cannot log activity: No authenticated user");
      return;
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("activity_logs").insert([{
      user_id: user.id,
      user_email: user.email || "unknown",
      user_name: profile?.full_name || user.user_metadata?.full_name || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_name: entityName || null,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
    }]);

    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (err) {
    console.error("Error logging activity:", err);
  }
}

// Convenience functions for common actions
export const ActivityLogger = {
  login: () => logActivity({ action: "login", entityType: "session" }),
  logout: () => logActivity({ action: "logout", entityType: "session" }),
  
  createCustomer: (id: string, name: string) => 
    logActivity({ action: "create", entityType: "customer", entityId: id, entityName: name }),
  updateCustomer: (id: string, name: string) => 
    logActivity({ action: "update", entityType: "customer", entityId: id, entityName: name }),
  deleteCustomer: (id: string, name: string) => 
    logActivity({ action: "delete", entityType: "customer", entityId: id, entityName: name }),
  
  createLead: (id: string, name: string) => 
    logActivity({ action: "create", entityType: "lead", entityId: id, entityName: name }),
  updateLead: (id: string, name: string) => 
    logActivity({ action: "update", entityType: "lead", entityId: id, entityName: name }),
  deleteLead: (id: string, name: string) => 
    logActivity({ action: "delete", entityType: "lead", entityId: id, entityName: name }),
  
  createEstimate: (id: string, number: string) => 
    logActivity({ action: "create", entityType: "estimate", entityId: id, entityName: number }),
  updateEstimate: (id: string, number: string) => 
    logActivity({ action: "update", entityType: "estimate", entityId: id, entityName: number }),
  sendEstimate: (id: string, number: string, email: string) => 
    logActivity({ action: "send_email", entityType: "estimate", entityId: id, entityName: number, details: { recipient: email } }),
  
  createInvoice: (id: string, number: string) => 
    logActivity({ action: "create", entityType: "invoice", entityId: id, entityName: number }),
  updateInvoice: (id: string, number: string) => 
    logActivity({ action: "update", entityType: "invoice", entityId: id, entityName: number }),
  sendInvoice: (id: string, number: string, email: string) => 
    logActivity({ action: "send_email", entityType: "invoice", entityId: id, entityName: number, details: { recipient: email } }),
  
  recordPayment: (id: string, amount: number, invoiceNumber?: string) => 
    logActivity({ 
      action: "record_payment", 
      entityType: "payment", 
      entityId: id, 
      entityName: invoiceNumber || "Standalone Payment",
      details: { amount } 
    }),
  sendReceipt: (id: string, email: string) => 
    logActivity({ action: "send_email", entityType: "receipt", entityId: id, details: { recipient: email } }),
  downloadReceipt: (id: string) => 
    logActivity({ action: "download", entityType: "receipt", entityId: id }),
  
  createProject: (id: string, name: string) => 
    logActivity({ action: "create", entityType: "project", entityId: id, entityName: name }),
  updateProject: (id: string, name: string) => 
    logActivity({ action: "update", entityType: "project", entityId: id, entityName: name }),
  
  inviteTeamMember: (email: string) => 
    logActivity({ action: "invite_member", entityType: "team_member", entityName: email }),
  resetTeamPassword: (email: string) => 
    logActivity({ action: "reset_password", entityType: "team_member", entityName: email }),
  changeOwnPassword: () => 
    logActivity({ action: "change_password", entityType: "session" }),
};
