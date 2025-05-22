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
import { pool } from './simple-db'; // Use the same pool instance for all database operations

// Create a session store with the DB connection
const PostgresSessionStore = connectPg(session);

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
      pool: pool,
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
      const result = await pool.query(
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
      const result = await pool.query(
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
      const result = await pool.query(
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
    try {
      const result = await pool.query(
        `SELECT * FROM boat_owner WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const owner = result.rows[0];
      return {
        id: owner.id,
        userId: owner.user_id,
        createdAt: owner.created_at
      } as BoatOwner;
    } catch (error) {
      console.error("Error in getBoatOwner:", error);
      return undefined;
    }
  }

  async getBoatOwnerByUserId(userId: number): Promise<BoatOwner | undefined> {
    try {
      const result = await pool.query(
        `SELECT * FROM boat_owner WHERE user_id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        // If no boat owner record exists, create one
        const ownerResult = await this.createBoatOwner({ userId });
        return ownerResult;
      }
      
      const owner = result.rows[0];
      return {
        id: owner.id,
        userId: owner.user_id,
        createdAt: owner.created_at
      } as BoatOwner;
    } catch (error) {
      console.error("Error in getBoatOwnerByUserId:", error);
      return undefined;
    }
  }

  async createBoatOwner(boatOwner: InsertBoatOwner): Promise<BoatOwner> {
    try {
      const result = await pool.query(
        `INSERT INTO boat_owner (user_id) VALUES ($1) RETURNING *`,
        [boatOwner.userId]
      );
      
      const owner = result.rows[0];
      return {
        id: owner.id,
        userId: owner.user_id,
        createdAt: owner.created_at
      } as BoatOwner;
    } catch (error) {
      console.error("Error in createBoatOwner:", error);
      throw new Error("Failed to create boat owner");
    }
  }

  // Boat operations
  async getBoat(id: number): Promise<Boat | undefined> {
    try {
      const result = await pool.query(
        `SELECT * FROM boat WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const boat = result.rows[0];
      return {
        id: boat.id,
        ownerId: boat.owner_id,
        name: boat.name,
        year: boat.year,
        make: boat.make,
        model: boat.model,
        length: boat.length,
        color: boat.color,
        photoUrl: boat.photo_url,
        dockingDirection: boat.docking_direction,
        tieUpSide: boat.tie_up_side,
        pumpPortLocations: boat.pump_port_locations,
        dock: boat.dock,
        slip: boat.slip,
        notes: boat.notes,
        createdAt: boat.created_at
      } as Boat;
    } catch (error) {
      console.error("Error in getBoat:", error);
      return undefined;
    }
  }

  async getBoatsByOwnerId(ownerId: number): Promise<Boat[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM boat WHERE owner_id = $1 ORDER BY name ASC`,
        [ownerId]
      );
      
      return result.rows.map(boat => ({
        id: boat.id,
        ownerId: boat.owner_id,
        name: boat.name,
        year: boat.year,
        make: boat.make,
        model: boat.model,
        length: boat.length,
        color: boat.color,
        photoUrl: boat.photo_url,
        dockingDirection: boat.docking_direction,
        tieUpSide: boat.tie_up_side,
        pumpPortLocations: boat.pump_port_locations,
        dock: boat.dock,
        slip: boat.slip,
        notes: boat.notes,
        createdAt: boat.created_at
      } as Boat));
    } catch (error) {
      console.error("Error in getBoatsByOwnerId:", error);
      return [];
    }
  }

  async createBoat(boat: InsertBoat): Promise<Boat> {
    try {
      const result = await pool.query(
        `INSERT INTO boat (
          owner_id, name, year, make, model, length, 
          color, photo_url, docking_direction, tie_up_side, 
          pump_port_locations, dock, slip, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING *`,
        [
          boat.ownerId,
          boat.name,
          boat.year || null,
          boat.make || null,
          boat.model || null,
          boat.length || null,
          boat.color || null,
          boat.photoUrl || null,
          boat.dockingDirection || null,
          boat.tieUpSide || null,
          boat.pumpPortLocations || null,
          boat.dock || null,
          boat.slip || null,
          boat.notes || null
        ]
      );
      
      const newBoat = result.rows[0];
      return {
        id: newBoat.id,
        ownerId: newBoat.owner_id,
        name: newBoat.name,
        year: newBoat.year,
        make: newBoat.make,
        model: newBoat.model,
        length: newBoat.length,
        color: newBoat.color,
        photoUrl: newBoat.photo_url,
        dockingDirection: newBoat.docking_direction,
        tieUpSide: newBoat.tie_up_side,
        pumpPortLocations: newBoat.pump_port_locations,
        dock: newBoat.dock,
        slip: newBoat.slip,
        notes: newBoat.notes,
        createdAt: newBoat.created_at
      } as Boat;
    } catch (error) {
      console.error("Error in createBoat:", error);
      throw new Error("Failed to create boat");
    }
  }

  async updateBoat(id: number, boatData: Partial<Boat>): Promise<Boat | undefined> {
    try {
      // Build the SET part of the query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      if (boatData.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(boatData.name);
      }
      
      if (boatData.year !== undefined) {
        updates.push(`year = $${paramCount++}`);
        values.push(boatData.year);
      }
      
      if (boatData.make !== undefined) {
        updates.push(`make = $${paramCount++}`);
        values.push(boatData.make);
      }
      
      if (boatData.model !== undefined) {
        updates.push(`model = $${paramCount++}`);
        values.push(boatData.model);
      }
      
      if (boatData.length !== undefined) {
        updates.push(`length = $${paramCount++}`);
        values.push(boatData.length);
      }
      
      if (boatData.color !== undefined) {
        updates.push(`color = $${paramCount++}`);
        values.push(boatData.color);
      }
      
      if (boatData.photoUrl !== undefined) {
        updates.push(`photo_url = $${paramCount++}`);
        values.push(boatData.photoUrl);
      }
      
      if (boatData.dockingDirection !== undefined) {
        updates.push(`docking_direction = $${paramCount++}`);
        values.push(boatData.dockingDirection);
      }
      
      if (boatData.tieUpSide !== undefined) {
        updates.push(`tie_up_side = $${paramCount++}`);
        values.push(boatData.tieUpSide);
      }
      
      if (boatData.pumpPortLocations !== undefined) {
        updates.push(`pump_port_locations = $${paramCount++}`);
        values.push(boatData.pumpPortLocations);
      }
      
      if (boatData.dock !== undefined) {
        updates.push(`dock = $${paramCount++}`);
        values.push(boatData.dock);
      }
      
      if (boatData.slip !== undefined) {
        updates.push(`slip = $${paramCount++}`);
        values.push(boatData.slip);
      }
      
      if (boatData.notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(boatData.notes);
      }
      
      if (updates.length === 0) {
        // No fields to update
        return this.getBoat(id);
      }
      
      // Add the ID as the last parameter
      values.push(id);
      
      const result = await pool.query(
        `UPDATE boat 
         SET ${updates.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const boat = result.rows[0];
      return {
        id: boat.id,
        ownerId: boat.owner_id,
        name: boat.name,
        year: boat.year,
        make: boat.make,
        model: boat.model,
        length: boat.length,
        color: boat.color,
        photoUrl: boat.photo_url,
        dockingDirection: boat.docking_direction,
        tieUpSide: boat.tie_up_side,
        pumpPortLocations: boat.pump_port_locations,
        dock: boat.dock,
        slip: boat.slip,
        notes: boat.notes,
        createdAt: boat.created_at
      } as Boat;
    } catch (error) {
      console.error("Error in updateBoat:", error);
      return undefined;
    }
  }

  async deleteBoat(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `DELETE FROM boat WHERE id = $1 RETURNING id`,
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error in deleteBoat:", error);
      return false;
    }
  }

  // Marina operations
  async getMarina(id: number): Promise<Marina | undefined> {
    try {
      const result = await pool.query(
        `SELECT * FROM marina WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const marina = result.rows[0];
      return {
        id: marina.id,
        name: marina.name,
        address: marina.address,
        phone: marina.phone,
        isActive: marina.is_active,
        createdAt: marina.created_at
      } as Marina;
    } catch (error) {
      console.error("Error in getMarina:", error);
      return undefined;
    }
  }

  async getAllMarinas(activeOnly = true): Promise<Marina[]> {
    try {
      let query = `SELECT * FROM marina`;
      const params: any[] = [];
      
      if (activeOnly) {
        query += ` WHERE is_active = $1`;
        params.push(true);
      }
      
      const result = await pool.query(query, params);
      
      return result.rows.map(marina => ({
        id: marina.id,
        name: marina.name,
        address: marina.address,
        phone: marina.phone,
        isActive: marina.is_active,
        createdAt: marina.created_at
      } as Marina));
    } catch (error) {
      console.error("Error in getAllMarinas:", error);
      return [];
    }
  }

  async createMarina(marina: InsertMarina): Promise<Marina> {
    try {
      const result = await pool.query(
        `INSERT INTO marina (name, address, phone, is_active) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          marina.name,
          marina.address || null,
          marina.phone || null,
          marina.isActive !== undefined ? marina.isActive : true
        ]
      );
      
      const newMarina = result.rows[0];
      return {
        id: newMarina.id,
        name: newMarina.name,
        address: newMarina.address,
        phone: newMarina.phone,
        isActive: newMarina.is_active,
        createdAt: newMarina.created_at
      } as Marina;
    } catch (error) {
      console.error("Error in createMarina:", error);
      throw new Error("Failed to create marina");
    }
  }

  async updateMarina(id: number, marinaData: Partial<Marina>): Promise<Marina | undefined> {
    try {
      // Build the SET part of the query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      if (marinaData.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(marinaData.name);
      }
      
      if (marinaData.address !== undefined) {
        updates.push(`address = $${paramCount++}`);
        values.push(marinaData.address);
      }
      
      if (marinaData.phone !== undefined) {
        updates.push(`phone = $${paramCount++}`);
        values.push(marinaData.phone);
      }
      
      if (marinaData.isActive !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(marinaData.isActive);
      }
      
      if (updates.length === 0) {
        // No fields to update
        return this.getMarina(id);
      }
      
      // Add the ID as the last parameter
      values.push(id);
      
      const result = await pool.query(
        `UPDATE marina 
         SET ${updates.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const marina = result.rows[0];
      return {
        id: marina.id,
        name: marina.name,
        address: marina.address,
        phone: marina.phone,
        isActive: marina.is_active,
        createdAt: marina.created_at
      } as Marina;
    } catch (error) {
      console.error("Error in updateMarina:", error);
      return undefined;
    }
  }

  async deleteMarina(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `DELETE FROM marina WHERE id = $1 RETURNING id`,
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error in deleteMarina:", error);
      return false;
    }
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
    try {
      const result = await pool.query(
        `SELECT * FROM service_level WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const sl = result.rows[0];
      return {
        id: sl.id,
        name: sl.name,
        price: sl.price,
        description: sl.description,
        headCount: sl.head_count,
        type: sl.type,
        seasonStart: sl.season_start,
        seasonEnd: sl.season_end,
        monthlyQuota: sl.monthly_quota,
        onDemandQuota: sl.on_demand_quota,
        isActive: sl.is_active,
        createdAt: sl.created_at
      } as ServiceLevel;
    } catch (error) {
      console.error("Error in getServiceLevel:", error);
      return undefined;
    }
  }

  async getAllServiceLevels(): Promise<ServiceLevel[]> {
    try {
      const result = await pool.query(`SELECT * FROM service_level ORDER BY price ASC`);
      
      return result.rows.map(sl => ({
        id: sl.id,
        name: sl.name,
        price: sl.price,
        description: sl.description,
        headCount: sl.head_count,
        type: sl.type,
        seasonStart: sl.season_start,
        seasonEnd: sl.season_end,
        monthlyQuota: sl.monthly_quota,
        onDemandQuota: sl.on_demand_quota,
        isActive: sl.is_active,
        createdAt: sl.created_at
      } as ServiceLevel));
    } catch (error) {
      console.error("Error in getAllServiceLevels:", error);
      return [];
    }
  }

  async createServiceLevel(serviceLevel: InsertServiceLevel): Promise<ServiceLevel> {
    try {
      const result = await pool.query(
        `INSERT INTO service_level (
          name, price, description, head_count, type, 
          season_start, season_end, monthly_quota, on_demand_quota, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [
          serviceLevel.name,
          serviceLevel.price,
          serviceLevel.description || null,
          serviceLevel.headCount || null,
          serviceLevel.type,
          serviceLevel.seasonStart || null,
          serviceLevel.seasonEnd || null,
          serviceLevel.monthlyQuota || null,
          serviceLevel.onDemandQuota || null,
          serviceLevel.isActive !== undefined ? serviceLevel.isActive : true
        ]
      );
      
      const sl = result.rows[0];
      return {
        id: sl.id,
        name: sl.name,
        price: sl.price,
        description: sl.description,
        headCount: sl.head_count,
        type: sl.type,
        seasonStart: sl.season_start,
        seasonEnd: sl.season_end,
        monthlyQuota: sl.monthly_quota,
        onDemandQuota: sl.on_demand_quota,
        isActive: sl.is_active,
        createdAt: sl.created_at
      } as ServiceLevel;
    } catch (error) {
      console.error("Error in createServiceLevel:", error);
      throw new Error("Failed to create service level");
    }
  }

  async updateServiceLevel(id: number, serviceLevelData: Partial<ServiceLevel>): Promise<ServiceLevel | undefined> {
    try {
      // Build the SET part of the query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      if (serviceLevelData.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(serviceLevelData.name);
      }
      
      if (serviceLevelData.price !== undefined) {
        updates.push(`price = $${paramCount++}`);
        values.push(serviceLevelData.price);
      }
      
      if (serviceLevelData.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(serviceLevelData.description);
      }
      
      if (serviceLevelData.headCount !== undefined) {
        updates.push(`head_count = $${paramCount++}`);
        values.push(serviceLevelData.headCount);
      }
      
      if (serviceLevelData.type !== undefined) {
        updates.push(`type = $${paramCount++}`);
        values.push(serviceLevelData.type);
      }
      
      if (serviceLevelData.seasonStart !== undefined) {
        updates.push(`season_start = $${paramCount++}`);
        values.push(serviceLevelData.seasonStart);
      }
      
      if (serviceLevelData.seasonEnd !== undefined) {
        updates.push(`season_end = $${paramCount++}`);
        values.push(serviceLevelData.seasonEnd);
      }
      
      if (serviceLevelData.monthlyQuota !== undefined) {
        updates.push(`monthly_quota = $${paramCount++}`);
        values.push(serviceLevelData.monthlyQuota);
      }
      
      if (serviceLevelData.onDemandQuota !== undefined) {
        updates.push(`on_demand_quota = $${paramCount++}`);
        values.push(serviceLevelData.onDemandQuota);
      }
      
      if (serviceLevelData.isActive !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(serviceLevelData.isActive);
      }
      
      if (updates.length === 0) {
        // No fields to update
        return this.getServiceLevel(id);
      }
      
      // Add the ID as the last parameter
      values.push(id);
      
      const result = await pool.query(
        `UPDATE service_level 
         SET ${updates.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const sl = result.rows[0];
      return {
        id: sl.id,
        name: sl.name,
        price: sl.price,
        description: sl.description,
        headCount: sl.head_count,
        type: sl.type,
        seasonStart: sl.season_start,
        seasonEnd: sl.season_end,
        monthlyQuota: sl.monthly_quota,
        onDemandQuota: sl.on_demand_quota,
        isActive: sl.is_active,
        createdAt: sl.created_at
      } as ServiceLevel;
    } catch (error) {
      console.error("Error in updateServiceLevel:", error);
      return undefined;
    }
  }

  // Pump Out Request operations
  async getPumpOutRequest(id: number): Promise<PumpOutRequest | undefined> {
    try {
      const result = await pool.query(
        `SELECT * FROM pump_out_request WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        boatId: row.boat_id,
        weekStartDate: row.week_start_date,
        status: row.status,
        ownerNotes: row.owner_notes,
        adminNotes: row.admin_notes,
        paymentStatus: row.payment_status,
        paymentId: row.payment_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as PumpOutRequest;
    } catch (error) {
      console.error("Error in getPumpOutRequest:", error);
      return undefined;
    }
  }

  async getPumpOutRequestsByBoatId(boatId: number): Promise<PumpOutRequest[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM pump_out_request 
         WHERE boat_id = $1 
         ORDER BY created_at DESC`,
        [boatId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        boatId: row.boat_id,
        weekStartDate: row.week_start_date,
        status: row.status,
        ownerNotes: row.owner_notes,
        adminNotes: row.admin_notes,
        paymentStatus: row.payment_status,
        paymentId: row.payment_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as PumpOutRequest));
    } catch (error) {
      console.error("Error in getPumpOutRequestsByBoatId:", error);
      return [];
    }
  }

  async getPumpOutRequestsByWeek(weekStartDate: Date): Promise<PumpOutRequest[]> {
    try {
      // Format the date for the database query
      const formattedDate = weekStartDate.toISOString().split('T')[0];
      
      const result = await pool.query(
        `SELECT * FROM pump_out_request 
         WHERE week_start_date = $1 
         ORDER BY created_at DESC`,
        [formattedDate]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        boatId: row.boat_id,
        weekStartDate: row.week_start_date,
        status: row.status,
        ownerNotes: row.owner_notes,
        adminNotes: row.admin_notes,
        paymentStatus: row.payment_status,
        paymentId: row.payment_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as PumpOutRequest));
    } catch (error) {
      console.error("Error in getPumpOutRequestsByWeek:", error);
      return [];
    }
  }

  async getPumpOutRequestsByStatus(status: string): Promise<PumpOutRequest[]> {
    try {
      let query = `SELECT * FROM pump_out_request`;
      const values: any[] = [];
      
      if (status && status !== "all") {
        query += ` WHERE status = $1`;
        values.push(status);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      const result = await pool.query(query, values);
      
      return result.rows.map(row => ({
        id: row.id,
        boatId: row.boat_id,
        weekStartDate: row.week_start_date,
        status: row.status,
        ownerNotes: row.owner_notes,
        adminNotes: row.admin_notes,
        paymentStatus: row.payment_status,
        paymentId: row.payment_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as PumpOutRequest));
    } catch (error) {
      console.error("Error in getPumpOutRequestsByStatus:", error);
      return [];
    }
  }

  async createPumpOutRequest(request: InsertPumpOutRequest): Promise<PumpOutRequest> {
    try {
      const result = await pool.query(
        `INSERT INTO pump_out_request (
          boat_id, week_start_date, status, owner_notes, admin_notes, payment_status, payment_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          request.boatId,
          request.weekStartDate,
          request.status || 'Requested',
          request.ownerNotes || null,
          request.adminNotes || null,
          request.paymentStatus || 'Pending',
          request.paymentId || null
        ]
      );
      
      const row = result.rows[0];
      return {
        id: row.id,
        boatId: row.boat_id,
        weekStartDate: row.week_start_date,
        status: row.status,
        ownerNotes: row.owner_notes,
        adminNotes: row.admin_notes,
        paymentStatus: row.payment_status,
        paymentId: row.payment_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as PumpOutRequest;
    } catch (error) {
      console.error("Error in createPumpOutRequest:", error);
      throw new Error("Failed to create pump-out request");
    }
  }

  async updatePumpOutRequest(id: number, requestData: Partial<PumpOutRequest>): Promise<PumpOutRequest | undefined> {
    try {
      // Build the SET part of the query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      if (requestData.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(requestData.status);
      }
      
      if (requestData.ownerNotes !== undefined) {
        updates.push(`owner_notes = $${paramCount++}`);
        values.push(requestData.ownerNotes);
      }
      
      if (requestData.adminNotes !== undefined) {
        updates.push(`admin_notes = $${paramCount++}`);
        values.push(requestData.adminNotes);
      }
      
      if (requestData.paymentStatus !== undefined) {
        updates.push(`payment_status = $${paramCount++}`);
        values.push(requestData.paymentStatus);
      }
      
      if (requestData.paymentId !== undefined) {
        updates.push(`payment_id = $${paramCount++}`);
        values.push(requestData.paymentId);
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      
      if (updates.length === 0) {
        // No fields to update other than timestamp
        return this.getPumpOutRequest(id);
      }
      
      // Add the ID as the last parameter
      values.push(id);
      
      const result = await pool.query(
        `UPDATE pump_out_request 
         SET ${updates.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        boatId: row.boat_id,
        weekStartDate: row.week_start_date,
        status: row.status,
        ownerNotes: row.owner_notes,
        adminNotes: row.admin_notes,
        paymentStatus: row.payment_status,
        paymentId: row.payment_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as PumpOutRequest;
    } catch (error) {
      console.error("Error in updatePumpOutRequest:", error);
      return undefined;
    }
  }

  async updatePumpOutRequestStatus(id: number, status: string): Promise<PumpOutRequest | undefined> {
    try {
      const result = await pool.query(
        `UPDATE pump_out_request 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [status, id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        boatId: row.boat_id,
        weekStartDate: row.week_start_date,
        status: row.status,
        ownerNotes: row.owner_notes,
        adminNotes: row.admin_notes,
        paymentStatus: row.payment_status,
        paymentId: row.payment_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as PumpOutRequest;
    } catch (error) {
      console.error("Error in updatePumpOutRequestStatus:", error);
      return undefined;
    }
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