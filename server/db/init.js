const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function initDatabase() {
  try {
    console.log('📦 Initializing database...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    
    console.log('✅ Database initialized successfully!');
    
    // Проверка таблиц
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📊 Created tables:', tables.rows.map(t => t.table_name).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();