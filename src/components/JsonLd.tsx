import { useEffect } from "react";

interface JsonLdProps {
  data: Record<string, unknown>;
}

const JsonLd = ({ data }: JsonLdProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
};

export default JsonLd;

// Shared business data for consistent schema across pages
export const businessData = {
  "@type": "LocalBusiness",
  "@id": "https://www.courtproaugusta.com/#business",
  name: "CourtPro Augusta",
  url: "https://www.courtproaugusta.com",
  telephone: "(706) 309-1993",
  email: "estimates@courtproaugusta.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "500 Furys Ferry Rd. Suite 107",
    addressLocality: "Augusta",
    addressRegion: "GA",
    postalCode: "30907",
    addressCountry: "US",
  },
  areaServed: [
    "Augusta, GA",
    "Evans, GA",
    "Grovetown, GA",
    "Martinez, GA",
    "Aiken, SC",
    "North Augusta, SC",
  ],
  serviceType: [
    "Pickleball Court Construction",
    "Tennis Court Construction",
    "Basketball Court Construction",
    "Court Resurfacing",
    "Court Repair",
    "LED Lighting Installation",
  ],
  priceRange: "$$",
  sameAs: [
    "https://www.facebook.com/people/CourtPro-Augusta/61582961717793/",
    "https://www.instagram.com/courtpro_augusta/",
  ],
};
