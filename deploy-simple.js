// Simple deployment script for Poopalotzi
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage
const users = new Map();
const serviceLevels = new Map();
const marinas = new Map();
const boats = new Map();

// Setup authentication
async function initData() {
  console.log("Initializing demo data...");

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  users.set(1, {
    id: 1,
    email: 'admin@poopalotzi.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    passwordHash: adminPasswordHash,
    createdAt: new Date()
  });

  // Create service levels
  serviceLevels.set(1, {
    id: 1,
    name: "Basic Pump-Out",
    description: "One-time pump-out service",
    price: 4995,
    type: "one-time",
    serviceLevel: "single-head",
    isActive: true,
    createdAt: new Date()
  });

  serviceLevels.set(2, {
    id: 2,
    name: "Monthly Plan",
    description: "4 pump-outs per month",
    price: 14995,
    type: "monthly",
    serviceLevel: "single-head",
    isActive: true,
    createdAt: new Date()
  });

  serviceLevels.set(3, {
    id: 3,
    name: "Seasonal Pass",
    description: "Unlimited service April-October",
    price: 69995,
    type: "seasonal",
    serviceLevel: "multi-head",
    isActive: true,
    createdAt: new Date()
  });

  // Create marinas
  marinas.set(1, {
    id: 1,
    name: "Harbor Bay Marina",
    address: "123 Harbor Way, Bay Harbor, MI 49770",
    phone: "231-555-1234",
    isActive: true,
    createdAt: new Date()
  });

  marinas.set(2, {
    id: 2,
    name: "Sunset Point Marina",
    address: "789 Sunset Drive, Traverse City, MI 49684",
    phone: "231-555-6789",
    isActive: true,
    createdAt: new Date()
  });

  console.log("Demo data initialization complete!");
}

// Storage Interface
const storage = {
  getUser: (id) => users.get(Number(id)),
  getUserByEmail: (email) => Array.from(users.values()).find(u => u.email === email),
  getAllServiceLevels: () => Array.from(serviceLevels.values()),
  getAllMarinas: () => Array.from(marinas.values()),
  getBoat: (id) => boats.get(Number(id)),
  getBoatsByOwnerId: (ownerId) => Array.from(boats.values()).filter(b => b.ownerId === Number(ownerId)),
  createBoat: (boatData) => {
    const id = boats.size + 1;
    const newBoat = { ...boatData, id, createdAt: new Date() };
    boats.set(id, newBoat);
    return newBoat;
  },
  updateBoat: (id, boatData) => {
    const boat = boats.get(Number(id));
    if (!boat) return null;
    const updatedBoat = { ...boat, ...boatData };
    boats.set(Number(id), updatedBoat);
    return updatedBoat;
  }
};

// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API Routes
function setupRoutes() {
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const user = storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Create session and return user info
      const userInfo = { ...user };
      delete userInfo.passwordHash;
      
      res.json(userInfo);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/auth/me', (req, res) => {
    // For demo purposes, return unauthorized as we're not handling sessions
    res.status(401).json({ message: 'Unauthorized' });
  });

  // Service levels
  app.get('/api/service-levels', (req, res) => {
    res.json(storage.getAllServiceLevels());
  });

  // Marinas
  app.get('/api/marinas', (req, res) => {
    res.json(storage.getAllMarinas());
  });

  // Boats
  app.get('/api/boats', (req, res) => {
    const userId = 1; // Mock user ID for demo
    res.json(storage.getBoatsByOwnerId(userId));
  });

  app.post('/api/boats', (req, res) => {
    const newBoat = storage.createBoat({
      ...req.body,
      ownerId: 1 // Mock owner ID for demo
    });
    res.status(201).json(newBoat);
  });

  app.put('/api/boats/:id', (req, res) => {
    const updatedBoat = storage.updateBoat(req.params.id, req.body);
    if (!updatedBoat) {
      return res.status(404).json({ message: 'Boat not found' });
    }
    res.json(updatedBoat);
  });

  // Health check for deployment
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Serve static files if available
  const staticDir = path.join(__dirname, 'dist');
  if (require('fs').existsSync(staticDir)) {
    app.use(express.static(staticDir));
    
    // For any routes not handled by API, serve the single-page app
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  } else {
    // Basic landing page if no static files
    app.get('*', (req, res) => {
      res.send(`
        <html>
          <head>
            <title>Poopalotzi - Professional Pump-Out Services</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="description" content="Professional marina pump-out services for boat owners. Schedule on-demand or subscription pump-out services for your boat.">
            <style>
              body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
              header { text-align: center; margin-bottom: 2rem; }
              h1 { color: #0e7490; margin-bottom: 0.5rem; }
              h2 { color: #0e7490; border-bottom: 2px solid #0e7490; padding-bottom: 0.5rem; margin-top: 2rem; }
              .service { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
              .price { font-weight: bold; color: #0e7490; font-size: 20px; }
              .logo { max-width: 200px; margin: 0 auto; display: block; }
              .api-section { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 2rem; }
              @media (max-width: 600px) {
                body { padding: 15px; }
              }
            </style>
          </head>
          <body>
            <header>
              <img src="https://replit.s3.amazonaws.com/images/1747313657068_poopalotzi.jpg" alt="Poopalotzi Logo" class="logo">
              <h1>Poopalotzi</h1>
              <p>Professional Marina Pump-Out Services</p>
            </header>
            
            <h2>Our Services</h2>
            <div id="services">
              <div class="service">
                <h3>Basic Pump-Out</h3>
                <p>One-time pump-out service for your boat's holding tank.</p>
                <p class="price">$49.95</p>
              </div>
              <div class="service">
                <h3>Monthly Plan</h3>
                <p>4 pump-outs per month, perfect for regular boaters.</p>
                <p class="price">$149.95</p>
              </div>
              <div class="service">
                <h3>Seasonal Pass</h3>
                <p>Unlimited service April-October, best value for frequent boaters.</p>
                <p class="price">$699.95</p>
              </div>
            </div>
            
            <div class="api-section">
              <h2>API Information</h2>
              <p>This is the Poopalotzi API server. Available endpoints:</p>
              <ul>
                <li>/api/service-levels - View our service plans</li>
                <li>/api/marinas - List of partner marinas</li>
                <li>/api/boats - Manage your boats (requires authentication)</li>
              </ul>
              <p><strong>Demo admin account:</strong> admin@poopalotzi.com / admin123</p>
            </div>
          </body>
        </html>
      `);
    });
  }
}

// Start server
async function startServer() {
  try {
    await initData();
    setupRoutes();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Default admin user: admin@poopalotzi.com / admin123');
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();