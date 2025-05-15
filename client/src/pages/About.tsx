import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Ship, Anchor, Shield, Award, Users, Droplet } from "lucide-react";

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
      name: "Captain Michael Johnson",
      role: "Founder & CEO",
      bio: "With 20+ years of marine experience, Michael founded Poopalotzi to solve the challenges he experienced firsthand as a boat owner."
    },
    {
      name: "Sarah Williams",
      role: "Operations Director",
      bio: "Sarah oversees our service teams, ensuring every pump-out is completed efficiently and to our exacting standards."
    },
    {
      name: "Robert Chen",
      role: "Technology Officer",
      bio: "Robert leads our digital transformation, creating tools that make scheduling and managing services seamless."
    }
  ];

  return (
    <>
      <Helmet>
        <title>About Us - Poopalotzi</title>
        <meta 
          name="description" 
          content="Learn about Poopalotzi's mission to provide exceptional boat pump-out services while protecting our waterways and marine environment." 
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
              <h2 className="text-3xl font-bold text-[#0B1F3A] mb-4">Our Story</h2>
              <p className="text-gray-700 mb-4">
                Poopalazi was born out of necessity and passion for the marine environment. As boat owners ourselves, we experienced firsthand the challenges of managing waste disposal while enjoying time on the water. 
              </p>
              <p className="text-gray-700 mb-4">
                Founded in 2023, we set out to create a service that would not only make boat maintenance easier for owners but also contribute to cleaner, healthier waterways. Our team combined decades of marine experience with modern technology to create a solution that's as convenient as it is environmentally responsible.
              </p>
              <p className="text-gray-700">
                Today, we serve hundreds of boat owners across multiple marinas, providing reliable pump-out services that keep vessels compliant and comfortable. Our growing team remains committed to our founding vision: simplifying boat maintenance while protecting the waters we all love.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#0B1F3A] rounded-lg transform rotate-3"></div>
                <img 
                  src="https://images.unsplash.com/photo-1566847438217-76e82d383f84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Marina with boats" 
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
              These core principles guide everything we do at Poopalazi
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
              Meet the passionate people behind Poopalazi
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
