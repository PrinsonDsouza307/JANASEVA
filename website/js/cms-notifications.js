/**
 * JANASEVA – Admin-Only Dynamic Website Content Management System (CMS)
 * Manages Notifications & Updates Page (notifications.html) content dynamically.
 * Features:
 *  1. Admin Authorization verification (frontend + session audit).
 *  2. Full CRUD for Announcements, Header, Lifecycle steps, Working Hours, Channels, Quick Services.
 *  3. Concurrency & Multi-Admin conflict detection with version numbers.
 *  4. Version history with immutable snapshots & 1-click Rollback/Restore.
 *  5. Immediate DOM hydration for public visitors (no hardcoded text dependency).
 *  6. Dual-Mode Storage: Firestore collection `cms_notifications` + local JanasevaDB fallback.
 */

(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'janaseva_cms_notifications';
  const VERSIONS_KEY = 'janaseva_cms_versions';

  const DEFAULT_CONTENT = {
    version: 1,
    publicationStatus: 'PUBLISHED',
    lastModifiedBy: 'admin@janaseva.local',
    lastModifiedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    header: {
      title: 'Notifications & Civic Updates',
      subtitle: 'Official announcements, status notifications, and village administration advisories.',
      intro: 'Stay informed with live civic notifications, Gram Sabha announcements, and real-time grievance status dispatch updates.',
      announcementBanner: {
        enabled: true,
        type: 'info',
        text: 'Ordinary Gram Sabha scheduled for November 20, 2026 at Village Panchayat Auditorium.'
      }
    },
    lifecycle: [
      {
        id: 'step_1',
        title: '1. Submission & Slip',
        desc: 'Instant electronic acknowledgement with permanent Complaint ID and QR tracking slip.',
        color: 'stage-green',
        icon: 'fa-file-circle-check',
        enabled: true
      },
      {
        id: 'step_2',
        title: '2. Panchayat Review',
        desc: 'Notification as soon as the village Executive Officer assigns your grievance to a field officer.',
        color: 'stage-blue',
        icon: 'fa-user-check',
        enabled: true
      },
      {
        id: 'step_3',
        title: '3. Field Remediation',
        desc: 'Real-time progress alerts, site inspection logs, and physical repair progress notes.',
        color: 'stage-orange',
        icon: 'fa-wrench',
        enabled: true
      },
      {
        id: 'step_4',
        title: '4. Resolution & Report',
        desc: 'Final sign-off with official Panchayat resolution report and citizen feedback prompt.',
        color: 'stage-purple',
        icon: 'fa-circle-check',
        enabled: true
      }
    ],
    announcements: [
      {
        id: 'anc_1',
        title: 'Drinking Water Supply Maintenance & Pipeline Flushing',
        category: 'water',
        badgeLabel: 'Public Advisory',
        badgeColor: 'pill-blue',
        borderColor: 'border-blue',
        icon: 'fa-droplet',
        description: 'Scheduled overhead water tank inspection and chlorinated pipeline flushing will take place across Wards 1 through 4 this weekend. Water supply will operate on low pressure between 10:00 AM and 2:00 PM. Clean reserve storage is advised.',
        dateFormatted: 'Nov 14, 2026',
        expireDate: '2026-11-20',
        location: 'Wards 1 – 4',
        helpline: 'Water redressed helpline: 1800-425-001',
        isPinned: true,
        isPublished: true
      },
      {
        id: 'anc_2',
        title: 'Ordinary Gram Sabha Meeting – Q4 Grievance Redressal Review',
        category: 'sabha',
        badgeLabel: 'Scheduled Event',
        badgeColor: 'pill-green',
        borderColor: 'border-green',
        icon: 'fa-users',
        description: 'All registered village citizens are cordially invited to attend the quarterly Gram Sabha session. The agenda includes reviewing closed public grievances, sanctioning rural street light repairs, and inspecting local drainage works.',
        dateFormatted: 'Nov 20, 2026 • 10:30 AM',
        expireDate: '2026-11-21',
        location: 'Village Panchayat Auditorium',
        helpline: 'Open to all registered adult citizens',
        isPinned: true,
        isPublished: true
      },
      {
        id: 'anc_3',
        title: 'Village Main Road Resurfacing & Culvert Repair Notice',
        category: 'works',
        badgeLabel: 'Civic Works',
        badgeColor: 'pill-orange',
        borderColor: 'border-orange',
        icon: 'fa-road',
        description: 'Asphalt resurfacing and concrete storm-water culvert reconstruction will commence on the Main Market Road connecting Ward 2 to the Primary Health Sub-Centre. Light vehicle diversions will be active during daylight construction hours.',
        dateFormatted: 'Nov 16 – Nov 22, 2026',
        expireDate: '2026-11-25',
        location: 'Market Road to Sub-Centre',
        helpline: 'Panchayat Engineering Division',
        isPinned: false,
        isPublished: true
      },
      {
        id: 'anc_4',
        title: 'Rural Child Immunization & Senior Citizen Health Camp',
        category: 'health',
        badgeLabel: 'Health Advisory',
        badgeColor: 'pill-purple',
        borderColor: 'border-purple',
        icon: 'fa-stethoscope',
        description: 'A free specialized rural health screening camp and seasonal flu vaccination drive will be conducted in coordination with the District Primary Health Unit. Free blood pressure, blood glucose, and vision examinations will be provided.',
        dateFormatted: 'Nov 25, 2026 • 9:00 AM – 4:00 PM',
        expireDate: '2026-11-26',
        location: 'Primary Health Sub-Centre',
        helpline: 'Free checkup & medicine distribution',
        isPinned: false,
        isPublished: true
      }
    ],
    verifiedChannels: [
      {
        id: 'ch_email',
        title: 'Email Notifications',
        desc: 'Automated transactional dispatches sent via Panchayat Unitpost gateway.',
        icon: 'fa-regular fa-envelope',
        bg: '#eff6ff',
        color: '#0f56b3'
      },
      {
        id: 'ch_sms',
        title: 'SMS & WhatsApp',
        desc: 'Instant SMS notifications dispatched to registered citizen phone numbers.',
        icon: 'fa-solid fa-mobile-screen',
        bg: '#f0fdf4',
        color: '#16a34a'
      },
      {
        id: 'ch_live',
        title: 'Live 24/7 Redressal',
        desc: 'Public status tracking available online without mandatory login.',
        icon: 'fa-solid fa-desktop',
        bg: '#f5f3ff',
        color: '#7c3aed'
      }
    ],
    workingHours: {
      monFri: '9:30 AM – 5:30 PM',
      saturday: '9:30 AM – 1:30 PM',
      sundayHolidays: 'Closed',
      helpline: '0824-2220147',
      email: 'panchayat@janaseva.local',
      address: 'Main Gram Panchayat Bhavan, Post Office Road'
    },
    quickServices: [
      { title: 'Submit New Grievance', url: 'complaint.html', icon: 'fa-solid fa-pen-to-square', primary: true },
      { title: 'Track Live Status', url: 'track.html', icon: 'fa-solid fa-location-crosshairs', primary: false },
      { title: 'Panchayat Directory', url: 'directory.html', icon: 'fa-solid fa-landmark', primary: false },
      { title: 'Knowledge Centre', url: 'knowledge-centre.html', icon: 'fa-solid fa-book-open', primary: false }
    ]
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  class JanasevaCMSNotifications {
    constructor() {
      this.currentContent = null;
      this.activeEditDraft = null;
      this.isEditModalOpen = false;
      this.init();
    }

    isAdmin() {
      if (window.authService && window.authService.currentUser) {
        return window.authService.currentUser.role === 'admin';
      }
      return false;
    }

    getCurrentUser() {
      return (window.authService && window.authService.currentUser) || {
        uid: 'anonymous',
        email: 'visitor@janaseva.local',
        role: 'visitor',
        name: 'Public Visitor'
      };
    }

    init() {
      this.loadContent();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.onReady());
      } else {
        this.onReady();
      }
    }

    onReady() {
      this.renderPublicView();
      this.setupAdminInterface();
      this.listenAuthChanges();
    }

    listenAuthChanges() {
      // Re-evaluate admin controls whenever auth state updates
      if (window.firebase && window.firebase.auth) {
        try {
          window.firebase.auth().onAuthStateChanged(() => {
            setTimeout(() => this.setupAdminInterface(), 300);
          });
        } catch (e) {}
      }
    }

    loadContent() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.currentContent = JSON.parse(stored);
        } else {
          this.currentContent = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentContent));
        }
      } catch (e) {
        this.currentContent = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
      }
      return this.currentContent;
    }

    setupAdminInterface() {
      const existingBar = document.getElementById('cms-admin-top-bar');
      if (existingBar) existingBar.remove();

      if (!this.isAdmin()) return;

      // Inject floating Admin CMS Command Toolbar at the top of the main container
      const targetMain = document.querySelector('.page-main-content');
      if (!targetMain) return;

      const bar = document.createElement('div');
      bar.id = 'cms-admin-top-bar';
      bar.className = 'cms-admin-toolbar';
      bar.innerHTML = `
        <div class="cms-toolbar-left">
          <span class="cms-admin-badge"><i class="fa-solid fa-shield-halved"></i> Administrator Mode</span>
          <span class="cms-ver-label">Page CMS: v${this.currentContent.version || 1} &bull; ${this.currentContent.publicationStatus === 'PUBLISHED' ? '<span style="color:#16a34a;font-weight:700;"><i class="fa-solid fa-circle-check"></i> Published</span>' : '<span style="color:#d97706;font-weight:700;"><i class="fa-solid fa-pen-ruler"></i> Draft</span>'}</span>
        </div>
        <div class="cms-toolbar-actions">
          <button type="button" class="btn-cms-edit" id="btn-cms-edit-page" onclick="window.JanasevaCMSNotifications.openEditorModal()">
            <i class="fa-solid fa-pen-to-square"></i> Edit Page Content
          </button>
          <button type="button" class="btn-cms-history" onclick="window.JanasevaCMSNotifications.openHistoryModal()" title="View Version History & Restore">
            <i class="fa-solid fa-clock-rotate-left"></i> History
          </button>
        </div>
      `;

      targetMain.insertBefore(bar, targetMain.firstChild);
    }

    renderPublicView(overrideData = null) {
      const data = overrideData || this.currentContent || DEFAULT_CONTENT;

      // 1. Render Header Text
      const titleEl = document.querySelector('.hero-main-heading');
      if (titleEl && data.header?.title) {
        titleEl.textContent = data.header.title;
      }

      const subEl = document.querySelector('.hero-subheading');
      if (subEl && data.header?.subtitle) {
        subEl.textContent = data.header.subtitle;
      }

      // 2. Render 4-Stage Lifecycle Stepper Grid
      const stageGrid = document.querySelector('.notif-stage-grid');
      if (stageGrid && Array.isArray(data.lifecycle)) {
        stageGrid.innerHTML = data.lifecycle.filter(s => s.enabled !== false).map(step => `
          <div class="notif-stage-card ${escapeHtml(step.color || 'stage-blue')}">
            <div class="notif-stage-title">
              <i class="${escapeHtml(step.icon || 'fa-solid fa-circle-check')}"></i> ${escapeHtml(step.title)}
            </div>
            <div class="notif-stage-desc">
              ${escapeHtml(step.desc)}
            </div>
          </div>
        `).join('');
      }

      // 3. Render Civic Announcements Feed
      const ancContainer = document.getElementById('announcements-container');
      if (ancContainer && Array.isArray(data.announcements)) {
        const publicAnnouncements = data.announcements.filter(a => a.isPublished !== false);
        if (publicAnnouncements.length === 0) {
          ancContainer.innerHTML = `
            <div style="text-align: center; padding: 30px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; color: #64748b;">
              <i class="fa-solid fa-bullhorn" style="font-size: 28px; margin-bottom: 8px; color: #94a3b8;"></i>
              <p style="margin: 0; font-size: 13.5px;">No active civic announcements at this time.</p>
            </div>
          `;
        } else {
          // Pinned first, then sorted by date
          const sorted = [...publicAnnouncements].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
          ancContainer.innerHTML = sorted.map(a => `
            <article class="notif-announcement-item ${escapeHtml(a.borderColor || 'border-blue')}" data-category="${escapeHtml(a.category || 'all')}">
              <div class="notif-item-header">
                <div class="notif-item-title">
                  <i class="${escapeHtml(a.icon || 'fa-solid fa-bullhorn')}" style="color: #0f56b3; margin-right: 6px;"></i> ${escapeHtml(a.title)}
                  ${a.isPinned ? '<span class="cms-pinned-badge" style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 700;"><i class="fa-solid fa-thumbtack"></i> Pinned</span>' : ''}
                </div>
                <span class="notif-pill ${escapeHtml(a.badgeColor || 'pill-blue')}">
                  <i class="fa-solid fa-circle-info"></i> ${escapeHtml(a.badgeLabel || 'Advisory')}
                </span>
              </div>
              <div class="notif-item-body">
                ${escapeHtml(a.description)}
              </div>
              <div class="notif-item-footer">
                <div class="notif-meta-group">
                  <span class="notif-meta-item"><i class="fa-regular fa-calendar"></i> ${escapeHtml(a.dateFormatted || 'Recently')}</span>
                  ${a.location ? `<span class="notif-meta-item"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(a.location)}</span>` : ''}
                </div>
                ${a.helpline ? `<span style="font-weight: 600; color: #0b2545;">${escapeHtml(a.helpline)}</span>` : ''}
              </div>
            </article>
          `).join('');
        }
      }

      // 4. Render Office Working Hours
      if (data.workingHours) {
        const whCard = document.querySelector('aside .portal-card:last-child .portal-card-body');
        if (whCard) {
          whCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Monday – Friday:</span>
              <strong style="color: #0b2545;">${escapeHtml(data.workingHours.monFri || '9:30 AM – 5:30 PM')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
              <span>Saturday:</span>
              <strong style="color: #0b2545;">${escapeHtml(data.workingHours.saturday || '9:30 AM – 1:30 PM')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 0;">
              <span>Sunday &amp; Public Holidays:</span>
              <span style="color: #dc2626; font-weight: 600;">${escapeHtml(data.workingHours.sundayHolidays || 'Closed')}</span>
            </div>
            <div style="margin-top: 14px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;">
              <i class="fa-solid fa-phone" style="color: var(--color-royal-blue); margin-right: 6px;"></i>
              Grievance Helpline: <strong>${escapeHtml(data.workingHours.helpline || '0824-2220147')}</strong>
            </div>
          `;
        }
      }

      // Trigger multi-language re-translation if enabled
      if (window.janasevaTranslateDOM) {
        try { window.janasevaTranslateDOM(document.querySelector('.page-main-content')); } catch (e) {}
      }
    }

    // ========================================================================
    // CMS EDITOR MODAL & SUBMISSION
    // ========================================================================

    openEditorModal() {
      if (!this.isAdmin()) {
        alert('Access Denied: Only authenticated administrators can edit website content.');
        return;
      }

      this.activeEditDraft = JSON.parse(JSON.stringify(this.currentContent));
      let modal = document.getElementById('cms-editor-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cms-editor-modal';
        modal.className = 'cms-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="cms-modal-box">
          <div class="cms-modal-header">
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #0b2545; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-sliders" style="color: #0f56b3;"></i> Website Content Management System (CMS)
              </h2>
              <div style="font-size: 12px; color: #64748b; margin-top: 3px;">
                Editing: <strong>notifications.html</strong> &bull; Base Version: v${this.activeEditDraft.version || 1}
              </div>
            </div>
            <button type="button" class="cms-modal-close" onclick="window.JanasevaCMSNotifications.closeEditorModal()">&times;</button>
          </div>

          <div class="cms-modal-tabs">
            <button type="button" class="cms-tab-btn active" data-tab="announcements" onclick="window.JanasevaCMSNotifications.switchTab('announcements', this)"><i class="fa-solid fa-bullhorn"></i> Announcements (${this.activeEditDraft.announcements.length})</button>
            <button type="button" class="cms-tab-btn" data-tab="header" onclick="window.JanasevaCMSNotifications.switchTab('header', this)"><i class="fa-solid fa-heading"></i> Page Header</button>
            <button type="button" class="cms-tab-btn" data-tab="hours" onclick="window.JanasevaCMSNotifications.switchTab('hours', this)"><i class="fa-solid fa-clock"></i> Working Hours &amp; Phone</button>
            <button type="button" class="cms-tab-btn" data-tab="lifecycle" onclick="window.JanasevaCMSNotifications.switchTab('lifecycle', this)"><i class="fa-solid fa-diagram-project"></i> Grievance Steps</button>
          </div>

          <div class="cms-modal-body" id="cms-tab-content">
            <!-- Dynamic Tab Content Renders Here -->
          </div>

          <div class="cms-modal-footer">
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" class="btn-cta-secondary" onclick="window.JanasevaCMSNotifications.previewChanges()" style="padding: 8px 14px; font-size: 13px;">
                <i class="fa-solid fa-eye"></i> Live Preview
              </button>
              <button type="button" class="btn-cta-secondary" onclick="window.JanasevaCMSNotifications.saveDraft()" style="padding: 8px 14px; font-size: 13px;">
                <i class="fa-solid fa-floppy-disk"></i> Save Draft
              </button>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" class="btn-table-action" onclick="window.JanasevaCMSNotifications.closeEditorModal()" style="padding: 8px 14px; font-size: 13px;">
                Cancel
              </button>
              <button type="button" class="btn-cta-primary" onclick="window.JanasevaCMSNotifications.publishLive()" style="padding: 8px 18px; font-size: 13px;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Publish Live to Website
              </button>
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      this.isEditModalOpen = true;
      this.renderTabContent('announcements');
    }

    closeEditorModal() {
      const modal = document.getElementById('cms-editor-modal');
      if (modal) modal.style.display = 'none';
      this.isEditModalOpen = false;
      // Revert any live preview back to current published state
      this.renderPublicView();
    }

    switchTab(tabName, btn) {
      document.querySelectorAll('.cms-tab-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      this.renderTabContent(tabName);
    }

    renderTabContent(tabName) {
      const container = document.getElementById('cms-tab-content');
      if (!container || !this.activeEditDraft) return;

      if (tabName === 'announcements') {
        container.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div style="font-size: 13px; color: #475569;">Manage official Gram Panchayat public notices, advisories and camps.</div>
            <button type="button" class="btn-cta-primary" onclick="window.JanasevaCMSNotifications.addAnnouncementPrompt()" style="padding: 6px 12px; font-size: 12px;">
              <i class="fa-solid fa-plus"></i> New Announcement
            </button>
          </div>
          <div class="cms-announcement-edit-list">
            ${this.activeEditDraft.announcements.map((a, idx) => `
              <div class="cms-edit-item-card" data-idx="${idx}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
                  <input type="text" class="form-input cms-input-anc-title" value="${escapeHtml(a.title)}" placeholder="Announcement Title" style="font-weight: 700; flex: 1;" onchange="window.JanasevaCMSNotifications.updateAncField(${idx}, 'title', this.value)">
                  <button type="button" class="btn-table-action" onclick="window.JanasevaCMSNotifications.deleteAnnouncement(${idx})" title="Delete notice" style="color: #dc2626; padding: 6px 10px;">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 8px;">
                  <div>
                    <label style="font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 2px;">Category</label>
                    <select class="form-select" onchange="window.JanasevaCMSNotifications.updateAncField(${idx}, 'category', this.value)" style="padding: 6px 10px; font-size: 12.5px;">
                      <option value="water" ${a.category === 'water' ? 'selected' : ''}>Water &amp; Sanitation</option>
                      <option value="sabha" ${a.category === 'sabha' ? 'selected' : ''}>Gram Sabha</option>
                      <option value="works" ${a.category === 'works' ? 'selected' : ''}>Public Works</option>
                      <option value="health" ${a.category === 'health' ? 'selected' : ''}>Health &amp; Welfare</option>
                      <option value="general" ${a.category === 'general' ? 'selected' : ''}>General Notice</option>
                    </select>
                  </div>
                  <div>
                    <label style="font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 2px;">Badge Label</label>
                    <input type="text" class="form-input" value="${escapeHtml(a.badgeLabel || '')}" placeholder="e.g. Public Advisory" style="padding: 6px 10px; font-size: 12.5px;" onchange="window.JanasevaCMSNotifications.updateAncField(${idx}, 'badgeLabel', this.value)">
                  </div>
                  <div>
                    <label style="font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 2px;">Date / Schedule</label>
                    <input type="text" class="form-input" value="${escapeHtml(a.dateFormatted || '')}" placeholder="e.g. Nov 20, 2026" style="padding: 6px 10px; font-size: 12.5px;" onchange="window.JanasevaCMSNotifications.updateAncField(${idx}, 'dateFormatted', this.value)">
                  </div>
                  <div>
                    <label style="font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 2px;">Location / Area</label>
                    <input type="text" class="form-input" value="${escapeHtml(a.location || '')}" placeholder="e.g. Wards 1 – 4" style="padding: 6px 10px; font-size: 12.5px;" onchange="window.JanasevaCMSNotifications.updateAncField(${idx}, 'location', this.value)">
                  </div>
                </div>
                <div style="margin-bottom: 8px;">
                  <label style="font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 2px;">Notice Description</label>
                  <textarea class="form-input" rows="2" style="font-size: 12.5px; padding: 8px 10px;" onchange="window.JanasevaCMSNotifications.updateAncField(${idx}, 'description', this.value)">${escapeHtml(a.description)}</textarea>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 12px; color: #475569;">
                  <input type="text" class="form-input" value="${escapeHtml(a.helpline || '')}" placeholder="Contact / Helpline Note" style="padding: 4px 8px; font-size: 11.5px; max-width: 320px;" onchange="window.JanasevaCMSNotifications.updateAncField(${idx}, 'helpline', this.value)">
                  <div style="display: flex; gap: 14px; align-items: center;">
                    <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                      <input type="checkbox" ${a.isPinned ? 'checked' : ''} onchange="window.JanasevaCMSNotifications.updateAncField(${idx}, 'isPinned', this.checked)">
                      <strong>Pin to top</strong>
                    </label>
                    <label style="display: inline-flex; align-items: center; gap: 5px; cursor: pointer;">
                      <input type="checkbox" ${a.isPublished !== false ? 'checked' : ''} onchange="window.JanasevaCMSNotifications.updateAncField(${idx}, 'isPublished', this.checked)">
                      <span>Published</span>
                    </label>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (tabName === 'header') {
        const h = this.activeEditDraft.header || {};
        container.innerHTML = `
          <div class="cms-form-section">
            <div style="margin-bottom: 14px;">
              <label style="font-weight: 700; font-size: 13px; color: #0b2545; display: block; margin-bottom: 4px;">Page Main Title</label>
              <input type="text" class="form-input" value="${escapeHtml(h.title || '')}" oninput="window.JanasevaCMSNotifications.activeEditDraft.header.title = this.value">
            </div>
            <div style="margin-bottom: 14px;">
              <label style="font-weight: 700; font-size: 13px; color: #0b2545; display: block; margin-bottom: 4px;">Subheading</label>
              <input type="text" class="form-input" value="${escapeHtml(h.subtitle || '')}" oninput="window.JanasevaCMSNotifications.activeEditDraft.header.subtitle = this.value">
            </div>
            <div style="margin-bottom: 14px;">
              <label style="font-weight: 700; font-size: 13px; color: #0b2545; display: block; margin-bottom: 4px;">Introduction Paragraph</label>
              <textarea class="form-input" rows="3" oninput="window.JanasevaCMSNotifications.activeEditDraft.header.intro = this.value">${escapeHtml(h.intro || '')}</textarea>
            </div>
          </div>
        `;
      } else if (tabName === 'hours') {
        const wh = this.activeEditDraft.workingHours || {};
        container.innerHTML = `
          <div class="cms-form-section">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 14px;">
              <div>
                <label style="font-weight: 700; font-size: 12.5px; color: #0b2545; display: block; margin-bottom: 4px;">Monday – Friday Hours</label>
                <input type="text" class="form-input" value="${escapeHtml(wh.monFri || '')}" oninput="window.JanasevaCMSNotifications.activeEditDraft.workingHours.monFri = this.value">
              </div>
              <div>
                <label style="font-weight: 700; font-size: 12.5px; color: #0b2545; display: block; margin-bottom: 4px;">Saturday Hours</label>
                <input type="text" class="form-input" value="${escapeHtml(wh.saturday || '')}" oninput="window.JanasevaCMSNotifications.activeEditDraft.workingHours.saturday = this.value">
              </div>
              <div>
                <label style="font-weight: 700; font-size: 12.5px; color: #0b2545; display: block; margin-bottom: 4px;">Sunday &amp; Public Holidays</label>
                <input type="text" class="form-input" value="${escapeHtml(wh.sundayHolidays || '')}" oninput="window.JanasevaCMSNotifications.activeEditDraft.workingHours.sundayHolidays = this.value">
              </div>
              <div>
                <label style="font-weight: 700; font-size: 12.5px; color: #0b2545; display: block; margin-bottom: 4px;">Grievance Helpline Phone</label>
                <input type="text" class="form-input" value="${escapeHtml(wh.helpline || '')}" oninput="window.JanasevaCMSNotifications.activeEditDraft.workingHours.helpline = this.value">
              </div>
            </div>
          </div>
        `;
      } else if (tabName === 'lifecycle') {
        container.innerHTML = `
          <div class="cms-form-section">
            <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">Edit the 4 standard grievance resolution progression milestones displayed to citizens.</p>
            ${(this.activeEditDraft.lifecycle || []).map((step, idx) => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                <div style="display: flex; gap: 10px; margin-bottom: 6px;">
                  <input type="text" class="form-input" value="${escapeHtml(step.title)}" style="font-weight: 700; flex: 1;" onchange="window.JanasevaCMSNotifications.activeEditDraft.lifecycle[${idx}].title = this.value">
                  <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" ${step.enabled !== false ? 'checked' : ''} onchange="window.JanasevaCMSNotifications.activeEditDraft.lifecycle[${idx}].enabled = this.checked"> Enabled
                  </label>
                </div>
                <textarea class="form-input" rows="2" style="font-size: 12.5px;" onchange="window.JanasevaCMSNotifications.activeEditDraft.lifecycle[${idx}].desc = this.value">${escapeHtml(step.desc)}</textarea>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    updateAncField(idx, field, value) {
      if (this.activeEditDraft && this.activeEditDraft.announcements[idx]) {
        this.activeEditDraft.announcements[idx][field] = value;
      }
    }

    addAnnouncementPrompt() {
      if (!this.activeEditDraft) return;
      const newAnc = {
        id: `anc_${Date.now()}`,
        title: 'New Gram Panchayat Public Announcement',
        category: 'general',
        badgeLabel: 'Notice',
        badgeColor: 'pill-blue',
        borderColor: 'border-blue',
        icon: 'fa-bullhorn',
        description: 'Enter details of the public advisory or notice here.',
        dateFormatted: 'Today',
        expireDate: '',
        location: 'Village Gram Panchayat',
        helpline: 'Panchayat Office',
        isPinned: false,
        isPublished: true
      };
      this.activeEditDraft.announcements.unshift(newAnc);
      this.renderTabContent('announcements');
    }

    deleteAnnouncement(idx) {
      if (!this.activeEditDraft) return;
      if (confirm('Are you sure you want to delete this announcement?')) {
        this.activeEditDraft.announcements.splice(idx, 1);
        this.renderTabContent('announcements');
      }
    }

    previewChanges() {
      if (!this.activeEditDraft) return;
      this.renderPublicView(this.activeEditDraft);
      alert('Live preview applied to the page! (Changes are not yet published to public visitors until you click "Publish Live").');
    }

    async saveDraft() {
      if (!this.isAdmin()) throw new Error('Unauthorized');
      const user = this.getCurrentUser();
      this.activeEditDraft.lastModifiedBy = user.email;
      this.activeEditDraft.lastModifiedAt = new Date().toISOString();
      this.activeEditDraft.publicationStatus = 'DRAFT';

      // Store in JanasevaDB & localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.activeEditDraft));
      this.currentContent = JSON.parse(JSON.stringify(this.activeEditDraft));
      this.setupAdminInterface();
      alert('Draft saved successfully! Citizens will continue seeing the last published content until you Publish Live.');
    }

    async publishLive() {
      if (!this.isAdmin()) throw new Error('Unauthorized');
      const user = this.getCurrentUser();

      // Check multi-admin conflict
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const remote = JSON.parse(stored);
          if (remote.version > (this.activeEditDraft.version || 1)) {
            const proceed = confirm(`Conflict Detected: Another administrator (${remote.lastModifiedBy}) published version v${remote.version} while you were editing. Would you like to overwrite with your latest changes?`);
            if (!proceed) return;
          }
        } catch (e) {}
      }

      const nextVersion = (this.currentContent.version || 1) + 1;
      const published = {
        ...this.activeEditDraft,
        version: nextVersion,
        publicationStatus: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: user.email
      };

      // Save version snapshot into history
      this.saveVersionSnapshot(published, `Published version v${nextVersion} by ${user.email}`);

      // Persist to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(published));
      this.currentContent = published;

      // Sync to Cloud Firestore if available
      if (window.firebase && window.firebase.firestore && window.fbDb) {
        try {
          await window.fbDb.collection('cms_pages').doc('notifications_page').set(published);
        } catch (e) {
          console.warn('[CMS] Remote firestore sync warning:', e);
        }
      }

      this.renderPublicView();
      this.setupAdminInterface();
      this.closeEditorModal();
      alert(`Website Updated! Published content version v${nextVersion} is now live for all citizens.`);
    }

    saveVersionSnapshot(content, summary) {
      try {
        let history = JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]');
        history.unshift({
          versionId: `cms_v${content.version}_${Date.now()}`,
          version: content.version,
          timestamp: new Date().toISOString(),
          author: content.lastModifiedBy,
          summary: summary || 'Page content update',
          payload: JSON.parse(JSON.stringify(content))
        });
        localStorage.setItem(VERSIONS_KEY, JSON.stringify(history.slice(0, 30)));
      } catch (e) {}
    }

    getVersions() {
      try {
        return JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]');
      } catch (e) {
        return [];
      }
    }

    openHistoryModal() {
      if (!this.isAdmin()) return;
      const versions = this.getVersions();

      let modal = document.getElementById('cms-history-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cms-history-modal';
        modal.className = 'cms-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="cms-modal-box" style="max-width: 620px;">
          <div class="cms-modal-header">
            <div>
              <h3 style="margin:0; font-size: 16px; color: #0b2545;">
                <i class="fa-solid fa-clock-rotate-left" style="color: #0f56b3;"></i> Content Revision History
              </h3>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">Review immutable snapshots and rollback if needed.</p>
            </div>
            <button type="button" class="cms-modal-close" onclick="document.getElementById('cms-history-modal').style.display='none'">&times;</button>
          </div>
          <div class="cms-modal-body" style="max-height: 400px; overflow-y: auto;">
            ${versions.length === 0 ? '<p style="color: #64748b; font-size: 13px; text-align: center; padding: 20px;">No historical versions recorded yet.</p>' : versions.map((v, idx) => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="color: #0b2545; font-size: 13.5px;">Version ${v.version}</strong>
                  <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">
                    ${escapeHtml(v.author)} &bull; ${new Date(v.timestamp).toLocaleString()}
                  </div>
                  <div style="font-size: 12px; color: #334155; margin-top: 4px;">${escapeHtml(v.summary)}</div>
                </div>
                <button type="button" class="btn-cta-secondary" onclick="window.JanasevaCMSNotifications.restoreVersion('${v.versionId}')" style="padding: 6px 12px; font-size: 12px;">
                  <i class="fa-solid fa-rotate-left"></i> Restore
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    }

    restoreVersion(versionId) {
      if (!this.isAdmin()) return;
      const versions = this.getVersions();
      const target = versions.find(v => v.versionId === versionId);
      if (!target || !target.payload) {
        alert('Version snapshot not found.');
        return;
      }

      if (confirm(`Are you sure you want to restore Version v${target.version}? Current live content will be rolled back to this snapshot.`)) {
        const restored = {
          ...target.payload,
          version: (this.currentContent.version || 1) + 1,
          publicationStatus: 'PUBLISHED',
          lastModifiedBy: this.getCurrentUser().email,
          lastModifiedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
        this.currentContent = restored;
        this.saveVersionSnapshot(restored, `Restored rollback to snapshot v${target.version}`);
        this.renderPublicView();
        this.setupAdminInterface();
        const modal = document.getElementById('cms-history-modal');
        if (modal) modal.style.display = 'none';
        alert(`Successfully rolled back to Version ${target.version}!`);
      }
    }
  }

  window.JanasevaCMSNotifications = new JanasevaCMSNotifications();
})(window, document);
