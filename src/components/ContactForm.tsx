import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "",
    job_type: "",
    base_type: "",
    court_condition: "",
    ownership_type: "",
    number_of_courts: "1",
    budget_range: "",
    urgency: "",
    location: "",
    timeline: "",
    notes: "",
    smsOptIn: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const showConditionField = formData.job_type === "resurfacing" || formData.job_type === "repair";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          ...formData,
          number_of_courts: parseInt(formData.number_of_courts) || 1,
        },
      });

      if (error) throw error;

      toast.success("Your quote request has been sent successfully! We'll get back to you soon.");
      
      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "",
        job_type: "",
        base_type: "",
        court_condition: "",
        ownership_type: "",
        number_of_courts: "1",
        budget_range: "",
        urgency: "",
        location: "",
        timeline: "",
        notes: "",
        smsOptIn: false,
      });
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast.error("Failed to send your request. Please try calling or emailing us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-card">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-secondary mb-2">Request a Quote</h2>
        <p className="text-muted-foreground text-lg mb-12">
          Tell us about your site, timeline, and goals. We'll reply with next steps and a clean, line-item estimate.
        </p>

        <Card className="shadow-xl">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name + Email */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Phone + Project Type */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Sport / Court Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select court type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Pickleball">Pickleball</SelectItem>
                      <SelectItem value="Tennis">Tennis</SelectItem>
                      <SelectItem value="Basketball">Basketball</SelectItem>
                      <SelectItem value="Multi-Sport">Multi-Sport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Job Type + Ownership */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="job_type">What do you need? *</Label>
                  <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value, court_condition: value === "new_build" ? "" : formData.court_condition })}>
                    <SelectTrigger id="job_type">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="resurfacing">Resurfacing</SelectItem>
                      <SelectItem value="new_build">New Build</SelectItem>
                      <SelectItem value="repair">Repair Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownership_type">Owner Type</Label>
                  <Select value={formData.ownership_type} onValueChange={(value) => setFormData({ ...formData, ownership_type: value })}>
                    <SelectTrigger id="ownership_type">
                      <SelectValue placeholder="Select owner type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="private">Private Homeowner</SelectItem>
                      <SelectItem value="public_bid">Public / Government Bid</SelectItem>
                      <SelectItem value="school">School / Institution</SelectItem>
                      <SelectItem value="commercial">Commercial / HOA / Club</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Base Type + Court Condition (conditional) */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="base_type">Surface Base</Label>
                  <Select value={formData.base_type} onValueChange={(value) => setFormData({ ...formData, base_type: value })}>
                    <SelectTrigger id="base_type">
                      <SelectValue placeholder="Select base type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="asphalt">Asphalt</SelectItem>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="unknown">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {showConditionField ? (
                  <div className="space-y-2">
                    <Label htmlFor="court_condition">Current Condition</Label>
                    <Select value={formData.court_condition} onValueChange={(value) => setFormData({ ...formData, court_condition: value })}>
                      <SelectTrigger id="court_condition">
                        <SelectValue placeholder="Describe condition" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="good">Good — Minor wear</SelectItem>
                        <SelectItem value="moderate">Moderate — Visible cracks</SelectItem>
                        <SelectItem value="heavy">Heavy Damage — Major cracks/heaving</SelectItem>
                        <SelectItem value="ponding">Ponding / Drainage Issues</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="number_of_courts">Number of Courts</Label>
                    <Select value={formData.number_of_courts} onValueChange={(value) => setFormData({ ...formData, number_of_courts: value })}>
                      <SelectTrigger id="number_of_courts">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="8">8+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Row 4b: Number of courts + condition (when condition is shown) */}
              {showConditionField && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="number_of_courts">Number of Courts</Label>
                    <Select value={formData.number_of_courts} onValueChange={(value) => setFormData({ ...formData, number_of_courts: value })}>
                      <SelectTrigger id="number_of_courts">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="8">8+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div />
                </div>
              )}

              {/* Row 5: Budget + Urgency */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="budget_range">Budget Range (optional)</Label>
                  <Select value={formData.budget_range} onValueChange={(value) => setFormData({ ...formData, budget_range: value })}>
                    <SelectTrigger id="budget_range">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="under_15k">Under $15,000</SelectItem>
                      <SelectItem value="15k_30k">$15,000 – $30,000</SelectItem>
                      <SelectItem value="30k_60k">$30,000 – $60,000</SelectItem>
                      <SelectItem value="60k_plus">$60,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Timeline / Urgency</Label>
                  <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                    <SelectTrigger id="urgency">
                      <SelectValue placeholder="How soon?" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="asap">ASAP</SelectItem>
                      <SelectItem value="3_months">Within 3 months</SelectItem>
                      <SelectItem value="6_months">Within 6 months</SelectItem>
                      <SelectItem value="flexible">Flexible / Planning ahead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 6: Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location (City, State) *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Augusta, GA"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Details</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Describe existing damage, accessories needed (fencing, lighting, nets), special requirements, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* SMS Opt-in */}
              {formData.phone && (
                <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                  <p className="text-xs font-semibold text-foreground">
                    CourtPro Augusta SMS Communications
                  </p>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="smsOptIn"
                      checked={formData.smsOptIn}
                      onCheckedChange={(checked) => setFormData({ ...formData, smsOptIn: checked === true })}
                      className="mt-0.5"
                    />
                    <Label htmlFor="smsOptIn" className="text-xs font-medium cursor-pointer leading-relaxed">
                      I agree to receive recurring automated promotional and informational text messages 
                      (e.g., project updates, scheduling, estimates, and appointment reminders) from 
                      CourtPro Augusta at the phone number provided. Consent is not a condition of purchase. 
                      Msg frequency varies (approx. 1–10 msgs/month). Msg &amp; data rates may apply. 
                      Reply STOP to cancel, HELP for help.
                    </Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>{" · "}
                    <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{" · "}
                    <a href="/sms-terms" className="text-primary hover:underline">SMS Terms &amp; Conditions</a>
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" className="font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Get Your Quote"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => (window.location.href = "mailto:estimates@courtproaugusta.com")}
                >
                  Email Instead
                </Button>
              </div>

              <div className="text-sm text-muted-foreground pt-4 border-t border-border">
                <p className="mb-2">
                  <strong>Phone:</strong>{" "}
                  <a href="tel:+17063091993" className="text-primary hover:underline">
                    (706) 309-1993
                  </a>
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:estimates@courtproaugusta.com" className="text-primary hover:underline">
                    estimates@courtproaugusta.com
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ContactForm;
