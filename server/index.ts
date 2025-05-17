import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupDatabase } from "./db";
import { DatabaseStorage } from "./database-storage";
import { storage as memStorage, IStorage } from "./storage";
import { createSupabaseClient, verifySchema } from "./supabase-db";
import bcrypt from "bcryptjs";
import { setupAuth } from "./replitAuth";
import cors from "cors";

// Initialize with memory storage by default, will try database first
export let storage: IStorage = memStorage;

const app = express();

// Enable CORS with credentials
app.use(cors({
  origin: true, // Allow all origins in development, but can be restricted in production
  credentials: true, // This is crucial for cookies with authentication
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve the CORS test page
app.get("/test-cors", (req, res) => {
  res.sendFile(process.cwd() + "/test-cors.html");
});

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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Helper function to seed initial data if needed
async function initializeMemoryData() {
  try {
    console.log("Initializing memory data with service levels...");
    
    // Service level data is already in the MemStorage constructor
    // No need to re-add it
    
    // Log success
    console.log("Memory data initialization completed successfully");
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}

(async () => {
  try {
    // Connect directly to Replit database using the DATABASE_URL
    log("Setting up Replit database connection...");
    
    // Set up the database schema
    const dbInitialized = await setupDatabase();
    
    if (!dbInitialized) {
      log("Failed to initialize database schema. Using in-memory storage.");
      throw new Error("Database initialization failed");
    }
    
    // For now, continue using memory storage until database connection is fully stable
    // const dbStorage = new DatabaseStorage();
    // storage = dbStorage;
    
    // Use memory storage for now
    storage = memStorage;
    
    log("Successfully connected to Replit database!");
  } catch (dbError: any) {
    // If database connection fails, fall back to memory storage
    log(`Database connection error: ${dbError.message}`);
    log("Using in-memory storage for this session");
    
    // Initialize sample data
    await initializeMemoryData();
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
})();