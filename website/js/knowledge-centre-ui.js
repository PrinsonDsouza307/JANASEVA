/**
 * JANASEVA – Public AI Knowledge Centre UI Controller
 * Handles drag-and-drop, multi-file & folder uploads, live Stages A-N queue,
 * cancellation, retry, search, filtering, document viewer modal, and upload history.
 */
(function (window, document) {
  'use strict';

  const kc = () => window.JanasevaKnowledgeCentre;
  const queueItems = [];
  let queueSeq = 0;
  let currentModalDocId = null;

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

  function formatTime(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return String(iso).slice(0, 16);
    }
  }

  function notify(msg, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      console[type === 'error' ? 'error' : 'log']('[KnowledgeCentre]', msg);
    }
  }

  function renderTrustBadge(reliability) {
    if (reliability === 'official') {
      return '<span class="kc-trust-badge kc-trust-official" title="Uploaded by Administrator or marked Official"><i class="fa-solid fa-shield-check"></i> Official Source</span>';
    }
    if (reliability === 'verified_partner') {
      return '<span class="kc-trust-badge kc-trust-api" title="Imported via authenticated Receiver API"><i class="fa-solid fa-plug-circle-check"></i> Verified API</span>';
    }
    return '<span class="kc-trust-badge kc-trust-community" title="Public community contribution (reference only)"><i class="fa-solid fa-users"></i> Community</span>';
  }

  function renderLangBadge(lang) {
    const map = {
      en: '<span class="kc-lang-badge kc-lang-en">English (EN)</span>',
      kn: '<span class="kc-lang-badge kc-lang-kn">ಕನ್ನಡ (KN)</span>',
      hi: '<span class="kc-lang-badge kc-lang-hi">हिन्दी (HI)</span>'
    };
    return map[lang] || `<span class="kc-lang-badge">${escapeHtml(String(lang || 'N/A').toUpperCase())}</span>`;
  }

  function renderStatusBadge(doc) {
    if (doc.quarantined || doc.status === 'QUARANTINED') {
      return '<span class="kc-status-pill kc-status-quarantined"><i class="fa-solid fa-biohazard"></i> Quarantined</span>';
    }
    if (doc.status === 'FAILED') {
      return '<span class="kc-status-pill kc-status-failed"><i class="fa-solid fa-circle-xmark"></i> Failed</span>';
    }
    if (doc.enabled === false) {
      return '<span class="kc-status-pill kc-status-disabled"><i class="fa-solid fa-ban"></i> Disabled</span>';
    }
    if (doc.status === 'SUPERSEDED') {
      return '<span class="kc-status-pill kc-status-disabled"><i class="fa-solid fa-clock-rotate-left"></i> Superseded</span>';
    }
    return '<span class="kc-status-pill kc-status-indexed"><i class="fa-solid fa-circle-check"></i> Indexed</span>';
  }

  function renderQueue() {
    const wrap = document.getElementById('kc-upload-queue-wrap');
    const list = document.getElementById('kc-upload-queue-list');
    if (!wrap || !list) return;

    if (queueItems.length === 0) {
      wrap.style.display = 'none';
      list.innerHTML = '';
      return;
    }
    wrap.style.display = 'block';

    list.innerHTML = queueItems.map((item) => {
      const canCancel = item.status === 'QUEUED' || item.status === 'PROCESSING';
      const canRetry = item.status === 'FAILED' || item.status === 'CANCELLED';
      let pillClass = 'kc-status-processing';
      if (item.status === 'INDEXED' || item.status === 'ARCHIVE_DONE') pillClass = 'kc-status-indexed';
      else if (item.status === 'QUARANTINED') pillClass = 'kc-status-quarantined';
      else if (item.status === 'FAILED' || item.status === 'CANCELLED') pillClass = 'kc-status-failed';
      else if (item.status === 'DUPLICATE') pillClass = 'kc-status-duplicate';

      return `
        <div class="kc-queue-item" data-queue-id="${escapeHtml(item.id)}" data-no-translate="true">
          <div class="kc-queue-top">
            <div class="kc-queue-file">
              <i class="fa-solid fa-file-arrow-up"></i>
              <strong>${escapeHtml(item.displayPath || item.filename)}</strong>
              <span class="kc-queue-size">(${formatBytes(item.sizeBytes)})</span>
            </div>
            <div class="kc-queue-actions">
              <span class="kc-status-pill ${pillClass}">${escapeHtml(item.statusLabel)}</span>
              ${canCancel ? `<button type="button" class="btn-table-action kc-q-cancel" data-id="${escapeHtml(item.id)}" title="Cancel upload"><i class="fa-solid fa-xmark"></i> Cancel</button>` : ''}
              ${canRetry ? `<button type="button" class="btn-table-action kc-q-retry" data-id="${escapeHtml(item.id)}" title="Retry upload"><i class="fa-solid fa-rotate-right"></i> Retry</button>` : ''}
            </div>
          </div>
          <div class="kc-progress-track">
            <div class="kc-progress-fill ${pillClass}" style="width: ${Math.min(100, Math.max(0, item.percent))}%"></div>
          </div>
          <div class="kc-queue-msg">${escapeHtml(item.message || item.stageName || '')}</div>
        </div>
      `;
    }).join('');
  }

  async function processQueueItem(item) {
    const manager = kc();
    if (!manager) return;

    item.status = 'PROCESSING';
    item.statusLabel = 'Scanning...';
    item.percent = 5;
    item.cancelToken = { aborted: false };
    renderQueue();

    const contributorName = (document.getElementById('kc-contributor-name')?.value || '').trim();
    const categoryHint = document.getElementById('kc-category-hint')?.value || '';
    const replaceDocId = document.getElementById('kc-replace-doc-select')?.value || '';

    try {
      const result = await manager.ingestDocument({
        file: item.file,
        filename: item.filename,
        mimeType: item.file.type || '',
        contributorName: contributorName || undefined,
        categoryHint,
        replaceDocId: replaceDocId || undefined,
        sourceChannel: 'PUBLIC_UPLOAD',
        cancelToken: item.cancelToken,
        onProgress: ({ stageName, percent }) => {
          item.stageName = stageName;
          item.percent = percent;
          renderQueue();
        }
      });

      if (result.duplicate) {
        item.status = 'DUPLICATE';
        item.statusLabel = 'Duplicate Skipped';
        item.percent = 100;
        item.message = result.message;
        notify(result.message, 'warning');
      } else if (result.quarantined) {
        item.status = 'QUARANTINED';
        item.statusLabel = 'Quarantined';
        item.percent = 100;
        item.message = result.reason || result.message;
        notify(result.message, 'error');
      } else if (result.isArchive) {
        item.status = result.success ? 'ARCHIVE_DONE' : 'FAILED';
        item.statusLabel = result.success ? `Archive Indexed (${result.processedCount})` : 'Archive Empty/Blocked';
        item.percent = 100;
        item.message = result.message;
        notify(result.message, result.success ? 'success' : 'warning');
      } else if (result.success) {
        item.status = 'INDEXED';
        item.statusLabel = `Indexed (${result.chunksCount} chunks)`;
        item.percent = 100;
        item.message = result.message;
        notify(`"${item.filename}" is now searchable in AI Chat.`, 'success');
      } else {
        item.status = 'FAILED';
        item.statusLabel = 'Failed';
        item.percent = 100;
        item.message = result.reason || result.message || 'Processing failed.';
        notify(item.message, 'error');
      }
    } catch (err) {
      if (err && err.code === 'CANCELLED') {
        item.status = 'CANCELLED';
        item.statusLabel = 'Cancelled';
        item.message = 'Upload cancelled by user.';
        notify(`Cancelled "${item.filename}".`, 'info');
      } else {
        item.status = 'FAILED';
        item.statusLabel = 'Error';
        item.message = err.message || 'Upload failed.';
        notify(item.message, 'error');
      }
    }

    renderQueue();
    await refreshAllPublicViews();
  }

  function enqueueFiles(fileEntries) {
    if (!fileEntries || fileEntries.length === 0) return;

    const newItems = [];
    for (const entry of fileEntries) {
      const file = entry.file || entry;
      if (!file || typeof file.name !== 'string') continue;
      const displayPath = entry.relativePath || file.webkitRelativePath || file.name;
      const item = {
        id: `q-${++queueSeq}-${Date.now()}`,
        file,
        filename: file.name,
        displayPath,
        sizeBytes: file.size || 0,
        status: 'QUEUED',
        statusLabel: 'Queued',
        percent: 0,
        stageName: 'Waiting in upload pipeline...',
        message: 'Waiting to start security scan and extraction...',
        cancelToken: { aborted: false }
      };
      queueItems.unshift(item);
      newItems.push(item);
    }

    renderQueue();
    (async () => {
      for (const item of newItems) {
        if (!item.cancelToken.aborted) {
          await processQueueItem(item);
        }
      }
    })();
  }

  // Recursive directory reader for drag-and-drop folders
  async function extractDroppedEntries(dataTransfer) {
    const collected = [];
    const items = dataTransfer.items;

    if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
      const readEntry = async (entry, prefix = '') => {
        if (!entry) return;
        if (entry.isFile) {
          const file = await new Promise((res, rej) => entry.file(res, rej));
          collected.push({ file, relativePath: `${prefix}${entry.name}` });
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          const entries = await new Promise((res) => {
            const all = [];
            const next = () => {
              reader.readEntries((batch) => {
                if (!batch || batch.length === 0) res(all);
                else {
                  all.push(...batch);
                  next();
                }
              }, () => res(all));
            };
            next();
          });
          for (const child of entries) {
            await readEntry(child, `${prefix}${entry.name}/`);
          }
        }
      };

      const roots = [];
      for (let i = 0; i < items.length; i++) {
        const ent = items[i].webkitGetAsEntry();
        if (ent) roots.push(ent);
      }
      for (const root of roots) {
        await readEntry(root);
      }
      if (collected.length > 0) return collected;
    }

    if (dataTransfer.files && dataTransfer.files.length > 0) {
      return Array.from(dataTransfer.files).map((file) => ({ file, relativePath: file.name }));
    }
    return [];
  }

  async function refreshPublicStatsAndReplaceSelect() {
    const manager = kc();
    if (!manager) return;

    const stats = await manager.getPublicStats();
    const docsEl = document.getElementById('kc-pub-stat-docs');
    const chunksEl = document.getElementById('kc-pub-stat-chunks');
    const contribEl = document.getElementById('kc-pub-stat-contributors');
    const langsEl = document.getElementById('kc-pub-stat-langs');
    if (docsEl) docsEl.textContent = stats.totalActiveDocuments;
    if (chunksEl) chunksEl.textContent = stats.totalActiveChunks;
    if (contribEl) contribEl.textContent = stats.totalContributors;
    if (langsEl) langsEl.textContent = stats.languagesCount > 0 ? `${stats.languagesCount} Active` : 'EN • KN • HI';

    // Populate "Update Existing Document" dropdown
    const select = document.getElementById('kc-replace-doc-select');
    if (select) {
      const currentVal = select.value;
      const docs = await manager.searchPublicDocuments({});
      select.innerHTML = '<option value="">Upload as New Document</option>' +
        docs.map((d) => `<option value="${escapeHtml(d.docId)}">${escapeHtml(d.title)} (${escapeHtml(d.docId)}, v${d.version || 1})</option>`).join('');
      if (currentVal && docs.some((d) => d.docId === currentVal)) {
        select.value = currentVal;
      }
    }
  }

  async function refreshPublicSearchTable() {
    const manager = kc();
    const tbody = document.getElementById('kc-docs-table-body');
    const countEl = document.getElementById('kc-search-result-count');
    if (!manager || !tbody) return;

    const query = document.getElementById('kc-search-input')?.value || '';
    const language = document.getElementById('kc-filter-lang')?.value || 'all';
    const category = document.getElementById('kc-filter-cat')?.value || 'all';
    const sourceType = document.getElementById('kc-filter-source')?.value || 'all';

    const docs = await manager.searchPublicDocuments({ query, language, category, sourceType });
    if (countEl) countEl.textContent = `${docs.length} Document${docs.length === 1 ? '' : 's'}`;

    if (docs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 28px; color: #64748b;">
            <i class="fa-solid fa-folder-open" style="font-size: 24px; margin-bottom: 6px; display: block; opacity: 0.6;"></i>
            No matching documents found in the AI Knowledge Base yet. Upload documents above to contribute!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = docs.map((d) => `
      <tr>
        <td>
          <div style="font-weight: 700; color: #0b2545;">${escapeHtml(d.title)} <span style="font-size: 11px; color: #64748b; font-weight: 600;">v${d.version || 1}</span></div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">${escapeHtml((d.summary || '').slice(0, 140))}${(d.summary || '').length > 140 ? '…' : ''}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
            <i class="fa-solid fa-user"></i> ${escapeHtml(d.contributorDisplayName || 'Public')} • ${formatBytes(d.sizeBytes)} • ${formatTime(d.updatedAt || d.uploadedAt)}
          </div>
        </td>
        <td><span class="kc-format-pill">${escapeHtml(String(d.format || 'doc').toUpperCase())}</span></td>
        <td>${renderLangBadge(d.primaryLanguage)}</td>
        <td>${renderTrustBadge(d.sourceReliability)}</td>
        <td><span style="font-size: 12.5px; color: #334155; font-weight: 600;">${escapeHtml(d.category)}</span></td>
        <td><span style="font-weight: 700; color: #0f56b3;">${Number(d.chunkCount) || 0}</span></td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-table-action kc-act-view" data-doc-id="${escapeHtml(d.docId)}" title="View extracted knowledge">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button type="button" class="btn-table-action kc-act-dl" data-doc-id="${escapeHtml(d.docId)}" title="Download original file">
            <i class="fa-solid fa-download"></i>
          </button>
          <button type="button" class="btn-table-action kc-act-ask" data-doc-title="${escapeHtml(d.title)}" title="Ask AI about this document">
            <i class="fa-solid fa-robot"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function refreshPublicHistoryTable() {
    const manager = kc();
    const tbody = document.getElementById('kc-history-table-body');
    if (!manager || !tbody) return;

    const history = await manager.getRecentPublicUploads(25);
    if (history.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">No recent uploads yet.</td></tr>';
      return;
    }

    tbody.innerHTML = history.map((h) => {
      const safeDetail = h.quarantined
        ? (h.quarantineReason || 'Quarantined by security scanner')
        : (h.status === 'FAILED' ? (h.failureReason || 'Processing failed') : `${String(h.format || '').toUpperCase()} • ${formatBytes(h.sizeBytes)}`);
      const canOpen = h.status === 'INDEXED' && h.enabled !== false && !h.quarantined;

      return `
        <tr>
          <td style="font-size: 12px; color: #475569; white-space: nowrap;">${formatTime(h.uploadedAt)}</td>
          <td><strong>${escapeHtml(h.originalFilename || h.title)}</strong></td>
          <td>${escapeHtml(h.contributorDisplayName || 'Public')}</td>
          <td>${renderLangBadge(h.primaryLanguage)}</td>
          <td>${renderStatusBadge(h)}</td>
          <td style="font-size: 12px; color: #475569; max-width: 280px;">${escapeHtml(safeDetail)}</td>
          <td style="text-align: right; white-space: nowrap;">
            ${canOpen ? `<button type="button" class="btn-table-action kc-act-view" data-doc-id="${escapeHtml(h.docId)}" title="Inspect"><i class="fa-solid fa-eye"></i></button>` : '<span style="font-size: 11px; color: #94a3b8;">Restricted</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  async function openViewModal(docId) {
    const manager = kc();
    if (!manager) return;

    const details = await manager.getDocumentDetailsForView(docId, false);
    if (!details || !details.document) {
      notify('Document is unavailable or disabled.', 'warning');
      return;
    }

    const d = details.document;
    currentModalDocId = docId;

    const titleEl = document.getElementById('kc-modal-title');
    const metaEl = document.getElementById('kc-modal-meta');
    const textEl = document.getElementById('kc-modal-text');
    const modal = document.getElementById('kc-view-modal');

    if (titleEl) titleEl.textContent = `${d.title} (${d.docId})`;
    if (metaEl) {
      metaEl.innerHTML = `
        <span class="kc-format-pill">${escapeHtml(String(d.format || '').toUpperCase())}</span>
        ${renderLangBadge(d.primaryLanguage)}
        ${renderTrustBadge(d.sourceReliability)}
        <span class="kc-meta-chip"><i class="fa-solid fa-tag"></i> ${escapeHtml(d.category)}</span>
        <span class="kc-meta-chip"><i class="fa-solid fa-cubes"></i> ${d.chunkCount || 0} chunks</span>
        <span class="kc-meta-chip"><i class="fa-solid fa-code-branch"></i> v${d.version || 1}</span>
        ${d.ocrUsed ? `<span class="kc-meta-chip"><i class="fa-solid fa-eye"></i> OCR: ${escapeHtml(d.ocrEngine || 'Enabled')}</span>` : ''}
      `;
    }
    if (textEl) textEl.textContent = details.extractedText || d.summary || 'No text preview available.';
    if (modal) modal.style.display = 'flex';
  }

  function closeViewModal() {
    const modal = document.getElementById('kc-view-modal');
    if (modal) modal.style.display = 'none';
    currentModalDocId = null;
  }

  async function refreshAllPublicViews() {
    await Promise.all([
      refreshPublicStatsAndReplaceSelect(),
      refreshPublicSearchTable(),
      refreshPublicHistoryTable()
    ]);
  }

  function bindEvents() {
    const dropzone = document.getElementById('kc-dropzone');
    const fileInput = document.getElementById('kc-file-input');
    const folderInput = document.getElementById('kc-folder-input');
    const selectFilesBtn = document.getElementById('kc-select-files-btn');
    const selectFolderBtn = document.getElementById('kc-select-folder-btn');
    const clearQueueBtn = document.getElementById('kc-clear-queue-btn');
    const askBannerBtn = document.getElementById('kc-ask-ai-banner-btn');

    if (selectFilesBtn && fileInput) {
      selectFilesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }
    if (selectFolderBtn && folderInput) {
      selectFolderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        folderInput.click();
      });
    }
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          enqueueFiles(Array.from(e.target.files));
          e.target.value = '';
        }
      });
    }
    if (folderInput) {
      folderInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          enqueueFiles(Array.from(e.target.files));
          e.target.value = '';
        }
      });
    }

    if (dropzone) {
      dropzone.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        fileInput?.click();
      });
      dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput?.click();
        }
      });
      ['dragenter', 'dragover'].forEach((evName) => {
        dropzone.addEventListener(evName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('kc-dropzone-active');
        });
      });
      ['dragleave', 'drop'].forEach((evName) => {
        dropzone.addEventListener(evName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('kc-dropzone-active');
        });
      });
      dropzone.addEventListener('drop', async (e) => {
        const files = await extractDroppedEntries(e.dataTransfer);
        enqueueFiles(files);
      });
    }

    clearQueueBtn?.addEventListener('click', () => {
      for (let i = queueItems.length - 1; i >= 0; i--) {
        if (queueItems[i].status !== 'PROCESSING' && queueItems[i].status !== 'QUEUED') {
          queueItems.splice(i, 1);
        }
      }
      renderQueue();
    });

    // Queue Cancel / Retry delegation
    document.getElementById('kc-upload-queue-list')?.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('.kc-q-cancel');
      if (cancelBtn) {
        const it = queueItems.find((q) => q.id === cancelBtn.dataset.id);
        if (it) {
          it.cancelToken.aborted = true;
          it.status = 'CANCELLED';
          it.statusLabel = 'Cancelling...';
          renderQueue();
        }
        return;
      }
      const retryBtn = e.target.closest('.kc-q-retry');
      if (retryBtn) {
        const it = queueItems.find((q) => q.id === retryBtn.dataset.id);
        if (it && it.file) {
          processQueueItem(it);
        }
      }
    });

    // Search & Filters
    document.getElementById('kc-search-input')?.addEventListener('input', () => refreshPublicSearchTable());
    document.getElementById('kc-filter-lang')?.addEventListener('change', () => refreshPublicSearchTable());
    document.getElementById('kc-filter-cat')?.addEventListener('change', () => refreshPublicSearchTable());
    document.getElementById('kc-filter-source')?.addEventListener('change', () => refreshPublicSearchTable());
    document.getElementById('kc-refresh-history-btn')?.addEventListener('click', () => refreshAllPublicViews());

    // Document table & History table action delegation
    const handleTableClick = async (e) => {
      const viewBtn = e.target.closest('.kc-act-view');
      if (viewBtn) {
        await openViewModal(viewBtn.dataset.docId);
        return;
      }
      const dlBtn = e.target.closest('.kc-act-dl');
      if (dlBtn) {
        try {
          await kc().downloadDocument(dlBtn.dataset.docId, { asText: false });
        } catch (err) {
          notify(err.message, 'error');
        }
        return;
      }
      const askBtn = e.target.closest('.kc-act-ask');
      if (askBtn) {
        const title = askBtn.dataset.docTitle || '';
        if (window.janasevaVoiceAssistant && typeof window.janasevaVoiceAssistant.askAboutKnowledge === 'function') {
          window.janasevaVoiceAssistant.askAboutKnowledge(title);
        } else {
          window.janasevaVoiceAssistant?.toggleDrawer?.(true);
        }
      }
    };
    document.getElementById('kc-docs-table-body')?.addEventListener('click', handleTableClick);
    document.getElementById('kc-history-table-body')?.addEventListener('click', handleTableClick);

    // Modal Controls
    document.getElementById('kc-modal-close-btn')?.addEventListener('click', closeViewModal);
    document.getElementById('kc-view-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'kc-view-modal') closeViewModal();
    });
    document.getElementById('kc-modal-dl-orig-btn')?.addEventListener('click', async () => {
      if (!currentModalDocId) return;
      try {
        await kc().downloadDocument(currentModalDocId, { asText: false });
      } catch (err) {
        notify(err.message, 'error');
      }
    });
    document.getElementById('kc-modal-dl-txt-btn')?.addEventListener('click', async () => {
      if (!currentModalDocId) return;
      try {
        await kc().downloadDocument(currentModalDocId, { asText: true });
      } catch (err) {
        notify(err.message, 'error');
      }
    });
    document.getElementById('kc-modal-ask-ai-btn')?.addEventListener('click', () => {
      const title = document.getElementById('kc-modal-title')?.textContent || '';
      closeViewModal();
      if (window.janasevaVoiceAssistant && typeof window.janasevaVoiceAssistant.askAboutKnowledge === 'function') {
        window.janasevaVoiceAssistant.askAboutKnowledge(title);
      } else {
        window.janasevaVoiceAssistant?.toggleDrawer?.(true);
      }
    });

    askBannerBtn?.addEventListener('click', () => {
      if (window.janasevaVoiceAssistant?.toggleDrawer) {
        window.janasevaVoiceAssistant.toggleDrawer(true);
      } else {
        document.getElementById('janaseva-ai-fab')?.click();
      }
    });

    window.addEventListener('janaseva:knowledgeUpdated', () => {
      refreshAllPublicViews();
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.authService?.syncRoleNavigation === 'function') {
      window.authService.syncRoleNavigation();
    }
    bindEvents();
    await refreshAllPublicViews();
  });

  window.JanasevaKnowledgeUI = {
    refreshAllPublicViews,
    openViewModal,
    closeViewModal
  };
})(window, document);
