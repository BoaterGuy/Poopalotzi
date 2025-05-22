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
            "firstName" VARCHAR(255) NOT NULL,
            "lastName" VARCHAR(255) NOT NULL,
            "phone" VARCHAR(20),
            "passwordHash" TEXT,
            "role" VARCHAR(20) NOT NULL,
            "oauthProvider" VARCHAR(50),
            "oauthId" VARCHAR(255),
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "serviceLevelId" INTEGER,
            "emailVerified" BOOLEAN
          )`,
          
          `CREATE TABLE IF NOT EXISTS "boat_owner" (
            "id" SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL REFERENCES "users"("id"),
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "boat" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(255) NOT NULL,
            "ownerId" INTEGER NOT NULL REFERENCES "boat_owner"("id"),
            "year" INTEGER,
            "make" VARCHAR(255),
            "model" VARCHAR(255),
            "color" VARCHAR(100),
            "photoUrl" VARCHAR(255),
            "dockingDirection" VARCHAR(20),
            "tieUpSide" VARCHAR(20),
            "pumpPortLocations" TEXT[],
            "notes" TEXT,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "marina" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(255) NOT NULL,
            "isActive" BOOLEAN DEFAULT TRUE,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "slip_assignment" (
            "id" SERIAL PRIMARY KEY,
            "boatId" INTEGER NOT NULL REFERENCES "boat"("id"),
            "marinaId" INTEGER NOT NULL REFERENCES "marina"("id"),
            "dock" VARCHAR(50),
            "slip" VARCHAR(50),
            "startDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "endDate" TIMESTAMP,
            "isActive" BOOLEAN DEFAULT TRUE,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "service_level" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(255) NOT NULL,
            "price" INTEGER NOT NULL,
            "description" TEXT,
            "headCount" INTEGER,
            "type" VARCHAR(20) NOT NULL,
            "seasonStart" VARCHAR(10),
            "seasonEnd" VARCHAR(10),
            "monthlyQuota" INTEGER,
            "onDemandQuota" INTEGER,
            "isActive" BOOLEAN DEFAULT TRUE,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "pump_out_request" (
            "id" SERIAL PRIMARY KEY,
            "boatId" INTEGER NOT NULL REFERENCES "boat"("id"),
            "status" VARCHAR(20) NOT NULL DEFAULT 'Requested',
            "weekStartDate" VARCHAR(10) NOT NULL,
            "ownerNotes" TEXT,
            "adminNotes" TEXT,
            "paymentStatus" VARCHAR(20) DEFAULT 'Pending',
            "paymentId" VARCHAR(255),
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "pump_out_log" (
            "id" SERIAL PRIMARY KEY,
            "requestId" INTEGER NOT NULL REFERENCES "pump_out_request"("id"),
            "changeTimestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "prevStatus" VARCHAR(20),
            "newStatus" VARCHAR(20) NOT NULL,
            "beforeUrl" VARCHAR(255),
            "duringUrl" VARCHAR(255),
            "afterUrl" VARCHAR(255),
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          
          `CREATE TABLE IF NOT EXISTS "employee_assignment" (
            "id" SERIAL PRIMARY KEY,
            "employeeId" INTEGER NOT NULL REFERENCES "users"("id"),
            "requestId" INTEGER NOT NULL REFERENCES "pump_out_request"("id"),
            "assignedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "notes" TEXT,
            "isCompleted" BOOLEAN DEFAULT FALSE,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      }
    } catch (err) {
      console.error("Error checking sessions table:", err);
    }
    
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    return false;
  }
}
          "email" VARCHAR(255) NOT NULL UNIQUE,
          "firstName" VARCHAR(255) NOT NULL,
          "lastName" VARCHAR(255) NOT NULL,
          "phone" VARCHAR(20),
          "passwordHash" TEXT,
          "role" user_role NOT NULL,
          "oauthProvider" VARCHAR(50),
          "oauthId" VARCHAR(255),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "serviceLevelId" INTEGER,
          "emailVerified" BOOLEAN
        )`,
        
        sql`CREATE TABLE "boat_owner" (
          "id" SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL REFERENCES "users"("id"),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        sql`CREATE TABLE "boat" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "ownerId" INTEGER NOT NULL REFERENCES "boat_owner"("id"),
          "year" INTEGER,
          "make" VARCHAR(255),
          "model" VARCHAR(255),
          "color" VARCHAR(100),
          "photoUrl" VARCHAR(255),
          "dockingDirection" docking_direction,
          "tieUpSide" tie_up_side,
          "pumpPortLocations" TEXT[],
          "notes" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        sql`CREATE TABLE "marina" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "isActive" BOOLEAN DEFAULT TRUE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        sql`CREATE TABLE "slip_assignment" (
          "id" SERIAL PRIMARY KEY,
          "boatId" INTEGER NOT NULL REFERENCES "boat"("id"),
          "marinaId" INTEGER NOT NULL REFERENCES "marina"("id"),
          "dock" VARCHAR(50),
          "slip" VARCHAR(50),
          "startDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "endDate" TIMESTAMP,
          "isActive" BOOLEAN DEFAULT TRUE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        sql`CREATE TABLE "service_level" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "price" INTEGER NOT NULL,
          "description" TEXT,
          "headCount" INTEGER,
          "type" service_type NOT NULL,
          "seasonStart" VARCHAR(10),
          "seasonEnd" VARCHAR(10),
          "monthlyQuota" INTEGER,
          "onDemandQuota" INTEGER,
          "isActive" BOOLEAN DEFAULT TRUE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        sql`CREATE TABLE "pump_out_request" (
          "id" SERIAL PRIMARY KEY,
          "boatId" INTEGER NOT NULL REFERENCES "boat"("id"),
          "status" request_status NOT NULL DEFAULT 'Requested',
          "weekStartDate" VARCHAR(10) NOT NULL,
          "ownerNotes" TEXT,
          "adminNotes" TEXT,
          "paymentStatus" payment_status DEFAULT 'Pending',
          "paymentId" VARCHAR(255),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        sql`CREATE TABLE "pump_out_log" (
          "id" SERIAL PRIMARY KEY,
          "requestId" INTEGER NOT NULL REFERENCES "pump_out_request"("id"),
          "changeTimestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "prevStatus" request_status,
          "newStatus" request_status NOT NULL,
          "beforeUrl" VARCHAR(255),
          "duringUrl" VARCHAR(255),
          "afterUrl" VARCHAR(255),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        sql`CREATE TABLE "employee_assignment" (
          "id" SERIAL PRIMARY KEY,
          "employeeId" INTEGER NOT NULL REFERENCES "users"("id"),
          "requestId" INTEGER NOT NULL REFERENCES "pump_out_request"("id"),
          "assignedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "notes" TEXT,
          "isCompleted" BOOLEAN DEFAULT FALSE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      ];
      
      // Execute queries in order
      for (const query of queries) {
        try {
          await db.execute(query);
        } catch (err) {
          console.error('Error executing query:', err);
          // Continue with other queries
        }
      }
      
      console.log('Database tables created successfully');
    } else {
      console.log('Database tables already exist');
    }
    
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    return false;
  }
}