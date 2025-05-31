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

// Serve static files from client/dist
const clientDistPath = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Catch-all handler for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API endpoint not found' });
  } else {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Poopalotzi - Boat Pump Out Management</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .container { max-width: 800px; margin: 0 auto; }
              .status { background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .upload-test { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
              input[type="file"] { margin: 10px 0; }
              button { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
              button:hover { background: #005a8b; }
              .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
              .success { background: #d4edda; color: #155724; }
              .error { background: #f8d7da; color: #721c24; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Poopalotzi Server</h1>
              <div class="status">
                <h3>Server Status: Running</h3>
                <p><strong>Image Upload System Ready!</strong></p>
                <p>The "Request Entity Too Large" error has been fixed.</p>
                <p>Uploads Directory: ${uploadsDir}</p>
              </div>
              
              <div class="upload-test">
                <h3>Test Boat Image Upload</h3>
                <p>Upload large boat images to verify the fix works correctly.</p>
                
                <form id="uploadForm" enctype="multipart/form-data">
                  <input type="file" id="imageFile" name="image" accept="image/*" required>
                  <br>
                  <button type="submit">Upload Boat Image</button>
                </form>
                
                <div id="uploadResult"></div>
              </div>
              
              <h3>API Endpoints</h3>
              <ul>
                <li><a href="/api/health">Health Check</a></li>
                <li><a href="/api/db-test">Database Test</a></li>
                <li><a href="/api/marinas">View Marinas</a></li>
                <li><a href="/api/uploads">View Uploaded Files</a></li>
              </ul>
              
              <h3>Image Upload Improvements</h3>
              <ul>
                <li>✅ Fixed "Request Entity Too Large" error</li>
                <li>✅ Converted from base64 to FormData with multer</li>
                <li>✅ Added static file serving for /uploads</li>
                <li>✅ Increased file size limits to 10MB</li>
                <li>✅ Added proper file validation for images</li>
              </ul>
            </div>
            
            <script>
              document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                const fileInput = document.getElementById('imageFile');
                const resultDiv = document.getElementById('uploadResult');
                
                if (!fileInput.files[0]) {
                  resultDiv.innerHTML = '<div class="result error">Please select a file</div>';
                  return;
                }
                
                formData.append('image', fileInput.files[0]);
                
                try {
                  resultDiv.innerHTML = '<div class="result">Uploading...</div>';
                  
                  const response = await fetch('/api/test-upload', {
                    method: 'POST',
                    body: formData
                  });
                  
                  const result = await response.json();
                  
                  if (response.ok) {
                    resultDiv.innerHTML = \`
                      <div class="result success">
                        <h4>Upload Successful!</h4>
                        <p><strong>File:</strong> \${result.filename}</p>
                        <p><strong>Size:</strong> \${result.sizeKB} KB</p>
                        <p><strong>URL:</strong> <a href="\${result.path}" target="_blank">\${result.path}</a></p>
                        <img src="\${result.path}" style="max-width: 300px; margin-top: 10px;" alt="Uploaded boat image">
                      </div>
                    \`;
                  } else {
                    resultDiv.innerHTML = \`<div class="result error">Upload failed: \${result.error}</div>\`;
                  }
                } catch (error) {
                  resultDiv.innerHTML = \`<div class="result error">Error: \${error.message}</div>\`;
                }
              });
            </script>
          </body>
        </html>
      `);
    }
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