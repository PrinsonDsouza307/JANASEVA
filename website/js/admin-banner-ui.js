/**
 * JANASEVA 2.0 – Admin Banner Image Management UI Controller
 * 
 * Provides the interactive UI for the Admin Control Centre banner image:
 * - Direct "Add Image" / "Replace Image" action button in the hero header
 * - Dedicated "Banner Image" management tab pane with live previews & diagnostics
 * - Drop-zone and file selector for computer & mobile devices
 * - Pre-upload preview with dimensions, file size, and format validation
 * - Instant confirmation dialogs before replace/delete operations
 * - Responsive preview viewport switcher (Desktop / Tablet / Mobile)
 */

(function() {
  'use strict';

  let stagedFile = null;
  let stagedPreviewData = null;

  /**
   * Initialize Banner UI when DOM is ready
   */
  document.addEventListener('DOMContentLoaded', () => {
    initBannerUI();
  });

  window.addEventListener('janaseva:authChanged', () => {
    initBannerUI();
  });

  window.addEventListener('janaseva:bannerUpdated', () => {
    renderBannerManagementUI();
  });

  window.addEventListener('janaseva:langChanged', () => {
    renderBannerManagementUI();
    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }
  });

  function initBannerUI() {
    const service = window.adminBannerService;
    if (!service) return;

    service.updateHeaderControlsVisibility();
    renderBannerManagementUI();
  }

  /**
   * Render or Refresh the Dedicated Banner Management Tab Pane
   */
  window.renderBannerManagementUI = function() {
    const pane = document.getElementById('admin-tab-banner-mgmt');
    if (!pane) return;

    const service = window.adminBannerService;
    if (!service) return;

    const isAdmin = service.isAdmin();
    if (!isAdmin) {
      pane.innerHTML = `
        <div class="portal-card" style="padding: 40px 20px; text-align: center; border-left: 5px solid #dc2626;">
          <i class="fa-solid fa-lock" style="font-size: 38px; color: #dc2626; margin-bottom: 12px; display: block;"></i>
          <h3 style="font-size: 18px; color: #991b1b; font-weight: 800;">Access Denied: Administrator Only</h3>
          <p style="font-size: 13.5px; color: #64748b; max-width: 500px; margin: 8px auto 0;">
            Banner Image Management is strictly restricted to authenticated System Administrators. Your current role does not have authorization to view or configure banner assets.
          </p>
        </div>
      `;
      return;
    }

    const currentBanner = service.getBanner();
    const hasCustom = !!(currentBanner && currentBanner.active);
    const activeUrl = hasCustom ? currentBanner.imageUrl : 'assets/panchayat-building.png';

    pane.innerHTML = `
      <!-- Top Overview Banner -->
      <div class="portal-card" id="banner-usm-card" style="margin-bottom: 20px; border-left: 5px solid #0284c7;">
        <div class="portal-card-header" style="flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center;">
          <div class="card-title-group">
            <i class="fa-solid fa-image card-header-icon" style="color: #0284c7; font-size: 24px;"></i>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h2 class="card-heading" style="color: #075985;">Admin Banner Image Management</h2>
                <span class="admin-tab-badge" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 800;">ADMIN PRIVILEGED ONLY</span>
                <span class="admin-tab-badge" style="background: ${hasCustom ? '#16a34a' : '#64748b'}; color: #fff; font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 700;" data-no-translate="true">
                  <i class="fa-solid ${hasCustom ? 'fa-circle-check' : 'fa-building-columns'}"></i> ${hasCustom ? 'CUSTOM BANNER ACTIVE' : 'DEFAULT BANNER ACTIVE'}
                </span>
              </div>
              <p class="card-subheading">Upload, preview, replace, and manage the official background banner image displayed in the Admin Control Centre header.</p>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn-secondary-action usm-btn-refresh" id="btn-refresh-banner" style="padding: 7px 14px; font-size: 12.5px; border-radius: 8px;">
              <i class="fa-solid fa-arrows-rotate"></i>
              <span>Refresh</span>
            </button>
            <button type="button" class="btn-cta-primary" onclick="openAdminBannerModal()" style="display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 12.5px; border-radius: 8px; background: #0b2545; color: #fff; border: 1.5px solid #0b2545; font-weight: 700; cursor: pointer;">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>${hasCustom ? 'Replace Image' : 'Add Image'}</span>
            </button>
            <button type="button" class="btn-secondary-action usm-btn-reset" id="btn-delete-banner" ${hasCustom ? '' : 'disabled title="Currently using system default banner"'} style="padding: 7px 14px; border-radius: 8px; font-size: 12.5px;">
              <i class="fa-solid fa-trash-can"></i> <span>${hasCustom ? 'Delete / Reset Default' : 'Using Default'}</span>
            </button>
          </div>
        </div>
        <div style="padding: 0 18px 14px;">
          <div id="banner-usm-status"></div>
        </div>
      </div>

      <!-- Two-Column Layout: Live Banner Preview & Image Management Controls -->
      <div class="banner-mgmt-grid">
        
        <!-- Left: Live Interactive Header Simulation -->
        <div class="portal-card">
          <div class="portal-card-header">
            <div class="card-title-group">
              <i class="fa-solid fa-eye card-header-icon" style="color: #0f56b3;"></i>
              <div>
                <h3 class="card-heading">Live Banner Display Preview</h3>
                <p class="card-subheading">Demonstrates how the banner appears with the gradient overlay, shield emblem, title, and tricolour separator.</p>
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-preview-device active" onclick="setPreviewDevice('desktop', this)" title="Desktop Screen (Full)">
                <i class="fa-solid fa-desktop"></i>
              </button>
              <button type="button" class="btn-preview-device" onclick="setPreviewDevice('tablet', this)" title="Tablet Screen (Medium)">
                <i class="fa-solid fa-tablet-screen-button"></i>
              </button>
              <button type="button" class="btn-preview-device" onclick="setPreviewDevice('mobile', this)" title="Mobile Device (Compact)">
                <i class="fa-solid fa-mobile-screen"></i>
              </button>
            </div>
          </div>

          <div class="portal-card-body" style="padding: 16px;">
            <div id="banner-preview-frame-container" style="transition: all 0.3s ease; width: 100%; margin: 0 auto; overflow: hidden; border-radius: 10px; border: 1.5px solid #cbd5e1; box-shadow: 0 4px 14px rgba(11, 37, 69, 0.08);">
              <!-- Embedded Simulation of the actual Hero Banner -->
              <div class="hero-banner" style="position: relative; overflow: hidden; min-height: 140px; border-bottom: none;">
                <div class="hero-bg-overlay" id="pane-preview-bg-overlay" style="background-image: url('${activeUrl}'); background-size: cover; background-position: center right; background-repeat: no-repeat;"></div>
                <div class="hero-content-wrap" style="padding: 24px 20px 30px; position: relative; z-index: 2;">
                  <div class="hero-text-side">
                    <div class="hero-title-with-icon" style="display: flex; align-items: center; gap: 10px;">
                      <div class="hero-page-icon" style="width: 36px; height: 36px; font-size: 16px;">
                        <i class="fa-solid fa-shield-halved"></i>
                      </div>
                      <h2 class="hero-main-heading" style="font-size: 20px; margin: 0;">Admin Control Centre</h2>
                    </div>
                    <p class="hero-subheading" style="font-size: 12px; margin: 6px 0 0; max-width: 480px; line-height: 1.4;">
                      Centralized grievance management, citizen register, official response dispatch, and workload monitoring.
                    </p>
                  </div>
                </div>
                <div class="tricolour-wave-separator" style="position: absolute; bottom: 0; left: 0; right: 0;">
                  <svg viewBox="0 0 1440 24" fill="none" preserveAspectRatio="none" style="width: 100%; height: 16px; display: block;">
                    <path d="M0,0 C360,18 1080,6 1440,16 L1440,24 L0,24 Z" fill="#ffffff" />
                    <path d="M0,4 C400,20 1100,10 1440,18" stroke="#ff9933" stroke-width="2.5" fill="none" />
                    <path d="M0,8 C420,22 1120,12 1440,20" stroke="#138808" stroke-width="2.5" fill="none" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Diagnostics & Metadata Ledger -->
            <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
              <h4 style="margin: 0 0 10px; font-size: 13px; font-weight: 800; color: #0b2545; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-circle-info" style="color: #0284c7;"></i> Banner Specification & Status
              </h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 12.5px;">
                <div>
                  <span style="color: #64748b; display: block; font-size: 11px;">Active Mode:</span>
                  <strong style="color: ${hasCustom ? '#16a34a' : '#0b2545'};">${hasCustom ? 'Custom Uploaded Banner' : 'Default Gram Panchayat Design'}</strong>
                </div>
                <div>
                  <span style="color: #64748b; display: block; font-size: 11px;">Filename:</span>
                  <strong style="color: #0b2545;">${hasCustom ? escapeHtml(currentBanner.filename) : 'panchayat-building.png'}</strong>
                </div>
                <div>
                  <span style="color: #64748b; display: block; font-size: 11px;">File Size:</span>
                  <strong style="color: #0b2545;">${hasCustom ? currentBanner.formattedSize : 'Default System Asset'}</strong>
                </div>
                <div>
                  <span style="color: #64748b; display: block; font-size: 11px;">Last Updated Date:</span>
                  <strong style="color: #0b2545;">${hasCustom ? currentBanner.updatedAt : 'Standard Preset'}</strong>
                </div>
                <div>
                  <span style="color: #64748b; display: block; font-size: 11px;">Uploaded By:</span>
                  <strong style="color: #0b2545;">${hasCustom ? escapeHtml(currentBanner.uploadedByName || currentBanner.uploadedByEmail) : 'System Default'}</strong>
                </div>
                <div>
                  <span style="color: #64748b; display: block; font-size: 11px;">Storage Location:</span>
                  <strong style="color: #0b2545;">${hasCustom ? (currentBanner.storagePath || 'Secure App Storage') : 'assets/panchayat-building.png'}</strong>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Right: Upload, Staging & Action Centre -->
        <div class="portal-card">
          <div class="portal-card-header">
            <div class="card-title-group">
              <i class="fa-solid fa-sliders card-header-icon" style="color: #0284c7;"></i>
              <div>
                <h3 class="card-heading">Upload & Action Centre</h3>
                <p class="card-subheading">Select high-resolution image from your device.</p>
              </div>
            </div>
          </div>

          <div class="portal-card-body">
            
            <!-- Drag & Drop Zone -->
            <div id="banner-drop-zone" class="banner-upload-dropzone" onclick="if (event.target.id !== 'banner-file-input') document.getElementById('banner-file-input').click()">
              <input type="file" id="banner-file-input" accept="image/jpeg,image/png,image/webp" style="display: none;" onchange="handleBannerFileInput(this.files[0])">
              <div class="dropzone-icon-circle">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <h4 style="margin: 8px 0 4px; font-size: 14px; font-weight: 700; color: #0b2545;">Choose Banner Image</h4>
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Click to browse or drag & drop from computer or mobile
              </p>
              <div style="margin-top: 10px; display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
                <span class="file-req-pill">JPG, PNG, WEBP</span>
                <span class="file-req-pill">Max 10 MB</span>
                <span class="file-req-pill">Landscape Recommended</span>
              </div>
            </div>

            <!-- Staged File Preview Card (Hidden until file selected) -->
            <div id="staged-preview-card" style="display: none; margin-top: 16px; border: 1.5px solid #bfdbfe; border-radius: 8px; background: #eff6ff; padding: 14px;">
              <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
                <img id="staged-thumb-img" src="" alt="Thumbnail" style="width: 72px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #93c5fd;">
                <div style="flex: 1; min-width: 0;">
                  <div id="staged-filename" style="font-size: 13px; font-weight: 700; color: #1e3a8a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">filename.jpg</div>
                  <div id="staged-file-meta" style="font-size: 11.5px; color: #3b82f6;">0 MB &bull; 0 &times; 0 px</div>
                  <div style="font-size: 11px; color: #16a34a; font-weight: 600; margin-top: 2px;">
                    <i class="fa-solid fa-circle-check"></i> Verified Valid Format & Size
                  </div>
                </div>
                <button type="button" class="btn-cancel-doc" onclick="cancelStagedBanner()" title="Cancel Selection" style="color: #64748b; background: none; border: none; font-size: 16px; cursor: pointer;">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <!-- Upload Progress Bar (shown while saving) -->
              <div id="banner-upload-progress-wrap" style="display: none; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #1e3a8a; font-weight: 700; margin-bottom: 4px;">
                  <span>Uploading to Secure Storage...</span>
                  <span id="banner-progress-percent">100%</span>
                </div>
                <div style="height: 6px; background: #dbeafe; border-radius: 3px; overflow: hidden;">
                  <div id="banner-progress-bar" style="height: 100%; width: 100%; background: #0284c7; transition: width 0.3s;"></div>
                </div>
              </div>

              <!-- Actions -->
              <div class="usm-actions-bar" style="margin-top: 10px; padding-top: 10px;">
                <button type="button" class="btn-cta-secondary" onclick="cancelStagedBanner()" style="padding: 7px 12px; font-size: 12.5px;">
                  Discard Staged File
                </button>
                <button type="button" class="btn-cta-primary" id="btn-save-banner" style="padding: 7px 16px; font-size: 12.5px; background: #16a34a;">
                  <i class="fa-solid fa-check"></i> Save &amp; Apply Banner
                </button>
              </div>
            </div>

            <!-- Action Summary & Guidelines -->
            <div style="margin-top: 16px; padding: 12px 14px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #64748b; line-height: 1.5;">
              <strong style="color: #0b2545; display: block; margin-bottom: 4px;">
                <i class="fa-solid fa-shield-halved" style="color: #0f56b3;"></i> Security &amp; Compliance Policy:
              </strong>
              Only administrators can modify this banner. Uploaded imagery is validated against rigid MIME type signatures to prevent script injection. Large binary files are stored in dedicated cloud storage rather than bloating core transactional database ledgers.
            </div>

          </div>
        </div>

      </div>
    `;

    setupDropZoneEvents();
    registerBannerUSM(currentBanner);
  };

  function registerBannerUSM(currentBanner) {
    const usm = window.JanasevaSettings;
    const service = window.adminBannerService;
    if (!usm || !service) return;

    const sec = usm.registerSection({
      sectionId: 'admin-banner',
      sectionName: 'Admin Banner Settings',
      containerEl: '#admin-tab-banner-mgmt',
      statusHostEl: '#banner-usm-status',
      saveBtn: '#btn-save-banner',
      resetBtn: '#btn-delete-banner',
      refreshBtn: '#btn-refresh-banner',
      trackInputs: false,
      confirmResetTitle: 'Delete Custom Banner & Restore Default?',
      confirmResetMessage: 'This will permanently delete the custom uploaded banner image and revert the Admin Control Centre header back to the official default Gram Panchayat banner.',
      confirmResetDetail: 'Scope: Only the custom banner asset is deleted. No complaints, users, or email settings are modified.',
      confirmResetButtonText: 'Delete & Restore Default',
      onSave: async () => {
        if (!stagedFile) {
          throw new Error('Please choose a JPG, PNG, or WEBP banner image before saving.');
        }
        const current = service.getBanner();
        const isReplacement = Boolean(current && current.active);
        if (isReplacement) {
          const ok = await usm.confirm({
            title: 'Replace Active Custom Banner?',
            message: `Replace "${current.filename}" with newly staged "${stagedFile.name}"?`,
            confirmText: 'Replace & Save',
            cancelText: 'Cancel'
          });
          if (!ok) return { cancelled: true };
        }
        const meta = await service.uploadBanner(stagedFile, isReplacement);
        stagedFile = null;
        stagedPreviewData = null;
        if (typeof closeAdminBannerModal === 'function') closeAdminBannerModal();
        setTimeout(() => window.renderBannerManagementUI(), 150);
        return {
          savedAt: new Date().toISOString(),
          updatedBy: meta?.uploadedByEmail || '',
          message: isReplacement ? 'Banner image replaced successfully!' : 'Banner image uploaded and applied!'
        };
      },
      onReset: async () => {
        await service.deleteBanner();
        stagedFile = null;
        stagedPreviewData = null;
        if (typeof closeAdminBannerModal === 'function') closeAdminBannerModal();
        setTimeout(() => window.renderBannerManagementUI(), 150);
        return {
          savedAt: new Date().toISOString(),
          message: 'Custom banner deleted and default banner restored.'
        };
      },
      onRefresh: async () => {
        const refreshed = await service.refreshBanner({ strictRemote: true });
        stagedFile = null;
        stagedPreviewData = null;
        setTimeout(() => window.renderBannerManagementUI(), 150);
        return {
          refreshedAt: new Date().toISOString(),
          updatedBy: refreshed?.uploadedByEmail || '',
          message: 'Banner status reloaded from database.'
        };
      }
    });

    if (stagedFile) {
      sec.isDirty = true;
      usm.renderStatusBar('admin-banner');
    } else if (currentBanner && currentBanner.uploadedByEmail && !sec.updatedBy) {
      usm.markClean('admin-banner', { updatedBy: currentBanner.uploadedByEmail });
    }
  }

  /**
   * Device Viewport simulation toggler
   */
  window.setPreviewDevice = function(device, btnEl) {
    const frame = document.getElementById('banner-preview-frame-container');
    if (!frame) return;

    document.querySelectorAll('.btn-preview-device').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    if (device === 'mobile') {
      frame.style.maxWidth = '375px';
    } else if (device === 'tablet') {
      frame.style.maxWidth = '640px';
    } else {
      frame.style.maxWidth = '100%';
    }
  };

  /**
   * Wire drag & drop events on dropzone
   */
  function setupDropZoneEvents() {
    const dropZone = document.getElementById('banner-drop-zone');
    if (!dropZone) return;

    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-active');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        handleBannerFileInput(dt.files[0]);
      }
    });
  }

  /**
   * Process selected file and show preview
   */
  window.handleBannerFileInput = async function(file) {
    if (!file) return;

    const service = window.adminBannerService;
    if (!service) return;

    try {
      // Validate & Generate preview
      const previewData = await service.generatePreview(file);
      stagedFile = file;
      stagedPreviewData = previewData;

      // Update staging card in Tab pane
      const card = document.getElementById('staged-preview-card');
      const thumb = document.getElementById('staged-thumb-img');
      const nameEl = document.getElementById('staged-filename');
      const metaEl = document.getElementById('staged-file-meta');

      if (card && thumb && nameEl && metaEl) {
        thumb.src = previewData.dataUrl;
        nameEl.innerText = previewData.filename;
        metaEl.innerText = `${previewData.formattedSize} • ${previewData.width} × ${previewData.height} px (${previewData.mimeType})`;
        card.style.display = 'block';
      }

      // Live update the preview frame so admin can see it staged before saving
      const previewOverlay = document.getElementById('pane-preview-bg-overlay');
      if (previewOverlay) {
        previewOverlay.style.backgroundImage = `url('${previewData.dataUrl}')`;
      }

      // Also update modal if modal is currently open
      const modalThumb = document.getElementById('modal-banner-thumb');
      const modalMeta = document.getElementById('modal-banner-meta');
      const modalPreviewCard = document.getElementById('modal-staged-card');
      if (modalThumb && modalMeta && modalPreviewCard) {
        modalThumb.src = previewData.dataUrl;
        modalMeta.innerText = `${previewData.filename} (${previewData.formattedSize})`;
        modalPreviewCard.style.display = 'block';
      }

      if (window.JanasevaSettings && window.JanasevaSettings.sections.has('admin-banner')) {
        window.JanasevaSettings.markDirty('admin-banner', true);
      }
    } catch (err) {
      stagedFile = null;
      stagedPreviewData = null;
      if (typeof showToast === 'function') {
        showToast(err.message, "error");
      } else {
        (window.janasevaAlert || alert)(err.message);
      }
    }
  };

  /**
   * Cancel staged file
   */
  window.cancelStagedBanner = function() {
    stagedFile = null;
    stagedPreviewData = null;

    const fileInput = document.getElementById('banner-file-input');
    if (fileInput) fileInput.value = '';

    const card = document.getElementById('staged-preview-card');
    if (card) card.style.display = 'none';

    const modalPreviewCard = document.getElementById('modal-staged-card');
    if (modalPreviewCard) modalPreviewCard.style.display = 'none';

    // Revert preview frame to active banner
    const service = window.adminBannerService;
    const current = service ? service.getBanner() : null;
    const activeUrl = current && current.active ? current.imageUrl : 'assets/panchayat-building.png';
    const previewOverlay = document.getElementById('pane-preview-bg-overlay');
    if (previewOverlay) {
      previewOverlay.style.backgroundImage = `url('${activeUrl}')`;
    }
    if (window.JanasevaSettings && window.JanasevaSettings.sections.has('admin-banner')) {
      window.JanasevaSettings.markClean('admin-banner');
    }
  };

  /**
   * Save Staged Banner to Database & Storage
   */
  window.saveStagedBanner = async function() {
    if (window.JanasevaSettings && window.JanasevaSettings.sections.has('admin-banner')) {
      return await window.JanasevaSettings.triggerSave('admin-banner');
    }
    if (!stagedFile) {
      if (typeof showToast === 'function') showToast("Please select an image file to save.", "warning");
      return;
    }

    const service = window.adminBannerService;
    if (!service) return;

    const current = service.getBanner();
    const isReplacement = !!(current && current.active);

    if (isReplacement) {
      const ok = (window.janasevaConfirm || confirm)(`Replace Current Banner?\n\nAre you sure you want to replace "${current.filename}" with "${stagedFile.name}" as the official Admin Control Centre banner?`);
      if (!ok) return;
    }

    const saveBtn = document.getElementById('btn-save-banner');
    const modalSaveBtn = document.getElementById('modal-btn-save-banner');
    const progressWrap = document.getElementById('banner-upload-progress-wrap');

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${window.janasevaT ? window.janasevaT('Saving Banner...') : 'Saving Banner...'}`;
    }
    if (modalSaveBtn) {
      modalSaveBtn.disabled = true;
      modalSaveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${window.janasevaT ? window.janasevaT('Saving...') : 'Saving...'}`;
    }
    if (progressWrap) progressWrap.style.display = 'block';

    try {
      await service.uploadBanner(stagedFile, isReplacement);

      if (typeof showToast === 'function') {
        showToast(isReplacement ? "Banner image replaced successfully!" : "Banner image uploaded successfully!", "success");
      } else {
        (window.janasevaAlert || alert)("Banner image updated successfully!");
      }

      stagedFile = null;
      stagedPreviewData = null;

      if (typeof closeAdminBannerModal === 'function') {
        closeAdminBannerModal();
      }

      renderBannerManagementUI();

    } catch (err) {
      console.error("Banner upload error:", err);
      if (typeof showToast === 'function') {
        showToast(`Upload Failed: ${err.message}`, "error");
      } else {
        (window.janasevaAlert || alert)(`Upload Failed: ${err.message}`);
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save & Apply Banner';
      }
      if (modalSaveBtn) {
        modalSaveBtn.disabled = false;
        modalSaveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save & Apply';
      }
      if (progressWrap) progressWrap.style.display = 'none';
      if (window.janasevaTranslator) window.janasevaTranslator.applyTranslations();
    }
  };

  /**
   * Delete custom banner with confirmation
   */
  window.promptDeleteBanner = async function() {
    if (window.JanasevaSettings && window.JanasevaSettings.sections.has('admin-banner')) {
      return await window.JanasevaSettings.triggerReset('admin-banner');
    }
    const service = window.adminBannerService;
    if (!service) return;

    const current = service.getBanner();
    if (!current) {
      if (typeof showToast === 'function') showToast("No custom banner is currently active to delete.", "info");
      return;
    }

    const confirmed = (window.janasevaConfirm || confirm)(
      `Delete Custom Banner Image?\n\n` +
      `Are you sure you want to delete "${current.filename}"?\n\n` +
      `The Admin Control Centre header will immediately revert to the official default Gram Panchayat building design.`
    );

    if (!confirmed) return;

    try {
      await service.deleteBanner();

      if (typeof showToast === 'function') {
        showToast("Custom banner deleted. Reverted to default Gram Panchayat design.", "info");
      } else {
        (window.janasevaAlert || alert)("Banner deleted successfully.");
      }

      if (typeof closeAdminBannerModal === 'function') {
        closeAdminBannerModal();
      }

      renderBannerManagementUI();

    } catch (err) {
      console.error("Delete banner error:", err);
      if (typeof showToast === 'function') {
        showToast(`Delete Failed: ${err.message}`, "error");
      } else {
        (window.janasevaAlert || alert)(`Delete Failed: ${err.message}`);
      }
    }
  };

  /**
   * Modal Management for Header "Add Image" / "Change Banner" Action Button
   */
  window.openAdminBannerModal = function() {
    const service = window.adminBannerService;
    if (!service) return;

    try {
      service.requireAdmin();
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, "error");
      return;
    }

    const modal = document.getElementById('admin-banner-mgmt-modal');
    if (!modal) return;

    const current = service.getBanner();
    const hasCustom = !!(current && current.active);

    const titleEl = document.getElementById('modal-banner-action-title');
    if (titleEl) {
      titleEl.innerText = hasCustom ? 'Replace Banner Image' : 'Add Banner Image';
    }

    const deleteBtn = document.getElementById('modal-btn-delete-banner');
    if (deleteBtn) {
      deleteBtn.style.display = hasCustom ? 'inline-flex' : 'none';
    }

    const currentImg = document.getElementById('modal-current-banner-img');
    if (currentImg) {
      currentImg.src = hasCustom ? current.imageUrl : 'assets/panchayat-building.png';
    }

    cancelStagedBanner();
    modal.classList.add('active');
  };

  window.closeAdminBannerModal = function() {
    const modal = document.getElementById('admin-banner-mgmt-modal');
    if (modal) modal.classList.remove('active');
    cancelStagedBanner();
  };

})();
