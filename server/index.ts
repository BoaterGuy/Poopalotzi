import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupDatabase } from "./db";
import { DatabaseStorage } from "./database-storage";
import { storage as memStorage, IStorage } from "./storage";
import { createSupabaseClient, verifySchema } from "./supabase-db";
import bcrypt from "bcryptjs";

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
  // For now, let's use in-memory storage to ensure the application works
  // This will allow us to focus on application functionality
  log("Using in-memory storage for this session");
  
  // Seed the memory storage with initial data
  // This ensures we have some data to work with even without a database
  try {
    // Add service levels
    await Promise.all([
      // Single-head boats
      memStorage.createServiceLevel({
        name: "Single Service (Single-Head)",
        price: 6000, // $60.00 in cents
        type: "one-time",
        headCount: 1,
        description: "One-time pump-out service for single-head boats",
        isActive: true,
      }),
      memStorage.createServiceLevel({
        name: "Monthly Plan (Single-Head)",
        price: 10000, // $100.00 in cents
        type: "monthly",
        headCount: 1,
        monthlyQuota: 2,
        description: "Monthly plan with up to 2 pump-outs for single-head boats",
        isActive: true,
      }),
      memStorage.createServiceLevel({
        name: "Seasonal Service (Single-Head)",
        price: 47500, // $475.00 in cents
        type: "seasonal",
        headCount: 1,
        monthlyQuota: 2,
        onDemandQuota: 1,
        seasonStart: "05-01",
        seasonEnd: "10-31",
        description: "2 pump-outs per month plus one Single Service to use anytime during season (May-Oct 31)",
        isActive: true,
      }),
      
      // Multi-head boats
      memStorage.createServiceLevel({
        name: "Single Service (Multi-Head)",
        price: 7500, // $75.00 in cents
        type: "one-time",
        headCount: 2,
        description: "One-time pump-out service for multi-head boats",
        isActive: true,
      }),
      memStorage.createServiceLevel({
        name: "Monthly Plan (Multi-Head)",
        price: 14000, // $140.00 in cents
        type: "monthly",
        headCount: 2,
        monthlyQuota: 2,
        description: "Monthly plan with up to 2 pump-outs for multi-head boats",
        isActive: true,
      }),
      memStorage.createServiceLevel({
        name: "Seasonal Service (Multi-Head)",
        price: 67500, // $675.00 in cents
        type: "seasonal",
        headCount: 2,
        monthlyQuota: 2,
        onDemandQuota: 1,
        seasonStart: "05-01",
        seasonEnd: "10-31",
        description: "2 pump-outs per month plus one Single Service to use anytime during season (May-Oct 31)",
        isActive: true,
      }),
    ]);
    
    // Add some sample marinas
    await Promise.all([
      memStorage.createMarina({
        name: "Bayside Marina",
        isActive: true,
      }),
      memStorage.createMarina({
        name: "Harbor Point Yacht Club",
        isActive: true,
      }),
      memStorage.createMarina({
        name: "Sunset Cove Marina",
        isActive: true,
      }),
    ]);
    
    // Hash the password before storing it (these are sample accounts)
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    // Create sample admin user
    const adminUser = await memStorage.createUser(
      {
        email: "admin@poopalotzi.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        password: "admin123", // This is just for the form, not actually used
      },
      hashedPassword // Properly hashed password
    );
    
    // Create sample employee user
    const employeeUser = await memStorage.createUser(
      {
        email: "employee@poopalotzi.com",
        firstName: "Employee",
        lastName: "User",
        role: "employee",
        password: "admin123", // This is just for the form, not actually used
      },
      hashedPassword // Properly hashed password
    );
    
    // Create sample member user
    const memberUser = await memStorage.createUser(
      {
        email: "member@poopalotzi.com",
        firstName: "Member",
        lastName: "User",
        role: "member",
        password: "admin123", // This is just for the form, not actually used
      },
      hashedPassword // Properly hashed password
    );
    
    // Create boat owner record for member
    await memStorage.createBoatOwner({ userId: memberUser.id });
    
    log("Sample data initialized in memory storage");
  } catch (seedError) {
    log("Error seeding initial data: " + seedError);
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
