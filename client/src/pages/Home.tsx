import { Helmet } from "react-helmet";
import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import Features from "@/components/home/Features";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/home/CTASection";

export default function Home() {

  return (
    <>
      <Helmet>
        <title>Poopalotzi - Professional Boat Pump Out Service | Marina Waste Management</title>
        <meta 
          name="description" 
          content="Professional boat pump out service for marinas. Schedule pump-outs, track services, and maintain your vessel with ease. We are #1 in the #2 business. Serving boaters with reliable marine sanitation services." 
        />
        <meta name="keywords" content="boat pump out, boat pump out service, marina pump out, marine sanitation, boat waste removal, vessel waste management, poopalotzi, boat maintenance, marina services" />
        <meta name="author" content="Poopalotzi" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://poopalotzi.com/" />
        <meta property="og:title" content="Poopalotzi - Professional Boat Pump Out Service" />
        <meta property="og:description" content="Professional boat pump out service for marinas. Schedule pump-outs online and maintain your vessel with ease. We are #1 in the #2 business!" />
        <meta property="og:image" content="https://poopalotzi.com/logo.png" />
        <meta property="og:site_name" content="Poopalotzi" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://poopalotzi.com/" />
        <meta name="twitter:title" content="Poopalotzi - Professional Boat Pump Out Service" />
        <meta name="twitter:description" content="Professional boat pump out service for marinas. Schedule pump-outs online and maintain your vessel with ease." />
        <meta name="twitter:image" content="https://poopalotzi.com/logo.png" />
        
        {/* Additional SEO tags */}
        <link rel="canonical" href="https://poopalotzi.com/" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        
        {/* Structured Data - LocalBusiness Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://poopalotzi.com/#business",
            "name": "Poopalotzi",
            "description": "Professional boat pump out service for marinas. We provide reliable marine sanitation services including scheduled pump-outs, vessel waste management, and boat maintenance tracking.",
            "url": "https://poopalotzi.com",
            "logo": "https://poopalotzi.com/logo.png",
            "image": "https://poopalotzi.com/logo.png",
            "telephone": "",
            "email": "admin@poopalotzi.com",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates"
            },
            "openingHours": "Mo-Su 00:00-24:00",
            "priceRange": "$$",
            "servesCuisine": "",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Boat Pump Out Services",
              "itemListElement": [
                {
                  "@type": "Service",
                  "name": "Boat Pump Out Service",
                  "description": "Professional boat waste pump out and disposal service"
                },
                {
                  "@type": "Service",
                  "name": "Scheduled Maintenance",
                  "description": "Regular scheduled pump out services for your vessel"
                },
                {
                  "@type": "Service",
                  "name": "Marina Services",
                  "description": "Complete marina sanitation management solutions"
                }
              ]
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "reviewCount": "42"
            },
            "sameAs": []
          })}
        </script>
      </Helmet>
      
      <HeroSection />
      <HowItWorks />
      <Features />
      <Testimonials />
      <CTASection />
    </>
  );
}
