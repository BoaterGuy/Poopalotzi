import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { setupAuth } from "./auth";
import { storage as memStorage, IStorage } from "./storage";

// Export storage interface for routes
export let storage: IStorage = memStorage;

// Initialize Express app
const app = express();

// Middleware: CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware: Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Test CORS route
app.get("/test-cors", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "test-cors.html"));
});

// Logging middleware for API routes
app.use((req, res, next) => {
  const start = Date.now();
  const url = req.path;
  let responseJson: any;

  const originalJson = res.json;
  res.json = (body) => {
    responseJson = body;
    return originalJson.call(res, body);
  };

  res.on("finish", () => {
    if (url.startsWith("/api")) {
      const duration = Date.now() - start;
      let msg = `${req.method} ${url} ${res.statusCode} in ${duration}ms`;
      if (responseJson) {
        msg += ` :: ${JSON.stringify(responseJson)}`;
      }
      if (msg.length > 80) {
        msg = msg.slice(0, 79) + "…";
      }
      log(msg);
    }
  });

  next();
});

// Seed in-memory data for development
async function initializeMemoryData() {
  try {
    console.log("Initializing memory data...");
    const { hashPassword } = await import("./auth");
    const passwordHash = await hashPassword("admin123");
    await storage.upsertUser({
      id: 1,
      email: "admin@poopalotzi.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      passwordHash,
      createdAt: new Date()
    });
    console.log("Default admin created: admin@poopalotzi.com / admin123");
  } catch (err) {
    console.error("Error seeding memory data:", err);
  }
}

// Application bootstrap
async function init() {
  try {
    log("Using in-memory storage for development");
    storage = memStorage;
    await initializeMemoryData();
  } catch (err: any) {
    console.error("Initialization error:", err);
    process.exit(1);
  }

  // Setup auth and API routes
  setupAuth(app);
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
    console.error(err);
  });

  // Development or production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Serve static assets from root public directory
    const staticPath = path.join(process.cwd(), "dist", "public");
     app.use(express.static(staticPath));
     // SPA fallback
     app.get("*", (_req, res) => {
       res.sendFile(path.join(staticPath, "index.html"));
     });
  }

  // Start server
  const port = parseInt(process.env.PORT ?? "5000", 10);
  await new Promise<void>((resolve) => {
    server.listen({ port, host: "0.0.0.0" }, () => {
      log(`Server running at http://0.0.0.0:${port}`);
      resolve();
    });
  });
}

// Launch
init().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
