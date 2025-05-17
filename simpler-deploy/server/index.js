// Simple Express Server for Poopalotzi
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcryptjs';

// ES Module setup for __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage
const users = new Map();
const serviceLevels = new Map();

// Initialize data
function initData() {
  // Admin user
  users.set("1", {
    id: "1",
    email: "admin@poopalotzi.com",
    username: "admin@poopalotzi.com",
    passwordHash: "$2a$10$0c8ZbG6InbToBZXMu/LN5.YqGcGqWsE1VECxMVYsHX9MpK7HMiDK2", // admin123
    firstName: "Admin",
    lastName: "User",
    role: "admin"
  });

  // Service levels
  serviceLevels.set("1", {
    id: "1",
    name: "Basic Pump-Out",
    description: "One-time pump-out service for single-head boats",
    priceInCents: 3500,
    serviceType: "one-time",
    serviceLevel: "single-head",
    isActive: true
  });

  serviceLevels.set("2", {
    id: "2",
    name: "Premium Weekly",
    description: "Weekly scheduled pump-out service for multi-head boats",
    priceInCents: 12000,
    serviceType: "monthly",
    serviceLevel: "multi-head",
    isActive: true
  });

  serviceLevels.set("3", {
    id: "3",
    name: "Seasonal Pass",
    description: "Unlimited pump-outs for the entire season",
    priceInCents: 75000,
    serviceType: "seasonal",
    serviceLevel: "multi-head",
    isActive: true
  });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'poopalotzi-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Simple authentication middleware
const authMiddleware = (req, res, next) => {
  if (req.session.userId) {
    const user = users.get(req.session.userId);
    if (user) {
      req.user = user;
      return next();
    }
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  let foundUser = null;
  for (const [id, user] of users.entries()) {
    if (user.email === email) {
      foundUser = user;
      break;
    }
  }
  
  if (!foundUser) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  
  // Check password
  const passwordMatch = bcrypt.compareSync(password, foundUser.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  
  // Set session
  req.session.userId = foundUser.id;
  
  // Return user without password
  const { passwordHash, ...userWithoutPassword } = foundUser;
  res.json(userWithoutPassword);
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const { passwordHash, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// Service level routes
app.get('/api/service-levels', (req, res) => {
  const activeServiceLevels = Array.from(serviceLevels.values())
    .filter(sl => sl.isActive);
  res.json(activeServiceLevels);
});

// Serve static files
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// SPA fallback
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    res.sendFile(path.join(publicDir, 'index.html'));
  } else {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Poopalotzi</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
          h1 { color: #0e7490; }
          .price { font-size: 24px; font-weight: bold; margin: 10px 0; }
          .btn { background: #0e7490; color: white; padding: 10px 15px; border-radius: 4px; text-decoration: none; display: inline-block; }
        </style>
      </head>
      <body>
        <h1>Poopalotzi - Marina Pump-Out Services</h1>
        <p>Welcome to Poopalotzi, your solution for marine pump-out services.</p>
        
        <h2>Our Services</h2>
        <div id="services">
          <div class="card">
            <h3>Basic Pump-Out</h3>
            <p>One-time pump-out service for single-head boats</p>
            <div class="price">$35.00</div>
            <a href="#" class="btn">Book Now</a>
          </div>
          
          <div class="card">
            <h3>Premium Weekly</h3>
            <p>Weekly scheduled pump-out service for multi-head boats</p>
            <div class="price">$120.00</div>
            <a href="#" class="btn">Subscribe</a>
          </div>
          
          <div class="card">
            <h3>Seasonal Pass</h3>
            <p>Unlimited pump-outs for the entire season</p>
            <div class="price">$750.00</div>
            <a href="#" class="btn">Get Season Pass</a>
          </div>
        </div>
        
        <script>
          // Fetch service levels from API
          fetch('/api/service-levels')
            .then(response => response.json())
            .then(services => {
              if (services && services.length) {
                const container = document.getElementById('services');
                container.innerHTML = '';
                
                services.forEach(service => {
                  const price = (service.priceInCents / 100).toFixed(2);
                  container.innerHTML += `
                    <div class="card">
                      <h3>${service.name}</h3>
                      <p>${service.description}</p>
                      <div class="price">$${price}</div>
                      <a href="#" class="btn">Book Now</a>
                    </div>
                  `;
                });
              }
            })
            .catch(error => console.error('Error loading services:', error));
        </script>
      </body>
      </html>
    `);
  }
});

// Initialize data and start server
initData();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;