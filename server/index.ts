import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupDatabase } from "./db";
import { DatabaseStorage } from "./database-storage";
import { storage as memStorage, IStorage } from "./storage";
import { createSupabaseClient, verifySchema } from "./supabase-db";

// Replace memory storage with database storage
export let storage: IStorage = memStorage;

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

(async () => {
  let dbInitialized = false;
  
  // First try with Neon/Supabase direct connector
  try {
    log("Trying to connect with Neon Serverless client...");
    const supabaseClient = await createSupabaseClient();
    
    if (supabaseClient) {
      log("Successfully connected with Neon Serverless client");
      const schemaExists = await verifySchema(supabaseClient);
      
      if (schemaExists) {
        // In a complete implementation, we'd use the supabaseClient for database operations
        // For now, let's still use the DatabaseStorage since it's already implemented
        storage = new DatabaseStorage();
        log("Using database storage with Supabase connection");
        dbInitialized = true;
      } else {
        log("Schema doesn't exist in Supabase database");
      }
    }
  } catch (err) {
    log("Failed to connect with Neon Serverless client: " + (err as Error).message);
  }
  
  // Fallback to regular pg client if Neon client failed
  if (!dbInitialized) {
    dbInitialized = await setupDatabase();
    if (dbInitialized) {
      // Switch to database storage
      storage = new DatabaseStorage();
      log("Using database storage with pg client");
    } else {
      log("Failed to initialize database, using in-memory storage");
      // Continue with memory storage
    }
  }
  
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
