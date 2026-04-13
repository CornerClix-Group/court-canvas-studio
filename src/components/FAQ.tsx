import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import JsonLd from "@/components/JsonLd";

export const faqItems = [
  {
    question: "How much does it cost to build a pickleball court in Augusta, GA?",
    answer:
      "The cost to build a pickleball court in Augusta typically ranges from $15,000 to $50,000 depending on surface type, lighting, fencing, and base preparation. CourtPro Augusta provides free line-item estimates. Contact us at (706) 309-1993.",
  },
  {
    question: "How long does it take to build a pickleball court?",
    answer:
      "Most residential pickleball courts take 1 to 3 weeks from groundbreaking to completion. Commercial and multi-court projects may take 4 to 8 weeks depending on scope.",
  },
  {
    question: "What surface is best for a pickleball court?",
    answer:
      "Laykold acrylic cushioned surfaces are the preferred choice for professional and residential courts. They reduce joint stress, offer excellent traction, and are UV-stable for durability in Georgia's climate.",
  },
  {
    question: "Does CourtPro Augusta build tennis courts?",
    answer:
      "Yes. CourtPro Augusta designs and builds full-size and half-court tennis courts with premium surfacing, regulation lines, LED lighting, and windscreens throughout Augusta and the CSRA.",
  },
  {
    question: "Can CourtPro Augusta resurface an existing court?",
    answer:
      "Yes. We offer crack remediation, leveling, drainage correction, full resurfacing, and precision line repainting for existing pickleball, tennis, and basketball courts.",
  },
  {
    question: "What areas does CourtPro Augusta serve?",
    answer:
      "We serve Augusta, Evans, Grovetown, Martinez, and the broader CSRA including North Augusta and Aiken, SC.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

interface FAQProps {
  showSchema?: boolean;
}

const FAQ = ({ showSchema = true }: FAQProps) => {
  return (
    <section id="faq" className="py-16 md:py-24 bg-background">
      {showSchema && <JsonLd data={faqSchema} />}
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-secondary mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-lg mb-10">
          Common questions about court construction in Augusta, GA and the CSRA
        </p>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-semibold text-secondary hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
