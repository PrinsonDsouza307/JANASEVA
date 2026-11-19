/**
 * JANASEVA – AI Knowledge Centre Storage, Pipeline Orchestrator, RAG Bridge & Backup Manager
 * Supports Dual-Mode execution:
 *   1. LIVE FIREBASE PRODUCTION MODE (Cloud Functions, Firestore, Cloud Storage under AI_KNOWLEDGE_CENTRE/)
 *   2. LOCAL SIMULATION MODE (IndexedDB `janaseva_knowledge_db` with isolated AI_KNOWLEDGE_CENTRE stores)
 */
(function (window) {
  'use strict';

  const DB_NAME = 'janaseva_knowledge_db';
  const DB_VERSION = 2;

  const LOGICAL_FOLDERS = [
    'original_documents',
    'extracted_text',
    'processed_documents',
    'document_metadata',
    'embeddings',
    'temporary_uploads',
    'failed_processing',
    'quarantined_files',
    'processing_logs',
    'backups'
  ];

  const STAGE_NAMES = [
    'A: File Reception',
    'B: Security Inspection',
    'C: File Type Identification',
    'D: Text Extraction',
    'E: OCR Processing',
    'F: Table & Structure Extraction',
    'G: Language Detection',
    'H: Text Cleaning',
    'I: Document Classification',
    'J: Text Chunking',
    'K: Metadata Generation',
    'L: Embedding Generation',
    'M: Knowledge Indexing',
    'N: Chatbox Availability'
  ];

  const getParsers = () => window.JanasevaKnowledgeParsers;
  const getSec = () => window.JanasevaKnowledgeSecurity;
  const getRag = () => window.JanasevaKnowledgeRAG;

  function isCloudFunctionsReady() {
    return Boolean(
      typeof navigator !== 'undefined' &&
      navigator.onLine &&
      window.isFirebaseAvailable &&
      typeof firebase !== 'undefined' &&
      typeof firebase.functions === 'function'
    );
  }

  function genId(prefix = 'k') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  class KnowledgeIndexedDB {
    constructor() {
      this.db = null;
      this.initPromise = null;
    }

    async open() {
      if (this.db) return this.db;
      if (this.initPromise) return this.initPromise;

      this.initPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB unavailable'));
          return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev) => {
          const db = ev.target.result;

          // 10 Logical AI_KNOWLEDGE_CENTRE Storage Folder Stores
          for (const folder of LOGICAL_FOLDERS) {
            const storeName = `folder_${folder}`;
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'storageKey' });
            }
          }

          // Relational/Document Database Entity Stores (Section 12)
          const entityDefs = [
            { name: 'knowledge_documents', keyPath: 'docId', indexes: ['fileHash', 'status', 'primaryLanguage', 'category'] },
            { name: 'knowledge_chunks', keyPath: 'chunkId', indexes: ['docId', 'active'] },
            { name: 'knowledge_embeddings', keyPath: 'embeddingId', indexes: ['docId', 'chunkId'] },
            { name: 'knowledge_uploaders', keyPath: 'uploaderId', indexes: [] },
            { name: 'knowledge_processing_jobs', keyPath: 'jobId', indexes: ['docId', 'status'] },
            { name: 'knowledge_api_receivers', keyPath: 'receiverId', indexes: [] },
            { name: 'knowledge_api_logs', keyPath: 'apiLogId', indexes: ['status'] },
            { name: 'knowledge_audit_logs', keyPath: 'auditId', indexes: ['action'] },
            { name: 'knowledge_storage_usage', keyPath: 'id', indexes: [] },
            { name: 'knowledge_backups', keyPath: 'backupId', indexes: [] },
            { name: 'knowledge_idempotency', keyPath: 'idempotencyKey', indexes: [] }
          ];
          for (const def of entityDefs) {
            if (!db.objectStoreNames.contains(def.name)) {
              const store = db.createObjectStore(def.name, { keyPath: def.keyPath });
              for (const idx of def.indexes) {
                store.createIndex(idx, idx, { unique: false });
              }
            }
          }

          // AI Notebook & Intelligent Knowledge Ecosystem Stores
          const notebookDefs = [
            { name: 'notebooks', keyPath: 'id', indexes: ['ownerUid', 'category'] },
            { name: 'notes', keyPath: 'id', indexes: ['notebookId', 'ownerUid', 'approvalStatus'] },
            { name: 'note_versions', keyPath: 'id', indexes: ['noteId', 'versionNumber'] },
            { name: 'knowledge_records', keyPath: 'id', indexes: ['recordId', 'category', 'status'] },
            { name: 'knowledge_approvals', keyPath: 'id', indexes: ['noteId', 'status'] },
            { name: 'share_links', keyPath: 'id', indexes: ['token', 'targetId'] },
            { name: 'access_permissions', keyPath: 'id', indexes: ['targetId', 'userUid'] },
            { name: 'sync_queue', keyPath: 'id', indexes: ['status', 'entityType'] }
          ];
          for (const def of notebookDefs) {
            if (!db.objectStoreNames.contains(def.name)) {
              const store = db.createObjectStore(def.name, { keyPath: def.keyPath });
              for (const idx of def.indexes) {
                store.createIndex(idx, idx, { unique: false });
              }
            }
          }
        };
        req.onsuccess = (ev) => {
          this.db = ev.target.result;
          resolve(this.db);
        };
        req.onerror = (ev) => reject(ev.target.error);
      });
      return this.initPromise;
    }

    async put(storeName, record) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
      });
    }

    async get(storeName, key) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    }

    async getAll(storeName) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    }

    async getByIndex(storeName, indexName, value) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        if (!store.indexNames.contains(indexName)) {
          const allReq = store.getAll();
          allReq.onsuccess = () => resolve((allReq.result || []).filter((r) => r[indexName] === value));
          allReq.onerror = () => reject(allReq.error);
          return;
        }
        const req = store.index(indexName).getAll(value);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    }

    async del(storeName, key) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    }

    async clearStore(storeName) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  class JanasevaKnowledgeCentreManager {
    constructor() {
      this.idb = new KnowledgeIndexedDB();
      this._rateBuckets = new Map();
      this._apiRateBuckets = new Map();
    }

    getCurrentActor() {
      const u = window.authService?.currentUser || null;
      if (u && u.uid) {
        return {
          uid: u.uid,
          name: u.name || 'Portal User',
          email: u.email || '',
          role: u.role || 'citizen',
          isAdmin: u.role === 'admin'
        };
      }
      return {
        uid: this.getOrCreateGuestContributorId(),
        name: 'Public Contributor',
        email: '',
        role: 'public',
        isAdmin: false
      };
    }

    getOrCreateGuestContributorId() {
      try {
        let gid = localStorage.getItem('JANASEVA_KC_CONTRIBUTOR_ID');
        if (!gid) {
          gid = 'pub-' + Math.random().toString(36).slice(2, 10);
          localStorage.setItem('JANASEVA_KC_CONTRIBUTOR_ID', gid);
        }
        return gid;
      } catch (e) {
        return 'pub-guest';
      }
    }

    enforcePublicUploadRateLimit(actorId) {
      const now = Date.now();
      const bucket = this._rateBuckets.get(actorId) || [];
      const recent = bucket.filter((ts) => now - ts < 60000);
      if (recent.length >= 30) {
        throw new Error('Upload rate limit exceeded (max 30 files per minute). Please wait briefly before uploading more files.');
      }
      recent.push(now);
      this._rateBuckets.set(actorId, recent);
    }

    async writeAuditLog(action, targetId, details, actor = null, extra = {}) {
      const act = actor || this.getCurrentActor();
      const entry = {
        auditId: genId('kaud'),
        action,
        targetId: String(targetId || ''),
        details: String(details || '').slice(0, 1200),
        actorUid: act.uid || 'system',
        actorName: act.name || 'System',
        actorRole: act.role || 'system',
        timestamp: new Date().toISOString(),
        ...extra
      };
      await this.idb.put('knowledge_audit_logs', entry);
      return entry;
    }

    async updateStorageMetrics() {
      const folderStats = {};
      let totalBytes = 0;
      let totalFiles = 0;
      for (const folder of LOGICAL_FOLDERS) {
        const items = await this.idb.getAll(`folder_${folder}`);
        const bytes = items.reduce((acc, it) => acc + (Number(it.sizeBytes) || 0), 0);
        folderStats[folder] = { fileCount: items.length, sizeBytes: bytes };
        totalBytes += bytes;
        totalFiles += items.length;
      }
      const usage = {
        id: 'summary',
        totalBytes,
        totalFiles,
        folders: folderStats,
        updatedAt: new Date().toISOString()
      };
      await this.idb.put('knowledge_storage_usage', usage);
      return usage;
    }

    async saveToLogicalFolder(folder, storageKey, payload, sizeBytes = 0) {
      const record = {
        storageKey,
        folder,
        sizeBytes: Number(sizeBytes) || 0,
        savedAt: new Date().toISOString(),
        payload
      };
      await this.idb.put(`folder_${folder}`, record);
      return record;
    }

    async runLocalOcr(bytes, format, filename) {
      // 1. Optional test/local bridge hook if present
      if (typeof window.__JANASEVA_LOCAL_OCR_HOOK__ === 'function') {
        try {
          const hooked = await window.__JANASEVA_LOCAL_OCR_HOOK__({ bytes, format, filename });
          if (hooked && hooked.text && String(hooked.text).trim().length > 0) {
            return { configured: true, text: String(hooked.text), engine: hooked.engine || 'local-ocr-hook' };
          }
        } catch (e) {}
      }

      // 2. Optional Tesseract.js browser OCR when loaded and online
      if (typeof window.Tesseract !== 'undefined' && navigator.onLine && ['png', 'jpg', 'webp'].includes(format)) {
        try {
          const blob = new Blob([bytes], { type: format === 'png' ? 'image/png' : (format === 'webp' ? 'image/webp' : 'image/jpeg') });
          const res = await window.Tesseract.recognize(blob, 'eng+kan+hin');
          const txt = res?.data?.text ? res.data.text.trim() : '';
          if (txt.length > 0) {
            return { configured: true, text: txt, engine: 'tesseract-js' };
          }
          return { configured: true, unreadable: true, text: '', engine: 'tesseract-js' };
        } catch (e) {
          console.warn('[Knowledge OCR] Tesseract warning:', e.message);
        }
      }

      return {
        configured: false,
        text: '',
        message: 'Automated OCR requires server Cloud Vision / Gemini API key or online Tesseract OCR. File preserved for reprocessing.'
      };
    }

    async readFileAsBytes(file) {
      if (file.arrayBuffer) {
        return new Uint8Array(await file.arrayBuffer());
      }
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
    }

    /**
     * Complete Automatic Document Processing Pipeline (Stages A -> N)
     */
    async ingestDocument({
      file = null,
      bytes = null,
      filename = '',
      mimeType = '',
      contributorName = '',
      contributorEmail = '',
      categoryHint = '',
      sourceReliability = 'community',
      sourceChannel = 'PUBLIC_UPLOAD',
      replaceDocId = '',
      ocrTextHint = '',
      cancelToken = null,
      onProgress = null
    }) {
      const parsers = getParsers();
      const sec = getSec();
      const rag = getRag();
      const actor = this.getCurrentActor();

      const reportProgress = (stageIndex, percent, label) => {
        if (typeof onProgress === 'function') {
          onProgress({ stageIndex, stageName: STAGE_NAMES[stageIndex] || label, percent });
        }
      };

      const checkCancelled = () => {
        if (cancelToken && cancelToken.aborted) {
          const err = new Error('Upload cancelled by user.');
          err.code = 'CANCELLED';
          throw err;
        }
      };

      const rawName = filename || (file && file.name) || 'document.txt';
      const rawMime = mimeType || (file && file.type) || '';

      // Enforce public upload rate limit (skip for internal API/Admin batch tests if flagged)
      if (sourceChannel === 'PUBLIC_UPLOAD') {
        this.enforcePublicUploadRateLimit(actor.uid);
      }

      reportProgress(0, 5, 'Stage A: File Reception');
      const rawBytes = bytes ? parsers.toUint8(bytes) : await this.readFileAsBytes(file);
      checkCancelled();

      // Try Cloud Functions backend when Firebase Live Production mode is active
      if (isCloudFunctionsReady() && sourceChannel !== 'API_RECEIVER_SIM') {
        try {
          if (rawBytes.length <= 8 * 1024 * 1024) {
            let bin = '';
            for (let i = 0; i < rawBytes.length; i++) bin += String.fromCharCode(rawBytes[i]);
            const fn = firebase.functions().httpsCallable('submitKnowledgeDocument');
            const res = await fn({
              filename: rawName,
              mimeType: rawMime,
              base64: btoa(bin),
              contributorName: contributorName || actor.name,
              categoryHint,
              replaceDocId: replaceDocId || null
            });
            if (res && res.data) {
              window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: res.data }));
              return res.data;
            }
          }
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud upload fallback to local pipeline:', cloudErr.message);
        }
      }

      const jobId = genId('kjob');
      const docId = 'KDOC-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const tempKey = `${jobId}_${sec.sanitizeFilename(rawName)}`;
      const nowIso = new Date().toISOString();

      // Stage A: Hash & Temporary Storage + Duplicate Detection
      const fileHash = await sec.computeSha256Hex(rawBytes);
      await this.saveToLogicalFolder('temporary_uploads', tempKey, {
        filename: rawName,
        mimeType: rawMime,
        bytes: rawBytes
      }, rawBytes.length);

      const jobRecord = {
        jobId,
        docId,
        filename: rawName,
        fileHash,
        sizeBytes: rawBytes.length,
        status: 'PROCESSING',
        currentStage: STAGE_NAMES[0],
        stagesCompleted: ['A'],
        startedAt: nowIso,
        updatedAt: nowIso,
        error: null
      };
      await this.idb.put('knowledge_processing_jobs', jobRecord);

      // Duplicate Detection by SHA-256 hash (unless explicitly replacing)
      if (!replaceDocId) {
        const existingByHash = await this.idb.getByIndex('knowledge_documents', 'fileHash', fileHash);
        const activeDup = existingByHash.find((d) => !d.deleted && !d.quarantined && d.status === 'INDEXED');
        if (activeDup) {
          await this.idb.del('folder_temporary_uploads', tempKey);
          jobRecord.status = 'DUPLICATE';
          jobRecord.currentStage = 'Duplicate Detected';
          jobRecord.completedAt = new Date().toISOString();
          await this.idb.put('knowledge_processing_jobs', jobRecord);

          // Track duplicate upload audit record
          await this.writeAuditLog('DUPLICATE_UPLOAD_SKIPPED', activeDup.docId, `Duplicate SHA-256 (${fileHash.slice(0, 12)}...) matched existing document "${activeDup.title}"`, actor, {
            fileHash,
            duplicateOfDocId: activeDup.docId,
            filename: rawName
          });
          await this.updateStorageMetrics();

          return {
            success: false,
            duplicate: true,
            duplicateOf: activeDup,
            fileHash,
            docId: activeDup.docId,
            message: `Duplicate file detected: "${rawName}" matches existing document "${activeDup.title}" (${activeDup.docId}).`
          };
        }
      }

      checkCancelled();

      // Stage B & C: Security Inspection & Binary Signature Verification
      reportProgress(1, 18, 'Stage B: Security Inspection');
      let extractRes;
      try {
        extractRes = parsers.extractDocumentContent({ filename: rawName, mimeType: rawMime, bytes: rawBytes });
      } catch (parseErr) {
        extractRes = { valid: false, quarantine: /security violation|zip bomb|path traversal|macro|xxe/i.test(parseErr.message), reason: parseErr.message, code: 'PARSE_SECURITY_ERROR' };
      }

      if (!extractRes.valid) {
        await this.idb.del('folder_temporary_uploads', tempKey);
        if (extractRes.quarantine) {
          return await this._quarantineDocument({
            docId, jobId, rawName, rawMime, rawBytes, fileHash, actor, contributorName, contributorEmail,
            reason: extractRes.reason, code: extractRes.code, riskFlags: [extractRes.code], sourceChannel
          });
        }
        return await this._failDocument({
          docId, jobId, rawName, rawMime, rawBytes, fileHash, actor, contributorName, contributorEmail,
          stage: 'C: File Identification / Parsing', reason: extractRes.reason, code: extractRes.code, sourceChannel
        });
      }

      // Handle ZIP archive containing supported documents
      if (extractRes.isArchive) {
        reportProgress(3, 45, 'Stage D: Safe Archive Extraction');
        const archiveResults = [];
        let blockedCount = 0;
        for (const child of extractRes.children) {
          if (!child.valid) {
            blockedCount++;
            if (child.quarantine) {
              await this._quarantineDocument({
                docId: genId('KDOC-Q'), jobId, rawName: child.entryName, rawMime: '', rawBytes: child.bytes || new Uint8Array(0),
                fileHash: await sec.computeSha256Hex(child.bytes || new Uint8Array(0)),
                actor, contributorName, contributorEmail,
                reason: `Archive member quarantined: ${child.reason}`, code: child.code, riskFlags: [child.code], sourceChannel
              });
            } else {
              archiveResults.push({ filename: child.entryName, success: false, reason: child.reason });
            }
            continue;
          }
          const childRes = await this.ingestDocument({
            bytes: child.bytes,
            filename: child.entryName,
            mimeType: child.mimeType,
            contributorName,
            contributorEmail,
            categoryHint,
            sourceReliability,
            sourceChannel: `${sourceChannel}_ZIP`,
            cancelToken
          });
          archiveResults.push(childRes);
        }
        await this.idb.del('folder_temporary_uploads', tempKey);
        jobRecord.status = 'COMPLETED';
        jobRecord.currentStage = 'N: Archive Processed';
        jobRecord.stagesCompleted = ['A', 'B', 'C', 'D', 'M', 'N'];
        jobRecord.completedAt = new Date().toISOString();
        await this.idb.put('knowledge_processing_jobs', jobRecord);
        await this.saveToLogicalFolder('processing_logs', `${jobId}.json`, jobRecord, JSON.stringify(jobRecord).length);
        await this.updateStorageMetrics();

        const indexedChildren = archiveResults.filter((r) => r && r.success);
        window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { archive: true, count: indexedChildren.length } }));
        return {
          success: indexedChildren.length > 0,
          isArchive: true,
          archiveFilename: rawName,
          processedCount: indexedChildren.length,
          blockedCount,
          results: archiveResults,
          message: `Archive "${rawName}" extracted safely: ${indexedChildren.length} document(s) indexed, ${blockedCount} skipped/quarantined.`
        };
      }

      checkCancelled();

      // Stage E: OCR for Images or Scanned PDFs
      let extractedText = extractRes.text || '';
      let ocrUsed = false;
      let ocrEngine = null;
      if (extractRes.needsOcr) {
        reportProgress(4, 42, 'Stage E: OCR Processing');
        if (ocrTextHint && String(ocrTextHint).trim().length > 0) {
          extractedText = String(ocrTextHint).trim();
          ocrUsed = true;
          ocrEngine = 'provided-ocr-text';
        } else {
          const ocrRes = await this.runLocalOcr(rawBytes, extractRes.format, rawName);
          if (ocrRes.configured && ocrRes.text) {
            extractedText = ocrRes.text;
            ocrUsed = true;
            ocrEngine = ocrRes.engine;
          } else if (!extractedText) {
            await this.idb.del('folder_temporary_uploads', tempKey);
            return await this._failDocument({
              docId, jobId, rawName, rawMime, rawBytes, fileHash, actor, contributorName, contributorEmail,
              format: extractRes.format,
              stage: 'E: OCR Processing',
              reason: ocrRes.unreadable
                ? 'OCR completed but no readable text was detected in this image/scanned PDF.'
                : (ocrRes.message || 'Automated OCR service is not configured on this client/server.'),
              code: ocrRes.unreadable ? 'OCR_UNREADABLE' : 'OCR_UNCONFIGURED',
              sourceChannel
            });
          }
        }
      }

      checkCancelled();

      // Stage B (Post-Extraction Content Security Inspection: Malware, Prompt Injection, Spam, PII)
      reportProgress(1, 52, 'Stage B: Deep Content Security Scan');
      const secRes = sec.scanSecurity({ filename: rawName, rawBytes, extractedText });
      if (secRes.quarantine) {
        await this.idb.del('folder_temporary_uploads', tempKey);
        return await this._quarantineDocument({
          docId, jobId, rawName, rawMime, rawBytes, fileHash, actor, contributorName, contributorEmail,
          format: extractRes.format,
          reason: secRes.quarantineReasons.join(' | '),
          code: secRes.malwareHits.length ? 'MALWARE_DETECTED' : (secRes.promptInjection.shouldQuarantine ? 'PROMPT_INJECTION' : 'SPAM_DETECTED'),
          riskFlags: [
            ...secRes.malwareHits.map((m) => m.name),
            ...secRes.promptInjection.patterns,
            ...secRes.spam.reasons
          ],
          sourceChannel
        });
      }

      // Stage G & H: Language Detection & Text Cleaning (Preserves original language)
      reportProgress(6, 64, 'Stage G/H: Language Detection & Text Cleaning');
      const cleanedText = rag.cleanText(extractedText);
      if (!cleanedText || cleanedText.length < 3) {
        await this.idb.del('folder_temporary_uploads', tempKey);
        return await this._failDocument({
          docId, jobId, rawName, rawMime, rawBytes, fileHash, actor, contributorName, contributorEmail,
          format: extractRes.format,
          stage: 'H: Text Cleaning',
          reason: 'No usable text content remained after extraction and cleaning.',
          code: 'EMPTY_EXTRACTED_TEXT',
          sourceChannel
        });
      }

      const langInfo = rag.detectLanguage(cleanedText);

      // Stage I: Classification & Metadata
      reportProgress(8, 72, 'Stage I: Document Classification');
      const classification = rag.classifyDocument(cleanedText, rawName, extractRes.format);
      const finalCategory = categoryHint && categoryHint.trim() ? categoryHint.trim() : classification.category;

      // Stage J: Structure-Aware Chunking
      reportProgress(9, 80, 'Stage J: Text Chunking');
      const rawChunks = rag.chunkDocumentText(cleanedText, extractRes.tables || []);

      // Stage K: Metadata Generation
      reportProgress(10, 86, 'Stage K: Metadata Generation');
      const title = rag.extractTitle(cleanedText, rawName, extractRes.metadata);
      const summary = rag.extractSummary(secRes.pii.detected ? sec.redactSensitivePii(cleanedText) : cleanedText);
      const keywords = rag.extractKeywords(cleanedText, 14);

      let version = 1;
      let previousDocId = null;
      if (replaceDocId) {
        const oldDoc = await this.idb.get('knowledge_documents', replaceDocId);
        if (oldDoc) {
          version = (Number(oldDoc.version) || 1) + 1;
          previousDocId = oldDoc.docId;
          await this._supersedeOldDocument(oldDoc.docId, docId);
        }
      }

      // Stage L: Embedding Generation
      reportProgress(11, 92, 'Stage L: Embedding Generation');
      const chunkRecords = [];
      const embeddingRecords = [];
      for (const ch of rawChunks) {
        const chunkId = `${docId}_C${ch.chunkIndex}`;
        const embeddingId = `EMB_${chunkId}`;
        const safeChunkText = sec.sanitizeUntrustedSnippet(ch.text, 1200);
        const vector = rag.generateLocalEmbedding(`${title} ${safeChunkText}`);
        chunkRecords.push({
          chunkId,
          docId,
          chunkIndex: ch.chunkIndex,
          sectionTitle: ch.sectionTitle,
          hasTable: ch.hasTable,
          language: ch.language,
          text: safeChunkText,
          charCount: safeChunkText.length,
          tokenCount: ch.tokenCount,
          active: true,
          createdAt: nowIso
        });
        embeddingRecords.push({
          embeddingId,
          docId,
          chunkId,
          dimensions: rag.VECTOR_DIMS,
          model: 'janaseva-trilingual-hybrid-256',
          vector,
          active: true,
          createdAt: nowIso
        });
      }

      // Stage M: Knowledge Indexing & Dedicated Storage Placement
      reportProgress(12, 96, 'Stage M: Knowledge Indexing');
      const safeFilename = sec.sanitizeFilename(rawName);
      const docRecord = {
        docId,
        title,
        originalFilename: rawName,
        safeFilename,
        format: extractRes.format,
        mimeType: extractRes.mimeType,
        sizeBytes: rawBytes.length,
        fileHash,
        primaryLanguage: langInfo.primaryLanguage,
        detectedLanguages: langInfo.detectedLanguages,
        isMultilingual: langInfo.isMultilingual,
        category: finalCategory,
        classificationConfidence: classification.confidence,
        sourceReliability: ['official', 'verified_partner', 'community'].includes(sourceReliability) ? sourceReliability : 'community',
        sourceChannel,
        contributorId: actor.uid,
        contributorDisplayName: (contributorName || actor.name || 'Public Contributor').slice(0, 80),
        summary,
        keywords,
        wordCount: rag.tokenizeMultilingual(cleanedText).length,
        charCount: cleanedText.length,
        chunkCount: chunkRecords.length,
        tableCount: (extractRes.tables || []).length,
        ocrUsed,
        ocrEngine,
        piiDetected: secRes.pii.detected,
        piiTypes: secRes.pii.types,
        promptInjectionFlag: secRes.promptInjection.detected,
        version,
        previousDocId,
        status: 'INDEXED',
        enabled: true,
        quarantined: false,
        deleted: false,
        uploadedAt: nowIso,
        updatedAt: nowIso
      };

      // Move out of temporary_uploads into separated AI_KNOWLEDGE_CENTRE folders
      await this.idb.del('folder_temporary_uploads', tempKey);
      await this.saveToLogicalFolder('original_documents', `${docId}/${safeFilename}`, { bytes: rawBytes, mimeType: rawMime, filename: rawName }, rawBytes.length);
      await this.saveToLogicalFolder('extracted_text', `${docId}.txt`, { text: cleanedText }, cleanedText.length);
      await this.saveToLogicalFolder('processed_documents', `${docId}.json`, { docId, title, cleanedText, tables: extractRes.tables || [], chunks: chunkRecords }, cleanedText.length + 256);
      await this.saveToLogicalFolder('document_metadata', `${docId}.json`, docRecord, JSON.stringify(docRecord).length);
      await this.saveToLogicalFolder('embeddings', `${docId}.json`, { docId, embeddings: embeddingRecords }, JSON.stringify(embeddingRecords).length);

      await this.idb.put('knowledge_documents', docRecord);
      for (const cr of chunkRecords) await this.idb.put('knowledge_chunks', cr);
      for (const er of embeddingRecords) await this.idb.put('knowledge_embeddings', er);

      // Update contributor table (stores optional private email strictly for Admin view)
      const existingUploader = (await this.idb.get('knowledge_uploaders', actor.uid)) || {
        uploaderId: actor.uid,
        displayName: docRecord.contributorDisplayName,
        email: contributorEmail || actor.email || '',
        role: actor.role,
        uploadCount: 0,
        indexedCount: 0,
        quarantinedCount: 0,
        firstUploadAt: nowIso
      };
      existingUploader.uploadCount += 1;
      existingUploader.indexedCount += 1;
      existingUploader.lastUploadAt = nowIso;
      await this.idb.put('knowledge_uploaders', existingUploader);

      // Finalize Job & Processing Log
      jobRecord.status = 'COMPLETED';
      jobRecord.currentStage = STAGE_NAMES[13];
      jobRecord.stagesCompleted = ['A','B','C','D', ocrUsed ? 'E' : null, 'F','G','H','I','J','K','L','M','N'].filter(Boolean);
      jobRecord.chunkCount = chunkRecords.length;
      jobRecord.completedAt = new Date().toISOString();
      await this.idb.put('knowledge_processing_jobs', jobRecord);
      await this.saveToLogicalFolder('processing_logs', `${jobId}.json`, jobRecord, JSON.stringify(jobRecord).length);

      await this.writeAuditLog(
        previousDocId ? 'KNOWLEDGE_DOCUMENT_UPDATED' : 'KNOWLEDGE_DOCUMENT_INDEXED',
        docId,
        `Indexed "${title}" (${docRecord.format}, ${docRecord.primaryLanguage}, ${chunkRecords.length} chunks, reliability=${docRecord.sourceReliability})`,
        actor
      );
      await this.updateStorageMetrics();

      reportProgress(13, 100, 'Stage N: Available in Chatbox');
      window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { docId, status: 'INDEXED' } }));

      return {
        success: true,
        docId,
        jobId,
        document: docRecord,
        chunksCount: chunkRecords.length,
        message: `Document "${title}" processed and indexed (${chunkRecords.length} chunks, language: ${langInfo.primaryLanguage.toUpperCase()}). Now searchable in AI Chat.`
      };
    }

    async _supersedeOldDocument(oldDocId, newDocId) {
      const oldDoc = await this.idb.get('knowledge_documents', oldDocId);
      if (oldDoc) {
        oldDoc.enabled = false;
        oldDoc.status = 'SUPERSEDED';
        oldDoc.supersededByDocId = newDocId;
        oldDoc.updatedAt = new Date().toISOString();
        await this.idb.put('knowledge_documents', oldDoc);
      }
      const oldChunks = await this.idb.getByIndex('knowledge_chunks', 'docId', oldDocId);
      for (const ch of oldChunks) {
        ch.active = false;
        await this.idb.put('knowledge_chunks', ch);
      }
      const oldEmbs = await this.idb.getByIndex('knowledge_embeddings', 'docId', oldDocId);
      for (const em of oldEmbs) {
        em.active = false;
        await this.idb.put('knowledge_embeddings', em);
      }
    }

    async _quarantineDocument({ docId, jobId, rawName, rawMime, rawBytes, fileHash, actor, contributorName, contributorEmail, format = 'unknown', reason, code, riskFlags = [], sourceChannel }) {
      const sec = getSec();
      const safeFilename = sec.sanitizeFilename(rawName);
      const nowIso = new Date().toISOString();

      await this.saveToLogicalFolder('quarantined_files', `${docId}/${safeFilename}`, { bytes: rawBytes, filename: rawName, reason, code }, rawBytes.length);

      const docRecord = {
        docId,
        title: safeFilename,
        originalFilename: rawName,
        safeFilename,
        format,
        mimeType: rawMime,
        sizeBytes: rawBytes.length,
        fileHash,
        primaryLanguage: 'unknown',
        category: 'Quarantined',
        sourceReliability: 'community',
        sourceChannel,
        contributorId: actor.uid,
        contributorDisplayName: (contributorName || actor.name || 'Public Contributor').slice(0, 80),
        status: 'QUARANTINED',
        enabled: false,
        quarantined: true,
        quarantineReason: reason,
        quarantineCode: code,
        riskFlags,
        deleted: false,
        uploadedAt: nowIso,
        updatedAt: nowIso
      };
      await this.idb.put('knowledge_documents', docRecord);

      const job = await this.idb.get('knowledge_processing_jobs', jobId);
      if (job) {
        job.status = 'QUARANTINED';
        job.currentStage = 'B: Quarantined';
        job.error = reason;
        job.completedAt = nowIso;
        await this.idb.put('knowledge_processing_jobs', job);
        await this.saveToLogicalFolder('processing_logs', `${jobId}.json`, job, JSON.stringify(job).length);
      }

      const existingUploader = (await this.idb.get('knowledge_uploaders', actor.uid)) || {
        uploaderId: actor.uid, displayName: docRecord.contributorDisplayName, email: contributorEmail || '', role: actor.role,
        uploadCount: 0, indexedCount: 0, quarantinedCount: 0, firstUploadAt: nowIso
      };
      existingUploader.uploadCount += 1;
      existingUploader.quarantinedCount += 1;
      existingUploader.lastUploadAt = nowIso;
      await this.idb.put('knowledge_uploaders', existingUploader);

      await this.writeAuditLog('SECURITY_QUARANTINE', docId, `Quarantined "${rawName}": ${reason}`, actor, { code, riskFlags });
      await this.updateStorageMetrics();

      return {
        success: false,
        quarantined: true,
        docId,
        jobId,
        code,
        reason,
        document: docRecord,
        message: `Security Alert: "${rawName}" was rejected and quarantined (${reason}).`
      };
    }

    async _failDocument({ docId, jobId, rawName, rawMime, rawBytes, fileHash, actor, contributorName, contributorEmail, format = 'unknown', stage, reason, code, sourceChannel }) {
      const sec = getSec();
      const safeFilename = sec.sanitizeFilename(rawName);
      const nowIso = new Date().toISOString();

      await this.saveToLogicalFolder('failed_processing', `${docId}/${safeFilename}`, { bytes: rawBytes, filename: rawName, mimeType: rawMime, reason, code }, rawBytes.length);

      const docRecord = {
        docId,
        title: safeFilename,
        originalFilename: rawName,
        safeFilename,
        format,
        mimeType: rawMime,
        sizeBytes: rawBytes.length,
        fileHash,
        primaryLanguage: 'unknown',
        category: 'Failed Processing',
        sourceReliability: 'community',
        sourceChannel,
        contributorId: actor.uid,
        contributorDisplayName: (contributorName || actor.name || 'Public Contributor').slice(0, 80),
        status: 'FAILED',
        enabled: false,
        quarantined: false,
        failureStage: stage,
        failureReason: reason,
        failureCode: code,
        deleted: false,
        uploadedAt: nowIso,
        updatedAt: nowIso
      };
      await this.idb.put('knowledge_documents', docRecord);

      const job = await this.idb.get('knowledge_processing_jobs', jobId);
      if (job) {
        job.status = 'FAILED';
        job.currentStage = stage;
        job.error = reason;
        job.completedAt = nowIso;
        await this.idb.put('knowledge_processing_jobs', job);
        await this.saveToLogicalFolder('processing_logs', `${jobId}.json`, job, JSON.stringify(job).length);
      }

      await this.writeAuditLog('PROCESSING_FAILED', docId, `Failed "${rawName}" at ${stage}: ${reason}`, actor, { code });
      await this.updateStorageMetrics();

      return {
        success: false,
        failed: true,
        docId,
        jobId,
        code,
        reason,
        document: docRecord,
        message: `Processing failed for "${rawName}": ${reason}`
      };
    }

    /**
     * Public Document Search (Never returns quarantined, deleted, disabled, or private paths)
     */
    async searchPublicDocuments({ query = '', language = 'all', category = 'all', sourceType = 'all' } = {}) {
      let docs = [];
      if (window.isFirebaseAvailable && window.fbDb && navigator.onLine) {
        try {
          const snap = await window.fbDb.collection('knowledge_documents')
            .where('status', '==', 'INDEXED')
            .where('enabled', '==', true)
            .where('quarantined', '==', false)
            .where('deleted', '==', false)
            .limit(300)
            .get();
          docs = snap.docs.map((d) => d.data());
        } catch (e) {
          docs = await this.idb.getAll('knowledge_documents');
        }
      } else {
        docs = await this.idb.getAll('knowledge_documents');
      }
      const active = docs.filter((d) => d && d.status === 'INDEXED' && d.enabled !== false && !d.quarantined && !d.deleted);
      const q = String(query || '').trim().toLowerCase();

      const filtered = active.filter((d) => {
        if (language !== 'all' && d.primaryLanguage !== language && !(d.detectedLanguages || []).includes(language)) return false;
        if (category !== 'all' && d.category !== category) return false;
        if (sourceType !== 'all' && d.sourceReliability !== sourceType) return false;
        if (q) {
          const hay = `${d.title} ${d.originalFilename} ${d.summary || ''} ${(d.keywords || []).join(' ')} ${d.category}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.updatedAt || b.uploadedAt) - new Date(a.updatedAt || a.uploadedAt));

      return filtered.map((d) => ({
        docId: d.docId,
        title: d.title,
        originalFilename: d.originalFilename,
        format: d.format,
        sizeBytes: d.sizeBytes,
        primaryLanguage: d.primaryLanguage,
        detectedLanguages: d.detectedLanguages || [d.primaryLanguage],
        category: d.category,
        sourceReliability: d.sourceReliability,
        contributorDisplayName: d.contributorDisplayName,
        summary: d.summary,
        keywords: d.keywords || [],
        wordCount: d.wordCount,
        chunkCount: d.chunkCount,
        version: d.version || 1,
        uploadedAt: d.uploadedAt,
        updatedAt: d.updatedAt
      }));
    }

    /**
     * Public & Chatbox RAG Retrieval Query
     */
    async queryKnowledgeRAG({
      query,
      responseLang = 'en',
      history = [],
      limit = 5,
      semanticSearch = true,
      crossLanguageSearch = true,
      schemeSearch = true,
      contextAware = true,
      actor = null
    } = {}) {
      const rag = getRag();
      const sec = getSec();
      const safeLimit = Math.min(10, Math.max(1, Number(limit) || 5));

      // Context-aware follow-up enrichment using previous user/assistant turns
      let effectiveQuery = String(query || '').trim();
      if (contextAware !== false && Array.isArray(history) && history.length > 0 && effectiveQuery.split(/\s+/).length <= 8) {
        const recentTopic = history
          .slice(-4)
          .map((t) => String(t.text || '').slice(0, 120))
          .join(' ');
        if (/\b(it|this|that|they|them|more|details|documents|eligibility|fee|how|ಅದರ|ಇದರ|ಅದು|इसके|उसका|यह)\b/i.test(effectiveQuery)) {
          effectiveQuery = `${effectiveQuery} ${recentTopic}`.slice(0, 420);
        }
      }

      if (navigator.onLine && isCloudFunctionsReady()) {
        try {
          const fn = firebase.functions().httpsCallable('searchKnowledgeBase');
          const res = await fn({
            query: effectiveQuery,
            lang: responseLang,
            limit: safeLimit,
            semanticSearch: semanticSearch !== false,
            crossLanguageSearch: crossLanguageSearch !== false,
            schemeSearch: schemeSearch !== false
          });
          if (res && res.data && res.data.handled) return res.data;
        } catch (e) {}
      }

      const [documents, chunks, embeddings] = await Promise.all([
        this.idb.getAll('knowledge_documents'),
        this.idb.getAll('knowledge_chunks'),
        this.idb.getAll('knowledge_embeddings')
      ]);

      let effectiveDocs = [...documents];
      let effectiveChunks = [...chunks];

      // Retrieve permitted notebook notes for authorized RAG grounding
      const effectiveActor = actor || (window.JanasevaAuth && typeof window.JanasevaAuth.getCurrentUser === 'function' ? window.JanasevaAuth.getCurrentUser() : null) || (window.JanasevaAINotebookService ? window.JanasevaAINotebookService.getCurrentActor() : null);

      if (window.JanasevaAINotebookService && typeof window.JanasevaAINotebookService.getPermittedNotesForRAG === 'function') {
        try {
          const permittedNotes = await window.JanasevaAINotebookService.getPermittedNotesForRAG(effectiveActor);
          for (const note of permittedNotes) {
            const vDocId = `note-${note.noteId}`;
            if (!effectiveDocs.some(d => d.docId === vDocId)) {
              effectiveDocs.push({
                docId: vDocId,
                noteId: note.noteId,
                title: note.title || 'Untitled Note',
                fileName: `${note.notebookName || 'Notebook'} - ${note.title || 'Note'}`,
                category: note.category || 'General',
                status: 'INDEXED',
                enabled: true,
                quarantined: false,
                deleted: false,
                sourceReliability: (note.approvalStatus === 'APPROVED' || note.approvalStatus === 'PUBLISHED') ? 'official' : 'community',
                trustLabel: (note.approvalStatus === 'APPROVED' || note.approvalStatus === 'PUBLISHED') ? 'Panchayat Approved Knowledge' : 'Personal Note',
                isNote: true,
                notebookName: note.notebookName,
                approvalStatus: note.approvalStatus,
                uploadedAt: note.updatedAt || note.createdAt
              });
            }
            if (!effectiveChunks.some(c => c.docId === vDocId)) {
              const plain = (note.contentText || (note.contentHtml || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
              if (plain) {
                effectiveChunks.push({
                  chunkId: `chk-${vDocId}-0`,
                  docId: vDocId,
                  noteId: note.noteId,
                  sectionTitle: note.title,
                  text: `${note.title}\n\n${plain}`,
                  active: true,
                  isNote: true,
                  notebookName: note.notebookName,
                  approvalStatus: note.approvalStatus
                });
              }
            }
          }
        } catch (e) {
          console.warn('[KnowledgeStorage] Error integrating notebook notes into RAG:', e);
        }
      }

      // Security Isolation: Filter out any note chunks that the current actor is NOT permitted to view
      effectiveChunks = effectiveChunks.filter(c => {
        if (!c.isNote) return true;
        if (c.approvalStatus === 'APPROVED' || c.approvalStatus === 'PUBLISHED' || c.isPublicKnowledge) return true;
        if (effectiveActor && effectiveActor.uid && c.ownerUid === effectiveActor.uid) return true;
        if (effectiveActor && effectiveActor.isAdmin) return true;
        return false;
      });

      const retrieval = rag.retrieveRelevantChunks({
        query: effectiveQuery,
        documents: effectiveDocs,
        chunks: effectiveChunks,
        embeddings,
        limit: safeLimit,
        semanticSearch: semanticSearch !== false,
        crossLanguageSearch: crossLanguageSearch !== false,
        schemeSearch: schemeSearch !== false
      });

      const synthesis = rag.synthesizeGroundedAnswer({
        query,
        retrieval,
        responseLang,
        securityRedactor: sec.redactSensitivePii
      });

      return {
        ...synthesis,
        retrieval,
        queryLanguage: retrieval.queryLanguage
      };
    }

    /**
     * Synchronize active Knowledge Centre documents, chunks & embeddings into local IndexedDB
     * for offline RAG retrieval, bounded by configured offline storage limit.
     */
    async syncOfflineKnowledgeCache({ maxMb = 25, force = false } = {}) {
      if (!navigator.onLine) {
        return { synced: false, skippedReason: 'offline', docsCount: 0, chunksCount: 0 };
      }
      const lastSync = parseInt(localStorage.getItem('janaseva_kc_last_sync_ms') || '0', 10) || 0;
      if (!force && lastSync && (Date.now() - lastSync) < 120000) {
        return { synced: false, skippedReason: 'recent', docsCount: 0, chunksCount: 0 };
      }
      if (!window.isFirebaseAvailable || !window.fbDb) {
        return { synced: false, skippedReason: 'local_only', docsCount: 0, chunksCount: 0 };
      }

      const maxBytes = Math.max(2, Math.min(100, Number(maxMb) || 25)) * 1024 * 1024;
      let totalBytes = 0;
      let docsSynced = 0;
      let chunksSynced = 0;

      try {
        const docsSnap = await window.fbDb.collection('knowledge_documents')
          .where('status', '==', 'INDEXED')
          .where('enabled', '==', true)
          .where('quarantined', '==', false)
          .where('deleted', '==', false)
          .limit(120)
          .get();

        for (const docSnap of docsSnap.docs) {
          const docData = docSnap.data();
          if (!docData || !docData.docId) continue;
          const docJsonSize = JSON.stringify(docData).length;
          if (totalBytes + docJsonSize > maxBytes) break;

          // Conflict-safe merge: do not overwrite newer local document metadata
          const existingLocal = await this.idb.get('knowledge_documents', docData.docId);
          const localTime = Date.parse(existingLocal?.updatedAt || existingLocal?.uploadedAt || 0) || 0;
          const remoteTime = Date.parse(docData.updatedAt || docData.uploadedAt || 0) || 0;
          if (!existingLocal || remoteTime >= localTime || force) {
            await this.idb.put('knowledge_documents', docData);
            totalBytes += docJsonSize;
            docsSynced++;
          }
        }

        const chunksSnap = await window.fbDb.collection('knowledge_chunks')
          .where('active', '==', true)
          .limit(500)
          .get();
        for (const cSnap of chunksSnap.docs) {
          const cData = cSnap.data();
          if (!cData || !cData.chunkId) continue;
          const cSize = JSON.stringify(cData).length;
          if (totalBytes + cSize > maxBytes) break;
          await this.idb.put('knowledge_chunks', cData);
          totalBytes += cSize;
          chunksSynced++;
        }

        const nowIso = new Date().toISOString();
        try {
          localStorage.setItem('janaseva_kc_last_sync_ms', String(Date.now()));
          localStorage.setItem('janaseva_kc_last_sync_iso', nowIso);
        } catch (e) {}

        return {
          synced: true,
          docsCount: docsSynced,
          chunksCount: chunksSynced,
          estimatedBytes: totalBytes,
          syncedAt: nowIso
        };
      } catch (err) {
        return { synced: false, skippedReason: err.message || 'sync_error', docsCount: docsSynced, chunksCount: chunksSynced };
      }
    }

    async getPublicStats() {
      let docs = [];
      let chunks = [];
      let uploaders = [];
      if (window.isFirebaseAvailable && window.fbDb && navigator.onLine) {
        try {
          const snap = await window.fbDb.collection('knowledge_documents')
            .where('status', '==', 'INDEXED')
            .where('enabled', '==', true)
            .where('quarantined', '==', false)
            .where('deleted', '==', false)
            .limit(300)
            .get();
          docs = snap.docs.map((d) => d.data());
          const chunkCount = docs.reduce((acc, d) => acc + (Number(d.chunkCount) || 0), 0);
          const contribSet = new Set(docs.map((d) => d.contributorId || d.contributorDisplayName).filter(Boolean));
          const langs = new Set(docs.map((d) => d.primaryLanguage).filter(Boolean));
          return {
            totalActiveDocuments: docs.length,
            totalActiveChunks: chunkCount,
            totalContributors: contribSet.size,
            languagesCount: langs.size
          };
        } catch (e) {}
      }
      docs = await this.idb.getAll('knowledge_documents');
      chunks = await this.idb.getAll('knowledge_chunks');
      uploaders = await this.idb.getAll('knowledge_uploaders');
      const activeDocs = docs.filter((d) => d && d.status === 'INDEXED' && d.enabled !== false && !d.quarantined && !d.deleted);
      const activeChunks = chunks.filter((c) => c && c.active !== false);
      const langs = new Set(activeDocs.map((d) => d.primaryLanguage).filter(Boolean));
      return {
        totalActiveDocuments: activeDocs.length,
        totalActiveChunks: activeChunks.length,
        totalContributors: uploaders.length,
        languagesCount: langs.size
      };
    }

    async getRecentPublicUploads(limit = 20) {
      let docs = [];
      if (window.isFirebaseAvailable && window.fbDb && navigator.onLine) {
        try {
          const snap = await window.fbDb.collection('knowledge_documents')
            .where('status', '==', 'INDEXED')
            .where('enabled', '==', true)
            .where('quarantined', '==', false)
            .where('deleted', '==', false)
            .limit(Math.max(limit, 50))
            .get();
          docs = snap.docs.map((d) => d.data());
        } catch (e) {
          docs = await this.idb.getAll('knowledge_documents');
        }
      } else {
        docs = await this.idb.getAll('knowledge_documents');
      }
      return docs
        .filter((d) => !d.deleted)
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, limit)
        .map((d) => ({
          docId: d.docId,
          title: d.title,
          originalFilename: d.originalFilename,
          format: d.format,
          sizeBytes: d.sizeBytes,
          primaryLanguage: d.primaryLanguage,
          status: d.status,
          enabled: d.enabled,
          quarantined: d.quarantined,
          failureReason: d.failureReason || null,
          quarantineReason: d.quarantineReason ? 'Blocked by security scanner' : null,
          sourceReliability: d.sourceReliability,
          contributorDisplayName: d.contributorDisplayName,
          uploadedAt: d.uploadedAt
        }));
    }

    async getDocumentDetailsForView(docId, allowRestricted = false) {
      let doc = await this.idb.get('knowledge_documents', docId);
      if (!doc && window.isFirebaseAvailable && window.fbDb && navigator.onLine) {
        try {
          const snap = await window.fbDb.collection('knowledge_documents').doc(String(docId)).get();
          if (snap.exists) doc = snap.data();
        } catch (e) {}
      }
      if (!doc || doc.deleted) return null;
      if (!allowRestricted && (doc.status !== 'INDEXED' || doc.enabled === false || doc.quarantined)) {
        return null;
      }
      const extRec = await this.idb.get('folder_extracted_text', `${docId}.txt`);
      let extractedText = extRec?.payload?.text || '';
      let chunks = await this.idb.getByIndex('knowledge_chunks', 'docId', docId);

      if ((!extractedText || chunks.length === 0) && isCloudFunctionsReady()) {
        try {
          const fn = firebase.functions().httpsCallable('downloadKnowledgeDocument');
          const res = await fn({ docId, asText: true });
          if (res?.data?.base64) {
            const bin = atob(res.data.base64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            extractedText = new TextDecoder().decode(bytes);
          }
          if (window.fbDb) {
            const cSnap = await window.fbDb.collection('knowledge_chunks').where('docId', '==', docId).get();
            chunks = cSnap.docs.map((c) => c.data());
          }
        } catch (e) {}
      }

      return {
        document: doc,
        extractedText,
        chunks: chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
      };
    }

    async downloadDocument(docId, { asText = false, adminOverride = false } = {}) {
      let blob;
      let dlName;

      if (isCloudFunctionsReady()) {
        try {
          const fn = firebase.functions().httpsCallable('downloadKnowledgeDocument');
          const res = await fn({ docId, asText });
          if (res && res.data && res.data.base64) {
            const bin = atob(res.data.base64);
            const u8 = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            blob = new Blob([u8], { type: res.data.mimeType || 'application/octet-stream' });
            dlName = res.data.filename || `${docId}.dat`;
          }
        } catch (cloudErr) {
          if (cloudErr.code === 'permission-denied') throw cloudErr;
        }
      }

      if (!blob) {
        const doc = await this.idb.get('knowledge_documents', docId);
        if (!doc || doc.deleted) throw new Error('Document not found.');
        if (!adminOverride && (doc.status !== 'INDEXED' || doc.enabled === false || doc.quarantined)) {
          throw new Error('Access denied: Document is disabled or quarantined.');
        }

        if (asText) {
          const extRec = await this.idb.get('folder_extracted_text', `${docId}.txt`);
          const txt = extRec?.payload?.text || doc.summary || '';
          blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
          dlName = `${doc.safeFilename || docId}_extracted.txt`;
        } else {
          const origRec = await this.idb.get('folder_original_documents', `${docId}/${doc.safeFilename}`);
          if (!origRec || !origRec.payload?.bytes) throw new Error('Original file payload not found in storage.');
          blob = new Blob([origRec.payload.bytes], { type: doc.mimeType || 'application/octet-stream' });
          dlName = doc.originalFilename || doc.safeFilename;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dlName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { success: true, filename: dlName };
    }

    /**
     * Section 10: Complete Document Deletion (removes chunks, embeddings, storage & updates index)
     */
    async deleteDocument(docId, reason = 'Removed by Administrator') {
      if (isCloudFunctionsReady()) {
        try {
          const fn = firebase.functions().httpsCallable('manageKnowledgeDocument');
          const res = await fn({ action: 'delete', docId, reason });
          if (res && res.data && res.data.success) {
            window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { docId, deleted: true } }));
            return res.data;
          }
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud delete fallback:', cloudErr.message);
        }
      }
      const doc = await this.idb.get('knowledge_documents', docId);
      if (!doc) throw new Error('Document not found.');

      const chunks = await this.idb.getByIndex('knowledge_chunks', 'docId', docId);
      for (const ch of chunks) await this.idb.del('knowledge_chunks', ch.chunkId);

      const embs = await this.idb.getByIndex('knowledge_embeddings', 'docId', docId);
      for (const em of embs) await this.idb.del('knowledge_embeddings', em.embeddingId);

      // Remove stored files across folders
      await this.idb.del('folder_original_documents', `${docId}/${doc.safeFilename}`);
      await this.idb.del('folder_failed_processing', `${docId}/${doc.safeFilename}`);
      await this.idb.del('folder_quarantined_files', `${docId}/${doc.safeFilename}`);
      await this.idb.del('folder_extracted_text', `${docId}.txt`);
      await this.idb.del('folder_processed_documents', `${docId}.json`);
      await this.idb.del('folder_document_metadata', `${docId}.json`);
      await this.idb.del('folder_embeddings', `${docId}.json`);
      await this.idb.del('knowledge_documents', docId);

      await this.writeAuditLog('KNOWLEDGE_DOCUMENT_DELETED', docId, `Permanently deleted "${doc.title || doc.originalFilename}" and purged ${chunks.length} chunks / ${embs.length} embeddings. Reason: ${reason}`);
      await this.updateStorageMetrics();
      window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { docId, deleted: true } }));

      return { success: true, docId, purgedChunks: chunks.length, purgedEmbeddings: embs.length };
    }

    
    /**
     * Delete a single processing job record from pipeline queue and purge logs
     */
    async deleteProcessingJob(jobId, reason = 'Removed by Administrator via Pipeline Queue') {
      if (!jobId) throw new Error('Job ID is required for deletion');

      if (isCloudFunctionsReady() && this.getCurrentActor().isAdmin) {
        try {
          const fn = firebase.functions().httpsCallable('manageKnowledgeJob');
          await fn({ action: 'delete', jobId, reason });
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud job delete notice:', cloudErr.message);
        }
      }

      const job = await this.idb.get('knowledge_processing_jobs', jobId);
      await this.idb.del('knowledge_processing_jobs', jobId);
      await this.idb.del('folder_processing_logs', `${jobId}.json`);

      await this.writeAuditLog(
        'PROCESSING_JOB_DELETED',
        jobId,
        `Permanently deleted processing job "${jobId}" (${job?.filename || 'unknown file'}). Reason: ${reason}`
      );
      await this.updateStorageMetrics();

      window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { jobId, deleted: true } }));
      return { success: true, jobId };
    }

    /**
     * Delete multiple selected processing jobs from pipeline queue
     */
    async deleteProcessingJobs(jobIds, reason = 'Batch deleted via Admin Pipeline Queue') {
      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return { success: true, deletedCount: 0 };
      }
      const results = [];
      for (const jid of jobIds) {
        try {
          const r = await this.deleteProcessingJob(jid, reason);
          results.push(r);
        } catch (err) {
          console.warn(`[KnowledgeStorage] Error deleting job ${jid}:`, err);
        }
      }
      return { success: true, deletedCount: results.length, totalRequested: jobIds.length };
    }

    async setDocumentEnabled(docId, enabled) {
      if (isCloudFunctionsReady()) {
        try {
          const fn = firebase.functions().httpsCallable('manageKnowledgeDocument');
          const res = await fn({ action: 'setEnabled', docId, enabled });
          if (res && res.data && res.data.success) {
            window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { docId, enabled } }));
            return res.data;
          }
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud toggle fallback:', cloudErr.message);
        }
      }
      const doc = await this.idb.get('knowledge_documents', docId);
      if (!doc) throw new Error('Document not found.');
      if (doc.quarantined && enabled) throw new Error('Quarantined files cannot be enabled directly without Admin security release.');

      doc.enabled = Boolean(enabled);
      doc.updatedAt = new Date().toISOString();
      await this.idb.put('knowledge_documents', doc);

      const chunks = await this.idb.getByIndex('knowledge_chunks', 'docId', docId);
      for (const ch of chunks) {
        ch.active = Boolean(enabled);
        await this.idb.put('knowledge_chunks', ch);
      }
      const embs = await this.idb.getByIndex('knowledge_embeddings', 'docId', docId);
      for (const em of embs) {
        em.active = Boolean(enabled);
        await this.idb.put('knowledge_embeddings', em);
      }

      await this.writeAuditLog(enabled ? 'KNOWLEDGE_ENABLED' : 'KNOWLEDGE_DISABLED', docId, `${enabled ? 'Enabled' : 'Disabled'} knowledge record "${doc.title}"`);
      window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { docId, enabled } }));
      return { success: true, docId, enabled: doc.enabled };
    }

    async reprocessDocument(docId, { ocrTextHint = '', overrideQuarantine = false } = {}) {
      if (isCloudFunctionsReady() && !ocrTextHint && !overrideQuarantine) {
        try {
          const fn = firebase.functions().httpsCallable('manageKnowledgeDocument');
          const res = await fn({ action: 'reprocess', docId });
          if (res && res.data) {
            window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { docId, reprocessed: true } }));
            return res.data;
          }
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud reprocess fallback:', cloudErr.message);
        }
      }
      const doc = await this.idb.get('knowledge_documents', docId);
      if (!doc) throw new Error('Document not found.');
      if (doc.quarantined && !overrideQuarantine) {
        throw new Error('Document is quarantined. Use Admin Security Release to reprocess.');
      }

      const key = `${docId}/${doc.safeFilename}`;
      const origRec = (await this.idb.get('folder_original_documents', key)) ||
        (await this.idb.get('folder_failed_processing', key)) ||
        (await this.idb.get('folder_quarantined_files', key));

      if (!origRec || !origRec.payload?.bytes) {
        throw new Error('Stored binary file not found for reprocessing.');
      }

      const bytes = origRec.payload.bytes;
      await this.deleteDocument(docId, 'Reprocessing document');
      return await this.ingestDocument({
        bytes,
        filename: doc.originalFilename,
        mimeType: doc.mimeType,
        contributorName: doc.contributorDisplayName,
        categoryHint: doc.category === 'Failed Processing' || doc.category === 'Quarantined' ? '' : doc.category,
        sourceReliability: doc.sourceReliability || 'community',
        sourceChannel: 'REPROCESS',
        ocrTextHint
      });
    }

    /**
     * Admin Dashboard Aggregation (Section 6)
     */
    async getAdminOverview() {
      if (isCloudFunctionsReady() && this.getCurrentActor().isAdmin) {
        try {
          const fn = firebase.functions().httpsCallable('getKnowledgeAdminOverview');
          const res = await fn({});
          if (res && res.data && res.data.success) {
            const d = res.data;
            const docs = (d.documents || []).filter((x) => !x.deleted);
            const indexed = docs.filter((x) => x.status === 'INDEXED');
            const jobs = d.jobs || [];
            const activeJobs = jobs.filter((j) => j.status === 'PROCESSING' || j.status === 'QUEUED');
            const failedDocs = docs.filter((x) => x.status === 'FAILED');
            const quarantinedDocs = docs.filter((x) => x.status === 'QUARANTINED' || x.quarantined);
            const auditLogs = d.auditLogs || [];
            const duplicateEvents = auditLogs.filter((a) => a.action === 'DUPLICATE_UPLOAD_SKIPPED');
            const storage = d.storage || { totalBytes: 0, totalFiles: 0, folders: {} };
            return {
              stats: {
                totalUploadedDocuments: docs.length,
                totalContributors: (d.uploaders || []).length,
                totalExtractedTextRecords: indexed.length,
                successfullyProcessedDocuments: indexed.length,
                processingDocuments: activeJobs.length,
                failedDocuments: failedDocs.length,
                quarantinedDocuments: quarantinedDocs.length,
                duplicateUploads: duplicateEvents.length,
                storageConsumptionBytes: storage.totalBytes || 0,
                indexingStatus: activeJobs.length > 0 ? 'PROCESSING' : (indexed.length > 0 ? 'HEALTHY_INDEXED' : 'IDLE'),
                totalChunks: indexed.reduce((acc, x) => acc + (Number(x.chunkCount) || 0), 0),
                totalEmbeddings: indexed.reduce((acc, x) => acc + (Number(x.chunkCount) || 0), 0)
              },
              documents: docs,
              uploaders: d.uploaders || [],
              jobs,
              chunks: [],
              failedDocs,
              quarantinedDocs,
              storage,
              processingLogs: jobs,
              auditLogs,
              apiConfig: d.apiConfig || { enabled: false },
              apiLogs: d.apiLogs || [],
              backups: d.backups || []
            };
          }
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud admin overview fallback:', cloudErr.message);
        }
      }

      const [docs, chunks, embeddings, uploaders, jobs, logs, auditLogs, storage, apiConfig, apiLogs, backups] = await Promise.all([
        this.idb.getAll('knowledge_documents'),
        this.idb.getAll('knowledge_chunks'),
        this.idb.getAll('knowledge_embeddings'),
        this.idb.getAll('knowledge_uploaders'),
        this.idb.getAll('knowledge_processing_jobs'),
        this.idb.getAll('folder_processing_logs'),
        this.idb.getAll('knowledge_audit_logs'),
        this.updateStorageMetrics(),
        this.getApiReceiverConfig(),
        this.idb.getAll('knowledge_api_logs'),
        this.idb.getAll('knowledge_backups')
      ]);

      const activeDocs = docs.filter((d) => !d.deleted);
      const indexedDocs = activeDocs.filter((d) => d.status === 'INDEXED');
      const processingJobs = jobs.filter((j) => j.status === 'PROCESSING' || j.status === 'QUEUED');
      const failedDocs = activeDocs.filter((d) => d.status === 'FAILED');
      const quarantinedDocs = activeDocs.filter((d) => d.status === 'QUARANTINED' || d.quarantined);
      const duplicateEvents = auditLogs.filter((a) => a.action === 'DUPLICATE_UPLOAD_SKIPPED');

      const stats = {
        totalUploadedDocuments: activeDocs.length,
        totalContributors: uploaders.length,
        totalExtractedTextRecords: indexedDocs.length,
        successfullyProcessedDocuments: indexedDocs.length,
        processingDocuments: processingJobs.length,
        failedDocuments: failedDocs.length,
        quarantinedDocuments: quarantinedDocs.length,
        duplicateUploads: duplicateEvents.length,
        storageConsumptionBytes: storage.totalBytes || 0,
        indexingStatus: processingJobs.length > 0 ? 'PROCESSING' : (indexedDocs.length > 0 ? 'HEALTHY_INDEXED' : 'IDLE'),
        totalChunks: chunks.filter((c) => c.active !== false).length,
        totalEmbeddings: embeddings.filter((e) => e.active !== false).length
      };

      return {
        stats,
        documents: activeDocs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)),
        uploaders: uploaders.sort((a, b) => new Date(b.lastUploadAt || 0) - new Date(a.lastUploadAt || 0)),
        jobs: jobs.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)),
        chunks: chunks.slice(0, 200),
        failedDocs,
        quarantinedDocs,
        storage,
        processingLogs: logs.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)),
        auditLogs: auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        apiConfig,
        apiLogs: apiLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        backups: backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      };
    }

    async cleanupStorageFolder(folderName) {
      if (!['temporary_uploads', 'failed_processing'].includes(folderName)) {
        throw new Error('Only temporary_uploads or failed_processing can be bulk cleaned.');
      }
      await this.idb.clearStore(`folder_${folderName}`);
      await this.writeAuditLog('STORAGE_CLEANUP', folderName, `Cleared storage folder AI_KNOWLEDGE_CENTRE/${folderName}`);
      return await this.updateStorageMetrics();
    }

    /**
     * Backup & Restore (Sections 4, 6, 13)
     */
    async createBackupSnapshot() {
      if (isCloudFunctionsReady() && this.getCurrentActor().isAdmin) {
        try {
          const fn = firebase.functions().httpsCallable('knowledgeBackupAndRestore');
          const res = await fn({ action: 'backup' });
          if (res && res.data && res.data.backupId) return res.data;
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud backup fallback:', cloudErr.message);
        }
      }
      const sec = getSec();
      const [docs, chunks, embeddings, uploaders, apiConfig] = await Promise.all([
        this.idb.getAll('knowledge_documents'),
        this.idb.getAll('knowledge_chunks'),
        this.idb.getAll('knowledge_embeddings'),
        this.idb.getAll('knowledge_uploaders'),
        this.idb.get('knowledge_api_receivers', 'default')
      ]);

      const extractedTexts = await this.idb.getAll('folder_extracted_text');
      const originalFiles = await this.idb.getAll('folder_original_documents');
      // Convert binary Uint8Array payloads to base64 for portable JSON backup
      const serializedOriginals = originalFiles.map((rec) => {
        const u8 = rec.payload?.bytes ? getParsers().toUint8(rec.payload.bytes) : new Uint8Array(0);
        let bin = '';
        for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
        return {
          storageKey: rec.storageKey,
          sizeBytes: rec.sizeBytes,
          filename: rec.payload?.filename || '',
          mimeType: rec.payload?.mimeType || '',
          base64: btoa(bin)
        };
      });

      const backupId = 'KBKP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const payload = {
        backupId,
        createdAt: new Date().toISOString(),
        documents: docs,
        chunks,
        embeddings,
        uploaders,
        extractedTexts,
        originalFiles: serializedOriginals,
        apiConfigMeta: apiConfig ? { ...apiConfig, keyHash: undefined, bearerHash: undefined, webhookSecretHash: undefined } : null
      };

      const jsonStr = JSON.stringify(payload);
      const sha256Checksum = await sec.computeSha256Hex(jsonStr);

      await this.saveToLogicalFolder('backups', `${backupId}.json`, payload, jsonStr.length);
      const metaRecord = {
        backupId,
        createdAt: payload.createdAt,
        createdBy: this.getCurrentActor().email || this.getCurrentActor().name,
        sha256Checksum,
        sizeBytes: jsonStr.length,
        counts: {
          documents: docs.length,
          chunks: chunks.length,
          embeddings: embeddings.length,
          originals: serializedOriginals.length
        },
        verified: true
      };
      await this.idb.put('knowledge_backups', metaRecord);
      await this.writeAuditLog('KNOWLEDGE_BACKUP_CREATED', backupId, `Created cryptographic backup ${backupId} (${docs.length} docs, SHA-256: ${sha256Checksum.slice(0, 16)}...)`);
      await this.updateStorageMetrics();
      return metaRecord;
    }

    async downloadBackupJson(backupId) {
      const rec = await this.idb.get('folder_backups', `${backupId}.json`);
      if (!rec || !rec.payload) throw new Error('Backup snapshot payload not found.');
      const blob = new Blob([JSON.stringify(rec.payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async deleteBackupSnapshot(backupId) {
      if (!backupId) throw new Error('Missing backupId.');
      await this.idb.del('knowledge_backups', backupId);
      await this.idb.del('folder_backups', `${backupId}.json`);
      await this.writeAuditLog('KNOWLEDGE_BACKUP_DELETED', backupId, `Deleted backup snapshot ${backupId}`);
      await this.updateStorageMetrics();
      return { success: true, backupId };
    }

    async restoreBackupSnapshot(backupIdOrPayload) {
      if (typeof backupIdOrPayload === 'string' && isCloudFunctionsReady() && this.getCurrentActor().isAdmin) {
        try {
          const fn = firebase.functions().httpsCallable('knowledgeBackupAndRestore');
          const res = await fn({ action: 'restore', backupId: backupIdOrPayload });
          if (res && res.data && res.data.success) {
            window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { restored: true } }));
            return res.data;
          }
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud restore fallback:', cloudErr.message);
        }
      }
      const sec = getSec();
      let payload = null;
      let expectedHash = null;

      if (typeof backupIdOrPayload === 'string') {
        const meta = await this.idb.get('knowledge_backups', backupIdOrPayload);
        const rec = await this.idb.get('folder_backups', `${backupIdOrPayload}.json`);
        if (!rec || !rec.payload) throw new Error('Backup snapshot not found.');
        payload = rec.payload;
        expectedHash = meta?.sha256Checksum || null;
      } else {
        payload = backupIdOrPayload;
      }

      if (!payload || !Array.isArray(payload.documents) || !Array.isArray(payload.chunks)) {
        throw new Error('Invalid Knowledge Centre backup payload structure.');
      }

      if (expectedHash) {
        const actualHash = await sec.computeSha256Hex(JSON.stringify(payload));
        if (actualHash !== expectedHash) {
          throw new Error('Backup integrity check failed: SHA-256 checksum mismatch.');
        }
      }

      await Promise.all([
        this.idb.clearStore('knowledge_documents'),
        this.idb.clearStore('knowledge_chunks'),
        this.idb.clearStore('knowledge_embeddings'),
        this.idb.clearStore('folder_original_documents'),
        this.idb.clearStore('folder_extracted_text')
      ]);

      for (const d of payload.documents) await this.idb.put('knowledge_documents', d);
      for (const c of payload.chunks) await this.idb.put('knowledge_chunks', c);
      for (const e of (payload.embeddings || [])) await this.idb.put('knowledge_embeddings', e);
      for (const u of (payload.uploaders || [])) await this.idb.put('knowledge_uploaders', u);
      for (const t of (payload.extractedTexts || [])) await this.idb.put('folder_extracted_text', t);

      for (const orig of (payload.originalFiles || [])) {
        const bin = atob(orig.base64 || '');
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        await this.saveToLogicalFolder('original_documents', orig.storageKey, {
          bytes: u8,
          filename: orig.filename,
          mimeType: orig.mimeType
        }, orig.sizeBytes || u8.length);
      }

      await this.writeAuditLog('KNOWLEDGE_BACKUP_RESTORED', payload.backupId || 'EXTERNAL_JSON', `Restored ${payload.documents.length} documents and ${payload.chunks.length} chunks from backup.`);
      await this.updateStorageMetrics();
      window.dispatchEvent(new CustomEvent('janaseva:knowledgeUpdated', { detail: { restored: true } }));

      return {
        success: true,
        restoredDocuments: payload.documents.length,
        restoredChunks: payload.chunks.length
      };
    }

    /**
     * Section 7: Receiver-Only API Configuration, Secret Rotation & Server-Contract Pipeline
     */
    async getApiReceiverConfig() {
      const stored = await this.idb.get('knowledge_api_receivers', 'default');
      const baseOrigin = (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null')
        ? window.location.origin
        : 'https://your-project.cloudfunctions.net';
      const defaultEndpoint = window.isFirebaseAvailable
        ? `https://us-central1-${window.fbDb?.app?.options?.projectId || 'YOUR_PROJECT_ID'}.cloudfunctions.net/knowledgeReceiverApi`
        : `${baseOrigin}/api/knowledgeReceiverApi`;

      const cfg = stored || {
        receiverId: 'default',
        enabled: false,
        endpointUrl: defaultEndpoint,
        authMode: 'api_key_or_bearer',
        rateLimitPerMinute: 30,
        maxPayloadMb: 15,
        allowedIps: [],
        webhookModeEnabled: true,
        apiKeyMasked: 'Not generated',
        bearerTokenMasked: 'Not generated',
        webhookSecretMasked: 'Not generated',
        hasApiKey: false,
        hasBearerToken: false,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
        updatedAt: new Date().toISOString()
      };

      // Never return raw hashes or secrets to general readers
      return {
        receiverId: cfg.receiverId,
        enabled: Boolean(cfg.enabled),
        endpointUrl: cfg.endpointUrl || defaultEndpoint,
        authMode: cfg.authMode || 'api_key_or_bearer',
        rateLimitPerMinute: Number(cfg.rateLimitPerMinute) || 30,
        maxPayloadMb: Number(cfg.maxPayloadMb) || 15,
        allowedIps: Array.isArray(cfg.allowedIps) ? cfg.allowedIps : [],
        webhookModeEnabled: cfg.webhookModeEnabled !== false,
        apiKeyMasked: cfg.apiKeyMasked || 'Not generated',
        bearerTokenMasked: cfg.bearerTokenMasked || 'Not generated',
        webhookSecretMasked: cfg.webhookSecretMasked || 'Not generated',
        hasApiKey: Boolean(cfg.keyHash),
        hasBearerToken: Boolean(cfg.bearerHash),
        lastSuccessAt: cfg.lastSuccessAt || null,
        lastErrorAt: cfg.lastErrorAt || null,
        lastErrorMessage: cfg.lastErrorMessage || null,
        updatedAt: cfg.updatedAt
      };
    }

    async updateApiReceiverConfig(updates) {
      if (!this.getCurrentActor().isAdmin) {
        throw new Error('Access Denied: Only Administrators may configure Receiver API settings.');
      }
      const existing = (await this.idb.get('knowledge_api_receivers', 'default')) || { receiverId: 'default' };
      const baseOrigin = (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null')
        ? window.location.origin
        : 'https://your-project.cloudfunctions.net';
      const defaultEndpoint = window.isFirebaseAvailable
        ? `https://us-central1-${window.fbDb?.app?.options?.projectId || 'YOUR_PROJECT_ID'}.cloudfunctions.net/knowledgeReceiverApi`
        : `${baseOrigin}/api/knowledgeReceiverApi`;

      const rpm = Number(updates.rateLimitPerMinute ?? existing.rateLimitPerMinute ?? 30);
      const maxMb = Number(updates.maxPayloadMb ?? existing.maxPayloadMb ?? 15);
      if (isNaN(rpm) || rpm < 1 || rpm > 300) {
        throw new Error('Rate Limit per minute must be between 1 and 300.');
      }
      if (isNaN(maxMb) || maxMb < 1 || maxMb > 25) {
        throw new Error('Max Payload Size (MB) must be between 1 and 25.');
      }
      const endpointUrl = updates.endpointUrl !== undefined
        ? String(updates.endpointUrl).trim().slice(0, 300)
        : String(existing.endpointUrl || defaultEndpoint).trim().slice(0, 300);
      if (updates.endpointUrl !== undefined && !endpointUrl) {
        throw new Error('HTTPS Receiver Endpoint URL is required.');
      }

      if (isCloudFunctionsReady()) {
        const fn = firebase.functions().httpsCallable('updateKnowledgeApiSettings');
        const res = await fn({ action: 'updateConfig', updates });
        if (res && res.data) {
          await this.idb.put('knowledge_api_receivers', { ...res.data, receiverId: 'default' });
          return await this.getApiReceiverConfig();
        }
      }

      const actor = this.getCurrentActor();
      const next = {
        ...existing,
        enabled: updates.enabled !== undefined ? Boolean(updates.enabled) : Boolean(existing.enabled),
        endpointUrl,
        authMode: ['api_key_or_bearer', 'api_key_only', 'bearer_only', 'hmac_webhook'].includes(updates.authMode) ? updates.authMode : (existing.authMode || 'api_key_or_bearer'),
        rateLimitPerMinute: rpm,
        maxPayloadMb: maxMb,
        allowedIps: Array.isArray(updates.allowedIps)
          ? updates.allowedIps.map((x) => String(x).trim()).filter(Boolean).slice(0, 50)
          : (typeof updates.allowedIpsText === 'string'
              ? updates.allowedIpsText.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean).slice(0, 50)
              : (existing.allowedIps || [])),
        webhookModeEnabled: updates.webhookModeEnabled !== undefined ? Boolean(updates.webhookModeEnabled) : (existing.webhookModeEnabled !== false),
        updatedBy: actor.email || actor.name || 'admin',
        updatedAt: new Date().toISOString()
      };
      await this.idb.put('knowledge_api_receivers', next);
      await this.writeAuditLog('API_SETTINGS_UPDATED', 'default', `Receiver API ${next.enabled ? 'ENABLED' : 'DISABLED'}, rateLimit=${next.rateLimitPerMinute}/min`);
      return await this.getApiReceiverConfig();
    }

    async resetApiReceiverConfigDefaults() {
      if (!this.getCurrentActor().isAdmin) {
        throw new Error('Access Denied: Only Administrators may reset Receiver API settings.');
      }
      if (isCloudFunctionsReady()) {
        const fn = firebase.functions().httpsCallable('updateKnowledgeApiSettings');
        const res = await fn({ action: 'resetConfig' });
        if (res && res.data) {
          await this.idb.put('knowledge_api_receivers', { ...res.data, receiverId: 'default' });
          return await this.getApiReceiverConfig();
        }
      }

      const baseOrigin = (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null')
        ? window.location.origin
        : 'https://your-project.cloudfunctions.net';
      const defaultEndpoint = window.isFirebaseAvailable
        ? `https://us-central1-${window.fbDb?.app?.options?.projectId || 'YOUR_PROJECT_ID'}.cloudfunctions.net/knowledgeReceiverApi`
        : `${baseOrigin}/api/knowledgeReceiverApi`;

      const existing = (await this.idb.get('knowledge_api_receivers', 'default')) || { receiverId: 'default' };
      const actor = this.getCurrentActor();
      const next = {
        ...existing,
        enabled: false,
        endpointUrl: defaultEndpoint,
        authMode: 'api_key_or_bearer',
        rateLimitPerMinute: 30,
        maxPayloadMb: 15,
        allowedIps: [],
        webhookModeEnabled: true,
        updatedBy: actor.email || actor.name || 'admin',
        updatedAt: new Date().toISOString()
      };
      await this.idb.put('knowledge_api_receivers', next);
      await this.writeAuditLog('API_SETTINGS_RESET', 'default', 'Reset Receiver API settings to defaults (disabled, 30 req/min, 15 MB).');
      return await this.getApiReceiverConfig();
    }

    async rotateApiSecrets() {
      if (!this.getCurrentActor().isAdmin) {
        throw new Error('Access Denied: Only Administrators may rotate API credentials.');
      }
      if (isCloudFunctionsReady()) {
        try {
          const fn = firebase.functions().httpsCallable('updateKnowledgeApiSettings');
          const res = await fn({ action: 'rotateSecrets' });
          if (res && res.data) return res.data;
        } catch (e) {}
      }

      const sec = getSec();
      const randHex = (len = 24) => {
        const arr = new Uint8Array(len);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr);
        else for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 256);
        return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
      };

      const rawApiKey = `jnsk_live_${randHex(20)}`;
      const rawBearer = `jnsb_live_${randHex(24)}`;
      const rawWebhookSecret = `jnsw_sec_${randHex(18)}`;

      const [keyHash, bearerHash, webhookSecretHash] = await Promise.all([
        sec.computeSha256Hex(rawApiKey),
        sec.computeSha256Hex(rawBearer),
        sec.computeSha256Hex(rawWebhookSecret)
      ]);

      const existing = (await this.idb.get('knowledge_api_receivers', 'default')) || { receiverId: 'default' };
      const next = {
        ...existing,
        keyHash,
        bearerHash,
        webhookSecretHash,
        apiKeyMasked: `${rawApiKey.slice(0, 12)}••••••••${rawApiKey.slice(-4)}`,
        bearerTokenMasked: `${rawBearer.slice(0, 12)}••••••••${rawBearer.slice(-4)}`,
        webhookSecretMasked: `${rawWebhookSecret.slice(0, 10)}••••••••${rawWebhookSecret.slice(-4)}`,
        hasApiKey: true,
        hasBearerToken: true,
        rotatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await this.idb.put('knowledge_api_receivers', next);
      await this.writeAuditLog('API_SECRETS_ROTATED', 'default', 'Rotated Receiver API key, Bearer token, and Webhook signing secret (stored hashed).');

      // Returned ONCE only; never persisted in plaintext
      return {
        apiKey: rawApiKey,
        bearerToken: rawBearer,
        webhookSecret: rawWebhookSecret,
        config: await this.getApiReceiverConfig()
      };
    }

    /**
     * Server-Contract Receiver API Processor (Authentication -> Validation -> Security Scan -> Ingestion)
     * Never logs raw tokens or sensitive payloads.
     */
    async processReceiverApiRequest({ method = 'POST', headers = {}, body = null, clientIp = '127.0.0.1' }) {
      const sec = getSec();
      const parsers = getParsers();
      const apiLogId = genId('apilog');
      const nowIso = new Date().toISOString();
      const normalizedHeaders = {};
      for (const [k, v] of Object.entries(headers || {})) {
        normalizedHeaders[k.toLowerCase()] = String(v || '');
      }

      const cfg = await this.idb.get('knowledge_api_receivers', 'default');

      const recordApiLog = async (statusCode, outcome, message, extra = {}) => {
        const logEntry = {
          apiLogId,
          method: String(method).toUpperCase(),
          clientIp: String(clientIp || '').slice(0, 64),
          statusCode,
          status: statusCode >= 200 && statusCode < 300 ? 'SUCCESS' : 'FAILED',
          outcome,
          message: String(message || '').slice(0, 300),
          idempotencyKey: extra.idempotencyKey || null,
          docId: extra.docId || null,
          retryable: Boolean(extra.retryable),
          retryPayload: extra.retryable ? extra.safePayloadMeta : null,
          timestamp: nowIso
        };
        await this.idb.put('knowledge_api_logs', logEntry);
        if (cfg) {
          if (statusCode >= 200 && statusCode < 300) cfg.lastSuccessAt = nowIso;
          else {
            cfg.lastErrorAt = nowIso;
            cfg.lastErrorMessage = message;
          }
          await this.idb.put('knowledge_api_receivers', cfg);
        }
        return logEntry;
      };

      if (!cfg || !cfg.enabled) {
        await recordApiLog(503, 'API_DISABLED', 'Receiver API is currently disabled by Administrator.');
        return { ok: false, statusCode: 503, error: 'Receiver API is disabled.' };
      }

      if (String(method).toUpperCase() !== 'POST') {
        await recordApiLog(405, 'METHOD_NOT_ALLOWED', 'Only POST requests are accepted by Receiver API.');
        return { ok: false, statusCode: 405, error: 'Method Not Allowed. Use POST.' };
      }

      // IP Allowlist Check
      if (Array.isArray(cfg.allowedIps) && cfg.allowedIps.length > 0) {
        if (!cfg.allowedIps.includes(clientIp)) {
          await recordApiLog(403, 'IP_BLOCKED', `Client IP ${clientIp} is not in allowlist.`);
          return { ok: false, statusCode: 403, error: 'Forbidden: Client IP not authorized.' };
        }
      }

      // Authentication Check (X-API-Key or Bearer Token)
      const providedKey = normalizedHeaders['x-api-key'] || '';
      const authHdr = normalizedHeaders['authorization'] || '';
      const providedBearer = authHdr.toLowerCase().startsWith('bearer ') ? authHdr.slice(7).trim() : '';

      let authValid = false;
      if (providedKey && cfg.keyHash) {
        const h = await sec.computeSha256Hex(providedKey);
        if (h === cfg.keyHash && cfg.authMode !== 'bearer_only') authValid = true;
      }
      if (!authValid && providedBearer && cfg.bearerHash) {
        const h = await sec.computeSha256Hex(providedBearer);
        if (h === cfg.bearerHash && cfg.authMode !== 'api_key_only') authValid = true;
      }

      if (cfg.authMode === 'hmac_webhook') {
        authValid = false;
      }
      const webhookHdr = normalizedHeaders['x-webhook-secret'] || '';
      if (!authValid && webhookHdr && cfg.webhookSecretHash && (cfg.webhookModeEnabled !== false || cfg.authMode === 'hmac_webhook')) {
        const wh = await sec.computeSha256Hex(webhookHdr);
        if (wh === cfg.webhookSecretHash) authValid = true;
      }

      if (!authValid) {
        await recordApiLog(401, 'UNAUTHORIZED', 'Missing or invalid API key / Bearer token.');
        return { ok: false, statusCode: 401, error: 'Unauthorized: Valid API credentials required.' };
      }

      // Rate Limiting Check
      const minuteKey = `${Math.floor(Date.now() / 60000)}`;
      const curCount = this._apiRateBuckets.get(minuteKey) || 0;
      if (curCount >= (Number(cfg.rateLimitPerMinute) || 30)) {
        await recordApiLog(429, 'RATE_LIMITED', 'Receiver API rate limit exceeded.');
        return { ok: false, statusCode: 429, error: 'Too Many Requests: Rate limit exceeded.' };
      }
      this._apiRateBuckets.set(minuteKey, curCount + 1);

      // Payload & Size Validation
      if (!body || typeof body !== 'object') {
        await recordApiLog(400, 'INVALID_PAYLOAD', 'Request body must be a valid JSON object.');
        return { ok: false, statusCode: 400, error: 'Invalid JSON payload.' };
      }
      const payloadStr = JSON.stringify(body);
      const maxBytes = (Number(cfg.maxPayloadMb) || 15) * 1024 * 1024;
      if (payloadStr.length > maxBytes) {
        await recordApiLog(413, 'PAYLOAD_TOO_LARGE', 'Payload exceeds configured size limit.');
        return { ok: false, statusCode: 413, error: 'Payload Too Large.' };
      }

      // Idempotency Check
      const idempotencyKey = String(normalizedHeaders['x-idempotency-key'] || body.idempotencyKey || '').trim().slice(0, 120);
      if (idempotencyKey) {
        const existingIdem = await this.idb.get('knowledge_idempotency', idempotencyKey);
        if (existingIdem) {
          await recordApiLog(200, 'IDEMPOTENT_REPLAY', `Duplicate idempotency key '${idempotencyKey}' ignored safely.`, { idempotencyKey, docId: existingIdem.docId });
          return { ok: true, statusCode: 200, idempotentReplay: true, docId: existingIdem.docId, message: 'Already processed (idempotent replay).' };
        }
      }

      // Validate document or JSON text payload
      let bytes;
      let filename;
      let mimeType;
      if (body.base64 && body.filename) {
        try {
          const bin = atob(String(body.base64));
          bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        } catch (e) {
          await recordApiLog(400, 'INVALID_BASE64', 'Invalid base64 document payload.', { idempotencyKey, retryable: true, safePayloadMeta: { title: body.title, filename: body.filename } });
          return { ok: false, statusCode: 400, error: 'Invalid base64 encoding.' };
        }
        filename = String(body.filename).slice(0, 200);
        mimeType = String(body.mimeType || '');
      } else if (body.content || body.text) {
        const title = String(body.title || 'External API Knowledge Record').trim().slice(0, 120);
        const rawText = `# ${title}\n\n${String(body.content || body.text).trim()}`;
        bytes = parsers.utf8Encode(rawText);
        filename = `${sec.sanitizeFilename(title)}.txt`;
        mimeType = 'text/plain';
      } else {
        await recordApiLog(400, 'MISSING_CONTENT', 'Provide either { title, content } or { filename, base64 }.', { idempotencyKey });
        return { ok: false, statusCode: 400, error: 'Payload must include content/text or filename+base64.' };
      }

      // Run Ingestion Pipeline (Security Scan -> Extraction -> Chunking -> Embedding -> Indexing)
      const ingestRes = await this.ingestDocument({
        bytes,
        filename,
        mimeType,
        contributorName: String(body.sourceSystem || 'External Receiver API').slice(0, 80),
        categoryHint: String(body.category || '').slice(0, 80),
        sourceReliability: body.sourceReliability === 'official' ? 'official' : 'verified_partner',
        sourceChannel: 'API_RECEIVER'
      });

      if (!ingestRes.success) {
        const code = ingestRes.quarantined ? 422 : (ingestRes.duplicate ? 200 : 422);
        await recordApiLog(code, ingestRes.quarantined ? 'QUARANTINED' : (ingestRes.duplicate ? 'DUPLICATE' : 'INGEST_FAILED'), ingestRes.reason || ingestRes.message, {
          idempotencyKey,
          docId: ingestRes.docId,
          retryable: !ingestRes.quarantined && !ingestRes.duplicate,
          safePayloadMeta: { title: body.title || filename, content: body.content ? String(body.content).slice(0, 500) : null }
        });
        return {
          ok: Boolean(ingestRes.duplicate),
          statusCode: code,
          quarantined: Boolean(ingestRes.quarantined),
          duplicate: Boolean(ingestRes.duplicate),
          docId: ingestRes.docId || null,
          error: ingestRes.duplicate ? null : (ingestRes.reason || ingestRes.message),
          message: ingestRes.message
        };
      }

      if (idempotencyKey) {
        await this.idb.put('knowledge_idempotency', { idempotencyKey, docId: ingestRes.docId, createdAt: nowIso });
      }
      await recordApiLog(201, 'IMPORTED_AND_INDEXED', `Successfully imported and indexed ${ingestRes.docId} (${ingestRes.chunksCount} chunks).`, {
        idempotencyKey,
        docId: ingestRes.docId
      });

      return {
        ok: true,
        statusCode: 201,
        docId: ingestRes.docId,
        chunksCount: ingestRes.chunksCount,
        document: ingestRes.document,
        message: 'External data received, scanned, and indexed into AI Knowledge Centre.'
      };
    }

    async retryFailedApiRequest(apiLogId) {
      if (!this.getCurrentActor().isAdmin) {
        throw new Error('Access Denied: Only Administrators may retry API imports.');
      }
      const logRec = await this.idb.get('knowledge_api_logs', apiLogId);
      if (!logRec) throw new Error('API log entry not found.');
      if (!logRec.retryable || !logRec.retryPayload || !logRec.retryPayload.content) {
        throw new Error('This API request does not have a safely stored retryable text payload.');
      }

      const parsers = getParsers();
      const sec = getSec();
      const title = String(logRec.retryPayload.title || 'Retried External Record').slice(0, 120);
      const bytes = parsers.utf8Encode(`# ${title}\n\n${String(logRec.retryPayload.content)}`);
      const ingestRes = await this.ingestDocument({
        bytes,
        filename: `${sec.sanitizeFilename(title)}.txt`,
        mimeType: 'text/plain',
        contributorName: 'External Receiver API (Retried)',
        sourceReliability: 'verified_partner',
        sourceChannel: 'API_RECEIVER_RETRY'
      });

      logRec.retriedAt = new Date().toISOString();
      logRec.retryOutcome = ingestRes.success ? 'RETRY_SUCCEEDED' : (ingestRes.reason || ingestRes.message);
      if (ingestRes.success) {
        logRec.retryable = false;
        logRec.docId = ingestRes.docId;
      }
      await this.idb.put('knowledge_api_logs', logRec);
      await this.writeAuditLog('API_IMPORT_RETRIED', apiLogId, `Retried API log ${apiLogId}: ${logRec.retryOutcome}`);
      return ingestRes;
    }

    async deleteApiLogEntry(apiLogId) {
      if (!this.getCurrentActor().isAdmin) {
        throw new Error('Access Denied: Only Administrators may delete Receiver API logs.');
      }
      if (!apiLogId) throw new Error('Missing apiLogId.');
      if (isCloudFunctionsReady()) {
        try {
          const fn = firebase.functions().httpsCallable('updateKnowledgeApiSettings');
          const res = await fn({ action: 'deleteApiLog', apiLogId });
          if (res && res.data && res.data.success) return res.data;
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud deleteApiLog fallback:', cloudErr.message);
        }
      }
      await this.idb.del('knowledge_api_logs', apiLogId);
      await this.writeAuditLog('API_LOG_DELETED', apiLogId, `Deleted Receiver API log entry ${apiLogId}`);
      return { success: true, apiLogId };
    }

    async clearApiLogs() {
      if (!this.getCurrentActor().isAdmin) {
        throw new Error('Access Denied: Only Administrators may clear Receiver API logs.');
      }
      if (isCloudFunctionsReady()) {
        try {
          const fn = firebase.functions().httpsCallable('updateKnowledgeApiSettings');
          const res = await fn({ action: 'clearApiLogs' });
          if (res && res.data && res.data.success) return res.data;
        } catch (cloudErr) {
          console.warn('[KnowledgeStorage] Cloud clearApiLogs fallback:', cloudErr.message);
        }
      }
      const existing = await this.idb.getAll('knowledge_api_logs');
      await this.idb.clearStore('knowledge_api_logs');
      await this.writeAuditLog('API_LOGS_CLEARED', 'default', `Cleared ${existing.length} Receiver API log entries.`);
      return { success: true, clearedCount: existing.length };
    }

    async deleteAuditLogEntry(auditId) {
      if (!this.getCurrentActor().isAdmin) {
        throw new Error('Access Denied: Only Administrators may delete Security & Operations Audit logs.');
      }
      if (!auditId) throw new Error('Missing auditId.');
      if (isCloudFunctionsReady()) {
        const fn = firebase.functions().httpsCallable('updateKnowledgeApiSettings');
        const res = await fn({ action: 'deleteAuditLog', auditId });
        if (!res || !res.data || !res.data.success) {
          throw new Error('Server did not confirm audit log deletion.');
        }
      }
      await this.idb.del('knowledge_audit_logs', auditId);
      return { success: true, auditId };
    }

    async clearAuditLogs() {
      if (!this.getCurrentActor().isAdmin) {
        throw new Error('Access Denied: Only Administrators may clear Security & Operations Audit logs.');
      }
      if (isCloudFunctionsReady()) {
        const fn = firebase.functions().httpsCallable('updateKnowledgeApiSettings');
        const res = await fn({ action: 'clearAuditLogs' });
        if (!res || !res.data || !res.data.success) {
          throw new Error('Server did not confirm clearing audit logs.');
        }
      }
      const existing = await this.idb.getAll('knowledge_audit_logs');
      await this.idb.clearStore('knowledge_audit_logs');
      return { success: true, clearedCount: existing.length };
    }

    async testApiConnection({ apiKey = '', bearerToken = '', webhookSecret = '' } = {}) {
      if (isCloudFunctionsReady() && this.getCurrentActor().isAdmin) {
        try {
          const fn = firebase.functions().httpsCallable('getKnowledgeAdminOverview');
          const res = await fn({});
          const remoteCfg = res?.data?.apiConfig;
          if (remoteCfg) {
            if (!remoteCfg.enabled) return { ok: false, status: 'DISABLED', message: 'Receiver API is currently disabled on Cloud server.' };
            if (!remoteCfg.hasApiKey && !remoteCfg.hasBearerToken) {
              return { ok: false, status: 'NOT_CONFIGURED', message: 'Generate API credentials on Cloud server first.' };
            }
            if (!apiKey && !bearerToken) {
              return { ok: true, status: 'READY', message: 'Cloud Receiver API configured and enabled. Provide credentials to test live endpoint.' };
            }
          }
        } catch (e) {}
      }

      const cfg = await this.idb.get('knowledge_api_receivers', 'default');
      if (!cfg) return { ok: false, status: 'NOT_CONFIGURED', message: 'Generate API credentials first.' };
      if (!cfg.enabled) return { ok: false, status: 'DISABLED', message: 'Receiver API is currently disabled.' };

      const sec = getSec();
      let match = false;
      if (apiKey && cfg.keyHash && (await sec.computeSha256Hex(apiKey)) === cfg.keyHash) match = true;
      if (!match && bearerToken && cfg.bearerHash && (await sec.computeSha256Hex(bearerToken)) === cfg.bearerHash) match = true;
      if (!match && webhookSecret && cfg.webhookSecretHash && (await sec.computeSha256Hex(webhookSecret)) === cfg.webhookSecretHash) match = true;

      if (!apiKey && !bearerToken && !webhookSecret) {
        const hasCreds = Boolean(cfg.keyHash || cfg.bearerHash || cfg.hasApiKey || cfg.hasBearerToken);
        return {
          ok: hasCreds,
          status: hasCreds ? 'READY' : 'NOT_CONFIGURED',
          message: hasCreds
            ? 'Receiver API endpoint configured and enabled. Provide your API key, Bearer token, or Webhook secret to verify live auth.'
            : 'Receiver API enabled, but no credentials have been generated yet.'
        };
      }

      return match
        ? { ok: true, status: 'AUTHENTICATED', message: 'Connection test passed: API credentials verified and Receiver pipeline ready.' }
        : { ok: false, status: 'UNAUTHORIZED', message: 'Connection test failed: Provided API key, Bearer token, or Webhook secret does not match stored hash.' };
    }
  }

  window.JanasevaKnowledgeCentre = new JanasevaKnowledgeCentreManager();
})(window);
