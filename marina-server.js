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

console.log('🚀 Starting Poopalotzi Marina Management System...');

const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
async function checkDatabase() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'poopalotzi-marina-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
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
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Passport authentication strategy
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

      console.log(`User ${email} logged in successfully`);
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

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// API Routes
app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ 
    user: { 
      id: req.user.id, 
      email: req.user.email, 
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      role: req.user.role 
    }, 
    message: 'Login successful' 
  });
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
    res.json({ 
      user: { 
        id: req.user.id, 
        email: req.user.email, 
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        role: req.user.role 
      } 
    });
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
      ORDER BY b.created_at DESC
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
    
    // Validate required fields
    if (!name || !make || !model || !year || !length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
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
    `, [ownerId, name, make, model, year, length, pumpPortLocations || ['port', 'starboard']]);
    
    console.log(`New boat added: ${name} (${make} ${model})`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating boat:', error);
    res.status(500).json({ message: 'Failed to create boat' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'operational',
    service: 'Poopalotzi Marina Management System',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Static file serving
const clientDistPath = path.join(__dirname, 'client/dist');
const clientPublicPath = path.join(__dirname, 'client/public');

// Serve built client files first
app.use(express.static(clientDistPath, { index: false }));
// Fallback to public directory
app.use(express.static(clientPublicPath, { index: false }));

// SPA catch-all route
app.get('*', (req, res) => {
  const distIndexPath = path.join(clientDistPath, 'index.html');
  const publicIndexPath = path.join(clientPublicPath, 'index.html');
  
  // Try serving from dist first, then public
  res.sendFile(distIndexPath, (err) => {
    if (err) {
      res.sendFile(publicIndexPath, (err2) => {
        if (err2) {
          res.status(404).send(`
            <html>
              <head><title>Marina Management System</title></head>
              <body>
                <h1>🚤 Poopalotzi Marina Management</h1>
                <p>System is running but client files not found.</p>
                <p>Server is operational at: <a href="/api/health">/api/health</a></p>
              </body>
            </html>
          `);
        }
      });
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server function
async function startMarinaSystem() {
  const dbConnected = await checkDatabase();
  
  if (!dbConnected) {
    console.log('⚠️ Starting without database - some features may not work');
  }

  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0';
  
  const server = app.listen(PORT, HOST, () => {
    console.log('');
    console.log('🌊 =================================');
    console.log('🚤 Poopalotzi Marina Management System');
    console.log('🌊 =================================');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🗄️  Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🌊 =================================');
    console.log('');
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      if (pool) {
        pool.end(() => {
          console.log('Database pool closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  return server;
}

// Launch the application
startMarinaSystem().catch(error => {
  console.error('Failed to start marina system:', error);
  process.exit(1);
});