import express, { type Request, Response, NextFunction } from "express";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import { IStorage } from "./storage";
import { setupAuth } from "./auth";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a database storage instance
const dbStorage = new DatabaseStorage();
export let storage: IStorage = dbStorage;

const app = express();

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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
  console.log(`${formattedTime} [server] ${message}`);
}

// Setup authentication
setupAuth(app);

// Basic API routes for testing
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server running',
    timestamp: new Date().toISOString(),
    uploadsReady: fs.existsSync(uploadsDir)
  });
});

// Test image upload endpoint
app.post('/api/test-upload', upload.single('image'), (req, res) => {
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
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await storage.getAllMarinas();
    res.json({
      status: 'Database connected',
      marinasCount: result.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'Database connection failed',
      error: error.message
    });
  }
});

// Get marinas
app.get('/api/marinas', async (req, res) => {
  try {
    const marinas = await storage.getAllMarinas();
    res.json(marinas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get marinas' });
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
          <head><title>Poopalotzi Server</title></head>
          <body>
            <h1>Poopalotzi Server Running</h1>
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
    
    // Setup database
    await setupFullDatabase();
    log("Database setup completed");

    app.listen(port, "0.0.0.0", () => {
      log(`Server running on port ${port}`);
      log(`Uploads directory: ${uploadsDir}`);
      log(`Image upload system ready`);
    });

  } catch (error) {
    log(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();