import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./index";
import { insertBoatSchema, insertMarinaSchema, insertPumpOutRequestSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Utility for async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // GET current user info
  app.get("/api/auth/user", isAuthenticated, (req: any, res) => {
    res.json(req.user);
  });

  // SERVICE LEVELS - List all (public)
  app.get("/api/service-levels", asyncHandler(async (req, res) => {
    res.json(await storage.getAllServiceLevels());
  }));

  // MARINAS - List all (public)
  app.get("/api/marinas", asyncHandler(async (req, res) => {
    res.json(await storage.getAllMarinas());
  }));

  // BOATS - List for current user
  app.get("/api/boats", isAuthenticated, asyncHandler(async (req: any, res) => {
    const boats = await storage.getBoatsByOwnerId(req.user.id);
    res.json(boats);
  }));

  // BOATS - Create new (owner only)
  app.post("/api/boats", isAuthenticated, asyncHandler(async (req: any, res) => {
    const boatData = insertBoatSchema.parse(req.body);
    const boat = await storage.createBoat({ ...boatData, ownerId: req.user.id });
    res.status(201).json(boat);
  }));

  // PUMP-OUT REQUESTS - List for current user
  app.get("/api/pump-out-requests", isAuthenticated, asyncHandler(async (req: any, res) => {
    const requests = await storage.getPumpOutRequestsByOwnerId(req.user.id);
    res.json(requests);
  }));

  // PUMP-OUT REQUESTS - Create new (owner only)
  app.post("/api/pump-out-requests", isAuthenticated, asyncHandler(async (req: any, res) => {
    const requestData = insertPumpOutRequestSchema.parse(req.body);
    const request = await storage.createPumpOutRequest({ ...requestData, ownerId: req.user.id });
    res.status(201).json(request);
  }));

  // PUMP-OUT REQUESTS - List for week (admin/operator)
  app.get("/api/pump-out-requests/week/:date", isAuthenticated, asyncHandler(async (req: any, res) => {
    if (req.user.role !== "admin" && req.user.role !== "employee") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const weekStart = new Date(req.params.date);
    const requests = await storage.getPumpOutRequestsByWeek(weekStart);
    res.json(requests);
  }));

  // Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  });

  return createServer(app);
}