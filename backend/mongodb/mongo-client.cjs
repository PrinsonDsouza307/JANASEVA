/**
 * JANASEVA – MongoDB Database Client & Connection Manager
 * 
 * Provides:
 * 1. Resilient MongoDB connection pooling with auto-reconnect
 * 2. Collection schema validation and automatic index creation
 * 3. Configuration via MONGODB_URI environment variable or mongodb.config.json
 * 4. Diagnostics and connection health checks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');

// Helper to resolve mongodb package from multiple locations (global, local, node_modules)
function loadMongoDriver() {
  const candidates = [
    'mongodb',
    path.join(ROOT, 'node_modules', 'mongodb')
  ];

  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    if (globalRoot) {
      candidates.push(path.join(globalRoot, 'mongodb'));
    }
  } catch (e) {}

  for (const c of candidates) {
    try {
      return require(c);
    } catch (err) {}
  }
  return null;
}

const mongoModule = loadMongoDriver();
if (!mongoModule) {
  console.warn('[MONGODB] "mongodb" npm driver not found. Run: npm install -g mongodb');
}

const { MongoClient } = mongoModule || {};

class MongoDBManager {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.connectionError = null;
    this.config = this.loadConfig();
  }

  loadConfig() {
    // 1. Environment variables take highest priority
    const envUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const envDb = process.env.MONGODB_DB || process.env.MONGO_DB || 'janaseva';

    // 2. Fallback to mongodb.config.json
    let fileConfig = {};
    const configPath = path.join(ROOT, 'mongodb.config.json');
    if (fs.existsSync(configPath)) {
      try {
        fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        console.warn('[MONGODB] Could not parse mongodb.config.json:', e.message);
      }
    }

    // Unwrap if nested as { uri: { uri: "..." } }
    let resolvedUri = envUri || fileConfig.uri || 'mongodb://localhost:27017/janaseva';
    if (resolvedUri && typeof resolvedUri === 'object') {
      resolvedUri = resolvedUri.uri || 'mongodb://localhost:27017/janaseva';
    }

    return {
      uri: typeof resolvedUri === 'string' ? resolvedUri.trim() : 'mongodb://localhost:27017/janaseva',
      database: envDb || fileConfig.database || 'janaseva',
      options: fileConfig.options || {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000
      }
    };
  }

  async connect(customUri = null) {
    if (!MongoClient) {
      this.connectionError = 'MongoDB driver not installed';
      return false;
    }

    const uri = customUri || this.config.uri;
    const dbName = this.config.database;

    try {
      console.log(`[MONGODB] Connecting to: ${this.maskUri(uri)}...`);
      this.client = new MongoClient(uri, this.config.options);
      await this.client.connect();

      this.db = this.client.db(dbName);
      this.isConnected = true;
      this.connectionError = null;

      console.log(`[MONGODB] Connected successfully to database: "${dbName}"`);
      await this.ensureIndexes();
      return true;
    } catch (err) {
      this.isConnected = false;
      this.connectionError = err.message;
      console.warn(`[MONGODB] Connection failed: ${err.message}`);
      return false;
    }
  }

  async ensureIndexes() {
    if (!this.db) return;
    try {
      // 1. Complaints Collection
      const complaints = this.db.collection('complaints');
      await complaints.createIndex({ complaintId: 1 }, { unique: true });
      await complaints.createIndex({ userId: 1, createdAt: -1 });
      await complaints.createIndex({ panchayatId: 1, status: 1 });
      await complaints.createIndex({ citizenEmail: 1 });

      // 2. Users Collection
      const users = this.db.collection('users');
      await users.createIndex({ email: 1 }, { unique: true });
      await users.createIndex({ uid: 1 }, { unique: true, sparse: true });

      // 3. Panchayats Collection
      const panchayats = this.db.collection('panchayats');
      await panchayats.createIndex({ panchayatId: 1 }, { unique: true });

      // 4. Notifications Collection
      const notifications = this.db.collection('notifications');
      await notifications.createIndex({ userId: 1, createdAt: -1 });

      // 5. Activity Logs
      const activityLogs = this.db.collection('activity_logs');
      await activityLogs.createIndex({ timestamp: -1 });

      console.log('[MONGODB] Database indexes verified.');
    } catch (err) {
      console.warn('[MONGODB] Index creation warning:', err.message);
    }
  }

  isPlaceholderUri(uri) {
    if (!uri || typeof uri !== 'string') return true;
    return uri.includes('<username>') || uri.includes('<password>') ||
           uri.includes('YOUR_') || uri.includes('PLACEHOLDER') ||
           uri.includes('<') || uri.includes('>');
  }

  maskUri(uri) {
    if (!uri) return 'none';
    // Mask password in connection strings like mongodb+srv://user:pass@host/db
    return uri.replace(/(:\/\/)([^:]+):([^@]+)@/, '$1$2:****@');
  }

  getCollection(name) {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB is not connected. Check your connection string.');
    }
    return this.db.collection(name);
  }

  async healthCheck() {
    // Reload config from disk so user edits to mongodb.config.json take effect immediately
    if (!this.isConnected) {
      this.config = this.loadConfig();

      if (this.isPlaceholderUri(this.config.uri)) {
        return {
          status: 'CONFIG_NEEDS_CREDENTIALS',
          connected: false,
          uri: this.maskUri(this.config.uri),
          database: this.config.database,
          error: 'MongoDB connection string contains placeholders (<username>, <password>).',
          hint: 'Open mongodb.config.json and replace <username> and <password> with your actual MongoDB Atlas database user and password.'
        };
      }

      // Try connecting with updated config
      await this.connect();
    }

    if (!this.isConnected || !this.db) {
      return {
        status: 'DISCONNECTED',
        connected: false,
        uri: this.maskUri(this.config.uri),
        database: this.config.database,
        error: this.connectionError || 'Not connected'
      };
    }

    try {
      const pingResult = await this.db.command({ ping: 1 });
      const collections = await this.db.listCollections().toArray();
      const complaintCount = await this.db.collection('complaints').countDocuments();
      const userCount = await this.db.collection('users').countDocuments();
      const panchayatCount = await this.db.collection('panchayats').countDocuments();

      return {
        status: 'CONNECTED',
        connected: true,
        database: this.config.database,
        uri: this.maskUri(this.config.uri),
        ping: pingResult.ok === 1 ? 'OK' : 'FAILED',
        collections: collections.map(c => c.name),
        stats: {
          complaints: complaintCount,
          users: userCount,
          panchayats: panchayatCount
        }
      };
    } catch (err) {
      return {
        status: 'ERROR',
        connected: false,
        error: err.message
      };
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('[MONGODB] Connection closed.');
    }
  }
}

const instance = new MongoDBManager();

module.exports = instance;
