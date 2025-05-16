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

// Replace memory storage with database storage
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
    // Add service levels
    await Promise.all([
      // Single-head boats
      storage.createServiceLevel({
        name: "Single Service (Single-Head)",
        price: 60, // $60.00 in dollars
        type: "one-time",
        headCount: 1,
        description: "One-time pump-out service for single-head boats",
        isActive: true,
      }),
      storage.createServiceLevel({
        name: "Monthly Plan (Single-Head)",
        price: 100, // $100.00 in dollars
        type: "monthly",
        headCount: 1,
        monthlyQuota: 2,
        description: "Monthly plan with up to 2 pump-outs for single-head boats",
        isActive: true,
      }),
      storage.createServiceLevel({
        name: "Seasonal Service (Single-Head)",
        price: 475, // $475.00 in dollars
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
      storage.createServiceLevel({
        name: "Single Service (Multi-Head)",
        price: 75, // $75.00 in dollars
        type: "one-time",
        headCount: 2,
        description: "One-time pump-out service for multi-head boats",
        isActive: true,
      }),
      storage.createServiceLevel({
        name: "Monthly Plan (Multi-Head)",
        price: 140, // $140.00 in dollars
        type: "monthly",
        headCount: 2,
        monthlyQuota: 2,
        description: "Monthly plan with up to 2 pump-outs for multi-head boats",
        isActive: true,
      }),
      storage.createServiceLevel({
        name: "Seasonal Service (Multi-Head)",
        price: 675, // $675.00 in dollars
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
      storage.createMarina({
        name: "Cedar Point Marina",
        isActive: true,
      }),
      storage.createMarina({
        name: "Son Rise Marina",
        isActive: true,
      }),
      storage.createMarina({
        name: "Port Clinton Yacht Club",
        isActive: true,
      }),
      storage.createMarina({
        name: "Craft Marine",
        isActive: true,
      }),
    ]);
    
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    // Create sample admin user
    const adminUser = await storage.createUser(
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
    const employeeUser = await storage.createUser(
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
    const memberUser = await storage.createUser(
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
    const boatOwner = await storage.createBoatOwner({ userId: memberUser.id });
    
    // Create boats for scheduling test data
    const boat1 = await storage.createBoat({
      ownerId: boatOwner.id,
      name: "Summer Dream",
      year: 2018,
      make: "Sea Ray",
      model: "Sundancer 320",
      color: "White/Blue",
      dockingDirection: "bow_in",
      tieUpSide: "starboard",
      pumpPortLocations: ["port", "stern"],
      notes: "Access code for dock is #1234"
    });

    const boat2 = await storage.createBoat({
      ownerId: boatOwner.id,
      name: "Wave Runner",
      year: 2020,
      make: "Boston Whaler",
      model: "Conquest 285",
      color: "White/Navy",
      dockingDirection: "stern_in",
      tieUpSide: "port",
      pumpPortLocations: ["starboard"],
      notes: "Call 15 mins before arrival"
    });

    // Create slip assignments
    await storage.createSlipAssignment({
      boatId: boat1.id,
      marinaId: 1, // Cedar Point Marina
      dock: 3,
      slip: 12
    });

    await storage.createSlipAssignment({
      boatId: boat2.id,
      marinaId: 2, // Son Rise Marina
      dock: 5,
      slip: 7
    });

    // Create current week for pump-out requests
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday of current week
    
    // Format dates as ISO strings (YYYY-MM-DD)
    const formatDateForRequest = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    // Create sample service history for the member's boats
    // Create a completed service from last week for boat1
    await storage.createPumpOutRequest({
      boatId: boat1.id,
      weekStartDate: formatDateForRequest(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      status: "Completed",
      paymentStatus: "Paid",
      paymentId: "sim_" + Date.now() + "1",
      ownerNotes: "Please call before arriving"
    });
    
    // Create a canceled service from 2 weeks ago for boat1
    await storage.createPumpOutRequest({
      boatId: boat1.id,
      weekStartDate: formatDateForRequest(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)), // 12 days ago
      status: "Canceled",
      paymentStatus: "Refunded",
      paymentId: "sim_" + Date.now() + "2",
      ownerNotes: "Boat will be at slip #12"
    });
    
    // Create a scheduled service for this week for boat1
    await storage.createPumpOutRequest({
      boatId: boat1.id,
      weekStartDate: formatDateForRequest(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), // 2 days from now
      status: "Scheduled",
      paymentStatus: "Paid",
      paymentId: "sim_" + Date.now() + "3",
      ownerNotes: "Please text 30 minutes before arrival"
    });
    
    // Create a pending service for boat2
    await storage.createPumpOutRequest({
      boatId: boat2.id,
      weekStartDate: formatDateForRequest(new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)), // 9 days from now
      status: "Requested",
      paymentStatus: "Pending",
      ownerNotes: ""
    });
    
    // Create a waitlisted service for boat2
    await storage.createPumpOutRequest({
      boatId: boat2.id,
      weekStartDate: formatDateForRequest(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 days from now
      status: "Waitlisted",
      paymentStatus: "Paid",
      paymentId: "sim_" + Date.now() + "4",
      ownerNotes: "High priority for Friday if possible"
    });

    log("Sample data initialized in memory storage");
  } catch (seedError) {
    log("Error seeding initial data: " + seedError);
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
    
    // Create a database storage instance
    const dbStorage = new DatabaseStorage();
    
    // Replace memory storage with database
    storage = dbStorage;
    
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