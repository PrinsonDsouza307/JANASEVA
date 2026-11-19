/**
 * JANASEVA – Universal Real-Time Notification & Alert Command Centre
 * Provides:
 *  1. Central Notification Hub across Website and Android APK.
 *  2. Real-time in-app notification bell with dynamic unread badge.
 *  3. Role-based filtering: Admin (system-wide), Receiver (operational), Citizen (personal grievances).
 *  4. Priority classification: CRITICAL, HIGH, NORMAL, LOW.
 *  5. Complete event tracking: complaints, user actions, AI Knowledge Centre, system health, APIs.
 *  6. Interactive drawer with search, category filtering, mark as read, delete, click-to-navigate.
 *  7. Offline resilience & dual-mode sync with Firestore / JanasevaDB.
 */

(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'janaseva_notifications';
  const PREFS_KEY = 'janaseva_notification_prefs';

  function genId() {
    return 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function timeAgo(isoString) {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  }

  class JanasevaNotificationCentre {
    constructor() {
      this.notifications = [];
      this.isDrawerOpen = false;
      this.activeCategory = 'all';
      this.activePriority = 'all';
      this.searchQuery = '';
      this.init();
    }

    getCurrentUser() {
      if (window.authService && window.authService.currentUser) {
        return window.authService.currentUser;
      }
      return {
        uid: 'citizen_guest',
        role: 'citizen',
        email: 'citizen@janaseva.local',
        name: 'Citizen'
      };
    }

    init() {
      this.loadNotifications();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.onReady());
      } else {
        this.onReady();
      }
    }

    onReady() {
      this.injectBellButton();
      this.setupAuthContainerObserver();
      this.listenAuthChanges();
      this.listenAppEvents();
      this.setupKeyboardListeners();
    }

    setupAuthContainerObserver() {
      const targetContainer = document.getElementById('header-action-controls') || 
                              document.getElementById('nav-auth-container');
      if (!targetContainer || this._authObserved) return;
      this._authObserved = true;

      try {
        const observer = new MutationObserver(() => {
          if (!document.getElementById('nav-notif-bell-btn')) {
            this.injectBellButton();
          }
        });
        observer.observe(targetContainer, { childList: true });
      } catch (e) {}
    }

    setupKeyboardListeners() {
      if (this._escListenerBound) return;
      this._escListenerBound = true;
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isDrawerOpen) {
          this.toggleDrawer();
        }
      });
    }

    listenAuthChanges() {
      // 1. Listen to custom window auth change events from AuthService
      window.addEventListener('janaseva:authChanged', () => {
        this.loadNotifications();
        this.injectBellButton();
      });

      // 2. Listen to Firebase auth state changes if available
      if (window.firebase && window.firebase.auth) {
        try {
          window.firebase.auth().onAuthStateChanged(() => {
            setTimeout(() => {
              this.loadNotifications();
              this.injectBellButton();
            }, 350);
          });
        } catch (e) {}
      }
    }

    listenAppEvents() {
      // Listen to custom window notification events
      window.addEventListener('janaseva:dispatch-notification', (ev) => {
        if (ev && ev.detail) {
          this.dispatch(ev.detail);
        }
      });
    }

    getStorageKey() {
      const user = this.getCurrentUser();
      if (user && user.uid && user.uid !== 'citizen_guest') {
        return `${STORAGE_KEY}_${user.uid}`;
      }
      return `${STORAGE_KEY}_guest`;
    }

    loadNotifications() {
      const user = this.getCurrentUser();
      const storageKey = this.getStorageKey();
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          this.notifications = JSON.parse(stored);
        } else {
          this.notifications = (window.isFirebaseAvailable) ? [] : this.getStarterSeedNotifications();
          this.saveNotifications();
        }
      } catch (e) {
        this.notifications = [];
      }
      this.updateBellBadge();

      // Live Firestore sync when connected
      if (window.isFirebaseAvailable && window.fbDb && user && user.uid && user.uid !== 'citizen_guest') {
        try {
          if (this._notifUnsub) { this._notifUnsub(); this._notifUnsub = null; }
          const query = (user.role === 'admin')
            ? window.fbDb.collection('notifications')
            : window.fbDb.collection('notifications').where('userId', '==', user.uid);
          
          this._notifUnsub = query.onSnapshot(snap => {
            const list = [];
            snap.forEach(d => {
              const data = d.data();
              list.push({ ...data, id: d.id });
            });
            if (list.length > 0) {
              this.notifications = list;
              this.saveNotifications();
              this.updateBellBadge();
              if (document.getElementById('notif-drawer-backdrop')?.classList.contains('active')) {
                this.renderDrawerContent();
              }
            }
          }, err => console.warn('Firestore notification sync notice:', err));
        } catch (fbErr) {
          console.warn('Notification sync listener notice:', fbErr);
        }
      }
    }

    onLogout() {
      if (this._notifUnsub) { this._notifUnsub(); this._notifUnsub = null; }
      this.notifications = [];
      this.updateBellBadge();
    }

    saveNotifications() {
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.notifications.slice(0, 150)));
      } catch (e) {}
      this.updateBellBadge();
    }

    getStarterSeedNotifications() {
      const now = new Date();
      return [
        {
          id: 'notif_init_1',
          eventId: 'evt_complaint_assigned',
          recipientRole: 'admin',
          recipientUid: 'all_admins',
          title: 'Grievance Assigned to Ward Officer',
          message: 'Complaint JAN-2026-0147 (Water Supply) has been assigned to Field Inspector K. Rao.',
          category: 'COMPLAINT',
          priority: 'NORMAL',
          relatedId: 'JAN-2026-0147',
          targetUrl: 'track.html?id=JAN-2026-0147',
          isRead: false,
          createdAt: new Date(now.getTime() - 15 * 60000).toISOString()
        },
        {
          id: 'notif_init_2',
          eventId: 'evt_api_test_ok',
          recipientRole: 'admin',
          recipientUid: 'all_admins',
          title: 'OCR & Multilingual RAG APIs Online',
          message: 'Document Verification & Vision OCR API connection verified successfully with 109ms latency.',
          category: 'SYSTEM',
          priority: 'LOW',
          relatedId: 'ocr_api',
          targetUrl: 'receiver-dashboard.html',
          isRead: false,
          createdAt: new Date(now.getTime() - 45 * 60000).toISOString()
        },
        {
          id: 'notif_init_3',
          eventId: 'evt_gram_sabha_notice',
          recipientRole: 'all',
          recipientUid: 'all',
          title: 'Gram Sabha Scheduled for Nov 20',
          message: 'Ordinary Q4 Grievance Redressal Review Gram Sabha meeting will be convened at Village Auditorium.',
          category: 'KNOWLEDGE',
          priority: 'HIGH',
          relatedId: 'sabha_q4',
          targetUrl: 'notifications.html',
          isRead: false,
          createdAt: new Date(now.getTime() - 120 * 60000).toISOString()
        },
        {
          id: 'notif_init_4',
          eventId: 'evt_security_audit',
          recipientRole: 'admin',
          recipientUid: 'all_admins',
          title: 'Security Audit: Zero Breaches',
          message: 'Tamper-evident configuration log verified. All admin session tokens and API keys are intact.',
          category: 'SECURITY',
          priority: 'NORMAL',
          relatedId: 'sec_audit',
          targetUrl: 'receiver-dashboard.html',
          isRead: true,
          createdAt: new Date(now.getTime() - 360 * 60000).toISOString()
        }
      ];
    }

    getUserNotifications() {
      const user = this.getCurrentUser();
      return this.notifications.filter(n => {
        if (n.recipientRole === 'all') return true;
        if (user.role === 'admin') return true; // Administrator receives all system-wide alerts
        if (n.recipientRole === user.role) return true;
        if (n.recipientUid === user.uid) return true;
        return false;
      });
    }

    getUnreadCount() {
      const list = this.getUserNotifications();
      return list.filter(n => !n.isRead).length;
    }

    injectBellButton() {
      let bell = document.getElementById('nav-notif-bell-btn');
      if (!bell) {
        const targetContainer = document.getElementById('header-action-controls') || 
                                document.getElementById('nav-auth-container');
        if (!targetContainer) return;

        bell = document.createElement('button');
        bell.id = 'nav-notif-bell-btn';
        bell.className = 'nav-notif-bell-btn';
        bell.type = 'button';
        bell.setAttribute('aria-label', 'View Notifications');
        bell.innerHTML = `
          <i class="fa-regular fa-bell"></i>
          <span class="nav-notif-badge" id="nav-notif-badge" style="display: none;">0</span>
        `;
        targetContainer.insertBefore(bell, targetContainer.firstChild);
      }

      if (!bell._drawerBound) {
        bell.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleDrawer();
        });
        bell._drawerBound = true;
      }

      // If detached, re-attach to header action controls or nav auth container
      if (!bell.parentNode) {
        const targetContainer = document.getElementById('header-action-controls') || 
                                document.getElementById('nav-auth-container');
        if (targetContainer) targetContainer.insertBefore(bell, targetContainer.firstChild);
      }

      this.updateBellBadge();
    }

    updateBellBadge() {
      const badge = document.getElementById('nav-notif-badge');
      if (!badge) return;
      const count = this.getUnreadCount();
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }

    toggleDrawer() {
      let drawer = document.getElementById('notif-command-drawer');
      if (!drawer) {
        drawer = document.createElement('div');
        drawer.id = 'notif-command-drawer';
        drawer.className = 'notif-command-drawer';
        document.body.appendChild(drawer);

        // Close on outside click
        document.addEventListener('click', (e) => {
          const d = document.getElementById('notif-command-drawer');
          const b = document.getElementById('nav-notif-bell-btn');
          if (d && d.classList.contains('open') && !d.contains(e.target) && !b.contains(e.target)) {
            d.classList.remove('open');
            this.isDrawerOpen = false;
          }
        });

        // Android / Browser Hardware Back Button Integration
        window.addEventListener('popstate', () => {
          if (this.isDrawerOpen) {
            const d = document.getElementById('notif-command-drawer');
            if (d) d.classList.remove('open');
            this.isDrawerOpen = false;
          }
        });
      }

      this.isDrawerOpen = !this.isDrawerOpen;
      if (this.isDrawerOpen) {
        this.renderDrawerContent();
        drawer.classList.add('open');
        try {
          if (!window.location.hash.includes('notif-drawer')) {
            window.history.pushState({ notifDrawer: true }, '', '#notif-drawer');
          }
        } catch(e) {}
      } else {
        drawer.classList.remove('open');
        try {
          if (window.location.hash.includes('notif-drawer')) {
            window.history.back();
          }
        } catch(e) {}
      }
    }

    renderDrawerContent() {
      const drawer = document.getElementById('notif-command-drawer');
      if (!drawer) return;

      const user = this.getCurrentUser();
      const list = this.getUserNotifications();
      const unreadCount = this.getUnreadCount();

      // Apply filters
      const filtered = list.filter(n => {
        if (this.activeCategory !== 'all' && n.category !== this.activeCategory) return false;
        if (this.activePriority === 'unread' && n.isRead) return false;
        if (this.activePriority === 'critical' && n.priority !== 'CRITICAL' && n.priority !== 'HIGH') return false;
        if (this.searchQuery) {
          const q = this.searchQuery.toLowerCase();
          const matchTitle = (n.title || '').toLowerCase().includes(q);
          const matchMsg = (n.message || '').toLowerCase().includes(q);
          if (!matchTitle && !matchMsg) return false;
        }
        return true;
      });

      drawer.innerHTML = `
        <div class="notif-drawer-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-bell" style="color: #0f56b3;"></i>
            <strong style="color: #0b2545; font-size: 15px;">Notification Centre</strong>
            ${unreadCount > 0 ? `<span class="notif-pill pill-blue">${unreadCount} Unread</span>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="btn-table-action" onclick="window.JanasevaNotifications.markAllAsRead()" title="Mark all read" style="font-size: 12px; padding: 4px 8px;">
              <i class="fa-solid fa-check-double"></i> Read All
            </button>
            <button type="button" class="cms-modal-close" onclick="window.JanasevaNotifications.toggleDrawer()">&times;</button>
          </div>
        </div>

        <div class="notif-drawer-search">
          <input type="text" class="form-input" placeholder="Search notifications..." value="${escapeHtml(this.searchQuery)}" oninput="window.JanasevaNotifications.setSearch(this.value)" style="font-size: 12.5px; padding: 6px 10px;">
        </div>

        <div class="notif-drawer-chips">
          <button type="button" class="notif-chip ${this.activeCategory === 'all' && this.activePriority === 'all' ? 'active' : ''}" onclick="window.JanasevaNotifications.setFilter('all', 'all')">All</button>
          <button type="button" class="notif-chip ${this.activePriority === 'unread' ? 'active' : ''}" onclick="window.JanasevaNotifications.setFilter('all', 'unread')">Unread (${unreadCount})</button>
          <button type="button" class="notif-chip ${this.activeCategory === 'COMPLAINT' ? 'active' : ''}" onclick="window.JanasevaNotifications.setFilter('COMPLAINT', 'all')">Complaints</button>
          <button type="button" class="notif-chip ${this.activeCategory === 'SYSTEM' ? 'active' : ''}" onclick="window.JanasevaNotifications.setFilter('SYSTEM', 'all')">System &amp; APIs</button>
          ${user.role === 'admin' ? `<button type="button" class="notif-chip ${this.activeCategory === 'SECURITY' ? 'active' : ''}" onclick="window.JanasevaNotifications.setFilter('SECURITY', 'all')">Security</button>` : ''}
        </div>

        <div class="notif-drawer-list">
          ${filtered.length === 0 ? `
            <div style="text-align: center; padding: 40px 20px; color: #64748b;">
              <i class="fa-regular fa-bell-slash" style="font-size: 32px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
              <div style="font-weight: 600; font-size: 13.5px;">No notifications found</div>
              <div style="font-size: 12px; margin-top: 4px;">You are all caught up!</div>
            </div>
          ` : filtered.map(item => {
            const isUnread = !item.isRead;
            const priorityBadge = item.priority === 'CRITICAL' ? '<span class="notif-pri-pill critical">Critical</span>' : (item.priority === 'HIGH' ? '<span class="notif-pri-pill high">High</span>' : '');
            let iconClass = 'fa-regular fa-bell';
            let iconColor = '#0f56b3';
            let iconBg = '#eff6ff';
            if (item.category === 'COMPLAINT') { iconClass = 'fa-solid fa-file-lines'; iconColor = '#0f56b3'; iconBg = '#eff6ff'; }
            else if (item.category === 'SYSTEM') { iconClass = 'fa-solid fa-server'; iconColor = '#16a34a'; iconBg = '#f0fdf4'; }
            else if (item.category === 'SECURITY') { iconClass = 'fa-solid fa-shield-halved'; iconColor = '#dc2626'; iconBg = '#fef2f2'; }
            else if (item.category === 'KNOWLEDGE') { iconClass = 'fa-solid fa-book-open'; iconColor = '#7c3aed'; iconBg = '#f5f3ff'; }

            return `
              <div class="notif-item-row ${isUnread ? 'unread' : ''}" onclick="window.JanasevaNotifications.handleClickItem('${item.id}', '${item.targetUrl || ''}')">
                <div class="notif-item-icon" style="background: ${iconBg}; color: ${iconColor};">
                  <i class="${iconClass}"></i>
                </div>
                <div class="notif-item-content">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                    <div class="notif-item-title">${escapeHtml(item.title)}</div>
                    <div style="display: flex; align-items: center; gap: 4px;">
                      ${priorityBadge}
                      <button type="button" class="notif-del-btn" onclick="event.stopPropagation(); window.JanasevaNotifications.deleteNotification('${item.id}')" title="Delete notification">&times;</button>
                    </div>
                  </div>
                  <div class="notif-item-message">${escapeHtml(item.message)}</div>
                  <div class="notif-item-time">${timeAgo(item.createdAt)} &bull; ${item.category}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="notif-drawer-footer">
          <a href="notifications.html" style="font-size: 12.5px; color: #0f56b3; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-bullhorn"></i> View Public Civic Announcements &rarr;
          </a>
        </div>
      `;
    }

    setFilter(cat, pri) {
      this.activeCategory = cat;
      this.activePriority = pri;
      this.renderDrawerContent();
    }

    setSearch(q) {
      this.searchQuery = q;
      this.renderDrawerContent();
    }

    handleClickItem(id, targetUrl) {
      this.markAsRead(id);
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    }

    markAsRead(id) {
      const item = this.notifications.find(n => n.id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        item.readAt = new Date().toISOString();
        this.saveNotifications();
        this.renderDrawerContent();
      }
    }

    markAllAsRead() {
      const userList = this.getUserNotifications();
      userList.forEach(n => {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      });
      this.saveNotifications();
      this.renderDrawerContent();
    }

    deleteNotification(id) {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.saveNotifications();
      this.renderDrawerContent();
    }

    dispatch({
      title,
      message,
      category = 'GENERAL',
      priority = 'NORMAL',
      recipientRole = 'all',
      recipientUid = 'all',
      relatedId = null,
      targetUrl = null
    }) {
      const newNotif = {
        id: genId(),
        eventId: `evt_${Date.now()}`,
        recipientRole,
        recipientUid,
        title,
        message,
        category,
        priority,
        relatedId,
        targetUrl,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      this.notifications.unshift(newNotif);
      this.saveNotifications();

      // Show toast if drawer is not open
      if (window.showToast) {
        window.showToast(`${title}: ${message}`, priority === 'CRITICAL' ? 'error' : 'info');
      }

      if (this.isDrawerOpen) {
        this.renderDrawerContent();
      }
      return newNotif;
    }
  }

  window.JanasevaNotifications = new JanasevaNotificationCentre();
})(window, document);
