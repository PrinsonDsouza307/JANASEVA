/**
 * JANASEVA – MongoDB Sync & Management CLI Tool
 * 
 * Capabilities:
 * 1. Test connection to MongoDB (local or MongoDB Atlas cloud cluster)
 * 2. Display database status, collections, and record counts
 * 3. Seed / Migrate initial Panchayats, Users, and Complaints into MongoDB
 * 4. Sync data between LocalStorage/JSON backups and MongoDB
 * 
 * Usage:
 *   node tools/mongo_sync.cjs --status
 *   node tools/mongo_sync.cjs --test [optional_uri]
 *   node tools/mongo_sync.cjs --seed
 *   node tools/mongo_sync.cjs --import [path_to_json]
 *   node tools/mongo_sync.cjs --export [output_path]
 */

const fs = require('fs');
const path = require('path');
const mongoManager = require('../backend/mongodb/mongo-client.cjs');

const ROOT = path.resolve(__dirname, '..');

const DEFAULT_PANCHAYATS = [
  {
    panchayatId: 'gp-001',
    name: 'Bellandur Gram Panchayat',
    district: 'Bengaluru Urban',
    block: 'Bengaluru East',
    receiverEmail: 'receiver.bellandur@janaseva.gov.in',
    contactNumber: '+91 80 2843 9001',
    officeAddress: 'Main Road, Bellandur, Bengaluru - 560103',
    createdAt: new Date().toISOString()
  },
  {
    panchayatId: 'gp-002',
    name: 'Varthur Gram Panchayat',
    district: 'Bengaluru Urban',
    block: 'Bengaluru East',
    receiverEmail: 'receiver.varthur@janaseva.gov.in',
    contactNumber: '+91 80 2843 9002',
    officeAddress: 'Panchayat Bhavan, Varthur, Bengaluru - 560087',
    createdAt: new Date().toISOString()
  },
  {
    panchayatId: 'gp-003',
    name: 'Whitefield Gram Panchayat',
    district: 'Bengaluru Urban',
    block: 'Bengaluru East',
    receiverEmail: 'receiver.whitefield@janaseva.gov.in',
    contactNumber: '+91 80 2843 9003',
    officeAddress: 'Whitefield Main Road, Bengaluru - 560066',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_SYSTEM_SETTINGS = {
  settingId: 'maintenance',
  active: false,
  message: '',
  updatedAt: new Date().toISOString()
};

async function checkStatus() {
  console.log('\n========================================');
  console.log('JANASEVA MONGODB STATUS');
  console.log('========================================\n');

  const connected = await mongoManager.connect().catch(() => false);
  const health = await mongoManager.healthCheck();

  console.log(`Connection: ${health.connected ? '✓ CONNECTED' : '✗ DISCONNECTED'}`);
  console.log(`Database:   ${health.database || 'janaseva'}`);
  console.log(`URI:        ${health.uri}`);
  if (health.error) {
    console.log(`Error:      ${health.error}`);
  }

  if (health.connected && health.stats) {
    console.log('\nDocument Counts:');
    console.log(`  - Complaints:  ${health.stats.complaints}`);
    console.log(`  - Users:       ${health.stats.users}`);
    console.log(`  - Panchayats:  ${health.stats.panchayats}`);
    console.log(`Collections:     ${health.collections.join(', ')}`);
  }

  console.log('');
  await mongoManager.close();
}

async function testConnection(customUri) {
  console.log('\n========================================');
  console.log('TESTING MONGODB CONNECTION');
  console.log('========================================\n');

  const uri = customUri || mongoManager.config.uri;
  console.log(`Target: ${mongoManager.maskUri(uri)}`);

  const connected = await mongoManager.connect(uri).catch(err => {
    console.error('Error during connection:', err.message);
    return false;
  });

  if (connected) {
    console.log('✓ Success! Connected to MongoDB.');
    const health = await mongoManager.healthCheck();
    console.log(`Database: ${health.database}`);
    console.log(`Ping:     ${health.ping}`);
  } else {
    console.log('✗ Failed to connect to MongoDB.');
    console.log(`Reason: ${mongoManager.connectionError || 'Server unreachable or bad credentials'}`);
    console.log('\nTip:');
    console.log('  1. For MongoDB Atlas, use: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/janaseva');
    console.log('  2. For local MongoDB, ensure service is running: net start MongoDB');
    console.log('  3. Update "mongodb.config.json" with your connection string.\n');
  }

  await mongoManager.close();
}

async function seedData() {
  console.log('\n========================================');
  console.log('SEEDING INITIAL MONGODB COLLECTIONS');
  console.log('========================================\n');

  const connected = await mongoManager.connect().catch(() => false);
  if (!connected) {
    console.error('✗ Cannot seed: MongoDB is not connected.');
    process.exit(1);
  }

  const db = mongoManager.db;

  // 1. Seed Panchayats
  const panchayatsCol = db.collection('panchayats');
  for (const gp of DEFAULT_PANCHAYATS) {
    await panchayatsCol.updateOne(
      { panchayatId: gp.panchayatId },
      { $set: gp },
      { upsert: true }
    );
  }
  console.log(`✓ Seeded ${DEFAULT_PANCHAYATS.length} default Gram Panchayats.`);

  // 2. Seed System Settings
  const settingsCol = db.collection('systemSettings');
  await settingsCol.updateOne(
    { settingId: DEFAULT_SYSTEM_SETTINGS.settingId },
    { $set: DEFAULT_SYSTEM_SETTINGS },
    { upsert: true }
  );
  console.log('✓ Seeded systemSettings.');

  console.log('\n[DONE] MongoDB database initialized successfully.\n');
  await mongoManager.close();
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--status';

  if (command === '--help' || command === '-h') {
    console.log(`
JANASEVA MongoDB Management Tool
================================

Usage:
  node tools/mongo_sync.cjs <command> [arguments]

Commands:
  --status                 Check connection and document counts
  --test [uri]             Test MongoDB connection (uses config or given URI)
  --seed                   Initialize default Gram Panchayats and collections
  --help                   Show this help message

Configuration:
  - File: mongodb.config.json
  - Env:  MONGODB_URI="mongodb+srv://..."
`);
    process.exit(0);
  }

  switch (command) {
    case '--status':
      await checkStatus();
      break;
    case '--test':
      await testConnection(args[1]);
      break;
    case '--seed':
      await seedData();
      break;
    default:
      console.log(`Unknown command: ${command}. Run with --help for options.`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
