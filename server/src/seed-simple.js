const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');

const seed = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB\n');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@erp.com' });
    
    if (!adminExists) {
      console.log('Creating demo users...');
      await User.create([
        { name: 'System Admin', email: 'admin@erp.com', password: 'Admin@123456', role: 'Admin', department: 'Management' },
        { name: 'Sarah Johnson', email: 'sarah@erp.com', password: 'Sales@123456', role: 'Sales', department: 'Sales' },
        { name: 'Mike Chen', email: 'mike@erp.com', password: 'Purchase@123456', role: 'Purchase', department: 'Procurement' },
        { name: 'Lisa Park', email: 'lisa@erp.com', password: 'Inventory@123456', role: 'Inventory', department: 'Warehouse' },
        { name: 'John Viewer', email: 'john@erp.com', password: 'Viewer@123456', role: 'Viewer', department: 'Management' },
      ]);
      console.log('✅ Users created\n');
    } else {
      console.log('✅ Users already exist\n');
    }

    // Create demo customers
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      console.log('Creating demo customers...');
      await Customer.create([
        { name: 'Acme Corp', email: 'contact@acme.com', phone: '0300-1111111', city: 'Karachi', country: 'Pakistan', address: '123 Business St' },
        { name: 'Global Traders', email: 'info@globaltraders.com', phone: '0300-2222222', city: 'Lahore', country: 'Pakistan', address: '456 Trade Ave' },
        { name: 'Tech Solutions', email: 'sales@techsol.com', phone: '0300-3333333', city: 'Islamabad', country: 'Pakistan', address: '789 Tech Park' },
      ]);
      console.log('✅ Customers created\n');
    }

    // Create demo suppliers
    const supplierCount = await Supplier.countDocuments();
    if (supplierCount === 0) {
      console.log('Creating demo suppliers...');
      await Supplier.create([
        { name: 'Tech Supplies Ltd', email: 'sales@techsupplies.com', phone: '0300-4444444', city: 'Karachi', country: 'Pakistan', address: '111 Supply Way' },
        { name: 'Wholesale Distributors', email: 'orders@wholesale.com', phone: '0300-5555555', city: 'Lahore', country: 'Pakistan', address: '222 Distribution Rd' },
      ]);
      console.log('✅ Suppliers created\n');
    }

    // Create demo products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Creating demo products...');
      const admin = await User.findOne({ email: 'admin@erp.com' });
      await Product.create([
        { title: 'Wireless Keyboard', sku: 'KB-001', category: 'Electronics', price: 49.99, stock: 150, reorderLevel: 20, unit: 'pcs', description: 'Ergonomic wireless keyboard', createdBy: admin._id },
        { title: 'USB-C Hub', sku: 'HUB-002', category: 'Electronics', price: 34.99, stock: 200, reorderLevel: 30, unit: 'pcs', description: '7-in-1 USB-C hub adapter', createdBy: admin._id },
        { title: 'Office Chair', sku: 'FRN-003', category: 'Furniture', price: 299.99, stock: 45, reorderLevel: 10, unit: 'pcs', description: 'Ergonomic office chair', createdBy: admin._id },
        { title: 'Standing Desk', sku: 'FRN-004', category: 'Furniture', price: 499.99, stock: 25, reorderLevel: 5, unit: 'pcs', description: 'Electric height-adjustable desk', createdBy: admin._id },
        { title: 'LED Monitor 27"', sku: 'MON-005', category: 'Electronics', price: 349.99, stock: 80, reorderLevel: 15, unit: 'pcs', description: '27 inch 4K LED monitor', createdBy: admin._id },
        { title: 'Paper A4 (500 sheets)', sku: 'SUP-006', category: 'Supplies', price: 8.99, stock: 500, reorderLevel: 100, unit: 'reams', description: 'Premium A4 printer paper', createdBy: admin._id },
        { title: 'Marker Set', sku: 'SUP-007', category: 'Supplies', price: 12.99, stock: 300, reorderLevel: 50, unit: 'sets', description: 'Assorted whiteboard markers', createdBy: admin._id },
        { title: 'Laptop Stand', sku: 'ACC-008', category: 'Accessories', price: 59.99, stock: 120, reorderLevel: 25, unit: 'pcs', description: 'Aluminum adjustable stand', createdBy: admin._id },
        { title: 'Noise-Cancelling Headset', sku: 'AUD-009', category: 'Electronics', price: 89.99, stock: 5, reorderLevel: 15, unit: 'pcs', description: 'Bluetooth ANC headset', createdBy: admin._id },
        { title: 'HD Webcam 1080p', sku: 'CAM-010', category: 'Electronics', price: 69.99, stock: 8, reorderLevel: 20, unit: 'pcs', description: 'Full HD webcam with mic', createdBy: admin._id },
      ]);
      console.log('✅ Products created\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!\n');
    console.log('Demo Login Credentials:');
    console.log('  🔑 Admin:       admin@erp.com     / Admin@123456');
    console.log('  🔑 Sales:       sarah@erp.com     / Sales@123456');
    console.log('  🔑 Purchase:    mike@erp.com      / Purchase@123456');
    console.log('  🔑 Inventory:   lisa@erp.com      / Inventory@123456');
    console.log('  🔑 Viewer:      john@erp.com      / Viewer@123456');
    console.log('\n⚠️  IMPORTANT: Change these passwords immediately in production!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
