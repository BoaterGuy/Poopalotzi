import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Serve static files from client/dist if it exists
const clientDistPath = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server running', 
    timestamp: new Date().toISOString(),
    uploads_dir: uploadsDir,
    uploads_exists: fs.existsSync(uploadsDir)
  });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const result = await pool.query('SELECT NOW() as current_time');
    await pool.end();
    
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

// Test image upload endpoint
app.post('/api/test-upload', (req, res) => {
  try {
    const { imageData, filename } = req.body;
    
    if (!imageData || !filename) {
      return res.status(400).json({ error: 'Missing imageData or filename' });
    }
    
    // Handle base64 data
    if (imageData.startsWith('data:')) {
      const base64Data = imageData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const filepath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      res.json({ 
        success: true, 
        message: 'Image uploaded successfully',
        filename: filename,
        size: buffer.length,
        path: `/uploads/${filename}`
      });
    } else {
      res.status(400).json({ error: 'Invalid image data format' });
    }
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

// Catch-all route for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API endpoint not found' });
  } else {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <html>
          <head><title>Poopalotzi Server</title></head>
          <body>
            <h1>Poopalotzi Server Running</h1>
            <p>Server is running on port ${port}</p>
            <p>Frontend files not found. Build the client first.</p>
            <ul>
              <li><a href="/api/health">Health Check</a></li>
              <li><a href="/api/db-test">Database Test</a></li>
              <li><a href="/api/uploads">View Uploads</a></li>
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
  console.log(`Client dist exists: ${fs.existsSync(clientDistPath)}`);
});