// Poopalotzi - Simple in-memory deployment version
const express = require('express');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage
const users = new Map();
const serviceLevels = new Map();
const marinas = new Map();

// Initialize demo data
async function initData() {
  console.log("Setting up demo data...");
  
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  users.set(1, {
    id: 1, 
    email: 'admin@poopalotzi.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    passwordHash
  });
  
  // Add service levels
  serviceLevels.set(1, {
    id: 1,
    name: "Basic Pump-Out",
    description: "One-time pump-out service",
    price: 4995,
    type: "one-time", 
    isActive: true
  });
  
  serviceLevels.set(2, {
    id: 2,
    name: "Monthly Subscription",
    description: "Unlimited pump-outs for the month",
    price: 14995,
    type: "monthly", 
    isActive: true
  });
  
  serviceLevels.set(3, {
    id: 3,
    name: "Seasonal Pass",
    description: "Unlimited pump-outs for the season (April-October)",
    price: 69995,
    type: "seasonal",
    isActive: true
  });
  
  // Add marinas
  marinas.set(1, {
    id: 1,
    name: "Harbor Bay Marina",
    address: "123 Harbor Way",
    city: "Bay Harbor",
    state: "MI",
    zipCode: "49770",
    isActive: true
  });
  
  marinas.set(2, {
    id: 2,
    name: "Sunset Point Marina",
    address: "789 Sunset Drive",
    city: "Traverse City",
    state: "MI",
    zipCode: "49684",
    isActive: true
  });
  
  console.log("Demo data initialized successfully!");
}

// Simple API
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// API Routes
app.get('/api/service-levels', (req, res) => {
  res.json(Array.from(serviceLevels.values()));
});

app.get('/api/marinas', (req, res) => {
  res.json(Array.from(marinas.values()));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'in-memory' });
});

// Serve static HTML for all other routes
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Poopalotzi - Marina Pump-Out Services</title>
      <style>
        body { 
          font-family: system-ui, sans-serif; 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 20px;
          line-height: 1.6;
          color: #333;
          background-color: #f9fafb;
        }
        header {
          background-color: #0e7490;
          color: white;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          text-align: center;
        }
        .services {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 2rem;
        }
        .service-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .price {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0e7490;
          margin: 1rem 0;
        }
        .btn {
          display: inline-block;
          background: #f59e0b;
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
        }
        .api-test {
          background: #f0f0f0;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 2rem;
        }
        code {
          background: #333;
          color: white;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
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
        <div class="services">
          <div class="service-card">
            <h3>Basic Pump-Out</h3>
            <p>One-time pump-out service for boats with a single holding tank.</p>
            <div class="price">$49.95</div>
            <a href="#" class="btn">Book Now</a>
          </div>
          
          <div class="service-card">
            <h3>Monthly Subscription</h3>
            <p>Unlimited pump-outs for the month. Perfect for frequent boaters.</p>
            <div class="price">$149.95</div>
            <a href="#" class="btn">Subscribe</a>
          </div>
          
          <div class="service-card">
            <h3>Seasonal Pass</h3>
            <p>Unlimited service for the entire boating season (April-October).</p>
            <div class="price">$699.95</div>
            <a href="#" class="btn">Get Season Pass</a>
          </div>
        </div>
        
        <div class="api-test">
          <h3>API Test Links</h3>
          <p>This is a simplified version of the Poopalotzi application with in-memory storage:</p>
          <ul>
            <li><a href="/api/service-levels">View Service Levels API</a></li>
            <li><a href="/api/marinas">View Marinas API</a></li>
            <li><a href="/health">Health Check API</a></li>
          </ul>
          <p>Default admin account: <code>admin@poopalotzi.com</code> / <code>admin123</code></p>
        </div>
      </main>
      
      <footer style="margin-top: 2rem; text-align: center; color: #666;">
        <p>&copy; 2025 Poopalotzi. All Rights Reserved.</p>
      </footer>
    </body>
    </html>
  `);
});

// Start the server
async function startServer() {
  try {
    await initData();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Default admin account: admin@poopalotzi.com / admin123`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();