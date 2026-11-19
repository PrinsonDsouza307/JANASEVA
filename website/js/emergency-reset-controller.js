/**
 * JANASEVA – Emergency Data Reset UI Controller
 * Orchestrates 7 Security Checkpoints, Live Progress Bar, Metrics, Backups, and Audit UI
 */

(function () {
  let currentWizardMode = 'MODE_A_OPERATIONAL';
  let currentWizardCheckpoint = 1;
  let wizardBackupRecord = null;

  // Initialize Emergency Reset Tab
  window.initEmergencyResetTab = async function () {
    if (!window.authService || !window.authService.isAdmin()) {
      if (typeof showToast === 'function') {
        showToast('Access Denied: Emergency Control Centre requires Administrator privileges.', 'error');
      }
      if (typeof window.switchAdminTab === 'function') {
        window.switchAdminTab('complaints');
      }
      return;
    }

    await window.refreshEmergencyMetrics();
    await window.checkAndUpdateMaintenanceBadge();
    registerMaintenanceUSM();
    await window.renderEmergencyBackupsTable();
    await window.renderEmergencyAuditTable();
  };

  function registerMaintenanceUSM() {
    const usm = window.JanasevaSettings;
    const engine = window.janasevaEmergencyResetEngine;
    const form = document.getElementById('maintenance-settings-form');
    if (!usm || !engine || !form) return;

    usm.registerSection({
      sectionId: 'admin-maintenance',
      sectionName: 'Portal Maintenance Mode Settings',
      containerEl: '#maintenance-settings-card',
      formEl: '#maintenance-settings-form',
      statusHostEl: '#maintenance-usm-status',
      saveBtn: '#save-maintenance-btn',
      resetBtn: '#reset-maintenance-btn',
      refreshBtn: '#refresh-maintenance-btn',
      confirmResetTitle: 'Reset Portal Maintenance Mode to Normal Operational?',
      confirmResetMessage: 'This deactivates Maintenance Mode, restores normal citizen grievance submissions immediately, and records an operational notice.',
      confirmResetDetail: 'Scope: Only systemSettings/maintenance state is updated. All complaints, backups, and user accounts remain untouched.',
      onSave: async () => {
        const active = Boolean(document.getElementById('maintenance-active-toggle')?.checked);
        const notice = (document.getElementById('maintenance-notice-input')?.value || '').trim();
        if (active && !notice) {
          throw new Error('Please enter a Public Citizen Maintenance Notice before activating Maintenance Mode.');
        }
        const saved = await engine.setMaintenanceMode(active, notice || (active ? 'Scheduled System Maintenance in Progress' : 'Operations resumed.'));
        applyMaintenanceStateToDom(saved);
        return {
          savedAt: saved.updatedAt || new Date().toISOString(),
          updatedBy: saved.updatedBy || '',
          message: active ? 'Portal Maintenance Mode enabled and saved.' : 'Portal Maintenance Mode disabled (Normal Operational).'
        };
      },
      onReset: async () => {
        const saved = await engine.setMaintenanceMode(false, 'Operations resumed (reset to normal operational).');
        applyMaintenanceStateToDom(saved);
        return {
          savedAt: saved.updatedAt || new Date().toISOString(),
          updatedBy: saved.updatedBy || '',
          message: 'Portal reset to Normal Operational state.'
        };
      },
      onRefresh: async () => {
        const state = await engine.getMaintenanceMode({ strictRemote: true });
        applyMaintenanceStateToDom(state);
        return {
          savedAt: state.updatedAt || null,
          updatedBy: state.updatedBy || '',
          refreshedAt: new Date().toISOString(),
          message: 'Maintenance mode status reloaded from database.'
        };
      }
    });
  }

  function applyMaintenanceStateToDom(state) {
    const isMaintenanceActive = Boolean(state && state.active);
    const reasonText = (state && state.reason) ? String(state.reason) : '';

    const toggleEl = document.getElementById('maintenance-active-toggle');
    const noticeEl = document.getElementById('maintenance-notice-input');
    const run = () => {
      if (toggleEl) toggleEl.checked = isMaintenanceActive;
      if (noticeEl) noticeEl.value = reasonText;
    };
    if (window.JanasevaSettings) {
      window.JanasevaSettings.runProgrammaticUpdate('admin-maintenance', run);
    } else {
      run();
    }

    const badge = document.getElementById('maintenance-status-badge');
    const toggleBtn = document.getElementById('btn-toggle-maintenance');
    if (badge) {
      badge.className = 'admin-tab-badge';
      badge.style.background = isMaintenanceActive ? '#dc2626' : '#16a34a';
      badge.style.color = '#fff';
      badge.textContent = isMaintenanceActive ? 'ACTIVE (SUBMISSIONS PAUSED)' : 'NORMAL OPERATIONAL';
    }
    if (toggleBtn) {
      toggleBtn.innerHTML = isMaintenanceActive
        ? '<i class="fa-solid fa-play"></i> Deactivate Maintenance Mode'
        : '<i class="fa-solid fa-pause"></i> Activate Maintenance Mode';
      toggleBtn.style.background = isMaintenanceActive ? '#16a34a' : '#ea580c';
    }
  }

  // Refresh System Metrics Panel
  window.refreshEmergencyMetrics = async function () {
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    try {
      const metrics = await engine.fetchSystemDataMetrics();

      const elComp = document.getElementById('impact-complaints-count');
      if (elComp) elComp.textContent = metrics.complaintsCount.toLocaleString();

      const elSub = document.getElementById('impact-subcollections-count');
      if (elSub) elSub.textContent = metrics.subcollectionsCount.toLocaleString();

      const elLogs = document.getElementById('impact-logs-count');
      if (elLogs) elLogs.textContent = metrics.logsCount.toLocaleString();

      const elCit = document.getElementById('impact-citizens-count');
      if (elCit) elCit.textContent = metrics.citizenUsersCount.toLocaleString();

      const elOff = document.getElementById('impact-offline-count');
      if (elOff) elOff.textContent = metrics.offlineQueuedCount.toLocaleString();

      const elVol = document.getElementById('impact-storage-kb');
      if (elVol) elVol.textContent = `${metrics.estimatedKb.toLocaleString()} KB`;
    } catch (err) {
      console.warn('Error refreshing emergency metrics:', err);
    }
  };

  // Maintenance Badge Checker
  window.checkAndUpdateMaintenanceBadge = async function () {
    const engine = window.janasevaEmergencyResetEngine;
    let state = { active: false, reason: '', updatedBy: '', updatedAt: null };
    if (engine && typeof engine.getMaintenanceMode === 'function') {
      try {
        state = await engine.getMaintenanceMode({ strictRemote: false });
      } catch (e) { /* keep fallback */ }
    }
    applyMaintenanceStateToDom(state);
    if (window.JanasevaSettings && window.JanasevaSettings.sections.has('admin-maintenance')) {
      window.JanasevaSettings.markClean('admin-maintenance', {
        savedAt: state.updatedAt || null,
        updatedBy: state.updatedBy || ''
      });
    }
  };

  // Toggle Maintenance Mode
  window.toggleMaintenanceMode = async function () {
    if (!window.authService || !window.authService.isAdmin()) return;
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    const current = await engine.getMaintenanceMode({ strictRemote: false });
    const newActiveState = !current.active;
    const noticeInput = document.getElementById('maintenance-notice-input');
    const customNotice = noticeInput ? noticeInput.value.trim() : '';

    const confirmed = window.JanasevaSettings
      ? await window.JanasevaSettings.confirm({
          title: newActiveState ? 'Activate Portal Maintenance Mode?' : 'Deactivate Maintenance Mode?',
          message: newActiveState
            ? 'Enabling Maintenance Mode pauses citizen grievance submissions across the portal.'
            : 'Disabling Maintenance Mode immediately resumes normal citizen grievance submissions.',
          confirmText: newActiveState ? 'Activate Maintenance Mode' : 'Resume Normal Operations',
          danger: newActiveState
        })
      : true;
    if (!confirmed) return;

    try {
      const reasonText = newActiveState
        ? (customNotice || 'Scheduled System Maintenance in Progress')
        : 'Operations resumed.';
      const saved = await engine.setMaintenanceMode(newActiveState, reasonText);
      applyMaintenanceStateToDom(saved);
      if (window.JanasevaSettings && window.JanasevaSettings.sections.has('admin-maintenance')) {
        window.JanasevaSettings.markClean('admin-maintenance', {
          savedAt: saved.updatedAt,
          updatedBy: saved.updatedBy
        });
      }
      if (typeof showToast === 'function') {
        showToast(`Portal maintenance mode is now ${newActiveState ? 'ENABLED' : 'DISABLED'}.`, newActiveState ? 'warning' : 'success');
      }
    } catch (err) {
      if (window.JanasevaSettings && window.JanasevaSettings.sections.has('admin-maintenance')) {
        window.JanasevaSettings.setSectionError('admin-maintenance', err.message || 'Failed to update maintenance mode.');
      }
      if (typeof showToast === 'function') showToast('Failed to update maintenance mode: ' + err.message, 'error');
    }
  };

  // Open 7-Checkpoint Wizard
  window.openResetWizard = async function (mode) {
    if (!window.authService || !window.authService.isAdmin()) {
      (window.janasevaAlert || alert)('Access Denied: Only Administrator accounts can launch Emergency Reset.');
      return;
    }

    currentWizardMode = mode || 'MODE_A_OPERATIONAL';
    currentWizardCheckpoint = 1;
    wizardBackupRecord = null;

    // Reset wizard input fields
    const pwdInput = document.getElementById('wizard-admin-password');
    if (pwdInput) pwdInput.value = '';
    const phraseInput = document.getElementById('wizard-security-phrase');
    if (phraseInput) phraseInput.value = '';
    const chk1 = document.getElementById('chk-consequence-1');
    if (chk1) chk1.checked = false;
    const chk2 = document.getElementById('chk-consequence-2');
    if (chk2) chk2.checked = false;
    const chk3 = document.getElementById('chk-consequence-3');
    if (chk3) chk3.checked = false;

    // Update Modal Titles according to Mode
    const modeBadge = document.getElementById('wizard-mode-badge');
    const modeTitle = document.getElementById('wizard-mode-title');
    const modeDesc = document.getElementById('wizard-mode-desc');

    const modeMap = {
      'CATEGORY_A_TEMP_DATA': {
        badge: 'CATEGORY A – CLEAR TEMP DATA', bg: '#0284c7',
        title: 'Flush Temporary Caches & Delivery Logs',
        desc: 'Clears offline IndexedDB draft queues, session storage, and email/WhatsApp logs. All citizen grievances and user profiles remain untouched.',
        compWipe: false, citWipe: false
      },
      'CATEGORY_B_SELECTED_COMPLAINTS': {
        badge: 'CATEGORY B – GRIEVANCE RECORDS RESET', bg: '#ea580c',
        title: 'Operational Grievance Data Cleanse',
        desc: 'Purges complaints, review timelines, official responses, and delivery logs while preserving all user account profiles and settings.',
        compWipe: true, citWipe: false
      },
      'MODE_A_OPERATIONAL': {
        badge: 'CATEGORY B – OPERATIONAL RESET', bg: '#0284c7',
        title: 'Operational Grievance Data Cleanse',
        desc: 'Purges complaints, review timelines, chat messages and offline queues while preserving all administrator, receiver, and citizen user profiles.',
        compWipe: true, citWipe: false
      },
      'CATEGORY_C_CITIZEN_DATA': {
        badge: 'CATEGORY C – CITIZEN REGISTRY RESET', bg: '#9333ea',
        title: 'Reset Citizen Accounts & Registrations',
        desc: 'Purges citizen user registrations and their grievances. Gram Panchayat receivers and Administrator remain active.',
        compWipe: true, citWipe: true
      },
      'CATEGORY_D_RECEIVER_DATA': {
        badge: 'CATEGORY D – RECEIVER DATA RESET', bg: '#475569',
        title: 'Reset Receiver Settings & Delivery Profiles',
        desc: 'Restores receiver profile configurations and email delivery settings to system defaults. Citizen complaints and citizen accounts remain intact.',
        compWipe: false, citWipe: false
      },
      'CATEGORY_E_FULL_RESET': {
        badge: 'CATEGORY E – COMPLETE FACTORY RESET', bg: '#dc2626',
        title: 'Full Application Data Reset',
        desc: 'Complete system factory reset. Purges all operational data and citizen registrations. Super Admin () is strictly preserved.',
        compWipe: true, citWipe: true
      },
      'MODE_B_COMPLETE': {
        badge: 'CATEGORY E – COMPLETE FACTORY RESET', bg: '#dc2626',
        title: 'Complete System Baseline Reset',
        desc: 'Purges all complaints, notifications, and citizen registrations for fresh deployment baseline. Strictly preserves Super Admin ().',
        compWipe: true, citWipe: true
      }
    };

    const cfg = modeMap[currentWizardMode] || modeMap['CATEGORY_B_SELECTED_COMPLAINTS'];
    if (modeBadge) {
      modeBadge.textContent = cfg.badge;
      modeBadge.style.background = cfg.bg;
    }
    if (modeTitle) modeTitle.textContent = cfg.title;
    if (modeDesc) modeDesc.textContent = cfg.desc;

    // Refresh metrics for Checkpoint 2
    await window.refreshEmergencyMetrics();

    // Populate Checkpoint 2 Impact Table
    const engine = window.janasevaEmergencyResetEngine;
    if (engine && engine.systemMetrics) {
      const m = engine.systemMetrics;
      const tBody = document.getElementById('wizard-impact-tbody');
      if (tBody) {
        tBody.innerHTML = `
          <tr>
            <td><strong>Citizen Grievances &amp; Attachments</strong></td>
            <td><code>complaints</code></td>
            <td><span class="badge-count" style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:10px; font-weight:700;">${m.complaintsCount}</span></td>
            <td><strong style="color:#dc2626;">WIPED</strong></td>
          </tr>
          <tr>
            <td><strong>Status Histories &amp; Review Notes</strong></td>
            <td><code>complaints/{id}/statusHistory</code></td>
            <td><span class="badge-count" style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:10px; font-weight:700;">${m.subcollectionsCount}</span></td>
            <td><strong style="color:#dc2626;">WIPED</strong></td>
          </tr>
          <tr>
            <td><strong>Email &amp; WhatsApp Notifications</strong></td>
            <td><code>emailLogs, whatsappLogs</code></td>
            <td><span class="badge-count" style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:10px; font-weight:700;">${m.logsCount}</span></td>
            <td><strong style="color:#dc2626;">WIPED</strong></td>
          </tr>
          <tr>
            <td><strong>Registered Citizen Accounts</strong></td>
            <td><code>users (role: citizen)</code></td>
            <td><span class="badge-count" style="background:#f1f5f9; color:#0f172a; padding:2px 8px; border-radius:10px; font-weight:700;">${m.citizenUsersCount}</span></td>
            <td>${cfg.citWipe ? '<strong style=\"color:#dc2626;\">WIPED</strong>' : '<strong style=\"color:#16a34a;\">PRESERVED</strong>'}</td>
          </tr>
          <tr>
            <td><strong>Gram Panchayat Official Receivers</strong></td>
            <td><code>users (role: receiver)</code></td>
            <td><span class="badge-count" style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:10px; font-weight:700;">${m.receiverUsersCount}</span></td>
            <td><strong style="color:#16a34a;">PRESERVED</strong></td>
          </tr>
          <tr>
            <td><strong>Super Admin Account</strong></td>
            <td><code></code></td>
            <td><span class="badge-count" style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:10px; font-weight:700;">1</span></td>
            <td><strong style="color:#16a34a;">PRESERVED ALWAYS</strong></td>
          </tr>
          <tr>
            <td><strong>IndexedDB Offline Submission Queue</strong></td>
            <td><code>submissionQueue, complaintDrafts</code></td>
            <td><span class="badge-count" style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:10px; font-weight:700;">${m.offlineQueuedCount}</span></td>
            <td><strong style="color:#dc2626;">FLUSHED</strong></td>
          </tr>
        `;
      }
    }

    window.updateWizardCheckpointUI(1);

    const modal = document.getElementById('modal-emergency-reset-wizard');
    if (modal) modal.classList.add('active');
  };

  // Close Wizard
  window.closeResetWizard = function () {
    const modal = document.getElementById('modal-emergency-reset-wizard');
    if (modal) modal.classList.remove('active');
  };

  // Switch Checkpoint in Wizard
  window.updateWizardCheckpointUI = function (step) {
    currentWizardCheckpoint = step;

    // Update Step Indicators (1 to 7)
    for (let i = 1; i <= 7; i++) {
      const stepEl = document.getElementById(`wizard-step-node-${i}`);
      const paneEl = document.getElementById(`wizard-pane-${i}`);

      if (stepEl) {
        stepEl.classList.toggle('active', i === step);
        stepEl.classList.toggle('completed', i < step);
      }
      if (paneEl) {
        paneEl.style.display = i === step ? 'block' : 'none';
      }
    }

    // Scroll modal body to top
    const modalBody = document.querySelector('#modal-emergency-reset-wizard .modal-body-scroll');
    if (modalBody) modalBody.scrollTop = 0;
  };

  // Navigate Wizard Forward
  window.goToNextCheckpoint = async function () {
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    if (currentWizardCheckpoint === 1) {
      // Step 1: Mode confirmed
      window.updateWizardCheckpointUI(2);
    } else if (currentWizardCheckpoint === 2) {
      // Step 2: Impact confirmed -> proceed to Step 3 (Backup)
      window.updateWizardCheckpointUI(3);
      // Auto-trigger backup creation if not already created
      if (!wizardBackupRecord) {
        await window.executePreResetBackupInWizard();
      }
    } else if (currentWizardCheckpoint === 3) {
      // Step 3: Verify Backup is Ready
      if (!wizardBackupRecord) {
        (window.janasevaAlert || alert)('Please create and verify the pre-reset backup snapshot before proceeding.');
        return;
      }
      window.updateWizardCheckpointUI(4);
      setTimeout(() => {
        const pwd = document.getElementById('wizard-admin-password');
        if (pwd) pwd.focus();
      }, 100);
    } else if (currentWizardCheckpoint === 4) {
      // Step 4: Administrator Re-authentication
      const pwdInput = document.getElementById('wizard-admin-password');
      const password = (pwdInput?.value || '').trim();

      if (!password) {
        (window.janasevaAlert || alert)('Please enter your administrator password to re-authenticate.');
        if (pwdInput) pwdInput.focus();
        return;
      }

      try {
        const btn = document.getElementById('btn-wizard-step-4-next');
        if (btn) btn.disabled = true;
        await engine.authenticateAdminPassword(password);
        if (btn) btn.disabled = false;
        window.updateWizardCheckpointUI(5);
        setTimeout(() => {
          const phrase = document.getElementById('wizard-security-phrase');
          if (phrase) phrase.focus();
        }, 100);
      } catch (authErr) {
        const btn = document.getElementById('btn-wizard-step-4-next');
        if (btn) btn.disabled = false;
        (window.janasevaAlert || alert)(authErr.message || 'Incorrect password.');
        if (pwdInput) pwdInput.focus();
      }
    } else if (currentWizardCheckpoint === 5) {
      // Step 5: Security Phrase Confirmation
      const phraseInput = document.getElementById('wizard-security-phrase');
      const phrase = (phraseInput?.value || '').trim();

      if (phrase !== 'RESET JANASEVA') {
        (window.janasevaAlert || alert)("Security checkpoint failed! You must type exactly 'RESET JANASEVA'.");
        if (phraseInput) phraseInput.focus();
        return;
      }
      window.updateWizardCheckpointUI(6);
    } else if (currentWizardCheckpoint === 6) {
      // Step 6: Consequence Checkboxes
      const c1 = document.getElementById('chk-consequence-1')?.checked;
      const c2 = document.getElementById('chk-consequence-2')?.checked;
      const c3 = document.getElementById('chk-consequence-3')?.checked;

      if (!c1 || !c2 || !c3) {
        (window.janasevaAlert || alert)('Please acknowledge all three safety and consequence check items to proceed.');
        return;
      }
      window.updateWizardCheckpointUI(7);
      window.armFinalExecutionButton();
    }
  };

  // Navigate Wizard Back
  window.goToPrevCheckpoint = function () {
    if (currentWizardCheckpoint > 1) {
      window.updateWizardCheckpointUI(currentWizardCheckpoint - 1);
    }
  };

  // Execute Backup Snapshot in Step 3
  window.executePreResetBackupInWizard = async function () {
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    const statusBox = document.getElementById('wizard-backup-status-box');
    const checksumDisplay = document.getElementById('wizard-backup-checksum-val');
    const idDisplay = document.getElementById('wizard-backup-id-val');
    const btnNext = document.getElementById('btn-wizard-step-3-next');

    if (statusBox) {
      statusBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating pre-reset cryptographic snapshot backup and computing SHA-256 hash...';
      statusBox.style.color = '#0b2545';
    }
    if (btnNext) btnNext.disabled = true;

    try {
      const backup = await engine.createPreResetBackup(currentWizardMode);
      await engine.verifyBackupIntegrity(backup);
      wizardBackupRecord = backup;

      if (statusBox) {
        statusBox.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#16a34a;"></i> <strong>Pre-Reset Cryptographic Snapshot Verified &amp; Ready</strong>';
      }
      if (checksumDisplay) {
        checksumDisplay.textContent = backup.sha256Checksum;
      }
      if (idDisplay) {
        idDisplay.textContent = backup.backupId;
      }
      if (btnNext) btnNext.disabled = false;

      // Also refresh backup list in background
      window.renderEmergencyBackupsTable();
    } catch (err) {
      if (statusBox) {
        statusBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;"></i> Backup Failed: ${err.message}`;
      }
    }
  };

  // Download Backup in Wizard
  window.downloadWizardBackup = function () {
    if (!wizardBackupRecord) return;
    const engine = window.janasevaEmergencyResetEngine;
    if (engine) engine.downloadBackupSnapshot(wizardBackupRecord.backupId);
  };

  // Real-time Security Phrase Checker
  window.checkSecurityPhraseInput = function (input) {
    const val = (input.value || '').trim();
    const indicator = document.getElementById('phrase-match-indicator');
    if (!indicator) return;

    if (val === 'RESET JANASEVA') {
      indicator.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#16a34a;"></i> Phrase matches perfectly.';
      indicator.style.color = '#16a34a';
    } else {
      indicator.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#dc2626;"></i> Type <code>RESET JANASEVA</code> exactly.';
      indicator.style.color = '#dc2626';
    }
  };

  // Arm Final Execution Button (Checkpoint 7)
  window.armFinalExecutionButton = function () {
    const btnArm = document.getElementById('btn-arm-execute');
    if (!btnArm) return;

    btnArm.disabled = true;
    let countdown = 3;
    btnArm.innerHTML = `<i class="fa-solid fa-clock"></i> Safety Lock Arming in ${countdown}s...`;

    const timer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(timer);
        btnArm.disabled = false;
        btnArm.innerHTML = '<i class="fa-solid fa-skull-crossbones"></i> EXECUTE EMERGENCY DATA RESET NOW';
        btnArm.style.background = '#dc2626';
      } else {
        btnArm.innerHTML = `<i class="fa-solid fa-clock"></i> Safety Lock Arming in ${countdown}s...`;
      }
    }, 1000);
  };

  // Start Actual Reset Execution (Triggered from Checkpoint 7)
  window.triggerEmergencyResetExecution = async function () {
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    const pwd = (document.getElementById('wizard-admin-password')?.value || '').trim();
    const phrase = (document.getElementById('wizard-security-phrase')?.value || '').trim();

    // Close wizard modal and open live progress modal
    window.closeResetWizard();

    const progressModal = document.getElementById('modal-reset-progress');
    if (progressModal) progressModal.classList.add('active');

    // Reset progress UI elements
    const progressBar = document.getElementById('reset-progress-bar-fill');
    const percentText = document.getElementById('reset-progress-percent');
    const titleText = document.getElementById('reset-progress-step-title');
    const detailText = document.getElementById('reset-progress-step-detail');
    const logConsole = document.getElementById('reset-progress-log-console');
    const doneBtn = document.getElementById('btn-reset-done');

    if (progressBar) progressBar.style.width = '0%';
    if (percentText) percentText.textContent = '0%';
    if (logConsole) logConsole.innerHTML = '';
    if (doneBtn) doneBtn.style.display = 'none';

    // Reset 8 step icons
    for (let i = 1; i <= 8; i++) {
      const stepItem = document.getElementById(`exec-step-${i}`);
      if (stepItem) {
        stepItem.className = 'exec-step-item';
        const icon = stepItem.querySelector('.step-status-icon');
        if (icon) icon.innerHTML = '<i class="fa-regular fa-circle"></i>';
      }
    }

    const progressHandler = ({ step, totalSteps, title, detail, percent }) => {
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (percentText) percentText.textContent = `${percent}%`;
      if (titleText) titleText.textContent = title;
      if (detailText) detailText.textContent = detail;

      if (logConsole) {
        const time = new Date().toLocaleTimeString();
        logConsole.innerHTML += `<div><span style="color:#64748b;">[${time}]</span> <strong style="color:#0284c7;">[Step ${step}/${totalSteps}]</strong> ${detail}</div>`;
        logConsole.scrollTop = logConsole.scrollHeight;
      }

      // Update Step Nodes
      for (let i = 1; i <= 8; i++) {
        const item = document.getElementById(`exec-step-${i}`);
        if (!item) continue;
        const icon = item.querySelector('.step-status-icon');

        if (i < step) {
          item.className = 'exec-step-item completed';
          if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#16a34a;"></i>';
        } else if (i === step) {
          item.className = 'exec-step-item active';
          if (icon) icon.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:#0284c7;"></i>';
        } else {
          item.className = 'exec-step-item';
          if (icon) icon.innerHTML = '<i class="fa-regular fa-circle" style="color:#94a3b8;"></i>';
        }
      }
    };

    try {
      const result = await engine.executeMasterReset(currentWizardMode, phrase, pwd, progressHandler);

      // Finalize progress UI
      if (progressBar) progressBar.style.width = '100%';
      if (percentText) percentText.textContent = '100%';
      if (titleText) titleText.innerHTML = '<span style="color:#16a34a;"><i class="fa-solid fa-circle-check"></i> Reset Completed Successfully!</span>';
      if (detailText) detailText.textContent = `All operational data successfully purged. Pre-reset snapshot ${result.backupId} secured.`;

      // Mark step 8 completed
      const step8 = document.getElementById('exec-step-8');
      if (step8) {
        step8.className = 'exec-step-item completed';
        const icon = step8.querySelector('.step-status-icon');
        if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#16a34a;"></i>';
      }

      if (doneBtn) doneBtn.style.display = 'inline-block';

      // Refresh Dashboard Elements
      await window.refreshEmergencyMetrics();
      await window.renderEmergencyBackupsTable();
      await window.renderEmergencyAuditTable();

      if (typeof showToast === 'function') {
        showToast('Emergency Data Reset completed successfully.', 'success');
      }
    } catch (resetErr) {
      if (titleText) titleText.innerHTML = '<span style="color:#dc2626;"><i class="fa-solid fa-triangle-exclamation"></i> Reset Aborted with Error</span>';
      if (detailText) detailText.textContent = resetErr.message || 'An error occurred during reset.';

      if (logConsole) {
        logConsole.innerHTML += `<div style="color:#dc2626; font-weight:bold;">[ERROR] ${resetErr.message}</div>`;
      }
      if (doneBtn) {
        doneBtn.style.display = 'inline-block';
        doneBtn.textContent = 'Close Console';
      }
    }
  };

  // Close Progress Modal
  window.closeResetProgressModal = function () {
    const modal = document.getElementById('modal-reset-progress');
    if (modal) modal.classList.remove('active');
    // Refresh page / view to reflect cleaned state
    if (typeof loadComplaintsData === 'function') loadComplaintsData();
    if (typeof updateStatsAndBadges === 'function') updateStatsAndBadges();
    if (typeof renderComplaintsTable === 'function') renderComplaintsTable();
  };

  // Render Backups Table
  window.renderEmergencyBackupsTable = async function () {
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    const tbody = document.getElementById('emergency-backups-tbody');
    if (!tbody) return;

    try {
      const backups = await engine.getBackupList();
      if (!backups || backups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:18px; color:#64748b;">No pre-reset backup snapshots available yet.</td></tr>';
        return;
      }

      const esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      tbody.innerHTML = backups.map(b => {
        const id = esc(b.backupId || b.id);
        const counts = b.recordCounts || {};
        const countSummary = `${counts.complaints || 0} Grievances, ${counts.logs || 0} Logs, ${counts.users || 0} Users`;
        const fullHash = String(b.sha256Checksum || b.checksum || '');
        const checksum = esc(fullHash ? fullHash.substring(0, 16) + '...' : 'N/A');
        const dateStr = esc(b.createdAt ? new Date(b.createdAt).toLocaleString() : 'Recent');

        return `
          <tr>
            <td><code>${id}</code></td>
            <td>${dateStr}</td>
            <td><span class="badge" style="background:#0284c7; color:#fff; font-size:11px; padding:2px 6px; border-radius:4px;">${esc(b.mode || 'OPERATIONAL')}</span></td>
            <td><span title="${esc(fullHash)}"><code>${checksum}</code></span></td>
            <td><small>${countSummary}</small></td>
            <td><span class="badge" style="background:#16a34a; color:#fff; font-size:11px; padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-check"></i> VERIFIED</span></td>
            <td>
              <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" class="btn-sm" onclick="window.downloadEmergencyBackup('${id}')" title="Download JSON Snapshot" style="padding:4px 8px; font-size:11.5px; border-radius:4px; background:#f1f5f9; border:1px solid #cbd5e1; cursor:pointer;">
                  <i class="fa-solid fa-download"></i> JSON
                </button>
                <button type="button" class="btn-sm" onclick="window.restoreEmergencyBackupUI('${id}')" title="Restore this Snapshot" style="padding:4px 8px; font-size:11.5px; border-radius:4px; background:#fef3c7; border:1px solid #fcd34d; color:#92400e; font-weight:700; cursor:pointer;">
                  <i class="fa-solid fa-rotate-left"></i> Restore
                </button>
                <button type="button" class="btn-sm btn-delete-backup" onclick="window.deleteEmergencyBackupUI('${id}')" title="Permanently Delete Snapshot" style="padding:4px 8px; font-size:11.5px; border-radius:4px; background:#fee2e2; border:1px solid #fca5a5; color:#991b1b; font-weight:700; cursor:pointer;">
                  <i class="fa-solid fa-trash-can"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.warn('Error rendering backups table:', e);
    }
  };

  // Download Backup Handler
  window.downloadEmergencyBackup = async function (backupId) {
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;
    try {
      await engine.downloadBackupSnapshot(backupId);
    } catch (e) {
      (window.janasevaAlert || alert)('Could not download backup: ' + e.message);
    }
  };

  // Restore Backup Handler
  window.restoreEmergencyBackupUI = async function (backupId) {
    if (!window.authService || !window.authService.isAdmin()) return;
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    const confirmRestore = (window.janasevaConfirm || confirm)(`RESTORE CONFIRMATION:\n\nAre you sure you want to restore the system state from pre-reset backup ${backupId}?\n\nThis will reinstate previously archived grievances, history logs, and citizen registrations without duplicating records.`);
    if (!confirmRestore) return;

    try {
      if (typeof showToast === 'function') {
        showToast('Restoration in progress. Verifying checksum and writing records...', 'info');
      }
      const res = await engine.restoreFromBackup(backupId, (p) => {
        console.log(`[RESTORE ${p.step}/${p.totalSteps}] ${p.title}: ${p.detail}`);
      });

      (window.janasevaAlert || alert)(`Restoration Complete!\n\nRestored:\n- Grievances: ${res.restoredCounts.complaints}\n- Logs: ${res.restoredCounts.logs}\n- Users: ${res.restoredCounts.users}`);

      await window.refreshEmergencyMetrics();
      await window.renderEmergencyAuditTable();
      if (typeof loadComplaintsData === 'function') await loadComplaintsData();
      if (typeof updateStatsAndBadges === 'function') updateStatsAndBadges();
      if (typeof renderComplaintsTable === 'function') renderComplaintsTable();
    } catch (err) {
      (window.janasevaAlert || alert)('Restoration Failed: ' + err.message);
    }
  };

  // Delete Backup Handler (Strictly Administrator Only)
  window.deleteEmergencyBackupUI = async function (backupId) {
    if (!window.authService || !window.authService.isAdmin()) {
      (window.janasevaAlert || alert)("Unauthorized: Only Administrator can delete backups.");
      return;
    }
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    const confirmDelete = (window.janasevaConfirm || confirm)(`DELETE BACKUP CONFIRMATION:\n\nAre you sure you want to permanently delete backup snapshot ${backupId}?\n\nThis action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      await engine.deleteEmergencyBackup(backupId);
      if (typeof showToast === 'function') {
        showToast(`Backup snapshot ${backupId} permanently deleted.`, 'success');
      }
      await window.renderEmergencyBackupsTable();
      await window.renderEmergencyAuditTable();
    } catch (err) {
      (window.janasevaAlert || alert)('Failed to delete backup snapshot: ' + err.message);
    }
  };

  // Render Audit Table
  window.renderEmergencyAuditTable = async function () {
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    const tbody = document.getElementById('emergency-audit-tbody');
    if (!tbody) return;

    try {
      const logs = await engine.getAuditHistory();
      if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:18px; color:#64748b;">No emergency reset audit logs recorded yet. Ledger is clean.</td></tr>';
        return;
      }

      const esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      tbody.innerHTML = logs.map(l => {
        let rawId = l.logId || l.resetId || l.operationId || l.id;
        if (!rawId || rawId === 'undefined' || rawId === 'null') {
          rawId = 'LOG-' + (l.timestamp ? new Date(l.timestamp).getTime() : Date.now());
        }
        const id = esc(rawId);
        const timeStr = esc(l.executedAt || l.timestamp ? new Date(l.executedAt || l.timestamp).toLocaleString() : 'Recent');
        const isSuccess = l.status === 'SUCCESS' || l.action === 'RESTORE_BACKUP';
        const badgeColor = isSuccess ? '#16a34a' : '#dc2626';
        const counts = (typeof l.recordsDeleted === 'object' && l.recordsDeleted !== null) ? l.recordsDeleted : (l.restoredCounts || {});
        const countText = `${counts.complaints || 0} Complaints, ${counts.logs || 0} Logs, ${counts.users || 0} Users`;
        const checksum = esc(l.backupChecksum ? l.backupChecksum.substring(0, 16) + '...' : (l.backupId || 'N/A'));

        return `
          <tr>
            <td><code>${id}</code></td>
            <td>${timeStr}</td>
            <td>${esc(l.executedBy || l.restoredBy || l.adminEmail || '')}</td>
            <td><strong>${esc(l.mode || l.action || l.resetType || 'OPERATIONAL')}</strong></td>
            <td><small>${countText}</small></td>
            <td><span class="badge" style="background:${badgeColor}; color:#fff; font-size:11px; padding:2px 6px; border-radius:4px;">${esc(l.status || 'RESTORED')}</span></td>
            <td><code>${checksum}</code></td>
            <td style="text-align: right;">
              <button type="button" class="btn-sm btn-delete-row" onclick="deleteEmergencyAuditLogUI('${id}')" title="Delete Log Entry" style="padding: 4px 10px; font-size: 11.5px; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 4px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.warn('Error rendering audit table:', e);
    }
  };

  // Delete Single Audit Log Handler
  window.deleteEmergencyAuditLogUI = async function (logId) {
    if (!(window.janasevaConfirm || confirm)(`Are you sure you want to delete audit log entry "${logId}"? This record will be permanently removed from the ledger.`)) {
      return;
    }
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    try {
      await engine.deleteAuditLog(logId);
      if (typeof showToast === 'function') {
        showToast(`Audit log "${logId}" deleted successfully.`, 'success');
      }
      await window.renderEmergencyAuditTable();
    } catch (err) {
      console.error('Delete audit log error:', err);
      if (typeof showToast === 'function') {
        showToast('Failed to delete audit log: ' + err.message, 'error');
      } else {
        (window.janasevaAlert || alert)('Failed to delete audit log: ' + err.message);
      }
    }
  };

  // Clear All Audit Logs Handler
  window.clearAllEmergencyAuditLogsUI = async function () {
    if (!(window.janasevaConfirm || confirm)("Are you sure you want to clear the entire Emergency Reset Audit History Ledger? All recorded audit entries will be permanently deleted.")) {
      return;
    }
    const engine = window.janasevaEmergencyResetEngine;
    if (!engine) return;

    try {
      await engine.clearAllAuditLogs();
      if (typeof showToast === 'function') {
        showToast('All emergency reset audit logs have been successfully cleared.', 'success');
      }
      await window.renderEmergencyAuditTable();
    } catch (err) {
      console.error('Clear audit logs error:', err);
      if (typeof showToast === 'function') {
        showToast('Failed to clear audit ledger: ' + err.message, 'error');
      } else {
        (window.janasevaAlert || alert)('Failed to clear audit ledger: ' + err.message);
      }
    }
  };

  window.addEventListener('janaseva:langChanged', () => {
    if (typeof window.checkAndUpdateMaintenanceBadge === 'function') window.checkAndUpdateMaintenanceBadge();
    if (typeof window.renderEmergencyBackupsTable === 'function') window.renderEmergencyBackupsTable();
    if (typeof window.renderEmergencyAuditTable === 'function') window.renderEmergencyAuditTable();
    if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
  });

})();
