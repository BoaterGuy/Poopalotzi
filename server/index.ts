// Lazy import approach to handle missing dependencies gracefully
import { createServer } from "http";

// Get PORT from environment
const PORT = parseInt(process.env.PORT || "3000", 10);

// Storage will be initialized after dependency check
export let storage: any;

async function startServer() {
  try {
    // Try to dynamically import all dependencies
    const express = await import("express");
    const cors = await import("cors");
    const { registerRoutes } = await import("./routes");
    const { setupFullDatabase } = await import("./setup-database");
    const { DatabaseStorage } = await import("./database-storage");
    const storageModule = await import("./storage");
    const bcrypt = await import("bcryptjs");
    const { setupAuth } = await import("./auth");

    // Initialize storage after successful imports
    storage = new DatabaseStorage();

    // Function to create hardcoded Clover configuration
    const setupHardcodedClover = async () => {
      if (process.env.ENABLE_HARDCODED_CLOVER === "true" && 
          process.env.CLOVER_MERCHANT_ID && 
          process.env.CLOVER_ACCESS_TOKEN) {
        
        try {
          // Check if config already exists
          const existingConfig = await storage.getCloverConfig();
          if (existingConfig) {
            console.log('🔧 Clover already configured, skipping hardcoded setup');
            return;
          }

          // Create hardcoded configuration
          await storage.createCloverConfig({
            merchantId: process.env.CLOVER_MERCHANT_ID,
            appId: process.env.CLOVER_APP_ID!,
            appSecret: process.env.CLOVER_APP_SECRET!,
            accessToken: process.env.CLOVER_ACCESS_TOKEN,
            environment: process.env.CLOVER_ENVIRONMENT || 'production',
            isActive: true
          });
          
          console.log('✅ Hardcoded Clover configuration created successfully');
        } catch (error) {
          console.error('❌ Failed to create hardcoded Clover configuration:', error);
        }
      }
    };

    // Simple logging function
    const log = console.log;

    // Set Clover environment variables if not already set - Production configuration
    if (!process.env.CLOVER_APP_ID) {
      process.env.CLOVER_APP_ID = "8QSDCRTWSBPWT";
    }
    if (!process.env.CLOVER_APP_SECRET) {
      process.env.CLOVER_APP_SECRET = "e64d0c27-88fa-5b21-08de-976ea7801421";
    }
    if (!process.env.CLOVER_ENVIRONMENT) {
      process.env.CLOVER_ENVIRONMENT = "production";
    }
    if (!process.env.CLOVER_PUBLIC_KEY) {
      process.env.CLOVER_PUBLIC_KEY = "e5d70e8fdd9e53e18b8c46ebc91fa79a";
    }

    // Create Express app
    const app = express.default();

    // Trust proxy for correct secure cookie handling in Replit
    app.set('trust proxy', 1);

    // Middleware
    app.use(cors.default({
      origin: true,
      credentials: true,
    }));

    app.use(express.default.json({ limit: '50mb' }));
    app.use(express.default.urlencoded({ extended: true, limit: '50mb' }));

    // Setup authentication
    setupAuth(app);

    // Setup database
    await setupFullDatabase();
    await setupHardcodedClover();

    // Vite dev server integration - MUST come before registerRoutes
    if (process.env.NODE_ENV === "development") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.ssrFixStacktrace);
      app.use(vite.middlewares);
    } else {
      // Production static file serving
      app.use(express.default.static("dist/client"));
      app.get("*", (_req, res) => {
        res.sendFile(process.cwd() + "/dist/client/index.html");
      });
    }

    // Register API routes AFTER Vite middleware
    registerRoutes(app);

    // Start server
    const server = app.listen(PORT, "0.0.0.0", () => {
      log(`🚀 Server running on port ${PORT}`);
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
    // Fallback: Start minimal HTTP server when dependencies are missing
    console.warn("⚠️  Dependencies not installed, starting fallback server...");
    console.warn("⚠️  Please run 'npm ci' to install dependencies for full functionality");
    
    const fallbackServer = createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Poopalotzi - Starting Up</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .logo { font-size: 2.5em; color: #2563eb; margin-bottom: 20px; }
            .message { font-size: 1.2em; color: #374151; margin-bottom: 20px; }
            .status { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🚤 Poopalotzi</div>
            <div class="message">Server is starting up...</div>
            <div class="status">Dependencies are being installed. Please wait a moment and refresh.</div>
            <p>If this message persists, please contact support.</p>
          </div>
        </body>
        </html>
      `);
    });

    fallbackServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🔧 Fallback server running on port ${PORT} - dependencies need to be installed`);
    });
  }
}

startServer();