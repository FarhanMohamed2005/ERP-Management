const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');
const SalesOrder = require('./models/SalesOrder');
const PurchaseOrder = require('./models/PurchaseOrder');
const Quotation = require('./models/Quotation');
const Expense = require('./models/Expense');
const Setting = require('./models/Setting');

const seed = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const arg = process.argv[2];
    if (arg === '--reset') {
      console.log('Resetting all data...');
      await Promise.all([
        User.deleteMany({}),
        Customer.deleteMany({}),
        Supplier.deleteMany({}),
        Product.deleteMany({}),
        SalesOrder.deleteMany({}),
        PurchaseOrder.deleteMany({}),
        Quotation.deleteMany({}),
        Expense.deleteMany({}),
        Setting.deleteMany({}),
      ]);
      console.log('All collections cleared.');
    }

    // ── Users ──
    const existingAdmin = await User.findOne({ email: 'admin@erp.com' });
    let users;
    if (existingAdmin) {
      console.log('Users already exist — skipping user seed.');
      users = await User.find({});
    } else {
      console.log('Creating users...');
      users = await User.create([
        { name: 'System Admin', email: 'admin@erp.com', password: 'Admin@123', role: 'Admin', department: 'Management' },
        { name: 'Sarah Johnson', email: 'sarah@erp.com', password: 'Sales@123', role: 'Sales', department: 'Sales' },
        { name: 'Mike Chen', email: 'mike@erp.com', password: 'Purchase@123', role: 'Purchase', department: 'Procurement' },
        { name: 'Lisa Park', email: 'lisa@erp.com', password: 'Inventory@123', role: 'Inventory', department: 'Warehouse' },
      ]);
      console.log(`  Created ${users.length} users`);
    }

    const admin = users.find((u) => u.role === 'Admin') || users[0];
    const salesUser = users.find((u) => u.role === 'Sales') || admin;

    // ── Customers ──
    const existingCustomers = await Customer.countDocuments();
    let customers;
    if (existingCustomers > 0) {
      console.log('Customers already exist — skipping.');
      customers = await Customer.find({});
    } else {
      console.log('Creating customers...');
      customers = await Customer.create([
        {
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          phone: '+1-555-0101',
          company: 'Acme Corp',
          address: { street: '123 Business Ave', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
        },
        {
          name: 'TechStart Inc',
          email: 'orders@techstart.io',
          phone: '+1-555-0202',
          company: 'TechStart Inc',
          address: { street: '456 Innovation Way', city: 'San Francisco', state: 'CA', zipCode: '94102', country: 'USA' },
        },
        {
          name: 'Global Traders LLC',
          email: 'procurement@globaltraders.com',
          phone: '+1-555-0303',
          company: 'Global Traders',
          address: { street: '789 Commerce Blvd', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA' },
        },
        {
          name: 'Summit Retail Group',
          email: 'buyer@summitretail.com',
          phone: '+1-555-0404',
          company: 'Summit Retail',
          address: { street: '321 Market St', city: 'Dallas', state: 'TX', zipCode: '75201', country: 'USA' },
        },
        {
          name: 'Marina Enterprises',
          email: 'info@marinaent.com',
          phone: '+1-555-0505',
          company: 'Marina Enterprises',
          address: { street: '654 Ocean Dr', city: 'Miami', state: 'FL', zipCode: '33101', country: 'USA' },
        },
      ]);
      console.log(`  Created ${customers.length} customers`);
    }

    // ── Suppliers ──
    const existingSuppliers = await Supplier.countDocuments();
    let suppliers;
    if (existingSuppliers > 0) {
      console.log('Suppliers already exist — skipping.');
      suppliers = await Supplier.find({});
    } else {
      console.log('Creating suppliers...');
      suppliers = await Supplier.create([
        {
          name: 'Prime Parts Co',
          email: 'sales@primeparts.com',
          phone: '+1-555-1001',
          company: 'Prime Parts',
          address: { street: '100 Industrial Park', city: 'Detroit', state: 'MI', zipCode: '48201', country: 'USA' },
        },
        {
          name: 'QuickShip Logistics',
          email: 'orders@quickship.com',
          phone: '+1-555-1002',
          company: 'QuickShip',
          address: { street: '200 Warehouse Rd', city: 'Memphis', state: 'TN', zipCode: '38101', country: 'USA' },
        },
        {
          name: 'TechSupply Direct',
          email: 'wholesale@techsupply.com',
          phone: '+1-555-1003',
          company: 'TechSupply Direct',
          address: { street: '300 Tech Lane', city: 'Austin', state: 'TX', zipCode: '73301', country: 'USA' },
        },
        {
          name: 'Pacific Materials Ltd',
          email: 'bulk@pacificmaterials.com',
          phone: '+1-555-1004',
          company: 'Pacific Materials',
          address: { street: '400 Harbor Blvd', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'USA' },
        },
      ]);
      console.log(`  Created ${suppliers.length} suppliers`);
    }

    // ── Products ──
    const existingProducts = await Product.countDocuments();
    let products;
    if (existingProducts > 0) {
      console.log('Products already exist — skipping.');
      products = await Product.find({});
    } else {
      console.log('Creating products...');
      products = await Product.create([
        { title: 'Wireless Keyboard', sku: 'KB-001', category: 'Electronics', price: 49.99, stock: 150, reorderLevel: 20, unit: 'pcs', description: 'Ergonomic wireless keyboard with backlit keys' },
        { title: 'USB-C Hub Adapter', sku: 'HUB-002', category: 'Electronics', price: 34.99, stock: 200, reorderLevel: 30, unit: 'pcs', description: '7-in-1 USB-C hub with HDMI and ethernet' },
        { title: 'Ergonomic Office Chair', sku: 'FRN-003', category: 'Furniture', price: 299.99, stock: 45, reorderLevel: 10, unit: 'pcs', description: 'Adjustable lumbar support office chair' },
        { title: 'Standing Desk', sku: 'FRN-004', category: 'Furniture', price: 499.99, stock: 25, reorderLevel: 5, unit: 'pcs', description: 'Electric height-adjustable standing desk' },
        { title: 'LED Monitor 27"', sku: 'MON-005', category: 'Electronics', price: 349.99, stock: 80, reorderLevel: 15, unit: 'pcs', description: '27 inch 4K IPS LED monitor' },
        { title: 'Printer Paper A4', sku: 'SUP-006', category: 'Supplies', price: 8.99, stock: 500, reorderLevel: 100, unit: 'reams', description: 'A4 white printer paper, 500 sheets per ream' },
        { title: 'Whiteboard Markers Set', sku: 'SUP-007', category: 'Supplies', price: 12.99, stock: 300, reorderLevel: 50, unit: 'sets', description: 'Assorted color dry-erase markers, 8-pack' },
        { title: 'Laptop Stand', sku: 'ACC-008', category: 'Accessories', price: 59.99, stock: 120, reorderLevel: 25, unit: 'pcs', description: 'Aluminum adjustable laptop stand' },
        { title: 'Noise-Cancelling Headset', sku: 'AUD-009', category: 'Electronics', price: 89.99, stock: 5, reorderLevel: 15, unit: 'pcs', description: 'Bluetooth ANC headset with microphone' },
        { title: 'Webcam HD 1080p', sku: 'CAM-010', category: 'Electronics', price: 69.99, stock: 8, reorderLevel: 20, unit: 'pcs', description: 'Full HD webcam with auto-focus and built-in mic' },
        { title: 'Desk Organizer', sku: 'SUP-011', category: 'Supplies', price: 24.99, stock: 200, reorderLevel: 30, unit: 'pcs', description: 'Multi-compartment desk organizer' },
        { title: 'Network Switch 8-Port', sku: 'NET-012', category: 'Electronics', price: 45.99, stock: 60, reorderLevel: 10, unit: 'pcs', description: 'Gigabit ethernet 8-port switch' },
      ]);
      console.log(`  Created ${products.length} products`);
    }

    // ── Sales Orders ──
    const existingOrders = await SalesOrder.countDocuments();
    if (existingOrders > 0) {
      console.log('Sales orders already exist — skipping.');
    } else {
      console.log('Creating sales orders...');
      const salesOrders = [];
      for (let i = 0; i < 5; i++) {
        const customer = customers[i % customers.length];
        const p1 = products[i % products.length];
        const p2 = products[(i + 3) % products.length];
        const statuses = ['Draft', 'Confirmed', 'Shipped', 'Delivered', 'Confirmed'];
        const so = new SalesOrder({
          customer: customer._id,
          items: [
            { product: p1._id, productTitle: p1.title, quantity: 2 + i, unitPrice: p1.price },
            { product: p2._id, productTitle: p2.title, quantity: 1 + i, unitPrice: p2.price },
          ],
          status: statuses[i],
          taxRate: 10,
          notes: `Sample sales order ${i + 1}`,
        });
        await so.save();
        salesOrders.push(so);
      }
      console.log(`  Created ${salesOrders.length} sales orders`);
    }

    // ── Purchase Orders ──
    const existingPOs = await PurchaseOrder.countDocuments();
    if (existingPOs > 0) {
      console.log('Purchase orders already exist — skipping.');
    } else {
      console.log('Creating purchase orders...');
      const purchaseOrders = [];
      for (let i = 0; i < 4; i++) {
        const supplier = suppliers[i % suppliers.length];
        const p1 = products[(i + 1) % products.length];
        const p2 = products[(i + 5) % products.length];
        const statuses = ['Draft', 'Approved', 'Ordered', 'Received'];
        const po = new PurchaseOrder({
          supplier: supplier._id,
          items: [
            { product: p1._id, productTitle: p1.title, quantity: 50 + i * 10, unitPrice: p1.price * 0.7 },
            { product: p2._id, productTitle: p2.title, quantity: 30 + i * 5, unitPrice: p2.price * 0.7 },
          ],
          status: statuses[i],
          tax: 50 + i * 10,
          notes: `Sample purchase order ${i + 1}`,
        });
        await po.save();
        purchaseOrders.push(po);
      }
      console.log(`  Created ${purchaseOrders.length} purchase orders`);
    }

    // ── Quotations ──
    const existingQuotes = await Quotation.countDocuments();
    if (existingQuotes > 0) {
      console.log('Quotations already exist — skipping.');
    } else {
      console.log('Creating quotations...');
      const quotations = [];
      for (let i = 0; i < 3; i++) {
        const customer = customers[i % customers.length];
        const p1 = products[(i + 2) % products.length];
        const statuses = ['Draft', 'Sent', 'Accepted'];
        const validDate = new Date();
        validDate.setDate(validDate.getDate() + 30);
        const qt = new Quotation({
          customer: customer._id,
          items: [
            { product: p1._id, productTitle: p1.title, quantity: 10 + i * 5, unitPrice: p1.price },
          ],
          status: statuses[i],
          taxRate: 10,
          validUntil: validDate,
          notes: `Sample quotation ${i + 1}`,
          createdBy: salesUser._id,
        });
        await qt.save();
        quotations.push(qt);
      }
      console.log(`  Created ${quotations.length} quotations`);
    }

    // ── Expenses ──
    const existingExpenses = await Expense.countDocuments();
    if (existingExpenses > 0) {
      console.log('Expenses already exist — skipping.');
    } else {
      console.log('Creating expenses...');
      const expenseData = [
        { category: 'Rent', amount: 5000, description: 'Monthly office rent - January', paymentMethod: 'Bank Transfer', status: 'Approved', vendor: 'Metro Properties' },
        { category: 'Utilities', amount: 450, description: 'Electricity bill - January', paymentMethod: 'Bank Transfer', status: 'Approved', vendor: 'City Power Co' },
        { category: 'Office Supplies', amount: 320, description: 'Printer cartridges and paper', paymentMethod: 'Credit Card', status: 'Approved', vendor: 'Office Depot' },
        { category: 'Software', amount: 1200, description: 'Annual CRM software subscription', paymentMethod: 'Credit Card', status: 'Approved', vendor: 'SaaS Cloud Inc' },
        { category: 'Travel', amount: 850, description: 'Client meeting travel expenses', paymentMethod: 'Cash', status: 'Pending', vendor: 'Various' },
        { category: 'Marketing', amount: 2500, description: 'Q1 digital marketing campaign', paymentMethod: 'Bank Transfer', status: 'Pending', vendor: 'AdPro Agency' },
        { category: 'Maintenance', amount: 175, description: 'Office AC maintenance', paymentMethod: 'Cash', status: 'Approved', vendor: 'CoolAir Services' },
        { category: 'Shipping', amount: 680, description: 'Bulk shipping for customer orders', paymentMethod: 'Bank Transfer', status: 'Approved', vendor: 'FedEx' },
      ];
      const expenses = [];
      for (const data of expenseData) {
        const exp = new Expense({ ...data, createdBy: admin._id, approvedBy: data.status === 'Approved' ? admin._id : undefined });
        await exp.save();
        expenses.push(exp);
      }
      console.log(`  Created ${expenses.length} expenses`);
    }

    // ── Default Settings ──
    const existingSettings = await Setting.countDocuments();
    if (existingSettings > 0) {
      console.log('Settings already exist — skipping.');
    } else {
      console.log('Creating default settings...');
      const defaults = [
        { key: 'companyName', value: 'ERP Management Co.', category: 'general', description: 'Company name' },
        { key: 'companyEmail', value: 'info@erpmanagement.com', category: 'general', description: 'Company email' },
        { key: 'companyPhone', value: '+1-555-0000', category: 'general', description: 'Company phone' },
        { key: 'companyAddress', value: '100 Business Ave, New York, NY 10001', category: 'general', description: 'Company address' },
        { key: 'currency', value: 'USD', category: 'general', description: 'Default currency' },
        { key: 'taxRate', value: 10, category: 'tax', description: 'Default tax rate percentage' },
        { key: 'invoicePrefix', value: 'INV-', category: 'invoice', description: 'Invoice number prefix' },
        { key: 'invoiceDueDays', value: 30, category: 'invoice', description: 'Default invoice due days' },
        { key: 'invoiceNotes', value: 'Thank you for your business!', category: 'invoice', description: 'Default invoice notes' },
        { key: 'lowStockAlert', value: true, category: 'notification', description: 'Enable low stock alerts' },
        { key: 'orderConfirmationEmail', value: true, category: 'notification', description: 'Send order confirmation emails' },
      ];
      await Setting.insertMany(defaults);
      console.log(`  Created ${defaults.length} settings`);
    }

    console.log('\n========================================');
    console.log('  Seed completed successfully!');
    console.log('========================================');
    console.log('\nLogin credentials:');
    console.log('  Admin:     admin@erp.com     / Admin@123');
    console.log('  Sales:     sarah@erp.com     / Sales@123');
    console.log('  Purchase:  mike@erp.com      / Purchase@123');
    console.log('  Inventory: lisa@erp.com      / Inventory@123');
    console.log('\nRun with --reset flag to clear all data first.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
