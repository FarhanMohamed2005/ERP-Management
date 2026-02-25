const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@erp.com' });
    if (existing) {
      console.log('Admin user already exists — skipping seed.');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@erp.com',
      password: 'Admin@123',
      role: 'Admin',
      isActive: true,
    });

    console.log('Admin user created successfully:');
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Password: Admin@123`);
    console.log(`  Role:     ${admin.role}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seedAdmin();
