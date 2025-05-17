import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a standard pg Pool with better error handling
export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require'
  },
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