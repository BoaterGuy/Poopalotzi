import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
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

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Poopalotzi server running',
    timestamp: new Date().toISOString(),
    uploadsDir: uploadsDir,
    imageUploadReady: true
  });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'Database connected',
      timestamp: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'Database connection failed',
      error: error.message
    });
  }
});

// Test image upload endpoint
app.post('/api/test-image-upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      uploadDir: uploadsDir
    });
  } catch (error) {
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get marinas
app.get('/api/marinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marinas WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get marinas' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API endpoint not found' });
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
            <h1>🚤 Poopalotzi Server</h1>
            <div class="status">
              <h3>✅ Server Status: Running</h3>
              <p>Image upload system is ready for testing!</p>
              <p>Port: ${port} | Uploads Directory: ${uploadsDir}</p>
            </div>
            
            <div class="upload-test">
              <h3>🖼️ Test Image Upload</h3>
              <p>This tests the boat image upload functionality that was improved to resolve the "Request Entity Too Large" error.</p>
              
              <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" id="imageFile" name="image" accept="image/*" required>
                <br>
                <button type="submit">Upload Test Image</button>
              </form>
              
              <div id="uploadResult"></div>
            </div>
            
            <h3>📋 API Endpoints</h3>
            <ul>
              <li><a href="/api/health">Health Check</a></li>
              <li><a href="/api/db-test">Database Test</a></li>
              <li><a href="/api/marinas">View Marinas</a></li>
              <li><a href="/api/uploads">View Uploaded Files</a></li>
            </ul>
            
            <h3>🛠️ Image Upload Improvements</h3>
            <ul>
              <li>✅ Fixed "Request Entity Too Large" error</li>
              <li>✅ Converted from base64 to FormData with multer</li>
              <li>✅ Added static file serving for /uploads</li>
              <li>✅ Increased file size limits to 10MB</li>
              <li>✅ Added proper file validation</li>
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
                
                const response = await fetch('/api/test-image-upload', {
                  method: 'POST',
                  body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                  resultDiv.innerHTML = \`
                    <div class="result success">
                      <h4>✅ Upload Successful!</h4>
                      <p><strong>File:</strong> \${result.filename}</p>
                      <p><strong>Size:</strong> \${(result.size / 1024).toFixed(2)} KB</p>
                      <p><strong>URL:</strong> <a href="\${result.path}" target="_blank">\${result.path}</a></p>
                      <img src="\${result.path}" style="max-width: 300px; margin-top: 10px;" alt="Uploaded image">
                    </div>
                  \`;
                } else {
                  resultDiv.innerHTML = \`<div class="result error">❌ Upload failed: \${result.error}</div>\`;
                }
              } catch (error) {
                resultDiv.innerHTML = \`<div class="result error">❌ Error: \${error.message}</div>\`;
              }
            });
          </script>
        </body>
      </html>
    `);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚤 Poopalotzi server running on port ${port}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🖼️ Image upload system ready for testing`);
  console.log(`🔗 Visit http://localhost:${port} to test boat image uploads`);
});