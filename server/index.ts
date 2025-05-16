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

// Serve static HTML directly - this needs to be before Vite setup
app.get('/static-site', (req, res) => {
  res.sendFile(process.cwd() + '/client/public/static-site.html');
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
        price: 60, // $60.00 in dollars
        type: "one-time",
        headCount: 1,
        description: "One-time pump-out service for single-head boats",
        isActive: true,
      }),
      memStorage.createServiceLevel({
        name: "Monthly Plan (Single-Head)",
        price: 100, // $100.00 in dollars
        type: "monthly",
        headCount: 1,
        monthlyQuota: 2,
        description: "Monthly plan with up to 2 pump-outs for single-head boats",
        isActive: true,
      }),
      memStorage.createServiceLevel({
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
      memStorage.createServiceLevel({
        name: "Single Service (Multi-Head)",
        price: 75, // $75.00 in dollars
        type: "one-time",
        headCount: 2,
        description: "One-time pump-out service for multi-head boats",
        isActive: true,
      }),
      memStorage.createServiceLevel({
        name: "Monthly Plan (Multi-Head)",
        price: 140, // $140.00 in dollars
        type: "monthly",
        headCount: 2,
        monthlyQuota: 2,
        description: "Monthly plan with up to 2 pump-outs for multi-head boats",
        isActive: true,
      }),
      memStorage.createServiceLevel({
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
    const boatOwner = await memStorage.createBoatOwner({ userId: memberUser.id });
    
    // Create boats for scheduling test data
    const boat1 = await memStorage.createBoat({
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

    const boat2 = await memStorage.createBoat({
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

    // Create another member and boat
    const memberUser2 = await memStorage.createUser(
      {
        email: "john@boatowner.com",
        firstName: "John",
        lastName: "Smith",
        role: "member",
        password: "admin123",
      },
      hashedPassword
    );
    const boatOwner2 = await memStorage.createBoatOwner({ userId: memberUser2.id });
    
    const boat3 = await memStorage.createBoat({
      ownerId: boatOwner2.id,
      name: "Sea Spirit",
      year: 2019,
      make: "Beneteau",
      model: "Oceanis 41.1",
      color: "Navy/White",
      dockingDirection: "side_to",
      tieUpSide: "both",
      pumpPortLocations: ["mid_ship"],
      notes: "Sailboat with keel, be careful when approaching"
    });

    // Create slip assignments
    await memStorage.createSlipAssignment({
      boatId: boat1.id,
      marinaId: 1, // Bayside Marina
      dock: 3,
      slip: 12
    });

    await memStorage.createSlipAssignment({
      boatId: boat2.id,
      marinaId: 2, // Harbor Point Yacht Club
      dock: 5,
      slip: 7
    });

    await memStorage.createSlipAssignment({
      boatId: boat3.id,
      marinaId: 3, // Sunset Cove Marina
      dock: 2,
      slip: 4
    });

    // Create pump-out requests with different dates and statuses
    // Current week
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday of current week
    
    // Format dates as ISO strings (YYYY-MM-DD)
    const formatDateForRequest = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    // Create a completed request for this week
    const request1 = await memStorage.createPumpOutRequest({
      boatId: boat1.id,
      weekStartDate: formatDateForRequest(weekStart),
      status: "Completed",
      ownerNotes: "Please service early in the week",
      paymentStatus: "Paid"
    });

    // Create a scheduled request for this week
    const request2 = await memStorage.createPumpOutRequest({
      boatId: boat2.id,
      weekStartDate: formatDateForRequest(weekStart),
      status: "Scheduled",
      ownerNotes: "Thursday morning preferred",
      paymentStatus: "Paid"
    });

    // Next week
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(weekStart.getDate() + 7);
    
    const request3 = await memStorage.createPumpOutRequest({
      boatId: boat1.id,
      weekStartDate: formatDateForRequest(nextWeekStart),
      status: "Requested",
      ownerNotes: "Any day is fine",
      paymentStatus: "Pending"
    });

    const request4 = await memStorage.createPumpOutRequest({
      boatId: boat3.id,
      weekStartDate: formatDateForRequest(nextWeekStart),
      status: "Requested",
      ownerNotes: "Tuesday afternoon preferred",
      paymentStatus: "Paid"
    });

    // Following week
    const twoWeeksLaterStart = new Date(nextWeekStart);
    twoWeeksLaterStart.setDate(nextWeekStart.getDate() + 7);
    
    const request5 = await memStorage.createPumpOutRequest({
      boatId: boat2.id,
      weekStartDate: formatDateForRequest(twoWeeksLaterStart),
      status: "Waitlisted",
      ownerNotes: "Flexible timing",
      paymentStatus: "Pending"
    });

    // Create employee assignments
    await memStorage.createEmployeeAssignment({
      employeeId: employeeUser.id,
      requestId: request1.id
    });

    await memStorage.createEmployeeAssignment({
      employeeId: employeeUser.id,
      requestId: request2.id
    });

    // Create pump-out logs for completed request
    await memStorage.createPumpOutLog({
      requestId: request1.id,
      prevStatus: "Requested",
      newStatus: "Scheduled"
    });

    await memStorage.createPumpOutLog({
      requestId: request1.id,
      prevStatus: "Scheduled",
      newStatus: "Completed",
      beforeUrl: "https://example.com/before-image.jpg",
      duringUrl: "https://example.com/during-image.jpg",
      afterUrl: "https://example.com/after-image.jpg"
    });
    
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
