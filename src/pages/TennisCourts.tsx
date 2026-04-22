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
  name: "Tennis Court Construction",
  description: "Professional tennis court construction with laser grading, post-tension concrete foundations, and custom Laykold surfacing in Augusta, GA.",
  provider: { "@type": "LocalBusiness", name: "CourtPro Augusta" },
  areaServed: "Augusta, GA",
  serviceType: "Court Construction",
};

const TennisCourts = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Tennis Court Construction Augusta, GA | CourtPro Augusta"
        description="Professional tennis court construction in Augusta, GA and the CSRA. Post-tension concrete, laser grading, custom Laykold surfacing, LED lighting. Free estimates: (706) 309-1993."
      />
      <JsonLd data={serviceSchema} />
      <Header />
      <main>
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-secondary mb-4">
              Professional Tennis Court Construction & Design
            </h1>
            <p className="text-xl md:text-2xl text-primary font-semibold mb-6">
              Engineered for performance. Built to last in the Georgia climate.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mb-8">
              A tennis court is a significant investment that requires specific expertise in grading, drainage, and surfacing. At CourtPro Augusta, we specialize in building high-performance hard courts for private residences, high schools, and clubs throughout the CSRA. We ensure your court meets all USTA regulation slopes and dimensions.
            </p>
            <Button onClick={scrollToContact} size="lg" className="font-semibold shadow-lg">
              Get a Free Estimate
            </Button>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">Precision Build Process</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Site Grading</h3>
                  <p className="text-muted-foreground leading-relaxed">We laser-grade your site to ensure the critical 0.83% - 1.0% slope required for proper drainage without affecting ball trajectory.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Crack-Free Foundation</h3>
                  <p className="text-muted-foreground leading-relaxed">We recommend post-tensioned concrete slabs that hold together under tension, virtually eliminating the structural cracks common in asphalt courts.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Custom Color Combinations</h3>
                  <p className="text-muted-foreground leading-relaxed">Choose from the full Laykold chart (US Open Blue, Grass Green, Light Blue, and more) to match your home or team colors.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <h2 className="text-2xl md:text-3xl font-black text-secondary mb-4">Maximize Your Space</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Maximize your space by adding "shadow lines" for pickleball or basketball to your tennis court. We design multi-sport layouts that are distinct but not distracting.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <RelatedServices currentPath="/tennis-courts" />
        <ContactForm />
      </main>
      <Footer />
      
      <MobileFloatingCTA />
      <CookieBanner />
    </div>
  );
};

export default TennisCourts;
