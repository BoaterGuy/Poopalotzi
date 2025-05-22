import { users, boat, marina, slipAssignment, serviceLevel, pumpOutRequest, pumpOutLog, boatOwner, employeeAssignment } from "@shared/schema";
import type { 
  User, InsertUser, Boat, InsertBoat, Marina, InsertMarina, 
  SlipAssignment, InsertSlipAssignment, ServiceLevel, InsertServiceLevel,
  PumpOutRequest, InsertPumpOutRequest, PumpOutLog, InsertPumpOutLog,
  BoatOwner, InsertBoatOwner, EmployeeAssignment, InsertEmployeeAssignment
} from "@shared/schema";
import { requestStatusEnum, paymentStatusEnum } from "@shared/schema";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";

// Interface for storage operations
import session from "express-session";

export interface IStorage {
  sessionStore: session.Store;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser, passwordHash: string): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Boat Owner operations
  getBoatOwner(id: number): Promise<BoatOwner | undefined>;
  getBoatOwnerByUserId(userId: number): Promise<BoatOwner | undefined>;
  createBoatOwner(boatOwner: InsertBoatOwner): Promise<BoatOwner>;
  
  // Boat operations
  getBoat(id: number): Promise<Boat | undefined>;
  getBoatsByOwnerId(ownerId: number): Promise<Boat[]>;
  createBoat(boat: InsertBoat): Promise<Boat>;
  updateBoat(id: number, boatData: Partial<Boat>): Promise<Boat | undefined>;
  deleteBoat(id: number): Promise<boolean>;
  
  // Marina operations
  getMarina(id: number): Promise<Marina | undefined>;
  getAllMarinas(activeOnly?: boolean): Promise<Marina[]>;
  createMarina(marina: InsertMarina): Promise<Marina>;
  updateMarina(id: number, marinaData: Partial<Marina>): Promise<Marina | undefined>;
  deleteMarina(id: number): Promise<boolean>;
  
  // Slip Assignment operations
  getSlipAssignment(id: number): Promise<SlipAssignment | undefined>;
  getSlipAssignmentByBoatId(boatId: number): Promise<SlipAssignment | undefined>;
  createSlipAssignment(slipAssignment: InsertSlipAssignment): Promise<SlipAssignment>;
  updateSlipAssignment(id: number, slipData: Partial<SlipAssignment>): Promise<SlipAssignment | undefined>;
  
  // Service Level operations
  getServiceLevel(id: number): Promise<ServiceLevel | undefined>;
  getAllServiceLevels(): Promise<ServiceLevel[]>;
  createServiceLevel(serviceLevel: InsertServiceLevel): Promise<ServiceLevel>;
  updateServiceLevel(id: number, serviceLevelData: Partial<ServiceLevel>): Promise<ServiceLevel | undefined>;
  
  // Pump Out Request operations
  getPumpOutRequest(id: number): Promise<PumpOutRequest | undefined>;
  getPumpOutRequestsByBoatId(boatId: number): Promise<PumpOutRequest[]>;
  getPumpOutRequestsByWeek(weekStartDate: Date): Promise<PumpOutRequest[]>;
  getPumpOutRequestsByStatus(status: string): Promise<PumpOutRequest[]>;
  createPumpOutRequest(request: InsertPumpOutRequest): Promise<PumpOutRequest>;
  updatePumpOutRequest(id: number, requestData: Partial<PumpOutRequest>): Promise<PumpOutRequest | undefined>;
  updatePumpOutRequestStatus(id: number, status: string): Promise<PumpOutRequest | undefined>;
  
  // Pump Out Log operations
  getPumpOutLog(id: number): Promise<PumpOutLog | undefined>;
  getPumpOutLogsByRequestId(requestId: number): Promise<PumpOutLog[]>;
  createPumpOutLog(log: InsertPumpOutLog): Promise<PumpOutLog>;
  
  // Employee Assignment operations
  getEmployeeAssignment(id: number): Promise<EmployeeAssignment | undefined>;
  getEmployeeAssignmentsByEmployeeId(employeeId: number): Promise<EmployeeAssignment[]>;
  getEmployeeAssignmentsByRequestId(requestId: number): Promise<EmployeeAssignment[]>;
  createEmployeeAssignment(assignment: InsertEmployeeAssignment): Promise<EmployeeAssignment>;
  deleteEmployeeAssignment(id: number): Promise<boolean>;
  
  // Analytics operations
  countActiveUsersByServiceLevel(): Promise<{ serviceLevelId: number, count: number }[]>;
  countCompletedServicesThisWeek(): Promise<number>;
  countUpcomingServices(): Promise<number>;
  calculateAverageRevenuePerUser(): Promise<number>;
}

// In-memory storage implementation
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private usersData: Map<number, User>;
  private boatOwnersData: Map<number, BoatOwner>;
  private boatsData: Map<number, Boat>;
  private marinasData: Map<number, Marina>;
  private slipAssignmentsData: Map<number, SlipAssignment>;
  private serviceLevelsData: Map<number, ServiceLevel>;
  private pumpOutRequestsData: Map<number, PumpOutRequest>;
  private pumpOutLogsData: Map<number, PumpOutLog>;
  private employeeAssignmentsData: Map<number, EmployeeAssignment>;
  
  private currentUserId: number;
  private currentBoatOwnerId: number;
  private currentBoatId: number;
  private currentMarinaId: number;
  private currentSlipAssignmentId: number;
  private currentServiceLevelId: number;
  private currentPumpOutRequestId: number;
  private currentPumpOutLogId: number;
  private currentEmployeeAssignmentId: number;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.usersData = new Map();
    this.boatOwnersData = new Map();
    this.boatsData = new Map();
    this.marinasData = new Map();
    this.slipAssignmentsData = new Map();
    this.serviceLevelsData = new Map();
    this.pumpOutRequestsData = new Map();
    this.pumpOutLogsData = new Map();
    this.employeeAssignmentsData = new Map();
    
    this.currentUserId = 1;
    this.currentBoatOwnerId = 1;
    this.currentBoatId = 1;
    this.currentMarinaId = 1;
    this.currentSlipAssignmentId = 1;
    this.currentServiceLevelId = 1;
    this.currentPumpOutRequestId = 1;
    this.currentPumpOutLogId = 1;
    this.currentEmployeeAssignmentId = 1;

    // Service levels are now initialized in server/index.ts

    // Initialize with a few marinas
    this.createMarina({
      name: "Sunset Marina",
      isActive: true
    });

    this.createMarina({
      name: "Harbor Point",
      isActive: true
    });

    this.createMarina({
      name: "Bay Front",
      isActive: true
    });

    // Initialize admin user
    const adminPasswordHash = "$2a$10$5J5Qn0qWsqa0.Oipdes31OdOjJXZE4cY4AI2OiaJG/Rh1YR/PuOm."; // Secure hash for development
    this.usersData.set(this.currentUserId, {
      id: this.currentUserId,
      email: "admin@poopalazi.com",
      firstName: "Admin",
      lastName: "User",
      phone: null,
      passwordHash: adminPasswordHash,
      role: "admin",
      oauthProvider: null,
      oauthId: null,
      createdAt: new Date(),
      serviceLevelId: null,
      emailVerified: true
    });
    this.currentUserId++;

    // Initialize employee user
    const employeePasswordHash = "$2a$10$5J5Qn0qWsqa0.Oipdes31OdOjJXZE4cY4AI2OiaJG/Rh1YR/PuOm."; // Secure hash for development
    this.usersData.set(this.currentUserId, {
      id: this.currentUserId,
      email: "employee@poopalazi.com",
      firstName: "Employee",
      lastName: "User",
      phone: null,
      passwordHash: employeePasswordHash,
      role: "employee",
      oauthProvider: null,
      oauthId: null,
      createdAt: new Date(),
      serviceLevelId: null,
      emailVerified: true
    });
    this.currentUserId++;

    // Initialize member user
    const memberPasswordHash = "$2a$10$5J5Qn0qWsqa0.Oipdes31OdOjJXZE4cY4AI2OiaJG/Rh1YR/PuOm."; // Secure hash for development
    this.usersData.set(this.currentUserId, {
      id: this.currentUserId,
      email: "member@poopalazi.com",
      firstName: "Member",
      lastName: "User",
      phone: null,
      passwordHash: memberPasswordHash,
      role: "member",
      oauthProvider: null,
      oauthId: null,
      createdAt: new Date(),
      serviceLevelId: null,
      emailVerified: true
    });
    
    // Create boat owner for member
    this.createBoatOwner({ userId: this.currentUserId });
    this.currentUserId++;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser, passwordHash: string): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = {
      ...user,
      id,
      passwordHash,
      createdAt: new Date()
    };
    this.usersData.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.usersData.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  // Boat Owner operations
  async getBoatOwner(id: number): Promise<BoatOwner | undefined> {
    return this.boatOwnersData.get(id);
  }

  async getBoatOwnerByUserId(userId: number): Promise<BoatOwner | undefined> {
    return Array.from(this.boatOwnersData.values()).find(owner => owner.userId === userId);
  }

  async createBoatOwner(boatOwnerData: InsertBoatOwner): Promise<BoatOwner> {
    const id = this.currentBoatOwnerId++;
    const newBoatOwner: BoatOwner = {
      ...boatOwnerData,
      id,
      createdAt: new Date()
    };
    this.boatOwnersData.set(id, newBoatOwner);
    return newBoatOwner;
  }

  // Boat operations
  async getBoat(id: number): Promise<Boat | undefined> {
    return this.boatsData.get(id);
  }

  async getBoatsByOwnerId(ownerId: number): Promise<Boat[]> {
    return Array.from(this.boatsData.values()).filter(boat => boat.ownerId === ownerId);
  }

  async createBoat(boatData: InsertBoat): Promise<Boat> {
    const id = this.currentBoatId++;
    const newBoat: Boat = {
      ...boatData,
      id,
      createdAt: new Date()
    };
    this.boatsData.set(id, newBoat);
    return newBoat;
  }

  async updateBoat(id: number, boatData: Partial<Boat>): Promise<Boat | undefined> {
    const existingBoat = this.boatsData.get(id);
    if (!existingBoat) return undefined;
    
    const updatedBoat = { ...existingBoat, ...boatData };
    this.boatsData.set(id, updatedBoat);
    return updatedBoat;
  }

  async deleteBoat(id: number): Promise<boolean> {
    return this.boatsData.delete(id);
  }

  // Marina operations
  async getMarina(id: number): Promise<Marina | undefined> {
    return this.marinasData.get(id);
  }

  async getAllMarinas(activeOnly = true): Promise<Marina[]> {
    const marinas = Array.from(this.marinasData.values());
    return activeOnly ? marinas.filter(marina => marina.isActive) : marinas;
  }

  async createMarina(marinaData: InsertMarina): Promise<Marina> {
    const id = this.currentMarinaId++;
    const newMarina: Marina = {
      ...marinaData,
      id,
      createdAt: new Date()
    };
    this.marinasData.set(id, newMarina);
    return newMarina;
  }

  async updateMarina(id: number, marinaData: Partial<Marina>): Promise<Marina | undefined> {
    const existingMarina = this.marinasData.get(id);
    if (!existingMarina) return undefined;
    
    const updatedMarina = { ...existingMarina, ...marinaData };
    this.marinasData.set(id, updatedMarina);
    return updatedMarina;
  }
  
  async deleteMarina(id: number): Promise<boolean> {
    if (!this.marinasData.has(id)) return false;
    return this.marinasData.delete(id);
  }

  // Slip Assignment operations
  async getSlipAssignment(id: number): Promise<SlipAssignment | undefined> {
    return this.slipAssignmentsData.get(id);
  }

  async getSlipAssignmentByBoatId(boatId: number): Promise<SlipAssignment | undefined> {
    return Array.from(this.slipAssignmentsData.values()).find(slip => slip.boatId === boatId);
  }

  async createSlipAssignment(slipAssignmentData: InsertSlipAssignment): Promise<SlipAssignment> {
    const id = this.currentSlipAssignmentId++;
    const newSlipAssignment: SlipAssignment = {
      ...slipAssignmentData,
      id,
      createdAt: new Date()
    };
    this.slipAssignmentsData.set(id, newSlipAssignment);
    return newSlipAssignment;
  }

  async updateSlipAssignment(id: number, slipData: Partial<SlipAssignment>): Promise<SlipAssignment | undefined> {
    const existingSlip = this.slipAssignmentsData.get(id);
    if (!existingSlip) return undefined;
    
    const updatedSlip = { ...existingSlip, ...slipData };
    this.slipAssignmentsData.set(id, updatedSlip);
    return updatedSlip;
  }

  // Service Level operations
  async getServiceLevel(id: number): Promise<ServiceLevel | undefined> {
    return this.serviceLevelsData.get(id);
  }

  async getAllServiceLevels(): Promise<ServiceLevel[]> {
    return Array.from(this.serviceLevelsData.values());
  }

  async createServiceLevel(serviceLevelData: InsertServiceLevel): Promise<ServiceLevel> {
    const id = this.currentServiceLevelId++;
    const newServiceLevel: ServiceLevel = {
      ...serviceLevelData,
      id,
      createdAt: new Date()
    };
    this.serviceLevelsData.set(id, newServiceLevel);
    return newServiceLevel;
  }

  async updateServiceLevel(id: number, serviceLevelData: Partial<ServiceLevel>): Promise<ServiceLevel | undefined> {
    const existingServiceLevel = this.serviceLevelsData.get(id);
    if (!existingServiceLevel) return undefined;
    
    const updatedServiceLevel = { ...existingServiceLevel, ...serviceLevelData };
    this.serviceLevelsData.set(id, updatedServiceLevel);
    return updatedServiceLevel;
  }

  // Pump Out Request operations
  async getPumpOutRequest(id: number): Promise<PumpOutRequest | undefined> {
    return this.pumpOutRequestsData.get(id);
  }

  async getPumpOutRequestsByBoatId(boatId: number): Promise<PumpOutRequest[]> {
    return Array.from(this.pumpOutRequestsData.values())
      .filter(request => request.boatId === boatId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPumpOutRequestsByWeek(weekStartDate: Date): Promise<PumpOutRequest[]> {
    const startMs = weekStartDate.getTime();
    const endDate = new Date(startMs + 7 * 24 * 60 * 60 * 1000);
    
    return Array.from(this.pumpOutRequestsData.values())
      .filter(request => {
        const requestDate = new Date(request.weekStartDate);
        return requestDate >= weekStartDate && requestDate < endDate;
      });
  }

  async getPumpOutRequestsByStatus(status: string): Promise<PumpOutRequest[]> {
    return Array.from(this.pumpOutRequestsData.values())
      .filter(request => request.status === status);
  }

  async createPumpOutRequest(requestData: InsertPumpOutRequest): Promise<PumpOutRequest> {
    const id = this.currentPumpOutRequestId++;
    const now = new Date();
    const newRequest: PumpOutRequest = {
      ...requestData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.pumpOutRequestsData.set(id, newRequest);
    return newRequest;
  }

  async updatePumpOutRequest(id: number, requestData: Partial<PumpOutRequest>): Promise<PumpOutRequest | undefined> {
    const existingRequest = this.pumpOutRequestsData.get(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest = { 
      ...existingRequest, 
      ...requestData,
      updatedAt: new Date()
    };
    this.pumpOutRequestsData.set(id, updatedRequest);
    return updatedRequest;
  }

  async updatePumpOutRequestStatus(id: number, status: string): Promise<PumpOutRequest | undefined> {
    const existingRequest = this.pumpOutRequestsData.get(id);
    if (!existingRequest) return undefined;
    
    const prevStatus = existingRequest.status;
    
    // Create log entry for status change
    await this.createPumpOutLog({
      requestId: id,
      prevStatus,
      newStatus: status as any,
    });
    
    // Update request status
    const updatedRequest = { 
      ...existingRequest, 
      status: status as any,
      updatedAt: new Date()
    };
    this.pumpOutRequestsData.set(id, updatedRequest);
    return updatedRequest;
  }

  // Pump Out Log operations
  async getPumpOutLog(id: number): Promise<PumpOutLog | undefined> {
    return this.pumpOutLogsData.get(id);
  }

  async getPumpOutLogsByRequestId(requestId: number): Promise<PumpOutLog[]> {
    return Array.from(this.pumpOutLogsData.values())
      .filter(log => log.requestId === requestId)
      .sort((a, b) => b.changeTimestamp.getTime() - a.changeTimestamp.getTime());
  }

  async createPumpOutLog(logData: InsertPumpOutLog): Promise<PumpOutLog> {
    const id = this.currentPumpOutLogId++;
    const now = new Date();
    const newLog: PumpOutLog = {
      ...logData,
      id,
      changeTimestamp: now,
      createdAt: now
    };
    this.pumpOutLogsData.set(id, newLog);
    return newLog;
  }

  // Employee Assignment operations
  async getEmployeeAssignment(id: number): Promise<EmployeeAssignment | undefined> {
    return this.employeeAssignmentsData.get(id);
  }

  async getEmployeeAssignmentsByEmployeeId(employeeId: number): Promise<EmployeeAssignment[]> {
    return Array.from(this.employeeAssignmentsData.values())
      .filter(assignment => assignment.employeeId === employeeId);
  }

  async getEmployeeAssignmentsByRequestId(requestId: number): Promise<EmployeeAssignment[]> {
    return Array.from(this.employeeAssignmentsData.values())
      .filter(assignment => assignment.requestId === requestId);
  }

  async createEmployeeAssignment(assignmentData: InsertEmployeeAssignment): Promise<EmployeeAssignment> {
    const id = this.currentEmployeeAssignmentId++;
    const newAssignment: EmployeeAssignment = {
      ...assignmentData,
      id,
      assignedAt: new Date()
    };
    this.employeeAssignmentsData.set(id, newAssignment);
    return newAssignment;
  }

  async deleteEmployeeAssignment(id: number): Promise<boolean> {
    return this.employeeAssignmentsData.delete(id);
  }

  // Analytics operations
  async countActiveUsersByServiceLevel(): Promise<{ serviceLevelId: number, count: number }[]> {
    const serviceLevelCounts = new Map<number, number>();
    
    Array.from(this.usersData.values())
      .filter(user => user.serviceLevelId !== null && user.serviceLevelId !== undefined)
      .forEach(user => {
        const serviceLevelId = user.serviceLevelId!;
        serviceLevelCounts.set(
          serviceLevelId, 
          (serviceLevelCounts.get(serviceLevelId) || 0) + 1
        );
      });
    
    return Array.from(serviceLevelCounts.entries())
      .map(([serviceLevelId, count]) => ({ serviceLevelId, count }));
  }

  async countCompletedServicesThisWeek(): Promise<number> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return Array.from(this.pumpOutRequestsData.values())
      .filter(request => 
        request.status === 'Completed' && 
        request.updatedAt >= startOfWeek && 
        request.updatedAt < endOfWeek
      ).length;
  }

  async countUpcomingServices(): Promise<number> {
    return Array.from(this.pumpOutRequestsData.values())
      .filter(request => ['Requested', 'Scheduled'].includes(request.status))
      .length;
  }

  async calculateAverageRevenuePerUser(): Promise<number> {
    const activeUsers = Array.from(this.usersData.values())
      .filter(user => user.serviceLevelId !== null && user.serviceLevelId !== undefined);
    
    if (activeUsers.length === 0) return 0;
    
    let totalRevenue = 0;
    for (const user of activeUsers) {
      const serviceLevel = await this.getServiceLevel(user.serviceLevelId!);
      if (serviceLevel) {
        totalRevenue += serviceLevel.price;
      }
    }
    
    return totalRevenue / activeUsers.length;
  }
}

// Import the database storage implementation
import { DatabaseStorage } from "./database-storage";

// Use database storage instead of in-memory storage for persistence
export const storage = new DatabaseStorage();
