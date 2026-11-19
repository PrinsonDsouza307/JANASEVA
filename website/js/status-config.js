/**
 * JANASEVA – Authoritative Dynamic Complaint Status & Transition Rules Engine
 * 
 * Single authoritative source of truth for:
 * 1. Complaint statuses, categories, display order, colors, and icons.
 * 2. Visual 6-stage milestone stepper and status indicator legends.
 * 3. Role-based transition rules (Admin vs Receiver permissions).
 * 4. Transition prerequisites (mandatory remarks, evidence, assignment).
 * 5. Strict Admin-only configuration mutations and immutable audit logging.
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const DEFAULT_STATUS_CONFIG = [
  {
    id: "submitted",
    name: "Submitted",
    description: "Your complaint has been successfully received and logged into the Gram Panchayat portal.",
    icon: "fa-solid fa-circle-check",
    color: "#16a34a",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    order: 1,
    isStepperStage: true,
    isActive: true,
    isArchived: false,
    workflowCategory: "initial",
    allowedTransitions: ["assigned", "rejected"],
    transitionRules: {
      "assigned": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: false,
        mandatoryEvidence: false,
        requiresReceiver: true,
        requiresPanchayat: true,
        notificationTrigger: true
      },
      "rejected": {
        allowedRoles: ["admin"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        requiresReceiver: false,
        requiresPanchayat: false,
        notificationTrigger: true
      }
    }
  },
  {
    id: "assigned",
    name: "Assigned",
    description: "Allocated to designated Panchayat grievance officer for site verification.",
    icon: "fa-solid fa-user-check",
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    order: 2,
    isStepperStage: true,
    isActive: true,
    isArchived: false,
    workflowCategory: "active",
    allowedTransitions: ["under_review", "in_progress", "rejected"],
    transitionRules: {
      "under_review": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: false,
        mandatoryEvidence: false,
        notificationTrigger: true
      },
      "in_progress": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: false,
        mandatoryEvidence: false,
        notificationTrigger: true
      },
      "rejected": {
        allowedRoles: ["admin"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      }
    }
  },
  {
    id: "under_review",
    name: "Under Review",
    description: "Inspection, engineering cost estimation, or department coordination.",
    icon: "fa-solid fa-magnifying-glass",
    color: "#0284c7",
    bgColor: "#f0f9ff",
    borderColor: "#bae6fd",
    order: 3,
    isStepperStage: true,
    isActive: true,
    isArchived: false,
    workflowCategory: "review",
    allowedTransitions: ["in_progress", "action_taken", "assigned", "rejected"],
    transitionRules: {
      "in_progress": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: false,
        mandatoryEvidence: false,
        notificationTrigger: true
      },
      "action_taken": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: true,
        mandatoryEvidence: true,
        notificationTrigger: true
      },
      "assigned": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: false,
        mandatoryEvidence: false,
        notificationTrigger: true
      },
      "rejected": {
        allowedRoles: ["admin"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      }
    }
  },
  {
    id: "in_progress",
    name: "In Progress",
    description: "Remediation work and engineering action actively underway on site.",
    icon: "fa-solid fa-gear",
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    order: 4,
    isStepperStage: true,
    isActive: true,
    isArchived: false,
    workflowCategory: "active",
    allowedTransitions: ["action_taken", "under_review", "rejected"],
    transitionRules: {
      "action_taken": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      },
      "under_review": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      },
      "rejected": {
        allowedRoles: ["admin"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      }
    }
  },
  {
    id: "action_taken",
    name: "Action Taken",
    description: "Field work completed by department; awaiting formal sign-off and inspection.",
    icon: "fa-solid fa-truck-fast",
    color: "#0891b2",
    bgColor: "#ecfeff",
    borderColor: "#a5f3fc",
    order: 5,
    isStepperStage: true,
    isActive: true,
    isArchived: false,
    workflowCategory: "active",
    allowedTransitions: ["in_progress", "resolved"],
    transitionRules: {
      "in_progress": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      },
      "resolved": {
        allowedRoles: ["admin", "receiver"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      }
    }
  },
  {
    id: "resolved",
    name: "Resolved",
    description: "Grievance successfully addressed, verified on site, and officially closed.",
    icon: "fa-solid fa-check-double",
    color: "#16a34a",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    order: 6,
    isStepperStage: true,
    isActive: true,
    isArchived: false,
    workflowCategory: "terminal",
    allowedTransitions: ["reopened"],
    transitionRules: {
      "reopened": {
        allowedRoles: ["admin"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      }
    }
  },
  {
    id: "rejected",
    name: "Rejected",
    description: "Out of Gram Panchayat administrative scope or invalid submission.",
    icon: "fa-solid fa-circle-xmark",
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    order: 98,
    isStepperStage: false,
    isActive: true,
    isArchived: false,
    workflowCategory: "terminal",
    allowedTransitions: ["reopened"],
    transitionRules: {
      "reopened": {
        allowedRoles: ["admin"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      }
    }
  },
  {
    id: "reopened",
    name: "Reopened",
    description: "Reopened by administration for citizen dissatisfaction or recurring issue.",
    icon: "fa-solid fa-rotate-left",
    color: "#c2410c",
    bgColor: "#fff7ed",
    borderColor: "#fed7aa",
    order: 99,
    isStepperStage: false,
    isActive: true,
    isArchived: false,
    workflowCategory: "special",
    allowedTransitions: ["assigned", "in_progress", "under_review"],
    transitionRules: {
      "assigned": {
        allowedRoles: ["admin"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      },
      "in_progress": {
        allowedRoles: ["admin"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      },
      "under_review": {
        allowedRoles: ["admin"],
        mandatoryRemarks: true,
        mandatoryEvidence: false,
        notificationTrigger: true
      }
    }
  }
];

class JanasevaStatusManager {
  constructor() {
    this.statuses = [];
    this.statusById = new Map();
    this.statusByName = new Map();
    this.initialized = false;
    this.initPromise = null;
  }

  async init() {
    if (this.initialized) return this.statuses;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      let loaded = null;

      // 1. Try Firestore complaintStatusConfig/current
      if (typeof window !== 'undefined' && window.isFirebaseAvailable && window.fbDb) {
        try {
          const doc = await window.fbDb.collection('complaintStatusConfig').doc('current').get();
          if (doc.exists && doc.data() && Array.isArray(doc.data().statuses)) {
            loaded = doc.data().statuses;
            console.log('[JANASEVA StatusManager] Loaded status config from Firestore.');
          }
        } catch (e) {
          console.warn('[JANASEVA StatusManager] Firestore config fetch notice:', e.message);
        }
      }

      // 2. Try LocalStorage
      if (!loaded && typeof JanasevaDB !== 'undefined') {
        loaded = JanasevaDB.get('complaint_status_config', null);
      }

      // 3. Fallback to defaults
      if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
        loaded = JSON.parse(JSON.stringify(DEFAULT_STATUS_CONFIG));
        if (typeof JanasevaDB !== 'undefined') {
          JanasevaDB.set('complaint_status_config', loaded);
        }
      }

      // Ensure authoritative canonical order: under_review is 3, in_progress is 4
      if (Array.isArray(loaded)) {
        const ur = loaded.find(s => s.id === 'under_review');
        const ip = loaded.find(s => s.id === 'in_progress');
        if (ur && ip && ur.order > ip.order) {
          ur.order = 3;
          ip.order = 4;
          if (typeof JanasevaDB !== 'undefined') {
            JanasevaDB.set('complaint_status_config', loaded);
          }
        }
      }

      this.statuses = loaded;
      this.rebuildIndex();
      this.initialized = true;
      return this.statuses;
    })();

    return this.initPromise;
  }

  rebuildIndex() {
    this.statusById.clear();
    this.statusByName.clear();
    for (const st of this.statuses) {
      if (st.id) this.statusById.set(st.id.toLowerCase(), st);
      if (st.name) this.statusByName.set(st.name.trim().toLowerCase(), st);
    }
  }

  // --------------------------------------------------------------------------
  // QUERY METHODS
  // --------------------------------------------------------------------------

  getAllStatuses(includeArchived = false) {
    if (includeArchived) return [...this.statuses];
    return this.statuses.filter(s => !s.isArchived);
  }

  getActiveStatuses() {
    return this.statuses.filter(s => s.isActive && !s.isArchived);
  }

  // Visual milestone stages (ordered 1 to N, e.g. Submitted -> Resolved)
  getStepperStages() {
    return this.getActiveStatuses()
      .filter(s => s.isStepperStage)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getStatus(idOrName) {
    if (!idOrName) return null;
    const clean = String(idOrName).trim().toLowerCase();
    return this.statusById.get(clean) || this.statusByName.get(clean) || null;
  }

  getStatusName(idOrName) {
    const st = this.getStatus(idOrName);
    return st ? st.name : String(idOrName);
  }

  getStatusColor(idOrName) {
    const st = this.getStatus(idOrName);
    return st && st.color ? st.color : '#0f56b3';
  }

  getStatusIconHTML(idOrName) {
    const st = this.getStatus(idOrName);
    const iconClass = st && st.icon ? st.icon : 'fa-solid fa-circle-info';
    const color = st && st.color ? `style="color: ${st.color};"` : '';
    return `<i class="${iconClass}" ${color}></i>`;
  }

  getStatusBadgeHTML(idOrName, extraClass = '') {
    const st = this.getStatus(idOrName);
    if (!st) {
      return `<span class="status-badge-pill badge-submitted ${extraClass}">${escapeHtml(String(idOrName || 'Submitted'))}</span>`;
    }
    const icon = st.icon ? `<i class="${st.icon}"></i> ` : '';
    const style = `background: ${st.bgColor || '#eff6ff'}; color: ${st.color || '#0f56b3'}; border: 1px solid ${st.borderColor || '#bfdbfe'};`;
    return `<span class="status-badge-pill ${extraClass}" style="${style}">${icon}${escapeHtml(st.name)}</span>`;
  }

  // --------------------------------------------------------------------------
  // TRANSITION VALIDATION & PERMISSION CHECKING
  // --------------------------------------------------------------------------

  getAllowedTransitions(currentStatusNameOrId, userRole = 'receiver') {
    const current = this.getStatus(currentStatusNameOrId);
    if (!current || !Array.isArray(current.allowedTransitions)) return [];

    const allowed = [];
    const role = (userRole || 'citizen').toLowerCase();

    for (const targetId of current.allowedTransitions) {
      const target = this.getStatus(targetId);
      if (!target || target.isArchived || !target.isActive) continue;

      const rule = (current.transitionRules && current.transitionRules[target.id]) ||
                   (current.transitionRules && current.transitionRules[targetId]) ||
                   { allowedRoles: ['admin', 'receiver'] };

      const hasRolePermission = role === 'admin' || (rule.allowedRoles && rule.allowedRoles.includes(role));
      if (hasRolePermission) {
        allowed.push({
          targetId: target.id,
          targetStatus: target,
          rule: rule
        });
      }
    }

    return allowed;
  }

  validateTransition(currentStatusNameOrId, targetStatusNameOrId, userRole, context = {}) {
    const current = this.getStatus(currentStatusNameOrId);
    const target = this.getStatus(targetStatusNameOrId);

    if (!current) return { valid: false, error: `Current status "${currentStatusNameOrId}" is unknown.` };
    if (!target) return { valid: false, error: `Target status "${targetStatusNameOrId}" is unknown.` };

    if (current.id === target.id) {
      return { valid: true, note: 'Status unchanged' };
    }

    // Check if target is in allowed transitions
    const isTargetAllowed = current.allowedTransitions &&
      (current.allowedTransitions.includes(target.id) || current.allowedTransitions.includes(target.name));
    
    if (!isTargetAllowed && userRole !== 'admin') {
      return {
        valid: false,
        error: `Workflow Error: Transition from "${current.name}" to "${target.name}" is not permitted by system workflow rules.`
      };
    }

    // Role check
    const rule = (current.transitionRules && (current.transitionRules[target.id] || current.transitionRules[target.name])) || {};
    const role = (userRole || 'citizen').toLowerCase();
    const allowedRoles = rule.allowedRoles || ['admin', 'receiver'];

    if (role !== 'admin' && !allowedRoles.includes(role)) {
      return {
        valid: false,
        error: `Authorization Error: Role "${userRole}" is not authorized to transition complaints to "${target.name}".`
      };
    }

    // Condition: Mandatory Remarks
    if (rule.mandatoryRemarks) {
      const remarks = (context.remarks || context.rejectionReason || context.reopenReason || context.officialResponse || '').trim();
      if (!remarks) {
        return {
          valid: false,
          error: `Mandatory Requirement: Please provide remarks/justification for transitioning to "${target.name}".`
        };
      }
    }

    // Condition: Mandatory Evidence
    if (rule.mandatoryEvidence) {
      if (!context.hasEvidence && !context.photoURL && (!context.supportingDocuments || context.supportingDocuments.length === 0)) {
        return {
          valid: false,
          error: `Mandatory Requirement: Transition to "${target.name}" requires supporting verification evidence.`
        };
      }
    }

    // Condition: Valid Panchayat & Receiver assignment
    if (rule.requiresReceiver && !context.assignedReceiverId && !context.assignedReceiverEmail) {
      return {
        valid: false,
        error: `Assignment Error: Transition to "${target.name}" requires a designated Receiver.`
      };
    }

    return { valid: true, rule: rule };
  }

  // --------------------------------------------------------------------------
  // DYNAMIC UI COMPONENT RENDERERS
  // --------------------------------------------------------------------------

  // Dynamically renders the 6-stage visual timeline stepper
  renderTimelineStepper(containerElOrId, currentStatusNameOrId) {
    const container = typeof containerElOrId === 'string' ? document.getElementById(containerElOrId) : containerElOrId;
    if (!container) return;

    const stages = this.getStepperStages();
    if (stages.length === 0) return;

    const current = this.getStatus(currentStatusNameOrId);
    const currentId = current ? current.id : 'submitted';

    // Find current index in stepper
    let currentIdx = stages.findIndex(s => s.id === currentId);
    if (currentIdx === -1) {
      // If special or terminal status like Rejected or Reopened
      if (currentId === 'rejected') {
        currentIdx = -1; // Special indicator
      } else if (currentId === 'reopened') {
        currentIdx = 0;
      } else {
        currentIdx = 0;
      }
    }

    const pct = stages.length > 1 && currentIdx >= 0 ?
      Math.min(100, Math.round((currentIdx / (stages.length - 1)) * 100)) : 0;

    let nodesHtml = stages.map((st, idx) => {
      let stateClass = '';
      let nodeContent = '';

      if (currentIdx === -1 && currentId === 'rejected') {
        stateClass = 'rejected-stepper-state';
        nodeContent = `<i class="fa-solid fa-circle-xmark" style="color: #dc2626;"></i>`;
      } else if (idx < currentIdx) {
        stateClass = 'completed';
        nodeContent = '<i class="fa-solid fa-check"></i>';
      } else if (idx === currentIdx) {
        stateClass = 'active';
        nodeContent = `<i class="${st.icon || 'fa-solid fa-circle-dot'}" style="color: ${st.color || 'var(--color-royal-blue)'}; font-size: 11px;"></i>`;
      } else {
        nodeContent = '';
      }

      const activeNodeStyle = (idx === currentIdx) ? 
        `style="border-color: ${st.color || 'var(--color-royal-blue)'}; color: ${st.color || 'var(--color-royal-blue)'}; box-shadow: 0 0 0 4px ${st.borderColor || 'rgba(15, 86, 179, 0.2)'};"` : '';

      return `
        <div class="timeline-step ${stateClass}" id="dyn-step-${st.id}">
          <div class="timeline-node" ${activeNodeStyle}>${nodeContent}</div>
          <div class="timeline-step-label">${escapeHtml(st.name)}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="timeline-connecting-line">
        <div class="timeline-connecting-progress" id="timeline-progress-bar" style="width: ${pct}%;"></div>
      </div>
      <div class="timeline-steps-wrap" style="display: flex; justify-content: space-between; position: relative; width: 100%;">
        ${nodesHtml}
      </div>
    `;

    // Apply translations
    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }
  }

  // Dynamically renders the Status Indicators Legend card (e.g. on track.html right sidebar)
  renderStatusIndicators(containerElOrId) {
    const container = typeof containerElOrId === 'string' ? document.getElementById(containerElOrId) : containerElOrId;
    if (!container) return;

    const activeList = this.getActiveStatuses().sort((a, b) => (a.order || 0) - (b.order || 0));

    container.innerHTML = `
      <h2 style="font-size: 18px; font-weight: 800; color: #0b2545; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <i class="fa-regular fa-flag" style="color: #0f56b3;"></i> Status Indicators
      </h2>
      <div class="status-indicators-list" style="display: flex; flex-direction: column; gap: 10px;">
        ${activeList.map(st => `
          <div class="indicator-item status-indicator-item" style="border-left: 4px solid ${st.color || '#0f56b3'}; background: ${st.bgColor || '#f8fafc'}; padding: 10px 14px; border-radius: 6px; display: flex; gap: 12px; align-items: flex-start;">
            <i class="${st.icon || 'fa-solid fa-circle-info'} indicator-icon" style="color: ${st.color || '#0f56b3'}; font-size: 16px; margin-top: 3px;"></i>
            <div>
              <div class="indicator-title" style="font-weight: 700; font-size: 13.5px; color: #0b2545;">${escapeHtml(st.name)}</div>
              <div class="indicator-desc" style="font-size: 12px; color: #475569; line-height: 1.4; margin-top: 2px;">${escapeHtml(st.description)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }
  }

  // Populates status transition select element with only authorized transitions
  populateTransitionDropdown(selectElOrId, currentStatusNameOrId, userRole = 'receiver') {
    const select = typeof selectElOrId === 'string' ? document.getElementById(selectElOrId) : selectElOrId;
    if (!select) return;

    const current = this.getStatus(currentStatusNameOrId);
    const allowed = this.getAllowedTransitions(currentStatusNameOrId, userRole);

    let html = '';
    if (current) {
      html += `<option value="${escapeHtml(current.name)}" selected>${escapeHtml(current.name)} (Current Status)</option>`;
    }

    if (allowed.length === 0) {
      html += `<option value="" disabled>-- No further transitions available --</option>`;
    } else {
      allowed.forEach(item => {
        if (!current || item.targetStatus.id !== current.id) {
          html += `<option value="${escapeHtml(item.targetStatus.name)}">${escapeHtml(item.targetStatus.name)} — ${escapeHtml(item.targetStatus.description.substring(0, 45))}...</option>`;
        }
      });
    }

    // Admins can also transition anywhere if in emergency override mode
    if (userRole === 'admin') {
      const allActive = this.getActiveStatuses();
      const otherStatuses = allActive.filter(s => !allowed.some(a => a.targetStatus.id === s.id) && (!current || s.id !== current.id));
      if (otherStatuses.length > 0) {
        html += `<optgroup label="Administrator Override Options">`;
        otherStatuses.forEach(s => {
          html += `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (Admin Override)</option>`;
        });
        html += `</optgroup>`;
      }
    }

    select.innerHTML = html;
  }

  // --------------------------------------------------------------------------
  // STRICT ADMIN MUTATIONS & AUDIT LOGGING
  // --------------------------------------------------------------------------

  // Reset Configuration to Official Default Schema
  async resetToDefaults(reason = "Restored official Gram Panchayat 8-stage complaint lifecycle schema") {
    const adminUser = this.verifyAdminAccess();
    const oldConfig = JSON.parse(JSON.stringify(this.statuses));
    this.statuses = JSON.parse(JSON.stringify(DEFAULT_STATUS_CONFIG));
    this.rebuildIndex();
    await this.persistConfiguration(adminUser, 'RESET_DEFAULT_STATUSES', 'all', oldConfig, this.statuses, reason);
    return this.statuses;
  }

  // Check if current user is an authenticated administrator
  verifyAdminAccess() {
    if (!window.authService || !window.authService.isAdmin()) {
      throw new Error("Security Violation: Only authenticated Administrators can modify Complaint Status Management settings.");
    }
    return window.authService.currentUser;
  }

  // Save / Update a Status Definition
  async saveStatus(statusData, reason = "Administrator status update") {
    const adminUser = this.verifyAdminAccess();

    if (!statusData.name || !statusData.name.trim()) {
      throw new Error("Status Name is required.");
    }

    const cleanName = statusData.name.trim();
    const cleanId = (statusData.id || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_')).trim();

    const existingIdx = this.statuses.findIndex(s => s.id === cleanId);
    const oldConfig = existingIdx >= 0 ? JSON.parse(JSON.stringify(this.statuses[existingIdx])) : null;

    const newRecord = {
      id: cleanId,
      name: cleanName,
      description: (statusData.description || '').trim(),
      icon: statusData.icon || 'fa-solid fa-circle-info',
      color: statusData.color || '#0f56b3',
      bgColor: statusData.bgColor || '#eff6ff',
      borderColor: statusData.borderColor || '#bfdbfe',
      order: parseInt(statusData.order, 10) || (this.statuses.length + 1),
      isStepperStage: !!statusData.isStepperStage,
      isActive: statusData.isActive !== false,
      isArchived: !!statusData.isArchived,
      workflowCategory: statusData.workflowCategory || 'active',
      allowedTransitions: Array.isArray(statusData.allowedTransitions) ? statusData.allowedTransitions : [],
      transitionRules: statusData.transitionRules || {}
    };

    if (existingIdx >= 0) {
      this.statuses[existingIdx] = newRecord;
    } else {
      this.statuses.push(newRecord);
    }

    this.rebuildIndex();
    await this.persistConfiguration(adminUser, existingIdx >= 0 ? 'STATUS_MODIFIED' : 'STATUS_CREATED', cleanId, oldConfig, newRecord, reason);
    return newRecord;
  }

  // Archive a Status (safe retirement without breaking historical grievances)
  async archiveStatus(statusId, reason = "Administrator archived status") {
    const adminUser = this.verifyAdminAccess();
    const st = this.getStatus(statusId);
    if (!st) throw new Error(`Status ID "${statusId}" not found.`);

    const oldConfig = JSON.parse(JSON.stringify(st));
    st.isArchived = true;
    st.isActive = false;

    this.rebuildIndex();
    await this.persistConfiguration(adminUser, 'STATUS_ARCHIVED', st.id, oldConfig, st, reason);
    return st;
  }

  // Permanently delete a Status ONLY if no historical complaints use it
  async deleteStatus(statusId, reason = "Administrator deleted status") {
    const adminUser = this.verifyAdminAccess();
    const st = this.getStatus(statusId);
    if (!st) throw new Error(`Status ID "${statusId}" not found.`);

    // Check usage across historical complaints
    const complaints = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('complaints', []) : [];
    const isUsedLocally = complaints.some(c => 
      (c.status && c.status.toLowerCase() === st.name.toLowerCase()) ||
      (c.status && c.status.toLowerCase() === st.id.toLowerCase())
    );

    if (isUsedLocally) {
      throw new Error(`Integrity Protection: Status "${st.name}" cannot be deleted because historical complaint records currently reference it. Please use "Archive Status" instead.`);
    }

    const oldConfig = JSON.parse(JSON.stringify(st));
    this.statuses = this.statuses.filter(s => s.id !== st.id);
    this.rebuildIndex();

    await this.persistConfiguration(adminUser, 'STATUS_DELETED', st.id, oldConfig, null, reason);
    return true;
  }

  // Persist to Cloud Firestore + LocalStorage and write immutable Audit Log
  async persistConfiguration(adminUser, action, statusId, oldConfig, newConfig, reason) {
    const nowISO = new Date().toISOString();
    const nowReadable = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // 1. Mirror locally
    if (typeof JanasevaDB !== 'undefined') {
      JanasevaDB.set('complaint_status_config', this.statuses);
    }

    // 2. Audit Log record
    const auditRecord = {
      logId: 'stat-audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      action: action,
      adminId: adminUser ? adminUser.uid : 'admin',
      adminEmail: adminUser ? adminUser.email : '',
      statusId: statusId,
      previousConfig: oldConfig,
      newConfig: newConfig,
      reason: reason || 'Routine system administration',
      timestamp: nowISO,
      formattedTime: nowReadable
    };

    if (typeof JanasevaDB !== 'undefined') {
      const audits = JanasevaDB.get('statusAuditLogs', []);
      audits.unshift(auditRecord);
      JanasevaDB.set('statusAuditLogs', audits.slice(0, 100));
    }

    // 3. Write to Firestore if available & require confirmation (do not silently mask write errors)
    if (typeof window !== 'undefined' && window.isFirebaseAvailable && window.fbDb) {
      await window.fbDb.collection('complaintStatusConfig').doc('current').set({
        statuses: this.statuses,
        updatedAt: nowISO,
        updatedBy: adminUser ? adminUser.email : ''
      });
      await window.fbDb.collection('adminAuditLogs').doc(auditRecord.logId).set(auditRecord);
    }

    // 4. Global Broadcast Event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('janaseva:statusConfigUpdated', {
        detail: { action, statusId, statuses: this.statuses }
      }));
    }
  }

  // Refresh latest saved workflow status rules from Firestore/DB (never wipes valid state on network error)
  async refreshFromRemote() {
    if (typeof window !== 'undefined' && window.isFirebaseAvailable && window.fbDb) {
      const doc = await window.fbDb.collection('complaintStatusConfig').doc('current').get();
      if (doc.exists && doc.data() && Array.isArray(doc.data().statuses) && doc.data().statuses.length > 0) {
        this.statuses = doc.data().statuses;
        this.rebuildIndex();
        if (typeof JanasevaDB !== 'undefined') {
          JanasevaDB.set('complaint_status_config', this.statuses);
        }
        return {
          statuses: this.statuses,
          updatedAt: doc.data().updatedAt || null,
          updatedBy: doc.data().updatedBy || ''
        };
      }
      return { statuses: this.statuses, updatedAt: null, updatedBy: '' };
    }

    if (typeof JanasevaDB !== 'undefined') {
      const local = JanasevaDB.get('complaint_status_config', null);
      if (Array.isArray(local) && local.length > 0) {
        this.statuses = local;
        this.rebuildIndex();
      }
    }
    return { statuses: this.statuses, updatedAt: null, updatedBy: '' };
  }

  // Fetch Audit Trail of changes
  async getAuditLogs() {
    let logs = [];
    if (typeof window !== 'undefined' && window.isFirebaseAvailable && window.fbDb && window.authService && window.authService.isAdmin()) {
      try {
        const snap = await window.fbDb.collection('adminAuditLogs').orderBy('timestamp', 'desc').limit(50).get();
        if (!snap.empty) {
          snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn('[JANASEVA StatusManager] Audit log fetch notice:', e.message);
      }
    }

    if (logs.length === 0 && typeof JanasevaDB !== 'undefined') {
      logs = JanasevaDB.get('statusAuditLogs', []);
    }

    return logs;
  }
}

// Global Singleton Instance
if (typeof window !== 'undefined') {
  window.janasevaStatusManager = new JanasevaStatusManager();
  // Auto-init on load
  document.addEventListener('DOMContentLoaded', () => {
    window.janasevaStatusManager.init();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { JanasevaStatusManager, DEFAULT_STATUS_CONFIG };
}
