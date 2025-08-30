import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Sign Up",
      description: "Create your account and add your boat and marina details."
    },
    {
      number: 2,
      title: "Select Plan",
      description: "Choose the service level that best fits your boating needs."
    },
    {
      number: 3,
      title: "Schedule Service",
      description: "Request pump-outs on your preferred days with our easy calendar."
    },
    {
      number: 4,
      title: "Enjoy Clean Boating",
      description: "Receive notifications when service is completed and enjoy your time on the water."
  ];

  return (
    <section className="py-16 bg-gray-50 wave-pattern">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1F3A] mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Get your boat serviced in just a few simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <Card key={step.number} className="bg-white rounded-lg shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#0B1F3A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl font-bold">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">{step.title}</h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Moved CTA buttons here for better mobile experience */}
        <div className="mt-12 flex flex-col items-center justify-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-[#FF6B6B] hover:bg-opacity-90 text-white px-8 py-3 h-auto rounded-md font-semibold transition duration-150 text-center w-full sm:w-auto"
              onClick={() => window.location.href = '/auth'}
            >
              Get Started
            </Button>
            
            <Button 
              className="bg-[#0B1F3A] hover:bg-opacity-90 text-white px-8 py-3 h-auto rounded-md font-semibold transition duration-150 text-center w-full sm:w-auto"
              onClick={() => window.location.href = '/services'}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
