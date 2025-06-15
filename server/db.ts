import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

const { Pool } = pg;

// Initialize PostgreSQL connection with explicit parameters
let pool: pg.Pool;

// Check and log available environment variables for connection
console.log('Setting up database connection...');

try {
  // Connect to database
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });
  
  // Add error handler
  pool.on('error', (err) => {
    console.error('Database pool error:', err.message);
  });
} catch (error) {
  console.error("Error creating database pool:", error);
  // Create minimal pool as absolute last resort
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
  });
}

// Initialize Drizzle with our schema
export const db = drizzle(pool, { schema });

// Database setup function
export async function setupDatabase() {
  try {
    // First test connection
    try {
      await pool.query('SELECT 1');
      console.log("Database connection successful");
    } catch (connectionErr) {
      console.error("Database connection test failed:", connectionErr);
      console.log("Falling back to memory storage");
      return false;
    }
    
    // Check for enums first
    try {
      // Check if the user_role enum exists
      const enumResult = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = 'user_role'
        );
      `);
      
      // Create enums if they don't exist
      if (!enumResult.rows[0]?.exists) {
        console.log('Creating enum types...');
        
        // Create all the enums
        await pool.query(`CREATE TYPE "user_role" AS ENUM ('member', 'employee', 'admin');`);
        await pool.query(`CREATE TYPE "docking_direction" AS ENUM ('bow_in', 'stern_in', 'side_to');`);
        await pool.query(`CREATE TYPE "tie_up_side" AS ENUM ('port', 'starboard', 'both');`);
        await pool.query(`CREATE TYPE "pump_port_location" AS ENUM ('port', 'starboard', 'bow', 'mid_ship', 'stern');`);
        await pool.query(`CREATE TYPE "request_status" AS ENUM ('Requested', 'Scheduled', 'Completed', 'Canceled', 'Waitlisted');`);
        await pool.query(`CREATE TYPE "payment_status" AS ENUM ('Pending', 'Paid', 'Failed', 'Refunded');`);
        await pool.query(`CREATE TYPE "service_type" AS ENUM ('one-time', 'monthly', 'seasonal');`);
        await pool.query(`CREATE TYPE "service_level" AS ENUM ('single-head', 'multi-head');`);
        
        console.log('Enum types created successfully');
      }
    } catch (enumErr) {
      console.error("Error creating enum types:", enumErr);
      // Continue even if enum creation fails
    }
    
    // Check if database is initialized
    console.log("Checking if tables exist...");
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      const tablesExist = result.rows[0]?.exists === true;
      
      if (!tablesExist) {
        console.log('Database tables do not exist. Creating tables...');
        // Create tables directly
        const queries = [
          // Create tables
          `CREATE TABLE IF NOT EXISTS "users" (
            "id" SERIAL PRIMARY KEY,
            "email" VARCHAR(255) NOT NULL UNIQUE,
            "first_name" VARCHAR(255) NOT NULL,
            "last_name" VARCHAR(255) NOT NULL,
            "phone" VARCHAR(20),
            "password_hash" TEXT,
            "role" user_role NOT NULL DEFAULT 'member',
            "oauth_provider" VARCHAR(50),
            "oauth_id" VARCHAR(255),
            "service_level_id" INTEGER,
            "subscription_start_date" TIMESTAMP,
            "subscription_end_date" TIMESTAMP,
            "active_month" VARCHAR(2),
            "auto_renew" BOOLEAN DEFAULT FALSE,
            "email_verified" BOOLEAN DEFAULT FALSE,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "boat_owner" (
            "id" SERIAL PRIMARY KEY,
            "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "boat" (
            "id" SERIAL PRIMARY KEY,
            "owner_id" INTEGER NOT NULL REFERENCES "boat_owner"("id"),
            "name" VARCHAR(255) NOT NULL,
            "year" INTEGER,
            "make" VARCHAR(255),
            "model" VARCHAR(255),
            "length" INTEGER,
            "color" VARCHAR(100),
            "photo_url" VARCHAR(255),
            "docking_direction" docking_direction,
            "tie_up_side" tie_up_side,
            "pump_port_locations" TEXT[],
            "dock" VARCHAR(50),
            "slip" INTEGER,
            "notes" TEXT,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "marina" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(255) NOT NULL,
            "address" VARCHAR(255),
            "phone" VARCHAR(20),
            "is_active" BOOLEAN DEFAULT TRUE,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "dock_assignment" (
            "id" SERIAL PRIMARY KEY,
            "boat_id" INTEGER NOT NULL REFERENCES "boat"("id"),
            "marina_id" INTEGER NOT NULL REFERENCES "marina"("id"),
            "pier" TEXT NOT NULL,
            "dock" INTEGER NOT NULL,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "service_level" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(255) NOT NULL,
            "price" INTEGER NOT NULL,
            "description" TEXT,
            "head_count" INTEGER DEFAULT 1,
            "type" service_type NOT NULL,
            "season_start" DATE,
            "season_end" DATE,
            "monthly_quota" INTEGER,
            "on_demand_quota" INTEGER,
            "is_active" BOOLEAN DEFAULT TRUE,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "pump_out_request" (
            "id" SERIAL PRIMARY KEY,
            "boat_id" INTEGER NOT NULL REFERENCES "boat"("id"),
            "week_start_date" DATE NOT NULL,
            "status" request_status NOT NULL DEFAULT 'Requested',
            "owner_notes" TEXT,
            "admin_notes" TEXT,
            "payment_status" payment_status NOT NULL DEFAULT 'Pending',
            "payment_id" VARCHAR(255),
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "pump_out_log" (
            "id" SERIAL PRIMARY KEY,
            "request_id" INTEGER NOT NULL REFERENCES "pump_out_request"("id"),
            "change_timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "prev_status" request_status,
            "new_status" request_status NOT NULL,
            "before_url" VARCHAR(255),
            "during_url" VARCHAR(255),
            "after_url" VARCHAR(255),
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "employee_assignment" (
            "id" SERIAL PRIMARY KEY,
            "employee_id" INTEGER NOT NULL REFERENCES "users"("id"),
            "request_id" INTEGER NOT NULL REFERENCES "pump_out_request"("id"),
            "assigned_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`
        ];
        
        // Execute queries in order
        for (const query of queries) {
          try {
            await pool.query(query);
          } catch (err) {
            console.error('Error executing query:', err);
            // Continue with other queries
          }
        }
        
        console.log('Database tables created successfully');
      } else {
        console.log('Database tables already exist');
      }
    } catch (schemaErr) {
      console.error("Error checking schema:", schemaErr);
      return false;
    }
    
    // Session table for storing sessions
    try {
      const sessionTableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'sessions'
        );
      `);
      
      if (!sessionTableExists.rows[0]?.exists) {
        console.log('Creating sessions table for authentication...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "sessions" (
            "sid" VARCHAR(255) NOT NULL PRIMARY KEY,
            "sess" JSON NOT NULL,
            "expire" TIMESTAMP(6) NOT NULL
          )
        `);
        
        console.log('Sessions table created successfully');
        console.log('Session store initialized successfully');
      }
    } catch (err) {
      console.error("Error checking sessions table:", err);
    }
    
    console.log('Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    return false;
  }
}