import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Ship, Anchor, Shield, Award, Users, Droplet } from "lucide-react";
import ownersBoatImage from "@/assets/owners-boat.gif";

export default function About() {
  const values = [
    {
      icon: <Shield className="h-8 w-8 mb-4 text-[#38B2AC]" />,
      title: "Environmental Responsibility",
      description: "We're committed to protecting our waterways by ensuring proper waste disposal and environmentally sound practices."
    },
    {
      icon: <Award className="h-8 w-8 mb-4 text-[#38B2AC]" />,
      title: "Service Excellence",
      description: "Our team is dedicated to providing reliable, professional service that exceeds expectations every time."
    },
    {
      icon: <Users className="h-8 w-8 mb-4 text-[#38B2AC]" />,
      title: "Community Focus",
      description: "We support the boating community through education, outreach, and partnerships with local marinas."
    },
    {
      icon: <Droplet className="h-8 w-8 mb-4 text-[#38B2AC]" />,
      title: "Clean Water Advocacy",
      description: "Beyond our services, we advocate for policies and practices that keep our waters clean for future generations."
    }
  ];

  const teamMembers = [
    {
      name: "Brian Griebel",
      role: "Founder & Co-Owner",
      bio: "Brian has been boating on Lake Erie since his high school years and recently completed America's Great Loop on the 'Take Five'. He brings his passion for boating to help fellow boat owners."
    },
    {
      name: "Pam Griebel",
      role: "Founder & Co-Owner",
      bio: "Pam shares a lifelong love for Lake Erie boating and co-piloted the 'Take Five' around America's Great Loop. She's committed to providing service that enhances everyone's boating experience."
    }
  ];

  return (
    <>
      <Helmet>
        <title>About Us - Poopalotzi</title>
        <meta 
          name="description" 
          content="Poopalotzi is a boat blackwater pump out service founded by Brian and Pam Griebel. We provide convenient, professional pump-out services to boaters in the Sandusky Boat Basin." 
        />
      </Helmet>

      <div className="bg-[#F4EBD0] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-4">About Poopalotzi</h1>
            <p className="text-lg text-gray-700">
              We're on a mission to keep boats clean and waterways cleaner
            </p>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-[#0B1F3A] mb-4">Ahoy!</h2>
              <p className="text-gray-700 mb-4">
                Welcome to Poopalotzi, a boat blackwater pump out service brought to you by Brian and Pam Griebel. We have enjoyed boating on Lake Erie since our high school years, and recently completed America's Great Loop on our boat, the Take Five.
              </p>
              <p className="text-gray-700 mb-4">
                On our trip we observed boat to boat pump out service in the southern ports we visited. We envisioned providing boaters in the Sandusky Boat Basin a similar, convenient and worry free process to pump out boat heads so you can enjoy your boating experience time to the fullest extent. Poopalotzi will provide pump out services Monday through Friday so you can enjoy your boat for the weekend, or have it "at the ready" for a weekday trip to the islands and beyond.
              </p>
              <p className="text-gray-700 mb-4">
                Skip waiting at the fuel docks, and take pumping out off of your list of "must do's" before or after a fun weekend. No more "missing the opportunity" due to business hours that do not match your schedule. Let us take care of your business!
              </p>
              <p className="text-gray-700">
                We provide one time, monthly, and seasonal service. Boaters do not need to be present at their boat. We will carefully and professionally pump out your boat. Call us to schedule your appointment or set up monthly services so you can enjoy your boat with family and friends.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#0B1F3A] rounded-lg transform rotate-3"></div>
                <img 
                  src={ownersBoatImage} 
                  alt="Brian and Pam Griebel on their boat, the Take Five" 
                  className="rounded-lg relative shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything we do at Poopalotzi
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                {value.icon}
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-4">Our Team</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Meet the passionate people behind Poopalotzi
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-[#F4EBD0] p-6 rounded-lg shadow-md">
                <div className="w-20 h-20 bg-[#0B1F3A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ship className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-1 text-center">{member.name}</h3>
                <p className="text-[#38B2AC] font-medium mb-3 text-center">{member.role}</p>
                <p className="text-gray-700 text-center">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-[#0B1F3A] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Anchor className="h-12 w-12 mx-auto mb-4 text-[#38B2AC]" />
            <h2 className="text-3xl font-bold mb-4">Join Our Crew</h2>
            <p className="text-lg mb-8">
              We're always looking for passionate individuals to join our team and help us provide exceptional service to boat owners while protecting our waterways.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/contact">
                <Button className="bg-[#FF6B6B] hover:bg-opacity-90 text-white px-6 py-3 h-auto rounded-md font-semibold transition duration-150">
                  Contact Us
                </Button>
              </Link>
              <Link href="/services">
                <Button className="bg-[#38B2AC] hover:bg-opacity-90 text-white px-6 py-3 h-auto rounded-md font-semibold transition duration-150">
                  Our Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
