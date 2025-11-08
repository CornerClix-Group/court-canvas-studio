import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Linkedin, Menu } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import logo from "@/assets/courtpro-logo-transparent.png";

const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setDrawerOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CourtPro Augusta" className="h-20 w-auto" />
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
          
          {/* Mobile Menu */}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Menu</DrawerTitle>
              </DrawerHeader>
              <nav className="flex flex-col gap-4 p-4">
                <button onClick={() => scrollToSection("work")} className="text-left py-2 hover:text-primary transition-colors">
                  Our Work
                </button>
                <button onClick={() => scrollToSection("process")} className="text-left py-2 hover:text-primary transition-colors">
                  Process
                </button>
                <button onClick={() => scrollToSection("viewer")} className="text-left py-2 hover:text-primary transition-colors">
                  Court Viewer
                </button>
                <button onClick={() => scrollToSection("services")} className="text-left py-2 hover:text-primary transition-colors">
                  Services
                </button>
                <button onClick={() => scrollToSection("contact")} className="text-left py-2 hover:text-primary transition-colors">
                  Contact
                </button>
              </nav>
            </DrawerContent>
          </Drawer>
          
          <Button onClick={() => scrollToSection("contact")} size="lg" className="hidden md:inline-flex font-semibold">
            Request a Quote
          </Button>
        </div>
        <div className="hidden lg:flex items-center justify-end gap-3 mt-2">
          <a href="https://www.facebook.com/people/CourtPro-Augusta/61582961717793/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
            <Facebook className="w-5 h-5" />
          </a>
          <a href="https://www.instagram.com/courtpro_augusta/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
            <Linkedin className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
