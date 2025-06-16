import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import { storage as memStorage, IStorage } from "./storage";
import bcrypt from "bcryptjs";
import { setupAuth } from "./auth";

// Export storage for other modules
export const storage = memStorage;

// Simple logging function
const log = console.log;

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

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (body) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const path = req.path;

    // Only log API routes to reduce noise
    if (path.startsWith('/api')) {
      log(`${req.method} ${path} ${status} in ${duration}ms :: ${
        typeof body === 'string' ? body.slice(0, 100) : '[Object]'
      }`);
    }

    return originalSend.call(this, body);
  };

  next();
});

async function setupDatabaseConnection() {
  try {
    if (process.env.NODE_ENV === "development") {
      log("Development environment detected, running database setup to fix schema...");
      await setupFullDatabase();
      try {
        log("Successfully connected to the database!");
        log("All database tables set up successfully!");
      } catch (error) {
        log("Database connection error - exiting");
        process.exit(1);
      }
    } else {
      log("Production environment detected. Skipping automatic database setup/seeding.");
    }
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

async function startServer() {
  try {
    await setupDatabaseConnection();

    // Health check endpoint - must be before other routes
    app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: "ok", timestamp: new Date().toISOString(), port: PORT });
    });

    // Set up authentication
    setupAuth(app);

    // Register API routes
    registerRoutes(app);

    // Handle static file serving and SPA routing
    const path = await import("path");
    
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.resolve("dist/public")));
      
      app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
          res.sendFile(path.resolve("dist/public/index.html"));
        }
      });
    } else {
      // Development: Remove stale builds and serve fresh content
      const distPath = path.resolve("dist/public");
      const fs = await import('fs');
      
      // Remove stale build to ensure fresh development
      if (fs.existsSync(distPath)) {
        log("Removing stale build directory for fresh development...");
        fs.rmSync(distPath, { recursive: true, force: true });
      }
      
      // Fallback HTML for development without build
      app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
          res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Marina Management System</title>
                <script src="https://cdn.tailwindcss.com"></script>
              </head>
              <body class="bg-gray-50">
                <div class="min-h-screen flex items-center justify-center p-4">
                  <div class="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <h1 class="text-3xl font-bold text-gray-900 mb-6">Marina Management System</h1>
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                      <strong>Server Status:</strong> Running on port ${PORT}
                    </div>
                    <p class="text-gray-600 mb-6">Your backend is running successfully!</p>
                    <div class="space-y-3">
                      <a href="/api/health" class="block bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition">
                        API Health Check
                      </a>
                      <p class="text-sm text-gray-500">The React frontend will be available once built.</p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `);
        }
      });
    }

    // Try to start server, with port fallback
    const server = app.listen(PORT, "0.0.0.0", () => {
      log(`serving on port ${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is in use. Try: PORT=3000 npm run dev`);
        process.exit(1);
      } else {
        console.error("Server error:", err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();