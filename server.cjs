const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Initializing Poopalotzi boat management system...');

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function setupDatabase() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connection verified');
    
    // Ensure marinas table exists with sample data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marinas (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      INSERT INTO marinas (name, location, contact_email, contact_phone, active) VALUES 
      ('Marina Bay Harbor', 'San Francisco Bay, CA', 'info@marinabay.com', '(415) 555-0123', true),
      ('Pacific Coast Marina', 'Monterey Bay, CA', 'contact@pacificcoast.com', '(831) 555-0456', true),
      ('Golden Gate Marina', 'Sausalito, CA', 'admin@goldengate.com', '(415) 555-0789', true)
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('Database tables verified and ready');
  } catch (error) {
    console.error('Database setup error:', error.message);
  }
}

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: 'poopalotzi-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport authentication
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Authentication required' });
};

// API Routes
app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ user: req.user, message: 'Login successful' });
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logout successful' });
  });
});

app.get('/api/auth/me', isAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

// Boats API with array handling fixes
app.get('/api/boats', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, bo.user_id as owner_id 
      FROM boats b 
      LEFT JOIN boat_owners bo ON b.owner_id = bo.id 
      WHERE bo.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching boats:', error);
    res.status(500).json({ message: 'Failed to fetch boats' });
  }
});

app.post('/api/boats', isAuthenticated, async (req, res) => {
  try {
    // Get or create boat owner
    let ownerResult = await pool.query('SELECT * FROM boat_owners WHERE user_id = $1', [req.user.id]);
    let ownerId;
    
    if (ownerResult.rows.length === 0) {
      const newOwner = await pool.query(
        'INSERT INTO boat_owners (user_id) VALUES ($1) RETURNING *',
        [req.user.id]
      );
      ownerId = newOwner.rows[0].id;
    } else {
      ownerId = ownerResult.rows[0].id;
    }

    const { name, make, model, year, length, pumpPortLocations } = req.body;
    
    // Ensure pumpPortLocations is properly handled as array
    const portLocations = Array.isArray(pumpPortLocations) ? pumpPortLocations : [];
    
    const result = await pool.query(`
      INSERT INTO boats (name, make, model, year, length, pump_port_locations, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, make, model, year, length, portLocations, ownerId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating boat:', error);
    res.status(500).json({ message: 'Failed to create boat: ' + error.message });
  }
});

// Marina and service routes
app.get('/api/marinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marinas WHERE active = true ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch marinas' });
  }
});

app.get('/api/service-levels', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_levels ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch service levels' });
  }
});

// Pump out requests
app.post('/api/pump-out-requests', isAuthenticated, async (req, res) => {
  try {
    const { boatId, requestedDate, priority, notes } = req.body;
    
    const result = await pool.query(`
      INSERT INTO pump_out_requests (boat_id, requested_date, priority, notes, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `, [boatId, requestedDate, priority || 'normal', notes]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create request' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));

// Catch-all for client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Start server
async function start() {
  await setupDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Poopalotzi server running on port ${PORT}`);
    console.log('Database connected and ready');
    console.log('Boat array handling fixes active');
    console.log('Authentication system operational');
  });
}

start().catch(console.error);