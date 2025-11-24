require('dotenv').config();
const sequelize = require('./config/database');
const models = require('./models');

(async () => {
  try {
    console.log('⚠️  WARNING: This will DROP all tables and recreate them!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Dropping all tables...');
    await sequelize.drop();
    console.log('✓ All tables dropped');
    
    console.log('Creating tables from models...');
    await sequelize.sync({ force: false });
    console.log('✓ All tables created');
    
    console.log('\n✅ Database reset complete!');
    console.log('You can now seed the database: node ../database/seed.js');
    
  } catch (err) {
    console.error('✗ Error:', err.message);
    console.error(err.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
})();




