import React from "react";

// Simple React component without complex dependencies
const SimpleAppWithLinks = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#0B1F3A] text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <h1 className="text-2xl font-bold mr-4">Poopalotzi</h1>
            <p className="text-sm">Marine Pump-Out Service</p>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="/" className="hover:opacity-80 font-semibold">Home</a></li>
              <li><a href="#services" className="hover:opacity-80">Services</a></li>
              <li><a href="#about" className="hover:opacity-80">About</a></li>
              <li><a href="#contact" className="hover:opacity-80">Contact</a></li>
              <li><a href="/member/boats" className="hover:opacity-80 text-yellow-300">Member Area</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <div className="bg-gradient-to-r from-sky-100 to-blue-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[#0B1F3A] mb-4">Professional Boat Pump-Out Services</h2>
            <p className="text-xl mb-8">Convenient, reliable pump-out services to keep your waterways clean.</p>
            <div className="space-x-4">
              <a href="/member/boats" className="bg-[#0B1F3A] text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition inline-block">
                Manage Your Boats
              </a>
              <a href="/member/request-service" className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition inline-block">
                Request Service
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#0B1F3A]">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-xl font-bold mb-4">Single Service</h3>
              <p className="text-gray-600 mb-4">One-time pump-out service for your boat.</p>
              <ul className="mb-8 space-y-2">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  No commitment
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Professional service
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Book when needed
                </li>
              </ul>
              <p className="text-2xl font-bold mb-2">$60<span className="text-sm font-normal"> single-head</span></p>
              <p className="text-2xl font-bold mb-6">$75<span className="text-sm font-normal"> multi-head</span></p>
              <a href="/member/subscription" className="block w-full text-center bg-[#0B1F3A] text-white py-2 rounded-md hover:bg-opacity-90 transition">
                Get Started
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 relative transform scale-105">
              <div className="absolute top-0 right-0 bg-[#0B1F3A] text-white text-xs font-bold py-1 px-3 rounded-tr-lg rounded-bl-lg">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-4">Monthly Plan</h3>
              <p className="text-gray-600 mb-4">Regular pump-out service for frequent boaters.</p>
              <ul className="mb-8 space-y-2">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Up to 2 pump-outs per month
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Priority scheduling
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Convenient monthly billing
                </li>
              </ul>
              <p className="text-2xl font-bold mb-2">$100<span className="text-sm font-normal"> single-head</span></p>
              <p className="text-2xl font-bold mb-6">$140<span className="text-sm font-normal"> multi-head</span></p>
              <a href="/member/subscription" className="block w-full text-center bg-[#0B1F3A] text-white py-2 rounded-md hover:bg-opacity-90 transition">
                Subscribe
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-xl font-bold mb-4">Seasonal Service</h3>
              <p className="text-gray-600 mb-4">Full season coverage for avid boaters.</p>
              <ul className="mb-8 space-y-2">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  2 pump-outs per month (May-Oct)
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  One free single service
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Best value for the season
                </li>
              </ul>
              <p className="text-2xl font-bold mb-2">$475<span className="text-sm font-normal"> single-head</span></p>
              <p className="text-2xl font-bold mb-6">$675<span className="text-sm font-normal"> multi-head</span></p>
              <a href="/member/subscription" className="block w-full text-center bg-[#0B1F3A] text-white py-2 rounded-md hover:bg-opacity-90 transition">
                Subscribe
              </a>
            </div>
          </div>
        </div>
      </section>
      
      <section id="about" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-[#0B1F3A]">About Poopalotzi</h2>
            <div className="bg-white rounded-lg shadow-md p-8">
              <p className="mb-4">Poopalotzi was founded by Brian and Pam Griebel, who bring years of boating experience to the business. Their journey includes completing America's Great Loop on their boat "Take Five", giving them firsthand understanding of the needs of boaters.</p>
              <p className="mb-4">Our mission is to provide convenient, reliable, and professional pump-out services that help keep our waterways clean while making boat maintenance hassle-free for owners.</p>
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 text-[#0B1F3A]">Service Areas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <h4 className="font-bold">Cedar Point</h4>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <h4 className="font-bold">Son Rise</h4>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <h4 className="font-bold">Port Clinton Yacht Club</h4>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <h4 className="font-bold">Craft Marine</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#0B1F3A]">Contact Us</h2>
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="p-8 md:w-1/2">
                <h3 className="text-xl font-bold mb-4">Get In Touch</h3>
                <div className="space-y-4">
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-[#0B1F3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    711 W. Lakeshore Dr #402<br />
                    Port Clinton, OH 43452-9311
                  </p>
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-[#0B1F3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    567-262-6270
                  </p>
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-[#0B1F3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    poopalotzillc@gmail.com
                  </p>
                </div>
              </div>
              <div className="p-8 bg-gray-50 md:w-1/2">
                <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/member/boats" className="text-[#0B1F3A] hover:underline flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      Manage Your Boats
                    </a>
                  </li>
                  <li>
                    <a href="/member/request-service" className="text-[#0B1F3A] hover:underline flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      Request Service
                    </a>
                  </li>
                  <li>
                    <a href="/member/service-history" className="text-[#0B1F3A] hover:underline flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      View Service History
                    </a>
                  </li>
                  <li>
                    <a href="/member/subscription" className="text-[#0B1F3A] hover:underline flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      Manage Subscription
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="bg-[#0B1F3A] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Poopalotzi</h3>
              <p className="mb-4">
                Professional boat pump-out services for marinas in Port Clinton, Ohio and surrounding areas.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Service Areas</h3>
              <ul className="space-y-2">
                <li>Cedar Point</li>
                <li>Son Rise</li>
                <li>Port Clinton Yacht Club</li>
                <li>Craft Marine</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Member Area</h3>
              <ul className="space-y-2">
                <li><a href="/member/boats" className="hover:underline">Manage Boats</a></li>
                <li><a href="/member/request-service" className="hover:underline">Request Service</a></li>
                <li><a href="/member/service-history" className="hover:underline">Service History</a></li>
                <li><a href="/member/subscription" className="hover:underline">Subscription</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p>© 2025 Poopalotzi LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleAppWithLinks;