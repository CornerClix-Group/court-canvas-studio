import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroCourt from "@/assets/hero-court.jpg";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-3xl md:text-5xl font-black leading-tight text-secondary text-center md:text-left">
            Augusta's Premier <span className="text-primary">Pickleball & Tennis Court Builders</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            We design, build, and maintain pro-grade <span className="font-bold text-foreground">pickleball</span>,{" "}
            <span className="font-bold text-foreground">tennis</span>, and{" "}
            <span className="font-bold text-foreground">basketball</span> courts. Laykold surface expertise, exacting drainage
            & grading, LED lighting, and turn-key delivery across Augusta, GA and the CSRA.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={() => scrollToSection("contact")} size="lg" className="font-semibold shadow-lg">
              Get a Free Estimate
            </Button>
            <Button onClick={() => scrollToSection("work")} variant="outline" size="lg" className="font-semibold">
              See Our Work
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden shadow-xl">
          <img
            src={heroCourt}
            alt="Laykold pickleball court construction Augusta GA by CourtPro Augusta"
            className="w-full h-auto rounded-lg"
            width={800}
            height={600}
          />
        </Card>
      </div>
    </section>
  );
};

export default Hero;
