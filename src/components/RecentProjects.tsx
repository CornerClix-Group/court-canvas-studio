import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import pickleballBackyard from "@/assets/projects/pickleball-backyard.jpg";
import basketballBackyard from "@/assets/projects/basketball-backyard.jpg";
import pickleballComplex from "@/assets/projects/pickleball-complex.jpg";
import tennisPB from "@/assets/projects/tennis-pickleball-complex.jpg";
import multiCourt from "@/assets/projects/multi-court-facility.jpg";
import basketballNight from "@/assets/projects/basketball-night.jpg";

const projects = [
  {
    image: pickleballBackyard,
    category: "Residential",
    sport: "Pickleball",
    title: "Backyard Pickleball Court — Augusta, GA",
    description: "Custom light blue out-of-bounds, LED lighting, premium fencing, and tournament-grade surface.",
  },
  {
    image: basketballBackyard,
    category: "Residential",
    sport: "Basketball",
    title: "Multi-Sport Backyard Court — Evans, GA",
    description: "Basketball and pickleball combo court with custom color scheme and professional lighting.",
  },
  {
    image: pickleballComplex,
    category: "Commercial",
    sport: "Pickleball",
    title: "4-Court Pickleball Complex — Aiken, SC",
    description: "Tournament facility with Laykold cushioned system, LED lighting, and spectator areas.",
  },
  {
    image: tennisPB,
    category: "Commercial",
    sport: "Multi-Sport",
    title: "Tennis & Pickleball Facility — North Augusta, SC",
    description: "Full-size tennis court with 8 dedicated pickleball courts, terracotta out-of-bounds surfacing.",
  },
  {
    image: multiCourt,
    category: "Community",
    sport: "Multi-Sport",
    title: "Community Tennis & Pickleball Complex — Martinez, GA",
    description: "Mixed-use facility with regulation tennis and multiple pickleball courts for community play.",
  },
  {
    image: basketballNight,
    category: "Residential",
    sport: "Basketball",
    title: "Premium Basketball Court — Grovetown, GA",
    description: "Full-court with multi-color key design, professional hoops, and high-output LED lighting system.",
  },
];

const RecentProjects = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="work" className="py-16 md:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-2">Recent Projects</h2>
            <p className="text-muted-foreground text-lg">Real courts we've built across the Augusta region</p>
          </div>
          <Button onClick={scrollToContact} variant="outline" size="lg" className="font-semibold">
            Book a Walk-Through
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card key={index} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6 space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline">{project.category}</Badge>
                  <Badge variant="secondary">{project.sport}</Badge>
                </div>
                <h3 className="font-bold text-lg text-secondary">{project.title}</h3>
                <p className="text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentProjects;
