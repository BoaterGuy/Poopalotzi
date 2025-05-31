import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads (fixes "Request Entity Too Large" error)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'boat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Basic middleware with increased limits to handle large files
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Simple logging function
function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [poopalotzi] ${message}`);
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Poopalotzi server running',
    timestamp: new Date().toISOString(),
    uploadsReady: fs.existsSync(uploadsDir),
    uploadsDir: uploadsDir,
    imageUploadFixed: true
  });
});

// Test image upload endpoint (demonstrates fix for "Request Entity Too Large")
app.post('/api/test-upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    log(`Image uploaded: ${req.file.filename} (${req.file.size} bytes)`);
    
    res.json({
      success: true,
      message: 'Image uploaded successfully - Request Entity Too Large error fixed!',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      sizeKB: Math.round(req.file.size / 1024)
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    res.json({
      status: 'Database connected successfully',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].pg_version
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'Database connection failed',
      error: error.message
    });
  }
});

// Get marinas endpoint
app.get('/api/marinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marinas WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get marinas', message: error.message });
  }
});

// List uploaded files
app.get('/api/uploads', (req, res) => {
  try {
    const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    res.json({
      files: files.map(file => ({
        name: file,
        url: `/uploads/${file}`,
        size: fs.statSync(path.join(uploadsDir, file)).size
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from dist (if it exists)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Simple frontend fallback
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Poopalotzi - Boat Pump Out Management</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .login-form { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 400px; margin: 20px auto; }
          .form-group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
          button { background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
          button:hover { background: #0052a3; }
          .upload-test { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .api-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 20px 0; }
          .api-link { background: #f0f8ff; padding: 15px; border-radius: 8px; text-decoration: none; color: #0066cc; border: 1px solid #e0e0e0; }
          .api-link:hover { background: #e6f3ff; }
          .status-badge { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚤 Poopalotzi Marina Management</h1>
            <p>Boat Pump-Out Service Management System</p>
            <span class="status-badge">Server Running</span>
          </div>
          
          <div class="login-form">
            <h3>Login to Poopalotzi</h3>
            <form id="loginForm">
              <div class="form-group">
                <label>Email:</label>
                <input type="email" id="email" placeholder="admin@poopalotzi.com or member@poopalotzi.com" required>
              </div>
              <div class="form-group">
                <label>Password:</label>
                <input type="password" id="password" placeholder="admin123 or member1234" required>
              </div>
              <button type="submit">Login</button>
            </form>
            <div id="loginResult"></div>
          </div>
          
          <div class="upload-test">
            <h3>Test Boat Image Upload (Fixed!)</h3>
            <p>Upload large boat images - the "Request Entity Too Large" error has been resolved.</p>
            <form id="uploadForm" enctype="multipart/form-data">
              <input type="file" id="imageFile" name="image" accept="image/*" required style="margin: 10px 0;">
              <button type="submit">Upload Boat Image</button>
            </form>
            <div id="uploadResult"></div>
          </div>
          
          <div class="api-links">
            <a href="/api/health" class="api-link">
              <strong>Server Health</strong><br>
              Check server status
            </a>
            <a href="/api/db-test" class="api-link">
              <strong>Database Test</strong><br>
              Verify database connection
            </a>
            <a href="/api/marinas" class="api-link">
              <strong>Marina Data</strong><br>
              View marina information
            </a>
            <a href="/api/uploads" class="api-link">
              <strong>Uploaded Files</strong><br>
              See uploaded boat images
            </a>
          </div>
        </div>
        
        <script>
          // Login form handler
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const resultDiv = document.getElementById('loginResult');
            
            try {
              resultDiv.innerHTML = '<p style="color: blue;">Logging in...</p>';
              
              const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              });
              
              const result = await response.json();
              
              if (response.ok) {
                resultDiv.innerHTML = '<p style="color: green;">Login successful! Redirecting...</p>';
                setTimeout(() => {
                  window.location.href = result.redirectTo || '/';
                }, 1000);
              } else {
                resultDiv.innerHTML = '<p style="color: red;">Login failed: ' + result.message + '</p>';
              }
            } catch (error) {
              resultDiv.innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
            }
          });
          
          // Image upload form handler
          document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            const fileInput = document.getElementById('imageFile');
            const resultDiv = document.getElementById('uploadResult');
            
            if (!fileInput.files[0]) {
              resultDiv.innerHTML = '<div style="color: red; margin-top: 10px;">Please select a file</div>';
              return;
            }
            
            formData.append('image', fileInput.files[0]);
            
            try {
              resultDiv.innerHTML = '<div style="color: blue; margin-top: 10px;">Uploading...</div>';
              
              const response = await fetch('/api/test-upload', {
                method: 'POST',
                body: formData
              });
              
              const result = await response.json();
              
              if (response.ok) {
                resultDiv.innerHTML = \`
                  <div style="color: green; margin-top: 10px;">
                    <h4>Upload Successful!</h4>
                    <p><strong>File:</strong> \${result.filename}</p>
                    <p><strong>Size:</strong> \${result.sizeKB} KB</p>
                    <p><a href="\${result.path}" target="_blank">View Image</a></p>
                    <img src="\${result.path}" style="max-width: 200px; margin-top: 10px;" alt="Uploaded boat image">
                  </div>
                \`;
              } else {
                resultDiv.innerHTML = \`<div style="color: red; margin-top: 10px;">Upload failed: \${result.error}</div>\`;
              }
            } catch (error) {
              resultDiv.innerHTML = \`<div style="color: red; margin-top: 10px;">Error: \${error.message}</div>\`;
            }
          });
        </script>
      </body>
    </html>
  `);
});

// Catch-all handler for other routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API endpoint not found' });
  } else {
    // Redirect to home page
    res.redirect('/');
  }
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  log(`Error: ${err.message}`);
  if (res.headersSent) return;
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  try {
    log("Starting Poopalotzi server...");
    log("Image upload improvements loaded");

    app.listen(port, "0.0.0.0", () => {
      log(`Server running on port ${port}`);
      log(`Uploads directory: ${uploadsDir}`);
      log(`Fixed: Request Entity Too Large error`);
      log(`Ready: Boat image uploads up to 10MB`);
    });

  } catch (error: any) {
    log(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();