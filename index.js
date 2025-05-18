// Simple standalone deployment for Poopalotzi
import express from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage
const users = new Map();
const serviceLevels = new Map();
const marinas = new Map();

// Initialize data
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
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  serviceLevels.set(2, {
    id: 2,
    name: "Monthly Subscription",
    description: "Unlimited pump-outs for the month",
    price: 14995,
    type: "monthly", 
    serviceLevel: "single-head",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  serviceLevels.set(3, {
    id: 3,
    name: "Seasonal Pass",
    description: "Unlimited pump-outs for the season (April-October)",
    price: 69995,
    type: "seasonal",
    serviceLevel: "multi-head",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
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
    createdAt: new Date(),
    updatedAt: new Date()
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
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  console.log("Demo data initialized successfully!");
}

// API methods
const storage = {
  getUser: (id) => users.get(Number(id)),
  getUserByEmail: (email) => Array.from(users.values()).find(user => user.email === email),
  getAllServiceLevels: () => Array.from(serviceLevels.values()),
  getAllMarinas: () => Array.from(marinas.values())
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// API Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user
    const user = storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Return user without password
    const userInfo = { ...user };
    delete userInfo.passwordHash;
    
    res.json(userInfo);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  // Without proper auth, we'll return unauthorized
  res.status(401).json({ message: 'Unauthorized' });
});

app.get('/api/service-levels', (req, res) => {
  res.json(storage.getAllServiceLevels());
});

app.get('/api/marinas', (req, res) => {
  res.json(storage.getAllMarinas());
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', mode: 'in-memory' });
});

// Serve static HTML landing page for all other routes
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Poopalotzi - Marina Pump-Out Services</title>
      <style>
        :root {
          --primary: #0e7490;
          --accent: #f59e0b;
          --bg: #f9fafb;
          --card: #ffffff;
          --radius: 8px;
        }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background-color: var(--bg);
          color: #333;
          line-height: 1.6;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        header {
          background-color: var(--primary);
          color: white;
          padding: 2rem;
          border-radius: var(--radius);
          margin-bottom: 2rem;
          text-align: center;
        }
        h1 { margin-top: 0; }
        .services {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin: 2rem 0;
        }
        .service-card {
          background: var(--card);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .price {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary);
          margin: 1rem 0;
        }
        .btn {
          display: inline-block;
          background: var(--accent);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: var(--radius);
          text-decoration: none;
          font-weight: bold;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin: 2rem 0;
        }
        .feature {
          background: var(--card);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
        }
        footer {
          margin-top: 2rem;
          text-align: center;
          color: #666;
          padding: 1rem;
          border-top: 1px solid #eee;
        }
        .api-section {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: var(--radius);
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
            <a href="/signup" class="btn">Book Now</a>
          </div>
          
          <div class="service-card">
            <h3>Monthly Subscription</h3>
            <p>Unlimited pump-outs for the month. Perfect for frequent boaters.</p>
            <div class="price">$149.95</div>
            <a href="/signup" class="btn">Subscribe</a>
          </div>
          
          <div class="service-card">
            <h3>Seasonal Pass</h3>
            <p>Unlimited service for the entire boating season (April-October).</p>
            <div class="price">$699.95</div>
            <a href="/signup" class="btn">Get Season Pass</a>
          </div>
        </div>
        
        <h2>Why Choose Poopalotzi?</h2>
        <div class="features">
          <div class="feature">
            <h3>Convenience</h3>
            <p>Schedule pump-outs on your time with our easy-to-use app.</p>
          </div>
          
          <div class="feature">
            <h3>Reliability</h3>
            <p>Professional service with guaranteed timely arrivals.</p>
          </div>
          
          <div class="feature">
            <h3>Eco-Friendly</h3>
            <p>Help keep our waterways clean with proper waste disposal.</p>
          </div>
        </div>
        
        <div class="api-section">
          <h3>API Endpoints</h3>
          <p>This is the Poopalotzi API server. Available endpoints:</p>
          <ul>
            <li><code>/api/service-levels</code> - View service plans</li>
            <li><code>/api/marinas</code> - View supported marinas</li>
            <li><code>/api/auth/login</code> - Authentication endpoint</li>
          </ul>
          <p>Demo admin account: <code>admin@poopalotzi.com</code> / <code>admin123</code></p>
        </div>
      </main>
      
      <footer>
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
      console.log('Default admin user: admin@poopalotzi.com / admin123');
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();