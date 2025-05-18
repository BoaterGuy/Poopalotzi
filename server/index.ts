import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
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

// Logging middleware for /api endpoints
app.use((req, res, next) => {
  const start = Date.now();
  const pathUrl = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathUrl.startsWith("/api")) {
      let logLine = `${req.method} ${pathUrl} ${res.statusCode} in ${duration}ms`;
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

// Helper to seed in-memory data
async function initializeMemoryData() {
  try {
    console.log("Initializing memory data with service levels...");
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
    console.log("Memory data initialization completed successfully");
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}

// Application bootstrap
async function init() {
  try {
    log("Using in-memory storage for development");
    storage = memStorage;
    await initializeMemoryData();
    // Note: Database/Supabase initialization code commented out for now
  } catch (error: any) {
    log(`Error initializing app: ${error.message}`);
    process.exit(1);
  }

  setupAuth(app);
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // Development vs Production handling
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Serve static assets and health-check route
    const staticPath = path.join(process.cwd(), 'dist', 'public');
    app.use(express.static(staticPath));
    app.get('/', (_req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  // Start the HTTP server
  const port = parseInt(process.env.PORT ?? '5000', 10);
  return new Promise((resolve) => {
    server.listen({ port, host: '0.0.0.0' }, () => {
      log(`Server running at http://0.0.0.0:${port}`);
      resolve(server);
    });
  });
}

// Kick off the server
init().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
