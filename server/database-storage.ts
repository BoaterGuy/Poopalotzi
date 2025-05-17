import { db } from './db';
import { createSupabaseClient } from './supabase-db';
import { eq, and, desc, sql } from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import * as schema from '@shared/schema';
import { IStorage } from './storage';
import {
  User, InsertUser, Boat, InsertBoat, Marina, InsertMarina,
  SlipAssignment, InsertSlipAssignment, ServiceLevel, InsertServiceLevel,
  PumpOutRequest, InsertPumpOutRequest, PumpOutLog, InsertPumpOutLog,
  BoatOwner, InsertBoatOwner, EmployeeAssignment, InsertEmployeeAssignment
} from '@shared/schema';
import {
  users, boat, boatOwner, marina, slipAssignment, serviceLevel,
  pumpOutRequest, pumpOutLog, employeeAssignment
} from '@shared/schema';

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  private supabaseDB: any;
  
  constructor() {
    // Initialize session store with PostgreSQL
    const PgStore = connectPg(session);
    this.sessionStore = new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'session',
      ssl: { rejectUnauthorized: false }
    });
    
    // We'll initialize the actual DB client when needed
    this.supabaseDB = db;
  }
  
  // Get DB client
  private async getDB() {
    // Use existing client or create a new Supabase client if needed
    if (!this.supabaseDB) {
      this.supabaseDB = await createSupabaseClient();
    }
    return this.supabaseDB;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser, passwordHash: string): Promise<User> {
    const result = await db.insert(users).values({
      ...user,
      passwordHash
    }).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  // Boat Owner operations
  async getBoatOwner(id: number): Promise<BoatOwner | undefined> {
    const result = await db.select().from(boatOwner).where(eq(boatOwner.id, id));
    return result[0];
  }

  async getBoatOwnerByUserId(userId: number): Promise<BoatOwner | undefined> {
    const result = await db.select().from(boatOwner).where(eq(boatOwner.userId, userId));
    return result[0];
  }

  async createBoatOwner(boatOwnerData: InsertBoatOwner): Promise<BoatOwner> {
    const result = await db.insert(boatOwner).values(boatOwnerData).returning();
    return result[0];
  }
  
  // Boat operations
  async getBoat(id: number): Promise<Boat | undefined> {
    const result = await db.select().from(boat).where(eq(boat.id, id));
    return result[0];
  }

  async getBoatsByOwnerId(ownerId: number): Promise<Boat[]> {
    return db.select().from(boat).where(eq(boat.ownerId, ownerId));
  }

  async createBoat(boatData: InsertBoat): Promise<Boat> {
    const result = await db.insert(boat).values(boatData).returning();
    return result[0];
  }

  async updateBoat(id: number, boatData: Partial<Boat>): Promise<Boat | undefined> {
    const result = await db.update(boat)
      .set(boatData)
      .where(eq(boat.id, id))
      .returning();
    return result[0];
  }

  async deleteBoat(id: number): Promise<boolean> {
    const result = await db.delete(boat).where(eq(boat.id, id));
    return true;
  }
  
  // Marina operations
  async getMarina(id: number): Promise<Marina | undefined> {
    const result = await db.select().from(marina).where(eq(marina.id, id));
    return result[0];
  }

  async getAllMarinas(activeOnly = true): Promise<Marina[]> {
    if (activeOnly) {
      return db.select().from(marina).where(eq(marina.isActive, true));
    }
    return db.select().from(marina);
  }

  async createMarina(marinaData: InsertMarina): Promise<Marina> {
    const result = await db.insert(marina).values(marinaData).returning();
    return result[0];
  }

  async updateMarina(id: number, marinaData: Partial<Marina>): Promise<Marina | undefined> {
    const result = await db.update(marina)
      .set(marinaData)
      .where(eq(marina.id, id))
      .returning();
    return result[0];
  }
  
  async deleteMarina(id: number): Promise<boolean> {
    const result = await db.delete(marina).where(eq(marina.id, id));
    return true;
  }
  
  // Slip Assignment operations
  async getSlipAssignment(id: number): Promise<SlipAssignment | undefined> {
    const result = await db.select().from(slipAssignment).where(eq(slipAssignment.id, id));
    return result[0];
  }

  async getSlipAssignmentByBoatId(boatId: number): Promise<SlipAssignment | undefined> {
    const result = await db.select().from(slipAssignment).where(eq(slipAssignment.boatId, boatId));
    return result[0];
  }

  async createSlipAssignment(slipAssignmentData: InsertSlipAssignment): Promise<SlipAssignment> {
    const result = await db.insert(slipAssignment).values(slipAssignmentData).returning();
    return result[0];
  }

  async updateSlipAssignment(id: number, slipData: Partial<SlipAssignment>): Promise<SlipAssignment | undefined> {
    const result = await db.update(slipAssignment)
      .set(slipData)
      .where(eq(slipAssignment.id, id))
      .returning();
    return result[0];
  }
  
  // Service Level operations
  async getServiceLevel(id: number): Promise<ServiceLevel | undefined> {
    const result = await db.select().from(serviceLevel).where(eq(serviceLevel.id, id));
    return result[0];
  }

  async getAllServiceLevels(): Promise<ServiceLevel[]> {
    return db.select().from(serviceLevel);
  }

  async createServiceLevel(serviceLevelData: InsertServiceLevel): Promise<ServiceLevel> {
    const result = await db.insert(serviceLevel).values(serviceLevelData).returning();
    return result[0];
  }

  async updateServiceLevel(id: number, serviceLevelData: Partial<ServiceLevel>): Promise<ServiceLevel | undefined> {
    const result = await db.update(serviceLevel)
      .set(serviceLevelData)
      .where(eq(serviceLevel.id, id))
      .returning();
    return result[0];
  }
  
  // Pump Out Request operations
  async getPumpOutRequest(id: number): Promise<PumpOutRequest | undefined> {
    const result = await db.select().from(pumpOutRequest).where(eq(pumpOutRequest.id, id));
    return result[0];
  }

  async getPumpOutRequestsByBoatId(boatId: number): Promise<PumpOutRequest[]> {
    return db.select()
      .from(pumpOutRequest)
      .where(eq(pumpOutRequest.boatId, boatId))
      .orderBy(desc(pumpOutRequest.createdAt));
  }

  async getPumpOutRequestsByWeek(weekStartDate: Date): Promise<PumpOutRequest[]> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    
    return db.select()
      .from(pumpOutRequest)
      .where(
        and(
          sql`${pumpOutRequest.weekStartDate} >= ${weekStartDate}`,
          sql`${pumpOutRequest.weekStartDate} < ${weekEndDate}`
        )
      );
  }

  async getPumpOutRequestsByStatus(status: string): Promise<PumpOutRequest[]> {
    return db.select()
      .from(pumpOutRequest)
      .where(eq(pumpOutRequest.status, status));
  }

  async createPumpOutRequest(requestData: InsertPumpOutRequest): Promise<PumpOutRequest> {
    const result = await db.insert(pumpOutRequest)
      .values({
        ...requestData,
        updatedAt: new Date()
      })
      .returning();
    return result[0];
  }

  async updatePumpOutRequest(id: number, requestData: Partial<PumpOutRequest>): Promise<PumpOutRequest | undefined> {
    const result = await db.update(pumpOutRequest)
      .set({
        ...requestData,
        updatedAt: new Date()
      })
      .where(eq(pumpOutRequest.id, id))
      .returning();
    return result[0];
  }

  async updatePumpOutRequestStatus(id: number, status: string): Promise<PumpOutRequest | undefined> {
    // Get previous status
    const currentRequest = await this.getPumpOutRequest(id);
    if (!currentRequest) return undefined;
    
    // Create log entry
    await this.createPumpOutLog({
      requestId: id,
      prevStatus: currentRequest.status,
      newStatus: status as any,
    });
    
    // Update request status
    return this.updatePumpOutRequest(id, { 
      status: status as any,
      updatedAt: new Date()
    });
  }
  
  // Pump Out Log operations
  async getPumpOutLog(id: number): Promise<PumpOutLog | undefined> {
    const result = await db.select().from(pumpOutLog).where(eq(pumpOutLog.id, id));
    return result[0];
  }

  async getPumpOutLogsByRequestId(requestId: number): Promise<PumpOutLog[]> {
    return db.select()
      .from(pumpOutLog)
      .where(eq(pumpOutLog.requestId, requestId));
  }

  async createPumpOutLog(logData: InsertPumpOutLog): Promise<PumpOutLog> {
    const result = await db.insert(pumpOutLog).values(logData).returning();
    return result[0];
  }
  
  // Employee Assignment operations
  async getEmployeeAssignment(id: number): Promise<EmployeeAssignment | undefined> {
    const result = await db.select().from(employeeAssignment).where(eq(employeeAssignment.id, id));
    return result[0];
  }

  async getEmployeeAssignmentsByEmployeeId(employeeId: number): Promise<EmployeeAssignment[]> {
    return db.select()
      .from(employeeAssignment)
      .where(eq(employeeAssignment.employeeId, employeeId));
  }

  async getEmployeeAssignmentsByRequestId(requestId: number): Promise<EmployeeAssignment[]> {
    return db.select()
      .from(employeeAssignment)
      .where(eq(employeeAssignment.requestId, requestId));
  }

  async createEmployeeAssignment(assignmentData: InsertEmployeeAssignment): Promise<EmployeeAssignment> {
    const result = await db.insert(employeeAssignment).values(assignmentData).returning();
    return result[0];
  }

  async deleteEmployeeAssignment(id: number): Promise<boolean> {
    const result = await db.delete(employeeAssignment).where(eq(employeeAssignment.id, id));
    return true;
  }
  
  // Analytics operations
  async countActiveUsersByServiceLevel(): Promise<{ serviceLevelId: number, count: number }[]> {
    const result = await db
      .select({
        serviceLevelId: users.serviceLevelId,
        count: sql`COUNT(*)`.mapWith(Number)
      })
      .from(users)
      .where(sql`${users.serviceLevelId} IS NOT NULL`)
      .groupBy(users.serviceLevelId);
    
    return result.map(row => ({
      serviceLevelId: Number(row.serviceLevelId),
      count: row.count
    }));
  }

  async countCompletedServicesThisWeek(): Promise<number> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(pumpOutRequest)
      .where(
        and(
          eq(pumpOutRequest.status, 'Completed'),
          sql`${pumpOutRequest.updatedAt} >= ${startOfWeek}`
        )
      );
    
    return result[0]?.count || 0;
  }

  async countUpcomingServices(): Promise<number> {
    const today = new Date();
    
    const result = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(pumpOutRequest)
      .where(
        and(
          sql`${pumpOutRequest.status} IN ('Requested', 'Scheduled')`,
          sql`${pumpOutRequest.weekStartDate} >= ${today}`
        )
      );
    
    return result[0]?.count || 0;
  }

  async calculateAverageRevenuePerUser(): Promise<number> {
    const result = await db
      .select({
        avgRevenue: sql`AVG(${serviceLevel.price})`.mapWith(Number)
      })
      .from(users)
      .innerJoin(serviceLevel, eq(users.serviceLevelId, serviceLevel.id));
    
    return result[0]?.avgRevenue || 0;
  }
}