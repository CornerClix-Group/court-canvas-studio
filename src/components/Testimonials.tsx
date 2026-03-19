import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Mark & Julie Henderson",
    location: "Evans, GA",
    rating: 5,
    text: "CourtPro built our backyard basketball and pickleball court and the quality is incredible. The post-tension concrete base is rock solid, and the Laykold surface plays beautifully. Our neighbors are jealous.",
    sport: "Multi-Sport Court",
  },
  {
    name: "Aiken Pickleball Club",
    location: "Aiken, SC",
    rating: 5,
    text: "We hired CourtPro for a 4-court pickleball complex. They handled everything — grading, drainage, fencing, lighting. Courts play tournament-level and the LED lights let us play past sunset. Highly recommend.",
    sport: "Pickleball Complex",
  },
  {
    name: "David Okonkwo",
    location: "Grovetown, GA",
    rating: 5,
    text: "From the first estimate to the final walk-through, the CourtPro team was professional and on schedule. Our full-size basketball court with custom colors looks amazing under the lights at night.",
    sport: "Basketball Court",
  },
  {
    name: "North Augusta Parks & Rec",
    location: "North Augusta, SC",
    rating: 5,
    text: "CourtPro resurfaced and relined our aging tennis courts and added pickleball lines. The transformation was dramatic — colors are vibrant, the surface drains perfectly, and the community loves it.",
    sport: "Tennis & Pickleball",
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-background" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-black text-secondary mb-3">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            200+ courts completed across the CSRA — here's what our customers think
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((t, i) => (
            <Card key={i} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-foreground leading-relaxed mb-6 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-secondary">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.location} · {t.sport}</p>
                  </div>
                  <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
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
