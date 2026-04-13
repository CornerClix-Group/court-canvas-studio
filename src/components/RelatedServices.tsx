import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface RelatedService {
  title: string;
  description: string;
  link: string;
}

const allServices: RelatedService[] = [
  { title: "Pickleball Courts", description: "Custom pickleball court design and construction with Laykold surfacing.", link: "/pickleball-courts" },
  { title: "Tennis Courts", description: "Post-tension concrete tennis courts with premium surfacing and LED lighting.", link: "/tennis-courts" },
  { title: "Basketball Courts", description: "Full-size and half-court basketball court construction.", link: "/basketball-courts" },
  { title: "Multi-Sport Courts", description: "Versatile courts combining pickleball, tennis, and basketball.", link: "/multi-sport-courts" },
  { title: "Resurfacing & Repair", description: "Crack remediation, resurfacing, and precision line repainting.", link: "/court-resurfacing" },
];

interface RelatedServicesProps {
  currentPath: string;
}

const RelatedServices = ({ currentPath }: RelatedServicesProps) => {
  const related = allServices.filter((s) => s.link !== currentPath);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-secondary mb-8">
          Related Services
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {related.map((service) => (
            <Link key={service.link} to={service.link} className="block">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary h-full">
                <CardContent className="p-6 space-y-2">
                  <h3 className="font-bold text-lg text-secondary">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
                  <p className="text-primary text-sm font-medium">Learn more →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedServices;
