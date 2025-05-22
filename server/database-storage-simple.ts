import { db } from './simple-db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
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
import { Pool } from 'pg';

// Create a session store with the DB connection
const PostgresSessionStore = connectPg(session);
const sessionPool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false // For development - handles self-signed certificates
  }
});

// Generate a SESSION_SECRET if it doesn't exist
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'poopalazi-session-secret-' + Math.random().toString(36).substring(2);
  console.log("Generated a temporary SESSION_SECRET - this should be set as an environment variable in production");
}

// Simplified Database Storage implementation
export class SimpleDatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize session store
    this.sessionStore = new PostgresSessionStore({
      pool: sessionPool,
      tableName: 'sessions',
      createTableIfMissing: true,
      pruneSessionInterval: 60 // Clean up expired sessions every minute
    });
    
    console.log("Session store initialized successfully");
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Use direct SQL query to match our database schema
      const result = await sessionPool.query(
        `SELECT * FROM users WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Convert snake_case column names to camelCase for our app
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        passwordHash: user.password_hash,
        role: user.role,
        serviceLevelId: user.service_level_id,
        createdAt: user.created_at
      } as User;
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Make email case-insensitive by converting to lowercase
      const normalizedEmail = email.toLowerCase();
      
      // Use a simpler direct SQL query instead of the ORM query to avoid schema mismatches
      const result = await sessionPool.query(
        `SELECT * FROM users WHERE LOWER(email) = $1`,
        [normalizedEmail]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Convert snake_case column names to camelCase for our app
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        passwordHash: user.password_hash,
        role: user.role,
        serviceLevelId: user.service_level_id,
        createdAt: user.created_at
      } as User;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser, passwordHash: string): Promise<User> {
    try {
      // Use direct SQL query with the correct column names for our database schema
      const result = await sessionPool.query(
        `INSERT INTO users (
          email, first_name, last_name, phone, password_hash, role
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          user.email,
          user.firstName,
          user.lastName,
          user.phone || null,
          passwordHash,
          user.role || 'member'
        ]
      );
      
      // Convert the result to match our app's schema
      const newUser = result.rows[0];
      return {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        phone: newUser.phone,
        passwordHash: newUser.password_hash,
        role: newUser.role,
        serviceLevelId: newUser.service_level_id,
        createdAt: newUser.created_at
      } as User;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw new Error("Failed to create user");
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(schema.users)
        .set(userData)
        .where(eq(schema.users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateUser:", error);
      return undefined;
    }
  }

  // Placeholder implementations for required methods
  // These would be properly implemented when we fully migrate to database storage
  
  // Boat Owner operations
  async getBoatOwner(id: number): Promise<BoatOwner | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async getBoatOwnerByUserId(userId: number): Promise<BoatOwner | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async createBoatOwner(boatOwner: InsertBoatOwner): Promise<BoatOwner> {
    // Placeholder implementation
    throw new Error("Not implemented");
  }
  
  // Boat operations
  async getBoat(id: number): Promise<Boat | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async getBoatsByOwnerId(ownerId: number): Promise<Boat[]> {
    // Placeholder implementation
    return [];
  }

  async createBoat(boat: InsertBoat): Promise<Boat> {
    // Placeholder implementation
    throw new Error("Not implemented");
  }

  async updateBoat(id: number, boatData: Partial<Boat>): Promise<Boat | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async deleteBoat(id: number): Promise<boolean> {
    // Placeholder implementation
    return false;
  }
  
  // Marina operations
  async getMarina(id: number): Promise<Marina | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async getAllMarinas(activeOnly = true): Promise<Marina[]> {
    // Placeholder implementation
    return [];
  }

  async createMarina(marina: InsertMarina): Promise<Marina> {
    // Placeholder implementation
    throw new Error("Not implemented");
  }

  async updateMarina(id: number, marinaData: Partial<Marina>): Promise<Marina | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async deleteMarina(id: number): Promise<boolean> {
    // Placeholder implementation
    return false;
  }
  
  // Slip Assignment operations
  async getSlipAssignment(id: number): Promise<SlipAssignment | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async getSlipAssignmentByBoatId(boatId: number): Promise<SlipAssignment | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async createSlipAssignment(slipAssignment: InsertSlipAssignment): Promise<SlipAssignment> {
    // Placeholder implementation
    throw new Error("Not implemented");
  }

  async updateSlipAssignment(id: number, slipData: Partial<SlipAssignment>): Promise<SlipAssignment | undefined> {
    // Placeholder implementation
    return undefined;
  }
  
  // Service Level operations
  async getServiceLevel(id: number): Promise<ServiceLevel | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async getAllServiceLevels(): Promise<ServiceLevel[]> {
    // Placeholder implementation
    return [];
  }

  async createServiceLevel(serviceLevel: InsertServiceLevel): Promise<ServiceLevel> {
    // Placeholder implementation
    throw new Error("Not implemented");
  }

  async updateServiceLevel(id: number, serviceLevelData: Partial<ServiceLevel>): Promise<ServiceLevel | undefined> {
    // Placeholder implementation
    return undefined;
  }
  
  // Pump Out Request operations
  async getPumpOutRequest(id: number): Promise<PumpOutRequest | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async getPumpOutRequestsByBoatId(boatId: number): Promise<PumpOutRequest[]> {
    // Placeholder implementation
    return [];
  }

  async getPumpOutRequestsByWeek(weekStartDate: Date): Promise<PumpOutRequest[]> {
    // Placeholder implementation
    return [];
  }

  async getPumpOutRequestsByStatus(status: string): Promise<PumpOutRequest[]> {
    // Placeholder implementation
    return [];
  }

  async createPumpOutRequest(request: InsertPumpOutRequest): Promise<PumpOutRequest> {
    // Placeholder implementation
    throw new Error("Not implemented");
  }

  async updatePumpOutRequest(id: number, requestData: Partial<PumpOutRequest>): Promise<PumpOutRequest | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async updatePumpOutRequestStatus(id: number, status: string): Promise<PumpOutRequest | undefined> {
    // Placeholder implementation
    return undefined;
  }
  
  // Pump Out Log operations
  async getPumpOutLog(id: number): Promise<PumpOutLog | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async getPumpOutLogsByRequestId(requestId: number): Promise<PumpOutLog[]> {
    // Placeholder implementation
    return [];
  }

  async createPumpOutLog(log: InsertPumpOutLog): Promise<PumpOutLog> {
    // Placeholder implementation
    throw new Error("Not implemented");
  }
  
  // Employee Assignment operations
  async getEmployeeAssignment(id: number): Promise<EmployeeAssignment | undefined> {
    // Placeholder implementation
    return undefined;
  }

  async getEmployeeAssignmentsByEmployeeId(employeeId: number): Promise<EmployeeAssignment[]> {
    // Placeholder implementation
    return [];
  }

  async getEmployeeAssignmentsByRequestId(requestId: number): Promise<EmployeeAssignment[]> {
    // Placeholder implementation
    return [];
  }

  async createEmployeeAssignment(assignment: InsertEmployeeAssignment): Promise<EmployeeAssignment> {
    // Placeholder implementation
    throw new Error("Not implemented");
  }

  async deleteEmployeeAssignment(id: number): Promise<boolean> {
    // Placeholder implementation
    return false;
  }
  
  // Analytics operations
  async countActiveUsersByServiceLevel(): Promise<{ serviceLevelId: number, count: number }[]> {
    // Placeholder implementation
    return [];
  }

  async countCompletedServicesThisWeek(): Promise<number> {
    // Placeholder implementation
    return 0;
  }

  async countUpcomingServices(): Promise<number> {
    // Placeholder implementation
    return 0;
  }

  async calculateAverageRevenuePerUser(): Promise<number> {
    // Placeholder implementation
    return 0;
  }
}