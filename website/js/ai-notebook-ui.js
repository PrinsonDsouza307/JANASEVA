/**
 * JANASEVA – AI Notebook UI & Rich Writing Environment
 * 
 * Provides:
 * 1. Notebooks Grid with Zoho Notebook-style custom covers & color-coded themes
 * 2. Note Cards with interactive checklists, pinned sections, snippet previews
 * 3. Distraction-Free Rich Text Editor (Headings, Lists, Tables, Media, Highlighting)
 * 4. Real-time Autosave Indicator with status badges & revision history
 * 5. Sharing & Permission Modal (Links with passwords/expiry + Direct User Grants)
 * 6. Library Approval Submissions and Administrator Review Workflows
 */

(function(window) {
  'use strict';

  // Safe utility helpers
  function showToast(msg, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else if (typeof window.janasevaShowToast === 'function') {
      window.janasevaShowToast(msg, type);
    } else {
      console.log(`[Toast ${type}] ${msg}`);
    }
  }

  function formatDate(d = new Date()) {
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return 'Recently';
      return dt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Recently';
    }
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

  class JanasevaNotebookUI {
    constructor() {
      this.currentNotebookId = null;
      this.currentNoteId = null;
      this.activeTab = 'notebooks'; // 'notebooks' | 'library' | 'shared'
      this.currentFilterCategory = 'all';
      this.searchQuery = '';
      this.autosaveTimeout = null;
      this.initialized = false;
    }

    get service() {
      return window.JanasevaNotebookService;
    }

    async init() {
      if (this.initialized) return;
      if (this.service) await this.service.initPromise;
      this.bindGlobalEvents();
      this.initialized = true;
    }

    bindGlobalEvents() {
      // Keyboard shortcuts inside editor
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          const editorModal = document.getElementById('nb-note-editor-modal');
          if (editorModal && editorModal.style.display !== 'none') {
            e.preventDefault();
            this.saveCurrentNoteImmediately();
          }
        }
      });
    }

    // ========================================================================
    // 1. RENDER NOTEBOOKS VIEW
    // ========================================================================

    async renderNotebooksView(containerId = 'nb-notebooks-container') {
      const container = document.getElementById(containerId);
      if (!container || !this.service) return;

      const actor = this.service.getCurrentActor();
      const notebooks = await this.service.listNotebooks({
        category: this.currentFilterCategory,
        search: this.searchQuery
      }, actor);

      if (notebooks.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px;">
            <i class="fa-solid fa-book-open" style="font-size: 42px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
            <h3 style="color: #0b2545; font-size: 16px; margin: 0 0 6px 0;">No notebooks found</h3>
            <p style="color: #64748b; font-size: 13px; max-width: 440px; margin: 0 auto 16px auto;">Create your first personalized civic notebook to organize knowledge, field checklists, circulars, or research.</p>
            <button type="button" class="btn-cta-primary" onclick="window.JanasevaNotebookUI.openCreateNotebookModal()" style="padding: 9px 18px; font-size: 13px;">
              <i class="fa-solid fa-plus"></i> Create New Notebook
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = notebooks.map(nb => {
        const coverBg = nb.color || '#0f56b3';
        const isOwner = nb.ownerUid === actor.uid;
        const visibilityBadge = nb.visibility === 'public_approved'
          ? `<span class="badge" style="background: rgba(22, 163, 74, 0.15); color: #166534; font-size: 10.5px; border: 1px solid #86efac; border-radius: 4px; padding: 2px 6px; font-weight: 700;">APPROVED LIBRARY</span>`
          : nb.visibility === 'shared'
          ? `<span class="badge" style="background: rgba(14, 116, 144, 0.15); color: #0e7490; font-size: 10.5px; border: 1px solid #67e8f9; border-radius: 4px; padding: 2px 6px; font-weight: 700;">SHARED</span>`
          : `<span class="badge" style="background: rgba(100, 116, 139, 0.15); color: #475569; font-size: 10.5px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px; font-weight: 700;">PRIVATE</span>`;

        return `
          <div class="nb-notebook-card" onclick="window.JanasevaNotebookUI.selectNotebook('${escapeHtml(nb.notebookId)}')" role="button" tabindex="0">
            <div class="nb-notebook-cover" style="background: linear-gradient(135deg, ${coverBg} 0%, #0b2545 100%);">
              <div class="nb-cover-spine"></div>
              <div class="nb-cover-content">
                <i class="${escapeHtml(nb.icon || 'fa-solid fa-book')} nb-cover-icon"></i>
                <h3 class="nb-cover-title">${escapeHtml(nb.name)}</h3>
                <span class="nb-cover-category">${escapeHtml(nb.category)}</span>
              </div>
            </div>
            <div class="nb-notebook-body">
              <p class="nb-notebook-desc" style="color: #475569; font-size: 13px; line-height: 1.55; margin: 0;">${escapeHtml(nb.description || 'No description provided.')}</p>
              <div class="nb-notebook-footer">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="nb-notes-count-pill" style="color: #0b2545; font-weight: 600;"><i class="fa-solid fa-note-sticky" style="color: #0f56b3;"></i> ${nb.notesCount || 0} notes</span>
                  ${visibilityBadge}
                </div>
                <div class="nb-notebook-actions" onclick="event.stopPropagation();">
                  <button type="button" class="btn-icon" onclick="window.JanasevaNotebookUI.openShareModal('NOTEBOOK', '${escapeHtml(nb.notebookId)}')" title="Share Notebook">
                    <i class="fa-solid fa-share-nodes"></i>
                  </button>
                  ${isOwner || actor.isAdmin ? `
                    <button type="button" class="btn-icon" onclick="window.JanasevaNotebookUI.openEditNotebookModal('${escapeHtml(nb.notebookId)}')" title="Edit Notebook Details">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="btn-icon btn-icon-danger" onclick="window.JanasevaNotebookUI.confirmDeleteNotebook('${escapeHtml(nb.notebookId)}')" title="Delete Notebook">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // ========================================================================
    // 2. RENDER NOTES VIEW INSIDE A NOTEBOOK
    // ========================================================================

    async renderNotesView(notebookId, containerId = 'nb-notes-list-container') {
      this.currentNotebookId = notebookId;
      const container = document.getElementById(containerId);
      if (!container || !this.service) return;

      const actor = this.service.getCurrentActor();
      const nb = await this.service.getNotebook(notebookId, actor);
      if (!nb) {
        container.innerHTML = `<div class="alert alert-danger">Notebook not found or access denied.</div>`;
        return;
      }

      // Update header info in UI if present
      const titleEl = document.getElementById('nb-active-notebook-title');
      if (titleEl) titleEl.innerText = nb.name;
      const countEl = document.getElementById('nb-active-notebook-meta');
      if (countEl) countEl.innerHTML = `<i class="fa-solid fa-folder"></i> ${escapeHtml(nb.category)} • <strong>${nb.notesCount || 0} Notes</strong>`;

      const notes = await this.service.listNotes({
        notebookId,
        category: this.currentFilterCategory,
        search: this.searchQuery
      }, actor);

      if (notes.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: #fff; border: 1.5px dashed #cbd5e1; border-radius: 10px;">
            <i class="fa-regular fa-note-sticky" style="font-size: 38px; color: #94a3b8; margin-bottom: 10px; display: block;"></i>
            <h4 style="color: #0b2545; font-size: 15px; margin: 0 0 6px 0;">This notebook is empty</h4>
            <p style="color: #64748b; font-size: 13px; margin: 0 0 16px 0;">Start writing your first rich note, checklist, or guide in this notebook.</p>
            <button type="button" class="btn-cta-primary" onclick="window.JanasevaNotebookUI.openCreateNoteModal('${escapeHtml(notebookId)}')" style="padding: 8px 16px; font-size: 13px;">
              <i class="fa-solid fa-plus"></i> New Note
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = notes.map(note => {
        const isOwner = note.ownerUid === actor.uid;
        const approvalBadge = note.approvalStatus === 'APPROVED' || note.approvalStatus === 'PUBLISHED'
          ? `<span class="status-pill status-pill-success"><i class="fa-solid fa-circle-check"></i> Library Approved</span>`
          : note.approvalStatus === 'UNDER_REVIEW'
          ? `<span class="status-pill status-pill-warning"><i class="fa-solid fa-clock"></i> Under Review</span>`
          : `<span class="status-pill status-pill-neutral">Personal Draft</span>`;

        const pinClass = note.isPinned ? 'active-pin' : '';
        const favClass = note.isFavorite ? 'active-fav' : '';

        // Checklist preview progress bar
        let checklistHtml = '';
        if (note.checklistSummary && note.checklistSummary.total > 0) {
          const pct = Math.round((note.checklistSummary.completed / note.checklistSummary.total) * 100);
          checklistHtml = `
            <div class="nb-checklist-preview-bar">
              <div class="nb-checklist-track"><div class="nb-checklist-fill" style="width: ${pct}%;"></div></div>
              <span class="nb-checklist-label">${note.checklistSummary.completed}/${note.checklistSummary.total} done (${pct}%)</span>
            </div>
          `;
        }

        const snippet = (note.contentText || '').slice(0, 160) + ((note.contentText || '').length > 160 ? '...' : '');

        return `
          <div class="nb-note-card ${note.isPinned ? 'is-pinned-card' : ''}" onclick="window.JanasevaNotebookUI.openNoteEditor('${escapeHtml(note.noteId)}')" role="button" tabindex="0">
            <div class="nb-note-card-top">
              <h4 class="nb-note-title">
                ${note.isPinned ? '<i class="fa-solid fa-thumbtack" style="color: #e65100; margin-right: 4px;"></i>' : ''}
                ${escapeHtml(note.title)}
              </h4>
              <div class="nb-note-quick-icons" onclick="event.stopPropagation();">
                <button type="button" class="btn-star ${favClass}" onclick="window.JanasevaNotebookUI.toggleFavorite('${escapeHtml(note.noteId)}')" title="Star Favorite">
                  <i class="fa-star ${note.isFavorite ? 'fa-solid' : 'fa-regular'}"></i>
                </button>
                <button type="button" class="btn-pin ${pinClass}" onclick="window.JanasevaNotebookUI.togglePin('${escapeHtml(note.noteId)}')" title="Pin to top">
                  <i class="fa-solid fa-thumbtack"></i>
                </button>
              </div>
            </div>

            <p class="nb-note-snippet" style="color: #475569; font-size: 12.5px; line-height: 1.5;">${escapeHtml(snippet)}</p>
            ${checklistHtml}

            <div class="nb-note-card-bottom">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                ${approvalBadge}
                <span class="nb-note-date" style="color: #64748b; font-size: 11.5px;"><i class="fa-regular fa-clock"></i> ${escapeHtml(note.formattedDate || '')}</span>
              </div>
              <div class="nb-note-card-actions" onclick="event.stopPropagation();">
                <button type="button" class="btn-icon" onclick="window.JanasevaNotebookUI.openNoteEditor('${escapeHtml(note.noteId)}')" title="Edit Note">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btn-icon" onclick="window.JanasevaNotebookUI.openShareModal('NOTE', '${escapeHtml(note.noteId)}')" title="Share Note">
                  <i class="fa-solid fa-share-nodes"></i>
                </button>
                <button type="button" class="btn-icon" onclick="window.JanasevaNotebookUI.exportNote('${escapeHtml(note.noteId)}', 'txt')" title="Export as Text">
                  <i class="fa-solid fa-file-arrow-down"></i>
                </button>
                ${isOwner || actor.isAdmin ? `
                  <button type="button" class="btn-icon btn-icon-danger" onclick="window.JanasevaNotebookUI.confirmDeleteNote('${escapeHtml(note.noteId)}')" title="Delete Note">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // ========================================================================
    // 3. RICH TEXT EDITOR CONTROLLER
    // ========================================================================

    async openNoteEditor(noteId, targetNotebookId = null) {
      if (!this.service) return;
      const actor = this.service.getCurrentActor();

      if (!noteId) {
        let nbId = targetNotebookId || this.currentNotebookId;
        if (!nbId) {
          const list = await this.service.listNotebooks({}, actor);
          nbId = list.length > 0 ? list[0].notebookId : null;
        }
        if (!nbId) {
          showToast('Please create a notebook first.', 'warning');
          return;
        }
        try {
          const newNote = await this.service.createNote({
            notebookId: nbId,
            title: 'Untitled Note',
            contentHtml: '<p>Start typing your note here...</p>',
            actor
          });
          noteId = newNote.noteId;
        } catch (e) {
          showToast(e.message || 'Error creating note draft', 'error');
          return;
        }
      }

      const note = await this.service.getNote(noteId, actor);
      if (!note) {
        showToast('Note not found or access denied.', 'error');
        return;
      }

      this.currentNoteId = note.noteId;
      this.currentNotebookId = note.notebookId;

      const modal = document.getElementById('nb-note-editor-modal');
      const titleInput = document.getElementById('nb-editor-title-input');
      const contentArea = document.getElementById('nb-editor-content-area');
      const saveStatus = document.getElementById('nb-editor-save-status');
      const approvalBtn = document.getElementById('nb-editor-approval-btn');
      const versionBtn = document.getElementById('nb-editor-version-badge');

      if (!modal || !contentArea) return;

      if (titleInput) titleInput.value = note.title;
      contentArea.innerHTML = note.contentHtml || '';
      if (saveStatus) saveStatus.innerHTML = `<i class="fa-solid fa-cloud-check" style="color: #16a34a;"></i> Saved (${note.formattedDate || 'Just now'})`;
      if (versionBtn) versionBtn.innerText = `v${note.version || 1}`;

      // Configure approval button
      if (approvalBtn) {
        if (note.approvalStatus === 'APPROVED' || note.approvalStatus === 'PUBLISHED') {
          approvalBtn.className = 'btn-cta-secondary btn-approved';
          approvalBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Published in Library`;
          approvalBtn.disabled = true;
        } else if (note.approvalStatus === 'UNDER_REVIEW') {
          approvalBtn.className = 'btn-cta-secondary btn-review';
          approvalBtn.innerHTML = `<i class="fa-solid fa-clock"></i> Under Admin Review`;
          approvalBtn.disabled = true;
        } else {
          approvalBtn.className = 'btn-cta-secondary';
          approvalBtn.innerHTML = `<i class="fa-solid fa-landmark"></i> Submit to AI Library`;
          approvalBtn.disabled = false;
        }
      }

      modal.style.display = 'flex';
      this.bindEditorAutosave();
      if (titleInput && !note.title) {
        setTimeout(() => titleInput.focus(), 100);
      } else if (contentArea) {
        setTimeout(() => contentArea.focus(), 100);
      }
    }

    bindEditorAutosave() {
      const contentArea = document.getElementById('nb-editor-content-area');
      const titleInput = document.getElementById('nb-editor-title-input');
      const saveStatus = document.getElementById('nb-editor-save-status');

      const triggerAutosave = () => {
        if (saveStatus) saveStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: #0f56b3;"></i> Autosaving...`;
        clearTimeout(this.autosaveTimeout);
        this.autosaveTimeout = setTimeout(async () => {
          await this.saveCurrentNoteImmediately();
        }, 850);
      };

      if (contentArea) contentArea.oninput = triggerAutosave;
      if (titleInput) titleInput.oninput = triggerAutosave;
    }

    async saveCurrentNoteImmediately() {
      if (!this.currentNoteId || !this.service) return;

      const titleInput = document.getElementById('nb-editor-title-input');
      const contentArea = document.getElementById('nb-editor-content-area');
      const saveStatus = document.getElementById('nb-editor-save-status');

      const title = titleInput?.value.trim() || 'Untitled Note';
      const contentHtml = contentArea?.innerHTML || '';

      try {
        const actor = this.service.getCurrentActor();
        const updated = await this.service.updateNote(this.currentNoteId, {
          title,
          contentHtml
        }, actor);

        if (saveStatus) {
          saveStatus.innerHTML = `<i class="fa-solid fa-cloud-check" style="color: #16a34a;"></i> Saved (${formatDate()})`;
        }
        const versionBtn = document.getElementById('nb-editor-version-badge');
        if (versionBtn) versionBtn.innerText = `v${updated.version || 1}`;
      } catch (err) {
        if (saveStatus) {
          saveStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #dc2626;"></i> Save failed: ${escapeHtml(err.message)}`;
        }
      }
    }

    closeNoteEditor() {
      const modal = document.getElementById('nb-note-editor-modal');
      if (modal) modal.style.display = 'none';
      if (this.currentNotebookId) {
        this.renderNotesView(this.currentNotebookId);
      }
      this.renderNotebooksView();
      this.currentNoteId = null;
    }

    // Rich Text Editor Commands (execCommand with semantic fallback)
    executeFormat(command, value = null) {
      const contentArea = document.getElementById('nb-editor-content-area');
      if (!contentArea) return;
      contentArea.focus();

      if (command === 'createLink') {
        const url = prompt('Enter website or resource URL:', 'https://');
        if (url) document.execCommand('createLink', false, url);
      } else if (command === 'insertTable') {
        const tableHtml = `
          <table class="nb-editor-table" style="width: 100%; border-collapse: collapse; margin: 12px 0;">
            <thead><tr><th style="border: 1px solid #cbd5e1; padding: 6px; background: #f8fafc;">Header 1</th><th style="border: 1px solid #cbd5e1; padding: 6px; background: #f8fafc;">Header 2</th></tr></thead>
            <tbody><tr><td style="border: 1px solid #cbd5e1; padding: 6px;">Cell 1</td><td style="border: 1px solid #cbd5e1; padding: 6px;">Cell 2</td></tr></tbody>
          </table>
        `;
        document.execCommand('insertHTML', false, tableHtml);
      } else if (command === 'insertChecklist') {
        const checklistItemHtml = `
          <div class="checklist-item" onclick="this.classList.toggle('checklist-item-checked')" style="cursor: pointer; display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            <input type="checkbox" style="pointer-events: none;"> <span>New Task</span>
          </div>
        `;
        document.execCommand('insertHTML', false, checklistItemHtml);
      } else {
        document.execCommand(command, false, value);
      }

      this.saveCurrentNoteImmediately();
    }

    // ========================================================================
    // 4. NOTEBOOK CRUD MODALS & ACTIONS
    // ========================================================================

    selectNotebook(notebookId) {
      this.currentNotebookId = notebookId;
      // Toggle tabs / view in UI
      const nbView = document.getElementById('nb-notebooks-list-view');
      const notesView = document.getElementById('nb-notes-view');
      if (nbView) nbView.style.display = 'none';
      if (notesView) notesView.style.display = 'block';

      this.renderNotesView(notebookId);
    }

    backToNotebooksList() {
      const nbView = document.getElementById('nb-notebooks-list-view');
      const notesView = document.getElementById('nb-notes-view');
      if (notesView) notesView.style.display = 'none';
      if (nbView) nbView.style.display = 'block';

      this.renderNotebooksView();
    }

    openCreateNotebookModal() {
      this.editingNotebookId = null;
      const modal = document.getElementById('nb-create-notebook-modal');
      const titleEl = document.getElementById('nb-modal-title');
      const submitBtn = document.getElementById('nb-modal-submit-btn');
      const nameInput = document.getElementById('nb-modal-name');
      const descInput = document.getElementById('nb-modal-desc');
      const catSelect = document.getElementById('nb-modal-cat');

      if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-folder-plus"></i> Create New Notebook';
      if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Create Notebook';
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      if (catSelect) catSelect.value = 'General';

      const defaultRadio = document.querySelector('input[name="nb-color-radio"][value="#0f56b3"]');
      if (defaultRadio) defaultRadio.checked = true;

      if (modal) modal.style.display = 'flex';
    }

    async openEditNotebookModal(notebookId) {
      if (!this.service || !notebookId) return;
      const actor = this.service.getCurrentActor();
      const nb = await this.service.getNotebook(notebookId, actor);
      if (!nb) {
        showToast('Notebook not found or access denied.', 'error');
        return;
      }

      this.editingNotebookId = notebookId;
      const modal = document.getElementById('nb-create-notebook-modal');
      const titleEl = document.getElementById('nb-modal-title');
      const submitBtn = document.getElementById('nb-modal-submit-btn');
      const nameInput = document.getElementById('nb-modal-name');
      const descInput = document.getElementById('nb-modal-desc');
      const catSelect = document.getElementById('nb-modal-cat');

      if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Notebook Details';
      if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Changes';
      if (nameInput) nameInput.value = nb.name || '';
      if (descInput) descInput.value = nb.description || '';
      if (catSelect) catSelect.value = nb.category || 'General';

      const colorRadio = document.querySelector(`input[name="nb-color-radio"][value="${nb.color}"]`);
      if (colorRadio) {
        colorRadio.checked = true;
      } else {
        const firstRadio = document.querySelector('input[name="nb-color-radio"]');
        if (firstRadio) firstRadio.checked = true;
      }

      if (modal) modal.style.display = 'flex';
    }

    closeCreateNotebookModal() {
      this.editingNotebookId = null;
      const modal = document.getElementById('nb-create-notebook-modal');
      if (modal) modal.style.display = 'none';
    }

    async submitCreateNotebook() {
      if (this.editingNotebookId) {
        return this.submitEditNotebook();
      }
      if (!this.service) return;
      const name = document.getElementById('nb-modal-name')?.value?.trim();
      const desc = document.getElementById('nb-modal-desc')?.value?.trim();
      const cat = document.getElementById('nb-modal-cat')?.value || 'General';
      const color = document.querySelector('input[name="nb-color-radio"]:checked')?.value || '#0f56b3';

      if (!name) {
        showToast('Notebook name cannot be empty.', 'warning');
        return;
      }

      try {
        await this.service.createNotebook({
          name,
          description: desc,
          category: cat,
          color
        });
        this.closeCreateNotebookModal();
        this.renderNotebooksView();
        showToast('Notebook created successfully!', 'success');
      } catch (e) {
        showToast(e.message || 'Failed to create notebook', 'error');
      }
    }

    async submitEditNotebook() {
      if (!this.service || !this.editingNotebookId) return;
      const name = document.getElementById('nb-modal-name')?.value?.trim();
      const desc = document.getElementById('nb-modal-desc')?.value?.trim();
      const cat = document.getElementById('nb-modal-cat')?.value || 'General';
      const color = document.querySelector('input[name="nb-color-radio"]:checked')?.value || '#0f56b3';

      if (!name) {
        showToast('Notebook name cannot be empty.', 'warning');
        return;
      }

      try {
        const actor = this.service.getCurrentActor();
        await this.service.updateNotebook(this.editingNotebookId, {
          name,
          description: desc,
          category: cat,
          color
        }, actor);

        this.closeCreateNotebookModal();
        this.renderNotebooksView();
        
        // If currently viewing notes of this notebook, update title
        const titleEl = document.getElementById('nb-active-notebook-title');
        if (titleEl && this.currentNotebookId === this.editingNotebookId) {
          titleEl.innerText = name;
        }
        showToast('Notebook updated successfully!', 'success');
      } catch (e) {
        showToast(e.message || 'Failed to update notebook', 'error');
      }
    }

    async confirmDeleteNotebook(notebookId) {
      if (!confirm('Are you sure you want to move this notebook and its notes to the Recycle Bin?')) return;
      try {
        await this.service.deleteNotebook(notebookId);
        this.renderNotebooksView();
        showToast('Notebook moved to Recycle Bin.', 'info');
      } catch (e) {
        showToast(e.message || 'Error deleting notebook', 'error');
      }
    }

    async confirmDeleteNote(noteId) {
      if (!confirm('Are you sure you want to delete this note? It can be restored from the Recycle Bin.')) return;
      try {
        await this.service.deleteNote(noteId);
        if (this.currentNotebookId) this.renderNotesView(this.currentNotebookId);
        showToast('Note moved to Recycle Bin.', 'info');
      } catch (e) {
        showToast(e.message || 'Error deleting note', 'error');
      }
    }

    async togglePin(noteId) {
      const note = await this.service.getNote(noteId);
      if (!note) return;
      await this.service.updateNote(noteId, { isPinned: !note.isPinned });
      if (this.currentNotebookId) this.renderNotesView(this.currentNotebookId);
    }

    async toggleFavorite(noteId) {
      const note = await this.service.getNote(noteId);
      if (!note) return;
      await this.service.updateNote(noteId, { isFavorite: !note.isFavorite });
      if (this.currentNotebookId) this.renderNotesView(this.currentNotebookId);
    }

    async submitActiveNoteForApproval() {
      if (!this.currentNoteId) return;
      try {
        await this.service.submitNoteForApproval(this.currentNoteId);
        showToast('Note submitted to Administrator for AI Knowledge Library review!', 'success');
        this.openNoteEditor(this.currentNoteId);
      } catch (e) {
        showToast(e.message || 'Failed to submit note', 'error');
      }
    }

    // ========================================================================
    // 5. SHARING MODAL CONTROLLER
    // ========================================================================

    async openShareModal(targetType, targetId) {
      const modal = document.getElementById('nb-share-modal');
      const titleEl = document.getElementById('nb-share-target-title');
      const tokenInput = document.getElementById('nb-share-url-input');
      const shareHistoryList = document.getElementById('nb-share-history-list');

      if (!modal) return;
      modal.setAttribute('data-target-type', targetType);
      modal.setAttribute('data-target-id', targetId);

      if (titleEl) titleEl.innerText = `Share ${targetType}`;
      if (tokenInput) tokenInput.value = 'Click Generate Link below to create a secure share link...';

      // Load existing active share links
      const shares = (window.JanasevaDB ? window.JanasevaDB.get('share_links', []) : []).filter(s => s.targetId === targetId && s.isActive);
      if (shareHistoryList) {
        if (!shares.length) {
          shareHistoryList.innerHTML = `<li style="color: #64748b; font-size: 12.5px;">No active sharing links. Create one below.</li>`;
        } else {
          shareHistoryList.innerHTML = shares.map(s => `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
              <div>
                <strong>${escapeHtml(s.accessLevel)} Link</strong> • Created ${escapeHtml(s.formattedDate || '')} • Accesses: ${s.accessCount || 0}
              </div>
              <button type="button" class="btn-table-action" onclick="window.JanasevaNotebookUI.revokeShare('${s.shareId}')" style="color: #dc2626; border-color: #fca5a5;">Revoke</button>
            </li>
          `).join('');
        }
      }

      modal.style.display = 'flex';
    }

    closeShareModal() {
      const modal = document.getElementById('nb-share-modal');
      if (modal) modal.style.display = 'none';
    }

    async generateShareLink() {
      const modal = document.getElementById('nb-share-modal');
      if (!modal || !this.service) return;

      const targetType = modal.getAttribute('data-target-type');
      const targetId = modal.getAttribute('data-target-id');
      const accessLevel = document.getElementById('nb-share-perm-select')?.value || 'VIEWER';
      const password = document.getElementById('nb-share-pass-input')?.value || '';
      const expiry = document.getElementById('nb-share-expiry-select')?.value || 0;

      try {
        const link = await this.service.createShareLink({
          targetType,
          targetId,
          accessLevel,
          password,
          expiryDays: expiry
        });

        const shareUrl = `${window.location.origin}/knowledge-centre.html?share_token=${link.token}`;
        const input = document.getElementById('nb-share-url-input');
        if (input) input.value = shareUrl;

        showToast('Secure sharing link generated!', 'success');
        this.openShareModal(targetType, targetId);
      } catch (e) {
        showToast(e.message || 'Error generating link', 'error');
      }
    }

    copyShareUrl() {
      const input = document.getElementById('nb-share-url-input');
      if (!input || !input.value || input.value.startsWith('Click')) {
        showToast('Generate a link first before copying.', 'warning');
        return;
      }
      navigator.clipboard.writeText(input.value);
      showToast('Share link copied to clipboard!', 'success');
    }

    async revokeShare(shareId) {
      if (!confirm('Are you sure you want to revoke this share link? Users using this link will immediately lose online access.')) return;
      try {
        await this.service.revokeShareLink(shareId);
        showToast('Share link revoked successfully.', 'info');
        const modal = document.getElementById('nb-share-modal');
        const targetType = modal?.getAttribute('data-target-type');
        const targetId = modal?.getAttribute('data-target-id');
        if (targetType && targetId) this.openShareModal(targetType, targetId);
      } catch (e) {
        showToast(e.message || 'Failed to revoke link', 'error');
      }
    }

    // ========================================================================
    // 6. EXPORTING
    // ========================================================================

    async exportNote(noteId, format = 'txt') {
      const note = await this.service.getNote(noteId);
      if (!note) return;

      const filename = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${format}`;
      let content = '';
      let mimeType = 'text/plain';

      if (format === 'json') {
        content = JSON.stringify(note, null, 2);
        mimeType = 'application/json';
      } else {
        content = `JANASEVA AI NOTEBOOK\nTitle: ${note.title}\nNotebook: ${note.notebookName}\nCategory: ${note.category}\nDate: ${note.formattedDate}\nApproval Status: ${note.approvalStatus}\n----------------------------------------\n\n${note.contentText}`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      showToast(`Exported ${filename}`, 'success');
    }

    // Aliases & Missing method handlers
    backToNotebooks() {
      this.backToNotebooksList();
    }

    copyShareLink() {
      this.copyShareUrl();
    }

    async openCreateNoteModal(notebookId) {
      await this.openNoteEditor(null, notebookId);
    }

    insertChecklistItem() {
      const contentArea = document.getElementById('nb-editor-content-area');
      if (!contentArea) return;
      const item = document.createElement('div');
      item.className = 'nb-checklist-item';
      item.style.cssText = 'display:flex; align-items:flex-start; gap:8px; margin:6px 0;';
      item.innerHTML = `
        <input type="checkbox" onchange="window.JanasevaNotebookUI.saveCurrentNoteImmediately();" style="margin-top:4px;">
        <span contenteditable="true" style="outline:none; flex:1; min-height:18px;">Checklist item...</span>
      `;
      contentArea.appendChild(item);
      contentArea.focus();
      this.saveCurrentNoteImmediately();
    }

    async openVersionHistoryModal() {
      if (!this.currentNoteId || !this.service) return;
      const versions = await this.service.getNoteVersions(this.currentNoteId);
      
      let modal = document.getElementById('nb-version-history-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nb-version-history-modal';
        modal.className = 'cms-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="cms-modal-box" style="max-width: 520px;">
          <div class="cms-modal-header">
            <h3 style="margin:0; font-size:16px; color:#0b2545;"><i class="fa-solid fa-clock-rotate-left"></i> Revision History</h3>
            <button type="button" class="cms-modal-close" onclick="document.getElementById('nb-version-history-modal').style.display='none'">&times;</button>
          </div>
          <div class="cms-modal-body" style="max-height: 400px; overflow-y: auto;">
            ${versions.length === 0 ? '<p style="color:#64748b; font-size:13px; text-align:center; padding:20px;">No previous revisions found for this note.</p>' : `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${versions.map(v => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div>
                      <div style="font-weight: 700; font-size: 13px; color: #0b2545;">Version ${v.versionNumber} • <span style="font-weight: 400; color: #64748b; font-size: 11.5px;">${escapeHtml(v.formattedDate || '')}</span></div>
                      <div style="font-size: 12px; color: #475569; margin-top: 2px;">${escapeHtml(v.changeSummary || 'Revision snapshot')}</div>
                    </div>
                    <button type="button" class="btn-table-action" onclick="window.JanasevaNotebookUI.restoreVersion('${v.versionId}')" style="font-size: 11.5px; padding: 5px 10px;">Restore</button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    }

    async restoreVersion(versionId) {
      if (!this.currentNoteId || !this.service) return;
      try {
        const actor = this.service.getCurrentActor();
        await this.service.restoreNoteVersion(this.currentNoteId, versionId, actor);
        const modal = document.getElementById('nb-version-history-modal');
        if (modal) modal.style.display = 'none';
        await this.openNoteEditor(this.currentNoteId);
        showToast('Restored note to selected revision.', 'success');
      } catch (e) {
        showToast(e.message || 'Failed to restore revision', 'error');
      }
    }
  }

  window.JanasevaNotebookUI = new JanasevaNotebookUI();
})(window);
