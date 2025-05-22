import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Create a PostgreSQL connection pool using the environment variables 
// from the database we created with the tool
const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
});

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Initialize Drizzle with our schema
export const db = drizzle(pool, { schema });

// A function to verify the database connection
export async function testConnection() {
  try {
    // Test if we can execute a simple query
    const result = await pool.query('SELECT 1 as test');
    return result.rows[0].test === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// A function to set up the database tables
export async function setupTables() {
  try {
    // Check if 'users' table exists
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tablesExist = checkTableResult.rows[0]?.exists;
    
    if (!tablesExist) {
      console.log('Creating database tables...');
      
      // Create sessions table for authentication
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "sid" VARCHAR(255) PRIMARY KEY,
          "sess" JSON NOT NULL,
          "expire" TIMESTAMP NOT NULL
        )
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire")
      `);
      
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" SERIAL PRIMARY KEY,
          "email" VARCHAR(255) NOT NULL UNIQUE,
          "first_name" VARCHAR(255) NOT NULL,
          "last_name" VARCHAR(255) NOT NULL,
          "phone" VARCHAR(20),
          "password_hash" TEXT,
          "role" VARCHAR(50) DEFAULT 'member',
          "service_level_id" INTEGER,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create initial admin user
      await pool.query(`
        INSERT INTO "users" (email, first_name, last_name, role, password_hash)
        VALUES ('admin@poopalotzi.com', 'Admin', 'User', 'admin', '$2a$10$JQOfYsrTBNLmCWaRVyJRceuE6yJpliCVCFY7H0vf44HntRNh.P0Ey')
        ON CONFLICT (email) DO NOTHING
      `);
      
      console.log('Database tables created successfully');
      return true;
    } else {
      console.log('Database tables already exist');
      return true;
    }
  } catch (error) {
    console.error('Error setting up database tables:', error);
    return false;
  }
}

// Main setup function
export async function setupDatabase() {
  try {
    console.log('Setting up database connection...');
    
    // Test the connection
    const connectionWorks = await testConnection();
    if (!connectionWorks) {
      console.error('Could not establish database connection');
      return false;
    }
    
    // Set up tables
    const tablesSetup = await setupTables();
    if (!tablesSetup) {
      console.error('Failed to set up database tables');
      return false;
    }
    
    console.log('Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    return false;
  }
}