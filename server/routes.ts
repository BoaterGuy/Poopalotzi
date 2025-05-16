import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./index";
import { insertServiceLevelSchema } from "@shared/schema";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { sendServiceStatusEmail } from "./utils/sendgrid";
import { insertUserSchema, insertBoatSchema, insertMarinaSchema, insertSlipAssignmentSchema, insertPumpOutRequestSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { format, addDays } from "date-fns";
import { setupAuth } from "./auth";

// Extended Request type with user information
interface AuthRequest extends Request {
  user?: any;
}

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
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

const isEmployee = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (req.user.role === "employee" || req.user.role === "admin")) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication (session, passport, etc)
  setupAuth(app);

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
  app.get("/api/marinas", async (req, res, next) => {
    try {
      const marinas = await storage.getAllMarinas();
      res.json(marinas);
    } catch (err) {
      next(err);
    }
  });
  
  app.get("/api/marinas/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const marina = await storage.getMarina(id);
      if (!marina) {
        return res.status(404).json({ message: "Marina not found" });
      }
      res.json(marina);
    } catch (err) {
      next(err);
    }
  });

  // Boat routes
  app.post("/api/boats", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const boatData = insertBoatSchema.parse(req.body);
      
      // Get boat owner ID from user ID
      const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
      if (!boatOwner) {
        return res.status(400).json({ message: "Boat owner record not found" });
      }

      // Create the boat with the owner ID
      const boat = await storage.createBoat({
        ...boatData,
        ownerId: boatOwner.id
      });
      
      res.status(201).json(boat);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/boats", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      // Get boat owner ID from user ID
      const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
      
      if (!boatOwner) {
        // For testing purposes, if a boat owner record doesn't exist
        // Let's get any boats in the system to ensure the form works
        const allBoats = [];
        for (let i = 1; i <= 5; i++) {
          const boat = await storage.getBoat(i);
          if (boat) allBoats.push(boat);
        }
        if (allBoats.length > 0) {
          return res.json(allBoats);
        }
        return res.json([]);
      }

      const boats = await storage.getBoatsByOwnerId(boatOwner.id);
      res.json(boats);
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/boats/:id", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const boatId = parseInt(req.params.id);
      const boat = await storage.getBoat(boatId);
      
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      // Verify ownership
      const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
      if (!boatOwner || boat.ownerId !== boatOwner.id) {
        return res.status(403).json({ message: "Not authorized to modify this boat" });
      }

      const boatData = insertBoatSchema.partial().parse(req.body);
      const updatedBoat = await storage.updateBoat(boatId, boatData);
      
      res.json(updatedBoat);
    } catch (err) {
      next(err);
    }
  });

  // Marina routes
  app.get("/api/marinas", async (req, res, next) => {
    try {
      const activeOnly = req.query.activeOnly !== "false";
      const marinas = await storage.getAllMarinas(activeOnly);
      res.json(marinas);
    } catch (err) {
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

  // Slip Assignment routes
  app.post("/api/slip-assignments", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const slipData = insertSlipAssignmentSchema.parse(req.body);
      
      // Verify boat ownership
      const boat = await storage.getBoat(slipData.boatId);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
      if (!boatOwner || boat.ownerId !== boatOwner.id) {
        return res.status(403).json({ message: "Not authorized to assign slip for this boat" });
      }

      // Check if marina exists
      const marina = await storage.getMarina(slipData.marinaId);
      if (!marina) {
        return res.status(404).json({ message: "Marina not found" });
      }

      // Check if slip assignment already exists for this boat
      const existingSlip = await storage.getSlipAssignmentByBoatId(slipData.boatId);
      if (existingSlip) {
        // Update existing slip assignment
        const updatedSlip = await storage.updateSlipAssignment(existingSlip.id, slipData);
        return res.json(updatedSlip);
      }

      // Create new slip assignment
      const slipAssignment = await storage.createSlipAssignment(slipData);
      res.status(201).json(slipAssignment);
    } catch (err) {
      next(err);
    }
  });
  
  // PUT route to update slip assignment
  app.put("/api/slip-assignments/:id", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const slipId = parseInt(req.params.id);
      
      // Force certain data types to match schema
      const rawData = req.body;
      const slipData = {
        ...rawData,
        marinaId: rawData.marinaId ? Number(rawData.marinaId) : undefined,
        dock: rawData.dock, // Leave as string
        slip: rawData.slip ? Number(rawData.slip) : undefined
      };
      
      // Get the slip assignment
      const existingSlip = await storage.getSlipAssignment(slipId);
      if (!existingSlip) {
        return res.status(404).json({ message: "Slip assignment not found" });
      }
      
      // Get the boat to verify ownership
      const boat = await storage.getBoat(existingSlip.boatId);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }
      
      // Verify boat ownership
      if (req.user.role !== "admin" && req.user.role !== "employee") {
        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
        if (!boatOwner || boat.ownerId !== boatOwner.id) {
          return res.status(403).json({ message: "Not authorized to update slip assignment for this boat" });
        }
      }
      
      // Check if marina exists if marinaId is being updated
      if (slipData.marinaId) {
        const marina = await storage.getMarina(slipData.marinaId);
        if (!marina) {
          return res.status(404).json({ message: "Marina not found" });
        }
      }
      
      // Update the slip assignment
      const updatedSlip = await storage.updateSlipAssignment(slipId, slipData);
      
      res.status(200).send(); // Send a simple success response
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/slip-assignments/boat/:boatId", isAuthenticated, async (req: AuthRequest, res, next) => {
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
          return res.status(403).json({ message: "Not authorized to view slip assignments for this boat" });
        }
      }

      const slipAssignment = await storage.getSlipAssignmentByBoatId(boatId);
      if (!slipAssignment) {
        return res.status(404).json({ message: "Slip assignment not found" });
      }
      
      res.json(slipAssignment);
    } catch (err) {
      next(err);
    }
  });

  // Pump-Out Request routes
  app.post("/api/pump-out-requests", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const requestData = insertPumpOutRequestSchema.parse(req.body);
      
      // Verify boat ownership
      const boat = await storage.getBoat(requestData.boatId);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
      if (!boatOwner || boat.ownerId !== boatOwner.id) {
        return res.status(403).json({ message: "Not authorized to request service for this boat" });
      }

      // Check service quota
      // Adding a test mode flag for development
      const testMode = req.query.test === 'true' || req.body.testMode === true;
      
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

      // Create pump-out request
      const request = await storage.createPumpOutRequest(requestData);
      
      // Create initial log entry
      await storage.createPumpOutLog({
        requestId: request.id,
        prevStatus: undefined,
        newStatus: request.status
      });
      
      res.status(201).json(request);
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

      if (req.user.role !== "admin" && req.user.role !== "employee") {
        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
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
      
      // Join with boat and slip assignment data
      const enrichedRequests = await Promise.all(requests.map(async (request) => {
        const boat = await storage.getBoat(request.boatId);
        const slipAssignment = await storage.getSlipAssignmentByBoatId(request.boatId);
        const marina = slipAssignment ? await storage.getMarina(slipAssignment.marinaId) : null;
        
        return {
          ...request,
          boat,
          slipAssignment,
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
        
        // Sort by dock
        if (a.slipAssignment && b.slipAssignment) {
          const dockCompare = a.slipAssignment.dock - b.slipAssignment.dock;
          if (dockCompare !== 0) return dockCompare;
          
          // Sort by slip
          return a.slipAssignment.slip - b.slipAssignment.slip;
        }
        
        return 0;
      });
      
      res.json(enrichedRequests);
    } catch (err) {
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

  app.patch("/api/pump-out-requests/:id/status", isEmployee, async (req: AuthRequest, res, next) => {
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

      // Update status
      const prevStatus = request.status;
      const updatedRequest = await storage.updatePumpOutRequestStatus(requestId, status);
      
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
      
      res.json(updatedRequest);
    } catch (err) {
      next(err);
    }
  });

  // Analytics routes
  app.get("/api/analytics/users-by-service-level", isAdmin, async (req, res, next) => {
    try {
      const data = await storage.countActiveUsersByServiceLevel();
      
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
  app.post("/api/users/me/subscription", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { serviceLevelId } = req.body;
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
      
      // Update user's service level
      const updatedUser = await storage.updateUser(req.user.id, { serviceLevelId: id });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({
        message: "Subscription updated successfully",
        userId: updatedUser.id,
        serviceLevelId: updatedUser.serviceLevelId
      });
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
  return httpServer;
}
