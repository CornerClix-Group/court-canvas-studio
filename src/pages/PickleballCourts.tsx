import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PickleballCourts = () => {
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
              Pickleball Court Construction in Augusta
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mb-8">
              Design and build regulation pickleball courts with premium Laykold surfacing, LED lighting, 
              fencing, divider nets, and cushioned or acrylic surfaces. Serving Augusta, Evans, Martinez, 
              and the surrounding CSRA area.
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
              Our Pickleball Court Services
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">New Court Construction</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Complete turn-key pickleball court installation from ground breaking to final striping.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Multi-Court Facilities</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Tournament-ready complexes with multiple courts, spectator areas, and professional amenities.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Tennis Court Conversions</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Convert existing tennis courts to pickleball with proper line striping and net systems.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Laykold Surfacing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Premium cushioned and acrylic surfaces for optimal play and joint protection.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">LED Court Lighting</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    High-output LED systems for evening play with minimal glare and maximum visibility.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">Fencing & Windscreens</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Professional fencing systems with windscreens to enhance playability and privacy.
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

export default PickleballCourts;
