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
  name: "Basketball Court Construction",
  description: "Custom basketball court construction for residential and commercial properties with premium Laykold surfacing, LED lighting, and pro-grade hoop systems in Augusta, GA.",
  provider: { "@type": "LocalBusiness", name: "CourtPro Augusta" },
  areaServed: "Augusta, GA",
  serviceType: "Court Construction",
};

const BasketballCourts = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Basketball Court Builders Augusta & Evans, GA | CourtPro Augusta"
        description="Custom basketball court construction in Augusta, GA. Full-court and half-court designs with Laykold surfacing, LED lighting, and professional hoop systems. Free estimates: (706) 309-1993."
      />
      <JsonLd data={serviceSchema} />
      <Header />
      <main>
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-secondary mb-4">
              Custom Basketball Court Construction in Augusta
            </h1>
            <p className="text-xl md:text-2xl text-primary font-semibold mb-6">
              From backyard half-courts to full-size regulation courts, we build game-ready surfaces designed to perform.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mb-8">
              Whether you're looking to add a half-court to your Evans backyard, build a full-size court for your Grovetown property, or develop a multi-court facility, CourtPro Augusta delivers professional-grade basketball courts with precision engineering and premium finishes. We handle everything from site preparation to the final slam dunk.
            </p>
            <Button onClick={scrollToContact} size="lg" className="font-semibold shadow-lg">
              Get a Free Estimate
            </Button>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">The CourtPro Advantage</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Premium Surfacing</h3>
                  <p className="text-muted-foreground leading-relaxed">We use official Laykold® acrylic systems for optimal ball bounce, traction, and durability in Georgia's climate.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Pro-Grade Hoop Systems</h3>
                  <p className="text-muted-foreground leading-relaxed">We install adjustable and fixed-height goal systems with tempered glass or acrylic backboards built to last.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">LED Court Lighting</h3>
                  <p className="text-muted-foreground leading-relaxed">High-output LED systems for evening games with even illumination and minimal glare—play after dark.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">Court Options</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Full-Court (94' x 50')</h3>
                  <p className="text-muted-foreground leading-relaxed">Regulation NBA/NCAA dimensions with complete line markings, center circle, three-point lines, and keys.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Half-Court (47' x 50')</h3>
                  <p className="text-muted-foreground leading-relaxed">Perfect for residential properties—full regulation half-court with three-point line, key, and free-throw circle.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Multi-Sport Courts</h3>
                  <p className="text-muted-foreground leading-relaxed">Combine basketball with pickleball or tennis lines for maximum versatility without visual clutter.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Custom Color Schemes</h3>
                  <p className="text-muted-foreground leading-relaxed">Choose from the full Laykold color chart to match your favorite team, school colors, or home aesthetic.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Post-Tension Concrete</h3>
                  <p className="text-muted-foreground leading-relaxed">Crack-resistant foundation built to withstand Georgia's clay soil and temperature fluctuations.</p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Containment Fencing</h3>
                  <p className="text-muted-foreground leading-relaxed">Keep the ball in play with professional fencing systems designed for basketball courts.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <RelatedServices currentPath="/basketball-courts" />
        <ContactForm />
      </main>
      <Footer />
      
      <MobileFloatingCTA />
      <CookieBanner />
    </div>
  );
};

export default BasketballCourts;
