import { Card, CardContent } from "@/components/ui/card";
import { Star, StarHalf } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      rating: 5,
      quote: "Poopalotzi has transformed how I maintain my boat. The scheduling is effortless, and I love getting notifications when service is complete. Highly recommend!",
      name: "Michael Johnson",
      title: "Sailboat Owner"
    },
    {
      rating: 4.5,
      quote: "The seasonal plan is perfect for our family yacht. We no longer worry about waste management during our summer outings. The service crew is always professional and efficient.",
      name: "Sarah Williams",
      title: "Yacht Owner"
    },
    {
      rating: 5,
      quote: "As a marina manager, I've seen the difference Poopalotzi makes. Our boaters love the convenience, and our environment stays cleaner. It's a win-win solution.",
      name: "David Rodriguez",
      title: "Marina Manager"
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-current" />);

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="fill-current" />);

    return stars;
  };

  return (
    <section className="py-16 bg-[#0B1F3A] text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Boat Owners Say</h2>
          <div className="h-1 w-20 bg-[#38B2AC] mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="text-[#38B2AC] mr-2 flex">
                    {renderStars(testimonial.rating)}
                  </div>
                  <span className="font-semibold">{testimonial.rating.toFixed(1)}</span>
                </div>
                <p className="mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center text-gray-500">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-[#38B2AC]">{testimonial.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
