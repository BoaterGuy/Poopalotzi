import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import { storage as memStorage, IStorage } from "./storage";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import multer from "multer";
import { Pool } from 'pg';
import { createServer as createViteServer } from "vite";

// Create a database storage instance right away
const dbStorage = new DatabaseStorage();
// ALWAYS use the database storage, not the in-memory storage
export let storage: IStorage = dbStorage;

const app = express();

// Create uploads directory for image functionality
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads (preserve existing functionality)
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

// Basic middleware with increased limits
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
  console.log(`${formattedTime} [hybrid] ${message}`);
}

// Middleware to log API requests (preserving existing logging)
app.use((req, res, next) => {
  const originalSend = res.json;
  let capturedJsonResponse: any = null;

  res.json = function(this: Response, data: any) {
    capturedJsonResponse = data;
    return originalSend.call(this, data);
  };

  res.on("finish", () => {
    const { method, originalUrl: path } = req;
    const { statusCode: status } = res;
    const duration = Date.now() - req.startTime;

    if (path.startsWith("/api") || path.startsWith("/auth")) {
      log(`${req.method} ${path} ${status} in ${duration}ms :: ${
        capturedJsonResponse ? JSON.stringify(capturedJsonResponse) : ""
      }`);
    }
  });

  next();
});

async function startServer() {
  try {
    // Initialize database schema conditionally
    if (process.env.NODE_ENV !== 'production') {
      log("Development environment detected, running database setup...");
      const dbSuccess = await setupFullDatabase();
      if (dbSuccess) {
        log("Successfully connected to the database!");
        log("All database tables set up successfully!");
      } else {
        log("Database connection error - exiting");
        process.exit(1);
      }
    } else {
      log("Production environment detected. Skipping automatic database setup.");
    }
    
    // Set up authentication with the proper storage
    setupAuth(app);
    
    // Register API routes before setting up frontend
    const server = await registerRoutes(app);

    // Create Vite server for frontend development (this restores your styling)
    if (process.env.NODE_ENV === 'development') {
      log("Setting up Vite development server for frontend styling...");
      
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
        configFile: path.resolve(process.cwd(), 'vite.config.ts'),
        root: path.resolve(process.cwd(), 'client'),
      });

      // Use vite's middleware for frontend processing
      app.use(vite.middlewares);

      // Handle frontend routes
      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;

        // Skip API routes and uploads
        if (url.startsWith('/api/') || url.startsWith('/auth/') || url.startsWith('/uploads/')) {
          return next();
        }

        try {
          // Transform the HTML using Vite (this processes your CSS and React)
          const template = await fs.promises.readFile(
            path.resolve(process.cwd(), 'client/index.html'),
            'utf-8'
          );
          const html = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } else {
      // Production static file serving
      const distPath = path.join(process.cwd(), 'dist/public');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error(err);
    });

    // Start server on port 5000 (as expected by workflow)
    const port = Number(process.env.PORT) || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server running on port ${port}`);
      log(`Frontend with styling: http://localhost:${port}`);
      log(`API endpoints: http://localhost:${port}/api`);
      log(`Image uploads: Ready (10MB limit)`);
      log(`Uploads directory: ${uploadsDir}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Add startTime to request for logging
app.use((req: any, res, next) => {
  req.startTime = Date.now();
  next();
});

// Start the server
startServer();