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

// Cache-busting middleware for development
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  next();
});

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Raw text parser for Clover webhooks
app.use('/api/webhooks/clover', express.raw({ type: 'text/plain' }));

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
      // Development: Use existing Vite server setup
      try {
        const viteModule = await import("./vite");
        const viteBuild = await viteModule.default();
        
        // Serve the built client files
        app.use(express.static(viteBuild.outDir));
        
        // SPA fallback for client-side routing
        app.get("*", (req, res) => {
          if (!req.path.startsWith("/api")) {
            res.sendFile(path.resolve(viteBuild.outDir, "index.html"));
          }
        });
        
        log("Vite server setup complete");
      } catch (error) {
        log("Vite server setup failed, serving manual HTML");
        // Serve the client HTML directly
        app.get("*", (req, res) => {
          if (!req.path.startsWith("/api")) {
            res.send(`
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>Poopalotzi - Boat Pump-Out Service</title>
                  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
                  <script src="https://cdn.tailwindcss.com"></script>
                  <style>
                    body { font-family: 'Open Sans', sans-serif; }
                    h1, h2, h3 { font-family: 'Montserrat', sans-serif; }
                    .hero { background: linear-gradient(135deg, #F4EBD0 0%, #E5D5B7 100%); }
                    .navy { background-color: #0B1F3A; }
                    .primary { background-color: #38B2AC; }
                    .accent { background-color: #FF6B6B; }
                  </style>
                </head>
                <body>
                  <div id="root">
                    <div class="hero min-h-screen flex items-center justify-center">
                      <div class="text-center max-w-4xl mx-auto px-4">
                        <h1 class="text-6xl font-bold text-gray-900 mb-6">Poopalotzi</h1>
                        <h2 class="text-3xl font-semibold text-gray-800 mb-8">Simplify Your Boating Lifestyle</h2>
                        <p class="text-xl text-gray-700 mb-8">Schedule pump-outs, track services, and maintain your vessel with ease. The intelligent solution for the savvy boater.</p>
                        <img src="/logo.png" alt="Poopalotzi Logo" class="mx-auto mb-8 w-64 h-auto rounded-lg shadow-lg">
                        <div class="bg-white rounded-lg shadow-md p-6 mx-auto max-w-md">
                          <p class="text-2xl font-bold text-gray-900">We are #1 in the #2 business</p>
                        </div>
                        <div class="mt-12">
                          <h3 class="text-3xl font-bold text-red-500 italic">Let us take care of your business!</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                  <script type="module" src="/src/main.tsx"></script>
                </body>
              </html>
            `);
          }
        });
      }
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