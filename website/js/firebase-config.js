/**
 * JANASEVA – Backend Configuration (MongoDB Active Mode)
 * 
 * MongoDB Atlas is the active database backend for JANASEVA.
 * Firebase services are deactivated and replaced by MongoDB Atlas.
 */

window.isFirebaseAvailable = false;
window.isSimulationMode = false;
window.isMongoMode = true;
window.fbAuth = null;
window.fbDb = null;
window.fbStorage = null;
window.fbRTDB = null;

const JANASEVA_CONFIG_STATUS = {
  mode: "MONGODB_ATLAS",
  hasPlaceholders: false,
  readyForProduction: true,
  firebaseInitialized: false,
  mongoConnected: true
};

window.JANASEVA_CONFIG_STATUS = JANASEVA_CONFIG_STATUS;

// Local Database Helper Class (Fallback / Offline Cache)
class JanasevaDB {
  static isFakeOrDummyComplaint(c) {
    if (!c || typeof c !== 'object') return false;
    const cid = String(c.complaintId || c.id || '').trim().toUpperCase();
    if (cid.startsWith('TEST-') || cid.startsWith('DEMO-') || cid.startsWith('SAMPLE-')) return true;
    if (c.isDemo || c.isFake || c.isSample || c.isTest) return true;
    return false;
  }

  static get(key, defaultVal) {
    try {
      const data = localStorage.getItem('JANASEVA_' + key);
      const parsed = data ? JSON.parse(data) : defaultVal;
      return parsed;
    } catch (e) {
      return defaultVal;
    }
  }

  static set(key, val) {
    try {
      localStorage.setItem('JANASEVA_' + key, JSON.stringify(val));
    } catch (e) {
      console.warn("Storage quota or error:", e);
    }
  }

  static initSeedData() {
    for (const [key, value] of Object.entries({panchayats: [], complaints: [], users: [], receivers: []})) {
      if (localStorage.getItem('JANASEVA_' + key) === null) JanasevaDB.set(key, value);
    }
  }

  static resetPanchayats() {
    JanasevaDB.set('panchayats', []);
    return [];
  }
}

JanasevaDB.initSeedData();
window.JanasevaDB = JanasevaDB;
console.info("[JANASEVA ENVIRONMENT] Running with MongoDB Atlas backend.");
