import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import session from 'express-session';
import bcryptjs from 'bcryptjs';
import { Pool } from 'pg';

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

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

// Serve client files from multiple possible locations
const clientPublicPath = path.join(process.cwd(), 'client', 'public');
const clientDistPath = path.join(process.cwd(), 'client', 'dist');
const clientSrcPath = path.join(process.cwd(), 'client', 'src');

// Serve public assets first (favicon, manifest, etc.)
if (fs.existsSync(clientPublicPath)) {
  app.use(express.static(clientPublicPath));
}

// Serve built files if they exist
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// In development, serve source files with proper MIME types
app.use('/src', (req, res, next) => {
  if (req.path.endsWith('.tsx') || req.path.endsWith('.ts') || req.path.endsWith('.jsx')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
}, express.static(clientSrcPath));

app.use('/node_modules', express.static(path.join(process.cwd(), 'node_modules')));

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
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
    authenticated: !!(req as any).session?.userId
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
    
    (req as any).session.userId = user.id;
    (req as any).session.userEmail = user.email;
    (req as any).session.userRole = user.role;
    
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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role',
      [email, passwordHash, firstName, lastName, phone, 'member']
    );
    
    const user = result.rows[0];
    
    // Create boat owner record
    await pool.query(
      'INSERT INTO boat_owner (user_id) VALUES ($1)',
      [user.id]
    );
    
    // Set session
    (req as any).session.userId = user.id;
    (req as any).session.userEmail = user.email;
    (req as any).session.userRole = user.role;
    
    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  (req as any).session.destroy();
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, phone, first_name, last_name FROM users WHERE id = $1',
      [(req as any).session.userId]
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
    const { name, length, year, make, model, color, marina_id } = req.body;
    
    // Get boat owner for this user
    const ownerResult = await pool.query(
      'SELECT id FROM boat_owner WHERE user_id = $1',
      [(req as any).session.userId]
    );
    
    if (ownerResult.rows.length === 0) {
      return res.status(400).json({ error: 'User is not a boat owner' });
    }
    
    const ownerId = ownerResult.rows[0].id;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = await pool.query(
      'INSERT INTO boat (name, length, year, make, model, color, photo_url, owner_id, marina_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, parseFloat(length) || null, parseInt(year) || null, make, model, color, imageUrl, ownerId, parseInt(marina_id) || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create boat error:', error);
    res.status(500).json({ error: 'Failed to create boat' });
  }
});

app.get('/api/boats', requireAuth, async (req, res) => {
  try {
    const ownerResult = await pool.query(
      'SELECT id FROM boat_owner WHERE user_id = $1',
      [(req as any).session.userId]
    );
    
    if (ownerResult.rows.length === 0) {
      return res.json([]);
    }
    
    const result = await pool.query(
      'SELECT * FROM boat WHERE owner_id = $1 ORDER BY created_at DESC',
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
    const result = await pool.query('SELECT * FROM marina WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get marinas error:', error);
    res.status(500).json({ error: 'Failed to get marinas' });
  }
});

// Service levels
app.get('/api/service-levels', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_level ORDER BY price ASC');
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
      'INSERT INTO pump_out_request (boat_id, preferred_date, service_level_id, notes, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
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
      'SELECT * FROM pump_out_request WHERE boat_id = $1 ORDER BY created_at DESC',
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
      error: (error as Error).message 
    });
  }
});

// Serve React app for all unmatched routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API endpoint not found' });
  } else {
    // Try multiple possible locations for index.html
    const possiblePaths = [
      path.join(process.cwd(), 'client', 'dist', 'index.html'),
      path.join(process.cwd(), 'client', 'index.html')
    ];
    
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    
    // Fallback if no index.html found
    res.send(`
      <html>
        <head>
          <title>Poopalotzi - Marina Management</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>Poopalotzi Server Running</h1>
          <p>Server is running on port ${port}</p>
          <p>Marina management system is ready!</p>
          <ul>
            <li><a href="/api/health">Health Check</a></li>
            <li><a href="/api/db-test">Database Test</a></li>
            <li><a href="/api/marinas">View Marinas</a></li>
          </ul>
        </body>
      </html>
    `);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Poopalotzi server running on port ${port}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Marina management system ready`);
});