// Simple deployment-ready server using ES modules
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';

// ES Module setup for __dirname
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

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
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

// Synchronous password comparison to avoid any await usage
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  (email, password, done) => {
    try {
      const userArray = Array.from(users.values());
      let user = null;
      
      for (let i = 0; i < userArray.length; i++) {
        if (userArray[i].email === email) {
          user = userArray[i];
          break;
        }
      }
      
      if (!user) {
        return done(null, false, { message: 'Incorrect email.' });
      }
      
      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      
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
app.post('/api/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message || 'Authentication failed' });
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      const userCopy = Object.assign({}, user);
      delete userCopy.passwordHash;
      return res.json({ user: userCopy });
    });
  })(req, res, next);
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/user', isAuthenticated, (req, res) => {
  const userCopy = Object.assign({}, req.user);
  delete userCopy.passwordHash;
  res.json(userCopy);
});

// Service levels API
app.get('/api/service-levels', (req, res) => {
  const levels = Array.from(serviceLevels.values()).filter(level => level.isActive);
  res.json(levels);
});

app.post('/api/service-levels', isAdmin, (req, res) => {
  const id = serviceLevels.size + 1;
  const newLevel = Object.assign(
    { id, createdAt: new Date(), updatedAt: new Date() },
    req.body
  );
  serviceLevels.set(id, newLevel);
  res.status(201).json(newLevel);
});

app.put('/api/service-levels/:id', isAdmin, (req, res) => {
  const id = Number(req.params.id);
  const level = serviceLevels.get(id);
  
  if (!level) {
    return res.status(404).json({ message: 'Service level not found' });
  }
  
  const updatedLevel = Object.assign(
    {},
    level,
    req.body,
    { updatedAt: new Date() }
  );
  
  serviceLevels.set(id, updatedLevel);
  res.json(updatedLevel);
});

// Serve static files
app.use(express.static(path.join(process.cwd(), 'dist', 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
});

// Initialize demo data
initData();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});