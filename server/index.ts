import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import { storage as memStorage, IStorage } from "./storage";
import bcrypt from "bcryptjs";
import { setupAuth } from "./auth";

// Set Clover environment variables if not already set
if (!process.env.CLOVER_APP_ID) {
  process.env.CLOVER_APP_ID = "31D3CVCYAW57J";
}
if (!process.env.CLOVER_APP_SECRET) {
  process.env.CLOVER_APP_SECRET = "f0e16559-c836-f25b-b536-b03ed7e95ae9";
}
if (!process.env.CLOVER_ENVIRONMENT) {
  process.env.CLOVER_ENVIRONMENT = "sandbox";
}

// Create a database storage instance right away
const dbStorage = new DatabaseStorage();
// ALWAYS use the database storage, not the in-memory storage
// This ensures all parts of the application use the same data source
export let storage: IStorage = dbStorage;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    if (path.startsWith("/api") || path.startsWith("/auth")) {
      log(`${req.method} ${path} ${status} in ${duration}ms :: ${
        capturedJsonResponse ? JSON.stringify(capturedJsonResponse) : ""
      }`);
    }
  });

  next();
});

// Format dates as ISO strings (YYYY-MM-DD)
const formatDateForRequest = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Main function to start the server
async function startServer() {
  try {
    // Initialize database schema conditionally
    if (process.env.NODE_ENV !== 'production') {
      log("Development environment detected, running database setup to fix schema...");
      const dbSuccess = await setupFullDatabase();
      if (dbSuccess) {
        log("Successfully connected to the database!");
        log("All database tables set up successfully!");
      } else {
        log("Database connection error - exiting");
        process.exit(1);
      }
    } else {
      log("Production environment detected. Skipping automatic database setup/seeding.");
    }
    
    // Set up authentication with the proper storage
    setupAuth(app);
    
    // Register API routes before setting up Vite
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error(err);
    });

    // Setup Vite AFTER registering all API routes
    // so the catch-all route doesn't interfere with the API
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();