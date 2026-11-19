/**
 * JANASEVA – Admin Panel: AI KNOWLEDGE CENTRE Controller (12 Sections)
 * Strictly restricted to Administrators (verified via AuthService.isAdmin()).
 */
(function (window, document) {
  'use strict';

  const kc = () => window.JanasevaKnowledgeCentre;
  let activeSubTab = 'dashboard';
  let cachedOverview = null;
  let oneTimeRotatedSecrets = null;
  let adminDocSearch = '';
  let adminDocFilter = 'all';

  const SUB_SECTIONS = [
    { id: 'dashboard', label: '1. Dashboard', icon: 'fa-gauge-high' },
    { id: 'all-docs', label: '2. All Documents', icon: 'fa-folder-open' },
    { id: 'upload-history', label: '3. Public Upload History', icon: 'fa-clock-rotate-left' },
    { id: 'processing-queue', label: '4. Processing Queue', icon: 'fa-gears' },
    { id: 'knowledge-db', label: '5. Knowledge Database', icon: 'fa-database' },
    { id: 'failed-docs', label: '6. Failed Documents', icon: 'fa-circle-exclamation' },
    { id: 'quarantined-files', label: '7. Quarantined Files', icon: 'fa-biohazard' },
    { id: 'storage-mgmt', label: '8. Storage Management', icon: 'fa-hard-drive' },
    { id: 'api-settings', label: '9. API Settings (Receiver)', icon: 'fa-plug-circle-check' },
    { id: 'system-logs', label: '10. System Logs', icon: 'fa-clipboard-list' },
    { id: 'backup-restore', label: '11. Backup & Restore', icon: 'fa-box-archive' },
    { id: 'ai-testing', label: '12. AI Knowledge Testing', icon: 'fa-flask-vial' }
  ];

  const FOLDER_DESCRIPTIONS = {
    original_documents: { label: 'Original Documents', access: 'PRIVATE / Controlled Download', icon: 'fa-file-shield' },
    extracted_text: { label: 'Extracted Text', access: 'PRIVATE / Server & Admin Only', icon: 'fa-align-left' },
    processed_documents: { label: 'Processed Documents', access: 'PRIVATE / RAG Pipeline', icon: 'fa-file-code' },
    document_metadata: { label: 'Document Metadata', access: 'Metadata DB / Admin Controlled', icon: 'fa-tags' },
    embeddings: { label: 'Vector Embeddings', access: 'PRIVATE / Vector Index', icon: 'fa-vector-square' },
    temporary_uploads: { label: 'Temporary Uploads', access: 'PRIVATE / Ephemeral Staging', icon: 'fa-hourglass-half' },
    failed_processing: { label: 'Failed Processing', access: 'PRIVATE / Admin Reprocess', icon: 'fa-triangle-exclamation' },
    quarantined_files: { label: 'Quarantined Files', access: 'ISOLATED / Never Indexed', icon: 'fa-skull-crossbones' },
    processing_logs: { label: 'Processing Logs', access: 'ADMIN ONLY / Immutable', icon: 'fa-list-check' },
    backups: { label: 'Cryptographic Backups', access: 'ADMIN ONLY / SHA-256 Verified', icon: 'fa-vault' }
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatBytes(bytes) {
    const b = Number(bytes) || 0;
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return String(iso);
    }
  }

  function notify(msg, type = 'info') {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log('[KnowledgeAdmin]', type, msg);
  }

  let activeContainerId = null;

  function getAuthorizedRole() {
    if (window.authService) {
      if (typeof window.authService.isAdmin === 'function' && window.authService.isAdmin()) return 'admin';
      if (typeof window.authService.isReceiver === 'function' && window.authService.isReceiver()) return 'receiver';
      const u = window.authService.getCurrentUser?.();
      if (u) {
        if (u.role === 'admin' || u.admin === true) return 'admin';
        if (u.role === 'receiver') return 'receiver';
      }
    }
    try {
      const stored = JSON.parse(localStorage.getItem('janaseva_current_user') || sessionStorage.getItem('janaseva_current_user') || '{}');
      if (stored.role === 'admin') return 'admin';
      if (stored.role === 'receiver') return 'receiver';
    } catch (e) {}
    return null;
  }

  function assertAuthorizedAccess() {
    const role = getAuthorizedRole();
    return role === 'admin' || role === 'receiver';
  }

  function assertAdminAccess() {
    return getAuthorizedRole() === 'admin';
  }

  function statusBadgeHtml(doc) {
    if (doc.quarantined || doc.status === 'QUARANTINED') return '<span class="kc-status-pill kc-status-quarantined">QUARANTINED</span>';
    if (doc.status === 'FAILED') return '<span class="kc-status-pill kc-status-failed">FAILED</span>';
    if (doc.status === 'SUPERSEDED') return '<span class="kc-status-pill kc-status-disabled">SUPERSEDED</span>';
    if (doc.enabled === false) return '<span class="kc-status-pill kc-status-disabled">DISABLED</span>';
    return '<span class="kc-status-pill kc-status-indexed">INDEXED (ACTIVE)</span>';
  }

  function trustBadgeHtml(rel) {
    if (rel === 'official') return '<span class="kc-trust-badge kc-trust-official">Official Source</span>';
    if (rel === 'verified_partner') return '<span class="kc-trust-badge kc-trust-api">API Verified</span>';
    return '<span class="kc-trust-badge kc-trust-community">Community</span>';
  }

  function renderSubNav(ov) {
    const counts = {
      'failed-docs': ov.stats.failedDocuments || 0,
      'quarantined-files': ov.stats.quarantinedDocuments || 0,
      'processing-queue': ov.stats.processingDocuments || 0
    };
    return `
      <div class="kc-admin-subnav" role="tablist" aria-label="AI Knowledge Centre Sections">
        ${SUB_SECTIONS.map((s) => {
          const badge = counts[s.id] > 0 ? `<span class="kc-subnav-count">${counts[s.id]}</span>` : '';
          return `
            <button type="button" class="kc-subnav-btn ${activeSubTab === s.id ? 'active' : ''}" data-kc-subtab="${s.id}">
              <i class="fa-solid ${s.icon}"></i>
              <span>${s.label}</span>
              ${badge}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderSectionDashboard(ov) {
    const st = ov.stats;
    const recent = ov.documents.slice(0, 8);
    const langCounts = { en: 0, kn: 0, hi: 0, other: 0 };
    ov.documents.forEach((d) => {
      if (d.primaryLanguage === 'en' || d.primaryLanguage === 'kn' || d.primaryLanguage === 'hi') langCounts[d.primaryLanguage]++;
      else langCounts.other++;
    });

    return `
      <div class="kc-admin-kpi-grid" data-no-translate="true">
        <div class="kc-kpi-card"><div class="kc-kpi-num">${st.totalUploadedDocuments}</div><div class="kc-kpi-label">Total Uploaded Documents</div></div>
        <div class="kc-kpi-card"><div class="kc-kpi-num">${st.totalContributors}</div><div class="kc-kpi-label">Total Contributors</div></div>
        <div class="kc-kpi-card"><div class="kc-kpi-num">${st.totalExtractedTextRecords}</div><div class="kc-kpi-label">Extracted Text Records</div></div>
        <div class="kc-kpi-card kc-kpi-ok"><div class="kc-kpi-num">${st.successfullyProcessedDocuments}</div><div class="kc-kpi-label">Successfully Processed</div></div>
        <div class="kc-kpi-card"><div class="kc-kpi-num">${st.processingDocuments}</div><div class="kc-kpi-label">Processing Queue</div></div>
        <div class="kc-kpi-card kc-kpi-warn"><div class="kc-kpi-num">${st.failedDocuments}</div><div class="kc-kpi-label">Failed Documents</div></div>
        <div class="kc-kpi-card kc-kpi-danger"><div class="kc-kpi-num">${st.quarantinedDocuments}</div><div class="kc-kpi-label">Quarantined Files</div></div>
        <div class="kc-kpi-card"><div class="kc-kpi-num">${st.duplicateUploads}</div><div class="kc-kpi-label">Duplicate Uploads</div></div>
        <div class="kc-kpi-card"><div class="kc-kpi-num">${formatBytes(st.storageConsumptionBytes)}</div><div class="kc-kpi-label">Storage Consumption</div></div>
        <div class="kc-kpi-card kc-kpi-info"><div class="kc-kpi-num" style="font-size: 16px;">${escapeHtml(st.indexingStatus)}</div><div class="kc-kpi-label">Knowledge Indexing Status (${st.totalChunks} chunks)</div></div>
      </div>

      <div class="kc-admin-split-grid">
        <div class="kc-subpanel">
          <h3 class="kc-subpanel-title"><i class="fa-solid fa-language"></i> Multilingual Coverage &amp; Vector Index</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
            <span class="kc-lang-badge kc-lang-en">English: ${langCounts.en}</span>
            <span class="kc-lang-badge kc-lang-kn">ಕನ್ನಡ (Kannada): ${langCounts.kn}</span>
            <span class="kc-lang-badge kc-lang-hi">हिन्दी (Hindi): ${langCounts.hi}</span>
            <span class="kc-meta-chip">Vector Embeddings: ${st.totalEmbeddings}</span>
          </div>
          <p style="font-size: 12.5px; color: #475569; margin: 0;">Public contributions become searchable automatically without an approval bottleneck. Admins retain emergency disable, quarantine inspection, deletion, and Official Government circular upload authority.</p>
        </div>
        <div class="kc-subpanel">
          <h3 class="kc-subpanel-title"><i class="fa-solid fa-upload"></i> Quick Admin Official Upload</h3>
          <p style="font-size: 12.5px; color: #475569; margin-bottom: 10px;">Upload official Gram Panchayat circulars, scheme rules, or notices marked with elevated <strong>Official Source</strong> ranking weight.</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <input type="file" id="kc-admin-quick-file" class="form-input" style="flex: 1; min-width: 190px; padding: 6px;" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json,.xml,.jpg,.jpeg,.png,.webp,.zip">
            <button type="button" class="btn-cta-primary" id="kc-admin-quick-upload-btn" style="padding: 8px 14px; font-size: 13px;">Upload Official Doc</button>
          </div>
        </div>
      </div>

      <div class="kc-subpanel" style="margin-top: 16px;" data-no-translate="true">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 class="kc-subpanel-title" style="margin: 0;"><i class="fa-solid fa-clock"></i> Recent Uploads</h3>
          <a href="knowledge-centre.html" target="_blank" rel="noopener" style="font-size: 12.5px; font-weight: 700; color: #0f56b3;">Open Public Knowledge Centre <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div>
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead>
              <tr><th>Document</th><th>Contributor</th><th>Language</th><th>Trust</th><th>Status</th><th>Uploaded</th></tr>
            </thead>
            <tbody>
              ${recent.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 18px; color: #64748b;">No documents uploaded yet.</td></tr>' : recent.map((d) => `
                <tr>
                  <td><strong>${escapeHtml(d.title)}</strong> <span style="font-size:11px; color:#64748b;">(${escapeHtml(d.docId)})</span></td>
                  <td>${escapeHtml(d.contributorDisplayName || 'Public')}</td>
                  <td>${escapeHtml(String(d.primaryLanguage || '').toUpperCase())}</td>
                  <td>${trustBadgeHtml(d.sourceReliability)}</td>
                  <td>${statusBadgeHtml(d)}</td>
                  <td style="font-size: 12px;">${formatDate(d.uploadedAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionAllDocs(ov) {
    const q = adminDocSearch.toLowerCase();
    const filtered = ov.documents.filter((d) => {
      if (adminDocFilter === 'active' && (d.status !== 'INDEXED' || d.enabled === false)) return false;
      if (adminDocFilter === 'disabled' && d.enabled !== false) return false;
      if (adminDocFilter === 'official' && d.sourceReliability !== 'official') return false;
      if (adminDocFilter === 'community' && d.sourceReliability !== 'community') return false;
      if (q) {
        const hay = `${d.docId} ${d.title} ${d.originalFilename} ${d.contributorDisplayName} ${d.category} ${d.summary || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return `
      <div class="kc-subpanel" style="margin-bottom: 14px;">
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 10px; flex: 1; flex-wrap: wrap;">
            <input type="text" id="kc-admin-doc-search" class="form-input" style="min-width: min(100%, 200px); flex: 1;" value="${escapeHtml(adminDocSearch)}" placeholder="Search doc ID, filename, contributor, topic...">
            <select id="kc-admin-doc-filter" class="form-select" style="width: min(100%, 200px); flex: 1 1 170px;">
              <option value="all" ${adminDocFilter === 'all' ? 'selected' : ''}>All Documents (${ov.documents.length})</option>
              <option value="active" ${adminDocFilter === 'active' ? 'selected' : ''}>Active Indexed Only</option>
              <option value="disabled" ${adminDocFilter === 'disabled' ? 'selected' : ''}>Disabled Only</option>
              <option value="official" ${adminDocFilter === 'official' ? 'selected' : ''}>Official Sources</option>
              <option value="community" ${adminDocFilter === 'community' ? 'selected' : ''}>Community Contributed</option>
            </select>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <label style="font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
              <input type="checkbox" id="kc-admin-upload-official" checked> Official Source
            </label>
            <input type="file" id="kc-admin-all-file" style="max-width: 210px; font-size: 12px;" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json,.xml,.jpg,.jpeg,.png,.webp,.zip">
            <button type="button" class="btn-cta-primary" id="kc-admin-all-upload-btn" style="padding: 7px 12px; font-size: 12.5px;">Upload</button>
          </div>
        </div>
      </div>

      <div class="kc-subpanel" data-no-translate="true">
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead>
              <tr>
                <th>ID &amp; Document</th>
                <th>Uploader / Source</th>
                <th>Format / Lang</th>
                <th>Trust</th>
                <th>Status</th>
                <th>Chunks</th>
                <th style="text-align: right;">Admin Controls</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #64748b;">No documents match your filter.</td></tr>' : filtered.map((d) => `
                <tr>
                  <td>
                    <div style="font-weight: 700; color: #0b2545;">${escapeHtml(d.title)} <span style="font-size:11px; color:#64748b;">v${d.version || 1}</span></div>
                    <div style="font-size: 11px; color: #64748b;">${escapeHtml(d.docId)} • ${escapeHtml(d.originalFilename)} • ${formatBytes(d.sizeBytes)}</div>
                    ${d.promptInjectionFlag ? '<span class="kc-status-pill kc-status-quarantined" style="font-size: 10px; margin-top: 3px;">Prompt Injection Guarded</span>' : ''}
                    ${d.piiDetected ? '<span class="kc-status-pill kc-status-duplicate" style="font-size: 10px; margin-top: 3px;">PII Masked</span>' : ''}
                  </td>
                  <td>
                    <div style="font-weight: 600;">${escapeHtml(d.contributorDisplayName || 'Public')}</div>
                    <div style="font-size: 11px; color: #64748b;">${escapeHtml(d.sourceChannel || 'PUBLIC_UPLOAD')}</div>
                  </td>
                  <td>
                    <span class="kc-format-pill">${escapeHtml(String(d.format || '').toUpperCase())}</span>
                    <span style="font-size: 12px; font-weight: 700; margin-left: 4px;">${escapeHtml(String(d.primaryLanguage || '').toUpperCase())}</span>
                  </td>
                  <td>${trustBadgeHtml(d.sourceReliability)}</td>
                  <td>${statusBadgeHtml(d)}</td>
                  <td>${d.chunkCount || 0}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn-table-action kc-adm-inspect" data-doc-id="${escapeHtml(d.docId)}" title="View extracted text & source metadata"><i class="fa-solid fa-eye"></i></button>
                    <button type="button" class="btn-table-action kc-adm-dl" data-doc-id="${escapeHtml(d.docId)}" title="Download original file"><i class="fa-solid fa-download"></i></button>
                    ${d.status === 'INDEXED' && !d.quarantined ? `
                      <button type="button" class="btn-table-action kc-adm-toggle" data-doc-id="${escapeHtml(d.docId)}" data-enabled="${d.enabled === false ? 'true' : 'false'}" title="${d.enabled === false ? 'Enable' : 'Emergency Disable'}">
                        <i class="fa-solid ${d.enabled === false ? 'fa-toggle-off' : 'fa-toggle-on'}" style="color: ${d.enabled === false ? '#94a3b8' : '#15803d'};"></i>
                      </button>` : ''}
                    ${!d.quarantined ? `<button type="button" class="btn-table-action kc-adm-reprocess" data-doc-id="${escapeHtml(d.docId)}" title="Reprocess document"><i class="fa-solid fa-rotate"></i></button>` : ''}
                    <button type="button" class="btn-table-action kc-adm-delete" data-doc-id="${escapeHtml(d.docId)}" data-title="${escapeHtml(d.title)}" title="Permanently delete document & chunks" style="color: #dc2626;"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionUploadHistory(ov) {
    return `
      <div class="kc-subpanel" style="margin-bottom: 14px;" data-no-translate="true">
        <h3 class="kc-subpanel-title"><i class="fa-solid fa-users"></i> Contributors / Uploader Profiles (${ov.uploaders.length})</h3>
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead><tr><th>Uploader ID</th><th>Display Name</th><th>Private Contact</th><th>Role</th><th>Uploads</th><th>Indexed</th><th>Quarantined</th><th>Last Upload</th></tr></thead>
            <tbody>
              ${ov.uploaders.length === 0 ? '<tr><td colspan="8" style="text-align:center; padding: 16px; color: #64748b;">No uploaders recorded yet.</td></tr>' : ov.uploaders.map((u) => `
                <tr>
                  <td style="font-size: 12px;">${escapeHtml(u.uploaderId)}</td>
                  <td><strong>${escapeHtml(u.displayName || 'Public')}</strong></td>
                  <td style="font-size: 12px;">${escapeHtml(u.email || 'Anonymous Public')}</td>
                  <td>${escapeHtml(u.role || 'public')}</td>
                  <td>${u.uploadCount || 0}</td>
                  <td>${u.indexedCount || 0}</td>
                  <td>${u.quarantinedCount || 0}</td>
                  <td style="font-size: 12px;">${formatDate(u.lastUploadAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="kc-subpanel" data-no-translate="true">
        <h3 class="kc-subpanel-title"><i class="fa-solid fa-clock-rotate-left"></i> Submission Timeline (${ov.documents.length})</h3>
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead><tr><th>Uploaded At</th><th>Filename</th><th>Contributor</th><th>Channel</th><th>Language</th><th>Status</th><th>File Hash (SHA-256)</th></tr></thead>
            <tbody>
              ${ov.documents.slice(0, 60).map((d) => `
                <tr>
                  <td style="font-size: 12px;">${formatDate(d.uploadedAt)}</td>
                  <td><strong>${escapeHtml(d.originalFilename || d.title)}</strong></td>
                  <td>${escapeHtml(d.contributorDisplayName || 'Public')}</td>
                  <td>${escapeHtml(d.sourceChannel || 'PUBLIC_UPLOAD')}</td>
                  <td>${escapeHtml(String(d.primaryLanguage || '').toUpperCase())}</td>
                  <td>${statusBadgeHtml(d)}</td>
                  <td style="font-family: monospace; font-size: 11px;">${escapeHtml(String(d.fileHash || '').slice(0, 16))}…</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionQueue(ov) {
    const failedCount = ov.jobs.filter(j => j.status === 'FAILED').length;
    return `
      <div class="kc-subpanel" data-no-translate="true">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
          <div>
            <h3 class="kc-subpanel-title" style="margin: 0;"><i class="fa-solid fa-gears"></i> Automatic Scanning Pipeline Queue (${ov.jobs.length} jobs)</h3>
            <p style="font-size: 12.5px; color: #475569; margin: 4px 0 0;">Manage background processing, OCR extraction jobs, and delete completed, stale, or failed queue records.</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn-table-action" id="kc-queue-delete-selected-btn" disabled style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-weight: 700; padding: 6px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; opacity: 0.5; transition: all 0.2s;" title="Delete all selected job records with confirmation">
              <i class="fa-solid fa-trash-can"></i> Delete Selected (<span id="kc-queue-selected-count">0</span>)
            </button>
            ${failedCount > 0 ? `
              <button type="button" class="btn-table-action" id="kc-queue-clear-failed-btn" style="background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; font-weight: 700; padding: 6px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;" title="Delete all failed job records from database">
                <i class="fa-solid fa-broom"></i> Clear Failed (${failedCount})
              </button>
            ` : ''}
            <button type="button" class="btn-refresh" id="kc-queue-refresh-btn" style="padding: 6px 12px; font-size: 12px; border-radius: 6px;" title="Reload queue from database">
              <i class="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
          </div>
        </div>

        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead>
              <tr>
                <th style="width: 36px; text-align: center;">
                  <input type="checkbox" id="kc-queue-select-all" title="Select all job records" style="cursor: pointer;">
                </th>
                <th>Job ID</th>
                <th>Doc ID</th>
                <th>Filename</th>
                <th>Current Stage</th>
                <th>Status</th>
                <th>Chunks</th>
                <th>Started</th>
                <th>Error</th>
                <th style="text-align: right; width: 95px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${ov.jobs.length === 0 ? '<tr><td colspan="10" style="text-align:center; padding: 22px; color:#64748b;"><i class="fa-solid fa-circle-check" style="color: #16a34a; margin-right: 6px;"></i>No processing jobs recorded in queue. Pipeline healthy.</td></tr>' : ov.jobs.slice(0, 100).map((j) => `
                <tr>
                  <td style="text-align: center;">
                    <input type="checkbox" class="kc-queue-row-select" data-job-id="${escapeHtml(j.jobId)}" data-filename="${escapeHtml(j.filename)}" data-status="${escapeHtml(j.status)}" style="cursor: pointer;">
                  </td>
                  <td style="font-family: monospace; font-size: 11.5px;">${escapeHtml(j.jobId)}</td>
                  <td style="font-size: 12px;">${escapeHtml(j.docId || '—')}</td>
                  <td><strong>${escapeHtml(j.filename)}</strong></td>
                  <td style="font-size: 12px;">${escapeHtml(j.currentStage || '—')}</td>
                  <td><span class="kc-status-pill ${j.status === 'COMPLETED' ? 'kc-status-indexed' : (j.status === 'QUARANTINED' ? 'kc-status-quarantined' : (j.status === 'FAILED' ? 'kc-status-failed' : 'kc-status-processing'))}">${escapeHtml(j.status)}</span></td>
                  <td>${j.chunkCount || 0}</td>
                  <td style="font-size: 11.5px;">${formatDate(j.startedAt)}</td>
                  <td style="font-size: 11.5px; color: #b91c1c;">${escapeHtml(j.error || '')}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn-table-action kc-queue-row-delete" data-job-id="${escapeHtml(j.jobId)}" data-filename="${escapeHtml(j.filename)}" data-status="${escapeHtml(j.status)}" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-weight: 700; padding: 4px 8px; border-radius: 5px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Delete this job record">
                      <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionKnowledgeDb(ov) {
    const indexedDocs = ov.documents.filter((d) => d.status === 'INDEXED');
    return `
      <div class="kc-subpanel" style="margin-bottom: 14px;" data-no-translate="true">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 class="kc-subpanel-title" style="margin: 0;"><i class="fa-solid fa-database"></i> Active RAG Knowledge Database</h3>
            <p style="font-size: 12.5px; color: #475569; margin: 4px 0 0;">Indexed Documents: <strong>${indexedDocs.length}</strong> • Active Chunks: <strong>${ov.stats.totalChunks}</strong> • Vector Embeddings: <strong>${ov.stats.totalEmbeddings}</strong></p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn-cta-secondary" id="kc-adm-export-json" style="padding: 7px 12px; font-size: 12.5px;"><i class="fa-solid fa-file-export"></i> Export Knowledge JSON</button>
            <button type="button" class="btn-cta-secondary" id="kc-adm-export-csv" style="padding: 7px 12px; font-size: 12.5px;"><i class="fa-solid fa-file-csv"></i> Export Index CSV</button>
          </div>
        </div>
      </div>
      <div class="kc-subpanel" data-no-translate="true">
        <h3 class="kc-subpanel-title">Knowledge Chunks Preview (Showing up to 80 records)</h3>
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead><tr><th>Chunk ID</th><th>Document</th><th>Lang</th><th>Reliability</th><th>Active</th><th>Chunk Text Preview</th></tr></thead>
            <tbody>
              ${(ov.chunks || []).length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 18px; color: #64748b;">No chunks indexed yet. Upload documents or check Cloud Knowledge DB.</td></tr>' : ov.chunks.slice(0, 80).map((c) => `
                <tr>
                  <td style="font-family: monospace; font-size: 11px;">${escapeHtml(c.chunkId)}</td>
                  <td>${escapeHtml(c.docTitle || c.docId)}</td>
                  <td>${escapeHtml(String(c.language || '').toUpperCase())}</td>
                  <td>${trustBadgeHtml(c.sourceReliability)}</td>
                  <td>${c.active === false ? '<span class="kc-status-pill kc-status-disabled">INACTIVE</span>' : '<span class="kc-status-pill kc-status-indexed">ACTIVE</span>'}</td>
                  <td style="font-size: 12px; max-width: 380px;">${escapeHtml(String(c.text || '').slice(0, 140))}…</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionFailedDocs(ov) {
    return `
      <div class="kc-subpanel" data-no-translate="true">
        <h3 class="kc-subpanel-title"><i class="fa-solid fa-circle-exclamation"></i> Failed Documents (${ov.failedDocs.length})</h3>
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead><tr><th>Doc ID</th><th>Filename</th><th>Failure Stage</th><th>Reason</th><th>Manual OCR / Text Hint (Optional)</th><th style="text-align: right;">Actions</th></tr></thead>
            <tbody>
              ${ov.failedDocs.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #15803d;">No failed documents. Pipeline healthy.</td></tr>' : ov.failedDocs.map((d) => `
                <tr>
                  <td style="font-size: 12px;">${escapeHtml(d.docId)}</td>
                  <td><strong>${escapeHtml(d.originalFilename || d.title)}</strong></td>
                  <td style="font-size: 12px;">${escapeHtml(d.failureStage || 'Unknown')}</td>
                  <td style="font-size: 12px; color: #b91c1c; max-width: 260px;">${escapeHtml(d.failureReason || 'Unknown failure')}</td>
                  <td><input type="text" class="form-input kc-failed-ocr-input" data-doc-id="${escapeHtml(d.docId)}" placeholder="Paste OCR text to reprocess..." style="font-size: 12px; padding: 5px 8px;"></td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn-table-action kc-adm-run-hybrid-ocr" data-doc-id="${escapeHtml(d.docId)}" title="Scan with Hybrid OCR (Online/Offline) to extract text & retry"><i class="fa-solid fa-camera"></i> Run OCR</button>
                    <button type="button" class="btn-table-action kc-adm-reprocess-failed" data-doc-id="${escapeHtml(d.docId)}" title="Reprocess"><i class="fa-solid fa-rotate"></i> Reprocess</button>
                    <button type="button" class="btn-table-action kc-adm-delete" data-doc-id="${escapeHtml(d.docId)}" data-title="${escapeHtml(d.title)}" style="color: #dc2626;" title="Delete"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionQuarantined(ov) {
    return `
      <div class="kc-subpanel" data-no-translate="true">
        <h3 class="kc-subpanel-title" style="color: #b91c1c;"><i class="fa-solid fa-biohazard"></i> Security Quarantined Files (${ov.quarantinedDocs.length})</h3>
        <p style="font-size: 12.5px; color: #475569; margin-bottom: 12px;">These files were isolated in <code>AI_KNOWLEDGE_CENTRE/quarantined_files/</code> and NEVER indexed into AI chat retrieval.</p>
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead><tr><th>Doc ID</th><th>Filename</th><th>Threat Code</th><th>Flags</th><th>Security Reason</th><th>Uploaded</th><th style="text-align: right;">Actions</th></tr></thead>
            <tbody>
              ${ov.quarantinedDocs.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #15803d;">No quarantined files detected.</td></tr>' : ov.quarantinedDocs.map((d) => `
                <tr>
                  <td style="font-size: 12px;">${escapeHtml(d.docId)}</td>
                  <td><strong>${escapeHtml(d.originalFilename || d.title)}</strong></td>
                  <td><span class="kc-status-pill kc-status-quarantined">${escapeHtml(d.quarantineCode || 'THREAT')}</span></td>
                  <td style="font-size: 11.5px;">${escapeHtml((d.riskFlags || []).join(', '))}</td>
                  <td style="font-size: 12px; color: #b91c1c; max-width: 280px;">${escapeHtml(d.quarantineReason || '')}</td>
                  <td style="font-size: 12px;">${formatDate(d.uploadedAt)}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn-table-action kc-adm-release" data-doc-id="${escapeHtml(d.docId)}" title="Release & Reprocess after verification"><i class="fa-solid fa-shield-halved"></i></button>
                    <button type="button" class="btn-table-action kc-adm-delete" data-doc-id="${escapeHtml(d.docId)}" data-title="${escapeHtml(d.title)}" style="color: #dc2626;" title="Delete Permanently"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionStorage(ov) {
    const folders = (ov.storage && ov.storage.folders) || {};
    return `
      <div class="kc-subpanel" style="margin-bottom: 14px;" data-no-translate="true">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 class="kc-subpanel-title" style="margin: 0;"><i class="fa-solid fa-hard-drive"></i> AI_KNOWLEDGE_CENTRE Storage Architecture</h3>
            <p style="font-size: 12.5px; color: #475569; margin: 4px 0 0;">Total Storage Used: <strong>${formatBytes(ov.stats.storageConsumptionBytes)}</strong> • Total Objects: <strong>${ov.storage?.totalFiles || 0}</strong> • All raw backend paths kept private.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn-cta-secondary kc-adm-cleanup" data-folder="temporary_uploads" style="padding: 7px 12px; font-size: 12px;">Purge temporary_uploads</button>
            <button type="button" class="btn-cta-secondary kc-adm-cleanup" data-folder="failed_processing" style="padding: 7px 12px; font-size: 12px;">Purge failed_processing</button>
          </div>
        </div>
      </div>
      <div class="kc-storage-grid" data-no-translate="true">
        ${Object.keys(FOLDER_DESCRIPTIONS).map((key) => {
          const meta = FOLDER_DESCRIPTIONS[key];
          const stat = folders[key] || { fileCount: 0, sizeBytes: 0 };
          return `
            <div class="kc-storage-card">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <i class="fa-solid ${meta.icon}" style="color: #0f56b3;"></i>
                <strong style="font-size: 13px; color: #0b2545;">AI_KNOWLEDGE_CENTRE/${key}/</strong>
              </div>
              <div style="font-size: 12px; color: #475569;">${meta.label}</div>
              <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 700;">
                <span>${stat.fileCount} files</span>
                <span>${formatBytes(stat.sizeBytes)}</span>
              </div>
              <div style="margin-top: 4px; font-size: 11px; color: #64748b;">Policy: ${meta.access}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderSectionApiSettings(ov) {
    const cfg = ov.apiConfig || {};
    const logs = ov.apiLogs || [];
    const role = getAuthorizedRole();
    const isAdmin = role === 'admin';

    return `
      <div class="kc-subpanel" style="margin-bottom: 14px; border-left: 4px solid #0f56b3;" data-no-translate="true">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 class="kc-subpanel-title" style="margin: 0;"><i class="fa-solid fa-plug-circle-check"></i> Receiver-Only External Data API Settings (${isAdmin ? 'Admin Controlled' : 'Receiver Authorized'})</h3>
            <p style="font-size: 12.5px; color: #475569; margin: 4px 0 0;">Dedicated inward-only HTTPS API for authorized external portals/webhooks. Secrets are securely hashed and never exposed in client bundles.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="kc-status-pill ${isAdmin ? 'kc-status-indexed' : 'kc-status-official'}">${isAdmin ? 'ADMIN ACCESS' : 'RECEIVER ACCESS'}</span>
            <span class="kc-status-pill ${cfg.enabled ? 'kc-status-indexed' : 'kc-status-disabled'}">${cfg.enabled ? 'RECEIVER ENABLED' : 'RECEIVER DISABLED'}</span>
          </div>
        </div>
      </div>

      ${oneTimeRotatedSecrets ? `
        <div class="kc-subpanel" style="margin-bottom: 14px; background: #fffbeb; border: 1.5px solid #f59e0b;" data-no-translate="true">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #92400e;"><i class="fa-solid fa-key"></i> New API Secrets Generated (Shown ONCE — Copy &amp; Store Securely Now)</strong>
            <button type="button" class="btn-table-action" id="kc-api-dismiss-secrets">Dismiss</button>
          </div>
          <div style="font-family: monospace; font-size: 12px; display: grid; gap: 6px; color: #1e293b;">
            <div><strong>X-API-Key:</strong> <code>${escapeHtml(oneTimeRotatedSecrets.apiKey)}</code></div>
            <div><strong>Bearer Token:</strong> <code>${escapeHtml(oneTimeRotatedSecrets.bearerToken)}</code></div>
            <div><strong>Webhook Secret:</strong> <code>${escapeHtml(oneTimeRotatedSecrets.webhookSecret)}</code></div>
          </div>
        </div>
      ` : ''}

      <div class="kc-admin-split-grid" data-no-translate="true">
        <div class="kc-subpanel" id="kc-api-config-card">
          <h3 class="kc-subpanel-title"><i class="fa-solid fa-sliders"></i> Endpoint, Auth &amp; Rate Configuration</h3>
          <div id="kc-api-usm-status"></div>
          <form id="kc-api-config-form">
          <div class="form-group">
            <label style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer;">
              <input type="checkbox" id="kc-api-enabled" ${cfg.enabled ? 'checked' : ''}> Enable Receiver API Endpoint
            </label>
          </div>
          <div class="form-group">
            <label class="form-label" for="kc-api-endpoint">HTTPS Receiver Endpoint URL</label>
            <input type="text" id="kc-api-endpoint" class="form-input" value="${escapeHtml(cfg.endpointUrl || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="kc-api-auth-mode">Authentication Requirement</label>
            <select id="kc-api-auth-mode" class="form-select">
              <option value="api_key_or_bearer" ${cfg.authMode === 'api_key_or_bearer' ? 'selected' : ''}>X-API-Key OR Bearer Token</option>
              <option value="api_key_only" ${cfg.authMode === 'api_key_only' ? 'selected' : ''}>Strict X-API-Key Only</option>
              <option value="bearer_only" ${cfg.authMode === 'bearer_only' ? 'selected' : ''}>Strict Bearer Token Only</option>
              <option value="hmac_webhook" ${cfg.authMode === 'hmac_webhook' ? 'selected' : ''}>Webhook Secret / Signature Mode</option>
            </select>
          </div>
          <div class="kc-form-grid-2">
            <div class="form-group">
              <label class="form-label" for="kc-api-rate-limit">Rate Limit / Min</label>
              <input type="number" id="kc-api-rate-limit" class="form-input" min="1" max="300" value="${Number(cfg.rateLimitPerMinute) || 30}">
            </div>
            <div class="form-group">
              <label class="form-label" for="kc-api-max-mb">Max Payload (MB)</label>
              <input type="number" id="kc-api-max-mb" class="form-input" min="1" max="25" value="${Number(cfg.maxPayloadMb) || 15}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="kc-api-allowed-ips">Allowed IP Allowlist (Comma-separated, blank = any authenticated HTTPS)</label>
            <input type="text" id="kc-api-allowed-ips" class="form-input" value="${escapeHtml((cfg.allowedIps || []).join(', '))}" placeholder="e.g. 203.0.113.10, 127.0.0.1">
          </div>
          <div class="form-group">
            <label style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600;">
              <input type="checkbox" id="kc-api-webhook-mode" ${cfg.webhookModeEnabled !== false ? 'checked' : ''}> Allow Webhook Receiver Mode
            </label>
          </div>
          <div class="usm-actions-bar">
            <button type="submit" class="btn-cta-primary" id="kc-api-save-btn"><i class="fa-solid fa-floppy-disk"></i> <span>Save Receiver Config</span></button>
            <button type="button" class="btn-secondary-action usm-btn-reset" id="kc-api-reset-btn"><i class="fa-solid fa-rotate-left"></i> <span>Reset Defaults</span></button>
            <button type="button" class="btn-secondary-action usm-btn-refresh" id="kc-api-refresh-btn"><i class="fa-solid fa-arrows-rotate"></i> <span>Refresh</span></button>
          </div>
          </form>
        </div>

        <div class="kc-subpanel">
          <h3 class="kc-subpanel-title"><i class="fa-solid fa-shield-keyhole"></i> Credentials (Masked) &amp; Connection Test</h3>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 12.5px; display: grid; gap: 6px; margin-bottom: 12px;">
            <div><strong>Masked API Key:</strong> <code>${escapeHtml(cfg.apiKeyMasked || 'Not generated')}</code></div>
            <div><strong>Masked Bearer Token:</strong> <code>${escapeHtml(cfg.bearerTokenMasked || 'Not generated')}</code></div>
            <div><strong>Masked Webhook Secret:</strong> <code>${escapeHtml(cfg.webhookSecretMasked || 'Not generated')}</code></div>
            <div><strong>Last Successful Reception:</strong> ${formatDate(cfg.lastSuccessAt)}</div>
            <div><strong>Last Error Timestamp:</strong> ${formatDate(cfg.lastErrorAt)} ${cfg.lastErrorMessage ? `(${escapeHtml(cfg.lastErrorMessage)})` : ''}</div>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
            <button type="button" class="btn-cta-secondary" id="kc-api-rotate-btn"><i class="fa-solid fa-arrows-rotate"></i> Rotate API Secrets</button>
            <button type="button" class="btn-cta-secondary" id="kc-api-test-conn-btn"><i class="fa-solid fa-vial-circle-check"></i> Test Connection</button>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <strong style="font-size: 12.5px; color: #0b2545;">Test Authenticated Import / JSON Webhook Payload</strong>
            <div class="form-group" style="margin-top: 8px;">
              <input type="password" id="kc-api-test-key" class="form-input" placeholder="Paste X-API-Key or Bearer token for test...">
            </div>
            <div class="kc-form-grid-2">
              <input type="text" id="kc-api-test-title" class="form-input" placeholder="Record Title" value="Gram Sabha Water Guideline">
              <input type="text" id="kc-api-test-idem" class="form-input" placeholder="Idempotency Key (Optional)" value="idem-demo-001">
            </div>
            <textarea id="kc-api-test-content" class="form-input" rows="3" style="margin-top: 8px;" placeholder="External JSON content to import & index...">Gram Sabha approved quarterly Jal Jeevan Mission water pipeline maintenance on 1st and 15th of every month.</textarea>
            <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; align-items: center;">
              <button type="button" class="btn-cta-primary" id="kc-api-send-test-btn" style="padding: 7px 12px; font-size: 12.5px;"><i class="fa-solid fa-paper-plane"></i> Send Test Import</button>
              <span id="kc-api-test-status" style="font-size: 12px; font-weight: 700;"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="kc-subpanel" style="margin-top: 16px;" data-no-translate="true">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
          <h3 class="kc-subpanel-title" style="margin: 0;"><i class="fa-solid fa-receipt"></i> Receiver API Request &amp; Error Logs (${logs.length})</h3>
          ${logs.length > 0 ? `<button type="button" class="btn-clear-audit" id="kc-api-clear-logs-btn"><i class="fa-solid fa-trash-can"></i> Clear All Logs</button>` : ''}
        </div>
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead><tr><th>Timestamp</th><th>Method / IP</th><th>Status Code</th><th>Outcome</th><th>Idempotency / Doc</th><th>Message (Tokens Redacted)</th><th style="text-align: right;">Actions</th></tr></thead>
            <tbody>
              ${logs.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 18px; color: #64748b;">No Receiver API calls logged yet.</td></tr>' : logs.slice(0, 60).map((l) => `
                <tr>
                  <td style="font-size: 11.5px;">${formatDate(l.timestamp)}</td>
                  <td style="font-size: 12px;">${escapeHtml(l.method)} • ${escapeHtml(l.clientIp)}</td>
                  <td><span class="kc-status-pill ${l.statusCode >= 200 && l.statusCode < 300 ? 'kc-status-indexed' : 'kc-status-failed'}">${l.statusCode}</span></td>
                  <td style="font-size: 12px; font-weight: 700;">${escapeHtml(l.outcome)}</td>
                  <td style="font-size: 11.5px;">${escapeHtml(l.idempotencyKey || '—')} ${l.docId ? `<br><code>${escapeHtml(l.docId)}</code>` : ''}</td>
                  <td style="font-size: 12px; max-width: 280px;">${escapeHtml(l.message)}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    ${l.retryable && l.retryPayload ? `<button type="button" class="btn-table-action kc-api-retry-btn" data-api-log-id="${escapeHtml(l.apiLogId)}" title="Retry failed import"><i class="fa-solid fa-rotate-right"></i> Retry</button>` : ''}
                    <button type="button" class="btn-table-action kc-api-del-btn" data-api-log-id="${escapeHtml(l.apiLogId)}" title="Delete log entry" style="color: #dc2626;"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionLogs(ov) {
    const role = getAuthorizedRole();
    const isAdmin = role === 'admin';

    return `
      <div class="kc-subpanel" style="margin-bottom: 14px;" data-no-translate="true">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
          <div>
            <h3 class="kc-subpanel-title" style="margin: 0;"><i class="fa-solid fa-shield-halved"></i> Immutable Security &amp; Operations Audit Logs (${ov.auditLogs.length})</h3>
            ${!isAdmin ? '<p style="font-size: 11.5px; color: #0284c7; margin: 4px 0 0;"><i class="fa-solid fa-shield-halved"></i> Receiver Audit View: Logs are immutable. Log purge and deletion are restricted to System Administrators.</p>' : ''}
          </div>
          ${isAdmin && ov.auditLogs.length > 0 ? `<button type="button" class="btn-clear-audit" id="kc-audit-clear-logs-btn"><i class="fa-solid fa-trash-can"></i> Clear All Logs</button>` : ''}
        </div>
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead><tr><th>Timestamp</th><th>Action</th><th>Actor</th><th>Target</th><th>Details</th><th style="text-align: right;">Actions</th></tr></thead>
            <tbody>
              ${ov.auditLogs.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 18px; color: #64748b;">No audit events recorded yet.</td></tr>' : ov.auditLogs.slice(0, 80).map((a) => `
                <tr>
                  <td style="font-size: 11.5px;">${formatDate(a.timestamp)}</td>
                  <td><span class="kc-format-pill">${escapeHtml(a.action)}</span></td>
                  <td style="font-size: 12px;">${escapeHtml(a.actorName || a.actorEmail || a.actorId)} (${escapeHtml(a.actorRole)})</td>
                  <td style="font-family: monospace; font-size: 11.5px;">${escapeHtml(a.targetId || '—')}</td>
                  <td style="font-size: 12px; max-width: 340px;">${escapeHtml(a.details)}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    ${isAdmin ? `<button type="button" class="btn-table-action kc-audit-del-btn" data-audit-id="${escapeHtml(a.auditId || '')}" title="Delete audit log entry" style="color: #dc2626; border-color: #fecaca; background: #fef2f2;"><i class="fa-solid fa-trash"></i> Delete</button>` : '<span style="font-size: 11.5px; color: #64748b;"><i class="fa-solid fa-lock"></i> Protected</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionBackupRestore(ov) {
    return `
      <div class="kc-subpanel" style="margin-bottom: 14px;" data-no-translate="true">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 class="kc-subpanel-title" style="margin: 0;"><i class="fa-solid fa-box-archive"></i> Cryptographic Knowledge Backup &amp; Recovery</h3>
            <p style="font-size: 12.5px; color: #475569; margin: 4px 0 0;">Snapshots store original files, extracted text, chunks, embeddings, and SHA-256 verification digests.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn-cta-primary" id="kc-bkp-create-btn"><i class="fa-solid fa-plus"></i> Create Backup Snapshot</button>
            <label class="btn-cta-secondary" style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-file-import"></i> Restore External JSON
              <input type="file" id="kc-bkp-import-file" accept=".json" style="display: none;">
            </label>
          </div>
        </div>
      </div>

      <div class="kc-subpanel" data-no-translate="true">
        <h3 class="kc-subpanel-title">Stored Backups (${ov.backups.length})</h3>
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead><tr><th>Backup ID</th><th>Created</th><th>Created By</th><th>Counts</th><th>SHA-256 Digest</th><th>Size</th><th style="text-align: right;">Actions</th></tr></thead>
            <tbody>
              ${ov.backups.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #64748b;">No backups created yet.</td></tr>' : ov.backups.map((b) => `
                <tr>
                  <td><strong>${escapeHtml(b.backupId)}</strong></td>
                  <td style="font-size: 12px;">${formatDate(b.createdAt)}</td>
                  <td style="font-size: 12px;">${escapeHtml(b.createdBy || 'Admin')}</td>
                  <td style="font-size: 12px;">${b.counts?.documents || 0} docs • ${b.counts?.chunks || 0} chunks</td>
                  <td style="font-family: monospace; font-size: 11px;">${escapeHtml(String(b.sha256Checksum || '').slice(0, 18))}…</td>
                  <td>${formatBytes(b.sizeBytes)}</td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn-table-action kc-bkp-dl" data-bkp-id="${escapeHtml(b.backupId)}" title="Download Backup JSON"><i class="fa-solid fa-download"></i></button>
                    <button type="button" class="btn-table-action kc-bkp-restore" data-bkp-id="${escapeHtml(b.backupId)}" title="Restore Snapshot"><i class="fa-solid fa-clock-rotate-left"></i></button>
                    <button type="button" class="btn-table-action kc-bkp-del" data-bkp-id="${escapeHtml(b.backupId)}" style="color: #dc2626;" title="Delete Snapshot"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSectionAiTesting() {
    return `
      <div class="kc-subpanel" data-no-translate="true">
        <h3 class="kc-subpanel-title"><i class="fa-solid fa-flask-vial"></i> AI Knowledge RAG Retrieval Tester (EN / KN / HI &amp; Cross-Lingual)</h3>
        <p style="font-size: 12.5px; color: #475569; margin-bottom: 12px;">Test how the JANASEVA AI Chatbox ranks Official vs. Community chunks, resolves conflicts, detects language, and prevents fabrication.</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
          <input type="text" id="kc-rag-test-query" class="form-input" style="flex: 2 1 min(100%, 220px); min-width: min(100%, 200px);" placeholder="Enter question in English, ಕನ್ನಡ, or हिन्दी (e.g. 'ರೇಷನ್ ಕಾರ್ಡ್ ದಾಖಲೆಗಳು?' or 'ration card eligibility')">
          <select id="kc-rag-test-lang" class="form-select" style="width: min(100%, 190px); flex: 1 1 160px;">
            <option value="en-IN">Response: English</option>
            <option value="kn-IN">Response: ಕನ್ನಡ (Kannada)</option>
            <option value="hi-IN">Response: हिन्दी (Hindi)</option>
          </select>
          <button type="button" class="btn-cta-primary" id="kc-rag-test-run-btn"><i class="fa-solid fa-play"></i> Run RAG Test</button>
        </div>
        <div id="kc-rag-test-output" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; font-size: 13px; color: #334155;">
          Enter a query above to inspect vector/lexical scoring, reliability weighting, conflicts, and source citations.
        </div>
      </div>
    `;
  }

  async function renderKnowledgeAdmin(targetContainerId) {
    if (targetContainerId && typeof targetContainerId === 'string') {
      activeContainerId = targetContainerId;
    }
    let container = activeContainerId ? document.getElementById(activeContainerId) : null;
    if (!container) {
      container = document.getElementById('receiver-kc-container') || document.getElementById('admin-kc-container');
      if (container) activeContainerId = container.id;
    }
    if (!container) return;

    if (!assertAuthorizedAccess()) {
      container.innerHTML = '<div class="kc-subpanel" style="color: #b91c1c;"><i class="fa-solid fa-lock"></i> Access Denied: AI Knowledge Centre is restricted strictly to Authorized Receivers and Administrators.</div>';
      return;
    }

    container.innerHTML = '<div style="padding: 20px; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Loading AI Knowledge Centre data...</div>';

    try {
      const ov = await kc().getAdminOverview();
      cachedOverview = ov;

      let bodyHtml = '';
      if (activeSubTab === 'dashboard') bodyHtml = renderSectionDashboard(ov);
      else if (activeSubTab === 'all-docs') bodyHtml = renderSectionAllDocs(ov);
      else if (activeSubTab === 'upload-history') bodyHtml = renderSectionUploadHistory(ov);
      else if (activeSubTab === 'processing-queue') bodyHtml = renderSectionQueue(ov);
      else if (activeSubTab === 'knowledge-db') bodyHtml = renderSectionKnowledgeDb(ov);
      else if (activeSubTab === 'failed-docs') bodyHtml = renderSectionFailedDocs(ov);
      else if (activeSubTab === 'quarantined-files') bodyHtml = renderSectionQuarantined(ov);
      else if (activeSubTab === 'storage-mgmt') bodyHtml = renderSectionStorage(ov);
      else if (activeSubTab === 'api-settings') bodyHtml = renderSectionApiSettings(ov);
      else if (activeSubTab === 'system-logs') bodyHtml = renderSectionLogs(ov);
      else if (activeSubTab === 'backup-restore') bodyHtml = renderSectionBackupRestore(ov);
      else if (activeSubTab === 'ai-testing') bodyHtml = renderSectionAiTesting();

      container.innerHTML = renderSubNav(ov) + `<div class="kc-admin-body">${bodyHtml}</div>`;
      bindContainerHandlers(container, ov);
    } catch (err) {
      container.innerHTML = `<div class="kc-subpanel" style="color: #b91c1c;">Failed to load AI Knowledge Centre dashboard: ${escapeHtml(err.message)}</div>`;
    }
  }

  function exportKnowledgeCorpus(format) {
    if (!cachedOverview) return;
    const activeDocs = (cachedOverview.documents || []).filter((d) => d.status === 'INDEXED' && d.enabled !== false);
    if (format === 'csv') {
      const rows = [['docId', 'title', 'format', 'primaryLanguage', 'category', 'sourceReliability', 'chunkCount', 'contributor', 'updatedAt']];
      activeDocs.forEach((d) => {
        rows.push([
          d.docId,
          `"${String(d.title || '').replace(/"/g, '""')}"`,
          d.format,
          d.primaryLanguage,
          `"${String(d.category || '').replace(/"/g, '""')}"`,
          d.sourceReliability,
          d.chunkCount || 0,
          `"${String(d.contributorDisplayName || '').replace(/"/g, '""')}"`,
          d.updatedAt || d.uploadedAt
        ]);
      });
      const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
      triggerDownload(blob, `janaseva_knowledge_index_${Date.now()}.csv`);
    } else {
      const payload = {
        exportedAt: new Date().toISOString(),
        documents: activeDocs,
        chunks: cachedOverview.chunks || []
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      triggerDownload(blob, `janaseva_knowledge_corpus_${Date.now()}.json`);
    }
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openAdminInspectModal(details) {
    const existing = document.getElementById('kc-admin-inspect-modal');
    if (existing) existing.remove();
    const d = details.document;
    const modal = document.createElement('div');
    modal.id = 'kc-admin-inspect-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-window" style="max-width: 800px;" data-no-translate="true">
        <div class="modal-header">
          <div class="modal-title"><i class="fa-solid fa-file-shield"></i> Inspect: ${escapeHtml(d.title)} (${escapeHtml(d.docId)})</div>
          <button type="button" class="modal-close-btn" id="kc-adm-modal-close">&times;</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding: 18px;">
          <div style="font-size: 12.5px; color: #334155; margin-bottom: 10px;">
            <strong>Original File:</strong> ${escapeHtml(d.originalFilename)} (${formatBytes(d.sizeBytes)}) •
            <strong>Hash:</strong> <code>${escapeHtml(String(d.fileHash || '').slice(0, 20))}…</code> •
            <strong>Language:</strong> ${escapeHtml(d.primaryLanguage)} •
            <strong>Reliability:</strong> ${escapeHtml(d.sourceReliability)}
          </div>
          <pre style="white-space: pre-wrap; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 12.5px; max-height: 360px; overflow-y: auto;">${escapeHtml(details.extractedText || d.summary || 'No extracted text available.')}</pre>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#kc-adm-modal-close')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  
  function openQueueDeleteConfirmModal(jobsToDelete) {
    if (!jobsToDelete || jobsToDelete.length === 0) return;

    const existing = document.getElementById('kc-queue-delete-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'kc-queue-delete-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-window" style="max-width: 540px; border-top: 4px solid #dc2626;" data-no-translate="true">
        <div class="modal-header" style="background: #fff; border-bottom: 1px solid #e2e8f0; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #fef2f2; display: flex; align-items: center; justify-content: center; color: #dc2626; font-size: 18px;">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 16px; color: #0b2545; font-weight: 700;">Confirm Job Record Deletion</h3>
              <span style="font-size: 12px; color: #64748b;">Accidental data loss protection confirmation</span>
            </div>
          </div>
          <button type="button" class="modal-close-btn" style="background: transparent; border: none; font-size: 18px; color: #64748b; cursor: pointer;" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <p style="font-size: 13.5px; color: #334155; margin-bottom: 12px; line-height: 1.5;">
            Are you sure you want to permanently delete the following <strong>${jobsToDelete.length}</strong> selected job record(s) from the pipeline queue?
          </p>
          <div style="max-height: 180px; overflow-y: auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px;">
            ${jobsToDelete.map(j => `
              <div style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12.5px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <div>
                  <strong style="color: #0b2545;">${escapeHtml(j.filename)}</strong>
                  <div style="font-family: monospace; font-size: 11px; color: #64748b;">${escapeHtml(j.jobId)}</div>
                </div>
                <span class="kc-status-pill ${j.status === 'COMPLETED' ? 'kc-status-indexed' : (j.status === 'QUARANTINED' ? 'kc-status-quarantined' : (j.status === 'FAILED' ? 'kc-status-failed' : 'kc-status-processing'))}" style="font-size: 10.5px; padding: 2px 7px;">${escapeHtml(j.status || 'RECORD')}</span>
              </div>
            `).join('')}
          </div>
          <div style="padding: 10px 12px; background: #fff5f5; border-left: 3px solid #dc2626; border-radius: 4px; font-size: 12.5px; color: #991b1b; line-height: 1.4;">
            <i class="fa-solid fa-circle-exclamation"></i> <strong>Important:</strong> Deleting these records removes them from the processing queue and purges their execution logs from the database.
          </div>
        </div>
        <div class="modal-footer" style="padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn-cta-secondary kc-modal-cancel" style="padding: 7px 16px; font-size: 12.5px; cursor: pointer;">Cancel</button>
          <button type="button" class="btn-cta-primary kc-modal-confirm-delete" style="background: #dc2626; border-color: #dc2626; padding: 7px 18px; font-size: 12.5px; cursor: pointer;">
            <i class="fa-solid fa-trash-can"></i> Yes, Delete Record(s)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.modal-close-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.kc-modal-cancel')?.addEventListener('click', () => modal.remove());

    modal.querySelector('.kc-modal-confirm-delete')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

      try {
        const jobIds = jobsToDelete.map(j => j.jobId);
        await kc().deleteProcessingJobs(jobIds, 'Deleted via Pipeline Queue Dashboard');
        modal.remove();
        notify(`Successfully deleted ${jobIds.length} queue job record(s).`, 'success');
        await renderKnowledgeAdmin(activeContainerId);
      } catch (err) {
        console.error('[KnowledgeAdmin] Error deleting queue jobs:', err);
        notify('Error deleting jobs: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Yes, Delete Record(s)';
      }
    });
  }

  function bindContainerHandlers(container) {
    // Pipeline Queue Selection & Delete Handlers
    const checkAll = container.querySelector('#kc-queue-select-all');
    const rowChecks = container.querySelectorAll('.kc-queue-row-select');
    const deleteSelectedBtn = container.querySelector('#kc-queue-delete-selected-btn');
    const countSpan = container.querySelector('#kc-queue-selected-count');

    function updateQueueSelectionState() {
      const selected = Array.from(container.querySelectorAll('.kc-queue-row-select:checked'));
      if (countSpan) countSpan.innerText = selected.length;
      if (deleteSelectedBtn) {
        deleteSelectedBtn.disabled = selected.length === 0;
        deleteSelectedBtn.style.opacity = selected.length === 0 ? '0.5' : '1';
        deleteSelectedBtn.style.cursor = selected.length === 0 ? 'not-allowed' : 'pointer';
      }
      if (checkAll && rowChecks.length > 0) {
        checkAll.checked = selected.length === rowChecks.length;
        checkAll.indeterminate = selected.length > 0 && selected.length < rowChecks.length;
      }
    }

    if (checkAll) {
      checkAll.addEventListener('change', () => {
        rowChecks.forEach(cb => { cb.checked = checkAll.checked; });
        updateQueueSelectionState();
      });
    }

    rowChecks.forEach(cb => {
      cb.addEventListener('change', updateQueueSelectionState);
    });

    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', () => {
        const selectedBoxes = Array.from(container.querySelectorAll('.kc-queue-row-select:checked'));
        if (selectedBoxes.length === 0) return;
        const jobsToDelete = selectedBoxes.map(cb => ({
          jobId: cb.dataset.jobId,
          filename: cb.dataset.filename,
          status: cb.dataset.status
        }));
        openQueueDeleteConfirmModal(jobsToDelete);
      });
    }

    container.querySelectorAll('.kc-queue-row-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const job = {
          jobId: btn.dataset.jobId,
          filename: btn.dataset.filename,
          status: btn.dataset.status || 'RECORD'
        };
        openQueueDeleteConfirmModal([job]);
      });
    });

    container.querySelector('#kc-queue-clear-failed-btn')?.addEventListener('click', () => {
      const failedJobs = (cachedOverview?.jobs || []).filter(j => j.status === 'FAILED');
      if (failedJobs.length === 0) {
        notify('No failed jobs to clear.', 'info');
        return;
      }
      openQueueDeleteConfirmModal(failedJobs.map(j => ({
        jobId: j.jobId,
        filename: j.filename,
        status: j.status
      })));
    });

    container.querySelector('#kc-queue-refresh-btn')?.addEventListener('click', () => {
      renderKnowledgeAdmin(activeContainerId);
    });

    // Sub-tab switch
    container.querySelectorAll('[data-kc-subtab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSubTab = btn.dataset.kcSubtab;
        renderKnowledgeAdmin(activeContainerId);
      });
    });

    // Dashboard & All-Docs Admin Upload
    const handleAdminUpload = async (inputId, isOfficial) => {
      const input = container.querySelector(`#${inputId}`);
      const file = input?.files?.[0];
      if (!file) { notify('Select a document file first.', 'warning'); return; }
      const res = await kc().ingestDocument({
        file,
        contributorName: window.authService?.getCurrentUser?.()?.name || 'Administrator',
        sourceReliability: isOfficial ? 'official' : 'community',
        sourceChannel: 'ADMIN_DASHBOARD'
      });
      notify(res.message || 'Processed document.', res.success ? 'success' : 'error');
      await renderKnowledgeAdmin();
    };
    container.querySelector('#kc-admin-quick-upload-btn')?.addEventListener('click', () => handleAdminUpload('kc-admin-quick-file', true));
    container.querySelector('#kc-admin-all-upload-btn')?.addEventListener('click', () => {
      const isOff = container.querySelector('#kc-admin-upload-official')?.checked !== false;
      handleAdminUpload('kc-admin-all-file', isOff);
    });

    // Search & filter in All Documents
    container.querySelector('#kc-admin-doc-search')?.addEventListener('input', (e) => {
      adminDocSearch = e.target.value;
      renderKnowledgeAdmin();
    });
    container.querySelector('#kc-admin-doc-filter')?.addEventListener('change', (e) => {
      adminDocFilter = e.target.value;
      renderKnowledgeAdmin();
    });

    // Export JSON / CSV
    container.querySelector('#kc-adm-export-json')?.addEventListener('click', () => exportKnowledgeCorpus('json'));
    container.querySelector('#kc-adm-export-csv')?.addEventListener('click', () => exportKnowledgeCorpus('csv'));

    // Row actions
    container.querySelectorAll('.kc-adm-inspect').forEach((b) => b.addEventListener('click', async () => {
      const det = await kc().getDocumentDetailsForView(b.dataset.docId, true);
      if (det) openAdminInspectModal(det);
    }));
    container.querySelectorAll('.kc-adm-dl').forEach((b) => b.addEventListener('click', async () => {
      try { await kc().downloadDocument(b.dataset.docId, { adminOverride: true }); } catch (e) { notify(e.message, 'error'); }
    }));
    container.querySelectorAll('.kc-adm-toggle').forEach((b) => b.addEventListener('click', async () => {
      const enable = b.dataset.enabled === 'true';
      await kc().setDocumentEnabled(b.dataset.docId, enable);
      notify(`Document ${enable ? 'enabled' : 'disabled'}.`, 'success');
      await renderKnowledgeAdmin();
    }));
    container.querySelectorAll('.kc-adm-reprocess').forEach((b) => b.addEventListener('click', async () => {
      try {
        const res = await kc().reprocessDocument(b.dataset.docId);
        notify(res.message || 'Reprocessed.', res.success ? 'success' : 'error');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    }));
    container.querySelectorAll('.kc-adm-reprocess-failed').forEach((b) => b.addEventListener('click', async () => {
      const docId = b.dataset.docId;
      const hint = container.querySelector(`.kc-failed-ocr-input[data-doc-id="${docId}"]`)?.value || '';
      try {
        const res = await kc().reprocessDocument(docId, { ocrTextHint: hint });
        notify(res.message || 'Reprocessed.', res.success ? 'success' : 'error');
        await renderKnowledgeAdmin(activeContainerId);
      } catch (e) { notify(e.message, 'error'); }
    }));
    container.querySelectorAll('.kc-adm-run-hybrid-ocr').forEach((b) => b.addEventListener('click', async () => {
      const docId = b.dataset.docId;
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.jpg,.jpeg,.png,.webp,.pdf';
      fileInput.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        notify('Running Hybrid OCR on document scan...', 'info');
        try {
          let extractedText = '';
          if (window.janasevaHybridOcrEngine) {
            const res = await window.janasevaHybridOcrEngine.processDocument(file, {
              preferredLanguage: 'auto',
              onProgress: (p) => {
                if (p && p.status) notify(`OCR: ${p.status} (${Math.round((p.progress || 0) * 100)}%)`, 'info');
              }
            });
            extractedText = res.extractedText || res.text || '';
          }
          if (!extractedText) {
            notify('OCR completed but no text could be extracted. You may enter text manually in the box.', 'warning');
            return;
          }
          const hintInput = container.querySelector(`.kc-failed-ocr-input[data-doc-id="${docId}"]`);
          if (hintInput) hintInput.value = extractedText.slice(0, 500);
          notify(`Hybrid OCR extracted ${extractedText.length} characters. Reprocessing document...`, 'success');
          const res = await kc().reprocessDocument(docId, { ocrTextHint: extractedText });
          notify(res.message || 'Reprocessed with OCR text.', res.success ? 'success' : 'error');
          await renderKnowledgeAdmin(activeContainerId);
        } catch (err) {
          notify(`OCR failed: ${err.message}`, 'error');
        }
      };
      fileInput.click();
    }));
    container.querySelectorAll('.kc-adm-release').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm('WARNING: This file triggered security quarantine. Reprocess ONLY if you have verified the source is safe?')) return;
      try {
        const res = await kc().reprocessDocument(b.dataset.docId, { overrideQuarantine: true });
        notify(res.message || 'Released & reprocessed.', res.success ? 'success' : 'error');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    }));
    container.querySelectorAll('.kc-adm-delete').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm(`Permanently delete "${b.dataset.title}" and remove all associated chunks and embeddings?`)) return;
      try {
        await kc().deleteDocument(b.dataset.docId, 'Deleted via Admin Dashboard');
        notify('Document, chunks, and embeddings purged.', 'success');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    }));

    // Storage cleanup
    container.querySelectorAll('.kc-adm-cleanup').forEach((b) => b.addEventListener('click', async () => {
      const folder = b.dataset.folder;
      if (!window.confirm(`Bulk purge all files in AI_KNOWLEDGE_CENTRE/${folder}?`)) return;
      await kc().cleanupStorageFolder(folder);
      notify(`Cleaned AI_KNOWLEDGE_CENTRE/${folder}.`, 'success');
      await renderKnowledgeAdmin();
    }));

    // Receiver API Controls (USM Protected)
    const apiConfigCard = container.querySelector('#kc-api-config-card');
    if (apiConfigCard && window.JanasevaSettings) {
      window.JanasevaSettings.registerSection({
        sectionId: 'admin-knowledge-api',
        sectionName: 'Receiver API Settings',
        containerEl: apiConfigCard,
        formEl: '#kc-api-config-form',
        statusHostEl: '#kc-api-usm-status',
        saveBtn: '#kc-api-save-btn',
        resetBtn: '#kc-api-reset-btn',
        refreshBtn: '#kc-api-refresh-btn',
        confirmResetTitle: 'Reset Receiver API Settings to Safe Defaults?',
        confirmResetMessage: 'This disables the external Receiver API endpoint, restores Rate Limit to 30/min, Max Payload to 15 MB, Auth Mode to API Key or Bearer, and clears the IP allowlist.',
        confirmResetDetail: 'Scope: Only Receiver API endpoint configuration is reset. API secret hashes, documents, chunks, backups, and security audit logs remain untouched.',
        onSave: async () => {
          const updated = await kc().updateApiReceiverConfig({
            enabled: container.querySelector('#kc-api-enabled').checked,
            endpointUrl: container.querySelector('#kc-api-endpoint').value,
            authMode: container.querySelector('#kc-api-auth-mode').value,
            rateLimitPerMinute: Number(container.querySelector('#kc-api-rate-limit').value),
            maxPayloadMb: Number(container.querySelector('#kc-api-max-mb').value),
            allowedIpsText: container.querySelector('#kc-api-allowed-ips').value,
            webhookModeEnabled: container.querySelector('#kc-api-webhook-mode').checked
          });
          setTimeout(() => renderKnowledgeAdmin(), 250);
          return {
            savedAt: updated?.updatedAt || new Date().toISOString(),
            updatedBy: updated?.updatedBy || '',
            message: 'Receiver API settings saved securely.'
          };
        },
        onReset: async () => {
          const resetCfg = await kc().resetApiReceiverConfigDefaults();
          setTimeout(() => renderKnowledgeAdmin(), 250);
          return {
            savedAt: resetCfg?.updatedAt || new Date().toISOString(),
            updatedBy: resetCfg?.updatedBy || '',
            message: 'Receiver API settings restored to safe defaults.'
          };
        },
        onRefresh: async () => {
          const fresh = await kc().getApiReceiverConfig();
          const elEnabled = container.querySelector('#kc-api-enabled');
          const elEndpoint = container.querySelector('#kc-api-endpoint');
          const elAuthMode = container.querySelector('#kc-api-auth-mode');
          const elRpm = container.querySelector('#kc-api-rate-limit');
          const elMaxMb = container.querySelector('#kc-api-max-mb');
          const elIps = container.querySelector('#kc-api-allowed-ips');
          const elWebhook = container.querySelector('#kc-api-webhook-mode');
          if (elEnabled) elEnabled.checked = Boolean(fresh.enabled);
          if (elEndpoint) elEndpoint.value = fresh.endpointUrl || '';
          if (elAuthMode) elAuthMode.value = fresh.authMode || 'api_key_or_bearer';
          if (elRpm) elRpm.value = Number(fresh.rateLimitPerMinute) || 30;
          if (elMaxMb) elMaxMb.value = Number(fresh.maxPayloadMb) || 15;
          if (elIps) elIps.value = (fresh.allowedIps || []).join(', ');
          if (elWebhook) elWebhook.checked = fresh.webhookModeEnabled !== false;
          setTimeout(() => renderKnowledgeAdmin(), 200);
          return {
            savedAt: fresh.updatedAt,
            refreshedAt: new Date().toISOString(),
            message: 'Receiver API configuration reloaded from storage.'
          };
        }
      });
    } else {
      container.querySelector('#kc-api-save-btn')?.addEventListener('click', async () => {
        try {
          await kc().updateApiReceiverConfig({
            enabled: container.querySelector('#kc-api-enabled').checked,
            endpointUrl: container.querySelector('#kc-api-endpoint').value,
            authMode: container.querySelector('#kc-api-auth-mode').value,
            rateLimitPerMinute: Number(container.querySelector('#kc-api-rate-limit').value),
            maxPayloadMb: Number(container.querySelector('#kc-api-max-mb').value),
            allowedIpsText: container.querySelector('#kc-api-allowed-ips').value,
            webhookModeEnabled: container.querySelector('#kc-api-webhook-mode').checked
          });
          notify('Receiver API settings saved securely.', 'success');
          await renderKnowledgeAdmin();
        } catch (e) { notify(e.message, 'error'); }
      });
    }
    container.querySelector('#kc-api-rotate-btn')?.addEventListener('click', async () => {
      if (!window.confirm('Rotate API Key, Bearer Token, and Webhook Secret? Existing external integrations must be updated with the new credentials.')) return;
      try {
        const res = await kc().rotateApiSecrets();
        oneTimeRotatedSecrets = res;
        notify('New API credentials generated (shown once above).', 'success');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    });
    container.querySelector('#kc-api-dismiss-secrets')?.addEventListener('click', () => {
      oneTimeRotatedSecrets = null;
      renderKnowledgeAdmin();
    });
    container.querySelector('#kc-api-test-conn-btn')?.addEventListener('click', async () => {
      const tokenVal = (container.querySelector('#kc-api-test-key')?.value || '').trim();
      const res = await kc().testApiConnection({
        apiKey: tokenVal.startsWith('jnsk_') ? tokenVal : '',
        bearerToken: tokenVal.startsWith('jnsb_') ? tokenVal : '',
        webhookSecret: tokenVal.startsWith('jnsw_') ? tokenVal : ''
      });
      const stEl = container.querySelector('#kc-api-test-status');
      if (stEl) {
        stEl.textContent = res.message;
        stEl.style.color = res.ok ? '#15803d' : '#b91c1c';
      }
      notify(res.message, res.ok ? 'success' : 'error');
    });
    container.querySelector('#kc-api-send-test-btn')?.addEventListener('click', async () => {
      const tokenVal = (container.querySelector('#kc-api-test-key')?.value || '').trim();
      const title = container.querySelector('#kc-api-test-title')?.value || 'API Knowledge Test';
      const idem = container.querySelector('#kc-api-test-idem')?.value || '';
      const content = container.querySelector('#kc-api-test-content')?.value || '';
      const headers = { 'content-type': 'application/json' };
      if (tokenVal.startsWith('jnsb_')) headers.authorization = `Bearer ${tokenVal}`;
      else if (tokenVal.startsWith('jnsw_')) headers['x-webhook-secret'] = tokenVal;
      else if (tokenVal) headers['x-api-key'] = tokenVal;
      if (idem) headers['x-idempotency-key'] = idem;

      const res = await kc().processReceiverApiRequest({
        method: 'POST',
        headers,
        body: { title, content, idempotencyKey: idem, sourceSystem: 'Admin Receiver Test' }
      });
      const stEl = container.querySelector('#kc-api-test-status');
      if (stEl) {
        stEl.textContent = `HTTP ${res.statusCode}: ${res.message || res.error}`;
        stEl.style.color = res.ok ? '#15803d' : '#b91c1c';
      }
      notify(res.message || res.error, res.ok ? 'success' : 'error');
      await renderKnowledgeAdmin();
    });
    container.querySelectorAll('.kc-api-retry-btn').forEach((b) => b.addEventListener('click', async () => {
      try {
        const res = await kc().retryFailedApiRequest(b.dataset.apiLogId);
        notify(res.message || 'Retry complete.', res.success ? 'success' : 'error');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    }));
    container.querySelectorAll('.kc-api-del-btn').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm('Delete this Receiver API log entry?')) return;
      try {
        await kc().deleteApiLogEntry(b.dataset.apiLogId);
        notify('Receiver API log entry deleted.', 'info');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    }));
    container.querySelector('#kc-api-clear-logs-btn')?.addEventListener('click', async () => {
      if (!window.confirm('Clear all Receiver API request and error logs? Security audit trail will remain intact.')) return;
      try {
        await kc().clearApiLogs();
        notify('Receiver API logs cleared.', 'info');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    });

    // Audit Log Delete & Clear Controls (Section 10)
    container.querySelectorAll('.kc-audit-del-btn').forEach((b) => b.addEventListener('click', async () => {
      const id = b.dataset.auditId;
      const confirmed = window.JanasevaSettings
        ? await window.JanasevaSettings.confirm({
            title: 'Delete Security Audit Log Entry?',
            message: `Permanently delete audit log entry ${id}?`,
            detail: 'Scope: Only this selected audit row will be deleted. Indexed documents, backups, and settings will not be modified.',
            confirmText: 'Delete Entry',
            cancelText: 'Cancel',
            danger: true
          })
        : window.confirm('Delete this Security & Operations audit log entry?');
      if (!confirmed) return;
      try {
        await kc().deleteAuditLogEntry(id);
        notify('Audit log entry deleted.', 'info');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    }));
    container.querySelector('#kc-audit-clear-logs-btn')?.addEventListener('click', async () => {
      const confirmed = window.JanasevaSettings
        ? await window.JanasevaSettings.confirm({
            title: 'Clear All Security & Operations Audit Logs?',
            message: 'Permanently delete all recorded entries in the Knowledge Centre Security & Operations Audit Logs?',
            detail: 'Scope: Only audit log entries will be deleted. Knowledge documents, chunks, API keys, backups, and complaints remain intact.',
            confirmText: 'Continue to Final Check',
            cancelText: 'Cancel',
            danger: true,
            requireSecondConfirm: true,
            secondConfirmTitle: 'Final Confirmation — Clear All Audit Logs',
            secondConfirmMessage: 'All Knowledge Centre audit log entries will be permanently erased and cannot be recovered.',
            secondConfirmText: 'Clear All Logs Permanently'
          })
        : window.confirm('Clear ALL Security & Operations Audit Logs?');
      if (!confirmed) return;
      try {
        await kc().clearAuditLogs();
        notify('Security & Operations Audit Logs cleared.', 'info');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    });

    // Backup & Restore Controls
    container.querySelector('#kc-bkp-create-btn')?.addEventListener('click', async () => {
      const bkp = await kc().createBackupSnapshot();
      notify(`Created verified backup ${bkp.backupId}.`, 'success');
      await renderKnowledgeAdmin();
    });
    container.querySelectorAll('.kc-bkp-dl').forEach((b) => b.addEventListener('click', async () => {
      try { await kc().downloadBackupJson(b.dataset.bkpId); } catch (e) { notify(e.message, 'error'); }
    }));
    container.querySelectorAll('.kc-bkp-restore').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm(`Restore Knowledge Centre to snapshot ${b.dataset.bkpId}? Current index records will be replaced by the verified backup.`)) return;
      try {
        const res = await kc().restoreBackupSnapshot(b.dataset.bkpId);
        notify(`Restored ${res.restoredDocuments} documents and ${res.restoredChunks} chunks.`, 'success');
        await renderKnowledgeAdmin();
      } catch (e) { notify(e.message, 'error'); }
    }));
    container.querySelectorAll('.kc-bkp-del').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm(`Delete backup snapshot ${b.dataset.bkpId}?`)) return;
      await kc().deleteBackupSnapshot(b.dataset.bkpId);
      notify(`Deleted backup ${b.dataset.bkpId}.`, 'info');
      await renderKnowledgeAdmin();
    }));
    container.querySelector('#kc-bkp-import-file')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        if (!window.confirm(`Restore ${payload.documents?.length || 0} documents from "${file.name}"?`)) return;
        const res = await kc().restoreBackupSnapshot(payload);
        notify(`Restored ${res.restoredDocuments} documents.`, 'success');
        await renderKnowledgeAdmin();
      } catch (err) {
        notify(`Backup restore failed: ${err.message}`, 'error');
      }
    });

    // AI RAG Testing
    container.querySelector('#kc-rag-test-run-btn')?.addEventListener('click', async () => {
      const query = (container.querySelector('#kc-rag-test-query')?.value || '').trim();
      const responseLang = container.querySelector('#kc-rag-test-lang')?.value || 'en-IN';
      const outEl = container.querySelector('#kc-rag-test-output');
      if (!query) { notify('Enter a test question first.', 'warning'); return; }

      outEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running multilingual RAG retrieval...';
      const res = await kc().queryKnowledgeRAG({ query, responseLang, limit: 5 });
      const hits = res.retrieval?.results || [];
      outEl.innerHTML = `
        <div style="margin-bottom: 10px;">
          <strong>Detected Query Language:</strong> <span class="kc-format-pill">${escapeHtml(String(res.queryLanguage || '').toUpperCase())}</span>
          • <strong>Matches Found:</strong> ${hits.length}
          ${res.hasConflict ? ' • <span class="kc-status-pill kc-status-duplicate">CONFLICT DETECTED</span>' : ''}
        </div>
        ${res.conflictNotice ? `<div style="background:#fef3c7; border-left: 3px solid #d97706; padding: 8px 10px; margin-bottom: 10px; font-size: 12.5px;">${escapeHtml(res.conflictNotice)}</div>` : ''}
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
          <strong style="display:block; margin-bottom:4px; color:#0b2545;">Generated Grounded Response:</strong>
          <div style="white-space: pre-wrap;">${escapeHtml(res.reply)}</div>
        </div>
        <strong>Retrieved Chunks Ranked by Score (Vector + BM25 + Cross-Lingual Concepts + Reliability Weight):</strong>
        <div style="margin-top: 6px; display: grid; gap: 6px;">
          ${hits.length === 0 ? '<div style="color:#64748b;">No relevant chunks above confidence threshold.</div>' : hits.map((h, i) => `
            <div style="background:#fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; font-size: 12px;">
              <strong>#${i + 1} ${escapeHtml(h.docTitle)}</strong> (${trustBadgeHtml(h.sourceReliability)}) • Score: <code>${h.score.toFixed(3)}</code> • Lang: ${escapeHtml(h.language)}
              <div style="color:#475569; margin-top: 4px;">${escapeHtml(h.text.slice(0, 220))}…</div>
            </div>
          `).join('')}
        </div>
      `;
    });
  }

  window.loadAdminKnowledgeCentre = renderKnowledgeAdmin;
  window.JanasevaKnowledgeAdmin = {
    refresh: (targetId) => renderKnowledgeAdmin(targetId || activeContainerId),
    setSubTab: (tabId, targetId) => {
      activeSubTab = tabId;
      return renderKnowledgeAdmin(targetId || activeContainerId);
    },
    getRole: getAuthorizedRole
  };
})(window, document);
