import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RecentProjects from "@/components/RecentProjects";
import BuildProcess from "@/components/BuildProcess";
import CourtViewer from "@/components/CourtViewer";
import Services from "@/components/Services";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import CookieBanner from "@/components/CookieBanner";
import JsonLd, { businessData } from "@/components/JsonLd";

const localBusinessSchema = {
  "@context": "https://schema.org",
  ...businessData,
  description: "Professional sport court construction company serving Augusta, GA and the CSRA. We build custom pickleball, tennis, and basketball courts with post-tension concrete and Laykold surfacing.",
  priceRange: "$$$$",
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
  url: "https://courtproaugusta.com",
  publisher: { "@id": "https://courtproaugusta.com/#business" },
};

const Index = () => {
  return (
    <div className="min-h-screen">
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={websiteSchema} />
      <Header />
      <main>
        <Hero />
        <RecentProjects />
        <BuildProcess />
        <CourtViewer />
        <Services />
        <ContactForm />
      </main>
      <Footer />
      <Chatbot />
      <CookieBanner />
    </div>
  );
};

export default Index;
