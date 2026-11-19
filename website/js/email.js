/**
 * JANASEVA – Email Notification & Delivery Service
 * Receiver-controlled email management, EmailJS & Cloud Functions integration,
 * audit trail logging, and live delivery tracking.
 */

class EmailService {
  constructor() {
    this.defaultSettings = {
      receiverEmail: "",
      previousReceiverEmail: "",
      emailjsPublicKey: "",
      emailjsServiceId: "",
      emailjsTemplateId: "",
      emailProvider: "emailjs",
      notificationPreferences: {
        newComplaint: true,
        statusUpdate: true,
        resolution: true,
        citizenAck: true,
        deliveryFailure: true
      },
      updatedAt: new Date().toISOString(),
      updatedBy: "system",
      lastSectionUpdated: "defaults"
    };

    this.cachedSettings = null;
    this.initEmailJS();
  }

  // Load active receiver settings (from Firestore first, fallback to LocalStorage/defaults)
  async getReceiverSettings(options = {}) {
    const strictRemote = Boolean(options && options.strictRemote);
    // 1. Try Firestore receiverSettings/global if available
    if (window.isFirebaseAvailable && window.fbDb && window.authService && window.authService.currentUser) {
      try {
        const doc = await window.fbDb.collection('receiverSettings').doc('global').get();
        if (doc.exists) {
          const data = doc.data() || {};
          this.cachedSettings = {
            ...this.defaultSettings,
            ...data,
            notificationPreferences: {
              ...this.defaultSettings.notificationPreferences,
              ...(data.notificationPreferences || {})
            }
          };
          JanasevaDB.set('receiverSettings_global', this.cachedSettings);
          JanasevaDB.set('settings', this.cachedSettings);
          this.initEmailJS();
          return this.cachedSettings;
        }
      } catch (err) {
        if (strictRemote) {
          throw new Error("Database unreachable while refreshing receiver settings: " + (err.message || err));
        }
        console.warn("JANASEVA: Firestore receiverSettings fetch error (using local cache):", err.message);
      }
    } else if (strictRemote && window.isFirebaseAvailable && window.fbDb && (!window.authService || !window.authService.currentUser)) {
      throw new Error("Authentication required to refresh receiver settings from database.");
    }

    // 2. Try LocalStorage
    const local = JanasevaDB.get('receiverSettings_global', null) || JanasevaDB.get('settings', null);
    if (local) {
      this.cachedSettings = {
        ...this.defaultSettings,
        ...local,
        notificationPreferences: {
          ...this.defaultSettings.notificationPreferences,
          ...(local.notificationPreferences || {})
        }
      };
      return this.cachedSettings;
    }

    // 3. Fallback to default
    this.cachedSettings = {
      ...this.defaultSettings,
      notificationPreferences: { ...this.defaultSettings.notificationPreferences }
    };
    return this.cachedSettings;
  }

  // Synchronous getter for backwards compatibility
  getSettings() {
    if (this.cachedSettings) return this.cachedSettings;
    const local = JanasevaDB.get('receiverSettings_global', null) || JanasevaDB.get('settings', null);
    if (!local) {
      return {
        ...this.defaultSettings,
        notificationPreferences: { ...this.defaultSettings.notificationPreferences }
      };
    }
    return {
      ...this.defaultSettings,
      ...local,
      notificationPreferences: {
        ...this.defaultSettings.notificationPreferences,
        ...(local.notificationPreferences || {})
      }
    };
  }

  // Section-scoped partial save helper preserving all unrelated sections
  async updateReceiverSettingsSection(sectionKey, partialFields, user, auditAction = 'SETTINGS_SECTION_UPDATED', auditExtra = {}) {
    const current = await this.getReceiverSettings();
    const oldEmail = current.receiverEmail || this.defaultSettings.receiverEmail;

    const mergedPrefs = sectionKey === 'notifications' && partialFields.notificationPreferences
      ? {
          newComplaint: partialFields.notificationPreferences.newComplaint ?? current.notificationPreferences.newComplaint,
          statusUpdate: partialFields.notificationPreferences.statusUpdate ?? current.notificationPreferences.statusUpdate,
          resolution: partialFields.notificationPreferences.resolution ?? current.notificationPreferences.resolution,
          citizenAck: partialFields.notificationPreferences.citizenAck ?? current.notificationPreferences.citizenAck,
          deliveryFailure: partialFields.notificationPreferences.deliveryFailure ?? current.notificationPreferences.deliveryFailure
        }
      : { ...this.defaultSettings.notificationPreferences, ...(current.notificationPreferences || {}) };

    const nextEmail = partialFields.receiverEmail !== undefined
      ? String(partialFields.receiverEmail).trim().toLowerCase()
      : oldEmail;

    const actorEmail = (user && user.email) ? user.email : (current.updatedBy || "");
    const nowIso = new Date().toISOString();

    const payload = {
      receiverEmail: nextEmail,
      previousReceiverEmail: partialFields.previousReceiverEmail !== undefined
        ? String(partialFields.previousReceiverEmail).trim().toLowerCase()
        : (oldEmail !== nextEmail ? oldEmail : (current.previousReceiverEmail || "")),
      emailjsPublicKey: partialFields.emailjsPublicKey !== undefined ? String(partialFields.emailjsPublicKey).trim() : (current.emailjsPublicKey || ""),
      emailjsServiceId: partialFields.emailjsServiceId !== undefined ? String(partialFields.emailjsServiceId).trim() : (current.emailjsServiceId || ""),
      emailjsTemplateId: partialFields.emailjsTemplateId !== undefined ? String(partialFields.emailjsTemplateId).trim() : (current.emailjsTemplateId || ""),
      emailProvider: partialFields.emailProvider !== undefined ? partialFields.emailProvider : (current.emailProvider || "emailjs"),
      notificationPreferences: mergedPrefs,
      updatedAt: nowIso,
      updatedBy: actorEmail,
      lastSectionUpdated: sectionKey || "general"
    };

    // 1. Persist to Firestore first & require confirmation before mutating local state
    if (window.isFirebaseAvailable && window.fbDb) {
      await window.fbDb.collection('receiverSettings').doc('global').set(payload, { merge: true });
    }

    // 2. Record Audit Trail Entry
    const auditEntry = {
      auditId: 'audit-' + Date.now(),
      changedBy: payload.updatedBy,
      previousEmail: oldEmail,
      newEmail: nextEmail,
      section: sectionKey || 'general',
      action: auditAction,
      timestamp: nowIso,
      userAgent: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : 'unknown',
      status: 'VERIFIED',
      ...auditExtra
    };

    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        await window.fbDb.collection('receiverSettingsAudit').add(auditEntry);
      } catch (e) {
        console.warn("JANASEVA: Audit log warning:", e.message);
      }
    }

    // 3. Mirror in localStorage only after DB confirms
    this.cachedSettings = payload;
    JanasevaDB.set('receiverSettings_global', payload);
    JanasevaDB.set('settings', payload);

    const audits = JanasevaDB.get('receiverSettingsAudit', []);
    audits.unshift(auditEntry);
    JanasevaDB.set('receiverSettingsAudit', audits.slice(0, 50));

    this.initEmailJS();
    return { success: true, settings: payload, audit: auditEntry };
  }

  async saveRecipientSection(newEmail, user, isReset = false) {
    const clean = String(newEmail || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      throw new Error("Please provide a valid recipient email address.");
    }
    return await this.updateReceiverSettingsSection(
      'recipient',
      { receiverEmail: clean },
      user,
      isReset ? 'RECIPIENT_RESET_TO_DEFAULT' : 'RECIPIENT_EMAIL_CHANGED'
    );
  }

  async resetRecipientSection(user) {
    return await this.saveRecipientSection(this.defaultSettings.receiverEmail, user, true);
  }

  async saveDeliveryConfigSection(cfg, user, isReset = false) {
    const allowedProviders = ['emailjs', 'smtp', 'both', 'simulation'];
    const provider = allowedProviders.includes(cfg?.emailProvider) ? cfg.emailProvider : 'emailjs';
    return await this.updateReceiverSettingsSection(
      'delivery',
      {
        emailProvider: provider,
        emailjsPublicKey: cfg?.emailjsPublicKey !== undefined ? String(cfg.emailjsPublicKey).trim() : "",
        emailjsServiceId: cfg?.emailjsServiceId !== undefined ? String(cfg.emailjsServiceId).trim() : "",
        emailjsTemplateId: cfg?.emailjsTemplateId !== undefined ? String(cfg.emailjsTemplateId).trim() : ""
      },
      user,
      isReset ? 'DELIVERY_CONFIG_RESET' : 'DELIVERY_CONFIG_UPDATED'
    );
  }

  async resetDeliveryConfigSection(user) {
    return await this.saveDeliveryConfigSection(
      {
        emailProvider: this.defaultSettings.emailProvider,
        emailjsPublicKey: "",
        emailjsServiceId: "",
        emailjsTemplateId: ""
      },
      user,
      true
    );
  }

  async saveNotificationPrefsSection(prefs, user, isReset = false) {
    return await this.updateReceiverSettingsSection(
      'notifications',
      {
        notificationPreferences: {
          newComplaint: Boolean(prefs?.newComplaint),
          statusUpdate: Boolean(prefs?.statusUpdate),
          resolution: Boolean(prefs?.resolution),
          citizenAck: Boolean(prefs?.citizenAck),
          deliveryFailure: Boolean(prefs?.deliveryFailure)
        }
      },
      user,
      isReset ? 'NOTIFICATION_PREFS_RESET' : 'NOTIFICATION_PREFS_UPDATED'
    );
  }

  async resetNotificationPrefsSection(user) {
    return await this.saveNotificationPrefsSection({ ...this.defaultSettings.notificationPreferences }, user, true);
  }

  // Backwards-compatible unified save method (safely respects explicit empty strings)
  async saveReceiverSettings(newSettings, user) {
    const partial = {};
    let section = 'general';
    let action = 'DELIVERY_SETTINGS_UPDATED';

    if (newSettings.receiverEmail !== undefined) {
      partial.receiverEmail = newSettings.receiverEmail;
      section = 'recipient';
      action = 'RECIPIENT_EMAIL_CHANGED';
    }
    if (newSettings.emailjsPublicKey !== undefined) partial.emailjsPublicKey = newSettings.emailjsPublicKey;
    if (newSettings.emailjsServiceId !== undefined) partial.emailjsServiceId = newSettings.emailjsServiceId;
    if (newSettings.emailjsTemplateId !== undefined) partial.emailjsTemplateId = newSettings.emailjsTemplateId;
    if (newSettings.emailProvider !== undefined) partial.emailProvider = newSettings.emailProvider;
    if (newSettings.notificationPreferences !== undefined) {
      partial.notificationPreferences = newSettings.notificationPreferences;
      if (section === 'general') section = 'notifications';
    }
    if (section === 'general' && (partial.emailProvider !== undefined || partial.emailjsPublicKey !== undefined)) {
      section = 'delivery';
    }

    return await this.updateReceiverSettingsSection(section, partial, user, action);
  }

  // Initialize EmailJS SDK
  initEmailJS() {
    const settings = this.getSettings();
    if (typeof emailjs !== 'undefined' && settings.emailjsPublicKey) {
      try {
        emailjs.init(settings.emailjsPublicKey);
        console.log("JANASEVA: EmailJS initialized with key", settings.emailjsPublicKey);
      } catch (e) {
        console.warn("JANASEVA: EmailJS init warning:", e);
      }
    }
  }

  // Record an email log entry into Firestore and LocalStorage
  async logEmail(complaintId, recipient, emailType, deliveryStatus, errorMsg = null) {
    const timestampISO = new Date().toISOString();
    const timestampReadable = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const newLog = {
      logId: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      complaintId: complaintId || 'N/A',
      recipient: recipient || 'unknown',
      emailType: emailType || 'GENERAL_NOTIFICATION',
      deliveryStatus: deliveryStatus || 'PENDING',
      errorMessage: errorMsg ? String(errorMsg).substring(0, 300) : null,
      timestamp: timestampISO,
      formattedTime: timestampReadable
    };

    // Save to LocalStorage
    const logs = JanasevaDB.get('emailLogs', []);
    logs.unshift(newLog);
    JanasevaDB.set('emailLogs', logs.slice(0, 100));

    // Save to Firestore emailLogs
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        await window.fbDb.collection('emailLogs').add(newLog);
      } catch (err) {
        console.warn("JANASEVA: emailLogs Firestore write notice:", err.message);
      }
    }

    return newLog;
  }

  // Fetch email delivery history (with status filtering)
  async getEmailLogs(statusFilter = 'ALL', options = {}) {
    const strictRemote = Boolean(options && options.strictRemote);
    let logs = [];
    let fetchedRemote = false;

    // Try Firestore first
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        let query = window.fbDb.collection('emailLogs');
        const snap = await query.get();
        fetchedRemote = true;
        if (!snap.empty) {
          snap.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
          });
          logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          JanasevaDB.set('emailLogs', logs);
          JanasevaDB.set('emailLogs_initialized', true);
        }
      } catch (err) {
        if (strictRemote) {
          throw new Error("Database unreachable while refreshing email delivery logs: " + (err.message || err));
        }
        console.warn("JANASEVA: Firestore emailLogs query notice:", err.message);
      }
    }

    // Fallback to LocalStorage if Firestore had no docs or is unavailable
    if (!fetchedRemote && logs.length === 0) {
      logs = JanasevaDB.get('emailLogs', []) || [];
    }

    // Zero fake logs policy: Never seed fake, sample, or dummy complaint logs
    JanasevaDB.set('emailLogs_initialized', true);

    if (statusFilter && statusFilter !== 'ALL') {
      return logs.filter(l => (l.deliveryStatus || '').toUpperCase() === statusFilter.toUpperCase());
    }

    return logs;
  }

  /**
   * Delete an individual email transmission log entry
   */
  async deleteEmailLog(logId) {
    if (!logId) return false;

    // 1. Delete from Firestore first and await every deletion
    if (window.isFirebaseAvailable && window.fbDb) {
      const snap = await window.fbDb.collection('emailLogs').where('logId', '==', logId).get();
      if (!snap.empty) {
        await Promise.all(snap.docs.map(d => d.ref.delete()));
      }
      await window.fbDb.collection('emailLogs').doc(logId).delete();
    }

    // 2. Delete from JanasevaDB
    const logs = JanasevaDB.get('emailLogs', []);
    const filtered = logs.filter(l => l.logId !== logId && l.id !== logId);
    JanasevaDB.set('emailLogs', filtered);
    JanasevaDB.set('emailLogs_initialized', true);

    return true;
  }

  /**
   * Clear all email delivery logs (paginated batch delete, never resurrects sample rows)
   */
  async clearEmailLogs() {
    // 1. Firestore purge in batches of 100
    if (window.isFirebaseAvailable && window.fbDb) {
      while (true) {
        const snap = await window.fbDb.collection('emailLogs').limit(100).get();
        if (snap.empty) break;
        const batch = window.fbDb.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        if (snap.size < 100) break;
      }
    }

    // 2. JanasevaDB purge & mark initialized so sample logs stay deleted on refresh
    JanasevaDB.set('emailLogs', []);
    JanasevaDB.set('emailLogs_initialized', true);
    return true;
  }

  // 1. Send New Complaint Notification to Panchayat Receiver
  async sendComplaintNotificationToReceiver(complaint, panchayat) {
    const settings = await this.getReceiverSettings();

    // Check notification preference
    if (settings.notificationPreferences && settings.notificationPreferences.newComplaint === false) {
      console.log("JANASEVA: Receiver email skipped due to receiver notification preference.");
      await this.logEmail(complaint.complaintId, settings.receiverEmail, 'RECEIVER_NOTIFICATION', 'SKIPPED_PREFERENCE');
      return { success: true, skipped: true };
    }

    // Resolve receiver email: Firestore global receiverSettings takes primary authority
    const targetReceiverEmail = (settings.receiverEmail && settings.receiverEmail.includes('@'))
      ? settings.receiverEmail
      : ((panchayat && panchayat.receiverEmail) ? panchayat.receiverEmail : "");

    const templateParams = {
      to_email: targetReceiverEmail,
      receiver_name: panchayat ? panchayat.name : "Gram Panchayat Officer",
      complaint_id: complaint.complaintId,
      citizen_name: complaint.citizenName,
      citizen_email: complaint.citizenEmail,
      panchayat_name: complaint.panchayatName,
      complaint_category: complaint.category,
      complaint_description: complaint.description,
      submission_date: complaint.createdAt,
      complaint_photo: complaint.photoURL || "No photo attached",
      subject: `New JANASEVA Complaint – [${complaint.complaintId}]`
    };

    console.log(`JANASEVA: Dispatching receiver complaint notification for ${complaint.complaintId} to ${targetReceiverEmail}...`);

    let deliverySuccess = false;
    let errorMessage = null;

    if (typeof emailjs !== 'undefined' && settings.emailjsServiceId && settings.emailjsTemplateId && settings.emailjsPublicKey) {
      try {
        emailjs.init(settings.emailjsPublicKey);
        const response = await emailjs.send(
          settings.emailjsServiceId,
          settings.emailjsTemplateId,
          templateParams
        );
        if (response.status === 200) {
          deliverySuccess = true;
          await this.logEmail(complaint.complaintId, targetReceiverEmail, 'RECEIVER_NOTIFICATION', 'DELIVERED');
        } else {
          errorMessage = `EmailJS status: ${response.status} - ${response.text}`;
          await this.logEmail(complaint.complaintId, targetReceiverEmail, 'RECEIVER_NOTIFICATION', 'FAILED', errorMessage);
        }
      } catch (err) {
        errorMessage = err.message || JSON.stringify(err);
        await this.logEmail(complaint.complaintId, targetReceiverEmail, 'RECEIVER_NOTIFICATION', 'FAILED', errorMessage);
      }
    } else {
      // Simulation mode
      deliverySuccess = true;
      await this.logEmail(complaint.complaintId, targetReceiverEmail, 'RECEIVER_NOTIFICATION', 'SIMULATED');
    }

    return {
      success: deliverySuccess,
      recipient: targetReceiverEmail,
      error: errorMessage
    };
  }

  // 2. Send Complaint Confirmation to Citizen
  async sendConfirmationToCitizen(complaint) {
    const settings = await this.getReceiverSettings();
    if (settings.notificationPreferences && settings.notificationPreferences.citizenAck === false) {
      return { success: true, skipped: true };
    }

    const templateParams = {
      to_email: complaint.citizenEmail,
      citizen_name: complaint.citizenName,
      complaint_id: complaint.complaintId,
      panchayat_name: complaint.panchayatName,
      complaint_category: complaint.category,
      submission_date: complaint.createdAt,
      tracking_url: `${window.location.origin}/track.html?id=${complaint.complaintId}`,
      subject: `Complaint Received – ${complaint.complaintId} | JANASEVA`
    };

    let deliverySuccess = false;
    let errorMessage = null;

    if (typeof emailjs !== 'undefined' && settings.emailjsServiceId && settings.emailjsTemplateId && settings.emailjsPublicKey) {
      try {
        emailjs.init(settings.emailjsPublicKey);
        const response = await emailjs.send(
          settings.emailjsServiceId,
          settings.emailjsTemplateId,
          templateParams
        );
        if (response.status === 200) {
          deliverySuccess = true;
          await this.logEmail(complaint.complaintId, complaint.citizenEmail, 'CITIZEN_CONFIRMATION', 'DELIVERED');
        }
      } catch (err) {
        errorMessage = err.message;
        await this.logEmail(complaint.complaintId, complaint.citizenEmail, 'CITIZEN_CONFIRMATION', 'FAILED', errorMessage);
      }
    } else {
      deliverySuccess = true;
      await this.logEmail(complaint.complaintId, complaint.citizenEmail, 'CITIZEN_CONFIRMATION', 'SIMULATED');
    }

    return { success: deliverySuccess, error: errorMessage };
  }

  // 3. Send Status Update Notification to Citizen
  async sendStatusUpdateNotification(complaint, oldStatus, newStatus, officialResponse) {
    const settings = await this.getReceiverSettings();
    const isResolution = (newStatus || '').toUpperCase() === 'RESOLVED';

    // Respect independent notification preferences
    if (isResolution) {
      if (settings.notificationPreferences && settings.notificationPreferences.resolution === false) {
        console.log("JANASEVA: Resolution email skipped due to resolution notification preference.");
        return { success: true, skipped: true };
      }
    } else {
      if (settings.notificationPreferences && settings.notificationPreferences.statusUpdate === false) {
        console.log("JANASEVA: Status update email skipped due to status update notification preference.");
        return { success: true, skipped: true };
      }
    }

    const emailType = isResolution ? 'COMPLAINT_RESOLUTION' : 'STATUS_UPDATE';
    const templateParams = {
      to_email: complaint.citizenEmail,
      citizen_name: complaint.citizenName,
      complaint_id: complaint.complaintId,
      old_status: oldStatus,
      new_status: newStatus,
      official_response: officialResponse || "No official notes provided.",
      panchayat_name: complaint.panchayatName,
      update_date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      subject: isResolution 
        ? `[RESOLVED] Grievance Redressed – ${complaint.complaintId} | JANASEVA` 
        : `Status Update: ${complaint.complaintId} is now ${newStatus} | JANASEVA`
    };

    let deliverySuccess = false;
    let errorMessage = null;

    if (typeof emailjs !== 'undefined' && settings.emailjsServiceId && settings.emailjsTemplateId && settings.emailjsPublicKey) {
      try {
        emailjs.init(settings.emailjsPublicKey);
        const response = await emailjs.send(
          settings.emailjsServiceId,
          settings.emailjsTemplateId,
          templateParams
        );
        if (response.status === 200) {
          deliverySuccess = true;
          await this.logEmail(complaint.complaintId, complaint.citizenEmail, emailType, 'DELIVERED');
        } else {
          errorMessage = `EmailJS status: ${response.status} - ${response.text}`;
          await this.logEmail(complaint.complaintId, complaint.citizenEmail, emailType, 'FAILED', errorMessage);
        }
      } catch (err) {
        errorMessage = err.message;
        await this.logEmail(complaint.complaintId, complaint.citizenEmail, emailType, 'FAILED', errorMessage);
      }
    } else {
      deliverySuccess = true;
      await this.logEmail(complaint.complaintId, complaint.citizenEmail, emailType, 'SIMULATED');
    }

    return { success: deliverySuccess, error: errorMessage };
  }

  // 4. Send Verified Test Email for Receiver
  async sendTestEmail(receiverAddress, publicKey, serviceId, templateId) {
    const targetEmail = (receiverAddress || this.getSettings().receiverEmail || "").trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      throw new Error("Please enter a valid receiver email address before testing.");
    }

    const pKey = (publicKey || this.getSettings().emailjsPublicKey || "").trim();
    const sId = (serviceId || this.getSettings().emailjsServiceId || "").trim();
    const tId = (templateId || this.getSettings().emailjsTemplateId || "").trim();

    const testComplaintId = "TEST-" + Math.floor(1000 + Math.random() * 9000);

    const testParams = {
      to_email: targetEmail,
      citizen_name: "JANASEVA Receiver Verification System",
      complaint_id: testComplaintId,
      panchayat_name: "Gram Panchayat Operations & Receiver Hub",
      complaint_category: "Email Delivery Verification",
      complaint_description: "This is a verified test dispatch confirming that the JANASEVA Complaint Receiver email pipeline is active and properly routing citizen grievances.",
      submission_date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      complaint_photo: "https://via.placeholder.com/600x400.png?text=JANASEVA+Test",
      subject: `[VERIFIED] JANASEVA Email Delivery System Test – ${testComplaintId}`
    };

    if (typeof emailjs !== 'undefined' && pKey && sId && tId) {
      try {
        emailjs.init(pKey);
        const res = await emailjs.send(sId, tId, testParams);
        if (res.status === 200) {
          await this.logEmail(testComplaintId, targetEmail, 'TEST_EMAIL', 'DELIVERED');
          return {
            success: true,
            simulated: false,
            message: `Test email successfully delivered to ${targetEmail} via EmailJS.`
          };
        } else {
          const errDetail = `EmailJS error: ${res.status} ${res.text}`;
          await this.logEmail(testComplaintId, targetEmail, 'TEST_EMAIL', 'FAILED', errDetail);
          throw new Error(errDetail);
        }
      } catch (err) {
        await this.logEmail(testComplaintId, targetEmail, 'TEST_EMAIL', 'FAILED', err.message);
        throw err;
      }
    } else {
      await this.logEmail(testComplaintId, targetEmail, 'TEST_EMAIL', 'SIMULATED');
      return { 
        success: true, 
        simulated: true,
        message: `Simulation Success: Test email recorded for ${targetEmail}. (Provide EmailJS keys to trigger external SMTP/network dispatch).` 
      };
    }
  }

  // ==========================================================================
  // WHATSAPP NOTIFICATION ENGINE & AUDIT SYSTEM (Part 8 Compliance)
  // ==========================================================================

  // Format and validate recipient phone number to E.164 (+91XXXXXXXXXX)
  formatWhatsAppRecipient(phone) {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (digits.length > 10 && digits.startsWith('0')) return `+91${digits.substring(1)}`;
    return null;
  }

  // Record WhatsApp delivery attempt in JanasevaDB and Firestore
  async logWhatsApp(complaintId, recipient, templateName, deliveryStatus, errorMsg = null) {
    const timestampISO = new Date().toISOString();
    const timestampReadable = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const newLog = {
      logId: 'wa-log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      complaintId: complaintId || 'N/A',
      recipient: recipient || 'unknown',
      templateName: templateName || 'CITIZEN_UPDATE_TEMPLATE',
      deliveryStatus: deliveryStatus || 'NOT_CONFIGURED',
      errorMessage: errorMsg ? String(errorMsg).substring(0, 300) : null,
      timestamp: timestampISO,
      formattedTime: timestampReadable
    };

    // Save to LocalStorage
    const logs = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('whatsappLogs', []) : [];
    logs.unshift(newLog);
    if (typeof JanasevaDB !== 'undefined') {
      JanasevaDB.set('whatsappLogs', logs.slice(0, 100));
    }

    // Save to Firestore whatsappLogs
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        await window.fbDb.collection('whatsappLogs').add(newLog);
      } catch (err) {
        console.warn("JANASEVA: whatsappLogs Firestore write notice:", err.message);
      }
    }

    return newLog;
  }

  // Query WhatsApp delivery logs
  async getWhatsAppLogs(statusFilter = 'ALL') {
    let logs = [];
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        const snap = await window.fbDb.collection('whatsappLogs').orderBy('timestamp', 'desc').limit(50).get();
        if (!snap.empty) {
          snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("JANASEVA: Firestore whatsappLogs query fallback:", e.message);
      }
    }

    if (logs.length === 0 && typeof JanasevaDB !== 'undefined') {
      logs = JanasevaDB.get('whatsappLogs', []);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      return logs.filter(l => (l.deliveryStatus || '').toUpperCase() === statusFilter.toUpperCase());
    }
    return logs;
  }

  // Dispatch WhatsApp notification (Meta Cloud API / Twilio gateway)
  async sendWhatsAppNotification(complaint, recipientPhone, templateType = 'STATUS_UPDATE') {
    const validPhone = this.formatWhatsAppRecipient(recipientPhone || complaint.citizenMobileNumber || complaint.citizenPhone);
    if (!validPhone) {
      const err = "Invalid recipient phone number. Requires valid 10-digit mobile number.";
      await this.logWhatsApp(complaint.complaintId, recipientPhone, templateType, 'INVALID_NUMBER', err);
      return { success: false, status: 'INVALID_NUMBER', error: err };
    }

    // Never read private WhatsApp API tokens from client-readable receiverSettings.
    // Server-side WhatsApp Cloud API secrets belong exclusively in Cloud Functions Firebase Secrets.
    const notice = "WhatsApp Cloud API credentials are managed securely on the server via Firebase Secrets (not in client browser settings).";
    console.warn("JANASEVA:", notice);
    await this.logWhatsApp(complaint.complaintId, validPhone, templateType, 'NOT_CONFIGURED', notice);
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      simulated: true,
      recipient: validPhone,
      message: notice
    };
  }

  // Test WhatsApp message dispatch
  async sendTestWhatsApp(targetPhone, token = null, endpoint = null) {
    const validPhone = this.formatWhatsAppRecipient(targetPhone);
    if (!validPhone) {
      throw new Error("Please enter a valid 10-digit mobile phone number (e.g. ).");
    }

    const testComplaint = {
      complaintId: "TEST-WA-" + Math.floor(1000 + Math.random() * 9000),
      citizenName: "JANASEVA WhatsApp Verification Tester",
      status: "Active"
    };

    return await this.sendWhatsAppNotification(testComplaint, validPhone, 'SYSTEM_TEST');
  }

}

window.emailService = new EmailService();
