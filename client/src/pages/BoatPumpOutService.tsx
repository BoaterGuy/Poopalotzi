import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Phone, Clock, Shield, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

export default function BoatPumpOutService() {
  const { isLoggedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Professional Boat Pump Out Service | Fast & Reliable Marina Sanitation</title>
        <meta 
          name="description" 
          content="Professional boat pump out service for marinas and boat owners. Fast, reliable, and environmentally compliant marine sanitation services. Schedule your pump-out today. We are #1 in the #2 business!" 
        />
        <meta name="keywords" content="boat pump out service, boat pump out, marina pump out, boat waste removal, marine sanitation, boat septic service, vessel waste management, pump out service near me, boat holding tank service" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://poopalotzi.com/boat-pump-out-service" />
        <meta property="og:title" content="Professional Boat Pump Out Service - Poopalotzi" />
        <meta property="og:description" content="Fast and reliable boat pump out service. Professional marine sanitation for all boat types. Schedule online today!" />
        <meta property="og:image" content="https://poopalotzi.com/logo.png" />
        
        <link rel="canonical" href="https://poopalotzi.com/boat-pump-out-service" />
        
        {/* Rich Snippet Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Professional Boat Pump Out Service",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Poopalotzi",
              "url": "https://poopalotzi.com",
              "logo": "https://poopalotzi.com/logo.png",
              "priceRange": "$$"
            },
            "description": "Professional boat pump out service providing fast, reliable marine sanitation services for boats and marinas. Our trained technicians handle all vessel waste management needs.",
            "areaServed": "United States",
            "serviceType": "Boat Pump Out",
            "availableChannel": {
              "@type": "ServiceChannel",
              "serviceUrl": "https://poopalotzi.com/boat-pump-out-service"
            }
          })}
        </script>
        
        {/* FAQ Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is a boat pump out service?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A boat pump out service removes waste from your boat's holding tank, ensuring proper sanitation and environmental compliance. Our professional technicians use specialized equipment to safely and efficiently pump out and dispose of boat waste."
                }
              },
              {
                "@type": "Question",
                "name": "How often should I pump out my boat?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Most recreational boats need a pump-out every 1-2 weeks during active use, depending on boat size, tank capacity, and usage. Regular pump-outs prevent odors and maintain your marine sanitation system."
                }
              },
              {
                "@type": "Question",
                "name": "How much does boat pump out service cost?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our boat pump out service starts at competitive rates with options for single service, monthly subscriptions, and seasonal packages. Visit our pricing page for detailed information on all service plans."
                }
              }
            ]
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#0B1F3A] to-[#1a3559] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Professional Boat Pump Out Service
            </h1>
            <p className="text-xl mb-8">
              Fast, Reliable, and Environmentally Compliant Marine Sanitation Services
            </p>
            <p className="text-lg mb-8 text-gray-200">
              Keep your vessel clean and compliant with our professional boat pump-out services. 
              We handle all types of boats and marine waste management needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Link to="/member/request-service">
                  <Button className="bg-[#FF6B6B] hover:bg-[#ff5555] text-white text-lg px-8 py-6">
                    Schedule Pump-Out Now
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="bg-[#FF6B6B] hover:bg-[#ff5555] text-white text-lg px-8 py-6"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Get Started Today
                </Button>
              )}
              <Link to="/services">
                <Button className="bg-white text-[#0B1F3A] hover:bg-gray-100 text-lg px-8 py-6">
                  View Pricing Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* What is Boat Pump Out Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8 text-center">
              What is a Boat Pump Out Service?
            </h2>
            <div className="prose max-w-none text-gray-700">
              <p className="text-lg mb-6">
                A boat pump out service is an essential marine maintenance service that removes waste from your boat's holding tank. 
                Our professional technicians use specialized pump-out equipment to safely extract and dispose of marine waste in an 
                environmentally responsible manner, ensuring your vessel stays clean and compliant with marine sanitation regulations.
              </p>
              <p className="text-lg mb-6">
                Regular pump-out services prevent:
              </p>
              <ul className="list-disc list-inside mb-6 space-y-2">
                <li>Unpleasant odors in your vessel</li>
                <li>Holding tank overflow and damage</li>
                <li>Environmental violations and fines</li>
                <li>Costly repairs to your marine sanitation system</li>
                <li>Health hazards for you and your passengers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-16 bg-[#F4EBD0]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-12 text-center">
            Why Choose Poopalotzi for Your Boat Pump Out Needs?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-white">
              <CardContent className="p-6">
                <Clock className="h-12 w-12 text-[#FF6B6B] mb-4" />
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-3">Fast & Reliable Service</h3>
                <p className="text-gray-700">
                  Quick response times and dependable service. We show up on time, every time, ensuring your boat is ready when you need it.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-[#FF6B6B] mb-4" />
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-3">Licensed & Insured</h3>
                <p className="text-gray-700">
                  Fully licensed and insured professionals handling your marine sanitation needs with care and expertise.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-6">
                <Calendar className="h-12 w-12 text-[#FF6B6B] mb-4" />
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-3">Flexible Scheduling</h3>
                <p className="text-gray-700">
                  Schedule one-time services or set up recurring pump-outs. Manage everything easily through our online platform.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Service Areas Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8 text-center">
              Our Boat Pump Out Service Process
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-[#FF6B6B] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">Schedule Your Service</h3>
                  <p className="text-gray-700">
                    Book online in minutes. Choose a time that works for your schedule, whether it's a one-time pump-out or recurring service.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-[#FF6B6B] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">Professional Pump-Out</h3>
                  <p className="text-gray-700">
                    Our certified technicians arrive with specialized equipment to safely and efficiently pump out your boat's holding tank.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-[#FF6B6B] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">Proper Waste Disposal</h3>
                  <p className="text-gray-700">
                    All waste is disposed of in compliance with environmental regulations, ensuring responsible marine sanitation.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-[#FF6B6B] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">Service Documentation</h3>
                  <p className="text-gray-700">
                    Receive detailed service records for your maintenance log, including date, time, and technician notes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Types of Boats Section */}
      <div className="py-16 bg-[#F4EBD0]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8 text-center">
              Boat Pump Out Service for All Vessel Types
            </h2>
            <p className="text-lg text-gray-700 mb-8 text-center">
              We service all types of boats and marine vessels:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-bold text-[#0B1F3A] mb-3">Recreational Boats</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="text-[#FF6B6B] h-5 w-5 mt-0.5 mr-2" />
                    <span>Sailboats & Yachts</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-[#FF6B6B] h-5 w-5 mt-0.5 mr-2" />
                    <span>Motor Boats & Cruisers</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-[#FF6B6B] h-5 w-5 mt-0.5 mr-2" />
                    <span>Houseboats</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-[#FF6B6B] h-5 w-5 mt-0.5 mr-2" />
                    <span>Catamarans</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-bold text-[#0B1F3A] mb-3">Commercial Vessels</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="text-[#FF6B6B] h-5 w-5 mt-0.5 mr-2" />
                    <span>Charter Boats</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-[#FF6B6B] h-5 w-5 mt-0.5 mr-2" />
                    <span>Tour Boats</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-[#FF6B6B] h-5 w-5 mt-0.5 mr-2" />
                    <span>Fishing Vessels</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-[#FF6B6B] h-5 w-5 mt-0.5 mr-2" />
                    <span>Work Boats</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-12 text-center">
              Frequently Asked Questions About Boat Pump Out Service
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-3">
                  What is a boat pump out service?
                </h3>
                <p className="text-gray-700">
                  A boat pump out service removes waste from your boat's holding tank, ensuring proper sanitation and environmental compliance. 
                  Our professional technicians use specialized equipment to safely and efficiently pump out and dispose of boat waste.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-3">
                  How often should I pump out my boat?
                </h3>
                <p className="text-gray-700">
                  Most recreational boats need a pump-out every 1-2 weeks during active use, depending on boat size, tank capacity, and usage. 
                  Regular pump-outs prevent odors and maintain your marine sanitation system.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-3">
                  How much does boat pump out service cost?
                </h3>
                <p className="text-gray-700">
                  Our boat pump out service starts at competitive rates with options for single service, monthly subscriptions, and seasonal packages. 
                  Visit our <Link to="/services" className="text-[#FF6B6B] hover:underline">pricing page</Link> for detailed information on all service plans.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-3">
                  Do you service all types of boats?
                </h3>
                <p className="text-gray-700">
                  Yes! We service all types of recreational and commercial vessels, from small sailboats to large yachts. 
                  Our technicians are equipped to handle various holding tank systems and boat configurations.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-3">
                  Can I schedule recurring pump-out services?
                </h3>
                <p className="text-gray-700">
                  Absolutely! We offer flexible scheduling options including weekly, bi-weekly, and monthly recurring services. 
                  Set it once and never worry about pump-outs again.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-3">
                  What areas do you service?
                </h3>
                <p className="text-gray-700">
                  We provide boat pump out services at multiple marinas and locations. 
                  <Link to="/contact" className="text-[#FF6B6B] hover:underline"> Contact us</Link> to find out if we service your marina.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-b from-[#0B1F3A] to-[#1a3559] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Schedule Your Boat Pump Out Service?
            </h2>
            <p className="text-xl mb-8">
              Join thousands of satisfied boaters who trust Poopalotzi for their marine sanitation needs.
            </p>
            <p className="text-lg mb-8 italic">
              "We are #1 in the #2 business!"
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Link to="/member/request-service">
                  <Button className="bg-[#FF6B6B] hover:bg-[#ff5555] text-white text-lg px-8 py-6">
                    Schedule Service Now
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="bg-[#FF6B6B] hover:bg-[#ff5555] text-white text-lg px-8 py-6"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Get Started Now
                </Button>
              )}
              <Link to="/contact">
                <Button className="bg-white text-[#0B1F3A] hover:bg-gray-100 text-lg px-8 py-6">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab="signup" />
    </>
  );
}