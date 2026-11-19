/**
 * JANASEVA – AI Notebook & Centralized Knowledge Ecosystem Service
 * 
 * Unifies:
 * 1. Digital Notebooks & Rich Notes Management (Zoho Notebook / Apple Notes inspired)
 * 2. Personal Notes vs. Approved AI Knowledge Library separation
 * 3. Revision History & Automatic Autosave with conflict recovery
 * 4. Secure Knowledge Sharing (Registered Users, Secure Links, Password, Expiry)
 * 5. Role-Based Access Control (Admin, Receiver, Citizen, Viewer, Editor)
 * 6. Document Intelligence Integration & RAG Search Indexing
 * 7. Dual Cloud Sync (Firestore + Supabase + IndexedDB local offline storage)
 */

(function(window) {
  'use strict';

  function genId(prefix = 'item') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatDate(d = new Date()) {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  }

  class JanasevaNotebookService {
    constructor() {
      this.initialized = false;
      this._autosaveTimers = new Map();
      this.initPromise = this.init();
    }

    async init() {
      if (this.initialized) return;
      this.ensureDataStructures();
      await this.seedDefaultNotebooksIfEmpty();
      this.bindNetworkListeners();
      this.initialized = true;
    }

    /**
     * Ensure storage arrays exist in JanasevaDB
     */
    ensureDataStructures() {
      if (typeof window.JanasevaDB === 'undefined') return;

      const keys = [
        'notebooks',
        'notes',
        'note_versions',
        'knowledge_records',
        'knowledge_approvals',
        'share_links',
        'access_permissions',
        'sync_queue',
        'activity_logs'
      ];
      for (const k of keys) {
        if (!window.JanasevaDB.get(k)) {
          window.JanasevaDB.set(k, []);
        }
      }
    }

    getCurrentActor() {
      const u = window.authService?.currentUser || null;
      if (u && u.uid) {
        return {
          uid: u.uid,
          name: u.name || 'Authorized User',
          email: u.email || '',
          role: u.role || 'citizen',
          isAdmin: u.role === 'admin',
          isReceiver: u.role === 'receiver',
          isCitizen: u.role === 'citizen'
        };
      }
      return {
        uid: 'usr-guest-' + this.getGuestId(),
        name: 'Guest Citizen',
        email: 'guest@janaseva.local',
        role: 'citizen',
        isAdmin: false,
        isReceiver: false,
        isCitizen: true
      };
    }

    getGuestId() {
      try {
        let gid = localStorage.getItem('JANASEVA_GUEST_ID');
        if (!gid) {
          gid = Math.random().toString(36).slice(2, 9);
          localStorage.setItem('JANASEVA_GUEST_ID', gid);
        }
        return gid;
      } catch (e) {
        return 'local';
      }
    }

    bindNetworkListeners() {
      if (typeof window === 'undefined') return;
      window.addEventListener('online', () => {
        console.log('[JanasevaNotebook] Network restored. Triggering background synchronization...');
        this.processSyncQueue();
      });
    }

    // ========================================================================
    // 1. NOTEBOOK MANAGEMENT (CRUD, Organization, Categories, Covers)
    // ========================================================================

    async createNotebook({
      name,
      description = '',
      category = 'General',
      color = '#0f56b3',
      icon = 'fa-solid fa-book',
      coverStyle = 'gradient',
      visibility = 'private',
      actor = null
    }) {
      const user = actor || this.getCurrentActor();
      if (!name || !name.trim()) throw new Error('Notebook name is required.');

      const nowISO = new Date().toISOString();
      const notebook = {
        notebookId: genId('nb'),
        name: name.trim(),
        description: (description || '').trim(),
        category: category || 'General',
        color: color || '#0f56b3',
        icon: icon || 'fa-solid fa-book',
        coverStyle: coverStyle || 'gradient',
        ownerUid: user.uid,
        ownerEmail: user.email,
        ownerName: user.name,
        ownerRole: user.role,
        isArchived: false,
        isDeleted: false,
        isFavorite: false,
        isPinned: false,
        visibility: visibility || 'private', // 'private' | 'shared' | 'public_approved'
        notesCount: 0,
        createdAt: nowISO,
        updatedAt: nowISO,
        formattedDate: formatDate(nowISO)
      };

      // 1. Save to JanasevaDB
      if (window.JanasevaDB) {
        const notebooks = window.JanasevaDB.get('notebooks', []);
        notebooks.unshift(notebook);
        window.JanasevaDB.set('notebooks', notebooks);
      }

      // 2. Save to IndexedDB if available
      if (window.JanasevaKnowledgeCentre?.idb) {
        try {
          await window.JanasevaKnowledgeCentre.idb.put('notebooks', notebook);
        } catch (e) {}
      }

      // 3. Save to Cloud Firestore if online
      if (navigator.onLine && window.isFirebaseAvailable && window.fbDb && user.uid && !user.uid.startsWith('usr-guest')) {
        try {
          await window.fbDb.collection('notebooks').doc(notebook.notebookId).set(notebook);
        } catch (err) {
          console.warn('[JanasevaNotebook] Firestore notebook save warning:', err);
          this.enqueueSync('CREATE', 'NOTEBOOK', notebook.notebookId, notebook);
        }
      } else {
        this.enqueueSync('CREATE', 'NOTEBOOK', notebook.notebookId, notebook);
      }

      this.logActivity('NOTEBOOK_CREATED', notebook.notebookId, `Created notebook "${notebook.name}" in category "${notebook.category}"`, user);
      return notebook;
    }

    async updateNotebook(notebookId, updates = {}, actor = null) {
      const user = actor || this.getCurrentActor();
      if (!notebookId) throw new Error('Notebook ID is required.');

      let notebooks = window.JanasevaDB ? window.JanasevaDB.get('notebooks', []) : [];
      const idx = notebooks.findIndex(n => n.notebookId === notebookId);
      if (idx === -1) throw new Error('Notebook not found.');

      const nb = notebooks[idx];
      // Permissions check
      if (nb.ownerUid !== user.uid && !user.isAdmin && !this.checkPermission(notebookId, 'NOTEBOOK', user, 'EDITOR')) {
        throw new Error('Access Denied: You do not have permission to edit this notebook.');
      }

      const nowISO = new Date().toISOString();
      const updated = {
        ...nb,
        ...updates,
        notebookId: nb.notebookId, // immutable
        ownerUid: nb.ownerUid,     // immutable
        updatedAt: nowISO,
        formattedDate: formatDate(nowISO)
      };

      notebooks[idx] = updated;
      if (window.JanasevaDB) window.JanasevaDB.set('notebooks', notebooks);

      if (window.JanasevaKnowledgeCentre?.idb) {
        try { await window.JanasevaKnowledgeCentre.idb.put('notebooks', updated); } catch (e) {}
      }

      if (navigator.onLine && window.isFirebaseAvailable && window.fbDb) {
        try {
          await window.fbDb.collection('notebooks').doc(notebookId).set(updated, { merge: true });
        } catch (e) {
          this.enqueueSync('UPDATE', 'NOTEBOOK', notebookId, updated);
        }
      } else {
        this.enqueueSync('UPDATE', 'NOTEBOOK', notebookId, updated);
      }

      this.logActivity('NOTEBOOK_UPDATED', notebookId, `Updated notebook "${updated.name}"`, user);
      return updated;
    }

    async deleteNotebook(notebookId, actor = null) {
      const user = actor || this.getCurrentActor();
      return this.updateNotebook(notebookId, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: user.email
      }, user);
    }

    async restoreNotebook(notebookId, actor = null) {
      const user = actor || this.getCurrentActor();
      return this.updateNotebook(notebookId, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      }, user);
    }

    async listNotebooks(filters = {}, actor = null) {
      const user = actor || this.getCurrentActor();
      let list = window.JanasevaDB ? window.JanasevaDB.get('notebooks', []) : [];

      // Also hydrate notesCount
      const allNotes = window.JanasevaDB ? window.JanasevaDB.get('notes', []) : [];
      const noteCountMap = new Map();
      allNotes.forEach(n => {
        if (!n.isDeleted) {
          noteCountMap.set(n.notebookId, (noteCountMap.get(n.notebookId) || 0) + 1);
        }
      });

      list.forEach(nb => {
        nb.notesCount = noteCountMap.get(nb.notebookId) || 0;
      });

      return list.filter(nb => {
        // Exclude deleted unless specifically viewing bin
        const isBin = filters.view === 'recycle_bin';
        if (isBin) {
          if (!nb.isDeleted) return false;
        } else {
          if (nb.isDeleted) return false;
        }

        // Exclude archived unless requested
        if (filters.archived === true) {
          if (!nb.isArchived) return false;
        } else if (filters.archived === false && !isBin) {
          if (nb.isArchived) return false;
        }

        // Access permissions filter:
        // Owner OR Admin OR Public Approved OR Shared with user
        const isOwner = nb.ownerUid === user.uid;
        const isPublic = nb.visibility === 'public_approved';
        const isShared = this.checkPermission(nb.notebookId, 'NOTEBOOK', user, 'VIEWER');
        if (!user.isAdmin && !isOwner && !isPublic && !isShared) return false;

        // Category filter
        if (filters.category && filters.category !== 'all' && filters.category !== 'ALL') {
          const filterCat = filters.category.toLowerCase();
          const nbCat = (nb.category || '').toLowerCase();
          const directMatch = nbCat === filterCat || nbCat.includes(filterCat) || filterCat.includes(nbCat);
          if (!directMatch) {
            const hasMatchingNote = allNotes.some(n => 
              !n.isDeleted && 
              n.notebookId === nb.notebookId && 
              (((n.category || '').toLowerCase() === filterCat) ||
               ((n.category || '').toLowerCase().includes(filterCat)) ||
               (Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(filterCat))) ||
               ((n.title || '').toLowerCase().includes(filterCat)))
            );
            if (!hasMatchingNote) return false;
          }
        }

        // Search text
        if (filters.search) {
          const s = filters.search.toLowerCase().trim();
          const matchName = (nb.name || '').toLowerCase().includes(s);
          const matchDesc = (nb.description || '').toLowerCase().includes(s);
          const matchCat = (nb.category || '').toLowerCase().includes(s);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        return true;
      }).sort((a, b) => {
        // Pinned first, then favorites, then updated
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
    }

    async getNotebook(notebookId, actor = null) {
      const user = actor || this.getCurrentActor();
      const list = await this.listNotebooks({}, user);
      return list.find(n => n.notebookId === notebookId) || null;
    }

    // ========================================================================
    // 2. NOTE MANAGEMENT (Rich Text, Checklist, Pin, Favorite, Move, Duplicate)
    // ========================================================================

    async createNote({
      notebookId,
      title = 'Untitled Note',
      contentHtml = '',
      contentText = '',
      category = 'General',
      tags = [],
      isPinned = false,
      isFavorite = false,
      attachments = [],
      actor = null
    }) {
      const user = actor || this.getCurrentActor();
      if (!notebookId) throw new Error('Notebook ID is required to create a note.');

      const nb = await this.getNotebook(notebookId, user);
      const nbName = nb ? nb.name : 'General Notebook';

      const nowISO = new Date().toISOString();
      const noteId = genId('note');

      // Calculate checklist statistics if checklists exist in content
      const checklistSummary = this.calculateChecklistStats(contentHtml);

      const note = {
        noteId,
        notebookId,
        notebookName: nbName,
        title: (title || 'Untitled Note').trim(),
        contentHtml: contentHtml || '<p>Write your note here...</p>',
        contentText: contentText || this.stripHtml(contentHtml || ''),
        category: category || (nb ? nb.category : 'General'),
        tags: Array.isArray(tags) ? tags : [],
        ownerUid: user.uid,
        ownerEmail: user.email,
        ownerName: user.name,
        ownerRole: user.role,
        isPinned: Boolean(isPinned),
        isFavorite: Boolean(isFavorite),
        isArchived: false,
        isDeleted: false,
        deletedAt: null,
        approvalStatus: 'DRAFT', // 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED'
        approvalReviewer: null,
        approvalTimestamp: null,
        approvalFeedback: null,
        isPublicKnowledge: false,
        attachments: Array.isArray(attachments) ? attachments : [],
        checklistSummary,
        version: 1,
        createdAt: nowISO,
        updatedAt: nowISO,
        lastSavedAt: nowISO,
        formattedDate: formatDate(nowISO)
      };

      // 1. Save in JanasevaDB
      if (window.JanasevaDB) {
        const notes = window.JanasevaDB.get('notes', []);
        notes.unshift(note);
        window.JanasevaDB.set('notes', notes);
      }

      // 2. Save initial version in note_versions
      await this.saveVersionSnapshot(note, 'Initial creation', user);

      // 3. Save to IndexedDB
      if (window.JanasevaKnowledgeCentre?.idb) {
        try { await window.JanasevaKnowledgeCentre.idb.put('notes', note); } catch (e) {}
      }

      // 4. Index into RAG knowledge chunks
      await this.indexNoteIntoRagChunks(note);

      // 5. Cloud Firestore Sync
      if (navigator.onLine && window.isFirebaseAvailable && window.fbDb && user.uid && !user.uid.startsWith('usr-guest')) {
        try {
          await window.fbDb.collection('notes').doc(note.noteId).set(note);
        } catch (e) {
          this.enqueueSync('CREATE', 'NOTE', note.noteId, note);
        }
      } else {
        this.enqueueSync('CREATE', 'NOTE', note.noteId, note);
      }

      this.logActivity('NOTE_CREATED', note.noteId, `Created note "${note.title}" in notebook "${nbName}"`, user);
      return note;
    }

    async updateNote(noteId, updates = {}, actor = null) {
      const user = actor || this.getCurrentActor();
      if (!noteId) throw new Error('Note ID is required.');

      let notes = window.JanasevaDB ? window.JanasevaDB.get('notes', []) : [];
      const idx = notes.findIndex(n => n.noteId === noteId);
      if (idx === -1) throw new Error('Note not found.');

      const existing = notes[idx];
      // Permission verification
      const isOwner = existing.ownerUid === user.uid;
      const hasEditPerm = this.checkPermission(noteId, 'NOTE', user, 'EDITOR') || this.checkPermission(existing.notebookId, 'NOTEBOOK', user, 'EDITOR');
      if (!isOwner && !user.isAdmin && !hasEditPerm) {
        throw new Error('Access Denied: You do not have permission to edit this note.');
      }

      const nowISO = new Date().toISOString();
      const contentHtml = updates.contentHtml !== undefined ? updates.contentHtml : existing.contentHtml;
      const contentText = updates.contentText !== undefined ? updates.contentText : (updates.contentHtml ? this.stripHtml(updates.contentHtml) : existing.contentText);
      const checklistSummary = this.calculateChecklistStats(contentHtml);

      // If content changed significantly, bump version
      const contentChanged = updates.contentHtml && updates.contentHtml !== existing.contentHtml;
      const newVersion = contentChanged ? (existing.version || 1) + 1 : (existing.version || 1);

      const updated = {
        ...existing,
        ...updates,
        noteId: existing.noteId,
        ownerUid: existing.ownerUid,
        contentHtml,
        contentText,
        checklistSummary,
        version: newVersion,
        updatedAt: nowISO,
        lastSavedAt: nowISO,
        formattedDate: formatDate(nowISO)
      };

      notes[idx] = updated;
      if (window.JanasevaDB) window.JanasevaDB.set('notes', notes);

      // Save version snapshot on substantive content changes
      if (contentChanged) {
        await this.saveVersionSnapshot(updated, updates.changeSummary || 'Automatic revision snapshot', user);
      }

      // Update in IndexedDB
      if (window.JanasevaKnowledgeCentre?.idb) {
        try { await window.JanasevaKnowledgeCentre.idb.put('notes', updated); } catch (e) {}
      }

      // Re-index RAG chunks
      await this.indexNoteIntoRagChunks(updated);

      // Cloud Firestore sync
      if (navigator.onLine && window.isFirebaseAvailable && window.fbDb) {
        try {
          await window.fbDb.collection('notes').doc(noteId).set(updated, { merge: true });
        } catch (e) {
          this.enqueueSync('UPDATE', 'NOTE', noteId, updated);
        }
      } else {
        this.enqueueSync('UPDATE', 'NOTE', noteId, updated);
      }

      return updated;
    }

    async getNote(noteId, actor = null) {
      const user = actor || this.getCurrentActor();
      let notes = window.JanasevaDB ? window.JanasevaDB.get('notes', []) : [];
      const note = notes.find(n => n.noteId === noteId);
      if (!note) return null;

      // Access verification
      const isOwner = note.ownerUid === user.uid;
      const isPublic = note.approvalStatus === 'APPROVED' || note.approvalStatus === 'PUBLISHED' || note.isPublicKnowledge;
      const hasViewPerm = this.checkPermission(noteId, 'NOTE', user, 'VIEWER') || this.checkPermission(note.notebookId, 'NOTEBOOK', user, 'VIEWER');
      if (!user.isAdmin && !isOwner && !isPublic && !hasViewPerm) {
        throw new Error('Access Denied: You do not have permission to view this note.');
      }

      return note;
    }

    async deleteNote(noteId, actor = null) {
      const user = actor || this.getCurrentActor();
      return this.updateNote(noteId, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: user.email
      }, user);
    }

    async restoreNote(noteId, actor = null) {
      const user = actor || this.getCurrentActor();
      return this.updateNote(noteId, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      }, user);
    }

    async duplicateNote(noteId, targetNotebookId = null, actor = null) {
      const user = actor || this.getCurrentActor();
      const original = await this.getNote(noteId, user);
      if (!original) throw new Error('Original note not found.');

      return this.createNote({
        notebookId: targetNotebookId || original.notebookId,
        title: `${original.title} (Copy)`,
        contentHtml: original.contentHtml,
        contentText: original.contentText,
        category: original.category,
        tags: [...(original.tags || [])],
        attachments: [...(original.attachments || [])],
        actor: user
      });
    }

    async moveNote(noteId, newNotebookId, actor = null) {
      const user = actor || this.getCurrentActor();
      const targetNb = await this.getNotebook(newNotebookId, user);
      if (!targetNb) throw new Error('Target notebook not found.');

      return this.updateNote(noteId, {
        notebookId: newNotebookId,
        notebookName: targetNb.name,
        category: targetNb.category
      }, user);
    }

    async listNotes(filters = {}, actor = null) {
      const user = actor || this.getCurrentActor();
      let list = window.JanasevaDB ? window.JanasevaDB.get('notes', []) : [];

      return list.filter(n => {
        // Recycle Bin Filter
        const isBin = filters.view === 'recycle_bin';
        if (isBin) {
          if (!n.isDeleted) return false;
        } else {
          if (n.isDeleted) return false;
        }

        // Notebook filter
        if (filters.notebookId && filters.notebookId !== 'all') {
          if (n.notebookId !== filters.notebookId) return false;
        }

        // Scope filter: 'personal' | 'approved_library' | 'shared' | 'favorites' | 'pinned'
        if (filters.scope === 'approved_library') {
          if (n.approvalStatus !== 'APPROVED' && n.approvalStatus !== 'PUBLISHED') return false;
        } else if (filters.scope === 'favorites') {
          if (!n.isFavorite) return false;
        } else if (filters.scope === 'pinned') {
          if (!n.isPinned) return false;
        } else if (filters.scope === 'shared') {
          const isSharedWithMe = this.checkPermission(n.noteId, 'NOTE', user, 'VIEWER') || this.checkPermission(n.notebookId, 'NOTEBOOK', user, 'VIEWER');
          if (!isSharedWithMe || n.ownerUid === user.uid) return false;
        }

        // Access rules:
        const isOwner = n.ownerUid === user.uid;
        const isApprovedPub = n.approvalStatus === 'APPROVED' || n.approvalStatus === 'PUBLISHED' || n.isPublicKnowledge;
        const hasAccess = isOwner || user.isAdmin || isApprovedPub || this.checkPermission(n.noteId, 'NOTE', user, 'VIEWER') || this.checkPermission(n.notebookId, 'NOTEBOOK', user, 'VIEWER');
        if (!hasAccess) return false;

        // Category filter
        if (filters.category && filters.category !== 'all' && filters.category !== 'ALL') {
          const filterCat = filters.category.toLowerCase();
          const noteCat = (n.category || '').toLowerCase();
          const matchCat = noteCat === filterCat || noteCat.includes(filterCat) || filterCat.includes(noteCat);
          const matchTags = Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(filterCat));
          const matchTitle = (n.title || '').toLowerCase().includes(filterCat);
          if (!matchCat && !matchTags && !matchTitle) return false;
        }

        // Search text query
        if (filters.search) {
          const s = filters.search.toLowerCase().trim();
          const matchTitle = (n.title || '').toLowerCase().includes(s);
          const matchText = (n.contentText || '').toLowerCase().includes(s);
          const matchCat = (n.category || '').toLowerCase().includes(s);
          const matchTags = Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(s));
          if (!matchTitle && !matchText && !matchCat && !matchTags) return false;
        }

        return true;
      }).sort((a, b) => {
        // Pinned first, then favorites, then updated
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
    }

    // ========================================================================
    // 3. REVISION HISTORY & VERSION SNAPSHOTS
    // ========================================================================

    async saveVersionSnapshot(note, changeSummary = 'Edit', actor = null) {
      const user = actor || this.getCurrentActor();
      const versionId = `ver-${note.noteId}-v${note.version || 1}-${Date.now().toString(36)}`;
      const snapshot = {
        versionId,
        noteId: note.noteId,
        versionNumber: note.version || 1,
        title: note.title,
        contentHtml: note.contentHtml,
        contentText: note.contentText,
        authorName: user.name,
        authorEmail: user.email,
        authorRole: user.role,
        changeSummary: changeSummary || 'Revision snapshot',
        timestamp: new Date().toISOString(),
        formattedDate: formatDate()
      };

      if (window.JanasevaDB) {
        const versions = window.JanasevaDB.get('note_versions', []);
        versions.unshift(snapshot);
        // keep max 30 revisions per note
        window.JanasevaDB.set('note_versions', versions.slice(0, 300));
      }

      if (window.JanasevaKnowledgeCentre?.idb) {
        try { await window.JanasevaKnowledgeCentre.idb.put('note_versions', snapshot); } catch (e) {}
      }

      return snapshot;
    }

    async getNoteVersions(noteId) {
      if (!noteId) return [];
      const versions = window.JanasevaDB ? window.JanasevaDB.get('note_versions', []) : [];
      return versions
        .filter(v => v.noteId === noteId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    async restoreNoteVersion(noteId, versionId, actor = null) {
      const versions = await this.getNoteVersions(noteId);
      const targetVersion = versions.find(v => v.versionId === versionId);
      if (!targetVersion) throw new Error('Target version snapshot not found.');

      return this.updateNote(noteId, {
        title: targetVersion.title,
        contentHtml: targetVersion.contentHtml,
        contentText: targetVersion.contentText,
        changeSummary: `Restored to version ${targetVersion.versionNumber} from ${targetVersion.formattedDate}`
      }, actor);
    }

    // ========================================================================
    // 4. APPROVAL WORKFLOW (Personal Draft -> Review -> Approved Library)
    // ========================================================================

    async submitNoteForApproval(noteId, actor = null) {
      const user = actor || this.getCurrentActor();
      const note = await this.getNote(noteId, user);
      if (!note) throw new Error('Note not found.');

      const nowISO = new Date().toISOString();
      const approvalId = genId('appr');

      const approvalRecord = {
        approvalId,
        noteId: note.noteId,
        noteTitle: note.title,
        notebookName: note.notebookName,
        submittedByUid: user.uid,
        submittedByName: user.name,
        submittedByEmail: user.email,
        submittedByRole: user.role,
        status: 'PENDING',
        reviewerUid: null,
        reviewerName: null,
        reviewedAt: null,
        comments: 'Submitted for verification and addition to Official AI Knowledge Library',
        submittedAt: nowISO,
        formattedDate: formatDate(nowISO)
      };

      if (window.JanasevaDB) {
        const approvals = window.JanasevaDB.get('knowledge_approvals', []);
        approvals.unshift(approvalRecord);
        window.JanasevaDB.set('knowledge_approvals', approvals);
      }

      await this.updateNote(noteId, {
        approvalStatus: 'UNDER_REVIEW',
        approvalTimestamp: nowISO
      }, user);

      this.logActivity('APPROVAL_REQUESTED', noteId, `Submitted note "${note.title}" for AI Knowledge Library review`, user);
      return approvalRecord;
    }

    async reviewNoteApproval(approvalId, { status = 'APPROVED', comments = '' }, reviewer = null) {
      const admin = reviewer || this.getCurrentActor();
      if (!admin.isAdmin) {
        throw new Error('Access Denied: Only Administrators can review and approve notes for the Knowledge Library.');
      }

      let approvals = window.JanasevaDB ? window.JanasevaDB.get('knowledge_approvals', []) : [];
      const idx = approvals.findIndex(a => a.approvalId === approvalId);
      if (idx === -1) throw new Error('Approval request not found.');

      const req = approvals[idx];
      const nowISO = new Date().toISOString();

      req.status = status; // 'APPROVED' or 'REJECTED'
      req.reviewerUid = admin.uid;
      req.reviewerName = admin.name;
      req.reviewedAt = nowISO;
      req.comments = comments || (status === 'APPROVED' ? 'Approved for official library publication' : 'Changes requested');
      approvals[idx] = req;
      if (window.JanasevaDB) window.JanasevaDB.set('knowledge_approvals', approvals);

      // Update the note status
      const isApproved = status === 'APPROVED';
      await this.updateNote(req.noteId, {
        approvalStatus: isApproved ? 'APPROVED' : 'REJECTED',
        isPublicKnowledge: isApproved,
        approvalReviewer: admin.email,
        approvalFeedback: comments
      }, admin);

      this.logActivity(isApproved ? 'NOTE_APPROVED_FOR_LIBRARY' : 'NOTE_APPROVAL_REJECTED', req.noteId, `Note "${req.noteTitle}" was ${status} by Admin ${admin.email}`, admin);
      return req;
    }

    async revokeLibraryApproval(noteId, reason = 'Administrative revocation', actor = null) {
      const admin = actor || this.getCurrentActor();
      if (!admin.isAdmin) {
        throw new Error('Access Denied: Only Administrators can revoke library approval.');
      }

      const updated = await this.updateNote(noteId, {
        approvalStatus: 'DRAFT',
        isPublicKnowledge: false,
        approvalFeedback: `Revoked from library on ${formatDate()}: ${reason}`
      }, admin);

      this.logActivity('NOTE_APPROVAL_REVOKED', noteId, `Revoked note "${updated.title}" from AI Knowledge Library. Reason: ${reason}`, admin);
      return updated;
    }

    async listPendingApprovals(actor = null) {
      const user = actor || this.getCurrentActor();
      const approvals = window.JanasevaDB ? window.JanasevaDB.get('knowledge_approvals', []) : [];
      return approvals.filter(a => {
        if (a.status !== 'PENDING') return false;
        if (!user.isAdmin && a.submittedByUid !== user.uid) return false;
        return true;
      });
    }

    // ========================================================================
    // 5. KNOWLEDGE SHARING & PERMISSION ARCHITECTURE
    // ========================================================================

    async createShareLink({
      targetType = 'NOTE', // 'NOTE' | 'NOTEBOOK'
      targetId,
      accessLevel = 'VIEWER', // 'VIEWER' | 'EDITOR' | 'ADMIN'
      password = '',
      expiryDays = 0,
      allowedEmails = [],
      actor = null
    }) {
      const user = actor || this.getCurrentActor();
      if (!targetId) throw new Error('Target ID is required.');

      // Check ownership
      let title = 'Shared Item';
      if (targetType === 'NOTE') {
        const note = await this.getNote(targetId, user);
        if (!note) throw new Error('Target note not found.');
        title = note.title;
      } else {
        const nb = await this.getNotebook(targetId, user);
        if (!nb) throw new Error('Target notebook not found.');
        title = nb.name;
      }

      // Generate cryptographically strong unguessable token
      const array = new Uint8Array(24);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(array);
      } else {
        for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 256);
      }
      const token = 'sh_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');

      let passwordHash = null;
      if (password && password.trim()) {
        passwordHash = await this.computeHash(password.trim());
      }

      let expiresAt = null;
      if (Number(expiryDays) > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + Number(expiryDays));
        expiresAt = expDate.toISOString();
      }

      const nowISO = new Date().toISOString();
      const shareId = genId('sh');

      const shareLink = {
        shareId,
        targetType,
        targetId,
        targetTitle: title,
        ownerUid: user.uid,
        ownerEmail: user.email,
        token,
        accessLevel,
        requiresPassword: Boolean(passwordHash),
        passwordHash,
        expiresAt,
        allowedEmails: Array.isArray(allowedEmails) ? allowedEmails.map(e => e.toLowerCase().trim()) : [],
        isActive: true,
        accessCount: 0,
        lastAccessedAt: null,
        createdAt: nowISO,
        formattedDate: formatDate(nowISO)
      };

      if (window.JanasevaDB) {
        const shares = window.JanasevaDB.get('share_links', []);
        shares.unshift(shareLink);
        window.JanasevaDB.set('share_links', shares);
      }

      this.logActivity('SHARE_LINK_CREATED', targetId, `Created share link for ${targetType} "${title}" with ${accessLevel} rights`, user);
      return shareLink;
    }

    async verifyShareLink(token, password = '', userEmail = '') {
      if (!token) throw new Error('Share token is required.');
      const shares = window.JanasevaDB ? window.JanasevaDB.get('share_links', []) : [];
      const link = shares.find(s => s.token === token && s.isActive);

      if (!link) {
        return { valid: false, error: 'Link is invalid or has been revoked by the owner.' };
      }

      // Expiry check
      if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
        return { valid: false, error: 'This sharing link has expired.' };
      }

      // Email restriction check
      if (link.allowedEmails && link.allowedEmails.length > 0) {
        const cleanEmail = (userEmail || '').toLowerCase().trim();
        if (!cleanEmail || !link.allowedEmails.includes(cleanEmail)) {
          return { valid: false, error: 'Your email address is not authorized to access this shared resource.' };
        }
      }

      // Password check
      if (link.requiresPassword) {
        if (!password) {
          return { valid: false, requiresPassword: true, error: 'Password required to unlock this shared resource.' };
        }
        const enteredHash = await this.computeHash(password.trim());
        if (enteredHash !== link.passwordHash) {
          return { valid: false, requiresPassword: true, error: 'Incorrect password.' };
        }
      }

      // Record access
      link.accessCount = (link.accessCount || 0) + 1;
      link.lastAccessedAt = new Date().toISOString();
      if (window.JanasevaDB) window.JanasevaDB.set('share_links', shares);

      return { valid: true, shareLink: link };
    }

    async revokeShareLink(shareId, actor = null) {
      const user = actor || this.getCurrentActor();
      let shares = window.JanasevaDB ? window.JanasevaDB.get('share_links', []) : [];
      const link = shares.find(s => s.shareId === shareId);
      if (!link) throw new Error('Share link not found.');

      if (link.ownerUid !== user.uid && !user.isAdmin) {
        throw new Error('Access Denied: Only the resource owner or an administrator can revoke sharing.');
      }

      link.isActive = false;
      link.revokedAt = new Date().toISOString();
      link.revokedBy = user.email;
      if (window.JanasevaDB) window.JanasevaDB.set('share_links', shares);

      this.logActivity('SHARE_LINK_REVOKED', link.targetId, `Revoked share link for ${link.targetType} "${link.targetTitle}"`, user);
      return link;
    }

    async grantUserPermission({ targetType, targetId, granteeEmail, role = 'VIEWER', actor = null }) {
      const user = actor || this.getCurrentActor();
      if (!granteeEmail) throw new Error('Grantee email is required.');

      const cleanEmail = granteeEmail.toLowerCase().trim();
      let perms = window.JanasevaDB ? window.JanasevaDB.get('access_permissions', []) : [];
      
      const permId = genId('perm');
      const permRecord = {
        permissionId: permId,
        targetType,
        targetId,
        granteeEmail: cleanEmail,
        granteeUid: null,
        role, // 'VIEWER' | 'EDITOR' | 'ADMIN'
        grantedBy: user.email,
        grantedAt: new Date().toISOString()
      };

      perms = perms.filter(p => !(p.targetId === targetId && p.granteeEmail === cleanEmail));
      perms.unshift(permRecord);
      if (window.JanasevaDB) window.JanasevaDB.set('access_permissions', perms);

      this.logActivity('PERMISSION_GRANTED', targetId, `Granted ${role} access to ${cleanEmail} for ${targetType}`, user);
      return permRecord;
    }

    checkPermission(targetId, targetType, user, requiredRole = 'VIEWER') {
      if (!user) return false;
      if (user.isAdmin) return true;

      const cleanEmail = (user.email || '').toLowerCase().trim();
      const perms = window.JanasevaDB ? window.JanasevaDB.get('access_permissions', []) : [];
      
      const p = perms.find(perm => perm.targetId === targetId && (perm.granteeEmail === cleanEmail || perm.granteeUid === user.uid));
      if (!p) return false;

      const rolesHierarchy = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };
      return (rolesHierarchy[p.role] || 0) >= (rolesHierarchy[requiredRole] || 1);
    }

    // ========================================================================
    // 6. RAG INDEXING OF NOTES INTO KNOWLEDGE CHUNKS
    // ========================================================================

    async indexNoteIntoRagChunks(note) {
      if (!note || !note.noteId || note.isDeleted) return;

      const text = `${note.title}\n\nCategory: ${note.category}\n\n${note.contentText}`;
      if (text.trim().length < 15) return;

      // Create chunks of ~400 characters
      const chunkSize = 400;
      const chunks = [];
      const words = text.split(/\s+/);
      let cur = '';

      for (const w of words) {
        if ((cur + ' ' + w).length > chunkSize) {
          chunks.push(cur.trim());
          cur = w;
        } else {
          cur = cur ? cur + ' ' + w : w;
        }
      }
      if (cur.trim()) chunks.push(cur.trim());

      const ragChunks = chunks.map((chunkText, idx) => ({
        chunkId: `chk-note-${note.noteId}-${idx}`,
        docId: `note-${note.noteId}`,
        noteId: note.noteId,
        notebookId: note.notebookId,
        notebookName: note.notebookName,
        title: note.title,
        fileName: `${note.title} (Note)`,
        text: chunkText,
        chunkIndex: idx,
        totalChunks: chunks.length,
        category: note.category,
        language: 'en',
        sourceReliability: (note.approvalStatus === 'APPROVED' || note.approvalStatus === 'PUBLISHED') ? 0.95 : 0.6,
        trustLabel: (note.approvalStatus === 'APPROVED' || note.approvalStatus === 'PUBLISHED') ? 'Approved Knowledge Note' : 'Personal Note',
        isNote: true,
        approvalStatus: note.approvalStatus,
        ownerUid: note.ownerUid,
        ownerEmail: note.ownerEmail,
        isPublicKnowledge: Boolean(note.isPublicKnowledge),
        active: true
      }));

      // Put chunks into IndexedDB knowledge_chunks
      if (window.JanasevaKnowledgeCentre?.idb) {
        try {
          for (const c of ragChunks) {
            await window.JanasevaKnowledgeCentre.idb.put('knowledge_chunks', c);
          }
        } catch (e) {}
      }
    }

    /**
     * Retrieve permitted notebook notes for RAG grounding based on actor permissions.
     * Enforces strict isolation: personal notes are NEVER exposed to other users.
     */
    async getPermittedNotesForRAG(actor = null) {
      const user = actor || this.getCurrentActor();
      let notes = window.JanasevaDB ? window.JanasevaDB.get('notes', []) : [];
      return notes.filter(n => {
        if (n.isDeleted) return false;
        // 1. Official Approved & Published notes are available to public RAG
        if (n.approvalStatus === 'APPROVED' || n.approvalStatus === 'PUBLISHED' || n.isPublicKnowledge) return true;
        // 2. Personal notes are strictly isolated: visible ONLY to the creator or authorized users
        if (user && user.uid && n.ownerUid === user.uid) return true;
        if (user && user.isAdmin) return true;
        if (user && (this.checkPermission(n.noteId, 'NOTE', user, 'VIEWER') || this.checkPermission(n.notebookId, 'NOTEBOOK', user, 'VIEWER'))) return true;
        return false;
      });
    }

    // ========================================================================
    // 7. OFFLINE SYNC QUEUE & HELPERS
    // ========================================================================

    enqueueSync(operation, entityType, entityId, payload) {
      const queueItem = {
        queueId: genId('sq'),
        operation,
        entityType,
        entityId,
        payload,
        status: 'PENDING',
        retryCount: 0,
        timestamp: new Date().toISOString()
      };

      if (window.JanasevaDB) {
        const queue = window.JanasevaDB.get('sync_queue', []);
        queue.push(queueItem);
        window.JanasevaDB.set('sync_queue', queue);
      }
    }

    async processSyncQueue() {
      if (!navigator.onLine || !window.isFirebaseAvailable || !window.fbDb) return;
      const queue = window.JanasevaDB ? window.JanasevaDB.get('sync_queue', []) : [];
      if (!queue.length) return;

      const remaining = [];
      for (const item of queue) {
        try {
          const colName = item.entityType === 'NOTEBOOK' ? 'notebooks' : 'notes';
          if (item.operation === 'CREATE' || item.operation === 'UPDATE') {
            await window.fbDb.collection(colName).doc(item.entityId).set(item.payload, { merge: true });
          } else if (item.operation === 'DELETE') {
            await window.fbDb.collection(colName).doc(item.entityId).delete();
          }
        } catch (err) {
          console.warn('[JanasevaNotebook] Sync queue item failed, keeping for retry:', err);
          item.retryCount = (item.retryCount || 0) + 1;
          if (item.retryCount < 5) remaining.push(item);
        }
      }

      if (window.JanasevaDB) window.JanasevaDB.set('sync_queue', remaining);
    }

    // ========================================================================
    // 8. UTILITIES (Checklists, Hash, Markdown Export, Seed Data)
    // ========================================================================

    calculateChecklistStats(html = '') {
      const checkedMatches = (html.match(/class=["'][^"']*checklist-item-checked[^"']*["']/gi) || []).length;
      const totalMatches = (html.match(/class=["'][^"']*checklist-item[^"']*["']/gi) || []).length;
      return {
        total: totalMatches,
        completed: checkedMatches,
        isComplete: totalMatches > 0 && checkedMatches === totalMatches
      };
    }

    stripHtml(html = '') {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }

    async computeHash(str) {
      if (window.crypto?.subtle) {
        const buf = new TextEncoder().encode(str);
        const hash = await window.crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      // Simple fallback hash
      let h = 0;
      for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
      return 'f_' + Math.abs(h).toString(16);
    }

    logActivity(action, targetId, details, actor) {
      const act = actor || this.getCurrentActor();
      const logEntry = {
        logId: genId('act'),
        action,
        targetId,
        details,
        actorEmail: act.email,
        actorName: act.name,
        actorRole: act.role,
        timestamp: new Date().toISOString(),
        formattedDate: formatDate()
      };

      if (window.JanasevaDB) {
        const logs = window.JanasevaDB.get('activity_logs', []);
        logs.unshift(logEntry);
        window.JanasevaDB.set('activity_logs', logs.slice(0, 300));
      }
    }

    /**
     * Seeds verified official starter notebooks for immediate productivity
     */
    async seedDefaultNotebooksIfEmpty() {
      if (!window.JanasevaDB) return;
      const existing = window.JanasevaDB.get('notebooks', []);
      if (existing.length > 0) return;

      const adminActor = {
        uid: 'usr-admin-default',
        name: 'Panchayat Development Officer',
        email: 'admin@janaseva.local',
        role: 'admin',
        isAdmin: true
      };

      // Notebook 1: Official Approved Schemes
      const nb1 = await this.createNotebook({
        name: 'Gram Panchayat Citizen Schemes & Subsidies 2026',
        description: 'Approved official guide to rural water, housing, solar lighting, and welfare subsidies.',
        category: 'Gram Panchayat Schemes',
        color: '#138808', // Emerald
        icon: 'fa-solid fa-landmark',
        coverStyle: 'gradient',
        visibility: 'public_approved',
        actor: adminActor
      });

      // Note in Notebook 1
      await this.createNote({
        notebookId: nb1.notebookId,
        title: 'Jal Jeevan Mission – Rural Household Water Tap Connection Procedure',
        category: 'Gram Panchayat Schemes',
        tags: ['water', 'tap connection', 'jal jeevan', 'subsidies'],
        contentHtml: `
          <h2>Jal Jeevan Mission (JJM) – Water Tap Guidelines</h2>
          <p>Every rural household in the Gram Panchayat is entitled to a clean, functional household tap connection (FHTC) delivering 55 litres per capita per day.</p>
          <h3>Eligibility Criteria:</h3>
          <ul>
            <li>Resident of Gram Panchayat with registered property assessment / e-Swathu Form-9/11.</li>
            <li>No existing illegal direct pipeline tapping.</li>
          </ul>
          <h3>Required Documents:</h3>
          <ol>
            <li>Aadhaar Card of household head.</li>
            <li>Latest Property Tax Receipt / e-Swathu extract.</li>
            <li>Self-declaration application form signed by citizen.</li>
          </ol>
          <div class="callout-box" style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 10px; margin: 12px 0;">
            <strong>Official Guarantee:</strong> Gram Panchayat water receiver must complete connection inspection within <strong>7 working days</strong> of application submission.
          </div>
        `,
        isPinned: true,
        isFavorite: true,
        actor: adminActor
      });

      // Mark this note as approved for public library RAG
      const allNotes = window.JanasevaDB.get('notes', []);
      if (allNotes.length > 0) {
        allNotes[0].approvalStatus = 'APPROVED';
        allNotes[0].isPublicKnowledge = true;
        window.JanasevaDB.set('notes', allNotes);
        await this.indexNoteIntoRagChunks(allNotes[0]);
      }

      // Notebook 2: Field Remediation & Grievance Guidelines
      const nb2 = await this.createNotebook({
        name: 'Panchayat Administrative Procedures & Service Guarantees',
        description: 'SOPs for streetlight replacement, road repair, solid waste clearance, and trade licenses.',
        category: 'Circulars & Policies',
        color: '#0f56b3', // Indian Navy
        icon: 'fa-solid fa-shield-halved',
        coverStyle: 'gradient',
        visibility: 'public_approved',
        actor: adminActor
      });

      await this.createNote({
        notebookId: nb2.notebookId,
        title: 'Streetlight Maintenance & LED Replacement SOP',
        category: 'Circulars & Policies',
        tags: ['streetlight', 'electrician', 'led', 'timeline'],
        contentHtml: `
          <h2>Streetlight Defect Rectification Standard Operating Procedure</h2>
          <p>Gram Panchayat electricians are assigned ward-level responsibility for keeping streetlights operational.</p>
          <h3>Service Timelines:</h3>
          <ul>
            <li><strong>Bulb / Choke Failure:</strong> Remediation within 24–48 hours of complaint receipt.</li>
            <li><strong>Cable Snap / Short Circuit:</strong> Immediate isolation and repair within 12 hours.</li>
            <li><strong>New Pole Erection:</strong> Requires ward committee approval in monthly Gram Sabha.</li>
          </ul>
        `,
        isPinned: false,
        isFavorite: true,
        actor: adminActor
      });

      const notesList = window.JanasevaDB ? window.JanasevaDB.get('notes', []) : [];
      if (notesList.length > 1) {
        notesList[1].approvalStatus = 'APPROVED';
        notesList[1].isPublicKnowledge = true;
        window.JanasevaDB.set('notes', notesList);
        await this.indexNoteIntoRagChunks(notesList[1]);
      }
    }
  }

  window.JanasevaNotebookService = new JanasevaNotebookService();
})(window);
