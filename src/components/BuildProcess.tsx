import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "Step 1",
    title: "Site Evaluation & Design",
    description:
      "Survey, soils review, and drainage concept. Layout drawings, base system recommendation, preliminary budget.",
  },
  {
    step: "Step 2",
    title: "Excavation & Grading",
    description:
      "Subgrade prep and compaction. Precise slopes (~1% where appropriate) for drainage without impacting ball behavior.",
  },
  {
    step: "Step 3",
    title: "Base Installation",
    description: "Engineered base (compacted aggregate) or post-tension concrete with tolerances verified.",
  },
  {
    step: "Step 4",
    title: "Surface System",
    description: "Multi-coat acrylic or cushioned system with UV-stable color coats tuned for speed and comfort.",
  },
  {
    step: "Step 5",
    title: "Lines, Equipment & Perimeter",
    description:
      "Regulation line painting; net posts & hardware; fencing, windscreens; LED lighting options.",
  },
  {
    step: "Step 6",
    title: "Quality Control, Turnover & Care",
    description:
      "Final inspection, punchlist, owner walk-through, maintenance guidance, and warranty documents.",
  },
];

const BuildProcess = () => {
  return (
    <section id="process" className="py-16 md:py-24 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-secondary mb-12">Our Build Process</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((item, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
              <CardContent className="p-6 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-primary">{item.step}</div>
                <h3 className="font-bold text-lg text-secondary">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BuildProcess;
