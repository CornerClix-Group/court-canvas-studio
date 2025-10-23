import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import basketballBackyard from "@/assets/projects/basketball-backyard.jpg";
import pickleballComplex from "@/assets/projects/pickleball-complex.jpg";
import tennisPB from "@/assets/projects/tennis-pickleball-complex.jpg";
import basketballNight from "@/assets/projects/basketball-night.jpg";
import video2 from "@/assets/videos/court-construction-2.mp4";
import video3 from "@/assets/videos/court-construction-3.mp4";
import video4 from "@/assets/videos/court-construction-4.mp4";
import video5 from "@/assets/videos/court-construction-5.mp4";
import video6 from "@/assets/videos/court-construction-6.mp4";
import video7 from "@/assets/videos/court-construction-7.mp4";

const projects = [
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
    title: "2-Court Pickleball Complex — Aiken, SC",
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
    image: basketballNight,
    category: "Residential",
    sport: "Basketball",
    title: "Premium Basketball Court — Grovetown, GA",
    description: "Full-court with multi-color key design, professional hoops, and high-output LED lighting system.",
  },
  {
    video: video2,
    category: "Construction",
    sport: "Process",
    title: "Court Construction Process",
    description: "Professional grading, base preparation, and surface installation.",
  },
  {
    video: video3,
    category: "Construction",
    sport: "Process",
    title: "Court Construction Process",
    description: "Expert installation and quality craftsmanship in action.",
  },
  {
    video: video4,
    category: "Construction",
    sport: "Process",
    title: "Court Construction Process",
    description: "From ground breaking to finished professional court.",
  },
  {
    video: video5,
    category: "Construction",
    sport: "Process",
    title: "Court Construction Process",
    description: "Precision equipment and skilled workmanship.",
  },
  {
    video: video6,
    category: "Construction",
    sport: "Process",
    title: "Court Construction Process",
    description: "Building courts that last with professional techniques.",
  },
  {
    video: video7,
    category: "Construction",
    sport: "Process",
    title: "Court Construction Process",
    description: "Complete turn-key delivery from start to finish.",
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
              <div className="overflow-hidden bg-black">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <video
                    src={project.video}
                    className="w-full h-64 object-cover"
                    controls
                    playsInline
                    preload="metadata"
                  />
                )}
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
