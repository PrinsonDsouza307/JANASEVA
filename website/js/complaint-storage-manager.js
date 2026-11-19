/**
 * JANASEVA – Comprehensive Complaint Storage, Update Folder & Recycle Bin Manager
 * 
 * Provides unified, production-grade management for:
 * 1. Automatic permanent complaint storage and synchronization
 * 2. Dedicated Complaint Updates Folder with 8-state organization
 * 3. Recycle Bin with safe soft-deletion, restoration, and protected permanent purge
 * 4. Duplicate complaint detection and flagged review
 * 5. Comprehensive Activity Audit Logging (activity_logs)
 * 6. Multi-format reporting (CSV & printable PDF summary)
 */

(function(window) {
  'use strict';

  class ComplaintStorageManager {
    constructor() {
      this.initialized = false;
      this.init();
    }

    init() {
      if (this.initialized) return;
      this.ensureDataStructures();
      this.initialized = true;
    }

    /**
     * Ensure all required collections / local stores exist
     */
    ensureDataStructures() {
      if (typeof window.JanasevaDB === 'undefined') return;

      if (!window.JanasevaDB.get('complaint_updates')) {
        window.JanasevaDB.set('complaint_updates', []);
      }
      if (!window.JanasevaDB.get('recycle_bin')) {
        window.JanasevaDB.set('recycle_bin', []);
      }
      if (!window.JanasevaDB.get('activity_logs')) {
        window.JanasevaDB.set('activity_logs', []);
      }
      if (!window.JanasevaDB.get('complaint_attachments')) {
        window.JanasevaDB.set('complaint_attachments', []);
      }
      if (!window.JanasevaDB.get('complaint_assignments')) {
        window.JanasevaDB.set('complaint_assignments', []);
      }
      if (!window.JanasevaDB.get('notifications')) {
        window.JanasevaDB.set('notifications', []);
      }
    }

    /**
     * Format Indian Standard Time Date
     */
    formatDate(date = new Date()) {
      return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    }

    /**
     * Generate unique identifier
     */
    generateId(prefix = 'item') {
      return `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    /**
     * Get Current Actor Information
     */
    getCurrentActor() {
      const user = window.authService?.currentUser;
      return {
        email: user?.email || '',
        name: user?.name || 'Authorized Official',
        role: user?.role || 'admin',
        uid: user?.uid || 'usr-system'
      };
    }

    // ========================================================================
    // 1. COMPLAINT UPDATES FOLDER MANAGEMENT
    // ========================================================================

    /**
     * Record an update entry in the dedicated Complaint Updates Folder
     */
    async recordComplaintUpdate(complaint, updateDetails) {
      if (!complaint || !complaint.complaintId) return null;

      const actor = updateDetails.actor || this.getCurrentActor();
      const nowISO = new Date().toISOString();
      const nowFormatted = this.formatDate();

      const updateRecord = {
        updateId: this.generateId('upd'),
        complaintId: complaint.complaintId,
        citizenName: complaint.citizenName || 'Citizen',
        citizenEmail: complaint.citizenEmail || '',
        category: complaint.category || 'General',
        panchayatId: complaint.panchayatId || '',
        panchayatName: complaint.panchayatName || 'Gram Panchayat',
        oldStatus: updateDetails.oldStatus || null,
        newStatus: updateDetails.newStatus || complaint.status || 'Submitted',
        updateType: updateDetails.updateType || 'STATUS_CHANGE',
        remarks: updateDetails.remarks || updateDetails.officialResponse || complaint.officialResponse || '',
        resolutionDetails: updateDetails.resolutionDetails || (updateDetails.newStatus === 'Resolved' ? (complaint.officialResponse || 'Issue resolved successfully') : null),
        authorName: actor.name,
        authorEmail: actor.email,
        authorRole: actor.role,
        authorUid: actor.uid || '',
        timestamp: nowISO,
        formattedDate: nowFormatted
      };

      // 1. Save to JanasevaDB
      if (typeof window.JanasevaDB !== 'undefined') {
        const updates = window.JanasevaDB.get('complaint_updates', []);
        updates.unshift(updateRecord);
        window.JanasevaDB.set('complaint_updates', updates);
      }

      // 2. Save to Firebase Firestore
      if (window.isFirebaseAvailable && window.fbDb) {
        try {
          await window.fbDb.collection('complaint_updates').doc(updateRecord.updateId).set(updateRecord);
          // Also link inside subcollection
          await window.fbDb.collection('complaints').doc(complaint.complaintId).collection('updates').doc(updateRecord.updateId).set(updateRecord);
        } catch (err) {
          console.warn('[ComplaintStorageManager] Firestore update record warning:', err);
        }
      }

      // 3. Log Activity
      this.recordActivity(
        'STATUS_UPDATED',
        complaint.complaintId,
        `Status transitioned from "${updateRecord.oldStatus || 'Initial'}" to "${updateRecord.newStatus}". Remarks: ${updateRecord.remarks.substring(0, 80)}`,
        actor
      );

      return updateRecord;
    }

    /**
     * Record a work progress update on a complaint
     */
    async recordWorkProgressUpdate(complaint, workProgressData, actor = null) {
      if (!complaint || !complaint.complaintId) return null;

      const userActor = actor || this.getCurrentActor();
      const nowISO = new Date().toISOString();
      const nowFormatted = this.formatDate();

      const progressRecord = {
        percentage: Number(workProgressData.percentage || 0),
        stage: workProgressData.stage || 'Not Started',
        workDescription: workProgressData.workDescription || '',
        completedWork: workProgressData.completedWork || '',
        remainingWork: workProgressData.remainingWork || '',
        delayReason: workProgressData.delayReason || '',
        nextAction: workProgressData.nextAction || '',
        photoUrl: workProgressData.photoUrl || '',
        lastUpdated: nowFormatted,
        lastUpdatedISO: nowISO,
        updatedBy: userActor.email,
        updatedByName: userActor.name,
        updatedByRole: userActor.role
      };

      complaint.workProgress = progressRecord;
      complaint.updatedAt = nowFormatted;

      // Update in JanasevaDB
      if (typeof window.JanasevaDB !== 'undefined') {
        const complaints = window.JanasevaDB.get('complaints', []);
        const idx = complaints.findIndex(c => (c.complaintId || c.id) === complaint.complaintId);
        if (idx >= 0) {
          complaints[idx].workProgress = progressRecord;
          complaints[idx].updatedAt = nowFormatted;
          window.JanasevaDB.set('complaints', complaints);
        }
      }

      // Record in complaint_updates folder
      const updateRemarks = `Work Progress updated to ${progressRecord.percentage}% (${progressRecord.stage}). ${progressRecord.completedWork ? 'Work: ' + progressRecord.completedWork : ''} ${progressRecord.delayReason ? 'Delay: ' + progressRecord.delayReason : ''}`.trim();
      const encodedProgress = 'WORK_PROGRESS_JSON:' + JSON.stringify(progressRecord).slice(0, 3800);

      await this.recordComplaintUpdate(complaint, {
        oldStatus: complaint.status,
        newStatus: complaint.status,
        updateType: 'WORK_PROGRESS_UPDATE',
        remarks: updateRemarks,
        resolutionDetails: encodedProgress,
        actor: userActor
      });

      this.recordActivity(
        'WORK_PROGRESS_UPDATED',
        complaint.complaintId,
        `Progress updated to ${progressRecord.percentage}% by ${userActor.email} (${userActor.role})`,
        userActor
      );

      return progressRecord;
    }

    /**
     * Extract the latest Work Progress record from a list of complaint_updates
     */
    extractWorkProgressFromUpdates(updates = []) {
      if (!Array.isArray(updates) || updates.length === 0) return null;
      // Sort chronologically newest last
      const sorted = [...updates].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      let latest = null;
      for (const u of sorted) {
        if (u && typeof u.resolutionDetails === 'string' && u.resolutionDetails.startsWith('WORK_PROGRESS_JSON:')) {
          try {
            latest = JSON.parse(u.resolutionDetails.slice('WORK_PROGRESS_JSON:'.length));
          } catch (e) {
            // ignore parse failure
          }
        }
      }
      return latest;
    }

    /**
     * Determine citizen soft-delete status from complaint_updates history
     */
    getCitizenSoftDeleteState(updates = []) {
      if (!Array.isArray(updates) || updates.length === 0) {
        return { isDeleted: false };
      }
      const sorted = [...updates].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      let state = { isDeleted: false };
      for (const u of sorted) {
        if (u.updateType === 'CITIZEN_SOFT_DELETE') {
          let meta = {};
          if (typeof u.resolutionDetails === 'string' && u.resolutionDetails.startsWith('SOFT_DELETE_JSON:')) {
            try { meta = JSON.parse(u.resolutionDetails.slice('SOFT_DELETE_JSON:'.length)); } catch (e) {}
          }
          state = {
            isDeleted: true,
            deletedAt: meta.deletedAt || u.timestamp,
            formattedDeletedAt: u.formattedDate || this.formatDate(u.timestamp),
            deletedBy: u.authorEmail || u.authorName || 'Citizen',
            deletedByRole: u.authorRole || 'citizen',
            reason: meta.reason || u.remarks || 'Citizen deleted complaint'
          };
        } else if (u.updateType === 'COMPLAINT_RESTORED') {
          state = { isDeleted: false };
        }
      }
      return state;
    }

    /**
     * Retrieve all Complaint Updates with flexible multi-filtering
     */
    async getAllComplaintUpdates(filters = {}) {
      let updates = [];

      // Try local DB first
      if (typeof window.JanasevaDB !== 'undefined') {
        updates = window.JanasevaDB.get('complaint_updates', []);
      }

      // If empty and Firestore available, fetch from cloud with role-appropriate query
      if (updates.length === 0 && window.isFirebaseAvailable && window.fbDb) {
        try {
          const currentUser = window.authService?.currentUser;
          let snap = null;
          if (currentUser && currentUser.role === 'admin') {
            snap = await window.fbDb.collection('complaint_updates').orderBy('timestamp', 'desc').limit(200).get();
          } else if (currentUser && currentUser.role === 'receiver' && currentUser.panchayatId) {
            snap = await window.fbDb.collection('complaint_updates').where('panchayatId', '==', currentUser.panchayatId).limit(200).get();
          } else if (currentUser && currentUser.uid) {
            snap = await window.fbDb.collection('complaint_updates').where('authorUid', '==', currentUser.uid).limit(200).get();
          }
          if (snap && !snap.empty) {
            updates = snap.docs.map(doc => doc.data()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            if (typeof window.JanasevaDB !== 'undefined') {
              window.JanasevaDB.set('complaint_updates', updates);
            }
          }
        } catch (e) {
          console.warn('[ComplaintStorageManager] Firestore fetch updates warning:', e);
        }
      }

      // Synthesize missing initial updates from existing complaints if empty
      if (updates.length === 0 && typeof window.JanasevaDB !== 'undefined') {
        const complaints = window.JanasevaDB.get('complaints', []);
        complaints.forEach(c => {
          updates.push({
            updateId: 'upd-seed-' + c.complaintId,
            complaintId: c.complaintId,
            citizenName: c.citizenName || 'Citizen',
            citizenEmail: c.citizenEmail || '',
            category: c.category || 'General',
            panchayatId: c.panchayatId || '',
            panchayatName: c.panchayatName || 'Gram Panchayat',
            oldStatus: null,
            newStatus: c.status || 'Submitted',
            updateType: 'INITIAL_SUBMISSION',
            remarks: c.officialResponse || 'Initial grievance submitted into portal',
            resolutionDetails: c.status === 'Resolved' ? (c.officialResponse || 'Grievance resolved') : null,
            authorName: c.citizenName || 'Citizen',
            authorEmail: c.citizenEmail || '',
            authorRole: 'citizen',
            timestamp: c.submissionTimestamp || new Date().toISOString(),
            formattedDate: c.createdAt || c.submissionDate || this.formatDate()
          });
        });
        window.JanasevaDB.set('complaint_updates', updates);
      }

      // Apply Filters
      return updates.filter(u => {
        const isQuarantined = (u.inRecycleBin === true || u.deleted === true);

        // Folder filter (Dedicated Recycle Bin folder vs Active folders)
        if (filters.folder === 'RECYCLE_BIN') {
          if (!isQuarantined) return false;
        } else {
          // Standard folders or ALL must strictly exclude quarantined/deleted records
          if (isQuarantined) return false;

          if (filters.folder && filters.folder !== 'ALL') {
            const folderMatch = this.matchesFolderCategory(u.newStatus, filters.folder);
            if (!folderMatch) return false;
          }
        }

        // Status filter
        if (filters.status && filters.status !== 'ALL') {
          if ((u.newStatus || '').toLowerCase() !== filters.status.toLowerCase()) return false;
        }

        // Panchayat filter
        if (filters.panchayatId && filters.panchayatId !== 'ALL') {
          if (u.panchayatId !== filters.panchayatId && u.panchayatName !== filters.panchayatId) return false;
        }

        // Category filter
        if (filters.category && filters.category !== 'ALL') {
          if ((u.category || '').toLowerCase() !== filters.category.toLowerCase()) return false;
        }

        // Search text (Complaint ID, Citizen, Remarks)
        if (filters.search) {
          const term = filters.search.toLowerCase().trim();
          const matchId = (u.complaintId || '').toLowerCase().includes(term);
          const matchUpdId = (u.updateId || '').toLowerCase().includes(term);
          const matchCitizen = (u.citizenName || '').toLowerCase().includes(term);
          const matchEmail = (u.citizenEmail || '').toLowerCase().includes(term);
          const matchRemarks = (u.remarks || '').toLowerCase().includes(term);
          const matchAuthor = (u.authorName || '').toLowerCase().includes(term);
          if (!matchId && !matchUpdId && !matchCitizen && !matchEmail && !matchRemarks && !matchAuthor) return false;
        }

        // Date Range
        if (filters.fromDate) {
          const updateTime = new Date(u.timestamp).getTime();
          const fromTime = new Date(filters.fromDate).setHours(0, 0, 0, 0);
          if (updateTime < fromTime) return false;
        }
        if (filters.toDate) {
          const updateTime = new Date(u.timestamp).getTime();
          const toTime = new Date(filters.toDate).setHours(23, 59, 59, 999);
          if (updateTime > toTime) return false;
        }

        return true;
      });
    }

    /**
     * Map a complaint status to one of the 8 Folder categories
     */
    matchesFolderCategory(status, folderKey) {
      const st = (status || '').toLowerCase().trim();
      const fk = (folderKey || '').toUpperCase().trim();

      switch (fk) {
        case 'RECYCLE_BIN':
          return true;
        case 'NEW':
          return st === 'submitted';
        case 'RECEIVED':
          return st === 'received' || st === 'assigned' || st === 'under review';
        case 'IN_PROGRESS':
          return st === 'in progress' || st === 'action taken';
        case 'PENDING':
          return st === 'pending';
        case 'RESOLVED':
          return st === 'resolved';
        case 'REJECTED':
          return st === 'rejected';
        case 'REOPENED':
          return st === 'reopened';
        case 'ARCHIVED':
          return st === 'archived' || st === 'closed';
        default:
          return true;
      }
    }

    /**
     * Get Complete Chronological Update History for a specific Complaint
     */
    async getComplaintHistory(complaintId) {
      if (!complaintId) return [];
      const allUpdates = await this.getAllComplaintUpdates();
      return allUpdates
        .filter(u => u.complaintId === complaintId && !u.inRecycleBin && !u.deleted)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    /**
     * Soft-delete an individual complaint update record and move to Protected Recycle Bin
     */
    async deleteComplaintUpdate(updateId, reason = 'Administrative deletion', actor = null) {
      if (!updateId) throw new Error('Update ID is required');

      const userActor = actor || this.getCurrentActor();
      if (userActor.role !== 'admin') {
        throw new Error('Access Denied: Only authorized Administrators can delete complaint update records.');
      }

      let updates = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        updates = window.JanasevaDB.get('complaint_updates', []);
      }

      const idx = updates.findIndex(u => u.updateId === updateId);
      let updateRecord = null;

      if (idx !== -1) {
        updateRecord = updates[idx];
      } else if (window.isFirebaseAvailable && window.fbDb) {
        try {
          const snap = await window.fbDb.collection('complaint_updates').doc(updateId).get();
          if (snap.exists) updateRecord = snap.data();
        } catch (e) {
          console.warn('[ComplaintStorageManager] Firestore fetch update warning:', e);
        }
      }

      if (!updateRecord) {
        throw new Error(`Complaint update record "${updateId}" not found.`);
      }

      const nowISO = new Date().toISOString();
      const nowFormatted = this.formatDate();
      const recycleId = this.generateId('bin-upd');

      // Update record in-place with soft-delete metadata
      updateRecord.inRecycleBin = true;
      updateRecord.deleted = true;
      updateRecord.deletedAt = nowISO;
      updateRecord.formattedDeletedAt = nowFormatted;
      updateRecord.deletedBy = userActor.email;
      updateRecord.deletedByName = userActor.name;
      updateRecord.deletedByRole = userActor.role;
      updateRecord.deletionReason = reason;

      if (idx !== -1) {
        updates[idx] = updateRecord;
      } else {
        updates.push(updateRecord);
      }

      if (typeof window.JanasevaDB !== 'undefined') {
        window.JanasevaDB.set('complaint_updates', updates);
      }

      // Add to Recycle Bin
      const recycleBinItem = {
        recycleId: recycleId,
        itemType: 'COMPLAINT_UPDATE',
        updateId: updateRecord.updateId,
        complaintId: updateRecord.complaintId,
        originalStatus: updateRecord.newStatus || 'Submitted',
        updateData: { ...updateRecord },
        deletedBy: userActor.email,
        deletedByName: userActor.name,
        deletedByRole: userActor.role,
        deletedAt: nowISO,
        formattedDeletedAt: nowFormatted,
        reason: reason,
        status: 'IN_BIN'
      };

      if (typeof window.JanasevaDB !== 'undefined') {
        const bin = window.JanasevaDB.get('recycle_bin', []);
        bin.unshift(recycleBinItem);
        window.JanasevaDB.set('recycle_bin', bin);
      }

      // Sync with Firestore
      if (window.isFirebaseAvailable && window.fbDb) {
        try {
          await window.fbDb.collection('complaint_updates').doc(updateId).set(updateRecord);
          await window.fbDb.collection('recycle_bin').doc(recycleId).set(recycleBinItem);
        } catch (e) {
          console.warn('[ComplaintStorageManager] Firestore update soft-delete warning:', e);
        }
      }

      // Record Activity & Administrative Audit Log
      this.recordActivity(
        'COMPLAINT_UPDATE_MOVED_TO_RECYCLE_BIN',
        updateRecord.updateId,
        `Update record ${updateRecord.updateId} for complaint ${updateRecord.complaintId} moved to Recycle Bin by ${userActor.email}. Reason: ${reason}`,
        userActor
      );

      if (typeof window.recordAuditLog === 'function') {
        window.recordAuditLog({
          action: 'COMPLAINT_UPDATE_MOVED_TO_RECYCLE_BIN',
          targetId: updateRecord.updateId,
          complaintId: updateRecord.complaintId,
          details: `Moved complaint update record ${updateRecord.updateId} (Complaint: ${updateRecord.complaintId}) to Protected Recycle Bin. Reason: ${reason}`
        });
      }

      return { success: true, updateRecord, recycleBinItem };
    }

    /**
     * Bulk soft-delete complaint update records
     */
    async deleteComplaintUpdates(updateIds = [], reason = 'Bulk administrative deletion', actor = null) {
      if (!Array.isArray(updateIds) || updateIds.length === 0) {
        throw new Error('At least one update ID is required for bulk deletion.');
      }

      const userActor = actor || this.getCurrentActor();
      if (userActor.role !== 'admin') {
        throw new Error('Access Denied: Only authorized Administrators can delete complaint update records.');
      }

      const results = [];
      for (const id of updateIds) {
        try {
          const res = await this.deleteComplaintUpdate(id, reason, userActor);
          results.push(res);
        } catch (e) {
          console.error(`Error deleting update ${id}:`, e);
        }
      }

      return {
        success: true,
        total: updateIds.length,
        deletedCount: results.length,
        results
      };
    }

    /**
     * Restore complaint update record from Recycle Bin back to Active Updates
     */
    async restoreComplaintUpdate(updateIdOrRecycleId, actor = null) {
      if (!updateIdOrRecycleId) throw new Error('Update ID or Recycle ID is required');

      const userActor = actor || this.getCurrentActor();
      if (userActor.role !== 'admin') {
        throw new Error('Access Denied: Only authorized Administrators can restore complaint update records.');
      }

      let updates = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        updates = window.JanasevaDB.get('complaint_updates', []);
      }

      let updateIdx = updates.findIndex(u => u.updateId === updateIdOrRecycleId);
      let targetUpdate = updateIdx !== -1 ? updates[updateIdx] : null;

      // Also check recycle_bin
      let bin = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        bin = window.JanasevaDB.get('recycle_bin', []);
      }
      const binIdx = bin.findIndex(b => b.updateId === updateIdOrRecycleId || b.recycleId === updateIdOrRecycleId);
      let binItem = binIdx !== -1 ? bin[binIdx] : null;

      if (!targetUpdate && binItem && binItem.updateData) {
        targetUpdate = binItem.updateData;
      }

      if (!targetUpdate) {
        throw new Error(`Complaint update record "${updateIdOrRecycleId}" was not found.`);
      }

      const nowISO = new Date().toISOString();
      const nowFormatted = this.formatDate();

      // Clear deletion flags
      targetUpdate.inRecycleBin = false;
      targetUpdate.deleted = false;
      targetUpdate.deletedAt = null;
      targetUpdate.deletedBy = null;
      targetUpdate.deletionReason = null;
      targetUpdate.restoredAt = nowISO;
      targetUpdate.formattedRestoredAt = nowFormatted;
      targetUpdate.restoredBy = userActor.email;
      targetUpdate.restoredByName = userActor.name;

      if (updateIdx !== -1) {
        updates[updateIdx] = targetUpdate;
      } else {
        updates.unshift(targetUpdate);
      }

      if (typeof window.JanasevaDB !== 'undefined') {
        window.JanasevaDB.set('complaint_updates', updates);
      }

      // Remove from Recycle Bin
      if (binIdx !== -1) {
        bin.splice(binIdx, 1);
        if (typeof window.JanasevaDB !== 'undefined') {
          window.JanasevaDB.set('recycle_bin', bin);
        }
      }

      // Sync with Firestore
      if (window.isFirebaseAvailable && window.fbDb) {
        try {
          await window.fbDb.collection('complaint_updates').doc(targetUpdate.updateId).set(targetUpdate);
          if (binItem && binItem.recycleId) {
            await window.fbDb.collection('recycle_bin').doc(binItem.recycleId).delete();
          }
        } catch (e) {
          console.warn('[ComplaintStorageManager] Firestore update restore warning:', e);
        }
      }

      // Record Activity & Administrative Audit Log
      this.recordActivity(
        'COMPLAINT_UPDATE_RESTORED',
        targetUpdate.updateId,
        `Update record ${targetUpdate.updateId} for complaint ${targetUpdate.complaintId} restored to active folder by ${userActor.email}.`,
        userActor
      );

      if (typeof window.recordAuditLog === 'function') {
        window.recordAuditLog({
          action: 'COMPLAINT_UPDATE_RESTORED',
          targetId: targetUpdate.updateId,
          complaintId: targetUpdate.complaintId,
          details: `Restored complaint update record ${targetUpdate.updateId} (Complaint: ${targetUpdate.complaintId}) to active folder.`
        });
      }

      return { success: true, updateRecord: targetUpdate };
    }

    /**
     * Bulk restore complaint update records
     */
    async restoreComplaintUpdates(updateIds = [], actor = null) {
      if (!Array.isArray(updateIds) || updateIds.length === 0) {
        throw new Error('At least one update ID is required for bulk restore.');
      }

      const userActor = actor || this.getCurrentActor();
      if (userActor.role !== 'admin') {
        throw new Error('Access Denied: Only authorized Administrators can restore complaint update records.');
      }

      const results = [];
      for (const id of updateIds) {
        try {
          const res = await this.restoreComplaintUpdate(id, userActor);
          results.push(res);
        } catch (e) {
          console.error(`Error restoring update ${id}:`, e);
        }
      }

      return {
        success: true,
        total: updateIds.length,
        restoredCount: results.length,
        results
      };
    }

    /**
     * Permanently purge complaint update record (Irreversible Action)
     */
    async purgeComplaintUpdate(updateIdOrRecycleId, confirmationText = '', actor = null) {
      if (!updateIdOrRecycleId) throw new Error('Update ID or Recycle ID is required');

      const userActor = actor || this.getCurrentActor();
      if (userActor.role !== 'admin') {
        throw new Error('Access Denied: Only authorized Administrators can permanently delete records.');
      }

      if (confirmationText !== 'DELETE') {
        throw new Error('Explicit confirmation code "DELETE" required for permanent destruction.');
      }

      let updates = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        updates = window.JanasevaDB.get('complaint_updates', []);
      }

      const updateIdx = updates.findIndex(u => u.updateId === updateIdOrRecycleId);
      let targetRecord = null;
      if (updateIdx !== -1) {
        targetRecord = updates[updateIdx];
        updates.splice(updateIdx, 1);
        window.JanasevaDB.set('complaint_updates', updates);
      }

      // Also remove from Recycle Bin
      let bin = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        bin = window.JanasevaDB.get('recycle_bin', []);
      }
      const binIdx = bin.findIndex(b => b.updateId === updateIdOrRecycleId || b.recycleId === updateIdOrRecycleId);
      let binItem = null;
      if (binIdx !== -1) {
        binItem = bin[binIdx];
        if (!targetRecord && binItem.updateData) targetRecord = binItem.updateData;
        bin.splice(binIdx, 1);
        window.JanasevaDB.set('recycle_bin', bin);
      }

      const realUpdateId = targetRecord?.updateId || binItem?.updateId || updateIdOrRecycleId;
      const complaintId = targetRecord?.complaintId || binItem?.complaintId || 'UNKNOWN';

      // Firestore deletion
      if (window.isFirebaseAvailable && window.fbDb) {
        try {
          await window.fbDb.collection('complaint_updates').doc(realUpdateId).delete();
          if (binItem && binItem.recycleId) {
            await window.fbDb.collection('recycle_bin').doc(binItem.recycleId).delete();
          }
        } catch (e) {
          console.warn('[ComplaintStorageManager] Firestore update purge warning:', e);
        }
      }

      // Record Activity & Administrative Audit Log
      this.recordActivity(
        'COMPLAINT_UPDATE_PERMANENTLY_PURGED',
        realUpdateId,
        `Update record ${realUpdateId} (Complaint: ${complaintId}) permanently expunged by ${userActor.email}. Irreversible action executed.`,
        userActor
      );

      if (typeof window.recordAuditLog === 'function') {
        window.recordAuditLog({
          action: 'COMPLAINT_UPDATE_PERMANENTLY_PURGED',
          targetId: realUpdateId,
          complaintId: complaintId,
          details: `Permanently destroyed complaint update record ${realUpdateId} (Complaint: ${complaintId}) from database.`
        });
      }

      return { success: true, updateId: realUpdateId };
    }

    /**
     * Bulk permanent purge of complaint update records
     */
    async purgeComplaintUpdates(updateIds = [], confirmationText = '', actor = null) {
      if (!Array.isArray(updateIds) || updateIds.length === 0) {
        throw new Error('At least one update ID is required for bulk purge.');
      }

      const userActor = actor || this.getCurrentActor();
      if (userActor.role !== 'admin') {
        throw new Error('Access Denied: Only authorized Administrators can permanently delete records.');
      }

      if (confirmationText !== 'DELETE') {
        throw new Error('Explicit confirmation code "DELETE" required for permanent destruction.');
      }

      const results = [];
      for (const id of updateIds) {
        try {
          const res = await this.purgeComplaintUpdate(id, 'DELETE', userActor);
          results.push(res);
        } catch (e) {
          console.error(`Error purging update ${id}:`, e);
        }
      }

      return {
        success: true,
        total: updateIds.length,
        purgedCount: results.length,
        results
      };
    }

    // ========================================================================
    // 2. RECYCLE BIN & DELETION CONTROLS (SAFE TWO-STEP PROTECTION)
    // ========================================================================

    /**
     * Soft-delete complaint and move to Recycle Bin
     */
    async moveToRecycleBin(complaintId, reason = 'Administrative deletion', actor = null) {
      if (!complaintId) throw new Error('Complaint ID is required');

      const userActor = actor || this.getCurrentActor();
      const isAdmin = userActor.role === 'admin';
      const isCitizen = userActor.role === 'citizen';

      if (!isAdmin && !isCitizen) {
        throw new Error('Access Denied: Only Administrators and Citizens can move complaints to the Recycle Bin.');
      }

      // 1. Locate original complaint
      let complaints = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        complaints = window.JanasevaDB.get('complaints', []);
      }
      const targetIdx = complaints.findIndex(c => (c.complaintId || c.id) === complaintId);
      let complaintData = null;

      if (targetIdx !== -1) {
        complaintData = complaints[targetIdx];
        // Remove from active register
        complaints.splice(targetIdx, 1);
        window.JanasevaDB.set('complaints', complaints);
      } else if (window.isFirebaseAvailable && window.fbDb) {
        const snap = await window.fbDb.collection('complaints').doc(complaintId).get();
        if (snap.exists) complaintData = snap.data();
      }

      if (!complaintData) {
        throw new Error(`Complaint ${complaintId} was not found in active records.`);
      }

      // Verify Citizen Ownership
      if (isCitizen) {
        const isOwner = (complaintData.userId && complaintData.userId === userActor.uid) ||
                        (complaintData.citizenUid && complaintData.citizenUid === userActor.uid) ||
                        (complaintData.citizenEmail && complaintData.citizenEmail.toLowerCase() === (userActor.email || '').toLowerCase());
        if (!isOwner) {
          throw new Error('Access Denied: Citizens can only delete their own eligible complaints.');
        }
      }

      const recycleId = this.generateId('bin');
      const nowISO = new Date().toISOString();
      const nowFormatted = this.formatDate();

      const recycleBinItem = {
        recycleId: recycleId,
        complaintId: complaintId,
        complaintData: {
          ...complaintData,
          deletedByCitizen: isCitizen,
          deletedAt: nowISO,
          deletionReason: reason
        },
        deletedBy: userActor.email,
        deletedByName: userActor.name,
        deletedByRole: userActor.role,
        deletedAt: nowISO,
        formattedDeletedAt: nowFormatted,
        reason: reason,
        status: 'IN_BIN'
      };

      // 2. Save in Recycle Bin
      if (typeof window.JanasevaDB !== 'undefined') {
        const bin = window.JanasevaDB.get('recycle_bin', []);
        bin.unshift(recycleBinItem);
        window.JanasevaDB.set('recycle_bin', bin);
      }

      if (window.isFirebaseAvailable && window.fbDb) {
        try {
          if (isAdmin) {
            await window.fbDb.collection('recycle_bin').doc(recycleId).set(recycleBinItem);
            await window.fbDb.collection('complaints').doc(complaintId).delete();
          } else if (isCitizen) {
            await window.fbDb.collection('complaints').doc(complaintId).update({
              deletedByCitizen: true,
              deletedAt: nowISO,
              deletionReason: reason,
              updatedAt: nowFormatted
            });
          }
        } catch (e) {
          console.warn('[ComplaintStorageManager] Firestore Recycle Bin sync warning:', e);
        }
      }

      // 3. Log Activity
      this.recordActivity(
        isCitizen ? 'CITIZEN_MOVED_TO_DELETED' : 'MOVED_TO_RECYCLE_BIN',
        complaintId,
        `Complaint moved to ${isCitizen ? 'Citizen Deleted History' : 'Recycle Bin'} by ${userActor.email} (${userActor.role}). Reason: ${reason}`,
        userActor
      );

      // 4. Record Update Folder entry (persisted in Firestore complaint_updates for both Citizen and Admin)
      const encodedSoftDelete = isCitizen
        ? 'SOFT_DELETE_JSON:' + JSON.stringify({ action: 'CITIZEN_SOFT_DELETE', deletedAt: nowISO, deletedBy: userActor.email, reason }).slice(0, 3800)
        : null;

      await this.recordComplaintUpdate(complaintData, {
        oldStatus: complaintData.status,
        newStatus: isCitizen ? 'Deleted (Citizen)' : 'Deleted (In Recycle Bin)',
        updateType: isCitizen ? 'CITIZEN_SOFT_DELETE' : 'MOVED_TO_RECYCLE_BIN',
        remarks: `Moved to ${isCitizen ? 'Citizen Deleted History' : 'Recycle Bin'}. Reason: ${reason}`,
        resolutionDetails: encodedSoftDelete,
        actor: userActor
      });

      return recycleBinItem;
    }

    /**
     * Restore complaint from Recycle Bin back into Active Complaints Register
     */
    async restoreFromRecycleBin(recycleIdOrComplaintId, actor = null) {
      const userActor = actor || this.getCurrentActor();
      const isAdmin = userActor.role === 'admin';
      const isCitizen = userActor.role === 'citizen';

      if (!isAdmin && !isCitizen) {
        throw new Error('Access Denied: Only Administrators and Citizens can restore complaints.');
      }

      let bin = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        bin = window.JanasevaDB.get('recycle_bin', []);
      }

      const binIdx = bin.findIndex(b => b.recycleId === recycleIdOrComplaintId || b.complaintId === recycleIdOrComplaintId);
      let binItem = null;

      if (binIdx !== -1) {
        binItem = bin[binIdx];
        bin.splice(binIdx, 1);
        window.JanasevaDB.set('recycle_bin', bin);
      } else if (isAdmin && window.isFirebaseAvailable && window.fbDb) {
        const snap = await window.fbDb.collection('recycle_bin').doc(recycleIdOrComplaintId).get();
        if (snap.exists) binItem = snap.data();
      } else if (isCitizen && window.isFirebaseAvailable && window.fbDb) {
        // Check if complaint exists in Firestore complaints if local bin missed it
        const cSnap = await window.fbDb.collection('complaints').doc(recycleIdOrComplaintId).get();
        if (cSnap.exists) {
          binItem = { recycleId: 'fb-' + recycleIdOrComplaintId, complaintId: recycleIdOrComplaintId, complaintData: cSnap.data() };
        }
      }

      if (!binItem || !binItem.complaintData) {
        throw new Error('Item not found in Deleted History.');
      }

      // Verify Citizen Ownership for Restoration
      if (isCitizen) {
        const c = binItem.complaintData;
        const isOwner = (c.userId && c.userId === userActor.uid) ||
                        (c.citizenUid && c.citizenUid === userActor.uid) ||
                        (c.citizenEmail && c.citizenEmail.toLowerCase() === (userActor.email || '').toLowerCase());
        if (!isOwner) {
          throw new Error('Access Denied: Citizens can only restore their own deleted complaints.');
        }
      }

      const restoredComplaint = {
        ...binItem.complaintData,
        deletedByCitizen: false,
        deletedAt: null,
        deletionReason: null,
        restoredAt: new Date().toISOString(),
        restoredBy: userActor.email,
        updatedAt: this.formatDate()
      };

      // 1. Put back into JanasevaDB complaints
      if (typeof window.JanasevaDB !== 'undefined') {
        const complaints = window.JanasevaDB.get('complaints', []);
        const exIdx = complaints.findIndex(c => (c.complaintId || c.id) === restoredComplaint.complaintId);
        if (exIdx >= 0) complaints[exIdx] = restoredComplaint;
        else complaints.unshift(restoredComplaint);
        window.JanasevaDB.set('complaints', complaints);
      }

      // 2. Put back into Firestore (Admin restores doc; Citizen clears soft-delete flags on complaint doc)
      if (window.isFirebaseAvailable && window.fbDb) {
        try {
          if (isAdmin) {
            await window.fbDb.collection('complaints').doc(restoredComplaint.complaintId).set(restoredComplaint);
            await window.fbDb.collection('recycle_bin').doc(binItem.recycleId).delete();
          } else if (isCitizen) {
            await window.fbDb.collection('complaints').doc(restoredComplaint.complaintId).update({
              deletedByCitizen: false,
              deletedAt: '',
              deletionReason: '',
              updatedAt: restoredComplaint.updatedAt
            });
          }
        } catch (e) {
          console.warn('[ComplaintStorageManager] Firestore restore warning:', e);
        }
      }

      // 3. Log Activity
      this.recordActivity(
        'COMPLAINT_RESTORED',
        restoredComplaint.complaintId,
        `Restored from Deleted History to Active Register by ${userActor.email} (${userActor.role})`,
        userActor
      );

      // 4. Record Update in Folder
      await this.recordComplaintUpdate(restoredComplaint, {
        oldStatus: 'Recycle Bin',
        newStatus: restoredComplaint.status || 'Submitted',
        updateType: 'COMPLAINT_RESTORED',
        remarks: `Complaint restored to active lifecycle from Deleted History by ${userActor.name || userActor.email}`,
        actor: userActor
      });

      return restoredComplaint;
    }

    /**
     * Permanently purge complaint from Recycle Bin (Irreversible action)
     */
    async permanentlyDeleteComplaint(recycleIdOrComplaintId, confirmationText = '', actor = null) {
      const userActor = actor || this.getCurrentActor();
      if (userActor.role !== 'admin') {
        throw new Error('Access Denied: Only Administrators can permanently delete records.');
      }

      if (confirmationText !== 'DELETE') {
        throw new Error('Explicit confirmation code "DELETE" required for permanent destruction.');
      }

      let bin = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        bin = window.JanasevaDB.get('recycle_bin', []);
      }

      const binIdx = bin.findIndex(b => b.recycleId === recycleIdOrComplaintId || b.complaintId === recycleIdOrComplaintId);
      let targetItem = null;

      if (binIdx !== -1) {
        targetItem = bin[binIdx];
        bin.splice(binIdx, 1);
        window.JanasevaDB.set('recycle_bin', bin);
      }

      if (window.isFirebaseAvailable && window.fbDb) {
        try {
          const snapId = targetItem?.recycleId || recycleIdOrComplaintId;
          await window.fbDb.collection('recycle_bin').doc(snapId).delete();
          // Ensure removed from active complaints as well
          const cid = targetItem?.complaintId || recycleIdOrComplaintId;
          await window.fbDb.collection('complaints').doc(cid).delete();
        } catch (e) {
          console.warn('[ComplaintStorageManager] Firestore permanent purge warning:', e);
        }
      }

      const cid = targetItem?.complaintId || recycleIdOrComplaintId;
      this.recordActivity(
        'PERMANENTLY_DELETED',
        cid,
        `Record permanently destroyed from Recycle Bin by ${userActor.email}. Immutable action executed.`,
        userActor
      );

      return { success: true, complaintId: cid };
    }

    /**
     * Get all items currently in Recycle Bin with optional citizen scoping
     */
    async getRecycleBinItems(filter = null) {
      let bin = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        bin = window.JanasevaDB.get('recycle_bin', []);
      }
      if (bin.length === 0 && window.isFirebaseAvailable && window.fbDb) {
        try {
          const snap = await window.fbDb.collection('recycle_bin').orderBy('deletedAt', 'desc').get();
          if (!snap.empty) {
            bin = snap.docs.map(d => d.data());
            if (typeof window.JanasevaDB !== 'undefined') {
              window.JanasevaDB.set('recycle_bin', bin);
            }
          }
        } catch (e) {
          console.warn('[ComplaintStorageManager] Firestore bin query warning:', e);
        }
      }

      if (filter) {
        if (filter.citizenUid || filter.citizenEmail) {
          const uid = filter.citizenUid;
          const email = (filter.citizenEmail || '').toLowerCase();
          bin = bin.filter(item => {
            const c = item.complaintData || {};
            return (uid && (c.userId === uid || c.citizenUid === uid)) ||
                   (email && (c.citizenEmail || '').toLowerCase() === email) ||
                   (item.deletedBy && item.deletedBy.toLowerCase() === email);
          });
        }
      }

      return bin;
    }

    // ========================================================================
    // 3. DUPLICATE COMPLAINT DETECTION ALGORITHM
    // ========================================================================

    /**
     * Scan complaints array and detect potential duplicates
     */
    detectDuplicates(complaints = []) {
      if (!Array.isArray(complaints) || complaints.length < 2) return [];

      const duplicateFlags = [];
      const visited = new Set();

      for (let i = 0; i < complaints.length; i++) {
        const c1 = complaints[i];
        if (!c1 || !c1.complaintId || visited.has(c1.complaintId)) continue;

        for (let j = i + 1; j < complaints.length; j++) {
          const c2 = complaints[j];
          if (!c2 || !c2.complaintId || visited.has(c2.complaintId)) continue;

          // Check Matching Conditions:
          // 1. Same citizen email/phone + same category
          const sameCitizen = (c1.citizenEmail && c1.citizenEmail.toLowerCase() === (c2.citizenEmail || '').toLowerCase()) ||
                              (c1.citizenPhone && c1.citizenPhone === c2.citizenPhone);
          const sameCategory = (c1.category || '').toLowerCase() === (c2.category || '').toLowerCase();
          const samePanchayat = (c1.panchayatId || '') === (c2.panchayatId || '');

          // Description similarity check (shared unique words)
          const words1 = (c1.description || '').toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
          const words2 = (c2.description || '').toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
          const set1 = new Set(words1);
          const commonWords = words2.filter(w => set1.has(w));
          const similarityRatio = words1.length > 0 ? (commonWords.length / Math.max(words1.length, words2.length)) : 0;

          // Flag threshold
          let isDuplicate = false;
          let matchReason = '';

          if (sameCitizen && sameCategory && samePanchayat) {
            isDuplicate = true;
            matchReason = 'Identical citizen filing in same category & Panchayat';
          } else if (sameCategory && samePanchayat && similarityRatio > 0.45) {
            isDuplicate = true;
            matchReason = `High description similarity (${Math.round(similarityRatio * 100)}%) in same Panchayat`;
          }

          if (isDuplicate) {
            duplicateFlags.push({
              primaryId: c1.complaintId,
              duplicateId: c2.complaintId,
              reason: matchReason,
              citizenName: c1.citizenName,
              category: c1.category,
              panchayatName: c1.panchayatName,
              complaint1: c1,
              complaint2: c2
            });
            visited.add(c2.complaintId);
          }
        }
      }

      return duplicateFlags;
    }

    // ========================================================================
    // 4. ACTIVITY AUDIT LOGGING
    // ========================================================================

    /**
     * Record an administrative audit entry in activity_logs
     */
    recordActivity(action, recordId, details, actor = null) {
      const userActor = actor || this.getCurrentActor();
      const logEntry = {
        logId: this.generateId('act'),
        action: action,
        recordId: recordId || 'GENERAL',
        details: details || '',
        actorEmail: userActor.email,
        actorName: userActor.name,
        actorRole: userActor.role,
        actorUid: userActor.uid || '',
        timestamp: new Date().toISOString(),
        formattedDate: this.formatDate()
      };

      // 1. JanasevaDB
      if (typeof window.JanasevaDB !== 'undefined') {
        const logs = window.JanasevaDB.get('activity_logs', []);
        logs.unshift(logEntry);
        window.JanasevaDB.set('activity_logs', logs.slice(0, 300));
      }

      // 2. Firestore (activity_logs rule restricts creation to admin or receiver)
      if (window.isFirebaseAvailable && window.fbDb && (userActor.role === 'admin' || userActor.role === 'receiver')) {
        window.fbDb.collection('activity_logs').doc(logEntry.logId).set(logEntry).catch(e => {
          console.warn('[ComplaintStorageManager] Activity log cloud save notice:', e);
        });
      }

      return logEntry;
    }

    /**
     * Retrieve Activity Audit Logs
     */
    async getActivityLogs(limit = 100) {
      let logs = [];
      if (typeof window.JanasevaDB !== 'undefined') {
        logs = window.JanasevaDB.get('activity_logs', []);
      }
      if (logs.length === 0 && window.isFirebaseAvailable && window.fbDb) {
        try {
          const snap = await window.fbDb.collection('activity_logs').orderBy('timestamp', 'desc').limit(limit).get();
          if (!snap.empty) {
            logs = snap.docs.map(d => d.data());
          }
        } catch (e) {
          console.warn('[ComplaintStorageManager] Activity log fetch notice:', e);
        }
      }
      return logs;
    }

    // ========================================================================
    // 5. EXPORT & REPORTING TOOLS (CSV & PRINT/PDF)
    // ========================================================================

    /**
     * Export Complaint Updates to CSV file
     */
    exportUpdatesCSV(updates = []) {
      if (!updates || updates.length === 0) {
        if (typeof window.showToast === 'function') window.showToast('No update records available to export', 'warning');
        return;
      }

      const headers = ['Timestamp', 'Complaint ID', 'Citizen Name', 'Panchayat', 'Category', 'Old Status', 'New Status', 'Author Name', 'Author Role', 'Remarks'];
      const rows = updates.map(u => [
        `"${u.formattedDate || u.timestamp}"`,
        `"${u.complaintId || ''}"`,
        `"${(u.citizenName || '').replace(/"/g, '""')}"`,
        `"${(u.panchayatName || '').replace(/"/g, '""')}"`,
        `"${(u.category || '').replace(/"/g, '""')}"`,
        `"${u.oldStatus || 'Initial'}"`,
        `"${u.newStatus || ''}"`,
        `"${(u.authorName || '').replace(/"/g, '""')}"`,
        `"${u.authorRole || ''}"`,
        `"${(u.remarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JANASEVA-Complaint-Updates-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.recordActivity('REPORTS_EXPORTED', 'CSV_UPDATES', `Exported ${updates.length} complaint update records to CSV`);
    }

    /**
     * Export Full Complaint Register to CSV
     */
    exportComplaintsCSV(complaints = []) {
      if (!complaints || complaints.length === 0) {
        if (typeof window.showToast === 'function') window.showToast('No complaints available to export', 'warning');
        return;
      }

      const headers = ['Complaint ID', 'Citizen Name', 'Citizen Email', 'Phone', 'Panchayat', 'Category', 'Status', 'AI Priority', 'Submission Date', 'Assigned Receiver', 'Official Response'];
      const rows = complaints.map(c => [
        `"${c.complaintId}"`,
        `"${(c.citizenName || '').replace(/"/g, '""')}"`,
        `"${(c.citizenEmail || '').replace(/"/g, '""')}"`,
        `"${c.citizenPhone || c.citizenMobileNumber || ''}"`,
        `"${(c.panchayatName || '').replace(/"/g, '""')}"`,
        `"${(c.category || '').replace(/"/g, '""')}"`,
        `"${c.status || 'Submitted'}"`,
        `"${c.aiPriority || 'NORMAL'}"`,
        `"${c.createdAt || c.submissionDate || ''}"`,
        `"${(c.assignedReceiverName || '').replace(/"/g, '""')}"`,
        `"${(c.officialResponse || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JANASEVA-Complaints-Register-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.recordActivity('REPORTS_EXPORTED', 'CSV_COMPLAINTS', `Exported ${complaints.length} complaints to CSV`);
    }

    /**
     * Print or export PDF summary sheet of complaint statistics & report
     */
    printReportSummary(rawInput) {
      const src = rawInput || {};
      let normalizedItems = Array.isArray(src.items) ? src.items : [];
      if (normalizedItems.length === 0 && Array.isArray(src.updates)) {
        normalizedItems = src.updates.map(u => ({
          complaintId: u.complaintId || 'N/A',
          citizenName: u.updatedByName ? `${u.updatedByName}${u.updatedByRole ? ' (' + u.updatedByRole + ')' : ''}` : 'System',
          panchayatName: u.panchayatName || '-',
          category: u.category || '-',
          status: u.newStatus || u.oldStatus || 'Updated',
          submissionDate: u.formattedTime || (u.timestamp ? new Date(u.timestamp).toLocaleString('en-IN') : 'Recent'),
          description: `${u.oldStatus || ''} -> ${u.newStatus || ''}${u.remark ? ' | ' + u.remark : ''}`
        }));
      } else if (normalizedItems.length === 0 && src.complaint) {
        const comp = src.complaint;
        const hist = (typeof this.getComplaintHistory === 'function' && comp.complaintId)
          ? this.getComplaintHistory(comp.complaintId)
          : (Array.isArray(comp.history) ? comp.history : []);
        if (hist && hist.length > 0) {
          normalizedItems = hist.map(h => ({
            complaintId: comp.complaintId || 'N/A',
            citizenName: h.updatedByName || h.by || comp.citizenName || 'Officer',
            panchayatName: comp.panchayatName || '-',
            category: comp.category || '-',
            status: h.newStatus || h.status || comp.status || 'Updated',
            submissionDate: h.formattedTime || h.date || (h.timestamp ? new Date(h.timestamp).toLocaleString('en-IN') : comp.submissionDate || 'Recent'),
            description: h.remark || h.notes || comp.description || ''
          }));
        } else {
          normalizedItems = [comp];
        }
      }
      const calcTotal = src.total !== undefined ? src.total : normalizedItems.length;
      const calcInProgress = src.inProgress !== undefined ? src.inProgress : normalizedItems.filter(x => /progress|review|assigned|reopened|action/i.test(x.status || '')).length;
      const calcResolved = src.resolved !== undefined ? src.resolved : normalizedItems.filter(x => /resolved|closed/i.test(x.status || '')).length;
      const calcRejected = src.rejected !== undefined ? src.rejected : normalizedItems.filter(x => /rejected/i.test(x.status || '')).length;
      const reportData = {
        ...src,
        total: calcTotal,
        inProgress: calcInProgress,
        resolved: calcResolved,
        rejected: calcRejected,
        items: normalizedItems
      };
      const printWin = window.open('', '_blank', 'width=900,height=800');
      if (!printWin) {
        (window.janasevaAlert || alert)('Popup blocker prevented print view. Please allow popups.');
        return;
      }

      const T = (s) => (typeof window.janasevaT === 'function') ? window.janasevaT(s) : s;
      const escTop = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      const now = this.formatDate();
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${escTop(T('JANASEVA – Grievance Analytics & Status Report'))}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0b2545; line-height: 1.5; }
            .header { border-bottom: 2px solid #0b2545; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 20px; font-weight: 800; }
            .sub { font-size: 13px; color: #64748b; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
            .card-val { font-size: 22px; font-weight: 800; color: #0f56b3; }
            .card-lbl { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background: #0b2545; color: white; text-align: left; padding: 10px; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
            .badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0369a1; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${escTop(T('JANASEVA – Gram Panchayat Grievance Portal'))}</div>
              <div class="sub">${escTop(T('Official Complaint Storage & Update Lifecycle Report'))} &bull; ${escTop(T('Generated:'))} ${escTop(T(now))}</div>
            </div>
            <button class="no-print" onclick="window.print()" style="padding: 8px 16px; background: #0f56b3; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">
              ${escTop(T('Print / Save as PDF'))}
            </button>
          </div>

          <div class="grid">
            <div class="card"><div class="card-val">${reportData.total || 0}</div><div class="card-lbl">${escTop(T('Total Filed'))}</div></div>
            <div class="card"><div class="card-val" style="color: #ea580c;">${reportData.inProgress || 0}</div><div class="card-lbl">${escTop(T('In Progress'))}</div></div>
            <div class="card"><div class="card-val" style="color: #16a34a;">${reportData.resolved || 0}</div><div class="card-lbl">${escTop(T('Resolved'))}</div></div>
            <div class="card"><div class="card-val" style="color: #dc2626;">${reportData.rejected || 0}</div><div class="card-lbl">${escTop(T('Rejected'))}</div></div>
          </div>

          <h3>${escTop(T('Recent Grievances & Update Log'))}</h3>
          <table>
            <thead>
              <tr>
                <th>${escTop(T('Complaint Ref'))}</th>
                <th>${escTop(T('Citizen'))}</th>
                <th>${escTop(T('Gram Panchayat'))}</th>
                <th>${escTop(T('Category'))}</th>
                <th>${escTop(T('Status'))}</th>
                <th>${escTop(T('Last Update'))}</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData.items || []).slice(0, 50).map(c => {
                const esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                return `
                <tr>
                  <td><strong>${esc(c.complaintId)}</strong></td>
                  <td>${esc(c.citizenName)}</td>
                  <td>${esc(T(c.panchayatName || 'Gram Panchayat'))}</td>
                  <td>${esc(T(c.category))}</td>
                  <td><span class="badge">${esc(T(c.status || 'Submitted'))}</span></td>
                  <td>${esc(T(c.updatedAt || c.createdAt))}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `);
      printWin.document.close();
    }
  }

  // Export Singleton instance globally
  window.complaintStorageManager = new ComplaintStorageManager();

})(window);
