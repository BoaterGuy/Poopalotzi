import { Pool } from 'pg';
import { log } from './vite';

// This script refreshes the marina data to match what users expect to see
async function resetMarinaData() {
  console.log('Starting marina data reset...');
  
  // Connect to database using individual parameters from environment variables
  const pool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: {
      rejectUnauthorized: false // For development
    }
  });
  
  try {
    // First confirm connection
    await pool.query('SELECT 1');
    console.log('Database connection confirmed for marina reset');
    
    // Delete all existing marina data
    await pool.query('DELETE FROM marina');
    console.log('All marina data has been cleared');
    
    // Our updated list of marinas
    const marinaList = [
      {name: 'Sunset Marina', address: '123 Sunset Way, Port Clinton, OH 43452', phone: '(419) 555-1234'},
      {name: 'Harbor Point', address: '500 Harbor Dr, Port Clinton, OH 43452', phone: '(419) 555-6789'},
      {name: 'Bay Front', address: '789 Bay View Rd, Port Clinton, OH 43452', phone: '(419) 555-4321'},
      {name: 'Cedar Point', address: '1 Cedar Point Dr, Sandusky, OH 44870', phone: '(419) 555-8765'},
      {name: 'Son Rise', address: '2200 Marina Way, Marblehead, OH 43440', phone: '(419) 555-2468'},
      {name: 'Port Clinton Yacht Club', address: '455 Lakeshore Dr, Port Clinton, OH 43452', phone: '(419) 555-1357'},
      {name: 'Craft Marine', address: '300 Craft Rd, Port Clinton, OH 43452', phone: '(419) 555-9876'}
    ];
    
    // Add all marinas
    for (const marina of marinaList) {
      console.log(`Adding marina: ${marina.name}`);
      await pool.query(
        `INSERT INTO marina (name, address, phone, is_active) VALUES ($1, $2, $3, TRUE)`,
        [marina.name, marina.address, marina.phone]
      );
    }
    
    console.log('Marina data has been successfully reset');
  } catch (error) {
    console.error("Error resetting marina data:", error);
  } finally {
    pool.end();
  }
}

// Run the reset function
resetMarinaData();