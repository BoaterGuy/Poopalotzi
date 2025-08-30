import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },

  // Handle form submission with simple fetch
  const onSubmit = async (values: ContactFormValues) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(values),
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      
      toast({
        title: "Message Sent!",
        description: "We've received your message and will get back to you soon.",
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - Poopalotzi LLC</title>
        <meta 
          name="description" 
          content="Get in touch with the Poopalotzi LLC team for questions about our boat pump-out services, partnership opportunities, or customer support." 
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

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-6">Send us a message</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
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
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <FormControl>
                        <Input placeholder="What's this about?" {...field} />
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
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us how we can help you..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#1B5DB8] hover:bg-[#174ea0]"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-6">Get in touch</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#1B5DB8] rounded-lg flex items-center justify-center">
                  <FaMapMarkerAlt className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0B1F3A] mb-1">Our Location</h3>
                  <p className="text-gray-600">
                    Rhode Island<br />
                    Serving marinas throughout the region
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#1B5DB8] rounded-lg flex items-center justify-center">
                  <FaPhoneAlt className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0B1F3A] mb-1">Phone</h3>
                  <p className="text-gray-600">
                    Available for emergency services<br />
                    Contact us through the app for scheduling
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#1B5DB8] rounded-lg flex items-center justify-center">
                  <FaEnvelope className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0B1F3A] mb-1">Email</h3>
                  <p className="text-gray-600">
                    We'll respond to your message<br />
                    within 24 hours
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#1B5DB8] rounded-lg flex items-center justify-center">
                  <FaClock className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0B1F3A] mb-1">Service Hours</h3>
                  <p className="text-gray-600">
                    Monday - Friday: 8:00 AM - 6:00 PM<br />
                    Saturday: 9:00 AM - 4:00 PM<br />
                    Sunday: Emergency services only
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-[#0B1F3A] mb-3">Quick Questions?</h3>
              <p className="text-gray-600 text-sm mb-4">
                For immediate assistance with scheduling or existing services, 
                log into your account and use our in-app messaging system.
              </p>
              <Button 
                className="bg-[#1B5DB8] hover:bg-[#174ea0]"
                onClick={() => window.location.href = '/login'}
              >
                Go to Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
