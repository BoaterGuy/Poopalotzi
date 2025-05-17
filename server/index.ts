import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupDatabase } from "./db";
import { DatabaseStorage } from "./database-storage";
import { storage as memStorage, IStorage } from "./storage";
import { createSupabaseClient, verifySchema } from "./supabase-db";
import bcrypt from "bcryptjs";
import { setupAuth } from "./auth";
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

    // Create a default admin user for testing
    const { hashPassword } = await import('./auth');
    const passwordHash = await hashPassword('admin123');

    await storage.upsertUser({
      id: 1, 
      email: 'admin@poopalotzi.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      passwordHash,
      createdAt: new Date()
    });

    console.log("Created default admin user: admin@poopalotzi.com / admin123");

    // Log success
    console.log("Memory data initialization completed successfully");
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}

// Initialize the application
async function init() {
  try {
    log("Setting up database connection...");
    
    // Check if DATABASE_URL is provided for Supabase
    if (process.env.DATABASE_URL) {
      try {
        // Try to create Supabase client
        const supabaseDB = await createSupabaseClient();
        
        // Check if schema exists
        const schemaExists = await verifySchema(supabaseDB);
        
        if (schemaExists) {
          // Initialize database storage with Supabase client
          storage = new DatabaseStorage();
          log("Successfully connected to Supabase database!");
        } else {
          log("Database schema does not exist. Attempting to run migration...");
          try {
            // Import the migration function
            const { migrateSchema } = await import('./migrate-schema');
            // Execute the migration function
            await migrateSchema();
            log("Schema migration successful!");
            storage = new DatabaseStorage();
          } catch (migrationError: any) {
            log(`Migration error: ${migrationError.message}`);
            log("Falling back to in-memory storage");
            storage = memStorage;
            await initializeMemoryData();
          }
        }
      } catch (dbError: any) {
        log(`Supabase connection error: ${dbError.message}`);
        log("Falling back to in-memory storage");
        storage = memStorage;
        await initializeMemoryData();
      }
    } else {
      log("No DATABASE_URL found. Using in-memory storage");
      storage = memStorage;
      await initializeMemoryData();
    }
  } catch (error: any) {
    log(`Error initializing app: ${error.message}`);
    process.exit(1);
  }

  setupAuth(app);
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT || 5000;
  return new Promise((resolve) => {
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`Server running at http://0.0.0.0:${port}`);
      resolve(server);
    });
  });
}

// Start the server
init().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});