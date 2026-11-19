/**
 * JANASEVA 2.0 – Complaint Submission, AI Prioritization & Document Verification Engine
 * 
 * Capabilities:
 * 1. Authenticated citizen verification with automatic profile synchronization.
 * 2. Real-Time AI Complaint Prioritization (LOW, NORMAL, HIGH, URGENT) and Emergency Detection.
 * 3. AI-Based Supporting Document Ingestion & Verification (PDF, JPG, PNG) with OCR field extraction and anomaly warnings.
 * 4. Offline-First submission queue (IndexedDB) with automatic synchronization on network reconnect.
 * 5. Full 25-field grievance data model, Firebase Storage evidence upload, and official receipt generator.
 */

let lastSubmittedComplaint = null;
let currentUploadedDocumentAnalysis = null;
let currentUploadedDocumentBase64 = null;

document.addEventListener('DOMContentLoaded', () => {
  const complaintForm = document.getElementById('submit-complaint-form');
  if (!complaintForm) return;

  const gpInput = document.getElementById('complaint-gp');
  const gpDatalist = document.getElementById('gp-datalist');
  const catSelect = document.getElementById('complaint-category');
  const fullNameInput = document.getElementById('complaint-name');
  const emailInput = document.getElementById('complaint-email');
  const phoneInput = document.getElementById('complaint-phone');
  const subjectInput = document.getElementById('complaint-subject');
  const descInput = document.getElementById('complaint-desc');
  const fileInput = document.getElementById('complaint-file');
  const dropArea = document.getElementById('drag-drop-area');
  const previewWrap = document.getElementById('preview-box-wrap');
  const previewImg = document.getElementById('preview-image');
  const removePhotoBtn = document.getElementById('remove-photo-btn');
  const submitBtn = document.getElementById('submit-complaint-btn');

  // AI Elements
  const aiPrioritizationCard = document.getElementById('ai-prioritization-card');
  const docDropArea = document.getElementById('doc-drag-drop-area');
  const docFileInput = document.getElementById('supporting-doc-file');
  const docAnalysisContainer = document.getElementById('doc-analysis-container');

  let currentPhotoBase64 = null;
  let currentFile = null;

  // 1. Populate Gram Panchayat Autocomplete Datalist
  const panchayats = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('panchayats', []) : [];
  const defaultPanchayats = [
    { panchayatId: 'gp-001', name: 'Bellandur Gram Panchayat' },
    { panchayatId: 'gp-002', name: 'Varthur Gram Panchayat' },
    { panchayatId: 'gp-003', name: 'Whitefield Gram Panchayat' }
  ];
  const allPanchayats = (panchayats && panchayats.length > 0) ? panchayats : defaultPanchayats;
  if (gpDatalist) {
    gpDatalist.innerHTML = allPanchayats.map(gp => `<option value="${gp.name}">${gp.district ? gp.name + ' (' + gp.district + ')' : gp.name}</option>`).join('');
  }

  // Pre-fill authenticated citizen data (including async Firebase auth restore)
  const applyCitizenPrefill = (u) => {
    if (!u) return;
    if (fullNameInput && !fullNameInput.value && u.name) fullNameInput.value = u.name;
    if (emailInput && !emailInput.value && u.email) emailInput.value = u.email;
    if (phoneInput && !phoneInput.value && (u.mobile || u.phone)) phoneInput.value = u.mobile || u.phone;
    if (gpInput && !gpInput.value && (u.panchayatName || u.panchayatId)) {
      const match = allPanchayats.find(g => g.panchayatId === u.panchayatId);
      gpInput.value = match ? match.name : (u.panchayatName || u.panchayatId);
    }
  };
  if (window.authService && window.authService.currentUser) {
    applyCitizenPrefill(window.authService.currentUser);
  } else if (window.authService && typeof window.authService.waitForAuth === 'function') {
    window.authService.waitForAuth().then(u => {
      applyCitizenPrefill(u);
      const pGp = new URLSearchParams(window.location.search).get('gp');
      if (pGp && gpInput) {
        const match = allPanchayats.find(g => g.panchayatId === pGp || g.name.toLowerCase().includes(pGp.toLowerCase()));
        gpInput.value = match ? match.name : pGp;
      }
    });
  }

  // Emergency Maintenance Mode Guard
  async function checkEmergencyMaintenance() {
    let active = false;
    let reason = '';

    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        const snap = await window.fbDb.collection('systemSettings').doc('maintenance').get();
        if (snap.exists) {
          active = !!snap.data().active;
          reason = snap.data().reason || '';
        }
      } catch (e) {}
    }

    if (!active) {
      try {
        const local = localStorage.getItem('janaseva_maintenance_mode');
        if (local) {
          const parsed = JSON.parse(local);
          active = !!parsed.active;
          reason = parsed.reason || '';
        }
      } catch (e) {}
    }

    const banner = document.getElementById('emergency-maintenance-banner');
    const bannerText = document.getElementById('emergency-maintenance-text');
    if (banner) {
      banner.style.display = active ? 'block' : 'none';
      if (bannerText && reason) {
        bannerText.textContent = reason;
      }
    }
    if (submitBtn) {
      submitBtn.disabled = active;
      if (active) {
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
      } else {
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
    }
    return { active, reason };
  }

  // Initial check & listen for cross-tab broadcasts
  checkEmergencyMaintenance();

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('janaseva_emergency_channel');
      bc.onmessage = (evt) => {
        if (evt.data && evt.data.type === 'MAINTENANCE_MODE_CHANGED') {
          checkEmergencyMaintenance();
        }
      };
    }
  } catch (e) {}

  // Check URL parameters for pre-selected category or panchayat
  const urlParams = new URLSearchParams(window.location.search);
  const preGp = urlParams.get('gp');
  if (preGp && gpInput) {
    const match = allPanchayats.find(g => g.panchayatId === preGp || g.name.toLowerCase().includes(preGp.toLowerCase()));
    gpInput.value = match ? match.name : preGp;
  }
  const preCat = urlParams.get('category');
  if (preCat && catSelect) {
    for (let opt of catSelect.options) {
      if (opt.value.toLowerCase().includes(preCat.toLowerCase()) || 
          opt.text.toLowerCase().includes(preCat.toLowerCase())) {
        opt.selected = true;
        break;
      }
    }
  }

  // ============================================================================
  // 2. REAL-TIME AI COMPLAINT PRIORITIZATION & EMERGENCY DETECTION
  // ============================================================================
  let debounceTimer = null;
  if (descInput) {
    descInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        runRealTimeAIPrioritization();
      }, 350);
    });
  }

  if (catSelect) {
    catSelect.addEventListener('change', () => {
      runRealTimeAIPrioritization();
    });
  }

  function runRealTimeAIPrioritization() {
    if (!window.janasevaComplaintPrioritizer || !aiPrioritizationCard) return;
    const text = descInput ? descInput.value.trim() : '';
    if (text.length < 8) {
      aiPrioritizationCard.style.display = 'none';
      return;
    }

    const currentCat = catSelect ? catSelect.value : null;
    const analysis = window.janasevaComplaintPrioritizer.analyzeComplaint(text, currentCat);

    // Auto-select category if not selected
    if (catSelect && (!catSelect.value || catSelect.value === "") && analysis.category) {
      for (let opt of catSelect.options) {
        if (opt.value.toLowerCase().includes(analysis.category.toLowerCase())) {
          opt.selected = true;
          break;
        }
      }
    }

    let priorityBadgeClass = 'badge-normal';
    if (analysis.priority === 'URGENT') priorityBadgeClass = 'badge-urgent';
    else if (analysis.priority === 'HIGH') priorityBadgeClass = 'badge-high';
    else if (analysis.priority === 'LOW') priorityBadgeClass = 'badge-low';

    let emergencyHtml = '';
    if (analysis.isEmergency) {
      emergencyHtml = `
        <div class="ai-emergency-banner">
          <div class="emergency-icon-wrap"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div class="emergency-text-wrap">
            <div class="emergency-heading">POTENTIAL EMERGENCY DETECTED</div>
            <div class="emergency-desc">${analysis.emergencyDetails.hazard}</div>
            <div class="emergency-helplines"><strong>Verified Emergency Contact:</strong> ${analysis.emergencyDetails.helpline}</div>
          </div>
        </div>
      `;
    }

    aiPrioritizationCard.innerHTML = `
      ${emergencyHtml}
      <div class="ai-analysis-header">
        <div class="ai-analysis-tag"><i class="fa-solid fa-brain"></i> JANASEVA AI Intelligence</div>
        <div class="ai-priority-pill ${priorityBadgeClass}">Priority: <strong>${analysis.priority}</strong></div>
      </div>
      <div class="ai-analysis-details">
        <div class="ai-detail-item"><strong>Suggested Department:</strong> ${analysis.department}</div>
        <div class="ai-detail-item"><strong>AI Assessment:</strong> ${analysis.rationale}</div>
      </div>
    `;
    aiPrioritizationCard.style.display = 'block';
  }

  // ============================================================================
  // 3. AI-BASED SUPPORTING DOCUMENT VERIFICATION (DUAL-MODE OCR & ANOMALY DETECTION)
  // ============================================================================
  const docCameraInput = document.getElementById('supporting-doc-camera');
  const btnUploadDocFile = document.getElementById('btn-upload-doc-file');
  const btnScanDocFile = document.getElementById('btn-scan-doc-file');
  const btnCaptureDocCamera = document.getElementById('btn-capture-doc-camera');
  const docOcrLangSelect = document.getElementById('doc-ocr-language-select');

  if (btnUploadDocFile && docFileInput) {
    btnUploadDocFile.addEventListener('click', (e) => {
      e.stopPropagation();
      docFileInput.click();
    });
  }

  if (btnScanDocFile && docFileInput) {
    btnScanDocFile.addEventListener('click', (e) => {
      e.stopPropagation();
      docFileInput.click();
    });
  }

  if (btnCaptureDocCamera && docCameraInput) {
    btnCaptureDocCamera.addEventListener('click', (e) => {
      e.stopPropagation();
      docCameraInput.click();
    });
  }

  if (docCameraInput) {
    docCameraInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await handleDocumentUpload(e.target.files[0]);
      }
    });
  }

  if (docDropArea && docFileInput) {
    docDropArea.addEventListener('click', (e) => {
      if (e.target !== docFileInput && !e.target.closest('.doc-action-buttons-group')) {
        docFileInput.click();
      }
    });

    docFileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await handleDocumentUpload(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      docDropArea.addEventListener(name, (e) => {
        e.preventDefault();
        docDropArea.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      docDropArea.addEventListener(name, (e) => {
        e.preventDefault();
        docDropArea.classList.remove('dragover');
      });
    });

    docDropArea.addEventListener('drop', async (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        await handleDocumentUpload(e.dataTransfer.files[0]);
      }
    });
  }

  let lastUploadedDocFile = null;

  async function handleDocumentUpload(file, forceReprocessOnline = false) {
    if (!window.janasevaDocumentVerifier || !docAnalysisContainer) return;
    lastUploadedDocFile = file;

    const preferredLang = (docOcrLangSelect && docOcrLangSelect.value) ? docOcrLangSelect.value : 'eng';

    docAnalysisContainer.style.display = 'block';
    docAnalysisContainer.innerHTML = `
      <div class="doc-loading-box" style="padding: 16px; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-spinner fa-spin doc-loading-spinner" style="color: #0f56b3; font-size: 18px;"></i>
            <span id="doc-ocr-stage-text" style="font-weight: 700; font-size: 13.5px; color: #0b2545;">Initializing Hybrid OCR Engine...</span>
          </div>
          <span id="doc-ocr-percent-text" style="font-size: 12px; font-weight: 700; color: #0f56b3;">0%</span>
        </div>
        <div style="width: 100%; height: 6px; background: #dbeafe; border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
          <div id="doc-ocr-progress-bar" style="width: 5%; height: 100%; background: linear-gradient(90deg, #0f56b3, #38bdf8); transition: width 0.25s ease;"></div>
        </div>
        <div id="doc-ocr-detail-msg" style="font-size: 12px; color: #475569;">Checking online OCR availability and local Tesseract assets...</div>
      </div>
    `;

    const stageText = document.getElementById('doc-ocr-stage-text');
    const percentText = document.getElementById('doc-ocr-percent-text');
    const progressBar = document.getElementById('doc-ocr-progress-bar');
    const detailMsg = document.getElementById('doc-ocr-detail-msg');

    const progressCallback = (p) => {
      if (!p) return;
      const pct = Math.round((p.progress || 0) * 100);
      if (percentText) percentText.textContent = `${pct}%`;
      if (progressBar) progressBar.style.width = `${Math.max(5, pct)}%`;
      if (detailMsg && p.message) detailMsg.textContent = p.message;
      if (stageText) {
        if (p.stage === 'ONLINE_ACTIVE') stageText.textContent = 'Online Cloud OCR Processing...';
        else if (p.stage === 'FALLBACK_OFFLINE') stageText.textContent = 'Switching to Local Tesseract.js (Offline Mode)...';
        else if (p.stage === 'PDF_RENDERING') stageText.textContent = 'Rendering PDF Pages for Text Recognition...';
        else if (p.stage === 'RECOGNIZING') stageText.textContent = 'Recognizing Characters via Web Worker...';
      }
    };

    try {
      const citizenName = fullNameInput ? fullNameInput.value.trim() : '';
      const panchayatName = gpInput ? gpInput.value.trim() : '';

      const analysis = await window.janasevaDocumentVerifier.processDocument(file, {
        citizenName,
        panchayatName,
        preferredLang
      }, progressCallback);

      currentUploadedDocumentAnalysis = analysis;
      currentUploadedDocumentBase64 = analysis.dataUrl;

      // Engine badge styling
      const isOnline = (analysis.ocrEngine || '').startsWith('online') || (analysis.ocrEngine || '').startsWith('cloud');
      const engineBadge = isOnline
        ? `<span class="doc-status-badge badge-success" style="background:#e0f2fe; color:#0369a1; border-color:#bae6fd;"><i class="fa-solid fa-cloud"></i> Online OCR (${escapeHtml(analysis.ocrEngine)})</span>`
        : `<span class="doc-status-badge" style="background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe;"><i class="fa-solid fa-microchip"></i> Offline OCR (Tesseract.js Web Worker)</span>`;

      // Status badge
      let statusBadge = '<span class="doc-status-badge badge-success"><i class="fa-solid fa-circle-check"></i> Consistent</span>';
      if (analysis.reviewStatus === 'Inconsistency Flagged' || analysis.reviewStatus === 'Inconsistency Detected') {
        statusBadge = '<span class="doc-status-badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Inconsistency Flagged</span>';
      } else if (analysis.reviewStatus === 'Missing Field Detected' || analysis.reviewStatus === 'Missing Information') {
        statusBadge = '<span class="doc-status-badge badge-info"><i class="fa-solid fa-circle-info"></i> Missing Field Detected</span>';
      } else if (analysis.reviewStatus.includes('Unreadable')) {
        statusBadge = '<span class="doc-status-badge" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca;"><i class="fa-solid fa-eye-slash"></i> Unreadable (Preserved)</span>';
      }

      let missingHtml = '';
      if (analysis.missingFields && analysis.missingFields.length > 0) {
        missingHtml = `
          <div class="doc-alert-box alert-warning">
            <i class="fa-solid fa-circle-exclamation"></i>
            <div><strong>Missing Required Fields:</strong> ${analysis.missingFields.join(', ')}. Please provide these details manually.</div>
          </div>
        `;
      }

      let inconsistencyHtml = '';
      if (analysis.inconsistencies && analysis.inconsistencies.length > 0) {
        inconsistencyHtml = analysis.inconsistencies.map(inc => `
          <div class="doc-alert-box alert-danger">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div><strong>${inc.field} Discrepancy:</strong> ${inc.message}</div>
          </div>
        `).join('');
      }

      const extractedTextSafe = analysis.extractedText || '';
      const displayLangName = {
        'eng': 'English',
        'kan': 'Kannada (ಕನ್ನಡ)',
        'hin': 'Hindi (हिन्दी)',
        'kan+eng': 'Kannada + English',
        'hin+eng': 'Hindi + English'
      }[analysis.detectedLanguage] || analysis.detectedLanguage;

      docAnalysisContainer.innerHTML = `
        <div class="doc-result-card" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 12px; box-shadow: 0 4px 12px rgba(11,37,69,0.06);">
          <div class="doc-result-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
            <div class="doc-type-info" style="display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-file-shield" style="color: #0f56b3; font-size: 20px;"></i>
              <div>
                <strong style="color: #0b2545; font-size: 14.5px;">${escapeHtml(analysis.docType || 'Document')}</strong>
                <span style="font-size: 11.5px; color: #64748b; margin-left: 6px;">(${Math.round((analysis.classificationConfidence || 0.85) * 100)}% Confidence)</span>
              </div>
            </div>
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              ${engineBadge}
              ${statusBadge}
            </div>
          </div>

          <div class="doc-filename-strip" style="font-size: 12px; color: #475569; padding: 6px 10px; background: #f8fafc; border-radius: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
            <span>File: <strong>${escapeHtml(analysis.filename)}</strong> (${(analysis.fileSize / 1024).toFixed(1)} KB)</span>
            <span>Language: <strong>${escapeHtml(displayLangName)}</strong> &bull; Sync: <strong>${escapeHtml(analysis.syncStatus || 'SAVED_LOCAL_OFFLINE')}</strong></span>
          </div>

          ${inconsistencyHtml}
          ${missingHtml}

          <!-- Structured Entity Grid -->
          <div class="doc-entities-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-bottom: 12px;">
            <div class="entity-item" style="padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;">
              <span style="color: #64748b;">Applicant Name:</span> <strong style="color: #0b2545;">${escapeHtml(analysis.entities?.applicantName || 'Not detected')}</strong>
            </div>
            <div class="entity-item" style="padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;">
              <span style="color: #64748b;">Survey / Doc No:</span> <strong style="color: #0b2545;">${escapeHtml(analysis.entities?.surveyNumber || analysis.entities?.documentNumber || 'N/A')}</strong>
            </div>
            <div class="entity-item" style="padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;">
              <span style="color: #64748b;">Panchayat / Village:</span> <strong style="color: #0b2545;">${escapeHtml(analysis.entities?.village || analysis.entities?.gramPanchayat || 'Not detected')}</strong>
            </div>
            <div class="entity-item" style="padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;">
              <span style="color: #64748b;">Document Date:</span> <strong style="color: #0b2545;">${escapeHtml(analysis.entities?.date || 'N/A')}</strong>
            </div>
          </div>

          <!-- Extracted Text Review & Editable Verification Box -->
          <div class="ocr-review-container" style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label for="doc-ocr-editable-text" style="font-size: 12px; font-weight: 700; color: #0b2545;">
                <i class="fa-solid fa-pen-to-square"></i> Extracted OCR Text (Review & Correct):
              </label>
              <span style="font-size: 11px; color: #64748b;">Citizen Review Encouraged</span>
            </div>
            <textarea id="doc-ocr-editable-text" rows="4" style="width: 100%; font-family: monospace, sans-serif; font-size: 12px; line-height: 1.5; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 6px; resize: vertical;" placeholder="Extracted text will appear here. You can manually correct or type details if unreadable.">${escapeHtml(extractedTextSafe)}</textarea>
          </div>

          <!-- Utility & Action Buttons Strip -->
          <div class="doc-action-strip" style="display: flex; gap: 8px; justify-content: space-between; align-items: center; flex-wrap: wrap; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn-cta-secondary" id="btn-copy-ocr-text" style="padding: 5px 10px; font-size: 11.5px; border-radius: 5px;">
                <i class="fa-regular fa-copy"></i> Copy Text
              </button>
              <button type="button" class="btn-cta-secondary" id="btn-download-ocr-text" style="padding: 5px 10px; font-size: 11.5px; border-radius: 5px;">
                <i class="fa-solid fa-download"></i> Download Text (.txt)
              </button>
              ${!isOnline ? `
              <button type="button" class="btn-cta-secondary" id="btn-reprocess-ocr-online" style="padding: 5px 10px; font-size: 11.5px; border-radius: 5px; color: #0f56b3;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Reprocess Online
              </button>` : ''}
              <button type="button" class="btn-cta-secondary" id="btn-retry-ocr" style="padding: 5px 10px; font-size: 11.5px; border-radius: 5px;">
                <i class="fa-solid fa-arrows-rotate"></i> Retry Scanning
              </button>
            </div>
            <button type="button" class="btn-remove-doc" id="btn-remove-verified-doc" style="padding: 5px 10px; font-size: 11.5px; border-radius: 5px; color: #dc2626; border: 1px solid #fecaca; background: #fff5f5; cursor: pointer;">
              <i class="fa-solid fa-trash-can"></i> Remove
            </button>
          </div>
        </div>
      `;

      // Wire interactive buttons
      const editableTa = document.getElementById('doc-ocr-editable-text');
      if (editableTa) {
        editableTa.addEventListener('input', () => {
          if (currentUploadedDocumentAnalysis) {
            currentUploadedDocumentAnalysis.userCorrectedText = editableTa.value;
            currentUploadedDocumentAnalysis.extractedText = editableTa.value;
          }
        });
      }

      document.getElementById('btn-copy-ocr-text')?.addEventListener('click', async () => {
        const text = editableTa ? editableTa.value : extractedTextSafe;
        if (window.janasevaHybridOcrEngine) {
          const ok = await window.janasevaHybridOcrEngine.copyExtractedText(text);
          showToast(ok ? 'OCR text copied to clipboard!' : 'Failed to copy text.', ok ? 'success' : 'error');
        }
      });

      document.getElementById('btn-download-ocr-text')?.addEventListener('click', () => {
        const text = editableTa ? editableTa.value : extractedTextSafe;
        if (window.janasevaHybridOcrEngine) {
          window.janasevaHybridOcrEngine.downloadExtractedText(analysis.filename, text);
          showToast('Extracted text file downloaded.', 'info');
        }
      });

      document.getElementById('btn-reprocess-ocr-online')?.addEventListener('click', async () => {
        if (!navigator.onLine) {
          showToast('Cannot reprocess online: No internet connection detected.', 'warning');
          return;
        }
        await handleDocumentUpload(file, true);
      });

      document.getElementById('btn-retry-ocr')?.addEventListener('click', async () => {
        await handleDocumentUpload(file);
      });

      document.getElementById('btn-remove-verified-doc')?.addEventListener('click', () => {
        currentUploadedDocumentAnalysis = null;
        currentUploadedDocumentBase64 = null;
        if (docFileInput) docFileInput.value = '';
        if (docCameraInput) docCameraInput.value = '';
        docAnalysisContainer.style.display = 'none';
        docAnalysisContainer.innerHTML = '';
      });

    } catch (err) {
      console.error('Doc verify error:', err);
      docAnalysisContainer.innerHTML = `
        <div class="doc-alert-box alert-danger" style="margin-top: 10px;">
          <i class="fa-solid fa-circle-exclamation"></i>
          <div>
            <strong>Document Processing Failed:</strong> ${escapeHtml(err.message || 'Unknown error')}<br>
            <span style="font-size: 11.5px;">Your original document has been preserved. You can proceed with complaint submission or retry.</span>
          </div>
        </div>
      `;
    }
  }

  // ============================================================================
  // 4. PHOTOGRAPH OF THE ISSUE: DUAL UPLOAD & LIVE CAMERA CAPTURE
  // ============================================================================
  const photoSelectionGrid = document.getElementById('photo-selection-grid');
  const btnOpenCamera = document.getElementById('btn-open-camera');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const previewSourceBadge = document.getElementById('preview-source-badge');
  const btnPreviewRetake = document.getElementById('btn-preview-retake');
  const btnPreviewChange = document.getElementById('btn-preview-change');

  // Camera Modal & Viewport Elements
  const cameraModal = document.getElementById('camera-modal');
  const btnCloseCamera = document.getElementById('btn-close-camera');
  const cameraVideo = document.getElementById('camera-video');
  const cameraCanvas = document.getElementById('camera-canvas');
  const cameraCapturedWrap = document.getElementById('camera-captured-wrap');
  const cameraCapturedImg = document.getElementById('camera-captured-img');
  const cameraLoadingOverlay = document.getElementById('camera-loading-overlay');
  const cameraErrorOverlay = document.getElementById('camera-error-overlay');
  const cameraErrorTitle = document.getElementById('camera-error-title');
  const cameraErrorMessage = document.getElementById('camera-error-message');
  const btnCameraErrorRetry = document.getElementById('btn-camera-error-retry');
  const btnCameraErrorFallback = document.getElementById('btn-camera-error-fallback');
  const cameraFlashOverlay = document.querySelector('.camera-flash-overlay');
  const cameraLiveControls = document.getElementById('camera-live-controls');
  const cameraReviewControls = document.getElementById('camera-review-controls');
  const btnSwitchCamera = document.getElementById('btn-switch-camera');
  const btnCapturePhoto = document.getElementById('btn-capture-photo');
  const btnCancelCamera = document.getElementById('btn-cancel-camera');
  const btnRetakePhoto = document.getElementById('btn-retake-photo');
  const btnUsePhoto = document.getElementById('btn-use-photo');
  const btnDiscardPhoto = document.getElementById('btn-discard-photo');

  let currentCameraStream = null;
  let currentFacingMode = 'environment'; // Prefer rear camera on mobile
  let pendingCapturedBlob = null;
  let pendingCapturedDataUrl = null;

  function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function updatePhotoPreviewUI(file, dataUrl, source) {
    if (previewImg) previewImg.src = dataUrl;
    if (previewFilename) previewFilename.textContent = file.name || 'photograph.jpg';
    if (previewFilesize) {
      const sizeStr = formatFileSize(file.size);
      previewFilesize.innerHTML = `${sizeStr} &bull; <span style="color: #16a34a; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Verified &le; 5 MB</span>`;
    }
    if (previewSourceBadge) {
      if (source === 'camera') {
        previewSourceBadge.className = 'preview-source-badge camera-badge';
        previewSourceBadge.innerHTML = '<i class="fa-solid fa-camera"></i> <span>Live Camera Capture</span>';
      } else {
        previewSourceBadge.className = 'preview-source-badge';
        previewSourceBadge.innerHTML = '<i class="fa-solid fa-folder-open"></i> <span>Uploaded File</span>';
      }
    }
    if (previewWrap) previewWrap.style.display = 'flex';
    if (photoSelectionGrid) photoSelectionGrid.style.display = 'none';
  }

  function clearPhotoSelection() {
    currentPhotoBase64 = null;
    currentFile = null;
    if (fileInput) fileInput.value = '';
    if (previewImg) previewImg.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (photoSelectionGrid) photoSelectionGrid.style.display = 'grid';
  }

  function handleFileSelect(file) {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast("Please select a valid JPG, PNG or WEBP image.", "error");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Image size must not exceed 5 MB.", "error");
      return;
    }

    currentFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      currentPhotoBase64 = e.target.result;
      updatePhotoPreviewUI(file, currentPhotoBase64, 'upload');
    };
    reader.onerror = () => {
      showToast("Failed to read image file. Please try again.", "error");
    };
    reader.readAsDataURL(file);
  }

  // --- Live Camera Management ---
  function stopCameraStream() {
    if (currentCameraStream) {
      currentCameraStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      currentCameraStream = null;
    }
    if (cameraVideo) {
      cameraVideo.srcObject = null;
    }
  }

  async function openCameraModal() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Your browser does not support camera access.", "error");
      if (fileInput) fileInput.click();
      return;
    }

    if (cameraModal) {
      cameraModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    // Reset review state
    if (cameraCapturedWrap) cameraCapturedWrap.style.display = 'none';
    if (cameraErrorOverlay) cameraErrorOverlay.style.display = 'none';
    if (cameraLiveControls) cameraLiveControls.style.display = 'flex';
    if (cameraReviewControls) cameraReviewControls.style.display = 'none';
    pendingCapturedBlob = null;
    pendingCapturedDataUrl = null;

    await startCameraStream();
  }

  async function startCameraStream() {
    stopCameraStream();

    if (cameraLoadingOverlay) cameraLoadingOverlay.style.display = 'flex';
    if (cameraErrorOverlay) cameraErrorOverlay.style.display = 'none';
    if (cameraVideo) cameraVideo.style.display = 'block';

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: currentFacingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };

    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn("Retrying camera with generic constraints:", firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      currentCameraStream = stream;
      if (cameraVideo) {
        cameraVideo.srcObject = stream;
        if (currentFacingMode === 'user') {
          cameraVideo.classList.add('mirrored');
        } else {
          cameraVideo.classList.remove('mirrored');
        }
        await cameraVideo.play().catch(e => console.warn("Video play notice:", e));
      }

      if (cameraLoadingOverlay) cameraLoadingOverlay.style.display = 'none';

      // Check available cameras to toggle switch button
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        if (btnSwitchCamera) {
          btnSwitchCamera.style.display = (videoInputs.length > 1 || isMobile) ? 'inline-flex' : 'none';
        }
      } catch (devErr) {
        if (btnSwitchCamera) btnSwitchCamera.style.display = 'inline-flex';
      }

    } catch (err) {
      console.error("Camera acquisition error:", err);
      if (cameraLoadingOverlay) cameraLoadingOverlay.style.display = 'none';
      if (cameraVideo) cameraVideo.style.display = 'none';

      let errTitle = "Camera Unavailable";
      let errMsg = "Unable to access your device camera.";

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errTitle = "Permission Denied";
        errMsg = "Please allow camera access in your browser settings.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errTitle = "No Camera Detected";
        errMsg = "No camera detected on this device.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errTitle = "Camera Busy";
        errMsg = "Camera is currently being used by another application.";
      } else if (err.name === 'OverconstrainedError') {
        errTitle = "Constraint Error";
        errMsg = "Requested camera mode is not supported by your hardware.";
      }

      if (cameraErrorTitle) cameraErrorTitle.textContent = errTitle;
      if (cameraErrorMessage) cameraErrorMessage.textContent = errMsg;
      if (cameraErrorOverlay) cameraErrorOverlay.style.display = 'flex';

      showToast(errMsg, "error");
    }
  }

  function captureStillPhoto() {
    if (!cameraVideo || !cameraVideo.videoWidth || !cameraVideo.videoHeight) {
      showToast("Unable to capture photograph. Please try again.", "error");
      return;
    }

    // Flash animation
    if (cameraFlashOverlay) {
      cameraFlashOverlay.classList.add('flashing');
      setTimeout(() => cameraFlashOverlay.classList.remove('flashing'), 140);
    }

    if (!cameraCanvas) return;
    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;
    const ctx = cameraCanvas.getContext('2d');

    ctx.save();
    if (currentFacingMode === 'user') {
      ctx.translate(cameraCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
    ctx.restore();

    try {
      const dataUrl = cameraCanvas.toDataURL('image/jpeg', 0.90);
      cameraCanvas.toBlob((blob) => {
        if (!blob) {
          showToast("Unable to capture photograph. Please try again.", "error");
          return;
        }

        pendingCapturedBlob = blob;
        pendingCapturedDataUrl = dataUrl;

        if (cameraCapturedImg) cameraCapturedImg.src = dataUrl;
        if (cameraCapturedWrap) cameraCapturedWrap.style.display = 'flex';
        if (cameraLiveControls) cameraLiveControls.style.display = 'none';
        if (cameraReviewControls) cameraReviewControls.style.display = 'flex';

        try { cameraVideo.pause(); } catch (e) {}
      }, 'image/jpeg', 0.90);
    } catch (e) {
      console.error("Canvas capture error:", e);
      showToast("Unable to capture photograph. Please try again.", "error");
    }
  }

  function retakePhoto() {
    pendingCapturedBlob = null;
    pendingCapturedDataUrl = null;
    if (cameraCapturedWrap) cameraCapturedWrap.style.display = 'none';
    if (cameraCapturedImg) cameraCapturedImg.src = '';
    if (cameraReviewControls) cameraReviewControls.style.display = 'none';
    if (cameraLiveControls) cameraLiveControls.style.display = 'flex';

    if (cameraVideo) {
      cameraVideo.play().catch(e => console.warn(e));
    }
  }

  function useCapturedPhoto() {
    if (!pendingCapturedBlob || !pendingCapturedDataUrl) {
      showToast("No photograph captured. Please capture a photo first.", "warning");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (pendingCapturedBlob.size > maxSize) {
      showToast("Image size must not exceed 5 MB.", "error");
      return;
    }

    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    const filename = `JANASEVA_CAM_${ts}.jpg`;
    const file = new File([pendingCapturedBlob], filename, { type: 'image/jpeg', lastModified: Date.now() });

    currentFile = file;
    currentPhotoBase64 = pendingCapturedDataUrl;

    updatePhotoPreviewUI(file, currentPhotoBase64, 'camera');
    closeCameraModal();
    showToast("Photograph captured and attached successfully!", "success");
  }

  function switchCameraFacingMode() {
    currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
    if (btnSwitchCamera) {
      btnSwitchCamera.classList.add('switching');
      setTimeout(() => btnSwitchCamera.classList.remove('switching'), 300);
    }
    startCameraStream();
  }

  function closeCameraModal() {
    stopCameraStream();
    if (cameraModal) cameraModal.style.display = 'none';
    document.body.style.overflow = '';
    pendingCapturedBlob = null;
    pendingCapturedDataUrl = null;
  }

  // --- Attach Event Listeners ---
  if (dropArea && fileInput) {
    dropArea.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropArea.addEventListener(name, (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropArea.addEventListener(name, (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
      });
    });

    dropArea.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  if (btnOpenCamera) {
    btnOpenCamera.addEventListener('click', () => openCameraModal());
  }

  if (btnCapturePhoto) {
    btnCapturePhoto.addEventListener('click', () => captureStillPhoto());
  }

  if (btnRetakePhoto) {
    btnRetakePhoto.addEventListener('click', () => retakePhoto());
  }

  if (btnUsePhoto) {
    btnUsePhoto.addEventListener('click', () => useCapturedPhoto());
  }

  if (btnSwitchCamera) {
    btnSwitchCamera.addEventListener('click', () => switchCameraFacingMode());
  }

  if (btnCancelCamera) {
    btnCancelCamera.addEventListener('click', () => closeCameraModal());
  }

  if (btnDiscardPhoto) {
    btnDiscardPhoto.addEventListener('click', () => closeCameraModal());
  }

  if (btnCloseCamera) {
    btnCloseCamera.addEventListener('click', () => closeCameraModal());
  }

  if (btnCameraErrorRetry) {
    btnCameraErrorRetry.addEventListener('click', () => startCameraStream());
  }

  if (btnCameraErrorFallback) {
    btnCameraErrorFallback.addEventListener('click', () => {
      closeCameraModal();
      if (fileInput) fileInput.click();
    });
  }

  if (btnPreviewRetake) {
    btnPreviewRetake.addEventListener('click', () => openCameraModal());
  }

  if (btnPreviewChange) {
    btnPreviewChange.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearPhotoSelection();
    });
  }

  // Keyboard navigation: Escape key closes camera
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cameraModal && cameraModal.style.display === 'flex') {
      closeCameraModal();
    }
  });

  // Modal backdrop click to close
  if (cameraModal) {
    cameraModal.addEventListener('click', (e) => {
      if (e.target === cameraModal) {
        closeCameraModal();
      }
    });
  }

  // Resource safety cleanup on page hide / unload
  window.addEventListener('beforeunload', stopCameraStream);
  window.addEventListener('pagehide', stopCameraStream);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopCameraStream();
  });

  // ============================================================================
  // 5. FORM SUBMISSION WITH OFFLINE QUEUE & PERMANENT STORAGE
  // ============================================================================
  let isSubmitting = false;

  complaintForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      console.warn("Complaint submission in progress. Preventing duplicate submission.");
      return;
    }

    // Check Portal Emergency Maintenance Mode
    const maint = await checkEmergencyMaintenance();
    if (maint && maint.active) {
      showToast("Grievance Submissions Paused: " + (maint.reason || "Portal maintenance underway."), "error");
      return;
    }

    if (!window.authService || !window.authService.currentUser) {
      showToast("Please login or register to submit a grievance.", "warning");
      setTimeout(() => {
        window.location.href = "login.html?redirect=complaint.html";
      }, 1000);
      return;
    }

    const currentUser = window.authService.currentUser;
    const fullName = fullNameInput ? fullNameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const gpValue = gpInput ? gpInput.value.trim() : '';
    const category = catSelect ? catSelect.value : '';
    const description = descInput ? descInput.value.trim() : '';

    if (!fullName) {
      showToast("Please enter your full name.", "error");
      fullNameInput?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address.", "error");
      emailInput?.focus();
      return;
    }

    if (!phone || phone.length < 10) {
      showToast("Please enter a valid 10-digit mobile phone number.", "error");
      phoneInput?.focus();
      return;
    }

    if (!gpValue) {
      showToast("Please enter your Gram Panchayat.", "error");
      gpInput?.focus();
      return;
    }

    if (!category) {
      showToast("Please select a grievance category.", "error");
      catSelect?.focus();
      return;
    }

    if (!subject || subject.length < 5) {
      showToast("Please enter a concise grievance subject (at least 5 characters).", "error");
      subjectInput?.focus();
      return;
    }

    if (description.length < 15) {
      showToast("Please provide a detailed description (at least 15 characters).", "error");
      descInput?.focus();
      return;
    }

    if (!currentPhotoBase64) {
      showToast("Please attach an evidence photograph of the issue.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Grievance...';
    isSubmitting = true;

    try {
      const matchedGp = allPanchayats.find(g => (g.name || '').toLowerCase() === gpValue.toLowerCase() || g.panchayatId === gpValue);
      const gpName = matchedGp ? matchedGp.name : gpValue;
      const panchayatId = matchedGp ? matchedGp.panchayatId : ('gp-' + gpValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'gp-custom');
      const receiverEmail = matchedGp ? (matchedGp.receiverEmail || "") : "";

      // 1. Run AI Prioritization
      let aiResult = { priority: 'NORMAL', department: 'General Administration', rationale: 'Standard civic grievance', isEmergency: false };
      if (window.janasevaComplaintPrioritizer) {
        aiResult = window.janasevaComplaintPrioritizer.analyzeComplaint(description, category);
      }

      // 2. Prepare Payload
      const nowFormatted = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
      });
      const nowISO = new Date().toISOString();

      const complaintPayload = {
        citizenUid: currentUser.uid,
        userId: currentUser.uid,
        citizenName: fullName,
        citizenEmail: email.toLowerCase(),
        citizenMobileNumber: phone,
        citizenPhone: phone,
        panchayatId: panchayatId,
        panchayatName: gpName,
        category: category,
        subject: subject,
        description: description,
        photoURL: currentPhotoBase64,
        supportingDocuments: currentUploadedDocumentBase64 ? [currentUploadedDocumentBase64] : [],
        documentAnalysis: currentUploadedDocumentAnalysis || null,
        aiPriority: aiResult.priority,
        aiCategory: aiResult.category,
        aiDepartment: aiResult.department,
        aiRationale: aiResult.rationale,
        isEmergency: aiResult.isEmergency,
        emergencyDetails: aiResult.emergencyDetails || null,
        submissionDate: nowFormatted,
        submissionTimestamp: nowISO,
        createdAt: nowFormatted,
        updatedAt: nowFormatted,
        status: "Submitted",
        assignedReceiverUid: "rec-" + panchayatId,
        assignedReceiverId: "rec-" + panchayatId,
        assignedReceiverEmail: receiverEmail,
        assignedReceiverName: `${gpName} Official Receiver`,
        assignedDepartment: aiResult.department,
        lastUpdatedDate: nowFormatted,
        resolutionDate: null,
        officialResponse: "Your grievance has been successfully submitted and permanently recorded. It has been routed to the Gram Panchayat processing queue.",
        officialResponses: [],
        rejectionReason: null,
        reopenReason: null,
        citizenFeedback: null
      };

      // 3. Check Network Connectivity: If offline, queue in IndexedDB
      if (!navigator.onLine && window.janasevaOfflineDB) {
        const queuedItem = await window.janasevaOfflineDB.enqueueSubmission(complaintPayload, currentUser.uid);

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Complaint';

        // Show offline success modal
        const modal = document.getElementById('submission-success-modal');
        const modalIdEl = document.getElementById('success-complaint-id');
        const modalTitle = modal ? modal.querySelector('.modal-title') : null;
        const modalSub = modal ? modal.querySelector('.modal-body p') : null;

        if (modal && modalIdEl) {
          modalIdEl.innerText = 'OFFLINE-' + queuedItem.requestId.toUpperCase();
          if (modalTitle) modalTitle.innerHTML = '<i class="fa-solid fa-wifi-slash text-warning"></i> Grievance Saved Offline';
          if (modalSub) {
            modalSub.innerHTML = `
              <strong>No Internet Connection:</strong> Your complaint draft has been safely saved in your device's IndexedDB.<br>
              As soon as internet connectivity returns, it will automatically synchronize with Gram Panchayat servers and an official Complaint ID will be generated.
            `;
          }
          modal.classList.add('active');
        } else {
          showToast("Saved to offline queue in IndexedDB. Will sync when online.", "info");
        }
        return;
      }

      // 4. Online Submission Execution
      const queued = window.janasevaOfflineDB
        ? await window.janasevaOfflineDB.enqueueSubmission(complaintPayload, currentUser.uid, false) : null;
      const result = await window.executeComplaintSubmission(complaintPayload, queued?.requestId);
      if (queued) await window.janasevaOfflineDB.updateQueueStatus(queued.requestId, 'Successfully Submitted', result.complaintId);
      lastSubmittedComplaint = result;

      // 5. Show Success Modal with Tracking Link & Acknowledgement Receipt
      const modal = document.getElementById('submission-success-modal');
      const modalIdEl = document.getElementById('success-complaint-id');
      const trackBtn = document.getElementById('modal-track-link');

      if (modal && modalIdEl) {
        modalIdEl.innerText = result.complaintId;
        if (trackBtn) trackBtn.href = `track.html?id=${result.complaintId}`;
        modal.classList.add('active');
        if (window.janasevaTranslator) {
          window.janasevaTranslator.applyTranslations();
        }
      } else {
        showToast(`Grievance permanently recorded! ID: ${result.complaintId}`, "success");
        setTimeout(() => {
          window.location.href = `track.html?id=${result.complaintId}`;
        }, 1500);
      }

    } catch (err) {
      console.error("Grievance submission error:", err);
      showToast("Error saving complaint: " + err.message, "error");
    } finally {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Complaint';
      }
    }
  });

  window.addEventListener('janaseva:langChanged', () => {
    if (typeof runRealTimeAIPrioritization === 'function') runRealTimeAIPrioritization();
    if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
  });
});

/**
 * Global Reusable Submission Pipeline
 * Callable from Form Submit, AI Voice Assistant, and Offline Sync Engine
 */
window.executeComplaintSubmission = async function(payload, offlineRequestId = null) {
  // Resolve authenticated user UID (supports Firebase Auth, Local Auth, and MongoDB user sessions)
  const currentAuthUser = window.authService?.currentUser;
  const fbUser = (window.isFirebaseAvailable && window.fbAuth) ? window.fbAuth.currentUser : null;
  const uid = fbUser?.uid || currentAuthUser?.uid || payload.userId || 'usr-citizen';

  const requestKey = offlineRequestId || payload.offlineRequestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now());
  let stableId = payload.complaintId;
  if (!stableId) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(uid + ':' + requestKey));
        stableId = 'JAN-' + Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
      } catch (e) {
        stableId = 'JAN-' + Date.now();
      }
    } else {
      stableId = 'JAN-' + Date.now();
    }
  }
  const complaintId = payload.complaintId || stableId;

  // Check if already in Firestore when Firebase is connected
  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      const existing = await window.fbDb.collection('complaints').where('userId', '==', uid)
        .where('complaintId', '==', complaintId).get({source: 'server'});
      if (!existing.empty) return existing.docs[0].data();
    } catch (e) {}
  }

  const record = {
    ...payload,
    complaintId: complaintId,
    userId: uid,
    citizenUid: uid,
    offlineRequestId: offlineRequestId || payload.offlineRequestId || null,
    syncStatus: offlineRequestId ? 'SYNCHRONIZED' : 'DIRECT'
  };

  // 1. Firebase Firestore Save (when Firebase Cloud is connected)
  if (window.isFirebaseAvailable && window.fbDb) {
    try {
      const firestoreRecord = { ...record };

      // Upload base64 photo to Firebase Storage when connected
      if (window.fbStorage && firestoreRecord.photoURL && typeof firestoreRecord.photoURL === 'string' && firestoreRecord.photoURL.startsWith('data:image/')) {
        try {
          const resp = await fetch(firestoreRecord.photoURL);
          const photoBlob = await resp.blob();
          const uidSegment = firestoreRecord.userId || firestoreRecord.citizenUid || 'citizen';
          const gpSegment = firestoreRecord.panchayatId || 'gp-001';
          const photoRef = window.fbStorage.ref().child(`complaints/${gpSegment}/${uidSegment}/${complaintId}_photo.jpg`);
          const snapUpload = await photoRef.put(photoBlob, { contentType: photoBlob.type || 'image/jpeg' });
          const downloadUrl = await snapUpload.ref.getDownloadURL();
          firestoreRecord.photoURL = downloadUrl;
          record.photoURL = downloadUrl;
        } catch (upErr) {
          console.warn('[STORAGE] Photo upload notice:', upErr.message);
        }
      }

      const batch = window.fbDb.batch();
      batch.set(window.fbDb.collection('complaints').doc(complaintId), firestoreRecord);

      const actorUid = record.userId || record.citizenUid;
      const historyIso = record.submissionTimestamp || new Date().toISOString();
      const fbInitialHistory = {
        historyId: 'hist-' + complaintId,
        complaintId: complaintId,
        oldStatus: null,
        newStatus: "Submitted",
        updatedBy: actorUid,
        timestamp: historyIso,
        officialNote: "Initial grievance submission by citizen"
      };
      batch.set(window.fbDb.collection('complaints').doc(complaintId).collection('statusHistory').doc(fbInitialHistory.historyId), fbInitialHistory);
      batch.set(window.fbDb.collection('statusHistory').doc(fbInitialHistory.historyId), fbInitialHistory);

      const fbInitialMsg = {
        messageId: 'msg-' + complaintId + '-init',
        complaintId: complaintId,
        senderId: actorUid,
        senderName: record.citizenName || 'Citizen',
        senderEmail: record.citizenEmail || '',
        senderRole: 'citizen',
        message: record.description,
        visibility: 'public',
        createdAt: historyIso
      };
      batch.set(window.fbDb.collection('complaints').doc(complaintId).collection('messages').doc(fbInitialMsg.messageId), fbInitialMsg);
      batch.set(window.fbDb.collection('complaintMessages').doc(fbInitialMsg.messageId), fbInitialMsg);
      await batch.commit();
    } catch (dbErr) {
      console.warn('[FIREBASE] Firestore submission caught:', dbErr.message);
    }
  }

  // 2. Local Mirroring
  if (typeof JanasevaDB !== 'undefined') {
    const localComplaints = JanasevaDB.get('complaints', []);
    const existingIdx = localComplaints.findIndex(c => c.complaintId === complaintId || (offlineRequestId && c.offlineRequestId === offlineRequestId));
    if (existingIdx >= 0) {
      localComplaints[existingIdx] = record;
    } else {
      localComplaints.unshift(record);
    }
    JanasevaDB.set('complaints', localComplaints);
  }

  // 2a. MongoDB Database Save (Persist directly to MongoDB Atlas)
  if (window.JanasevaMongoDB) {
    try {
      await window.JanasevaMongoDB.submitComplaint(record);
      console.info('[MONGODB] Grievance successfully stored in MongoDB Atlas:', complaintId);
    } catch (mErr) {
      console.warn('[MONGODB] Submission notice:', mErr.message);
    }
  }

  // 2b. Automatically Record in Complaint Updates Folder & Lifecycle Manager
  if (window.complaintStorageManager) {
    try {
      await window.complaintStorageManager.recordComplaintUpdate(record, {
        oldStatus: null,
        newStatus: 'Submitted',
        updateType: 'INITIAL_SUBMISSION',
        remarks: 'Initial grievance submission by citizen',
        actor: {
          name: record.citizenName || 'Citizen',
          email: record.citizenEmail || '',
          role: 'citizen',
          uid: record.citizenUid || record.userId
        }
      });

      // Track attachment metadata
      if (record.photoURL || (record.supportingDocuments && record.supportingDocuments.length > 0)) {
        if (typeof JanasevaDB !== 'undefined') {
          const attachments = JanasevaDB.get('complaint_attachments', []);
          attachments.unshift({
            attachmentId: 'att-' + Date.now(),
            complaintId: complaintId,
            photoURL: record.photoURL ? true : false,
            hasPhoto: !!record.photoURL,
            hasDocument: !!(record.supportingDocuments && record.supportingDocuments.length > 0),
            createdAt: record.submissionDate
          });
          JanasevaDB.set('complaint_attachments', attachments);
        }
      }

      // Track assignment metadata
      if (record.assignedReceiverId || record.assignedReceiverEmail) {
        if (typeof JanasevaDB !== 'undefined') {
          const assignments = JanasevaDB.get('complaint_assignments', []);
          assignments.unshift({
            assignmentId: 'asg-' + Date.now(),
            complaintId: complaintId,
            panchayatId: record.panchayatId,
            receiverId: record.assignedReceiverId,
            receiverEmail: record.assignedReceiverEmail,
            receiverName: record.assignedReceiverName,
            assignedAt: record.submissionDate
          });
          JanasevaDB.set('complaint_assignments', assignments);
        }
      }
    } catch (storageErr) {
      console.warn("Storage manager automatic update notice:", storageErr);
    }
  }

  // 3. Email & WhatsApp Dispatch
  try {
    if (window.emailService) {
      const panchayats = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('panchayats', []) : [];
      const gp = panchayats.find(g => g.panchayatId === record.panchayatId);
      await window.emailService.sendComplaintNotificationToReceiver(record, gp);
      await window.emailService.sendConfirmationToCitizen(record);

      // WhatsApp Delivery Trigger (if mobile available)
      const recipientPhone = record.citizenMobileNumber || record.citizenPhone;
      if (recipientPhone && typeof window.emailService.sendWhatsAppNotification === 'function') {
        await window.emailService.sendWhatsAppNotification(record, recipientPhone, 'GRIEVANCE_REGISTERED');
      }
    }
  } catch (noticeErr) {
    console.warn("Notification dispatch notice:", noticeErr);
  }

  return record;
};

/**
 * Download Acknowledgement Slip / Printable PDF Receipt
 */
window.downloadCurrentReceipt = function() {
  if (!lastSubmittedComplaint) {
    showToast("No active complaint found to print receipt.", "warning");
    return;
  }
  window.downloadComplaintReceipt(lastSubmittedComplaint);
};

window.downloadComplaintReceipt = function(c) {
  if (!c) return;

  const esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const T = (s) => (typeof window.janasevaT === 'function') ? window.janasevaT(s) : s;
  const activeLang = (window.janasevaTranslator && window.janasevaTranslator.currentLang) ? window.janasevaTranslator.currentLang : 'en';
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    showToast("Please allow popups to download/print the acknowledgement slip.", "warning");
    return;
  }

  const receiptHtml = `
    <!DOCTYPE html>
    <html lang="${esc(activeLang)}">
    <head>
      <meta charset="UTF-8">
      <title>${esc(T(`JANASEVA Grievance Acknowledgement Slip – ${c.complaintId}`))}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #fff; line-height: 1.5; }
        .receipt-card { border: 2px solid #0f56b3; border-radius: 8px; padding: 25px; max-width: 720px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #0f56b3; padding-bottom: 15px; margin-bottom: 20px; }
        .title { font-size: 20px; font-weight: 800; color: #0b2545; letter-spacing: 0.5px; }
        .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
        .badge-box { background: #eff6ff; border: 1.5px dashed #0f56b3; border-radius: 6px; padding: 12px; text-align: center; margin: 15px 0; }
        .cid { font-size: 22px; font-weight: 800; color: #0f56b3; letter-spacing: 1.5px; }
        .detail-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .detail-table td { padding: 8px 12px; font-size: 13.5px; border-bottom: 1px solid #e2e8f0; }
        .label { font-weight: 700; color: #475569; width: 35%; }
        .val { color: #0b2545; font-weight: 600; }
        .desc-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 13px; color: #334155; margin-top: 15px; }
        .footer { margin-top: 25px; padding-top: 15px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; text-align: center; }
        @media print {
          body { padding: 0; }
          .receipt-card { border: 1px solid #333; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="title">${esc(T('JANASEVA – GRAM PANCHAYAT GRIEVANCE PORTAL'))}</div>
          <div class="subtitle">${esc(T('Official Citizen Grievance Acknowledgement Slip & Filing Receipt'))}</div>
        </div>

        <div class="badge-box">
          <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">${esc(T('Unique Grievance Tracking ID'))}</div>
          <div class="cid">${esc(c.complaintId)}</div>
        </div>

        <table class="detail-table">
          <tr>
            <td class="label">${esc(T('Citizen Name'))}</td>
            <td class="val">${esc(c.citizenName || 'Citizen')}</td>
          </tr>
          <tr>
            <td class="label">${esc(T('Citizen Email'))}</td>
            <td class="val">${esc(c.citizenEmail || 'N/A')}</td>
          </tr>
          <tr>
            <td class="label">${esc(T('Mobile Number'))}</td>
            <td class="val">${esc(c.citizenPhone || c.citizenMobileNumber || 'N/A')}</td>
          </tr>
          <tr>
            <td class="label">${esc(T('Assigned Gram Panchayat'))}</td>
            <td class="val">${esc(T(c.panchayatName || c.panchayatId))}</td>
          </tr>
          <tr>
            <td class="label">${esc(T('Grievance Category'))}</td>
            <td class="val">${esc(T(c.category))}</td>
          </tr>
          <tr>
            <td class="label">${esc(T('Grievance Subject'))}</td>
            <td class="val">${esc(c.subject || c.category)}</td>
          </tr>
          <tr>
            <td class="label">${esc(T('AI Suggested Priority'))}</td>
            <td class="val" style="color: #0284c7; font-weight: 800;">${esc(T(c.aiPriority || 'NORMAL'))}</td>
          </tr>
          <tr>
            <td class="label">${esc(T('Filing Timestamp'))}</td>
            <td class="val">${esc(T(c.createdAt || c.submissionDate))}</td>
          </tr>
          <tr>
            <td class="label">${esc(T('Current Status'))}</td>
            <td class="val" style="color: #0284c7; font-weight: 800;">${esc(T(c.status || 'Submitted'))}</td>
          </tr>
          <tr>
            <td class="label">${esc(T('Assigned Department'))}</td>
            <td class="val">${esc(T(c.assignedDepartment || 'General Administration'))}</td>
          </tr>
        </table>

        <div style="margin-top: 15px;">
          <strong style="font-size: 13px; color: #0b2545;">${esc(T('Grievance Description:'))}</strong>
          <div class="desc-box">${esc(c.description)}</div>
        </div>

        <div class="footer">
          <p>${esc(T('This acknowledgement slip confirms that your grievance has been permanently saved to the official JANASEVA repository.'))}</p>
          <p>${esc(T('To check live real-time progress, visit the online tracker with Complaint ID'))} <strong>${esc(c.complaintId)}</strong>.</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px;" class="no-print">
        <button onclick="window.print()" style="padding: 10px 24px; font-size: 14px; font-weight: 700; background: #0f56b3; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
          ${esc(T('Print / Save as PDF'))}
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
};
