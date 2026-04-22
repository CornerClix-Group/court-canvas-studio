import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

import CookieBanner from "@/components/CookieBanner";
import SEOHead from "@/components/SEOHead";

const FAQPage = () => {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="FAQ | Pickleball & Tennis Court Construction | CourtPro Augusta"
        description="Answers to frequently asked questions about pickleball court costs, construction timelines, surface types, and court resurfacing in Augusta, GA. Call (706) 309-1993."
      />
      <Header />
      <main>
        <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-secondary">
              Frequently Asked Questions About Court Construction
            </h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-3xl">
              Everything you need to know about building, resurfacing, and maintaining pickleball, tennis, and basketball courts in Augusta, GA.
            </p>
          </div>
        </section>
        <FAQ />
      </main>
      <Footer />
      
      <CookieBanner />
    </div>
  );
};

export default FAQPage;
