import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "../auth/AuthModal";
import { useState } from "react";

export default function HeroSection() {
  const { isLoggedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <section className="relative wave-pattern bg-[#F4EBD0] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center md:space-x-12">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-4">
              Simplify Your Boat Maintenance
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              Schedule pump-outs, track services, and maintain your vessel with ease. The modern solution for boat owners.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {isLoggedIn ? (
                <Link href="/member/request-service">
                  <Button className="bg-[#FF6B6B] hover:bg-opacity-90 text-white px-6 py-3 h-auto rounded-md font-semibold transition duration-150 text-center">
                    Request Service
                  </Button>
                </Link>
              ) : (
                <Button
                  className="bg-[#FF6B6B] hover:bg-opacity-90 text-white px-6 py-3 h-auto rounded-md font-semibold transition duration-150 text-center"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Get Started
                </Button>
              )}
              
              <Link href="/services">
                <Button className="bg-[#0B1F3A] hover:bg-opacity-90 text-white px-6 py-3 h-auto rounded-md font-semibold transition duration-150 text-center">
                  Learn More
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-[#FF6B6B] italic">
                Let us take care of your business!
              </h2>
            </div>
          </div>
          <div className="md:w-1/2 flex flex-col items-center">
            <img 
              src="/src/assets/logo.png" 
              alt="Poopalotzi Logo" 
              className="rounded-lg shadow-xl w-2/3 h-auto mb-4"
            />
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-lg text-[#0B1F3A] font-semibold">Serving the Port Clinton and Sandusky area</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </section>
  );
}
