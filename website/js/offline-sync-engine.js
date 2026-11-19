/**
 * JANASEVA – Offline-First Engine & Automatic Synchronization Controller
 * 
 * Provides:
 * 1. Real-time online/offline network state detection
 * 2. Automatic processing of pending notification and grievance queues on reconnect
 * 3. Idempotent dispatch to prevent duplicate messages
 * 4. Mobile (Capacitor/WebView) vs Desktop environment detection
 */

(function(window) {
  'use strict';

  class OfflineSyncEngine {
    constructor() {
      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      this.syncInProgress = false;
      this.deviceContext = this.detectDevice();
      this.initListeners();
    }

    detectDevice() {
      const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.toLowerCase() : '';
      const isJanasevaAndroid = Boolean((typeof window !== 'undefined' && window.JanasevaNative) || /janaseva-android/i.test(ua));
      const isCapacitor = Boolean(typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
      const isNativeApp = isJanasevaAndroid || isCapacitor;
      const isMobileScreen = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
      const isMobileUA = /android|iphone|ipad|ipod|mobile/.test(ua);

      let platformName = 'Desktop Browser';
      if (isJanasevaAndroid) platformName = 'JANASEVA Android App';
      else if (isCapacitor) platformName = 'Android Native APK';
      else if (isMobileUA) platformName = 'Mobile Browser';

      return {
        isNativeApp: isNativeApp,
        isJanasevaAndroid: isJanasevaAndroid,
        isMobile: isNativeApp || isMobileScreen || isMobileUA,
        isDesktop: !isNativeApp && !isMobileScreen && !isMobileUA,
        platform: platformName
      };
    }

    initListeners() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.updateNetworkUI(true);
        this.onNetworkRestored();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.updateNetworkUI(false);
      });

      // Periodic queue check every 30 seconds if online
      setInterval(() => {
        if (this.isOnline && !this.syncInProgress) {
          this.syncPendingQueues();
        }
      }, 30000);
    }

    updateNetworkUI(online) {
      const banner = document.getElementById('offline-sync-banner');
      if (banner) {
        banner.style.display = online ? 'none' : 'flex';
      }

      const statusPill = document.getElementById('network-status-indicator');
      if (statusPill) {
        statusPill.innerHTML = online 
          ? '<i class="fa-solid fa-circle-check" style="color:#16a34a;"></i> <span>Online</span>'
          : '<i class="fa-solid fa-cloud-arrow-down" style="color:#f59e0b;"></i> <span>Offline Mode</span>';
      }

      window.dispatchEvent(new CustomEvent('janaseva:networkStatusChanged', { detail: { online } }));
    }

    async onNetworkRestored() {
      if (typeof showToast === 'function') {
        showToast('Internet connectivity restored. Synchronizing queued operations...', 'info');
      }
      await this.syncPendingQueues();
    }

    async syncPendingQueues() {
      if (this.syncInProgress || !navigator.onLine) return;
      this.syncInProgress = true;

      try {
        if (window.JanasevaApiStore && window.JanasevaApiStore.processOfflineNotificationQueue) {
          const notifRes = await window.JanasevaApiStore.processOfflineNotificationQueue();
          if (notifRes.processed > 0 && typeof showToast === 'function') {
            showToast(`Synchronized ${notifRes.processed} pending notifications successfully.`, 'success');
          }
        }

        // Process grievance submissions queue if complaint manager available
        if (window.janasevaOfflineDB && window.janasevaOfflineDB.checkAndSyncQueue) {
          await window.janasevaOfflineDB.checkAndSyncQueue();
        }
      } catch (err) {
        console.warn('[OfflineSync] Queue synchronization error:', err);
      } finally {
        this.syncInProgress = false;
        window.dispatchEvent(new CustomEvent('janaseva:syncCompleted'));
      }
    }
  }

  window.JanasevaSyncEngine = new OfflineSyncEngine();
  window.JanasevaDevice = window.JanasevaSyncEngine.deviceContext;
})(window);
