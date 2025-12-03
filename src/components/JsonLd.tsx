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
  "@type": "HomeAndConstructionBusiness",
  "@id": "https://courtproaugusta.com/#business",
  name: "CourtPro Augusta",
  url: "https://courtproaugusta.com",
  telephone: "(706) 309-1993",
  email: "estimates@courtproaugusta.com",
  areaServed: [
    { "@type": "City", name: "Augusta", addressRegion: "GA" },
    { "@type": "City", name: "Evans", addressRegion: "GA" },
    { "@type": "City", name: "Martinez", addressRegion: "GA" },
    { "@type": "City", name: "Grovetown", addressRegion: "GA" },
    { "@type": "City", name: "North Augusta", addressRegion: "SC" },
    { "@type": "City", name: "Aiken", addressRegion: "SC" },
  ],
  sameAs: [
    "https://www.facebook.com/courtproaugusta",
    "https://www.instagram.com/courtproaugusta",
  ],
};
