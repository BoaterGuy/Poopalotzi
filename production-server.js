// Production server with in-memory storage
// This is a simplified version designed for reliable deployment
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Setup constants
const app = express();
const PORT = process.env.PORT || 5000;

// In-memory database for reliable deployment
const users = new Map();
const serviceLevels = new Map();
const marinas = new Map();

// Initialize with demo data
async function initDemoData() {
  console.log("Initializing with in-memory demo data");
  
  // Create default admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  users.set(1, {
    id: 1,
    email: 'admin@poopalotzi.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    passwordHash,
    createdAt: new Date()
  });
  
  // Add service levels
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
    name: "Monthly Subscription",
    description: "Unlimited pump-outs for the month",
    price: 14995,
    type: "monthly",
    serviceLevel: "single-head",
    isActive: true,
    createdAt: new Date()
  });
  
  serviceLevels.set(3, {
    id: 3,
    name: "Seasonal Pass",
    description: "Unlimited pump-outs for the season (April-October)",
    price: 69995,
    type: "seasonal",
    serviceLevel: "multi-head",
    isActive: true,
    createdAt: new Date()
  });
  
  // Add marinas
  marinas.set(1, {
    id: 1,
    name: "Harbor Bay Marina",
    address: "123 Harbor Way",
    city: "Bay Harbor",
    state: "MI",
    zipCode: "49770",
    phone: "231-555-1234",
    email: "info@harborbay.com",
    website: "https://harborbay.com",
    latitude: 45.3735,
    longitude: -84.9551,
    isActive: true,
    createdAt: new Date()
  });
  
  marinas.set(2, {
    id: 2,
    name: "Sunset Point Marina",
    address: "789 Sunset Drive",
    city: "Traverse City",
    state: "MI",
    zipCode: "49684",
    phone: "231-555-6789",
    email: "info@sunsetpointmarina.com",
    website: "https://sunsetpointmarina.com",
    latitude: 44.7631,
    longitude: -85.6206,
    isActive: true,
    createdAt: new Date()
  });
  
  console.log("Demo data initialization complete");
}

// Storage interface for our in-memory data
const storage = {
  getUser: async (id) => users.get(id),
  getUserByEmail: async (email) => Array.from(users.values()).find(user => user.email === email),
  getAllServiceLevels: async () => Array.from(serviceLevels.values()),
  getAllMarinas: async (activeOnly = true) => {
    const allMarinas = Array.from(marinas.values());
    return activeOnly ? allMarinas.filter(marina => marina.isActive) : allMarinas;
  }
};

// Middleware
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Setup routes
async function setupRoutes() {
  // Initialize data
  await initDemoData();
  
  // API routes
  app.get('/api/auth/me', (req, res) => {
    res.status(401).json({ message: "Unauthorized" });
  });
  
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Return user info
    const userData = { ...user };
    delete userData.passwordHash;
    
    res.json(userData);
  });
  
  app.get('/api/service-levels', async (req, res) => {
    try {
      const services = await storage.getAllServiceLevels();
      res.json(services);
    } catch (error) {
      console.error('Error fetching service levels:', error);
      res.status(500).json({ error: 'Failed to retrieve services' });
    }
  });
  
  app.get('/api/marinas', async (req, res) => {
    try {
      const marinas = await storage.getAllMarinas();
      res.json(marinas);
    } catch (error) {
      console.error('Error fetching marinas:', error);
      res.status(500).json({ error: 'Failed to retrieve marinas' });
    }
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      mode: 'in-memory'
    });
  });
  
  // Serve static frontend files
  const staticDir = path.join(__dirname, 'dist');
  
  if (fs.existsSync(staticDir)) {
    console.log(`Serving static files from ${staticDir}`);
    app.use(express.static(staticDir));
    
    // Send index.html for any routes not handled by API
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  } else {
    console.warn(`Static directory ${staticDir} not found`);
    // Simple fallback HTML
    app.get('*', (req, res) => {
      res.send(`
        <html>
          <head>
            <title>Poopalotzi</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #0e7490; }
              li { margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <h1>Poopalotzi API Server</h1>
            <p>Frontend assets not found. This is an API server.</p>
            <p>Available endpoints:</p>
            <ul>
              <li><a href="/api/service-levels">/api/service-levels</a></li>
              <li><a href="/api/marinas">/api/marinas</a></li>
              <li><a href="/health">/health</a></li>
            </ul>
          </body>
        </html>
      `);
    });
  }
}

// Initialize and start server
setupRoutes().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Default admin user: admin@poopalotzi.com / admin123`);
  });
}).catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});