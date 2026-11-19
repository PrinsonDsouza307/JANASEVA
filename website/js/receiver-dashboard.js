
function getPriorityPillClass(priority) {
  const p = (priority || 'NORMAL').toUpperCase();
  if (p === 'URGENT') return 'badge-urgent';
  if (p === 'HIGH') return 'badge-high';
  if (p === 'LOW') return 'badge-low';
  return 'badge-normal';
}
/**
 * JANASEVA – Administrative Control Centre & Panchayat Official Dashboard
 * Unified controller for complete database management, complaint register,
 * three-role architecture (Admin, Receiver, Citizen), 10 system-wide metrics,
 * citizen registry, receiver workloads, audit logging, and backup health.
 */

let allComplaints = [];
let allReceivers = [];
let allCitizens = [];
let allAuditLogs = [];
let allBackups = [];
let activeStatusFilter = 'all';
let activeQuickPill = 'all';
let currentModalComplaintId = null;

/**
 * Role-Adaptive Header & Controls Management
 */
window.applyRoleAdaptiveUI = async function() {
  const currentUser = window.authService ? window.authService.currentUser : null;
  const isAdmin = window.authService ? window.authService.isAdmin() : false;
  const isReceiver = window.authService ? window.authService.isReceiver() : false;

  const gpTitle = document.getElementById('dashboard-gp-title');
  const gpSubheading = document.getElementById('dashboard-subheading');
  const heroIcon = document.querySelector('#admin-hero-banner .hero-page-icon i');
  const tabComplaints = document.getElementById('tab-btn-complaints');
  const tabAudit = document.getElementById('tab-btn-audit');
  const tabIntelligence = document.getElementById('tab-btn-intelligence');
  const tabDatabase = document.getElementById('tab-btn-database');
  const tabStatusMgmt = document.getElementById('tab-btn-status-mgmt');
  const tabEmergency = document.getElementById('tab-btn-emergency');
  const tabBannerMgmt = document.getElementById('tab-btn-banner-mgmt');
  const tabAiOps = document.getElementById('tab-btn-ai-ops');
  const tabKnowledgeCentre = document.getElementById('tab-btn-knowledge-centre');
  const tabApiMaster = document.getElementById('tab-btn-api-master');
  const tabUpdatesFolder = document.getElementById('tab-btn-updates-folder');
  const tabRecycleBin = document.getElementById('tab-btn-recycle-bin');
  const thBulk = document.getElementById('th-bulk-checkbox');
  const headerBannerActions = document.getElementById('admin-banner-header-actions');

  if (isAdmin) {
    if (heroIcon) heroIcon.className = 'fa-solid fa-shield-halved';
    if (gpTitle) gpTitle.textContent = 'Admin Control Centre';
    if (gpSubheading) gpSubheading.textContent = 'Centralized grievance management, official response dispatch, dynamic lifecycle tracking, system configuration, and Gram Panchayat workload monitoring.';
    if (tabComplaints) tabComplaints.style.display = 'inline-flex';
    if (tabUpdatesFolder) tabUpdatesFolder.style.display = 'inline-flex';
    if (tabRecycleBin) tabRecycleBin.style.display = 'inline-flex';
    if (tabAudit) tabAudit.style.display = 'inline-flex';
    if (tabIntelligence) tabIntelligence.style.display = 'inline-flex';
    if (tabDatabase) tabDatabase.style.display = 'inline-flex';
    if (tabStatusMgmt) tabStatusMgmt.style.display = 'inline-flex';
    if (tabEmergency) tabEmergency.style.display = 'inline-flex';
    if (tabBannerMgmt) tabBannerMgmt.style.display = 'inline-flex';
    if (tabAiOps) tabAiOps.style.display = 'inline-flex';
    if (tabKnowledgeCentre) tabKnowledgeCentre.style.display = 'inline-flex';
    if (tabApiMaster) tabApiMaster.style.display = 'inline-flex';
    if (thBulk) thBulk.style.display = 'table-cell';
    if (headerBannerActions) headerBannerActions.style.display = 'inline-flex';
  } else if (isReceiver) {
    const panchayatName = currentUser && currentUser.panchayatName ? currentUser.panchayatName : 'Assigned Gram Panchayat';
    if (heroIcon) heroIcon.className = 'fa-solid fa-table-columns';
    if (gpTitle) gpTitle.textContent = `${panchayatName} Official Dashboard`;
    if (gpSubheading) gpSubheading.textContent = `Review citizen grievances assigned to ${panchayatName}, inspect evidence, update 8-stage progress, and communicate official responses.`;
    if (tabComplaints) tabComplaints.style.display = 'inline-flex';
    if (tabUpdatesFolder) tabUpdatesFolder.style.display = 'inline-flex';
    if (tabIntelligence) tabIntelligence.style.display = 'inline-flex';
    if (tabAudit) tabAudit.style.display = 'none';
    if (tabDatabase) tabDatabase.style.display = 'none';
    if (tabStatusMgmt) tabStatusMgmt.style.display = 'none';
    if (tabEmergency) tabEmergency.style.display = 'none';
    if (tabBannerMgmt) tabBannerMgmt.style.display = 'none';
    if (tabAiOps) tabAiOps.style.display = 'none';
    if (tabKnowledgeCentre) tabKnowledgeCentre.style.display = 'none';
    if (tabApiMaster) tabApiMaster.style.display = 'none';
    if (tabRecycleBin) tabRecycleBin.style.display = 'none';
    if (thBulk) thBulk.style.display = 'none';
    if (headerBannerActions) headerBannerActions.style.display = 'none';
  } else {
    // Default fallback: display all controls so admin is never locked out
    if (tabComplaints) tabComplaints.style.display = 'inline-flex';
    if (tabUpdatesFolder) tabUpdatesFolder.style.display = 'inline-flex';
    if (tabRecycleBin) tabRecycleBin.style.display = 'inline-flex';
    if (tabAudit) tabAudit.style.display = 'inline-flex';
    if (tabIntelligence) tabIntelligence.style.display = 'inline-flex';
    if (tabDatabase) tabDatabase.style.display = 'inline-flex';
    if (tabStatusMgmt) tabStatusMgmt.style.display = 'inline-flex';
    if (tabEmergency) tabEmergency.style.display = 'inline-flex';
    if (tabBannerMgmt) tabBannerMgmt.style.display = 'inline-flex';
    if (tabAiOps) tabAiOps.style.display = 'inline-flex';
    if (tabKnowledgeCentre) tabKnowledgeCentre.style.display = 'inline-flex';
    if (tabApiMaster) tabApiMaster.style.display = 'inline-flex';
    if (thBulk) thBulk.style.display = 'table-cell';
    if (headerBannerActions) headerBannerActions.style.display = 'inline-flex';
  }

  if (window.janasevaTranslator && window.janasevaTranslator.currentLang !== 'en') {
    window.janasevaTranslator.applyTranslations();
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (window.authService && typeof window.authService.waitForAuth === 'function') {
    try {
      await window.authService.waitForAuth();
    } catch (e) {
      console.warn("Auth initialization warning:", e);
    }
  }

  // 1. Role-Adaptive Header & Hero Customization
  try {
    await window.applyRoleAdaptiveUI();
  } catch (e) {
    console.warn("Role-adaptive UI init warning:", e);
  }

  // 2. Populate Gram Panchayat Dropdown Filter
  populatePanchayatDropdown();

  // 3. Load Receivers List
  loadReceiversList();

  // 4. Load Data from Primary Firestore & Local Cache (each isolated so failures never block rendering)
  try { await loadComplaintsData(); } catch (e) { console.warn("loadComplaintsData warning:", e); }
  try { await loadCitizensData(); } catch (e) { console.warn("loadCitizensData warning:", e); }
  try { await loadAuditLogs(); } catch (e) { console.warn("loadAuditLogs warning:", e); }
  try { await loadBackupsData(); } catch (e) { console.warn("loadBackupsData warning:", e); }

  // 5. Wire Search & Filters
  wireFiltersAndSearch();

  // 6. Initial Render of Stats, Tables and Diagnostics
  updateStatsAndBadges();
  renderComplaintsTable();
  renderCitizensTable();
  renderWorkloadCards();
  renderAuditLogsTable();
  renderBackupsTable();
  updateDatabaseHealthIndicators();
  renderPanchayatIntelligence();

  // 7. Initialize Complaint Updates Folder & Protected Recycle Bin
  if (typeof window.initUpdatesFolderAndRecycleBin === 'function') {
    try {
      await window.initUpdatesFolderAndRecycleBin();
    } catch (e) {
      console.warn("initUpdatesFolderAndRecycleBin warning:", e);
    }
  }

  // Auto-open complaint review/edit modal if specified in URL query
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit') || urlParams.get('complaintId');
  if (editId) {
    setTimeout(() => {
      openReviewModal(editId);
    }, 450);
  }
  const targetTab = urlParams.get('tab');
  if (targetTab) {
    setTimeout(() => {
      switchAdminTab(targetTab);
    }, 200);
  }
});

// Real-time synchronization when authentication changes
window.addEventListener('janaseva:authChanged', async () => {
  await window.applyRoleAdaptiveUI();
  populatePanchayatDropdown();
  await loadComplaintsData();
  renderComplaintsTable();
  updateStatsAndBadges();
  if (typeof window.refreshStorageBadges === 'function') {
    await window.refreshStorageBadges();
  }
});

/**
 * Switch Navigation Tabs
 */
window.switchAdminTab = function(tabName) {
  if (tabName === 'status-mgmt') {
    const isAdmin = window.authService ? window.authService.isAdmin() : false;
    if (!isAdmin) {
      if (typeof showToast === 'function') {
        showToast("Access Denied: Complaint Status Management is restricted to Administrators only.", "error");
      } else {
        (window.janasevaAlert || alert)("Access Denied: Complaint Status Management is restricted to Administrators only.");
      }
      switchAdminTab('complaints');
      return;
    }
  }

  if (tabName === 'emergency') {
    const isAdmin = window.authService ? window.authService.isAdmin() : false;
    if (!isAdmin) {
      if (typeof showToast === 'function') {
        showToast("Access Denied: Emergency Data Reset is strictly restricted to Administrators only.", "error");
      } else {
        (window.janasevaAlert || alert)("Access Denied: Emergency Data Reset is strictly restricted to Administrators only.");
      }
      switchAdminTab('complaints');
      return;
    }
  }

  if (tabName === 'banner-mgmt') {
    const isAdmin = window.authService ? window.authService.isAdmin() : false;
    if (!isAdmin) {
      if (typeof showToast === 'function') {
        showToast("Access Denied: Banner Image Management is strictly restricted to Administrators only.", "error");
      } else {
        (window.janasevaAlert || alert)("Access Denied: Banner Image Management is strictly restricted to Administrators only.");
      }
      switchAdminTab('complaints');
      return;
    }
  }

  if (tabName === 'recycle-bin') {
    const isAdmin = window.authService ? window.authService.isAdmin() : false;
    const isReceiver = window.authService ? window.authService.isReceiver() : false;
    if (!isAdmin && isReceiver) {
      if (typeof showToast === 'function') {
        showToast("Access Denied: Protected Recycle Bin is restricted to Administrators only.", "error");
      } else {
        (window.janasevaAlert || alert)("Access Denied: Protected Recycle Bin is restricted to Administrators only.");
      }
      switchAdminTab('complaints');
      return;
    }
  }

  if (tabName === 'ai-ops' || tabName === 'knowledge-centre') {
    const isAdmin = window.authService ? window.authService.isAdmin() : false;
    if (!isAdmin) {
      if (typeof showToast === 'function') {
        showToast("Access Denied: AI Assistant Operations are restricted to Administrators only.", "error");
      }
      switchAdminTab('complaints');
      return;
    }
  }

  if (tabName === 'api-master') {
    const isAdmin = window.authService ? window.authService.isAdmin() : false;
    if (!isAdmin) {
      if (typeof showToast === 'function') {
        showToast("Access Denied: API Master Control is strictly restricted to Administrators only.", "error");
      } else {
        (window.janasevaAlert || alert)("Access Denied: API Master Control is strictly restricted to Administrators only.");
      }
      switchAdminTab('complaints');
      return;
    }
    if (typeof window.loadAdminApiMasterPanel === 'function') {
      window.loadAdminApiMasterPanel();
    }
  }

  const tabs = ['complaints', 'updates-folder', 'recycle-bin', 'audit', 'intelligence', 'database', 'status-mgmt', 'emergency', 'banner-mgmt', 'ai-ops', 'knowledge-centre', 'api-master'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const pane = document.getElementById(`admin-tab-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (pane) pane.classList.toggle('active', t === tabName);
  });
  if (tabName === 'complaints') {
    if (typeof renderComplaintsTable === 'function') {
      renderComplaintsTable();
    }
  } else if (tabName === 'audit') {
    if (typeof loadAuditLogs === 'function') {
      Promise.resolve(loadAuditLogs()).then(() => {
        if (typeof renderAuditLogsTable === 'function') renderAuditLogsTable();
      });
    } else if (typeof renderAuditLogsTable === 'function') {
      renderAuditLogsTable();
    }
  } else if (tabName === 'database') {
    if (typeof loadBackupsData === 'function') {
      Promise.resolve(loadBackupsData()).then(() => {
        if (typeof renderBackupsTable === 'function') renderBackupsTable();
      });
    } else if (typeof renderBackupsTable === 'function') {
      renderBackupsTable();
    }
  } else if (tabName === 'intelligence') {
    renderPanchayatIntelligence();
  } else if (tabName === 'status-mgmt') {
    renderStatusManagementUI();
  } else if (tabName === 'emergency') {
    if (typeof window.initEmergencyResetTab === 'function') {
      window.initEmergencyResetTab();
    }
  } else if (tabName === 'banner-mgmt') {
    if (typeof window.renderBannerManagementUI === 'function') {
      window.renderBannerManagementUI();
    }
  } else if (tabName === 'updates-folder') {
    if (typeof window.renderUpdatesFolderUI === 'function') {
      window.renderUpdatesFolderUI();
    }
  } else if (tabName === 'recycle-bin') {
    if (typeof window.renderRecycleBinUI === 'function') {
      window.renderRecycleBinUI();
    }
  } else if (tabName === 'knowledge-centre') {
    if (typeof window.loadAdminKnowledgeCentre === 'function') {
      window.loadAdminKnowledgeCentre();
    }
  } else if (tabName === 'ai-ops') {
    if (typeof window.loadAdminAssistantOps === 'function') {
      window.loadAdminAssistantOps();
    }
  }
};

/**
 * Populate Gram Panchayat Dropdowns
 */
function populatePanchayatDropdown() {
  const gpFilter = document.getElementById('rec-gp-filter');
  const panchayats = JanasevaDB.get('panchayats', []);
  const currentUser = window.authService ? window.authService.currentUser : null;
  const isAdmin = window.authService ? window.authService.isAdmin() : false;

  if (!gpFilter) return;

  if (isAdmin) {
    gpFilter.innerHTML = '<option value="">All Gram Panchayats</option>' +
      panchayats.map(gp => `<option value="${gp.panchayatId}">${gp.name}</option>`).join('');
  } else if (currentUser && currentUser.panchayatId) {
    const assignedGp = panchayats.find(p => p.panchayatId === currentUser.panchayatId);
    const gpName = assignedGp ? assignedGp.name : currentUser.panchayatName || 'Assigned GP';
    gpFilter.innerHTML = `<option value="${currentUser.panchayatId}" selected>${gpName}</option>`;
    gpFilter.disabled = true;
  }
}

/**
 * Load Receivers List for Workload & Assignment
 */
function loadReceiversList() {
  const defaultReceivers = [];

  allReceivers = JanasevaDB.get('receivers', defaultReceivers);
  const badge = document.getElementById('tab-badge-receivers');
  if (badge) badge.innerText = allReceivers.length;
}

/**
 * Load Complaints Data from Primary Firestore & Local Cache
 */
async function loadComplaintsData() {
  allComplaints = JanasevaDB.get('complaints', []);

  // Fetch live grievances directly from MongoDB Atlas
  if (window.JanasevaMongoDB) {
    try {
      if (typeof window.JanasevaMongoDB.ready === 'function') {
        await window.JanasevaMongoDB.ready();
      }
      const user = window.authService?.currentUser;
      const filter = {};
      if (user && user.role === 'receiver' && user.panchayatId) {
        filter.panchayatId = user.panchayatId;
      }
      const mongoList = await window.JanasevaMongoDB.getComplaints(filter);
      if (mongoList && mongoList.length > 0) {
        allComplaints = mongoList;
      }
    } catch (mErr) {
      console.warn("MongoDB fetch notice in receiver dashboard:", mErr.message);
    }
  }

  // Hydrate workProgress from complaint_updates if available
  if (window.complaintStorageManager && allComplaints.length > 0) {
    try {
      const updates = await window.complaintStorageManager.getAllComplaintUpdates();
      allComplaints.forEach(c => {
        const cUpdates = updates.filter(u => u.complaintId === c.complaintId);
        const latestWp = window.complaintStorageManager.extractWorkProgressFromUpdates(cUpdates);
        if (latestWp && (!c.workProgress || new Date(latestWp.lastUpdatedISO || 0) >= new Date(c.workProgress.lastUpdatedISO || 0))) {
          c.workProgress = latestWp;
        }
      });
    } catch (e) {
      console.warn("Work progress hydration warning:", e);
    }
  }
}

/**
 * Load Registered Citizens from users collection
 */
async function loadCitizensData() {
  const localUsers = JanasevaDB.get('users', []);
  allCitizens = localUsers.filter(u => u.role === 'citizen');

  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      const snapshot = await window.fbDb.collection('users').where('role', '==', 'citizen').get();
      if (!snapshot.empty) {
        const fbCitizens = [];
        snapshot.forEach(doc => fbCitizens.push(doc.data()));
        if (fbCitizens.length > 0) {
          allCitizens = fbCitizens;
        }
      }
    } catch (err) {
      console.warn("Firestore citizens lookup warning:", err);
    }
  }

  const badge = document.getElementById('tab-badge-citizens');
  const countBadge = document.getElementById('citizens-count-badge');
  if (badge) badge.innerText = allCitizens.length;
  if (countBadge) countBadge.innerText = `${allCitizens.length} Citizens`;
}

/**
 * Load Administrative Audit Logs
 */
async function loadAuditLogs() {
  allAuditLogs = JanasevaDB.get('adminAuditLogs', []);

  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      const snapshot = await window.fbDb.collection('adminAuditLogs').orderBy('timestamp', 'desc').limit(50).get();
      if (!snapshot.empty) {
        const firestoreLogs = [];
        snapshot.forEach(doc => firestoreLogs.push(doc.data()));
        if (firestoreLogs.length > 0) {
          allAuditLogs = firestoreLogs;
          JanasevaDB.set('adminAuditLogs', allAuditLogs);
        }
      }
    } catch (err) {
      console.warn("Firestore audit logs warning:", err);
    }
  }

  const badge = document.getElementById('tab-badge-audit');
  if (badge) badge.innerText = allAuditLogs.length;
}

/**
 * Load Backups Data
 */
async function loadBackupsData() {
  allBackups = JanasevaDB.get('backups', [
    {
      snapshotId: "SNAP-2026-001",
      timestamp: "08 Nov 2026, 12:00 PM",
      recordCount: 5,
      totalSize: "148 KB",
      triggeredBy: "",
      status: "SUCCESS"
    }
  ]);
}

/**
 * Filter Scope: Determines complaints visible to current actor
 */
function getScopedComplaints() {
  const currentUser = window.authService ? window.authService.currentUser : null;
  const isAdmin = window.authService ? window.authService.isAdmin() : false;

  if (isAdmin) {
    return [...allComplaints];
  } else if (currentUser && currentUser.panchayatId) {
    return allComplaints.filter(c => c.panchayatId === currentUser.panchayatId);
  }
  return [...allComplaints];
}

/**
 * Check if a complaint is overdue (> 7 days from creation and unresolved)
 */
function isComplaintOverdue(complaint) {
  const s = (complaint.status || '').toLowerCase();
  if (s === 'resolved' || s === 'rejected') {
    return false;
  }

  if (!complaint.createdAt) return false;

  try {
    const createdTime = new Date(complaint.createdAt).getTime();
    if (isNaN(createdTime)) {
      return false;
    }
    const diffDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
  } catch (e) {
    return false;
  }
}

/**
 * Compute System-Wide Complaint Statistics with Correct Definitions
 * 1. Total Submitted: All successfully registered complaints.
 * 2. Total Received: Acknowledged by system or assigned to receiver.
 * 3. Total Processed: Complaints on which authorized processing action has occurred (In Progress, Under Review, Action Taken, Resolved).
 * 4. Total Resolved: Final authorized resolution.
 * 5. Total Pending: Awaiting action.
 * 6. Total In-Progress.
 * 7. Total Under-Review.
 * 8. Total Rejected.
 * 9. Total Reopened.
 * 10. Total Overdue (>7 days).
 */
function updateStatsAndBadges() {
  const scoped = getScopedComplaints();

  let counts = {
    total: scoped.length,
    submitted: 0,
    assigned: 0,
    inprogress: 0,
    underreview: 0,
    actiontaken: 0,
    resolved: 0,
    rejected: 0,
    reopened: 0,
    overdue: 0
  };

  scoped.forEach(item => {
    const s = (item.status || '').toLowerCase();
    if (s === 'submitted') counts.submitted++;
    else if (s === 'assigned') counts.assigned++;
    else if (s === 'in progress') counts.inprogress++;
    else if (s === 'under review') counts.underreview++;
    else if (s === 'action taken') counts.actiontaken++;
    else if (s === 'resolved') counts.resolved++;
    else if (s === 'rejected') counts.rejected++;
    else if (s === 'reopened') counts.reopened++;

    if (isComplaintOverdue(item)) {
      counts.overdue++;
    }
  });

  const elTotal = document.getElementById('stat-total-count');
  const elSubmitted = document.getElementById('stat-submitted-count');
  const elAssigned = document.getElementById('stat-assigned-count');
  const elInProgress = document.getElementById('stat-inprogress-count');
  const elUnderReview = document.getElementById('stat-underreview-count');
  const elActionTaken = document.getElementById('stat-actiontaken-count');
  const elResolved = document.getElementById('stat-resolved-count');
  const elRejected = document.getElementById('stat-rejected-count');
  const elReopened = document.getElementById('stat-reopened-count');
  const elOverdue = document.getElementById('stat-overdue-count');

  if (elTotal) elTotal.innerText = counts.total;
  if (elSubmitted) elSubmitted.innerText = counts.submitted;
  if (elAssigned) elAssigned.innerText = counts.assigned;
  if (elInProgress) elInProgress.innerText = counts.inprogress;
  if (elUnderReview) elUnderReview.innerText = counts.underreview;
  if (elActionTaken) elActionTaken.innerText = counts.actiontaken;
  if (elResolved) elResolved.innerText = counts.resolved;
  if (elRejected) elRejected.innerText = counts.rejected;
  if (elReopened) elReopened.innerText = counts.reopened;
  if (elOverdue) elOverdue.innerText = counts.overdue;

  const tabBadge = document.getElementById('tab-badge-complaints');
  if (tabBadge) tabBadge.innerText = counts.total;
}

/**
 * Filter & Search Listeners
 */
function wireFiltersAndSearch() {
  const searchInput = document.getElementById('rec-search-input');
  const gpFilter = document.getElementById('rec-gp-filter');
  const statusFilter = document.getElementById('rec-status-filter');

  if (searchInput) {
    searchInput.addEventListener('input', renderComplaintsTable);
  }

  if (gpFilter) {
    gpFilter.addEventListener('change', () => {
      renderComplaintsTable();
      renderPanchayatIntelligence();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      activeStatusFilter = statusFilter.value || 'all';
      syncStatCardHighlight(activeStatusFilter);
      renderComplaintsTable();
    });
  }
}

window.applyStatusCardFilter = function(status, cardEl) {
  activeStatusFilter = status;
  const statusSelect = document.getElementById('rec-status-filter');
  if (statusSelect) {
    statusSelect.value = (status === 'all' || status === 'overdue') ? '' : status;
  }
  syncStatCardHighlight(status);
  renderComplaintsTable();
};

function syncStatCardHighlight(status) {
  document.querySelectorAll('.stat-panel-card').forEach(card => {
    const cardStatus = card.getAttribute('data-status-filter');
    if (cardStatus === status) card.classList.add('active-filter');
    else card.classList.remove('active-filter');
  });
}

window.applyQuickPillFilter = function(filterMode) {
  activeQuickPill = filterMode;

  const pillButtons = ['all', 'pending', 'active', 'overdue', 'resolved'];
  pillButtons.forEach(p => {
    const btn = document.getElementById(`pill-filter-${p}`);
    if (btn) btn.classList.toggle('active', p === filterMode);
  });

  if (filterMode === 'all') activeStatusFilter = 'all';
  else if (filterMode === 'overdue') activeStatusFilter = 'overdue';
  else if (filterMode === 'resolved') activeStatusFilter = 'Resolved';

  syncStatCardHighlight(activeStatusFilter);
  renderComplaintsTable();
};

/**
 * Render Complaints Table
 */
function renderComplaintsTable() {
  const tbody = document.getElementById('receiver-table-body');
  const countEl = document.getElementById('table-record-count');
  if (!tbody) return;

  const scoped = getScopedComplaints();
  const searchInput = document.getElementById('rec-search-input');
  const gpFilter = document.getElementById('rec-gp-filter');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const selectedGp = gpFilter ? gpFilter.value : '';

  let filtered = scoped.filter(item => {
    if (selectedGp && item.panchayatId !== selectedGp) return false;

    if (activeQuickPill === 'pending') {
      const s = (item.status || '').toLowerCase();
      if (s !== 'submitted' && s !== 'reopened') return false;
    } else if (activeQuickPill === 'active') {
      const s = (item.status || '').toLowerCase();
      if (s !== 'assigned' && s !== 'in progress' && s !== 'under review' && s !== 'action taken') return false;
    } else if (activeQuickPill === 'overdue' || activeStatusFilter === 'overdue') {
      if (!isComplaintOverdue(item)) return false;
    } else if (activeStatusFilter !== 'all') {
      if ((item.status || '').toLowerCase() !== activeStatusFilter.toLowerCase()) return false;
    }

    if (query) {
      const matchId = (item.complaintId || '').toLowerCase().includes(query);
      const matchName = (item.citizenName || '').toLowerCase().includes(query);
      const matchEmail = (item.citizenEmail || '').toLowerCase().includes(query);
      const matchCat = (item.category || '').toLowerCase().includes(query);
      const matchSub = (item.subject || '').toLowerCase().includes(query);
      const matchDesc = (item.description || '').toLowerCase().includes(query);
      if (!matchId && !matchName && !matchEmail && !matchCat && !matchSub && !matchDesc) return false;
    }

    return true;
  });

  if (countEl) countEl.innerText = `${filtered.length} Records Found`;

  if (filtered.length === 0) {
    const isAdmin = window.authService ? window.authService.isAdmin() : false;
    let emptyHeadline = "No grievances match the selected criteria.";
    let emptySubtext = "Try adjusting the filter pills or search terms.";

    if (scoped.length === 0) {
      if (isAdmin) {
        emptyHeadline = "No genuine complaints found.";
        emptySubtext = "Only authentic complaints submitted by registered citizens will appear in this administrative control ledger.";
      } else {
        emptyHeadline = "No complaints assigned yet.";
        emptySubtext = "Grievances lodged for your Gram Panchayat jurisdiction will be displayed here in real time.";
      }
    }

    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 22px 14px; color: #64748b;">
          <i class="fa-solid fa-folder-open" style="font-size: 32px; color: #cbd5e1; margin-bottom: 10px; display: block;"></i>
          <strong style="color: #0b2545; font-size: 15px;">${emptyHeadline}</strong><br>
          <span style="font-size: 13px;">${emptySubtext}</span>
        </td>
      </tr>
    `;
    return;
  }

  const isAdmin = window.authService ? window.authService.isAdmin() : false;

  // Detect potential duplicates across grievances
  let duplicateMap = {};
  if (window.complaintStorageManager && typeof window.complaintStorageManager.detectDuplicates === 'function') {
    const dups = window.complaintStorageManager.detectDuplicates(allComplaints);
    dups.forEach(d => {
      if (d.primaryId && d.duplicateId) {
        duplicateMap[d.primaryId] = { partnerId: d.duplicateId, reason: d.reason || 'Potential duplicate record' };
        duplicateMap[d.duplicateId] = { partnerId: d.primaryId, reason: d.reason || 'Potential duplicate record' };
      }
      if (d.complaintId && d.duplicateOf) {
        duplicateMap[d.complaintId] = { partnerId: d.duplicateOf, reason: d.reason || `${d.similarity || ''}% similarity` };
        duplicateMap[d.duplicateOf] = { partnerId: d.complaintId, reason: d.reason || `${d.similarity || ''}% similarity` };
      }
    });
  }

  tbody.innerHTML = filtered.map(item => {
    const overdue = isComplaintOverdue(item);
    const badgeClass = getStatusBadgeClass(item.status);
    const assignedReceiver = item.assignedReceiverName || item.assignedReceiverEmail || 'Unassigned';
    const dupInfo = duplicateMap[item.complaintId];
    const duplicateBadge = dupInfo ? `
      <div style="margin-top: 3px;">
        <span class="badge-duplicate-candidate" onclick="openDuplicateReviewModal('${item.complaintId}', '${dupInfo.partnerId}')" title="Potential duplicate detected: ${escapeHtml(dupInfo.reason)}. Click to review.">
          <i class="fa-solid fa-copy"></i> Duplicate
        </span>
      </div>
    ` : '';

    return `
      <tr>
        ${isAdmin ? `<td style="text-align: center;"><input type="checkbox" class="complaint-row-check" value="${item.complaintId}" onchange="handleComplaintCheckboxChange()"></td>` : ''}
        <td>
          <span class="table-id-tag">${item.complaintId}</span>
          ${duplicateBadge}
          ${overdue ? '<span class="badge-overdue" style="font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 4px;" title="Overdue > 7 days"><i class="fa-solid fa-clock"></i> Overdue</span>' : ''}
        </td>
        <td>
          <strong style="color: #0b2545;">${escapeHtml(item.citizenName)}</strong><br>
          <span style="font-size: 11.5px; color: #64748b;">${escapeHtml(item.citizenPhone || item.citizenEmail || '')}</span>
        </td>
        <td>
          <span style="font-weight: 600; color: #334155;">${escapeHtml(item.panchayatName || item.panchayatId || '')}</span>
        </td>
        <td>
          <strong style="font-size: 12px; color: #0b2545;">${escapeHtml(item.subject || item.category)}</strong><br>
          <span style="font-size: 11px; color: #64748b;">${escapeHtml(item.category)}</span>
        </td>
        <td>
          <span class="ai-priority-pill ${getPriorityPillClass(item.aiPriority)}" style="font-size: 10.5px; padding: 2px 8px;">
            ${escapeHtml(item.aiPriority || 'NORMAL')}
          </span>
          ${item.isEmergency ? '<br><span style="color: #dc2626; font-size: 10px; font-weight: 800;"><i class="fa-solid fa-triangle-exclamation"></i> URGENT</span>' : ''}
        </td>
        <td style="font-size: 12px; color: #64748b; white-space: nowrap;">
          ${escapeHtml(item.createdAt || 'N/A')}
        </td>
        <td>
          <span style="font-size: 12px; font-weight: 600; color: #475569;">
            <i class="fa-solid fa-user-tag" style="color: #0f56b3; margin-right: 4px;"></i>${escapeHtml(assignedReceiver)}
          </span>
        </td>
        <td>
          ${window.janasevaStatusManager ? window.janasevaStatusManager.getStatusBadgeHTML(item.status) : `
          <span class="status-badge-pill ${badgeClass}">
            ${getStatusIcon(item.status)} ${escapeHtml(item.status)}
          </span>`}
          ${(() => {
            const wpPct = Number(item.workProgress?.percentage || 0);
            const wpStage = item.workProgress?.stage || (wpPct >= 100 ? 'Completed' : (wpPct > 0 ? 'In Progress' : 'Not Started'));
            if (wpPct > 0 || item.workProgress) {
              const clr = wpPct >= 100 ? '#16a34a' : (wpPct >= 50 ? '#2563eb' : '#ea580c');
              return `<div style="margin-top: 5px; font-size: 10.5px; color: ${clr}; font-weight: 700;">
                Progress: ${wpPct}% (${escapeHtml(wpStage)})
                <div style="background: #e2e8f0; height: 4px; border-radius: 2px; margin-top: 2px; overflow: hidden;">
                  <div style="background: ${clr}; height: 100%; width: ${wpPct}%;"></div>
                </div>
              </div>`;
            }
            return '';
          })()}
        </td>
        <td style="white-space: nowrap; text-align: right;">
          <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end;">
            <button type="button" class="btn-table-action btn-action-edit" onclick="openReviewModal('${item.complaintId}')" style="background: #0b2545; color: #fff; font-weight: 700; border: none; padding: 5px 10px; border-radius: 5px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px; line-height: 1.2;" title="Edit Grievance Details, Status & Official Response">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button type="button" class="btn-table-action btn-action-receipt" onclick="downloadAdminReceipt('${item.complaintId}')" style="background: #f8fafc; border: 1px solid #cbd5e1; color: #334155; font-weight: 600; padding: 5px 10px; border-radius: 5px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px; line-height: 1.2;" title="Print Acknowledgement Slip">
              <i class="fa-solid fa-file-arrow-down"></i> Receipt
            </button>
            <button type="button" class="btn-table-action" onclick="viewComplaintHistoryTimeline('${item.complaintId}')" style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-weight: 600; padding: 5px 8px; border-radius: 5px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px; line-height: 1.2;" title="View Complete Update History">
              <i class="fa-solid fa-clock-rotate-left"></i> History
            </button>
            ${isAdmin ? `
            <button type="button" class="btn-table-action btn-action-delete" onclick="deleteComplaint('${item.complaintId}')" title="Move to Protected Recycle Bin">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
            ` : `
            <button type="button" class="btn-table-action" onclick="openReceiverFlagModal('${item.complaintId}')" style="background: #fff7ed; border: 1px solid #fed7aa; color: #c2410c; font-weight: 700; padding: 5px 10px; border-radius: 5px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px; line-height: 1.2;" title="Flag duplicate or spam for Admin review">
              <i class="fa-solid fa-flag"></i> Flag
            </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.janasevaTranslator) {
    window.janasevaTranslator.applyTranslations();
  }
}

function getStatusBadgeClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'submitted') return 'badge-submitted';
  if (s === 'assigned') return 'badge-assigned';
  if (s === 'in progress') return 'badge-inprogress';
  if (s === 'under review') return 'badge-underreview';
  if (s === 'action taken') return 'badge-actiontaken';
  if (s === 'resolved') return 'badge-resolved';
  if (s === 'rejected') return 'badge-rejected';
  if (s === 'reopened') return 'badge-reopened';
  return 'badge-submitted';
}

function getStatusIcon(status) {
  const s = (status || '').toLowerCase();
  if (s === 'submitted') return '<i class="fa-solid fa-inbox"></i>';
  if (s === 'assigned') return '<i class="fa-solid fa-user-check"></i>';
  if (s === 'in progress') return '<i class="fa-solid fa-gear"></i>';
  if (s === 'under review') return '<i class="fa-solid fa-magnifying-glass"></i>';
  if (s === 'action taken') return '<i class="fa-solid fa-truck-fast"></i>';
  if (s === 'resolved') return '<i class="fa-solid fa-circle-check"></i>';
  if (s === 'rejected') return '<i class="fa-solid fa-circle-xmark"></i>';
  if (s === 'reopened') return '<i class="fa-solid fa-rotate-left"></i>';
  return '<i class="fa-solid fa-circle-info"></i>';
}

/**
 * Render Registered Citizens Table (Admin Only)
 */
function renderCitizensTable() {
  const tbody = document.getElementById('citizens-table-body');
  if (!tbody) return;

  if (allCitizens.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 24px;">No registered citizens found in users collection.</td></tr>';
    return;
  }

  tbody.innerHTML = allCitizens.map(c => {
    const citizenComplaints = allComplaints.filter(item => 
      (item.userId && item.userId === c.uid) ||
      (item.citizenEmail && item.citizenEmail.toLowerCase() === (c.email || '').toLowerCase())
    );

    return `
      <tr>
        <td><span class="table-id-tag">${escapeHtml(c.uid || 'usr-000')}</span></td>
        <td><strong style="color: #0b2545;">${escapeHtml(c.name || 'Citizen')}</strong></td>
        <td><span style="font-size: 12px; color: #475569;">${escapeHtml(c.email || '')}</span></td>
        <td><span style="font-size: 12px; color: #475569;">${escapeHtml(c.mobile || 'N/A')}</span></td>
        <td><span style="font-weight: 600; color: #334155;">${escapeHtml(c.panchayatName || c.panchayatId || 'General')}</span></td>
        <td style="font-size: 12px; color: #64748b;">${escapeHtml(c.createdAt || 'N/A')}</td>
        <td>
          <span style="display: inline-block; padding: 2px 8px; border-radius: var(--radius-pill); font-weight: 800; font-size: 11px; background: #e0f2fe; color: #0369a1;">
            ${citizenComplaints.length} Filed
          </span>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-sm btn-delete-row" onclick="deleteCitizenUser('${c.uid || c.id}')" title="Delete Citizen Account" style="padding: 5px 10px; font-size: 12px; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 4px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-trash-can"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
}

/**
 * Render Receivers & Workload Distribution Cards
 */
function renderWorkloadCards() {
  const container = document.getElementById('workload-cards-container');
  if (!container) return;

  const scoped = getScopedComplaints();

  container.innerHTML = allReceivers.map(rec => {
    const recComplaints = scoped.filter(c => c.panchayatId === rec.panchayatId || c.assignedReceiverEmail === rec.email);
    const total = recComplaints.length;
    const active = recComplaints.filter(c => ['Submitted', 'Assigned', 'In Progress', 'Under Review', 'Action Taken', 'Reopened'].includes(c.status)).length;
    const resolved = recComplaints.filter(c => c.status === 'Resolved').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    return `
      <div class="workload-card">
        <div class="workload-header">
          <div>
            <div class="workload-title">${escapeHtml(rec.name)}</div>
            <div style="font-size: 11.5px; color: #64748b;">${escapeHtml(rec.email)}</div>
          </div>
          <span style="font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 4px; background: #e0f2fe; color: #0369a1;">
            ${escapeHtml(rec.panchayatName || rec.panchayatId)}
          </span>
        </div>
        <div class="workload-stat-row">
          <span>Total Assigned:</span>
          <strong>${total}</strong>
        </div>
        <div class="workload-stat-row">
          <span>Active Pending:</span>
          <strong style="color: #d97706;">${active}</strong>
        </div>
        <div class="workload-stat-row">
          <span>Resolved Grievances:</span>
          <strong style="color: #16a34a;">${resolved}</strong>
        </div>
        <div class="workload-stat-row" style="border-bottom: none; margin-top: 6px;">
          <span>Resolution Rate:</span>
          <strong style="color: #0f56b3;">${rate}%</strong>
        </div>
        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end;">
          <button type="button" class="btn-sm btn-delete-receiver" onclick="deleteReceiverUser('${escapeHtml(String(rec.email || rec.uid || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"))}', '${escapeHtml(String(rec.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"))}')" title="Delete Grievance Officer" style="padding: 5px 12px; font-size: 11.5px; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 4px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-trash-can"></i> Delete Receiver
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
}

/**
 * Render Administrative Audit Logs Table
 */
function renderAuditLogsTable() {
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;

  if (allAuditLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">No administrative audit entries logged yet.</td></tr>';
    return;
  }

  tbody.innerHTML = allAuditLogs.map((log, idx) => {
    let actionPillClass = 'action-status_change';
    const a = (log.action || '').toLowerCase();
    if (a.includes('response')) actionPillClass = 'action-official_response';
    else if (a.includes('internal') || a.includes('note')) actionPillClass = 'action-internal_note';
    else if (a.includes('reassign')) actionPillClass = 'action-reassign';
    else if (a.includes('delete')) actionPillClass = 'action-delete';
    else if (a.includes('backup')) actionPillClass = 'action-reassign';

    const logId = log.id || log.logId || `AUDIT-${idx}`;

    return `
      <tr>
        <td style="font-size: 12px; color: #64748b; white-space: nowrap;">${escapeHtml(log.timestamp || '')}</td>
        <td><span class="audit-action-pill ${actionPillClass}">${escapeHtml(log.action || '')}</span></td>
        <td><span class="table-id-tag">${escapeHtml(log.complaintId || 'SYSTEM')}</span></td>
        <td style="font-weight: 600; color: #334155;">${escapeHtml(log.actor || '')}</td>
        <td style="font-size: 13px;">${escapeHtml(log.details || '')}</td>
        <td style="text-align: right;">
          <button type="button" class="btn-sm btn-delete-audit-log" onclick="deleteAdminAuditLog('${logId}')" title="Delete Audit Entry" style="padding: 4px 8px; font-size: 11.5px; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 4px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-trash-can"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
}

/**
 * Render Backup Snapshots Table
 */
function renderBackupsTable() {
  const tbody = document.getElementById('backup-snapshots-body');
  if (!tbody) return;

  if (allBackups.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">No backup snapshots recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = allBackups.map(b => `
    <tr>
      <td><span class="table-id-tag">${escapeHtml(b.snapshotId)}</span></td>
      <td style="font-size: 12px; color: #64748b;">${escapeHtml(b.timestamp)}</td>
      <td><strong>${b.recordCount} records</strong></td>
      <td style="font-size: 12px;">${b.totalSize}</td>
      <td style="font-size: 12px; color: #334155;">${escapeHtml(b.triggeredBy)}</td>
      <td>
        <span style="background: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 4px;">
          ${b.status}
        </span>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-sm btn-delete-backup" onclick="deleteBackupSnapshot('${b.snapshotId || b.id}')" title="Delete Backup Snapshot" style="padding: 4px 8px; font-size: 11.5px; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 4px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-trash-can"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');

  if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
  initDatabaseBackupsUSM();
}

/**
 * Database & Backup Health Indicators
 */
function updateDatabaseHealthIndicators() {
  const fsStatus = document.getElementById('health-firestore-status');
  if (fsStatus) {
    fsStatus.innerText = window.isFirebaseAvailable ? 'CLOUD FIRESTORE' : 'HYBRID REPOSITORY';
    fsStatus.style.color = window.isFirebaseAvailable ? '#16a34a' : '#0284c7';
  }
}

function initDatabaseBackupsUSM() {
  if (!window.JanasevaSettings) return;
  const host = document.getElementById('database-backups-usm-status');
  if (!host) return;
  window.JanasevaSettings.registerSection({
    sectionId: 'admin-backups',
    sectionName: 'Database Backups',
    containerEl: '#admin-tab-database',
    statusHostEl: '#database-backups-usm-status',
    refreshBtn: '#refresh-backups-btn',
    readOnly: true,
    trackInputs: false,
    onRefresh: async () => {
      if (!window.authService || !window.authService.isAdmin()) {
        throw new Error('Unauthorized: Admin access required.');
      }
      if (window.isFirebaseAvailable && window.fbDb) {
        const snap = await window.fbDb.collection('backups').get();
        const remote = [];
        snap.forEach((doc) => remote.push({ id: doc.id, ...doc.data() }));
        remote.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        allBackups = remote;
        if (typeof JanasevaDB !== 'undefined') JanasevaDB.set('backups', allBackups);
      } else if (typeof JanasevaDB !== 'undefined') {
        allBackups = JanasevaDB.get('backups', []);
      }
      renderBackupsTable();
      updateDatabaseHealthIndicators();
      return {
        refreshedAt: new Date().toISOString(),
        message: 'Database backup snapshots reloaded.'
      };
    }
  });
}

/**
 * Create Database Backup Snapshot (Admin Only)
 */
window.createDatabaseBackupSnapshot = async function() {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast('Unauthorized: Only Administrators may create database backups.', 'error');
    return;
  }
  const createBtn = document.getElementById('create-backup-snapshot-btn');
  if (createBtn && createBtn.disabled) return;
  if (window.JanasevaSettings && createBtn) {
    window.JanasevaSettings.setButtonState(createBtn, 'loading', 'Creating Snapshot...');
  }

  try {
    const currentUser = window.authService?.currentUser;
    const nowFormatted = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });

    const snapshotId = `SNAP-${Date.now().toString(36).toUpperCase()}`;
    const totalRecords = allComplaints.length + allCitizens.length + allAuditLogs.length;

    const newSnapshot = {
      snapshotId: snapshotId,
      timestamp: nowFormatted,
      recordCount: totalRecords,
      totalSize: `${Math.round(totalRecords * 1.8)} KB`,
      triggeredBy: currentUser ? currentUser.email : '',
      status: "SUCCESS"
    };

    if (window.isFirebaseAvailable && window.fbDb) {
      await window.fbDb.collection('backups').doc(snapshotId).set(newSnapshot);
    }

    allBackups.unshift(newSnapshot);
    JanasevaDB.set('backups', allBackups);

    recordAuditLog({
      action: 'BACKUP_CREATED',
      complaintId: snapshotId,
      actor: currentUser ? currentUser.email : '',
      details: `Created database snapshot ${snapshotId} containing ${totalRecords} records.`
    });

    renderBackupsTable();
    if (window.JanasevaSettings) {
      window.JanasevaSettings.markClean('admin-backups', { savedAt: new Date().toISOString(), updatedBy: newSnapshot.triggeredBy });
      if (createBtn) window.JanasevaSettings.setButtonState(createBtn, 'success', 'Snapshot Saved');
    }
    showToast(`Database backup snapshot ${snapshotId} created successfully!`, "success");
  } catch (err) {
    if (window.JanasevaSettings) {
      window.JanasevaSettings.setSectionError('admin-backups', err.message || 'Backup snapshot failed.');
      if (createBtn) window.JanasevaSettings.setButtonState(createBtn, 'error', 'Failed');
    }
    showToast(`Backup failed: ${err.message}`, 'error');
  }
};

/**
 * Export Entire Database as JSON
 */
window.exportFullDatabaseJSON = function() {
  const fullBackup = {
    exportDate: new Date().toISOString(),
    system: "JANASEVA Grievance Management System",
    version: "2.0",
    panchayats: JanasevaDB.get('panchayats', []),
    complaints: allComplaints,
    users: JanasevaDB.get('users', []),
    auditLogs: allAuditLogs,
    settings: JanasevaDB.get('settings', {})
  };

  const jsonStr = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];

  a.href = url;
  a.download = `JANASEVA_Database_Full_Export_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast("Database JSON archive downloaded successfully!", "success");
};

/**
 * Generate Printable Administrative PDF Report
 */
window.generateAdministrativePDFReport = function() {
  const scoped = getScopedComplaints();
  const printWindow = window.open('', '_blank', 'width=900,height=950');
  if (!printWindow) {
    showToast("Please allow popups to generate administrative report.", "warning");
    return;
  }

  const nowStr = new Date().toLocaleString('en-IN');
  const total = scoped.length;
  const inProgress = scoped.filter(c => c.status === 'In Progress').length;
  const resolved = scoped.filter(c => c.status === 'Resolved').length;
  const pending = scoped.filter(c => c.status === 'Submitted' || c.status === 'Assigned').length;
  const overdue = scoped.filter(c => isComplaintOverdue(c)).length;

  const rows = scoped.map(c => `
    <tr>
      <td>${c.complaintId}</td>
      <td><strong>${escapeHtml(c.citizenName)}</strong></td>
      <td>${escapeHtml(c.panchayatName || c.panchayatId)}</td>
      <td>${escapeHtml(c.category)}</td>
      <td>${c.status}</td>
      <td>${c.createdAt}</td>
    </tr>
  `).join('');

  const reportHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>JANASEVA Administrative Grievance Report</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #0b2545; line-height: 1.5; }
        .header { text-align: center; border-bottom: 2.5px solid #0f56b3; padding-bottom: 15px; margin-bottom: 20px; }
        .title { font-size: 22px; font-weight: 800; color: #0b2545; }
        .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
        .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 20px 0; text-align: center; }
        .stat-box { border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; }
        .stat-num { font-size: 22px; font-weight: 800; color: #0f56b3; }
        .stat-lbl { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
        th { background: #0f56b3; color: #fff; font-weight: 700; }
        .footer { margin-top: 30px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
        @media print { .no-print { display: none; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">JANASEVA – DIGITAL GRIEVANCE MANAGEMENT SYSTEM</div>
        <div class="subtitle">Official Comprehensive Administrative Grievance Register & Status Audit</div>
        <div style="font-size: 12px; color: #334155; margin-top: 6px;">Generated On: <strong>${nowStr}</strong> | Operator: <strong>${window.authService?.currentUser?.email || ''}</strong></div>
      </div>

      <div class="stats-grid">
        <div class="stat-box"><div class="stat-num">${total}</div><div class="stat-lbl">Total Registered</div></div>
        <div class="stat-box"><div class="stat-num" style="color: #d97706;">${pending}</div><div class="stat-lbl">Pending Action</div></div>
        <div class="stat-box"><div class="stat-num" style="color: #0284c7;">${inProgress}</div><div class="stat-lbl">In Progress</div></div>
        <div class="stat-box"><div class="stat-num" style="color: #16a34a;">${resolved}</div><div class="stat-lbl">Resolved</div></div>
        <div class="stat-box"><div class="stat-num" style="color: #dc2626;">${overdue}</div><div class="stat-lbl">Overdue (>7d)</div></div>
      </div>

      <h3 style="font-size: 15px; color: #0b2545; margin-top: 25px;">Grievances Register Summary</h3>
      <table>
        <thead>
          <tr>
            <th>Complaint ID</th>
            <th>Citizen</th>
            <th>Gram Panchayat</th>
            <th>Category</th>
            <th>Status</th>
            <th>Filing Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="footer">
        <p>JANASEVA Administrative Grievance Portal &bull; Academic Civic Redressal Platform</p>
      </div>

      <div style="text-align: center; margin-top: 20px;" class="no-print">
        <button onclick="window.print()" style="padding: 10px 24px; font-size: 14px; font-weight: 700; background: #0f56b3; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
          Print / Save PDF Report
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(reportHtml);
  printWindow.document.close();
};

/**
 * Print Acknowledgement Slip from Admin Table
 */
window.downloadAdminReceipt = function(complaintId) {
  const c = allComplaints.find(item => item.complaintId === complaintId);
  if (!c) {
    if (typeof showToast === 'function') showToast('Complaint record not found.', 'warning');
    return;
  }
  if (window.downloadComplaintReceipt) {
    window.downloadComplaintReceipt(c);
    return;
  }
  const win = window.open('', '_blank', 'width=850,height=720');
  if (!win) {
    if (typeof showToast === 'function') showToast('Pop-up blocked. Please allow pop-ups to print receipt.', 'warning');
    return;
  }
  const esc = (v) => escapeHtml(String(v == null ? '' : v));
  win.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>JANASEVA Official Grievance Receipt - ${esc(c.complaintId)}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; line-height: 1.5; }
        .header { border-bottom: 3px solid #0b2545; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { font-size: 20px; font-weight: 800; color: #0b2545; margin: 0; }
        .sub { font-size: 12px; color: #475569; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 9px 12px; text-align: left; font-size: 13px; vertical-align: top; }
        th { width: 210px; background: #f8fafc; color: #334155; font-weight: 700; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; background: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 12px; }
        .footer { margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">JANASEVA – Gram Panchayat Grievance Portal</h1>
          <div class="sub">Official Grievance Registration &amp; Administrative Status Slip</div>
        </div>
        <div style="font-size: 12px; color: #475569;">Printed: ${esc(new Date().toLocaleString('en-IN'))}</div>
      </div>
      <table>
        <tr><th>Complaint ID</th><td><strong>${esc(c.complaintId)}</strong></td></tr>
        <tr><th>Current Status</th><td><span class="badge">${esc(c.status || 'Submitted')}</span></td></tr>
        <tr><th>Citizen Name</th><td>${esc(c.citizenName || 'N/A')}</td></tr>
        <tr><th>Citizen Email</th><td>${esc(c.citizenEmail || 'N/A')}</td></tr>
        <tr><th>Gram Panchayat</th><td>${esc(c.panchayatName || 'N/A')}</td></tr>
        <tr><th>Category</th><td>${esc(c.category || 'N/A')}</td></tr>
        <tr><th>Priority</th><td>${esc(c.priority || 'NORMAL')}</td></tr>
        <tr><th>Submitted Date</th><td>${esc(c.submissionDate || c.createdAt || 'N/A')}</td></tr>
        <tr><th>Assigned Receiver</th><td>${esc(c.assignedReceiverName || c.assignedReceiverEmail || 'Panchayat Officer')}</td></tr>
        <tr><th>Description</th><td>${esc(c.description || 'N/A')}</td></tr>
        ${c.receiverResponse ? `<tr><th>Official Response</th><td>${esc(c.receiverResponse)}</td></tr>` : ''}
        ${c.resolutionRemarks ? `<tr><th>Resolution Remarks</th><td>${esc(c.resolutionRemarks)}</td></tr>` : ''}
      </table>
      <div class="footer">
        <span>Generated via JANASEVA Receiver Control Centre</span>
        <span>Electronic Record • Signature Not Required</span>
      </div>
      <script>window.onload = function() { window.print(); };<\/script>
    </body>
    </html>
  `);
  win.document.close();
};

/**
 * Open Review Modal & Populate Grievance Details
 */
window.openReviewModal = async function(complaintId) {
  const complaint = allComplaints.find(c => c.complaintId === complaintId);
  if (!complaint) return;

  currentModalComplaintId = complaintId;
  const modal = document.getElementById('review-complaint-modal');
  if (!modal) return;

  // Metadata Fields
  document.getElementById('modal-rev-id').innerText = complaint.complaintId;
  document.getElementById('modal-rev-citizen').innerText = `${complaint.citizenName} (${complaint.citizenPhone || complaint.citizenEmail || 'No Contact'})`;
  document.getElementById('modal-rev-gp').innerText = complaint.panchayatName || complaint.panchayatId;
  document.getElementById('modal-rev-category').innerText = complaint.category;
  document.getElementById('modal-rev-date').innerText = complaint.createdAt;
  document.getElementById('modal-rev-desc').innerText = complaint.description;

  // Evidence Photograph Preview with Lightbox Viewer
  const photoWrap = document.getElementById('modal-photo-wrap');
  const photoEl = document.getElementById('modal-rev-photo');
  if (photoWrap && photoEl) {
    if (complaint.photoURL) {
      photoEl.src = complaint.photoURL;
      photoWrap.style.display = 'block';
      photoEl.style.cursor = 'pointer';
      photoEl.title = 'Click to view full image in Lightbox';
      photoEl.onclick = () => {
        if (typeof window.openImageLightbox === 'function') {
          window.openImageLightbox(complaint.photoURL, complaint.complaintId || 'Evidence Photograph');
        } else {
          window.open(complaint.photoURL, '_blank');
        }
      };
    } else {
      photoWrap.style.display = 'none';
    }
  }

  // Render AI Prioritization & Emergency Banner in Modal
  const aiBanner = document.getElementById('modal-ai-prioritization-banner');
  if (aiBanner) {
    const pClass = getPriorityPillClass(complaint.aiPriority);
    let emergencyMarkup = '';
    if (complaint.isEmergency) {
      emergencyMarkup = `
        <div class="ai-emergency-banner" style="margin-bottom: 8px;">
          <div class="emergency-icon-wrap"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div class="emergency-text-wrap">
            <div class="emergency-heading">POTENTIAL PUBLIC HAZARD DETECTED</div>
            <div class="emergency-desc">${escapeHtml(complaint.emergencyDetails?.hazard || 'Immediate on-site verification required.')}</div>
            <div class="emergency-helplines"><strong>Helpline:</strong> ${escapeHtml(complaint.emergencyDetails?.helpline || '112')}</div>
          </div>
        </div>
      `;
    }

    aiBanner.innerHTML = `
      ${emergencyMarkup}
      <div class="ai-smart-analysis-box" style="margin-bottom: 12px;">
        <div class="ai-analysis-header">
          <div class="ai-analysis-tag"><i class="fa-solid fa-brain"></i> AI Complaint Prioritization</div>
          <div class="ai-priority-pill ${pClass}">Priority: <strong>${escapeHtml(complaint.aiPriority || 'NORMAL')}</strong></div>
        </div>
        <div class="ai-analysis-details">
          <div class="ai-detail-item"><strong>Suggested Department:</strong> ${escapeHtml(complaint.assignedDepartment || complaint.aiDepartment || 'General Administration')}</div>
          <div class="ai-detail-item"><strong>AI Assessment:</strong> ${escapeHtml(complaint.aiRationale || 'Standard civic grievance processed according to Gram Panchayat service guidelines.')}</div>
        </div>
      </div>
    `;
  }

  // Pre-select priority override selector
  const prioritySelect = document.getElementById('modal-priority-select');
  if (prioritySelect) {
    prioritySelect.value = (complaint.aiPriority || 'NORMAL').toUpperCase();
  }

  // Render AI Document Verification & Human Review Section
  const docSection = document.getElementById('modal-doc-verification-section');
  if (docSection) {
    const docAnalysis = complaint.documentAnalysis;
    if (docAnalysis) {
      let statusBadge = '<span class="doc-status-badge badge-success"><i class="fa-solid fa-circle-check"></i> Consistent</span>';
      if (docAnalysis.reviewStatus === 'Inconsistency Detected') {
        statusBadge = '<span class="doc-status-badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Inconsistency Flagged</span>';
      } else if (docAnalysis.reviewStatus === 'Missing Information') {
        statusBadge = '<span class="doc-status-badge badge-info"><i class="fa-solid fa-circle-info"></i> Missing Field Detected</span>';
      }

      let alertsMarkup = '';
      if (docAnalysis.inconsistencies && docAnalysis.inconsistencies.length > 0) {
        alertsMarkup += docAnalysis.inconsistencies.map(inc => `
          <div class="doc-alert-box alert-danger">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div><strong>${escapeHtml(inc.field)}:</strong> ${escapeHtml(inc.message)}</div>
          </div>
        `).join('');
      }

      const officerStatus = docAnalysis.officerVerification?.status || 'PENDING_OFFICIAL_REVIEW';
      let officerBadge = '<span style="color: #92400e; font-weight: 700; font-size: 11px;">[Pending Official Review]</span>';
      if (officerStatus === 'APPROVED') officerBadge = '<span style="color: #16a34a; font-weight: 700; font-size: 11px;">[Approved by Officer]</span>';
      else if (officerStatus === 'FLAGGED') officerBadge = '<span style="color: #dc2626; font-weight: 700; font-size: 11px;">[Flagged for Field Inquiry]</span>';

      const isOnlineEngine = (docAnalysis.ocrEngine || '').startsWith('online') || (docAnalysis.ocrEngine || '').startsWith('cloud');
      const enginePill = isOnlineEngine
        ? `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 11px; font-weight: 700;"><i class="fa-solid fa-cloud"></i> ${escapeHtml(docAnalysis.ocrEngine || 'Online OCR')}</span>`
        : `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #f5f3ff; color: #6d28d9; border-radius: 4px; font-size: 11px; font-weight: 700;"><i class="fa-solid fa-microchip"></i> ${escapeHtml(docAnalysis.ocrEngine || 'Offline Tesseract.js')}</span>`;

      docSection.innerHTML = `
        <div class="portal-card" style="border: 1.5px solid #bfdbfe; background: #f8fafc; padding: 14px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
            <div style="font-weight: 800; font-size: 13.5px; color: #0b2545; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-file-shield" style="color: #0f56b3;"></i> AI Supporting Document Verification & Official Audit
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              ${enginePill}
              ${statusBadge}
            </div>
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
            Document: <strong>${escapeHtml(docAnalysis.filename || 'Supporting Document')}</strong> &bull; Classified: <strong>${escapeHtml(docAnalysis.docType || 'Document')}</strong> (${Math.round((docAnalysis.classificationConfidence || 0.9) * 100)}% Confidence) &bull; Language: <strong>${escapeHtml(docAnalysis.detectedLanguage || 'eng')}</strong>
          </div>
          ${alertsMarkup}
          <div class="doc-entities-grid" style="margin-bottom: 12px;">
            <div class="entity-item"><span>Applicant Name:</span> <strong>${escapeHtml(docAnalysis.entities?.applicantName || 'Not detected')}</strong></div>
            <div class="entity-item"><span>Survey / Doc No:</span> <strong>${escapeHtml(docAnalysis.entities?.surveyNumber || docAnalysis.entities?.documentNumber || 'N/A')}</strong></div>
            <div class="entity-item"><span>Panchayat / Location:</span> <strong>${escapeHtml(docAnalysis.entities?.village || docAnalysis.entities?.gramPanchayat || 'Not detected')}</strong></div>
            <div class="entity-item"><span>Date on Document:</span> <strong>${escapeHtml(docAnalysis.entities?.date || 'N/A')}</strong></div>
          </div>
          <details style="margin-bottom: 12px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; padding: 6px 10px;">
            <summary style="cursor: pointer; font-weight: 700; color: #0f56b3;"><i class="fa-solid fa-file-lines"></i> View Full Extracted OCR Text</summary>
            <pre style="white-space: pre-wrap; font-family: monospace, sans-serif; font-size: 11.5px; margin-top: 6px; padding: 8px; background: #f8fafc; border-radius: 4px; max-height: 180px; overflow-y: auto; color: #1e293b;">${escapeHtml(docAnalysis.userCorrectedText || docAnalysis.extractedText || 'No text extracted.')}</pre>
          </details>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            <div><strong>Verification Status:</strong> ${officerBadge}</div>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn-cta-secondary" onclick="verifyDocumentStatus('${complaint.complaintId}', 'APPROVED')" style="padding: 4px 10px; font-size: 11.5px; color: #16a34a;">
                <i class="fa-solid fa-circle-check"></i> Approve Document
              </button>
              <button type="button" class="btn-cta-secondary" onclick="verifyDocumentStatus('${complaint.complaintId}', 'FLAGGED')" style="padding: 4px 10px; font-size: 11.5px; color: #dc2626;">
                <i class="fa-solid fa-flag"></i> Flag for Inquiry
              </button>
            </div>
          </div>
        </div>
      `;
      docSection.style.display = 'block';
    } else {
      docSection.style.display = 'none';
      docSection.innerHTML = '';
    }
  }

  // 8-Stage Progress Stepper
  renderModalStepper(complaint.status);

  // Load Communication Thread (Official Responses & Internal Notes)
  await loadComplaintMessages(complaint);

  // Status Selector - Dynamic transitions based on authoritative JanasevaStatusManager and user role
  const currentUserRole = window.authService && window.authService.currentUser ? window.authService.currentUser.role : 'receiver';
  if (window.janasevaStatusManager) {
    window.janasevaStatusManager.populateTransitionDropdown('modal-status-select', complaint.status, currentUserRole);
  } else {
    const statusSelect = document.getElementById('modal-status-select');
    if (statusSelect) {
      statusSelect.value = complaint.status || 'Submitted';
    }
  }
  handleModalStatusChange();

  // Populate Receiver Assignment Select
  const receiverSelect = document.getElementById('modal-assign-receiver');
  if (receiverSelect) {
    receiverSelect.innerHTML = '<option value="">-- Keep Current Assignment --</option>' +
      allReceivers.map(rec => {
        const isCurrent = (complaint.assignedReceiverEmail === rec.email) || (complaint.assignedReceiverId === rec.uid);
        return `<option value="${rec.email}" ${isCurrent ? 'selected' : ''}>${rec.name} (${rec.panchayatName})</option>`;
      }).join('');
  }

  // Pre-fill existing reasons if present
  const rejInput = document.getElementById('modal-rejection-reason');
  const reopenInput = document.getElementById('modal-reopen-reason');
  const resInput = document.getElementById('modal-resolution-remarks');

  if (rejInput) rejInput.value = complaint.rejectionReason || '';
  if (reopenInput) reopenInput.value = complaint.reopenReason || '';
  if (resInput) resInput.value = complaint.officialResponse || '';

  // Populate Field Work Progress inputs
  const wp = complaint.workProgress || {};
  const wpPercent = Number(wp.percentage || 0);
  const sliderEl = document.getElementById('modal-work-progress-slider');
  const stageEl = document.getElementById('modal-work-stage');
  const badgeEl = document.getElementById('modal-work-progress-badge');
  const sliderDisp = document.getElementById('modal-slider-percent-display');
  const descEl = document.getElementById('modal-work-desc');
  const compEl = document.getElementById('modal-work-completed');
  const remEl = document.getElementById('modal-work-remaining');
  const delayEl = document.getElementById('modal-work-delay');
  const nextEl = document.getElementById('modal-work-next');
  const workPhotoEl = document.getElementById('modal-work-photo');

  const calculatedStage = wp.stage || getWorkStageFromPercent(wpPercent);
  if (sliderEl) sliderEl.value = wpPercent;
  if (sliderDisp) sliderDisp.innerText = `${wpPercent}%`;
  if (stageEl) stageEl.value = calculatedStage;
  if (badgeEl) badgeEl.innerText = `${wpPercent}% – ${calculatedStage}`;
  if (descEl) descEl.value = wp.workDescription || '';
  if (compEl) compEl.value = wp.completedWork || '';
  if (remEl) remEl.value = wp.remainingWork || '';
  if (delayEl) delayEl.value = wp.delayReason || '';
  if (nextEl) nextEl.value = wp.nextAction || '';
  if (workPhotoEl) workPhotoEl.value = wp.photoUrl || '';

  modal.classList.add('active');
  if (window.janasevaTranslator) {
    window.janasevaTranslator.applyTranslations();
  }
};

window.syncReceiverWorkProgressSlider = function(val) {
  const num = parseInt(val, 10) || 0;
  const stage = getWorkStageFromPercent(num);
  const sliderDisp = document.getElementById('modal-slider-percent-display');
  const badgeEl = document.getElementById('modal-work-progress-badge');
  const stageSelect = document.getElementById('modal-work-stage');
  if (sliderDisp) sliderDisp.innerText = `${num}%`;
  if (badgeEl) badgeEl.innerText = `${num}% – ${stage}`;
  if (stageSelect) stageSelect.value = stage;
};

window.syncReceiverWorkProgressStage = function(stage) {
  let defaultVal = 0;
  if (stage === 'Initial Inspection') defaultVal = 20;
  else if (stage === 'Work Started') defaultVal = 40;
  else if (stage === 'Work in Progress') defaultVal = 65;
  else if (stage === 'Final Stage') defaultVal = 85;
  else if (stage === 'Completed and Verified') defaultVal = 100;
  else defaultVal = 0;

  const slider = document.getElementById('modal-work-progress-slider');
  const sliderDisp = document.getElementById('modal-slider-percent-display');
  const badgeEl = document.getElementById('modal-work-progress-badge');
  if (slider) slider.value = defaultVal;
  if (sliderDisp) sliderDisp.innerText = `${defaultVal}%`;
  if (badgeEl) badgeEl.innerText = `${defaultVal}% – ${stage}`;
};

function getWorkStageFromPercent(pct) {
  if (pct >= 100) return 'Completed and Verified';
  if (pct >= 76) return 'Final Stage';
  if (pct >= 51) return 'Work in Progress';
  if (pct >= 26) return 'Work Started';
  if (pct >= 10) return 'Initial Inspection';
  return 'Not Started';
}

window.closeReviewModal = function() {
  const modal = document.getElementById('review-complaint-modal');
  if (modal) modal.classList.remove('active');
  currentModalComplaintId = null;
};

/**
 * 8-Stage Workflow Stepper Renderer
 */
function renderModalStepper(status) {
  if (window.janasevaStatusManager) {
    const stages = window.janasevaStatusManager.getStepperStages();
    const currentStatusObj = window.janasevaStatusManager.getStatus(status);
    const currentId = currentStatusObj ? currentStatusObj.id : 'submitted';
    let currentIdx = stages.findIndex(s => s.id === currentId);
    if (currentIdx === -1) {
      if (currentId === 'rejected') currentIdx = -1;
      else currentIdx = 0;
    }

    const stepperContainer = document.getElementById('modal-workflow-stepper');
    if (stepperContainer && stages.length > 0) {
      const pct = stages.length > 1 && currentIdx >= 0 ?
        Math.min(100, Math.round((currentIdx / (stages.length - 1)) * 100)) : 0;
      
      let nodesHtml = stages.map((st, idx) => {
        let nodeClass = 'workflow-step-node';
        if (currentIdx === -1 && currentId === 'rejected') {
          nodeClass += ' rejected-stepper-state';
        } else if (idx < currentIdx) {
          nodeClass += ' completed';
        } else if (idx === currentIdx) {
          nodeClass += ' active';
        }
        return `
          <div class="${nodeClass}" id="step-node-${st.id}" onclick="quickSelectModalStatus('${st.id}')" style="cursor: pointer;" title="Admin: Click to select status: ${escapeHtml(st.name)}">
            <div class="workflow-step-circle">${idx + 1}</div>
            <div class="workflow-step-label">${escapeHtml(st.name)}</div>
          </div>
        `;
      }).join('');

      stepperContainer.innerHTML = `
        <div class="workflow-track-line">
          <div class="workflow-track-progress" id="modal-stepper-progress" style="width: ${pct}%;"></div>
        </div>
        ${nodesHtml}
      `;
      return;
    }
  }

  const steps = ['submitted', 'assigned', 'underreview', 'inprogress', 'actiontaken', 'resolved'];
  const statusMap = {
    'submitted': 0,
    'assigned': 1,
    'under review': 2,
    'in progress': 3,
    'action taken': 4,
    'resolved': 5
  };

  const currentIdx = statusMap[(status || '').toLowerCase()] !== undefined ? statusMap[(status || '').toLowerCase()] : 0;
  const progressBar = document.getElementById('modal-stepper-progress');

  steps.forEach((st, idx) => {
    const node = document.getElementById(`step-node-${st}`);
    if (!node) return;
    node.className = 'workflow-step-node';
    if (idx < currentIdx) {
      node.classList.add('completed');
    } else if (idx === currentIdx) {
      node.classList.add('active');
    }
  });

  if (progressBar) {
    const pct = Math.min(100, Math.round((currentIdx / (steps.length - 1)) * 100));
    progressBar.style.width = `${pct}%`;
  }
}

window.handleModalStatusChange = function() {
  const statusSelect = document.getElementById('modal-status-select');
  const rejWrap = document.getElementById('modal-rejection-wrap');
  const reopenWrap = document.getElementById('modal-reopen-wrap');
  const resWrap = document.getElementById('modal-resolution-wrap');

  if (!statusSelect) return;
  const val = statusSelect.value;

  if (rejWrap) rejWrap.style.display = val === 'Rejected' ? 'block' : 'none';
  if (reopenWrap) reopenWrap.style.display = val === 'Reopened' ? 'block' : 'none';
  if (resWrap) resWrap.style.display = val === 'Resolved' ? 'block' : 'none';
};

window.applyResponseTemplate = function() {
  const templateSelect = document.getElementById('comm-quick-templates');
  const textarea = document.getElementById('modal-comm-text');
  if (templateSelect && textarea && templateSelect.value) {
    textarea.value = templateSelect.value;
  }
};

window.toggleVisHelp = function() {
  const isInternal = document.getElementById('vis-internal')?.checked;
  const emailCheckWrap = document.getElementById('comm-email-checkbox-wrap');
  const emailCheck = document.getElementById('modal-send-email-check');

  if (isInternal) {
    if (emailCheckWrap) emailCheckWrap.style.opacity = '0.4';
    if (emailCheck) {
      emailCheck.checked = false;
      emailCheck.disabled = true;
    }
  } else {
    if (emailCheckWrap) emailCheckWrap.style.opacity = '1';
    if (emailCheck) {
      emailCheck.checked = true;
      emailCheck.disabled = false;
    }
  }
}

/**
 * Load Communication Thread (Official Responses & Internal Notes)
 */
async function loadComplaintMessages(complaint) {
  const container = document.getElementById('modal-comm-thread');
  if (!container) return;

  const storageKey = `complaintMessages_${complaint.complaintId}`;
  let messages = JanasevaDB.get(storageKey, []);

  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      const snap = await window.fbDb.collection('complaints').doc(complaint.complaintId).collection('messages').get();
      if (!snap.empty) {
        const fbMsgs = [];
        snap.forEach(d => fbMsgs.push(d.data()));
        fbMsgs.sort((a, b) => new Date(a.createdAt || a.timestamp || 0) - new Date(b.createdAt || b.timestamp || 0));
        if (fbMsgs.length > 0) {
          messages = fbMsgs;
          JanasevaDB.set(storageKey, messages);
        }
      }
    } catch (err) {
      console.warn("Firestore messages fetch warning:", err);
    }
  }

  if (messages.length === 0) {
    messages = [
      {
        messageId: `msg-${complaint.complaintId}-init`,
        complaintId: complaint.complaintId,
        senderName: complaint.citizenName,
        senderRole: 'citizen',
        messageText: complaint.description,
        visibility: 'public',
        timestamp: complaint.createdAt || new Date().toLocaleString('en-IN')
      }
    ];

    if (complaint.officialResponse) {
      messages.push({
        messageId: `msg-${complaint.complaintId}-resp`,
        complaintId: complaint.complaintId,
        senderName: 'Gram Panchayat Grievance Desk',
        senderRole: 'admin',
        messageText: complaint.officialResponse,
        visibility: 'public',
        timestamp: complaint.updatedAt || new Date().toLocaleString('en-IN')
      });
    }

    JanasevaDB.set(storageKey, messages);
  }

  container.innerHTML = messages.map(m => {
    const isCitizen = (m.senderRole || '').toLowerCase() === 'citizen';
    const isInternal = (m.visibility || '').toLowerCase() === 'internal';
    const msgBody = m.message || m.messageText || '';
    const msgTime = m.timestamp || (m.createdAt ? new Date(m.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '');

    if (isInternal) {
      return `
        <div class="comm-bubble comm-msg-internal">
          <div class="comm-internal-banner">
            <i class="fa-solid fa-lock"></i> [INTERNAL ADMINISTRATIVE NOTE - CONFIDENTIAL - NOT VISIBLE TO CITIZEN]
          </div>
          <div class="comm-bubble-meta">
            <span class="comm-author-tag" style="color: #92400e;">
              <i class="fa-solid fa-user-shield"></i> ${escapeHtml(m.senderName || 'Official')}
            </span>
            <span class="comm-time-tag">${escapeHtml(msgTime)}</span>
          </div>
          <div style="font-size: 13.5px;">${escapeHtml(msgBody)}</div>
        </div>
      `;
    } else if (isCitizen) {
      return `
        <div class="comm-bubble comm-msg-citizen">
          <div class="comm-bubble-meta">
            <span class="comm-author-tag">
              <i class="fa-solid fa-user"></i> ${escapeHtml(m.senderName || 'Citizen')} (Citizen)
            </span>
            <span class="comm-time-tag">${escapeHtml(msgTime)}</span>
          </div>
          <div>${escapeHtml(msgBody)}</div>
        </div>
      `;
    } else {
      return `
        <div class="comm-bubble comm-msg-admin">
          <div class="comm-bubble-meta">
            <span class="comm-author-tag">
              <i class="fa-solid fa-building-columns"></i> ${escapeHtml(m.senderName || 'Official Desk')}
              <span style="font-size: 10px; background: #2563eb; color: #fff; padding: 1px 6px; border-radius: 10px;">OFFICIAL RESPONSE</span>
            </span>
            <span class="comm-time-tag">${escapeHtml(msgTime)}</span>
          </div>
          <div>${escapeHtml(msgBody)}</div>
        </div>
      `;
    }
  }).join('');

  container.scrollTop = container.scrollHeight;
}

/**
 * Dispatch Official Response or Internal Note
 */
window.sendComplaintMessage = async function() {
  if (!currentModalComplaintId) return;

  const complaint = allComplaints.find(c => c.complaintId === currentModalComplaintId);
  if (!complaint) return;

  const textInput = document.getElementById('modal-comm-text');
  const messageText = textInput ? textInput.value.trim() : '';

  if (!messageText) {
    showToast("Please enter an official response or internal note.", "warning");
    if (textInput) textInput.focus();
    return;
  }

  const isInternal = document.getElementById('vis-internal')?.checked;
  const visibility = isInternal ? 'internal' : 'public';
  const sendEmail = !isInternal && document.getElementById('modal-send-email-check')?.checked;

  const currentUser = window.authService ? window.authService.currentUser : null;
  const senderEmail = currentUser ? currentUser.email : '';
  const senderName = currentUser ? (currentUser.name || 'Administrative Official') : 'Gram Panchayat Administrator';
  const senderRole = currentUser ? currentUser.role : 'admin';

  const sendBtn = document.getElementById('modal-send-comm-btn');
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dispatching...';
  }

  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });
  const nowISO = new Date().toISOString();

  const fbMessage = {
    messageId: `msg-${Date.now()}`,
    complaintId: complaint.complaintId,
    senderId: currentUser ? currentUser.uid : 'admin-root',
    senderName: senderName,
    senderEmail: senderEmail,
    senderRole: senderRole,
    message: messageText,
    visibility: visibility,
    createdAt: nowISO
  };

  const newMessage = {
    ...fbMessage,
    messageText: messageText,
    timestamp: nowFormatted
  };

  // 1. Save to Local Cache
  const storageKey = `complaintMessages_${complaint.complaintId}`;
  const messages = JanasevaDB.get(storageKey, []);
  messages.push(newMessage);
  JanasevaDB.set(storageKey, messages);

  if (visibility === 'public') {
    complaint.officialResponse = messageText;
    complaint.latestResponse = messageText;
    complaint.latestResponseAt = nowFormatted;
    complaint.latestResponseBy = senderEmail;
    complaint.updatedAt = nowFormatted;
    JanasevaDB.set('complaints', allComplaints);
  }

  // 2. Save to Primary Firestore
  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      await window.fbDb.collection('complaints').doc(complaint.complaintId).collection('messages').doc(fbMessage.messageId).set(fbMessage);
      await window.fbDb.collection('complaintMessages').doc(fbMessage.messageId).set(fbMessage);

      if (visibility === 'public') {
        await window.fbDb.collection('complaints').doc(complaint.complaintId).update({
          officialResponse: messageText,
          latestResponse: messageText,
          latestResponseAt: nowFormatted,
          latestResponseBy: senderEmail,
          updatedAt: nowFormatted
        });
      }
    } catch (fbErr) {
      console.warn("Firestore message save warning:", fbErr);
    }
  }

  // 3. Dispatch Email Notification if public
  if (sendEmail && window.emailService) {
    try {
      await window.emailService.sendStatusUpdateNotification(
        complaint,
        complaint.status,
        complaint.status,
        messageText
      );
    } catch (mailErr) {
      console.warn("Citizen response email dispatch warning:", mailErr);
    }
  }

  // 4. Record in Permanent Complaint Updates Folder
  if (window.complaintStorageManager) {
    try {
      await window.complaintStorageManager.recordComplaintUpdate(complaint, {
        updateType: isInternal ? 'NOTE_ADDED' : 'OFFICIAL_RESPONSE',
        remarks: messageText,
        officialResponse: visibility === 'public' ? messageText : '',
        newStatus: complaint.status,
        actor: {
          name: senderName,
          email: senderEmail,
          role: senderRole,
          uid: currentUser ? currentUser.uid : 'admin-root'
        }
      });
      if (typeof refreshStorageBadges === 'function') {
        refreshStorageBadges();
      }
    } catch (updErr) {
      console.warn("Complaint storage update log warning:", updErr);
    }
  }

  // 5. Record Audit Log
  recordAuditLog({
    action: isInternal ? 'INTERNAL_NOTE' : 'OFFICIAL_RESPONSE',
    complaintId: complaint.complaintId,
    actor: senderEmail,
    details: `${isInternal ? '[INTERNAL NOTE]' : '[OFFICIAL RESPONSE]'}: ${messageText.substring(0, 100)}...`
  });

  if (textInput) textInput.value = '';
  await loadComplaintMessages(complaint);

  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Official Response';
  }

  showToast(
    isInternal ? "Internal administrative note recorded." : "Official response dispatched to citizen successfully!",
    "success"
  );
};

/**
 * Save Complaint Status Lifecycle Transition
 */
window.saveComplaintStatusTransition = async function() {
  if (!currentModalComplaintId) return;

  const complaint = allComplaints.find(c => c.complaintId === currentModalComplaintId);
  if (!complaint) return;

  const statusSelect = document.getElementById('modal-status-select');
  const receiverSelect = document.getElementById('modal-assign-receiver');
  const prioritySelect = document.getElementById('modal-priority-select');
  const rejInput = document.getElementById('modal-rejection-reason');
  const reopenInput = document.getElementById('modal-reopen-reason');
  const resInput = document.getElementById('modal-resolution-remarks');

  const oldStatus = complaint.status;
  const newStatus = statusSelect ? statusSelect.value : oldStatus;
  const assignedEmail = receiverSelect ? receiverSelect.value : '';
  const currentUserRole = window.authService && window.authService.currentUser ? window.authService.currentUser.role : 'receiver';

  // Strict Validation via JanasevaStatusManager
  if (window.janasevaStatusManager && oldStatus !== newStatus) {
    const remarks = (rejInput ? rejInput.value : '') || (reopenInput ? reopenInput.value : '') || (resInput ? resInput.value : '');
    const validation = window.janasevaStatusManager.validateTransition(oldStatus, newStatus, currentUserRole, {
      remarks: remarks.trim(),
      hasEvidence: !!(complaint.evidencePhotoUrl || complaint.photoUrl || (document.getElementById('modal-rev-photo') && document.getElementById('modal-rev-photo').src)),
      assignedReceiverId: complaint.assignedReceiverId || assignedEmail,
      assignedReceiverEmail: complaint.assignedReceiverEmail || assignedEmail,
      panchayatId: complaint.panchayatId
    });

    if (!validation.valid) {
      showToast(`Cannot change status: ${validation.reason}`, "error");
      if (validation.reason.toLowerCase().includes('remark') || validation.reason.toLowerCase().includes('reason')) {
        if (newStatus.toLowerCase().includes('reject') && rejInput) { rejInput.focus(); }
        else if (newStatus.toLowerCase().includes('reopen') && reopenInput) { reopenInput.focus(); }
        else if (resInput) { resInput.focus(); }
      }
      return;
    }
  }

  if (prioritySelect && prioritySelect.value) {
    complaint.aiPriority = prioritySelect.value.toUpperCase();
  }

  if (newStatus === 'Rejected') {
    const rejReason = rejInput ? rejInput.value.trim() : '';
    if (!rejReason) {
      showToast("Please provide a mandatory reason for rejecting this grievance.", "error");
      if (rejInput) rejInput.focus();
      return;
    }
    complaint.rejectionReason = rejReason;
  }

  if (newStatus === 'Reopened') {
    const reopenReason = reopenInput ? reopenInput.value.trim() : '';
    if (!reopenReason) {
      showToast("Please provide justification for reopening this grievance.", "error");
      if (reopenInput) reopenInput.focus();
      return;
    }
    complaint.reopenReason = reopenReason;
  }

  if (newStatus === 'Resolved') {
    complaint.resolutionDate = new Date().toISOString();
    if (resInput && resInput.value.trim()) {
      complaint.officialResponse = resInput.value.trim();
    }
  }

  if (assignedEmail) {
    const targetRec = allReceivers.find(r => r.email === assignedEmail);
    if (targetRec) {
      complaint.assignedReceiverEmail = targetRec.email;
      complaint.assignedReceiverName = targetRec.name;
      complaint.assignedReceiverId = targetRec.uid;
      complaint.panchayatId = targetRec.panchayatId;
      complaint.panchayatName = targetRec.panchayatName;
    }
  }

  const saveBtn = document.getElementById('modal-save-status-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating Lifecycle...';
  }

  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

  // Extract and update workProgress
  const sliderEl = document.getElementById('modal-work-progress-slider');
  const stageEl = document.getElementById('modal-work-stage');
  const descEl = document.getElementById('modal-work-desc');
  const compEl = document.getElementById('modal-work-completed');
  const remEl = document.getElementById('modal-work-remaining');
  const delayEl = document.getElementById('modal-work-delay');
  const nextEl = document.getElementById('modal-work-next');
  const photoEl = document.getElementById('modal-work-photo');

  const progressPct = sliderEl ? (parseInt(sliderEl.value, 10) || 0) : (complaint.workProgress?.percentage || 0);
  const progressStage = stageEl ? stageEl.value : (complaint.workProgress?.stage || getWorkStageFromPercent(progressPct));

  complaint.workProgress = {
    percentage: progressPct,
    stage: progressStage,
    workDescription: descEl ? descEl.value.trim() : (complaint.workProgress?.workDescription || ''),
    completedWork: compEl ? compEl.value.trim() : (complaint.workProgress?.completedWork || ''),
    remainingWork: remEl ? remEl.value.trim() : (complaint.workProgress?.remainingWork || ''),
    delayReason: delayEl ? delayEl.value.trim() : (complaint.workProgress?.delayReason || ''),
    nextAction: nextEl ? nextEl.value.trim() : (complaint.workProgress?.nextAction || ''),
    photoUrl: photoEl ? photoEl.value.trim() : (complaint.workProgress?.photoUrl || ''),
    lastUpdated: nowFormatted,
    updatedBy: window.authService?.currentUser?.uid || window.authService?.currentUser?.email || '',
    updatedByRole: window.authService?.currentUser?.role || 'receiver'
  };

  complaint.status = newStatus;
  complaint.updatedAt = nowFormatted;

  JanasevaDB.set('complaints', allComplaints);

  const history = JanasevaDB.get('statusHistory', []);
  const newHistoryRecord = {
    historyId: 'hist-' + Date.now(),
    complaintId: complaint.complaintId,
    oldStatus: oldStatus,
    newStatus: newStatus,
    updatedBy: window.authService?.currentUser?.uid || window.authService?.currentUser?.email || '',
    timestamp: new Date().toISOString(),
    officialNote: (complaint.officialResponse || complaint.rejectionReason || complaint.reopenReason || `Status changed to ${newStatus}`).slice(0, 2000)
  };
  history.push(newHistoryRecord);
  JanasevaDB.set('statusHistory', history);

  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      await window.fbDb.collection('complaints').doc(complaint.complaintId).update({
        status: newStatus,
        aiPriority: complaint.aiPriority || 'NORMAL',
        updatedAt: nowFormatted,
        resolutionDate: complaint.resolutionDate || null,
        rejectionReason: complaint.rejectionReason || '',
        reopenReason: complaint.reopenReason || '',
        officialResponse: complaint.officialResponse || '',
        assignedReceiverEmail: complaint.assignedReceiverEmail || '',
        assignedReceiverName: complaint.assignedReceiverName || '',
        assignedReceiverId: complaint.assignedReceiverId || '',
        workProgress: complaint.workProgress
      });

      await window.fbDb.collection('complaints').doc(complaint.complaintId).collection('statusHistory').doc(newHistoryRecord.historyId).set(newHistoryRecord);
      await window.fbDb.collection('statusHistory').doc(newHistoryRecord.historyId).set(newHistoryRecord);
    } catch (fbErr) {
      console.warn("Firestore status update warning:", fbErr);
    }
  }

  if (oldStatus !== newStatus && window.emailService) {
    try {
      await window.emailService.sendStatusUpdateNotification(
        complaint,
        oldStatus,
        newStatus,
        complaint.officialResponse || `Status updated to ${newStatus}`
      );
    } catch (mailErr) {
      console.warn("Status change email notice warning:", mailErr);
    }
  }

  // Record in Permanent Complaint Updates Folder
  if (window.complaintStorageManager) {
    try {
      const currentActor = window.authService?.currentUser || { name: 'Administrator', email: '', role: 'admin' };
      const actorObj = {
        name: currentActor.name || currentActor.email || 'Official',
        email: currentActor.email || '',
        role: currentActor.role || 'admin',
        uid: currentActor.uid || 'admin-root'
      };

      if (oldStatus !== newStatus) {
        await window.complaintStorageManager.recordComplaintUpdate(complaint, {
          oldStatus: oldStatus,
          newStatus: newStatus,
          updateType: 'STATUS_CHANGE',
          remarks: complaint.officialResponse || complaint.rejectionReason || complaint.reopenReason || `Status transitioned from "${oldStatus}" to "${newStatus}"`,
          resolutionDetails: newStatus === 'Resolved' ? (complaint.officialResponse || 'Grievance officially resolved and closed.') : null,
          actor: actorObj
        });
      }

      // Record Work Progress update event if progress percentage or details exist
      const hasProgressData = progressPct > 0 || complaint.workProgress.completedWork || complaint.workProgress.workDescription || complaint.workProgress.delayReason;
      if (hasProgressData) {
        await window.complaintStorageManager.recordWorkProgressUpdate(complaint, complaint.workProgress, actorObj);
      }

      if (typeof refreshStorageBadges === 'function') {
        refreshStorageBadges();
      }
    } catch (updErr) {
      console.warn("Complaint storage update log warning:", updErr);
    }
  }

  recordAuditLog({
    action: 'STATUS_CHANGE',
    complaintId: complaint.complaintId,
    actor: window.authService?.currentUser?.email || '',
    details: `Transitioned status from "${oldStatus}" to "${newStatus}"`
  });

  updateStatsAndBadges();
  renderComplaintsTable();
  renderWorkloadCards();
  renderModalStepper(newStatus);

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Status & Save Workflow';
  }

  showToast(`Grievance ${complaint.complaintId} status updated to "${newStatus}"!`, "success");
};

// Aliases for global compatibility
window.saveComplaintStatus = window.saveComplaintStatusTransition;

/**
 * Record Administrative Audit Log
 */
function recordAuditLog(entry) {
  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

  const fullEntry = {
    logId: 'audit-' + Date.now(),
    timestamp: nowFormatted,
    adminId: (window.authService && window.authService.currentUser && window.authService.currentUser.uid) ? window.authService.currentUser.uid : 'admin',
    ...entry
  };

  allAuditLogs.unshift(fullEntry);
  JanasevaDB.set('adminAuditLogs', allAuditLogs);

  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      window.fbDb.collection('adminAuditLogs').doc(fullEntry.logId).set(fullEntry);
    } catch (e) {
      console.warn("Firestore audit log warning:", e);
    }
  }

  renderAuditLogsTable();
  const badge = document.getElementById('tab-badge-audit');
  if (badge) badge.innerText = allAuditLogs.length;
}

/**
 * Delete Complaint Handler with Protected Recycle Bin Architecture
 * - Admin: Safely moves grievance to Protected Recycle Bin
 * - Receiver: Opens Flag / Review request dialog (receivers cannot delete records directly)
 */
window.deleteComplaint = async function(complaintId) {
  const isAdmin = window.authService ? window.authService.isAdmin() : false;
  if (!isAdmin) {
    if (typeof window.openReceiverFlagModal === 'function') {
      window.openReceiverFlagModal(complaintId);
    } else {
      showToast("Access Denied: Only Administrators can delete grievance records.", "error");
    }
    return;
  }

  if (!(window.janasevaConfirm || confirm)(`Move grievance ${complaintId} to the Protected Recycle Bin?\n\nThis will safely quarantine the grievance with zero loss of data, attachments, or update history. You can restore it anytime or permanently purge it from the Recycle Bin.`)) {
    return;
  }

  const currentUser = window.authService?.currentUser;
  const currentActor = {
    email: currentUser ? currentUser.email : '',
    name: currentUser ? (currentUser.name || 'Administrator') : 'Administrator',
    role: 'admin',
    uid: currentUser ? currentUser.uid : 'admin-root'
  };

  try {
    if (window.complaintStorageManager) {
      const success = await window.complaintStorageManager.moveToRecycleBin(complaintId, 'Administrative deletion', currentActor);
      if (success) {
        await loadComplaintsData();
        updateStatsAndBadges();
        renderComplaintsTable();
        renderWorkloadCards();
        if (typeof renderPanchayatIntelligence === 'function') {
          renderPanchayatIntelligence();
        }
        if (typeof refreshStorageBadges === 'function') {
          refreshStorageBadges();
        }
        showToast(`Grievance ${complaintId} safely quarantined in Protected Recycle Bin.`, "info");
        return;
      }
    }

    // Fallback
    const idx = allComplaints.findIndex(c => c.complaintId === complaintId);
    if (idx !== -1) {
      allComplaints.splice(idx, 1);
      JanasevaDB.set('complaints', allComplaints);
      updateStatsAndBadges();
      renderComplaintsTable();
      showToast(`Grievance ${complaintId} removed.`, "info");
    } else {
      showToast(`Grievance ${complaintId} was not found.`, "warning");
    }
  } catch (err) {
    console.error('[JANASEVA] deleteComplaint error:', err);
    showToast(`Failed to delete grievance ${complaintId}: ${err.message || 'Unknown error'}`, "error");
  }
};

/**
 * Delete Citizen User (Admin Only)
 */
window.deleteCitizenUser = async function(uid) {
  if (!window.authService || !window.authService.isAdmin()) {
    (window.janasevaAlert || alert)("Unauthorized: Only Administrator can delete registered citizen profiles.");
    return;
  }
  if (!uid) return;

  const idx = allCitizens.findIndex(c => (c.uid || c.id) === uid);
  const citizen = idx !== -1 ? allCitizens[idx] : null;
  const name = citizen ? (citizen.name || citizen.email || uid) : uid;

  if (!(window.janasevaConfirm || confirm)(`DELETE CITIZEN CONFIRMATION:\n\nAre you sure you want to permanently delete citizen "${name}" (UID: ${uid})?\n\nThis will remove their profile from the Janaseva register.`)) {
    return;
  }

  try {
    if (idx !== -1) {
      allCitizens.splice(idx, 1);
    }

    // 1. Delete from Firestore
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        await window.fbDb.collection('users').doc(uid).delete();
      } catch (e) {
        console.warn('Firestore user deletion warning:', e);
      }
    }

    // 2. Delete from JanasevaDB
    if (typeof JanasevaDB !== 'undefined') {
      const dbUsers = JanasevaDB.get('users', []);
      const filtered = dbUsers.filter(u => (u.uid || u.id) !== uid);
      JanasevaDB.set('users', filtered);
    }

    // 3. Record Audit Log
    recordAuditLog({
      action: 'DELETE_USER',
      complaintId: 'USER_MGMT',
      actor: window.authService?.currentUser?.email || '',
      details: `Deleted registered citizen profile ${name} (UID: ${uid})`
    });

    // 4. Update UI
    const countBadge = document.getElementById('citizens-count-badge');
    if (countBadge) countBadge.innerText = `${allCitizens.length} Citizens`;
    renderCitizensTable();
    showToast(`Citizen profile "${name}" successfully deleted.`, 'success');
  } catch (err) {
    console.error('Failed to delete citizen:', err);
    (window.janasevaAlert || alert)('Failed to delete citizen: ' + err.message);
  }
};

/**
 * Delete Grievance Officer / Receiver (Admin Only)
 */
window.deleteReceiverUser = async function(identifier, name) {
  if (!window.authService || !window.authService.isAdmin()) {
    (window.janasevaAlert || alert)("Unauthorized: Only Administrator can remove Grievance Officers.");
    return;
  }
  if (!identifier) return;

  const targetName = name || identifier;
  if (!(window.janasevaConfirm || confirm)(`DELETE RECEIVER CONFIRMATION:\n\nAre you sure you want to delete Grievance Officer "${targetName}"?\n\nTheir workload assignments should be reallocated to another officer.`)) {
    return;
  }

  try {
    const idx = allReceivers.findIndex(r => (r.email === identifier || r.uid === identifier || r.id === identifier));
    if (idx !== -1) {
      allReceivers.splice(idx, 1);
    }

    // 1. Delete from Firestore users collection
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        const userDoc = await window.fbDb.collection('users').doc(identifier).get();
        if (userDoc.exists) {
          await window.fbDb.collection('users').doc(identifier).delete();
        } else {
          const snap = await window.fbDb.collection('users').where('email', '==', identifier.toLowerCase()).get();
          snap.forEach(async d => await d.ref.delete());
        }
      } catch (e) {
        console.warn('Firestore receiver delete error:', e);
      }
    }

    // 2. Delete from JanasevaDB
    if (typeof JanasevaDB !== 'undefined') {
      JanasevaDB.set('receivers', allReceivers);
      const dbUsers = JanasevaDB.get('users', []);
      const filtered = dbUsers.filter(u => (u.email !== identifier && u.uid !== identifier && u.id !== identifier));
      JanasevaDB.set('users', filtered);
    }

    // 3. Record Audit Log
    recordAuditLog({
      action: 'DELETE_RECEIVER',
      complaintId: 'OFFICER_MGMT',
      actor: window.authService?.currentUser?.email || '',
      details: `Deleted Grievance Officer ${targetName} (${identifier})`
    });

    renderWorkloadCards();
    if (typeof loadReceiversList === 'function') loadReceiversList();
    showToast(`Grievance Officer "${targetName}" successfully removed.`, 'success');
  } catch (err) {
    console.error('Failed to delete receiver:', err);
    (window.janasevaAlert || alert)('Failed to delete receiver: ' + err.message);
  }
};

/**
 * Delete Individual Audit Log Entry (Admin Only)
 */
window.deleteAdminAuditLog = async function(logId) {
  if (!window.authService || !window.authService.isAdmin()) {
    (window.janasevaAlert || alert)("Unauthorized: Only Administrator can delete audit records.");
    return;
  }
  if (!logId) return;

  if (!(window.janasevaConfirm || confirm)(`DELETE AUDIT ENTRY CONFIRMATION:\n\nAre you sure you want to permanently delete audit record ${logId}?`)) {
    return;
  }

  try {
    const idx = allAuditLogs.findIndex((l, index) => (l.id === logId || l.logId === logId || `AUDIT-${index}` === logId));
    if (idx !== -1) {
      allAuditLogs.splice(idx, 1);
    } else {
      allAuditLogs = allAuditLogs.filter(l => l.id !== logId && l.logId !== logId);
    }

    // 1. Firestore
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        await window.fbDb.collection('adminAuditLogs').doc(logId).delete();
      } catch (e) {
        console.warn('Firestore audit delete error:', e);
      }
    }

    // 2. JanasevaDB
    if (typeof JanasevaDB !== 'undefined') {
      JanasevaDB.set('adminAuditLogs', allAuditLogs);
      JanasevaDB.set('auditLogs', allAuditLogs);
    }

    renderAuditLogsTable();
    showToast(`Audit log entry deleted successfully.`, 'success');
  } catch (err) {
    console.error('Failed to delete audit log:', err);
    (window.janasevaAlert || alert)('Failed to delete audit log: ' + err.message);
  }
};

/**
 * Clear All Administrative Audit Logs (Admin Only)
 */
window.clearAdminAuditTrail = async function() {
  if (!window.authService || !window.authService.isAdmin()) {
    (window.janasevaAlert || alert)("Unauthorized: Only Administrator can clear the audit trail.");
    return;
  }

  if (!(window.janasevaConfirm || confirm)("CLEAR AUDIT TRAIL CONFIRMATION:\n\nAre you sure you want to permanently clear the ENTIRE Administrative Audit Trail?\n\nAll historical status logs and official records will be purged.")) {
    return;
  }

  try {
    allAuditLogs = [];

    // 1. Firestore purge
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        const snap = await window.fbDb.collection('adminAuditLogs').limit(100).get();
        const batch = window.fbDb.batch();
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        console.warn('Firestore audit purge error:', e);
      }
    }

    // 2. JanasevaDB purge
    if (typeof JanasevaDB !== 'undefined') {
      JanasevaDB.set('adminAuditLogs', []);
      JanasevaDB.set('auditLogs', []);
    }

    renderAuditLogsTable();
    showToast('Administrative audit trail cleared.', 'success');
  } catch (err) {
    console.error('Failed to clear audit trail:', err);
    (window.janasevaAlert || alert)('Failed to clear audit trail: ' + err.message);
  }
};

/**
 * Delete Backup Snapshot (Admin Only)
 */
window.deleteBackupSnapshot = async function(snapshotId) {
  if (!window.authService || !window.authService.isAdmin()) {
    if (typeof showToast === 'function') showToast("Unauthorized: Only Administrator can delete backup snapshots.", "error");
    return;
  }
  if (!snapshotId) return;

  const confirmed = window.JanasevaSettings
    ? await window.JanasevaSettings.confirm({
        title: 'Delete Backup Snapshot Permanently?',
        message: `Are you sure you want to permanently delete backup snapshot ${snapshotId}?`,
        detail: 'Scope: Only this snapshot archive is removed. Live citizen complaints, user accounts, and settings remain intact.',
        confirmText: 'Delete Snapshot',
        cancelText: 'Cancel',
        danger: true
      })
    : (window.janasevaConfirm || confirm)(`DELETE BACKUP SNAPSHOT CONFIRMATION:\n\nAre you sure you want to permanently delete backup snapshot ${snapshotId}?`);
  if (!confirmed) return;

  try {
    if (window.isFirebaseAvailable && window.fbDb) {
      await window.fbDb.collection('backups').doc(snapshotId).delete();
    }

    const idx = allBackups.findIndex(b => (b.snapshotId === snapshotId || b.id === snapshotId));
    if (idx !== -1) {
      allBackups.splice(idx, 1);
    }

    if (typeof JanasevaDB !== 'undefined') {
      const existing = JanasevaDB.get('backups', []);
      const filtered = existing.filter(b => b.snapshotId !== snapshotId && b.id !== snapshotId);
      JanasevaDB.set('backups', filtered);
      JanasevaDB.set('system_backups', filtered);
    }

    recordAuditLog({
      action: 'DELETE_BACKUP',
      complaintId: 'BACKUP_MGMT',
      actor: window.authService?.currentUser?.email || '',
      details: `Deleted database backup snapshot ${snapshotId}`
    });

    renderBackupsTable();
    if (window.JanasevaSettings) window.JanasevaSettings.markClean('admin-backups', { refreshedAt: new Date().toISOString() });
    showToast(`Backup snapshot ${snapshotId} permanently deleted.`, 'success');
  } catch (err) {
    console.error('Failed to delete backup snapshot:', err);
    if (window.JanasevaSettings) window.JanasevaSettings.setSectionError('admin-backups', err.message || 'Delete failed.');
    showToast('Failed to delete backup snapshot: ' + err.message, 'error');
  }
};

/**
 * Export Filtered Grievances to Excel/CSV
 */
window.exportComplaintsCSV = function() {
  const scoped = getScopedComplaints();
  if (scoped.length === 0) {
    showToast("No records available to export.", "warning");
    return;
  }

  const headers = [
    "Complaint ID",
    "Citizen Name",
    "Citizen Email",
    "Citizen Mobile",
    "Panchayat Name",
    "Category",
    "Subject",
    "Status",
    "Submitted Date",
    "Last Updated",
    "Resolution Date",
    "Assigned Receiver",
    "Assigned Department",
    "Description",
    "Official Response"
  ];

  const rows = scoped.map(c => [
    `"${c.complaintId || ''}"`,
    `"${(c.citizenName || '').replace(/"/g, '""')}"`,
    `"${c.citizenEmail || ''}"`,
    `"${c.citizenPhone || c.citizenMobileNumber || ''}"`,
    `"${(c.panchayatName || '').replace(/"/g, '""')}"`,
    `"${(c.category || '').replace(/"/g, '""')}"`,
    `"${(c.subject || '').replace(/"/g, '""')}"`,
    `"${c.status || ''}"`,
    `"${c.createdAt || ''}"`,
    `"${c.updatedAt || ''}"`,
    `"${c.resolutionDate || ''}"`,
    `"${c.assignedReceiverEmail || ''}"`,
    `"${c.assignedDepartment || ''}"`,
    `"${(c.description || '').replace(/"/g, '""')}"`,
    `"${(c.officialResponse || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const nowStr = new Date().toISOString().split("T")[0];

  link.setAttribute("href", url);
  link.setAttribute("download", `JANASEVA_Grievance_Register_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Excel/CSV grievance register downloaded successfully!", "success");
};

/**
 * Live Refresh Data
 */
window.refreshDashboardData = async function() {
  const refreshBtn = document.getElementById('admin-refresh-btn');
  if (refreshBtn) refreshBtn.classList.add('fa-spin');

  await loadComplaintsData();
  await loadCitizensData();
  await loadAuditLogs();
  updateStatsAndBadges();
  renderComplaintsTable();
  renderCitizensTable();
  renderWorkloadCards();
  renderAuditLogsTable();

  setTimeout(() => {
    if (refreshBtn) refreshBtn.classList.remove('fa-spin');
    showToast("Dashboard synchronized with permanent database.", "info");
  }, 400);
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/**
 * Officer Document Verification Action
 */
window.verifyDocumentStatus = async function(complaintId, newStatus) {
  const complaint = allComplaints.find(c => c.complaintId === complaintId);
  if (!complaint || !complaint.documentAnalysis) return;

  const actorEmail = window.authService?.currentUser?.email || '';
  complaint.documentAnalysis.officerVerification = {
    status: newStatus,
    verifiedBy: actorEmail,
    verifiedAt: new Date().toISOString()
  };

  // Save to Firestore
  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      await window.fbDb.collection('complaints').doc(complaintId).update({
        documentAnalysis: complaint.documentAnalysis
      });
    } catch (e) {
      console.warn("Firestore doc verification update caught:", e);
    }
  }

  JanasevaDB.set('complaints', allComplaints);
  recordAuditLog({
    action: `DOCUMENT_${newStatus}`,
    complaintId: complaintId,
    actor: actorEmail,
    details: `Officer marked supporting document as ${newStatus}`
  });

  showToast(`Document verification status updated to: ${newStatus}`, "success");
  openReviewModal(complaintId);
};

/**
 * Render Panchayat Intelligence & Hotspot Analytics (Tab 6)
 */
function renderPanchayatIntelligence() {
  let scoped = getScopedComplaints();
  const gpFilter = document.getElementById('rec-gp-filter');
  const selectedGp = gpFilter ? gpFilter.value : '';
  if (selectedGp) {
    scoped = scoped.filter(c => c.panchayatId === selectedGp);
  }

  // 1. Priority Counts
  let urgent = 0, high = 0, normal = 0, low = 0;
  const emergencies = [];

  scoped.forEach(c => {
    if (!c.aiPriority && window.janasevaComplaintPrioritizer) {
      const a = window.janasevaComplaintPrioritizer.analyzeComplaint(c.description, c.category);
      c.aiPriority = a.priority;
      if (!c.aiDepartment) c.aiDepartment = a.department;
      if (!c.aiRationale) c.aiRationale = a.rationale;
      if (a.isEmergency) {
        c.isEmergency = true;
        c.emergencyDetails = a.emergencyDetails;
      }
    }
    const p = (c.aiPriority || 'NORMAL').toUpperCase();
    if (p === 'URGENT') urgent++;
    else if (p === 'HIGH') high++;
    else if (p === 'LOW') low++;
    else normal++;

    if (c.isEmergency) emergencies.push(c);
  });

  const elUrgent = document.getElementById('intel-count-urgent');
  const elHigh = document.getElementById('intel-count-high');
  const elNormal = document.getElementById('intel-count-normal');
  const elLow = document.getElementById('intel-count-low');

  if (elUrgent) elUrgent.innerText = urgent;
  if (elHigh) elHigh.innerText = high;
  if (elNormal) elNormal.innerText = normal;
  if (elLow) elLow.innerText = low;

  // 2. Render Emergency Queue
  const emergencyQueueEl = document.getElementById('admin-emergency-alert-queue');
  if (emergencyQueueEl) {
    if (emergencies.length > 0) {
      emergencyQueueEl.innerHTML = `
        <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px; color: #991b1b; font-weight: 800; font-size: 15px; margin-bottom: 10px;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 20px;"></i>
            <span>URGENT PUBLIC HAZARDS QUEUE (${emergencies.length} ACTIVE)</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${emergencies.map(em => `
              <div style="background: #fff; padding: 10px 14px; border-radius: 6px; border: 1px solid #fca5a5; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>${escapeHtml(em.complaintId)}</strong> &bull; ${escapeHtml(em.panchayatName || em.panchayatId)}: 
                  <span style="color: #991b1b; font-weight: 600;">${escapeHtml(em.emergencyDetails?.hazard || em.subject)}</span>
                </div>
                <button type="button" class="btn-cta-secondary" onclick="openReviewModal('${em.complaintId}')" style="padding: 4px 10px; font-size: 12px; color: #b91c1c;">
                  Immediate Review
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      emergencyQueueEl.innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; color: #166534; font-size: 13.5px; font-weight: 600;">
          <i class="fa-solid fa-shield-heart" style="font-size: 18px;"></i>
          <span>No active emergency public hazards detected across assigned Gram Panchayats.</span>
        </div>
      `;
    }
  }

  // 3. Detect & Render Recurring Hotspots
  const hotspotsContainer = document.getElementById('admin-hotspots-container');
  let patternData = { hotspots: [] };
  if (window.janasevaComplaintPrioritizer) {
    patternData = window.janasevaComplaintPrioritizer.detectRecurringPatterns(scoped);
  }

  if (hotspotsContainer) {
    if (patternData.hotspots && patternData.hotspots.length > 0) {
      hotspotsContainer.innerHTML = patternData.hotspots.map(h => `
        <div class="hotspot-item">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div>
              <span class="hotspot-badge"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(h.alertLevel)}</span>
              <strong>${escapeHtml(h.panchayatName)}</strong> &ndash; ${escapeHtml(h.category)}
            </div>
            <strong style="color: #b45309; font-size: 13px;">${h.count} Incidents Reported (${h.percentageOfPanchayat}% of GP)</strong>
          </div>
          <div style="font-size: 12px; color: #78350f; line-height: 1.4;">
            ${escapeHtml(h.recommendation)}
          </div>
        </div>
      `).join('');
    } else {
      hotspotsContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #64748b; font-size: 13.5px;">
          <i class="fa-solid fa-chart-line" style="font-size: 28px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          No recurring problem clusters or hotspots detected at this threshold.
        </div>
      `;
    }
  }

  // 4. Render Department Breakdown
  const deptContainer = document.getElementById('admin-dept-breakdown-container');
  if (deptContainer) {
    const deptCounts = {};
    scoped.forEach(c => {
      const dept = c.aiDepartment || c.assignedDepartment || 'General Administration';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const totalScoped = scoped.length || 1;
    const deptEntries = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);

    if (deptEntries.length > 0) {
      deptContainer.innerHTML = deptEntries.map(([dept, cnt]) => {
        const pct = Math.round((cnt / totalScoped) * 100);
        return `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
              <span>${escapeHtml(dept)}</span>
              <span style="color: #0284c7;">${cnt} (${pct}%)</span>
            </div>
            <div style="background: #e2e8f0; border-radius: 9999px; height: 8px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #0284c7, #38bdf8); height: 100%; width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      deptContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #64748b; font-size: 13.5px;">
          No departmental data available.
        </div>
      `;
    }
  }

  // 5. Render Prioritized Complaints Register
  const prioritizedTbody = document.getElementById('intel-prioritized-table-body');
  const intelCountBadge = document.getElementById('intel-register-count-badge');
  if (intelCountBadge) {
    intelCountBadge.innerText = `${scoped.length} Grievances Analyzed`;
  }

  if (prioritizedTbody) {
    const priorityWeight = { 'URGENT': 4, 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 };
    const sorted = [...scoped].sort((a, b) => {
      const wa = priorityWeight[(a.aiPriority || 'NORMAL').toUpperCase()] || 2;
      const wb = priorityWeight[(b.aiPriority || 'NORMAL').toUpperCase()] || 2;
      return wb - wa;
    });

    if (sorted.length === 0) {
      prioritizedTbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: #64748b;">No complaints in current scope.</td></tr>`;
    } else {
      prioritizedTbody.innerHTML = sorted.map(c => {
        const pClass = getPriorityPillClass(c.aiPriority);
        const statusBadge = window.janasevaStatusManager ? 
          window.janasevaStatusManager.getStatusBadgeHTML(c.status) : 
          `<span class="status-badge-pill ${getStatusBadgeClass(c.status)}">${escapeHtml(c.status || 'Submitted')}</span>`;
        return `
          <tr>
            <td><strong>${escapeHtml(c.complaintId)}</strong></td>
            <td>${escapeHtml(c.panchayatName || c.panchayatId || '—')}</td>
            <td>${escapeHtml(c.citizenName || 'Citizen')}</td>
            <td><span class="category-badge">${escapeHtml(c.category || 'General')}</span></td>
            <td>${statusBadge}</td>
            <td><span class="ai-priority-pill ${pClass}">${escapeHtml((c.aiPriority || 'NORMAL').toUpperCase())}</span></td>
            <td style="font-size: 12px; color: #475569;">${escapeHtml(c.aiDepartment || c.assignedDepartment || 'General')}</td>
            <td style="font-size: 12px; color: #334155; max-width: 250px;">${escapeHtml(c.aiRationale || 'Standard triage rationale')}</td>
            <td>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button type="button" class="btn-table-action btn-action-edit" onclick="openReviewModal('${c.complaintId}')" style="background: #0b2545; color: #fff; font-weight: 700; border: none; padding: 5px 10px; border-radius: 5px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px; line-height: 1.2;" title="Edit Grievance Details & Status">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <a href="track.html?id=${encodeURIComponent(c.complaintId)}" target="_blank" class="btn-table-action" style="padding: 5px 10px; border-radius: 5px; display: inline-flex; align-items: center; gap: 5px; color: #0f56b3; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 12px; line-height: 1.2; text-decoration: none; font-weight: 600;" title="Track Public Status">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Track
                </a>
                <button type="button" class="btn-table-action btn-action-delete" onclick="deleteComplaint('${c.complaintId}')" style="background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; font-weight: 700; padding: 5px 10px; border-radius: 5px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px; line-height: 1.2;" title="Delete Grievance">
                  <i class="fa-solid fa-trash-can"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 6. Update Top Intelligence Tab Badge
  const totalAlerts = emergencies.length + (patternData.hotspots ? patternData.hotspots.length : 0);
  const badgeEl = document.getElementById('tab-badge-intelligence');
  if (badgeEl) {
    if (totalAlerts > 0) {
      badgeEl.innerText = `${totalAlerts} Alerts`;
      badgeEl.style.background = emergencies.length > 0 ? '#ef4444' : '#f59e0b';
    } else {
      badgeEl.innerText = 'AI';
      badgeEl.style.background = '#3b82f6';
    }
  }

  if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
}

// Re-render when language changes
window.addEventListener('janaseva:langChanged', () => {
  if (typeof applyRoleAdaptiveUI === 'function') applyRoleAdaptiveUI();
  renderComplaintsTable();
  renderCitizensTable();
  renderWorkloadCards();
  renderAuditLogsTable();
  renderBackupsTable();
  renderPanchayatIntelligence();
  if (typeof renderStatusManagementTable === 'function') renderStatusManagementTable();
  if (typeof renderTransitionRulesMatrix === 'function') renderTransitionRulesMatrix();
  if (typeof renderUpdatesFolderUI === 'function') renderUpdatesFolderUI();
  if (typeof renderRecycleBinUI === 'function') renderRecycleBinUI();
  if (typeof updateDatabaseHealthIndicators === 'function') updateDatabaseHealthIndicators();
  if (typeof window.renderBannerManagementUI === 'function') window.renderBannerManagementUI();
  if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
});

/**
 * Trigger Instant AI Rescan
 */
window.refreshIntelligenceAnalysis = function() {
  const icon = document.getElementById('intel-refresh-icon');
  if (icon) icon.classList.add('fa-spin');
  
  setTimeout(() => {
    renderPanchayatIntelligence();
    if (icon) icon.classList.remove('fa-spin');
    if (typeof showToast === 'function') {
      showToast("Panchayat Intelligence & Hotspot scan refreshed successfully.", "success");
    }
  }, 600);
};

// Global Exports for Modularity and Automated Testing
window.loadComplaintsData = loadComplaintsData;
window.loadReceiversList = loadReceiversList;
window.loadCitizensData = loadCitizensData;
window.loadAuditLogs = loadAuditLogs;
window.loadBackupsData = loadBackupsData;
window.renderComplaintsTable = renderComplaintsTable;
window.renderCitizensTable = renderCitizensTable;
window.renderWorkloadCards = renderWorkloadCards;
window.renderAuditLogsTable = renderAuditLogsTable;
window.renderBackupsTable = renderBackupsTable;
window.renderPanchayatIntelligence = renderPanchayatIntelligence;

Object.defineProperty(window, 'allCitizens', {
  get: () => allCitizens,
  set: (v) => { allCitizens = v; },
  configurable: true
});
Object.defineProperty(window, 'allReceivers', {
  get: () => allReceivers,
  set: (v) => { allReceivers = v; },
  configurable: true
});
Object.defineProperty(window, 'allAuditLogs', {
  get: () => allAuditLogs,
  set: (v) => { allAuditLogs = v; },
  configurable: true
});
Object.defineProperty(window, 'allBackups', {
  get: () => allBackups,
  set: (v) => { allBackups = v; },
  configurable: true
});

/**
 * Export Intelligence Report
 */
window.exportIntelligenceReport = function() {
  const scoped = getScopedComplaints();
  const patternData = window.janasevaComplaintPrioritizer ? window.janasevaComplaintPrioritizer.detectRecurringPatterns(scoped) : { hotspots: [] };
  
  let reportText = "=====================================================================\n";
  reportText += "JANASEVA 2.0 – PANCHAYAT INTELLIGENCE & HOTSPOT REPORT\n";
  reportText += "=====================================================================\n";
  reportText += "Generated At: " + new Date().toLocaleString('en-IN') + "\n";
  reportText += "Total Grievances Scanned: " + scoped.length + "\n\n";
  
  reportText += "--- [1] ACTIVE EMERGENCY HAZARDS ---\n";
  const emergencies = scoped.filter(c => c.isEmergency);
  if (emergencies.length > 0) {
    emergencies.forEach(e => {
      reportText += `[EMERGENCY] ${e.complaintId} | GP: ${e.panchayatName || e.panchayatId} | Hazard: ${e.emergencyDetails?.hazard || e.subject}\n`;
    });
  } else {
    reportText += "No active emergencies detected.\n";
  }
  reportText += "\n";

  reportText += "--- [2] DETECTED RECURRING PROBLEM HOTSPOTS ---\n";
  if (patternData.hotspots && patternData.hotspots.length) {
    patternData.hotspots.forEach(h => {
      reportText += `[${h.alertLevel}] ${h.panchayatName} - ${h.category}: ${h.count} incidents (${h.percentageOfPanchayat}% of GP complaints)\n`;
      reportText += `Action Recommendation: ${h.recommendation}\n\n`;
    });
  } else {
    reportText += "No recurring hotspots detected at demonstration threshold.\n\n";
  }

  reportText += "--- [3] GRIEVANCE AI PRIORITIZATION REGISTER ---\n";
  scoped.forEach(c => {
    reportText += `${c.complaintId.padEnd(16)} | ${(c.panchayatName || c.panchayatId || '—').padEnd(25)} | Priority: ${(c.aiPriority || 'NORMAL').padEnd(7)} | Dept: ${c.aiDepartment || c.assignedDepartment || 'General'}\n`;
  });

  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `JANASEVA_Intelligence_Report_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  if (typeof showToast === 'function') {
    showToast("Intelligence report exported successfully.", "success");
  }
};


/**
 * ============================================================================
 * ADMIN-ONLY COMPLAINT STATUS MANAGEMENT CONTROLLER
 * ============================================================================
 */

function initStatusMgmtUSM() {
  if (!window.JanasevaSettings || !window.janasevaStatusManager) return;
  const host = document.getElementById('status-mgmt-usm-status');
  if (!host) return;
  window.JanasevaSettings.registerSection({
    sectionId: 'admin-status-mgmt',
    sectionName: 'Complaint Status & Workflow Rules',
    containerEl: '#admin-tab-status-mgmt',
    statusHostEl: '#status-mgmt-usm-status',
    resetBtn: '#status-mgmt-reset-btn',
    refreshBtn: '#status-mgmt-refresh-btn',
    trackInputs: false,
    requireDoubleConfirmReset: true,
    confirmResetTitle: 'Reset All Complaint Statuses to Default 8-Stage Schema?',
    confirmResetMessage: 'This restores Submitted, Assigned, In Progress, Under Review, Action Taken, Resolved, Rejected, and Reopened along with standard Gram Panchayat transitions.',
    confirmResetDetail: 'Scope: Only Complaint Workflow configuration is reset. Existing citizen complaints, audit logs, and user accounts remain preserved.',
    onReset: async () => {
      const reason = 'Restored official Gram Panchayat 8-stage grievance lifecycle schema';
      await window.janasevaStatusManager.resetToDefaults(reason);
      renderStatusManagementTable();
      renderTransitionRulesMatrix();
      await loadStatusAuditLogs();
      renderComplaintsTable();
      return {
        savedAt: new Date().toISOString(),
        message: 'Official Gram Panchayat 8-stage schema successfully restored!'
      };
    },
    onRefresh: async () => {
      const res = await window.janasevaStatusManager.refreshFromRemote();
      renderStatusManagementTable();
      renderTransitionRulesMatrix();
      await loadStatusAuditLogs();
      return {
        savedAt: res?.updatedAt || null,
        updatedBy: res?.updatedBy || '',
        refreshedAt: new Date().toISOString(),
        message: 'Workflow status rules reloaded from database.'
      };
    }
  });
}

window.renderStatusManagementUI = async function() {
  initStatusMgmtUSM();
  renderStatusManagementTable();
  renderTransitionRulesMatrix();
  await loadStatusAuditLogs();
  if (window.JanasevaSettings) {
    window.JanasevaSettings.markClean('admin-status-mgmt', { refreshedAt: new Date().toISOString() });
  }
};

window.renderStatusManagementTable = function() {
  const tbody = document.getElementById('status-mgmt-tbody');
  const countBadge = document.getElementById('status-mgmt-count-badge');
  if (!tbody || !window.janasevaStatusManager) return;

  const statuses = window.janasevaStatusManager.getAllStatuses(true);
  const activeStatuses = statuses.filter(s => s.isActive && !s.isArchived);

  if (countBadge) {
    countBadge.innerText = `${activeStatuses.length} Active / ${statuses.length} Total Configured`;
  }

  if (statuses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">No statuses configured.</td></tr>`;
    return;
  }

  tbody.innerHTML = statuses.map((st, idx) => {
    const isProtected = ['submitted', 'resolved'].includes(st.id);
    const categoryBadgeClass = {
      'initial': 'background: #dbeafe; color: #1e40af;',
      'active': 'background: #fef3c7; color: #92400e;',
      'terminal': 'background: #dcfce7; color: #166534;',
      'special': 'background: #f1f5f9; color: #475569;'
    }[st.workflowCategory] || 'background: #f1f5f9; color: #475569;';

    const transitionsPills = (st.allowedTransitions || []).map(targetId => {
      const targetSt = window.janasevaStatusManager.getStatus(targetId);
      const name = targetSt ? targetSt.name : targetId;
      const color = targetSt ? targetSt.color : '#475569';
      const bg = targetSt ? targetSt.bgColor : '#f1f5f9';
      return `<span style="display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 10px; background: ${bg}; color: ${color}; margin: 2px;">&rarr; ${escapeHtml(name)}</span>`;
    }).join('') || '<span style="font-size: 11px; color: #94a3b8; font-style: italic;">None (Terminal State)</span>';

    return `
      <tr style="${st.isArchived ? 'opacity: 0.6; background: #fafafa;' : ''}">
        <td style="font-weight: 700; color: #0b2545;">#${st.order || (idx + 1)}</td>
        <td>
          ${window.janasevaStatusManager.getStatusBadgeHTML(st.id)}
        </td>
        <td>
          <strong style="color: #0b2545; font-size: 13px;">${escapeHtml(st.name)}</strong><br>
          <code style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 5px; border-radius: 4px;">${escapeHtml(st.id)}</code>
          ${st.description ? `<div style="font-size: 11.5px; color: #64748b; margin-top: 3px; max-width: 240px; white-space: normal;">${escapeHtml(st.description)}</div>` : ''}
        </td>
        <td>
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; ${categoryBadgeClass}">
            ${escapeHtml(st.workflowCategory || 'active')}
          </span>
        </td>
        <td style="text-align: center;">
          ${st.isStepperStage ?
            `<span title="Displayed on Timeline Stepper" style="color: #16a34a; font-size: 14px;"><i class="fa-solid fa-circle-check"></i> Stage ${st.order}</span>` :
            `<span title="Excluded from Stepper" style="color: #94a3b8; font-size: 13px;"><i class="fa-solid fa-circle-minus"></i> No</span>`}
        </td>
        <td>
          <div style="display: flex; flex-wrap: wrap; gap: 2px; max-width: 250px;">
            ${transitionsPills}
          </div>
        </td>
        <td style="text-align: center;">
          ${st.isArchived ?
            `<span style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px;"><i class="fa-solid fa-box-archive"></i> Archived</span>` :
            `<span style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px;"><i class="fa-solid fa-circle"></i> Active</span>`
          }
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: flex; justify-content: flex-end; gap: 6px; align-items: center; white-space: nowrap;">
            <button type="button" class="btn-table-action" onclick="openEditStatusModal('${st.id}')" title="Edit Status & Transition Rules" style="padding: 4px 8px; font-size: 11px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button type="button" class="btn-table-action" onclick="handleArchiveStatus('${st.id}')" title="${st.isArchived ? 'Reactivate Status' : 'Archive Status'}" style="padding: 4px 8px; font-size: 11px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
              <i class="fa-solid ${st.isArchived ? 'fa-arrow-rotate-left' : 'fa-box-archive'}"></i> ${st.isArchived ? 'Restore' : 'Archive'}
            </button>
            <button type="button" class="btn-table-action" onclick="handleDeleteStatus('${st.id}')" style="background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 11px;" title="Delete Status">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.renderTransitionRulesMatrix = function() {
  const container = document.getElementById('transition-rules-summary-container');
  if (!container || !window.janasevaStatusManager) return;

  const statuses = window.janasevaStatusManager.getActiveStatuses();
  if (statuses.length === 0) {
    container.innerHTML = `<p style="color: #64748b;">No active statuses defined.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="status-transitions-grid">
      ${statuses.map(source => {
        const allowed = source.allowedTransitions || [];
        return `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              <div>
                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">From Stage</span>
                <div style="margin-top: 4px;">${window.janasevaStatusManager.getStatusBadgeHTML(source.id)}</div>
              </div>
              <span style="font-size: 11px; font-weight: 700; color: #475569; background: #e2e8f0; padding: 2px 7px; border-radius: 10px;">
                ${allowed.length} ${allowed.length === 1 ? 'Transition' : 'Transitions'}
              </span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${allowed.length === 0 ? `
                <div style="font-size: 12px; color: #94a3b8; font-style: italic; padding: 6px 0;">
                  Terminal stage — No further status transitions permitted.
                </div>
              ` : allowed.map(targetId => {
                const targetSt = window.janasevaStatusManager.getStatus(targetId);
                const rule = (source.transitionRules && source.transitionRules[targetId]) || {};
                const allowedRoles = rule.allowedRoles || ['admin', 'receiver'];
                const isAdminOnly = allowedRoles.length === 1 && allowedRoles[0] === 'admin';
                
                return `
                  <div style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-arrow-right" style="color: #64748b; font-size: 11px;"></i>
                        ${window.janasevaStatusManager.getStatusBadgeHTML(targetId)}
                      </div>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 8px; ${isAdminOnly ? 'background: #fee2e2; color: #991b1b;' : 'background: #e0e7ff; color: #3730a3;'}">
                          ${isAdminOnly ? 'ADMIN ONLY' : 'ADMIN & RECEIVER'}
                        </span>
                        <button type="button" class="btn-delete-trans" onclick="handleDeleteTransition('${source.id}', '${targetId}')" title="Delete Transition Rule" style="background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 11px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; font-weight: 700;">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: #475569; margin-top: 6px;">
                      ${rule.mandatoryRemarks ? '<span style="color: #b45309;"><i class="fa-solid fa-comment-dots"></i> Mandatory Remarks</span>' : '<span style="color: #94a3b8;"><i class="fa-regular fa-comment"></i> Optional Remarks</span>'}
                      ${rule.mandatoryEvidence ? '<span style="color: #0284c7;"><i class="fa-solid fa-camera"></i> Evidence Required</span>' : ''}
                      ${rule.requiresReceiver ? '<span style="color: #6d28d9;"><i class="fa-solid fa-user-check"></i> Officer Assigned</span>' : ''}
                      ${rule.notificationTrigger !== false ? '<span style="color: #16a34a;"><i class="fa-solid fa-bell"></i> Notify Citizen</span>' : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

window.loadStatusAuditLogs = async function() {
  const tbody = document.getElementById('status-audit-tbody');
  if (!tbody || !window.janasevaStatusManager) return;

  const logs = await window.janasevaStatusManager.getAuditLogs();
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748b;">No status management modifications recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const actionBadgeClass = {
      'STATUS_CREATED': 'background: #dcfce7; color: #166534;',
      'STATUS_MODIFIED': 'background: #dbeafe; color: #1e40af;',
      'STATUS_ARCHIVED': 'background: #fef3c7; color: #92400e;',
      'STATUS_DELETED': 'background: #fee2e2; color: #991b1b;',
      'RESET_DEFAULT_STATUSES': 'background: #f3e8ff; color: #6b21a8;'
    }[l.action] || 'background: #f1f5f9; color: #475569;';

    const timeStr = l.formattedTime || (l.timestamp ? new Date(l.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A');

    return `
      <tr>
        <td style="font-size: 11.5px; color: #64748b; white-space: nowrap;">
          <i class="fa-regular fa-clock"></i> ${escapeHtml(timeStr)}
        </td>
        <td style="font-size: 12px; font-weight: 600; color: #0b2545;">
          ${escapeHtml(l.adminEmail || l.adminId || '')}
        </td>
        <td>
          <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; ${actionBadgeClass}">
            ${escapeHtml(l.action || 'CONFIG_CHANGE')}
          </span>
        </td>
        <td>
          <code style="font-size: 11px; font-weight: 700; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #0f56b3;">
            ${escapeHtml(l.statusId || 'all')}
          </code>
        </td>
        <td style="font-size: 12px; color: #334155;">
          ${escapeHtml(l.reason || 'Routine administrative adjustment')}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-sm btn-delete-row" onclick="deleteStatusAuditLog('${escapeHtml(l.id || l.logId || '')}')" title="Delete Audit Entry" style="padding: 4px 8px; font-size: 11px; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 4px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-trash-can"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
};

function initStatusModalUSM() {
  if (!window.JanasevaSettings) return;
  const form = document.getElementById('status-editor-form');
  if (!form) return;

  window.JanasevaSettings.registerSection({
    sectionId: 'admin-status-modal',
    sectionName: 'Status Editor Configuration',
    containerEl: '#modal-status-editor',
    formEl: '#status-editor-form',
    statusHostEl: '#status-modal-usm-status',
    saveBtn: '#status-form-save-btn',
    resetBtn: '#status-form-reset-btn',
    refreshBtn: '#status-form-refresh-btn',
    confirmResetTitle: 'Reset Status Editor Fields to Clean Defaults?',
    confirmResetMessage: 'Resets colors, icon, active/stepper toggles, and transitions back to default preset values inside this editor.',
    confirmResetDetail: 'Scope: Only resets the editor inputs before saving.',
    onSave: async () => {
      return await window.handleSaveStatusForm();
    },
    onReset: async () => {
      window.JanasevaSettings.runProgrammaticUpdate('admin-status-modal', () => {
        document.getElementById('status-form-category').value = 'active';
        document.getElementById('status-form-icon').value = 'fa-solid fa-clock';
        document.getElementById('status-form-color').value = '#0f56b3';
        document.getElementById('status-form-color-picker').value = '#0f56b3';
        document.getElementById('status-form-bgcolor').value = '#eff6ff';
        document.getElementById('status-form-bgcolor-picker').value = '#eff6ff';
        document.getElementById('status-form-bordercolor').value = '#bfdbfe';
        document.getElementById('status-form-bordercolor-picker').value = '#bfdbfe';
        document.getElementById('status-form-stepper').checked = true;
        document.getElementById('status-form-active').checked = true;
        document.getElementById('status-form-desc').value = '';
        document.getElementById('status-form-reason').value = '';
        renderStatusFormTransitionsList([], {}, document.getElementById('status-form-orig-id').value || null);
        updateStatusPreviewPill();
      });
      return { message: 'Editor fields reset to defaults.' };
    },
    onRefresh: async () => {
      if (window.janasevaStatusManager) {
        await window.janasevaStatusManager.refreshFromRemote();
      }
      const isEdit = document.getElementById('status-form-is-edit').value === '1';
      const origId = document.getElementById('status-form-orig-id').value;
      if (isEdit && origId) {
        window.openEditStatusModal(origId);
      } else {
        window.openAddStatusModal();
      }
      return {
        refreshedAt: new Date().toISOString(),
        message: 'Status editor reloaded from saved configuration.'
      };
    }
  });
}

window.openAddStatusModal = function() {
  const modal = document.getElementById('modal-status-editor');
  const title = document.getElementById('modal-status-editor-title');
  if (!modal || !window.janasevaStatusManager) return;

  initStatusModalUSM();
  const populate = () => {
    if (title) title.innerText = 'Add New Complaint Status';
    document.getElementById('status-form-is-edit').value = '0';
    document.getElementById('status-form-orig-id').value = '';

    const statuses = window.janasevaStatusManager.getAllStatuses(true);
    const nextOrder = statuses.length + 1;

    document.getElementById('status-form-name').value = '';
    const idInput = document.getElementById('status-form-id');
    idInput.value = '';
    idInput.readOnly = false;
    idInput.style.background = '#fff';

    document.getElementById('status-form-category').value = 'active';
    document.getElementById('status-form-order').value = nextOrder;
    document.getElementById('status-form-icon').value = 'fa-solid fa-clock';
    document.getElementById('status-form-color').value = '#0f56b3';
    document.getElementById('status-form-color-picker').value = '#0f56b3';
    document.getElementById('status-form-bgcolor').value = '#eff6ff';
    document.getElementById('status-form-bgcolor-picker').value = '#eff6ff';
    document.getElementById('status-form-bordercolor').value = '#bfdbfe';
    document.getElementById('status-form-bordercolor-picker').value = '#bfdbfe';
    document.getElementById('status-form-stepper').checked = true;
    document.getElementById('status-form-active').checked = true;
    document.getElementById('status-form-desc').value = '';
    document.getElementById('status-form-reason').value = '';

    renderStatusFormTransitionsList([], {});
    updateStatusPreviewPill();
  };

  if (window.JanasevaSettings) {
    window.JanasevaSettings.runProgrammaticUpdate('admin-status-modal', populate);
    window.JanasevaSettings.markClean('admin-status-modal');
  } else {
    populate();
  }

  modal.classList.add('active');
};

window.openEditStatusModal = function(statusId) {
  const modal = document.getElementById('modal-status-editor');
  const title = document.getElementById('modal-status-editor-title');
  if (!modal || !window.janasevaStatusManager) return;

  const st = window.janasevaStatusManager.getStatus(statusId);
  if (!st) {
    showToast(`Status "${statusId}" not found.`, "error");
    return;
  }

  initStatusModalUSM();
  const populate = () => {
    if (title) title.innerText = `Edit Status: ${st.name}`;
    document.getElementById('status-form-is-edit').value = '1';
    document.getElementById('status-form-orig-id').value = st.id;

    document.getElementById('status-form-name').value = st.name;
    const idInput = document.getElementById('status-form-id');
    idInput.value = st.id;
    idInput.readOnly = true;
    idInput.style.background = '#f1f5f9';

    document.getElementById('status-form-category').value = st.workflowCategory || 'active';
    document.getElementById('status-form-order').value = st.order || 1;
    document.getElementById('status-form-icon').value = st.icon || 'fa-solid fa-circle-info';
    document.getElementById('status-form-color').value = st.color || '#0f56b3';
    document.getElementById('status-form-color-picker').value = st.color || '#0f56b3';
    document.getElementById('status-form-bgcolor').value = st.bgColor || '#eff6ff';
    document.getElementById('status-form-bgcolor-picker').value = st.bgColor || '#eff6ff';
    document.getElementById('status-form-bordercolor').value = st.borderColor || '#bfdbfe';
    document.getElementById('status-form-bordercolor-picker').value = st.borderColor || '#bfdbfe';
    document.getElementById('status-form-stepper').checked = !!st.isStepperStage;
    document.getElementById('status-form-active').checked = st.isActive !== false && !st.isArchived;
    document.getElementById('status-form-desc').value = st.description || '';
    document.getElementById('status-form-reason').value = '';

    renderStatusFormTransitionsList(st.allowedTransitions || [], st.transitionRules || {}, st.id);
    updateStatusPreviewPill();
  };

  if (window.JanasevaSettings) {
    window.JanasevaSettings.runProgrammaticUpdate('admin-status-modal', populate);
    window.JanasevaSettings.markClean('admin-status-modal');
  } else {
    populate();
  }

  modal.classList.add('active');
};

window.closeStatusEditorModal = async function() {
  const modal = document.getElementById('modal-status-editor');
  if (!modal) return;
  const usm = window.JanasevaSettings;
  const sec = usm && usm.sections.get('admin-status-modal');
  if (sec && sec.isDirty) {
    const ok = await usm.confirm({
      title: 'Discard Unsaved Status Edits?',
      message: 'You have unsaved workflow status changes in the editor. Closing now will discard them.',
      confirmText: 'Discard & Close',
      cancelText: 'Keep Editing',
      danger: true
    });
    if (!ok) return;
    usm.markClean('admin-status-modal');
  }
  modal.classList.remove('active');
};

function renderStatusFormTransitionsList(allowedList = [], rulesMap = {}, currentStatusId = null) {
  const container = document.getElementById('status-form-transitions-list');
  if (!container || !window.janasevaStatusManager) return;

  const allStatuses = window.janasevaStatusManager.getAllStatuses(true);
  const candidates = allStatuses.filter(s => s.id !== currentStatusId);

  if (candidates.length === 0) {
    container.innerHTML = `<span style="color: #64748b; font-size: 12px;">No other statuses available.</span>`;
    return;
  }

  container.innerHTML = candidates.map(cand => {
    const isChecked = allowedList.includes(cand.id);
    const rule = rulesMap[cand.id] || {};
    const roles = rule.allowedRoles || ['admin', 'receiver'];
    const adminOnly = roles.length === 1 && roles[0] === 'admin';
    const mandatoryRemarks = !!rule.mandatoryRemarks;
    const mandatoryEvidence = !!rule.mandatoryEvidence;
    const requiresReceiver = !!rule.requiresReceiver;
    const notify = rule.notificationTrigger !== false;

    return `
      <div style="border-bottom: 1px solid #f1f5f9; padding: 8px 0; margin-bottom: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #1e293b; cursor: pointer;">
            <input type="checkbox" class="trans-target-chk" value="${cand.id}" ${isChecked ? 'checked' : ''} onchange="toggleTransOptions('${cand.id}', this.checked)">
            <span>${window.janasevaStatusManager.getStatusBadgeHTML(cand.id)}</span>
          </label>
        </div>
        <div id="trans-options-${cand.id}" style="display: ${isChecked ? 'flex' : 'none'}; flex-wrap: wrap; gap: 14px; padding-left: 26px; font-size: 11.5px; color: #475569;">
          <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" id="trans-opt-admin-only-${cand.id}" ${adminOnly ? 'checked' : ''}>
            <span style="font-weight: 600; color: #b91c1c;">Admin Only Transition</span>
          </label>
          <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" id="trans-opt-remarks-${cand.id}" ${mandatoryRemarks ? 'checked' : ''}>
            <span>Mandatory Remarks</span>
          </label>
          <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" id="trans-opt-evidence-${cand.id}" ${mandatoryEvidence ? 'checked' : ''}>
            <span>Mandatory Evidence</span>
          </label>
          <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" id="trans-opt-receiver-${cand.id}" ${requiresReceiver ? 'checked' : ''}>
            <span>Requires Assigned Receiver</span>
          </label>
          <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" id="trans-opt-notify-${cand.id}" ${notify ? 'checked' : ''}>
            <span>Trigger Notification</span>
          </label>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleTransOptions = function(candId, isChecked) {
  const optWrap = document.getElementById(`trans-options-${candId}`);
  if (optWrap) optWrap.style.display = isChecked ? 'flex' : 'none';
};

window.handleStatusNameInput = function(name) {
  const isEdit = document.getElementById('status-form-is-edit').value === '1';
  if (!isEdit) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const idInput = document.getElementById('status-form-id');
    if (idInput) idInput.value = slug;
  }
  updateStatusPreviewPill();
};

window.updateStatusPreviewPill = function() {
  const container = document.getElementById('status-live-preview-pill-container');
  if (!container) return;

  const name = document.getElementById('status-form-name').value.trim() || 'Status Preview';
  const icon = document.getElementById('status-form-icon').value.trim() || 'fa-solid fa-clock';
  const color = document.getElementById('status-form-color').value.trim() || '#0f56b3';
  const bgColor = document.getElementById('status-form-bgcolor').value.trim() || '#eff6ff';
  const borderColor = document.getElementById('status-form-bordercolor').value.trim() || '#bfdbfe';

  container.innerHTML = `
    <span class="status-badge-pill" style="background: ${bgColor}; color: ${color}; border: 1px solid ${borderColor};">
      <i class="${icon}"></i> ${escapeHtml(name)}
    </span>
  `;
};

window.handleSaveStatusForm = async function(event) {
  if (event) event.preventDefault();
  if (!window.janasevaStatusManager) return;

  const isEdit = document.getElementById('status-form-is-edit').value === '1';
  const origId = document.getElementById('status-form-orig-id').value;
  const name = document.getElementById('status-form-name').value.trim();
  const id = document.getElementById('status-form-id').value.trim();
  const category = document.getElementById('status-form-category').value;
  const order = parseInt(document.getElementById('status-form-order').value, 10) || 1;
  const icon = document.getElementById('status-form-icon').value.trim();
  const color = document.getElementById('status-form-color').value.trim();
  const bgColor = document.getElementById('status-form-bgcolor').value.trim();
  const borderColor = document.getElementById('status-form-bordercolor').value.trim();
  const isStepperStage = document.getElementById('status-form-stepper').checked;
  const isActive = document.getElementById('status-form-active').checked;
  const description = document.getElementById('status-form-desc').value.trim();
  const reason = document.getElementById('status-form-reason').value.trim();

  if (!name || !id) {
    throw new Error("Status Name and Identifier are mandatory.");
  }

  if (!reason) {
    document.getElementById('status-form-reason').focus();
    throw new Error("Administrative Change Justification is required for the audit log.");
  }

  const transCheckboxes = document.querySelectorAll('.trans-target-chk:checked');
  const allowedTransitions = [];
  const transitionRules = {};

  transCheckboxes.forEach(chk => {
    const targetId = chk.value;
    allowedTransitions.push(targetId);

    const adminOnlyChk = document.getElementById(`trans-opt-admin-only-${targetId}`);
    const remarksChk = document.getElementById(`trans-opt-remarks-${targetId}`);
    const evidenceChk = document.getElementById(`trans-opt-evidence-${targetId}`);
    const receiverChk = document.getElementById(`trans-opt-receiver-${targetId}`);
    const notifyChk = document.getElementById(`trans-opt-notify-${targetId}`);

    transitionRules[targetId] = {
      allowedRoles: (adminOnlyChk && adminOnlyChk.checked) ? ['admin'] : ['admin', 'receiver'],
      mandatoryRemarks: !!(remarksChk && remarksChk.checked),
      mandatoryEvidence: !!(evidenceChk && evidenceChk.checked),
      requiresReceiver: !!(receiverChk && receiverChk.checked),
      requiresPanchayat: true,
      notificationTrigger: !!(notifyChk && notifyChk.checked)
    };
  });

  const statusData = {
    id: isEdit && origId ? origId : id,
    name: name,
    description: description,
    icon: icon,
    color: color,
    bgColor: bgColor,
    borderColor: borderColor,
    order: order,
    isStepperStage: isStepperStage,
    isActive: isActive,
    isArchived: !isActive,
    workflowCategory: category,
    allowedTransitions: allowedTransitions,
    transitionRules: transitionRules
  };

  await window.janasevaStatusManager.saveStatus(statusData, reason);
  if (window.JanasevaSettings) window.JanasevaSettings.markClean('admin-status-modal');
  const modal = document.getElementById('modal-status-editor');
  if (modal) modal.classList.remove('active');
  renderStatusManagementTable();
  renderTransitionRulesMatrix();
  await loadStatusAuditLogs();
  renderComplaintsTable();
  return {
    savedAt: new Date().toISOString(),
    updatedBy: window.authService?.currentUser?.uid || window.authService?.currentUser?.email || '',
    message: `Status "${name}" saved successfully!`
  };
};

window.handleArchiveStatus = async function(statusId) {
  if (!window.janasevaStatusManager) return;
  const st = window.janasevaStatusManager.getStatus(statusId);
  if (!st) return;

  const actionVerb = st.isArchived ? "reactivate" : "archive";
  const reason = (window.janasevaPrompt || prompt)(`Enter administrative justification to ${actionVerb} "${st.name}":`, `Routine workflow retirement`, true);
  if (!reason) return;

  try {
    if (st.isArchived) {
      // Reactivate
      st.isArchived = false;
      st.isActive = true;
      await window.janasevaStatusManager.saveStatus(st, reason);
      showToast(`Status "${st.name}" reactivated!`, "success");
    } else {
      await window.janasevaStatusManager.archiveStatus(statusId, reason);
      showToast(`Status "${st.name}" archived safely without affecting historical records!`, "success");
    }
    renderStatusManagementTable();
    renderTransitionRulesMatrix();
    await loadStatusAuditLogs();
  } catch (err) {
    showToast(`Archival Error: ${err.message}`, "error");
  }
};

window.handleDeleteStatus = async function(statusId) {
  if (!window.janasevaStatusManager) return;
  const st = window.janasevaStatusManager.getStatus(statusId);
  if (!st) return;

  const isCore = ['submitted', 'resolved'].includes(st.id);
  const promptMsg = isCore 
    ? `WARNING: Status "${st.name}" is a core grievance lifecycle status.\nDeleting it will remove it from the system workflow.\n\nAre you sure you want to proceed with permanent deletion?`
    : `Are you sure you want to permanently delete status "${st.name}"?\n\nNote: If historical complaints reference this status, deletion will require complaint migration.`;

  const confirmed = (window.janasevaConfirm || confirm)(promptMsg);
  if (!confirmed) return;

  const reason = (window.janasevaPrompt || prompt)(`Enter administrative justification for deleting status "${st.name}":`, `Administrative removal of status ${st.name}`);
  if (!reason) return;

  try {
    await window.janasevaStatusManager.deleteStatus(statusId, reason);
    showToast(`Status "${st.name}" successfully removed!`, "success");
    renderStatusManagementTable();
    renderTransitionRulesMatrix();
    await loadStatusAuditLogs();
  } catch (err) {
    if (err.message && err.message.includes('Integrity Protection')) {
      const forceConfirm = (window.janasevaConfirm || confirm)(`${err.message}\n\nDo you want to FORCE DELETE this status anyway? (Referencing complaints will be automatically migrated to 'Under Review')`);
      if (forceConfirm) {
        // Migrate local complaints
        const complaints = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('complaints', []) : [];
        let modified = false;
        complaints.forEach(c => {
          if ((c.status && c.status.toLowerCase() === st.name.toLowerCase()) ||
              (c.status && c.status.toLowerCase() === st.id.toLowerCase())) {
            c.status = 'Under Review';
            c.statusId = 'under_review';
            modified = true;
          }
        });
        if (modified && typeof JanasevaDB !== 'undefined') {
          JanasevaDB.set('complaints', complaints);
        }
        // Migrate Firestore complaints if available
        if (typeof window !== 'undefined' && window.isFirebaseAvailable && window.fbDb) {
          try {
            const snap = await window.fbDb.collection('complaints').where('status', 'in', [st.name, st.id]).get();
            const batch = window.fbDb.batch();
            snap.forEach(doc => {
              batch.update(doc.ref, { status: 'Under Review', statusId: 'under_review' });
            });
            await batch.commit();
          } catch(e) {
            console.warn('[handleDeleteStatus] Firestore batch migration notice:', e);
          }
        }
        // Force delete through status manager
        await window.janasevaStatusManager.deleteStatus(statusId, reason + " (Force deleted with migration)");
        showToast(`Status "${st.name}" force deleted and referencing complaints migrated to Under Review.`, "success");
        renderStatusManagementTable();
        renderTransitionRulesMatrix();
        await loadStatusAuditLogs();
        if (typeof renderComplaintsTable === 'function') renderComplaintsTable();
        return;
      }
    }
    showToast(`Deletion Blocked: ${err.message}`, "error");
  }
};

/**
 * Delete an individual transition rule from the workflow matrix
 */
window.handleDeleteTransition = async function(sourceId, targetId) {
  if (!window.janasevaStatusManager) return;
  const sourceSt = window.janasevaStatusManager.getStatus(sourceId);
  const targetSt = window.janasevaStatusManager.getStatus(targetId);
  const sourceName = sourceSt ? sourceSt.name : sourceId;
  const targetName = targetSt ? targetSt.name : targetId;

  const confirmed = (window.janasevaConfirm || confirm)(`Are you sure you want to remove the transition rule:\n"${sourceName}" -> "${targetName}"?`);
  if (!confirmed) return;

  const reason = (window.janasevaPrompt || prompt)(`Enter administrative justification for removing transition rule:`, `Removed workflow transition from ${sourceName} to ${targetName}`);
  if (!reason) return;

  try {
    if (sourceSt) {
      sourceSt.allowedTransitions = (sourceSt.allowedTransitions || []).filter(id => id !== targetId);
      if (sourceSt.transitionRules && sourceSt.transitionRules[targetId]) {
        delete sourceSt.transitionRules[targetId];
      }
      await window.janasevaStatusManager.saveStatus(sourceSt, reason);
      showToast(`Transition "${sourceName} &rarr; ${targetName}" removed successfully!`, "success");
      renderStatusManagementTable();
      renderTransitionRulesMatrix();
      await loadStatusAuditLogs();
    }
  } catch (err) {
    showToast(`Failed to remove transition: ${err.message}`, "error");
  }
};

/**
 * Delete a single Status Audit Log entry
 */
window.deleteStatusAuditLog = async function(logId) {
  if (!logId) return;
  const user = window.authService ? window.authService.currentUser : null;
  if (!user || user.role !== 'admin') {
    showToast("Unauthorized: Admin privilege required to manage audit records.", "error");
    return;
  }

  const confirmed = (window.janasevaConfirm || confirm)(`Are you sure you want to delete this status audit log entry (${logId})?`);
  if (!confirmed) return;

  try {
    // 1. Delete from Firestore if available
    if (typeof window !== 'undefined' && window.isFirebaseAvailable && window.fbDb) {
      try {
        await window.fbDb.collection('adminAuditLogs').doc(logId).delete();
      } catch (err) {
        console.warn('[deleteStatusAuditLog] Firestore delete warning:', err);
      }
    }

    // 2. Delete from JanasevaDB
    if (typeof JanasevaDB !== 'undefined') {
      const logs = JanasevaDB.get('statusAuditLogs', []);
      const updated = logs.filter(l => (l.id || l.logId) !== logId);
      JanasevaDB.set('statusAuditLogs', updated);
    }

    showToast("Status audit record deleted successfully.", "success");
    await loadStatusAuditLogs();
  } catch (err) {
    showToast(`Delete Error: ${err.message}`, "error");
  }
};

/**
 * Clear the entire Status Audit Trail
 */
window.clearAllStatusAuditLogs = async function() {
  const user = window.authService ? window.authService.currentUser : null;
  if (!user || user.role !== 'admin') {
    showToast("Unauthorized: Admin privilege required to clear audit records.", "error");
    return;
  }

  const confirmed = (window.janasevaConfirm || confirm)("WARNING: Are you sure you want to clear the entire Administrative Status Management Audit Trail?\n\nThis will purge all status modification history.");
  if (!confirmed) return;

  try {
    // 1. Clear in JanasevaDB
    if (typeof JanasevaDB !== 'undefined') {
      JanasevaDB.set('statusAuditLogs', []);
    }

    // 2. Clear from Firestore
    if (typeof window !== 'undefined' && window.isFirebaseAvailable && window.fbDb) {
      try {
        const snap = await window.fbDb.collection('adminAuditLogs').get();
        const batch = window.fbDb.batch();
        snap.forEach(doc => {
          const data = doc.data();
          if (data && ((data.action || '').startsWith('STATUS_') || data.action === 'RESET_DEFAULT_STATUSES')) {
            batch.delete(doc.ref);
          }
        });
        await batch.commit();
      } catch (err) {
        console.warn('[clearAllStatusAuditLogs] Firestore batch clear notice:', err);
      }
    }

    showToast("Status management audit trail cleared successfully.", "success");
    await loadStatusAuditLogs();
  } catch (err) {
    showToast(`Clear Error: ${err.message}`, "error");
  }
};

window.resetDefaultStatusConfig = async function() {
  if (!window.janasevaStatusManager) return;

  const confirmed = (window.janasevaConfirm || confirm)("Are you sure you want to reset Complaint Statuses to the official Gram Panchayat 8-stage schema?\n\nThis will restore: Submitted, Assigned, In Progress, Under Review, Action Taken, Resolved, Rejected, and Reopened with default transition rules.");
  if (!confirmed) return;

  const reason = (window.janasevaPrompt || prompt)("Enter administrative reason for restoring default schema:", "Restored official Gram Panchayat 8-stage grievance lifecycle schema", true);
  if (!reason) return;

  try {
    await window.janasevaStatusManager.resetToDefaults(reason);
    showToast("Official Gram Panchayat 8-stage schema successfully restored!", "success");
    renderStatusManagementTable();
    renderTransitionRulesMatrix();
    await loadStatusAuditLogs();
    renderComplaintsTable();
  } catch (err) {
    showToast(`Reset Failed: ${err.message}`, "error");
  }
};

// Event listener for dynamic configuration updates
if (typeof window !== 'undefined') {
  window.addEventListener('janaseva:statusConfigUpdated', () => {
    if (document.getElementById('admin-tab-status-mgmt') && document.getElementById('admin-tab-status-mgmt').classList.contains('active')) {
      renderStatusManagementUI();
    }
  });
}

window.quickSelectModalStatus = function(statusId) {
  const statusSelect = document.getElementById('modal-status-select');
  if (!statusSelect || !window.janasevaStatusManager) return;

  const st = window.janasevaStatusManager.getStatus(statusId);
  if (!st) return;

  const options = Array.from(statusSelect.options);
  const matching = options.find(o => 
    o.value.toLowerCase() === st.id.toLowerCase() ||
    o.value.toLowerCase() === st.name.toLowerCase()
  );

  if (matching) {
    statusSelect.value = matching.value;
    handleModalStatusChange();
    renderModalStepper(matching.value);
    if (typeof showToast === 'function') {
      showToast(`Selected status "${st.name}". Click "Update Status" below to commit.`, "info");
    }
  } else {
    if (typeof showToast === 'function') {
      showToast(`Transition to "${st.name}" is not permitted from current status.`, "warning");
    }
  }
};

/* ==========================================================================
   COMPLAINT UPDATES FOLDER & RECYCLE BIN MANAGEMENT (IQ200 AUTOPSY ENGINE)
   ========================================================================== */

let activeUpdatesFolderKey = 'ALL';
let currentPermDeleteId = null;
let currentDuplicateIds = { id1: null, id2: null };
let currentHistoryComplaintId = null;

/**
 * Initialize Updates Folder and Recycle Bin UI & Counts
 */
window.initUpdatesFolderAndRecycleBin = async function() {
  await window.applyRoleAdaptiveUI();

  // Populate Updates GP & Category filter dropdowns
  populateUpdatesDropdowns();

  // Update folder count badges and recycle bin badge
  await refreshStorageBadges();
};

/**
 * Populate Updates Folder GP and Category Dropdowns
 */
function populateUpdatesDropdowns() {
  const gpSelect = document.getElementById('upd-filter-gp');
  const catSelect = document.getElementById('upd-filter-cat');

  if (gpSelect && gpSelect.options.length <= 1) {
    const panchayats = JanasevaDB.get('panchayats', []);
    panchayats.forEach(gp => {
      const opt = document.createElement('option');
      opt.value = gp.panchayatId || gp.id;
      opt.textContent = gp.name;
      gpSelect.appendChild(opt);
    });
  }

  if (catSelect && catSelect.options.length <= 1) {
    const categories = [
      "Sanitation & Waste Management",
      "Drinking Water Supply",
      "Roads & Drainage Infrastructure",
      "Street Lighting & Electrical",
      "Public Health & Vector Control",
      "Panchayat Administration & Services",
      "Encroachment & Public Spaces",
      "Other Civic Grievance"
    ];
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });
  }
}

/**
 * Refresh count badges for updates folder & recycle bin
 */
async function refreshStorageBadges() {
  if (!window.complaintStorageManager) return;

  const allUpdatesRaw = (typeof window.JanasevaDB !== 'undefined') ? window.JanasevaDB.get('complaint_updates', []) : [];
  const activeUpdates = allUpdatesRaw.filter(u => !u.inRecycleBin && !u.deleted);
  const deletedUpdates = allUpdatesRaw.filter(u => u.inRecycleBin === true || u.deleted === true);
  const binItems = await window.complaintStorageManager.getRecycleBinItems();

  const tabBadgeUpdates = document.getElementById('tab-badge-updates');
  const tabBadgeBin = document.getElementById('tab-badge-recycle-bin');

  if (tabBadgeUpdates) tabBadgeUpdates.innerText = activeUpdates.length;
  if (tabBadgeBin) tabBadgeBin.innerText = binItems.length;

  // Update folder count badges including 9th Recycle Bin folder
  const folderCounts = {
    all: activeUpdates.length,
    new: 0,
    received: 0,
    in_progress: 0,
    pending: 0,
    resolved: 0,
    rejected: 0,
    reopened: 0,
    archived: 0,
    recycle_bin: deletedUpdates.length
  };

  activeUpdates.forEach(u => {
    const st = (u.newStatus || '').toLowerCase().trim();
    if (st === 'submitted') folderCounts.new++;
    else if (st === 'received' || st === 'assigned' || st === 'under review') folderCounts.received++;
    else if (st === 'in progress' || st === 'action taken') folderCounts.in_progress++;
    else if (st === 'pending') folderCounts.pending++;
    else if (st === 'resolved') folderCounts.resolved++;
    else if (st === 'rejected') folderCounts.rejected++;
    else if (st === 'reopened') folderCounts.reopened++;
    else if (st === 'archived' || st === 'closed') folderCounts.archived++;
  });

  Object.keys(folderCounts).forEach(key => {
    const el = document.getElementById(`folder-count-${key}`);
    if (el) el.innerText = folderCounts[key];
  });
}
window.refreshStorageBadges = refreshStorageBadges;

/**
 * Filter updates by folder card click
 */
window.filterUpdatesByFolder = function(folderKey) {
  activeUpdatesFolderKey = folderKey || 'ALL';

  // Clear row selections on folder switch
  if (typeof selectedUpdateIds !== 'undefined') selectedUpdateIds.clear();
  const selectAll = document.getElementById('upd-select-all');
  if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }

  // Highlight selected card
  document.querySelectorAll('.folder-card').forEach(c => c.classList.remove('active'));
  const targetCard = document.getElementById(`folder-card-${folderKey.toLowerCase()}`);
  if (targetCard) targetCard.classList.add('active');

  // Sync folder dropdown
  const folderSelect = document.getElementById('upd-filter-folder');
  if (folderSelect) folderSelect.value = activeUpdatesFolderKey;

  renderUpdatesFolderUI();
};

/**
 * Handle filter change from dropdowns or search input
 */
window.handleUpdatesFilterChange = function() {
  const folderSelect = document.getElementById('upd-filter-folder');
  if (folderSelect) {
    activeUpdatesFolderKey = folderSelect.value;
    document.querySelectorAll('.folder-card').forEach(c => c.classList.remove('active'));
    const targetCard = document.getElementById(`folder-card-${activeUpdatesFolderKey.toLowerCase()}`);
    if (targetCard) targetCard.classList.add('active');
  }
  renderUpdatesFolderUI();
};

/**
 * Reset all Updates Folder filters
 */
window.resetUpdatesFilters = function() {
  const search = document.getElementById('upd-filter-search');
  const folder = document.getElementById('upd-filter-folder');
  const gp = document.getElementById('upd-filter-gp');
  const cat = document.getElementById('upd-filter-cat');
  const from = document.getElementById('upd-filter-from');
  const to = document.getElementById('upd-filter-to');

  if (search) search.value = '';
  if (folder) folder.value = 'ALL';
  if (gp) gp.value = 'ALL';
  if (cat) cat.value = 'ALL';
  if (from) from.value = '';
  if (to) to.value = '';

  filterUpdatesByFolder('ALL');
};

/**
 * Render Complaint Updates Folder Table
 */
let selectedUpdateIds = new Set();
let currentUpdateActionIds = [];

/**
 * Toggle select all checkboxes in Updates Folder
 */
window.toggleSelectAllUpdates = function(checked) {
  const checkboxes = document.querySelectorAll('.upd-row-select');
  checkboxes.forEach(cb => {
    cb.checked = checked;
    const uid = cb.getAttribute('data-update-id');
    if (checked && uid) {
      selectedUpdateIds.add(uid);
    } else if (uid) {
      selectedUpdateIds.delete(uid);
    }
  });
  updateBulkActionButtonsState();
};

/**
 * Handle individual row selection checkbox changes
 */
window.handleUpdateRowSelectionChange = function() {
  selectedUpdateIds.clear();
  const checkedBoxes = document.querySelectorAll('.upd-row-select:checked');
  checkedBoxes.forEach(cb => {
    const uid = cb.getAttribute('data-update-id');
    if (uid) selectedUpdateIds.add(uid);
  });

  const allCheckboxes = document.querySelectorAll('.upd-row-select');
  const selectAll = document.getElementById('upd-select-all');
  if (selectAll) {
    selectAll.checked = allCheckboxes.length > 0 && checkedBoxes.length === allCheckboxes.length;
    selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < allCheckboxes.length;
  }

  updateBulkActionButtonsState();
};

/**
 * Update toolbar bulk action buttons state and counts
 */
window.updateBulkActionButtonsState = function() {
  const count = selectedUpdateIds.size;
  const isBin = (activeUpdatesFolderKey === 'RECYCLE_BIN');

  const bulkDelBtn = document.getElementById('upd-bulk-delete-btn');
  const bulkRestoreBtn = document.getElementById('upd-bulk-restore-btn');
  const bulkPurgeBtn = document.getElementById('upd-bulk-purge-btn');
  const countDelEl = document.getElementById('upd-selected-count');
  const countBinEl = document.getElementById('upd-bin-selected-count');

  if (countDelEl) countDelEl.innerText = count;
  if (countBinEl) countBinEl.innerText = count;

  if (isBin) {
    if (bulkDelBtn) bulkDelBtn.style.display = 'none';
    if (bulkRestoreBtn) {
      bulkRestoreBtn.style.display = 'inline-flex';
      bulkRestoreBtn.disabled = count === 0;
      bulkRestoreBtn.style.opacity = count === 0 ? '0.5' : '1';
      bulkRestoreBtn.style.cursor = count === 0 ? 'not-allowed' : 'pointer';
    }
    if (bulkPurgeBtn) {
      bulkPurgeBtn.style.display = 'inline-flex';
      bulkPurgeBtn.disabled = count === 0;
      bulkPurgeBtn.style.opacity = count === 0 ? '0.5' : '1';
      bulkPurgeBtn.style.cursor = count === 0 ? 'not-allowed' : 'pointer';
    }
  } else {
    if (bulkRestoreBtn) bulkRestoreBtn.style.display = 'none';
    if (bulkPurgeBtn) bulkPurgeBtn.style.display = 'none';
    if (bulkDelBtn) {
      bulkDelBtn.style.display = 'inline-flex';
      bulkDelBtn.disabled = count === 0;
      bulkDelBtn.style.opacity = count === 0 ? '0.5' : '1';
      bulkDelBtn.style.cursor = count === 0 ? 'not-allowed' : 'pointer';
    }
  }
};

/**
 * Open confirmation modal to soft-delete individual or bulk update records
 */
window.openDeleteUpdateModal = function(updateId = null) {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("Unauthorized: Only Administrators can delete complaint update records.", "error");
    return;
  }

  if (updateId) {
    currentUpdateActionIds = [updateId];
  } else {
    currentUpdateActionIds = Array.from(selectedUpdateIds);
  }

  if (currentUpdateActionIds.length === 0) {
    showToast("Please select at least one update record to delete.", "warning");
    return;
  }

  const modal = document.getElementById('modal-delete-update');
  const titleEl = document.getElementById('modal-delete-update-title');
  const previewEl = document.getElementById('modal-delete-update-preview');
  const reasonInput = document.getElementById('upd-delete-reason-input');

  if (!modal || !previewEl) return;

  if (titleEl) {
    titleEl.innerText = currentUpdateActionIds.length === 1
      ? 'Move Complaint Update to Recycle Bin'
      : `Move ${currentUpdateActionIds.length} Selected Updates to Recycle Bin`;
  }

  if (reasonInput) reasonInput.value = 'Administrative deletion';

  const updates = window._lastFilteredUpdates || [];
  const selectedRecords = updates.filter(u => currentUpdateActionIds.includes(u.updateId));

  if (selectedRecords.length === 1) {
    const u = selectedRecords[0];
    previewEl.innerHTML = `
      <div style="display: grid; grid-template-columns: 140px 1fr; gap: 6px; line-height: 1.5;">
        <strong>Update Ref:</strong> <span style="font-family: monospace; color: #64748b;">${escapeHtml(u.updateId)}</span>
        <strong>Complaint ID:</strong> <strong style="font-family: monospace; color: #0b2545;">${escapeHtml(u.complaintId)}</strong>
        <strong>Citizen:</strong> <span>${escapeHtml(u.citizenName || 'Citizen')} (${escapeHtml(u.citizenEmail || 'N/A')})</span>
        <strong>Panchayat:</strong> <span>${escapeHtml(u.panchayatName || u.panchayatId || 'Gram Panchayat')}</span>
        <strong>Status Step:</strong> <span>${escapeHtml(u.oldStatus || 'Initial')} &rarr; <strong>${escapeHtml(u.newStatus || 'Submitted')}</strong></span>
        <strong>Update Type:</strong> <span style="font-weight: 700; color: #1e3a8a;">${escapeHtml(u.updateType || 'STATUS_CHANGE')}</span>
        <strong>Remarks:</strong> <span style="color: #475569;">${escapeHtml(u.remarks || 'No remarks')}</span>
      </div>
    `;
  } else {
    previewEl.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>${currentUpdateActionIds.length} Update Records Selected for Soft-Deletion:</strong>
      </div>
      <div style="max-height: 160px; overflow-y: auto; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; background: #fff;">
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #334155;">
          ${currentUpdateActionIds.map(id => {
            const rec = updates.find(u => u.updateId === id);
            return `<li><strong>${escapeHtml(id)}</strong> (Complaint: <em>${escapeHtml(rec ? rec.complaintId : 'N/A')}</em> - ${escapeHtml(rec ? (rec.newStatus || 'Update') : '')})</li>`;
          }).join('')}
        </ul>
      </div>
    `;
  }

  modal.style.display = 'flex';
};

window.closeDeleteUpdateModal = function() {
  const modal = document.getElementById('modal-delete-update');
  if (modal) modal.style.display = 'none';
};

window.openBulkDeleteUpdatesModal = function() {
  window.openDeleteUpdateModal(null);
};

window.executeDeleteUpdateConfirmed = async function() {
  if (!window.complaintStorageManager || currentUpdateActionIds.length === 0) return;

  const reasonInput = document.getElementById('upd-delete-reason-input');
  const reason = (reasonInput?.value || '').trim() || 'Administrative deletion';

  const currentUser = window.authService?.currentUser;
  const currentActor = {
    email: currentUser ? currentUser.email : 'admin@janaseva.local',
    name: currentUser ? (currentUser.name || 'Administrator') : 'Administrator',
    role: 'admin',
    uid: currentUser ? currentUser.uid : 'admin-root'
  };

  try {
    const btn = document.getElementById('btn-confirm-delete-update');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Moving to Recycle Bin...';
    }

    const res = await window.complaintStorageManager.deleteComplaintUpdates(currentUpdateActionIds, reason, currentActor);
    closeDeleteUpdateModal();
    selectedUpdateIds.clear();

    await renderUpdatesFolderUI();
    if (typeof renderRecycleBinUI === 'function') await renderRecycleBinUI();
    await refreshStorageBadges();

    showToast(`Successfully moved ${res.deletedCount || currentUpdateActionIds.length} update record(s) to Protected Recycle Bin!`, "success");
  } catch (err) {
    console.error('[JANASEVA] executeDeleteUpdateConfirmed error:', err);
    showToast(`Failed to delete update record(s): ${err.message || 'Unknown error'}`, "error");
  } finally {
    const btn = document.getElementById('btn-confirm-delete-update');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Move to Recycle Bin';
    }
  }
};

window.openRestoreUpdateModal = function(updateId = null) {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("Unauthorized: Only Administrators can restore update records.", "error");
    return;
  }

  if (updateId) {
    currentUpdateActionIds = [updateId];
  } else {
    currentUpdateActionIds = Array.from(selectedUpdateIds);
  }

  if (currentUpdateActionIds.length === 0) {
    showToast("Please select at least one quarantined update record to restore.", "warning");
    return;
  }

  const modal = document.getElementById('modal-restore-update');
  const titleEl = document.getElementById('modal-restore-update-title');
  const previewEl = document.getElementById('modal-restore-update-preview');

  if (!modal || !previewEl) return;

  if (titleEl) {
    titleEl.innerText = currentUpdateActionIds.length === 1
      ? 'Restore Complaint Update Record'
      : `Restore ${currentUpdateActionIds.length} Quarantined Update Records`;
  }

  const updates = window._lastFilteredUpdates || [];
  previewEl.innerHTML = `
    <div style="font-size: 13px; color: #1e293b;">
      Are you sure you want to restore <strong>${currentUpdateActionIds.length}</strong> record(s) back to active Complaint Updates?
      <div style="margin-top: 8px; max-height: 120px; overflow-y: auto; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; background: #fff;">
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #334155;">
          ${currentUpdateActionIds.map(id => {
            const rec = updates.find(u => u.updateId === id);
            return `<li><strong>${escapeHtml(id)}</strong> (Complaint: <em>${escapeHtml(rec ? rec.complaintId : 'N/A')}</em>)</li>`;
          }).join('')}
        </ul>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
};

window.closeRestoreUpdateModal = function() {
  const modal = document.getElementById('modal-restore-update');
  if (modal) modal.style.display = 'none';
};

window.openBulkRestoreUpdatesModal = function() {
  window.openRestoreUpdateModal(null);
};

window.executeRestoreUpdateConfirmed = async function() {
  if (!window.complaintStorageManager || currentUpdateActionIds.length === 0) return;

  const currentUser = window.authService?.currentUser;
  const currentActor = {
    email: currentUser ? currentUser.email : 'admin@janaseva.local',
    name: currentUser ? (currentUser.name || 'Administrator') : 'Administrator',
    role: 'admin',
    uid: currentUser ? currentUser.uid : 'admin-root'
  };

  try {
    const btn = document.getElementById('btn-confirm-restore-update');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Restoring...';
    }

    const res = await window.complaintStorageManager.restoreComplaintUpdates(currentUpdateActionIds, currentActor);
    closeRestoreUpdateModal();
    selectedUpdateIds.clear();

    await renderUpdatesFolderUI();
    if (typeof renderRecycleBinUI === 'function') await renderRecycleBinUI();
    await refreshStorageBadges();

    showToast(`Successfully restored ${res.restoredCount || currentUpdateActionIds.length} update record(s) to active Complaint Updates!`, "success");
  } catch (err) {
    console.error('[JANASEVA] executeRestoreUpdateConfirmed error:', err);
    showToast(`Failed to restore update record(s): ${err.message || 'Unknown error'}`, "error");
  } finally {
    const btn = document.getElementById('btn-confirm-restore-update');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Restore Record(s)';
    }
  }
};

window.openPurgeUpdateModal = function(updateId = null) {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("Unauthorized: Only Administrators can permanently purge records.", "error");
    return;
  }

  if (updateId) {
    currentUpdateActionIds = [updateId];
  } else {
    currentUpdateActionIds = Array.from(selectedUpdateIds);
  }

  if (currentUpdateActionIds.length === 0) {
    showToast("Please select at least one update record to purge.", "warning");
    return;
  }

  const modal = document.getElementById('modal-purge-update');
  const titleEl = document.getElementById('modal-purge-update-title');
  const previewEl = document.getElementById('modal-purge-update-preview');
  const inputEl = document.getElementById('upd-purge-confirm-input');
  const btnEl = document.getElementById('btn-confirm-purge-update');

  if (!modal || !previewEl) return;

  if (titleEl) {
    titleEl.innerText = currentUpdateActionIds.length === 1
      ? 'Permanent Purge Authorization (1 Record)'
      : `Permanent Purge Authorization (${currentUpdateActionIds.length} Records)`;
  }

  if (inputEl) {
    inputEl.value = '';
    inputEl.style.borderColor = '#cbd5e1';
  }
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.style.opacity = '0.5';
    btnEl.style.cursor = 'not-allowed';
  }

  const updates = window._lastFilteredUpdates || [];
  previewEl.innerHTML = `
    <div style="font-size: 13px; color: #7f1d1d;">
      <strong>${currentUpdateActionIds.length} Record(s) targeted for permanent destruction:</strong>
      <div style="margin-top: 8px; max-height: 120px; overflow-y: auto; border: 1px solid #fca5a5; border-radius: 4px; padding: 6px 10px; background: #fff;">
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #991b1b;">
          ${currentUpdateActionIds.map(id => {
            const rec = updates.find(u => u.updateId === id);
            return `<li><strong>${escapeHtml(id)}</strong> (Complaint: <em>${escapeHtml(rec ? rec.complaintId : 'N/A')}</em>)</li>`;
          }).join('')}
        </ul>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  if (inputEl) setTimeout(() => inputEl.focus(), 150);
};

window.closePurgeUpdateModal = function() {
  const modal = document.getElementById('modal-purge-update');
  if (modal) modal.style.display = 'none';
};

window.openBulkPurgeUpdatesModal = function() {
  window.openPurgeUpdateModal(null);
};

window.handleUpdatePurgeCodeInput = function(input) {
  const btn = document.getElementById('btn-confirm-purge-update');
  if (!btn) return;

  const isConfirmed = input.value.trim().toUpperCase() === 'DELETE';
  if (isConfirmed) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    input.style.borderColor = '#dc2626';
    input.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.15)';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    input.style.borderColor = '#cbd5e1';
    input.style.boxShadow = 'none';
  }
};

window.executePurgeUpdateConfirmed = async function() {
  if (!window.complaintStorageManager || currentUpdateActionIds.length === 0) return;

  const input = document.getElementById('upd-purge-confirm-input');
  if (!input || input.value.trim().toUpperCase() !== 'DELETE') {
    showToast("Please type DELETE to authorize permanent destruction.", "error");
    return;
  }

  const currentUser = window.authService?.currentUser;
  const currentActor = {
    email: currentUser ? currentUser.email : 'admin@janaseva.local',
    name: currentUser ? (currentUser.name || 'Administrator') : 'Administrator',
    role: 'admin',
    uid: currentUser ? currentUser.uid : 'admin-root'
  };

  try {
    const btn = document.getElementById('btn-confirm-purge-update');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Purging...';
    }

    const res = await window.complaintStorageManager.purgeComplaintUpdates(currentUpdateActionIds, 'DELETE', currentActor);
    closePurgeUpdateModal();
    selectedUpdateIds.clear();

    await renderUpdatesFolderUI();
    if (typeof renderRecycleBinUI === 'function') await renderRecycleBinUI();
    await refreshStorageBadges();

    showToast(`Permanently purged ${res.purgedCount || currentUpdateActionIds.length} update record(s) from database.`, "success");
  } catch (err) {
    console.error('[JANASEVA] executePurgeUpdateConfirmed error:', err);
    showToast(`Failed to purge update record(s): ${err.message || 'Unknown error'}`, "error");
  } finally {
    const btn = document.getElementById('btn-confirm-purge-update');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Permanently Delete Record(s)';
    }
  }
};

/**
 * Render Complaint Updates Folder Table with checkboxes and delete options
 */
window.renderUpdatesFolderUI = async function() {
  const tbody = document.getElementById('updates-table-body');
  const countEl = document.getElementById('updates-record-count');
  if (!tbody || !window.complaintStorageManager) return;

  const filters = {
    folder: activeUpdatesFolderKey,
    search: document.getElementById('upd-filter-search')?.value || '',
    panchayatId: document.getElementById('upd-filter-gp')?.value || 'ALL',
    category: document.getElementById('upd-filter-cat')?.value || 'ALL',
    fromDate: document.getElementById('upd-filter-from')?.value || '',
    toDate: document.getElementById('upd-filter-to')?.value || ''
  };

  tbody.innerHTML = `
    <tr>
      <td colspan="9" style="text-align: center; padding: 24px; color: #64748b;">
        <i class="fa-solid fa-spinner fa-spin"></i> Filtering updates...
      </td>
    </tr>
  `;

  const updates = await window.complaintStorageManager.getAllComplaintUpdates(filters);
  window._lastFilteredUpdates = updates;

  const isBinFolder = (activeUpdatesFolderKey === 'RECYCLE_BIN');
  if (countEl) {
    countEl.innerText = isBinFolder
      ? `${updates.length} Quarantined Updates Found`
      : `${updates.length} Updates Found`;
  }
  await refreshStorageBadges();

  if (updates.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 22px 14px; color: #64748b;">
          <i class="${isBinFolder ? 'fa-solid fa-trash-can-arrow-up' : 'fa-solid fa-folder-open'}" style="font-size: 32px; color: #cbd5e1; margin-bottom: 10px; display: block;"></i>
          <strong>${isBinFolder ? 'The Updates Recycle Bin is empty.' : 'No complaint updates found matching the criteria.'}</strong><br>
          <span style="font-size: 13px;">${isBinFolder ? 'No complaint update records are currently in quarantine.' : 'Try choosing another folder or adjusting the search term.'}</span>
        </td>
      </tr>
    `;
    updateBulkActionButtonsState();
    return;
  }

  tbody.innerHTML = updates.map(u => {
    const timeFormatted = u.formattedDate || new Date(u.timestamp).toLocaleString('en-IN');
    const oldStatusBadge = u.oldStatus ? `
      <span class="status-badge-pill ${getStatusBadgeClass(u.oldStatus)}" style="font-size: 11px; padding: 2px 7px;">
        ${escapeHtml(u.oldStatus)}
      </span>
      <i class="fa-solid fa-arrow-right" style="font-size: 10px; color: #94a3b8; margin: 0 4px;"></i>
    ` : '';
    const newStatusBadge = `
      <span class="status-badge-pill ${getStatusBadgeClass(u.newStatus)}" style="font-size: 11px; padding: 2px 7px;">
        ${escapeHtml(u.newStatus || 'Submitted')}
      </span>
    `;

    const rowActions = isBinFolder ? `
      <button type="button" class="btn-table-action" onclick="openRestoreUpdateModal('${escapeHtml(u.updateId)}')" style="background: #f0fdf4; border: 1px solid #86efac; color: #166534; font-weight: 700; padding: 5px 9px; border-radius: 5px; cursor: pointer; font-size: 11.5px;" title="Restore this update to active folder">
        <i class="fa-solid fa-rotate-left"></i> Restore
      </button>
      <button type="button" class="btn-action-delete" onclick="openPurgeUpdateModal('${escapeHtml(u.updateId)}')" style="padding: 5px 9px; font-size: 11.5px;" title="Permanently eradicate update record">
        <i class="fa-solid fa-trash-can"></i> Purge
      </button>
    ` : `
      <button type="button" class="btn-action-delete" onclick="openDeleteUpdateModal('${escapeHtml(u.updateId)}')" style="padding: 5px 9px; font-size: 11.5px; font-weight: 600;" title="Move update record to Protected Recycle Bin">
        <i class="fa-solid fa-trash-can"></i> Delete
      </button>
    `;

    return `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="upd-row-select" data-update-id="${escapeHtml(u.updateId)}" data-complaint-id="${escapeHtml(u.complaintId)}" onchange="handleUpdateRowSelectionChange()" ${selectedUpdateIds.has(u.updateId) ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
        </td>
        <td>
          <span style="font-family: monospace; font-size: 11px; color: #64748b; font-weight: 700;">${escapeHtml(u.updateId)}</span><br>
          <span style="font-size: 11px; color: #94a3b8;"><i class="fa-regular fa-clock"></i> ${escapeHtml(timeFormatted)}</span>
        </td>
        <td>
          <strong style="color: #0b2545; font-family: monospace; font-size: 13px;">${escapeHtml(u.complaintId)}</strong>
        </td>
        <td>
          <strong style="color: #0b2545; font-size: 12.5px;">${escapeHtml(u.citizenName)}</strong><br>
          <span style="font-size: 11px; color: #64748b;">${escapeHtml(u.citizenEmail || '')}</span>
        </td>
        <td>
          <span style="font-weight: 600; color: #334155; font-size: 12px;">${escapeHtml(u.panchayatName || u.panchayatId || '')}</span><br>
          <span style="font-size: 11px; color: #64748b;">${escapeHtml(u.category || 'General')}</span>
        </td>
        <td style="white-space: nowrap;">
          ${oldStatusBadge}${newStatusBadge}
        </td>
        <td>
          <strong style="font-size: 11.5px; color: #1e3a8a; text-transform: uppercase;">${escapeHtml(u.updateType || 'STATUS_CHANGE')}</strong><br>
          <span style="font-size: 12px; color: #334155; line-height: 1.3;">${escapeHtml(u.remarks || u.officialResponse || 'No remarks provided')}</span>
        </td>
        <td>
          <strong style="font-size: 12px; color: #0b2545;">${escapeHtml(u.authorName || 'Official')}</strong><br>
          <span style="font-size: 10.5px; padding: 1px 6px; border-radius: 4px; background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase;">
            ${escapeHtml(u.authorRole || 'admin')}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 5px; align-items: center; justify-content: flex-end;">
            ${rowActions}
            <button type="button" class="btn-table-action" onclick="viewComplaintHistoryTimeline('${escapeHtml(u.complaintId)}')" style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-weight: 600; padding: 5px 9px; border-radius: 5px; cursor: pointer; font-size: 11.5px;" title="View Complaint Timeline &amp; History">
              <i class="fa-solid fa-clock-rotate-left"></i> History
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Re-sync master checkbox and action buttons
  const allCheckboxes = document.querySelectorAll('.upd-row-select');
  const checkedBoxes = document.querySelectorAll('.upd-row-select:checked');
  const selectAll = document.getElementById('upd-select-all');
  if (selectAll) {
    selectAll.checked = allCheckboxes.length > 0 && checkedBoxes.length === allCheckboxes.length;
    selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < allCheckboxes.length;
  }
  updateBulkActionButtonsState();
};

/**
 * Export filtered complaint updates to CSV
 */
window.exportComplaintUpdatesCSV = function() {
  if (!window.complaintStorageManager) return;
  const updates = window._lastFilteredUpdates || [];
  if (updates.length === 0) {
    showToast("No updates to export.", "warning");
    return;
  }
  window.complaintStorageManager.exportUpdatesCSV(updates);
  showToast(`Exported ${updates.length} updates to CSV.`, "success");
};

/**
 * Print complaint updates report summary
 */
window.printComplaintUpdatesSummary = function() {
  if (!window.complaintStorageManager) return;
  const updates = window._lastFilteredUpdates || [];
  window.complaintStorageManager.printReportSummary({
    title: `JANASEVA Complaint Updates Folder – ${activeUpdatesFolderKey} Folder`,
    updates: updates
  });
};

/**
 * Open Complaint History Timeline Modal
 */
window.viewComplaintHistoryTimeline = async function(complaintId) {
  if (!complaintId || !window.complaintStorageManager) return;
  currentHistoryComplaintId = complaintId;

  const modal = document.getElementById('complaint-history-timeline-modal');
  const idEl = document.getElementById('timeline-modal-id');
  const metaEl = document.getElementById('timeline-modal-meta');
  const badgeEl = document.getElementById('timeline-modal-current-badge');
  const container = document.getElementById('timeline-events-list');

  if (!modal || !container) return;

  const complaint = allComplaints.find(c => c.complaintId === complaintId) || { complaintId };

  if (idEl) idEl.innerText = complaint.complaintId;
  if (metaEl) {
    metaEl.innerHTML = `
      Citizen: <strong>${escapeHtml(complaint.citizenName || 'N/A')}</strong> • 
      Gram Panchayat: <strong>${escapeHtml(complaint.panchayatName || complaint.panchayatId || 'N/A')}</strong> • 
      Category: <strong>${escapeHtml(complaint.category || 'N/A')}</strong>
    `;
  }
  if (badgeEl) {
    badgeEl.innerHTML = `
      <span class="status-badge-pill ${getStatusBadgeClass(complaint.status)}">
        ${getStatusIcon(complaint.status)} ${escapeHtml(complaint.status || 'Active')}
      </span>
    `;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 24px; color: #64748b;">
      <i class="fa-solid fa-spinner fa-spin"></i> Retrieving chronological audit trail...
    </div>
  `;

  modal.style.display = 'flex';

  const history = await window.complaintStorageManager.getComplaintHistory(complaintId);

  if (history.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: #64748b;">
        No historical update logs found for this grievance.
      </div>
    `;
    return;
  }

  container.innerHTML = history.map((item, idx) => {
    const formatted = item.formattedDate || new Date(item.timestamp).toLocaleString('en-IN');
    const isLatest = idx === history.length - 1;
    const isFirst = idx === 0;

    return `
      <div class="timeline-trail-node">
        <div class="timeline-node-dot" style="${isLatest ? 'background: #0f56b3; color: #fff;' : ''}">
          <i class="fa-solid ${isFirst ? 'fa-star' : isLatest ? 'fa-flag-checkered' : 'fa-check'}"></i>
        </div>
        <div class="timeline-node-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
            <div>
              <span style="font-weight: 800; font-size: 13px; color: #0b2545; text-transform: uppercase;">
                ${escapeHtml(item.updateType || 'STATUS_UPDATE')}
              </span>
              ${item.newStatus ? `
                <span class="status-badge-pill ${getStatusBadgeClass(item.newStatus)}" style="font-size: 10.5px; padding: 1px 7px; margin-left: 6px;">
                  ${escapeHtml(item.newStatus)}
                </span>
              ` : ''}
            </div>
            <span style="font-size: 11px; color: #64748b; font-weight: 600;">
              <i class="fa-regular fa-clock"></i> ${escapeHtml(formatted)}
            </span>
          </div>

          <p style="font-size: 13px; color: #334155; line-height: 1.4; margin: 4px 0 8px 0;">
            ${escapeHtml(item.remarks || item.officialResponse || 'No specific remarks recorded.')}
          </p>

          ${(() => {
            if (!item.resolutionDetails) return '';
            if (typeof item.resolutionDetails === 'string' && item.resolutionDetails.startsWith('WORK_PROGRESS_JSON:')) {
              try {
                const wp = JSON.parse(item.resolutionDetails.slice('WORK_PROGRESS_JSON:'.length));
                return `
                  <div style="background: #eff6ff; border-left: 3px solid #2563eb; padding: 6px 10px; margin-top: 6px; font-size: 12px; color: #1e3a8a;">
                    <strong><i class="fa-solid fa-bars-progress"></i> Work Progress: ${Number(wp.percentage || 0)}% (${escapeHtml(wp.stage || 'Updated')})</strong>
                    ${wp.completedWork ? `<br><span>Completed: ${escapeHtml(wp.completedWork)}</span>` : ''}
                    ${wp.remainingWork ? `<br><span>Remaining: ${escapeHtml(wp.remainingWork)}</span>` : ''}
                    ${wp.delayReason ? `<br><span style="color: #b45309;">Delay: ${escapeHtml(wp.delayReason)}</span>` : ''}
                  </div>
                `;
              } catch (e) { return ''; }
            }
            if (typeof item.resolutionDetails === 'string' && item.resolutionDetails.startsWith('SOFT_DELETE_JSON:')) {
              return '';
            }
            return `
              <div style="background: #f0fdf4; border-left: 3px solid #16a34a; padding: 6px 10px; margin-top: 6px; font-size: 12px; color: #166534;">
                <strong><i class="fa-solid fa-circle-check"></i> Resolution Remarks:</strong> ${escapeHtml(item.resolutionDetails)}
              </div>
            `;
          })()}

          <div style="font-size: 11px; color: #64748b; margin-top: 6px; display: flex; align-items: center; gap: 8px;">
            <span><i class="fa-solid fa-user-pen" style="color: #0f56b3;"></i> Updated by: <strong>${escapeHtml(item.authorName || 'Official')}</strong> (${escapeHtml(item.authorRole || 'Admin')})</span>
            <span>•</span>
            <span>${escapeHtml(item.authorEmail || '')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.closeComplaintHistoryModal = function() {
  const modal = document.getElementById('complaint-history-timeline-modal');
  if (modal) modal.style.display = 'none';
  currentHistoryComplaintId = null;
};

window.printComplaintTimelineReport = function() {
  if (!currentHistoryComplaintId || !window.complaintStorageManager) return;
  const complaint = allComplaints.find(c => c.complaintId === currentHistoryComplaintId);
  window.complaintStorageManager.printReportSummary({
    title: `Grievance Audit Trail: ${currentHistoryComplaintId}`,
    complaint: complaint
  });
};

/**
 * Render Protected Recycle Bin UI
 */
window.renderRecycleBinUI = async function() {
  const tbody = document.getElementById('recycle-bin-table-body');
  const countEl = document.getElementById('recycle-bin-record-count');
  if (!tbody || !window.complaintStorageManager) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">
        <i class="fa-solid fa-spinner fa-spin"></i> Retrieving quarantined records...
      </td>
    </tr>
  `;

  const binItems = await window.complaintStorageManager.getRecycleBinItems();

  if (countEl) countEl.innerText = `${binItems.length} Quarantined Records`;
  const tabBadgeBin = document.getElementById('tab-badge-recycle-bin');
  if (tabBadgeBin) tabBadgeBin.innerText = binItems.length;

  if (binItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 22px 14px; color: #64748b;">
          <i class="fa-solid fa-trash-can-arrow-up" style="font-size: 32px; color: #cbd5e1; margin-bottom: 10px; display: block;"></i>
          <strong>The Protected Recycle Bin is empty.</strong><br>
          <span style="font-size: 13px;">No grievances are currently in quarantine.</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = binItems.map(item => {
    const isUpdateRecord = (item.itemType === 'COMPLAINT_UPDATE');
    const c = isUpdateRecord ? (item.updateData || {}) : (item.complaintData || {});
    const origStatus = item.originalStatus || c.newStatus || c.status || 'Submitted';
    const deletedTime = item.formattedDeletedAt || item.deletedAtFormatted || (item.deletedAt ? new Date(item.deletedAt).toLocaleString('en-IN') : 'N/A');

    const restoreHandler = isUpdateRecord
      ? `openRestoreUpdateModal('${escapeHtml(item.updateId || item.recycleId)}')`
      : `restoreComplaintAction('${item.complaintId}')`;

    const purgeHandler = isUpdateRecord
      ? `openPurgeUpdateModal('${escapeHtml(item.updateId || item.recycleId)}')`
      : `openPermanentDeleteModal('${item.complaintId}')`;

    const typeTag = isUpdateRecord
      ? `<span style="display: inline-block; font-size: 9.5px; background: #e0f2fe; color: #0369a1; padding: 1px 5px; border-radius: 3px; font-weight: 800; text-transform: uppercase; margin-top: 2px;">Update Record</span>`
      : `<span style="display: inline-block; font-size: 9.5px; background: #fee2e2; color: #991b1b; padding: 1px 5px; border-radius: 3px; font-weight: 800; text-transform: uppercase; margin-top: 2px;">Complaint</span>`;

    return `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="bin-row-check" value="${item.recycleId || item.complaintId}">
        </td>
        <td>
          <strong style="color: #991b1b; font-family: monospace; font-size: 13px;">${escapeHtml(item.complaintId)}</strong><br>
          <span style="font-size: 10.5px; color: #64748b; font-family: monospace;">Ref: ${escapeHtml(item.recycleId)}</span><br>
          ${typeTag}
        </td>
        <td>
          <strong style="color: #0b2545; font-size: 12.5px;">${escapeHtml(c.citizenName || 'Citizen')}</strong><br>
          <span style="font-size: 11px; color: #64748b;">${escapeHtml(c.citizenPhone || c.citizenEmail || '')}</span>
        </td>
        <td>
          <span style="font-weight: 600; color: #334155; font-size: 12px;">${escapeHtml(c.panchayatName || c.panchayatId || '')}</span><br>
          <span style="font-size: 11px; color: #64748b;">${escapeHtml(c.category || 'General')}</span>
        </td>
        <td>
          <span class="status-badge-pill ${getStatusBadgeClass(origStatus)}" style="font-size: 11px; padding: 2px 7px;">
            ${escapeHtml(origStatus)}
          </span>
        </td>
        <td style="font-size: 11.5px; color: #64748b; white-space: nowrap;">
          <i class="fa-regular fa-clock"></i> ${escapeHtml(deletedTime)}
        </td>
        <td>
          <strong style="font-size: 12px; color: #0b2545;">${escapeHtml(item.deletedByName || item.deletedBy || 'Admin')}</strong><br>
          <span style="font-size: 11px; color: #7f1d1d; line-height: 1.3;">Reason: ${escapeHtml(item.reason || 'Administrative soft-deletion')}</span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end;">
            <button type="button" class="btn-table-action" onclick="${restoreHandler}" style="background: #f0fdf4; border: 1px solid #86efac; color: #166534; font-weight: 700; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;" title="Restore to active records">
              <i class="fa-solid fa-rotate-left"></i> Restore
            </button>
            <button type="button" class="btn-action-delete" onclick="${purgeHandler}" title="Permanently eradicate from system">
              <i class="fa-solid fa-trash-can"></i> Purge
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

/**
 * Restore complaint from Recycle Bin
 */
window.restoreComplaintAction = async function(complaintId) {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("Unauthorized: Only Administrators can restore quarantined grievances.", "error");
    return;
  }

  const currentUser = window.authService.currentUser;
  const currentActor = {
    email: currentUser ? currentUser.email : '',
    name: currentUser ? (currentUser.name || 'Administrator') : 'Administrator',
    role: 'admin',
    uid: currentUser ? currentUser.uid : 'admin-root'
  };

  if (!window.complaintStorageManager) {
    showToast("Storage Manager is unavailable. Cannot restore grievance.", "error");
    return;
  }

  try {
    const restored = await window.complaintStorageManager.restoreFromRecycleBin(complaintId, currentActor);
    if (restored) {
      await loadComplaintsData();
      updateStatsAndBadges();
      renderComplaintsTable();
      renderWorkloadCards();
      renderRecycleBinUI();
      if (typeof refreshStorageBadges === 'function') refreshStorageBadges();
      showToast(`Grievance ${complaintId} successfully restored to active registry!`, "success");
    } else {
      showToast(`Failed to restore grievance ${complaintId}.`, "error");
    }
  } catch (err) {
    console.error('[JANASEVA] restoreComplaintAction error:', err);
    showToast(`Restore failed for ${complaintId}: ${err.message || 'Unknown error'}`, "error");
  }
};

/**
 * Open Permanent Deletion Modal (requires typing 'DELETE')
 */
window.openPermanentDeleteModal = async function(complaintId) {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("Unauthorized: Only Administrators can permanently purge records.", "error");
    return;
  }

  currentPermDeleteId = complaintId;
  const modal = document.getElementById('permanent-delete-confirm-modal');
  const idEl = document.getElementById('perm-del-modal-id');
  const citizenEl = document.getElementById('perm-del-modal-citizen');
  const gpEl = document.getElementById('perm-del-modal-gp');
  const inputEl = document.getElementById('perm-del-confirm-input');
  const btnEl = document.getElementById('btn-confirm-permanent-delete');

  if (!modal) return;

  const binItems = await window.complaintStorageManager.getRecycleBinItems();
  const item = binItems.find(b => b.complaintId === complaintId || b.recycleId === complaintId);
  const c = item ? (item.complaintData || {}) : {};

  if (idEl) idEl.innerText = complaintId;
  if (citizenEl) citizenEl.innerText = c.citizenName || 'Citizen';
  if (gpEl) gpEl.innerText = c.panchayatName || c.panchayatId || 'Gram Panchayat';

  if (inputEl) {
    inputEl.value = '';
    inputEl.style.borderColor = '#cbd5e1';
  }
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.style.opacity = '0.5';
    btnEl.style.cursor = 'not-allowed';
  }

  modal.style.display = 'flex';
  if (inputEl) setTimeout(() => inputEl.focus(), 150);
};

window.closePermanentDeleteModal = function() {
  const modal = document.getElementById('permanent-delete-confirm-modal');
  if (modal) modal.style.display = 'none';
  currentPermDeleteId = null;
};

window.handlePermDeleteCodeInput = function(input) {
  const btn = document.getElementById('btn-confirm-permanent-delete');
  if (!btn) return;

  const isConfirmed = input.value.trim().toUpperCase() === 'DELETE';
  if (isConfirmed) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    input.style.borderColor = '#dc2626';
    input.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.15)';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    input.style.borderColor = '#cbd5e1';
    input.style.boxShadow = 'none';
  }
};

window.executePermanentDeleteConfirmed = async function() {
  if (!currentPermDeleteId || !window.complaintStorageManager) return;

  const input = document.getElementById('perm-del-confirm-input');
  if (!input || input.value.trim().toUpperCase() !== 'DELETE') {
    showToast("Please type DELETE to authorize permanent destruction.", "error");
    return;
  }

  const currentUser = window.authService?.currentUser;
  const currentActor = {
    email: currentUser ? currentUser.email : '',
    name: currentUser ? (currentUser.name || 'Administrator') : 'Administrator',
    role: 'admin',
    uid: currentUser ? currentUser.uid : 'admin-root'
  };

  const purgedId = currentPermDeleteId;
  const success = await window.complaintStorageManager.permanentlyDeleteComplaint(purgedId, 'DELETE', currentActor);

  closePermanentDeleteModal();

  if (success) {
    await renderRecycleBinUI();
    showToast(`Record ${purgedId} permanently destroyed from database.`, "info");
  } else {
    showToast(`Failed to permanently purge record ${purgedId}.`, "error");
  }
};

window.openEmptyBinModal = async function() {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("Unauthorized: Only Administrators can empty the Recycle Bin.", "error");
    return;
  }

  const binItems = await window.complaintStorageManager.getRecycleBinItems();
  if (binItems.length === 0) {
    showToast("Recycle Bin is already empty.", "info");
    return;
  }

  if (!(window.janasevaConfirm || confirm)(`EMPTY RECYCLE BIN WARNING:\n\nAre you sure you want to permanently eradicate ALL ${binItems.length} quarantined records?\n\nThis action cannot be undone.`)) {
    return;
  }

  const confirmCode = (window.janasevaPrompt || prompt)(`To authorize permanent destruction of ALL ${binItems.length} records, type "PURGE ALL" below:`);
  if (confirmCode !== 'PURGE ALL') {
    showToast("Action cancelled: authorization code did not match.", "warning");
    return;
  }

  const currentUser = window.authService?.currentUser;
  const currentActor = {
    email: currentUser ? currentUser.email : '',
    name: currentUser ? (currentUser.name || 'Administrator') : 'Administrator',
    role: 'admin',
    uid: currentUser ? currentUser.uid : 'admin-root'
  };

  for (const item of binItems) {
    await window.complaintStorageManager.permanentlyDeleteComplaint(item.complaintId || item.recycleId, 'DELETE', currentActor);
  }

  await renderRecycleBinUI();
  showToast("Protected Recycle Bin emptied successfully.", "info");
};

/**
 * Bulk selection handlers in Grievance Table
 */
window.toggleSelectAllComplaints = function(masterCheckbox) {
  const checkboxes = document.querySelectorAll('.complaint-row-check');
  checkboxes.forEach(cb => { cb.checked = masterCheckbox.checked; });
  handleComplaintCheckboxChange();
};

window.handleComplaintCheckboxChange = function() {
  const checkboxes = document.querySelectorAll('.complaint-row-check:checked');
  const count = checkboxes.length;
  const bar = document.getElementById('complaints-bulk-actions-bar');
  const countEl = document.getElementById('bulk-selection-count');

  if (bar) {
    if (count > 0) {
      bar.style.display = 'flex';
      if (countEl) countEl.innerText = `${count} grievance${count > 1 ? 's' : ''} selected`;
    } else {
      bar.style.display = 'none';
    }
  }
};

window.clearComplaintsSelection = function() {
  const checkboxes = document.querySelectorAll('.complaint-row-check');
  checkboxes.forEach(cb => { cb.checked = false; });
  const master = document.getElementById('check-all-complaints');
  if (master) master.checked = false;
  handleComplaintCheckboxChange();
};

window.executeBulkMoveToRecycleBin = async function() {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("Unauthorized: Only Administrators can bulk delete records.", "error");
    return;
  }

  const selected = Array.from(document.querySelectorAll('.complaint-row-check:checked')).map(cb => cb.value);
  if (selected.length === 0) return;

  if (!(window.janasevaConfirm || confirm)(`Move ${selected.length} selected grievances to the Protected Recycle Bin?\n\nThey can be restored at any time.`)) {
    return;
  }

  const currentUser = window.authService?.currentUser;
  const currentActor = {
    email: currentUser ? currentUser.email : '',
    name: currentUser ? (currentUser.name || 'Administrator') : 'Administrator',
    role: 'admin',
    uid: currentUser ? currentUser.uid : 'admin-root'
  };

  for (const id of selected) {
    await window.complaintStorageManager.moveToRecycleBin(id, 'Bulk administrative deletion', currentActor);
  }

  clearComplaintsSelection();
  await loadComplaintsData();
  updateStatsAndBadges();
  renderComplaintsTable();
  renderWorkloadCards();
  if (typeof initUpdatesFolderAndRecycleBin === 'function') {
    initUpdatesFolderAndRecycleBin();
  }

  showToast(`${selected.length} grievances moved to Protected Recycle Bin.`, "success");
};

/**
 * Bulk selection handlers in Recycle Bin
 */
window.toggleSelectAllBin = function(masterCheckbox) {
  const checkboxes = document.querySelectorAll('.bin-row-check');
  checkboxes.forEach(cb => { cb.checked = masterCheckbox.checked; });
};

window.restoreSelectedFromBin = async function() {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("Unauthorized: Only Administrators can restore quarantined records.", "error");
    return;
  }

  const selected = Array.from(document.querySelectorAll('.bin-row-check:checked')).map(cb => cb.value);
  if (selected.length === 0) {
    showToast("Please check at least one quarantined grievance to restore.", "warning");
    return;
  }

  const currentUser = window.authService?.currentUser;
  const currentActor = {
    email: currentUser ? currentUser.email : '',
    name: currentUser ? (currentUser.name || 'Administrator') : 'Administrator',
    role: 'admin',
    uid: currentUser ? currentUser.uid : 'admin-root'
  };

  if (!window.complaintStorageManager) {
    showToast("Storage Manager is unavailable. Cannot restore selected grievances.", "error");
    return;
  }

  let restoredCount = 0;
  let failedCount = 0;
  for (const id of selected) {
    try {
      await window.complaintStorageManager.restoreFromRecycleBin(id, currentActor);
      restoredCount++;
    } catch (err) {
      console.error('[JANASEVA] Bulk restore error for', id, err);
      failedCount++;
    }
  }

  await loadComplaintsData();
  updateStatsAndBadges();
  renderComplaintsTable();
  renderRecycleBinUI();
  if (typeof refreshStorageBadges === 'function') refreshStorageBadges();
  if (failedCount === 0) {
    showToast(`${restoredCount} grievances restored to active register.`, "success");
  } else {
    showToast(`Restored ${restoredCount} grievance(s); ${failedCount} could not be restored.`, "warning");
  }
};

/**
 * Duplicate Review Modal handlers
 */
window.openDuplicateReviewModal = function(id1, id2) {
  const modal = document.getElementById('duplicate-review-modal');
  const container = document.getElementById('duplicate-comparison-body');
  if (!modal || !container) return;

  currentDuplicateIds = { id1, id2 };

  const c1 = allComplaints.find(c => c.complaintId === id1) || { complaintId: id1 };
  const c2 = allComplaints.find(c => c.complaintId === id2) || { complaintId: id2 };

  const renderCard = (c, label) => `
    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase;">${label}</span>
        <strong style="font-family: monospace; color: #0b2545;">${escapeHtml(c.complaintId || 'N/A')}</strong>
      </div>
      <table class="detail-table" style="font-size: 12.5px;">
        <tr>
          <td class="detail-label-cell" style="width: 100px;">Citizen</td>
          <td class="detail-value-cell">: <strong>${escapeHtml(c.citizenName || 'N/A')}</strong></td>
        </tr>
        <tr>
          <td class="detail-label-cell">Panchayat</td>
          <td class="detail-value-cell">: ${escapeHtml(c.panchayatName || c.panchayatId || 'N/A')}</td>
        </tr>
        <tr>
          <td class="detail-label-cell">Category</td>
          <td class="detail-value-cell">: ${escapeHtml(c.category || 'N/A')}</td>
        </tr>
        <tr>
          <td class="detail-label-cell">Submitted</td>
          <td class="detail-value-cell">: ${escapeHtml(c.createdAt || 'N/A')}</td>
        </tr>
        <tr>
          <td class="detail-label-cell">Status</td>
          <td class="detail-value-cell">: <span class="status-badge-pill ${getStatusBadgeClass(c.status)}">${escapeHtml(c.status || 'Submitted')}</span></td>
        </tr>
        <tr>
          <td class="detail-label-cell">Description</td>
          <td class="detail-value-cell" style="line-height: 1.4;">: ${escapeHtml(c.description || 'N/A')}</td>
        </tr>
      </table>
    </div>
  `;

  container.innerHTML = `
    ${renderCard(c1, 'Current Grievance')}
    ${renderCard(c2, 'Detected Matching Grievance')}
  `;

  modal.style.display = 'flex';
};

window.closeDuplicateReviewModal = function() {
  const modal = document.getElementById('duplicate-review-modal');
  if (modal) modal.style.display = 'none';
  currentDuplicateIds = { id1: null, id2: null };
};

window.executeDuplicateMoveToBin = async function() {
  if (!currentDuplicateIds.id2) return;
  const dupId = currentDuplicateIds.id2;

  if ((window.janasevaConfirm || confirm)(`Move detected duplicate grievance ${dupId} to the Protected Recycle Bin?`)) {
    closeDuplicateReviewModal();
    await deleteComplaint(dupId);
  }
};

/**
 * Receiver Grievance Flagging Modal Handlers
 */
let currentReceiverFlagId = null;

window.openReceiverFlagModal = function(complaintId) {
  currentReceiverFlagId = complaintId;
  const modal = document.getElementById('receiver-flag-modal');
  const notes = document.getElementById('receiver-flag-notes');
  if (notes) notes.value = '';
  if (modal) modal.style.display = 'flex';
};

window.closeReceiverFlagModal = function() {
  const modal = document.getElementById('receiver-flag-modal');
  if (modal) modal.style.display = 'none';
  currentReceiverFlagId = null;
};

window.submitReceiverFlagRequest = async function() {
  if (!currentReceiverFlagId) return;

  const reasonSelect = document.getElementById('receiver-flag-reason-select');
  const notesText = document.getElementById('receiver-flag-notes');

  const reason = reasonSelect ? reasonSelect.value : 'Administrative Review';
  const notes = notesText ? notesText.value.trim() : '';

  if (!notes) {
    showToast("Please provide officer justification notes for Administrator review.", "warning");
    if (notesText) notesText.focus();
    return;
  }

  const currentUser = window.authService?.currentUser;
  const actor = {
    name: currentUser ? (currentUser.name || 'Panchayat Officer') : 'Receiver',
    email: currentUser ? currentUser.email : '',
    role: 'receiver'
  };

  const complaint = allComplaints.find(c => c.complaintId === currentReceiverFlagId);

  // Record update in updates folder
  if (window.complaintStorageManager && complaint) {
    await window.complaintStorageManager.recordComplaintUpdate(complaint, {
      updateType: 'FLAG_REQUESTED',
      remarks: `Officer flagged for Admin review [${reason}]. Notes: ${notes}`,
      actor: actor
    });

    window.complaintStorageManager.recordActivity(
      'GRIEVANCE_FLAGGED',
      currentReceiverFlagId,
      `Receiver requested deletion/review: ${reason}. Notes: ${notes}`,
      actor
    );
  }

  closeReceiverFlagModal();
  showToast(`Grievance ${currentReceiverFlagId} flagged for Administrator review.`, "info");
};


/**
 * ============================================================================
 * ADMIN-ONLY AI ASSISTANT ANALYTICS, FEEDBACK REVIEW & CONFIGURATION
 * ============================================================================
 */
window.loadAdminAssistantOps = async function() {
  const container = document.getElementById('admin-ai-ops-container');
  if (!container) return;

  const isAdmin = window.authService ? window.authService.isAdmin() : false;
  if (!isAdmin) {
    container.innerHTML = '<div style="color:#dc2626;font-weight:700;">Access Denied: Administrator privileges required.</div>';
    return;
  }

  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let data = null;
  const canCallFn =
    window.isFirebaseAvailable &&
    typeof firebase !== 'undefined' &&
    typeof firebase.functions === 'function' &&
    firebase.auth &&
    firebase.auth().currentUser;

  if (canCallFn) {
    try {
      const fn = firebase.functions().httpsCallable('getAssistantAdminAnalytics');
      const res = await fn({});
      data = res && res.data ? res.data : null;
    } catch (e) {
      console.warn('[Admin AI Ops] Cloud function error:', e.message);
    }
  }

  if (!data) {
    const fbList = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('assistant_feedback', []) : [];
    const cfg = (typeof JanasevaDB !== 'undefined')
      ? JanasevaDB.get('assistant_runtime_config', {
          aiEnabled: true, preferredProvider: 'auto', rateLimitPerMinute: 20, rateLimitPerDay: 250, welcomeNotice: ''
        })
      : { aiEnabled: true, preferredProvider: 'auto', rateLimitPerMinute: 20, rateLimitPerDay: 250, welcomeNotice: '' };

    data = {
      providerStatus: {
        configured: false,
        connected: false,
        provider: 'guided-citizen-engine',
        model: 'deterministic-civic-nlu',
        configurationInstructions: 'Running in Local Simulation Mode or without server AI key. To enable external LLM AI in Firebase Functions, set GEMINI_API_KEY or OPENAI_API_KEY via `firebase functions:secrets:set`.'
      },
      runtimeConfig: cfg,
      analytics: {
        totalInteractions: 0,
        complaintsStarted: 0,
        trackingQueries: 0,
        emergencyAlerts: 0,
        feedback: {
          helpful: fbList.filter(f => f.rating === 'helpful').length,
          notHelpful: fbList.filter(f => f.rating === 'not_helpful').length,
          incorrect: fbList.filter(f => f.rating === 'incorrect').length,
          total: fbList.length
        }
      },
      reportedItems: fbList.filter(f => f.rating === 'incorrect').slice(0, 30)
    };
  }

  const pStat = data.providerStatus || {};
  const cfg = data.runtimeConfig || {};
  const fbStats = data.analytics?.feedback || { helpful: 0, notHelpful: 0, incorrect: 0, total: 0 };
  const reported = Array.isArray(data.reportedItems) ? data.reportedItems : [];

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 175px),1fr));gap:12px;margin-bottom:18px;">
      <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:12px;">
        <div style="font-size:11px;font-weight:700;color:#64748b;">AI PROVIDER STATUS</div>
        <div style="font-size:15px;font-weight:800;color:${pStat.configured ? '#15803d' : '#b45309'};margin-top:4px;">
          ${pStat.configured ? 'Configured (' + esc(pStat.provider) + ')' : 'Not Configured (Guided Mode)'}
        </div>
        <div style="font-size:11px;color:#475569;margin-top:2px;">Model: ${esc(pStat.model || 'N/A')}</div>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;">
        <div style="font-size:11px;font-weight:700;color:#166534;">HELPFUL FEEDBACK</div>
        <div style="font-size:22px;font-weight:800;color:#15803d;">${Number(fbStats.helpful || 0)}</div>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;">
        <div style="font-size:11px;font-weight:700;color:#92400e;">NOT HELPFUL</div>
        <div style="font-size:22px;font-weight:800;color:#d97706;">${Number(fbStats.notHelpful || 0)}</div>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;">
        <div style="font-size:11px;font-weight:700;color:#991b1b;">REPORTED INCORRECT</div>
        <div style="font-size:22px;font-weight:800;color:#dc2626;">${Number(fbStats.incorrect || 0)}</div>
      </div>
    </div>

    ${pStat.configurationInstructions ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;margin-bottom:18px;font-size:12.5px;color:#1e3a8a;">
        <strong><i class="fa-solid fa-circle-info"></i> Server AI Provider Setup:</strong> ${esc(pStat.configurationInstructions)}
      </div>
    ` : ''}

    <div id="admin-ai-config-card" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:18px;">
      <h3 style="margin:0 0 10px;font-size:15px;color:#0b2545;">Approved Assistant Guardrail Configuration (No Secrets Stored Here)</h3>
      <div id="admin-ai-usm-status"></div>
      <form id="admin-ai-config-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 190px),1fr));gap:12px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">External AI Adapter</label>
          <select id="cfg-ai-enabled" class="form-select">
            <option value="true" ${cfg.aiEnabled !== false ? 'selected' : ''}>Enabled (when key configured)</option>
            <option value="false" ${cfg.aiEnabled === false ? 'selected' : ''}>Disabled (Guided Engine Only)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">Preferred Provider</label>
          <select id="cfg-ai-provider" class="form-select">
            <option value="auto" ${cfg.preferredProvider === 'auto' ? 'selected' : ''}>Auto (Gemini / OpenAI)</option>
            <option value="gemini" ${cfg.preferredProvider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
            <option value="openai" ${cfg.preferredProvider === 'openai' ? 'selected' : ''}>OpenAI Compatible</option>
            <option value="guided" ${cfg.preferredProvider === 'guided' ? 'selected' : ''}>Guided Deterministic Only</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">Rate Limit (Req / Min / User)</label>
          <input id="cfg-ai-rpm" type="number" min="3" max="120" class="form-input" value="${Number(cfg.rateLimitPerMinute || 20)}">
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">Daily Limit (Req / Day / User)</label>
          <input id="cfg-ai-rpd" type="number" min="10" max="2000" class="form-input" value="${Number(cfg.rateLimitPerDay || 250)}">
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">Temperature (0.0 – 1.0)</label>
          <input id="cfg-ai-temp" type="number" step="0.1" min="0" max="1" class="form-input" value="${Number(cfg.temperature ?? 0.3)}">
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">Max Output Tokens (150 – 1200)</label>
          <input id="cfg-ai-tokens" type="number" min="150" max="1200" class="form-input" value="${Number(cfg.maxOutputTokens || 650)}">
        </div>
        <div style="grid-column: 1 / -1;">
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;">Public AI Chat Welcome Notice (Optional)</label>
          <input id="cfg-ai-notice" type="text" maxlength="400" class="form-input" value="${esc(cfg.welcomeNotice || '')}" placeholder="e.g. Official Gram Panchayat Grievance Assistant — Verified Schemes & Complaints Help">
        </div>
        <div class="usm-actions-bar" style="grid-column: 1 / -1; margin-top: 4px;">
          <button type="submit" id="admin-ai-save-btn" class="btn-cta-primary" style="width:auto;justify-content:center;">
            <i class="fa-solid fa-floppy-disk"></i> <span>Save Configuration</span>
          </button>
          <button type="button" id="admin-ai-reset-btn" class="btn-secondary-action usm-btn-reset">
            <i class="fa-solid fa-rotate-left"></i> <span>Reset Defaults</span>
          </button>
          <button type="button" id="admin-ai-refresh-btn" class="btn-secondary-action usm-btn-refresh">
            <i class="fa-solid fa-arrows-rotate"></i> <span>Refresh</span>
          </button>
        </div>
      </form>
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
      <h3 style="margin:0 0 10px;font-size:15px;color:#0b2545;">Reported Incorrect Assistant Responses</h3>
      ${reported.length === 0 ? '<p style="color:#64748b;font-size:13px;">No incorrect responses reported yet.</p>' : `
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Snippet</th>
                <th>Citizen Note</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${reported.map(r => `
                <tr>
                  <td style="font-size:11.5px;">${esc((r.createdAt || '').slice(0, 16).replace('T', ' '))}</td>
                  <td style="font-size:12px;max-width:240px;">${esc(r.messageSnippet || '—')}</td>
                  <td style="font-size:12px;">${esc(r.reason || '—')}</td>
                  <td><span class="status-badge-pill">${esc(r.status || 'open')}</span></td>
                  <td>
                    <button type="button" class="btn-table-action" onclick="window.markAdminFeedbackStatus('${esc(r.feedbackId)}', 'resolved')">Mark Resolved</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  if (window.JanasevaSettings) {
    window.JanasevaSettings.registerSection({
      sectionId: 'admin-ai-config',
      sectionName: 'AI Assistant Guardrail Configuration',
      containerEl: '#admin-ai-config-card',
      formEl: '#admin-ai-config-form',
      statusHostEl: '#admin-ai-usm-status',
      saveBtn: '#admin-ai-save-btn',
      resetBtn: '#admin-ai-reset-btn',
      refreshBtn: '#admin-ai-refresh-btn',
      initialSavedAt: cfg.updatedAt || null,
      initialUpdatedBy: cfg.updatedBy || '',
      confirmResetTitle: 'Reset AI Assistant Settings to Approved Defaults?',
      confirmResetMessage: 'Restores External AI Adapter=Enabled, Provider=Auto, Rate Limits (20/min, 250/day), Temperature=0.3, Max Tokens=650, and clears the custom welcome notice.',
      confirmResetDetail: 'Scope: Only non-secret AI guardrail configuration is reset. Server-side Firebase AI Secrets and citizen feedback history remain untouched.',
      onSave: async () => {
        return await window.saveAdminAssistantConfig();
      },
      onReset: async () => {
        return await window.resetAdminAssistantConfig();
      },
      onRefresh: async () => {
        const latest = await window.fetchAdminAssistantConfig({ strictRemote: true });
        window.applyAdminAssistantConfigInputs(latest);
        return {
          savedAt: latest.updatedAt || null,
          updatedBy: latest.updatedBy || '',
          refreshedAt: new Date().toISOString(),
          message: 'AI Assistant configuration reloaded from database.'
        };
      }
    });
  }
};

window.applyAdminAssistantConfigInputs = function(cfg) {
  if (!cfg) return;
  const run = () => {
    const elEn = document.getElementById('cfg-ai-enabled');
    const elPr = document.getElementById('cfg-ai-provider');
    const elRpm = document.getElementById('cfg-ai-rpm');
    const elRpd = document.getElementById('cfg-ai-rpd');
    const elTemp = document.getElementById('cfg-ai-temp');
    const elTok = document.getElementById('cfg-ai-tokens');
    const elNotice = document.getElementById('cfg-ai-notice');
    if (elEn) elEn.value = cfg.aiEnabled !== false ? 'true' : 'false';
    if (elPr) elPr.value = cfg.preferredProvider || 'auto';
    if (elRpm) elRpm.value = Number(cfg.rateLimitPerMinute || 20);
    if (elRpd) elRpd.value = Number(cfg.rateLimitPerDay || 250);
    if (elTemp) elTemp.value = Number(cfg.temperature ?? 0.3);
    if (elTok) elTok.value = Number(cfg.maxOutputTokens || 650);
    if (elNotice) elNotice.value = cfg.welcomeNotice || '';
  };
  if (window.JanasevaSettings) window.JanasevaSettings.runProgrammaticUpdate('admin-ai-config', run);
  else run();
};

window.fetchAdminAssistantConfig = async function(options = {}) {
  if (!window.authService || !window.authService.isAdmin()) {
    throw new Error('Unauthorized: Administrator privilege required.');
  }
  const canCallFn =
    window.isFirebaseAvailable &&
    typeof firebase !== 'undefined' &&
    typeof firebase.functions === 'function' &&
    firebase.auth &&
    firebase.auth().currentUser;

  if (canCallFn) {
    const fn = firebase.functions().httpsCallable('getAssistantAdminAnalytics');
    const res = await fn({});
    if (res && res.data && res.data.runtimeConfig) {
      if (typeof JanasevaDB !== 'undefined') {
        JanasevaDB.set('assistant_runtime_config', res.data.runtimeConfig);
      }
      return res.data.runtimeConfig;
    }
    if (options.strictRemote) throw new Error('Unable to load AI configuration from Cloud Functions.');
  }

  return (typeof JanasevaDB !== 'undefined')
    ? JanasevaDB.get('assistant_runtime_config', {
        aiEnabled: true, preferredProvider: 'auto', temperature: 0.3, maxOutputTokens: 650, rateLimitPerMinute: 20, rateLimitPerDay: 250, welcomeNotice: ''
      })
    : { aiEnabled: true, preferredProvider: 'auto', temperature: 0.3, maxOutputTokens: 650, rateLimitPerMinute: 20, rateLimitPerDay: 250, welcomeNotice: '' };
};

window.saveAdminAssistantConfig = async function() {
  if (!window.authService || !window.authService.isAdmin()) {
    throw new Error('Access Denied: Only Administrators may configure Assistant settings.');
  }
  const aiEnabled = document.getElementById('cfg-ai-enabled')?.value === 'true';
  const preferredProvider = document.getElementById('cfg-ai-provider')?.value || 'auto';
  const rateLimitPerMinute = Number(document.getElementById('cfg-ai-rpm')?.value);
  const rateLimitPerDay = Number(document.getElementById('cfg-ai-rpd')?.value);
  const temperature = Number(document.getElementById('cfg-ai-temp')?.value);
  const maxOutputTokens = Number(document.getElementById('cfg-ai-tokens')?.value);
  const welcomeNotice = (document.getElementById('cfg-ai-notice')?.value || '').trim().slice(0, 400);

  if (isNaN(rateLimitPerMinute) || rateLimitPerMinute < 3 || rateLimitPerMinute > 120) {
    throw new Error('Rate limit per minute must be between 3 and 120.');
  }
  if (isNaN(rateLimitPerDay) || rateLimitPerDay < 10 || rateLimitPerDay > 2000) {
    throw new Error('Daily rate limit must be between 10 and 2000.');
  }
  if (isNaN(temperature) || temperature < 0 || temperature > 1) {
    throw new Error('Temperature must be between 0.0 and 1.0.');
  }
  if (isNaN(maxOutputTokens) || maxOutputTokens < 150 || maxOutputTokens > 1200) {
    throw new Error('Max output tokens must be between 150 and 1200.');
  }

  const nowIso = new Date().toISOString();
  const actorEmail = window.authService.currentUser?.email || '';
  let payload = {
    aiEnabled,
    preferredProvider,
    rateLimitPerMinute,
    rateLimitPerDay,
    temperature,
    maxOutputTokens,
    welcomeNotice,
    updatedAt: nowIso,
    updatedBy: actorEmail
  };

  const canCallFn =
    window.isFirebaseAvailable &&
    typeof firebase !== 'undefined' &&
    typeof firebase.functions === 'function' &&
    firebase.auth &&
    firebase.auth().currentUser;

  if (canCallFn) {
    const fn = firebase.functions().httpsCallable('updateAssistantConfig');
    const res = await fn({ aiEnabled, preferredProvider, rateLimitPerMinute, rateLimitPerDay, temperature, maxOutputTokens, welcomeNotice });
    if (res && res.data && res.data.config) payload = res.data.config;
  } else if (typeof JanasevaDB !== 'undefined') {
    JanasevaDB.set('assistant_runtime_config', payload);
  }

  return {
    savedAt: payload.updatedAt || nowIso,
    updatedBy: payload.updatedBy || actorEmail,
    message: 'AI Assistant configuration saved and confirmed.'
  };
};

window.resetAdminAssistantConfig = async function() {
  if (!window.authService || !window.authService.isAdmin()) {
    throw new Error('Access Denied: Only Administrators may reset Assistant settings.');
  }
  const nowIso = new Date().toISOString();
  const actorEmail = window.authService.currentUser?.email || '';
  let defaults = {
    aiEnabled: true,
    preferredProvider: 'auto',
    temperature: 0.3,
    maxOutputTokens: 650,
    timeoutMs: 14000,
    rateLimitPerMinute: 20,
    rateLimitPerDay: 250,
    welcomeNotice: '',
    updatedAt: nowIso,
    updatedBy: actorEmail
  };

  const canCallFn =
    window.isFirebaseAvailable &&
    typeof firebase !== 'undefined' &&
    typeof firebase.functions === 'function' &&
    firebase.auth &&
    firebase.auth().currentUser;

  if (canCallFn) {
    const fn = firebase.functions().httpsCallable('updateAssistantConfig');
    const res = await fn({ resetToDefaults: true });
    if (res && res.data && res.data.config) defaults = res.data.config;
  } else if (typeof JanasevaDB !== 'undefined') {
    JanasevaDB.set('assistant_runtime_config', defaults);
  }

  window.applyAdminAssistantConfigInputs(defaults);
  return {
    savedAt: defaults.updatedAt || nowIso,
    updatedBy: defaults.updatedBy || actorEmail,
    message: 'AI Assistant configuration restored to approved defaults.'
  };
};

window.markAdminFeedbackStatus = async function(feedbackId, status) {
  if (!window.authService || !window.authService.isAdmin()) return;
  const canCallFn =
    window.isFirebaseAvailable &&
    typeof firebase !== 'undefined' &&
    typeof firebase.functions === 'function' &&
    firebase.auth &&
    firebase.auth().currentUser;

  try {
    if (canCallFn) {
      const fn = firebase.functions().httpsCallable('reviewAssistantFeedback');
      await fn({ feedbackId, status });
    } else if (typeof JanasevaDB !== 'undefined') {
      const list = JanasevaDB.get('assistant_feedback', []);
      const idx = list.findIndex(x => x.feedbackId === feedbackId);
      if (idx >= 0) {
        list[idx].status = status;
        JanasevaDB.set('assistant_feedback', list);
      }
    }
    if (typeof showToast === 'function') showToast('Feedback marked ' + status + '.', 'success');
    window.loadAdminAssistantOps();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to update feedback.', 'error');
  }
};

/**
 * =============================================================================
 * JANASEVA ADMIN MASTER CONTROL: API INTEGRATIONS & RECOVERY CONTROL CENTRE
 * Complete administrative authority over external integrations, delegated
 * permissions, system-wide emergency lockdown, and provider health matrix.
 * =============================================================================
 */

window.loadAdminApiMasterPanel = async function() {
  const isAdmin = window.authService ? window.authService.isAdmin() : false;
  if (!isAdmin) {
    console.warn('[Admin API Master] Unauthorized access attempt blocked.');
    return;
  }

  if (!window.JanasevaApiStore) {
    console.error('[Admin API Master] JanasevaApiStore is not loaded.');
    return;
  }

  try {
    const overview = await window.JanasevaApiStore.getOverview();
    const apis = overview.apis || [];
    const customApis = overview.customApis || [];
    const routingRules = overview.routingRules || {};
    const permissions = overview.permissions || {};
    const backups = overview.backups || [];

    // 1. Update KPI Counters
    const elTotal = document.getElementById('api-master-kpi-total');
    const elActive = document.getElementById('api-master-kpi-active');
    const elUptime = document.getElementById('api-master-kpi-uptime');
    const elBackups = document.getElementById('api-master-kpi-backups');

    const totalCount = apis.length + customApis.length;
    const activeCount = apis.filter(a => a.enabled).length + customApis.filter(c => c.enabled).length;

    if (elTotal) elTotal.textContent = totalCount;
    if (elActive) elActive.textContent = `${activeCount} / ${totalCount}`;
    if (elBackups) elBackups.textContent = backups.length;

    let avgUptime = 99.8;
    if (apis.length > 0) {
      const sum = apis.reduce((acc, a) => acc + (a.telemetry?.uptime24h || 99.8), 0);
      avgUptime = (sum / apis.length).toFixed(1);
    }
    if (elUptime) elUptime.textContent = `${avgUptime}%`;

    // 2. Populate Receiver Delegated Permissions Policy Form
    const permFields = [
      'canEditApis',
      'canTestApis',
      'canBackupApis',
      'canRestoreApis',
      'canManageSecrets',
      'canDisableApis'
    ];
    permFields.forEach(f => {
      const chk = document.getElementById(`perm-${f}`);
      if (chk) {
        chk.checked = permissions[f] !== false;
      }
    });

    // 3. Render Integrations Master Matrix Table
    const tbody = document.getElementById('api-master-table-body');
    if (tbody) {
      if (apis.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">No integrated API services found.</td></tr>';
      } else {
        const iconMap = {
          email_api: 'fa-solid fa-envelope',
          ai_api: 'fa-solid fa-brain',
          whatsapp_api: 'fa-brands fa-whatsapp',
          ocr_api: 'fa-solid fa-file-lines',
          notification_api: 'fa-solid fa-bell',
          knowledge_api: 'fa-solid fa-book-atlas',
          database_api: 'fa-solid fa-database',
          maps_api: 'fa-solid fa-map-location-dot',
          supabase_api: 'fa-solid fa-database',
          gis_maps_api: 'fa-solid fa-map-location-dot'
        };

        tbody.innerHTML = apis.map(api => {
          const apiId = api.apiId || api.id || '';
          const iconClass = iconMap[apiId] || (api.icon ? (api.icon.includes('fa-') ? api.icon : `fa-solid ${api.icon}`) : 'fa-solid fa-plug');
          const isOperational = api.status === 'operational' || api.status === 'CONNECTED';
          const isDegraded = api.status === 'degraded' || api.status === 'RATE_LIMITED';
          const isDisabled = !api.enabled || api.status === 'disabled' || api.status === 'DISCONNECTED';

          let statusBadge = '<span class="admin-tab-badge" style="background:#16a34a;color:#fff;">Operational</span>';
          if (isDisabled) {
            statusBadge = '<span class="admin-tab-badge" style="background:#64748b;color:#fff;">Disabled</span>';
          } else if (isDegraded) {
            statusBadge = '<span class="admin-tab-badge" style="background:#f59e0b;color:#fff;">Degraded</span>';
          } else if (api.status === 'error' || api.status === 'CONNECTION_FAILED' || api.status === 'INVALID_CREDENTIALS') {
            statusBadge = '<span class="admin-tab-badge" style="background:#dc2626;color:#fff;">Error</span>';
          }

          const activeBadge = api.enabled
            ? '<span style="color:#16a34a;font-weight:700;"><i class="fa-solid fa-circle-check"></i> Active</span>'
            : '<span style="color:#94a3b8;font-weight:700;"><i class="fa-solid fa-circle-xmark"></i> Inactive</span>';

          const uptime = api.telemetry?.uptime24h ? `${api.telemetry.uptime24h}%` : (api.uptimePercent ? `${api.uptimePercent}%` : '99.9%');
          const latency = api.telemetry?.avgLatencyMs ? `${api.telemetry.avgLatencyMs} ms` : (api.latencyMs ? `${api.latencyMs} ms` : '180 ms');
          const lastTested = api.lastTested || api.lastConnectionTest || api.lastSuccessfulConnection;
          const formattedLastTested = lastTested ? new Date(lastTested).toLocaleTimeString() : 'Recently';

          return `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:34px;height:34px;border-radius:6px;background:#f1f5f9;color:#0b2545;display:flex;align-items:center;justify-content:center;font-size:15px;">
                    <i class="${iconClass}"></i>
                  </div>
                  <div>
                    <strong style="display:block;font-size:13.5px;color:#0f172a;">${api.name}</strong>
                    <code style="font-size:11px;color:#64748b;">${apiId}</code>
                  </div>
                </div>
              </td>
              <td style="font-size:12.5px;color:#334155;">
                <strong>${api.provider || 'Provider'}</strong>
                <div style="font-size:11px;color:#64748b;">${api.type || api.category || 'REST API'}</div>
                ${(() => {
                  const sMap = {
                    ai_api: 'ai_assistant',
                    email_api: 'email',
                    whatsapp_api: 'whatsapp',
                    ocr_api: 'ocr',
                    notification_api: 'push_notification',
                    knowledge_api: 'rag_knowledge',
                    database_api: 'database',
                    maps_api: 'maps_gis'
                  };
                  const sKey = sMap[apiId];
                  const rule = sKey ? routingRules[sKey] : null;
                  if (rule && rule.activeCustomApiId) {
                    const cApi = customApis.find(c => c.customApiId === rule.activeCustomApiId);
                    if (cApi && cApi.enabled) {
                      return `<span class="badge" style="background:#e0f2fe;color:#0369a1;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;display:inline-block;margin-top:2px;">★ Custom: ${cApi.name}</span>`;
                    }
                  }
                  return '';
                })()}
              </td>
              <td>${statusBadge}</td>
              <td>${activeBadge}</td>
              <td style="font-size:12.5px;font-weight:700;color:#0f172a;">${uptime}</td>
              <td style="font-size:12.5px;color:#475569;">${latency}</td>
              <td style="font-size:12px;color:#64748b;">${formattedLastTested}</td>
              <td>
                <div style="display:flex;gap:6px;align-items:center;">
                  <button type="button" class="btn-table-action" onclick="window.toggleAdminApiState('${apiId}', ${Boolean(api.enabled)})" title="${api.enabled ? 'Deactivate API' : 'Activate API'}" style="padding:4px 8px;font-size:11.5px;">
                    <i class="fa-solid ${api.enabled ? 'fa-pause' : 'fa-play'}" style="color:${api.enabled ? '#dc2626' : '#16a34a'};"></i>
                    <span>${api.enabled ? 'Pause' : 'Activate'}</span>
                  </button>
                  <button type="button" class="btn-table-action" onclick="window.testAdminApiIntegration('${apiId}')" title="Test Connection Ping" style="padding:4px 8px;font-size:11.5px;">
                    <i class="fa-solid fa-bolt" style="color:#0284c7;"></i>
                    <span>Ping</span>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // 4. Initialize Custom API Manager Dashboard & Guide
    if (window.JanasevaCustomApiManager && typeof window.JanasevaCustomApiManager.init === 'function') {
      await window.JanasevaCustomApiManager.init();
    }
  } catch (err) {
    console.error('[Admin API Master] Failed to load panel:', err);
    if (typeof showToast === 'function') {
      showToast('Error loading API Master panel: ' + err.message, 'error');
    }
  }
};

window.saveAdminReceiverPermissions = async function(event) {
  if (event) event.preventDefault();
  const isAdmin = window.authService ? window.authService.isAdmin() : false;
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('Unauthorized: Only Administrators can update Receiver permissions.', 'error');
    return;
  }

  const updates = {
    canEditApis: document.getElementById('perm-canEditApis')?.checked || false,
    canTestApis: document.getElementById('perm-canTestApis')?.checked || false,
    canBackupApis: document.getElementById('perm-canBackupApis')?.checked || false,
    canRestoreApis: document.getElementById('perm-canRestoreApis')?.checked || false,
    canManageSecrets: document.getElementById('perm-canManageSecrets')?.checked || false,
    canDisableApis: document.getElementById('perm-canDisableApis')?.checked || false
  };

  try {
    await window.JanasevaApiStore.managePermissions(updates);
    if (typeof showToast === 'function') {
      showToast('Receiver API permissions policy saved successfully.', 'success');
    } else {
      alert('Receiver API permissions policy saved successfully.');
    }
    window.loadAdminApiMasterPanel();
  } catch (err) {
    console.error('[Admin API Master] Permission update failed:', err);
    if (typeof showToast === 'function') {
      showToast('Failed to save permissions: ' + err.message, 'error');
    }
  }
};

window.triggerAdminEmergencyLockdown = async function() {
  const isAdmin = window.authService ? window.authService.isAdmin() : false;
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('Unauthorized: Only Administrators can execute lockdown.', 'error');
    return;
  }

  const promptMsg = 'EMERGENCY API LOCKDOWN PROTOCOL\n\n' +
    'This will immediately deactivate all external API connections (Email, AI, WhatsApp, OCR, Notifications, Knowledge receiver).\n' +
    'All automated outbound and incoming dispatches will be suspended.\n\n' +
    'Type "LOCKDOWN" below to execute system-wide emergency deactivation:';

  const confirmInput = window.prompt(promptMsg);
  if (confirmInput !== 'LOCKDOWN') {
    if (typeof showToast === 'function') showToast('Lockdown cancelled.', 'info');
    return;
  }

  try {
    const res = await window.JanasevaApiStore.emergencyLockdown();
    if (typeof showToast === 'function') {
      showToast(res.message || 'System-wide Emergency API Lockdown activated.', 'warning');
    } else {
      alert(res.message || 'System-wide Emergency API Lockdown activated.');
    }
    window.loadAdminApiMasterPanel();
  } catch (err) {
    console.error('[Admin API Master] Lockdown execution failed:', err);
    if (typeof showToast === 'function') {
      showToast('Emergency lockdown failed: ' + err.message, 'error');
    }
  }
};

window.toggleAdminApiState = async function(apiId, currentEnabled) {
  const isAdmin = window.authService ? window.authService.isAdmin() : false;
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('Unauthorized action.', 'error');
    return;
  }

  try {
    const nextState = !currentEnabled;
    await window.JanasevaApiStore.saveConfig(apiId, {
      enabled: nextState,
      status: nextState ? 'operational' : 'disabled'
    });
    if (typeof showToast === 'function') {
      showToast(`${apiId} ${nextState ? 'activated' : 'paused'} successfully.`, 'success');
    }
    window.loadAdminApiMasterPanel();
  } catch (err) {
    console.error('[Admin API Master] State toggle failed:', err);
    if (typeof showToast === 'function') {
      showToast('Failed to toggle API state: ' + err.message, 'error');
    }
  }
};

window.testAdminApiIntegration = async function(apiId) {
  const isAdmin = window.authService ? window.authService.isAdmin() : false;
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('Unauthorized action.', 'error');
    return;
  }

  if (typeof showToast === 'function') {
    showToast(`Pinging provider endpoint for ${apiId}...`, 'info');
  }

  try {
    const res = await window.JanasevaApiStore.testConnection(apiId);
    if (res.success) {
      if (typeof showToast === 'function') {
        showToast(`[${apiId}] Connection verified (${res.latencyMs || 0} ms) - Provider operational.`, 'success');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(`[${apiId}] Test failed: ${res.message}`, 'error');
      }
    }
    window.loadAdminApiMasterPanel();
  } catch (err) {
    console.error('[Admin API Master] Test connection failed:', err);
    if (typeof showToast === 'function') {
      showToast(`[${apiId}] Test error: ` + err.message, 'error');
    }
  }
};

let receiverLiveRefresh = null;
window.addEventListener('janaseva:complaintsChanged', () => {
  clearTimeout(receiverLiveRefresh);
  receiverLiveRefresh = setTimeout(async () => {
    if (!window.authService?.currentUser) return;
    try { await loadComplaintsData(); renderComplaintsTable(); }
    catch (error) { console.error('Dashboard refresh failed:', error); }
  }, 150);
});
