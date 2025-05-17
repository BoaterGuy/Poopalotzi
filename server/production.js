// CommonJS production server file
const express = require('express');
const path = require('path');
const cors = require('cors');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcryptjs');
const MemoryStore = require('memorystore')(session);

// In-memory storage for demo deployment
const users = new Map();
const serviceLevels = new Map();
const marinas = new Map();

// Initialize with some demo data
function initDemoData() {
  // Admin user for testing
  users.set(1, {
    id: 1,
    email: 'admin@poopalotzi.com',
    username: 'admin@poopalotzi.com',
    passwordHash: '$2a$10$0c8ZbG6InbToBZXMu/LN5.YqGcGqWsE1VECxMVYsHX9MpK7HMiDK2', // admin123
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Add some service levels
  serviceLevels.set(1, {
    id: 1,
    name: 'Basic Pump-Out',
    description: 'One-time pump-out service',
    priceInCents: 3500,
    serviceType: 'one-time',
    serviceLevel: 'single-head',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  serviceLevels.set(2, {
    id: 2,
    name: 'Premium Weekly',
    description: 'Weekly scheduled pump-out service',
    priceInCents: 12000,
    serviceType: 'monthly',
    serviceLevel: 'multi-head',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Add a marina
  marinas.set(1, {
    id: 1,
    name: 'Sunset Harbor Marina',
    address: '123 Dock Street',
    city: 'Marina Bay',
    state: 'CA',
    zipCode: '94123',
    phoneNumber: '555-123-4567',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Create app
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

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // 24 hours
  })
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(Number(id));
  done(null, user || null);
});

// Local strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      // Find user by email
      const user = Array.from(users.values()).find(u => u.email === email);
      
      if (!user) {
        return done(null, false, { message: 'Incorrect email.' });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Auth middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden' });
};

// Auth routes
app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ user: { ...req.user, passwordHash: undefined } });
});

app.post('/api/auth/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/user', isAuthenticated, (req, res) => {
  res.json({ ...req.user, passwordHash: undefined });
});

// Service levels API
app.get('/api/service-levels', (req, res) => {
  const levels = Array.from(serviceLevels.values()).filter(sl => sl.isActive);
  res.json(levels);
});

app.post('/api/service-levels', isAdmin, (req, res) => {
  const id = serviceLevels.size + 1;
  const newServiceLevel = {
    id,
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  serviceLevels.set(id, newServiceLevel);
  res.status(201).json(newServiceLevel);
});

app.put('/api/service-levels/:id', isAdmin, (req, res) => {
  const id = Number(req.params.id);
  const serviceLevel = serviceLevels.get(id);
  
  if (!serviceLevel) {
    return res.status(404).json({ message: 'Service level not found' });
  }
  
  const updatedServiceLevel = {
    ...serviceLevel,
    ...req.body,
    updatedAt: new Date()
  };
  
  serviceLevels.set(id, updatedServiceLevel);
  res.json(updatedServiceLevel);
});

// Marinas API
app.get('/api/marinas', (req, res) => {
  const allMarinas = Array.from(marinas.values()).filter(m => m.isActive);
  res.json(allMarinas);
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize the data
initDemoData();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;