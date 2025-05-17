// Simplified deployment script that works with Replit deployments
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module setup for getting directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Sample service data
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

// Detect the static directory
let staticPath = path.join(process.cwd(), 'dist', 'client');
if (!fs.existsSync(staticPath)) {
  staticPath = path.join(process.cwd(), 'dist');
}
if (!fs.existsSync(staticPath)) {
  staticPath = path.join(process.cwd(), 'public');
}

console.log(`Serving static files from: ${staticPath}`);
app.use(express.static(staticPath));

// API endpoints
app.get('/api/service-levels', (req, res) => {
  res.json(serviceLevels);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Default route handler
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback HTML if file doesn't exist
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Poopalotzi</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          :root {
            --primary: #0e7490;
            --primary-hover: #0c637a;
            --accent: #f59e0b;
            --accent-hover: #d97706;
            --radius: 8px;
          }
          body { 
            font-family: system-ui, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            line-height: 1.6;
            background-color: #f9fafb;
            color: #1f2937;
          }
          header { 
            background-color: var(--primary);
            color: white; 
            padding: 20px; 
            border-radius: var(--radius); 
            margin-bottom: 30px; 
            text-align: center;
          }
          h1 { margin-top: 0; }
          .service { 
            border: 1px solid #ddd; 
            padding: 20px; 
            margin-bottom: 20px; 
            border-radius: var(--radius);
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .price { 
            font-size: 24px; 
            font-weight: bold; 
            margin: 10px 0; 
            color: var(--primary);
          }
          .btn {
            display: inline-block;
            background: var(--accent);
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
          }
          .btn:hover {
            background: var(--accent-hover);
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
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;