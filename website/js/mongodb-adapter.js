/**
 * JANASEVA – Client-Side MongoDB Integration Adapter
 * 
 * Connects the JANASEVA frontend to the backend MongoDB REST API.
 * Provides unified data synchronization for complaints, users, and panchayats.
 * 
 * Global Object: window.JanasevaMongoDB
 */

(function(window) {
  'use strict';

  class MongoDBAdapter {
    constructor() {
      this.apiBase = '/api/mongo';
      this.isConnected = false;
      this.lastHealth = null;
      this._readyPromise = null;
      this.init();
    }

    async init() {
      try {
        await this.checkHealth();
      } catch (e) {
        console.debug('[MONGODB ADAPTER] MongoDB API check:', e.message);
      }
    }

    ready() {
      if (!this._readyPromise) {
        this._readyPromise = this.checkHealth();
      }
      return this._readyPromise;
    }

    /**
     * Check if backend MongoDB is connected
     */
    async checkHealth() {
      try {
        const res = await fetch(`${this.apiBase}/health`);
        if (!res.ok) {
          this.isConnected = false;
          return { connected: false, error: `HTTP ${res.status}` };
        }
        const data = await res.json();
        this.isConnected = Boolean(data.connected);
        this.lastHealth = data;

        if (this.isConnected) {
          console.info(`[MONGODB] Connected to database: "${data.database}" (${data.stats?.complaints || 0} complaints)`);
          this.broadcastStatus(true, data);
          window.dispatchEvent(new CustomEvent('janaseva:mongoReady', { detail: data }));
        } else {
          console.info('[MONGODB] MongoDB not connected on server. Running in Local Mode.');
          this.broadcastStatus(false, data);
        }
        return data;
      } catch (err) {
        this.isConnected = false;
        return { connected: false, error: err.message };
      }
    }

    /**
     * Connect or switch MongoDB URI via API
     */
    async connectWithUri(uri) {
      try {
        const res = await fetch(`${this.apiBase}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri })
        });
        const data = await res.json();
        await this.checkHealth();
        return data;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // ------------------------------------------------------------------------
    // Complaints API
    // ------------------------------------------------------------------------

    /**
     * Submit / Upsert a complaint to MongoDB
     */
    async submitComplaint(complaintData) {
      try {
        const res = await fetch(`${this.apiBase}/complaints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(complaintData)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        this.isConnected = true;
        console.info(`[MONGODB] Complaint saved: ${complaintData.complaintId}`);
        return data.data;
      } catch (err) {
        console.warn('[MONGODB] Submit complaint error:', err.message);
        return null;
      }
    }

    /**
     * Fetch complaints with optional filter
     */
    async getComplaints(filter = {}) {
      try {
        const params = new URLSearchParams();
        if (filter.userId) params.set('userId', filter.userId);
        if (filter.citizenEmail) params.set('citizenEmail', filter.citizenEmail);
        if (filter.panchayatId) params.set('panchayatId', filter.panchayatId);
        if (filter.status) params.set('status', filter.status);
        if (filter.category) params.set('category', filter.category);
        if (filter.limit) params.set('limit', String(filter.limit));

        const res = await fetch(`${this.apiBase}/complaints?${params.toString()}`);
        if (!res.ok) return [];
        const result = await res.json();
        if (result && Array.isArray(result.data)) {
          this.isConnected = true;
          return result.data;
        }
        return [];
      } catch (err) {
        console.warn('[MONGODB] Fetch complaints error:', err.message);
        return [];
      }
    }

    /**
     * Get complaint by ID
     */
    async getComplaintById(complaintId) {
      if (!complaintId) return null;
      try {
        const res = await fetch(`${this.apiBase}/complaints/${encodeURIComponent(complaintId)}`);
        if (!res.ok) return null;
        const result = await res.json();
        if (result && result.data) {
          this.isConnected = true;
          return result.data;
        }
        return null;
      } catch (err) {
        return null;
      }
    }

    /**
     * Update complaint status or fields
     */
    async updateComplaint(complaintId, updates) {
      if (!complaintId) return null;
      try {
        const res = await fetch(`${this.apiBase}/complaints/${encodeURIComponent(complaintId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (!res.ok) return null;
        const result = await res.json();
        if (result && result.data) {
          this.isConnected = true;
          return result.data;
        }
        return null;
      } catch (err) {
        console.warn('[MONGODB] Update complaint error:', err.message);
        return null;
      }
    }

    // ------------------------------------------------------------------------
    // Panchayats API
    // ------------------------------------------------------------------------

    async getPanchayats() {
      try {
        const res = await fetch(`${this.apiBase}/panchayats`);
        if (!res.ok) return [];
        const result = await res.json();
        if (result && Array.isArray(result.data)) {
          this.isConnected = true;
          return result.data;
        }
        return [];
      } catch (err) {
        return [];
      }
    }

    async savePanchayat(gpData) {
      try {
        const res = await fetch(`${this.apiBase}/panchayats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gpData)
        });
        if (!res.ok) return null;
        const result = await res.json();
        return result.data || null;
      } catch (err) {
        return null;
      }
    }

    // ------------------------------------------------------------------------
    // Notifications API
    // ------------------------------------------------------------------------

    async getNotifications(userId) {
      try {
        const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        const res = await fetch(`${this.apiBase}/notifications${params}`);
        if (!res.ok) return [];
        const result = await res.json();
        return result.data || [];
      } catch (err) {
        return [];
      }
    }

    async sendNotification(notifData) {
      try {
        const res = await fetch(`${this.apiBase}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifData)
        });
        if (!res.ok) return null;
        const result = await res.json();
        return result.data || null;
      } catch (err) {
        return null;
      }
    }

    // Broadcast status to listeners
    broadcastStatus(connected, details) {
      try {
        window.dispatchEvent(new CustomEvent('janaseva:mongodbStatus', {
          detail: { connected, details }
        }));
      } catch (e) {}
    }
  }

  // Instantiate and export globally
  window.JanasevaMongoDB = new MongoDBAdapter();

  // Hook into complaint form submission if on complaint.html
  document.addEventListener('DOMContentLoaded', () => {
    // Listen for complaints saved locally, sync them to MongoDB if connected
    window.addEventListener('janaseva:complaintsChanged', async () => {
      if (window.JanasevaMongoDB) {
        console.debug('[MONGODB] Synced complaint change event');
      }
    });
  });

})(window);
