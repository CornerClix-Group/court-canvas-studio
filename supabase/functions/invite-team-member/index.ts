import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the caller is owner or admin
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !caller) {
      throw new Error("Unauthorized");
    }

    // Check if caller has owner or admin role
    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isOwnerOrAdmin = (callerRoles || []).some(
      (r) => r.role === "owner" || r.role === "admin"
    );

    if (!isOwnerOrAdmin) {
      throw new Error("Only owners and admins can invite team members");
    }

    const { email, fullName, roles, temporaryPassword } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Generate a temporary password if not provided
    const password = temporaryPassword || generateSecurePassword();

    console.log(`Creating user account for: ${email}`);

    // Create the user using Admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || email,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error(createError.message);
    }

    console.log(`User created: ${newUser.user.id}`);

    // Assign roles if provided
    if (roles && roles.length > 0 && newUser.user) {
      const roleInserts = roles.map((role: string) => ({
        user_id: newUser.user.id,
        role,
      }));

      const { error: rolesError } = await supabase
        .from("user_roles")
        .insert(roleInserts);

      if (rolesError) {
        console.error("Error assigning roles:", rolesError);
        // Don't throw - user was created successfully
      } else {
        console.log(`Assigned roles: ${roles.join(", ")}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        email,
        temporaryPassword: password,
        message: "Team member invited successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error inviting team member:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  const length = 16;
  let password = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  return password;
}
