import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import type { IStorage } from "./storage";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";

const app = express();

// Create database storage instance
const dbStorage = new DatabaseStorage();
export let storage: IStorage = dbStorage;

// Create uploads directory for image functionality
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads (preserving existing functionality)
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

// Basic middleware with support for large files
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [clean-server] ${message}`);
}

// Add request timing middleware
app.use((req: any, res, next) => {
  req.startTime = Date.now();
  next();
});

// Request logging middleware
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
    const duration = Date.now() - (req as any).startTime;

    if (path.startsWith("/api") || path.startsWith("/auth")) {
      log(`${method} ${path} ${status} in ${duration}ms`);
    }
  });

  next();
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  log(`Error: ${message}`);
  res.status(status).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? message : 'Something went wrong'
  });
});

async function startServer() {
  try {
    log("Starting Poopalotzi with restored frontend styling...");
    
    // Initialize database only in development
    if (process.env.NODE_ENV === 'development') {
      log("Setting up database schema...");
      const dbSuccess = await setupFullDatabase();
      if (dbSuccess) {
        log("Database connection established!");
      } else {
        log("Database connection failed - exiting");
        process.exit(1);
      }
    }
    
    // Set up authentication
    setupAuth(app);
    
    // Register API routes
    const server = await registerRoutes(app);
    
    // Setup frontend with Vite in development, static files in production
    if (process.env.NODE_ENV === 'development') {
      log("Setting up Vite for frontend styling...");
      
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
        configFile: path.resolve(process.cwd(), 'vite.config.ts'),
        root: path.resolve(process.cwd(), 'client'),
      });

      app.use(vite.middlewares);

      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;

        if (url.startsWith('/api/') || url.startsWith('/auth/') || url.startsWith('/uploads/')) {
          return next();
        }

        try {
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
      const distPath = path.join(process.cwd(), 'dist/public');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }

    const port = Number(process.env.PORT) || 5000;
    
    server.listen(port, "0.0.0.0", () => {
      log(`Server running on port ${port}`);
      log(`Frontend with styling: http://localhost:${port}`);
      log(`API endpoints: http://localhost:${port}/api`);
      log(`Image uploads: Ready (${uploadsDir})`);
    });

  } catch (error: any) {
    log(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();