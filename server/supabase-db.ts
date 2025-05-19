import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema.js';

// Create a more specialized connection for Supabase
export async function createSupabaseClient() {
  try {
    console.log("Attempting specialized Supabase connection...");
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    
    // Parse the connection string to modify it
    const url = new URL(process.env.DATABASE_URL);
    console.log("Using Supabase connection URL (host):", url.host);
    
    // Extract credentials
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = parseInt(url.port || '5432');
    const database = url.pathname.substring(1); // Remove leading slash
    
    console.log(`Connecting to: ${host}:${port}/${database} as ${user}`);
    
    // Create specialized pool for Supabase
    const connectionString = process.env.DATABASE_URL;
    
    const pool = new pg.Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
    });
    
    // Test connection
    await pool.query('SELECT 1');
    console.log("Supabase test connection successful");
    
    // Create drizzle instance
    return drizzle(pool, { schema });
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    throw error;
  }
}

// Schema verification function
export async function verifySchema(db: any) {
  try {
    // Check if database is initialized
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    return result.rows[0]?.exists === true;
  } catch (error) {
    console.error("Error verifying schema:", error);
    return false;
  }
}