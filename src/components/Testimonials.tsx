import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Michael Stevens",
    location: "Augusta, GA",
    project: "Residential Pickleball Court",
    rating: 5,
    text: "CourtPro Augusta exceeded our expectations. From the initial consultation to the final product, their attention to detail was outstanding. Our backyard court is tournament-quality and we couldn't be happier!",
  },
  {
    name: "Sarah Mitchell",
    location: "Aiken, SC",
    project: "Tennis Court Renovation",
    rating: 5,
    text: "We had an old, cracked tennis court that needed serious work. CourtPro came in and completely transformed it. The Laykold surface is beautiful and plays perfectly. Highly recommend their team!",
  },
  {
    name: "David Chen",
    location: "Evans, GA",
    project: "Multi-Sport Court",
    rating: 5,
    text: "Built us an amazing multi-sport court with pickleball, basketball, and tennis lines. The quality is exceptional and the LED lighting makes night play perfect. Great communication throughout the entire process.",
  },
  {
    name: "Jennifer Martinez",
    location: "North Augusta, SC",
    project: "Community Pickleball Complex",
    rating: 5,
    text: "CourtPro built our 8-court pickleball facility on time and on budget. Their expertise in drainage and surface preparation really shows. The courts have held up beautifully through heavy use.",
  },
  {
    name: "Robert Thompson",
    location: "Martinez, GA",
    project: "Basketball Court",
    rating: 5,
    text: "Professional service from start to finish. They helped us design the perfect backyard basketball court for our kids. The surface quality is outstanding and the installation was flawless.",
  },
  {
    name: "Lisa Anderson",
    location: "Grovetown, GA",
    project: "Tennis & Pickleball Court",
    rating: 5,
    text: "We wanted both tennis and pickleball capabilities, and CourtPro delivered perfectly. The dual-line setup is clean and the color choices from the Laykold palette look incredible. Worth every penny!",
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-secondary mb-2">What Our Clients Say</h2>
          <p className="text-muted-foreground text-lg">Trusted by homeowners, schools, and communities across the region</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed italic">"{testimonial.text}"</p>
                <div className="pt-4 border-t border-border">
                  <p className="font-bold text-secondary">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  <p className="text-xs text-primary font-medium mt-1">{testimonial.project}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
