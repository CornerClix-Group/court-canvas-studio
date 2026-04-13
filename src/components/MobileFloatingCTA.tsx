import { Phone } from "lucide-react";

const MobileFloatingCTA = () => {
  return (
    <div className="fixed bottom-4 right-4 z-40 md:hidden flex flex-col gap-2">
      <a
        href="tel:+17063091993"
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
        aria-label="Call CourtPro Augusta at (706) 309-1993"
      >
        <Phone className="h-4 w-4" />
        (706) 309-1993
      </a>
    </div>
  );
};

export default MobileFloatingCTA;
