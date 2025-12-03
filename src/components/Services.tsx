import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const services = [
  {
    title: "Pickleball Courts",
    description:
      "Design/build to regulation dimensions. Lighting, fencing, divider nets, and cushioned or acrylic surfacing.",
    link: "/pickleball-courts",
  },
  {
    title: "Tennis Courts",
    description:
      "Post-tension concrete or engineered base, premium surfacing, regulation lines, LED lighting, and windscreens.",
    link: "/tennis-courts",
  },
  {
    title: "Basketball Courts",
    description:
      "Full-size and half-court designs. Premium surfacing, regulation lines, hoop systems, LED lighting, and multi-sport striping options.",
    link: "/basketball-courts",
  },
  {
    title: "Multi-Sport Courts",
    description:
      "Versatile courts for pickleball, tennis, basketball, and more. Custom line configurations to maximize your space.",
    link: "/multi-sport-courts",
  },
  {
    title: "Renovations & Resurfacing",
    description: "Crack remediation, leveling, drainage fixes, re-surfacing, and precision line repainting.",
    link: "/court-resurfacing",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const cardContent = (
              <Card className={`group hover:shadow-lg transition-all duration-300 hover:border-primary h-full ${service.link ? "cursor-pointer" : ""}`}>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-bold text-xl text-secondary">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                  {service.link && (
                    <p className="text-primary text-sm font-medium">Learn more →</p>
                  )}
                </CardContent>
              </Card>
            );

            return service.link ? (
              <Link key={index} to={service.link} className="block">
                {cardContent}
              </Link>
            ) : (
              <div key={index}>{cardContent}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
