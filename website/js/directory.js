/**
 * JANASEVA – Gram Panchayat Directory Logic
 * Full CRUD Capabilities: Add, Edit, Delete, File Attachment, CSV Export & Import.
 */

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('directory-table-body');
  const searchInput = document.getElementById('dir-search-input');
  const districtFilter = document.getElementById('dir-district-filter');
  const blockFilter = document.getElementById('dir-block-filter');
  const searchBtn = document.getElementById('dir-search-btn');
  const totalBadge = document.getElementById('total-panchayats-count');
  const paginationWrap = document.getElementById('directory-pagination');

  // Toolbar Buttons
  const openAddBtn = document.getElementById('open-add-panchayat-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const importFileBtn = document.getElementById('import-file-btn');
  const importFileInput = document.getElementById('import-file-input');
  const resetBtn = document.getElementById('reset-panchayats-btn');

  let panchayats = JanasevaDB.get('panchayats', []);
  let filteredData = [...panchayats];
  let currentPage = 1;
  const itemsPerPage = 5;

  function isDirAdmin() {
    return Boolean(window.authService && typeof window.authService.isAdmin === 'function' && window.authService.isAdmin());
  }

  function applyDirAdminRoleUI() {
    const admin = isDirAdmin();
    if (openAddBtn) openAddBtn.style.display = admin ? 'inline-flex' : 'none';
    if (importFileBtn) importFileBtn.style.display = admin ? 'inline-flex' : 'none';
    if (resetBtn) resetBtn.style.display = admin ? 'inline-flex' : 'none';

    document.querySelectorAll('.btn-edit-action, .btn-delete-action').forEach((el) => {
      el.style.display = admin ? 'inline-flex' : 'none';
    });
    const mEdit = document.getElementById('modal-trigger-edit-btn');
    const mDel = document.getElementById('modal-trigger-delete-btn');
    if (mEdit) mEdit.style.display = admin ? 'inline-flex' : 'none';
    if (mDel) mDel.style.display = admin ? 'inline-flex' : 'none';
  }

  // 1. Initialize Filters Dropdown
  function initFilters() {
    const districts = Array.from(new Set(panchayats.map(p => p.district))).filter(Boolean);
    const blocks = Array.from(new Set(panchayats.map(p => p.block))).filter(Boolean);

    if (districtFilter) {
      const curDist = districtFilter.value;
      districtFilter.innerHTML = '<option value="">All Districts</option>' +
        districts.map(d => `<option value="${d}" ${d === curDist ? 'selected' : ''}>${d}</option>`).join('');
    }

    if (blockFilter) {
      const curBlk = blockFilter.value;
      blockFilter.innerHTML = '<option value="">All Blocks / Taluks</option>' +
        blocks.map(b => `<option value="${b}" ${b === curBlk ? 'selected' : ''}>${b}</option>`).join('');
    }
  }

  // 2. Filter & Search Logic
  function applyFilters() {
    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const dist = districtFilter ? districtFilter.value : '';
    const blk = blockFilter ? blockFilter.value : '';

    filteredData = panchayats.filter(item => {
      const matchTerm = !term || 
        (item.name || '').toLowerCase().includes(term) ||
        (item.block || '').toLowerCase().includes(term) ||
        (item.district || '').toLowerCase().includes(term) ||
        (item.officeAddress && item.officeAddress.toLowerCase().includes(term)) ||
        (item.announcementText && item.announcementText.toLowerCase().includes(term));
      
      const matchDist = !dist || item.district === dist;
      const matchBlk = !blk || item.block === blk;

      return matchTerm && matchDist && matchBlk;
    });

    currentPage = 1;
    renderTable();
  }

  // 3. Render Table Rows with View, Edit, and Delete options
  function renderTable() {
    if (!tableBody) return;

    if (totalBadge) {
      totalBadge.innerHTML = `<i class="fa-solid fa-users"></i> Total Panchayats: ${panchayats.length}`;
    }

    if (filteredData.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px 16px; color: #64748b;">
            <i class="fa-solid fa-folder-open" style="font-size: 34px; margin-bottom: 8px; color: #94a3b8; display: block;"></i>
            No Gram Panchayats found matching your criteria.
          </td>
        </tr>
      `;
      renderPagination(0);
      return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

    tableBody.innerHTML = pageItems.map((gp, idx) => {
      const displayIndex = startIndex + idx + 1;
      const hasFile = gp.attachedFileName;
      const hasNotice = gp.announcementText;

      return `
        <tr>
          <td style="width: 40px;">
            <div class="table-num-bubble">${displayIndex}</div>
          </td>
          <td>
            <div class="gp-name-cell">
              <i class="fa-solid fa-landmark" style="color: #0f56b3;"></i>
              <div>
                <span>${gp.name}</span>
                ${hasNotice ? `<div style="font-size: 11px; color: #d97706; font-weight: 600;"><i class="fa-solid fa-bullhorn"></i> Notice available</div>` : ''}
                ${hasFile ? `<div style="font-size: 11px; color: #0284c7; font-weight: 600;"><i class="fa-solid fa-paperclip"></i> ${gp.attachedFileName}</div>` : ''}
              </div>
            </div>
          </td>
          <td>${gp.block}</td>
          <td>${gp.district}</td>
          <td>
            <div class="gp-contact-cell">
              <span><i class="fa-solid fa-phone" style="color: #0f56b3; font-size: 11px;"></i> ${gp.contactNumber}</span>
              <span><i class="fa-solid fa-envelope" style="color: #0f56b3; font-size: 11px;"></i> ${gp.receiverEmail}</span>
            </div>
          </td>
          <td>
            <div class="btn-action-group">
              <button type="button" class="btn-view-details" onclick="openPanchayatDetails('${gp.panchayatId}')" title="View full information">
                <i class="fa-solid fa-eye"></i> View
              </button>
              <button type="button" class="btn-edit-action" onclick="openEditPanchayatModal('${gp.panchayatId}')" title="Edit Panchayat details">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
              <button type="button" class="btn-delete-action" onclick="openDeletePanchayatModal('${gp.panchayatId}')" title="Delete Panchayat">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    renderPagination(filteredData.length);
    applyDirAdminRoleUI();
    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }
  }

  // 4. Render Pagination Controls
  function renderPagination(totalCount) {
    if (!paginationWrap) return;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    if (totalPages <= 1) {
      paginationWrap.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changeDirPage(${currentPage - 1})">
        &laquo; Previous
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changeDirPage(${i})">
          ${i}
        </button>
      `;
    }

    html += `
      <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changeDirPage(${currentPage + 1})">
        Next &raquo;
      </button>
    `;

    paginationWrap.innerHTML = html;
  }

  window.changeDirPage = function(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
  };

  // Event Listeners for Search & Filter
  if (searchBtn) searchBtn.addEventListener('click', applyFilters);
  if (searchInput) searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') applyFilters();
  });
  if (districtFilter) districtFilter.addEventListener('change', applyFilters);
  if (blockFilter) blockFilter.addEventListener('change', applyFilters);

  // 5. ADD NEW PANCHAYAT MODAL HANDLERS (Admin Only)
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      if (!isDirAdmin()) {
        showToast('Unauthorized: Only Administrators may add Gram Panchayats.', 'error');
        return;
      }
      document.getElementById('add-panchayat-form').reset();
      document.getElementById('add-panchayat-modal').classList.add('active');
    });
  }

  const addForm = document.getElementById('add-panchayat-form');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isDirAdmin()) {
        showToast('Unauthorized: Only Administrators may add Gram Panchayats.', 'error');
        return;
      }

      const name = document.getElementById('add-gp-name').value.trim();
      const block = document.getElementById('add-gp-block').value.trim();
      const district = document.getElementById('add-gp-district').value.trim();
      const phone = document.getElementById('add-gp-phone').value.trim();
      const email = document.getElementById('add-gp-email').value.trim();
      const president = document.getElementById('add-gp-president').value.trim();
      const secretary = document.getElementById('add-gp-secretary').value.trim();
      const address = document.getElementById('add-gp-address').value.trim();
      const notice = document.getElementById('add-gp-notice').value.trim();
      const fileInput = document.getElementById('add-gp-file');

      if (!name || !block || !district || !phone || !email) {
        showToast("Please fill in all required fields marked with *.", "warning");
        return;
      }

      const newId = 'gp-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

      let fileName = null;
      let fileData = null;

      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        fileName = file.name;
        fileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (re) => resolve(re.target.result);
          reader.readAsDataURL(file);
        });
      }

      const newGp = {
        panchayatId: newId,
        name: name,
        block: block,
        district: district,
        contactNumber: phone,
        receiverEmail: email,
        president: president || "Hon. Panchayat President",
        secretary: secretary || "Panchayat Development Officer (PDO)",
        officeAddress: address || `${name} Office, ${block} Taluk, ${district}`,
        announcementText: notice || null,
        attachedFileName: fileName,
        attachedFileData: fileData,
        createdAt: new Date().toISOString()
      };

      try {
        if (window.isFirebaseAvailable && window.fbDb) {
          await window.fbDb.collection('panchayats').doc(newId).set(newGp);
        }
        panchayats.unshift(newGp);
        JanasevaDB.set('panchayats', panchayats);
        showToast(`Panchayat "${name}" added successfully!`, "success");
        closeAddPanchayatModal();
        initFilters();
        applyFilters();
      } catch (err) {
        showToast(`Failed to save Panchayat: ${err.message}`, "error");
      }
    });
  }

  // 6. EDIT PANCHAYAT MODAL HANDLERS (Admin Only)
  const editForm = document.getElementById('edit-panchayat-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isDirAdmin()) {
        showToast('Unauthorized: Only Administrators may modify Gram Panchayats.', 'error');
        return;
      }
      const id = document.getElementById('edit-gp-id').value;
      const gp = panchayats.find(p => p.panchayatId === id);
      if (!gp) return;

      const updatedGp = {
        ...gp,
        name: document.getElementById('edit-gp-name').value.trim(),
        block: document.getElementById('edit-gp-block').value.trim(),
        district: document.getElementById('edit-gp-district').value.trim(),
        contactNumber: document.getElementById('edit-gp-phone').value.trim(),
        receiverEmail: document.getElementById('edit-gp-email').value.trim(),
        president: document.getElementById('edit-gp-president').value.trim(),
        secretary: document.getElementById('edit-gp-secretary').value.trim(),
        officeAddress: document.getElementById('edit-gp-address').value.trim(),
        announcementText: document.getElementById('edit-gp-notice').value.trim() || null
      };

      const fileInput = document.getElementById('edit-gp-file');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        updatedGp.attachedFileName = file.name;
        updatedGp.attachedFileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (re) => resolve(re.target.result);
          reader.readAsDataURL(file);
        });
      }

      try {
        if (window.isFirebaseAvailable && window.fbDb) {
          await window.fbDb.collection('panchayats').doc(updatedGp.panchayatId).update(updatedGp);
        }
        Object.assign(gp, updatedGp);
        JanasevaDB.set('panchayats', panchayats);
        showToast(`Panchayat "${gp.name}" updated successfully!`, "success");
        closeEditPanchayatModal();
        initFilters();
        renderTable();
      } catch (err) {
        showToast(`Failed to update Panchayat: ${err.message}`, "error");
      }
    });
  }

  // 7. DELETE PANCHAYAT MODAL HANDLER (Admin Only)
  let pendingDeleteId = null;
  window.openDeletePanchayatModal = function(gpId) {
    if (!isDirAdmin()) {
      showToast('Unauthorized: Only Administrators may delete Gram Panchayats.', 'error');
      return;
    }
    const gp = panchayats.find(p => p.panchayatId === gpId);
    if (!gp) return;
    pendingDeleteId = gpId;
    document.getElementById('delete-gp-name-display').innerText = `"${gp.name}"`;
    document.getElementById('delete-panchayat-modal').classList.add('active');
    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }
  };

  const confirmDeleteBtn = document.getElementById('confirm-delete-gp-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!isDirAdmin()) {
        showToast('Unauthorized: Only Administrators may delete Gram Panchayats.', 'error');
        return;
      }
      if (!pendingDeleteId) return;
      const idx = panchayats.findIndex(p => p.panchayatId === pendingDeleteId);
      if (idx !== -1) {
        try {
          if (window.isFirebaseAvailable && window.fbDb) {
            await window.fbDb.collection('panchayats').doc(pendingDeleteId).delete();
          }
          const deleted = panchayats.splice(idx, 1)[0];
          JanasevaDB.set('panchayats', panchayats);
          showToast(`Panchayat "${deleted.name}" deleted.`, "info");
        } catch (err) {
          showToast(`Failed to delete Panchayat: ${err.message}`, "error");
          return;
        }
      }
      closeDeleteModal();
      closePanchayatModal();
      initFilters();
      applyFilters();
    });
  }

  // 8. EXPORT DIRECTORY TO CSV FILE
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      let csv = 'Panchayat Name,Block / Taluk,District,Contact Number,Receiver Email,President,Secretary,Office Address,Announcements\n';
      panchayats.forEach(p => {
        const row = [
          `"${p.name || ''}"`,
          `"${p.block || ''}"`,
          `"${p.district || ''}"`,
          `"${p.contactNumber || ''}"`,
          `"${p.receiverEmail || ''}"`,
          `"${p.president || ''}"`,
          `"${p.secretary || ''}"`,
          `"${p.officeAddress || ''}"`,
          `"${p.announcementText || ''}"`
        ];
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `janaseva_panchayats_directory_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Directory exported to CSV file successfully!", "success");
    });
  }

  // 9. IMPORT NEW FILE (CSV or JSON)
  if (importFileBtn && importFileInput) {
    importFileBtn.addEventListener('click', () => importFileInput.click());

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          let newRecords = [];

          if (file.name.endsWith('.json')) {
            newRecords = JSON.parse(content);
          } else {
            // Parse CSV
            const lines = content.split('\n').filter(l => l.trim().length > 0);
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
              if (cols[0]) {
                newRecords.push({
                  panchayatId: 'gp-' + Date.now().toString(36) + i,
                  name: cols[0],
                  block: cols[1] || "Bantwal",
                  district: cols[2] || "Dakshina Kannada",
                  contactNumber: cols[3] || "+91 82455 00000",
                  receiverEmail: cols[4] || "",
                  president: cols[5] || "Hon. President",
                  secretary: cols[6] || "Panchayat Development Officer",
                  officeAddress: cols[7] || "Gram Panchayat Office",
                  announcementText: cols[8] || null
                });
              }
            }
          }

          if (newRecords.length > 0) {
            panchayats.unshift(...newRecords);
            JanasevaDB.set('panchayats', panchayats);
            showToast(`Successfully imported ${newRecords.length} Panchayats from file!`, "success");
            initFilters();
            applyFilters();
          } else {
            showToast("No valid records found in file.", "warning");
          }
        } catch (err) {
          showToast("Failed to parse file: " + err.message, "error");
        } finally {
          importFileInput.value = '';
        }
      };
      reader.readAsText(file);
    });
  }

  // 10. USM DIRECTORY REFRESH & ADMIN RESET
  if (window.JanasevaSettings) {
    window.JanasevaSettings.registerSection({
      sectionId: 'directory-settings',
      sectionName: 'Gram Panchayat Directory',
      containerEl: '.directory-table-card',
      statusHostEl: '#directory-usm-status',
      resetBtn: '#reset-panchayats-btn',
      refreshBtn: '#refresh-directory-btn',
      readOnly: true,
      trackInputs: false,
      confirmResetTitle: 'Reset Directory to Default 12 Gram Panchayats?',
      confirmResetMessage: 'This restores the verified baseline list of 12 Dakshina Kannada Gram Panchayats.',
      confirmResetDetail: 'Scope: Only resets custom directory entries back to defaults. Existing citizen complaints remain untouched.',
      onReset: async () => {
        if (!isDirAdmin()) {
          throw new Error('Unauthorized: Only Administrators may reset the directory.');
        }
        if (typeof JanasevaDB !== 'undefined' && typeof JanasevaDB.resetPanchayats === 'function') {
          JanasevaDB.resetPanchayats();
        } else {
          localStorage.removeItem('JANASEVA_panchayats');
        }
        panchayats = JanasevaDB.get('panchayats', []);
        initFilters();
        applyFilters();
        return {
          savedAt: new Date().toISOString(),
          message: 'Directory reset to default 12 Gram Panchayats.'
        };
      },
      onRefresh: async () => {
        if (window.isFirebaseAvailable && window.fbDb) {
          const snap = await window.fbDb.collection('panchayats').get();
          const remote = [];
          snap.forEach((doc) => remote.push({ panchayatId: doc.id, ...doc.data() }));
          if (remote.length > 0) {
            panchayats = remote;
            JanasevaDB.set('panchayats', panchayats);
          }
        } else {
          panchayats = JanasevaDB.get('panchayats', []);
        }
        initFilters();
        applyFilters();
        return {
          refreshedAt: new Date().toISOString(),
          message: 'Gram Panchayat directory reloaded from database.'
        };
      }
    });
  } else if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!isDirAdmin()) {
        showToast('Unauthorized: Only Administrators may reset the directory.', 'error');
        return;
      }
      if ((window.janasevaConfirm || confirm)("Reset directory to the original 12 verified Gram Panchayats?")) {
        if (typeof JanasevaDB !== 'undefined' && typeof JanasevaDB.resetPanchayats === 'function') {
          JanasevaDB.resetPanchayats();
        } else {
          localStorage.removeItem('JANASEVA_panchayats');
        }
        panchayats = JanasevaDB.get('panchayats', []);
        initFilters();
        applyFilters();
        showToast("Directory reset to default 12 Gram Panchayats.", "info");
      }
    });
  }

  // Initial Run
  async function loadDirectoryData() {
    if (window.JanasevaMongoDB) {
      try {
        const mongoGps = await window.JanasevaMongoDB.getPanchayats();
        if (mongoGps && mongoGps.length > 0) {
          panchayats = mongoGps;
          filteredData = [...panchayats];
          JanasevaDB.set('panchayats', panchayats);
        }
      } catch (e) {
        console.warn("MongoDB panchayats fetch caught:", e);
      }
    }
    initFilters();
    applyFilters();
  }
  loadDirectoryData();
  window.addEventListener('janaseva:mongoReady', loadDirectoryData);
  window.addEventListener('janaseva:authChanged', applyDirAdminRoleUI);
  if (window.authService && typeof window.authService.waitForAuth === 'function') {
    window.authService.waitForAuth().then(applyDirAdminRoleUI);
  }

  window.addEventListener('janaseva:langChanged', () => {
    const prevDist = districtFilter ? districtFilter.value : '';
    const prevBlk = blockFilter ? blockFilter.value : '';
    initFilters();
    if (districtFilter && prevDist) districtFilter.value = prevDist;
    if (blockFilter && prevBlk) blockFilter.value = prevBlk;
    applyFilters();
    if (window.janasevaTranslator) {
      window.janasevaTranslator.applyTranslations();
    }
  });
});

// ============================================================================
// GLOBAL MODAL TRIGGERS
// ============================================================================

// 1. Open View Details Modal
window.openPanchayatDetails = function(gpId) {
  const panchayats = JanasevaDB.get('panchayats', []);
  const gp = panchayats.find(p => p.panchayatId === gpId);
  if (!gp) return;

  const modal = document.getElementById('panchayat-details-modal');
  if (!modal) return;

  document.getElementById('modal-gp-name').innerText = gp.name;
  document.getElementById('modal-gp-block').innerText = gp.block;
  document.getElementById('modal-gp-district').innerText = gp.district;
  document.getElementById('modal-gp-phone').innerText = gp.contactNumber;
  document.getElementById('modal-gp-email').innerText = gp.receiverEmail;
  document.getElementById('modal-gp-address').innerText = gp.officeAddress || "Gram Panchayat Office, Taluk Office Road";
  document.getElementById('modal-gp-president').innerText = gp.president || "Hon. Panchayat President";
  document.getElementById('modal-gp-secretary').innerText = gp.secretary || "Panchayat Development Officer (PDO)";

  // Announcement Text
  const noticeBox = document.getElementById('modal-announcement-container');
  const noticeText = document.getElementById('modal-announcement-text');
  if (noticeBox && noticeText) {
    if (gp.announcementText) {
      noticeText.innerText = gp.announcementText;
      noticeBox.style.display = 'block';
    } else {
      noticeBox.style.display = 'none';
    }
  }

  // Attached Document / File
  const fileBox = document.getElementById('modal-file-container');
  const fileNameEl = document.getElementById('modal-file-name');
  const downloadBtn = document.getElementById('modal-download-file-btn');
  if (fileBox && fileNameEl && downloadBtn) {
    if (gp.attachedFileName) {
      fileNameEl.innerText = gp.attachedFileName;
      downloadBtn.href = gp.attachedFileData || '#';
      downloadBtn.download = gp.attachedFileName;
      fileBox.style.display = 'block';
    } else {
      fileBox.style.display = 'none';
    }
  }

  // Bind Edit & Delete buttons inside details modal (Admin Only)
  const isAdminUser = Boolean(window.authService && typeof window.authService.isAdmin === 'function' && window.authService.isAdmin());
  const editBtn = document.getElementById('modal-trigger-edit-btn');
  if (editBtn) {
    editBtn.style.display = isAdminUser ? 'inline-flex' : 'none';
    editBtn.onclick = () => {
      closePanchayatModal();
      openEditPanchayatModal(gpId);
    };
  }

  const deleteBtn = document.getElementById('modal-trigger-delete-btn');
  if (deleteBtn) {
    deleteBtn.style.display = isAdminUser ? 'inline-flex' : 'none';
    deleteBtn.onclick = () => {
      closePanchayatModal();
      openDeletePanchayatModal(gpId);
    };
  }

  const lodgeBtn = document.getElementById('modal-lodge-complaint-btn');
  if (lodgeBtn) {
    lodgeBtn.href = `complaint.html?gp=${gp.panchayatId}`;
  }

  modal.classList.add('active');
  if (window.janasevaTranslator) {
    window.janasevaTranslator.applyTranslations();
  }
};

window.closePanchayatModal = function() {
  const modal = document.getElementById('panchayat-details-modal');
  if (modal) modal.classList.remove('active');
};

// 2. Open Edit Panchayat Modal (Admin Only)
window.openEditPanchayatModal = function(gpId) {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast('Unauthorized: Only Administrators may edit Gram Panchayats.', 'error');
    return;
  }
  const panchayats = JanasevaDB.get('panchayats', []);
  const gp = panchayats.find(p => p.panchayatId === gpId);
  if (!gp) return;

  const modal = document.getElementById('edit-panchayat-modal');
  if (!modal) return;

  document.getElementById('edit-gp-id').value = gp.panchayatId;
  document.getElementById('edit-gp-name').value = gp.name;
  document.getElementById('edit-gp-block').value = gp.block;
  document.getElementById('edit-gp-district').value = gp.district;
  document.getElementById('edit-gp-phone').value = gp.contactNumber;
  document.getElementById('edit-gp-email').value = gp.receiverEmail;
  document.getElementById('edit-gp-president').value = gp.president || '';
  document.getElementById('edit-gp-secretary').value = gp.secretary || '';
  document.getElementById('edit-gp-address').value = gp.officeAddress || '';
  document.getElementById('edit-gp-notice').value = gp.announcementText || '';

  const fileBadge = document.getElementById('edit-current-file-badge');
  const fileName = document.getElementById('edit-current-file-name');
  if (fileBadge && fileName) {
    if (gp.attachedFileName) {
      fileName.innerText = gp.attachedFileName;
      fileBadge.style.display = 'block';
    } else {
      fileBadge.style.display = 'none';
    }
  }

  modal.classList.add('active');
  if (window.janasevaTranslator) {
    window.janasevaTranslator.applyTranslations();
  }
};

window.closeEditPanchayatModal = function() {
  const modal = document.getElementById('edit-panchayat-modal');
  if (modal) modal.classList.remove('active');
};

// 3. Add Modal Controls
window.closeAddPanchayatModal = function() {
  const modal = document.getElementById('add-panchayat-modal');
  if (modal) modal.classList.remove('active');
};

// 4. Delete Modal Controls
window.closeDeleteModal = function() {
  const modal = document.getElementById('delete-panchayat-modal');
  if (modal) modal.classList.remove('active');
};
