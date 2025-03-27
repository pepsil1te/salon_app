const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const logger = require('../config/logger');
const config = require('../config/config');

// Create a pool for database connection
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password
});

async function fixDatabase() {
  let client;

  try {
    logger.info('Starting database fixes...');
    client = await pool.connect();
    
    // Apply fixes for trigger issue
    logger.info('Dropping and recreating triggers...');
    await client.query(`
      DROP TRIGGER IF EXISTS update_salons_updated_at ON salons;
      DROP TRIGGER IF EXISTS update_services_updated_at ON services;
      DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
      DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
      DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
    `);
    
    // Create triggers again
    await client.query(`
      CREATE TRIGGER update_salons_updated_at
      BEFORE UPDATE ON salons
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_services_updated_at
      BEFORE UPDATE ON services
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_employees_updated_at
      BEFORE UPDATE ON employees
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_clients_updated_at
      BEFORE UPDATE ON clients
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_appointments_updated_at
      BEFORE UPDATE ON appointments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Add reviews table
    logger.info('Creating reviews table if it doesn\'t exist...');
    const reviewsTableSQL = fs.readFileSync(
      path.join(__dirname, 'add_reviews_table.sql'),
      'utf8'
    );
    
    await client.query(reviewsTableSQL);
    
    logger.info('Database fixes completed successfully!');
  } catch (error) {
    logger.error('Error fixing database:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Execute the function
fixDatabase().catch(error => {
  logger.error('Failed to fix database:', error);
  process.exit(1);
}); 