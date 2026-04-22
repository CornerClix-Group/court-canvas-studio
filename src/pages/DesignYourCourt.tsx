import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourtRenderer } from "@/components/court/CourtRenderer";
import { ColorSwatchPicker } from "@/components/court/ColorSwatchPicker";
import {
  COLOR_PRESETS,
  COURT_TYPES,
  COURT_TYPE_LIST,
  CourtType,
  LAYKOLD_COURT_COLORS,
  LAYKOLD_LINES,
} from "@/lib/courtGeometry";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";

type ViewMode = "perspective" | "top";

export default function DesignYourCourt() {
  const { toast } = useToast();
  const [courtType, setCourtType] = useState<CourtType>("tennis");
  const [innerColor, setInnerColor] = useState("Pro Blue");
  const [outerColor, setOuterColor] = useState("Dark Green");
  const [lineColor, setLineColor] = useState("White");
  const [showNet, setShowNet] = useState(true);
  const [view, setView] = useState<ViewMode>("perspective");

  const [leadOpen, setLeadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    project_notes: "",
  });

  const meta = COURT_TYPES[courtType];

  const applyPreset = (id: string) => {
    const p = COLOR_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setInnerColor(p.inner);
    setOuterColor(p.outer);
    setLineColor(p.line);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email) {
      toast({ variant: "destructive", title: "Required fields", description: "Name and email are required." });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-court-design", {
        body: {
          ...form,
          court_type: courtType,
          inner_color: innerColor,
          outer_color: outerColor,
          line_color: lineColor,
        },
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Submission failed", description: "Please try again or email estimates@courtproaugusta.com." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Design Your Court | CourtPro Augusta"
        description="Visualize your dream tennis, pickleball, or basketball court with official Laykold colors. Build your design and request a free quote from CourtPro Augusta."
        canonical="https://courtproaugusta.com/design-your-court"
      />

      <Header />

      <main className="bg-background">
        <section className="bg-gradient-to-b from-primary/5 to-background border-b">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Court Designer
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
              Design your dream court
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Pick a sport, swap official Laykold colors, and request a quote — all without leaving the page.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            <div className="space-y-4">
              <Card className="p-4 md:p-6 bg-muted/30">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-foreground">{meta.label}</h2>
                    <p className="text-xs text-muted-foreground">{meta.dimensionsLabel}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={view === "perspective" ? "default" : "outline"}
                      onClick={() => setView("perspective")}
                    >
                      3D
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={view === "top" ? "default" : "outline"}
                      onClick={() => setView("top")}
                    >
                      Top
                    </Button>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-4 md:p-8" style={{ minHeight: 320 }}>
                  <CourtRenderer
                    courtType={courtType}
                    innerColor={innerColor}
                    outerColor={outerColor}
                    lineColor={lineColor}
                    showNet={showNet && meta.hasNet}
                    view={view}
                  />
                </div>
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground gap-3 flex-wrap">
                  <span>
                    Inner: <strong className="text-foreground">Laykold {innerColor}</strong> · Outer:{" "}
                    <strong className="text-foreground">Laykold {outerColor}</strong> · Lines:{" "}
                    <strong className="text-foreground">Laykold {lineColor}</strong>
                  </span>
                  {meta.hasNet && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showNet}
                        onChange={(e) => setShowNet(e.target.checked)}
                        className="rounded border-input"
                      />
                      Show net
                    </label>
                  )}
                </div>
              </Card>

              <Button size="lg" className="w-full" onClick={() => setLeadOpen(true)}>
                Get a free quote on this design
              </Button>
            </div>

            <div className="space-y-6">
              <Card className="p-5">
                <Label className="text-sm font-semibold mb-2 block">Court type</Label>
                <Select value={courtType} onValueChange={(v) => setCourtType(v as CourtType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COURT_TYPE_LIST.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">{meta.description}</p>
              </Card>

              <Card className="p-5 space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Popular combinations</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        className="text-left text-xs p-2 rounded-md border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium text-foreground">{p.label}</div>
                        <div className="text-muted-foreground text-[10px]">
                          {p.inner} / {p.outer}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <Tabs defaultValue="inner">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="inner">Inner</TabsTrigger>
                  <TabsTrigger value="outer">Outer</TabsTrigger>
                  <TabsTrigger value="lines">Lines</TabsTrigger>
                </TabsList>
                <TabsContent value="inner">
                  <Card className="p-5">
                    <ColorSwatchPicker
                      label="Playing surface"
                      colors={LAYKOLD_COURT_COLORS}
                      selected={innerColor}
                      onChange={setInnerColor}
                      groupByTier
                    />
                  </Card>
                </TabsContent>
                <TabsContent value="outer">
                  <Card className="p-5">
                    <ColorSwatchPicker
                      label="Outer pad"
                      colors={LAYKOLD_COURT_COLORS}
                      selected={outerColor}
                      onChange={setOuterColor}
                      groupByTier
                    />
                  </Card>
                </TabsContent>
                <TabsContent value="lines">
                  <Card className="p-5">
                    <ColorSwatchPicker
                      label="Line color"
                      colors={LAYKOLD_LINES}
                      selected={lineColor}
                      onChange={setLineColor}
                    />
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <Dialog
        open={leadOpen}
        onOpenChange={(o) => {
          if (!submitting) {
            setLeadOpen(o);
            if (!o) setSubmitted(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Design sent!</h3>
              <p className="text-sm text-muted-foreground mb-5">
                We saved your design and we&apos;ll be in touch within 1 business day with a custom quote.
              </p>
              <Button onClick={() => setLeadOpen(false)} className="w-full">Got it</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Get a free quote</DialogTitle>
                <DialogDescription>
                  We&apos;ll save your design and follow up with pricing for your project.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="full_name">Full name *</Label>
                    <Input
                      id="full_name"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="street">Site address (optional)</Label>
                  <Input id="street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      maxLength={2}
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP</Label>
                    <Input id="zip" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="project_notes">Anything else? (optional)</Label>
                  <Textarea
                    id="project_notes"
                    rows={3}
                    value={form.project_notes}
                    onChange={(e) => setForm({ ...form, project_notes: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  By submitting you agree to be contacted by CourtPro Augusta about your project.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLeadOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send my design"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
