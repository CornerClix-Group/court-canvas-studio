import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Cookies from "js-cookie";
import { initGA4 } from "@/lib/analytics";

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const accepted = Cookies.get("cpa_cookies_accepted");
    if (!accepted) {
      setShowBanner(true);
    } else if (accepted === "true") {
      initGA4();
    }
  }, []);

  const handleAccept = () => {
    Cookies.set("cpa_cookies_accepted", "true", { expires: 365 });
    setShowBanner(false);
    initGA4();
  };

  const handleDecline = () => {
    Cookies.set("cpa_cookies_accepted", "false", { expires: 365 });
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <Card className="max-w-4xl mx-auto p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Cookie Consent</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies and analytics to improve your experience and understand how you interact with our site. 
              By clicking "Accept", you consent to our use of cookies and Google Analytics 4.{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Learn more
              </a>
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={handleDecline} className="flex-1 md:flex-initial">
              Decline
            </Button>
            <Button onClick={handleAccept} className="flex-1 md:flex-initial">
              Accept
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieBanner;