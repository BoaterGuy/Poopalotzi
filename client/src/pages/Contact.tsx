import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock } from "react-icons/fa";
import { useState } from "react";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Define the specific marinas we want to display
  const marinas = [
    { id: 1, name: "Cedar Point" },
    { id: 2, name: "Son Rise" },
    { id: 3, name: "Port Clinton Yacht Club" },
    { id: 4, name: "Craft Marine" }
  ];

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    
    // In a real implementation, this would send the form data to the server
    // For now, we'll just simulate a successful submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "We've received your message and will get back to you soon.",
      });
      form.reset();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - Poopalotzi LLC</title>
        <meta 
          name="description" 
          content="Get in touch with the Poopalotzi LLC team for questions about our boat pump-out services, partnership opportunities, or customer support in the Port Clinton and Sandusky area." 
        />
      </Helmet>

      <div className="bg-[#F4EBD0] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-4">Contact Us</h1>
            <p className="text-lg text-gray-700">
              Have questions or need support? We're here to help!
            </p>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-[#0B1F3A] mb-6">Send Us a Message</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="How can we help you?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us what you need..." 
                            rows={5}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="bg-[#FF6B6B] hover:bg-opacity-90 w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-[#0B1F3A] mb-6">Contact Information</h2>
              
              <div className="bg-[#F4EBD0] rounded-lg p-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-[#0B1F3A] rounded-full p-3 text-white mr-4">
                      <FaMapMarkerAlt className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0B1F3A] mb-1">Our Office</h3>
                      <p className="text-gray-700">711 W. Lakeshore Dr #402<br />Port Clinton, OH 43452-9311</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#0B1F3A] rounded-full p-3 text-white mr-4">
                      <FaPhoneAlt className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0B1F3A] mb-1">Phone</h3>
                      <p className="text-gray-700">(567) 262-6270</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#0B1F3A] rounded-full p-3 text-white mr-4">
                      <FaEnvelope className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0B1F3A] mb-1">Email</h3>
                      <p className="text-gray-700">poopalotzillc@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#0B1F3A] rounded-full p-3 text-white mr-4">
                      <FaClock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0B1F3A] mb-1">Hours</h3>
                      <p className="text-gray-700">Monday - Friday: 9am - 5pm<br />Saturday & Sunday: By Appointment</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-[#0B1F3A] mb-4">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-[#0B1F3A]">How quickly can I expect a response?</h4>
                    <p className="text-gray-700">We typically respond to all inquiries within 24 business hours.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B1F3A]">Do you offer emergency services?</h4>
                    <p className="text-gray-700">Yes, for urgent situations please call our direct line for immediate assistance.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B1F3A]">Can I schedule a demonstration?</h4>
                    <p className="text-gray-700">Absolutely! Contact us to arrange a demonstration of our pump-out services at your marina.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-4">Our Service Areas</h2>
            <p className="text-gray-700 mb-8">
              Currently serving marinas in the Port Clinton and Sandusky area:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {marinas.map((marina) => (
                <div key={marina.id} className="bg-white p-4 rounded shadow-sm">
                  <h3 className="font-bold text-[#0B1F3A]">{marina.name}</h3>
                </div>
              ))}
            </div>
            
            <p className="mt-8 text-gray-700">
              Don't see your marina? Contact us to discuss expanding our service to your location!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
