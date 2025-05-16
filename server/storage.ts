import {
  users,
  type User,
  type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  upsertUser(user: Partial<User>): Promise<User>;
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

  // Other operations
}

// In-memory storage for development/fallback
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private nextId: number = 1;
  
  constructor() {
    this.usersData = new Map();
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }
  
  async upsertUser(userData: Partial<User>): Promise<User> {
    // If id exists, update the user
    if (userData.id && this.usersData.has(userData.id)) {
      const existingUser = this.usersData.get(userData.id)!;
      const updatedUser = {
        ...existingUser,
        ...userData,
      } as User;
      this.usersData.set(userData.id, updatedUser);
      return updatedUser;
    }
    
    // Create new user
    const id = userData.id || this.nextId++;
    const user = {
      ...userData,
      id,
      firstName: userData.firstName || 'User',
      lastName: userData.lastName || String(id),
      email: userData.email || `user${id}@example.com`,
      role: userData.role || 'member'
    } as User;
    
    this.usersData.set(id, user);
    return user;
  }
  
  // Other operations
}

// For now, we'll use memory storage but we can switch to database
// storage when the database is working properly.
export const storage = new MemStorage();