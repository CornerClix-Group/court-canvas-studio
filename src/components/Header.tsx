import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Menu, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  
  const handleNavClick = (id: string) => {
    setDrawerOpen(false);
    if (location.pathname === "/") {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="CourtPro Augusta - Professional Court Builders" className="h-20 w-auto" width={120} height={80} />
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium" aria-label="Main navigation">
            <button onClick={() => handleNavClick("services")} className="hover:text-primary transition-colors">
              Services
            </button>
            <button onClick={() => handleNavClick("work")} className="hover:text-primary transition-colors">
              Gallery
            </button>
            <button onClick={() => handleNavClick("process")} className="hover:text-primary transition-colors">
              Process
            </button>
            <Link to="/faq" className="hover:text-primary transition-colors">
              FAQ
            </Link>
            <button onClick={() => handleNavClick("contact")} className="hover:text-primary transition-colors">
              Contact
            </button>
          </nav>
          
          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <a href="tel:+17063091993" className="text-primary" aria-label="Call (706) 309-1993">
              <Phone className="h-5 w-5" />
            </a>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Menu</DrawerTitle>
                </DrawerHeader>
                <nav className="flex flex-col gap-4 p-4" aria-label="Mobile navigation">
                  <button onClick={() => handleNavClick("services")} className="text-left py-2 hover:text-primary transition-colors">
                    Services
                  </button>
                  <button onClick={() => handleNavClick("work")} className="text-left py-2 hover:text-primary transition-colors">
                    Gallery
                  </button>
                  <button onClick={() => handleNavClick("process")} className="text-left py-2 hover:text-primary transition-colors">
                    Process
                  </button>
                  <Link to="/faq" onClick={() => setDrawerOpen(false)} className="py-2 hover:text-primary transition-colors">
                    FAQ
                  </Link>
                  <button onClick={() => handleNavClick("contact")} className="text-left py-2 hover:text-primary transition-colors">
                    Contact
                  </button>
                  <a href="tel:+17063091993" className="py-2 text-primary font-semibold">
                    📞 (706) 309-1993
                  </a>
                </nav>
              </DrawerContent>
            </Drawer>
          </div>
          
          <Button onClick={() => handleNavClick("contact")} size="lg" className="hidden md:inline-flex font-semibold">
            Get a Free Estimate
          </Button>
        </div>
        <div className="hidden lg:flex items-center justify-end gap-3 mt-2">
          <a href="https://www.facebook.com/people/CourtPro-Augusta/61582961717793/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow CourtPro Augusta on Facebook">
            <Facebook className="w-5 h-5" />
          </a>
          <a href="https://www.instagram.com/courtpro_augusta/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow CourtPro Augusta on Instagram">
            <Instagram className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
