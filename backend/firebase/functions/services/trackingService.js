/**
 * JANASEVA – Authorized Complaint Tracking & History Service
 * Enforces strict ownership/role checks, strips internal admin notes for citizens,
 * and returns only verified database state and chronological history.
 */

const functions = require("firebase-functions");

function isCallerAuthorizedForComplaint(complaint, caller) {
  if (!complaint || !caller || !caller.uid) return false;
  if (caller.role === "admin") return true;
  if (caller.role === "receiver" && caller.panchayatId && complaint.panchayatId === caller.panchayatId) {
    return true;
  }
  if (complaint.userId === caller.uid || complaint.citizenUid === caller.uid) return true;
  if (
    caller.email &&
    complaint.citizenEmail &&
    caller.email.toLowerCase() === String(complaint.citizenEmail).toLowerCase()
  ) {
    return true;
  }
  return false;
}

function sanitizeComplaintForCaller(complaint, caller) {
  const isOfficial = caller.role === "admin" || (caller.role === "receiver" && caller.panchayatId === complaint.panchayatId);
  const copy = {
    complaintId: complaint.complaintId,
    category: complaint.category || "General",
    subject: complaint.subject || complaint.category || "Grievance",
    description: complaint.description || "",
    panchayatId: complaint.panchayatId || "",
    panchayatName: complaint.panchayatName || complaint.panchayatId || "Gram Panchayat",
    village: complaint.village || "",
    location: complaint.location || "",
    status: complaint.status || "Submitted",
    aiPriority: complaint.aiPriority || "NORMAL",
    assignedDepartment: complaint.assignedDepartment || complaint.aiDepartment || "General Administration",
    assignedReceiverName: complaint.assignedReceiverName || null,
    createdAt: complaint.createdAt || complaint.submissionDate || "",
    submissionDate: complaint.submissionDate || complaint.createdAt || "",
    submissionTimestamp: complaint.submissionTimestamp || null,
    updatedAt: complaint.updatedAt || complaint.lastUpdatedDate || "",
    resolutionDate: complaint.resolutionDate || null,
    officialResponse: complaint.officialResponse || "",
    rejectionReason: complaint.rejectionReason || null,
    reopenReason: complaint.reopenReason || null,
    workProgress: complaint.workProgress || null,
    photoURL: complaint.photoURL || null,
    supportingDocuments: Array.isArray(complaint.supportingDocuments) ? complaint.supportingDocuments : []
  };

  if (isOfficial) {
    copy.citizenName = complaint.citizenName;
    copy.citizenEmail = complaint.citizenEmail;
    copy.internalNotes = complaint.internalNotes || null;
  }
  return copy;
}

/**
 * Fetch detailed status, action taken, and timeline for one authorized complaint.
 */
async function trackSingleComplaint(db, caller, complaintId) {
  const cleanId = String(complaintId || "").trim().toUpperCase();
  if (!cleanId || !/^JAN-\d{4}-\d{3,6}$/.test(cleanId)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid Complaint ID format. Expected format like JAN-2026-XXXX.");
  }

  const docSnap = await db.collection("complaints").doc(cleanId).get();
  if (!docSnap.exists) {
    throw new functions.https.HttpsError("not-found", `Complaint ${cleanId} was not found.`);
  }

  const complaint = docSnap.data() || {};
  if (!isCallerAuthorizedForComplaint(complaint, caller)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Access Denied: You are only authorized to inspect complaints registered under your own account."
    );
  }

  const isOfficial = caller.role === "admin" || (caller.role === "receiver" && caller.panchayatId === complaint.panchayatId);

  const [histSnap, updSnap, msgSnap] = await Promise.all([
    db.collection("complaints").doc(cleanId).collection("statusHistory").get().catch(() => null),
    db.collection("complaints").doc(cleanId).collection("updates").get().catch(() => null),
    db.collection("complaints").doc(cleanId).collection("messages").get().catch(() => null)
  ]);

  const timeline = [];
  if (histSnap && !histSnap.empty) {
    histSnap.forEach((d) => {
      const h = d.data() || {};
      timeline.push({
        type: "status_change",
        oldStatus: h.oldStatus || null,
        newStatus: h.newStatus || "Submitted",
        note: h.officialNote || "",
        timestamp: h.timestamp || "",
        updatedBy: isOfficial ? (h.updatedBy || "Official") : "Gram Panchayat Desk"
      });
    });
  }

  if (updSnap && !updSnap.empty) {
    updSnap.forEach((d) => {
      const u = d.data() || {};
      if (u.updateType === "WORK_PROGRESS_UPDATE" || u.updateType === "STATUS_CHANGE") {
        const resDet = typeof u.resolutionDetails === "string" && u.resolutionDetails.startsWith("WORK_PROGRESS_JSON:")
          ? null
          : u.resolutionDetails;
        timeline.push({
          type: u.updateType.toLowerCase(),
          oldStatus: u.oldStatus || null,
          newStatus: u.newStatus || complaint.status,
          note: u.remarks || "",
          resolutionDetails: resDet || null,
          timestamp: u.timestamp || u.formattedDate || "",
          updatedBy: u.authorName || "Gram Panchayat Desk"
        });
      }
    });
  }

  timeline.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

  const publicMessages = [];
  if (msgSnap && !msgSnap.empty) {
    msgSnap.forEach((d) => {
      const m = d.data() || {};
      if (isOfficial || String(m.visibility || "public").toLowerCase() !== "internal") {
        publicMessages.push({
          senderName: m.senderName || "Citizen",
          senderRole: m.senderRole || "citizen",
          message: m.message || "",
          visibility: m.visibility || "public",
          createdAt: m.createdAt || ""
        });
      }
    });
    publicMessages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }

  return {
    ...sanitizeComplaintForCaller(complaint, caller),
    timeline,
    publicMessages
  };
}

/**
 * List complaints belonging strictly to the authenticated citizen (or official's scope).
 */
async function listAuthorizedComplaints(db, caller, { limit = 15 } = {}) {
  const safeLimit = Math.min(30, Math.max(1, Number(limit) || 15));
  const byId = new Map();

  if (caller.role === "admin") {
    const snap = await db.collection("complaints").limit(safeLimit).get();
    snap.forEach((d) => byId.set(d.id, d.data()));
  } else if (caller.role === "receiver" && caller.panchayatId) {
    const snap = await db.collection("complaints").where("panchayatId", "==", caller.panchayatId).limit(safeLimit).get();
    snap.forEach((d) => byId.set(d.id, d.data()));
  } else {
    const uidSnap = await db.collection("complaints").where("userId", "==", caller.uid).limit(safeLimit).get();
    uidSnap.forEach((d) => byId.set(d.id, d.data()));

    if (caller.email) {
      const emailSnap = await db.collection("complaints").where("citizenEmail", "==", caller.email.toLowerCase()).limit(safeLimit).get();
      emailSnap.forEach((d) => {
        if (!byId.has(d.id)) byId.set(d.id, d.data());
      });
    }
  }

  const list = Array.from(byId.values())
    .filter((c) => c && c.deletedByCitizen !== true)
    .sort((a, b) => new Date(b.submissionTimestamp || b.createdAt || 0) - new Date(a.submissionTimestamp || a.createdAt || 0))
    .slice(0, safeLimit)
    .map((c) => sanitizeComplaintForCaller(c, caller));

  return list;
}

module.exports = {
  isCallerAuthorizedForComplaint,
  sanitizeComplaintForCaller,
  trackSingleComplaint,
  listAuthorizedComplaints
};
