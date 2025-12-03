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
    title: "Site Grading & Base Preparation",
    description: "Professional grading, base preparation, and surface installation.",
    videoLabel: "Time-lapse video showing professional site grading and base preparation for a sport court",
  },
  {
    video: video3,
    category: "Construction",
    sport: "Process",
    title: "Foundation Installation",
    description: "Expert installation and quality craftsmanship in action.",
    videoLabel: "Video of expert craftsmen installing court foundation with precision equipment",
  },
  {
    video: video4,
    category: "Construction",
    sport: "Process",
    title: "Complete Build Process",
    description: "From ground breaking to finished professional court.",
    videoLabel: "Time-lapse from ground breaking to finished professional court installation",
  },
  {
    video: video5,
    category: "Construction",
    sport: "Process",
    title: "Precision Equipment Work",
    description: "Precision equipment and skilled workmanship.",
    videoLabel: "Video showcasing precision equipment and skilled workmanship during court construction",
  },
  {
    video: video6,
    category: "Construction",
    sport: "Process",
    title: "Professional Techniques",
    description: "Building courts that last with professional techniques.",
    videoLabel: "Video demonstrating professional court building techniques and quality materials",
  },
  {
    video: video7,
    category: "Construction",
    sport: "Process",
    title: "Turn-Key Delivery",
    description: "Complete turn-key delivery from start to finish.",
    videoLabel: "Complete construction process video from initial site work to final court delivery",
  },
];

const RecentProjects = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="work" className="py-16 md:py-24 bg-card" aria-labelledby="recent-projects-heading">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 id="recent-projects-heading" className="text-3xl md:text-4xl font-black text-secondary mb-2">Recent Projects</h2>
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
                    aria-label={project.videoLabel}
                    title={project.title}
                    aria-describedby={`video-desc-${index}`}
                  >
                    <track 
                      kind="descriptions" 
                      label="English descriptions"
                      srcLang="en"
                      src="" 
                      default
                    />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
              <CardContent className="p-6 space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline">{project.category}</Badge>
                  <Badge variant="secondary">{project.sport}</Badge>
                </div>
                <h3 className="font-bold text-lg text-secondary">{project.title}</h3>
                <p id={`video-desc-${index}`} className="text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentProjects;
