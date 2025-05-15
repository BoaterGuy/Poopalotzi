import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ServiceLevel } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

export default function Services() {
  const { isLoggedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const { data: serviceLevels, isLoading } = useQuery<ServiceLevel[]>({
    queryKey: ['/api/service-levels'],
  });

  const getFormattedPrice = (price: number, type: string) => {
    if (type === "one-time") return `${formatCurrency(price)}/service`;
    if (type === "monthly") return `${formatCurrency(price)}/month`;
    if (type === "seasonal") return `${formatCurrency(price)}/season`;
    return formatCurrency(price);
  };

  return (
    <>
      <Helmet>
        <title>Our Services - Poopalotzi</title>
        <meta 
          name="description" 
          content="Explore our boat pump-out service plans. From single services to seasonal packages for all your boating needs." 
        />
      </Helmet>

      <div className="bg-[#F4EBD0] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-4">Our Service Plans</h1>
            <p className="text-lg text-gray-700 mb-4">
              Find the perfect pump-out service plan tailored to your boating lifestyle
            </p>
            <p className="text-gray-600">
              Whether you're an occasional boater or a seasoned sailor, we have options to keep your vessel clean and environmentally compliant all season long.
            </p>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8 text-center">Compare Our Plans</h2>
            
            {isLoading ? (
              <div className="grid gap-8 md:grid-cols-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-8">
                    <div className="h-7 bg-gray-300 rounded w-1/2 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
                    <div className="h-10 bg-gray-300 rounded w-2/3 mb-6"></div>
                    <div className="space-y-3 mb-8">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex">
                          <div className="h-5 w-5 bg-gray-300 rounded-full mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {serviceLevels?.map((plan) => {
                  const isPopular = plan.name === "Standard";
                  return (
                    <Card 
                      key={plan.id}
                      className={`bg-[#F4EBD0] rounded-lg shadow-md overflow-hidden ${
                        isPopular ? "transform scale-105 border-2 border-[#0B1F3A]" : "transition-transform hover:scale-105 duration-300"
                      }`}
                    >
                      {isPopular && (
                        <div className="bg-[#0B1F3A] text-white text-center py-2">
                          <span className="font-semibold">Most Popular</span>
                        </div>
                      )}
                      <CardContent className="p-6 flex flex-col h-full">
                        <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">{plan.name}</h3>
                        <p className="text-gray-600 mb-2 min-h-[50px]">{plan.description || (plan.type === 'one-time' ? 'Pay per service' : plan.type === 'monthly' ? 'Monthly subscription' : 'Seasonal coverage')}</p>
                        <div className="h-[65px] flex items-center justify-center mb-4">
                          <div className="text-center">
                            <span className="text-3xl font-bold text-[#0B1F3A]">{formatCurrency(plan.price)}</span>
                            <span className="text-lg text-gray-600">/{plan.type === 'one-time' ? 'service' : plan.type === 'monthly' ? 'month' : 'season'}</span>
                          </div>
                        </div>
                        <ul className="space-y-3 min-h-[180px]">
                          <li className="flex items-start">
                            <Check className="text-[#0B1F3A] h-5 w-5 mt-1 mr-2" />
                            <span className="text-black">
                              {plan.type === 'one-time' ? 'Single service pump-out' : 
                               plan.type === 'monthly' ? `Up to ${plan.monthlyQuota} pump-outs per month` : 
                               'Unlimited pump-outs (May-Oct)'}
                            </span>
                          </li>
                          <li className="flex items-start">
                            <Check className="text-[#0B1F3A] h-5 w-5 mt-1 mr-2" />
                            <span className="text-black">
                              {plan.headCount === 1 ? 'Single head vessels only' : 
                               `Multi-head vessels (up to ${plan.headCount})`}
                            </span>
                          </li>
                          <li className="flex items-start">
                            <Check className="text-[#0B1F3A] h-5 w-5 mt-1 mr-2" />
                            <span className="text-black">Email notifications</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="text-[#0B1F3A] h-5 w-5 mt-1 mr-2" />
                            <span className="text-black">Service history & documentation</span>
                          </li>
                          <li className="flex items-start">
                            {plan.type !== 'one-time' ? (
                              <>
                                <Check className="text-[#0B1F3A] h-5 w-5 mt-1 mr-2" />
                                <span className="text-black">Priority scheduling</span>
                              </>
                            ) : (
                              <>
                                <X className="text-gray-400 h-5 w-5 mt-1 mr-2" />
                                <span className="text-gray-400">Priority scheduling</span>
                              </>
                            )}
                          </li>
                        </ul>
                        <div className="mt-auto">
                          {isLoggedIn ? (
                            <Link href="/member/request-service">
                              <Button 
                                className={`w-full ${isPopular ? "bg-[#FF6B6B]" : "bg-[#0B1F3A]"} hover:bg-opacity-90 text-white py-2 rounded-md font-semibold transition duration-150`}
                              >
                                Select Plan
                              </Button>
                            </Link>
                          ) : (
                            <Button 
                              className={`w-full ${isPopular ? "bg-[#FF6B6B]" : "bg-[#0B1F3A]"} hover:bg-opacity-90 text-white py-2 rounded-md font-semibold transition duration-150`}
                              onClick={() => setAuthModalOpen(true)}
                            >
                              Get Started
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-bold text-[#0B1F3A] mb-4">Need a Custom Solution?</h2>
              <p className="text-gray-600 mb-6">
                For marinas, yacht clubs, or special needs, contact us for a tailored plan that fits your requirements.
              </p>
              <Link href="/contact">
                <Button className="bg-[#0B1F3A] hover:bg-opacity-90 text-white">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#0B1F3A] py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6 text-left">
              <div>
                <h3 className="text-xl font-bold mb-2">What is a pump-out service?</h3>
                <p className="text-gray-300">
                  A pump-out service safely removes waste from your boat's holding tank, helping you maintain environmental compliance and a clean, odor-free vessel.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">How often should I get a pump-out?</h3>
                <p className="text-gray-300">
                  This depends on your boat size, tank capacity, and usage. Most recreational boats need a pump-out every 1-2 weeks during active use.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Can I schedule recurring services?</h3>
                <p className="text-gray-300">
                  Yes! Our monthly and seasonal plans include the ability to set up recurring appointments at your preferred schedule.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">What if I need to cancel a scheduled service?</h3>
                <p className="text-gray-300">
                  You can cancel or reschedule through your account up to the day before your service without any penalty.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab="signup" />
    </>
  );
}
