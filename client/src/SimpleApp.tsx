import React from "react";
import { Helmet } from "react-helmet";

// Basic React component that should work without complex hooks
const SimpleApp = () => {
  return (
    <>
      <Helmet>
        <title>Poopalotzi - Boat Pump-Out Management</title>
        <meta
          name="description"
          content="Schedule pump-outs, track services, and maintain your vessel with ease. The modern solution for boat owners."
        />
      </Helmet>

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
                <li><a href="/services" className="hover:opacity-80">Services</a></li>
                <li><a href="/about" className="hover:opacity-80">About</a></li>
                <li><a href="/contact" className="hover:opacity-80">Contact</a></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <div className="bg-gradient-to-r from-sky-100 to-blue-100 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-[#0B1F3A] mb-4">Professional Boat Pump-Out Services</h2>
              <p className="text-xl mb-8">Convenient, reliable pump-out services to keep your waterways clean.</p>
              <button className="bg-[#0B1F3A] text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition">
                Book a Service
              </button>
            </div>
          </div>
        </div>
        
        <section className="py-16 bg-white">
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
                <button className="w-full bg-[#0B1F3A] text-white py-2 rounded-md hover:bg-opacity-90 transition">
                  Get Started
                </button>
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
                <button className="w-full bg-[#0B1F3A] text-white py-2 rounded-md hover:bg-opacity-90 transition">
                  Subscribe
                </button>
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
                <button className="w-full bg-[#0B1F3A] text-white py-2 rounded-md hover:bg-opacity-90 transition">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-[#0B1F3A]">Service Areas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <h3 className="font-bold text-lg mb-2">Cedar Point</h3>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <h3 className="font-bold text-lg mb-2">Son Rise</h3>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <h3 className="font-bold text-lg mb-2">Port Clinton Yacht Club</h3>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <h3 className="font-bold text-lg mb-2">Craft Marine</h3>
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
                  Founded by Brian and Pam Griebel, who have years of boating experience including 
                  completing America's Great Loop on their boat "Take Five".
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Contact</h3>
                <address className="not-italic">
                  <p>711 W. Lakeshore Dr #402</p>
                  <p>Port Clinton, OH 43452-9311</p>
                  <p className="mt-2">Phone: 567-262-6270</p>
                  <p>Email: poopalotzillc@gmail.com</p>
                </address>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Links</h3>
                <ul className="space-y-2">
                  <li><a href="/" className="hover:underline">Home</a></li>
                  <li><a href="/services" className="hover:underline">Services</a></li>
                  <li><a href="/about" className="hover:underline">About Us</a></li>
                  <li><a href="/contact" className="hover:underline">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p>© {new Date().getFullYear()} Poopalotzi LLC. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SimpleApp;