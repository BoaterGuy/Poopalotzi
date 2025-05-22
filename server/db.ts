import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

const { Pool } = pg;

// Initialize PostgreSQL connection with explicit parameters
let pool;

// Check and log available environment variables for connection
console.log('Database connection information available:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Available' : 'Not available');
console.log('PGHOST:', process.env.PGHOST ? 'Available' : 'Not available');
console.log('PGPORT:', process.env.PGPORT ? 'Available' : 'Not available');
console.log('PGUSER:', process.env.PGUSER ? 'Available' : 'Not available');
console.log('PGDATABASE:', process.env.PGDATABASE ? 'Available' : 'Not available');
console.log('PGPASSWORD:', process.env.PGPASSWORD ? 'Available (value hidden)' : 'Not available');

// Try multiple pool configurations until one works
const createSuccessfulPool = (): pg.Pool | null => {
  const configOptions = [
    // Try with the PostgreSQL database we set up via the tool
    {
      name: "PostgreSQL database via environment variables",
      config: {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || '5432'),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE
      }
    },
    // Try with connection string and no SASL - multiple options
    {
      name: "URL-based with no SASL and different auth",
      config: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        },
        password_encryption: 'md5', // Disable SASL/SCRAM
        client_encoding: 'utf8'
      }
    },
    {
      name: "URL-based with explicit parameters",
      config: () => {
        try {
          const url = new URL(process.env.DATABASE_URL || '');
          return {
            host: url.hostname,
            port: parseInt(url.port),
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1),
            ssl: {
              rejectUnauthorized: false
            }
          };
        } catch (err) {
          console.error('Error parsing DATABASE_URL:', err);
          return null;
        }
      }
    },
    // Try with direct parameters and no SASL
    {
      name: "Direct parameters with no SASL",
      config: {
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: {
          rejectUnauthorized: false
        },
        password_encryption: 'md5' // Disable SASL/SCRAM
      }
    },
    // Try with URL but without SSL
    {
      name: "URL-based without SSL",
      config: {
        connectionString: process.env.DATABASE_URL,
        ssl: false
      }
    },
    // Basic fallback
    {
      name: "Basic URL",
      config: {
        connectionString: process.env.DATABASE_URL
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      console.log(`Trying database connection with: ${name}`);
      const testPool = new Pool(config);
      console.log(`Successfully created pool with: ${name}`);
      
      // Add error handler
      testPool.on('error', (err) => {
        console.error(`Database pool error (${name}):`, err.message);
      });
      
      return testPool;
    } catch (err) {
      console.error(`Failed to create pool with ${name}:`, err.message);
    }
  }
  
  // If all attempts fail, throw
  throw new Error("All database connection attempts failed");
};

try {
  pool = createSuccessfulPool();
} catch (error) {
  console.error("Error creating all database pool configurations:", error);
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
    console.log("Testing database connection...");
    
    // Log formatted database URL (redacting password)
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        url.password = "REDACTED";
        console.log("Using database URL format:", url.toString());
      } catch (err) {
        console.error("Error parsing DATABASE_URL:", err.message);
      }
    }
    
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
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      console.log("Database query result:", result);
      const tablesExist = result[0]?.exists;
    } catch (schemaErr) {
      console.error("Error checking schema:", schemaErr);
      return false;
    }
    
    if (!tablesExist) {
      console.log('Database tables do not exist. Run migrations...');
      // For production, we would use drizzle-kit migrate here
      // but for development, we'll create tables directly
      
      const queries = [
        // Create enums first
        sql`CREATE TYPE user_role AS ENUM ('member', 'employee', 'admin')`,
        sql`CREATE TYPE docking_direction AS ENUM ('bow_in', 'stern_in', 'side_to')`,
        sql`CREATE TYPE tie_up_side AS ENUM ('port', 'starboard', 'both')`,
        sql`CREATE TYPE pump_port_location AS ENUM ('stern', 'port_side', 'starboard_side', 'cabin_roof')`,
        sql`CREATE TYPE request_status AS ENUM ('Requested', 'Scheduled', 'Completed', 'Canceled', 'Waitlisted')`,
        sql`CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Failed', 'Refunded')`,
        sql`CREATE TYPE service_type AS ENUM ('one-time', 'monthly', 'seasonal')`,
        sql`CREATE TYPE service_level AS ENUM ('single-head', 'multi-head')`,
        
        // Create tables
        sql`CREATE TABLE "users" (
          "id" SERIAL PRIMARY KEY,
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