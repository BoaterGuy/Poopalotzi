import React from 'react';

function TempApp() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#0B1F3A] text-white p-4">
        <h1 className="text-2xl font-bold">Poopalotzi</h1>
        <p className="text-sm">Marine Pump-Out Service</p>
      </header>
      
      <main className="container mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-400 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-2">Application Status</h2>
          <p>The application is currently experiencing technical difficulties. We're working to restore full functionality.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-[#0B1F3A]">About Poopalotzi</h2>
            <p className="mb-4">Poopalotzi provides professional marine pump-out services for boat owners. Founded by Brian and Pam Griebel, we bring years of boating experience to help keep our waterways clean.</p>
            <p>Our service areas include:</p>
            <ul className="list-disc list-inside mb-4 ml-4">
              <li>Cedar Point</li>
              <li>Son Rise</li>
              <li>Port Clinton Yacht Club</li>
              <li>Craft Marine</li>
            </ul>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-[#0B1F3A]">Our Services</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-semibold">Single Service</h3>
                <p className="text-sm text-gray-600">One-time pump-out service</p>
                <p className="mt-2">Starting at $60 for single-head boats</p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="font-semibold">Monthly Plan</h3>
                <p className="text-sm text-gray-600">Up to 2 pump-outs per month</p>
                <p className="mt-2">Starting at $100 for single-head boats</p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="font-semibold">Seasonal Service</h3>
                <p className="text-sm text-gray-600">2 pump-outs per month (May-Oct 31)</p>
                <p className="mt-2">Starting at $475 for single-head boats</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-100 p-6 mt-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-[#0B1F3A]">Contact Us</h3>
              <p>711 W. Lakeshore Dr #402</p>
              <p>Port Clinton, OH 43452-9311</p>
              <p>Phone: 567-262-6270</p>
              <p>Email: poopalotzillc@gmail.com</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">© {new Date().getFullYear()} Poopalotzi LLC. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default TempApp;