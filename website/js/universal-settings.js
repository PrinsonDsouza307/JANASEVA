/**
 * JANASEVA — Universal Settings Management System (USM)
 * Provides standardized, database-confirmed [Save], [Delete / Reset], and [Refresh]
 * controls, per-section dirty-state tracking, unsaved-change warnings, concurrent-request
 * protection, accessible confirmation modals, and Last Saved / Refreshed metadata bars.
 */
(function (global) {
  'use strict';

  const META_STORAGE_PREFIX = 'janaseva_usm_meta_';
  const ACTION_MODAL_ID = 'usm-confirm-modal';

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTimestamp(isoOrDate) {
    if (!isoOrDate) return 'Never';
    try {
      const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
      if (isNaN(d.getTime())) return String(isoOrDate);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return String(isoOrDate);
    }
  }

  function resolveEl(target) {
    if (!target) return null;
    if (typeof target === 'string') return document.querySelector(target);
    if (target instanceof Element) return target;
    return null;
  }

  function getCurrentActorLabel() {
    try {
      const u = global.AuthService && typeof global.AuthService.getCurrentUser === 'function'
        ? global.AuthService.getCurrentUser()
        : null;
      if (u && u.email) return u.email;
      if (u && u.name) return u.name;
      if (u && u.uid) return u.uid;
    } catch { /* ignore */ }
    return 'Authorized User';
  }

  function loadMeta(sectionId) {
    try {
      const raw = localStorage.getItem(META_STORAGE_PREFIX + sectionId);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveMeta(sectionId, meta) {
    try {
      const existing = loadMeta(sectionId);
      const merged = {
        lastSavedAt: meta.lastSavedAt !== undefined ? meta.lastSavedAt : (existing.lastSavedAt || null),
        lastRefreshedAt: meta.lastRefreshedAt !== undefined ? meta.lastRefreshedAt : (existing.lastRefreshedAt || null),
        updatedBy: meta.updatedBy !== undefined ? meta.updatedBy : (existing.updatedBy || '')
      };
      localStorage.setItem(META_STORAGE_PREFIX + sectionId, JSON.stringify(merged));
    } catch { /* ignore storage quota errors */ }
  }

  class JanasevaSettingsManager {
    constructor() {
      this.sections = new Map();
      this._beforeUnloadInstalled = false;
      this._programmaticDepth = 0;
      this._confirmResolver = null;
      this._ensureBeforeUnload();
    }

    escapeHtml(str) {
      return escapeHtml(str);
    }

    formatTimestamp(isoOrDate) {
      return formatTimestamp(isoOrDate);
    }

    _ensureBeforeUnload() {
      if (this._beforeUnloadInstalled) return;
      this._beforeUnloadInstalled = true;
      global.addEventListener('beforeunload', (e) => {
        if (this.hasDirtySections()) {
          e.preventDefault();
          e.returnValue = '';
        }
      });
    }

    hasDirtySections() {
      for (const sec of this.sections.values()) {
        if (sec.isDirty && !sec.readOnly) return true;
      }
      return false;
    }

    getDirtySectionNames() {
      const names = [];
      for (const sec of this.sections.values()) {
        if (sec.isDirty && !sec.readOnly) names.push(sec.sectionName || sec.sectionId);
      }
      return names;
    }

    runProgrammaticUpdate(sectionId, fn) {
      const sec = sectionId ? this.sections.get(sectionId) : null;
      this._programmaticDepth += 1;
      if (sec) sec._suppressDirty = (sec._suppressDirty || 0) + 1;
      try {
        return fn();
      } finally {
        if (sec) sec._suppressDirty = Math.max(0, (sec._suppressDirty || 1) - 1);
        this._programmaticDepth = Math.max(0, this._programmaticDepth - 1);
      }
    }

    setButtonState(btnOrSelector, state, labelText) {
      const btn = resolveEl(btnOrSelector);
      if (!btn) return;

      if (!btn.dataset.usmOrigHtml) {
        btn.dataset.usmOrigHtml = btn.innerHTML;
      }
      if (btn._usmResetTimer) {
        clearTimeout(btn._usmResetTimer);
        btn._usmResetTimer = null;
      }

      btn.classList.remove('usm-btn-loading', 'usm-btn-success', 'usm-btn-error');
      btn.dataset.usmState = state || 'normal';

      if (state === 'loading') {
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        btn.classList.add('usm-btn-loading');
        btn.innerHTML = `<span class="usm-spinner" aria-hidden="true"></span><span>${escapeHtml(labelText || 'Working...')}</span>`;
      } else if (state === 'success') {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.classList.add('usm-btn-success');
        btn.innerHTML = `<span>&#10003; ${escapeHtml(labelText || 'Done')}</span>`;
        btn._usmResetTimer = setTimeout(() => {
          this.setButtonState(btn, 'normal');
        }, 1600);
      } else if (state === 'error') {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.classList.add('usm-btn-error');
        if (labelText) {
          btn.innerHTML = `<span>&#9888; ${escapeHtml(labelText)}</span>`;
        }
        btn._usmResetTimer = setTimeout(() => {
          this.setButtonState(btn, 'normal');
        }, 2200);
      } else if (state === 'disabled') {
        btn.disabled = true;
        btn.removeAttribute('aria-busy');
      } else {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        if (btn.dataset.usmOrigHtml !== undefined) {
          btn.innerHTML = btn.dataset.usmOrigHtml;
        }
      }
    }

    _ensureConfirmModal() {
      let modal = document.getElementById(ACTION_MODAL_ID);
      if (modal) return modal;

      modal = document.createElement('div');
      modal.id = ACTION_MODAL_ID;
      modal.className = 'usm-modal-backdrop';
      modal.setAttribute('role', 'alertdialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'usm-confirm-title');
      modal.setAttribute('aria-describedby', 'usm-confirm-message');
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="usm-modal-card">
          <div class="usm-modal-header">
            <h3 id="usm-confirm-title" class="usm-modal-title">Confirm Action</h3>
            <button type="button" id="usm-confirm-close-x" class="usm-modal-close" aria-label="Close confirmation">&times;</button>
          </div>
          <div class="usm-modal-body">
            <p id="usm-confirm-message" class="usm-modal-message"></p>
            <div id="usm-confirm-detail" class="usm-modal-detail" style="display:none;"></div>
            <div id="usm-confirm-step-badge" class="usm-step-badge" style="display:none;"></div>
          </div>
          <div class="usm-modal-actions">
            <button type="button" id="usm-confirm-cancel-btn" class="btn btn-outline btn-sm">Cancel</button>
            <button type="button" id="usm-confirm-ok-btn" class="btn btn-primary btn-sm">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const finish = (accepted) => {
        if (modal.style.display === 'none') return;
        modal.style.display = 'none';
        const resolver = this._confirmResolver;
        this._confirmResolver = null;
        if (typeof resolver === 'function') resolver(Boolean(accepted));
      };

      modal.addEventListener('click', (e) => {
        if (e.target === modal) finish(false);
      });
      modal.querySelector('#usm-confirm-close-x').addEventListener('click', () => finish(false));
      modal.querySelector('#usm-confirm-cancel-btn').addEventListener('click', () => finish(false));
      modal.querySelector('#usm-confirm-ok-btn').addEventListener('click', () => {
        if (modal.dataset.step === '1' && modal.dataset.requireDouble === '1') {
          modal.dataset.step = '2';
          modal.querySelector('#usm-confirm-title').textContent = modal.dataset.secondTitle || 'Final Confirmation — Irreversible Action';
          modal.querySelector('#usm-confirm-message').textContent = modal.dataset.secondMessage || 'This action will permanently apply the reset/deletion for this section only. Are you completely sure?';
          const badge = modal.querySelector('#usm-confirm-step-badge');
          badge.style.display = 'inline-block';
          badge.textContent = 'Step 2 of 2: Final Verification';
          const okBtn = modal.querySelector('#usm-confirm-ok-btn');
          okBtn.textContent = modal.dataset.secondText || 'Yes, Confirm Permanently';
          okBtn.className = 'btn btn-danger btn-sm usm-btn-danger';
          okBtn.focus();
          return;
        }
        finish(true);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display !== 'none') {
          finish(false);
        }
      });

      return modal;
    }

    confirm(options = {}) {
      if (this._confirmResolver) {
        try { this._confirmResolver(false); } catch { /* ignore */ }
        this._confirmResolver = null;
      }
      const modal = this._ensureConfirmModal();
      modal.dataset.step = '1';
      modal.dataset.requireDouble = options.requireSecondConfirm ? '1' : '0';
      modal.dataset.secondTitle = options.secondConfirmTitle || 'Final Confirmation — Irreversible Action';
      modal.dataset.secondMessage = options.secondConfirmMessage || 'Please confirm once more that you want to permanently complete this operation.';
      modal.dataset.secondText = options.secondConfirmText || 'Yes, Proceed';

      modal.querySelector('#usm-confirm-title').textContent = options.title || 'Confirm Settings Action';
      modal.querySelector('#usm-confirm-message').textContent = options.message || 'Are you sure you want to proceed?';

      const detailEl = modal.querySelector('#usm-confirm-detail');
      if (options.detail) {
        detailEl.style.display = 'block';
        detailEl.textContent = options.detail;
      } else {
        detailEl.style.display = 'none';
        detailEl.textContent = '';
      }

      const stepBadge = modal.querySelector('#usm-confirm-step-badge');
      if (options.requireSecondConfirm) {
        stepBadge.style.display = 'inline-block';
        stepBadge.textContent = 'Step 1 of 2: Review Scope';
      } else {
        stepBadge.style.display = 'none';
        stepBadge.textContent = '';
      }

      const cancelBtn = modal.querySelector('#usm-confirm-cancel-btn');
      const okBtn = modal.querySelector('#usm-confirm-ok-btn');
      cancelBtn.textContent = options.cancelText || 'Cancel';
      okBtn.textContent = options.confirmText || 'Confirm';
      okBtn.className = options.danger
        ? 'btn btn-danger btn-sm usm-btn-danger'
        : 'btn btn-primary btn-sm';

      modal.style.display = 'flex';
      setTimeout(() => {
        try {
          (options.danger ? cancelBtn : okBtn).focus();
        } catch { /* ignore */ }
      }, 20);

      return new Promise((resolve) => {
        this._confirmResolver = resolve;
      });
    }

    registerSection(config) {
      if (!config || !config.sectionId) {
        throw new Error('JanasevaSettings.registerSection requires sectionId');
      }

      const id = config.sectionId;
      const savedMeta = loadMeta(id);
      const prev = this.sections.get(id);

      const sec = {
        sectionId: id,
        sectionName: config.sectionName || id,
        containerEl: resolveEl(config.containerEl),
        formEl: resolveEl(config.formEl),
        statusHostEl: resolveEl(config.statusHostEl),
        saveBtn: resolveEl(config.saveBtn),
        resetBtn: resolveEl(config.resetBtn),
        refreshBtn: resolveEl(config.refreshBtn),
        dirtyInputsSelector: config.dirtyInputs || 'input:not([readonly]):not([type="file"]), select, textarea:not([readonly])',
        trackInputs: config.trackInputs !== false,
        readOnly: Boolean(config.readOnly),
        autoBindSubmit: config.autoBindSubmit !== false,
        confirmResetTitle: config.confirmResetTitle || null,
        confirmResetMessage: config.confirmResetMessage || null,
        confirmResetDetail: config.confirmResetDetail || null,
        confirmResetButtonText: config.confirmResetButtonText || null,
        requireDoubleConfirmReset: Boolean(config.requireDoubleConfirmReset),
        confirmRefreshMessage: config.confirmRefreshMessage || null,
        onSave: typeof config.onSave === 'function' ? config.onSave : null,
        onReset: typeof config.onReset === 'function' ? config.onReset : null,
        onRefresh: typeof config.onRefresh === 'function' ? config.onRefresh : null,
        isDirty: prev ? prev.isDirty : false,
        isSaving: false,
        isResetting: false,
        isRefreshing: false,
        lastSavedAt: config.initialSavedAt || (prev && prev.lastSavedAt) || savedMeta.lastSavedAt || null,
        lastRefreshedAt: config.initialRefreshedAt || (prev && prev.lastRefreshedAt) || savedMeta.lastRefreshedAt || null,
        updatedBy: config.initialUpdatedBy || (prev && prev.updatedBy) || savedMeta.updatedBy || '',
        lastError: null,
        statusBadge: config.statusBadge || (prev && prev.statusBadge) || null,
        _suppressDirty: 0,
        _statusBarEl: null
      };

      sec.isBusy = () => sec.isSaving || sec.isResetting || sec.isRefreshing;
      this.sections.set(id, sec);
      this._wireSectionDom(sec);
      this.renderStatusBar(id);
      return sec;
    }

    _wireSectionDom(sec) {
      const bindOnce = (el, eventName, key, handler) => {
        if (!el) return;
        const prop = '__usm_' + key;
        if (el[prop]) {
          el.removeEventListener(eventName, el[prop]);
        }
        el[prop] = handler;
        el.addEventListener(eventName, handler);
      };

      if (sec.formEl && sec.autoBindSubmit && sec.onSave) {
        bindOnce(sec.formEl, 'submit', 'submit', (e) => {
          e.preventDefault();
          this.triggerSave(sec.sectionId);
        });
      }

      if (sec.saveBtn && sec.onSave) {
        if (!sec.saveBtn.dataset.usmOrigHtml) {
          sec.saveBtn.dataset.usmOrigHtml = sec.saveBtn.innerHTML;
        }
        bindOnce(sec.saveBtn, 'click', 'saveClick', (e) => {
          if (sec.saveBtn.type === 'submit' && sec.formEl && sec.autoBindSubmit) {
            return; // form submit handler triggers triggerSave
          }
          e.preventDefault();
          this.triggerSave(sec.sectionId);
        });
      }

      if (sec.resetBtn && sec.onReset) {
        if (!sec.resetBtn.dataset.usmOrigHtml) {
          sec.resetBtn.dataset.usmOrigHtml = sec.resetBtn.innerHTML;
        }
        bindOnce(sec.resetBtn, 'click', 'resetClick', (e) => {
          e.preventDefault();
          this.triggerReset(sec.sectionId);
        });
      }

      if (sec.refreshBtn && sec.onRefresh) {
        if (!sec.refreshBtn.dataset.usmOrigHtml) {
          sec.refreshBtn.dataset.usmOrigHtml = sec.refreshBtn.innerHTML;
        }
        bindOnce(sec.refreshBtn, 'click', 'refreshClick', (e) => {
          e.preventDefault();
          this.triggerRefresh(sec.sectionId);
        });
      }

      const scopeEl = sec.formEl || sec.containerEl;
      if (scopeEl && sec.trackInputs && !sec.readOnly) {
        const markDirtyHandler = (e) => {
          if (this._programmaticDepth > 0 || sec._suppressDirty > 0) return;
          const t = e.target;
          if (!t || (t.closest && t.closest('[data-usm-ignore]'))) return;
          if (t.matches && !t.matches(sec.dirtyInputsSelector)) return;
          if (!sec.isDirty || sec.lastError) {
            sec.isDirty = true;
            sec.lastError = null;
            this.renderStatusBar(sec.sectionId);
          }
        };
        bindOnce(scopeEl, 'input', 'dirtyInput', markDirtyHandler);
        bindOnce(scopeEl, 'change', 'dirtyChange', markDirtyHandler);
      }
    }

    _ensureStatusBar(sec) {
      const host = sec.statusHostEl || sec.formEl || sec.containerEl;
      if (!host) return null;

      let bar = host.querySelector(':scope > .usm-status-bar[data-usm-section="' + sec.sectionId + '"]')
        || host.querySelector('.usm-status-bar[data-usm-section="' + sec.sectionId + '"]');
      if (bar) {
        sec._statusBarEl = bar;
        return bar;
      }

      bar = document.createElement('div');
      bar.className = 'usm-status-bar';
      bar.dataset.usmSection = sec.sectionId;
      bar.setAttribute('role', 'status');
      bar.setAttribute('aria-live', 'polite');

      if (sec.statusHostEl) {
        sec.statusHostEl.innerHTML = '';
        sec.statusHostEl.appendChild(bar);
      } else {
        host.insertBefore(bar, host.firstChild);
      }
      sec._statusBarEl = bar;
      return bar;
    }

    renderStatusBar(sectionId) {
      const sec = this.sections.get(sectionId);
      if (!sec) return;
      const bar = this._ensureStatusBar(sec);
      if (!bar) return;

      let pillClass = 'usm-pill-saved';
      let pillText = sec.readOnly ? 'Synced' : 'Saved';
      if (sec.isSaving) {
        pillClass = 'usm-pill-loading';
        pillText = 'Saving...';
      } else if (sec.isResetting) {
        pillClass = 'usm-pill-loading';
        pillText = 'Resetting...';
      } else if (sec.isRefreshing) {
        pillClass = 'usm-pill-loading';
        pillText = 'Refreshing...';
      } else if (sec.lastError) {
        pillClass = 'usm-pill-error';
        pillText = 'Sync Error';
      } else if (sec.isDirty && !sec.readOnly) {
        pillClass = 'usm-pill-dirty';
        pillText = 'Unsaved Changes';
      }

      const badgeHtml = sec.statusBadge && sec.statusBadge.text
        ? `<span class="usm-pill usm-pill-${escapeHtml(sec.statusBadge.tone || 'neutral')}" data-no-translate="true">${escapeHtml(sec.statusBadge.text)}</span>`
        : '';

      const savedStr = formatTimestamp(sec.lastSavedAt);
      const refreshedStr = formatTimestamp(sec.lastRefreshedAt);
      const actorStr = sec.updatedBy ? escapeHtml(sec.updatedBy) : '';

      const metaParts = [];
      if (!sec.readOnly || sec.lastSavedAt) {
        metaParts.push(`<span class="usm-meta-item">Last Saved: <strong data-no-translate="true">${escapeHtml(savedStr)}</strong></span>`);
      }
      if (actorStr) {
        metaParts.push(`<span class="usm-meta-item">Updated By: <strong data-no-translate="true">${actorStr}</strong></span>`);
      }
      metaParts.push(`<span class="usm-meta-item">Last Refreshed: <strong data-no-translate="true">${escapeHtml(refreshedStr)}</strong></span>`);

      const errHtml = sec.lastError
        ? `<div class="usm-error-banner" role="alert">
             <span class="usm-error-text" data-no-translate="true">${escapeHtml(sec.lastError)}</span>
             <button type="button" class="usm-error-dismiss" aria-label="Dismiss error">&times;</button>
           </div>`
        : '';

      bar.innerHTML = `
        <div class="usm-status-row">
          <div class="usm-status-pills">
            <span class="usm-pill ${pillClass}">${escapeHtml(pillText)}</span>
            ${badgeHtml}
          </div>
          <div class="usm-status-meta">${metaParts.join('<span class="usm-meta-sep" aria-hidden="true">&bull;</span>')}</div>
        </div>
        ${errHtml}
      `;

      const dismissBtn = bar.querySelector('.usm-error-dismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          sec.lastError = null;
          this.renderStatusBar(sectionId);
        });
      }
    }

    markDirty(sectionId, dirty = true) {
      const sec = this.sections.get(sectionId);
      if (!sec) return;
      sec.isDirty = Boolean(dirty);
      if (dirty) sec.lastError = null;
      this.renderStatusBar(sectionId);
    }

    markClean(sectionId, meta = {}) {
      const sec = this.sections.get(sectionId);
      if (!sec) return;
      sec.isDirty = false;
      sec.lastError = null;
      if (meta.savedAt) sec.lastSavedAt = meta.savedAt;
      if (meta.refreshedAt) sec.lastRefreshedAt = meta.refreshedAt;
      if (meta.updatedBy !== undefined) sec.updatedBy = meta.updatedBy;
      saveMeta(sectionId, {
        lastSavedAt: sec.lastSavedAt,
        lastRefreshedAt: sec.lastRefreshedAt,
        updatedBy: sec.updatedBy
      });
      this.renderStatusBar(sectionId);
    }

    setSectionBadge(sectionId, text, tone = 'neutral') {
      const sec = this.sections.get(sectionId);
      if (!sec) return;
      sec.statusBadge = text ? { text, tone } : null;
      this.renderStatusBar(sectionId);
    }

    setSectionError(sectionId, message) {
      const sec = this.sections.get(sectionId);
      if (!sec) return;
      sec.lastError = message ? String(message) : null;
      this.renderStatusBar(sectionId);
    }

    async triggerSave(sectionId) {
      const sec = this.sections.get(sectionId);
      if (!sec || !sec.onSave) return false;
      if (sec.isBusy()) return false;

      sec.isSaving = true;
      sec.lastError = null;
      if (sec.saveBtn) this.setButtonState(sec.saveBtn, 'loading', 'Saving...');
      if (sec.resetBtn) sec.resetBtn.disabled = true;
      if (sec.refreshBtn) sec.refreshBtn.disabled = true;
      this.renderStatusBar(sectionId);

      try {
        const result = await sec.onSave({ section: sec, manager: this });
        if (result && result.cancelled) {
          if (sec.saveBtn) this.setButtonState(sec.saveBtn, 'normal');
          return false;
        }
        if (result && result.ok === false) {
          throw new Error(result.error || result.message || 'Save failed.');
        }

        const nowIso = new Date().toISOString();
        sec.isDirty = false;
        sec.lastSavedAt = (result && result.savedAt) || nowIso;
        sec.updatedBy = (result && result.updatedBy) || getCurrentActorLabel();
        saveMeta(sectionId, {
          lastSavedAt: sec.lastSavedAt,
          updatedBy: sec.updatedBy
        });

        if (sec.saveBtn) this.setButtonState(sec.saveBtn, 'success', 'Saved');
        if (result && result.message && !result.silentToast && typeof global.showToast === 'function') {
          global.showToast(result.message, 'success');
        }
        return true;
      } catch (err) {
        const msg = (err && err.message) ? err.message : 'Unable to save settings.';
        sec.lastError = msg;
        if (sec.saveBtn) this.setButtonState(sec.saveBtn, 'error', 'Retry Save');
        if (typeof global.showToast === 'function') {
          global.showToast(msg, 'error');
        }
        return false;
      } finally {
        sec.isSaving = false;
        if (sec.resetBtn) sec.resetBtn.disabled = false;
        if (sec.refreshBtn) sec.refreshBtn.disabled = false;
        this.renderStatusBar(sectionId);
      }
    }

    async triggerReset(sectionId) {
      const sec = this.sections.get(sectionId);
      if (!sec || !sec.onReset) return false;
      if (sec.isBusy()) return false;

      const confirmed = await this.confirm({
        title: sec.confirmResetTitle || `Reset ${sec.sectionName}?`,
        message: sec.confirmResetMessage || `Resetting "${sec.sectionName}" will restore this section's default settings and discard any custom edits here.`,
        detail: sec.confirmResetDetail || 'Scope: Only this section is affected. Unrelated settings, user accounts, citizen complaints, and audit logs will remain untouched.',
        confirmText: sec.confirmResetButtonText || 'Reset to Defaults',
        cancelText: 'Cancel',
        danger: true,
        requireSecondConfirm: sec.requireDoubleConfirmReset
      });
      if (!confirmed) return false;

      sec.isResetting = true;
      sec.lastError = null;
      if (sec.resetBtn) this.setButtonState(sec.resetBtn, 'loading', 'Resetting...');
      if (sec.saveBtn) sec.saveBtn.disabled = true;
      if (sec.refreshBtn) sec.refreshBtn.disabled = true;
      this.renderStatusBar(sectionId);

      try {
        const result = await sec.onReset({ section: sec, manager: this });
        if (result && result.ok === false) {
          throw new Error(result.error || result.message || 'Reset failed.');
        }

        const nowIso = new Date().toISOString();
        sec.isDirty = false;
        sec.lastSavedAt = (result && result.savedAt) || nowIso;
        sec.lastRefreshedAt = (result && result.refreshedAt) || nowIso;
        sec.updatedBy = (result && result.updatedBy) || getCurrentActorLabel();
        saveMeta(sectionId, {
          lastSavedAt: sec.lastSavedAt,
          lastRefreshedAt: sec.lastRefreshedAt,
          updatedBy: sec.updatedBy
        });

        if (sec.resetBtn) this.setButtonState(sec.resetBtn, 'success', 'Reset Done');
        if (result && result.message && !result.silentToast && typeof global.showToast === 'function') {
          global.showToast(result.message, 'success');
        }
        return true;
      } catch (err) {
        const msg = (err && err.message) ? err.message : 'Unable to reset settings.';
        sec.lastError = msg;
        if (sec.resetBtn) this.setButtonState(sec.resetBtn, 'error', 'Reset Failed');
        if (typeof global.showToast === 'function') {
          global.showToast(msg, 'error');
        }
        return false;
      } finally {
        sec.isResetting = false;
        if (sec.saveBtn) sec.saveBtn.disabled = false;
        if (sec.refreshBtn) sec.refreshBtn.disabled = false;
        this.renderStatusBar(sectionId);
      }
    }

    async triggerRefresh(sectionId, options = {}) {
      const sec = this.sections.get(sectionId);
      if (!sec || !sec.onRefresh) return false;
      if (sec.isBusy()) return false;

      if (sec.isDirty && !sec.readOnly && !options.skipDirtyConfirm) {
        const discardConfirmed = await this.confirm({
          title: 'Discard Unsaved Changes?',
          message: sec.confirmRefreshMessage || `"${sec.sectionName}" has unsaved changes. Refreshing will reload the latest saved values from the database and discard your unsaved local edits.`,
          confirmText: 'Discard & Refresh',
          cancelText: 'Keep Editing',
          danger: true
        });
        if (!discardConfirmed) return false;
      }

      sec.isRefreshing = true;
      sec.lastError = null;
      if (sec.refreshBtn) this.setButtonState(sec.refreshBtn, 'loading', 'Refreshing...');
      if (sec.saveBtn) sec.saveBtn.disabled = true;
      if (sec.resetBtn) sec.resetBtn.disabled = true;
      this.renderStatusBar(sectionId);

      try {
        let result = null;
        await this.runProgrammaticUpdate(sectionId, async () => {
          result = await sec.onRefresh({ section: sec, manager: this });
        });
        if (result && result.ok === false) {
          throw new Error(result.error || result.message || 'Refresh failed.');
        }

        const nowIso = new Date().toISOString();
        sec.isDirty = false;
        sec.lastRefreshedAt = (result && result.refreshedAt) || nowIso;
        if (result && result.savedAt) sec.lastSavedAt = result.savedAt;
        if (result && result.updatedBy !== undefined) sec.updatedBy = result.updatedBy;
        saveMeta(sectionId, {
          lastSavedAt: sec.lastSavedAt,
          lastRefreshedAt: sec.lastRefreshedAt,
          updatedBy: sec.updatedBy
        });

        if (sec.refreshBtn) this.setButtonState(sec.refreshBtn, 'success', 'Refreshed');
        if (result && result.message && !result.silentToast && typeof global.showToast === 'function') {
          global.showToast(result.message, 'info');
        }
        return true;
      } catch (err) {
        const msg = (err && err.message) ? err.message : 'Unable to refresh settings from database. Existing displayed values were preserved.';
        sec.lastError = msg;
        if (sec.refreshBtn) this.setButtonState(sec.refreshBtn, 'error', 'Refresh Failed');
        if (typeof global.showToast === 'function') {
          global.showToast(msg, 'error');
        }
        return false;
      } finally {
        sec.isRefreshing = false;
        if (sec.saveBtn) sec.saveBtn.disabled = false;
        if (sec.resetBtn) sec.resetBtn.disabled = false;
        this.renderStatusBar(sectionId);
      }
    }
  }

  global.JanasevaSettingsManager = JanasevaSettingsManager;
  global.JanasevaSettings = new JanasevaSettingsManager();
})(window);
