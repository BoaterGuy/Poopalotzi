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
            <title>Poopalotzi</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #0e7490; }
              .service { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
              .price { font-weight: bold; color: #0e7490; font-size: 18px; }
            </style>
          </head>
          <body>
            <h1>Poopalotzi</h1>
            <p>Professional Marina Pump-Out Services</p>
            
            <h2>Our Services</h2>
            <div id="services">
              <div class="service">
                <h3>Basic Pump-Out</h3>
                <p>One-time pump-out service</p>
                <p class="price">$49.95</p>
              </div>
              <div class="service">
                <h3>Monthly Plan</h3>
                <p>4 pump-outs per month</p>
                <p class="price">$149.95</p>
              </div>
              <div class="service">
                <h3>Seasonal Pass</h3>
                <p>Unlimited service April-October</p>
                <p class="price">$699.95</p>
              </div>
            </div>
            
            <p>This is the Poopalotzi API server.</p>
            <p>Available endpoints:</p>
            <ul>
              <li>/api/service-levels</li>
              <li>/api/marinas</li>
              <li>/api/boats</li>
            </ul>
            <p>Demo admin account: admin@poopalotzi.com / admin123</p>
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