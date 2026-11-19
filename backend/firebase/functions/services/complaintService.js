/**
 * JANASEVA – Complaint Classification & Registration Service
 * Connects AI Assistant directly to existing `complaints`, `statusHistory`,
 * `complaintMessages`, and `complaint_updates` collections with transactional idempotency.
 */

const functions = require("firebase-functions");

/**
 * Authoritative shared complaint prioritization & hazard detection logic.
 */
function classifyComplaintLogic(description, category = "") {
  const text = String(description || "").toLowerCase();
  const catLower = String(category || "").toLowerCase();

  let priority = "NORMAL";
  let department = "General Administration";
  let isEmergency = false;
  let emergencyDetails = null;

  if (
    /(fallen\s+electric|live\s+wire|open\s+wire|electric\s+shock|power\s+line\s+down|ವಿದ್ಯುತ್\s+ತಂತಿ|ವಿದ್ಯುತ್\s+ಶಾಕ್|बिजली\s+का\s+तार)/.test(text)
  ) {
    priority = "URGENT";
    department = "Electricity Supply Company (MESCOM)";
    isEmergency = true;
    emergencyDetails = {
      hazard: "Hazardous Live Electric Wire / Electrocution Risk",
      helpline: "1912 (MESCOM Emergency Helpline) & 112 Disaster Response"
    };
  } else if (/(contaminated\s+water|cholera|poison\s+water|ಮಲಿನ\s+ನೀರು|दूषित\s+पानी)/.test(text)) {
    priority = "URGENT";
    department = "Rural Water Supply & Sanitation (RWSS)";
    isEmergency = true;
    emergencyDetails = {
      hazard: "Public Drinking Water Contamination Risk",
      helpline: "108 Health Emergency & Gram Panchayat Health Officer"
    };
  } else if (/(bridge\s+collapse|culvert\s+broken|road\s+caved|landslide|ಸೇತುವೆ\s+ಕುಸಿತ|पुल\s+टूटना)/.test(text)) {
    priority = "URGENT";
    department = "Public Works Department (PWD)";
    isEmergency = true;
    emergencyDetails = {
      hazard: "Severe Structural Infrastructure Collapse",
      helpline: "112 Disaster Response & PWD Engineer"
    };
  } else if (
    catLower.includes("water") ||
    /(water|pipe|leakage|borewell|drinking|ನೀರು|ಪೈಪ್|पानी|नल)/.test(text)
  ) {
    department = "Rural Water Supply & Sanitation (RWSS)";
    priority = /(no water|burst pipe|days|ನೀರಿಲ್ಲ|पानी बंद)/.test(text) ? "HIGH" : "NORMAL";
  } else if (
    catLower.includes("road") ||
    /(road|pothole|bridge|culvert|tar|ರಸ್ತೆ|ಗುಂಡಿ|सड़क|गड्ढा)/.test(text)
  ) {
    department = "Public Works Department (PWD)";
    priority = /(accident|school|hospital|ಅಪಘಾತ|दुर्घटना)/.test(text) ? "HIGH" : "NORMAL";
  } else if (
    catLower.includes("light") ||
    catLower.includes("electric") ||
    /(light|streetlight|lamp|pole|dark|ಬೀದಿದೀಪ|ಕತ್ತಲೆ|स्ट्रीटलाइट|बत्ती)/.test(text)
  ) {
    department = "Electricity Supply Company (MESCOM/BESCOM)";
    priority = /(dark|women safety|junction|ಕತ್ತಲೆ|अंधेरा)/.test(text) ? "HIGH" : "NORMAL";
  } else if (
    catLower.includes("sanitation") ||
    catLower.includes("garbage") ||
    catLower.includes("drain") ||
    /(garbage|waste|drain|gutter|sanitation|mosquito|ಕಸ|ಚರಂಡಿ|कचरा|नाली)/.test(text)
  ) {
    department = "Gram Panchayat Health & Sanitation Squad";
    priority = /(overflow|fever|outbreak|hospital|school)/.test(text) ? "HIGH" : "NORMAL";
  }

  return {
    priority,
    department,
    isEmergency,
    emergencyDetails,
    rationale: isEmergency
      ? "Emergency public safety alert triggered by hazard keywords."
      : `Assigned to ${department} based on infrastructure domain analysis.`
  };
}

/**
 * Load configured Gram Panchayats from Firestore. No personal/demo directory is bundled.
 */
async function getVerifiedPanchayats(db) {
  const list = [];
  if (db) {
    try {
      const snap = await db.collection("panchayats").limit(50).get();
      if (!snap.empty) {
        snap.forEach((d) => list.push({ panchayatId: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn("[JANASEVA ComplaintService] Panchayat lookup warning:", err.message);
    }
  }
  if (list.length > 0) return list;
  return [];
}

function isValidUrlOrEmpty(val) {
  if (!val) return true;
  if (typeof val !== "string" || val.length > 1000) return false;
  return /^(https?:\/\/|gs:\/\/|assets\/)/i.test(val);
}

/**
 * Register a complaint on behalf of an authenticated citizen after explicit confirmation.
 * Guarantees duplicate prevention via submissionNonces transaction.
 */
async function registerComplaintFromChat(db, payload, caller) {
  if (!caller || !caller.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required to register a complaint.");
  }

  // Check Emergency Maintenance Mode
  const maintSnap = await db.collection("systemSettings").doc("maintenance").get();
  if (maintSnap.exists && maintSnap.data()?.active === true) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      maintSnap.data()?.reason || "Complaint submissions are paused for portal maintenance."
    );
  }

  const {
    category,
    panchayatId,
    village = "",
    location = "",
    subject,
    description,
    photoURL = null,
    supportingDocuments = [],
    clientSubmissionId = ""
  } = payload || {};

  const cleanCategory = String(category || "").trim();
  const cleanPanchayatId = String(panchayatId || "").trim();
  const cleanVillage = String(village || "").trim().slice(0, 100);
  const cleanLocation = String(location || "").trim().slice(0, 200);
  const cleanSubject = String(subject || "").trim();
  const cleanDesc = String(description || "").trim();

  if (!cleanCategory || cleanCategory.length > 50) {
    throw new functions.https.HttpsError("invalid-argument", "Valid complaint category (1-50 chars) is required.");
  }
  if (!cleanPanchayatId || cleanPanchayatId.length > 50) {
    throw new functions.https.HttpsError("invalid-argument", "Valid Gram Panchayat selection is required.");
  }
  if (!cleanSubject || cleanSubject.length < 5 || cleanSubject.length > 200) {
    throw new functions.https.HttpsError("invalid-argument", "Complaint subject must be between 5 and 200 characters.");
  }
  if (!cleanDesc || cleanDesc.length < 15 || cleanDesc.length > 2000) {
    throw new functions.https.HttpsError("invalid-argument", "Complaint description must be between 15 and 2000 characters.");
  }
  if (!isValidUrlOrEmpty(photoURL)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid photo URL format or size.");
  }

  const safeDocs = Array.isArray(supportingDocuments)
    ? supportingDocuments.filter((u) => typeof u === "string" && isValidUrlOrEmpty(u)).slice(0, 5)
    : [];

  // Resolve authoritative Gram Panchayat metadata
  const gpList = await getVerifiedPanchayats(db);
  const gp = gpList.find((g) => g.panchayatId === cleanPanchayatId);
  if (!gp) {
    throw new functions.https.HttpsError("invalid-argument", "Selected Gram Panchayat does not exist.");
  }

  const safeNonce = String(clientSubmissionId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const nonceRef = safeNonce ? db.collection("submissionNonces").doc(`${caller.uid}_${safeNonce}`) : null;

  const classification = classifyComplaintLogic(`${cleanSubject} ${cleanDesc}`, cleanCategory);
  const year = new Date().getFullYear();
  const nowISO = new Date().toISOString();
  const nowFormatted = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });

  const locationSummary = [cleanVillage, cleanLocation].filter(Boolean).join(", ");
  const enrichedDesc = locationSummary && !cleanDesc.toLowerCase().includes(locationSummary.toLowerCase())
    ? `${cleanDesc}\n[Location: ${locationSummary}]`.slice(0, 2000)
    : cleanDesc;

  const txResult = await db.runTransaction(async (tx) => {
    if (nonceRef) {
      const nonceSnap = await tx.get(nonceRef);
      if (nonceSnap.exists && nonceSnap.data()?.complaintId) {
        const existingId = nonceSnap.data().complaintId;
        const existingComp = await tx.get(db.collection("complaints").doc(existingId));
        return {
          duplicatePrevented: true,
          complaintId: existingId,
          complaint: existingComp.exists ? existingComp.data() : { complaintId: existingId, status: "Submitted" }
        };
      }
    }

    // Generate collision-free official ID
    let complaintId = "";
    for (let attempt = 0; attempt < 8; attempt++) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const candidate = `JAN-${year}-${suffix}`;
      const candidateRef = db.collection("complaints").doc(candidate);
      const existing = await tx.get(candidateRef);
      if (!existing.exists) {
        complaintId = candidate;
        break;
      }
    }
    if (!complaintId) {
      complaintId = `JAN-${year}-${String(Date.now()).slice(-5)}`;
    }

    const complaintRef = db.collection("complaints").doc(complaintId);
    const citizenEmail = caller.email && caller.email.includes("@")
      ? caller.email
      : `${caller.uid}@citizen.janaseva.local`;

    const complaintDoc = {
      complaintId,
      userId: caller.uid,
      citizenUid: caller.uid,
      citizenName: String(caller.name || "Citizen").slice(0, 100),
      citizenEmail: citizenEmail.slice(0, 100),
      citizenPhone: String(caller.phone || "").slice(0, 30),
      citizenMobileNumber: String(caller.phone || "").slice(0, 30),
      panchayatId: gp.panchayatId,
      panchayatName: String(gp.name || "Gram Panchayat").slice(0, 100),
      village: cleanVillage,
      location: cleanLocation,
      category: cleanCategory,
      subject: cleanSubject,
      description: enrichedDesc,
      photoURL: photoURL || null,
      supportingDocuments: safeDocs,
      status: "Submitted",
      aiPriority: classification.priority,
      aiCategory: cleanCategory,
      aiDepartment: classification.department,
      aiRationale: classification.rationale,
      isEmergency: classification.isEmergency,
      emergencyDetails: classification.emergencyDetails,
      assignedReceiverId: `rec-${gp.panchayatId}`,
      assignedReceiverUid: `rec-${gp.panchayatId}`,
      assignedReceiverEmail: gp.receiverEmail || "",
      assignedReceiverName: `${gp.name} Official Receiver`,
      assignedDepartment: classification.department,
      submissionDate: nowFormatted,
      submissionTimestamp: nowISO,
      createdAt: nowFormatted,
      updatedAt: nowFormatted,
      lastUpdatedDate: nowFormatted,
      officialResponse: "Your grievance has been successfully submitted and permanently recorded. It has been routed to the Gram Panchayat processing queue.",
      officialResponses: [],
      sourceChannel: "AI_CHAT_ASSISTANT",
      clientSubmissionId: safeNonce || null
    };

    const historyId = `hist-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const historyDoc = {
      historyId,
      complaintId,
      oldStatus: null,
      newStatus: "Submitted",
      updatedBy: caller.uid,
      timestamp: nowISO,
      officialNote: "Submitted via JANASEVA AI Assistant after citizen confirmation."
    };

    const messageId = `msg-${complaintId}-init`;
    const msgDoc = {
      messageId,
      complaintId,
      senderId: caller.uid,
      senderName: complaintDoc.citizenName,
      senderEmail: complaintDoc.citizenEmail,
      senderRole: "citizen",
      message: enrichedDesc,
      visibility: "public",
      createdAt: nowISO
    };

    const updateId = `upd-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const updateDoc = {
      updateId,
      complaintId,
      citizenName: complaintDoc.citizenName,
      citizenEmail: complaintDoc.citizenEmail,
      category: cleanCategory,
      panchayatId: gp.panchayatId,
      panchayatName: gp.name,
      oldStatus: null,
      newStatus: "Submitted",
      updateType: "INITIAL_SUBMISSION",
      remarks: "Initial grievance submission via JANASEVA AI Assistant",
      resolutionDetails: null,
      authorName: complaintDoc.citizenName,
      authorEmail: complaintDoc.citizenEmail,
      authorRole: "citizen",
      authorUid: caller.uid,
      timestamp: nowISO,
      formattedDate: nowFormatted
    };

    tx.set(complaintRef, complaintDoc);
    tx.set(complaintRef.collection("statusHistory").doc(historyId), historyDoc);
    tx.set(db.collection("statusHistory").doc(historyId), historyDoc);
    tx.set(complaintRef.collection("messages").doc(messageId), msgDoc);
    tx.set(db.collection("complaintMessages").doc(messageId), msgDoc);
    tx.set(complaintRef.collection("updates").doc(updateId), updateDoc);
    tx.set(db.collection("complaint_updates").doc(updateId), updateDoc);

    if (nonceRef) {
      tx.set(nonceRef, {
        uid: caller.uid,
        complaintId,
        createdAtIso: nowISO
      });
    }

    return {
      duplicatePrevented: false,
      complaintId,
      complaint: complaintDoc
    };
  });

  return {
    success: true,
    duplicatePrevented: txResult.duplicatePrevented,
    complaintId: txResult.complaintId,
    status: "Submitted",
    aiPriority: txResult.complaint.aiPriority || classification.priority,
    assignedDepartment: txResult.complaint.assignedDepartment || classification.department,
    createdAt: txResult.complaint.createdAt || nowFormatted,
    complaint: txResult.complaint
  };
}

module.exports = {
  classifyComplaintLogic,
  getVerifiedPanchayats,
  registerComplaintFromChat
};
