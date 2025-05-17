'use strict';

// Simple server for Poopalotzi
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Service data
const serviceLevels = [
  {
    id: 1,
    name: "Basic Pump-Out",
    description: "One-time pump-out service for single-head boats",
    priceInCents: 3500,
    serviceType: "one-time",
    serviceLevel: "single-head",
    isActive: true
  },
  {
    id: 2,
    name: "Premium Weekly",
    description: "Weekly scheduled pump-out service for multi-head boats",
    priceInCents: 12000,
    serviceType: "monthly",
    serviceLevel: "multi-head",
    isActive: true
  },
  {
    id: 3,
    name: "Seasonal Pass",
    description: "Unlimited pump-outs for the entire season",
    priceInCents: 75000,
    serviceType: "seasonal",
    serviceLevel: "multi-head",
    isActive: true
  }
];

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for service levels
app.get('/api/service-levels', (req, res) => {
  res.json(serviceLevels);
});

// Default route handler
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback inline HTML if file doesn't exist
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Poopalotzi</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .service { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
          .price { font-size: 20px; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Poopalotzi - Marina Pump-Out Services</h1>
        <div id="services">Loading services...</div>
        <script>
          fetch('/api/service-levels')
            .then(res => res.json())
            .then(services => {
              const container = document.getElementById('services');
              container.innerHTML = '';
              services.forEach(service => {
                const div = document.createElement('div');
                div.className = 'service';
                div.innerHTML = '<h2>' + service.name + '</h2>' +
                                '<p>' + service.description + '</p>' +
                                '<div class="price">$' + (service.priceInCents / 100).toFixed(2) + '</div>';
                container.appendChild(div);
              });
            })
            .catch(err => {
              document.getElementById('services').textContent = 'Error loading services';
              console.error(err);
            });
        </script>
      </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;