import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RecentProjects from "@/components/RecentProjects";
import BuildProcess from "@/components/BuildProcess";
import CourtViewer from "@/components/CourtViewer";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import ProjectGallery from "@/components/ProjectGallery";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
// Chatbot replaced by LeadConnector widget (loaded globally in index.html)
// import Chatbot from "@/components/Chatbot";
import CookieBanner from "@/components/CookieBanner";
import FAQ from "@/components/FAQ";
import MobileFloatingCTA from "@/components/MobileFloatingCTA";
import SEOHead from "@/components/SEOHead";
import JsonLd, { businessData } from "@/components/JsonLd";

const localBusinessSchema = {
  "@context": "https://schema.org",
  ...businessData,
  description: "Professional pickleball, tennis, and multi-sport court construction and resurfacing in Augusta, GA. 200+ courts delivered. Laykold surfacing, LED lighting, and full turn-key service.",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "500 Furys Ferry Rd. Suite 107",
    addressLocality: "Augusta",
    addressRegion: "GA",
    postalCode: "30907",
    addressCountry: "US",
  },
  serviceType: [
    "Pickleball Court Construction",
    "Tennis Court Construction",
    "Basketball Court Construction",
    "Court Resurfacing",
    "Court Repair",
    "LED Lighting Installation",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Court Construction Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Pickleball Court Construction" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Tennis Court Construction" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Basketball Court Construction" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Court Resurfacing & Repair" } },
    ],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CourtPro Augusta",
  url: "https://www.courtproaugusta.com",
  publisher: { "@id": "https://www.courtproaugusta.com/#business" },
};

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="CourtPro Augusta | Pickleball & Tennis Court Builders in Augusta, GA"
        description="CourtPro Augusta builds and maintains pro-grade pickleball, tennis, and basketball courts in Augusta, GA and the CSRA. 200+ courts delivered. Laykold surfacing, LED lighting, and full turn-key service. Call (706) 309-1993."
      />
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={websiteSchema} />
      <Header />
      <main>
        <Hero />
        <RecentProjects />
        <BuildProcess />
        <CourtViewer />
        <Services />
        <Testimonials />
        <ProjectGallery />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />
      {/* <Chatbot /> replaced by LeadConnector widget */}
      <MobileFloatingCTA />
      <CookieBanner />
    </div>
  );
};

export default Index;
