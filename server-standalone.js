const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
const PORT = process.env.PORT || 5000;

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

// Express middleware
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
const isAuthenticated = (req, res, next) => {
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

app.get('/api/auth/me', isAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

// Boats routes
app.get('/api/boats', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, bo.user_id as owner_id 
      FROM boats b 
      LEFT JOIN boat_owners bo ON b.owner_id = bo.id 
      WHERE bo.user_id = $1
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching boats:', error);
    res.status(500).json({ message: 'Internal server error' });
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

    const { name, make, model, year, length, pumpPortLocations, marinaId } = req.body;
    
    const result = await pool.query(`
      INSERT INTO boats (name, make, model, year, length, pump_port_locations, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, make, model, year, length, pumpPortLocations || [], ownerId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating boat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Marina routes
app.get('/api/marinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marinas WHERE active = true');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching marinas:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Service levels routes
app.get('/api/service-levels', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_levels');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching service levels:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Pump out requests routes
app.get('/api/pump-out-requests/boat/:boatId', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pump_out_requests WHERE boat_id = $1', [req.params.boatId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pump out requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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
    console.error('Error creating pump out request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Poopalotzi boat management server running on port ${PORT}`);
});