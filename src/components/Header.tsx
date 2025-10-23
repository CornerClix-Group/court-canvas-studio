import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import logo from "@/assets/courtpro-logo-transparent.png";

const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="CourtPro Augusta" className="h-24 w-auto" />
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <button onClick={() => scrollToSection("work")} className="hover:text-primary transition-colors">
            Our Work
          </button>
          <button onClick={() => scrollToSection("process")} className="hover:text-primary transition-colors">
            Process
          </button>
          <button onClick={() => scrollToSection("viewer")} className="hover:text-primary transition-colors">
            Court Viewer
          </button>
          <button onClick={() => scrollToSection("services")} className="hover:text-primary transition-colors">
            Services
          </button>
          <button onClick={() => scrollToSection("contact")} className="hover:text-primary transition-colors">
            Contact
          </button>
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
          <Button onClick={() => scrollToSection("contact")} size="lg" className="font-semibold">
            Request a Quote
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
