import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "poopalazi-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    })
  );

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email or password" });
          }

          const isMatch = await bcrypt.compare(password, user.passwordHash || "");
          if (!isMatch) {
            return done(null, false, { message: "Incorrect email or password" });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await storage.createUser(userData, passwordHash);
      
      // If user role is member, create a boat owner record
      if (user.role === "member") {
        await storage.createBoatOwner({ userId: user.id });
      }

      // Remove sensitive data
      const { passwordHash: _, ...safeUser } = user;
      
      res.status(201).json(safeUser);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
      
      req.logIn(user, (err) => {
        if (err) return next(err);
        
        // Remove sensitive data
        const { passwordHash, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, (req: AuthRequest, res) => {
    const { passwordHash, ...safeUser } = req.user;
    res.json(safeUser);
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
              return res.status(400).json({ 
                message: `Monthly quota of ${serviceLevel.monthlyQuota} pump-outs exceeded.` 
              });
            }
          }
          
          // For on-demand service, check quota
          if (serviceLevel.type === "one-time" && serviceLevel.onDemandQuota) {
            // Count active requests
            const activeRequests = (await storage.getPumpOutRequestsByBoatId(requestData.boatId))
              .filter(r => ["Requested", "Scheduled"].includes(r.status));
            
            if (activeRequests.length >= serviceLevel.onDemandQuota) {
              return res.status(400).json({ 
                message: `Active request quota of ${serviceLevel.onDemandQuota} exceeded.` 
              });
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

  // Error handling middleware
  app.use(handleError);

  const httpServer = createServer(app);
  return httpServer;
}
