import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import type { IStorage } from "./storage";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();

// Create database storage instance
const dbStorage = new DatabaseStorage();
export let storage: IStorage = dbStorage;

// Enable CORS for frontend connection
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true
}));

// Create uploads directory for image functionality
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Basic middleware with file upload support
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API server running' });
});

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [backend] ${message}`);
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.json;
  let capturedJsonResponse: any = null;

  res.json = function(this: Response, data: any) {
    capturedJsonResponse = data;
    return originalSend.call(this, data);
  };

  res.on("finish", () => {
    const { method, originalUrl: path } = req;
    const { statusCode: status } = res;
    const duration = Date.now() - start;

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

async function startBackendServer() {
  try {
    log("Starting backend API server with image upload support...");
    
    // Initialize database in development
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
    
    // Register API routes only - no frontend route handling
    const server = await registerRoutes(app);
    
    // Prevent any catch-all routes that might interfere with frontend
    // Only handle API endpoints, let frontend handle all other routes

    const port = 5000;
    
    server.listen(port, "0.0.0.0", () => {
      log(`Backend API server running on port ${port}`);
      log(`API endpoints: http://localhost:${port}/api`);
      log(`Image uploads: Ready (${uploadsDir})`);
      log(`CORS enabled for frontend at http://localhost:3000`);
    });

  } catch (error: any) {
    log(`Failed to start backend server: ${error.message}`);
    process.exit(1);
  }
}

startBackendServer();