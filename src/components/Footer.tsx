import { Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <p className="font-semibold text-foreground mb-2">
              CourtPro Augusta
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              Augusta, GA | <a href="tel:+17063091993" className="hover:text-primary transition-colors">(706) 309-1993</a>
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              <a href="mailto:estimates@courtproaugusta.com" className="hover:text-primary transition-colors">
                estimates@courtproaugusta.com
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              A CourtHaus Construction, LLC Company
            </p>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Services</h3>
            <nav className="space-y-2 text-sm" aria-label="Services navigation">
              <Link to="/pickleball-courts" className="block text-muted-foreground hover:text-primary transition-colors">Pickleball Courts</Link>
              <Link to="/tennis-courts" className="block text-muted-foreground hover:text-primary transition-colors">Tennis Courts</Link>
              <Link to="/basketball-courts" className="block text-muted-foreground hover:text-primary transition-colors">Basketball Courts</Link>
              <Link to="/multi-sport-courts" className="block text-muted-foreground hover:text-primary transition-colors">Multi-Sport Courts</Link>
              <Link to="/court-resurfacing" className="block text-muted-foreground hover:text-primary transition-colors">Resurfacing & Repair</Link>
            </nav>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Company</h3>
            <nav className="space-y-2 text-sm" aria-label="Company navigation">
              <Link to="/" className="block text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link to="/faq" className="block text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
              <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            </nav>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Connect With Us</h3>
            <div className="flex gap-4 mb-4">
              <a href="https://www.facebook.com/people/CourtPro-Augusta/61582961717793/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow CourtPro Augusta on Facebook">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://www.instagram.com/courtpro_augusta/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow CourtPro Augusta on Instagram">
                <Instagram className="w-6 h-6" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">200+ courts built & maintained</p>
          </div>
        </div>

        {/* Service Area */}
        <div className="pt-6 border-t border-border mb-6">
          <h4 className="font-semibold text-foreground mb-2 text-sm">Service Area</h4>
          <p className="text-sm text-muted-foreground">
            Proudly serving Augusta, Evans, Martinez, Grovetown, North Augusta, Aiken, and the surrounding CSRA communities.
          </p>
        </div>

        {/* NAP + Legal */}
        <div className="pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© {currentYear} CourtPro Augusta | Augusta, GA | (706) 309-1993 | estimates@courtproaugusta.com</p>
            <div className="flex gap-4">
              <p>This site features Laykold color options. CourtPro Augusta is not affiliated with Laykold.</p>
              <Link to="/admin/auth" className="hover:text-primary transition-colors">Staff Login</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
