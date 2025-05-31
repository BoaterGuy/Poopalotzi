import express, { type Request, Response, NextFunction } from "express";
import { createReadStream } from "fs";
import multer from "multer";
import path from "path";
import fs from "fs";
import type { Server } from "http";
import { storage } from "./backend-only";
import { insertBoatSchema, insertSlipAssignmentSchema, insertPumpOutRequestSchema, insertMarinaSchema, insertServiceLevelSchema, insertUserSchema } from "../shared/schema";

interface AuthRequest extends Request {
  user?: any;
}

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const handleError = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Route error:', err);
  if (res.headersSent) return next(err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? message : 'Something went wrong'
  });
};

const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
};

const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

const isEmployee = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === "employee" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Employee access required" });
  }
};

export async function registerApiRoutes(app: express.Application): Promise<Server> {

  // Authentication routes
  app.get("/api/user", (req: AuthRequest, res) => {
    if (req.user) {
      res.json({ 
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          serviceLevelId: req.user.serviceLevelId
        }
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
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

  app.post("/api/marinas", isAdmin, async (req: AuthRequest, res, next) => {
    try {
      const result = insertMarinaSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid marina data",
          errors: result.error.format() 
        });
      }
      
      const marina = await storage.createMarina(result.data);
      res.status(201).json(marina);
    } catch (err) {
      next(err);
    }
  });

  // Service levels routes
  app.get("/api/service-levels", async (req, res, next) => {
    try {
      const serviceLevels = await storage.getAllServiceLevels();
      res.json(serviceLevels);
    } catch (err) {
      next(err);
    }
  });

  // Boats routes
  app.post("/api/boats", isAuthenticated, upload.single('image'), async (req: AuthRequest, res, next) => {
    try {
      const boatData = { ...req.body };
      
      if (req.file) {
        boatData.photoUrl = `/uploads/${req.file.filename}`;
      }
      
      const result = insertBoatSchema.safeParse(boatData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid boat data",
          errors: result.error.format() 
        });
      }
      
      const boat = await storage.createBoat(result.data);
      res.status(201).json(boat);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/boats", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      let boats;
      if (req.user.role === "admin" || req.user.role === "employee") {
        // Admin/Employee can see all boats
        boats = await storage.getAllBoats?.() || [];
      } else {
        // Regular users can only see their own boats
        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
        if (boatOwner) {
          boats = await storage.getBoatsByOwnerId(boatOwner.id);
        } else {
          boats = [];
        }
      }
      res.json(boats);
    } catch (err) {
      next(err);
    }
  });

  // Pump-out requests routes
  app.post("/api/pump-out-requests", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      const result = insertPumpOutRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid pump-out request data",
          errors: result.error.format() 
        });
      }
      
      const request = await storage.createPumpOutRequest(result.data);
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/pump-out-requests", isAuthenticated, async (req: AuthRequest, res, next) => {
    try {
      let requests;
      if (req.user.role === "admin" || req.user.role === "employee") {
        // Admin/Employee can see all requests
        const status = req.query.status as string;
        if (status) {
          requests = await storage.getPumpOutRequestsByStatus(status);
        } else {
          requests = await storage.getAllPumpOutRequests?.() || [];
        }
      } else {
        // Regular users can only see their own requests
        const boatOwner = await storage.getBoatOwnerByUserId(req.user.id);
        if (boatOwner) {
          const boats = await storage.getBoatsByOwnerId(boatOwner.id);
          requests = [];
          for (const boat of boats) {
            const boatRequests = await storage.getPumpOutRequestsByBoatId(boat.id);
            requests.push(...boatRequests);
          }
        } else {
          requests = [];
        }
      }
      res.json(requests);
    } catch (err) {
      next(err);
    }
  });

  // Users and members routes
  app.get("/api/users/members", isAdmin, async (req: AuthRequest, res, next) => {
    try {
      const members = await storage.getAllMembers();
      res.json(members);
    } catch (err) {
      next(err);
    }
  });

  // Error handling middleware
  app.use(handleError);

  const server = app.listen();
  return server;
}