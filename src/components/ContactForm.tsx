import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "",
    location: "",
    timeline: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send email notification (edge function also forwards to n8n server-side)
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: formData,
      });

      if (error) throw error;

      toast.success("Your quote request has been sent successfully! We'll get back to you soon.");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "",
        location: "",
        timeline: "",
        notes: "",
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
                  <Label htmlFor="type">Project Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Pickleball">Pickleball</SelectItem>
                      <SelectItem value="Tennis">Tennis</SelectItem>
                      <SelectItem value="Basketball">Basketball</SelectItem>
                      <SelectItem value="Multi-Sport">Multi-Sport</SelectItem>
                      <SelectItem value="Renovation / Resurfacing">Renovation / Resurfacing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (City, State)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    placeholder="e.g., 8–12 weeks"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Tell us about scope, access, lighting, fencing, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg" className="font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Request"}
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
