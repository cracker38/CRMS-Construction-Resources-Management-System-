require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crms_db',
    multipleStatements: true
  });

  try {
    console.log('⚠️  WARNING: This will DROP all tables and recreate them!');
    console.log('Disabling foreign key checks...');
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    console.log('Getting list of tables...');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    if (tableNames.length > 0) {
      console.log(`Dropping ${tableNames.length} tables...`);
      for (const tableName of tableNames) {
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`  ✓ Dropped ${tableName}`);
      }
    } else {
      console.log('No tables to drop');
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Foreign key checks re-enabled');
    
    console.log('\n✅ All tables dropped!');
    console.log('Now restart your backend server - Sequelize will create tables automatically');
    console.log('Or run: node test-connection.js');
    
  } catch (err) {
    console.error('✗ Error:', err.message);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await connection.end();
    process.exit(0);
  }
})();




