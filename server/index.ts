import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import { storage as memStorage, IStorage } from "./storage";
import bcrypt from "bcryptjs";
import { setupAuth } from "./auth";

// Export storage for other modules - Use database storage for persistence
export const storage = new DatabaseStorage();

// Function to create hardcoded Clover configuration
async function setupHardcodedClover() {
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
}

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

// DISABLE HARD-CODING: Test OAuth flow with correct redirect URI
// Set this to true to enable hard-coded Clover connection
process.env.ENABLE_HARDCODED_CLOVER = "false";

// Hard-code merchant credentials (bypasses OAuth)
if (!process.env.CLOVER_MERCHANT_ID && process.env.ENABLE_HARDCODED_CLOVER === "true") {
  process.env.CLOVER_MERCHANT_ID = "PFHDQ8MSX5F81";
  console.log("🔧 Hard-coded Clover Merchant ID set");
}
if (!process.env.CLOVER_ACCESS_TOKEN && process.env.ENABLE_HARDCODED_CLOVER === "true") {
  process.env.CLOVER_ACCESS_TOKEN = "PASTE_YOUR_PRODUCTION_TOKEN_HERE";
  console.log("🔧 Hard-coded Clover Access Token set");
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// CRITICAL: Set up proxy trust BEFORE any session middleware for external browsers
// Force proxy trust for external browser compatibility
app.set("trust proxy", 1);
console.log("🔧 PROXY TRUST ENABLED for external browser compatibility");

// CORS configuration for production HTTPS environment
app.use(cors({
  origin: 'https://1b423122-988c-4041-913f-504458c4eb91-00-b968ik9ict5p.janeway.replit.dev',
  credentials: true
}));
console.log("🌐 CORS ENABLED with credentials support for session cookies");

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
    
    // Set up hardcoded Clover configuration if enabled
    await setupHardcodedClover();

    // Health check endpoint - must be before other routes
    app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: "ok", timestamp: new Date().toISOString(), port: PORT });
    });

    // Serve debug page
    app.get('/debug', (req: Request, res: Response) => {
      const path = require('path');
      res.sendFile(path.resolve('session-debug.html'));
    });

    // Content Security Policy - set for all requests
    app.use((req, res, next) => {
      res.setHeader('Content-Security-Policy',
        "default-src 'self'; connect-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'");
      next();
    });

    // Set up authentication
    console.log("🔧 About to call setupAuth...");
    setupAuth(app);
    console.log("🔧 setupAuth call completed");

    // Register API routes
    registerRoutes(app);

    // Handle static file serving and SPA routing
    const path = await import("path");
    
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, '../dist')));
      app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));
    } else {
      // Development: Force rebuild and serve fresh
      try {
        const { execSync } = await import('child_process');
        const fs = await import('fs');
        const distPath = path.resolve("dist/public");
        
        // Always rebuild in development to get latest changes
        log("Development mode: Force rebuilding client to get latest changes...");
        try {
          // Remove old build
          if (fs.existsSync(distPath)) {
            fs.rmSync(distPath, { recursive: true, force: true });
          }
          execSync('npm run build', { stdio: 'inherit' });
        } catch (error) {
          log("Standard build failed, trying fallback...");
          execSync('npx vite build --config vite.config.ts.original', { stdio: 'inherit' });
        }
        
        // Serve built files with strong cache headers for development
        app.use(express.static(path.join(__dirname, '../dist'), {
          etag: false,
          lastModified: false,
          maxAge: 0
        }));
        
        
        // SPA fallback
        app.get("*", (_req, res) => {
          if (!_req.path.startsWith("/api")) {
            res.sendFile(path.join(__dirname, '../dist/index.html'));
          }
        });
        
        log("Fresh React app built and served successfully");
      } catch (buildError) {
        log("Build failed, serving fallback HTML");
        // Serve original Poopalotzi content if build fails
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
                    .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); }
                    .card { transition: transform 0.3s ease; }
                    .card:hover { transform: translateY(-5px); }
                    .btn { transition: all 0.3s ease; }
                    .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
                  </style>
                </head>
                <body class="bg-gray-50">
                  <!-- Header -->
                  <header class="bg-white shadow-sm">
                    <div class="container mx-auto px-4 py-4">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                          <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <span class="text-white font-bold text-lg">P</span>
                          </div>
                          <h1 class="text-2xl font-bold text-gray-900">Poopalotzi</h1>
                        </div>
                        <nav class="space-x-6">
                          <a href="#" class="text-gray-700 hover:text-blue-600 transition">Home</a>
                          <a href="#" class="text-gray-700 hover:text-blue-600 transition">Services</a>
                          <a href="#" class="text-gray-700 hover:text-blue-600 transition">About</a>
                          <a href="#" class="text-gray-700 hover:text-blue-600 transition">Contact</a>
                          <a href="#" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Login</a>
                        </nav>
                      </div>
                    </div>
                  </header>

                  <!-- Hero Section -->
                  <section class="hero min-h-screen flex items-center justify-center">
                    <div class="text-center max-w-4xl mx-auto px-4">
                      <h1 class="text-6xl font-bold text-gray-900 mb-6">Poopalotzi</h1>
                      <h2 class="text-4xl font-semibold text-gray-800 mb-8">Simplify Your Boating Lifestyle</h2>
                      <p class="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                        Schedule pump-outs, track services, and maintain your vessel with ease. 
                        The intelligent solution for the savvy boater.
                      </p>
                      
                      <div class="bg-white rounded-lg shadow-lg p-8 mx-auto max-w-md mb-8">
                        <p class="text-3xl font-bold text-gray-900 mb-2">We are #1 in the #2 business</p>
                        <p class="text-gray-600">Professional boat pump-out services you can trust</p>
                      </div>
                      
                      <div class="mb-12">
                        <h3 class="text-4xl font-bold text-red-500 italic mb-4">Let us take care of your business!</h3>
                        <div class="space-x-4">
                          <button class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition btn">
                            Schedule Service
                          </button>
                          <button class="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition btn">
                            Learn More
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- Features Section -->
                  <section class="py-16 bg-white">
                    <div class="container mx-auto px-4">
                      <h2 class="text-3xl font-bold text-center mb-12 text-gray-900">Why Choose Poopalotzi?</h2>
                      <div class="grid md:grid-cols-3 gap-8">
                        <div class="text-center p-6 card bg-white rounded-lg shadow-md">
                          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 class="text-xl font-semibold mb-2">Quick & Reliable</h3>
                          <p class="text-gray-600">Fast response times and dependable service when you need it most.</p>
                        </div>
                        <div class="text-center p-6 card bg-white rounded-lg shadow-md">
                          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 class="text-xl font-semibold mb-2">Professional Service</h3>
                          <p class="text-gray-600">Certified technicians with years of marine service experience.</p>
                        </div>
                        <div class="text-center p-6 card bg-white rounded-lg shadow-md">
                          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 class="text-xl font-semibold mb-2">Easy Booking</h3>
                          <p class="text-gray-600">Simple online scheduling that fits your busy boating schedule.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <!-- Footer -->
                  <footer class="bg-gray-900 text-white py-12">
                    <div class="container mx-auto px-4 text-center">
                      <div class="flex items-center justify-center space-x-4 mb-6">
                        <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <span class="text-white font-bold text-lg">P</span>
                        </div>
                        <h3 class="text-2xl font-bold">Poopalotzi</h3>
                      </div>
                      <p class="text-gray-400 mb-6">Professional boat pump-out services for marina customers</p>
                      <p class="text-gray-500 text-sm">© 2025 Poopalotzi LLC. All rights reserved.</p>
                    </div>
                  </footer>
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