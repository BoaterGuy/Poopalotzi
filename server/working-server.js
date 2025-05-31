import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import session from 'express-session';
import bcryptjs from 'bcryptjs';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'poopalotzi-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use(express.static('client/dist'));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server running', 
    timestamp: new Date().toISOString(),
    authenticated: !!req.session?.userId
  });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const isValid = await bcryptjs.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;
    
    res.json({
      id: user.id,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, phone, name FROM users WHERE id = $1',
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Boat routes with image upload
app.post('/api/boats', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, length, beam, draft, year, make, model, dock, slip, marina_id } = req.body;
    
    // Get boat owner for this user
    const ownerResult = await pool.query(
      'SELECT id FROM boat_owners WHERE user_id = $1',
      [req.session.userId]
    );
    
    if (ownerResult.rows.length === 0) {
      return res.status(400).json({ error: 'User is not a boat owner' });
    }
    
    const ownerId = ownerResult.rows[0].id;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = await pool.query(
      'INSERT INTO boats (name, length, beam, draft, year, make, model, image_url, owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, parseFloat(length), parseFloat(beam), parseFloat(draft), parseInt(year), make, model, imageUrl, ownerId]
    );
    
    // Create slip assignment if provided
    if (dock && slip && marina_id) {
      await pool.query(
        'INSERT INTO slip_assignments (boat_id, marina_id, dock, slip) VALUES ($1, $2, $3, $4)',
        [result.rows[0].id, parseInt(marina_id), dock, slip]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create boat error:', error);
    res.status(500).json({ error: 'Failed to create boat' });
  }
});

app.get('/api/boats', requireAuth, async (req, res) => {
  try {
    const ownerResult = await pool.query(
      'SELECT id FROM boat_owners WHERE user_id = $1',
      [req.session.userId]
    );
    
    if (ownerResult.rows.length === 0) {
      return res.json([]);
    }
    
    const result = await pool.query(
      'SELECT * FROM boats WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerResult.rows[0].id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get boats error:', error);
    res.status(500).json({ error: 'Failed to get boats' });
  }
});

// Marina routes
app.get('/api/marinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marinas WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get marinas error:', error);
    res.status(500).json({ error: 'Failed to get marinas' });
  }
});

// Service levels
app.get('/api/service-levels', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_levels ORDER BY price ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get service levels error:', error);
    res.status(500).json({ error: 'Failed to get service levels' });
  }
});

// Pump out requests
app.post('/api/pump-out-requests', requireAuth, async (req, res) => {
  try {
    const { boat_id, preferred_date, service_level_id, notes } = req.body;
    
    const result = await pool.query(
      'INSERT INTO pump_out_requests (boat_id, preferred_date, service_level_id, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [parseInt(boat_id), preferred_date, parseInt(service_level_id), notes, 'pending']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create pump out request error:', error);
    res.status(500).json({ error: 'Failed to create pump out request' });
  }
});

app.get('/api/pump-out-requests/boat/:boatId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pump_out_requests WHERE boat_id = $1 ORDER BY created_at DESC',
      [parseInt(req.params.boatId)]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get pump out requests error:', error);
    res.status(500).json({ error: 'Failed to get pump out requests' });
  }
});

// Database test
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      status: 'Database connected successfully', 
      timestamp: result.rows[0].current_time 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Database connection failed', 
      error: error.message 
    });
  }
});

// Serve React app
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API endpoint not found' });
  } else {
    const indexPath = path.join(process.cwd(), 'client/dist/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <html>
          <head><title>Poopalotzi - Boat Pump Out Management</title></head>
          <body>
            <h1>Poopalotzi Server Running</h1>
            <p>Server is running on port ${port}</p>
            <p>Image upload system is ready for testing!</p>
            <ul>
              <li><a href="/api/health">Health Check</a></li>
              <li><a href="/api/db-test">Database Test</a></li>
              <li><a href="/api/marinas">View Marinas</a></li>
            </ul>
          </body>
        </html>
      `);
    }
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Poopalotzi server running on port ${port}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Image upload system ready for testing`);
});