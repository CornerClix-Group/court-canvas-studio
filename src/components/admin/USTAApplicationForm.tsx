import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Send, FileText, Loader2 } from "lucide-react";

interface USTAApplication {
  id?: string;
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
  status: string;
  consultant_name: string | null;
  consultant_email: string | null;
  submitted_at: string | null;
  pdf_url: string | null;
}

interface ProjectData {
  id: string;
  project_name: string;
  site_address: string | null;
  site_city: string | null;
  site_state: string | null;
  site_zip: string | null;
  contract_value: number;
  target_completion_date: string | null;
  customer?: {
    contact_name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

interface USTAApplicationFormProps {
  projectId: string;
  project: ProjectData;
  completionPercentage: number;
}

const DEFAULT_USTA: Partial<USTAApplication> = {
  tpa_number: "",
  facility_name: "",
  facility_director: "",
  facility_phone: "",
  facility_email: "",
  usta_national_amount: 0,
  usta_section_amount: 0,
  government_funding: 0,
  foundation_funding: 0,
  fundraising_amount: 0,
  professional_fees: 0,
  local_sponsors_amount: 0,
  other_funding: 0,
  other_funding_description: "",
  courts_36_lined: 0,
  courts_36_permanent: 0,
  courts_60_lined: 0,
  courts_60_permanent: 0,
  courts_78: 0,
  description_of_improvements: "",
  total_renovation_costs: 0,
  projected_completion_date: null,
  completion_percentage: 0,
  status: "draft",
  consultant_name: "",
  consultant_email: "",
};

export default function USTAApplicationForm({ projectId, project, completionPercentage }: USTAApplicationFormProps) {
  const { toast } = useToast();
  const [application, setApplication] = useState<Partial<USTAApplication>>(DEFAULT_USTA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [projectId]);

  async function fetchApplication() {
    try {
      const { data, error } = await supabase
        .from("usta_applications")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setApplication(data);
      } else {
        // Pre-populate from project data
        setApplication({
          ...DEFAULT_USTA,
          project_id: projectId,
          facility_name: project.project_name,
          facility_director: project.customer?.contact_name || "",
          facility_phone: project.customer?.phone || "",
          facility_email: project.customer?.email || "",
          total_renovation_costs: project.contract_value || 0,
          projected_completion_date: project.target_completion_date,
          completion_percentage: completionPercentage,
        });
      }
    } catch (error) {
      console.error("Error fetching USTA application:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...application,
        project_id: projectId,
        completion_percentage: completionPercentage,
      };

      if (application.id) {
        const { error } = await supabase
          .from("usta_applications")
          .update(payload)
          .eq("id", application.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("usta_applications")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setApplication(data);
      }

      toast({ title: "USTA application saved" });
    } catch (error) {
      console.error("Error saving USTA application:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save application",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePDF() {
    if (!application.id) {
      toast({
        variant: "destructive",
        title: "Save First",
        description: "Please save the application before generating PDF",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-usta-form", {
        body: { applicationId: application.id },
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        setApplication({ ...application, pdf_url: data.pdfUrl });
        window.open(data.pdfUrl, "_blank");
        toast({ title: "PDF generated successfully" });
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSendToConsultant() {
    if (!application.id || !application.consultant_email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please save the application and add consultant email first",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-usta-form", {
        body: { applicationId: application.id },
      });

      if (error) throw error;

      setApplication({
        ...application,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });

      toast({ title: "Form sent to USTA consultant" });
    } catch (error) {
      console.error("Error sending to consultant:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send to consultant",
      });
    } finally {
      setSending(false);
    }
  }

  const updateField = (field: keyof USTAApplication, value: string | number) => {
    setApplication({ ...application, [field]: value });
  };

  const totalFunding =
    (application.usta_national_amount || 0) +
    (application.usta_section_amount || 0) +
    (application.government_funding || 0) +
    (application.foundation_funding || 0) +
    (application.fundraising_amount || 0) +
    (application.professional_fees || 0) +
    (application.local_sponsors_amount || 0) +
    (application.other_funding || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">USTA Grant Accountability Form</h2>
          <p className="text-sm text-muted-foreground">Category 2 - 2025</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={application.status === "submitted" ? "default" : "secondary"}>
            {application.status === "submitted" ? "Submitted" : "Draft"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* TPA & Facility Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">TPA & Facility Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tpa_number">TPA Number</Label>
              <Input
                id="tpa_number"
                value={application.tpa_number || ""}
                onChange={(e) => updateField("tpa_number", e.target.value)}
                placeholder="Enter USTA TPA Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility_name">Facility Name</Label>
              <Input
                id="facility_name"
                value={application.facility_name || ""}
                onChange={(e) => updateField("facility_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility_director">Facility Director / Contact</Label>
              <Input
                id="facility_director"
                value={application.facility_director || ""}
                onChange={(e) => updateField("facility_director", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facility_phone">Phone</Label>
                <Input
                  id="facility_phone"
                  value={application.facility_phone || ""}
                  onChange={(e) => updateField("facility_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facility_email">Email</Label>
                <Input
                  id="facility_email"
                  type="email"
                  value={application.facility_email || ""}
                  onChange={(e) => updateField("facility_email", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* USTA Consultant */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">USTA Consultant</CardTitle>
            <CardDescription>Who should receive this form?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="consultant_name">Consultant Name</Label>
              <Input
                id="consultant_name"
                value={application.consultant_name || ""}
                onChange={(e) => updateField("consultant_name", e.target.value)}
                placeholder="USTA Facility Consultant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultant_email">Consultant Email</Label>
              <Input
                id="consultant_email"
                type="email"
                value={application.consultant_email || ""}
                onChange={(e) => updateField("consultant_email", e.target.value)}
                placeholder="consultant@usta.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Funding Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funding Sources</CardTitle>
            <CardDescription>
              Total: ${totalFunding.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usta_national_amount">USTA National Grant</Label>
                <Input
                  id="usta_national_amount"
                  type="number"
                  value={application.usta_national_amount || ""}
                  onChange={(e) => updateField("usta_national_amount", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usta_section_amount">USTA Section Grant</Label>
                <Input
                  id="usta_section_amount"
                  type="number"
                  value={application.usta_section_amount || ""}
                  onChange={(e) => updateField("usta_section_amount", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="government_funding">Government Funding</Label>
                <Input
                  id="government_funding"
                  type="number"
                  value={application.government_funding || ""}
                  onChange={(e) => updateField("government_funding", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foundation_funding">Foundation Grants</Label>
                <Input
                  id="foundation_funding"
                  type="number"
                  value={application.foundation_funding || ""}
                  onChange={(e) => updateField("foundation_funding", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fundraising_amount">Fundraising</Label>
                <Input
                  id="fundraising_amount"
                  type="number"
                  value={application.fundraising_amount || ""}
                  onChange={(e) => updateField("fundraising_amount", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_fees">Professional Fees</Label>
                <Input
                  id="professional_fees"
                  type="number"
                  value={application.professional_fees || ""}
                  onChange={(e) => updateField("professional_fees", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local_sponsors_amount">Local Sponsors</Label>
                <Input
                  id="local_sponsors_amount"
                  type="number"
                  value={application.local_sponsors_amount || ""}
                  onChange={(e) => updateField("local_sponsors_amount", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_funding">Other</Label>
                <Input
                  id="other_funding"
                  type="number"
                  value={application.other_funding || ""}
                  onChange={(e) => updateField("other_funding", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_funding_description">Other Funding Description</Label>
              <Input
                id="other_funding_description"
                value={application.other_funding_description || ""}
                onChange={(e) => updateField("other_funding_description", e.target.value)}
                placeholder="Describe other funding sources"
              />
            </div>
          </CardContent>
        </Card>

        {/* Court Counts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Court Information</CardTitle>
            <CardDescription>Number of courts by size</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courts_36_lined">36' Courts (Lined)</Label>
                <Input
                  id="courts_36_lined"
                  type="number"
                  value={application.courts_36_lined || ""}
                  onChange={(e) => updateField("courts_36_lined", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courts_36_permanent">36' Courts (Permanent)</Label>
                <Input
                  id="courts_36_permanent"
                  type="number"
                  value={application.courts_36_permanent || ""}
                  onChange={(e) => updateField("courts_36_permanent", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courts_60_lined">60' Courts (Lined)</Label>
                <Input
                  id="courts_60_lined"
                  type="number"
                  value={application.courts_60_lined || ""}
                  onChange={(e) => updateField("courts_60_lined", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courts_60_permanent">60' Courts (Permanent)</Label>
                <Input
                  id="courts_60_permanent"
                  type="number"
                  value={application.courts_60_permanent || ""}
                  onChange={(e) => updateField("courts_60_permanent", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courts_78">78' Courts (Full Size)</Label>
                <Input
                  id="courts_78"
                  type="number"
                  value={application.courts_78 || ""}
                  onChange={(e) => updateField("courts_78", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="total_renovation_costs">Total Renovation Costs</Label>
                <Input
                  id="total_renovation_costs"
                  type="number"
                  value={application.total_renovation_costs || ""}
                  onChange={(e) => updateField("total_renovation_costs", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projected_completion_date">Projected Completion</Label>
                <Input
                  id="projected_completion_date"
                  type="date"
                  value={application.projected_completion_date || ""}
                  onChange={(e) => updateField("projected_completion_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Completion %</Label>
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
                  <span className="text-sm font-medium">{completionPercentage}%</span>
                  <span className="text-xs text-muted-foreground">(auto-calculated)</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_of_improvements">Description of Improvements</Label>
              <Textarea
                id="description_of_improvements"
                value={application.description_of_improvements || ""}
                onChange={(e) => updateField("description_of_improvements", e.target.value)}
                placeholder="Describe the court improvements..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Application
        </Button>
        <Button variant="outline" onClick={handleGeneratePDF} disabled={generating || !application.id}>
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Generate PDF
        </Button>
        <Button 
          variant="default" 
          onClick={handleSendToConsultant} 
          disabled={sending || !application.id || !application.consultant_email}
        >
          {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Send to USTA Consultant
        </Button>
      </div>

      {application.submitted_at && (
        <p className="text-sm text-muted-foreground">
          Last submitted: {new Date(application.submitted_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}