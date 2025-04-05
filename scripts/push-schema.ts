import { db } from '../server/db';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pool } from '../server/db';

// This script will push the schema to the database
async function main() {
  console.log('Pushing schema to database...');
  
  try {
    // Run any pending migrations
    await migrate(db, { migrationsFolder: 'drizzle' });
    
    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

main();