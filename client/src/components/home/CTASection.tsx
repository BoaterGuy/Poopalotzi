import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { AuthModal } from "../auth/AuthModal";

export default function CTASection() {
  const { isLoggedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <section className="py-16 bg-[#F4EBD0]">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1F3A] mb-4">
              Ready to Simplify Your Boating Experience?
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of boat owners who trust Poopalazi for hassle-free pump-out services
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {isLoggedIn ? (
              <>
                <Link href="/member/request-service">
                  <Button className="bg-[#FF6B6B] hover:bg-opacity-90 text-white px-8 py-3 h-auto rounded-md font-semibold transition duration-150 text-lg w-full sm:w-auto">
                    Request Service
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button className="bg-[#38B2AC] hover:bg-opacity-90 text-white px-8 py-3 h-auto rounded-md font-semibold transition duration-150 text-lg w-full sm:w-auto">
                    Contact Support
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button 
                  className="bg-[#FF6B6B] hover:bg-opacity-90 text-white px-8 py-3 h-auto rounded-md font-semibold transition duration-150 text-lg w-full sm:w-auto"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Sign Up Now
                </Button>
                <Link href="/contact">
                  <Button className="bg-[#38B2AC] hover:bg-opacity-90 text-white px-8 py-3 h-auto rounded-md font-semibold transition duration-150 text-lg w-full sm:w-auto">
                    Contact Sales
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </section>
  );
}
