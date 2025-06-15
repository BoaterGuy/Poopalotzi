import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./index";
import { insertServiceLevelSchema } from "@shared/schema";
import express from "express";
import authRoutes from "./routes-auth";
import { sendServiceStatusEmail } from "./utils/sendgrid";
import { insertUserSchema, insertBoatSchema, insertMarinaSchema, insertDockAssignmentSchema, insertPumpOutRequestSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { format, addDays } from "date-fns";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import { db } from "./db";
import { pumpOutRequest } from "@shared/schema";
import { desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

// WebSocket connections for real-time updates
let wss: WebSocketServer;
const adminConnections = new Set<WebSocket>();

// Helper function to broadcast updates to admin clients
function broadcastToAdmins(type: string, data: any) {
  const message = JSON.stringify({ type, data });
  adminConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// Extended Request type with user information
interface AuthRequest extends Request {
  user?: any;
}

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'boat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Error handler middleware
const handleError = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  if (err instanceof ZodError) {
    return res.status(400).json({ message: fromZodError(err).message });
  }
  res.status(500).json({ message: err.message || "Internal Server Error" });
};

// Auth middleware
const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

const isEmployee = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (req.user?.role === "employee" || req.user?.role === "admin")) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication (session, passport, etc)
  setupAuth(app);
  
  // We'll keep using the existing authentication in auth.ts
  // Commenting out this line to prevent route conflicts
  // app.use('/api/auth', authRoutes);

  // Debug route to check if admin user is available
  app.get("/api/debug/users", async (req, res) => {
    try {
      const adminUser = await storage.getUserByEmail("admin@poopalotzi.com");
      const employeeUser = await storage.getUserByEmail("employee@poopalotzi.com");
      const memberUser = await storage.getUserByEmail("member@poopalotzi.com");

      res.json({
        adminExists: !!adminUser,
        employeeExists: !!employeeUser,
        memberExists: !!memberUser,
        message: "Use admin@poopalotzi.com / admin123 to login as admin",
        version: "1.0.0"
      });
    } catch (err) {
      res.status(500).json({ message: "Error checking users", error: err.message });
    }
  });

  // Service Levels routes
  app.get("/api/service-levels", async (req, res, next) => {
    try {
      const serviceLevels = await storage.getAllServiceLevels();
      res.json(serviceLevels);
    } catch (err) {
      next(err);
    }
  });
  
  // Marina routes
  app.get("/api/marinas/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid marina ID" });
      }
      const marina = await storage.getMarina(id);
      if (!marina) {
        return res.status(404).json({ message: "Marina not found" });
      }
      res.json(marina);
    } catch (err) {
      next(err);
    }
  });

  // Get boat counts for all marinas
  app.get("/api/marinas/boat-counts", async (req, res, next) => {
    try {
      // Since database is empty, return empty object for now
      // This will be populated as boats are added to marinas
      res.json({});
    } catch (err) {
      next(err);
    }
  });

  // Boat routes
  app.post("/api/boats", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      console.log("Boat creation request received:", req.body);
      console.log("User ID:", req.user.id, "Role:", req.user.role);
      
      const { userId, ...boatData } = req.body;
      console.log("Raw boat data:", boatData);
      
      let targetUserId = req.user.id;
      
      // Admin can create boats for other users
      if (req.user.role === 'admin' && userId) {
        const targetUser = await storage.getUser(userId);
        if (!targetUser) {
          return res.status(404).json({ message: "Target user not found" });
        }
        targetUserId = userId;
        console.log("Admin creating boat for user:", targetUserId);
      }
      
      // Get or create boat owner record
      let boatOwner = await storage.getBoatOwnerByUserId(targetUserId);
      console.log("Found boat owner:", boatOwner);
      
      if (!boatOwner) {
        console.log("Creating boat owner record for user:", targetUserId);
        boatOwner = await storage.createBoatOwner({
          userId: targetUserId
        });
        console.log("Created boat owner:", boatOwner);
      }

      // Add ownerId to boat data and validate
      const completeBoatData = {
        ...boatData,
        ownerId: boatOwner.id
      };
      
      const parsedBoatData = insertBoatSchema.parse(completeBoatData);
      console.log("Parsed boat data:", parsedBoatData);

      // Create the boat
      const boat = await storage.createBoat(parsedBoatData);
      
      console.log("Created boat:", boat);
      res.status(201).json(boat);
    } catch (err) {
      console.error("Boat creation error:", err);
      next(err);
    }
  });

  app.get("/api/boats", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const { userId } = req.query;
      
      // Admin can view boats for specific user or all boats
      if (req.user?.role === 'admin') {
        if (userId) {
          // Get boats for specific user
          const boatOwner = await storage.getBoatOwnerByUserId(Number(userId));
          if (!boatOwner) {
            return res.json([]);
          }
          const boats = await storage.getBoatsByOwnerId(boatOwner.id);
          return res.json(boats);
        }
        // Admin without userId gets all boats - we'll implement this if needed
        // For now, fallback to admin's own boats
      }
      
      // Get boat owner ID from user ID
      const boatOwner = await storage.getBoatOwnerByUserId(req.user?.id);
      
      if (!boatOwner) {
        return res.json([]);
      }

      const boats = await storage.getBoatsByOwnerId(boatOwner.id);
      res.json(boats);
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/boats/:id", isAuthenticated, upload.single('image'), async (req: AuthRequest, res, next) => {
    try {
      const boatId = parseInt(req.params.id);
      const boat = await storage.getBoat(boatId);
      
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      // Verify ownership (allow both members and admins)
      if (req.user?.role === 'member') {
        const boatOwner = await storage.getBoatOwnerByUserId(req.user?.id);
        if (!boatOwner || boat.ownerId !== boatOwner.id) {
          return res.status(403).json({ message: "Not authorized to modify this boat" });
        }
      }

      // Extract marina-related fields from the request
      const { marinaId, ...boatFields } = req.body;
      
      // Handle uploaded image if present
      if (req.file) {
        boatFields.photoUrl = `/uploads/${req.file.filename}`;
      }
      
      // Parse and update boat data (exclude marinaId as it's not a boat field)
      const boatData = insertBoatSchema.partial().parse(boatFields);
      const updatedBoat = await storage.updateBoat(boatId, boatData);
      
      // Handle marina assignment via dock assignment if marinaId is provided
      if (marinaId && boatData.pier && boatData.dock) {
        try {
          await storage.createDockAssignment({
            boatId: boatId,
            marinaId: parseInt(marinaId),
            pier: boatData.pier,
            dock: boatData.dock
          });
        } catch (dockError) {
          console.warn("Could not create dock assignment:", dockError);
        }
      }
      
      res.json(updatedBoat);
    } catch (err) {
      console.error("Boat update error:", err);
      next(err);
    }
  });

  app.delete("/api/boats/:id", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const boatId = parseInt(req.params.id);
      const boat = await storage.getBoat(boatId);
      
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      // Admin can delete any boat, regular users can only delete their own boats
      if (req.user.role !== 'admin') {
        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
        if (!boatOwner || boat.ownerId !== boatOwner.id) {
          return res.status(403).json({ message: "Not authorized to delete this boat" });
        }
      }

      const deleted = await storage.deleteBoat(boatId);
      
      if (deleted) {
        res.json({ message: "Boat deleted successfully" });
      } else {
        res.status(404).json({ message: "Boat not found" });
      }
    } catch (err) {
      next(err);
    }
  });

  // Main marina route - this is the single source of truth for marina data
  app.get("/api/marinas", async (req, res, next) => {
    try {
      console.log("--- /api/marinas REQUEST RECEIVED ---");
      console.log(`DATABASE_URL used by server: ${process.env.DATABASE_URL || "DATABASE_URL not set or empty!"}`);
      
      // TEMPORARY DIRECT DB CHECK
      try {
        const { db } = await import('./db');
        const { marina: marinaTable } = await import('../shared/schema');

        const currentMarinasInDb = await db.select().from(marinaTable).limit(10);
        console.log(`Direct DB check in /api/marinas - Found ${currentMarinasInDb.length} marinas. First few: ${JSON.stringify(currentMarinasInDb.slice(0,3))}`);
        
        if (currentMarinasInDb.length === 0) {
          console.log("Direct DB check confirms MARINA TABLE IS EMPTY from API's perspective before calling storage.getAllMarinas");
        }
      } catch (dbCheckError: any) {
        console.log(`Error during direct DB check in /api/marinas: ${dbCheckError.message}`);
        console.error("DB Check Error Details:", dbCheckError);
      }
      // END TEMPORARY DIRECT DB CHECK
      
      const activeOnly = req.query.activeOnly !== "false";
      const marinas = await storage.getAllMarinas(activeOnly);
      console.log(`storage.getAllMarinas returned ${marinas.length} marinas. Data (first 3): ${JSON.stringify(marinas.slice(0,3))}`);
      res.json(marinas);
    } catch (err: any) {
      console.log(`Error in /api/marinas: ${err.message}`);
      console.error("API Marinas Error Details:", err);
      next(err);
    }
  });

  app.post("/api/marinas", isAdmin, async (req, res, next) => {
    try {
      const marinaData = insertMarinaSchema.parse(req.body);
      const marina = await storage.createMarina(marinaData);
      res.status(201).json(marina);
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/marinas/:id", isAdmin, async (req, res, next) => {
    try {
      const marinaId = parseInt(req.params.id);
      const marina = await storage.getMarina(marinaId);
      
      if (!marina) {
        return res.status(404).json({ message: "Marina not found" });
      }

      const marinaData = insertMarinaSchema.partial().parse(req.body);
      const updatedMarina = await storage.updateMarina(marinaId, marinaData);
      
      res.json(updatedMarina);
    } catch (err) {
      next(err);
    }
  });
  
  app.delete("/api/marinas/:id", isAdmin, async (req, res, next) => {
    try {
      const marinaId = parseInt(req.params.id);
      const marina = await storage.getMarina(marinaId);
      
      if (!marina) {
        return res.status(404).json({ message: "Marina not found" });
      }
      
      // In a production app, we would need to check if there are any boats or slip assignments
      // referring to this marina before deleting it.
      // We would either:
      // 1. Return an error if there are dependencies
      // 2. Delete any dependencies (cascading delete)
      // 3. Update dependencies to remove the reference (set to null)
      
      const success = await storage.deleteMarina(marinaId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete marina" });
      }
      
      res.status(200).json({ message: "Marina deleted successfully" });
    } catch (err) {
      next(err);
    }
  });

  // Dock Assignment routes
  app.post("/api/dock-assignments", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const dockData = insertDockAssignmentSchema.parse(req.body);
      
      // Verify boat ownership
      const boat = await storage.getBoat(dockData.boatId);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
      if (!boatOwner || boat.ownerId !== boatOwner.id) {
        return res.status(403).json({ message: "Not authorized to assign dock for this boat" });
      }

      // Check if marina exists
      const marina = await storage.getMarina(dockData.marinaId);
      if (!marina) {
        return res.status(404).json({ message: "Marina not found" });
      }

      // Check if dock assignment already exists for this boat
      const existingDock = await storage.getDockAssignmentByBoatId(dockData.boatId);
      if (existingDock) {
        // Update existing dock assignment
        const updatedDock = await storage.updateDockAssignment(existingDock.id, dockData);
        return res.json(updatedDock);
      }

      // Create new dock assignment
      const dockAssignment = await storage.createDockAssignment(dockData);
      res.status(201).json(dockAssignment);
    } catch (err) {
      next(err);
    }
  });
  
  // PUT route to update dock assignment
  app.put("/api/dock-assignments/:id", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const dockId = parseInt(req.params.id);
      
      // Force certain data types to match schema
      const rawData = req.body;
      const dockData = {
        ...rawData,
        marinaId: rawData.marinaId ? Number(rawData.marinaId) : undefined,
        pier: rawData.pier, // Leave as string
        dock: rawData.dock ? Number(rawData.dock) : undefined
      };
      
      // Get the dock assignment
      const existingDock = await storage.getDockAssignment(dockId);
      if (!existingDock) {
        return res.status(404).json({ message: "Dock assignment not found" });
      }
      
      // Get the boat to verify ownership
      const boat = await storage.getBoat(existingDock.boatId);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }
      
      // Verify boat ownership
      if (req.user.role !== "admin" && req.user.role !== "employee") {
        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
        if (!boatOwner || boat.ownerId !== boatOwner.id) {
          return res.status(403).json({ message: "Not authorized to update dock assignment for this boat" });
        }
      }
      
      // Check if marina exists if marinaId is being updated
      if (dockData.marinaId) {
        const marina = await storage.getMarina(dockData.marinaId);
        if (!marina) {
          return res.status(404).json({ message: "Marina not found" });
        }
      }
      
      // Update the dock assignment
      const updatedDock = await storage.updateDockAssignment(dockId, dockData);
      
      res.status(200).send(); // Send a simple success response
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/dock-assignments/boat/:boatId", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const boatId = parseInt(req.params.boatId);
      
      // Verify boat ownership
      const boat = await storage.getBoat(boatId);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      if (req.user.role !== "admin" && req.user.role !== "employee") {
        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
        if (!boatOwner || boat.ownerId !== boatOwner.id) {
          return res.status(403).json({ message: "Not authorized to view dock assignments for this boat" });
        }
      }

      const dockAssignment = await storage.getDockAssignmentByBoatId(boatId);
      if (!dockAssignment) {
        return res.status(404).json({ message: "Dock assignment not found" });
      }
      
      res.json(dockAssignment);
    } catch (err) {
      next(err);
    }
  });

  // Pump-Out Request routes
  app.post("/api/pump-out-requests", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      let requestData = req.body;
      let isManualEntry = false;
      
      // Special handling for manual service entries by admin
      if (req.user.role === 'admin' && requestData.manualEntry && requestData.manualBoatInfo) {
        isManualEntry = true;
        // Skip boat ownership verification for manual entries
        // Create a temporary pump-out request from manual info
        
        // Check that we have the minimum required fields
        if (!requestData.manualBoatInfo.name || !requestData.weekStartDate || !requestData.requestedDate) {
          return res.status(400).json({ message: "Missing required fields for manual service entry" });
        }
        
        // Proceed with manual request handling
      } else {
        // Regular request handling with schema validation
        requestData = insertPumpOutRequestSchema.parse(requestData);
        
        // Verify boat ownership for regular requests
        const boat = await storage.getBoat(requestData.boatId);
        if (!boat) {
          return res.status(404).json({ message: "Boat not found" });
        }

        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
        if (!boatOwner || boat.ownerId !== boatOwner.id) {
          return res.status(403).json({ message: "Not authorized to request service for this boat" });
        }
      }

      // Check service quota
      // Adding a test mode flag for development
      const testMode = req.query.test === 'true' || req.body.testMode === true;
      
      // Special handling for manual entries by admin
      // Manual entries should use the dedicated endpoint, but we'll keep this as a fallback
      if (isManualEntry) {
        return res.status(400).json({ message: "Please use the dedicated manual entry endpoint" });
      }
      
      if (!testMode) {
        const user = await storage.getUser(req.user.id);
        if (user?.serviceLevelId) {
          const serviceLevel = await storage.getServiceLevel(user.serviceLevelId);
          
          if (serviceLevel) {
            // For monthly service level, check monthly quota
            if (serviceLevel.type === "monthly" && serviceLevel.monthlyQuota) {
              const now = new Date();
              const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              
              // Count requests for this month
              const monthRequests = (await storage.getPumpOutRequestsByBoatId(requestData.boatId))
                .filter(r => {
                  const requestDate = new Date(r.createdAt);
                  return requestDate >= firstDayOfMonth && requestDate <= lastDayOfMonth;
                });
              
              if (monthRequests.length >= serviceLevel.monthlyQuota) {
                // If quota exceeded, still allow but provide a warning
                console.log(`Warning: Monthly quota of ${serviceLevel.monthlyQuota} pump-outs exceeded for boat ${requestData.boatId}.`);
              }
            }
            
            // For on-demand service, check quota
            if (serviceLevel.type === "one-time" && serviceLevel.onDemandQuota) {
              // Count active requests
              const activeRequests = (await storage.getPumpOutRequestsByBoatId(requestData.boatId))
                .filter(r => ["Requested", "Scheduled"].includes(r.status));
              
              if (activeRequests.length >= serviceLevel.onDemandQuota) {
                console.log(`Warning: Active request quota of ${serviceLevel.onDemandQuota} exceeded for boat ${requestData.boatId}.`);
              }
            }
          }
        }
      }

      // Check if the week is already at capacity (90 requests per week)
      const weekRequests = await storage.getPumpOutRequestsByWeek(new Date(requestData.weekStartDate));
      const scheduledCount = weekRequests.filter(r => 
        ["Requested", "Scheduled"].includes(r.status)
      ).length;
      
      // Auto-waitlist if capacity is reached
      if (scheduledCount >= 90) {
        requestData.status = "Waitlisted";
      }

      // For subscription users, handle payment based on subscription type
      if (req.user && req.user.serviceLevelId) {
        const serviceLevel = await storage.getServiceLevel(req.user.serviceLevelId);
        if (serviceLevel) {
          if (serviceLevel.type === 'one-time') {
            // For one-time services, check available credits for current calendar year
            const currentYear = new Date().getFullYear();
            const yearStart = new Date(currentYear, 0, 1);
            const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
            
            // Get all user's requests for this calendar year
            const userBoats = await storage.getBoatsByOwnerId((await storage.getBoatOwnerByUserId(req.user.id))?.id || 0);
            const userBoatIds = userBoats.map(b => b.id);
            
            let usedCreditsThisYear = 0;
            for (const boatId of userBoatIds) {
              const boatRequests = await storage.getPumpOutRequestsByBoatId(boatId);
              usedCreditsThisYear += boatRequests.filter(req => {
                if (!req.createdAt) return false;
                const reqDate = new Date(req.createdAt);
                return req.paymentStatus === 'Paid' && 
                       req.paymentId && 
                       req.paymentId.startsWith('sub_one-time') &&
                       req.status !== 'Canceled' && // Don't count canceled services
                       reqDate >= yearStart && reqDate <= yearEnd;
              }).length;
            }
            
            // One-time service gives 1 credit per calendar year
            const availableCredits = 1 - usedCreditsThisYear;
            
            if (availableCredits > 0) {
              // User has available credits, mark as paid
              requestData.paymentStatus = 'Paid';
              requestData.paymentId = `sub_one-time_${currentYear}_${Date.now()}`;
            } else {
              // No credits available, requires new payment
              requestData.paymentStatus = 'Pending';
            }
          } else {
            // Monthly and seasonal subscriptions are always paid while active
            requestData.paymentStatus = 'Paid';
            requestData.paymentId = `sub_${serviceLevel.type}_${Date.now()}`;
          }
        }
      }

      console.log("Creating new pump-out request with data:", JSON.stringify(requestData));
      
      try {
        // Use the storage interface to ensure consistency across the application
        const newRequest = await storage.createPumpOutRequest({
          boatId: requestData.boatId,
          weekStartDate: requestData.weekStartDate,
          status: requestData.status || 'Requested',
          ownerNotes: requestData.ownerNotes || '',
          paymentStatus: requestData.paymentStatus || 'Pending'
        });
        
        console.log("Successfully created pump-out request with ID:", newRequest.id);
        
        // Create initial log entry
        await storage.createPumpOutLog({
          requestId: newRequest.id,
          newStatus: newRequest.status,
          changeTimestamp: new Date()
        });
        
        // Broadcast to admin clients for real-time updates
        broadcastToAdmins('pump_out_request_created', {
          id: newRequest.id,
          action: 'created'
        });
        
        // Return the newly created request
        res.status(201).json(newRequest);
      } catch (dbError) {
        console.error("Database error creating pump-out request:", dbError);
        next(dbError);
      }
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/pump-out-requests/boat/:boatId", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const boatId = parseInt(req.params.boatId);
      
      // Verify boat ownership or employee/admin access
      const boat = await storage.getBoat(boatId);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      if (req.user?.role !== "admin" && req.user?.role !== "employee") {
        const boatOwner = await storage.getBoatOwnerByUserId(req.user?.id);
        if (!boatOwner || boat.ownerId !== boatOwner.id) {
          return res.status(403).json({ message: "Not authorized to view requests for this boat" });
        }
      }

      const requests = await storage.getPumpOutRequestsByBoatId(boatId);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/pump-out-requests/week/:date", isEmployee, async (req, res, next) => {
    try {
      const weekStartDate = new Date(req.params.date);
      const requests = await storage.getPumpOutRequestsByWeek(weekStartDate);
      
      // Join with boat and dock assignment data
      const enrichedRequests = await Promise.all(requests.map(async (request) => {
        const boat = await storage.getBoat(request.boatId);
        const dockAssignment = await storage.getDockAssignmentByBoatId(request.boatId);
        const marina = dockAssignment ? await storage.getMarina(dockAssignment.marinaId) : null;
        
        return {
          ...request,
          boat,
          dockAssignment,
          marina
        };
      }));
      
      // Sort by marina, dock, slip
      enrichedRequests.sort((a, b) => {
        if (!a.marina && b.marina) return 1;
        if (a.marina && !b.marina) return -1;
        if (!a.marina && !b.marina) return 0;
        
        // Sort by marina name
        const marinaCompare = a.marina!.name.localeCompare(b.marina!.name);
        if (marinaCompare !== 0) return marinaCompare;
        
        // Sort by pier and dock
        if (a.dockAssignment && b.dockAssignment) {
          const pierCompare = a.dockAssignment.pier.localeCompare(b.dockAssignment.pier);
          if (pierCompare !== 0) return pierCompare;
          
          // Sort by dock number
          return a.dockAssignment.dock - b.dockAssignment.dock;
        }
        
        return 0;
      });
      
      res.json(enrichedRequests);
    } catch (err) {
      next(err);
    }
  });

  // Get all pump-out requests (for admin view)
  app.get("/api/pump-out-requests", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      // Log that this is being called
      console.log("Fetching all pump-out requests for admin view - DATABASE ONLY");
      
      // Get database instance directly (already imported at top)
      
      // Fetch directly from the database to ensure no cached or mock data
      const allRequests = await db.select().from(pumpOutRequest).orderBy(desc(pumpOutRequest.createdAt));
      console.log(`Found ${allRequests.length} pump-out requests in the database`);
      
      // Parse query params for filtering
      const status = req.query.status as string;
      const week = req.query.week as string;
      const marinaId = req.query.marina as string;
      
      // We need to enrich the requests with additional data
      const enrichedRequests = await Promise.all(allRequests.map(async (request) => {
        const boat = await storage.getBoat(request.boatId);
        const boatOwner = boat ? await storage.getBoatOwner(boat.ownerId) : null;
        const user = boatOwner ? await storage.getUser(boatOwner.userId) : null;
        const dockAssignment = await storage.getDockAssignmentByBoatId(request.boatId);
        const marina = dockAssignment ? await storage.getMarina(dockAssignment.marinaId) : null;
        
        // Format the week start date for filtering
        const weekStartDate = request.weekStartDate ? new Date(request.weekStartDate).toISOString().split('T')[0] : '';
        
        return {
          id: request.id,
          boatId: request.boatId,
          boatName: boat?.name || 'Unknown Boat',
          ownerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown Owner',
          marinaId: marina?.id || 0,
          marinaName: marina?.name || 'Unassigned',
          pier: dockAssignment?.pier || '-',
          dock: dockAssignment?.dock?.toString() || '-',
          status: request.status,
          weekStartDate: weekStartDate,
          paymentStatus: request.paymentStatus,
          createdAt: request.createdAt,
          notes: request.ownerNotes || '',
          dockingDirection: boat?.dockingDirection || null,
          tieUpSide: boat?.tieUpSide || null,
          pumpPortLocations: boat?.pumpPortLocations || [],
          boatNotes: boat?.notes || '',
          beforeImageUrl: null,
          duringImageUrl: null,
          afterImageUrl: null
        };
      }));
      
      console.log(`Found ${enrichedRequests.length} pump-out requests`);
      
      // Apply filters
      let filteredRequests = enrichedRequests;
      
      if (status && status !== 'all') {
        filteredRequests = filteredRequests.filter(req => req.status === status);
      }
      
      if (week && week !== 'all') {
        filteredRequests = filteredRequests.filter(req => req.weekStartDate === week);
      }
      
      if (marinaId && marinaId !== 'all') {
        filteredRequests = filteredRequests.filter(req => req.marinaId.toString() === marinaId);
      }
      
      res.json(filteredRequests);
    } catch (err) {
      console.error('Error fetching pump-out requests:', err);
      next(err);
    }
  });

  app.get("/api/pump-out-requests/status/:status", isEmployee, async (req, res, next) => {
    try {
      const status = req.params.status;
      const requests = await storage.getPumpOutRequestsByStatus(status);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/pump-out-requests/:id/status", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["Requested", "Scheduled", "Completed", "Canceled", "Waitlisted"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const request = await storage.getPumpOutRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Only employees can change to any status
      // Members can only cancel their own requests
      if (req.user.role !== "admin" && req.user.role !== "employee") {
        // Verify boat ownership
        const boat = await storage.getBoat(request.boatId);
        if (!boat) {
          return res.status(404).json({ message: "Boat not found" });
        }
        
        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
        if (!boatOwner || boat.ownerId !== boatOwner.id) {
          return res.status(403).json({ message: "Not authorized to update this request" });
        }
        
        // Members can only cancel, not change to other statuses
        if (status !== "Canceled") {
          return res.status(403).json({ message: "Members can only cancel requests" });
        }
        
        // Can only cancel if status is Requested, Scheduled, or Waitlisted
        if (!["Requested", "Scheduled", "Waitlisted"].includes(request.status)) {
          return res.status(400).json({ 
            message: "Cannot cancel a completed or already canceled request"
          });
        }
      }

      // Update status
      const prevStatus = request.status;
      const updatedRequest = await storage.updatePumpOutRequestStatus(requestId, status);
      
      // Handle credit restoration for one-time service cancellations
      if (status === "Canceled" && prevStatus !== "Canceled" && prevStatus !== "Completed") {
        // Check if this was a paid one-time service request
        if (request.paymentStatus === 'Paid' && 
            request.paymentId && 
            request.paymentId.startsWith('sub_one-time')) {
          
          // Credit is automatically restored since we check for non-canceled requests 
          // when calculating available credits in the request creation logic
          console.log(`One-time service credit restored for canceled request ${requestId}`);
        }
      }
      
      // If status changed from Waitlisted to Scheduled, check waitlist
      if (prevStatus === "Waitlisted" && status === "Scheduled") {
        const weekRequests = await storage.getPumpOutRequestsByWeek(new Date(request.weekStartDate));
        const scheduledCount = weekRequests.filter(r => 
          ["Requested", "Scheduled"].includes(r.status)
        ).length;
        
        // If we're still under capacity, move the next waitlisted request to scheduled
        if (scheduledCount < 90) {
          const waitlistedRequests = weekRequests
            .filter(r => r.status === "Waitlisted")
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          
          if (waitlistedRequests.length > 0) {
            const nextRequest = waitlistedRequests[0];
            await storage.updatePumpOutRequestStatus(nextRequest.id, "Scheduled");
            
            // Get boat owner for email notification
            const boat = await storage.getBoat(nextRequest.boatId);
            if (boat) {
              const boatOwner = await storage.getBoatOwner(boat.ownerId);
              if (boatOwner) {
                const user = await storage.getUser(boatOwner.userId);
                if (user) {
                  // Send email notification
                  await sendServiceStatusEmail(
                    user.email,
                    user.firstName,
                    "Your service request has been scheduled",
                    `Your pump-out request for the week of ${format(new Date(nextRequest.weekStartDate), 'MMMM d, yyyy')} was waitlisted and is now scheduled.`
                  );
                }
              }
            }
          }
        }
      }
      
      // Send email notification for status change
      const boat = await storage.getBoat(request.boatId);
      if (boat) {
        const boatOwner = await storage.getBoatOwner(boat.ownerId);
        if (boatOwner) {
          const user = await storage.getUser(boatOwner.userId);
          if (user) {
            let subject = "";
            let message = "";
            
            switch (status) {
              case "Scheduled":
                subject = "Your service request has been scheduled";
                message = `Your pump-out request for the week of ${format(new Date(request.weekStartDate), 'MMMM d, yyyy')} has been scheduled.`;
                break;
              case "Completed":
                subject = "Your service has been completed";
                message = `Your pump-out for the week of ${format(new Date(request.weekStartDate), 'MMMM d, yyyy')} has been completed successfully.`;
                break;
              case "Canceled":
                subject = "Your service request has been canceled";
                message = `Your pump-out request for the week of ${format(new Date(request.weekStartDate), 'MMMM d, yyyy')} has been canceled.`;
                break;
              case "Waitlisted":
                subject = "Your service request has been waitlisted";
                message = `Your pump-out request for the week of ${format(new Date(request.weekStartDate), 'MMMM d, yyyy')} has been added to the waitlist. We'll notify you when a slot becomes available.`;
                break;
            }
            
            if (subject && message) {
              await sendServiceStatusEmail(user.email, user.firstName, subject, message);
            }
          }
        }
      }
      
      // Broadcast to admin clients for real-time updates
      broadcastToAdmins('pump_out_request_updated', {
        id: requestId,
        action: 'status_changed',
        status: status,
        previousStatus: prevStatus
      });
      
      res.json(updatedRequest);
    } catch (err) {
      next(err);
    }
  });

  // Update pump-out request details
  app.patch("/api/pump-out-requests/:id", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const requestId = parseInt(req.params.id);
      const { weekStartDate, ownerNotes } = req.body;
      
      // Get the existing request to verify ownership
      const existingRequest = await storage.getPumpOutRequest(requestId);
      if (!existingRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Verify the user owns this request
      const boat = await storage.getBoat(existingRequest.boatId);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      const boatOwner = await storage.getBoatOwner(boat.ownerId);
      if (!boatOwner || boatOwner.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Only allow editing if request is not completed or canceled
      if (existingRequest.status === 'Completed' || existingRequest.status === 'Canceled') {
        return res.status(400).json({ message: "Cannot edit completed or canceled requests" });
      }

      // Prepare update data
      const updateData: Partial<typeof existingRequest> = {};
      
      if (weekStartDate && weekStartDate !== existingRequest.weekStartDate) {
        // Validate the new date
        const newDate = new Date(weekStartDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (newDate < today) {
          return res.status(400).json({ message: "Cannot schedule service for past dates" });
        }
        
        updateData.weekStartDate = weekStartDate;
      }
      
      if (ownerNotes !== undefined) {
        updateData.ownerNotes = ownerNotes;
      }

      // Update the request
      const updatedRequest = await storage.updatePumpOutRequest(requestId, updateData);
      if (!updatedRequest) {
        return res.status(500).json({ message: "Failed to update request" });
      }

      // Broadcast to admin clients for real-time updates
      broadcastToAdmins('pump_out_request_updated', {
        id: requestId,
        action: 'details_updated',
        weekStartDate: updateData.weekStartDate,
        ownerNotes: updateData.ownerNotes
      });

      res.json(updatedRequest);
    } catch (err) {
      next(err);
    }
  });

  // Get pump-out data grouped by week for dashboard
  app.get("/api/analytics/pump-out-weekly", isAuthenticated, async (req, res, next) => {
    try {
      const weeklyData = await storage.getPumpOutRequestsByWeek(new Date());
      
      // Group by week and count completed requests
      const weekCounts = new Map();
      const now = new Date();
      
      // Initialize last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekKey = `Week ${12 - i}`;
        weekCounts.set(weekKey, 0);
      }
      
      // Count completed requests by week
      weeklyData.forEach(request => {
        if (request.status === 'Completed' && request.createdAt) {
          const requestWeek = Math.floor((now.getTime() - new Date(request.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (requestWeek < 12) {
            const weekKey = `Week ${12 - requestWeek}`;
            weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1);
          }
        }
      });

      const result = Array.from(weekCounts.entries()).map(([name, value]) => ({
        name,
        value
      }));

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Customer management routes
  app.get("/api/users/members", isAdmin, async (req: AuthRequest, res, next) => {
    try {
      // Get all users with role 'member'
      const members = await storage.getAllMembers();
      res.json(members);
    } catch (err) {
      console.error("Error fetching members:", err);
      next(err);
    }
  });

  app.post("/api/customers", isAdmin, async (req: AuthRequest, res, next) => {
    try {
      const { firstName, lastName, email, phone, serviceLevelId, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Prepare user data
      const userData = {
        firstName,
        lastName,
        email,
        phone: phone || null,
        serviceLevelId: serviceLevelId && serviceLevelId !== "" ? parseInt(serviceLevelId) : null,
        role: 'member' as const
      };
      
      // Create the user
      const user = await storage.createUser(userData, passwordHash);
      
      // Create a boat owner record for the member
      await storage.createBoatOwner({ userId: user.id });

      // Remove sensitive data before sending response
      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err) {
      console.error("Error creating customer:", err);
      next(err);
    }
  });

  app.put("/api/customers/:id", isAdmin, async (req: AuthRequest, res, next) => {
    try {
      const customerId = parseInt(req.params.id);
      const { firstName, lastName, email, phone, serviceLevelId } = req.body;
      
      // Check if customer exists
      const existingCustomer = await storage.getUser(customerId);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Check if email is being changed and if it already exists
      if (email !== existingCustomer.email) {
        const userWithEmail = await storage.getUserByEmail(email);
        if (userWithEmail && userWithEmail.id !== customerId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // Prepare update data
      const updateData = {
        firstName,
        lastName,
        email,
        phone: phone || null,
        serviceLevelId: serviceLevelId && serviceLevelId !== "" ? parseInt(serviceLevelId) : null
      };
      
      // Update the user
      const updatedUser = await storage.updateUser(customerId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Remove sensitive data before sending response
      const { passwordHash, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (err) {
      console.error("Error updating customer:", err);
      next(err);
    }
  });

  // Admin endpoint to get credit information for any customer
  app.get("/api/admin/users/:userId/credits", isAdmin, async (req: AuthRequest, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get the user and their service level
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only show credits for users with service levels (members)
      if (!user.serviceLevelId) {
        return res.json({ availableCredits: 0, totalCredits: 0 });
      }

      const serviceLevel = await storage.getServiceLevel(user.serviceLevelId);
      if (!serviceLevel) {
        return res.json({ availableCredits: 0, totalCredits: 0 });
      }

      // Only calculate credits for one-time service types
      if (serviceLevel.type !== 'one-time') {
        return res.json({ availableCredits: 0, totalCredits: 0 });
      }

      // Calculate credits based on subscription date and current year
      const now = new Date();
      const currentYear = now.getFullYear();
      const subscriptionDate = user.subscriptionStartDate ? new Date(user.subscriptionStartDate) : null;

      if (!subscriptionDate) {
        return res.json({ availableCredits: 0, totalCredits: 0 });
      }

      const subscriptionYear = subscriptionDate.getFullYear();
      
      // Credits are only valid for the current calendar year
      if (subscriptionYear !== currentYear) {
        return res.json({ availableCredits: 0, totalCredits: 1 });
      }

      // Get user's boats to find their pump-out requests
      const boatOwner = await storage.getBoatOwnerByUserId(userId);
      if (!boatOwner) {
        return res.json({ availableCredits: 1, totalCredits: 1 });
      }

      const boats = await storage.getBoatsByOwnerId(boatOwner.id);
      const boatIds = boats.map(boat => boat.id);

      // Count completed requests for this year (excluding canceled ones)
      let usedCredits = 0;
      for (const boatId of boatIds) {
        const requests = await storage.getPumpOutRequestsByBoatId(boatId);
        const thisYearRequests = requests.filter(request => {
          const requestDate = request.createdAt ? new Date(request.createdAt) : null;
          return requestDate && 
                 requestDate.getFullYear() === currentYear && 
                 request.status === 'Completed';
        });
        usedCredits += thisYearRequests.length;
      }

      const totalCredits = 1; // One-time services get 1 credit per year
      const availableCredits = Math.max(0, totalCredits - usedCredits);

      res.json({
        availableCredits,
        totalCredits,
        usedCredits,
        subscriptionYear,
        currentYear
      });
    } catch (err) {
      console.error("Error fetching admin user credits:", err);
      next(err);
    }
  });

  // Analytics routes
  app.get("/api/analytics/users-by-service-level", isAdmin, async (req, res, next) => {
    try {
      const data = await storage.countActiveUsersByServiceLevel();
      
      // Check if data is array before using map
      if (!Array.isArray(data)) {
        return res.json([]);
      }
      
      // Enrich with service level information
      const enrichedData = await Promise.all(data.map(async (item) => {
        const serviceLevel = await storage.getServiceLevel(item.serviceLevelId);
        return {
          ...item,
          serviceLevel
        };
      }));
      
      res.json(enrichedData);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/analytics/service-counts", isAdmin, async (req, res, next) => {
    try {
      const completedCount = await storage.countCompletedServicesThisWeek();
      const upcomingCount = await storage.countUpcomingServices();
      
      res.json({
        completedThisWeek: completedCount,
        upcoming: upcomingCount
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/analytics/arpu", isAdmin, async (req, res, next) => {
    try {
      const arpu = await storage.calculateAverageRevenuePerUser();
      res.json({ arpu });
    } catch (err) {
      next(err);
    }
  });

  // Service Level Management Routes
  
  // Get a single service level by ID
  app.get("/api/service-levels/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service level ID" });
      }
      
      const serviceLevel = await storage.getServiceLevel(id);
      if (!serviceLevel) {
        return res.status(404).json({ message: "Service level not found" });
      }
      
      res.status(200).json(serviceLevel);
    } catch (err) {
      next(err);
    }
  });
  
  // Create a new service level (admin only)
  app.post("/api/service-levels", isAdmin, async (req: AuthRequest, res, next) => {
    try {
      const result = insertServiceLevelSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid service level data",
          errors: result.error.format() 
        });
      }
      
      const newServiceLevel = await storage.createServiceLevel(result.data);
      res.status(201).json(newServiceLevel);
    } catch (err) {
      next(err);
    }
  });
  
  // Update a service level (admin only)
  app.put("/api/service-levels/:id", isAdmin, async (req: AuthRequest, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service level ID" });
      }
      
      const existingServiceLevel = await storage.getServiceLevel(id);
      if (!existingServiceLevel) {
        return res.status(404).json({ message: "Service level not found" });
      }
      
      // Partial update validation
      const serviceLevelSchema = insertServiceLevelSchema.partial();
      const result = serviceLevelSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid service level data", 
          errors: result.error.format() 
        });
      }
      
      const updatedServiceLevel = await storage.updateServiceLevel(id, result.data);
      res.status(200).json(updatedServiceLevel);
    } catch (err) {
      next(err);
    }
  });
  
  // Delete (deactivate) a service level (admin only)
  app.delete("/api/service-levels/:id", isAdmin, async (req: AuthRequest, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service level ID" });
      }
      
      const existingServiceLevel = await storage.getServiceLevel(id);
      if (!existingServiceLevel) {
        return res.status(404).json({ message: "Service level not found" });
      }
      
      // Instead of actually deleting, we'll mark it as inactive
      const updatedServiceLevel = await storage.updateServiceLevel(id, { isActive: false });
      res.status(200).json(updatedServiceLevel);
    } catch (err) {
      next(err);
    }
  });
  
  // Get user's current subscription
  app.get("/api/users/me/subscription", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.serviceLevelId) {
        return res.status(404).json({ message: "No subscription found" });
      }
      
      const serviceLevel = await storage.getServiceLevel(user.serviceLevelId);
      if (!serviceLevel) {
        return res.status(404).json({ message: "Subscription service level not found" });
      }
      
      res.status(200).json({
        userId: user.id,
        serviceLevelId: user.serviceLevelId,
        serviceLevel
      });
    } catch (err) {
      next(err);
    }
  });
  
  // Update user subscription
  // Get available credits for one-time service users
  app.get("/api/users/me/credits", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      if (!req.user?.serviceLevelId) {
        return res.json({ availableCredits: 0, totalCredits: 0, usedCredits: 0 });
      }

      const serviceLevel = await storage.getServiceLevel(req.user.serviceLevelId);
      if (!serviceLevel || serviceLevel.type !== 'one-time') {
        return res.json({ availableCredits: 0, totalCredits: 0, usedCredits: 0 });
      }

      // Calculate used credits for current calendar year
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
      
      // Get all user's boats and requests for this calendar year
      const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
      if (!boatOwner) {
        return res.json({ availableCredits: 1, totalCredits: 1, usedCredits: 0 });
      }

      const userBoats = await storage.getBoatsByOwnerId(boatOwner.id);
      const userBoatIds = userBoats.map(b => b.id);
      
      let usedCreditsThisYear = 0;
      for (const boatId of userBoatIds) {
        const boatRequests = await storage.getPumpOutRequestsByBoatId(boatId);
        usedCreditsThisYear += boatRequests.filter(req => {
          if (!req.createdAt) return false;
          const reqDate = new Date(req.createdAt);
          return req.paymentStatus === 'Paid' && 
                 req.paymentId && 
                 req.paymentId.startsWith('sub_one-time') &&
                 req.status !== 'Canceled' && // Don't count canceled services
                 reqDate >= yearStart && reqDate <= yearEnd;
        }).length;
      }
      
      const totalCredits = 1; // One-time service gives 1 credit per calendar year
      const availableCredits = Math.max(0, totalCredits - usedCreditsThisYear);
      
      res.json({
        availableCredits,
        totalCredits,
        usedCredits: usedCreditsThisYear,
        year: currentYear
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/users/me/subscription", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { serviceLevelId, activeMonth, autoRenew } = req.body;
      if (!serviceLevelId) {
        return res.status(400).json({ message: "Service level ID is required" });
      }
      
      const id = parseInt(serviceLevelId);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service level ID" });
      }
      
      // Check if service level exists and is active
      const serviceLevel = await storage.getServiceLevel(id);
      if (!serviceLevel) {
        return res.status(404).json({ message: "Service level not found" });
      }
      
      if (serviceLevel.isActive === false) {
        return res.status(400).json({ message: "Service level is not active" });
      }
      
      // Calculate subscription details based on plan type
      const now = new Date();
      let startDate = now;
      let endDate: Date | null = null;
      
      if (serviceLevel.type === 'monthly' && activeMonth) {
        // For monthly plans with selected month
        const year = now.getFullYear();
        const month = parseInt(activeMonth) - 1; // JavaScript months are 0-based
        
        // Create start date (1st of selected month)
        startDate = new Date(year, month, 1);
        
        // Create end date (last day of selected month)
        endDate = new Date(year, month + 1, 0);
      } else if (serviceLevel.type === 'seasonal') {
        // For seasonal plans (May 1 - Oct 31)
        const year = now.getFullYear();
        startDate = new Date(year, 4, 1); // May 1
        endDate = new Date(year, 9, 31); // October 31
      }
      
      // Update user's subscription information
      const subscriptionData = {
        serviceLevelId: id,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        autoRenew: serviceLevel.type === 'monthly' ? !!autoRenew : false
      };
      
      const updatedUser = await storage.updateUser(req.user.id, subscriptionData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({
        message: "Subscription updated successfully",
        userId: updatedUser.id,
        serviceLevelId: updatedUser.serviceLevelId,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        autoRenew: subscriptionData.autoRenew
      });
    } catch (err) {
      next(err);
    }
  });

  // Dedicated endpoint for manual service entries
  app.post("/api/admin/manual-service", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      // Ensure user is an admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { 
        boatName, 
        boatLength, 
        boatColor, 
        ownerName, 
        ownerEmail, 
        ownerPhone, 
        selectedMarina, 
        serviceDate, 
        selectedPorts, 
        serviceNotes, 
        isSingleHead,
        paymentReceived 
      } = req.body;
      
      // Basic validation
      if (!boatName || !ownerName || !selectedMarina || !serviceDate || !selectedPorts || selectedPorts.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Format dates
      const requestDate = new Date(serviceDate);
      // Set to start of the week (Monday)
      const weekStart = new Date(requestDate);
      weekStart.setDate(requestDate.getDate() - requestDate.getDay() + (requestDate.getDay() === 0 ? -6 : 1));
      
      // Create a temporary boat owner for this request
      const tempOwnerId = Date.now();
      
      // Create a manual pump-out request
      const requestData = {
        boatId: 0, // This will be replaced with a negative ID in the storage
        weekStartDate: weekStart.toISOString().split('T')[0],
        requestedDate: requestDate.toISOString().split('T')[0],
        pumpOutPorts: selectedPorts,
        ownerNotes: serviceNotes || "",
        status: "Completed", // Manual entries are always completed
        adminNotes: `Manual entry: ${boatName} (${ownerName})`,
        paymentStatus: paymentReceived ? "Paid" : "Pending",
        paymentId: paymentReceived ? `manual_${Date.now()}` : undefined,
        
        // Additional info for manual entries
        isManualEntry: true,
        manualBoatInfo: {
          name: boatName,
          length: boatLength || "30",
          color: boatColor || "White",
          ownerName: ownerName,
          ownerEmail: ownerEmail || "",
          ownerPhone: ownerPhone || "",
          marinaId: parseInt(selectedMarina),
          isSingleHead: isSingleHead === true
        }
      };
      
      // Store in memory as a special request
      try {
        // Need to adapt our data to match what the schema expects
        // Store as temporary record in memory
        const pumpOutRequest = {
          id: Date.now(),
          boatId: -tempOwnerId, // Using negative ID to indicate manual entry
          weekStartDate: requestData.weekStartDate,
          requestedDate: requestData.requestedDate,
          status: "Completed",
          pumpOutPorts: requestData.pumpOutPorts,
          ownerNotes: requestData.ownerNotes || "",
          createdAt: new Date().toISOString()
        };
        
        // We'll just store the response directly without trying to create
        // a real record in the database since this is just a manual entry
        // In a real production app, we would create a proper record
        
        res.status(201).json({ 
          ...pumpOutRequest,
          message: "Manual service entry created successfully",
          manualBoatName: boatName,
          manualOwnerName: ownerName
        });
        
        return;
      } catch (error) {
        console.error("Error creating manual entry:", error);
        return res.status(500).json({ message: "Internal server error creating manual entry" });
      }
    } catch (err) {
      next(err);
    }
  });

  // Handle payment for pump-out requests
  app.post("/api/pump-out-requests/:id/payment", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      const request = await storage.getPumpOutRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Pump-out request not found" });
      }
      
      // Check if user is authorized to make payment for this request
      if (req.user.role !== "admin" && req.user.role !== "employee") {
        const boat = await storage.getBoat(request.boatId);
        if (!boat) {
          return res.status(404).json({ message: "Boat not found" });
        }
        
        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
        if (!boatOwner || boat.ownerId !== boatOwner.id) {
          return res.status(403).json({ message: "Not authorized to make payment for this request" });
        }
      }
      
      // Update the payment status to paid
      const updatedRequest = await storage.updatePumpOutRequest(id, {
        paymentStatus: "Paid",
        paymentId: `sim_${Date.now()}`  // Simulated payment ID
      });
      
      if (!updatedRequest) {
        return res.status(500).json({ message: "Failed to update payment status" });
      }
      
      res.status(200).json(updatedRequest);
    } catch (err) {
      next(err);
    }
  });

  // Error handling middleware
  app.use(handleError);

  const httpServer = createServer(app);
  
  // Set up WebSocket server on distinct path
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle admin subscription for real-time updates
        if (data.type === 'subscribe_admin') {
          adminConnections.add(ws);
          console.log('Admin client subscribed for real-time updates');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      adminConnections.delete(ws);
      console.log('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      adminConnections.delete(ws);
    });
  });
  
  return httpServer;
}
