import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import { Pool } from 'pg';
import { createServer as createViteServer } from "vite";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import type { IStorage } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create a database storage instance
const dbStorage = new DatabaseStorage();
export let storage: IStorage = dbStorage;

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads (preserving image upload functionality)
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'boat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
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
  console.log(`${formattedTime} [dev-server] ${message}`);
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function startDevServer() {
  const port = Number(process.env.PORT) || 5000;

  try {
    log("Starting Poopalotzi development server...");
    
    // Initialize database
    if (process.env.NODE_ENV !== 'production') {
      log("Development environment detected, running database setup...");
      const dbSuccess = await setupFullDatabase();
      if (dbSuccess) {
        log("Successfully connected to the database!");
      } else {
        log("Database connection error - exiting");
        process.exit(1);
      }
    }

    // Set up authentication
    setupAuth(app);

    // Register API routes
    const server = await registerRoutes(app);

    // Create Vite server for frontend development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      root: path.resolve(process.cwd(), 'client'),
      build: {
        outDir: path.resolve(process.cwd(), 'dist/public'),
      },
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // Fallback handler for SPA routing
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;

      // Skip API routes
      if (url.startsWith('/api/') || url.startsWith('/auth/') || url.startsWith('/uploads/')) {
        return next();
      }

      try {
        // Read the index.html template
        const template = await fs.promises.readFile(
          path.resolve(process.cwd(), 'client/index.html'),
          'utf-8'
        );

        // Transform the HTML using Vite
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      log(`Error: ${err.message}`);
      if (res.headersSent) return;
      res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // Start the server
    server.listen(port, "0.0.0.0", () => {
      log(`Development server running on port ${port}`);
      log(`Frontend: http://localhost:${port}`);
      log(`API: http://localhost:${port}/api`);
      log(`Uploads directory: ${uploadsDir}`);
      log(`Image upload functionality: Ready (10MB limit)`);
    });

  } catch (error: any) {
    log(`Failed to start development server: ${error.message}`);
    process.exit(1);
  }
}

startDevServer();