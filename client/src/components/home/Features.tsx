import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, Bell, CreditCard, History, Smartphone, Headset 
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Easy Scheduling",
      description: "Book your pump-out services with our intuitive calendar interface. Set recurring appointments or one-time services."
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: "Real-time Notifications",
      description: "Stay informed with email alerts about schedule changes, service completions, and important updates."
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Secure Payments",
      description: "Process payments safely through our integrated Clover payment system with detailed service billing."
    },
    {
      icon: <History className="h-8 w-8" />,
      title: "Service History",
      description: "Track all past services with detailed logs, including photos and technician notes for complete documentation."
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile Friendly",
      description: "Access your account from anywhere with our responsive Progressive Web App that works on all devices."
    },
    {
      icon: <Headset className="h-8 w-8" />,
      title: "Dedicated Support",
      description: "Get help when you need it with our responsive customer support team available through the app."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1F3A] mb-4">Key Features</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover why boat owners trust Poopalotzi for their maintenance needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-[#F4EBD0] rounded-lg h-full">
              <CardContent className="p-6">
                <div className="text-[#38B2AC] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">{feature.title}</h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
