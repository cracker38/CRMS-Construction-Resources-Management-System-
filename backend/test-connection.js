require('dotenv').config();
const sequelize = require('./config/database');
const { User, Role } = require('./models');

(async () => {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✓ Database connection OK');
    
    console.log('Syncing tables...');
    await sequelize.sync({ alter: true });
    console.log('✓ Tables synced');
    
    const count = await User.count();
    console.log('✓ Users table accessible, count:', count);
    
    console.log('\n✅ All checks passed! You can now start the server.');
    console.log('Run: npm run dev');
    
  } catch (err) {
    console.error('✗ Error:', err.message);
    if (err.sql) {
      console.error('SQL:', err.sql);
    }
    console.error(err.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
})();




