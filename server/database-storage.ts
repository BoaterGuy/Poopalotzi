import { db } from './db';
import { eq, and, gte, lte, sql, desc, asc, isNull, ne } from 'drizzle-orm';
import * as schema from '@shared/schema';
import type { 
  User, InsertUser, Boat, InsertBoat, Marina, InsertMarina, 
  DockAssignment, InsertDockAssignment, ServiceLevel, InsertServiceLevel,
  PumpOutRequest, InsertPumpOutRequest, PumpOutLog, InsertPumpOutLog,
  BoatOwner, InsertBoatOwner, EmployeeAssignment, InsertEmployeeAssignment,
  CloverConfig, InsertCloverConfig, PaymentTransaction, InsertPaymentTransaction,
  NotificationPreferences, InsertNotificationPreferences, EmailNotificationLog, InsertEmailNotificationLog
} from '@shared/schema';
import { IStorage } from './storage';
import connectPg from "connect-pg-simple";
import session from "express-session";
import pg from 'pg';
const { Pool } = pg;

// Create a new pool instance for session store
let sessionPool: any;

try {
  // First try with connection string
  sessionPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} catch (error) {
  console.error("Error creating session pool with connection string:", error);
  
  // Fallback to individual parameters
  sessionPool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

// Generate a SESSION_SECRET if it doesn't exist
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'poopalazi-session-secret-' + Math.random().toString(36).substring(2);
  console.log("Generated a temporary SESSION_SECRET - this should be set as an environment variable in production");
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  // Add the missing getAdminUsers method
  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.role, 'admin'));
  }
  
  // Add the missing deleteMarina method
  async deleteMarina(id: number): Promise<boolean> {
    try {
      const result = await db.delete(schema.marina)
        .where(eq(schema.marina.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting marina:", error);
      return false;
    }
  }
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: sessionPool, 
      createTableIfMissing: true,
      tableName: 'session'
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

  async getAllMembers(): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.role, 'member'));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(asc(schema.users.firstName), asc(schema.users.lastName));
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const result = await db.update(schema.users)
      .set({ role: role as "member" | "employee" | "admin" })
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
    // First check if there are any dock assignments
    const dockAssignments = await db.select().from(schema.dockAssignment).where(eq(schema.dockAssignment.boatId, id));
    if (dockAssignments.length > 0) {
      // Remove all dock assignments
      await db.delete(schema.dockAssignment).where(eq(schema.dockAssignment.boatId, id));
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

  // Dock Assignment operations
  async getDockAssignment(id: number): Promise<DockAssignment | undefined> {
    const results = await db.select().from(schema.dockAssignment).where(eq(schema.dockAssignment.id, id));
    return results[0];
  }

  async getDockAssignmentByBoatId(boatId: number): Promise<DockAssignment | undefined> {
    const results = await db.select()
      .from(schema.dockAssignment)
      .where(eq(schema.dockAssignment.boatId, boatId));
    return results[0];
  }

  async createDockAssignment(dockAssignmentData: InsertDockAssignment): Promise<DockAssignment> {
    // Delete any existing dock assignments for this boat (since we don't have isActive field)
    await db.delete(schema.dockAssignment)
      .where(eq(schema.dockAssignment.boatId, dockAssignmentData.boatId));

    const result = await db.insert(schema.dockAssignment).values(dockAssignmentData).returning();
    return result[0];
  }

  async updateDockAssignment(id: number, dockData: Partial<DockAssignment>): Promise<DockAssignment | undefined> {
    const result = await db.update(schema.dockAssignment)
      .set(dockData)
      .where(eq(schema.dockAssignment.id, id))
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
    // If status is "all", return all requests without filtering by status
    if (status === "all") {
      return await db.select()
        .from(schema.pumpOutRequest)
        .orderBy(desc(schema.pumpOutRequest.createdAt));
    }
    
    // Otherwise, filter by the requested status
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
      .orderBy(desc(schema.employeeAssignment.assignedAt));
  }

  async getEmployeeAssignmentsByRequestId(requestId: number): Promise<EmployeeAssignment[]> {
    return await db.select()
      .from(schema.employeeAssignment)
      .where(eq(schema.employeeAssignment.requestId, requestId))
      .orderBy(desc(schema.employeeAssignment.assignedAt));
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
      SELECT "service_level_id" as "serviceLevelId", COUNT(*) as count 
      FROM users 
      WHERE "service_level_id" IS NOT NULL 
      GROUP BY "service_level_id"
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
      AND "updated_at" >= ${startOfWeek} 
      AND "updated_at" < ${endOfWeek}
    `);
    
    return Number(result.rows[0]?.count) || 0;
  }

  async countUpcomingServices(): Promise<number> {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM pump_out_request 
      WHERE status IN ('Requested', 'Scheduled') 
      AND "created_at" <= ${endOfWeek}
    `);
    
    return Number(result.rows[0]?.count) || 0;
  }

  async calculateAverageRevenuePerUser(): Promise<number> {
    const result = await db.execute(sql`
      SELECT AVG(sl.price) as avg_revenue
      FROM users u
      JOIN service_level sl ON u."service_level_id" = sl.id
      WHERE u."service_level_id" IS NOT NULL
    `);
    
    return Number(result.rows[0]?.avg_revenue) || 0;
  }

  // Clover Configuration Methods
  async getCloverConfig(): Promise<CloverConfig | undefined> {
    const configs = await db.select().from(schema.cloverConfig)
      .where(eq(schema.cloverConfig.isActive, true))
      .orderBy(desc(schema.cloverConfig.createdAt))
      .limit(1);
    
    return configs[0];
  }

  async createCloverConfig(configData: InsertCloverConfig): Promise<CloverConfig> {
    // Deactivate existing configs first
    await db.update(schema.cloverConfig)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.cloverConfig.isActive, true));

    const [config] = await db.insert(schema.cloverConfig)
      .values({ ...configData, updatedAt: new Date() })
      .returning();
    
    return config;
  }

  async updateCloverConfig(id: number, configData: Partial<CloverConfig>): Promise<CloverConfig | undefined> {
    const [updated] = await db.update(schema.cloverConfig)
      .set({ ...configData, updatedAt: new Date() })
      .where(eq(schema.cloverConfig.id, id))
      .returning();
    
    return updated;
  }

  async deleteCloverConfig(id: number): Promise<boolean> {
    const result = await db.update(schema.cloverConfig)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.cloverConfig.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  // Payment Transaction Methods
  async getPaymentTransaction(id: number): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db.select().from(schema.paymentTransaction)
      .where(eq(schema.paymentTransaction.id, id));
    
    return transaction;
  }

  async getPaymentTransactionByCloverPaymentId(cloverPaymentId: string): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db.select().from(schema.paymentTransaction)
      .where(eq(schema.paymentTransaction.cloverPaymentId, cloverPaymentId));
    
    return transaction;
  }

  async getPaymentTransactionsByUserId(userId: number): Promise<PaymentTransaction[]> {
    return await db.select().from(schema.paymentTransaction)
      .where(eq(schema.paymentTransaction.userId, userId))
      .orderBy(desc(schema.paymentTransaction.createdAt));
  }

  async getPaymentTransactionsByRequestId(requestId: number): Promise<PaymentTransaction[]> {
    return await db.select().from(schema.paymentTransaction)
      .where(eq(schema.paymentTransaction.requestId, requestId))
      .orderBy(desc(schema.paymentTransaction.createdAt));
  }

  async createPaymentTransaction(transactionData: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [transaction] = await db.insert(schema.paymentTransaction)
      .values({ ...transactionData, updatedAt: new Date() })
      .returning();
    
    return transaction;
  }

  async updatePaymentTransaction(id: number, transactionData: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined> {
    const [updated] = await db.update(schema.paymentTransaction)
      .set({ ...transactionData, updatedAt: new Date() })
      .where(eq(schema.paymentTransaction.id, id))
      .returning();
    
    return updated;
  }

  async updatePaymentTransactionStatus(cloverPaymentId: string, status: string, errorMessage?: string): Promise<PaymentTransaction | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    const [updated] = await db.update(schema.paymentTransaction)
      .set(updateData)
      .where(eq(schema.paymentTransaction.cloverPaymentId, cloverPaymentId))
      .returning();
    
    return updated;
  }

  async getAllPaymentTransactions(): Promise<PaymentTransaction[]> {
    return await db.select().from(schema.paymentTransaction)
      .orderBy(desc(schema.paymentTransaction.createdAt));
  }

  async getPaymentTransactionsByStatus(status: string): Promise<PaymentTransaction[]> {
    return await db.select().from(schema.paymentTransaction)
      .where(eq(schema.paymentTransaction.status, status))
      .orderBy(desc(schema.paymentTransaction.createdAt));
  }

  // Notification preferences operations
  async createNotificationPreferences(preferencesData: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const [preferences] = await db.insert(schema.notificationPreferences)
      .values({ ...preferencesData, updatedAt: new Date() })
      .returning();
    
    return preferences;
  }

  async getNotificationPreferences(userId: number): Promise<NotificationPreferences | undefined> {
    const [preferences] = await db.select().from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, userId))
      .limit(1);
    
    return preferences;
  }

  async updateNotificationPreferences(userId: number, preferencesData: Partial<NotificationPreferences>): Promise<NotificationPreferences | undefined> {
    const [updated] = await db.update(schema.notificationPreferences)
      .set({ ...preferencesData, updatedAt: new Date() })
      .where(eq(schema.notificationPreferences.userId, userId))
      .returning();
    
    return updated;
  }

  async getOrCreateNotificationPreferences(userId: number): Promise<NotificationPreferences> {
    const existing = await this.getNotificationPreferences(userId);
    if (existing) {
      return existing;
    }
    
    return await this.createNotificationPreferences({ userId });
  }

  // Email notification log operations
  async createEmailNotificationLog(logData: InsertEmailNotificationLog): Promise<EmailNotificationLog> {
    const [log] = await db.insert(schema.emailNotificationLog)
      .values(logData)
      .returning();
    
    return log;
  }

  async getEmailNotificationLogs(userId?: number, limit: number = 50): Promise<EmailNotificationLog[]> {
    let query = db.select().from(schema.emailNotificationLog);
    
    if (userId) {
      return await db.select().from(schema.emailNotificationLog)
        .where(eq(schema.emailNotificationLog.userId, userId))
        .orderBy(desc(schema.emailNotificationLog.sentAt))
        .limit(limit);
    }
    
    return await db.select().from(schema.emailNotificationLog)
      .orderBy(desc(schema.emailNotificationLog.sentAt))
      .limit(limit);
  }

  async getEmailNotificationLogsByType(emailType: string, limit: number = 50): Promise<EmailNotificationLog[]> {
    return await db.select().from(schema.emailNotificationLog)
      .where(eq(schema.emailNotificationLog.emailType, emailType))
      .orderBy(desc(schema.emailNotificationLog.sentAt))
      .limit(limit);
  }

  async updateEmailNotificationLog(id: number, logData: Partial<EmailNotificationLog>): Promise<EmailNotificationLog | undefined> {
    const [updated] = await db.update(schema.emailNotificationLog)
      .set(logData)
      .where(eq(schema.emailNotificationLog.id, id))
      .returning();
    
    return updated;
  }
}