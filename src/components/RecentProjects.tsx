import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=1400&auto=format&fit=crop",
    category: "Commercial",
    sport: "Pickleball",
    title: "16-Court Pickleball Complex — Austin, TX",
    description: "Post-tension base, LED lighting, cushioned system, 12-week delivery.",
  },
  {
    image: "https://images.unsplash.com/photo-1557344233-54c2a59c81c3?q=80&w=1400&auto=format&fit=crop",
    category: "Institutional",
    sport: "Tennis",
    title: "Collegiate Tennis Renovation — Raleigh, NC",
    description: "Pro acrylic surfacing, regulation lines, new fencing & windscreens.",
  },
  {
    image: "https://images.unsplash.com/photo-1504642922625-9fa0f85762f8?q=80&w=1400&auto=format&fit=crop",
    category: "Residential",
    sport: "Multi-Sport",
    title: "Backyard Dual-Sport Court — Naples, FL",
    description: "Hybrid layout, shade structures, spectator seating.",
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
            <p className="text-muted-foreground text-lg">From private estates to multi-court tournament complexes.</p>
          </div>
          <Button onClick={scrollToContact} variant="outline" size="lg" className="font-semibold">
            Book a Walk-Through
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
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
