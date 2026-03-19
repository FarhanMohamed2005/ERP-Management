const mongoose = require('mongoose');
const config = require('./src/config');
const User = require('./src/models/User');

const updatePassword = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB\n');

    const user = await User.findOne({ email: 'admin@erp.com' });
    if (!user) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('Updating admin password...');
    user.password = 'Admin@123456';
    await user.save();
    
    console.log('✅ Admin password updated to: Admin@123456\n');
    console.log('Testing password...');
    const isMatch = await user.comparePassword('Admin@123456');
    if (isMatch) {
      console.log('✅ Password verification: SUCCESS\n');
    } else {
      console.log('❌ Password verification: FAILED\n');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

updatePassword();
