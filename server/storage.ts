import {
  users,
  serviceLevel,
  marina,
  type User,
  type InsertUser,
  type ServiceLevel,
  type InsertServiceLevel,
  type Marina,
  type InsertMarina
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: Partial<User>): Promise<User>;
  
  // Service Level operations
  getServiceLevel(id: number): Promise<ServiceLevel | undefined>;
  getAllServiceLevels(): Promise<ServiceLevel[]>;
  createServiceLevel(serviceLevel: Partial<ServiceLevel>): Promise<ServiceLevel>;
  updateServiceLevel(id: number, serviceLevel: Partial<ServiceLevel>): Promise<ServiceLevel | undefined>;
  
  // Marina operations
  getMarina(id: number): Promise<Marina | undefined>;
  getAllMarinas(activeOnly?: boolean): Promise<Marina[]>;
  createMarina(marinaData: Partial<Marina>): Promise<Marina>;
  
  // Other operations
}

// Database Storage uses drizzle ORM 
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: Partial<User>): Promise<User> {
    // Check if user exists
    let existingUser;
    if (userData.id) {
      [existingUser] = await db.select().from(users).where(eq(users.id, userData.id));
    }
    
    if (existingUser) {
      // Update existing user - create a clean object with only the data that's in the schema
      const updateData: Partial<User> = {};
      
      // Only copy valid fields
      if (userData.email) updateData.email = userData.email;
      if (userData.firstName) updateData.firstName = userData.firstName;
      if (userData.lastName) updateData.lastName = userData.lastName;
      if (userData.phone) updateData.phone = userData.phone;
      if (userData.role) updateData.role = userData.role;
      
      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userData.id!))
        .returning();
      return user;
    } else {
      // Create a valid insert data object
      const insertData: any = {
        firstName: userData.firstName || 'User',
        lastName: userData.lastName || 'Name',
        email: userData.email || `user${Date.now()}@example.com`,
        role: userData.role || 'member'
      };
      
      const [user] = await db
        .insert(users)
        .values(insertData)
        .returning();
      return user;
    }
  }

  // Service Level operations
  async getServiceLevel(id: number): Promise<ServiceLevel | undefined> {
    const [level] = await db.select().from(serviceLevel).where(eq(serviceLevel.id, id));
    return level;
  }
  
  async getAllServiceLevels(): Promise<ServiceLevel[]> {
    return db.select().from(serviceLevel).where(eq(serviceLevel.isActive, true));
  }
  
  async createServiceLevel(serviceLevelData: Partial<ServiceLevel>): Promise<ServiceLevel> {
    const [level] = await db
      .insert(serviceLevel)
      .values(serviceLevelData as any)
      .returning();
    return level;
  }

  // Marina operations
  async getMarina(id: number): Promise<Marina | undefined> {
    const [marinaResult] = await db.select().from(marina).where(eq(marina.id, id));
    return marinaResult;
  }
  
  async getAllMarinas(activeOnly = true): Promise<Marina[]> {
    if (activeOnly) {
      return db.select().from(marina).where(eq(marina.isActive, true));
    }
    return db.select().from(marina);
  }
  
  async createMarina(marinaData: Partial<Marina>): Promise<Marina> {
    const [marinaResult] = await db
      .insert(marina)
      .values(marinaData as any)
      .returning();
    return marinaResult;
  }

  // Other operations
}

// In-memory storage for development/fallback
export class MemStorage implements IStorage {
  private usersData: Map<string, User>;
  private serviceLevelData: Map<number, ServiceLevel>;
  private marinaData: Map<number, Marina>;
  private nextUserId: number = 1;
  private nextServiceLevelId: number = 1;
  private nextMarinaId: number = 1;
  
  constructor() {
    this.usersData = new Map();
    this.serviceLevelData = new Map();
    this.marinaData = new Map();
    
    // Add some default service levels
    this.createServiceLevel({
      name: "Single Service",
      price: 3500, // $35.00
      description: "One-time pump-out service for your boat",
      headCount: 1,
      type: "one-time",
      isActive: true
    });
    
    this.createServiceLevel({
      name: "Monthly Unlimited",
      price: 8900, // $89.00
      description: "Unlimited pump-outs for one month",
      headCount: 1,
      type: "monthly",
      monthlyQuota: 6,
      isActive: true
    });
    
    this.createServiceLevel({
      name: "Seasonal Package",
      price: 39900, // $399.00
      description: "Seasonal unlimited pump-outs (May-October)",
      headCount: 1,
      type: "seasonal",
      seasonStart: "05-01", // May 1
      seasonEnd: "10-31", // October 31
      monthlyQuota: 8,
      isActive: true
    });
    
    // Add a default marina
    this.createMarina({
      name: "Sailfish Marina",
      address: "123 Harbor Way",
      phone: "555-123-4567",
      isActive: true
    });
  }
  
  async getUser(id: number | string): Promise<User | undefined> {
    // Convert id to string to ensure compatibility with different types of IDs
    const idStr = String(id);
    return this.usersData.get(idStr);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Find the user with the matching email
    for (const user of this.usersData.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }
  
  async upsertUser(userData: Partial<User>): Promise<User> {
    // Convert id to string
    const idStr = userData.id ? String(userData.id) : String(this.nextUserId++);
    
    // If id exists, update the user
    if (userData.id && this.usersData.has(idStr)) {
      const existingUser = this.usersData.get(idStr)!;
      const updatedUser = {
        ...existingUser,
        ...userData,
        updatedAt: new Date()
      } as User;
      this.usersData.set(idStr, updatedUser);
      return updatedUser;
    }
    
    // Create new user
    const user = {
      ...userData,
      id: idStr,
      firstName: userData.firstName || 'User',
      lastName: userData.lastName || String(idStr),
      email: userData.email || `user${idStr}@example.com`,
      role: userData.role || 'member',
      createdAt: new Date(),
      updatedAt: new Date()
    } as User;
    
    this.usersData.set(idStr, user);
    return user;
  }
  
  // Service Level operations
  async getServiceLevel(id: number): Promise<ServiceLevel | undefined> {
    return this.serviceLevelData.get(id);
  }
  
  async getAllServiceLevels(): Promise<ServiceLevel[]> {
    return Array.from(this.serviceLevelData.values())
      .filter(level => level.isActive);
  }
  
  async createServiceLevel(serviceLevelData: Partial<ServiceLevel>): Promise<ServiceLevel> {
    const id = serviceLevelData.id || this.nextServiceLevelId++;
    const level = {
      ...serviceLevelData,
      id,
      isActive: serviceLevelData.isActive ?? true,
      createdAt: new Date()
    } as ServiceLevel;
    
    this.serviceLevelData.set(id, level);
    return level;
  }
  
  async updateServiceLevel(id: number, serviceLevelData: Partial<ServiceLevel>): Promise<ServiceLevel | undefined> {
    const existingLevel = this.serviceLevelData.get(id);
    
    if (!existingLevel) {
      return undefined;
    }
    
    const updatedLevel = {
      ...existingLevel,
      ...serviceLevelData,
      updatedAt: new Date()
    } as ServiceLevel;
    
    this.serviceLevelData.set(id, updatedLevel);
    return updatedLevel;
  }
  
  // Marina operations
  async getMarina(id: number): Promise<Marina | undefined> {
    return this.marinaData.get(id);
  }
  
  async getAllMarinas(activeOnly = true): Promise<Marina[]> {
    let marinas = Array.from(this.marinaData.values());
    
    if (activeOnly) {
      marinas = marinas.filter(marina => marina.isActive);
    }
    
    return marinas;
  }
  
  async createMarina(marinaData: Partial<Marina>): Promise<Marina> {
    const id = marinaData.id || this.nextMarinaId++;
    const marina = {
      ...marinaData,
      id,
      isActive: marinaData.isActive ?? true,
      createdAt: new Date()
    } as Marina;
    
    this.marinaData.set(id, marina);
    return marina;
  }
  
  // Other operations
}

// For now, we'll use memory storage but we can switch to database
// storage when the database is working properly.
export const storage = new MemStorage();