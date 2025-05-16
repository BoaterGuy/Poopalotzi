import express, { Router } from 'express';
import path from 'path';

export const staticRouter = Router();

// Homepage route
staticRouter.get('/home', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
      <title>Poopalotzi - Boat Pump-Out Service</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#0B1F3A',
              }
            }
          }
        }
      </script>
      <style>
        body {
          font-family: 'Open Sans', sans-serif;
        }
        h1, h2, h3, h4 {
          font-family: 'Montserrat', sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="min-h-screen bg-white">
        <header class="bg-primary text-white p-4 shadow-md">
          <div class="container mx-auto flex flex-col md:flex-row items-center justify-between">
            <div class="flex items-center mb-4 md:mb-0">
              <h1 class="text-2xl font-bold mr-4">Poopalotzi</h1>
              <p class="text-sm">Marine Pump-Out Service</p>
            </div>
            <nav>
              <ul class="flex space-x-6">
                <li><a href="/home" class="hover:opacity-80 font-semibold">Home</a></li>
                <li><a href="/services" class="hover:opacity-80">Services</a></li>
                <li><a href="/about" class="hover:opacity-80">About</a></li>
                <li><a href="/contact" class="hover:opacity-80">Contact</a></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <div class="bg-gradient-to-r from-sky-100 to-blue-100 py-16">
          <div class="container mx-auto px-4">
            <div class="max-w-3xl mx-auto text-center">
              <h2 class="text-4xl font-bold text-primary mb-4">Professional Boat Pump-Out Services</h2>
              <p class="text-xl mb-8">Convenient, reliable pump-out services to keep your waterways clean.</p>
              <a href="/services" class="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition inline-block">
                View Our Services
              </a>
            </div>
          </div>
        </div>
        
        <section class="py-16 bg-white">
          <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-12 text-primary">Welcome to Poopalotzi</h2>
            <div class="max-w-3xl mx-auto">
              <p class="text-lg mb-6">Poopalotzi provides professional boat pump-out services at marinas in Port Clinton, Ohio and surrounding areas. We make maintaining your boat's sanitation system hassle-free while helping to keep our waterways clean.</p>
              
              <p class="text-lg mb-6">Founded by Brian and Pam Griebel, we bring years of boating experience to every service call. Our dedication to quality, reliability, and excellent customer service is what sets us apart.</p>
              
              <div class="mt-8 text-center">
                <a href="/services" class="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition inline-block">Explore Our Services</a>
              </div>
            </div>
          </div>
        </section>
        
        <footer class="bg-primary text-white py-8">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 class="text-xl font-bold mb-4">Poopalotzi</h3>
                <p class="mb-4">
                  Professional boat pump-out services for marinas in Port Clinton, Ohio and surrounding areas.
                </p>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Quick Links</h3>
                <ul class="space-y-2">
                  <li><a href="/home" class="hover:underline">Home</a></li>
                  <li><a href="/services" class="hover:underline">Services</a></li>
                  <li><a href="/about" class="hover:underline">About Us</a></li>
                  <li><a href="/contact" class="hover:underline">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Contact</h3>
                <p>
                  711 W. Lakeshore Dr #402<br>
                  Port Clinton, OH 43452-9311<br>
                  567-262-6270<br>
                  poopalotzillc@gmail.com
                </p>
              </div>
            </div>
            <div class="border-t border-gray-700 mt-8 pt-8 text-center">
              <p>© 2025 Poopalotzi LLC. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </body>
    </html>
  `);
});

// Services page
staticRouter.get('/services', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
      <title>Services - Poopalotzi</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#0B1F3A',
              }
            }
          }
        }
      </script>
      <style>
        body {
          font-family: 'Open Sans', sans-serif;
        }
        h1, h2, h3, h4 {
          font-family: 'Montserrat', sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="min-h-screen bg-white">
        <header class="bg-primary text-white p-4 shadow-md">
          <div class="container mx-auto flex flex-col md:flex-row items-center justify-between">
            <div class="flex items-center mb-4 md:mb-0">
              <h1 class="text-2xl font-bold mr-4">Poopalotzi</h1>
              <p class="text-sm">Marine Pump-Out Service</p>
            </div>
            <nav>
              <ul class="flex space-x-6">
                <li><a href="/home" class="hover:opacity-80">Home</a></li>
                <li><a href="/services" class="hover:opacity-80 font-semibold">Services</a></li>
                <li><a href="/about" class="hover:opacity-80">About</a></li>
                <li><a href="/contact" class="hover:opacity-80">Contact</a></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <div class="py-12 bg-gradient-to-r from-sky-100 to-blue-100">
          <div class="container mx-auto px-4">
            <h1 class="text-4xl font-bold text-center text-primary">Our Services</h1>
          </div>
        </div>
        
        <section class="py-16 bg-white">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h3 class="text-xl font-bold mb-4">Single Service</h3>
                <p class="text-gray-600 mb-4">One-time pump-out service for your boat.</p>
                <ul class="mb-8 space-y-2">
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    No commitment
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    Professional service
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    Book when needed
                  </li>
                </ul>
                <p class="text-2xl font-bold mb-2">$60<span class="text-sm font-normal"> single-head</span></p>
                <p class="text-2xl font-bold mb-6">$75<span class="text-sm font-normal"> multi-head</span></p>
                <button class="w-full bg-primary text-white py-2 rounded-md hover:bg-opacity-90 transition">
                  Get Started
                </button>
              </div>
              
              <div class="bg-white p-6 rounded-lg shadow-md border border-gray-100 relative transform scale-105">
                <div class="absolute top-0 right-0 bg-primary text-white text-xs font-bold py-1 px-3 rounded-tr-lg rounded-bl-lg">
                  POPULAR
                </div>
                <h3 class="text-xl font-bold mb-4">Monthly Plan</h3>
                <p class="text-gray-600 mb-4">Regular pump-out service for frequent boaters.</p>
                <ul class="mb-8 space-y-2">
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    Up to 2 pump-outs per month
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    Priority scheduling
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    Convenient monthly billing
                  </li>
                </ul>
                <p class="text-2xl font-bold mb-2">$100<span class="text-sm font-normal"> single-head</span></p>
                <p class="text-2xl font-bold mb-6">$140<span class="text-sm font-normal"> multi-head</span></p>
                <button class="w-full bg-primary text-white py-2 rounded-md hover:bg-opacity-90 transition">
                  Subscribe
                </button>
              </div>
              
              <div class="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h3 class="text-xl font-bold mb-4">Seasonal Service</h3>
                <p class="text-gray-600 mb-4">Full season coverage for avid boaters.</p>
                <ul class="mb-8 space-y-2">
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    2 pump-outs per month (May-Oct)
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    One free single service
                  </li>
                  <li class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    Best value for the season
                  </li>
                </ul>
                <p class="text-2xl font-bold mb-2">$475<span class="text-sm font-normal"> single-head</span></p>
                <p class="text-2xl font-bold mb-6">$675<span class="text-sm font-normal"> multi-head</span></p>
                <button class="w-full bg-primary text-white py-2 rounded-md hover:bg-opacity-90 transition">
                  Subscribe
                </button>
              </div>
            </div>
            
            <div class="mt-16 max-w-3xl mx-auto">
              <h2 class="text-2xl font-bold mb-6 text-primary">Service Comparison</h2>
              <div class="overflow-x-auto">
                <table class="w-full bg-white rounded-lg shadow">
                  <thead class="bg-primary text-white">
                    <tr>
                      <th class="py-3 px-4 text-left">Feature</th>
                      <th class="py-3 px-4 text-center">Single Service</th>
                      <th class="py-3 px-4 text-center">Monthly Plan</th>
                      <th class="py-3 px-4 text-center">Seasonal Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b">
                      <td class="py-3 px-4 font-medium">Number of Pump-Outs</td>
                      <td class="py-3 px-4 text-center">1</td>
                      <td class="py-3 px-4 text-center">Up to 2 per month</td>
                      <td class="py-3 px-4 text-center">2 per month + 1 extra</td>
                    </tr>
                    <tr class="border-b">
                      <td class="py-3 px-4 font-medium">Commitment</td>
                      <td class="py-3 px-4 text-center">None</td>
                      <td class="py-3 px-4 text-center">Monthly</td>
                      <td class="py-3 px-4 text-center">Seasonal (May-Oct)</td>
                    </tr>
                    <tr class="border-b">
                      <td class="py-3 px-4 font-medium">Scheduling Priority</td>
                      <td class="py-3 px-4 text-center">Standard</td>
                      <td class="py-3 px-4 text-center">Priority</td>
                      <td class="py-3 px-4 text-center">Highest Priority</td>
                    </tr>
                    <tr>
                      <td class="py-3 px-4 font-medium">Single-Head Price</td>
                      <td class="py-3 px-4 text-center">$60</td>
                      <td class="py-3 px-4 text-center">$100/month</td>
                      <td class="py-3 px-4 text-center">$475/season</td>
                    </tr>
                    <tr>
                      <td class="py-3 px-4 font-medium">Multi-Head Price</td>
                      <td class="py-3 px-4 text-center">$75</td>
                      <td class="py-3 px-4 text-center">$140/month</td>
                      <td class="py-3 px-4 text-center">$675/season</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
        
        <footer class="bg-primary text-white py-8">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 class="text-xl font-bold mb-4">Poopalotzi</h3>
                <p class="mb-4">
                  Professional boat pump-out services for marinas in Port Clinton, Ohio and surrounding areas.
                </p>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Quick Links</h3>
                <ul class="space-y-2">
                  <li><a href="/home" class="hover:underline">Home</a></li>
                  <li><a href="/services" class="hover:underline">Services</a></li>
                  <li><a href="/about" class="hover:underline">About Us</a></li>
                  <li><a href="/contact" class="hover:underline">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Contact</h3>
                <p>
                  711 W. Lakeshore Dr #402<br>
                  Port Clinton, OH 43452-9311<br>
                  567-262-6270<br>
                  poopalotzillc@gmail.com
                </p>
              </div>
            </div>
            <div class="border-t border-gray-700 mt-8 pt-8 text-center">
              <p>© 2025 Poopalotzi LLC. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </body>
    </html>
  `);
});

// About page
staticRouter.get('/about', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
      <title>About Us - Poopalotzi</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#0B1F3A',
              }
            }
          }
        }
      </script>
      <style>
        body {
          font-family: 'Open Sans', sans-serif;
        }
        h1, h2, h3, h4 {
          font-family: 'Montserrat', sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="min-h-screen bg-white">
        <header class="bg-primary text-white p-4 shadow-md">
          <div class="container mx-auto flex flex-col md:flex-row items-center justify-between">
            <div class="flex items-center mb-4 md:mb-0">
              <h1 class="text-2xl font-bold mr-4">Poopalotzi</h1>
              <p class="text-sm">Marine Pump-Out Service</p>
            </div>
            <nav>
              <ul class="flex space-x-6">
                <li><a href="/home" class="hover:opacity-80">Home</a></li>
                <li><a href="/services" class="hover:opacity-80">Services</a></li>
                <li><a href="/about" class="hover:opacity-80 font-semibold">About</a></li>
                <li><a href="/contact" class="hover:opacity-80">Contact</a></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <div class="py-12 bg-gradient-to-r from-sky-100 to-blue-100">
          <div class="container mx-auto px-4">
            <h1 class="text-4xl font-bold text-center text-primary">About Poopalotzi</h1>
          </div>
        </div>
        
        <section class="py-16 bg-white">
          <div class="container mx-auto px-4">
            <div class="max-w-4xl mx-auto">
              <div class="bg-white rounded-lg shadow-md p-8">
                <h2 class="text-2xl font-bold mb-6 text-primary">Our Story</h2>
                
                <p class="mb-4">Poopalotzi was founded by Brian and Pam Griebel, who bring years of boating experience to the business. Their journey includes completing America's Great Loop on their boat "Take Five", giving them firsthand understanding of the needs of boaters.</p>
                
                <p class="mb-4">Having experienced the challenges of managing boat waste systems themselves, they recognized a need for reliable, professional pump-out services in the Port Clinton area. This led to the creation of Poopalotzi, dedicated to providing hassle-free pump-out services while helping to protect our waterways.</p>
                
                <p class="mb-8">Our mission is to provide convenient, reliable, and professional pump-out services that help keep our waterways clean while making boat maintenance hassle-free for owners.</p>
                
                <h2 class="text-2xl font-bold mb-6 text-primary">Why Choose Poopalotzi?</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div class="bg-gray-50 p-6 rounded-lg">
                    <h3 class="text-xl font-semibold mb-3 text-primary">Experience</h3>
                    <p>We are boaters ourselves and understand the unique needs and challenges of boat maintenance.</p>
                  </div>
                  
                  <div class="bg-gray-50 p-6 rounded-lg">
                    <h3 class="text-xl font-semibold mb-3 text-primary">Reliability</h3>
                    <p>Count on us to show up when scheduled and to perform each service with professionalism and care.</p>
                  </div>
                  
                  <div class="bg-gray-50 p-6 rounded-lg">
                    <h3 class="text-xl font-semibold mb-3 text-primary">Convenience</h3>
                    <p>Our service comes to you, saving you time and ensuring your boat's waste system is properly maintained.</p>
                  </div>
                  
                  <div class="bg-gray-50 p-6 rounded-lg">
                    <h3 class="text-xl font-semibold mb-3 text-primary">Environmental Commitment</h3>
                    <p>We're dedicated to keeping our local waterways clean through proper waste disposal practices.</p>
                  </div>
                </div>
                
                <h2 class="text-2xl font-bold mb-6 text-primary">Service Areas</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div class="bg-gray-50 p-4 rounded-md text-center">
                    <h4 class="font-bold">Cedar Point</h4>
                  </div>
                  <div class="bg-gray-50 p-4 rounded-md text-center">
                    <h4 class="font-bold">Son Rise</h4>
                  </div>
                  <div class="bg-gray-50 p-4 rounded-md text-center">
                    <h4 class="font-bold">Port Clinton Yacht Club</h4>
                  </div>
                  <div class="bg-gray-50 p-4 rounded-md text-center">
                    <h4 class="font-bold">Craft Marine</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <footer class="bg-primary text-white py-8">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 class="text-xl font-bold mb-4">Poopalotzi</h3>
                <p class="mb-4">
                  Professional boat pump-out services for marinas in Port Clinton, Ohio and surrounding areas.
                </p>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Quick Links</h3>
                <ul class="space-y-2">
                  <li><a href="/home" class="hover:underline">Home</a></li>
                  <li><a href="/services" class="hover:underline">Services</a></li>
                  <li><a href="/about" class="hover:underline">About Us</a></li>
                  <li><a href="/contact" class="hover:underline">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Contact</h3>
                <p>
                  711 W. Lakeshore Dr #402<br>
                  Port Clinton, OH 43452-9311<br>
                  567-262-6270<br>
                  poopalotzillc@gmail.com
                </p>
              </div>
            </div>
            <div class="border-t border-gray-700 mt-8 pt-8 text-center">
              <p>© 2025 Poopalotzi LLC. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </body>
    </html>
  `);
});

// Contact page
staticRouter.get('/contact', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
      <title>Contact Us - Poopalotzi</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#0B1F3A',
              }
            }
          }
        }
      </script>
      <style>
        body {
          font-family: 'Open Sans', sans-serif;
        }
        h1, h2, h3, h4 {
          font-family: 'Montserrat', sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="min-h-screen bg-white">
        <header class="bg-primary text-white p-4 shadow-md">
          <div class="container mx-auto flex flex-col md:flex-row items-center justify-between">
            <div class="flex items-center mb-4 md:mb-0">
              <h1 class="text-2xl font-bold mr-4">Poopalotzi</h1>
              <p class="text-sm">Marine Pump-Out Service</p>
            </div>
            <nav>
              <ul class="flex space-x-6">
                <li><a href="/home" class="hover:opacity-80">Home</a></li>
                <li><a href="/services" class="hover:opacity-80">Services</a></li>
                <li><a href="/about" class="hover:opacity-80">About</a></li>
                <li><a href="/contact" class="hover:opacity-80 font-semibold">Contact</a></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <div class="py-12 bg-gradient-to-r from-sky-100 to-blue-100">
          <div class="container mx-auto px-4">
            <h1 class="text-4xl font-bold text-center text-primary">Contact Us</h1>
          </div>
        </div>
        
        <section class="py-16 bg-white">
          <div class="container mx-auto px-4">
            <div class="max-w-5xl mx-auto">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white rounded-lg shadow-md p-8">
                  <h2 class="text-2xl font-bold mb-6 text-primary">Get In Touch</h2>
                  
                  <div class="space-y-6">
                    <div>
                      <div class="flex items-center mb-3">
                        <svg class="w-6 h-6 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <h3 class="text-lg font-semibold">Address</h3>
                      </div>
                      <p class="ml-9">
                        711 W. Lakeshore Dr #402<br>
                        Port Clinton, OH 43452-9311
                      </p>
                    </div>
                    
                    <div>
                      <div class="flex items-center mb-3">
                        <svg class="w-6 h-6 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <h3 class="text-lg font-semibold">Phone</h3>
                      </div>
                      <p class="ml-9">567-262-6270</p>
                    </div>
                    
                    <div>
                      <div class="flex items-center mb-3">
                        <svg class="w-6 h-6 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <h3 class="text-lg font-semibold">Email</h3>
                      </div>
                      <p class="ml-9">poopalotzillc@gmail.com</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-md p-8">
                  <h2 class="text-2xl font-bold mb-6 text-primary">Business Hours</h2>
                  
                  <div class="space-y-4">
                    <div class="flex justify-between border-b pb-3">
                      <span class="font-medium">Monday - Friday:</span>
                      <span>8:00 AM - 5:00 PM</span>
                    </div>
                    <div class="flex justify-between border-b pb-3">
                      <span class="font-medium">Saturday:</span>
                      <span>9:00 AM - 4:00 PM</span>
                    </div>
                    <div class="flex justify-between pb-3">
                      <span class="font-medium">Sunday:</span>
                      <span>By appointment</span>
                    </div>
                  </div>
                  
                  <div class="mt-8">
                    <h3 class="text-lg font-semibold mb-4 text-primary">Service Areas</h3>
                    <div class="grid grid-cols-2 gap-3">
                      <div class="bg-gray-50 p-3 rounded-md text-center">
                        <p class="font-medium">Cedar Point</p>
                      </div>
                      <div class="bg-gray-50 p-3 rounded-md text-center">
                        <p class="font-medium">Son Rise</p>
                      </div>
                      <div class="bg-gray-50 p-3 rounded-md text-center">
                        <p class="font-medium">Port Clinton Yacht Club</p>
                      </div>
                      <div class="bg-gray-50 p-3 rounded-md text-center">
                        <p class="font-medium">Craft Marine</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <footer class="bg-primary text-white py-8">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 class="text-xl font-bold mb-4">Poopalotzi</h3>
                <p class="mb-4">
                  Professional boat pump-out services for marinas in Port Clinton, Ohio and surrounding areas.
                </p>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Quick Links</h3>
                <ul class="space-y-2">
                  <li><a href="/home" class="hover:underline">Home</a></li>
                  <li><a href="/services" class="hover:underline">Services</a></li>
                  <li><a href="/about" class="hover:underline">About Us</a></li>
                  <li><a href="/contact" class="hover:underline">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4">Contact</h3>
                <p>
                  711 W. Lakeshore Dr #402<br>
                  Port Clinton, OH 43452-9311<br>
                  567-262-6270<br>
                  poopalotzillc@gmail.com
                </p>
              </div>
            </div>
            <div class="border-t border-gray-700 mt-8 pt-8 text-center">
              <p>© 2025 Poopalotzi LLC. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </body>
    </html>
  `);
});

// Redirect root to home
staticRouter.get('/', (req, res) => {
  res.redirect('/home');
});