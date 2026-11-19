/**
 * JANASEVA 2.0 – Admin Banner Image Management Service
 * 
 * Provides secure, enterprise-grade banner image upload, replacement, preview,
 * and deletion capabilities strictly restricted to the Administrator role.
 * 
 * Features:
 * 1. Admin-Only Role Enforcement (client, service, and backend database guards)
 * 2. Secure file validation (JPG/JPEG/PNG/WEBP, Max 10MB, extension & MIME checks)
 * 3. Secure storage: Firebase Storage (when live) & IndexedDB binary blob store (local/hybrid)
 * 4. Separate metadata storage: URL, filename, size, dimensions, timestamps, admin UID
 * 5. Permanent administrative audit logging
 * 6. Responsive hero banner background rendering with default fallback
 */

(function() {
  'use strict';

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  const DEFAULT_BANNER_PATH = 'assets/panchayat-building.png';
  const IDB_NAME = 'janaseva_banner_storage';
  const IDB_STORE = 'bannerBlobs';

  class AdminBannerService {
    constructor() {
      this.currentBanner = null;
      this.idb = null;
      this._memoryBlobStore = {};
      this.initIndexedDB();
    }

    /**
     * Initialize dedicated IndexedDB for large image file blob storage
     */
    async initIndexedDB() {
      return new Promise((resolve) => {
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          resolve(null);
        }, 1500);

        if (!('indexedDB' in window)) {
          clearTimeout(timer);
          resolve(null);
          return;
        }
        try {
          const req = indexedDB.open(IDB_NAME, 1);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
              db.createObjectStore(IDB_STORE, { keyPath: 'id' });
            }
          };
          req.onsuccess = (e) => {
            if (!timedOut) {
              clearTimeout(timer);
              this.idb = e.target.result;
              resolve(this.idb);
            }
          };
          req.onerror = () => {
            if (!timedOut) {
              clearTimeout(timer);
              resolve(null);
            }
          };
          req.onblocked = () => {
            if (!timedOut) {
              clearTimeout(timer);
              resolve(null);
            }
          };
        } catch (err) {
          clearTimeout(timer);
          console.warn('[BannerService] IndexedDB init caught:', err);
          resolve(null);
        }
      });
    }

    /**
     * Verify strict Administrator authorization
     * Throws an error immediately if unauthorized.
     */
    requireAdmin() {
      const user = window.authService ? window.authService.currentUser : null;
      if (!user) {
        throw new Error("Access Denied: You must be logged in to access banner management.");
      }
      const role = (user.role || '').toLowerCase();
      const isAdmin = role === 'admin' || (window.authService && typeof window.authService.isAdmin === 'function' && window.authService.isAdmin());
      if (!isAdmin) {
        throw new Error("Access Denied: Only users with the ADMIN role can upload, replace, or delete banner images.");
      }
      return user;
    }

    /**
     * Check if currently signed-in user is an admin without throwing
     */
    isAdmin() {
      try {
        this.requireAdmin();
        return true;
      } catch (e) {
        return false;
      }
    }

    /**
     * Validate image file for security, format, and size
     */
    validateFile(file) {
      if (!file) {
        throw new Error("No file selected. Please choose an image to upload.");
      }

      // 1. File Size Check (10MB limit)
      if (file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        throw new Error(`File is too large (${sizeMb} MB). Maximum allowed upload size is 10 MB.`);
      }

      if (file.size === 0) {
        throw new Error("The selected file is empty. Please choose a valid image file.");
      }

      // 2. MIME Type Check
      const mime = (file.type || '').toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(mime)) {
        throw new Error(`Invalid image format (${mime || 'unknown'}). Only JPG, JPEG, PNG, and WEBP formats are accepted.`);
      }

      // 3. File Extension Check
      const name = file.name || '';
      const dotIndex = name.lastIndexOf('.');
      if (dotIndex === -1) {
        throw new Error("The file has no extension. Please choose a valid JPG, PNG, or WEBP image.");
      }
      const ext = name.substring(dotIndex).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`Invalid file extension (${ext}). Only .jpg, .jpeg, .png, and .webp are accepted.`);
      }

      // 4. Sanitize Filename (strip dangerous paths / scripts)
      const cleanName = name.replace(/[^a-zA-Z0-9._-]/g, '_');

      return {
        valid: true,
        cleanName,
        mime,
        size: file.size
      };
    }

    /**
     * Generate an in-memory preview data URL and image dimensions
     */
    async generatePreview(file) {
      this.validateFile(file);

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const img = new Image();
          img.onload = () => {
            resolve({
              dataUrl,
              filename: file.name,
              size: file.size,
              formattedSize: this.formatBytes(file.size),
              mimeType: file.type,
              width: img.width,
              height: img.height,
              aspectRatio: (img.width / img.height).toFixed(2)
            });
          };
          img.onerror = () => reject(new Error("Failed to load image preview. The file may be corrupt."));
          img.src = dataUrl;
        };
        reader.onerror = () => reject(new Error("Failed to read file from disk."));
        reader.readAsDataURL(file);
      });
    }

    /**
     * Store binary blob in IndexedDB (with in-memory fallback)
     */
    async storeBlobLocally(id, blob) {
      if (!this.idb) await this.initIndexedDB();
      if (!this.idb) {
        if (!this._memoryBlobStore) this._memoryBlobStore = {};
        this._memoryBlobStore[id] = blob;
        return true;
      }

      return new Promise((resolve) => {
        try {
          const tx = this.idb.transaction(IDB_STORE, 'readwrite');
          const store = tx.objectStore(IDB_STORE);
          store.put({ id, blob, updatedAt: Date.now() });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => {
            if (!this._memoryBlobStore) this._memoryBlobStore = {};
            this._memoryBlobStore[id] = blob;
            resolve(true);
          };
        } catch (e) {
          console.warn('[BannerService] Blob store caught, using fallback:', e);
          if (!this._memoryBlobStore) this._memoryBlobStore = {};
          this._memoryBlobStore[id] = blob;
          resolve(true);
        }
      });
    }

    /**
     * Retrieve binary blob from IndexedDB (with fallback)
     */
    async getBlobLocally(id) {
      if (this._memoryBlobStore && this._memoryBlobStore[id]) {
        return this._memoryBlobStore[id];
      }
      if (!this.idb) await this.initIndexedDB();
      if (!this.idb) return null;

      return new Promise((resolve) => {
        try {
          const tx = this.idb.transaction(IDB_STORE, 'readonly');
          const store = tx.objectStore(IDB_STORE);
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result ? req.result.blob : null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }

    /**
     * Delete binary blob from IndexedDB (and fallback)
     */
    async deleteBlobLocally(id) {
      if (this._memoryBlobStore) {
        delete this._memoryBlobStore[id];
      }
      if (!this.idb) await this.initIndexedDB();
      if (!this.idb) return true;

      return new Promise((resolve) => {
        try {
          const tx = this.idb.transaction(IDB_STORE, 'readwrite');
          const store = tx.objectStore(IDB_STORE);
          store.delete(id);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    }

    /**
     * Upload and save a new Banner Image (Admin Only)
     */
    async uploadBanner(file, isReplacement = false) {
      const adminUser = this.requireAdmin();
      const validation = this.validateFile(file);

      const bannerId = 'banner_' + Date.now();
      const storagePath = `banners/${bannerId}_${validation.cleanName}`;
      let finalImageUrl = null;

      // 1. Storage Upload
      if (window.isFirebaseAvailable && window.fbStorage) {
        try {
          const storageRef = window.fbStorage.ref(storagePath);
          const uploadSnapshot = await storageRef.put(file, {
            contentType: validation.mime,
            customMetadata: {
              uploadedBy: adminUser.email || adminUser.name || 'Admin',
              uploadedAt: new Date().toISOString()
            }
          });
          finalImageUrl = await uploadSnapshot.ref.getDownloadURL();
        } catch (storageErr) {
          console.warn('[BannerService] Firebase Storage upload warning:', storageErr);
        }
      }

      // Fallback / Offline Storage via IndexedDB Blob Store
      if (!finalImageUrl) {
        await this.storeBlobLocally(bannerId, file);
        // Create an Object URL for instantaneous rendering
        finalImageUrl = URL.createObjectURL(file);
      }

      const nowFormatted = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      const metadata = {
        bannerId,
        filename: validation.cleanName,
        originalFilename: file.name,
        fileSize: validation.size,
        formattedSize: this.formatBytes(validation.size),
        mimeType: validation.mime,
        storagePath,
        imageUrl: finalImageUrl,
        uploadedBy: adminUser.uid || 'usr-demo-admin',
        uploadedByEmail: adminUser.email || '',
        uploadedByName: adminUser.name || 'System Administrator',
        uploadedAt: nowFormatted,
        updatedAt: nowFormatted,
        active: true
      };

      // 2. Persist metadata in Database Layer
      if (typeof window.JanasevaDB !== 'undefined') {
        window.JanasevaDB.set('adminBanner', metadata);
      }

      // Also sync to Cloud Firestore if connected (require confirmation before returning success)
      if (window.isFirebaseAvailable && window.fbDb) {
        await window.fbDb.collection('adminBanners').doc(bannerId).set(metadata);
        await window.fbDb.collection('systemSettings').doc('adminBanner').set(metadata);
      }

      this.currentBanner = metadata;

      // 3. Record in Administrative Activity & Audit Trail
      this.recordAuditLog(
        isReplacement ? 'BANNER_REPLACE' : 'BANNER_UPLOAD',
        `Admin ${adminUser.email} ${isReplacement ? 'replaced' : 'uploaded'} banner image: ${validation.cleanName} (${metadata.formattedSize})`
      );

      // 4. Update the live DOM header
      this.applyBannerToDOM(metadata.imageUrl);

      // 5. Notify system components
      window.dispatchEvent(new CustomEvent('janaseva:bannerUpdated', { detail: metadata }));

      return metadata;
    }

    /**
     * Replace existing banner with confirmation guard (Admin Only)
     */
    async replaceBanner(file) {
      return this.uploadBanner(file, true);
    }

    /**
     * Delete active banner and revert to default Gram Panchayat background (Admin Only)
     */
    async deleteBanner() {
      const adminUser = this.requireAdmin();
      const prevBanner = this.getBanner();

      if (!prevBanner || !prevBanner.active) {
        throw new Error("No custom banner is currently active to delete.");
      }

      // 1. Delete from Firebase Storage if live
      if (window.isFirebaseAvailable && window.fbStorage && prevBanner.storagePath) {
        try {
          const storageRef = window.fbStorage.ref(prevBanner.storagePath);
          await storageRef.delete();
        } catch (e) {
          console.warn('[BannerService] Storage delete warning:', e);
        }
      }

      // Delete from IndexedDB blob store if locally stored
      if (prevBanner.bannerId) {
        await this.deleteBlobLocally(prevBanner.bannerId);
      }

      if (window.isFirebaseAvailable && window.fbDb) {
        if (prevBanner.bannerId) {
          try {
            await window.fbDb.collection('adminBanners').doc(prevBanner.bannerId).delete();
          } catch (e) {
            console.warn('[BannerService] Archive banner doc delete warning:', e);
          }
        }
        await window.fbDb.collection('systemSettings').doc('adminBanner').delete();
      }

      // 2. Remove Local Cache ONLY after Firestore confirms
      if (typeof window.JanasevaDB !== 'undefined') {
        window.JanasevaDB.set('adminBanner', null);
      }

      this.currentBanner = null;

      // 3. Record Audit Log
      this.recordAuditLog(
        'BANNER_DELETE',
        `Admin ${adminUser.email} deleted custom banner ${prevBanner.filename || ''}. Reverted to default Gram Panchayat banner.`
      );

      // 4. Revert DOM header to default Gram Panchayat building
      this.applyBannerToDOM(DEFAULT_BANNER_PATH);

      // 5. Broadcast update
      window.dispatchEvent(new CustomEvent('janaseva:bannerUpdated', { detail: null }));

      return true;
    }

    /**
     * Retrieve active banner metadata from Database / Cloud Firestore
     */
    getBanner() {
      if (typeof window.JanasevaDB !== 'undefined') {
        const stored = window.JanasevaDB.get('adminBanner', null);
        if (stored && stored.active) {
          return stored;
        }
      }
      return null;
    }

    /**
     * Asynchronously loads and applies active banner to the page
     */
    async loadAndApplyBanner() {
      let banner = this.getBanner();

      // Check Cloud Firestore if available
      if (window.isFirebaseAvailable && window.fbDb) {
        try {
          const doc = await window.fbDb.collection('systemSettings').doc('adminBanner').get();
          if (doc.exists && doc.data() && doc.data().active) {
            banner = doc.data();
            if (typeof window.JanasevaDB !== 'undefined') {
              window.JanasevaDB.set('adminBanner', banner);
            }
          }
        } catch (e) {
          console.warn('[BannerService] Load from Firestore caught:', e);
        }
      }

      if (banner && banner.active) {
        // If image URL is stored as an offline blob reference, resurrect Blob URL
        if (banner.bannerId && (!banner.imageUrl || banner.imageUrl.startsWith('blob:'))) {
          const blob = await this.getBlobLocally(banner.bannerId);
          if (blob) {
            banner.imageUrl = URL.createObjectURL(blob);
          }
        }
        this.currentBanner = banner;
        this.applyBannerToDOM(banner.imageUrl);
      } else {
        this.currentBanner = null;
        this.applyBannerToDOM(DEFAULT_BANNER_PATH);
      }

      this.updateHeaderControlsVisibility();
      return this.currentBanner;
    }

    /**
     * Strict refresh from Firestore or LocalStorage (never wipes current banner on network error)
     */
    async refreshBanner(options = {}) {
      const strictRemote = Boolean(options && options.strictRemote);
      let banner = null;

      if (window.isFirebaseAvailable && window.fbDb) {
        let doc;
        try {
          doc = await window.fbDb.collection('systemSettings').doc('adminBanner').get();
        } catch (err) {
          if (strictRemote) {
            throw new Error('Database unreachable while refreshing banner settings: ' + (err.message || err));
          }
          return this.currentBanner || this.getBanner();
        }
        if (doc && doc.exists && doc.data() && doc.data().active) {
          banner = doc.data();
          if (typeof window.JanasevaDB !== 'undefined') {
            window.JanasevaDB.set('adminBanner', banner);
          }
        } else {
          if (typeof window.JanasevaDB !== 'undefined') {
            window.JanasevaDB.set('adminBanner', null);
          }
        }
      } else {
        banner = this.getBanner();
      }

      if (banner && banner.active) {
        if (banner.bannerId && (!banner.imageUrl || banner.imageUrl.startsWith('blob:'))) {
          const blob = await this.getBlobLocally(banner.bannerId);
          if (blob) banner.imageUrl = URL.createObjectURL(blob);
        }
        this.currentBanner = banner;
        this.applyBannerToDOM(banner.imageUrl);
      } else {
        this.currentBanner = null;
        this.applyBannerToDOM(DEFAULT_BANNER_PATH);
      }

      this.updateHeaderControlsVisibility();
      return this.currentBanner;
    }

    /**
     * Apply image as background to the Admin Control Centre hero banner
     */
    applyBannerToDOM(imageUrl) {
      const overlay = document.getElementById('admin-hero-bg-overlay') || document.querySelector('.hero-banner .hero-bg-overlay');
      if (!overlay) return;

      const targetUrl = imageUrl || DEFAULT_BANNER_PATH;
      overlay.style.backgroundImage = `url('${targetUrl}')`;
      overlay.style.backgroundSize = 'cover';
      overlay.style.backgroundPosition = 'center right';
      overlay.style.backgroundRepeat = 'no-repeat';

      // Update any preview elements if active on the page
      const livePreview = document.getElementById('banner-live-preview-img');
      if (livePreview) {
        livePreview.src = targetUrl;
      }
    }

    /**
     * Update visibility of header controls based strictly on ADMIN authentication
     */
    updateHeaderControlsVisibility() {
      const headerControls = document.getElementById('admin-banner-header-actions');
      const tabBtn = document.getElementById('tab-btn-banner-mgmt');
      const isAdministrator = this.isAdmin();

      if (headerControls) {
        headerControls.style.display = isAdministrator ? 'inline-flex' : 'none';
      }
      if (tabBtn) {
        tabBtn.style.display = isAdministrator ? 'inline-flex' : 'none';
      }

      // Update button text if custom banner already exists
      const btnText = document.getElementById('banner-action-btn-text');
      if (btnText) {
        const hasCustom = !!this.getBanner();
        btnText.textContent = hasCustom ? 'Replace Image' : 'Add Image';
      }
    }

    /**
     * Record administrative action in permanent audit log
     */
    recordAuditLog(action, details) {
      if (typeof window.JanasevaDB === 'undefined') return;

      const user = window.authService?.currentUser;
      const audits = window.JanasevaDB.get('adminAuditLogs', []);
      const newLog = {
        id: 'LOG-BANNER-' + Date.now(),
        action: action,
        actor: user ? (user.email || user.name) : '',
        actorRole: user ? user.role : 'admin',
        details: details,
        timestamp: new Date().toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        })
      };

      audits.unshift(newLog);
      window.JanasevaDB.set('adminAuditLogs', audits.slice(0, 150));

      // Trigger audit log re-render if active on receiver dashboard
      if (typeof window.renderAuditLogsTable === 'function') {
        window.renderAuditLogsTable();
      }
    }

    /**
     * Format bytes into human-readable string
     */
    formatBytes(bytes, decimals = 2) {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
  }

  // Export singleton globally
  window.AdminBannerService = AdminBannerService;
  window.adminBannerService = new AdminBannerService();

  // Auto-initialize when DOM and Auth are ready
  document.addEventListener('DOMContentLoaded', () => {
    window.adminBannerService.loadAndApplyBanner();
  });

  window.addEventListener('janaseva:authChanged', () => {
    window.adminBannerService.loadAndApplyBanner();
  });

})();
