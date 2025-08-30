import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { AuthModal } from "../auth/AuthModal";
import { ServiceLevel } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function ServiceLevels() {
  const { isLoggedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { data: serviceLevels, isLoading } = useQuery<ServiceLevel[]>({
    queryKey: ['/api/service-levels'],
  });

  const getFormattedPrice = (plan: ServiceLevel) => {
    if (plan.type === "one-time") return `${formatCurrency(plan.price)}/service`;
    if (plan.type === "monthly") return `${formatCurrency(plan.price)}/month`;
    if (plan.type === "seasonal") return `${formatCurrency(plan.price)}/season`;
    if (plan.type === "bulk") return `From ${formatCurrency(plan.basePrice || 0)}`;
    return formatCurrency(plan.price);
  };

  const handleChoosePlan = () => {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1F3A] mb-4">Our Service Levels</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose the perfect pump-out service plan for your boating needs. From single services to seasonal packages.
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-[#F4EBD0] rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 duration-300">
                <CardContent className="p-6 flex flex-col h-full animate-pulse">
                  <div className="h-7 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3 mb-6 flex-grow">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="h-5 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                  <div className="h-10 bg-gray-300 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {serviceLevels?.map((plan, index) => {
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
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="text-3xl font-bold text-[#0B1F3A] mb-4">
                      {getFormattedPrice(plan)}
                    </div>
                    <ul className="space-y-3 mb-6">
                      {[
                        { 
                          feature: plan.type === 'one-time' ? 'Single pump-out service' : 
                                 plan.type === 'monthly' ? `${plan.monthlyQuota} pump-outs per month` : 
                                 plan.type === 'seasonal' ? 'Unlimited pump-outs (May-Oct)' :
                                 plan.type === 'bulk' ? `${plan.baseQuantity} pump-outs included, then $${plan.pricePerAdditional}/additional` : 'Service included', 
                          included: true 
                        },
                        { 
                          feature: plan.name.toLowerCase().includes('multi') ? 'Boats with more than one head' : 'Single head boats only', 
                          included: true 
                        },
                        { feature: 'Service history & reporting', included: true },
                        { feature: plan.type !== 'one-time' ? 'Priority scheduling' : 'Standard scheduling', included: plan.type !== 'one-time' },
                      ].map((item, i) => (
                        <li key={i} className="flex items-start">
                          {item.included ? (
                            <Check className="text-[#0B1F3A] h-5 w-5 mt-1 mr-2" />
                          ) : (
                            <X className="text-gray-400 h-5 w-5 mt-1 mr-2" />
                          )}
                          <span className={item.included ? "text-black" : "text-gray-400"}>{item.feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${isPopular ? "bg-[#FF6B6B]" : "bg-[#0B1F3A]"} hover:bg-opacity-90 text-white py-2 rounded-md font-semibold transition duration-150`}
                      onClick={handleChoosePlan}
                    >
                      Choose Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </section>
  );
}
