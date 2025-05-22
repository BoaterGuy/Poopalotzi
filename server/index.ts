import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupDatabase } from "./simple-db";
import { SimpleDatabaseStorage } from "./database-storage-simple";
import { storage as memStorage, IStorage } from "./storage";
import { createSupabaseClient, verifySchema } from "./supabase-db";
import bcrypt from "bcryptjs";
import { setupAuth } from "./auth";

// Variable to hold our storage implementation
// Start directly with database storage to ensure consistent behavior across browsers
export let storage: IStorage;

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
    const status = res.statusCode;
    
    if (path.startsWith("/api") || path.startsWith("/auth")) {
      log(`${req.method} ${path} ${status} in ${duration}ms :: ${
        capturedJsonResponse ? JSON.stringify(capturedJsonResponse) : ""
      }`);
    }
  });

  next();
});

// Initialize memory data for development
async function initializeMemoryData() {
  log('Initializing sample data in memory storage');
  
  // Create service levels
  await storage.createServiceLevel({
    name: 'Basic - Single Head',
    price: 49900, // $499.00
    type: 'monthly',
    description: 'Monthly pump-out service for boats with a single head',
    headCount: 1,
    monthlyQuota: 4,
    onDemandQuota: 0
  });
  
  await storage.createServiceLevel({
    name: 'Premium - Multi Head',
    price: 69900, // $699.00
    type: 'monthly',
    description: 'Monthly pump-out service for boats with multiple heads',
    headCount: 2,
    monthlyQuota: 8,
    onDemandQuota: 0
  });
  
  await storage.createServiceLevel({
    name: 'On-Demand Service',
    price: 17900, // $179.00
    type: 'one-time',
    description: 'One-time pump-out service',
    headCount: 1,
    monthlyQuota: 0,
    onDemandQuota: 1
  });
  
  await storage.createServiceLevel({
    name: 'Seasonal Package',
    price: 249900, // $2,499.00
    type: 'seasonal',
    description: 'Seasonal pump-out service package (May through October)',
    headCount: 1,
    monthlyQuota: 4,
    onDemandQuota: 0,
    seasonStart: new Date(2023, 4, 1), // May 1
    seasonEnd: new Date(2023, 9, 31) // October 31
  });
  
  // Create marinas
  await storage.createMarina({
    name: 'Cedar Point Marina',
    isActive: true
  });
  
  await storage.createMarina({
    name: 'Son Rise Marina',
    isActive: true
  });
  
  await storage.createMarina({
    name: 'Bay Harbor Marina',
    isActive: true
  });
  
  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  const adminUser = await storage.createUser({
    email: 'admin@poopalotzi.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  }, adminHash);
  
  // Create employee user
  const employeeHash = await bcrypt.hash('employee123', 10);
  const employeeUser = await storage.createUser({
    email: 'employee@poopalotzi.com',
    firstName: 'Employee',
    lastName: 'User',
    role: 'employee'
  }, employeeHash);
  
  // Create member user
  const memberHash = await bcrypt.hash('member123', 10);
  const memberUser = await storage.createUser({
    email: 'member@poopalotzi.com',
    firstName: 'Member',
    lastName: 'User',
    role: 'member',
    serviceLevelId: 1
  }, memberHash);
  
  // Create boat owner
  const boatOwner = await storage.createBoatOwner({
    userId: memberUser.id
  });
  
  // Create boats for the member
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
    dock: "3",
    slip: 12
  });

  await storage.createSlipAssignment({
    boatId: boat2.id,
    marinaId: 2, // Son Rise Marina
    dock: "5",
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
  // Completed request from last week for Boat 1
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  await storage.createPumpOutRequest({
    boatId: boat1.id,
    weekStartDate: formatDateForRequest(lastWeekStart),
    status: 'Completed',
    ownerNotes: 'Please clean deck area when done',
    paymentStatus: 'Paid'
  });
  
  // Current week request for Boat 1
  await storage.createPumpOutRequest({
    boatId: boat1.id,
    weekStartDate: formatDateForRequest(weekStart),
    status: 'Scheduled',
    ownerNotes: 'Dock key in lock box',
    paymentStatus: 'Paid'
  });
  
  // Upcoming request for Boat 2
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  
  await storage.createPumpOutRequest({
    boatId: boat2.id,
    weekStartDate: formatDateForRequest(nextWeekStart),
    status: 'Requested',
    ownerNotes: 'Please text 30 mins before arrival',
    paymentStatus: 'Pending'
  });
  
  log('Sample data initialization complete');
}

// Main function to start the server
async function startServer() {
  try {
    // Set up vite middleware for development
    await setupVite(app);
    
    // Try to initialize storage
    try {
      // Initialize database schema
      const dbSuccess = await setupDatabase();
      
      if (dbSuccess) {
        // Create a database storage instance
        const dbStorage = new SimpleDatabaseStorage();
        
        // Replace memory storage with database
        storage = dbStorage;
        
        log("Successfully connected to the database!");
      } else {
        throw new Error("Database setup failed");
      }
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();