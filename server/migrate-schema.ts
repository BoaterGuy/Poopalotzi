import { createSupabaseClient } from './supabase-db';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Script to create database schema in Supabase
 */
async function migrateSchema() {
  try {
    console.log('Creating database schema in Supabase...');
    const db = await createSupabaseClient();
    
    // Create enum types first
    console.log('Creating enum types...');
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('member', 'employee', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE docking_direction AS ENUM ('bow_in', 'stern_in', 'side_to');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE tie_up_side AS ENUM ('port', 'starboard', 'both');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE pump_port_location AS ENUM ('port', 'starboard', 'bow', 'mid_ship', 'stern');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE request_status AS ENUM ('Requested', 'Scheduled', 'Completed', 'Canceled', 'Waitlisted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Failed', 'Refunded');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE service_type AS ENUM ('one-time', 'monthly', 'seasonal');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE service_level AS ENUM ('single-head', 'multi-head');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Create tables
    console.log('Creating users table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        password_hash TEXT,
        role user_role NOT NULL DEFAULT 'member',
        oauth_provider TEXT,
        oauth_id TEXT,
        service_level_id INTEGER,
        subscription_start_date TIMESTAMP,
        subscription_end_date TIMESTAMP,
        active_month TEXT,
        auto_renew BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating boat_owner table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS boat_owner (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating service_level table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS service_level (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        head_count INTEGER DEFAULT 1,
        type service_type NOT NULL,
        season_start DATE,
        season_end DATE,
        monthly_quota INTEGER,
        on_demand_quota INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating marina table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS marina (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating boat table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS boat (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES boat_owner(id),
        name TEXT NOT NULL,
        year INTEGER,
        make TEXT,
        model TEXT,
        length INTEGER,
        color TEXT,
        photo_url TEXT,
        docking_direction docking_direction,
        tie_up_side tie_up_side,
        pump_port_locations JSONB,
        dock TEXT,
        slip INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating slip_assignment table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS slip_assignment (
        id SERIAL PRIMARY KEY,
        boat_id INTEGER NOT NULL REFERENCES boat(id),
        marina_id INTEGER NOT NULL REFERENCES marina(id),
        dock TEXT NOT NULL,
        slip INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating pump_out_request table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pump_out_request (
        id SERIAL PRIMARY KEY,
        boat_id INTEGER NOT NULL REFERENCES boat(id),
        week_start_date DATE NOT NULL,
        status request_status NOT NULL DEFAULT 'Requested',
        owner_notes TEXT,
        admin_notes TEXT,
        payment_status payment_status NOT NULL DEFAULT 'Pending',
        payment_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating pump_out_log table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pump_out_log (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES pump_out_request(id),
        change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        prev_status request_status,
        new_status request_status NOT NULL,
        before_url TEXT,
        during_url TEXT,
        after_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating employee_assignment table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS employee_assignment (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES users(id),
        request_id INTEGER NOT NULL REFERENCES pump_out_request(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating session table for auth...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
    `);
    
    // Create demo data
    console.log('Creating demo data...');
    await db.execute(sql`
      -- Add default service levels if they don't exist
      INSERT INTO service_level (name, price, description, head_count, type, monthly_quota)
      VALUES 
        ('Single Service', 3500, 'One-time pump-out service', 1, 'one-time', 1),
        ('Basic Plan', 9900, 'Monthly pump-out service for boats with a single holding tank', 1, 'monthly', 4),
        ('Premium Plan', 14900, 'Monthly pump-out service for boats with multiple holding tanks', 2, 'monthly', 4),
        ('Seasonal Plan', 59900, 'Season-long weekly service', 1, 'seasonal', 16)
      ON CONFLICT DO NOTHING;
      
      -- Add default marina if it doesn't exist
      INSERT INTO marina (name, address, phone)
      VALUES ('Harbor Springs Marina', '123 Marina Way, Harbor Springs, MI 49740', '(231) 555-1234')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('Database schema created successfully!');
    return true;
  } catch (error) {
    console.error('Error creating database schema:', error);
    return false;
  }
}

// Run the migration
migrateSchema().then(success => {
  if (success) {
    console.log('Migration completed successfully');
  } else {
    console.error('Migration failed');
  }
  process.exit(success ? 0 : 1);
});