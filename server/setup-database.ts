import { Pool } from 'pg';
import { log } from './vite';

// Function to set up all required tables
export async function setupFullDatabase() {
  console.log('Starting complete database setup...');
  
  // Connect to database using individual parameters from environment variables
  const pool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: {
      rejectUnauthorized: false // For development - handles self-signed certificates
    }
  });
  
  try {
    // First confirm connection
    await pool.query('SELECT 1');
    console.log('Database connection confirmed for setup');
    
    // Check which tables exist
    const existingTables = await getExistingTables(pool);
    console.log('Existing tables:', existingTables);
    
    // Create required tables if they don't exist
    if (!existingTables.includes('boat_owner')) {
      console.log('Creating boat_owner table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "boat_owner" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    if (!existingTables.includes('boat')) {
      console.log('Creating boat table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "boat" (
          "id" SERIAL PRIMARY KEY,
          "owner_id" INTEGER NOT NULL REFERENCES "boat_owner"("id"),
          "name" VARCHAR(255) NOT NULL,
          "year" INTEGER,
          "make" VARCHAR(255),
          "model" VARCHAR(255),
          "length" INTEGER,
          "color" VARCHAR(100),
          "photo_url" VARCHAR(255),
          "docking_direction" VARCHAR(20),
          "tie_up_side" VARCHAR(20),
          "pump_port_locations" TEXT[],
          "dock" VARCHAR(50),
          "slip" INTEGER,
          "notes" TEXT,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    if (!existingTables.includes('marina')) {
      console.log('Creating marina table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "marina" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "address" VARCHAR(255),
          "phone" VARCHAR(20),
          "is_active" BOOLEAN DEFAULT TRUE,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
      
    // Always ensure we have our complete set of marina data
    try {
      console.log('Ensuring marina data is complete...');
      
      // Our list of marinas - updated to match the API data
      const marinaList = [
        {name: 'Harbor Bay Marina', address: '123 Harbor Bay Dr, Port Clinton, OH 43452', phone: '(419) 555-1234'},
        {name: 'Sunset Point Marina', address: '500 Sunset Pt, Port Clinton, OH 43452', phone: '(419) 555-6789'},
        {name: 'Harbor Marina', address: '789 Harbor Dr, Port Clinton, OH 43452', phone: '(419) 555-4321'},
        {name: 'Golden Anchor Marina', address: '1 Golden Anchor Way, Sandusky, OH 44870', phone: '(419) 555-8765'},
        {name: 'Cedar Point', address: '1 Cedar Point Dr, Sandusky, OH 44870', phone: '(419) 555-1357'},
        {name: 'Son Rise', address: '300 Son Rise Dr, Port Clinton, OH 43452', phone: '(419) 555-9876'}
      ];
      
      // First get existing marina names
      const existingMarinas = await pool.query('SELECT name FROM marina');
      const existingNames = existingMarinas.rows.map((row: any) => row.name);
      
      // Add any missing marinas
      for (const marina of marinaList) {
        if (!existingNames.includes(marina.name)) {
          console.log(`Adding marina: ${marina.name}`);
          await pool.query(
            `INSERT INTO marina (name, address, phone, is_active) VALUES ($1, $2, $3, TRUE)`,
            [marina.name, marina.address, marina.phone]
          );
        }
      }
    } catch (error) {
      console.error("Error seeding marina data:", error);
    }
    
    if (!existingTables.includes('slip_assignment')) {
      console.log('Creating slip_assignment table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "slip_assignment" (
          "id" SERIAL PRIMARY KEY,
          "boat_id" INTEGER NOT NULL REFERENCES "boat"("id"),
          "marina_id" INTEGER NOT NULL REFERENCES "marina"("id"),
          "dock" TEXT NOT NULL,
          "slip" INTEGER NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    if (!existingTables.includes('service_level')) {
      console.log('Creating service_level table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "service_level" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "price" INTEGER NOT NULL,
          "description" TEXT,
          "head_count" INTEGER DEFAULT 1,
          "type" VARCHAR(20) NOT NULL,
          "season_start" DATE,
          "season_end" DATE,
          "monthly_quota" INTEGER,
          "on_demand_quota" INTEGER,
          "is_active" BOOLEAN DEFAULT TRUE,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    if (!existingTables.includes('pump_out_request')) {
      console.log('Creating pump_out_request table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "pump_out_request" (
          "id" SERIAL PRIMARY KEY,
          "boat_id" INTEGER NOT NULL REFERENCES "boat"("id"),
          "week_start_date" DATE NOT NULL,
          "status" VARCHAR(20) NOT NULL DEFAULT 'Requested',
          "owner_notes" TEXT,
          "admin_notes" TEXT,
          "payment_status" VARCHAR(20) DEFAULT 'Pending',
          "payment_id" VARCHAR(255),
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    if (!existingTables.includes('pump_out_log')) {
      console.log('Creating pump_out_log table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "pump_out_log" (
          "id" SERIAL PRIMARY KEY,
          "request_id" INTEGER NOT NULL REFERENCES "pump_out_request"("id"),
          "change_timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "prev_status" VARCHAR(20),
          "new_status" VARCHAR(20) NOT NULL,
          "before_url" VARCHAR(255),
          "during_url" VARCHAR(255),
          "after_url" VARCHAR(255),
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    if (!existingTables.includes('employee_assignment')) {
      console.log('Creating employee_assignment table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "employee_assignment" (
          "id" SERIAL PRIMARY KEY,
          "employee_id" INTEGER NOT NULL REFERENCES "users"("id"),
          "request_id" INTEGER NOT NULL REFERENCES "pump_out_request"("id"),
          "assigned_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Add sample data to service level
    if (!existingTables.includes('service_level')) {
      console.log('Adding sample service level data...');
      await pool.query(`
        INSERT INTO service_level (name, price, description, head_count, type, monthly_quota, on_demand_quota)
        VALUES 
        ('Basic - Single Head', 49900, 'Monthly pump-out service for boats with a single head', 1, 'monthly', 4, 0),
        ('Premium - Multi Head', 69900, 'Monthly pump-out service for boats with multiple heads', 2, 'monthly', 8, 0),
        ('On-Demand Service', 17900, 'One-time pump-out service', 1, 'one-time', 0, 1),
        ('Seasonal Package', 249900, 'Seasonal pump-out service package (May through October)', 1, 'seasonal', 4, 0)
      `);
    }
    
    // Add sample marinas if none exist
    const marinaCount = await pool.query('SELECT COUNT(*) FROM marina');
    if (parseInt(marinaCount.rows[0].count) === 0) {
      console.log('Adding sample marina data...');
      await pool.query(`
        INSERT INTO marina (name, is_active)
        VALUES 
        ('Cedar Point Marina', TRUE),
        ('Son Rise Marina', TRUE),
        ('Bay Harbor Marina', TRUE)
      `);
    }
    
    console.log('Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Database setup error:', error);
    return false;
  } finally {
    // Close pool
    await pool.end();
  }
}

// Helper to get existing tables
async function getExistingTables(pool: Pool): Promise<string[]> {
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  return result.rows.map(row => row.table_name);
}