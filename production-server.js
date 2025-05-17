// Production-ready Express server using ES modules for Poopalotzi
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcryptjs';

// ES Module setup for __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory storage for demo deployment
const users = new Map();
const serviceLevels = new Map();

// Initialize with demo data
function initData() {
  // Admin user for testing
  users.set(1, {
    id: 1,
    email: 'admin@poopalotzi.com',
    username: 'admin@poopalotzi.com',
    passwordHash: '$2a$10$0c8ZbG6InbToBZXMu/LN5.YqGcGqWsE1VECxMVYsHX9MpK7HMiDK2', // admin123
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  });

  // Service levels
  serviceLevels.set(1, {
    id: 1,
    name: 'Basic Pump-Out',
    description: 'One-time pump-out service',
    priceInCents: 3500,
    serviceType: 'one-time',
    serviceLevel: 'single-head',
    isActive: true
  });

  serviceLevels.set(2, {
    id: 2,
    name: 'Premium Weekly',
    description: 'Weekly scheduled pump-out service',
    priceInCents: 12000,
    serviceType: 'monthly',
    serviceLevel: 'multi-head',
    isActive: true
  });

  serviceLevels.set(3, {
    id: 3,
    name: 'Seasonal Pass',
    description: 'Unlimited pump-outs for the season',
    priceInCents: 75000,
    serviceType: 'seasonal',
    serviceLevel: 'multi-head',
    isActive: true
  });

  console.log('Initialized demo data successfully');
}

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session setup - simplified for deployment
app.use(session({
  secret: process.env.SESSION_SECRET || 'poopalotzi-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Simple auth middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.user = users.get(req.session.userId);
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const userArray = Array.from(users.values());
  const user = userArray.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Check password
  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Set session
  req.session.userId = user.id;
  
  // Return user (without password)
  const userCopy = { ...user };
  delete userCopy.passwordHash;
  
  res.json({ user: userCopy });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/user', isAuthenticated, (req, res) => {
  const userCopy = { ...req.user };
  delete userCopy.passwordHash;
  res.json(userCopy);
});

// Service levels API
app.get('/api/service-levels', (req, res) => {
  const levels = Array.from(serviceLevels.values()).filter(level => level.isActive);
  res.json(levels);
});

// Serve static files
const staticPath = path.join(__dirname, 'dist');
console.log('Serving static files from:', staticPath);
app.use(express.static(staticPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize demo data
initData();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;