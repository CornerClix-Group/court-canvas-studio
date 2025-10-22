import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          <h1 className="text-4xl md:text-6xl font-black leading-tight text-secondary">
            Precision Courts. <span className="text-primary">Built for Play.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            We design, build, and maintain pro-grade <span className="font-bold text-foreground">pickleball</span>,{" "}
            <span className="font-bold text-foreground">tennis</span>, and{" "}
            <span className="font-bold text-foreground">basketball</span> courts. Laykold surface expertise, exacting drainage
            & grading, LED lighting, and turn-key delivery.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => scrollToSection("viewer")} size="lg" className="font-semibold shadow-lg">
              Open Court Viewer
            </Button>
            <Button onClick={() => scrollToSection("work")} variant="outline" size="lg" className="font-semibold">
              See Our Work
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm px-4 py-2">Laykold Surfaces</Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">Nationwide</Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">Design-Build</Badge>
          </div>
        </div>
        <Card className="overflow-hidden shadow-xl">
          <img
            src={heroCourt}
            alt="Professional pickleball court"
            className="w-full h-auto rounded-lg"
          />
        </Card>
      </div>
    </section>
  );
};

export default Hero;
