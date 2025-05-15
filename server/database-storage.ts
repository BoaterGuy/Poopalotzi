import { db } from './db';
import { eq, and, gte, lte, sql, desc, asc, isNull, ne } from 'drizzle-orm';
import * as schema from '@shared/schema';
import type { 
  User, InsertUser, Boat, InsertBoat, Marina, InsertMarina, 
  SlipAssignment, InsertSlipAssignment, ServiceLevel, InsertServiceLevel,
  PumpOutRequest, InsertPumpOutRequest, PumpOutLog, InsertPumpOutLog,
  BoatOwner, InsertBoatOwner, EmployeeAssignment, InsertEmployeeAssignment
} from '@shared/schema';
import { IStorage } from './storage';
import connectPg from "connect-pg-simple";
import session from "express-session";
import pg from 'pg';
const { Pool } = pg;

// Create a new pool instance for session store
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Generate a SESSION_SECRET if it doesn't exist
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'poopalazi-session-secret-' + Math.random().toString(36).substring(2);
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return results[0];
  }

  async createUser(user: InsertUser, passwordHash: string): Promise<User> {
    const result = await db.insert(schema.users).values({
      ...user,
      passwordHash,
      emailVerified: user.emailVerified || false,
    }).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users)
      .set(userData)
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  // Boat Owner operations
  async getBoatOwner(id: number): Promise<BoatOwner | undefined> {
    const results = await db.select().from(schema.boatOwner).where(eq(schema.boatOwner.id, id));
    return results[0];
  }

  async getBoatOwnerByUserId(userId: number): Promise<BoatOwner | undefined> {
    const results = await db.select().from(schema.boatOwner).where(eq(schema.boatOwner.userId, userId));
    return results[0];
  }

  async createBoatOwner(boatOwnerData: InsertBoatOwner): Promise<BoatOwner> {
    const result = await db.insert(schema.boatOwner).values(boatOwnerData).returning();
    return result[0];
  }

  // Boat operations
  async getBoat(id: number): Promise<Boat | undefined> {
    const results = await db.select().from(schema.boat).where(eq(schema.boat.id, id));
    return results[0];
  }

  async getBoatsByOwnerId(ownerId: number): Promise<Boat[]> {
    return await db.select().from(schema.boat).where(eq(schema.boat.ownerId, ownerId));
  }

  async createBoat(boatData: InsertBoat): Promise<Boat> {
    const result = await db.insert(schema.boat).values(boatData).returning();
    return result[0];
  }

  async updateBoat(id: number, boatData: Partial<Boat>): Promise<Boat | undefined> {
    const result = await db.update(schema.boat)
      .set(boatData)
      .where(eq(schema.boat.id, id))
      .returning();
    return result[0];
  }

  async deleteBoat(id: number): Promise<boolean> {
    // First check if there are any slip assignments
    const slipAssignments = await db.select().from(schema.slipAssignment).where(eq(schema.slipAssignment.boatId, id));
    if (slipAssignments.length > 0) {
      // Remove all slip assignments
      await db.delete(schema.slipAssignment).where(eq(schema.slipAssignment.boatId, id));
    }
    
    // Check if there are any pump out requests
    const pumpOutRequests = await db.select().from(schema.pumpOutRequest).where(eq(schema.pumpOutRequest.boatId, id));
    if (pumpOutRequests.length > 0) {
      // For each request, check if there are any logs
      for (const request of pumpOutRequests) {
        await db.delete(schema.pumpOutLog).where(eq(schema.pumpOutLog.requestId, request.id));
        
        // Check if there are any employee assignments
        await db.delete(schema.employeeAssignment).where(eq(schema.employeeAssignment.requestId, request.id));
      }
      
      // Now delete all requests
      await db.delete(schema.pumpOutRequest).where(eq(schema.pumpOutRequest.boatId, id));
    }
    
    // Finally delete the boat
    const result = await db.delete(schema.boat).where(eq(schema.boat.id, id)).returning();
    return result.length > 0;
  }

  // Marina operations
  async getMarina(id: number): Promise<Marina | undefined> {
    const results = await db.select().from(schema.marina).where(eq(schema.marina.id, id));
    return results[0];
  }

  async getAllMarinas(activeOnly = true): Promise<Marina[]> {
    if (activeOnly) {
      return await db.select().from(schema.marina).where(eq(schema.marina.isActive, true));
    }
    return await db.select().from(schema.marina);
  }

  async createMarina(marinaData: InsertMarina): Promise<Marina> {
    const result = await db.insert(schema.marina).values(marinaData).returning();
    return result[0];
  }

  async updateMarina(id: number, marinaData: Partial<Marina>): Promise<Marina | undefined> {
    const result = await db.update(schema.marina)
      .set(marinaData)
      .where(eq(schema.marina.id, id))
      .returning();
    return result[0];
  }

  // Slip Assignment operations
  async getSlipAssignment(id: number): Promise<SlipAssignment | undefined> {
    const results = await db.select().from(schema.slipAssignment).where(eq(schema.slipAssignment.id, id));
    return results[0];
  }

  async getSlipAssignmentByBoatId(boatId: number): Promise<SlipAssignment | undefined> {
    const results = await db.select()
      .from(schema.slipAssignment)
      .where(
        and(
          eq(schema.slipAssignment.boatId, boatId),
          eq(schema.slipAssignment.isActive, true)
        )
      );
    return results[0];
  }

  async createSlipAssignment(slipAssignmentData: InsertSlipAssignment): Promise<SlipAssignment> {
    // Deactivate any existing active slip assignments for this boat
    await db.update(schema.slipAssignment)
      .set({ isActive: false })
      .where(
        and(
          eq(schema.slipAssignment.boatId, slipAssignmentData.boatId),
          eq(schema.slipAssignment.isActive, true)
        )
      );

    const result = await db.insert(schema.slipAssignment).values(slipAssignmentData).returning();
    return result[0];
  }

  async updateSlipAssignment(id: number, slipData: Partial<SlipAssignment>): Promise<SlipAssignment | undefined> {
    const result = await db.update(schema.slipAssignment)
      .set(slipData)
      .where(eq(schema.slipAssignment.id, id))
      .returning();
    return result[0];
  }

  // Service Level operations
  async getServiceLevel(id: number): Promise<ServiceLevel | undefined> {
    const results = await db.select().from(schema.serviceLevel).where(eq(schema.serviceLevel.id, id));
    return results[0];
  }

  async getAllServiceLevels(): Promise<ServiceLevel[]> {
    return await db.select()
      .from(schema.serviceLevel)
      .orderBy(schema.serviceLevel.price);
  }

  async createServiceLevel(serviceLevelData: InsertServiceLevel): Promise<ServiceLevel> {
    const result = await db.insert(schema.serviceLevel).values(serviceLevelData).returning();
    return result[0];
  }

  async updateServiceLevel(id: number, serviceLevelData: Partial<ServiceLevel>): Promise<ServiceLevel | undefined> {
    const result = await db.update(schema.serviceLevel)
      .set(serviceLevelData)
      .where(eq(schema.serviceLevel.id, id))
      .returning();
    return result[0];
  }

  // Pump Out Request operations
  async getPumpOutRequest(id: number): Promise<PumpOutRequest | undefined> {
    const results = await db.select().from(schema.pumpOutRequest).where(eq(schema.pumpOutRequest.id, id));
    return results[0];
  }

  async getPumpOutRequestsByBoatId(boatId: number): Promise<PumpOutRequest[]> {
    return await db.select()
      .from(schema.pumpOutRequest)
      .where(eq(schema.pumpOutRequest.boatId, boatId))
      .orderBy(desc(schema.pumpOutRequest.createdAt));
  }

  async getPumpOutRequestsByWeek(weekStartDate: Date): Promise<PumpOutRequest[]> {
    const startDateStr = weekStartDate.toISOString().split('T')[0];
    return await db.select()
      .from(schema.pumpOutRequest)
      .where(eq(schema.pumpOutRequest.weekStartDate, startDateStr))
      .orderBy(desc(schema.pumpOutRequest.createdAt));
  }

  async getPumpOutRequestsByStatus(status: string): Promise<PumpOutRequest[]> {
    return await db.select()
      .from(schema.pumpOutRequest)
      .where(eq(schema.pumpOutRequest.status, status as any))
      .orderBy(desc(schema.pumpOutRequest.createdAt));
  }

  async createPumpOutRequest(requestData: InsertPumpOutRequest): Promise<PumpOutRequest> {
    const result = await db.insert(schema.pumpOutRequest).values({
      ...requestData,
      status: requestData.status || 'Requested',
      paymentStatus: requestData.paymentStatus || 'Pending'
    }).returning();
    return result[0];
  }

  async updatePumpOutRequest(id: number, requestData: Partial<PumpOutRequest>): Promise<PumpOutRequest | undefined> {
    const result = await db.update(schema.pumpOutRequest)
      .set({
        ...requestData,
        updatedAt: new Date()
      })
      .where(eq(schema.pumpOutRequest.id, id))
      .returning();
    return result[0];
  }

  async updatePumpOutRequestStatus(id: number, status: string): Promise<PumpOutRequest | undefined> {
    // Get the current status
    const request = await this.getPumpOutRequest(id);
    if (!request) return undefined;

    // Update status and add a log entry
    const result = await db.update(schema.pumpOutRequest)
      .set({
        status: status as any,
        updatedAt: new Date()
      })
      .where(eq(schema.pumpOutRequest.id, id))
      .returning();
    
    if (result.length > 0) {
      // Add a log entry
      await db.insert(schema.pumpOutLog).values({
        requestId: id,
        prevStatus: request.status,
        newStatus: status as any,
        changeTimestamp: new Date()
      });
    }
    
    return result[0];
  }

  // Pump Out Log operations
  async getPumpOutLog(id: number): Promise<PumpOutLog | undefined> {
    const results = await db.select().from(schema.pumpOutLog).where(eq(schema.pumpOutLog.id, id));
    return results[0];
  }

  async getPumpOutLogsByRequestId(requestId: number): Promise<PumpOutLog[]> {
    return await db.select()
      .from(schema.pumpOutLog)
      .where(eq(schema.pumpOutLog.requestId, requestId))
      .orderBy(desc(schema.pumpOutLog.changeTimestamp));
  }

  async createPumpOutLog(logData: InsertPumpOutLog): Promise<PumpOutLog> {
    const result = await db.insert(schema.pumpOutLog).values(logData).returning();
    return result[0];
  }

  // Employee Assignment operations
  async getEmployeeAssignment(id: number): Promise<EmployeeAssignment | undefined> {
    const results = await db.select().from(schema.employeeAssignment).where(eq(schema.employeeAssignment.id, id));
    return results[0];
  }

  async getEmployeeAssignmentsByEmployeeId(employeeId: number): Promise<EmployeeAssignment[]> {
    return await db.select()
      .from(schema.employeeAssignment)
      .where(eq(schema.employeeAssignment.employeeId, employeeId))
      .orderBy(desc(schema.employeeAssignment.assignedDate));
  }

  async getEmployeeAssignmentsByRequestId(requestId: number): Promise<EmployeeAssignment[]> {
    return await db.select()
      .from(schema.employeeAssignment)
      .where(eq(schema.employeeAssignment.requestId, requestId))
      .orderBy(desc(schema.employeeAssignment.assignedDate));
  }

  async createEmployeeAssignment(assignmentData: InsertEmployeeAssignment): Promise<EmployeeAssignment> {
    const result = await db.insert(schema.employeeAssignment).values(assignmentData).returning();
    return result[0];
  }

  async deleteEmployeeAssignment(id: number): Promise<boolean> {
    const result = await db.delete(schema.employeeAssignment)
      .where(eq(schema.employeeAssignment.id, id))
      .returning();
    return result.length > 0;
  }

  // Analytics operations
  async countActiveUsersByServiceLevel(): Promise<{ serviceLevelId: number, count: number }[]> {
    const result = await db.execute(sql`
      SELECT "serviceLevelId", COUNT(*) as count 
      FROM users 
      WHERE "serviceLevelId" IS NOT NULL 
      GROUP BY "serviceLevelId"
    `);
    return result as any;
  }

  async countCompletedServicesThisWeek(): Promise<number> {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM pump_out_request 
      WHERE status = 'Completed' 
      AND "updatedAt" >= ${startOfWeek} 
      AND "updatedAt" < ${endOfWeek}
    `);
    
    return result[0]?.count || 0;
  }

  async countUpcomingServices(): Promise<number> {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM pump_out_request 
      WHERE status IN ('Requested', 'Scheduled') 
      AND "createdAt" <= ${endOfWeek}
    `);
    
    return result[0]?.count || 0;
  }

  async calculateAverageRevenuePerUser(): Promise<number> {
    const result = await db.execute(sql`
      SELECT AVG(sl.price) as avg_revenue
      FROM users u
      JOIN service_level sl ON u."serviceLevelId" = sl.id
      WHERE u."serviceLevelId" IS NOT NULL
    `);
    
    return result[0]?.avg_revenue || 0;
  }
}