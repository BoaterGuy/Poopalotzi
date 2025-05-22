import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupDatabase } from "./simple-db";
import { SimpleDatabaseStorage } from "./database-storage-simple";
import { storage as memStorage, IStorage } from "./storage";
import { createSupabaseClient, verifySchema } from "./supabase-db";
import bcrypt from "bcryptjs";
import { setupAuth } from "./auth";

// Create a database storage instance right away
const dbStorage = new SimpleDatabaseStorage();
export let storage: IStorage = dbStorage;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    // Set up vite middleware for development
    await setupVite(app);
    
    // Initialize database schema
    const dbSuccess = await setupDatabase();
    if (dbSuccess) {
      log("Successfully connected to the database!");
    } else {
      log("Database connection error - exiting");
      process.exit(1);
    }
    
    // Set up authentication with the proper storage
    setupAuth(app);
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error(err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
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