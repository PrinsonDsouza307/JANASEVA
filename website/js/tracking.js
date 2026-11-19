/**
 * JANASEVA – Complaint Status Tracking Logic
 * Supports tracking by Complaint ID or Email, 8-status lifecycle badges,
 * 6-stage visual timeline, public official communication thread,
 * and citizen follow-up replies (strictly filtering out internal administrative notes).
 */

let activeTrackedComplaint = null;
let activeComplaintUnsub = null;
let activeMessagesUnsub = null;

function cleanupActiveTrackedSubscriptions() {
  if (typeof activeComplaintUnsub === 'function') { activeComplaintUnsub(); activeComplaintUnsub = null; }
  if (typeof activeMessagesUnsub === 'function') { activeMessagesUnsub(); activeMessagesUnsub = null; }
}
window.addEventListener('pagehide', cleanupActiveTrackedSubscriptions);
let citizenHistoryList = [];
let pendingDeleteTrackComplaintId = null;
let currentDetailsComplaintId = null;

document.addEventListener('DOMContentLoaded', () => {
  const trackForm = document.getElementById('track-status-form');
  const trackInput = document.getElementById('track-search-input');
  const radioId = document.getElementById('search-by-id');
  const radioEmail = document.getElementById('search-by-email');
  const resultCard = document.getElementById('track-result-container');
  const notFoundCard = document.getElementById('track-not-found-card');

  // Radio toggle for Search by ID vs Email
  if (radioId && radioEmail && trackInput) {
    radioId.addEventListener('change', () => {
      const ph = "Enter Complaint ID (e.g. JAN-2026-XXXX)";
      trackInput.setAttribute('data-orig-ph', ph);
      const transPh = (typeof window.janasevaT === 'function') ? window.janasevaT(ph) : ph;
      trackInput.placeholder = transPh;
      trackInput._lastTransPh = transPh;
      trackInput.value = '';
    });
    radioEmail.addEventListener('change', () => {
      const ph = "Enter your registered email address";
      trackInput.setAttribute('data-orig-ph', ph);
      const transPh = (typeof window.janasevaT === 'function') ? window.janasevaT(ph) : ph;
      trackInput.placeholder = transPh;
      trackInput._lastTransPh = transPh;
      trackInput.value = '';
    });
  }

  // Dynamic Status Indicators initialization
  if (window.janasevaStatusManager) {
    window.janasevaStatusManager.init().then(() => {
      window.janasevaStatusManager.renderStatusIndicators('status-indicators-container');
    });
  }

  // Helper to reliably check admin vs receiver permissions
  function checkIsAdmin() {
    if (window.authService && typeof window.authService.isAdmin === 'function') {
      if (window.authService.isAdmin()) return true;
    }
    try {
      const stored = localStorage.getItem('JANASEVA_currentUser');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.role === 'admin') return true;
      }
    } catch(e) {}
    return false;
  }

  function checkIsAdminOrReceiver() {
    if (window.authService && typeof window.authService.isAdmin === 'function') {
      if (window.authService.isAdmin() || window.authService.isReceiver()) return true;
    }
    try {
      const stored = localStorage.getItem('JANASEVA_currentUser');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && (u.role === 'admin' || u.role === 'receiver')) return true;
      }
    } catch(e) {}
    return false;
  }

  function updateAdminEditControls(item, isAdminOrRec) {
    const isAuthorized = isAdminOrRec !== undefined ? isAdminOrRec : checkIsAdminOrReceiver();
    const isAdminOnly = checkIsAdmin();
    const adminEditBtn = document.getElementById('track-admin-edit-btn');
    if (adminEditBtn) {
      adminEditBtn.style.display = isAuthorized ? 'inline-flex' : 'none';
    }
    const adminDeleteBtn = document.getElementById('track-admin-delete-btn');
    if (adminDeleteBtn) {
      adminDeleteBtn.style.display = isAdminOnly ? 'inline-flex' : 'none';
    }
    const modalDeleteBtn = document.getElementById('track-modal-delete-btn');
    if (modalDeleteBtn) {
      modalDeleteBtn.style.display = isAdminOnly ? 'inline-flex' : 'none';
    }
    const intelLink = document.getElementById('res-ai-intel-link');
    if (intelLink) {
      intelLink.style.display = isAuthorized ? 'inline-flex' : 'none';
    }
    const badgeEl = document.getElementById('res-status-badge');
    if (badgeEl && isAuthorized) {
      badgeEl.style.cursor = 'pointer';
      badgeEl.title = 'Admin: Click to edit complaint status & official response';
      badgeEl.onclick = () => openAdminEditFromTracking();
    }
  }

  // Reactive listener for live Auth state changes
  window.addEventListener('janaseva:authChanged', () => {
    const isAuth = checkIsAdminOrReceiver();
    if (activeTrackedComplaint) {
      // Refresh full details when auth resolves so authorized owners see unmasked PII & reply controls
      renderComplaintDetails(activeTrackedComplaint);
      return;
    }
    updateAdminEditControls(activeTrackedComplaint, isAuth);
  });

  // Reactive listener for live Admin status configuration updates
  window.addEventListener('janaseva:statusConfigUpdated', () => {
    if (window.janasevaStatusManager) {
      window.janasevaStatusManager.renderStatusIndicators('status-indicators-container');
      if (activeTrackedComplaint) {
        window.janasevaStatusManager.renderTimelineStepper('timeline-stepper-container', activeTrackedComplaint.status);
        const badgeEl = document.getElementById('res-status-badge');
        if (badgeEl) {
          badgeEl.outerHTML = `<span id="res-status-badge">${window.janasevaStatusManager.getStatusBadgeHTML(activeTrackedComplaint.status)}</span>`;
        }
      }
    }
  });

  // Auto-search from URL param ?id=...
  const urlParams = new URLSearchParams(window.location.search);
  const queryId = urlParams.get('id');
  const queryEmail = urlParams.get('email');

  if (queryId && trackInput) {
    if (radioId) radioId.checked = true;
    trackInput.value = queryId;
    performTrack(queryId, 'id');
  } else if (queryEmail && trackInput) {
    if (radioEmail) radioEmail.checked = true;
    trackInput.value = queryEmail;
    performTrack(queryEmail, 'email');
  }

  // Auto-load history for logged-in citizen
  try {
    const loggedUser = (window.authService && window.authService.currentUser) || null;
    if (loggedUser && loggedUser.email && typeof window.loadCitizenComplaintHistory === 'function') {
      window.loadCitizenComplaintHistory(loggedUser.email, loggedUser.email);
    }
    if (window.authService && typeof window.authService.onAuthStateChanged === 'function') {
      window.authService.onAuthStateChanged((u) => {
        if (u && u.email && typeof window.loadCitizenComplaintHistory === 'function') {
          window.loadCitizenComplaintHistory(u.email, u.email);
        }
      });
    }
  } catch (err) {
    console.warn("Auto-load history initialization error:", err);
  }

  if (trackForm) {
    trackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = trackInput.value.trim();
      if (!val) {
        showToast("Please enter a Complaint ID or Email to search.", "warning");
        trackInput.focus();
        return;
      }
      const mode = radioEmail && radioEmail.checked ? 'email' : 'id';
      performTrack(val, mode);
    });
  }

  function maskCitizenName(name) {
    if (!name) return 'Anonymous Citizen';
    const parts = name.trim().split(/\s+/);
    return parts.map(p => {
      if (p.length <= 2) return p[0] + '*';
      return p[0] + '*'.repeat(Math.max(p.length - 2, 2)) + p[p.length - 1];
    }).join(' ');
  }

  function isAuthorizedForComplaint(item) {
    const user = (window.authService && window.authService.currentUser) || null;
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'receiver') return true;
    if (user.uid === item.citizenUid || user.uid === item.userId) return true;
    if (user.email && (user.email.toLowerCase() === (item.citizenEmail || '').toLowerCase())) return true;
    return false;
  }

  async function performTrack(searchTerm, mode) {
    const initialPrompt = document.getElementById('track-initial-prompt');
    if (initialPrompt) initialPrompt.style.display = 'none';
    if (resultCard) resultCard.style.display = 'none';
    if (notFoundCard) notFoundCard.style.display = 'none';

    const currentUser = (window.authService && window.authService.currentUser) || null;

    // Secure Email Search: Must be authenticated
    if (mode === 'email') {
      if (!currentUser) {
        showToast("To search by email, please log in with your verified account.", "warning");
        setTimeout(() => {
          window.location.href = `login.html?redirect=track.html`;
        }, 1200);
        return;
      }
      const isOfficial = currentUser.role === 'admin' || currentUser.role === 'receiver';
      if (!isOfficial && currentUser.email.toLowerCase() !== searchTerm.toLowerCase()) {
        showToast("Access Denied: You can only query grievances registered to your verified account.", "error");
        return;
      }
    }

    let complaints = JanasevaDB.get('complaints', []);

    // Fetch from live MongoDB Atlas
    if (window.JanasevaMongoDB) {
      try {
        if (typeof window.JanasevaMongoDB.ready === 'function') {
          await window.JanasevaMongoDB.ready();
        }
        if (mode === 'id') {
          const mongoDoc = await window.JanasevaMongoDB.getComplaintById(searchTerm);
          if (mongoDoc) {
            const idx = complaints.findIndex(c => c.complaintId === mongoDoc.complaintId);
            if (idx >= 0) complaints[idx] = mongoDoc;
            else complaints.unshift(mongoDoc);
          }
        } else {
          const mongoList = await window.JanasevaMongoDB.getComplaints({ citizenEmail: searchTerm.toLowerCase() });
          if (mongoList && mongoList.length > 0) {
            mongoList.forEach(item => {
              const idx = complaints.findIndex(c => c.complaintId === item.complaintId);
              if (idx >= 0) complaints[idx] = item;
              else complaints.push(item);
            });
          }
        }
      } catch (err) {
        console.warn("MongoDB fetch notice in tracking:", err.message);
      }
    }

    let foundComplaint = null;

    if (mode === 'id') {
      foundComplaint = complaints.find(c => c.complaintId.toLowerCase() === searchTerm.toLowerCase());
      if (foundComplaint && foundComplaint.citizenEmail && typeof window.loadCitizenComplaintHistory === 'function') {
        window.loadCitizenComplaintHistory(foundComplaint.citizenEmail, foundComplaint.citizenEmail);
      }
    } else {
      // Find latest complaint by email & load entire citizen complaint history
      const userComplaints = complaints.filter(c => (c.citizenEmail || '').toLowerCase() === searchTerm.toLowerCase());
      if (userComplaints.length > 0) {
        foundComplaint = userComplaints[0];
        if (userComplaints.length > 1) {
          showToast(`Found ${userComplaints.length} grievances for this email. Showing the most recent above and full history below.`, "info");
        }
      }
      if (typeof window.loadCitizenComplaintHistory === 'function') {
        await window.loadCitizenComplaintHistory(searchTerm, searchTerm);
      }
    }

    cleanupActiveTrackedSubscriptions();
    if (!foundComplaint) {
      if (notFoundCard) notFoundCard.style.display = 'block';
      return;
    }

    activeTrackedComplaint = foundComplaint;
    renderComplaintDetails(foundComplaint);

    if (window.isFirebaseAvailable && window.fbDb && foundComplaint.complaintId) {
      try {
        const docRef = window.fbDb.collection('complaints').doc(foundComplaint.complaintId);
        activeComplaintUnsub = docRef.onSnapshot(docSnap => {
          if (!docSnap.exists) return;
          const freshData = docSnap.data();
          activeTrackedComplaint = { ...activeTrackedComplaint, ...freshData };
          renderComplaintDetails(activeTrackedComplaint);
        }, err => console.warn('Realtime tracking snapshot notice:', err));

        const msgsRef = docRef.collection('messages');
        activeMessagesUnsub = msgsRef.onSnapshot(msgsSnap => {
          if (typeof loadPublicCommunicationThread === 'function') {
            loadPublicCommunicationThread(activeTrackedComplaint);
          }
        }, err => console.warn('Realtime messages snapshot notice:', err));
      } catch (e) {
        console.warn('Realtime tracking attach notice:', e);
      }
    }
  }

  async function renderComplaintDetails(item) {
    if (!resultCard) return;

    const isAuthorized = isAuthorizedForComplaint(item);

    // 1. Fill Metadata Fields with PII Masking
    document.getElementById('res-complaint-id').innerText = item.complaintId;
    const nameEl = document.getElementById('res-citizen-name');
    if (nameEl) {
      if (isAuthorized) {
        nameEl.innerText = item.citizenName;
      } else {
        nameEl.innerHTML = `<span title="Citizen name masked for privacy protection">${maskCitizenName(item.citizenName)} <span style="font-size: 11px; color: #64748b; font-weight: 600;">(Protected)</span></span>`;
      }
    }
    document.getElementById('res-gp-name').innerText = item.panchayatName || item.panchayatId;
    document.getElementById('res-category').innerText = item.category;
    document.getElementById('res-created-at').innerText = item.createdAt;

    // 2. Photo Preview with Interactive Lightbox Viewer
    const photoContainer = document.getElementById('res-photo-wrap');
    if (photoContainer) {
      if (item.photoURL) {
        const safePhoto = escapeHtml(item.photoURL);
        photoContainer.innerHTML = `
          <div id="btn-view-evidence-photo" style="cursor: pointer; position: relative; border-radius: 8px; overflow: hidden; transition: transform 0.2s;" title="Click to view full image">
            <img id="tracking-evidence-img" src="${safePhoto}" alt="Complaint Photo" style="width: 100%; height: 115px; object-fit: cover; border-radius: 8px; border: 1.5px solid #cbd5e1; display: block;">
            <div style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 11px; color: #0f56b3; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-expand"></i> Click to view full image
              </span>
              <span style="font-size: 10.5px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                <i class="fa-regular fa-image"></i> Evidence
              </span>
            </div>
          </div>
        `;
        const btnViewPhoto = document.getElementById('btn-view-evidence-photo');
        if (btnViewPhoto) {
          btnViewPhoto.addEventListener('click', (e) => {
            e.preventDefault();
            window.openImageLightbox(item.photoURL, item.complaintId || 'Evidence Photograph');
          });
        }
      } else {
        photoContainer.innerHTML = `<span style="font-size: 12px; color: #94a3b8;"><i class="fa-regular fa-image"></i> No photo attached</span>`;
      }
    }

    // 3. Status Badge (Supports all dynamically configured statuses)
    const badgeEl = document.getElementById('res-status-badge');
    if (badgeEl) {
      if (window.janasevaStatusManager) {
        badgeEl.outerHTML = `<span id="res-status-badge">${window.janasevaStatusManager.getStatusBadgeHTML(item.status)}</span>`;
      } else {
        const badgeClass = getStatusBadgeClass(item.status);
        const badgeIcon = getStatusIcon(item.status);
        badgeEl.className = `status-badge-pill ${badgeClass}`;
        badgeEl.innerHTML = `${badgeIcon} ${item.status}`;
      }
    }

    // 3b. AI Intelligence & Hotspot Classification
    const aiRow = document.getElementById('res-ai-row');
    if (aiRow) {
      let aiAnalysis = item.aiPriority ? {
        priority: item.aiPriority,
        department: item.aiDepartment || item.assignedDepartment || 'General',
        rationale: item.aiRationale || ''
      } : null;

      if (!aiAnalysis && window.janasevaComplaintPrioritizer) {
        aiAnalysis = window.janasevaComplaintPrioritizer.analyzeComplaint(item.description, item.category);
      }

      if (aiAnalysis) {
        aiRow.style.display = 'table-row';
        const pBadge = document.getElementById('res-ai-priority-badge');
        const deptText = document.getElementById('res-ai-dept-text');
        const intelLink = document.getElementById('res-ai-intel-link');
        
        if (pBadge) {
          const p = (aiAnalysis.priority || 'NORMAL').toUpperCase();
          pBadge.className = `ai-priority-pill pill-${p.toLowerCase()}`;
          pBadge.innerText = p;
        }
        if (deptText) {
          deptText.innerText = `(${aiAnalysis.department || 'General Administration'})`;
        }
      }
    }

    // Admin / Officer Edit Button Visibility & Interactivity
    const isAdminOrReceiver = checkIsAdminOrReceiver();
    updateAdminEditControls(item, isAdminOrReceiver);

    // 4. 6-Stage Progress Stepper (Dynamic from JanasevaStatusManager)
    if (window.janasevaStatusManager) {
      window.janasevaStatusManager.renderTimelineStepper('timeline-stepper-container', item.status);
      
      // Make stepper nodes clickable for Admins / Grievance Officers
      if (isAdminOrReceiver) {
        setTimeout(() => {
          const stepNodes = document.querySelectorAll('#timeline-stepper-container .timeline-step');
          stepNodes.forEach(node => {
            const stepId = node.id.replace('dyn-step-', '').replace('timeline-step-', '');
            node.style.cursor = 'pointer';
            node.title = `Admin: Click to edit grievance status to this stage`;
            node.onclick = () => openAdminEditFromTracking(stepId);
          });
        }, 50);
      }
    } else {
      renderTimelineStepper(item.status);
    }

    // 5. Rejection & Reopen Banners
    const rejBanner = document.getElementById('res-rejection-banner');
    const rejReason = document.getElementById('res-rejection-reason');
    if (rejBanner && rejReason) {
      if (item.status === 'Rejected' || item.rejectionReason) {
        rejReason.innerText = item.rejectionReason || "Grievance closed by administration after initial review.";
        rejBanner.style.display = 'block';
      } else {
        rejBanner.style.display = 'none';
      }
    }

    const reopenBanner = document.getElementById('res-reopen-banner');
    const reopenReason = document.getElementById('res-reopen-reason');
    if (reopenBanner && reopenReason) {
      if (item.status === 'Reopened' || item.reopenReason) {
        reopenReason.innerText = item.reopenReason || "Follow-up verification requested.";
        reopenBanner.style.display = 'block';
      } else {
        reopenBanner.style.display = 'none';
      }
    }

    // 6. Latest Official Note Callout
    const noteEl = document.getElementById('res-official-note');
    if (noteEl) {
      noteEl.innerText = item.officialResponse || "Your grievance has been received and is being processed by the Gram Panchayat.";
    }

    // 7. Load & Render Public Official Response Thread
    await loadPublicCommunicationThread(item);

    // 8. Citizen Reply Box Visibility (Enabled for active, non-rejected complaints)
    const replyBox = document.getElementById('track-citizen-reply-box');
    if (replyBox) {
      if (item.status === 'Resolved' || item.status === 'Rejected') {
        replyBox.style.display = 'none';
      } else {
        replyBox.style.display = 'block';
      }
    }

    resultCard.style.display = 'block';
    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * 6-Stage Visual Stepper
   */
  function renderTimelineStepper(status) {
    const steps = ['timeline-step-1', 'timeline-step-2', 'timeline-step-3', 'timeline-step-4', 'timeline-step-5', 'timeline-step-6'];
    const statusOrder = {
      'submitted': 0,
      'assigned': 1,
      'under review': 2,
      'under_review': 2,
      'in progress': 3,
      'in_progress': 3,
      'action taken': 4,
      'action_taken': 4,
      'resolved': 5
    };

    const s = (status || '').toLowerCase();
    const currentIdx = statusOrder[s] !== undefined ? statusOrder[s] : 0;
    const progressBar = document.getElementById('timeline-progress-bar');

    steps.forEach((stepId, idx) => {
      const el = document.getElementById(stepId);
      if (!el) return;
      el.className = 'timeline-step';
      if (idx < currentIdx) {
        el.classList.add('completed');
        const node = el.querySelector('.timeline-node');
        if (node) node.innerHTML = '<i class="fa-solid fa-check"></i>';
      } else if (idx === currentIdx) {
        el.classList.add('active');
        const node = el.querySelector('.timeline-node');
        if (node) node.innerHTML = '';
      } else {
        const node = el.querySelector('.timeline-node');
        if (node) node.innerHTML = '';
      }
    });

    if (progressBar) {
      const pct = Math.min(100, Math.round((currentIdx / (steps.length - 1)) * 100));
      progressBar.style.width = `${pct}%`;
    }
  }

  /**
   * Load Public Official Response Thread (Strictly filters out internal notes)
   */
  async function loadPublicCommunicationThread(complaint) {
    const threadBox = document.getElementById('track-comm-messages');
    if (!threadBox) return;

    const storageKey = `complaintMessages_${complaint.complaintId}`;
    let messages = JanasevaDB.get(storageKey, []);

    // Also fetch from live Firestore
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
        console.warn("Tracking thread Firestore fetch warning:", err);
      }
    }

    // STRICT PRIVACY GUARANTEE: Filter out internal administrative notes!
    const publicMessages = messages.filter(m => (m.visibility || '').toLowerCase() !== 'internal');

    if (publicMessages.length === 0) {
      // Show default initial submission + official response if any
      const initialMsgs = [
        {
          senderName: complaint.citizenName,
          senderRole: 'citizen',
          messageText: complaint.description,
          timestamp: complaint.createdAt || 'Submission Date'
        }
      ];
      if (complaint.officialResponse) {
        initialMsgs.push({
          senderName: 'Gram Panchayat Official Desk',
          senderRole: 'admin',
          messageText: complaint.officialResponse,
          timestamp: complaint.updatedAt || 'Recent Update'
        });
      }
      renderThreadHTML(threadBox, initialMsgs);
      return;
    }

    renderThreadHTML(threadBox, publicMessages);
  }

  function renderThreadHTML(container, msgList) {
    container.innerHTML = msgList.map(m => {
      const isCitizen = (m.senderRole || '').toLowerCase() === 'citizen';
      const msgBody = m.message || m.messageText || '';
      const msgTime = m.timestamp || (m.createdAt ? new Date(m.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '');
      if (isCitizen) {
        return `
          <div class="comm-bubble comm-msg-citizen">
            <div class="comm-bubble-meta">
              <span class="comm-author-tag">
                <i class="fa-solid fa-user"></i> ${escapeHtml(m.senderName || 'Citizen')} (You)
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
                <i class="fa-solid fa-building-columns"></i> ${escapeHtml(m.senderName || 'Gram Panchayat Official Desk')}
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
    if (s === 'submitted') return '<i class="fa-solid fa-circle-check"></i>';
    if (s === 'assigned') return '<i class="fa-solid fa-user-check"></i>';
    if (s === 'in progress') return '<i class="fa-solid fa-gear"></i>';
    if (s === 'under review') return '<i class="fa-solid fa-magnifying-glass"></i>';
    if (s === 'action taken') return '<i class="fa-solid fa-truck-fast"></i>';
    if (s === 'resolved') return '<i class="fa-solid fa-check-double"></i>';
    if (s === 'rejected') return '<i class="fa-solid fa-circle-xmark"></i>';
    if (s === 'reopened') return '<i class="fa-solid fa-rotate-left"></i>';
    return '<i class="fa-solid fa-circle-info"></i>';
  }

  /**
   * Citizen Follow-up Reply Submission
   */
  window.sendCitizenReply = async function() {
    if (!activeTrackedComplaint) return;

    const replyInput = document.getElementById('track-citizen-reply-text');
    const text = replyInput ? replyInput.value.trim() : '';

    if (!text) {
      showToast("Please type your reply or inquiry before sending.", "warning");
      if (replyInput) replyInput.focus();
      return;
    }

    const currentUser = window.authService ? window.authService.currentUser : null;
    if (window.isFirebaseAvailable && (!currentUser || !currentUser.uid)) {
      showToast("Please sign in to post a follow-up reply.", "warning");
      return;
    }

    const sendBtn = document.getElementById('track-citizen-send-btn');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    }

    const nowFormatted = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
    const nowISO = new Date().toISOString();

    const fbReply = {
      messageId: `msg-${Date.now()}`,
      complaintId: activeTrackedComplaint.complaintId,
      senderId: currentUser ? currentUser.uid : (activeTrackedComplaint.userId || 'citizen'),
      senderName: (currentUser && currentUser.name) ? currentUser.name : (activeTrackedComplaint.citizenName || 'Citizen'),
      senderEmail: (currentUser && currentUser.email) ? currentUser.email : (activeTrackedComplaint.citizenEmail || ''),
      senderRole: 'citizen',
      message: text,
      visibility: 'public',
      createdAt: nowISO
    };

    const newReply = {
      ...fbReply,
      messageText: text,
      timestamp: nowFormatted
    };

    // 1. Save to Local DB
    const storageKey = `complaintMessages_${activeTrackedComplaint.complaintId}`;
    const messages = JanasevaDB.get(storageKey, []);
    messages.push(newReply);
    JanasevaDB.set(storageKey, messages);

    // 2. Save to Firestore
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        await window.fbDb.collection('complaints').doc(activeTrackedComplaint.complaintId).collection('messages').doc(fbReply.messageId).set(fbReply);
        await window.fbDb.collection('complaintMessages').doc(fbReply.messageId).set(fbReply);
      } catch (err) {
        console.warn("Firestore citizen reply save warning:", err);
      }
    }

    // 3. Clear Input & Reload Thread
    if (replyInput) replyInput.value = '';
    await loadPublicCommunicationThread(activeTrackedComplaint);

    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Reply';
    }

    showToast("Your reply has been submitted to the Gram Panchayat desk.", "success");
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

  window.addEventListener('janaseva:langChanged', () => {
    if (window.janasevaStatusManager && document.getElementById('status-indicators-container')) {
      window.janasevaStatusManager.renderStatusIndicators('status-indicators-container');
    }
    if (activeTrackedComplaint) {
      renderComplaintDetails(activeTrackedComplaint);
    }
    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }
  });
});


/**
 * ============================================================================
 * ADMIN QUICK EDIT CONTROLLER (Tracking Page Direct Edit)
 * ============================================================================
 */

window.openAdminEditFromTracking = function(targetStatusId = null) {
  if (!activeTrackedComplaint) return;
  const user = window.authService ? window.authService.currentUser : null;
  if (!user || (user.role !== 'admin' && user.role !== 'receiver')) {
    if (typeof showToast === 'function') showToast("Unauthorized: Official privileges required to edit complaint status.", "error");
    return;
  }
  const modal = document.getElementById('track-admin-edit-modal');
  if (!modal) return;

  const userRole = user.role;

  // Set header info
  const idEl = document.getElementById('track-edit-id-display');
  const citEl = document.getElementById('track-edit-citizen-display');
  const curStatusEl = document.getElementById('track-edit-current-status-display');
  const adminLink = document.getElementById('track-open-admin-link');

  if (idEl) idEl.innerText = activeTrackedComplaint.complaintId;
  if (citEl) citEl.innerText = `${activeTrackedComplaint.citizenName || activeTrackedComplaint.name || 'Citizen'} (${activeTrackedComplaint.panchayatName || activeTrackedComplaint.panchayatId || ''})`;
  if (curStatusEl && window.janasevaStatusManager) {
    curStatusEl.innerHTML = window.janasevaStatusManager.getStatusBadgeHTML(activeTrackedComplaint.status);
  }
  if (adminLink) {
    adminLink.href = `receiver-dashboard.html?edit=${encodeURIComponent(activeTrackedComplaint.complaintId)}`;
  }

  // Populate dynamic status dropdown
  if (window.janasevaStatusManager) {
    window.janasevaStatusManager.populateTransitionDropdown('track-edit-status-select', activeTrackedComplaint.status, userRole);
  }

  // Pre-select target status if specified
  const statusSelect = document.getElementById('track-edit-status-select');
  if (statusSelect && targetStatusId) {
    const matchingOpt = Array.from(statusSelect.options).find(opt => 
      opt.value.toLowerCase() === targetStatusId.toLowerCase() ||
      opt.innerText.toLowerCase().includes(targetStatusId.toLowerCase())
    );
    if (matchingOpt) {
      statusSelect.value = matchingOpt.value;
    }
  }

  // Pre-fill Priority
  const prioSelect = document.getElementById('track-edit-priority-select');
  if (prioSelect) {
    prioSelect.value = (activeTrackedComplaint.aiPriority || 'NORMAL').toUpperCase();
  }

  // Pre-fill Response
  const respInput = document.getElementById('track-edit-response-text');
  if (respInput) {
    respInput.value = activeTrackedComplaint.officialResponse || '';
  }

  // Pre-fill Rejection / Reopen reasons
  const rejInput = document.getElementById('track-edit-rejection-reason');
  const reopenInput = document.getElementById('track-edit-reopen-reason');
  if (rejInput) rejInput.value = activeTrackedComplaint.rejectionReason || '';
  if (reopenInput) reopenInput.value = activeTrackedComplaint.reopenReason || '';

  handleTrackEditStatusChange();
  modal.classList.add('active');
};

window.closeAdminEditModal = function() {
  const modal = document.getElementById('track-admin-edit-modal');
  if (modal) modal.classList.remove('active');
};

window.handleTrackEditStatusChange = function() {
  const statusSelect = document.getElementById('track-edit-status-select');
  const rejWrap = document.getElementById('track-edit-rejection-wrap');
  const reopenWrap = document.getElementById('track-edit-reopen-wrap');
  if (!statusSelect) return;

  const val = (statusSelect.value || '').toLowerCase();
  if (rejWrap) {
    rejWrap.style.display = val.includes('reject') ? 'block' : 'none';
  }
  if (reopenWrap) {
    reopenWrap.style.display = val.includes('reopen') ? 'block' : 'none';
  }
};

window.saveAdminEditFromTracking = async function() {
  if (!activeTrackedComplaint) return;

  const user = window.authService ? window.authService.currentUser : null;
  if (!user || (user.role !== 'admin' && user.role !== 'receiver')) {
    if (typeof showToast === 'function') showToast("Unauthorized: Only officials can update grievance status.", "error");
    return;
  }
  const userRole = user.role;
  const statusSelect = document.getElementById('track-edit-status-select');
  const prioSelect = document.getElementById('track-edit-priority-select');
  const respInput = document.getElementById('track-edit-response-text');
  const rejInput = document.getElementById('track-edit-rejection-reason');
  const reopenInput = document.getElementById('track-edit-reopen-reason');

  const oldStatus = activeTrackedComplaint.status;
  const newStatus = statusSelect ? statusSelect.value : oldStatus;
  const newPriority = prioSelect ? prioSelect.value.toUpperCase() : (activeTrackedComplaint.aiPriority || 'NORMAL');
  const newResponse = respInput ? respInput.value.trim() : '';
  const rejReason = rejInput ? rejInput.value.trim() : '';
  const reopenReason = reopenInput ? reopenInput.value.trim() : '';

  // Validate with JanasevaStatusManager
  if (window.janasevaStatusManager && oldStatus !== newStatus) {
    const remarks = rejReason || reopenReason || newResponse;
    const validation = window.janasevaStatusManager.validateTransition(oldStatus, newStatus, userRole, {
      remarks: remarks,
      hasEvidence: !!(activeTrackedComplaint.evidencePhotoUrl || activeTrackedComplaint.photoURL),
      assignedReceiverId: activeTrackedComplaint.assignedReceiverId,
      assignedReceiverEmail: activeTrackedComplaint.assignedReceiverEmail,
      panchayatId: activeTrackedComplaint.panchayatId
    });

    if (!validation.valid) {
      if (typeof showToast === 'function') {
        showToast(`Cannot change status: ${validation.reason}`, "error");
      } else {
        (window.janasevaAlert || alert)(`Cannot change status: ${validation.reason}`);
      }
      return;
    }
  }

  const saveBtn = document.getElementById('track-edit-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
  }

  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

  activeTrackedComplaint.status = newStatus;
  activeTrackedComplaint.aiPriority = newPriority;
  activeTrackedComplaint.updatedAt = nowFormatted;
  if (newResponse) activeTrackedComplaint.officialResponse = newResponse;
  if (newStatus === 'Rejected' && rejReason) activeTrackedComplaint.rejectionReason = rejReason;
  if (newStatus === 'Reopened' && reopenReason) activeTrackedComplaint.reopenReason = reopenReason;
  if (newStatus === 'Resolved') activeTrackedComplaint.resolutionDate = new Date().toISOString();

  const historyIso = new Date().toISOString();
  const newHistoryRecord = {
    historyId: 'hist-' + Date.now(),
    complaintId: activeTrackedComplaint.complaintId,
    oldStatus: oldStatus,
    newStatus: newStatus,
    updatedBy: user ? (user.uid || user.email) : '',
    timestamp: historyIso,
    officialNote: (activeTrackedComplaint.officialResponse || activeTrackedComplaint.rejectionReason || activeTrackedComplaint.reopenReason || `Status updated to ${newStatus}`).slice(0, 2000)
  };

  // 1. Update in LocalStorage
  if (typeof JanasevaDB !== 'undefined') {
    const all = JanasevaDB.get('complaints', []);
    const idx = all.findIndex(c => c.complaintId === activeTrackedComplaint.complaintId);
    if (idx >= 0) {
      all[idx] = Object.assign({}, all[idx], activeTrackedComplaint);
      JanasevaDB.set('complaints', all);
    }

    const history = JanasevaDB.get('statusHistory', []);
    history.push(newHistoryRecord);
    JanasevaDB.set('statusHistory', history);
  }

  // 2. Update in Firestore if available
  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      await window.fbDb.collection('complaints').doc(activeTrackedComplaint.complaintId).update({
        status: newStatus,
        aiPriority: newPriority,
        officialResponse: activeTrackedComplaint.officialResponse || '',
        rejectionReason: activeTrackedComplaint.rejectionReason || '',
        reopenReason: activeTrackedComplaint.reopenReason || '',
        resolutionDate: activeTrackedComplaint.resolutionDate || null,
        updatedAt: nowFormatted
      });
      await window.fbDb.collection('complaints').doc(activeTrackedComplaint.complaintId).collection('statusHistory').doc(newHistoryRecord.historyId).set(newHistoryRecord);
      await window.fbDb.collection('statusHistory').doc(newHistoryRecord.historyId).set(newHistoryRecord);
    } catch (fbErr) {
      console.warn("Firestore update warning from tracking:", fbErr);
    }
  }

  // 2b. Record in Complaint Updates Folder
  if (window.complaintStorageManager && (oldStatus !== newStatus || newResponse)) {
    try {
      await window.complaintStorageManager.recordComplaintUpdate(activeTrackedComplaint, {
        oldStatus: oldStatus,
        newStatus: newStatus,
        updateType: oldStatus !== newStatus ? 'STATUS_CHANGE' : 'OFFICIAL_RESPONSE',
        remarks: newHistoryRecord.officialNote,
        resolutionDetails: newStatus === 'Resolved' ? (activeTrackedComplaint.officialResponse || 'Resolved from tracking panel') : null,
        actor: {
          name: user.name || user.email || 'Official',
          email: user.email,
          role: user.role,
          uid: user.uid || ''
        }
      });
    } catch (updErr) {}
  }

  // 3. Email Notification
  if (oldStatus !== newStatus && window.emailService) {
    try {
      await window.emailService.sendStatusUpdateNotification(
        activeTrackedComplaint,
        oldStatus,
        newStatus,
        activeTrackedComplaint.officialResponse || `Status updated to ${newStatus}`
      );
    } catch (mailErr) {
      console.warn("Email dispatch notice:", mailErr);
    }
  }

  // 4. Re-render UI on tracking page immediately
  const badgeEl = document.getElementById('res-status-badge');
  if (badgeEl && window.janasevaStatusManager) {
    badgeEl.outerHTML = `<span id="res-status-badge">${window.janasevaStatusManager.getStatusBadgeHTML(newStatus)}</span>`;
  }
  if (window.janasevaStatusManager) {
    window.janasevaStatusManager.renderTimelineStepper('timeline-stepper-container', newStatus);
    
    // Re-bind click handlers for admin
    if (user && (user.role === 'admin' || user.role === 'receiver')) {
      setTimeout(() => {
        const stepNodes = document.querySelectorAll('#timeline-stepper-container .timeline-step');
        stepNodes.forEach(node => {
          const stepId = node.id.replace('dyn-step-', '').replace('timeline-step-', '');
          node.style.cursor = 'pointer';
          node.title = `Admin: Click to edit grievance status to this stage`;
          node.onclick = () => openAdminEditFromTracking(stepId);
        });
      }, 50);
    }
  }
  const noteEl = document.getElementById('res-official-note');
  if (noteEl && activeTrackedComplaint.officialResponse) {
    noteEl.innerText = activeTrackedComplaint.officialResponse;
  }

  closeAdminEditModal();
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Status';
  }

  if (typeof showToast === 'function') {
    showToast(`Grievance ${activeTrackedComplaint.complaintId} status updated to "${newStatus}"!`, "success");
  } else {
    (window.janasevaAlert || alert)(`Grievance ${activeTrackedComplaint.complaintId} status updated to "${newStatus}"!`);
  }
};

/**
 * Move complaint to Protected Recycle Bin from tracking page (Administrator only)
 */
window.deleteComplaintFromTracking = function() {
  const complaint = activeTrackedComplaint || (typeof window !== 'undefined' ? window.activeTrackedComplaint : null);
  if (!complaint) {
    if (typeof showToast === 'function') showToast("No active complaint selected to delete.", "warning");
    return;
  }
  const cid = complaint.complaintId || complaint.id;
  window.confirmTrackDeleteComplaint(cid);
};

// ==========================================================================
// EVIDENCE PHOTOGRAPH FULL-RESOLUTION LIGHTBOX CONTROLLER
// ==========================================================================
window.openImageLightbox = function(src, title) {
  if (!src) return;
  let modal = document.getElementById('evidence-image-lightbox-modal');
  if (!modal) {
    const div = document.createElement('div');
    div.className = 'modal-overlay';
    div.id = 'evidence-image-lightbox-modal';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-hidden', 'true');
    div.style.cssText = 'z-index: 10005; background-color: rgba(11, 25, 44, 0.90); backdrop-filter: blur(8px);';
    div.innerHTML = `
      <div class="modal-window" style="max-width: 860px; width: 94%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.5); display: flex; flex-direction: column; max-height: 94vh;">
        <div class="modal-header" style="padding: 14px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div class="modal-title" style="font-size: 15px; font-weight: 800; color: #0b2545; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-image" style="color: #0f56b3;"></i>
            <span id="lightbox-image-title">Complaint Evidence Photograph</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <a id="lightbox-download-btn" href="#" download="complaint-evidence.png" class="btn-secondary-action" style="padding: 6px 14px; font-size: 12px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; color: #0b2545; background: #ffffff; border: 1px solid #cbd5e1; font-weight: 700; cursor: pointer;" title="Download full evidence image">
              <i class="fa-solid fa-download"></i> <span>Download</span>
            </a>
            <button type="button" class="btn-secondary-action" id="lightbox-newtab-btn" onclick="window.openCurrentLightboxInNewTab()" style="padding: 6px 14px; font-size: 12px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; color: #0b2545; background: #ffffff; border: 1px solid #cbd5e1; font-weight: 700;" title="Open in new window">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> <span>New Tab</span>
            </button>
            <button type="button" class="modal-close-btn" onclick="window.closeImageLightbox()" aria-label="Close image lightbox" style="font-size: 26px; line-height: 1; padding: 0 8px; background: none; border: none; cursor: pointer; color: #64748b;">&times;</button>
          </div>
        </div>
        <div class="modal-body" style="padding: 16px; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 280px; max-height: 74vh; overflow: auto; text-align: center;">
          <img id="lightbox-image-element" src="" alt="Complaint Evidence Photograph Full Resolution" style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); cursor: zoom-in; transition: transform 0.2s ease;">
        </div>
        <div style="padding: 10px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b; flex-wrap: wrap; gap: 8px;">
          <span><i class="fa-solid fa-circle-info"></i> Click image to zoom in/out &bull; Press <kbd style="background: #e2e8f0; padding: 2px 5px; border-radius: 4px; font-family: monospace;">ESC</kbd> to close</span>
          <button type="button" class="btn-cta-primary" onclick="window.closeImageLightbox()" style="padding: 6px 18px; font-size: 12px; border-radius: 6px; width: auto; background: #0f56b3; color: #ffffff; border: none; cursor: pointer; font-weight: 700;">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    modal = div;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.closeImageLightbox();
    });

    const img = modal.querySelector('#lightbox-image-element');
    if (img) {
      let isZoomed = false;
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        isZoomed = !isZoomed;
        if (isZoomed) {
          img.style.maxHeight = 'none';
          img.style.maxWidth = '160%';
          img.style.cursor = 'zoom-out';
        } else {
          img.style.maxHeight = '70vh';
          img.style.maxWidth = '100%';
          img.style.cursor = 'zoom-in';
        }
      });
    }
  }

  const titleEl = document.getElementById('lightbox-image-title');
  const imgEl = document.getElementById('lightbox-image-element');
  const dlBtn = document.getElementById('lightbox-download-btn');

  if (titleEl) {
    titleEl.textContent = title ? `Evidence Photograph — ${title}` : 'Complaint Evidence Photograph';
  }
  if (imgEl) {
    imgEl.src = src;
    imgEl.style.maxHeight = '70vh';
    imgEl.style.maxWidth = '100%';
    imgEl.style.cursor = 'zoom-in';
  }
  if (dlBtn) {
    dlBtn.href = src;
    dlBtn.download = `JANASEVA-Evidence-${title || 'photo'}.png`;
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

window.closeImageLightbox = function() {
  const modal = document.getElementById('evidence-image-lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
};

window.openCurrentLightboxInNewTab = function() {
  const imgEl = document.getElementById('lightbox-image-element');
  if (!imgEl || !imgEl.src) return;
  const src = imgEl.src;
  const title = document.getElementById('lightbox-image-title')?.textContent || 'Evidence Photograph';

  if (src.startsWith('data:image/')) {
    const esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const safeTitle = esc(title);
    const safeSrc = esc(src);
    const w = window.open('');
    if (w) {
      w.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${safeTitle}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; background: #0b192c; display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: auto; }
              img { max-width: 95vw; max-height: 95vh; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 6px; }
            </style>
          </head>
          <body>
            <img src="${safeSrc}" alt="${safeTitle}">
          </body>
        </html>
      `);
      w.document.close();
    }
  } else {
    window.open(src, '_blank');
  }
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeImageLightbox();
  }
});


// ============================================================================
// CITIZEN COMPLAINT HISTORY MANAGEMENT & VERIFIED DATABASE RETRIEVAL
// ============================================================================

window.loadCitizenComplaintHistory = async function(emailOrQuery, preferEmail = null) {
  try {
    let complaints = JanasevaDB.get('complaints', []);

    // Also fetch from live MongoDB Atlas
    if (window.JanasevaMongoDB) {
      try {
        const targetEmail = (preferEmail || emailOrQuery || '').toLowerCase().trim();
        const mongoList = await window.JanasevaMongoDB.getComplaints(targetEmail.includes('@') ? { citizenEmail: targetEmail } : {});
        if (mongoList && mongoList.length > 0) {
          mongoList.forEach(item => {
            const idx = complaints.findIndex(c => c.complaintId === item.complaintId);
            if (idx >= 0) complaints[idx] = item;
            else complaints.push(item);
          });
        }
      } catch (err) {
        console.warn("MongoDB history fetch caught:", err);
      }
    }

    // Filter out fake or dummy complaints strictly
    complaints = complaints.filter(c => !JanasevaDB.isFakeOrDummyComplaint(c));

    // Filter out soft-deleted / recycled complaints
    const deletedList = JanasevaDB.get('deleted_complaints', []);
    const deletedIds = new Set(deletedList.map(d => d.complaintId || d.id));
    complaints = complaints.filter(c => {
      const cid = c.complaintId || c.id;
      if (deletedIds.has(cid)) return false;
      if (c.isDeleted || c.inRecycleBin || c.status === 'Deleted') return false;
      return true;
    });

    // Determine authorization & filtering scope
    const currentUser = (window.authService && window.authService.currentUser) || null;
    const filterEmail = (preferEmail || (currentUser && currentUser.email) || emailOrQuery || '').toLowerCase().trim();

    let matched = [];
    if (filterEmail && filterEmail.includes('@')) {
      matched = complaints.filter(c => (c.citizenEmail || '').toLowerCase().trim() === filterEmail);
    } else if (currentUser && currentUser.uid) {
      matched = complaints.filter(c => c.citizenUid === currentUser.uid || c.userId === currentUser.uid);
    } else if (emailOrQuery) {
      const q = emailOrQuery.toLowerCase().trim();
      matched = complaints.filter(c => 
        (c.complaintId || '').toLowerCase().includes(q) ||
        (c.citizenEmail || '').toLowerCase().includes(q)
      );
    } else {
      matched = complaints;
    }

    // Sort by submission date descending (newest first)
    matched.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.submissionDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.submissionDate || 0).getTime();
      return timeB - timeA;
    });

    citizenHistoryList = matched;
    window.renderCitizenComplaintHistory(citizenHistoryList);
    return citizenHistoryList;
  } catch (e) {
    console.error("Error loading complaint history:", e);
    return [];
  }
};

window.renderCitizenComplaintHistory = function(list) {
  const historyList = list !== undefined ? list : citizenHistoryList;
  const section = document.getElementById('track-history-section');
  const tbody = document.getElementById('track-history-table-body');
  const mobileWrap = document.getElementById('track-history-mobile-wrap');
  const emptyBox = document.getElementById('track-history-empty');
  const tableWrap = document.getElementById('track-history-table-wrap');
  const badge = document.getElementById('track-history-badge');
  const countEl = document.getElementById('track-history-filtered-count');

  if (!section) return;
  section.style.display = 'block';

  if (badge) {
    badge.innerText = `${historyList.length} Complaint${historyList.length === 1 ? '' : 's'}`;
  }
  if (countEl) {
    countEl.innerText = `Showing ${historyList.length} complaint${historyList.length === 1 ? '' : 's'}`;
  }

  if (historyList.length === 0) {
    if (tableWrap) tableWrap.style.display = 'none';
    if (mobileWrap) mobileWrap.style.display = 'none';
    if (emptyBox) emptyBox.style.display = 'block';
    if (tbody) tbody.innerHTML = '';
    return;
  }

  if (emptyBox) emptyBox.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';
  if (mobileWrap) mobileWrap.style.display = 'none';

  function getPanchayatResponsePreview(item) {
    if (item.receiverResponse && item.receiverResponse.trim()) {
      return item.receiverResponse.trim();
    }
    if (item.resolutionRemarks && item.resolutionRemarks.trim()) {
      return item.resolutionRemarks.trim();
    }
    if (item.officialResponse && item.officialResponse.trim()) {
      return item.officialResponse.trim();
    }
    if (Array.isArray(item.statusHistory) && item.statusHistory.length > 0) {
      const withNote = [...item.statusHistory].reverse().find(s => s.note || s.remarks || s.comment);
      if (withNote) return withNote.note || withNote.remarks || withNote.comment;
    }
    return null;
  }

  function getWp(item) {
    const wp = item.workProgress || {};
    const pct = Number(wp.percentage || 0);
    const stage = wp.stage || (pct >= 100 ? 'Completed' : (pct >= 50 ? 'In Execution' : (pct > 0 ? 'Assigned to Field' : 'Pending')));
    return { pct, stage };
  }

  // Desktop Table Rows
  if (tbody) {
    tbody.innerHTML = historyList.map(item => {
      const cid = escapeHtml(item.complaintId || item.id || '');
      const subject = escapeHtml(item.subject || item.category || 'Civic Grievance');
      const cat = escapeHtml(item.category || 'General');
      const location = escapeHtml(item.panchayatName || item.location || item.panchayatId || 'Gram Panchayat');
      const submitted = escapeHtml(item.createdAt || item.submissionDate || 'N/A');
      const status = item.status || 'Submitted';
      const statusBadgeHTML = window.janasevaStatusManager
        ? window.janasevaStatusManager.getStatusBadgeHTML(status)
        : `<span class="status-badge-pill ${getStatusBadgeClass(status)}">${getStatusIcon(status)} ${escapeHtml(status)}</span>`;

      const responsePreview = getPanchayatResponsePreview(item);
      const { pct, stage } = getWp(item);

      let responseHTML = '';
      if (responsePreview) {
        responseHTML = `
          <div style="font-size: 12px; color: #1e3a8a; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 10px; border-radius: 6px; line-height: 1.4;">
            <strong style="color: #16a34a;"><i class="fa-solid fa-landmark"></i> Panchayat:</strong> ${escapeHtml(responsePreview)}
          </div>
        `;
      } else {
        responseHTML = `
          <div style="font-size: 12px; color: #64748b; font-style: italic;">
            <i class="fa-regular fa-clock"></i> Awaiting official Panchayat review
          </div>
        `;
      }

      if (pct > 0) {
        responseHTML += `
          <div style="font-size: 11px; color: #0f56b3; margin-top: 4px; display: flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-bars-progress"></i> Field Work: <strong>${pct}%</strong> (${escapeHtml(stage)})
          </div>
        `;
      }

      return `
        <tr>
          <td>
            <span class="table-id-tag" style="cursor: pointer; font-weight: 700;" onclick="viewTrackComplaintDetails('${cid}')" title="Click to view complete details">
              ${cid}
            </span>
          </td>
          <td>
            <div style="font-weight: 700; color: #0b2545; cursor: pointer;" onclick="viewTrackComplaintDetails('${cid}')" title="${subject}">
              ${subject}
            </div>
            <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">
              <i class="fa-solid fa-location-dot" style="color: #0f56b3;"></i> ${location} &bull; <span style="font-weight: 600;">${cat}</span>
            </div>
          </td>
          <td style="color: #334155; font-weight: 500;">
            ${submitted}
          </td>
          <td>
            ${statusBadgeHTML}
          </td>
          <td style="max-width: 280px;">
            ${responseHTML}
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px; justify-content: flex-end;">
              <button type="button" class="btn-table-action" onclick="viewTrackComplaintDetails('${cid}')" style="background: #0f56b3; color: #ffffff; border: 1px solid #0f56b3; font-weight: 700; padding: 5px 9px; border-radius: 5px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="View Complaint Details, Photo Evidence & Timeline">
                <i class="fa-solid fa-eye"></i> View
              </button>
              <button type="button" class="btn-table-action" onclick="trackComplaintDirectly('${cid}')" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-weight: 700; padding: 5px 9px; border-radius: 5px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Track Live Status & Timeline">
                <i class="fa-solid fa-location-crosshairs"></i> Track
              </button>
              <button type="button" class="btn-table-action" onclick="confirmTrackDeleteComplaint('${cid}')" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-weight: 700; padding: 5px 9px; border-radius: 5px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Delete this complaint with confirmation">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Mobile Cards
  if (mobileWrap) {
    mobileWrap.innerHTML = historyList.map(item => {
      const cid = escapeHtml(item.complaintId || item.id || '');
      const subject = escapeHtml(item.subject || item.category || 'Civic Grievance');
      const cat = escapeHtml(item.category || 'General');
      const location = escapeHtml(item.panchayatName || item.location || item.panchayatId || 'Gram Panchayat');
      const submitted = escapeHtml(item.createdAt || item.submissionDate || 'N/A');
      const status = item.status || 'Submitted';
      const statusBadgeHTML = window.janasevaStatusManager
        ? window.janasevaStatusManager.getStatusBadgeHTML(status)
        : `<span class="status-badge-pill ${getStatusBadgeClass(status)}">${getStatusIcon(status)} ${escapeHtml(status)}</span>`;

      const responsePreview = getPanchayatResponsePreview(item);
      const { pct, stage } = getWp(item);

      return `
        <div class="portal-card" style="padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="table-id-tag" style="font-weight: 700;">${cid}</span>
            ${statusBadgeHTML}
          </div>
          <div style="font-weight: 700; color: #0b2545; font-size: 14px; margin-bottom: 4px;">${subject}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
            <i class="fa-solid fa-location-dot" style="color: #0f56b3;"></i> ${location} &bull; ${cat}
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 8px;">
            <i class="fa-regular fa-calendar"></i> Submitted: <strong>${submitted}</strong>
          </div>
          ${responsePreview ? `
            <div style="font-size: 12px; color: #1e3a8a; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; line-height: 1.4;">
              <strong style="color: #16a34a;"><i class="fa-solid fa-landmark"></i> Panchayat:</strong> ${escapeHtml(responsePreview)}
            </div>
          ` : `
            <div style="font-size: 12px; color: #64748b; font-style: italic; margin-bottom: 10px;">
              <i class="fa-regular fa-clock"></i> Awaiting official Panchayat review
            </div>
          `}
          ${pct > 0 ? `
            <div style="font-size: 11.5px; color: #0f56b3; margin-bottom: 10px;">
              <i class="fa-solid fa-bars-progress"></i> Work Progress: <strong>${pct}%</strong> (${escapeHtml(stage)})
            </div>
          ` : ''}
          <div style="display: flex; gap: 6px; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 4px;">
            <button type="button" class="btn-table-action" onclick="viewTrackComplaintDetails('${cid}')" style="background: #0f56b3; color: #fff; border: 1px solid #0f56b3; padding: 6px 12px; border-radius: 5px; font-size: 12px; font-weight: 700;">
              <i class="fa-solid fa-eye"></i> View
            </button>
            <button type="button" class="btn-table-action" onclick="trackComplaintDirectly('${cid}')" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 6px 12px; border-radius: 5px; font-size: 12px; font-weight: 700;">
              <i class="fa-solid fa-location-crosshairs"></i> Track
            </button>
            <button type="button" class="btn-table-action" onclick="confirmTrackDeleteComplaint('${cid}')" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 5px; font-size: 12px; font-weight: 700;">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.filterTrackHistory = function() {
  const statusFilter = (document.getElementById('track-history-status-filter')?.value || 'all').toLowerCase();
  const query = (document.getElementById('track-history-filter-input')?.value || '').trim().toLowerCase();

  const filtered = citizenHistoryList.filter(item => {
    if (statusFilter !== 'all') {
      const s = (item.status || '').toLowerCase().trim();
      if (s !== statusFilter) return false;
    }
    if (query) {
      const cid = (item.complaintId || item.id || '').toLowerCase();
      const sub = (item.subject || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const loc = (item.panchayatName || item.location || item.panchayatId || '').toLowerCase();
      const resp = (item.receiverResponse || item.resolutionRemarks || item.officialResponse || '').toLowerCase();
      if (!cid.includes(query) && !sub.includes(query) && !cat.includes(query) && !desc.includes(query) && !loc.includes(query) && !resp.includes(query)) {
        return false;
      }
    }
    return true;
  });

  window.renderCitizenComplaintHistory(filtered);
};

window.viewTrackComplaintDetails = function(cid) {
  let item = citizenHistoryList.find(c => (c.complaintId || c.id) === cid);
  if (!item) {
    const all = JanasevaDB.get('complaints', []);
    item = all.find(c => (c.complaintId || c.id) === cid);
  }
  if (!item) {
    if (typeof showToast === 'function') showToast("Complaint details not found.", "error");
    return;
  }

  currentDetailsComplaintId = cid;

  const idEl = document.getElementById('tdm-id');
  const catEl = document.getElementById('tdm-category');
  const gpEl = document.getElementById('tdm-panchayat');
  const dateEl = document.getElementById('tdm-date');
  const badgeEl = document.getElementById('tdm-status-badge');
  const applicantEl = document.getElementById('tdm-applicant');
  const descEl = document.getElementById('tdm-description');

  if (idEl) idEl.innerText = cid;
  const titleEl = document.getElementById('tdm-title');
  if (titleEl) titleEl.innerText = item.subject || item.category || 'Complaint Details';
  if (catEl) catEl.innerText = item.category || 'General';
  if (gpEl) gpEl.innerText = item.panchayatName || item.panchayatId || 'Gram Panchayat';
  const locEl = document.getElementById('tdm-location');
  if (locEl) locEl.innerText = item.location || item.panchayatName || 'Gram Panchayat';
  if (dateEl) dateEl.innerText = item.createdAt || item.submissionDate || 'N/A';
  if (applicantEl) applicantEl.innerText = item.citizenName || 'Citizen';
  if (descEl) descEl.innerText = item.description || 'No detailed description provided.';

  if (badgeEl) {
    badgeEl.innerHTML = window.janasevaStatusManager
      ? window.janasevaStatusManager.getStatusBadgeHTML(item.status)
      : `<span class="status-badge-pill ${getStatusBadgeClass(item.status)}">${item.status}</span>`;
  }

  // Photographic evidence
  const photoWrap = document.getElementById('tdm-photo-wrap');
  const photoImg = document.getElementById('tdm-photo');
  if (photoWrap && photoImg) {
    if (item.photoURL) {
      photoImg.src = item.photoURL;
      photoWrap.style.display = 'block';
    } else {
      photoWrap.style.display = 'none';
      photoImg.src = '';
    }
  }

  // Official Panchayat responses trail
  const responsesContainer = document.getElementById('tdm-responses-container');
  if (responsesContainer) {
    const responses = [];
    if (item.receiverResponse) {
      responses.push({
        title: 'Official Panchayat Desk Response',
        role: 'Panchayat Development Officer / Secretary',
        text: item.receiverResponse,
        time: item.updatedAt || item.resolutionDate || 'Verified Update'
      });
    }
    if (item.resolutionRemarks && item.resolutionRemarks !== item.receiverResponse) {
      responses.push({
        title: 'Resolution Findings & Action Report',
        role: 'Gram Panchayat Grievance Desk',
        text: item.resolutionRemarks,
        time: item.resolutionDate || item.updatedAt || 'Resolution'
      });
    }
    if (Array.isArray(item.statusHistory)) {
      item.statusHistory.forEach(h => {
        if (h.note || h.remarks || h.comment) {
          responses.push({
            title: `Status Update: ${h.status || 'Updated'}`,
            role: h.updatedByRole || 'Panchayat Desk',
            text: h.note || h.remarks || h.comment,
            time: h.timestamp || h.date || ''
          });
        }
      });
    }

    if (responses.length > 0) {
      responsesContainer.innerHTML = responses.map(r => `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 6px;">
            <span style="font-weight: 700; color: #166534; font-size: 12.5px;">
              <i class="fa-solid fa-landmark"></i> ${escapeHtml(r.title)}
            </span>
            <span style="font-size: 11px; color: #15803d; font-weight: 600;">${escapeHtml(r.time)}</span>
          </div>
          <div style="font-size: 12px; color: #1e3a8a; font-weight: 600; margin-bottom: 4px;">
            <i class="fa-solid fa-user-check"></i> ${escapeHtml(r.role)}
          </div>
          <div style="font-size: 13px; color: #1e293b; line-height: 1.45; white-space: pre-wrap;">${escapeHtml(r.text)}</div>
        </div>
      `).join('');
    } else {
      responsesContainer.innerHTML = `
        <div style="padding: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 12.5px; color: #64748b; text-align: center;">
          <i class="fa-regular fa-clock" style="margin-right: 4px;"></i> No official responses recorded yet. Your grievance is currently queued for official Panchayat desk verification.
        </div>
      `;
    }
  }

  // Work Progress
  const wpWrap = document.getElementById('tdm-work-progress-wrap');
  const wpBar = document.getElementById('tdm-work-progress-bar');
  const wpBadge = document.getElementById('tdm-work-percent-badge');
  const wpDetails = document.getElementById('tdm-work-details');
  const wp = item.workProgress || {};
  const wpPct = Number(wp.percentage || 0);
  if (wpWrap && wpPct > 0) {
    wpWrap.style.display = 'block';
    if (wpBar) wpBar.style.width = `${wpPct}%`;
    if (wpBadge) wpBadge.innerText = `${wpPct}%`;
    if (wpDetails) wpDetails.innerText = `Stage: ${wp.stage || 'In Execution'} | Contractor/Worker: ${wp.workerAssigned || 'Gram Panchayat Field Team'} | Last Milestone: ${wp.lastMilestone || 'Under active resolution'}`;
  } else if (wpWrap) {
    wpWrap.style.display = 'none';
  }

  // Wire buttons
  const trackBtn = document.getElementById('tdm-track-btn');
  if (trackBtn) {
    trackBtn.onclick = () => window.trackComplaintDirectly(cid);
  }
  const deleteBtn = document.getElementById('tdm-delete-btn');
  if (deleteBtn) {
    deleteBtn.onclick = () => window.confirmTrackDeleteComplaint(cid);
  }

  const modal = document.getElementById('track-details-modal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
};

window.closeTrackDetailsModal = function() {
  const modal = document.getElementById('track-details-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  currentDetailsComplaintId = null;
};

window.trackComplaintDirectly = function(cid) {
  window.closeTrackDetailsModal();
  const radioId = document.getElementById('search-by-id');
  const trackInput = document.getElementById('track-search-input');
  if (radioId) radioId.checked = true;
  if (trackInput) trackInput.value = cid;
  if (typeof performTrack === 'function') {
    performTrack(cid, 'id');
  }
  const resultCard = document.getElementById('track-result-container');
  if (resultCard) {
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.confirmTrackDeleteComplaint = function(cid) {
  let item = citizenHistoryList.find(c => (c.complaintId || c.id) === cid);
  if (!item) {
    const all = JanasevaDB.get('complaints', []);
    item = all.find(c => (c.complaintId || c.id) === cid);
  }
  if (!item) {
    if (typeof showToast === 'function') showToast("Complaint not found.", "error");
    return;
  }

  pendingDeleteTrackComplaintId = cid;

  const idEl = document.getElementById('tdel-id');
  const subEl = document.getElementById('tdel-subject');
  const dateEl = document.getElementById('tdel-date');
  const statusEl = document.getElementById('tdel-status');
  const reasonInput = document.getElementById('tdel-reason');

  if (idEl) idEl.innerText = cid;
  if (subEl) subEl.innerText = item.subject || item.category || 'Grievance';
  if (dateEl) dateEl.innerText = item.createdAt || item.submissionDate || 'N/A';
  if (statusEl) {
    statusEl.innerHTML = window.janasevaStatusManager
      ? window.janasevaStatusManager.getStatusBadgeHTML(item.status)
      : `<span class="status-badge-pill ${getStatusBadgeClass(item.status)}">${item.status}</span>`;
  }
  if (reasonInput) reasonInput.value = '';

  const modal = document.getElementById('track-delete-modal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
};

window.closeTrackDeleteModal = function() {
  const modal = document.getElementById('track-delete-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  pendingDeleteTrackComplaintId = null;
};

window.executeTrackDeleteComplaint = async function() {
  if (!pendingDeleteTrackComplaintId) return;

  const cid = pendingDeleteTrackComplaintId;
  const reasonInput = document.getElementById('tdel-reason');
  const reason = (reasonInput ? reasonInput.value.trim() : '') || 'Deleted by citizen from complaint history';
  const confirmBtn = document.getElementById('tdel-confirm-btn');

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
  }

  try {
    const currentUser = (window.authService && window.authService.currentUser) || { role: 'citizen', name: 'Citizen' };

    // 1. If complaintStorageManager is available, use moveToRecycleBin
    if (window.complaintStorageManager && typeof window.complaintStorageManager.moveToRecycleBin === 'function') {
      try {
        await window.complaintStorageManager.moveToRecycleBin(cid, reason, currentUser);
      } catch (err) {
        console.warn("complaintStorageManager.moveToRecycleBin notice:", err);
      }
    }

    // 2. Remove from JanasevaDB active complaints & archive to deleted_complaints
    let complaints = JanasevaDB.get('complaints', []);
    const targetItem = complaints.find(c => (c.complaintId || c.id) === cid);
    complaints = complaints.filter(c => (c.complaintId || c.id) !== cid);
    JanasevaDB.set('complaints', complaints);

    if (targetItem) {
      const deletedList = JanasevaDB.get('deleted_complaints', []);
      if (!deletedList.some(d => (d.complaintId || d.id) === cid)) {
        deletedList.unshift({
          ...targetItem,
          isDeleted: true,
          inRecycleBin: true,
          deletedAt: new Date().toISOString(),
          deletionReason: reason,
          deletedBy: currentUser.email || currentUser.name || 'citizen'
        });
        JanasevaDB.set('deleted_complaints', deletedList);
      }
    }

    // 3. Update Firestore if connected
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        await window.fbDb.collection('complaints').doc(cid).delete();
        if (targetItem) {
          await window.fbDb.collection('deleted_complaints').doc(cid).set({
            ...targetItem,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletionReason: reason,
            deletedBy: currentUser.email || 'citizen'
          });
        }
      } catch (fErr) {
        console.warn("Firestore delete notice:", fErr);
      }
    }

    // 4. Update memory list and re-render history
    citizenHistoryList = citizenHistoryList.filter(c => (c.complaintId || c.id) !== cid);
    window.renderCitizenComplaintHistory(citizenHistoryList);

    // 5. If the active tracked complaint is the one deleted, hide tracked result card
    if (activeTrackedComplaint && (activeTrackedComplaint.complaintId === cid || activeTrackedComplaint.id === cid)) {
      activeTrackedComplaint = null;
      const resContainer = document.getElementById('track-result-container');
      const initialPrompt = document.getElementById('track-initial-prompt');
      if (resContainer) resContainer.style.display = 'none';
      if (initialPrompt) initialPrompt.style.display = 'block';
    }

    window.closeTrackDeleteModal();
    window.closeTrackDetailsModal();

    if (typeof showToast === 'function') {
      showToast(`Complaint ${cid} deleted successfully from your history.`, "success");
    }
  } catch (err) {
    console.error("Error executing complaint deletion:", err);
    if (typeof showToast === 'function') {
      showToast("Error deleting complaint: " + err.message, "error");
    }
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Yes, Delete Complaint';
    }
  }
};

window.refreshTrackComplaintHistory = async function() {
  const currentUser = (window.authService && window.authService.currentUser) || null;
  const trackInput = document.getElementById('track-search-input');
  const searchVal = trackInput ? trackInput.value.trim() : '';

  if (currentUser && currentUser.email) {
    await window.loadCitizenComplaintHistory(currentUser.email, currentUser.email);
  } else if (searchVal) {
    await window.loadCitizenComplaintHistory(searchVal);
  } else {
    await window.loadCitizenComplaintHistory('');
  }
  if (typeof showToast === 'function') {
    showToast("Complaint history refreshed from database.", "info");
  }
};
