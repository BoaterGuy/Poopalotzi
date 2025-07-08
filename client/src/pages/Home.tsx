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
        <title>Poopalotzi - Boat Pump-Out Management</title>
        <meta 
          name="description" 
          content="Schedule pump-outs, track services, and maintain your vessel with ease. The intelligent solution for the savvy boater." 
        />
      </Helmet>
      
      <HeroSection />
      <HowItWorks />
      <Features />
      <Testimonials />
      <CTASection />
    </>
  );
}
