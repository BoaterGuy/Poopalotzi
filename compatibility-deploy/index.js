// Simple CommonJS Express server for Poopalotzi
const express = require('express');
const path = require('path');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Service data - hardcoded to eliminate any database dependencies
const serviceLevels = [
  {
    id: 1,
    name: "Basic Pump-Out",
    description: "One-time pump-out service for single-head boats",
    priceInCents: 3500,
    serviceType: "one-time"
  },
  {
    id: 2,
    name: "Premium Weekly",
    description: "Weekly scheduled pump-out service for multi-head boats",
    priceInCents: 12000,
    serviceType: "monthly"
  },
  {
    id: 3,
    name: "Seasonal Pass",
    description: "Unlimited pump-outs for the entire season",
    priceInCents: 75000,
    serviceType: "seasonal"
  }
];

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint
app.get('/api/service-levels', (req, res) => {
  res.json(serviceLevels);
});

// Fallback HTML response for all routes
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Poopalotzi - Marina Services</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: system-ui, sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px;
          line-height: 1.6;
        }
        header { 
          background: #0e7490; 
          color: white; 
          padding: 20px; 
          border-radius: 8px; 
          margin-bottom: 30px; 
          text-align: center;
        }
        h1 { margin-top: 0; }
        .service { 
          border: 1px solid #ddd; 
          padding: 20px; 
          margin-bottom: 20px; 
          border-radius: 8px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .price { 
          font-size: 24px; 
          font-weight: bold; 
          margin: 10px 0; 
          color: #0e7490;
        }
        .btn {
          display: inline-block;
          background: #f59e0b;
          color: white;
          padding: 10px 15px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
        }
        footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>Poopalotzi</h1>
        <p>Professional Marina Pump-Out Services</p>
      </header>

      <main>
        <h2>Our Service Plans</h2>
        <div id="services">Loading services...</div>
      </main>

      <footer>
        <p>&copy; 2025 Poopalotzi. All rights reserved.</p>
      </footer>

      <script>
        // Simple function to format cents as dollars
        function formatPrice(cents) {
          return '$' + (cents/100).toFixed(2);
        }

        // Fetch and display services
        fetch('/api/service-levels')
          .then(function(response) { return response.json(); })
          .then(function(services) {
            var container = document.getElementById('services');
            container.innerHTML = '';
            
            services.forEach(function(service) {
              var serviceDiv = document.createElement('div');
              serviceDiv.className = 'service';
              
              serviceDiv.innerHTML = 
                '<h3>' + service.name + '</h3>' + 
                '<p>' + service.description + '</p>' +
                '<div class="price">' + formatPrice(service.priceInCents) + '</div>' +
                '<a href="#" class="btn">Book Now</a>';
              
              container.appendChild(serviceDiv);
            });
          })
          .catch(function(error) {
            console.error('Error:', error);
            document.getElementById('services').innerHTML = 
              '<p>Error loading services. Please try again later.</p>';
          });
      </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', function() {
  console.log('Server running on port ' + PORT);
});

// Export for deployment
module.exports = app;