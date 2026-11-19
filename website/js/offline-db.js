/**
 * JANASEVA 2.0 – Offline-First Database & Synchronization Engine
 * Powered by IndexedDB (janaseva_offline_db)
 * 
 * Features:
 * 1. Structured IndexedDB stores for Drafts, Submission Queue, and Cached Records.
 * 2. Network connectivity monitoring with live UI banners.
 * 3. Automatic background synchronization with idempotent request IDs.
 * 4. PWA installation prompt controller.
 * 5. Conflict management between offline edits and server updates.
 */

class JanasevaOfflineDB {
  constructor() {
    this.dbName = 'janaseva_offline_db';
    this.dbVersion = 2;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.deferredPrompt = null;

    this.initIndexedDB();
    this.initNetworkListeners();
    this.initPWAInstall();
    setInterval(() => this.checkAndSyncQueue(), 30000);
    if (window.fbAuth) window.fbAuth.onAuthStateChanged(user => { if (user) this.checkAndSyncQueue(); });
    window.addEventListener('janaseva:authChanged', () => this.checkAndSyncQueue());
  }

  /**
   * Initialize IndexedDB with versioned object stores
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store 1: Offline Complaint Drafts
        if (!db.objectStoreNames.contains('complaintDrafts')) {
          const draftStore = db.createObjectStore('complaintDrafts', { keyPath: 'draftId' });
          draftStore.createIndex('userId', 'userId', { unique: false });
          draftStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store 2: Offline Submission Queue
        if (!db.objectStoreNames.contains('submissionQueue')) {
          const queueStore = db.createObjectStore('submissionQueue', { keyPath: 'requestId' });
          queueStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          queueStore.createIndex('userId', 'userId', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store 3: Cached Complaints for Offline Read
        if (!db.objectStoreNames.contains('cachedComplaints')) {
          const cacheStore = db.createObjectStore('cachedComplaints', { keyPath: 'complaintId' });
          cacheStore.createIndex('userId', 'userId', { unique: false });
          cacheStore.createIndex('panchayatId', 'panchayatId', { unique: false });
        }

        // Store 4: Offline Conflict & Audit Logs
        if (!db.objectStoreNames.contains('syncLogs')) {
          db.createObjectStore('syncLogs', { keyPath: 'logId', autoIncrement: true });
        }

        // Store 5: Offline Chat Session Sync Queue
        if (!db.objectStoreNames.contains('chatSyncQueue')) {
          const chatSyncStore = db.createObjectStore('chatSyncQueue', { keyPath: 'syncKey' });
          chatSyncStore.createIndex('userId', 'userId', { unique: false });
          chatSyncStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[JANASEVA Offline] IndexedDB initialized successfully.');
        this.checkAndSyncQueue();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[JANASEVA Offline] IndexedDB initialization failed:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async ensureDB() {
    if (this.db) return this.db;
    return this.initIndexedDB();
  }

  /**
   * Monitor online/offline events & render top warning strip
   */
  initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.renderNetworkBanner(true);
      console.log('[JANASEVA Offline] Network connectivity restored. Triggering queue sync...');
      this.checkAndSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.renderNetworkBanner(false);
      console.warn('[JANASEVA Offline] Device is now offline. Offline-first mode engaged.');
    });

    // Check initial network state when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.renderNetworkBanner(navigator.onLine));
    } else {
      this.renderNetworkBanner(navigator.onLine);
    }
  }

  /**
   * PWA Install Prompt Listener
   */
  initPWAInstall() {
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
      return;
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.renderInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      console.log('[JANASEVA PWA] JANASEVA app was installed successfully.');
      const btn = document.getElementById('pwa-install-banner');
      if (btn) btn.style.display = 'none';
    });
  }

  renderInstallButton() {
    let installBanner = document.getElementById('pwa-install-banner');
    if (!installBanner && document.body) {
      installBanner = document.createElement('div');
      installBanner.id = 'pwa-install-banner';
      installBanner.className = 'pwa-install-banner';
      installBanner.innerHTML = `
        <div class="pwa-install-content">
          <i class="fa-solid fa-mobile-screen-button"></i>
          <span>Install JANASEVA App for offline village access</span>
          <button type="button" class="btn-install-pwa" id="btn-trigger-pwa-install">Install</button>
          <button type="button" class="btn-dismiss-pwa" id="btn-dismiss-pwa">&times;</button>
        </div>
      `;
      document.body.prepend(installBanner);

      document.getElementById('btn-trigger-pwa-install').addEventListener('click', async () => {
        if (this.deferredPrompt) {
          this.deferredPrompt.prompt();
          const { outcome } = await this.deferredPrompt.userChoice;
          console.log(`[JANASEVA PWA] User response to install: ${outcome}`);
          this.deferredPrompt = null;
          installBanner.style.display = 'none';
        }
      });

      document.getElementById('btn-dismiss-pwa').addEventListener('click', () => {
        installBanner.style.display = 'none';
      });
    }
  }

  renderNetworkBanner(online) {
    let banner = document.getElementById('janaseva-network-banner');
    if (!banner && document.body) {
      banner = document.createElement('div');
      banner.id = 'janaseva-network-banner';
      banner.className = 'network-status-banner';
      document.body.prepend(banner);
    }

    if (!banner) return;

    if (!online) {
      banner.className = 'network-status-banner offline';
      banner.innerHTML = `
        <div class="network-banner-inner">
          <i class="fa-solid fa-wifi-slash"></i>
          <span><strong>Offline Mode:</strong> Internet connection unavailable. Grievance drafts and submissions are safely stored locally in IndexedDB and will synchronize automatically when online.</span>
        </div>
      `;
      banner.style.display = 'block';
    } else {
      // Temporarily display online restored banner then fade out
      if (banner.classList.contains('offline')) {
        banner.className = 'network-status-banner online';
        banner.innerHTML = `
          <div class="network-banner-inner">
            <i class="fa-solid fa-circle-check"></i>
            <span><strong>Online:</strong> Internet connectivity restored. All pending offline submissions are synchronizing with Gram Panchayat servers...</span>
          </div>
        `;
        setTimeout(() => {
          banner.style.display = 'none';
        }, 4000);
      } else {
        banner.style.display = 'none';
      }
    }
  }

  // ============================================================================
  // STORE OPERATIONS: DRAFTS
  // ============================================================================

  async saveDraft(draft) {
    const db = await this.ensureDB();
    if (!draft.draftId) {
      draft.draftId = 'draft-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
    }
    draft.updatedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('complaintDrafts', 'readwrite');
      const store = tx.objectStore('complaintDrafts');
      const req = store.put(draft);
      req.onsuccess = () => resolve(draft);
      req.onerror = () => reject(req.error);
    });
  }

  async getDraft(draftId) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('complaintDrafts', 'readonly');
      const store = tx.objectStore('complaintDrafts');
      const req = store.get(draftId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getUserDrafts(userId) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('complaintDrafts', 'readonly');
      const store = tx.objectStore('complaintDrafts');
      const index = store.index('userId');
      const req = index.getAll(userId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteDraft(draftId) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('complaintDrafts', 'readwrite');
      const store = tx.objectStore('complaintDrafts');
      const req = store.delete(draftId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // ============================================================================
  // STORE OPERATIONS: SUBMISSION QUEUE (IDEMPOTENT)
  // ============================================================================

  /**
   * Queue a complaint for submission when offline or pending
   * Generates a unique requestId for backend idempotency
   */
  async enqueueSubmission(complaintPayload, userId, autoSync = true) {
    const db = await this.ensureDB();
    const requestId = 'req-' + crypto.randomUUID();

    const queueRecord = {
      requestId: requestId,
      userId: userId,
      payload: complaintPayload,
      syncStatus: navigator.onLine ? 'Pending Synchronization' : 'Waiting for Internet',
      createdAt: new Date().toISOString(),
      retryCount: 0,
      lastAttempt: null,
      error: null,
      officialComplaintId: null
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('submissionQueue', 'readwrite');
      const store = tx.objectStore('submissionQueue');
      const req = store.put(queueRecord);
      tx.oncomplete = () => {
        console.log(`[JANASEVA Offline] Grievance enqueued with Request ID: ${requestId}`);
        if (navigator.onLine && autoSync) {
          this.checkAndSyncQueue();
        }
        resolve(queueRecord);
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Local queue transaction aborted"));
    });
  }

  async getQueuedSubmissions(userId = null) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('submissionQueue', 'readonly');
      const store = tx.objectStore('submissionQueue');
      const req = store.getAll();
      req.onsuccess = () => {
        let results = req.result || [];
        if (userId) {
          results = results.filter(item => item.userId === userId);
        }
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateQueueStatus(requestId, status, officialId = null, error = null) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('submissionQueue', 'readwrite');
      const store = tx.objectStore('submissionQueue');
      const getReq = store.get(requestId);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (!item) return resolve(null);

        item.syncStatus = status;
        item.lastAttempt = new Date().toISOString();
        if (officialId) item.officialComplaintId = officialId;
        if (error) {
          item.error = error;
          item.retryCount = (item.retryCount || 0) + 1;
        }

        const putReq = store.put(item);
        putReq.onsuccess = () => resolve(item);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // ============================================================================
  // STORE OPERATIONS: CACHED COMPLAINTS
  // ============================================================================

  async cacheComplaints(complaintList) {
    if (!Array.isArray(complaintList) || !complaintList.length) return;
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cachedComplaints', 'readwrite');
      const store = tx.objectStore('cachedComplaints');
      complaintList.forEach(c => store.put(c));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Failed to cache complaints'));
      tx.onabort = () => reject(tx.error || new Error('Caching transaction aborted'));
    });
  }

  async getCachedUserComplaints(userId) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cachedComplaints', 'readonly');
      const store = tx.objectStore('cachedComplaints');
      const index = store.index('userId');
      const req = index.getAll(userId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // ============================================================================
  // AUTOMATIC SYNCHRONIZATION ENGINE
  // ============================================================================

  async checkAndSyncQueue() {
    const currentUid = (window.authService && window.authService.currentUser ? window.authService.currentUser.uid : null) || (window.fbAuth?.currentUser?.uid);
    if (!navigator.onLine || this.syncInProgress || !currentUid) return;
    this.syncInProgress = true;

    try {
      const queue = await this.getQueuedSubmissions(currentUid);
      const nowMs = Date.now();
      const pendingItems = queue.filter(item => {
        if (item.syncStatus === 'Waiting for Internet' || item.syncStatus === 'Pending Synchronization') {
          return true;
        }
        if (item.syncStatus === 'Synchronization Failed') {
          const delay = Math.min(300000, 1000 * Math.pow(2, Math.min(item.retryCount || 0, 9)));
          return !item.lastAttempt || nowMs - Date.parse(item.lastAttempt) >= delay;
        }
        if (item.syncStatus === 'Synchronizing') {
          const lastMs = item.lastAttempt ? Date.parse(item.lastAttempt) : 0;
          return !lastMs || (nowMs - lastMs > 60000);
        }
        return false;
      });

      if (pendingItems.length) {
        console.log(`[JANASEVA Sync] Synchronizing ${pendingItems.length} pending offline record(s)...`);
        for (const item of pendingItems) {
          await this.synchronizeItem(item);
        }
      }

      // Sync offline AI chat sessions & Knowledge Centre cache
      await this.syncChatQueue();
      if (window.JanasevaKnowledgeCentre && typeof window.JanasevaKnowledgeCentre.syncOfflineKnowledgeCache === 'function') {
        await window.JanasevaKnowledgeCentre.syncOfflineKnowledgeCache().catch(() => {});
      }
    } catch (e) {
      console.warn('[JANASEVA Sync] Queue processing caught:', e);
    } finally {
      this.syncInProgress = false;
      window.dispatchEvent(new CustomEvent('janaseva:chatSyncState', { detail: { syncing: false } }));
    }
  }

  async queueChatSessionSync(uid, session) {
    if (!uid || !session || !session.sessionId) return;
    try {
      const db = await this.ensureDB();
      if (!db.objectStoreNames.contains('chatSyncQueue')) return;
      const syncKey = `${uid}__${session.sessionId}`;
      const tx = db.transaction(['chatSyncQueue'], 'readwrite');
      tx.objectStore('chatSyncQueue').put({
        syncKey,
        userId: String(uid),
        sessionId: String(session.sessionId),
        session,
        updatedAt: session.updatedAt || new Date().toISOString()
      });
    } catch (e) {}
  }

  async getPendingChatSyncCount(uid = null) {
    try {
      const db = await this.ensureDB();
      if (!db.objectStoreNames.contains('chatSyncQueue')) return 0;
      return await new Promise((resolve) => {
        const tx = db.transaction(['chatSyncQueue'], 'readonly');
        const req = tx.objectStore('chatSyncQueue').getAll();
        req.onsuccess = () => {
          const all = req.result || [];
          resolve(uid ? all.filter((x) => x.userId === String(uid)).length : all.length);
        };
        req.onerror = () => resolve(0);
      });
    } catch (e) {
      return 0;
    }
  }

  async syncChatQueue() {
    if (!navigator.onLine) return { synced: 0 };
    try {
      const db = await this.ensureDB();
      if (!db.objectStoreNames.contains('chatSyncQueue')) return { synced: 0 };
      const items = await new Promise((resolve) => {
        const tx = db.transaction(['chatSyncQueue'], 'readonly');
        const req = tx.objectStore('chatSyncQueue').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
      if (!items.length) return { synced: 0 };

      const store = window.JanasevaChatServices?.historyStore;
      if (!store) return { synced: 0 };

      const fbUser = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
      if (!fbUser) return { synced: 0 };

      window.dispatchEvent(new CustomEvent('janaseva:chatSyncState', { detail: { syncing: true, pending: items.length } }));
      let syncedCount = 0;

      for (const item of items) {
        if (item.userId !== fbUser.uid) continue;
        try {
          // Conflict safety: verify remote isn't strictly newer before overwriting
          if (typeof firebase.functions === 'function' && window.isFirebaseAvailable) {
            let remoteIsNewer = false;
            try {
              const getFn = firebase.functions().httpsCallable('getChatSession');
              const existing = await getFn({ sessionId: item.sessionId });
              const remoteUpd = Date.parse(existing?.data?.session?.updatedAt || 0) || 0;
              const localUpd = Date.parse(item.updatedAt || 0) || 0;
              if (remoteUpd > localUpd) remoteIsNewer = true;
            } catch (notFoundErr) {}

            if (!remoteIsNewer) {
              const saveFn = firebase.functions().httpsCallable('saveChatSession');
              await saveFn(item.session);
            }
          }
          const delTx = db.transaction(['chatSyncQueue'], 'readwrite');
          delTx.objectStore('chatSyncQueue').delete(item.syncKey);
          syncedCount++;
        } catch (err) {}
      }

      window.dispatchEvent(new CustomEvent('janaseva:chatSyncState', { detail: { syncing: false, syncedCount } }));
      return { synced: syncedCount };
    } catch (e) {
      return { synced: 0 };
    }
  }

  async synchronizeItem(item) {
    const currentUid = (window.authService && window.authService.currentUser ? window.authService.currentUser.uid : null) || (window.fbAuth?.currentUser?.uid);
    if (!currentUid || item.userId !== currentUid) return;
    await this.updateQueueStatus(item.requestId, 'Synchronizing');

    try {
      // Connect to window.submitComplaintFromPayload or live Firestore
      let officialComplaintId = null;

      if (typeof window.executeComplaintSubmission === 'function') {
        const result = await window.executeComplaintSubmission(item.payload, item.requestId);
        officialComplaintId = result.complaintId;
      } else {
        throw new Error('Open the complaint page while signed in to synchronize this saved submission.');
      }

      await this.updateQueueStatus(item.requestId, 'Successfully Submitted', officialComplaintId);
      
      // Notify citizen with toast
      if (typeof window.showToast === 'function') {
        window.showToast(`Offline grievance synchronized successfully! Official ID: ${officialComplaintId}`, 'success');
      }

      // Dispatch custom sync event
      window.dispatchEvent(new CustomEvent('janaseva:synced', {
        detail: { requestId: item.requestId, complaintId: officialComplaintId }
      }));

    } catch (err) {
      console.error(`[JANASEVA Sync] Failed to sync item ${item.requestId}:`, err);
      await this.updateQueueStatus(item.requestId, 'Synchronization Failed', null, err.message);
    }
  }
}

// Global Singleton Instance
window.janasevaOfflineDB = new JanasevaOfflineDB();

// Register Service Worker on window load
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[JANASEVA PWA] Service Worker registered in scope:', reg.scope))
      .catch(err => console.warn('[JANASEVA PWA] Service Worker registration failed:', err));
  });
}
