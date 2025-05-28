import { Pool } from 'pg';

async function clearTestData() {
  console.log('Clearing existing test marina data...');
  
  const pool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Clear dependent data first to avoid foreign key constraint issues
    await pool.query('DELETE FROM slip_assignment');
    console.log('Cleared slip assignments');
    
    await pool.query('DELETE FROM pump_out_request');
    console.log('Cleared pump out requests');
    
    await pool.query('DELETE FROM boat');
    console.log('Cleared boats');
    
    await pool.query('DELETE FROM boat_owner');
    console.log('Cleared boat owners');
    
    // Now clear marina data
    await pool.query('DELETE FROM marina');
    console.log('All test marina data cleared');
    
    // Also clear test service levels
    await pool.query('DELETE FROM service_level');
    console.log('All test service level data cleared');
    
    console.log('Database is now clean and ready for your real data!');
  } catch (error) {
    console.error('Error clearing test data:', error);
  } finally {
    await pool.end();
  }
}

clearTestData();