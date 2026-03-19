// MongoDB Connection Test Script
// Run with: node test-mongodb-connection.js

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// Get connection string from .env
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ ERROR: MONGODB_URI not found in .env file');
  process.exit(1);
}

console.log('\n=== MongoDB Connection Test ===\n');
console.log('📍 Attempting to connect to MongoDB...');
console.log(`Connection String: ${uri.substring(0, 50)}...`);
console.log('⏳ Please wait...\n');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('[1/4] Connecting to MongoDB...');
    await client.connect();
    console.log('✅ [1/4] Connection established!');
    
    console.log('[2/4] Pinging MongoDB...');
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log('✅ [2/4] Ping successful!');
    
    console.log('[3/4] Listing databases...');
    const adminDb = client.db("admin");
    const databases = await adminDb.admin().listDatabases();
    console.log('✅ [3/4] Databases found:', databases.databases.map(db => db.name).join(', '));
    
    console.log('[4/4] Getting connection info...');
    const serverStatus = await client.db("admin").command({ serverStatus: 1 }).catch(() => null);
    if (serverStatus) {
      console.log('✅ [4/4] Server is responding');
    }
    
    console.log('\n✅✅✅ SUCCESS ✅✅✅');
    console.log('✅ MongoDB connection is working perfectly!');
    console.log('✅ Your backend should be able to connect now.');
    console.log('\nPossible reasons if this worked but backend still fails:');
    console.log('  1. Backend might have crashed (check logs)');
    console.log('  2. Backend might be on a different network IP');
    console.log('  3. Node.js process might not have proper .env loaded');
    
  } catch (error) {
    console.error('\n❌ ERROR: MongoDB Connection Failed!\n');
    console.error('Error details:');
    console.error(`  Type: ${error.name}`);
    console.error(`  Message: ${error.message}`);
    
    // Specific error diagnosis
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n🔍 Diagnosis: Cannot find MongoDB server (DNS issue)');
      console.error('  → Check your MONGODB_URI format in .env');
      console.error('  → Check internet connection');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n🔍 Diagnosis: Database user password is wrong');
      console.error('  → Check MONGODB_URI password in .env');
      console.error('  → Verify database user in MongoDB Atlas');
    } else if (error.message.includes('IP')) {
      console.error('\n🔍 Diagnosis: Your IP is not whitelisted');
      console.error('  → Add 192.168.201.13 to MongoDB Atlas Network Access');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔍 Diagnosis: Connection refused (firewall or cluster offline)');
      console.error('  → Check if MongoDB cluster is running in Atlas console');
      console.error('  → Check firewall settings');
    } else {
      console.error('\n🔍 Diagnosis: Connection issue');
      console.error('  → Check MongoDB Atlas console for cluster status');
      console.error('  → Verify all credentials');
    }
    
    console.error('\n📝 Full error stacktrace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('\n✅ Connection closed.');
  }
}

run().catch(console.dir);
