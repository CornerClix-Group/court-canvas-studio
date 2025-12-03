import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TennisCourts = () => {
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
              Tennis Court Construction in Augusta
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mb-8">
              Professional tennis court construction with post-tension concrete or engineered bases, 
              premium Laykold surfacing, regulation lines, LED lighting, and windscreens. Serving Augusta, 
              Evans, Martinez, and the surrounding CSRA area.
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
              Our Tennis Court Services
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">New Court Construction</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Complete turn-key tennis court installation from site preparation to final net installation.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Post-Tension Concrete</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Industry-leading post-tension concrete bases for crack-free, long-lasting courts.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Laykold Surfacing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Premium acrylic and cushioned surfaces for optimal ball response and player comfort.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">LED Court Lighting</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Professional LED lighting systems for evening play with even illumination.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Windscreens & Fencing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Quality fencing and windscreen systems for enhanced playability and aesthetics.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Multi-Court Facilities</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Design and build multi-court tennis facilities for clubs, schools, and communities.
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

export default TennisCourts;
