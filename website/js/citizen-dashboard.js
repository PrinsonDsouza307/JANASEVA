/**
 * JANASEVA – Citizen Personal Grievance History, Work Tracking & Delete Management
 * Enforces strict PII isolation: citizens can only query and view their own records.
 * Features:
 * 1. 6 Status Summary Cards + Work Progress Summary with exact (Resolved/Total)*100 calculation
 * 2. Detailed 10-column Complaint History Table with search, category/status/date filters, sorting & pagination
 * 3. Real-time Verified Work Progress Bar & Details (synced from Receiver updates)
 * 4. Chronological Activity Timeline displaying every database-recorded audit event
 * 5. Citizen Soft-Delete Confirmation & Deleted Complaints Archive with Restore
 * 6. Personal Complaint Report & Analytics with Category Distribution & Monthly Trend
 */

let myComplaints = [];
let myDeletedComplaints = [];
let activeCitizenFilter = 'all';
let currentActiveCitizenComplaint = null;
let pendingDeleteComplaintId = null;
let selectedStarRating = 5;
let currentCitizenPage = 1;
const CITIZEN_PAGE_SIZE = 10;

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.authService) return;
  const user = await window.authService.waitForAuth();
  if (!user) {
    window.location.replace('login.html?redirect=citizen-dashboard.html');
    return;
  }

  const titleEl = document.getElementById('cit-welcome-title');
  const subEl = document.getElementById('cit-welcome-sub');
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-id-card-clip"></i> MY COMPLAINTS &amp; HISTORY`;
  }
  if (subEl) {
    subEl.innerText = `Personal grievance history, work tracking, and status timeline for ${user.name || 'Citizen'} (${user.email}). Strictly private to your account.`;
  }

  await loadMyComplaints();
  wireCitizenSearchAndFilters();
  initCitizenPreferencesUSM();
});

window.addEventListener('janaseva:mongoReady', () => {
  loadMyComplaints();
});

/**
 * Load Active & Soft-Deleted Complaints for Authenticated Citizen Only
 */
async function loadMyComplaints() {
  const user = window.authService?.currentUser;
  if (!user) return;

  const userUid = user.uid;
  const userEmail = (user.email || '').toLowerCase();

  const localComplaints = typeof JanasevaDB !== 'undefined' ? JanasevaDB.get('complaints', []) : [];
  let userItems = localComplaints.filter(c => isComplaintOwnedByUser(c, userUid, userEmail));

  // Query live grievances directly from MongoDB Atlas
  if (window.JanasevaMongoDB) {
    try {
      if (typeof window.JanasevaMongoDB.ready === 'function') {
        await window.JanasevaMongoDB.ready();
      }
      let mongoItems = [];
      if (userEmail) {
        mongoItems = await window.JanasevaMongoDB.getComplaints({ citizenEmail: userEmail });
      }
      if (!mongoItems || mongoItems.length === 0) {
        mongoItems = await window.JanasevaMongoDB.getComplaints({ userId: userUid });
      }
      if (mongoItems && mongoItems.length > 0) {
        const itemMap = new Map();
        userItems.forEach(c => itemMap.set(c.complaintId, c));
        mongoItems.forEach(c => itemMap.set(c.complaintId, c));
        userItems = Array.from(itemMap.values());
      }
    } catch (e) {
      console.warn("MongoDB citizen query notice:", e);
    }
  }

  // Fetch updates from ComplaintStorageManager / Firestore for hydration of workProgress & soft-delete state
  let citizenUpdates = [];
  if (window.complaintStorageManager) {
    try {
      citizenUpdates = await window.complaintStorageManager.getAllComplaintUpdates();
    } catch (e) {
      console.warn("Load complaint updates warning:", e);
    }
  }

  // Also check Firestore complaint_updates directly for this citizen email if cloud sync is active
  if (window.isFirebaseAvailable && window.fbDb && userEmail) {
    try {
      const updSnap = await window.fbDb.collection('complaint_updates').where('citizenEmail', '==', userEmail).get();
      if (!updSnap.empty) {
        const cloudUpds = updSnap.docs.map(d => d.data());
        const map = new Map();
        citizenUpdates.forEach(u => map.set(u.updateId, u));
        cloudUpds.forEach(u => map.set(u.updateId, u));
        citizenUpdates = Array.from(map.values());
      }
    } catch (e) {
      console.warn("Firestore citizen updates query warning:", e);
    }
  }

  // Hydrate recycle_bin soft-deleted items for this citizen
  let localBin = [];
  if (window.complaintStorageManager) {
    localBin = await window.complaintStorageManager.getRecycleBinItems({ citizenUid: userUid, citizenEmail: userEmail });
  } else if (typeof JanasevaDB !== 'undefined') {
    const allBin = JanasevaDB.get('recycle_bin', []);
    localBin = allBin.filter(b => b.complaintData && isComplaintOwnedByUser(b.complaintData, userUid, userEmail));
  }

  const activeList = [];
  const deletedList = [];
  const binIdSet = new Set(localBin.map(b => b.complaintId));

  // Hydrate each item with workProgress & classify active vs soft-deleted
  for (const item of userItems) {
    const cid = item.complaintId || item.id;
    const itemUpdates = citizenUpdates.filter(u => u.complaintId === cid);

    // Hydrate latest workProgress from updates if not present locally
    if (window.complaintStorageManager) {
      const latestWp = window.complaintStorageManager.extractWorkProgressFromUpdates(itemUpdates);
      if (latestWp && (!item.workProgress || new Date(latestWp.lastUpdatedISO || 0) >= new Date(item.workProgress.lastUpdatedISO || 0))) {
        item.workProgress = latestWp;
      }

      const softDeleteState = window.complaintStorageManager.getCitizenSoftDeleteState(itemUpdates);
      if (softDeleteState.isDeleted || item.deletedByCitizen || binIdSet.has(cid)) {
        // Put in deletedList if not already represented in localBin
        if (!binIdSet.has(cid)) {
          deletedList.push({
            recycleId: 'soft-' + cid,
            complaintId: cid,
            complaintData: item,
            deletedAt: softDeleteState.deletedAt || item.deletedAt || new Date().toISOString(),
            formattedDeletedAt: softDeleteState.formattedDeletedAt || formatDisplayDate(softDeleteState.deletedAt || item.deletedAt),
            reason: softDeleteState.reason || item.deletionReason || 'Moved to Deleted History',
            deletedBy: softDeleteState.deletedBy || user.email,
            deletedByRole: softDeleteState.deletedByRole || 'citizen'
          });
        }
        continue;
      }
    }

    activeList.push(item);
  }

  // Merge local recycle bin items owned by this citizen
  for (const binItem of localBin) {
    const cid = binItem.complaintId;
    if (!deletedList.some(d => d.complaintId === cid)) {
      deletedList.push(binItem);
    }
  }

  myComplaints = activeList;
  myDeletedComplaints = deletedList;

  syncCategoryDropdownOptions();
  updateCitizenStats();
  updateWorkProgressSummary();
  renderCitizenTable();
  renderDeletedComplaintsTable();
  renderCitizenReport();

  if (user && user.uid) checkOfflineQueue(user.uid);
}

function isComplaintOwnedByUser(c, userUid, userEmail) {
  if (!c) return false;
  return (c.userId && c.userId === userUid) ||
         (c.citizenUid && c.citizenUid === userUid) ||
         (c.citizenEmail && c.citizenEmail.toLowerCase() === userEmail);
}

/**
 * Compute 6 Citizen Status Counters (Excludes Deleted Complaints)
 */
function updateCitizenStats() {
  let counts = {
    total: myComplaints.length,
    pending: 0,
    inprogress: 0,
    resolved: 0,
    rejected: 0,
    reopened: 0
  };

  myComplaints.forEach(item => {
    const s = (item.status || '').toLowerCase().trim();
    if (s === 'submitted' || s === 'assigned' || s === 'under review' || s === 'pending' || s === 'received') {
      counts.pending++;
    } else if (s === 'in progress' || s === 'action taken') {
      counts.inprogress++;
    } else if (s === 'resolved') {
      counts.resolved++;
    } else if (s === 'rejected') {
      counts.rejected++;
    } else if (s === 'reopened') {
      counts.reopened++;
    }
  });

  const elTotal = document.getElementById('cit-stat-total');
  const elPend = document.getElementById('cit-stat-pending');
  const elInp = document.getElementById('cit-stat-inprogress');
  const elRes = document.getElementById('cit-stat-resolved');
  const elRej = document.getElementById('cit-stat-rejected');
  const elReo = document.getElementById('cit-stat-reopened');

  if (elTotal) elTotal.innerText = counts.total;
  if (elPend) elPend.innerText = counts.pending;
  if (elInp) elInp.innerText = counts.inprogress;
  if (elRes) elRes.innerText = counts.resolved;
  if (elRej) elRej.innerText = counts.rejected;
  if (elReo) elReo.innerText = counts.reopened;

  const activeTabCount = document.getElementById('cit-active-tab-count');
  const deletedTabCount = document.getElementById('cit-deleted-tab-count');
  if (activeTabCount) activeTabCount.innerText = myComplaints.length;
  if (deletedTabCount) deletedTabCount.innerText = myDeletedComplaints.length;
}

/**
 * Compute & Render Work Progress Summary Card
 * Exact Formula: (Resolved Complaints / Total Complaints) * 100
 * Excludes deleted or invalid complaints
 */
function updateWorkProgressSummary() {
  const validComplaints = myComplaints.filter(c => c && c.complaintId && (c.status || '').toLowerCase() !== 'invalid');
  const totalSubmitted = validComplaints.length;

  let completed = 0;
  let processing = 0;
  let awaiting = 0;

  validComplaints.forEach(item => {
    const s = (item.status || '').toLowerCase().trim();
    if (s === 'resolved') {
      completed++;
    } else if (s === 'in progress' || s === 'action taken' || s === 'reopened') {
      processing++;
    } else if (s === 'submitted' || s === 'assigned' || s === 'under review' || s === 'pending' || s === 'received') {
      awaiting++;
    }
  });

  const resolutionPercentage = totalSubmitted > 0 ? Math.round((completed / totalSubmitted) * 100) : 0;

  const elRate = document.getElementById('wp-overall-resolution-rate');
  const elBar = document.getElementById('wp-overall-progress-bar');
  const elDesc = document.getElementById('wp-progress-status-desc');
  const elSub = document.getElementById('wp-metric-submitted');
  const elComp = document.getElementById('wp-metric-completed');
  const elProc = document.getElementById('wp-metric-processing');
  const elAwait = document.getElementById('wp-metric-awaiting');

  const setMetricWithPulse = (el, val) => {
    if (!el) return;
    const strVal = String(val);
    if (el.innerText !== strVal) {
      el.innerText = strVal;
      el.classList.remove('wp-value-updated');
      void el.offsetWidth;
      el.classList.add('wp-value-updated');
    }
  };

  setMetricWithPulse(elRate, `${resolutionPercentage}%`);
  if (elBar) elBar.style.width = `${resolutionPercentage}%`;
  setMetricWithPulse(elSub, totalSubmitted);
  setMetricWithPulse(elComp, completed);
  setMetricWithPulse(elProc, processing);
  setMetricWithPulse(elAwait, awaiting);

  if (elDesc) {
    if (totalSubmitted === 0) elDesc.innerText = 'No active grievances submitted yet.';
    else if (resolutionPercentage === 100) elDesc.innerText = 'All filed grievances resolved & verified!';
    else elDesc.innerText = `${completed} of ${totalSubmitted} active grievances resolved (${resolutionPercentage}%)`;
  }
}

/**
 * Switch Dashboard Views (Active / Deleted / Report)
 */
window.switchCitizenTab = function(tabName) {
  const views = {
    active: document.getElementById('citizen-active-view'),
    deleted: document.getElementById('citizen-deleted-view'),
    report: document.getElementById('citizen-report-view'),
    preferences: document.getElementById('citizen-preferences-view')
  };
  const btns = {
    active: document.getElementById('tab-btn-active'),
    deleted: document.getElementById('tab-btn-deleted'),
    report: document.getElementById('tab-btn-report'),
    preferences: document.getElementById('tab-btn-preferences')
  };

  Object.keys(views).forEach(k => {
    const isActive = k === tabName;
    if (views[k]) views[k].style.display = isActive ? 'block' : 'none';
    if (btns[k]) {
      btns[k].classList.toggle('active', isActive);
      btns[k].setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
  });

  if (tabName === 'deleted') renderDeletedComplaintsTable();
  if (tabName === 'report') renderCitizenReport();
  if (tabName === 'preferences') {
    initCitizenPreferencesUSM();
  }
};

/**
 * Wire Search, Category, Status, Date & Sort Listeners
 */
function wireCitizenSearchAndFilters() {
  const inputs = ['cit-search-input', 'cit-category-filter', 'cit-status-filter', 'cit-date-from', 'cit-date-to', 'cit-sort-select'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === 'INPUT' && el.type === 'text' ? 'input' : 'change';
    el.addEventListener(evt, () => {
      if (id === 'cit-status-filter') {
        activeCitizenFilter = el.value || 'all';
        syncCitizenFilterCards(activeCitizenFilter);
      }
      currentCitizenPage = 1;
      renderCitizenTable();
    });
  });
}

function syncCategoryDropdownOptions() {
  const catEl = document.getElementById('cit-category-filter');
  if (!catEl) return;
  const currentVal = catEl.value;
  const existingVals = new Set(Array.from(catEl.options).map(o => o.value.toLowerCase()));
  myComplaints.forEach(item => {
    const cat = (item.category || '').trim();
    if (cat && !existingVals.has(cat.toLowerCase())) {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catEl.appendChild(opt);
      existingVals.add(cat.toLowerCase());
    }
  });
  catEl.value = currentVal;
}

window.clearCitizenFilters = function() {
  const searchEl = document.getElementById('cit-search-input');
  const catEl = document.getElementById('cit-category-filter');
  const statusEl = document.getElementById('cit-status-filter');
  const fromEl = document.getElementById('cit-date-from');
  const toEl = document.getElementById('cit-date-to');
  const sortEl = document.getElementById('cit-sort-select');

  if (searchEl) searchEl.value = '';
  if (catEl) catEl.value = '';
  if (statusEl) statusEl.value = '';
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';
  if (sortEl) sortEl.value = 'newest';

  activeCitizenFilter = 'all';
  currentCitizenPage = 1;
  syncCitizenFilterCards('all');
  renderCitizenTable();
};

/**
 * Filter from 6 Summary Stat Cards
 */
window.filterCitizenGrievances = function(filterStatus, cardEl) {
  switchCitizenTab('active');
  activeCitizenFilter = filterStatus;
  const statusFilter = document.getElementById('cit-status-filter');
  if (statusFilter) {
    statusFilter.value = (filterStatus === 'all' || filterStatus === 'Pending') ? '' : filterStatus;
  }
  currentCitizenPage = 1;
  syncCitizenFilterCards(filterStatus);
  renderCitizenTable();
};

function syncCitizenFilterCards(status) {
  document.querySelectorAll('.stat-panel-card').forEach(c => {
    const s = c.getAttribute('data-filter');
    if (s === status) c.classList.add('active-filter');
    else c.classList.remove('active-filter');
  });
}

/**
 * Helper: Parse Timestamp for Sorting & Filtering
 */
function parseItemTime(item) {
  const raw = item.submissionTimestamp || item.createdAt || item.submissionDate || 0;
  const parsed = new Date(raw).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

function formatCompactDateCell(rawDate) {
  const str = String(rawDate || 'N/A').trim();
  if (!str || str === 'N/A') return '<span class="cit-date-primary">N/A</span>';
  const parts = str.split(',');
  if (parts.length >= 2) {
    return `<div class="cit-date-stack"><span class="cit-date-primary">${escapeHtml(parts[0].trim())}</span><span class="cit-date-secondary">${escapeHtml(parts.slice(1).join(',').trim())}</span></div>`;
  }
  return `<span class="cit-date-primary">${escapeHtml(str)}</span>`;
}

function buildCitizenActionsHTML(item, cid, includeLabels) {
  const isResolved = (item.status || '').toLowerCase() === 'resolved';
  const isRejected = (item.status || '').toLowerCase() === 'rejected';
  const hasFeedback = !!item.citizenFeedback;
  const canReopen = ((window.janasevaStatusManager && window.janasevaStatusManager.getAllowedTransitions(item.status, 'citizen').some(t => t.targetId === 'reopened')) || isResolved || isRejected);

  return `
    <button type="button" class="cit-action-btn cit-btn-view" onclick="openCitizenModal('${cid}')" title="View Complaint Details, Timeline & Work Progress">
      <i class="fa-solid fa-eye"></i><span>View</span>
    </button>
    <a href="track.html?id=${encodeURIComponent(cid)}" class="cit-action-btn cit-btn-track" title="Track Live Status & Timeline" style="text-decoration:none;">
      <i class="fa-solid fa-location-crosshairs"></i><span>Track</span>
    </a>
    <button type="button" class="${includeLabels ? 'cit-action-btn cit-btn-icon' : 'cit-btn-icon'}" onclick="downloadCitizenReceipt('${cid}')" title="Download Acknowledgement Slip" aria-label="Download Acknowledgement Slip"${includeLabels ? ' style="width:auto; padding:0 10px;"' : ''}>
      <i class="fa-solid fa-file-arrow-down"></i>${includeLabels ? '<span>Slip</span>' : ''}
    </button>
    ${isResolved && !hasFeedback ? `
      <button type="button" class="${includeLabels ? 'cit-action-btn cit-btn-icon cit-btn-icon--feedback' : 'cit-btn-icon cit-btn-icon--feedback'}" onclick="openFeedbackModal('${cid}')" title="Submit Resolution Feedback" aria-label="Submit Resolution Feedback"${includeLabels ? ' style="width:auto; padding:0 10px;"' : ''}>
        <i class="fa-solid fa-star"></i>${includeLabels ? '<span>Rate</span>' : ''}
      </button>
    ` : ''}
    ${canReopen ? `
      <button type="button" class="${includeLabels ? 'cit-action-btn cit-btn-icon cit-btn-icon--reopen' : 'cit-btn-icon cit-btn-icon--reopen'}" onclick="openReopenModal('${cid}')" title="Request Reopening" aria-label="Request Reopening"${includeLabels ? ' style="width:auto; padding:0 10px;"' : ''}>
        <i class="fa-solid fa-rotate-left"></i>${includeLabels ? '<span>Reopen</span>' : ''}
      </button>
    ` : ''}
    <button type="button" class="cit-action-btn cit-btn-delete" onclick="deleteCitizenComplaint('${cid}')" title="Move to Deleted Complaints">
      <i class="fa-solid fa-trash-can"></i><span>Delete</span>
    </button>
  `;
}

/**
 * Render Complete 10-Column Complaint History Table & Mobile Cards with Pagination
 */
function renderCitizenTable() {
  const tbody = document.getElementById('citizen-table-body');
  const mobileWrap = document.getElementById('citizen-mobile-cards');
  const countEl = document.getElementById('cit-record-count');
  if (!tbody) return;

  const q = (document.getElementById('cit-search-input')?.value || '').trim().toLowerCase();
  const catFilter = (document.getElementById('cit-category-filter')?.value || '').trim().toLowerCase();
  const dateFrom = document.getElementById('cit-date-from')?.value || '';
  const dateTo = document.getElementById('cit-date-to')?.value || '';
  const sortMode = document.getElementById('cit-sort-select')?.value || 'newest';

  let filtered = myComplaints.filter(item => {
    // 1. Status filter
    if (activeCitizenFilter !== 'all') {
      const s = (item.status || '').toLowerCase().trim();
      if (activeCitizenFilter === 'Pending') {
        if (!['submitted', 'assigned', 'under review', 'pending', 'received'].includes(s)) return false;
      } else if (activeCitizenFilter === 'In Progress') {
        if (s !== 'in progress' && s !== 'action taken') return false;
      } else if (s !== activeCitizenFilter.toLowerCase()) {
        return false;
      }
    }

    // 2. Category filter
    if (catFilter) {
      if ((item.category || '').toLowerCase() !== catFilter) return false;
    }

    // 3. Date range filter
    if (dateFrom || dateTo) {
      const itemTime = parseItemTime(item);
      if (dateFrom && itemTime < new Date(dateFrom).setHours(0, 0, 0, 0)) return false;
      if (dateTo && itemTime > new Date(dateTo).setHours(23, 59, 59, 999)) return false;
    }

    // 4. Search query (ID, title/subject, category, location, description/remarks, receiver)
    if (q) {
      const matchId = (item.complaintId || '').toLowerCase().includes(q);
      const matchSub = (item.subject || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      const matchLoc = (item.panchayatName || item.location || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchRem = (item.receiverResponse || item.resolutionRemarks || '').toLowerCase().includes(q);
      const matchRec = (item.assignedReceiverName || '').toLowerCase().includes(q);
      if (!matchId && !matchSub && !matchCat && !matchLoc && !matchDesc && !matchRem && !matchRec) return false;
    }

    return true;
  });

  // Sort results
  filtered.sort((a, b) => {
    if (sortMode === 'oldest') return parseItemTime(a) - parseItemTime(b);
    if (sortMode === 'progress_high') return (Number(b.workProgress?.percentage || 0)) - (Number(a.workProgress?.percentage || 0));
    if (sortMode === 'progress_low') return (Number(a.workProgress?.percentage || 0)) - (Number(b.workProgress?.percentage || 0));
    return parseItemTime(b) - parseItemTime(a); // default newest first
  });

  const totalFiltered = filtered.length;
  if (countEl) countEl.innerText = `${totalFiltered} Grievance${totalFiltered === 1 ? '' : 's'} Found`;

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(totalFiltered / CITIZEN_PAGE_SIZE));
  if (currentCitizenPage > totalPages) currentCitizenPage = totalPages;
  const startIdx = (currentCitizenPage - 1) * CITIZEN_PAGE_SIZE;
  const paged = filtered.slice(startIdx, startIdx + CITIZEN_PAGE_SIZE);

  renderPaginationControls(totalFiltered, totalPages, startIdx, paged.length);

  if (paged.length === 0) {
    const isTotallyEmpty = (myComplaints.length === 0);
    const emptyTitle = isTotallyEmpty ? 'No complaints submitted yet.' : 'No grievances found matching your current filters';
    const emptySubtext = isTotallyEmpty 
      ? 'You have not registered any civic grievances yet. Click below to submit your first complaint to your Gram Panchayat.'
      : 'Try adjusting your search or filter criteria, or file a new grievance.';

    const emptyMarkup = `
      <div style="text-align: center; padding: 24px 16px; color: #64748b;">
        <div style="width: 56px; height: 56px; margin: 0 auto 12px; border-radius: 50%; background: #eff6ff; color: #0f56b3; display: flex; align-items: center; justify-content: center; font-size: 24px;">
          <i class="fa-solid fa-folder-open"></i>
        </div>
        <div style="font-size: 15px; font-weight: 800; color: #0b2545; margin-bottom: 4px;">${emptyTitle}</div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 14px;">${emptySubtext}</div>
        <div style="display: inline-flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
          ${!isTotallyEmpty ? '<button type="button" class="cit-clear-btn" onclick="clearCitizenFilters()"><i class="fa-solid fa-rotate-left"></i> Reset Filters</button>' : ''}
          <a href="complaint.html" class="cit-new-grievance-btn"><i class="fa-solid fa-plus"></i> Submit New Grievance</a>
        </div>
      </div>
    `;
    tbody.innerHTML = `<tr><td colspan="10" style="padding: 0;">${emptyMarkup}</td></tr>`;
    if (mobileWrap) mobileWrap.innerHTML = `<div style="grid-column: 1 / -1; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px;">${emptyMarkup}</div>`;
    return;
  }

  const getWpInfo = (item) => {
    const wp = item.workProgress || {};
    const wpPct = Number(wp.percentage || 0);
    const wpStage = wp.stage || getWorkStageLabel(wpPct);
    const wpColor = wpPct >= 100 ? '#16a34a' : (wpPct >= 51 ? '#0f56b3' : (wpPct >= 26 ? '#ea580c' : '#64748b'));
    return { wpPct, wpStage, wpColor };
  };

  const getStatusHTML = (status) => window.janasevaStatusManager
    ? window.janasevaStatusManager.getStatusBadgeHTML(status)
    : `<span class="status-badge-pill ${getStatusBadgeClass(status)}">${escapeHtml(status)}</span>`;

  tbody.innerHTML = paged.map(item => {
    const cid = item.complaintId || item.id;
    const { wpPct, wpStage, wpColor } = getWpInfo(item);
    const receiverDisplay = item.assignedReceiverName || 'Gram Panchayat Desk';
    const submittedDisplay = item.createdAt || item.submissionDate || 'N/A';
    const lastUpdatedDisplay = item.updatedAt || item.lastUpdatedDate || submittedDisplay;
    const locationDisplay = item.panchayatName || item.location || item.panchayatId || 'N/A';

    return `
      <tr>
        <td class="cit-col-id">
          <span class="table-id-tag" style="cursor: pointer;" onclick="openCitizenModal('${cid}')">${escapeHtml(cid)}</span>
        </td>
        <td class="cit-col-subject">
          <div class="cit-subject-link" onclick="openCitizenModal('${cid}')" title="${escapeHtml(item.subject || item.category)}">
            ${escapeHtml(item.subject || item.category)}
          </div>
        </td>
        <td class="cit-col-category">
          <span style="font-size: 12px; color: #475569; font-weight: 600;">${escapeHtml(item.category || 'General')}</span>
        </td>
        <td class="cit-col-location">
          <span style="font-weight: 600; color: #334155; font-size: 12.5px;">${escapeHtml(locationDisplay)}</span>
        </td>
        <td class="cit-col-date">
          ${formatCompactDateCell(submittedDisplay)}
        </td>
        <td class="cit-col-receiver">
          <span style="font-size: 12px; color: #0b2545; font-weight: 600; line-height: 1.35; display: inline-block;">
            <i class="fa-solid fa-user-tie" style="color: #0f56b3; font-size: 11px; margin-right: 3px;"></i>${escapeHtml(receiverDisplay)}
          </span>
        </td>
        <td class="cit-col-status">
          ${getStatusHTML(item.status)}
        </td>
        <td class="cit-col-progress">
          <div class="cit-wp-cell">
            <div class="cit-wp-top" style="color: ${wpColor};">
              <span class="cit-wp-stage-text" title="${escapeHtml(wpStage)}">${escapeHtml(wpStage)}</span>
              <span>${wpPct}%</span>
            </div>
            <div class="cit-wp-track">
              <div class="cit-wp-fill" style="background: ${wpColor}; width: ${wpPct}%;"></div>
            </div>
          </div>
        </td>
        <td class="cit-col-date">
          ${formatCompactDateCell(lastUpdatedDisplay)}
        </td>
        <td class="cit-col-actions">
          <div class="cit-action-group">
            ${buildCitizenActionsHTML(item, cid, false)}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (mobileWrap) {
    mobileWrap.innerHTML = paged.map(item => {
      const cid = item.complaintId || item.id;
      const { wpPct, wpStage, wpColor } = getWpInfo(item);
      const receiverDisplay = item.assignedReceiverName || 'Gram Panchayat Desk';
      const submittedDisplay = item.createdAt || item.submissionDate || 'N/A';
      const lastUpdatedDisplay = item.updatedAt || item.lastUpdatedDate || submittedDisplay;
      const locationDisplay = item.panchayatName || item.location || item.panchayatId || 'N/A';

      return `
        <article class="cit-mobile-card">
          <div class="cit-mobile-card-head">
            <span class="table-id-tag" style="cursor: pointer;" onclick="openCitizenModal('${cid}')">${escapeHtml(cid)}</span>
            ${getStatusHTML(item.status)}
          </div>
          <h3 class="cit-mobile-card-title" onclick="openCitizenModal('${cid}')">${escapeHtml(item.subject || item.category)}</h3>
          <div class="cit-mobile-meta-grid">
            <div class="cit-mobile-meta-item">
              <span class="cit-mobile-meta-lbl">Category</span>
              <span class="cit-mobile-meta-val">${escapeHtml(item.category || 'General')}</span>
            </div>
            <div class="cit-mobile-meta-item">
              <span class="cit-mobile-meta-lbl">Location</span>
              <span class="cit-mobile-meta-val">${escapeHtml(locationDisplay)}</span>
            </div>
          </div>
          <div>
            <div class="cit-wp-top" style="color: ${wpColor};">
              <span>${escapeHtml(wpStage)}</span>
              <span>${wpPct}%</span>
            </div>
            <div class="cit-wp-track">
              <div class="cit-wp-fill" style="background: ${wpColor}; width: ${wpPct}%;"></div>
            </div>
          </div>
          <details class="cit-mobile-details">
            <summary><i class="fa-solid fa-chevron-down"></i> Official &amp; Timeline Details</summary>
            <div class="cit-mobile-details-body">
              <div><strong>Submitted:</strong> ${escapeHtml(submittedDisplay)}</div>
              <div><strong>Assigned Receiver:</strong> ${escapeHtml(receiverDisplay)}</div>
              <div><strong>Last Updated:</strong> ${escapeHtml(lastUpdatedDisplay)}</div>
            </div>
          </details>
          <div class="cit-mobile-card-actions">
            ${buildCitizenActionsHTML(item, cid, true)}
          </div>
        </article>
      `;
    }).join('');
  }

  if (window.janasevaTranslator) {
    window.janasevaTranslator.applyTranslations();
  }
}

function renderPaginationControls(totalFiltered, totalPages, startIdx, shownCount) {
  const infoEl = document.getElementById('cit-pagination-info');
  const btnsEl = document.getElementById('cit-pagination-buttons');
  if (infoEl) {
    if (totalFiltered === 0) infoEl.innerText = 'Showing 0 of 0 grievances';
    else infoEl.innerText = `Showing ${startIdx + 1}–${startIdx + shownCount} of ${totalFiltered} grievances`;
  }
  if (!btnsEl) return;

  if (totalPages <= 1) {
    btnsEl.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button type="button" class="cit-page-btn" ${currentCitizenPage <= 1 ? 'disabled' : ''} onclick="goCitizenPage(${currentCitizenPage - 1})">&laquo; Prev</button>`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<button type="button" class="cit-page-btn ${p === currentCitizenPage ? 'active' : ''}" onclick="goCitizenPage(${p})">${p}</button>`;
  }
  html += `<button type="button" class="cit-page-btn" ${currentCitizenPage >= totalPages ? 'disabled' : ''} onclick="goCitizenPage(${currentCitizenPage + 1})">Next &raquo;</button>`;
  btnsEl.innerHTML = html;
}

window.goCitizenPage = function(page) {
  currentCitizenPage = page;
  renderCitizenTable();
};

function getWorkStageLabel(pct) {
  if (pct >= 100) return 'Completed & Verified';
  if (pct >= 76) return 'Final Stage';
  if (pct >= 51) return 'Work in Progress';
  if (pct >= 26) return 'Work Started';
  if (pct >= 10) return 'Initial Inspection';
  return 'Not Started';
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

/**
 * Open Citizen Grievance Details Modal with Work Progress & Complete Activity Timeline
 */
window.openCitizenModal = async function(complaintId) {
  const item = myComplaints.find(c => (c.complaintId || c.id) === complaintId);
  if (!item) return;

  currentActiveCitizenComplaint = item;
  const modal = document.getElementById('citizen-detail-modal');
  if (!modal) return;

  document.getElementById('cmodal-id').innerText = item.complaintId;
  document.getElementById('cmodal-subject').innerText = item.subject || item.category;
  document.getElementById('cmodal-category').innerText = item.category;
  document.getElementById('cmodal-gp').innerText = item.panchayatName || item.panchayatId;
  document.getElementById('cmodal-receiver').innerText = item.assignedReceiverName || 'Gram Panchayat Desk';
  document.getElementById('cmodal-date').innerText = item.createdAt || item.submissionDate;
  document.getElementById('cmodal-desc').innerText = item.description;

  const badgeEl = document.getElementById('cmodal-status-badge');
  if (badgeEl) {
    if (window.janasevaStatusManager) {
      badgeEl.outerHTML = `<span id="cmodal-status-badge">${window.janasevaStatusManager.getStatusBadgeHTML(item.status)}</span>`;
    } else {
      badgeEl.className = `status-badge-pill ${getStatusBadgeClass(item.status)}`;
      badgeEl.innerText = item.status;
    }
  }

  // Render Work Progress Card
  renderModalWorkProgress(item);

  // Render Complete Chronological Activity Timeline
  await renderModalActivityTimeline(item);

  // Evidence Photo
  const photoWrap = document.getElementById('cmodal-photo-wrap');
  const photoEl = document.getElementById('cmodal-photo');
  if (photoWrap && photoEl) {
    if (item.photoURL) {
      photoEl.src = item.photoURL;
      photoWrap.style.display = 'block';
      photoEl.style.cursor = 'pointer';
      photoEl.title = 'Click to view full image in Lightbox';
      photoEl.onclick = () => {
        if (typeof window.openImageLightbox === 'function') {
          window.openImageLightbox(item.photoURL, item.complaintId || 'Evidence Photograph');
        } else {
          window.open(item.photoURL, '_blank');
        }
      };
    } else {
      photoWrap.style.display = 'none';
    }
  }

  // AI Verified Document Details
  const docWrap = document.getElementById('cmodal-doc-analysis-wrap');
  if (docWrap) {
    if (item.documentAnalysis) {
      const da = item.documentAnalysis;
      let badge = '<span class="doc-status-badge badge-success"><i class="fa-solid fa-circle-check"></i> Consistent</span>';
      if (da.reviewStatus === 'Inconsistency Detected') badge = '<span class="doc-status-badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Inconsistency Flagged</span>';
      else if (da.reviewStatus === 'Missing Information') badge = '<span class="doc-status-badge badge-info"><i class="fa-solid fa-circle-info"></i> Missing Info</span>';

      const offStatus = da.officerVerification?.status || 'PENDING_OFFICIAL_REVIEW';
      let offLabel = '<span style="color: #92400e; font-size: 11px;">[Pending Official Verification]</span>';
      if (offStatus === 'APPROVED') offLabel = '<span style="color: #16a34a; font-size: 11px; font-weight: 700;">[Approved by Gram Panchayat Officer]</span>';
      else if (offStatus === 'FLAGGED') offLabel = '<span style="color: #dc2626; font-size: 11px; font-weight: 700;">[Flagged for Field Verification]</span>';

      docWrap.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-weight: 700; font-size: 13px; color: #0b2545;">
              <i class="fa-solid fa-file-shield" style="color: #0f56b3;"></i> Supporting Document: <strong>${escapeHtml(da.filename || 'Document')}</strong>
            </div>
            ${badge}
          </div>
          <div style="font-size: 11.5px; color: #64748b; margin-bottom: 8px;">
            Classification: <strong>${escapeHtml(da.docType || 'Document')}</strong> (${Math.round((da.classificationConfidence || 0.9) * 100)}% Confidence) &bull; ${offLabel}
          </div>
          <div class="doc-entities-grid">
            <div class="entity-item"><span>Applicant Name:</span> <strong>${escapeHtml(da.entities?.applicantName || 'Not detected')}</strong></div>
            <div class="entity-item"><span>Survey / Doc No:</span> <strong>${escapeHtml(da.entities?.surveyNumber || da.entities?.documentNumber || 'N/A')}</strong></div>
            <div class="entity-item"><span>Location:</span> <strong>${escapeHtml(da.entities?.village || da.entities?.gramPanchayat || 'Not detected')}</strong></div>
            <div class="entity-item"><span>Document Date:</span> <strong>${escapeHtml(da.entities?.date || 'N/A')}</strong></div>
          </div>
        </div>
      `;
      docWrap.style.display = 'block';
    } else {
      docWrap.style.display = 'none';
      docWrap.innerHTML = '';
    }
  }

  // Public Official Response Thread
  await loadCitizenModalThread(item);

  const replyBox = document.getElementById('cmodal-reply-box');
  if (replyBox) {
    replyBox.style.display = (item.status === 'Resolved' || item.status === 'Rejected') ? 'none' : 'block';
  }

  modal.classList.add('active');
  if (window.janasevaTranslator) {
    window.janasevaTranslator.applyTranslations();
  }
};

function renderModalWorkProgress(item) {
  const wp = item.workProgress || {};
  const pct = Number(wp.percentage || 0);
  const stage = wp.stage || getWorkStageLabel(pct);

  const stageBadge = document.getElementById('cmodal-wp-stage-badge');
  const bar = document.getElementById('cmodal-wp-bar');
  const desc = document.getElementById('cmodal-wp-desc');
  const completed = document.getElementById('cmodal-wp-completed');
  const remaining = document.getElementById('cmodal-wp-remaining');
  const next = document.getElementById('cmodal-wp-next');
  const delayWrap = document.getElementById('cmodal-wp-delay-wrap');
  const delayText = document.getElementById('cmodal-wp-delay');
  const wpPhotoWrap = document.getElementById('cmodal-wp-photo-wrap');
  const wpPhotoImg = document.getElementById('cmodal-wp-photo');

  if (stageBadge) stageBadge.innerText = `${pct}% – ${stage}`;
  if (bar) bar.style.width = `${pct}%`;
  if (desc) desc.innerText = wp.workDescription || 'Awaiting initial technical assessment by Panchayat receiver.';
  if (completed) completed.innerText = wp.completedWork || 'No site tasks marked completed yet.';
  if (remaining) remaining.innerText = wp.remainingWork || (pct >= 100 ? 'All field work completed.' : 'Pending field inspection & execution.');
  if (next) next.innerText = wp.nextAction || (pct >= 100 ? 'Awaiting final resolution confirmation.' : 'Receiver scheduled to inspect site.');

  if (delayWrap && delayText) {
    if (wp.delayReason) {
      delayText.innerText = wp.delayReason;
      delayWrap.style.display = 'block';
    } else {
      delayWrap.style.display = 'none';
    }
  }

  if (wpPhotoWrap && wpPhotoImg) {
    if (wp.photoUrl) {
      wpPhotoImg.src = wp.photoUrl;
      wpPhotoWrap.style.display = 'block';
      wpPhotoImg.onclick = () => {
        if (typeof window.openImageLightbox === 'function') {
          window.openImageLightbox(wp.photoUrl, `Work Progress - ${item.complaintId}`);
        } else {
          window.open(wp.photoUrl, '_blank');
        }
      };
    } else {
      wpPhotoWrap.style.display = 'none';
    }
  }
}

/**
 * Render Accurate Chronological Activity Timeline (No Fabricated Events)
 */
async function renderModalActivityTimeline(complaint) {
  const trailEl = document.getElementById('cmodal-timeline-trail');
  const countEl = document.getElementById('cmodal-timeline-count');
  if (!trailEl) return;

  let updates = [];
  if (window.complaintStorageManager) {
    updates = await window.complaintStorageManager.getComplaintHistory(complaint.complaintId);
  }

  // Build authentic timeline list strictly from database entries
  const timelineEvents = [];

  // Always check if initial submission is present in updates, else derive strictly from complaint creation metadata
  const hasInitial = updates.some(u => u.updateType === 'INITIAL_SUBMISSION');
  if (!hasInitial) {
    timelineEvents.push({
      timestamp: complaint.submissionTimestamp || complaint.createdAt || new Date().toISOString(),
      formattedDate: complaint.createdAt || complaint.submissionDate || formatDisplayDate(complaint.submissionTimestamp),
      actionLabel: 'Complaint Submitted',
      oldStatus: null,
      newStatus: 'Submitted',
      actorName: complaint.citizenName || 'Citizen',
      actorRole: 'citizen',
      remarks: 'Grievance registered in JANASEVA Citizen Portal.',
      photoUrl: complaint.photoURL || null
    });
  }

  // Merge updates from complaint_updates
  updates.forEach(u => {
    let cleanRemarks = u.remarks || '';
    let extraPhoto = null;
    if (typeof u.resolutionDetails === 'string' && u.resolutionDetails.startsWith('WORK_PROGRESS_JSON:')) {
      try {
        const parsedWp = JSON.parse(u.resolutionDetails.slice('WORK_PROGRESS_JSON:'.length));
        if (parsedWp.photoUrl) extraPhoto = parsedWp.photoUrl;
      } catch (e) {}
    }

    let actionLabel = 'Status Update';
    if (u.updateType === 'INITIAL_SUBMISSION') actionLabel = 'Complaint Submitted';
    else if (u.updateType === 'WORK_PROGRESS_UPDATE') actionLabel = 'Receiver Updated Work Progress';
    else if (u.updateType === 'CITIZEN_SOFT_DELETE') actionLabel = 'Moved to Deleted Complaints';
    else if (u.updateType === 'COMPLAINT_RESTORED') actionLabel = 'Restored to Active History';
    else if (u.newStatus === 'Assigned') actionLabel = 'Assigned to Receiver';
    else if (u.newStatus === 'In Progress') actionLabel = 'Work Started / In Progress';
    else if (u.newStatus === 'Resolved') actionLabel = 'Complaint Resolved & Closed';
    else if (u.newStatus === 'Reopened') actionLabel = 'Complaint Reopened';
    else if (u.newStatus) actionLabel = `Status: ${u.newStatus}`;

    timelineEvents.push({
      timestamp: u.timestamp,
      formattedDate: u.formattedDate || formatDisplayDate(u.timestamp),
      actionLabel: actionLabel,
      oldStatus: u.oldStatus,
      newStatus: u.newStatus,
      actorName: u.authorName || 'System',
      actorRole: u.authorRole || 'official',
      remarks: cleanRemarks,
      photoUrl: extraPhoto
    });
  });

  // Check statusHistory array for any transitions not in complaint_updates
  const allHist = (typeof JanasevaDB !== 'undefined' ? JanasevaDB.get('statusHistory', []) : []).filter(h => h.complaintId === complaint.complaintId);
  allHist.forEach(h => {
    const hTime = new Date(h.timestamp).getTime();
    const alreadyPresent = timelineEvents.some(e => Math.abs(new Date(e.timestamp).getTime() - hTime) < 5000 && e.newStatus === h.newStatus);
    if (!alreadyPresent) {
      timelineEvents.push({
        timestamp: h.timestamp,
        formattedDate: formatDisplayDate(h.timestamp),
        actionLabel: `Status Changed to ${h.newStatus}`,
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        actorName: h.updatedBy || 'Authorized Official',
        actorRole: h.actorRole || 'official',
        remarks: h.officialNote || h.reason || `Status transitioned from ${h.oldStatus || 'Initial'} to ${h.newStatus}`
      });
    }
  });

  // Chronological sort (oldest to newest)
  timelineEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (countEl) countEl.innerText = `${timelineEvents.length} Recorded Event${timelineEvents.length === 1 ? '' : 's'}`;

  if (timelineEvents.length === 0) {
    trailEl.innerHTML = `<div style="font-size: 12.5px; color: #64748b; font-style: italic;">No activity events recorded yet.</div>`;
    return;
  }

  trailEl.innerHTML = timelineEvents.map((ev, index) => {
    const roleTag = (ev.actorRole || 'official').toUpperCase();
    const roleBg = roleTag === 'CITIZEN' ? '#e0f2fe; color: #0369a1;' : (roleTag === 'ADMIN' ? '#fef3c7; color: #92400e;' : '#dcfce7; color: #166534;');
    const statusArrow = ev.oldStatus && ev.oldStatus !== ev.newStatus
      ? `<span style="font-size: 11px; color: #475569;">(${escapeHtml(ev.oldStatus)} &rarr; <strong>${escapeHtml(ev.newStatus)}</strong>)</span>`
      : (ev.newStatus ? `<span style="font-size: 11px; color: #0f56b3; font-weight: 700;">[${escapeHtml(ev.newStatus)}]</span>` : '');

    return `
      <div class="timeline-trail-item" style="position: relative; padding-left: 24px; padding-bottom: ${index === timelineEvents.length - 1 ? '0' : '16px'}; border-left: ${index === timelineEvents.length - 1 ? '2px solid transparent' : '2px solid #cbd5e1'}; margin-left: 8px;">
        <div style="position: absolute; left: -7px; top: 3px; width: 12px; height: 12px; border-radius: 50%; background: #0f56b3; border: 2px solid #ffffff; box-shadow: 0 0 0 2px #bfdbfe;"></div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 6px;">
          <div style="font-weight: 700; font-size: 13px; color: #0b2545;">
            ${index + 1}. ${escapeHtml(ev.actionLabel)} ${statusArrow}
          </div>
          <span style="font-size: 11px; color: #64748b; white-space: nowrap;">
            <i class="fa-regular fa-clock"></i> ${escapeHtml(ev.formattedDate)}
          </span>
        </div>
        <div style="font-size: 11.5px; color: #475569; margin-top: 3px;">
          By: <strong>${escapeHtml(ev.actorName)}</strong>
          <span style="font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; background: ${roleBg}">${roleTag}</span>
        </div>
        ${ev.remarks ? `<div style="font-size: 12px; color: #334155; background: #f8fafc; border-left: 3px solid #94a3b8; padding: 5px 8px; margin-top: 5px; border-radius: 0 4px 4px 0;">${escapeHtml(ev.remarks)}</div>` : ''}
        ${ev.photoUrl ? `<div style="margin-top: 6px;"><img src="${escapeHtml(ev.photoUrl)}" alt="Event attachment" style="height: 54px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: pointer;" onclick="window.openImageLightbox ? window.openImageLightbox('${escapeHtml(ev.photoUrl)}', 'Timeline Attachment') : window.open('${escapeHtml(ev.photoUrl)}', '_blank')"></div>` : ''}
      </div>
    `;
  }).join('');
}

window.closeCitizenModal = function() {
  const modal = document.getElementById('citizen-detail-modal');
  if (modal) modal.classList.remove('active');
  currentActiveCitizenComplaint = null;
};

/**
 * Load Public Messages Only
 */
async function loadCitizenModalThread(complaint) {
  const container = document.getElementById('cmodal-thread');
  if (!container) return;

  const storageKey = `complaintMessages_${complaint.complaintId}`;
  let messages = typeof JanasevaDB !== 'undefined' ? JanasevaDB.get(storageKey, []) : [];

  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      const snap = await window.fbDb.collection('complaints').doc(complaint.complaintId).collection('messages').get();
      if (!snap.empty) {
        const fbMsgs = snap.docs.map(d => d.data());
        fbMsgs.sort((a, b) => new Date(a.createdAt || a.timestamp || 0) - new Date(b.createdAt || b.timestamp || 0));
        if (fbMsgs.length > 0) {
          messages = fbMsgs;
          if (typeof JanasevaDB !== 'undefined') JanasevaDB.set(storageKey, messages);
        }
      }
    } catch (e) {
      console.warn("Messages load warning:", e);
    }
  }

  // Strictly public messages only
  const publicMessages = messages.filter(m => (m.visibility || '').toLowerCase() !== 'internal');

  if (publicMessages.length === 0) {
    container.innerHTML = `
      <div class="comm-thread-empty">
        <i class="fa-regular fa-comments" style="font-size: 24px; margin-bottom: 6px; display: block;"></i>
        Your grievance has been registered. Official responses will appear here as action is taken.
      </div>
    `;
    return;
  }

  container.innerHTML = publicMessages.map(m => {
    const isCitizen = (m.senderRole || '').toLowerCase() === 'citizen';
    const msgBody = m.message || m.messageText || '';
    const msgTime = m.createdAt ? formatDisplayDate(m.createdAt) : (m.timestamp || '');
    if (isCitizen) {
      return `
        <div class="comm-bubble comm-msg-citizen">
          <div class="comm-bubble-meta">
            <span class="comm-author-tag"><i class="fa-solid fa-user"></i> You (Citizen)</span>
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
              <i class="fa-solid fa-building-columns"></i> ${escapeHtml(m.senderName || 'Panchayat Official Desk')}
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

window.sendCitizenDashboardReply = async function() {
  if (!currentActiveCitizenComplaint) return;

  const textarea = document.getElementById('cmodal-reply-text');
  const text = textarea ? textarea.value.trim() : '';
  if (!text) {
    if (typeof showToast === 'function') showToast("Please type your reply before sending.", "warning");
    return;
  }

  const user = window.authService.currentUser;
  const nowFormatted = formatDisplayDate();
  const nowISO = new Date().toISOString();

  const fbReplyMsg = {
    messageId: 'msg-' + Date.now(),
    complaintId: currentActiveCitizenComplaint.complaintId,
    senderId: user ? user.uid : 'citizen',
    senderName: (user && user.name) ? user.name : 'Citizen',
    senderEmail: (user && user.email) ? user.email : '',
    senderRole: 'citizen',
    message: text,
    visibility: 'public',
    createdAt: nowISO
  };

  const localReplyMsg = {
    ...fbReplyMsg,
    messageText: text,
    timestamp: nowFormatted
  };

  const storageKey = `complaintMessages_${currentActiveCitizenComplaint.complaintId}`;
  if (typeof JanasevaDB !== 'undefined') {
    const msgs = JanasevaDB.get(storageKey, []);
    msgs.push(localReplyMsg);
    JanasevaDB.set(storageKey, msgs);
  }

  if (window.isFirebaseAvailable && window.fbDb && user && user.uid) {
    try {
      await window.fbDb.collection('complaints').doc(currentActiveCitizenComplaint.complaintId).collection('messages').doc(fbReplyMsg.messageId).set(fbReplyMsg);
      await window.fbDb.collection('complaintMessages').doc(fbReplyMsg.messageId).set(fbReplyMsg);
    } catch (e) {
      console.warn("Firestore reply save warning:", e);
    }
  }

  if (textarea) textarea.value = '';
  await loadCitizenModalThread(currentActiveCitizenComplaint);
  if (typeof showToast === 'function') showToast("Your reply has been sent to the Gram Panchayat desk.", "success");
};

window.downloadCitizenReceipt = function(complaintId) {
  const item = myComplaints.find(c => (c.complaintId || c.id) === complaintId);
  if (!item) {
    if (typeof showToast === 'function') showToast("Complaint record not found.", "warning");
    return;
  }
  if (window.downloadComplaintReceipt) {
    window.downloadComplaintReceipt(item);
  } else if (typeof showToast === 'function') {
    showToast("Receipt generator is still loading. Please try again in a moment.", "warning");
  }
};

window.printModalReceipt = function() {
  if (!currentActiveCitizenComplaint) return;
  if (window.downloadComplaintReceipt) {
    window.downloadComplaintReceipt(currentActiveCitizenComplaint);
  } else if (typeof showToast === 'function') {
    showToast("Receipt generator is still loading. Please try again in a moment.", "warning");
  }
};

// =========================================================================
// CITIZEN SOFT DELETE & RESTORE MANAGEMENT (SECTION 8)
// =========================================================================

window.deleteCitizenComplaint = function(complaintId) {
  if (!complaintId) return;
  const complaint = myComplaints.find(c => (c.complaintId || c.id) === complaintId);
  if (!complaint) return;

  pendingDeleteComplaintId = complaintId;
  const modal = document.getElementById('citizen-delete-confirm-modal');
  const idEl = document.getElementById('cdel-complaint-id');
  const subEl = document.getElementById('cdel-complaint-subject');
  const reasonEl = document.getElementById('cdel-reason-input');

  if (idEl) idEl.innerText = complaintId;
  if (subEl) subEl.innerText = complaint.subject || complaint.category || 'Civic Grievance';
  if (reasonEl) reasonEl.value = '';
  if (modal) modal.classList.add('active');
};

window.closeDeleteConfirmModal = function() {
  const modal = document.getElementById('citizen-delete-confirm-modal');
  if (modal) modal.classList.remove('active');
  pendingDeleteComplaintId = null;
};

window.deleteCurrentCitizenComplaintFromModal = function() {
  if (!currentActiveCitizenComplaint) return;
  const cid = currentActiveCitizenComplaint.complaintId || currentActiveCitizenComplaint.id;
  if (cid) {
    closeCitizenModal();
    window.deleteCitizenComplaint(cid);
  }
};

window.confirmCitizenSoftDelete = async function() {
  if (!pendingDeleteComplaintId) return;
  const complaintId = pendingDeleteComplaintId;
  const reasonInput = document.getElementById('cdel-reason-input');
  const reason = (reasonInput ? reasonInput.value.trim() : '') || 'Moved to Deleted History by Citizen';

  const user = window.authService?.currentUser;
  if (!user) return;

  const btn = document.getElementById('cdel-confirm-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Moving...';
  }

  try {
    const actor = {
      uid: user.uid,
      email: user.email,
      name: user.name || 'Citizen',
      role: 'citizen'
    };

    if (window.complaintStorageManager) {
      await window.complaintStorageManager.moveToRecycleBin(complaintId, reason, actor);
    } else {
      throw new Error('Storage Manager unavailable.');
    }

    closeDeleteConfirmModal();
    await loadMyComplaints();

    if (typeof showToast === 'function') {
      showToast(`Grievance ${complaintId} moved to Deleted Complaints.`, "success");
    }
  } catch (err) {
    console.error("Soft delete error:", err);
    if (typeof showToast === 'function') showToast(`Error: ${err.message}`, "error");
    else (window.janasevaAlert || alert)(`Error: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Move to Deleted History';
    }
  }
};

/**
 * Render Deleted Complaints Archive Table & Mobile Cards
 */
function renderDeletedComplaintsTable() {
  const tbody = document.getElementById('citizen-deleted-table-body');
  const mobileWrap = document.getElementById('citizen-deleted-mobile-cards');
  const countEl = document.getElementById('cit-deleted-count');
  if (!tbody) return;

  if (countEl) countEl.innerText = `${myDeletedComplaints.length} Deleted Grievance${myDeletedComplaints.length === 1 ? '' : 's'}`;

  if (myDeletedComplaints.length === 0) {
    const emptyDel = `
      <div style="text-align: center; padding: 24px 14px; color: #64748b;">
        <div style="width: 52px; height: 52px; margin: 0 auto 10px; border-radius: 50%; background: #fef2f2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 22px;">
          <i class="fa-solid fa-trash-can"></i>
        </div>
        <div style="font-size: 14.5px; font-weight: 800; color: #0b2545; margin-bottom: 4px;">No deleted grievances found</div>
        <div style="font-size: 13px; color: #64748b;">Complaints you soft-delete from your active history will appear here for safe keeping and restoration.</div>
      </div>
    `;
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 0;">${emptyDel}</td></tr>`;
    if (mobileWrap) mobileWrap.innerHTML = `<div style="grid-column: 1 / -1; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px;">${emptyDel}</div>`;
    return;
  }

  tbody.innerHTML = myDeletedComplaints.map(binItem => {
    const c = binItem.complaintData || {};
    const cid = binItem.complaintId || c.complaintId;
    const origDate = c.createdAt || c.submissionDate || 'N/A';
    const delDate = binItem.formattedDeletedAt || formatDisplayDate(binItem.deletedAt);
    const delReason = binItem.reason || 'Citizen deleted';
    const delBy = `${binItem.deletedBy || 'Citizen'} (${binItem.deletedByRole || 'citizen'})`;

    return `
      <tr>
        <td class="cit-col-id"><span class="table-id-tag" style="background: #fee2e2; color: #991b1b; border-color: #fecaca;">${escapeHtml(cid)}</span></td>
        <td><strong style="color: #0b2545;">${escapeHtml(c.subject || c.category || 'Untitled')}</strong></td>
        <td style="font-size: 12px; color: #64748b;">${formatCompactDateCell(origDate)}</td>
        <td style="font-size: 12px; color: #b91c1c;">${formatCompactDateCell(delDate)}</td>
        <td style="font-size: 12.5px; color: #334155;">${escapeHtml(delReason)}</td>
        <td style="font-size: 12px; color: #475569;">${escapeHtml(delBy)}</td>
        <td style="text-align: center;">
          <button type="button" class="cit-action-btn cit-btn-restore" onclick="restoreCitizenComplaint('${cid}')" title="Restore complaint to Active History">
            <i class="fa-solid fa-rotate-left"></i><span>Restore</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (mobileWrap) {
    mobileWrap.innerHTML = myDeletedComplaints.map(binItem => {
      const c = binItem.complaintData || {};
      const cid = binItem.complaintId || c.complaintId;
      const origDate = c.createdAt || c.submissionDate || 'N/A';
      const delDate = binItem.formattedDeletedAt || formatDisplayDate(binItem.deletedAt);
      const delReason = binItem.reason || 'Citizen deleted';
      const delBy = `${binItem.deletedBy || 'Citizen'} (${binItem.deletedByRole || 'citizen'})`;

      return `
        <article class="cit-mobile-card" style="border-color: #fecaca;">
          <div class="cit-mobile-card-head">
            <span class="table-id-tag" style="background: #fee2e2; color: #991b1b; border-color: #fecaca;">${escapeHtml(cid)}</span>
            <span class="status-badge-pill badge-rejected" style="font-size: 11px;">Archived</span>
          </div>
          <h3 class="cit-mobile-card-title">${escapeHtml(c.subject || c.category || 'Untitled')}</h3>
          <div class="cit-mobile-meta-grid">
            <div class="cit-mobile-meta-item">
              <span class="cit-mobile-meta-lbl">Submitted</span>
              <span class="cit-mobile-meta-val">${escapeHtml(origDate)}</span>
            </div>
            <div class="cit-mobile-meta-item">
              <span class="cit-mobile-meta-lbl">Deleted On</span>
              <span class="cit-mobile-meta-val" style="color: #b91c1c;">${escapeHtml(delDate)}</span>
            </div>
            <div class="cit-mobile-meta-item" style="grid-column: 1 / -1;">
              <span class="cit-mobile-meta-lbl">Reason</span>
              <span class="cit-mobile-meta-val">${escapeHtml(delReason)}</span>
            </div>
            <div class="cit-mobile-meta-item" style="grid-column: 1 / -1;">
              <span class="cit-mobile-meta-lbl">Deleted By</span>
              <span class="cit-mobile-meta-val">${escapeHtml(delBy)}</span>
            </div>
          </div>
          <div class="cit-mobile-card-actions">
            <button type="button" class="cit-action-btn cit-btn-restore" onclick="restoreCitizenComplaint('${cid}')" title="Restore complaint to Active History">
              <i class="fa-solid fa-rotate-left"></i><span>Restore Complaint</span>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }
}

window.restoreCitizenComplaint = async function(complaintId) {
  if (!complaintId) return;
  const user = window.authService?.currentUser;
  if (!user) return;

  try {
    const actor = {
      uid: user.uid,
      email: user.email,
      name: user.name || 'Citizen',
      role: 'citizen'
    };

    if (window.complaintStorageManager) {
      await window.complaintStorageManager.restoreFromRecycleBin(complaintId, actor);
    }

    await loadMyComplaints();
    if (typeof showToast === 'function') {
      showToast(`Grievance ${complaintId} has been restored to your Active Complaints list.`, "success");
    }
  } catch (err) {
    console.error("Restore error:", err);
    if (typeof showToast === 'function') showToast(`Restore Error: ${err.message}`, "error");
    else (window.janasevaAlert || alert)(`Restore Error: ${err.message}`);
  }
};

// =========================================================================
// CITIZEN REPORT & ANALYTICS (SECTION 12)
// =========================================================================

function renderCitizenReport() {
  const validComplaints = myComplaints.filter(c => c && c.complaintId && (c.status || '').toLowerCase() !== 'invalid');
  const total = validComplaints.length;

  let resolvedCount = 0;
  let pendingCount = 0;
  let activeCount = 0;
  let resolutionTimesMs = [];
  const categoryMap = {};
  const monthMap = {};

  validComplaints.forEach(item => {
    const s = (item.status || '').toLowerCase().trim();
    if (s === 'resolved') {
      resolvedCount++;
      const start = parseItemTime(item);
      const end = item.resolutionDate ? new Date(item.resolutionDate).getTime() : 0;
      if (start > 0 && end > start) {
        resolutionTimesMs.push(end - start);
      }
    } else if (s === 'in progress' || s === 'action taken' || s === 'reopened') {
      activeCount++;
    } else if (s === 'submitted' || s === 'assigned' || s === 'under review' || s === 'pending' || s === 'received') {
      pendingCount++;
    }

    // Category aggregation
    const cat = item.category || 'Other Issues';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;

    // Month aggregation
    const t = parseItemTime(item);
    const monthKey = t > 0
      ? new Date(t).toLocaleString('en-IN', { month: 'short', year: 'numeric' })
      : 'Unknown Date';
    if (!monthMap[monthKey]) monthMap[monthKey] = { submitted: 0, resolved: 0, open: 0 };
    monthMap[monthKey].submitted++;
    if (s === 'resolved') monthMap[monthKey].resolved++;
    else monthMap[monthKey].open++;
  });

  const rate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  let avgTimeStr = '--';
  if (resolutionTimesMs.length > 0) {
    const avgMs = resolutionTimesMs.reduce((a, b) => a + b, 0) / resolutionTimesMs.length;
    const avgHours = avgMs / (1000 * 60 * 60);
    if (avgHours < 24) avgTimeStr = `${Math.max(1, Math.round(avgHours))} Hours`;
    else avgTimeStr = `${(avgHours / 24).toFixed(1)} Days`;
  }

  const elSub = document.getElementById('rep-total-submitted');
  const elRes = document.getElementById('rep-total-resolved');
  const elPend = document.getElementById('rep-total-pending');
  const elAct = document.getElementById('rep-total-active');
  const elAvg = document.getElementById('rep-avg-time');
  const elRate = document.getElementById('rep-resolution-rate');

  if (elSub) elSub.innerText = total;
  if (elRes) elRes.innerText = resolvedCount;
  if (elPend) elPend.innerText = pendingCount;
  if (elAct) elAct.innerText = activeCount;
  if (elAvg) elAvg.innerText = avgTimeStr;
  if (elRate) elRate.innerText = `${rate}%`;

  // Render Category Distribution Bars
  const catContainer = document.getElementById('rep-category-bars');
  if (catContainer) {
    const entries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      catContainer.innerHTML = `<div style="font-size: 13px; color: #64748b; padding: 14px 0;"><i class="fa-regular fa-folder-open" style="margin-right: 6px;"></i>No filed complaints to visualize yet.</div>`;
    } else {
      const palette = ['#0f56b3', '#16a34a', '#ea580c', '#7c3aed', '#0284c7', '#d97706'];
      catContainer.innerHTML = entries.map(([cat, count], idx) => {
        const share = Math.round((count / total) * 100);
        const barColor = palette[idx % palette.length];
        return `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; color: #0b2545; margin-bottom: 6px;">
              <span>${escapeHtml(cat)}</span>
              <span style="color: ${barColor}; white-space: nowrap;">${count} Complaint${count === 1 ? '' : 's'} (${share}%)</span>
            </div>
            <div style="background: #e2e8f0; height: 8px; border-radius: 999px; overflow: hidden;">
              <div style="background: ${barColor}; height: 100%; width: ${share}%; border-radius: 999px; transition: width 0.5s ease;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render Monthly Table
  const monthlyTbody = document.getElementById('rep-monthly-table-body');
  if (monthlyTbody) {
    const months = Object.entries(monthMap);
    if (months.length === 0) {
      monthlyTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">No monthly filing history found.</td></tr>`;
    } else {
      monthlyTbody.innerHTML = months.map(([mLabel, stats]) => {
        const mRate = stats.submitted > 0 ? Math.round((stats.resolved / stats.submitted) * 100) : 0;
        return `
          <tr>
            <td><strong>${escapeHtml(mLabel)}</strong></td>
            <td>${stats.submitted}</td>
            <td style="color: #16a34a; font-weight: 700;">${stats.resolved}</td>
            <td style="color: #d97706; font-weight: 700;">${stats.open}</td>
            <td><strong>${mRate}%</strong></td>
          </tr>
        `;
      }).join('');
    }
  }
}

window.printCitizenReport = function() {
  window.print();
};

// =========================================================================
// FEEDBACK & REOPEN MODALS (PRESERVED FUNCTIONALITY)
// =========================================================================

window.openFeedbackModal = function(complaintId) {
  const item = myComplaints.find(c => (c.complaintId || c.id) === complaintId);
  if (!item) return;

  currentActiveCitizenComplaint = item;
  const modal = document.getElementById('citizen-feedback-modal');
  const idEl = document.getElementById('fb-complaint-id');
  if (idEl) idEl.innerText = complaintId;

  selectStar(5);
  const commentInput = document.getElementById('fb-comments');
  if (commentInput) commentInput.value = '';

  if (modal) modal.classList.add('active');
};

window.closeFeedbackModal = function() {
  const modal = document.getElementById('citizen-feedback-modal');
  if (modal) modal.classList.remove('active');
};

window.selectStar = function(val) {
  selectedStarRating = val;
  document.querySelectorAll('.star-rate').forEach(s => {
    const starVal = parseInt(s.getAttribute('data-val'), 10);
    s.style.color = starVal <= val ? '#eab308' : '#cbd5e1';
  });
};

window.submitCitizenFeedback = async function() {
  if (!currentActiveCitizenComplaint) return;

  const comments = document.getElementById('fb-comments')?.value.trim() || '';
  const feedbackData = {
    rating: selectedStarRating,
    comments: comments,
    submittedAt: new Date().toISOString()
  };

  currentActiveCitizenComplaint.citizenFeedback = feedbackData;

  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      await window.fbDb.collection('complaints').doc(currentActiveCitizenComplaint.complaintId).update({
        citizenFeedback: feedbackData
      });
    } catch (e) {
      console.warn("Feedback save warning:", e);
    }
  }

  if (typeof JanasevaDB !== 'undefined') {
    const all = JanasevaDB.get('complaints', []);
    const idx = all.findIndex(c => c.complaintId === currentActiveCitizenComplaint.complaintId);
    if (idx >= 0) {
      all[idx].citizenFeedback = feedbackData;
      JanasevaDB.set('complaints', all);
    }
  }

  closeFeedbackModal();
  renderCitizenTable();
  if (typeof showToast === 'function') showToast("Thank you! Your feedback has been recorded.", "success");
};

window.openReopenModal = function(complaintId) {
  const item = myComplaints.find(c => (c.complaintId || c.id) === complaintId);
  if (!item) return;

  currentActiveCitizenComplaint = item;
  const modal = document.getElementById('citizen-reopen-modal');
  const idEl = document.getElementById('reopen-modal-id');
  if (idEl) idEl.innerText = complaintId;

  const reasonInput = document.getElementById('reopen-reason-input');
  if (reasonInput) reasonInput.value = '';

  if (modal) modal.classList.add('active');
};

window.closeReopenModal = function() {
  const modal = document.getElementById('citizen-reopen-modal');
  if (modal) modal.classList.remove('active');
};

window.submitReopenRequest = async function() {
  if (!currentActiveCitizenComplaint) return;

  const reasonInput = document.getElementById('reopen-reason-input');
  const reason = reasonInput ? reasonInput.value.trim() : '';

  if (!reason || reason.length < 10) {
    if (typeof showToast === 'function') showToast("Please provide a detailed explanation for reopening (at least 10 characters).", "error");
    if (reasonInput) reasonInput.focus();
    return;
  }

  const user = window.authService.currentUser;
  const nowFormatted = formatDisplayDate();
  const oldStatus = currentActiveCitizenComplaint.status;

  if (window.janasevaStatusManager) {
    const validation = window.janasevaStatusManager.validateTransition(oldStatus, 'reopened', 'citizen', {
      remarks: reason
    });
    if (!validation.valid) {
      if (typeof showToast === 'function') showToast(`Cannot submit reopen request: ${validation.reason}`, "error");
      return;
    }
  }

  currentActiveCitizenComplaint.status = 'Reopened';
  currentActiveCitizenComplaint.reopenReason = reason;
  currentActiveCitizenComplaint.updatedAt = nowFormatted;

  const newHist = {
    historyId: 'hist-' + Date.now(),
    complaintId: currentActiveCitizenComplaint.complaintId,
    oldStatus: oldStatus,
    newStatus: 'Reopened',
    updatedBy: user ? user.uid : 'citizen',
    timestamp: new Date().toISOString(),
    officialNote: `Citizen requested reopening: ${reason}`
  };

  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      await window.fbDb.collection('complaints').doc(currentActiveCitizenComplaint.complaintId).update({
        status: 'Reopened',
        reopenReason: reason,
        updatedAt: nowFormatted
      });
      await window.fbDb.collection('complaints').doc(currentActiveCitizenComplaint.complaintId).collection('statusHistory').doc(newHist.historyId).set(newHist);
      await window.fbDb.collection('statusHistory').doc(newHist.historyId).set(newHist);
    } catch (e) {
      console.warn("Reopen request save warning:", e);
    }
  }

  if (typeof JanasevaDB !== 'undefined') {
    const all = JanasevaDB.get('complaints', []);
    const idx = all.findIndex(c => c.complaintId === currentActiveCitizenComplaint.complaintId);
    if (idx >= 0) {
      all[idx].status = 'Reopened';
      all[idx].reopenReason = reason;
      all[idx].updatedAt = nowFormatted;
      JanasevaDB.set('complaints', all);
    }
  }

  if (window.complaintStorageManager && user) {
    await window.complaintStorageManager.recordComplaintUpdate(currentActiveCitizenComplaint, {
      oldStatus: oldStatus,
      newStatus: 'Reopened',
      updateType: 'STATUS_CHANGE',
      remarks: `Citizen requested reopening: ${reason}`,
      actor: {
        uid: user.uid,
        name: user.name || 'Citizen',
        email: user.email,
        role: 'citizen'
      }
    });
  }

  closeReopenModal();
  updateCitizenStats();
  updateWorkProgressSummary();
  renderCitizenTable();
  if (user && user.uid) checkOfflineQueue(user.uid);
  if (typeof showToast === 'function') showToast(`Grievance ${currentActiveCitizenComplaint.complaintId} has been reopened for investigation.`, "success");
};

function formatDisplayDate(dateInput = new Date()) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function checkOfflineQueue(userId) {
  const noticeEl = document.getElementById('cit-offline-sync-notice');
  if (!noticeEl || !window.janasevaOfflineDB) return;

  try {
    const queued = await window.janasevaOfflineDB.getQueuedSubmissions(userId);
    const pending = queued.filter(q => q.syncStatus !== 'Successfully Submitted');

    if (pending.length > 0) {
      noticeEl.innerHTML = `
        <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; color: #92400e; font-size: 13px;">
            <i class="fa-solid fa-cloud-arrow-up" style="font-size: 18px; color: #d97706;"></i>
            <div>
              <strong>${pending.length} Offline Submission(s) Queued:</strong> Saved safely on this device.
              <span style="font-size: 12px; color: #b45309;">Will synchronize automatically when internet returns.</span>
            </div>
          </div>
          <button type="button" class="btn-cta-secondary" onclick="window.janasevaOfflineDB.checkAndSyncQueue()" style="padding: 5px 12px; font-size: 12px;">
            <i class="fa-solid fa-rotate"></i> Sync Now
          </button>
        </div>
      `;
      noticeEl.style.display = 'block';
    } else {
      noticeEl.style.display = 'none';
    }
  } catch (e) {
    console.warn("Check offline queue caught:", e);
  }
}

window.addEventListener('janaseva:synced', () => {
  const currentUser = window.authService?.currentUser;
  if (currentUser) {
    checkOfflineQueue(currentUser.uid);
    loadMyComplaints();
  }
});

window.addEventListener('janaseva:langChanged', () => {
  if (typeof syncCategoryDropdownOptions === 'function') syncCategoryDropdownOptions();
  renderCitizenTable();
  renderDeletedComplaintsTable();
  updateCitizenStats();
  updateWorkProgressSummary();
  if (typeof renderCitizenReport === 'function') renderCitizenReport();
  const currentUser = window.authService?.currentUser;
  if (currentUser && typeof checkOfflineQueue === 'function') {
    checkOfflineQueue(currentUser.uid);
  }
  if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
});

window.addEventListener('janaseva:profileUpdated', () => {
  populateCitizenPreferenceForms();
});

function populateCitizenPreferenceForms() {
  const user = window.authService?.currentUser;
  if (!user) return;
  const usm = window.JanasevaSettings;

  const fillProfile = () => {
    const elName = document.getElementById('cit-pref-name');
    const elPhone = document.getElementById('cit-pref-phone');
    const elGp = document.getElementById('cit-pref-gp');
    const elEmail = document.getElementById('cit-pref-email');
    if (elName) elName.value = user.name || '';
    if (elPhone) elPhone.value = user.phone || user.mobile || '';
    if (elGp) elGp.value = user.panchayatName || '';
    if (elEmail) elEmail.value = user.email || '';
  };

  const fillPrefs = () => {
    const elLang = document.getElementById('cit-pref-lang');
    const elExpand = document.getElementById('cit-pref-expand');
    const elAlerts = document.getElementById('cit-pref-alerts');
    const elCompact = document.getElementById('cit-pref-compact');
    const storedLang = user.preferredLang || localStorage.getItem('janaseva_lang') || 'en';
    const uiPrefs = user.uiPreferences || {};
    if (elLang) elLang.value = ['en', 'kn', 'hi'].includes(storedLang) ? storedLang : 'en';
    if (elExpand) elExpand.checked = uiPrefs.autoExpandTimeline !== false;
    if (elAlerts) elAlerts.checked = uiPrefs.emailAlertsOptIn !== false;
    if (elCompact) elCompact.checked = Boolean(uiPrefs.compactCards);
  };

  if (usm) {
    usm.runProgrammaticUpdate('citizen-profile', fillProfile);
    usm.runProgrammaticUpdate('citizen-prefs', fillPrefs);
  } else {
    fillProfile();
    fillPrefs();
  }
}

function initCitizenPreferencesUSM() {
  const usm = window.JanasevaSettings;
  if (!usm || !window.authService) return;
  const profileCard = document.getElementById('citizen-profile-pref-card');
  const prefsCard = document.getElementById('citizen-ui-pref-card');
  if (!profileCard || !prefsCard) return;

  populateCitizenPreferenceForms();

  usm.registerSection({
    sectionId: 'citizen-profile',
    sectionName: 'Citizen Profile Settings',
    containerEl: '#citizen-profile-pref-card',
    formEl: '#citizen-profile-pref-form',
    statusHostEl: '#citizen-profile-usm-status',
    saveBtn: '#cit-profile-save-btn',
    resetBtn: '#cit-profile-reset-btn',
    refreshBtn: '#cit-profile-refresh-btn',
    confirmResetTitle: 'Reset Editable Profile Fields to Defaults?',
    confirmResetMessage: 'Restores display name to "Citizen User", Hub to the configured Gram Panchayat, and clears optional contact phone. Login Email remains unchanged.',
    confirmResetDetail: 'Scope: Only your profile metadata is affected. Complaints and preferences remain untouched.',
    onSave: async () => {
      const name = (document.getElementById('cit-pref-name')?.value || '').trim();
      const phone = (document.getElementById('cit-pref-phone')?.value || '').trim();
      const panchayatName = (document.getElementById('cit-pref-gp')?.value || '').trim();
      const updated = await window.authService.updateCurrentUserProfile({ name, phone, panchayatName });
      populateCitizenPreferenceForms();
      return {
        savedAt: updated.updatedAt || new Date().toISOString(),
        updatedBy: updated.email,
        message: 'Citizen profile saved successfully!'
      };
    },
    onReset: async () => {
      const updated = await window.authService.updateCurrentUserProfile({
        name: 'Citizen User',
        phone: '',
        panchayatName: ''
      });
      populateCitizenPreferenceForms();
      return {
        savedAt: updated.updatedAt || new Date().toISOString(),
        updatedBy: updated.email,
        message: 'Citizen profile restored to defaults.'
      };
    },
    onRefresh: async () => {
      const fresh = await window.authService.refreshCurrentUserProfile({ strictRemote: true });
      populateCitizenPreferenceForms();
      return {
        refreshedAt: new Date().toISOString(),
        updatedBy: fresh?.email || '',
        message: 'Profile reloaded from database.'
      };
    }
  });

  usm.registerSection({
    sectionId: 'citizen-prefs',
    sectionName: 'Citizen Portal Preferences',
    containerEl: '#citizen-ui-pref-card',
    formEl: '#citizen-ui-pref-form',
    statusHostEl: '#citizen-prefs-usm-status',
    saveBtn: '#cit-prefs-save-btn',
    resetBtn: '#cit-prefs-reset-btn',
    refreshBtn: '#cit-prefs-refresh-btn',
    confirmResetTitle: 'Reset Portal Preferences to Defaults?',
    confirmResetMessage: 'Restores Language to English, enables Timeline Auto-Expand & Email Alerts, and disables Compact List Density.',
    confirmResetDetail: 'Scope: Only display and notification preferences are reset.',
    onSave: async () => {
      const preferredLang = document.getElementById('cit-pref-lang')?.value || 'en';
      const uiPreferences = {
        autoExpandTimeline: Boolean(document.getElementById('cit-pref-expand')?.checked),
        emailAlertsOptIn: Boolean(document.getElementById('cit-pref-alerts')?.checked),
        compactCards: Boolean(document.getElementById('cit-pref-compact')?.checked)
      };
      const updated = await window.authService.updateCitizenPreferences({ preferredLang, uiPreferences });
      populateCitizenPreferenceForms();
      return {
        savedAt: updated.updatedAt || new Date().toISOString(),
        updatedBy: updated.email,
        message: 'Portal preferences saved and applied.'
      };
    },
    onReset: async () => {
      const updated = await window.authService.updateCitizenPreferences({
        preferredLang: 'en',
        uiPreferences: { autoExpandTimeline: true, emailAlertsOptIn: true, compactCards: false }
      });
      populateCitizenPreferenceForms();
      return {
        savedAt: updated.updatedAt || new Date().toISOString(),
        updatedBy: updated.email,
        message: 'Portal preferences reset to defaults.'
      };
    },
    onRefresh: async () => {
      const fresh = await window.authService.refreshCurrentUserProfile({ strictRemote: true });
      populateCitizenPreferenceForms();
      return {
        refreshedAt: new Date().toISOString(),
        updatedBy: fresh?.email || '',
        message: 'Preferences reloaded from database.'
      };
    }
  });
}

let citizenLiveRefresh = null;
window.addEventListener('janaseva:complaintsChanged', () => {
  clearTimeout(citizenLiveRefresh);
  citizenLiveRefresh = setTimeout(() => loadMyComplaints().catch(console.error), 150);
});
