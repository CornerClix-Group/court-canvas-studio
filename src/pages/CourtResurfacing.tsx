import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

import CookieBanner from "@/components/CookieBanner";
import MobileFloatingCTA from "@/components/MobileFloatingCTA";
import RelatedServices from "@/components/RelatedServices";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JsonLd, { businessData } from "@/components/JsonLd";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Court Resurfacing & Repair",
  description: "Tennis and pickleball court resurfacing, crack repair, puddle correction, and re-striping services in Augusta, GA and surrounding areas.",
  provider: { "@type": "LocalBusiness", name: "CourtPro Augusta" },
  areaServed: "Augusta, GA",
  serviceType: "Court Maintenance",
};

const CourtResurfacing = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Court Resurfacing & Crack Repair Augusta, GA | CourtPro Augusta"
        description="Tennis and pickleball court resurfacing in Augusta, GA. Crack repair, puddle correction, re-striping, and full restoration. Free estimates: (706) 309-1993."
      />
      <JsonLd data={serviceSchema} />
      <Header />
      <main>
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-secondary mb-4">
              Tennis & Pickleball Court Resurfacing & Repair
            </h1>
            <p className="text-xl md:text-2xl text-primary font-semibold mb-6">
              Restore your court's safety, appearance, and playability.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mb-8">
              Is your court faded, cracking, or holding water ("birdbaths")? The Georgia and South Carolina sun can be harsh on court surfaces. CourtPro Augusta provides comprehensive restoration services to bring your court back to life. We don't just paint over problems; we fix the underlying issues.
            </p>
            <Button onClick={scrollToContact} size="lg" className="font-semibold shadow-lg">
              Get a Free Estimate
            </Button>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">Our Restoration Services</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Crack Repair</h3>
                  <p className="text-muted-foreground leading-relaxed">We utilize advanced crack-filling systems and membrane technologies to bridge existing cracks and prevent them from mirroring through the new surface.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Resurfacing</h3>
                  <p className="text-muted-foreground leading-relaxed">Application of new acrylic resurfacer and color coats to restore texture (speed of play) and vibrant aesthetics.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Puddle Correction</h3>
                  <p className="text-muted-foreground leading-relaxed">We patch and level low spots (birdbaths) to ensure your court dries quickly after a rainstorm.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Re-Striping</h3>
                  <p className="text-muted-foreground leading-relaxed">Precision line painting for tennis, pickleball, or basketball with crisp, sharp edges.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <h2 className="text-2xl md:text-3xl font-black text-secondary mb-4">When to Resurface Your Court</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Most hard courts require resurfacing every 5–7 years. If you notice fading colors, slippery texture, or surface delamination, it's time to call the experts at CourtPro.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <RelatedServices currentPath="/court-resurfacing" />
        <ContactForm />
      </main>
      <Footer />
      
      <MobileFloatingCTA />
      <CookieBanner />
    </div>
  );
};

export default CourtResurfacing;
