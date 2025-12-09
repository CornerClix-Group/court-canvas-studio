import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface USTAApplication {
  id: string;
  project_id: string;
  tpa_number: string | null;
  facility_name: string | null;
  facility_director: string | null;
  facility_phone: string | null;
  facility_email: string | null;
  usta_national_amount: number;
  usta_section_amount: number;
  government_funding: number;
  foundation_funding: number;
  fundraising_amount: number;
  professional_fees: number;
  local_sponsors_amount: number;
  other_funding: number;
  other_funding_description: string | null;
  courts_36_lined: number;
  courts_36_permanent: number;
  courts_60_lined: number;
  courts_60_permanent: number;
  courts_78: number;
  description_of_improvements: string | null;
  total_renovation_costs: number;
  projected_completion_date: string | null;
  completion_percentage: number;
  consultant_name: string | null;
  consultant_email: string | null;
  project?: {
    project_name: string;
    site_address: string | null;
    site_city: string | null;
    site_state: string | null;
    site_zip: string | null;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generatePdfContent(app: USTAApplication): Uint8Array {
  const totalFunding =
    (app.usta_national_amount || 0) +
    (app.usta_section_amount || 0) +
    (app.government_funding || 0) +
    (app.foundation_funding || 0) +
    (app.fundraising_amount || 0) +
    (app.professional_fees || 0) +
    (app.local_sponsors_amount || 0) +
    (app.other_funding || 0);

  const address = [
    app.project?.site_address,
    app.project?.site_city,
    app.project?.site_state,
    app.project?.site_zip,
  ]
    .filter(Boolean)
    .join(", ");

  const textContent = `
USTA GRANT ACCOUNTABILITY FORM - CATEGORY 2
2025

================================================================================
TPA INFORMATION
================================================================================
TPA Number: ${app.tpa_number || "N/A"}

================================================================================
FACILITY INFORMATION
================================================================================
Facility Name: ${app.facility_name || "N/A"}
Address: ${address || "N/A"}
Facility Director: ${app.facility_director || "N/A"}
Phone: ${app.facility_phone || "N/A"}
Email: ${app.facility_email || "N/A"}

================================================================================
FUNDING SOURCES
================================================================================
USTA National Grant:        ${formatCurrency(app.usta_national_amount || 0)}
USTA Section Grant:         ${formatCurrency(app.usta_section_amount || 0)}
Government Funding:         ${formatCurrency(app.government_funding || 0)}
Foundation Grants:          ${formatCurrency(app.foundation_funding || 0)}
Fundraising:                ${formatCurrency(app.fundraising_amount || 0)}
Professional Fees:          ${formatCurrency(app.professional_fees || 0)}
Local Sponsors:             ${formatCurrency(app.local_sponsors_amount || 0)}
Other Funding:              ${formatCurrency(app.other_funding || 0)}
${app.other_funding_description ? `  (${app.other_funding_description})` : ""}
--------------------------------------------------------------------------------
TOTAL FUNDING:              ${formatCurrency(totalFunding)}

================================================================================
COURT INFORMATION
================================================================================
36' Courts (Lined):         ${app.courts_36_lined || 0}
36' Courts (Permanent):     ${app.courts_36_permanent || 0}
60' Courts (Lined):         ${app.courts_60_lined || 0}
60' Courts (Permanent):     ${app.courts_60_permanent || 0}
78' Courts (Full Size):     ${app.courts_78 || 0}

================================================================================
PROJECT DETAILS
================================================================================
Total Renovation Costs:     ${formatCurrency(app.total_renovation_costs || 0)}
Projected Completion:       ${formatDate(app.projected_completion_date)}
Completion Percentage:      ${app.completion_percentage || 0}%

Description of Improvements:
${app.description_of_improvements || "N/A"}

================================================================================
CONTRACTOR INFORMATION
================================================================================
CourtPro Augusta
Website: courtproaugusta.com
Email: estimates@courtproaugusta.com

================================================================================
Generated: ${new Date().toLocaleString()}
================================================================================
`;

  // Create simple PDF structure
  const encoder = new TextEncoder();
  const content = encoder.encode(textContent);

  const pdfHeader = "%PDF-1.4\n";
  const catalog = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const pages = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";

  const escapedContent = textContent
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

  const pageContent = `4 0 obj
<< /Length ${escapedContent.length + 50} >>
stream
BT
/F1 10 Tf
50 750 Td
12 TL
${escapedContent
  .split("\n")
  .map((line) => `(${line}) '`)
  .join("\n")}
ET
endstream
endobj
`;

  const page = `3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 900] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
`;

  const font = `5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj
`;

  const xrefOffset =
    pdfHeader.length +
    catalog.length +
    pages.length +
    page.length +
    pageContent.length +
    font.length;

  const xref = `xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000270 00000 n 
0000000${String(xrefOffset - 100).padStart(3, "0")} 00000 n 
`;

  const trailer = `trailer
<< /Size 6 /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;

  const fullPdf = pdfHeader + catalog + pages + page + pageContent + font + xref + trailer;

  return encoder.encode(fullPdf);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId } = await req.json();

    if (!applicationId) {
      throw new Error("Application ID is required");
    }

    console.log("Generating USTA form for application:", applicationId);

    // Fetch application with project data
    const { data: application, error: fetchError } = await supabase
      .from("usta_applications")
      .select(`
        *,
        project:projects(project_name, site_address, site_city, site_state, site_zip)
      `)
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      throw new Error("Application not found");
    }

    console.log("Application data:", application);

    // Generate PDF
    const pdfBytes = generatePdfContent(application as USTAApplication);

    // Upload to storage
    const fileName = `usta-form-${application.tpa_number || applicationId}-${Date.now()}.pdf`;
    const filePath = `usta/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload PDF");
    }

    // Get signed URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from("invoices")
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

    if (urlError) {
      throw new Error("Failed to create signed URL");
    }

    // Update application with PDF URL
    await supabase
      .from("usta_applications")
      .update({ pdf_url: filePath })
      .eq("id", applicationId);

    console.log("PDF generated and uploaded:", filePath);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: urlData.signedUrl,
        filePath,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating USTA form:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});