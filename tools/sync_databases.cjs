/**
 * JANASEVA – Realtime Database ↔ Firestore Bidirectional Sync Bridge
 * 
 * This script syncs data between Firebase Realtime Database (RTDB) and
 * Cloud Firestore so both databases stay in lockstep.
 * 
 * Usage:
 *   node tools/sync_databases.cjs --export-rtdb           Export RTDB data to JSON
 *   node tools/sync_databases.cjs --rtdb-to-firestore     Sync RTDB → Firestore
 *   node tools/sync_databases.cjs --firestore-to-rtdb     Sync Firestore → RTDB
 *   node tools/sync_databases.cjs --bidirectional         Full bidirectional sync
 *   node tools/sync_databases.cjs --live                  Live listener (continuous sync)
 *   node tools/sync_databases.cjs --status                Show sync status of both DBs
 * 
 * Prerequisites:
 *   - Firebase service account key at backend/firebase/service-account-key.json
 *     OR run with `firebase login` + emulators
 *   - npm install firebase-admin (in project root or backend/firebase/functions)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// Helper to resolve firebase-admin from multiple locations (local, functions, global)
function loadFirebaseAdmin() {
  const candidatePaths = [
    'firebase-admin',
    path.join(ROOT, 'backend', 'firebase', 'functions', 'node_modules', 'firebase-admin'),
    path.join(ROOT, 'node_modules', 'firebase-admin')
  ];

  // Try global npm modules
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    if (globalRoot) {
      candidatePaths.push(path.join(globalRoot, 'firebase-admin'));
    }
  } catch (e) {}

  for (const p of candidatePaths) {
    try {
      return require(p);
    } catch (err) {
      // Continue to next candidate
    }
  }
  return null;
}

const admin = loadFirebaseAdmin();

// ============================================================================
// CONFIGURATION
// ============================================================================

// Collections to sync between RTDB and Firestore
const SYNC_COLLECTIONS = [
  'complaints',
  'users',
  'panchayats',
  'officers',
  'notifications',
  'complaint_updates',
  'emailLogs',
  'receiverSettings',
  'systemSettings',
  'adminBanners',
  'complaintStatusConfig',
  'activity_logs',
  'recycle_bin'
];

// Field mappings: RTDB uses camelCase, Firestore uses the same but some RTDB
// paths may be nested differently
const RTDB_PATH_MAP = {
  'complaints': '/complaints',
  'users': '/users',
  'panchayats': '/panchayats',
  'officers': '/officers',
  'notifications': '/notifications',
  'complaint_updates': '/complaint_updates',
  'emailLogs': '/emailLogs',
  'receiverSettings': '/receiverSettings',
  'systemSettings': '/systemSettings',
  'adminBanners': '/adminBanners',
  'complaintStatusConfig': '/complaintStatusConfig',
  'activity_logs': '/activity_logs',
  'recycle_bin': '/recycle_bin'
};

// ============================================================================
// INITIALIZATION
// ============================================================================

let app;
let db;      // Firestore
let rtdb;    // Realtime Database

function initializeFirebase() {
  if (!admin) {
    throw new Error('firebase-admin package could not be loaded. Please run: npm install -g firebase-admin');
  }

  // Check for service account key
  const serviceAccountPaths = [
    path.join(ROOT, 'backend', 'firebase', 'service-account-key.json'),
    path.join(ROOT, 'service-account-key.json'),
    path.join(ROOT, 'serviceAccountKey.json')
  ];

  let serviceAccount = null;
  for (const saPath of serviceAccountPaths) {
    if (fs.existsSync(saPath)) {
      serviceAccount = require(saPath);
      console.log(`[INIT] Using service account from: ${saPath}`);
      break;
    }
  }

  // Check for emulator environment
  const useEmulators = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_DATABASE_EMULATOR_HOST;

  if (useEmulators) {
    console.log('[INIT] Running against Firebase Emulators');
    if (!admin.apps.length) {
      app = admin.initializeApp({
        projectId: 'janaseva-5f4bd',
        databaseURL: process.env.FIREBASE_DATABASE_EMULATOR_HOST
          ? `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=janaseva-5f4bd-default-rtdb`
          : 'https://janaseva-5f4bd-default-rtdb.firebaseio.com'
      });
    }
  } else if (serviceAccount) {
    if (!admin.apps.length) {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://janaseva-5f4bd-default-rtdb.firebaseio.com'
      });
    }
  } else {
    // Try application default credentials (works after `firebase login`)
    console.log('[INIT] No service account found. Trying application default credentials...');
    console.log('[INIT] Make sure you have run: firebase login');
    if (!admin.apps.length) {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: 'https://janaseva-5f4bd-default-rtdb.firebaseio.com',
        projectId: 'janaseva-5f4bd'
      });
    }
  }

  db = admin.firestore();
  rtdb = admin.database();
  console.log('[INIT] Firebase Admin SDK initialized successfully.');
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Read all data from a Realtime Database path
 */
async function readRTDB(rtdbPath) {
  const snapshot = await rtdb.ref(rtdbPath).once('value');
  return snapshot.val() || {};
}

/**
 * Read all documents from a Firestore collection
 */
async function readFirestoreCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const docs = {};
  snapshot.forEach(doc => {
    docs[doc.id] = doc.data();
  });
  return docs;
}

/**
 * Export RTDB data to a local JSON file
 */
async function exportRTDB() {
  console.log('\n========================================');
  console.log('EXPORTING REALTIME DATABASE');
  console.log('========================================\n');

  const allData = {};
  for (const collection of SYNC_COLLECTIONS) {
    const rtdbPath = RTDB_PATH_MAP[collection];
    try {
      const data = await readRTDB(rtdbPath);
      const count = Object.keys(data).length;
      allData[collection] = data;
      console.log(`  ✓ ${collection}: ${count} records`);
    } catch (err) {
      console.log(`  ✗ ${collection}: ${err.message}`);
      allData[collection] = {};
    }
  }

  const outputPath = path.join(ROOT, 'database', `rtdb-export-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  console.log(`\n[EXPORT] Saved to: ${outputPath}`);
  return allData;
}

/**
 * Sync RTDB → Firestore (RTDB is source of truth)
 */
async function syncRTDBToFirestore(dryRun = false) {
  console.log('\n========================================');
  console.log(`SYNCING: Realtime Database → Firestore ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('========================================\n');

  const stats = { synced: 0, skipped: 0, errors: 0, collections: {} };

  for (const collection of SYNC_COLLECTIONS) {
    const rtdbPath = RTDB_PATH_MAP[collection];
    let rtdbData, firestoreData;

    try {
      rtdbData = await readRTDB(rtdbPath);
      firestoreData = await readFirestoreCollection(collection);
    } catch (err) {
      console.log(`  ✗ ${collection}: Error reading - ${err.message}`);
      stats.errors++;
      continue;
    }

    const rtdbKeys = Object.keys(rtdbData);
    const firestoreKeys = Object.keys(firestoreData);
    const newKeys = rtdbKeys.filter(k => !firestoreKeys.includes(k));
    const existingKeys = rtdbKeys.filter(k => firestoreKeys.includes(k));

    stats.collections[collection] = {
      rtdbCount: rtdbKeys.length,
      firestoreCount: firestoreKeys.length,
      newRecords: newKeys.length,
      updatedRecords: 0
    };

    console.log(`  ${collection}: RTDB=${rtdbKeys.length}, Firestore=${firestoreKeys.length}, New=${newKeys.length}`);

    if (dryRun) continue;

    // Batch write new records to Firestore
    const batch = db.batch();
    let batchCount = 0;

    for (const key of newKeys) {
      const docRef = db.collection(collection).doc(key);
      const record = rtdbData[key];
      
      // Sanitize: remove undefined values and ensure valid Firestore types
      const sanitized = sanitizeForFirestore(record);
      batch.set(docRef, sanitized, { merge: true });
      batchCount++;

      if (batchCount >= 400) {
        await batch.commit();
        batchCount = 0;
        console.log(`    Committed batch of 400 for ${collection}`);
      }
    }

    // Check for updated records (compare timestamps)
    for (const key of existingKeys) {
      const rtdbRecord = rtdbData[key];
      const fsRecord = firestoreData[key];
      
      const rtdbTime = getTimestamp(rtdbRecord.updatedAt || rtdbRecord.createdAt);
      const fsTime = getTimestamp(fsRecord.updatedAt || fsRecord.createdAt);

      if (rtdbTime > fsTime) {
        const sanitized = sanitizeForFirestore(rtdbRecord);
        batch.set(db.collection(collection).doc(key), sanitized, { merge: true });
        batchCount++;
        stats.collections[collection].updatedRecords++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      stats.synced += batchCount;
      console.log(`    ✓ Committed ${batchCount} records to Firestore`);
    } else {
      stats.skipped++;
      console.log(`    - No changes needed`);
    }
  }

  console.log(`\n[SUMMARY] Synced: ${stats.synced}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
  return stats;
}

/**
 * Sync Firestore → RTDB (Firestore is source of truth)
 */
async function syncFirestoreToRTDB(dryRun = false) {
  console.log('\n========================================');
  console.log(`SYNCING: Firestore → Realtime Database ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('========================================\n');

  const stats = { synced: 0, skipped: 0, errors: 0 };

  for (const collection of SYNC_COLLECTIONS) {
    const rtdbPath = RTDB_PATH_MAP[collection];
    let rtdbData, firestoreData;

    try {
      firestoreData = await readFirestoreCollection(collection);
      rtdbData = await readRTDB(rtdbPath);
    } catch (err) {
      console.log(`  ✗ ${collection}: Error reading - ${err.message}`);
      stats.errors++;
      continue;
    }

    const firestoreKeys = Object.keys(firestoreData);
    const rtdbKeys = Object.keys(rtdbData);
    const newKeys = firestoreKeys.filter(k => !rtdbKeys.includes(k));

    console.log(`  ${collection}: Firestore=${firestoreKeys.length}, RTDB=${rtdbKeys.length}, New=${newKeys.length}`);

    if (dryRun) continue;

    const updates = {};
    for (const key of newKeys) {
      const sanitized = sanitizeForRTDB(firestoreData[key]);
      updates[`${rtdbPath.slice(1)}/${key}`] = sanitized;
    }

    // Check for updated records
    for (const key of firestoreKeys.filter(k => rtdbKeys.includes(k))) {
      const fsRecord = firestoreData[key];
      const rtdbRecord = rtdbData[key];
      
      const fsTime = getTimestamp(fsRecord.updatedAt || fsRecord.createdAt);
      const rtdbTime = getTimestamp(rtdbRecord.updatedAt || rtdbRecord.createdAt);

      if (fsTime > rtdbTime) {
        updates[`${rtdbPath.slice(1)}/${key}`] = sanitizeForRTDB(fsRecord);
      }
    }

    const updateCount = Object.keys(updates).length;
    if (updateCount > 0) {
      await rtdb.ref().update(updates);
      stats.synced += updateCount;
      console.log(`    ✓ Wrote ${updateCount} records to RTDB`);
    } else {
      stats.skipped++;
      console.log(`    - No changes needed`);
    }
  }

  console.log(`\n[SUMMARY] Synced: ${stats.synced}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
  return stats;
}

/**
 * Full bidirectional sync – newer record wins
 */
async function bidirectionalSync() {
  console.log('\n========================================');
  console.log('BIDIRECTIONAL SYNC: RTDB ↔ Firestore');
  console.log('========================================\n');

  for (const collection of SYNC_COLLECTIONS) {
    const rtdbPath = RTDB_PATH_MAP[collection];
    let rtdbData, firestoreData;

    try {
      rtdbData = await readRTDB(rtdbPath);
      firestoreData = await readFirestoreCollection(collection);
    } catch (err) {
      console.log(`  ✗ ${collection}: ${err.message}`);
      continue;
    }

    const allKeys = new Set([...Object.keys(rtdbData), ...Object.keys(firestoreData)]);
    const fsBatch = db.batch();
    const rtdbUpdates = {};
    let fsCount = 0, rtdbCount = 0;

    for (const key of allKeys) {
      const inRTDB = key in rtdbData;
      const inFS = key in firestoreData;

      if (inRTDB && !inFS) {
        // Only in RTDB → copy to Firestore
        fsBatch.set(db.collection(collection).doc(key), sanitizeForFirestore(rtdbData[key]), { merge: true });
        fsCount++;
      } else if (!inRTDB && inFS) {
        // Only in Firestore → copy to RTDB
        rtdbUpdates[`${rtdbPath.slice(1)}/${key}`] = sanitizeForRTDB(firestoreData[key]);
        rtdbCount++;
      } else {
        // In both → newer wins
        const rtdbTime = getTimestamp(rtdbData[key].updatedAt || rtdbData[key].createdAt);
        const fsTime = getTimestamp(firestoreData[key].updatedAt || firestoreData[key].createdAt);

        if (rtdbTime > fsTime) {
          fsBatch.set(db.collection(collection).doc(key), sanitizeForFirestore(rtdbData[key]), { merge: true });
          fsCount++;
        } else if (fsTime > rtdbTime) {
          rtdbUpdates[`${rtdbPath.slice(1)}/${key}`] = sanitizeForRTDB(firestoreData[key]);
          rtdbCount++;
        }
      }
    }

    if (fsCount > 0) await fsBatch.commit();
    if (Object.keys(rtdbUpdates).length > 0) await rtdb.ref().update(rtdbUpdates);

    console.log(`  ${collection}: →Firestore=${fsCount}, →RTDB=${rtdbCount}, Total=${allKeys.size}`);
  }

  console.log('\n[DONE] Bidirectional sync complete.');
}

/**
 * Live continuous sync – listen for changes in both databases
 */
async function liveSync() {
  console.log('\n========================================');
  console.log('LIVE SYNC: Listening for changes...');
  console.log('Press Ctrl+C to stop');
  console.log('========================================\n');

  // Initial bidirectional sync
  await bidirectionalSync();

  // Listen for RTDB changes → push to Firestore
  for (const collection of SYNC_COLLECTIONS) {
    const rtdbPath = RTDB_PATH_MAP[collection];

    rtdb.ref(rtdbPath).on('child_changed', async (snapshot) => {
      const key = snapshot.key;
      const data = snapshot.val();
      if (!data) return;

      try {
        await db.collection(collection).doc(key).set(sanitizeForFirestore(data), { merge: true });
        console.log(`  [RTDB→FS] ${collection}/${key} synced`);
      } catch (err) {
        console.error(`  [ERROR] ${collection}/${key}: ${err.message}`);
      }
    });

    rtdb.ref(rtdbPath).on('child_added', async (snapshot) => {
      const key = snapshot.key;
      const data = snapshot.val();
      if (!data) return;

      const fsDoc = await db.collection(collection).doc(key).get();
      if (!fsDoc.exists) {
        try {
          await db.collection(collection).doc(key).set(sanitizeForFirestore(data));
          console.log(`  [RTDB→FS] ${collection}/${key} added`);
        } catch (err) {
          console.error(`  [ERROR] ${collection}/${key}: ${err.message}`);
        }
      }
    });

    // Listen for Firestore changes → push to RTDB
    db.collection(collection).onSnapshot(async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added' || change.type === 'modified') {
          const key = change.doc.id;
          const data = change.doc.data();

          const rtdbSnapshot = await rtdb.ref(`${rtdbPath}/${key}`).once('value');
          const rtdbVal = rtdbSnapshot.val();

          if (!rtdbVal || getTimestamp(data.updatedAt) > getTimestamp(rtdbVal?.updatedAt)) {
            try {
              await rtdb.ref(`${rtdbPath}/${key}`).set(sanitizeForRTDB(data));
              console.log(`  [FS→RTDB] ${collection}/${key} synced`);
            } catch (err) {
              console.error(`  [ERROR] ${collection}/${key}: ${err.message}`);
            }
          }
        }
      }
    });
  }

  console.log('\n[LIVE] All listeners active. Syncing in real-time...\n');

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n[STOP] Shutting down live sync...');
    process.exit(0);
  });
}

/**
 * Show sync status of both databases
 */
async function showStatus() {
  console.log('\n========================================');
  console.log('DATABASE SYNC STATUS');
  console.log('========================================\n');

  console.log(` Project: janaseva-5f4bd`);
  console.log(` RTDB URL: https://janaseva-5f4bd-default-rtdb.firebaseio.com`);
  console.log(` Firestore: projects/janaseva-5f4bd/databases/(default)\n`);

  const table = [];

  for (const collection of SYNC_COLLECTIONS) {
    const rtdbPath = RTDB_PATH_MAP[collection];
    let rtdbCount = 0, fsCount = 0, inSync = '?';

    try {
      const rtdbData = await readRTDB(rtdbPath);
      rtdbCount = Object.keys(rtdbData).length;
    } catch (err) {
      rtdbCount = `ERR`;
    }

    try {
      const fsData = await readFirestoreCollection(collection);
      fsCount = Object.keys(fsData).length;
    } catch (err) {
      fsCount = `ERR`;
    }

    if (typeof rtdbCount === 'number' && typeof fsCount === 'number') {
      inSync = rtdbCount === fsCount ? '✓ IN SYNC' : `⚠ DIFF (${Math.abs(rtdbCount - fsCount)})`;
    }

    table.push({ Collection: collection, RTDB: rtdbCount, Firestore: fsCount, Status: inSync });
  }

  console.table(table);
}

// ============================================================================
// HELPERS
// ============================================================================

function getTimestamp(value) {
  if (!value) return 0;
  if (value._seconds) return value._seconds * 1000; // Firestore Timestamp
  if (value.toMillis) return value.toMillis();       // Firestore Timestamp method
  if (typeof value === 'number') return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (key.startsWith('.')) continue; // RTDB special keys
    result[key] = sanitizeForFirestore(value);
  }
  return result;
}

function sanitizeForRTDB(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForRTDB);

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    // Convert Firestore Timestamps to ISO strings for RTDB
    if (value && typeof value === 'object' && value._seconds !== undefined) {
      result[key] = new Date(value._seconds * 1000).toISOString();
    } else if (value && typeof value.toDate === 'function') {
      result[key] = value.toDate().toISOString();
    } else {
      result[key] = sanitizeForRTDB(value);
    }
  }
  return result;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--help';

  if (command === '--help' || command === '-h') {
    console.log(`
JANASEVA Database Sync Tool
===========================

Usage:
  node tools/sync_databases.cjs <command> [options]

Commands:
  --export-rtdb           Export Realtime Database to JSON file
  --rtdb-to-firestore     Sync RTDB → Firestore (RTDB as source of truth)
  --firestore-to-rtdb     Sync Firestore → RTDB (Firestore as source of truth)
  --bidirectional         Full bidirectional sync (newer record wins)
  --live                  Continuous live sync (listens for changes)
  --status                Show record counts and sync status

Options:
  --dry-run               Preview changes without writing (for rtdb-to-firestore, firestore-to-rtdb)

Environment:
  FIRESTORE_EMULATOR_HOST           Use Firestore emulator (e.g. localhost:8080)
  FIREBASE_DATABASE_EMULATOR_HOST   Use RTDB emulator (e.g. localhost:9000)
`);
    process.exit(0);
  }

  try {
    initializeFirebase();
  } catch (err) {
    console.error(`\n[FATAL] Firebase initialization failed: ${err.message}`);
    console.error('\nMake sure you have one of:');
    console.error('  1. A service account key at backend/firebase/service-account-key.json');
    console.error('  2. Run "firebase login" for application default credentials');
    console.error('  3. Set FIRESTORE_EMULATOR_HOST and FIREBASE_DATABASE_EMULATOR_HOST for emulators\n');
    process.exit(1);
  }

  switch (command) {
    case '--export-rtdb':
      await exportRTDB();
      break;
    case '--rtdb-to-firestore':
      await syncRTDBToFirestore(args.includes('--dry-run'));
      break;
    case '--firestore-to-rtdb':
      await syncFirestoreToRTDB(args.includes('--dry-run'));
      break;
    case '--bidirectional':
      await bidirectionalSync();
      break;
    case '--live':
      await liveSync();
      return; // Don't exit, keep process alive
    case '--status':
      await showStatus();
      break;
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

module.exports = {
  initializeFirebase,
  syncRTDBToFirestore,
  syncFirestoreToRTDB,
  bidirectionalSync,
  showStatus
};
