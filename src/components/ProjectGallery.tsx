import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import basketballBackyard from "@/assets/projects/basketball-backyard.jpg";
import pickleballComplex from "@/assets/projects/pickleball-complex.jpg";
import tennisPB from "@/assets/projects/tennis-pickleball-complex.jpg";
import basketballNight from "@/assets/projects/basketball-night.jpg";

const showcaseProjects = [
  {
    image: basketballBackyard,
    title: "Backyard Multi-Sport — Evans, GA",
    tags: ["Basketball", "Pickleball", "Residential"],
  },
  {
    image: pickleballComplex,
    title: "Tournament Pickleball Complex — Aiken, SC",
    tags: ["Pickleball", "Commercial", "LED Lighting"],
  },
  {
    image: tennisPB,
    title: "Tennis & Pickleball Facility — North Augusta, SC",
    tags: ["Tennis", "Pickleball", "8 Courts"],
  },
  {
    image: basketballNight,
    title: "Night-Play Basketball — Grovetown, GA",
    tags: ["Basketball", "Residential", "LED Lighting"],
  },
];

const ProjectGallery = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-24 bg-card" aria-labelledby="gallery-heading">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 id="gallery-heading" className="text-3xl md:text-4xl font-black text-secondary mb-2">
              Our Portfolio
            </h2>
            <p className="text-muted-foreground text-lg">
              Completed projects across Augusta, GA and the CSRA
            </p>
          </div>
          <Button onClick={scrollToContact} size="lg" className="font-semibold">
            Start Your Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {showcaseProjects.map((project, i) => (
            <div
              key={i}
              className="group relative rounded-lg overflow-hidden aspect-[16/10] cursor-pointer"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h3 className="text-secondary-foreground font-bold text-lg mb-2">{project.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} className="bg-primary/90 text-primary-foreground text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectGallery;
