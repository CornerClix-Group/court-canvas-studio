import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CourtResurfacing = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-secondary mb-6">
              Court Resurfacing & Renovations in Augusta
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mb-8">
              Expert court resurfacing, crack remediation, leveling, drainage fixes, and precision line 
              repainting. Restore your tennis, pickleball, or basketball court to like-new condition. 
              Serving Augusta, Evans, Martinez, and the surrounding CSRA area.
            </p>
            <Button onClick={scrollToContact} size="lg" className="font-semibold shadow-lg">
              Request a Quote
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">
              Our Resurfacing Services
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Complete Resurfacing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Full court resurfacing with premium Laykold acrylic or cushioned systems.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Crack Remediation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Professional crack repair using industry-leading techniques and materials.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Drainage Solutions</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Fix standing water issues with proper grading and drainage system installation.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Line Repainting</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Precision line striping for tennis, pickleball, basketball, or multi-sport configurations.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Color Changes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Update your court colors with fresh Laykold surfacing in your choice of colors.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Net & Post Replacement</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Replace worn net systems and posts with professional-grade equipment.
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
    </div>
  );
};

export default CourtResurfacing;
