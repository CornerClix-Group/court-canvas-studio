import { Facebook, Instagram, Linkedin } from "lucide-react";
import asbaLogo from "@/assets/asba-logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <p className="font-semibold text-foreground mb-2">
              © {currentYear} CourtPro Augusta
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              200+ courts built & maintained
            </p>
            <p className="text-sm text-muted-foreground">All rights reserved.</p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Contact Us</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <a href="tel:+17064263051" className="hover:text-primary transition-colors">
                  706-426-3051
                </a>
              </p>
              <p>
                <a href="mailto:estimates@courtproaugusta.com" className="hover:text-primary transition-colors">
                  estimates@courtproaugusta.com
                </a>
              </p>
            </div>
          </div>

          {/* Social & Certification */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Connect With Us</h3>
            <div className="flex gap-4 mb-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
            <div className="mt-4">
              <img src={asbaLogo} alt="ASBA Member" className="h-16 w-auto" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border text-xs text-muted-foreground">
          This site features Laykold color options. CourtPro Augusta is not affiliated with Laykold.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
