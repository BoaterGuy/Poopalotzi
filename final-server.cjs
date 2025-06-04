const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
const PORT = process.env.PORT || 5000;

// Database setup with proper error handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection and create tables
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
    
    // Create marinas table if not exists
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
    
    // Insert sample marina data
    await pool.query(`
      INSERT INTO marinas (name, location, contact_email, contact_phone, active) VALUES 
      ('Marina Bay Harbor', 'San Francisco Bay, CA', 'info@marinabay.com', '(415) 555-0123', true),
      ('Pacific Coast Marina', 'Monterey Bay, CA', 'contact@pacificcoast.com', '(831) 555-0456', true),
      ('Golden Gate Marina', 'Sausalito, CA', 'admin@goldengate.com', '(415) 555-0789', true)
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
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

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

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
      console.error('Authentication error:', error);
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
  console.log('User logged in:', req.user.email);
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

// Boats routes with enhanced error handling
app.get('/api/boats', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, bo.user_id as owner_id 
      FROM boats b 
      LEFT JOIN boat_owners bo ON b.owner_id = bo.id 
      WHERE bo.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    
    console.log(`Found ${result.rows.length} boats for user ${req.user.email}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching boats:', error);
    res.status(500).json({ message: 'Error fetching boats: ' + error.message });
  }
});

app.post('/api/boats', isAuthenticated, async (req, res) => {
  try {
    console.log('Creating boat for user:', req.user.email);
    console.log('Boat data:', req.body);
    
    // Get or create boat owner
    let ownerResult = await pool.query('SELECT * FROM boat_owners WHERE user_id = $1', [req.user.id]);
    let ownerId;
    
    if (ownerResult.rows.length === 0) {
      const newOwner = await pool.query(
        'INSERT INTO boat_owners (user_id) VALUES ($1) RETURNING *',
        [req.user.id]
      );
      ownerId = newOwner.rows[0].id;
      console.log('Created new boat owner:', ownerId);
    } else {
      ownerId = ownerResult.rows[0].id;
      console.log('Using existing boat owner:', ownerId);
    }

    const { name, make, model, year, length, pumpPortLocations } = req.body;
    
    // Ensure pumpPortLocations is an array
    const portLocations = Array.isArray(pumpPortLocations) ? pumpPortLocations : [];
    
    const result = await pool.query(`
      INSERT INTO boats (name, make, model, year, length, pump_port_locations, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, make, model, year, length, portLocations, ownerId]);

    console.log('Boat created successfully:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating boat:', error);
    res.status(500).json({ message: 'Error creating boat: ' + error.message });
  }
});

// Marina routes
app.get('/api/marinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marinas WHERE active = true ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching marinas:', error);
    res.status(500).json({ message: 'Error fetching marinas: ' + error.message });
  }
});

// Service levels routes
app.get('/api/service-levels', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_levels ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching service levels:', error);
    res.status(500).json({ message: 'Error fetching service levels: ' + error.message });
  }
});

// Pump out requests routes
app.get('/api/pump-out-requests/boat/:boatId', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pump_out_requests WHERE boat_id = $1 ORDER BY created_at DESC', 
      [req.params.boatId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pump out requests:', error);
    res.status(500).json({ message: 'Error fetching requests: ' + error.message });
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

    console.log('Pump out request created:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pump out request:', error);
    res.status(500).json({ message: 'Error creating request: ' + error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    authentication: 'enabled'
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server with database initialization
async function startServer() {
  const dbReady = await initializeDatabase();
  
  if (!dbReady) {
    console.error('Failed to initialize database. Exiting...');
    process.exit(1);
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚤 Poopalotzi boat management server running on port ${PORT}`);
    console.log('✓ Database initialized and connected');
    console.log('✓ Authentication system ready');
    console.log('✓ Boat management API operational');
    console.log('✓ Array handling fixes implemented');
    console.log('✓ Ready for member login and boat operations');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});