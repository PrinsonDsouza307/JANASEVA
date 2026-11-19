/**
 * JANASEVA – Client-Side Realtime Database ↔ Firestore Sync Engine
 * 
 * Keeps both databases in lockstep in real-time:
 * - When a complaint is written to Firestore, it mirrors to RTDB
 * - When a complaint is written to RTDB, it mirrors to Firestore
 * - Prevents infinite loops with a sync-lock flag
 * 
 * This runs in the browser and uses the Firebase compat SDKs.
 */

(function() {
  'use strict';

  // Wait for Firebase to initialize
  if (!window.fbDb || !window.fbRTDB) {
    // Try again after a short delay (Firebase may still be initializing)
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initSync, 1500);
    });
    return;
  }

  initSync();

  function initSync() {
    if (!window.fbDb || !window.fbRTDB) {
      console.info('[SYNC] RTDB or Firestore not available. Database sync disabled.');
      return;
    }

    console.info('[SYNC] Initializing RTDB ↔ Firestore bidirectional sync...');

    const firestore = window.fbDb;
    const rtdb = window.fbRTDB;
    const syncLock = new Set(); // Prevent infinite sync loops

    // Collections to sync
    const SYNC_TARGETS = [
      'complaints',
      'users',
      'panchayats',
      'notifications',
      'complaint_updates',
      'systemSettings',
      'adminBanners'
    ];

    // ========================================================================
    // Firestore → RTDB sync
    // ========================================================================
    function setupFirestoreToRTDB(collectionName) {
      // Only listen after auth
      if (!window.fbAuth) return;

      window.fbAuth.onAuthStateChanged(user => {
        if (!user) return;

        firestore.collection(collectionName).onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            const docId = change.doc.id;
            const lockKey = `${collectionName}/${docId}`;

            if (syncLock.has(lockKey)) {
              syncLock.delete(lockKey);
              return; // This change was triggered by RTDB→FS sync, skip
            }

            const data = change.doc.data();

            if (change.type === 'added' || change.type === 'modified') {
              syncLock.add(lockKey); // Lock to prevent loop
              const sanitized = sanitizeForRTDB(data);
              rtdb.ref(`${collectionName}/${docId}`).set(sanitized)
                .then(() => {
                  console.debug(`[SYNC FS→RTDB] ${lockKey}`);
                  setTimeout(() => syncLock.delete(lockKey), 2000);
                })
                .catch(err => {
                  console.warn(`[SYNC ERROR] FS→RTDB ${lockKey}:`, err.message);
                  syncLock.delete(lockKey);
                });
            } else if (change.type === 'removed') {
              rtdb.ref(`${collectionName}/${docId}`).remove()
                .catch(err => console.warn(`[SYNC ERROR] Remove ${lockKey}:`, err.message));
            }
          });
        }, err => {
          console.warn(`[SYNC] Firestore listener error for ${collectionName}:`, err.message);
        });
      });
    }

    // ========================================================================
    // RTDB → Firestore sync
    // ========================================================================
    function setupRTDBToFirestore(collectionName) {
      if (!window.fbAuth) return;

      window.fbAuth.onAuthStateChanged(user => {
        if (!user) return;

        rtdb.ref(collectionName).on('child_changed', snapshot => {
          const docId = snapshot.key;
          const lockKey = `${collectionName}/${docId}`;

          if (syncLock.has(lockKey)) {
            syncLock.delete(lockKey);
            return;
          }

          const data = snapshot.val();
          if (!data) return;

          syncLock.add(lockKey);
          const sanitized = sanitizeForFirestore(data);
          firestore.collection(collectionName).doc(docId).set(sanitized, { merge: true })
            .then(() => {
              console.debug(`[SYNC RTDB→FS] ${lockKey}`);
              setTimeout(() => syncLock.delete(lockKey), 2000);
            })
            .catch(err => {
              console.warn(`[SYNC ERROR] RTDB→FS ${lockKey}:`, err.message);
              syncLock.delete(lockKey);
            });
        });

        rtdb.ref(collectionName).on('child_added', snapshot => {
          const docId = snapshot.key;
          const lockKey = `${collectionName}/${docId}`;
          if (syncLock.has(lockKey)) return;

          const data = snapshot.val();
          if (!data) return;

          // Check if already in Firestore
          firestore.collection(collectionName).doc(docId).get()
            .then(doc => {
              if (!doc.exists) {
                syncLock.add(lockKey);
                const sanitized = sanitizeForFirestore(data);
                return firestore.collection(collectionName).doc(docId).set(sanitized);
              }
            })
            .then(() => {
              setTimeout(() => syncLock.delete(lockKey), 2000);
            })
            .catch(err => {
              console.warn(`[SYNC ERROR] RTDB→FS add ${lockKey}:`, err.message);
              syncLock.delete(lockKey);
            });
        });
      });
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    function sanitizeForRTDB(obj) {
      if (obj === null || obj === undefined) return null;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeForRTDB);

      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        // Convert Firestore Timestamps to ISO strings
        if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
          result[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
          result[key] = new Date(value.seconds * 1000).toISOString();
        } else {
          result[key] = sanitizeForRTDB(value);
        }
      }
      return result;
    }

    function sanitizeForFirestore(obj) {
      if (obj === null || obj === undefined) return null;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);

      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        if (key.startsWith('.')) continue; // RTDB internal keys
        result[key] = sanitizeForFirestore(value);
      }
      return result;
    }

    // ========================================================================
    // Initialize all sync listeners
    // ========================================================================
    for (const collection of SYNC_TARGETS) {
      setupFirestoreToRTDB(collection);
      setupRTDBToFirestore(collection);
    }

    // Expose sync status globally
    window.JANASEVA_SYNC = {
      enabled: true,
      targets: SYNC_TARGETS,
      syncLock: syncLock,
      status: () => ({
        enabled: true,
        activeLocks: syncLock.size,
        collections: SYNC_TARGETS
      })
    };

    console.info(`[SYNC] Bidirectional sync active for: ${SYNC_TARGETS.join(', ')}`);
  }
})();
