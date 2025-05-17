import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check for database environment variables
if (!process.env.DATABASE_URL && 
    !(process.env.PGHOST && process.env.PGPORT && process.env.PGUSER && 
      process.env.PGPASSWORD && process.env.PGDATABASE)) {
  throw new Error(
    "Database connection details must be set. Did you forget to provision a database?",
  );
}

// Create a standard pg Pool with better error handling
export const pool = new Pool({
  // If individual connection parameters are available, use those
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  // Required for Replit PostgreSQL
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  application_name: 'poopalotzi_app'
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

export async function setupDatabase() {
  try {
    console.log("Testing database connection...");
    
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
    let tablesExist = false;
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      tablesExist = result.rows[0].exists === true || result.rows[0].exists === 't';
    } catch (schemaErr) {
      console.error("Error checking schema:", schemaErr);
      return false;
    }
    
    // For now, don't try to create tables - we'll use drizzle migrations later
    if (!tablesExist) {
      console.log('Database tables do not exist. Falling back to memory storage.');
      return false;
    } else {
      console.log('Database tables already exist');
    }
    
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    return false;
  }
}