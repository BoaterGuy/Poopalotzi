#!/usr/bin/env node

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
async function testDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'poopalotzi-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// API Routes
app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ user: req.user, message: 'Login successful' });
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

app.get('/api/boats', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.* FROM boat b 
      JOIN boat_owner bo ON b.owner_id = bo.id 
      WHERE bo.user_id = $1
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching boats:', error);
    res.status(500).json({ message: 'Failed to fetch boats' });
  }
});

app.post('/api/boats', requireAuth, async (req, res) => {
  try {
    const { name, make, model, year, length, pumpPortLocations } = req.body;
    
    // Get or create boat owner
    let ownerResult = await pool.query('SELECT id FROM boat_owner WHERE user_id = $1', [req.user.id]);
    let ownerId;
    
    if (ownerResult.rows.length === 0) {
      const newOwner = await pool.query('INSERT INTO boat_owner (user_id) VALUES ($1) RETURNING id', [req.user.id]);
      ownerId = newOwner.rows[0].id;
    } else {
      ownerId = ownerResult.rows[0].id;
    }
    
    // Insert boat
    const result = await pool.query(`
      INSERT INTO boat (owner_id, name, make, model, year, length, pump_port_locations)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [ownerId, name, make, model, year, length, pumpPortLocations]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating boat:', error);
    res.status(500).json({ message: 'Failed to create boat' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Serve static files
const clientPath = path.join(__dirname, 'client/dist');
app.use(express.static(clientPath));

// Fallback to public if dist doesn't exist
const publicPath = path.join(__dirname, 'client/public');
app.use(express.static(publicPath));

// Catch-all handler for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(clientPath, 'index.html');
  const publicIndexPath = path.join(publicPath, 'index.html');
  
  // Try client/dist/index.html first, then client/public/index.html
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.sendFile(publicIndexPath, (err2) => {
        if (err2) {
          res.status(404).send('Application not found');
        }
      });
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('⚠️ Starting server without database connection');
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌊 Poopalotzi Marina Management System started`);
  });
}

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});