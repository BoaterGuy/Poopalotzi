import { Pool } from 'pg';
import { log } from './vite';

// This script updates marina data to match what users expect to see, without deleting records
async function updateFinalMarinaData() {
  console.log('Starting final marina data update...');
  
  // Connect to database
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
    // First confirm connection
    await pool.query('SELECT 1');
    console.log('Database connection confirmed for marina update');
    
    // Get existing marina records
    const result = await pool.query('SELECT id, name FROM marina ORDER BY id');
    const existingMarinas = result.rows;
    console.log('Existing marinas:', existingMarinas);
    
    // Our expected marina list in the desired order (from the dropdown)
    const updatedMarinaList = [
      {name: 'Harbor Bay Marina', address: '123 Harbor Bay Dr, Port Clinton, OH 43452', phone: '(419) 555-1234'},
      {name: 'Sunset Point Marina', address: '500 Sunset Pt, Port Clinton, OH 43452', phone: '(419) 555-6789'},
      {name: 'Harbor Marina', address: '789 Harbor Dr, Port Clinton, OH 43452', phone: '(419) 555-4321'},
      {name: 'Golden Anchor Marina', address: '1 Golden Anchor Way, Sandusky, OH 44870', phone: '(419) 555-8765'},
      {name: 'Sunset Point Marina', address: '2200 Sunset Blvd, Marblehead, OH 43440', phone: '(419) 555-2468'},
      {name: 'Cedar Point', address: '1 Cedar Point Dr, Sandusky, OH 44870', phone: '(419) 555-1357'},
      {name: 'Son Rise', address: '300 Son Rise Dr, Port Clinton, OH 43452', phone: '(419) 555-9876'}
    ];
    
    // Update existing marinas to match the expected list
    // This preserves IDs and foreign key relationships
    for (let i = 0; i < Math.min(existingMarinas.length, updatedMarinaList.length); i++) {
      const marinaId = existingMarinas[i].id;
      const updatedMarina = updatedMarinaList[i];
      
      console.log(`Updating marina ID ${marinaId} from ${existingMarinas[i].name} to ${updatedMarina.name}`);
      
      await pool.query(
        `UPDATE marina SET name = $1, address = $2, phone = $3, is_active = TRUE WHERE id = $4`,
        [updatedMarina.name, updatedMarina.address, updatedMarina.phone, marinaId]
      );
    }
    
    // If we have fewer existing marinas than expected, add new ones
    if (updatedMarinaList.length > existingMarinas.length) {
      for (let i = existingMarinas.length; i < updatedMarinaList.length; i++) {
        const newMarina = updatedMarinaList[i];
        console.log(`Adding new marina: ${newMarina.name}`);
        
        await pool.query(
          `INSERT INTO marina (name, address, phone, is_active) VALUES ($1, $2, $3, TRUE)`,
          [newMarina.name, newMarina.address, newMarina.phone]
        );
      }
    }
    
    // If we have existing marinas we don't need anymore, deactivate them
    if (existingMarinas.length > updatedMarinaList.length) {
      for (let i = updatedMarinaList.length; i < existingMarinas.length; i++) {
        const marinaId = existingMarinas[i].id;
        console.log(`Deactivating unused marina ID ${marinaId}: ${existingMarinas[i].name}`);
        
        await pool.query(
          `UPDATE marina SET is_active = FALSE WHERE id = $1`,
          [marinaId]
        );
      }
    }
    
    console.log('Marina data has been successfully updated');
  } catch (error) {
    console.error("Error updating marina data:", error);
  } finally {
    pool.end();
  }
}

// Run the update function
updateFinalMarinaData();