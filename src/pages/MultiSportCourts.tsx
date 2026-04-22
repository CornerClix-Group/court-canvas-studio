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
  name: "Multi-Sport Court Construction",
  description: "Versatile multi-sport court construction combining pickleball, tennis, basketball, and more with custom line configurations in Augusta, GA.",
  provider: { "@type": "LocalBusiness", name: "CourtPro Augusta" },
  areaServed: "Augusta, GA",
  serviceType: "Court Construction",
};

const MultiSportCourts = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Multi-Sport Court Builders Augusta, GA | CourtPro Augusta"
        description="Multi-sport court construction in Augusta, GA. Combine pickleball, tennis, basketball on one surface. Custom line configurations, Laykold surfacing. Free estimates: (706) 309-1993."
      />
      <JsonLd data={serviceSchema} />
      <Header />
      <main>
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-secondary mb-4">
              Multi-Sport Court Construction in Augusta
            </h1>
            <p className="text-xl md:text-2xl text-primary font-semibold mb-6">
              One court, endless possibilities. Maximize your space with versatile multi-sport designs.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mb-8">
              Why choose one sport when you can have them all? CourtPro Augusta specializes in designing multi-sport courts that seamlessly combine pickleball, tennis, basketball, and more on a single surface. Perfect for families, schools, HOAs, and recreation centers looking to maximize their investment.
            </p>
            <Button onClick={scrollToContact} size="lg" className="font-semibold shadow-lg">
              Get a Free Estimate
            </Button>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">Popular Combinations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Tennis + Pickleball</h3>
                  <p className="text-muted-foreground leading-relaxed">The most popular combo—fit 2-4 pickleball courts on a single tennis court with clearly defined lines in contrasting colors.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Basketball + Pickleball</h3>
                  <p className="text-muted-foreground leading-relaxed">Perfect for families—a half-court basketball setup with pickleball lines overlaid for maximum versatility.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Triple Sport</h3>
                  <p className="text-muted-foreground leading-relaxed">Basketball, pickleball, and tennis on one surface—ideal for schools and community centers with limited space.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">Our Design Expertise</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Strategic Line Colors</h3>
                  <p className="text-muted-foreground leading-relaxed">We use contrasting colors from the Laykold palette to ensure each sport's lines are clearly distinguishable without visual clutter.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Proper Dimensions</h3>
                  <p className="text-muted-foreground leading-relaxed">Every sport maintains regulation dimensions—no compromises on playability or safety.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Equipment Planning</h3>
                  <p className="text-muted-foreground leading-relaxed">We help you select removable nets, adjustable hoops, and portable equipment for quick sport transitions.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Future-Proof Design</h3>
                  <p className="text-muted-foreground leading-relaxed">Want to add another sport later? We plan for expansion so you can add new lines without full resurfacing.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <h2 className="text-2xl md:text-3xl font-black text-secondary mb-4">Maximize Your Investment</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  A multi-sport court costs only 10-15% more than a single-sport court but delivers 3x the value. Keep the whole family active, host diverse events, and future-proof your property with a versatile playing surface.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <RelatedServices currentPath="/multi-sport-courts" />
        <ContactForm />
      </main>
      <Footer />
      
      <MobileFloatingCTA />
      <CookieBanner />
    </div>
  );
};

export default MultiSportCourts;
