/**
 * JANASEVA 2.0 – Offline-First Document & OCR IndexedDB Storage Engine
 * 
 * Stores:
 * 1. documents: Document records, original data, OCR text, entities & audit trails.
 * 2. sync_queue: Pending offline documents awaiting online verification/sync.
 * 3. model_cache: Local Tesseract language model caching metadata.
 * 
 * Privacy & Security:
 * - Documents persisted strictly in IndexedDB binary stores (never in localStorage).
 * - Full offline persistence with in-memory fallback for restrictive contexts.
 */

(function (window) {
  'use strict';

  const DB_NAME = 'janaseva_ocr_db';
  const DB_VERSION = 1;

  class JanasevaOcrDocumentStore {
    constructor() {
      this.db = null;
      this.initPromise = null;
      this.inMemoryFallback = new Map();
      this.inMemorySyncQueue = new Set();
      this.inMemoryModels = new Map();
    }

    /**
     * Initialize IndexedDB database and object stores
     */
    async init() {
      if (this.db) return this.db;
      if (this.initPromise) return this.initPromise;

      this.initPromise = new Promise((resolve) => {
        if (!('indexedDB' in window)) {
          console.warn('[JANASEVA OCR Store] IndexedDB not available. Using in-memory fallback.');
          resolve(null);
          return;
        }

        try {
          const req = indexedDB.open(DB_NAME, DB_VERSION);

          req.onupgradeneeded = (e) => {
            const db = e.target.result;

            // 1. Documents Store
            if (!db.objectStoreNames.contains('documents')) {
              const docStore = db.createObjectStore('documents', { keyPath: 'docId' });
              docStore.createIndex('by_status', 'status', { unique: false });
              docStore.createIndex('by_uploadTime', 'uploadTime', { unique: false });
              docStore.createIndex('by_syncStatus', 'syncStatus', { unique: false });
            }

            // 2. Sync Queue Store
            if (!db.objectStoreNames.contains('sync_queue')) {
              const queueStore = db.createObjectStore('sync_queue', { keyPath: 'docId' });
              queueStore.createIndex('by_addedAt', 'addedAt', { unique: false });
            }

            // 3. Model Cache Metadata Store
            if (!db.objectStoreNames.contains('model_cache')) {
              db.createObjectStore('model_cache', { keyPath: 'lang' });
            }
          };

          req.onsuccess = (e) => {
            this.db = e.target.result;
            console.log('[JANASEVA OCR Store] IndexedDB opened successfully.');
            resolve(this.db);
          };

          req.onerror = (e) => {
            console.warn('[JANASEVA OCR Store] IndexedDB error:', e.target.error);
            resolve(null);
          };
        } catch (err) {
          console.warn('[JANASEVA OCR Store] IndexedDB exception:', err);
          resolve(null);
        }
      });

      return this.initPromise;
    }

    /**
     * Save or overwrite a document record
     */
    async saveDocument(record) {
      if (!record || !record.docId) {
        throw new Error('Invalid document record: docId is required.');
      }

      const doc = {
        docId: record.docId,
        filename: record.filename || 'document.dat',
        mimeType: record.mimeType || 'application/octet-stream',
        fileSize: record.fileSize || 0,
        dataUrl: record.dataUrl || null,
        uploadTime: record.uploadTime || new Date().toISOString(),
        status: record.status || 'PENDING_OCR_PROCESSING',
        ocrEngine: record.ocrEngine || 'none',
        detectedLanguage: record.detectedLanguage || 'unknown',
        extractedText: record.extractedText || '',
        userCorrectedText: record.userCorrectedText || null,
        confidence: typeof record.confidence === 'number' ? record.confidence : 0.0,
        docType: record.docType || 'Supporting Evidence',
        entities: record.entities || {},
        missingFields: record.missingFields || [],
        inconsistencies: record.inconsistencies || [],
        syncStatus: record.syncStatus || 'OFFLINE_ONLY',
        retryCount: record.retryCount || 0,
        lastError: record.lastError || null,
        officerVerification: record.officerVerification || {
          status: 'PENDING_OFFICIAL_REVIEW',
          verifiedBy: null,
          verifiedAt: null,
          remarks: null
        }
      };

      await this.init();

      if (this.db) {
        return new Promise((resolve, reject) => {
          try {
            const tx = this.db.transaction('documents', 'readwrite');
            const store = tx.objectStore('documents');
            const putReq = store.put(doc);
            putReq.onsuccess = () => resolve(doc);
            putReq.onerror = () => reject(putReq.error);
          } catch (e) {
            this.inMemoryFallback.set(doc.docId, doc);
            resolve(doc);
          }
        });
      } else {
        this.inMemoryFallback.set(doc.docId, doc);
        return doc;
      }
    }

    /**
     * Retrieve document by docId
     */
    async getDocument(docId) {
      if (!docId) return null;
      await this.init();

      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction('documents', 'readonly');
            const store = tx.objectStore('documents');
            const getReq = store.get(docId);
            getReq.onsuccess = () => resolve(getReq.result || null);
            getReq.onerror = () => resolve(this.inMemoryFallback.get(docId) || null);
          } catch (e) {
            resolve(this.inMemoryFallback.get(docId) || null);
          }
        });
      } else {
        return this.inMemoryFallback.get(docId) || null;
      }
    }

    /**
     * Update specific fields of an existing document
     */
    async updateDocument(docId, updates) {
      const existing = await this.getDocument(docId);
      if (!existing) {
        throw new Error(`Document ${docId} not found.`);
      }
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      return this.saveDocument(updated);
    }

    /**
     * Retrieve all saved documents
     */
    async getAllDocuments() {
      await this.init();

      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction('documents', 'readonly');
            const store = tx.objectStore('documents');
            const getAllReq = store.getAll();
            getAllReq.onsuccess = () => {
              const list = getAllReq.result || [];
              list.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
              resolve(list);
            };
            getAllReq.onerror = () => resolve(Array.from(this.inMemoryFallback.values()));
          } catch (e) {
            resolve(Array.from(this.inMemoryFallback.values()));
          }
        });
      } else {
        const list = Array.from(this.inMemoryFallback.values());
        list.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
        return list;
      }
    }

    /**
     * Queue document for online synchronization
     */
    async queuePendingSync(docId, reason = 'AWAITING_ONLINE_VERIFICATION') {
      await this.init();
      const item = { docId, reason, addedAt: new Date().toISOString() };

      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction('sync_queue', 'readwrite');
            const store = tx.objectStore('sync_queue');
            store.put(item);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => {
              this.inMemorySyncQueue.add(docId);
              resolve(true);
            };
          } catch (e) {
            this.inMemorySyncQueue.add(docId);
            resolve(true);
          }
        });
      } else {
        this.inMemorySyncQueue.add(docId);
        return true;
      }
    }

    /**
     * Get all pending sync entries
     */
    async getPendingSyncQueue() {
      await this.init();

      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction('sync_queue', 'readonly');
            const store = tx.objectStore('sync_queue');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve(Array.from(this.inMemorySyncQueue).map(id => ({ docId: id })));
          } catch (e) {
            resolve(Array.from(this.inMemorySyncQueue).map(id => ({ docId: id })));
          }
        });
      } else {
        return Array.from(this.inMemorySyncQueue).map(id => ({ docId: id }));
      }
    }

    /**
     * Remove from sync queue
     */
    async removePendingSync(docId) {
      await this.init();
      this.inMemorySyncQueue.delete(docId);

      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction('sync_queue', 'readwrite');
            const store = tx.objectStore('sync_queue');
            store.delete(docId);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
          } catch (e) {
            resolve(false);
          }
        });
      }
      return true;
    }

    /**
     * Record language model cache status
     */
    async recordModelStatus(lang, size = 0, cached = true) {
      await this.init();
      const entry = { lang, size, cached, lastVerified: new Date().toISOString() };
      this.inMemoryModels.set(lang, entry);

      if (this.db) {
        try {
          const tx = this.db.transaction('model_cache', 'readwrite');
          tx.objectStore('model_cache').put(entry);
        } catch (e) {
          // ignore
        }
      }
      return entry;
    }

    /**
     * Get cached language models
     */
    async getCachedModels() {
      await this.init();

      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction('model_cache', 'readonly');
            const req = tx.objectStore('model_cache').getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve(Array.from(this.inMemoryModels.values()));
          } catch (e) {
            resolve(Array.from(this.inMemoryModels.values()));
          }
        });
      } else {
        return Array.from(this.inMemoryModels.values());
      }
    }
  }

  window.JanasevaOcrDocumentStore = JanasevaOcrDocumentStore;
  window.janasevaOcrDocumentStore = new JanasevaOcrDocumentStore();

})(typeof window !== 'undefined' ? window : this);
