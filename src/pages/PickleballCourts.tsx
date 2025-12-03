import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import Chatbot from "@/components/Chatbot";
import CookieBanner from "@/components/CookieBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JsonLd, { businessData } from "@/components/JsonLd";

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Pickleball Court Construction",
  description: "Custom pickleball court construction including post-tension concrete, cushioned Laykold systems, and tennis court conversions for homes and clubs.",
  provider: businessData,
  areaServed: businessData.areaServed,
  serviceType: "Court Construction",
};

const PickleballCourts = () => {
  useEffect(() => {
    document.title = "Pickleball Court Builders Augusta & Aiken | CourtPro";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Expert pickleball court builders in Augusta. We build post-tension and cushioned Laykold courts for homes and clubs. Get a free quote today.");
    }
  }, []);

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <JsonLd data={serviceSchema} />
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-secondary mb-4">
              Custom Pickleball Court Builders in Augusta & Aiken
            </h1>
            <p className="text-xl md:text-2xl text-primary font-semibold mb-6">
              From backyard courts to commercial club facilities, we build tournament-ready pickleball courts designed for the perfect dink.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mb-8">
              As the premier pickleball court builders in the Augusta area, CourtPro Augusta understands that a great game starts with a perfect surface. Whether you are looking to convert an old tennis court, build a new backyard court in Evans, or develop a multi-court commercial facility in Aiken, we deliver precision engineering and professional-grade finishes.
            </p>
            <Button onClick={scrollToContact} size="lg" className="font-semibold shadow-lg">
              Get a Free Quote
            </Button>
          </div>
        </section>

        {/* The CourtPro Advantage */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">
              The CourtPro Advantage
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Pro-Level Surfacing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We use official Laykold® acrylic and cushioned systems—the same surfaces used in major tournaments—to reduce joint strain and ensure consistent ball bounce.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Noise Reduction</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We offer specialized acoustic fencing and surfacing options to keep HOAs and neighbors happy.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Lighting & Fencing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Complete turnkey installation including black-coated fencing and directed LED lighting for night play.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Construction Options */}
        <section className="py-16 md:py-24 bg-card">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">
              Construction Options
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Post-Tension Concrete</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The gold standard for durability, resisting structural cracking in Georgia's shifting soil.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Cushioned Systems</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Layered rubberized coatings for player comfort and injury prevention.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Conversions</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Expertly resizing and resurfacing unused tennis courts into 2-4 permanent pickleball courts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <ContactForm />
      </main>
      <Footer />
      <Chatbot />
      <CookieBanner />
    </div>
  );
};

export default PickleballCourts;
