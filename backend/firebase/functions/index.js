/**
 * JANASEVA – Firebase Cloud Functions
 * Secure Backend for Email Delivery via Nodemailer / SMTP
 * 
 * Features:
 * 1. onComplaintCreated: Triggered when new complaint is saved.
 *    - Looks up target Panchayat receiver address.
 *    - Sends notification email with complaint details and photo URL.
 *    - Sends confirmation email to citizen with tracking link.
 *    - Writes delivery log to emailLogs collection.
 * 2. onComplaintStatusChanged: Triggered when receiver updates complaint status.
 *    - Sends status update notification to citizen.
 *    - Records audit log in statusHistory.
 * 3. sendTestEmail: Callable function for admin testing.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const envValidator = require("./services/envValidator");

admin.initializeApp();
const db = admin.firestore();

// Validate and print startup environment diagnostics (sanitized, zero secrets logged)
envValidator.printStartupStatus();

// Escape all untrusted values before inserting them into HTML email templates.
function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

// Configure Transporter from Environment Variables / Secret Manager
function createTransporter() {
  const smtp = envValidator.getSmtpConfig();

  if (!smtp.isConfigured) {
    console.warn("[JANASEVA SMTP] SMTP credentials not configured in Cloud Functions. Outbound emails will be logged to Firestore emailLogs only.");
    return null;
  }

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });
}

/**
 * Callable: Check Server-Side Environment Health & Configuration (Admin-Only, Secrets Masked)
 */
exports.getEnvironmentHealth = functions.https.onCall(async (data, context) => {
  if (!context || !context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required to view system health.");
  }
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  const role = userDoc.exists ? userDoc.data().role : null;
  if (role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only administrators can view environment configuration health.");
  }
  return envValidator.validateEnvironment();
});

/**
 * Trigger: On Complaint Created
 */
exports.onComplaintCreated = functions.firestore
  .document("complaints/{complaintId}")
  .onCreate(async (snap, context) => {
    const complaint = snap.data();
    const complaintId = context.params.complaintId;

    try {
      // 1. Resolve Panchayat Receiver Email (global receiverSettings primary authority, then Panchayat fallback)
      let receiverEmail = null;
      let panchayatName = complaint.panchayatName || "Gram Panchayat";

      const settingsDoc = await db.collection("receiverSettings").doc("global").get();
      if (settingsDoc.exists && settingsDoc.data().receiverEmail) {
        receiverEmail = settingsDoc.data().receiverEmail;
      }

      if (complaint.panchayatId) {
        const gpDoc = await db.collection("panchayats").doc(complaint.panchayatId).get();
        if (gpDoc.exists) {
          panchayatName = gpDoc.data().name || panchayatName;
          if (!receiverEmail && gpDoc.data().receiverEmail) {
            receiverEmail = gpDoc.data().receiverEmail;
          }
        }
      }

      if (!receiverEmail) {
        throw new Error(`No receiver email is configured for Panchayat ${complaint.panchayatId || "(missing ID)"}.`);
      }

      const transporter = createTransporter();

      // Receiver Email Content
      const receiverMailOptions = {
        from: `"JANASEVA Portal" <no-reply@janaseva-portal.firebaseapp.com>`,
        to: receiverEmail,
        subject: `New JANASEVA Complaint – [${escapeHtml(complaintId)}]`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #d4e2f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0b2545; color: #ffffff; padding: 20px 24px;">
              <h2 style="margin: 0; font-size: 20px;">JANASEVA – Gram Panchayat Grievance Portal</h2>
              <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">New Complaint Lodged for ${escapeHtml(panchayatName)}</p>
            </div>
            <div style="padding: 24px;">
              <p>An official complaint has been submitted by a citizen for your Gram Panchayat:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Complaint ID:</td><td>${escapeHtml(complaintId)}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Citizen Name:</td><td>${escapeHtml(complaint.citizenName)}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Citizen Email:</td><td>${escapeHtml(complaint.citizenEmail)}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Gram Panchayat:</td><td>${escapeHtml(panchayatName)}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Category:</td><td>${escapeHtml(complaint.category)}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Submitted On:</td><td>${escapeHtml(complaint.createdAt)}</td></tr>
              </table>
              <div style="background-color: #f8fafc; border-left: 4px solid #0f56b3; padding: 12px 16px; margin: 16px 0;">
                <p style="margin: 0; font-weight: bold; font-size: 13px; color: #0b2545;">Issue Description:</p>
                <p style="margin: 6px 0 0; font-size: 14px;">${escapeHtml(complaint.description)}</p>
              </div>
              ${complaint.photoURL ? `
                <p style="margin: 16px 0 6px; font-weight: bold;">Attached Photograph:</p>
                <p><a href="${escapeHtml(complaint.photoURL)}" target="_blank" style="color: #0f56b3; text-decoration: underline;">View Complaint Photograph</a></p>
              ` : ''}
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                Please log in to the JANASEVA Official Dashboard to update the status and take action.
              </div>
            </div>
          </div>
        `
      };

      // Citizen Confirmation Content
      const citizenMailOptions = {
        from: `"JANASEVA Portal" <no-reply@janaseva-portal.firebaseapp.com>`,
        to: complaint.citizenEmail,
        subject: `Complaint Received – ${escapeHtml(complaintId)} | JANASEVA`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #d4e2f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0b2545; color: #ffffff; padding: 20px 24px;">
              <h2 style="margin: 0; font-size: 20px;">JANASEVA Grievance Redressal</h2>
              <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Complaint Confirmation Notice</p>
            </div>
            <div style="padding: 24px;">
              <p>Dear ${escapeHtml(complaint.citizenName)},</p>
              <p>Your grievance regarding <strong>${escapeHtml(complaint.category)}</strong> has been successfully received and forwarded to <strong>${escapeHtml(panchayatName)}</strong>.</p>
              <p style="background: #e0f2fe; padding: 12px; border-radius: 6px; font-size: 16px; font-weight: bold; color: #0b2545;">
                Complaint ID: ${escapeHtml(complaintId)}
              </p>
              <p>You can track the live status and official updates of your complaint at any time on the portal.</p>
            </div>
          </div>
        `
      };

      if (transporter) {
        await transporter.sendMail(receiverMailOptions);
        if (complaint.citizenEmail && complaint.citizenEmail.includes("@")) {
          await transporter.sendMail(citizenMailOptions);
        }
        console.log(`Emails dispatched for ${escapeHtml(complaintId)}`);
      }

      // Record in emailLogs
      await db.collection("emailLogs").add({
        complaintId: complaintId,
        recipient: receiverEmail,
        emailType: "RECEIVER_NOTIFICATION",
        deliveryStatus: transporter ? "SENT_TO_SMTP" : "NOT_SENT_NO_SMTP",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (err) {
      console.error("Error in onComplaintCreated:", err);
      await db.collection("emailLogs").add({
        complaintId: complaintId,
        recipient: "ERROR",
        emailType: "RECEIVER_NOTIFICATION",
        deliveryStatus: "FAILED",
        errorMessage: err.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Trigger: On Complaint Updated (Status Change Notification)
 */
exports.onComplaintStatusChanged = functions.firestore
  .document("complaints/{complaintId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const complaintId = context.params.complaintId;

    if (before.status === after.status) return;

    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: `"JANASEVA Portal" <no-reply@janaseva-portal.firebaseapp.com>`,
        to: after.citizenEmail,
        subject: `Status Update: ${escapeHtml(complaintId)} is now ${escapeHtml(after.status)} | JANASEVA`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #d4e2f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0b2545; color: #ffffff; padding: 20px 24px;">
              <h2 style="margin: 0; font-size: 20px;">Status Update on Your Complaint</h2>
              <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">${escapeHtml(complaintId)} – ${escapeHtml(after.panchayatName || "Gram Panchayat")}</p>
            </div>
            <div style="padding: 24px;">
              <p>Dear ${escapeHtml(after.citizenName)},</p>
              <p>The status of your complaint has been updated:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Previous Status:</td><td>${escapeHtml(before.status)}</td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">New Status:</td><td><strong style="color: #0f56b3;">${escapeHtml(after.status)}</strong></td></tr>
                <tr><td style="padding: 6px 0; font-weight: bold;">Updated On:</td><td>${escapeHtml(after.updatedAt || new Date().toISOString())}</td></tr>
              </table>
              <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0;">
                <p style="margin: 0; font-weight: bold; font-size: 13px; color: #0b2545;">Official Remarks from Gram Panchayat:</p>
                <p style="margin: 6px 0 0; font-size: 14px;">${escapeHtml(after.officialResponse || "Your complaint has been processed.")}</p>
              </div>
            </div>
          </div>
        `
      };

      if (transporter && after.citizenEmail && after.citizenEmail.includes("@")) {
        await transporter.sendMail(mailOptions);
      }

      if (after.citizenEmail) {
        await db.collection("emailLogs").add({
          complaintId: complaintId,
          recipient: after.citizenEmail,
          emailType: "STATUS_UPDATE",
          deliveryStatus: (transporter && after.citizenEmail.includes("@")) ? "SENT_TO_SMTP" : "NOT_SENT_NO_SMTP",
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }

    } catch (err) {
      console.error("Error sending status update email:", err);
    }
  });


/**
 * JANASEVA 2.0 – Cloud Functions for AI & Document Intelligence
 */

/**
 * Callable: Check OCR Services Availability on Backend
 */
exports.checkOcrAvailability = functions.https.onCall(async (data, context) => {
  const ocrCfg = envValidator.getOcrConfig();
  const aiCfg = envValidator.getAiConfig();
  const hasVisionApiKey = !!ocrCfg.visionApiKey;
  const hasAdc = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const hasGeminiKey = !!aiCfg.geminiKey && !envValidator.isPlaceholder(aiCfg.geminiKey);

  const onlineAvailable = hasVisionApiKey || hasAdc || hasGeminiKey;
  let preferredEngine = "none";
  if (hasVisionApiKey) preferredEngine = "cloud-vision-rest";
  else if (hasAdc) preferredEngine = "cloud-vision-sdk";
  else if (hasGeminiKey) preferredEngine = "gemini-vision-ocr";

  return {
    onlineAvailable,
    visionConfigured: hasVisionApiKey || hasAdc,
    geminiConfigured: hasGeminiKey,
    preferredEngine,
    supportedLanguages: ["en", "kn", "hi"]
  };
});

/**
 * Callable: Analyze Document OCR & Verification (Google Cloud Vision & Gemini AI bridge)
 */
exports.analyzeDocument = functions.https.onCall(async (data, context) => {
  // Authentication requirement
  if (!context || !context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required to analyze and verify documents.");
  }

  const { filename, mimeType, base64 } = data || {};
  if (!base64 || typeof base64 !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "Missing or invalid base64 document payload.");
  }

  // 10MB file-size ceiling check (Base64 string length <= 14MB)
  if (base64.length > 14 * 1024 * 1024) {
    throw new functions.https.HttpsError("invalid-argument", "Document payload exceeds the maximum 10MB limit.");
  }

  // MIME type validation
  const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!mimeType || !allowedMimes.includes(mimeType.toLowerCase())) {
    throw new functions.https.HttpsError("invalid-argument", "Unsupported file type. Allowed: PDF, JPG, PNG, WEBP.");
  }

  // Filename validation
  if (!filename || typeof filename !== "string" || filename.length > 255) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid or missing document filename.");
  }

  const ocrCfg = envValidator.getOcrConfig();
  const aiCfg = envValidator.getAiConfig();
  const visionApiKey = ocrCfg.visionApiKey;
  const geminiKey = aiCfg.geminiKey;
  const isImage = /^image\//i.test(mimeType);
  const buffer = Buffer.from(base64, "base64");

  let extractedText = "";
  let ocrEngine = "none";
  let confidence = 0.0;
  let detectedLanguage = "en";

  // Strategy 1: Google Cloud Vision REST API (Direct API key)
  if (visionApiKey && isImage) {
    try {
      const resp = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(visionApiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            imageContext: { languageHints: ["en", "kn", "hi"] }
          }]
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        const text = json?.responses?.[0]?.fullTextAnnotation?.text || "";
        if (text.trim()) {
          extractedText = text.trim();
          ocrEngine = "cloud-vision-rest";
          confidence = 0.92;
        }
      }
    } catch (e) {
      console.warn("[JANASEVA OCR] Vision REST warning:", e.message);
    }
  }

  // Strategy 2: Google Cloud Vision SDK with Application Default Credentials
  if (!extractedText && process.env.GOOGLE_APPLICATION_CREDENTIALS && isImage) {
    try {
      const vision = require("@google-cloud/vision");
      const client = new vision.ImageAnnotatorClient();
      const [res] = await client.documentTextDetection(buffer);
      const text = res?.fullTextAnnotation?.text || res?.textAnnotations?.[0]?.description || "";
      if (text.trim()) {
        extractedText = text.trim();
        ocrEngine = "cloud-vision-sdk";
        confidence = 0.90;
      }
    } catch (visionErr) {
      console.warn("[JANASEVA OCR] Cloud Vision SDK warning:", visionErr.message);
    }
  }

  // Strategy 3: Gemini Multimodal Vision API (Supports Images & PDFs with AI comprehension)
  if (!extractedText && geminiKey && !envValidator.isPlaceholder(geminiKey)) {
    try {
      const model = aiCfg.geminiModel || "gemini-2.5-flash";
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Perform high-precision optical character recognition on this document. Extract all visible text verbatim, preserving original Kannada, Hindi, and English scripts, tables, numbers, and survey marks. Output only the extracted text, or EMPTY if unreadable." },
              { inlineData: { mimeType: mimeType || "application/pdf", data: base64 } }
            ]
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 2048 }
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        const raw = json?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim() || "";
        if (raw && raw !== "EMPTY") {
          extractedText = raw;
          ocrEngine = "gemini-vision-ocr";
          confidence = 0.88;
        }
      }
    } catch (geminiErr) {
      console.warn("[JANASEVA OCR] Gemini Vision OCR warning:", geminiErr.message);
    }
  }

  // Detect predominant language from extracted text
  if (extractedText) {
    const hasKannada = /[\u0C80-\u0CFF]/.test(extractedText);
    const hasHindi = /[\u0900-\u097F]/.test(extractedText);
    if (hasKannada && hasHindi) detectedLanguage = "kn+hi";
    else if (hasKannada) detectedLanguage = "kn";
    else if (hasHindi) detectedLanguage = "hi";
    else detectedLanguage = "en";

    return {
      success: true,
      configured: true,
      filename: filename,
      mimeType: mimeType,
      engine: ocrEngine,
      text: extractedText,
      detectedLanguage: detectedLanguage,
      confidence: confidence,
      unreadable: false,
      isOfficialVerification: false
    };
  }

  // Check if any service was configured but returned no text
  const anyConfigured = !!(visionApiKey || process.env.GOOGLE_APPLICATION_CREDENTIALS || (geminiKey && !envValidator.isPlaceholder(geminiKey)));

  return {
    success: false,
    configured: anyConfigured,
    filename: filename,
    mimeType: mimeType,
    engine: anyConfigured ? "online-attempted" : "none",
    text: "",
    confidence: 0.0,
    unreadable: anyConfigured,
    message: anyConfigured ? "No readable text detected in this document. Please ensure document lighting is clear." : "Online Cloud OCR services are not configured on the backend.",
    isOfficialVerification: false
  };
});

const authService = require("./services/authService");
const languageService = require("./services/languageService");
const aiProviderService = require("./services/aiProviderService");
const complaintService = require("./services/complaintService");
const trackingService = require("./services/trackingService");
const chatHistoryService = require("./services/chatHistoryService");
const attachmentService = require("./services/attachmentService");
const conversationService = require("./services/conversationService");
const adminAssistantService = require("./services/adminAssistantService");
const knowledgeService = require("./services/knowledgeService");
const knowledgeApiService = require("./services/knowledgeApiService");
const apiManagementService = require("./services/apiManagementService");

function rethrowSafeHttpsError(err, fallbackMsg = "Unexpected server error.") {
  if (err && err instanceof functions.https.HttpsError) {
    throw err;
  }
  console.error("[JANASEVA Functions] Service error:", err);
  throw new functions.https.HttpsError("internal", fallbackMsg);
}

/**
 * Callable: Classify Complaint & Detect Emergency
 */
exports.classifyComplaint = functions.https.onCall(async (data, context) => {
  authService.assertAuthenticated(context, "Authentication required to classify grievances.");

  const { description, category } = data || {};
  if (!description || typeof description !== "string" || description.trim().length < 5) {
    throw new functions.https.HttpsError("invalid-argument", "Valid complaint description of at least 5 characters is required.");
  }
  if (description.length > 5000) {
    throw new functions.https.HttpsError("invalid-argument", "Complaint description exceeds the maximum 5000 character limit.");
  }

  return complaintService.classifyComplaintLogic(description, category);
});

/**
 * Callable: Conversational Citizen-Service AI Assistant
 */
exports.chatAssistant = functions.runWith({ timeoutSeconds: 30, memory: "256MB" }).https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    return await conversationService.handleChatTurn(db, caller, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to process assistant message.");
  }
});

/**
 * Callable: Public FAQ, Knowledge Retrieval & Emergency Guidance (Strictly Read-Only, No DB PII or LLM Secrets)
 */
exports.publicPortalFaq = functions.https.onCall(async (data) => {
  const activeLang = languageService.normalizeLang(data?.lang || "en-IN");
  const sLang = languageService.getShortLang(activeLang);
  const message = String(data?.message || "").trim();
  const chatSettings = (data?.chatSettings && typeof data.chatSettings === "object") ? data.chatSettings : {};
  if (!message || message.length > 500) {
    throw new functions.https.HttpsError("invalid-argument", languageService.getLocalizedString("invalid_message", activeLang));
  }

  if (chatSettings.aiAssistant === false) {
    return {
      reply: sLang === "kn"
        ? "ಚಾಟ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ AI ಸಹಾಯಕವನ್ನು ಆಫ್ ಮಾಡಲಾಗಿದೆ."
        : sLang === "hi"
        ? "चैट सेटिंग्स में AI सहायक बंद है।"
        : "AI Assistant is turned OFF in Chat Settings.",
      lang: activeLang,
      intent: "assistant_disabled",
      publicOnly: true,
      providerStatus: await aiProviderService.getProviderStatus(db)
    };
  }

  const lower = languageService.normalizeAndCorrectText(message).toLowerCase();
  const isEmergency = /(emergency|ambulance|fire|police|shock|112|108|1912|101|ತುರ್ತು|ಅಪಾಯ|आपात)/.test(lower);
  if (isEmergency) {
    const emergReply = sLang === "kn"
      ? "ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ ತಕ್ಷಣ ಕರೆ ಮಾಡಿ: 112 (ಪೊಲೀಸ್/ವಿಪತ್ತು), 108 (ಆಂಬ್ಯುಲೆನ್ಸ್), 1912 (ವಿದ್ಯುತ್ ತಂತಿ), 101 (ಅಗ್ನಿಶಾಮಕ)."
      : sLang === "hi"
      ? "आपातकालीन सहायता के लिए तुरंत कॉल करें: 112 (पुलिस/आपदा), 108 (एम्बुलेंस), 1912 (बिजली का तार), 101 (अग्निशमन)।"
      : "For emergencies, call immediately: 112 (Police/Disaster), 108 (Ambulance), 1912 (Live Electric Wire), 101 (Fire).";
    return {
      reply: emergReply,
      lang: activeLang,
      isEmergency: true,
      publicOnly: true,
      providerStatus: await aiProviderService.getProviderStatus(db)
    };
  }

  // Query active public AI Knowledge Centre documents when enabled
  if (chatSettings.aiKnowledgeCentre !== false && chatSettings.knowledgeSearch !== false) {
    try {
      const ragRes = await knowledgeService.queryKnowledgeBaseServer(db, {
        query: message,
        lang: activeLang,
        limit: Math.min(10, Math.max(1, Number(chatSettings.knowledgeSearchLimit) || 5)),
        semanticSearch: chatSettings.semanticSearch !== false,
        crossLanguageSearch: chatSettings.crossLanguageSearch !== false,
        schemeSearch: chatSettings.schemeSearch !== false
      });
      if (ragRes && ragRes.found && ragRes.reply) {
        return {
          reply: ragRes.reply,
          lang: activeLang,
          intent: "knowledge_rag",
          knowledgeSources: chatSettings.autoCitation !== false ? (ragRes.sources || []) : [],
          hasConflict: Boolean(ragRes.hasConflict),
          conflictNotice: ragRes.conflictNotice || null,
          isEmergency: false,
          publicOnly: true,
          providerStatus: await aiProviderService.getProviderStatus(db)
        };
      }
    } catch (e) {}
  }

  const reply = sLang === "kn"
    ? "ಜನಸೇವಾ ಪೋರ್ಟಲ್‌ಗೆ ಸ್ವಾಗತ! ದೂರು ದಾಖಲಿಸಲು ಅಥವಾ ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಸೈನ್ ಇನ್ ಮಾಡಿ. ಪಂಚಾಯತ್ ಕಚೇರಿ ಸಮಯ: ಸೋಮವಾರ–ಶನಿವಾರ, ಬೆಳಿಗ್ಗೆ 10:00 – ಸಂಜೆ 5:30."
    : sLang === "hi"
    ? "जनसेवा पोर्टल में आपका स्वागत है! शिकायत दर्ज करने या ट्रैक करने के लिए साइन इन करें। पंचायत कार्यालय समय: सोमवार–शनिवार, सुबह 10:00 – शाम 5:30।"
    : "Welcome to JANASEVA! Sign in to register or track your complaints. Gram Panchayat offices operate Monday–Saturday, 10:00 AM – 5:30 PM.";

  return {
    reply,
    lang: activeLang,
    isEmergency: false,
    publicOnly: true,
    providerStatus: await aiProviderService.getProviderStatus(db)
  };
});

/**
 * Callable: Register Complaint from AI Chat (Idempotent & Authenticated)
 */
exports.registerComplaintFromChat = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    return await complaintService.registerComplaintFromChat(db, data || {}, caller);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to register complaint.");
  }
});

/**
 * Callable: Track Authorized Complaint(s) from AI Chat
 */
exports.trackComplaintFromChat = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    const { complaintId, limit } = data || {};
    if (complaintId) {
      const complaint = await trackingService.trackSingleComplaint(db, caller, complaintId);
      return { success: true, mode: "single", complaint };
    }
    const complaints = await trackingService.listAuthorizedComplaints(db, caller, { limit });
    return { success: true, mode: "list", complaints };
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to fetch authorized complaint details.");
  }
});

/**
 * Callables: Persistent Chat History Service (Owner-Scoped)
 */
exports.saveChatSession = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    return await chatHistoryService.saveChatSession(db, caller, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to save chat session.");
  }
});

exports.listChatSessions = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    return await chatHistoryService.listChatSessions(db, caller, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to list chat sessions.");
  }
});

exports.getChatSession = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    const session = await chatHistoryService.getChatSession(db, caller, data?.sessionId);
    return { success: true, session };
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to load chat session.");
  }
});

exports.renameChatSession = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    return await chatHistoryService.renameChatSession(db, caller, data?.sessionId, data?.title);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to rename chat session.");
  }
});

exports.deleteChatSession = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    return await chatHistoryService.deleteChatSession(db, caller, data?.sessionId);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to delete chat session.");
  }
});

exports.clearChatSessions = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    return await chatHistoryService.clearAllChatSessions(db, caller);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to clear chat history.");
  }
});

/**
 * Callable: Validate Attachment Security Metadata & Magic Bytes
 */
exports.validateChatAttachment = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    return attachmentService.validateChatAttachment(data || {}, caller);
  } catch (err) {
    rethrowSafeHttpsError(err, "Attachment validation failed.");
  }
});

/**
 * Callables: Citizen Feedback & Admin Assistant Operations
 */
exports.submitAssistantFeedback = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.getCallerProfile(db, context);
    return await adminAssistantService.submitAssistantFeedback(db, caller, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to submit assistant feedback.");
  }
});

exports.getAssistantAdminAnalytics = functions.https.onCall(async (data, context) => {
  try {
    return await adminAssistantService.getAssistantAdminAnalytics(db, context);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to load assistant analytics.");
  }
});

exports.reviewAssistantFeedback = functions.https.onCall(async (data, context) => {
  try {
    return await adminAssistantService.reviewAssistantFeedback(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to update feedback review.");
  }
});

exports.updateAssistantConfig = functions.https.onCall(async (data, context) => {
  try {
    return await adminAssistantService.updateAssistantConfig(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to update assistant configuration.");
  }
});


const crypto = require("crypto");

/**
 * ============================================================================
 * JANASEVA – MASTER EMERGENCY DATA RESET & MAINTENANCE SYSTEM
 * Admin-Only Cloud Functions for Secure Operational and Complete System Resets
 * ============================================================================
 */


// Recursively capture a document and every nested subcollection for disaster recovery.
async function captureDocumentTree(docRef) {
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;
  const output = { id: snapshot.id, ...snapshot.data(), _subcollections: {} };
  const subcollections = await docRef.listCollections();
  for (const subcollection of subcollections) {
    const children = [];
    let page = await subcollection.orderBy(admin.firestore.FieldPath.documentId()).limit(100).get();
    while (!page.empty) {
      for (const child of page.docs) {
        const childTree = await captureDocumentTree(child.ref);
        if (childTree) children.push(childTree);
      }
      const last = page.docs[page.docs.length - 1];
      page = await subcollection.orderBy(admin.firestore.FieldPath.documentId()).startAfter(last).limit(100).get();
    }
    output._subcollections[subcollection.id] = children;
  }
  return output;
}

// Recursively restore a captured document tree using deterministic document IDs.
async function restoreDocumentTree(collectionRef, node, batchManager) {
  if (!node || typeof node.id !== "string" || !node.id) {
    throw new Error("Backup contains a nested document without a valid document ID.");
  }
  const { id, _subcollections, ...documentData } = node;
  await batchManager.set(collectionRef.doc(id), documentData, { merge: true });
  if (_subcollections && typeof _subcollections === "object") {
    for (const [subcollectionName, children] of Object.entries(_subcollections)) {
      if (!Array.isArray(children)) throw new Error(`Invalid nested collection '${subcollectionName}' in backup.`);
      for (const child of children) {
        await restoreDocumentTree(collectionRef.doc(id).collection(subcollectionName), child, batchManager);
      }
    }
  }
}

// Capture every document in a top-level collection, including all nested descendants.
async function captureCollectionTree(collectionRef) {
  const records = [];
  let page = await collectionRef.orderBy(admin.firestore.FieldPath.documentId()).limit(100).get();
  while (!page.empty) {
    for (const doc of page.docs) {
      const tree = await captureDocumentTree(doc.ref);
      if (tree) records.push(tree);
    }
    const last = page.docs[page.docs.length - 1];
    page = await collectionRef.orderBy(admin.firestore.FieldPath.documentId()).startAfter(last).limit(100).get();
  }
  return records;
}

// Internal Helper: Enforce Administrator Authorization
async function assertAdminCaller(context) {
  if (!context || !context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required. Please log in as Administrator.");
  }
  const uid = context.auth.uid;
  const email = (context.auth.token?.email || "").toLowerCase();

  // Primary: Check token custom claims or verified bootstrap email
  if (context.auth.token?.role === "admin" || (context.auth.token?.email_verified === true && email === "admin@janaseva.gov.in")) {
    return { uid, email, role: "admin" };
  }

  // Secondary: Check users collection
  const userDoc = await db.collection("users").doc(uid).get();
  if (userDoc.exists && userDoc.data().role === "admin") {
    return { uid, email: userDoc.data().email || email, role: "admin" };
  }

  throw new functions.https.HttpsError("permission-denied", "Access Denied: Only authorized Administrator accounts can access the Emergency Control Centre.");
}

// Internal Helper: SafeBatchManager enforcing <= 400 ops per commit chunk
class SafeBatchManager {
  constructor(firestoreDb, maxOps = 350, beforeCommit = null) {
    this.db = firestoreDb;
    this.maxOps = maxOps;
    this.beforeCommit = beforeCommit;
    this.batch = firestoreDb.batch();
    this.opCount = 0;
    this.totalCommitted = 0;
  }

  async delete(ref) {
    this.batch.delete(ref);
    this.opCount++;
    if (this.opCount >= this.maxOps) {
      await this.flush();
    }
  }

  async set(ref, data, options) {
    if (options) {
      this.batch.set(ref, data, options);
    } else {
      this.batch.set(ref, data);
    }
    this.opCount++;
    if (this.opCount >= this.maxOps) {
      await this.flush();
    }
  }

  async flush() {
    if (this.opCount > 0) {
      if (typeof this.beforeCommit === "function") await this.beforeCommit();
      await this.batch.commit();
      this.totalCommitted += this.opCount;
      this.batch = this.db.batch();
      this.opCount = 0;
    }
  }
}

// Internal Helper: Genuinely recursive document deletion handling unlimited nesting levels safely with paginated subcollection retrieval
async function recursivelyDeleteDocument(docRef, batchManager) {
  let subcollectionsDeleted = 0;
  const subcollections = await docRef.listCollections();
  for (const subcol of subcollections) {
    // Paginated subcollection processing avoiding loading all nested documents into memory
    let subSnapshot = await subcol.limit(100).get();
    while (!subSnapshot.empty) {
      for (const subDoc of subSnapshot.docs) {
        const nestedCount = await recursivelyDeleteDocument(subDoc.ref, batchManager);
        subcollectionsDeleted += nestedCount;
      }
      await batchManager.flush();
      subSnapshot = await subcol.limit(100).get();
    }

    // Verify subcollection level is completely empty
    const verifySub = await subcol.limit(1).get();
    if (!verifySub.empty) {
      throw new Error(`Subcollection deletion verification failed: Subcollection ${subcol.id} of ${docRef.path} still contains records.`);
    }
  }
  await batchManager.delete(docRef);
  return subcollectionsDeleted + 1;
}

// Truly recursive deletion of an entire collection and all nested subcollections with pagination and progress tracking
async function deleteCollectionWithSubcollections(collectionRef, batchSize = 100, beforeCommit = null) {
  let deletedCount = 0;
  let subcollectionsDeleted = 0;
  const batchManager = new SafeBatchManager(db, 350, beforeCommit);

  const query = collectionRef.limit(batchSize);
  let snapshot = await query.get();

  while (!snapshot.empty) {
    for (const doc of snapshot.docs) {
      const nestedCount = await recursivelyDeleteDocument(doc.ref, batchManager);
      deletedCount++;
      subcollectionsDeleted += (nestedCount - 1);
    }
    await batchManager.flush();
    if (deletedCount % 200 === 0 && deletedCount > 0) {
      console.log(`[JANASEVA RECURSIVE DELETION] Progress on ${collectionRef.id}: ${deletedCount} documents processed.`);
    }
    snapshot = await query.get();
  }
  await batchManager.flush();

  // Verification: Verify that no nested records or root documents remain
  const verificationSnapshot = await collectionRef.limit(5).get();
  if (!verificationSnapshot.empty) {
    throw new Error(`Recursive deletion verification failed: Collection ${collectionRef.id} still contains ${verificationSnapshot.size} undeleted records.`);
  }

  return { deletedCount, subcollectionsDeleted };
}

/**
 * Callable: Get Live System Statistics for Emergency Reset Impact Assessment
 */
exports.getEmergencySystemStats = functions.https.onCall(async (data, context) => {
  await assertAdminCaller(context);

  try {
    const complaintsSnap = await db.collection("complaints").get();
    const complaintsCount = complaintsSnap.size;

    let subcollectionsCount = 0;
    for (const doc of complaintsSnap.docs) {
      const subcols = await doc.ref.listCollections();
      for (const sub of subcols) {
        const sSnap = await sub.get();
        subcollectionsCount += sSnap.size;
      }
    }

    const emailLogsSnap = await db.collection("emailLogs").get();
    const whatsappLogsSnap = await db.collection("whatsappLogs").get();
    const logsCount = emailLogsSnap.size + whatsappLogsSnap.size;

    const citizensSnap = await db.collection("users").where("role", "==", "citizen").get();
    const citizenUsersCount = citizensSnap.size;

    const receiversSnap = await db.collection("users").where("role", "==", "receiver").get();
    const receiverUsersCount = receiversSnap.size;

    const totalAffectedRecords = complaintsCount + subcollectionsCount + logsCount;
    // Estimated storage in KB (~4KB per complaint with history + attachments metadata)
    const estimatedStorageKb = Math.round((complaintsCount * 4.5) + (logsCount * 0.8) + (citizenUsersCount * 1.5));

    return {
      success: true,
      complaintsCount,
      subcollectionsCount,
      logsCount,
      citizenUsersCount,
      receiverUsersCount,
      totalAffectedRecords,
      estimatedStorageKb,
      retrievedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("Error fetching emergency stats:", err);
    throw new functions.https.HttpsError("internal", "Failed to retrieve live system statistics: " + err.message);
  }
});

/**
 * Callable: Create Cryptographic Emergency Snapshot Backup
 */
exports.createEmergencyBackup = functions.https.onCall(async (data, context) => {
  const adminUser = await assertAdminCaller(context);
  const mode = data?.mode || "MODE_A_OPERATIONAL";

  const backupId = "BKP-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  const storagePath = `backups/${backupId}.json`;
  let backupPayload = null;

  try {
    // Collect complaints with every nested subcollection (not just one level)
    const complaintsSnap = await db.collection("complaints").get();
    const complaintsList = [];
    for (const doc of complaintsSnap.docs) {
      const tree = await captureDocumentTree(doc.ref);
      if (tree) complaintsList.push(tree);
    }

    // Collect logs
    const emailLogsSnap = await db.collection("emailLogs").get();
    const emailLogsList = emailLogsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const whatsappLogsSnap = await db.collection("whatsappLogs").get();
    const whatsappLogsList = whatsappLogsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Collect users (citizens and receivers)
    const usersSnap = await db.collection("users").get();
    const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Back up all remaining application collections dynamically. Exclude internal
    // recovery metadata so a restore cannot overwrite its own lock/backup state.
    const excludedCollections = new Set([
      "complaints", "emailLogs", "whatsappLogs", "users",
      "emergencyResetBackups", "emergencyResetRestorations",
      "emergencyResetAuditLogs", "systemSettings", "backups"
    ]);
    const additionalCollections = {};
    const additionalCollectionCounts = {};
    const topLevelCollections = await db.listCollections();
    for (const collectionRef of topLevelCollections) {
      if (excludedCollections.has(collectionRef.id)) continue;
      const records = await captureCollectionTree(collectionRef);
      additionalCollections[collectionRef.id] = records;
      additionalCollectionCounts[collectionRef.id] = records.length;
    }

    backupPayload = {
      backupId,
      createdAt: new Date().toISOString(),
      createdBy: adminUser.email,
      mode,
      complaints: complaintsList,
      emailLogs: emailLogsList,
      whatsappLogs: whatsappLogsList,
      users: usersList,
      additionalCollections,
      counts: {
        complaints: complaintsList.length,
        emailLogs: emailLogsList.length,
        whatsappLogs: whatsappLogsList.length,
        users: usersList.length,
        additionalCollections: additionalCollectionCounts
      }
    };

    const serialized = JSON.stringify(backupPayload);
    const sha256Checksum = crypto.createHash("sha256").update(serialized).digest("hex");
    let fileSizeBytes = Buffer.byteLength(serialized, "utf-8");

    // Upload backup payload to Firebase Cloud Storage (scalable architecture for large datasets)
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    await file.save(Buffer.from(serialized, "utf-8"), {
      contentType: "application/json",
      metadata: {
        backupId,
        sha256Checksum,
        mode,
        createdBy: adminUser.email,
        recordCounts: JSON.stringify(backupPayload.counts)
      }
    });

    // Verification 1: Verify the uploaded backup file exists in Cloud Storage
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("Cloud Storage backup verification failed: File not found in Cloud Storage after upload.");
    }

    // Verification 2: Verify file size is positive
    const [meta] = await file.getMetadata();
    fileSizeBytes = Number(meta.size);
    if (!fileSizeBytes || fileSizeBytes <= 0) {
      throw new Error(`Cloud Storage backup verification failed: Uploaded backup file size is invalid (${fileSizeBytes} bytes).`);
    }

    // Verification 3: Download and verify SHA-256 checksum matches payload
    const [downloadedBuffer] = await file.download();
    const downloadedHash = crypto.createHash("sha256").update(downloadedBuffer).digest("hex");
    if (downloadedHash.toLowerCase() !== sha256Checksum.toLowerCase()) {
      throw new Error("Cloud Storage backup verification failed: SHA-256 checksum mismatch on uploaded file.");
    }
    console.log(`[JANASEVA BACKUP] Cryptographically verified Cloud Storage backup snapshot: ${storagePath} (${fileSizeBytes} bytes)`);

    // ONLY on verified success: Write READY metadata into Firestore (never store oversized payload in single doc)
    await db.collection("emergencyResetBackups").doc(backupId).set({
      backupId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtIso: backupPayload.createdAt,
      createdBy: adminUser.email,
      mode,
      sha256Checksum,
      recordCounts: backupPayload.counts,
      storageType: "CLOUD_STORAGE",
      storagePath: storagePath,
      fileSizeBytes: fileSizeBytes,
      verified: true,
      status: "READY"
    });

    return {
      success: true,
      backupId,
      sha256Checksum,
      recordCounts: backupPayload.counts,
      createdAt: backupPayload.createdAt
    };
  } catch (err) {
    console.error("[JANASEVA BACKUP ERROR] Failed to create emergency backup snapshot:", err);

    // Explicitly record FAILED status in Firestore so unverified backups can NEVER be used
    try {
      await db.collection("emergencyResetBackups").doc(backupId).set({
        backupId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAtIso: new Date().toISOString(),
        createdBy: adminUser.email,
        mode,
        storageType: "CLOUD_STORAGE",
        storagePath: storagePath,
        verified: false,
        status: "FAILED",
        error: err.message
      });
    } catch (fsErr) {
      console.error("Failed to log backup failure to Firestore:", fsErr);
    }

    throw new functions.https.HttpsError("internal", "Failed to generate emergency backup snapshot: " + err.message);
  }
});

/**
 * Callable: Execute Admin-Only Master Emergency Data Reset
 */
exports.executeEmergencyDataReset = functions.https.onCall(async (data, context) => {
  const adminUser = await assertAdminCaller(context);

  const { mode, securityPhrase, backupId, checksum } = data || {};

  // Checkpoint 5: Strict Security Phrase Validation
  if (!securityPhrase || securityPhrase.trim() !== "RESET JANASEVA") {
    throw new functions.https.HttpsError("invalid-argument", "Security checkpoint failed: Confirmation phrase must be exactly 'RESET JANASEVA'.");
  }

  // Mode validation
  if (mode !== "MODE_A_OPERATIONAL" && mode !== "MODE_B_COMPLETE") {
    throw new functions.https.HttpsError("invalid-argument", "Invalid reset mode. Must be MODE_A_OPERATIONAL or MODE_B_COMPLETE.");
  }

  // Verify Backup Checkpoint & Mandatory Checksum
  if (!backupId || typeof backupId !== "string" || backupId.trim().length === 0) {
    throw new functions.https.HttpsError("failed-precondition", "Security checkpoint failed: A verified backup snapshot ID is required before deletion.");
  }

  if (!checksum || typeof checksum !== "string" || checksum.trim().length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Security checkpoint failed: Mandatory SHA-256 checksum is required for emergency reset. Missing checksum rejected.");
  }

  const backupDoc = await db.collection("emergencyResetBackups").doc(backupId).get();
  if (!backupDoc.exists) {
    throw new functions.https.HttpsError("not-found", "The specified backup snapshot was not found in emergencyResetBackups.");
  }

  const backupData = backupDoc.data();
  if (!backupData.sha256Checksum || typeof backupData.sha256Checksum !== "string") {
    throw new functions.https.HttpsError("failed-precondition", "Security checkpoint failed: Backup record contains no verified checksum.");
  }

  if (backupData.verified !== true || backupData.status !== "READY") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Security checkpoint failed: Specified backup snapshot is unverified or marked FAILED. Emergency reset is strictly forbidden using failed or unverified backups."
    );
  }

  if (backupData.sha256Checksum.trim().toLowerCase() !== checksum.trim().toLowerCase()) {
    throw new functions.https.HttpsError("data-loss", "Security checkpoint failed: Mismatched checksum rejected! Provided checksum does not match verified backup snapshot.");
  }

  const resetId = "RST-" + Date.now();
  const lockRef = db.collection("systemSettings").doc("resetLock");
  const maintRef = db.collection("systemSettings").doc("maintenance");

  // Atomic Reset Lock via Firestore Transaction: prevents simultaneous resets and recovers expired locks safely
  let priorMaint = { active: false, reason: "" };
  await db.runTransaction(async (transaction) => {
    const lockDoc = await transaction.get(lockRef);
    if (lockDoc.exists) {
      const lockData = lockDoc.data();
      if (lockData.isLocked === true) {
        let lockMillis = 0;
        if (lockData.heartbeatAt && typeof lockData.heartbeatAt.toMillis === "function") {
          lockMillis = lockData.heartbeatAt.toMillis();
        } else if (lockData.lockedAt && typeof lockData.lockedAt.toMillis === "function") {
          lockMillis = lockData.lockedAt.toMillis();
        } else if (lockData.lockedAtIso) {
          lockMillis = new Date(lockData.lockedAtIso).getTime();
        }
        const lockAgeMinutes = lockMillis ? (Date.now() - lockMillis) / (1000 * 60) : 999;
        if (lockAgeMinutes < 15) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            `An emergency reset operation is already in progress (Reset ID: ${lockData.resetId || "ACTIVE"}). Concurrency lock engaged.`
          );
        }
        console.warn(`[JANASEVA RESET] Expired reset lock recovered safely (${lockAgeMinutes.toFixed(1)} mins old).`);
      }
    }

    // Capture prior maintenance settings inside transaction
    const maintDoc = await transaction.get(maintRef);
    priorMaint = maintDoc.exists ? maintDoc.data() : { active: false, reason: "" };

    // Acquire lock atomically with heartbeat tracking
    transaction.set(lockRef, {
      isLocked: true,
      lockedAt: admin.firestore.FieldValue.serverTimestamp(),
      lockedAtIso: new Date().toISOString(),
      heartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
      heartbeatAtIso: new Date().toISOString(),
      initiatedBy: adminUser.email,
      resetId: resetId,
      mode: mode,
      currentStage: "LOCK_ACQUIRED"
    });

    // Engage Emergency Maintenance Mode
    transaction.set(maintRef, {
      active: true,
      reason: "Emergency Data Reset in Progress",
      initiatedBy: adminUser.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  // Lock Verification & Heartbeat Renewal before every destructive stage
  const verifyAndRenewLock = async (stage) => {
    const currentLockSnap = await lockRef.get();
    if (!currentLockSnap.exists) {
      throw new Error("Reset lock verification failed: Lock record missing.");
    }
    const currentLockData = currentLockSnap.data();
    if (!currentLockData.isLocked || currentLockData.resetId !== resetId) {
      throw new Error(`Reset lock ownership lost: Expected resetId ${resetId}, but found ${currentLockData.resetId || "UNLOCKED"}. Destructive stage aborted.`);
    }
    await lockRef.update({
      heartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
      heartbeatAtIso: new Date().toISOString(),
      currentStage: stage
    });
  };

  let deletedComplaints = 0;
  let deletedSubcollections = 0;
  let deletedLogs = 0;
  let deletedUsers = 0;

  try {
    // STAGE 1: Delete Complaints and their subcollections (Paginated recursive deletion)
    await verifyAndRenewLock("DELETING_COMPLAINTS");
    const complaintsResult = await deleteCollectionWithSubcollections(db.collection("complaints"), 100, () => verifyAndRenewLock("DELETING_COMPLAINTS"));
    deletedComplaints = complaintsResult.deletedCount;
    deletedSubcollections = complaintsResult.subcollectionsDeleted;

    // STAGE 2: Delete Logs (emailLogs, whatsappLogs, complaintMessages)
    await verifyAndRenewLock("DELETING_LOGS");
    const emailLogsResult = await deleteCollectionWithSubcollections(db.collection("emailLogs"), 100, () => verifyAndRenewLock("DELETING_EMAIL_LOGS"));
    const whatsappLogsResult = await deleteCollectionWithSubcollections(db.collection("whatsappLogs"), 100, () => verifyAndRenewLock("DELETING_WHATSAPP_LOGS"));
    const complaintMessagesResult = await deleteCollectionWithSubcollections(db.collection("complaintMessages"), 100, () => verifyAndRenewLock("DELETING_COMPLAINT_MESSAGES"));
    deletedLogs = emailLogsResult.deletedCount + whatsappLogsResult.deletedCount + complaintMessagesResult.deletedCount;

    // STAGE 3: Complete Mode B: Delete Citizen Accounts (NEVER delete Admin or )
    if (mode === "MODE_B_COMPLETE") {
      await verifyAndRenewLock("DELETING_CITIZENS");
      const userBatchManager = new SafeBatchManager(db, 350, () => verifyAndRenewLock("DELETING_CITIZENS"));

      // Cursor-paginated iteration through all users
      let lastUserDoc = null;
      while (true) {
        let usersQuery = db.collection("users").orderBy(admin.firestore.FieldPath.documentId()).limit(100);
        if (lastUserDoc) usersQuery = usersQuery.startAfter(lastUserDoc);
        const usersSnap = await usersQuery.get();
        if (usersSnap.empty) break;

        for (const uDoc of usersSnap.docs) {
          const uData = uDoc.data();
          const uEmail = (uData.email || "").toLowerCase();
          const uRole = uData.role;

          // STRICT PROTECTION: Admin is untouchable
          if (uRole === "admin" || uEmail === "admin@janaseva.gov.in") {
            continue;
          }

          await userBatchManager.delete(uDoc.ref);
          deletedUsers++;

          try {
            await admin.auth().deleteUser(uDoc.id);
          } catch (authDelErr) {
            // Auth user may not exist in live Auth or already deleted
          }
        }
        await userBatchManager.flush();
        if (usersSnap.size < 100) break;
        lastUserDoc = usersSnap.docs[usersSnap.docs.length - 1];
      }
      await userBatchManager.flush();
    }

    // STAGE 4: Release Reset Lock (Ownership-verified)
    const finalLockSnap = await lockRef.get();
    if (finalLockSnap.exists && finalLockSnap.data().resetId === resetId) {
      await lockRef.set({
        isLocked: false,
        unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastResetId: resetId,
        status: "COMPLETED"
      });
    }

    // STAGE 5: Restore normal operational mode (disable maintenance mode)
    await maintRef.set({
      active: false,
      reason: "System reset complete. Normal operations restored.",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // STAGE 6: Write Immutable Audit Record to emergencyResetAuditLogs
    const auditRecord = {
      resetId,
      mode,
      status: "SUCCESS",
      executedBy: adminUser.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      timestampIso: new Date().toISOString(),
      backupId,
      backupChecksum: backupData.sha256Checksum,
      recordsDeleted: {
        complaints: deletedComplaints,
        subcollections: deletedSubcollections,
        logs: deletedLogs,
        users: deletedUsers
      },
      preservedEntities: [
        "",
        "Panchayat Configuration Directory",
        "Receiver Email & Delivery Settings",
        "Emergency Backup Store",
        "Immutable Audit Logs"
      ],
      clientIp: context.rawRequest ? (context.rawRequest.headers["x-forwarded-for"] || context.rawRequest.connection?.remoteAddress || "local") : "internal"
    };

    await db.collection("emergencyResetAuditLogs").doc(resetId).set(auditRecord);

    return {
      success: true,
      resetId,
      mode,
      backupId,
      recordsDeleted: auditRecord.recordsDeleted,
      executedAt: auditRecord.timestampIso
    };
  } catch (err) {
    console.error("Critical error during emergency reset execution:", err);

    // Restore original maintenance state on failure
    await maintRef.set({
      active: priorMaint?.active ?? false,
      reason: priorMaint?.reason || "Reset failed. Original operational state restored.",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Release lock on failure ONLY if this operation still owns it
    try {
      const errLockSnap = await lockRef.get();
      if (errLockSnap.exists && errLockSnap.data().resetId === resetId) {
        await lockRef.set({
          isLocked: false,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastResetId: resetId,
          lastError: err.message,
          status: "FAILED"
        });
      }
    } catch (lockErr) {
      console.error("Failed to release lock on error:", lockErr);
    }

    // Log failure to audit
    await db.collection("emergencyResetAuditLogs").doc(resetId + "-FAILED").set({
      resetId: resetId + "-FAILED",
      mode,
      status: "FAILED",
      executedBy: adminUser.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      error: err.message
    }).catch((audErr) => console.error("Failed to write audit log:", audErr));

    throw new functions.https.HttpsError("internal", "Emergency reset aborted due to unexpected error: " + err.message);
  }
});

/**
 * Callable: Renew Emergency Reset Lock Heartbeat
 */
exports.renewResetLock = functions.https.onCall(async (data, context) => {
  await assertAdminCaller(context);
  const { resetId } = data || {};

  if (!resetId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing resetId to renew.");
  }

  const lockRef = db.collection("systemSettings").doc("resetLock");
  const lockSnap = await lockRef.get();
  if (!lockSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Reset lock not found.");
  }

  const lockData = lockSnap.data();
  if (!lockData.isLocked || lockData.resetId !== resetId) {
    throw new functions.https.HttpsError("failed-precondition", "Lock is not active or belongs to another reset operation.");
  }

  await lockRef.update({
    heartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
    heartbeatAtIso: new Date().toISOString()
  });

  return {
    success: true,
    resetId,
    renewedAt: new Date().toISOString()
  };
});

/**
 * Callable: Restore Emergency Data from Backup Snapshot (Staged & Verified)
 */
exports.restoreEmergencyBackup = functions.https.onCall(async (data, context) => {
  const adminUser = await assertAdminCaller(context);
  const { backupId } = data || {};

  if (!backupId || typeof backupId !== "string" || backupId.trim().length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Missing or invalid backupId to restore.");
  }

  const backupDoc = await db.collection("emergencyResetBackups").doc(backupId).get();
  if (!backupDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Emergency backup document not found.");
  }

  const bData = backupDoc.data();

  // 1. Never restore an unverified backup or a backup marked FAILED
  if (bData.verified !== true || bData.status !== "READY") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Restoration rejected: The specified backup snapshot is unverified or marked not READY."
    );
  }

  // 2. Mandatory Checksum Presence Check
  if (!bData.sha256Checksum || typeof bData.sha256Checksum !== "string" || bData.sha256Checksum.trim().length === 0) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Restoration rejected: Missing mandatory SHA-256 checksum in backup snapshot record."
    );
  }

  // 3. Resolve and download backup payload from Cloud Storage
  if (!bData.storagePath) {
    throw new functions.https.HttpsError("failed-precondition", "Backup manifest contains no Cloud Storage path.");
  }

  const bucket = admin.storage().bucket();
  const file = bucket.file(bData.storagePath);
  const [fileExists] = await file.exists();
  if (!fileExists) {
    throw new functions.https.HttpsError("not-found", `Backup payload file does not exist at Cloud Storage path: ${bData.storagePath}`);
  }

  const [contentBuffer] = await file.download();
  let payload;
  try {
    payload = JSON.parse(contentBuffer.toString("utf-8"));
  } catch (parseErr) {
    throw new functions.https.HttpsError("internal", "Failed to parse backup payload JSON from Cloud Storage: " + parseErr.message);
  }

  // 4. Verify SHA-256 Checksum against downloaded payload
  const computedHash = crypto.createHash("sha256").update(contentBuffer).digest("hex");
  if (computedHash.toLowerCase() !== bData.sha256Checksum.trim().toLowerCase()) {
    throw new functions.https.HttpsError(
      "data-loss",
      `Restoration rejected: Mandatory SHA-256 checksum mismatch! Expected ${bData.sha256Checksum.substring(0, 16)}..., computed ${computedHash.substring(0, 16)}... Data integrity compromised.`
    );
  }

  // 5. Validate All Required Backup Categories
  const requiredCategories = ["complaints", "emailLogs", "whatsappLogs", "users"];
  for (const cat of requiredCategories) {
    if (!Array.isArray(payload[cat])) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Restoration rejected: Backup payload is missing required category '${cat}'. Must be an array.`
      );
    }
  }

  // 6. Validate Record Counts against Manifest
  const expectedComplaints = bData.recordCounts?.complaints ?? payload.complaints.length;
  const expectedEmailLogs = bData.recordCounts?.emailLogs ?? payload.emailLogs.length;
  const expectedWhatsappLogs = bData.recordCounts?.whatsappLogs ?? payload.whatsappLogs.length;
  const expectedLogs = bData.recordCounts?.logs ?? (expectedEmailLogs + expectedWhatsappLogs);
  const expectedUsers = bData.recordCounts?.users ?? payload.users.length;

  if (payload.complaints.length !== expectedComplaints ||
      payload.emailLogs.length !== expectedEmailLogs ||
      payload.whatsappLogs.length !== expectedWhatsappLogs ||
      payload.users.length !== expectedUsers) {
    throw new functions.https.HttpsError(
      "data-loss",
      "Restoration rejected: Payload contains fewer records than verified in backup manifest. Possible truncated backup."
    );
  }

  // 6b. Validate and restore every additional application collection captured in the manifest.
  if (payload.additionalCollections !== undefined &&
      (!payload.additionalCollections || typeof payload.additionalCollections !== "object" || Array.isArray(payload.additionalCollections))) {
    throw new functions.https.HttpsError("failed-precondition", "Backup additionalCollections manifest is invalid.");
  }
  const additionalCollections = payload.additionalCollections || {};
  const additionalCollectionCounts = bData.recordCounts?.additionalCollections || {};
  for (const [collectionName, records] of Object.entries(additionalCollections)) {
    if (!Array.isArray(records)) {
      throw new functions.https.HttpsError("failed-precondition", `Backup collection '${collectionName}' is not an array.`);
    }
    if (Number.isInteger(additionalCollectionCounts[collectionName]) && records.length !== additionalCollectionCounts[collectionName]) {
      throw new functions.https.HttpsError("data-loss", `Backup record count mismatch for collection '${collectionName}'.`);
    }
  }

  // 7. Initialize Staged Restoration Record for recovery and tracking
  const restoreId = "RESTORE-" + Date.now();
  const restoreRef = db.collection("emergencyResetRestorations").doc(restoreId);

  await restoreRef.set({
    restoreId,
    backupId,
    initiatedBy: adminUser.email,
    stage: "VALIDATING",
    status: "IN_PROGRESS",
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    startedAtIso: new Date().toISOString(),
    expectedCounts: {
      complaints: expectedComplaints,
      emailLogs: expectedEmailLogs,
      whatsappLogs: expectedWhatsappLogs,
      users: expectedUsers
    },
    restoredCounts: {
      complaints: 0,
      emailLogs: 0,
      whatsappLogs: 0,
      users: 0
    }
  });

  let restoredComplaints = 0;
  let restoredEmailLogs = 0;
  let restoredWhatsappLogs = 0;
  let restoredUsers = 0;

  try {
    // STAGE 1: Restore Complaints and all nested subcollections
    await restoreRef.update({ stage: "COMPLAINTS" });
    const compBatchManager = new SafeBatchManager(db, 350);

    for (const c of payload.complaints) {
      const subcollections = c._subcollections || {};
      const cCopy = { ...c };
      delete cCopy._subcollections;
      delete cCopy._statusHistory;
      delete cCopy._messages;

      const cRef = db.collection("complaints").doc(c.id);
      await compBatchManager.set(cRef, cCopy, { merge: true });
      restoredComplaints++;

      // Restore all nested levels, preserving deterministic document IDs.
      for (const [subName, subDocs] of Object.entries(subcollections)) {
        if (!Array.isArray(subDocs)) throw new Error(`Invalid nested backup collection '${subName}'.`);
        for (const nestedDoc of subDocs) {
          await restoreDocumentTree(cRef.collection(subName), nestedDoc, compBatchManager);
        }
      }

      // Legacy arrays are retained for old backup compatibility.
      if (Array.isArray(c._statusHistory)) {
        for (const sh of c._statusHistory) {
          await compBatchManager.set(cRef.collection("statusHistory").doc(sh.id), sh, { merge: true });
        }
      }
      if (Array.isArray(c._messages)) {
        for (const ms of c._messages) {
          await compBatchManager.set(cRef.collection("messages").doc(ms.id), ms, { merge: true });
        }
      }
    }
    await compBatchManager.flush();
    await restoreRef.update({ "restoredCounts.complaints": restoredComplaints });

    // STAGE 2: Restore Email Logs (Deterministic IDs prevent duplicate accumulation during retry)
    await restoreRef.update({ stage: "EMAIL_LOGS" });
    const emailBatchManager = new SafeBatchManager(db, 350);

    for (const l of payload.emailLogs) {
      const deterministicLogId = l.id || ("el-" + crypto.createHash("sha256").update(
        (l.recipient || "") + "|" + (l.timestamp || l.sentAt || "") + "|" + (l.emailType || l.type || "") + "|" + (l.complaintId || "")
      ).digest("hex").substring(0, 24));

      await emailBatchManager.set(db.collection("emailLogs").doc(deterministicLogId), l, { merge: true });
      restoredEmailLogs++;
    }
    await emailBatchManager.flush();
    await restoreRef.update({ "restoredCounts.emailLogs": restoredEmailLogs });

    // STAGE 3: Restore WhatsApp Logs (Deterministic IDs prevent duplicate accumulation during retry)
    await restoreRef.update({ stage: "WHATSAPP_LOGS" });
    const whatsappBatchManager = new SafeBatchManager(db, 350);

    for (const wl of payload.whatsappLogs) {
      const deterministicLogId = wl.id || ("wl-" + crypto.createHash("sha256").update(
        (wl.recipient || wl.mobile || "") + "|" + (wl.timestamp || wl.sentAt || "") + "|" + (wl.templateName || wl.type || "") + "|" + (wl.complaintId || "")
      ).digest("hex").substring(0, 24));

      await whatsappBatchManager.set(db.collection("whatsappLogs").doc(deterministicLogId), wl, { merge: true });
      restoredWhatsappLogs++;
    }
    await whatsappBatchManager.flush();
    await restoreRef.update({ "restoredCounts.whatsappLogs": restoredWhatsappLogs });

    // STAGE 4: Restore Users (Citizens and Receivers)
    await restoreRef.update({ stage: "USERS" });
    const userBatchManager = new SafeBatchManager(db, 350);

    for (const u of payload.users) {
      await userBatchManager.set(db.collection("users").doc(u.id), u, { merge: true });
      restoredUsers++;
    }
    await userBatchManager.flush();
    await restoreRef.update({ "restoredCounts.users": restoredUsers });

    // STAGE 5: Restore all additional top-level application collections recursively.
    await restoreRef.update({ stage: "ADDITIONAL_COLLECTIONS" });
    let restoredAdditionalDocuments = 0;
    const additionalBatchManager = new SafeBatchManager(db, 350);
    for (const [collectionName, records] of Object.entries(additionalCollections)) {
      const collectionRef = db.collection(collectionName);
      for (const record of records) {
        await restoreDocumentTree(collectionRef, record, additionalBatchManager);
        restoredAdditionalDocuments++;
      }
    }
    await additionalBatchManager.flush();
    await restoreRef.update({ restoredAdditionalDocuments });

    // STAGE 6: Post-Restore Record Count Verification Across ALL Categories
    await restoreRef.update({ stage: "VERIFYING" });
    const restoredTotalLogs = restoredEmailLogs + restoredWhatsappLogs;

    if (restoredComplaints !== expectedComplaints) {
      throw new Error(`Restoration count verification failed for complaints: Expected ${expectedComplaints}, verified only ${restoredComplaints}.`);
    }
    if (restoredTotalLogs !== expectedLogs) {
      throw new Error(`Restoration count verification failed for delivery logs: Expected ${expectedLogs}, verified only ${restoredTotalLogs}.`);
    }
    if (restoredUsers !== expectedUsers) {
      throw new Error(`Restoration count verification failed for user accounts: Expected ${expectedUsers}, verified only ${restoredUsers}.`);
    }

    // STAGE 7: Mark Restoration COMPLETED
    await restoreRef.update({
      stage: "COMPLETED",
      status: "COMPLETED",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAtIso: new Date().toISOString()
    });

    // Write Immutable Audit Log
    await db.collection("emergencyResetAuditLogs").doc(restoreId).set({
      action: "RESTORE_BACKUP",
      restoreId,
      backupId,
      restoredBy: adminUser.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      timestampIso: new Date().toISOString(),
      status: "SUCCESS",
      restoredCounts: {
        complaints: restoredComplaints,
        emailLogs: restoredEmailLogs,
        whatsappLogs: restoredWhatsappLogs,
        logs: restoredTotalLogs,
        users: restoredUsers
      }
    });

    return {
      success: true,
      restoreId,
      backupId,
      restoredCounts: {
        complaints: restoredComplaints,
        emailLogs: restoredEmailLogs,
        whatsappLogs: restoredWhatsappLogs,
        logs: restoredTotalLogs,
        users: restoredUsers
      }
    };
  } catch (restoreErr) {
    console.error("Critical error during staged restoration:", restoreErr);

    // Update restore record with failure details
    await restoreRef.update({
      status: "FAILED",
      error: restoreErr.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    }).catch((uErr) => console.error("Failed to update restoration failure status:", uErr));

    throw new functions.https.HttpsError("internal", "Restoration failed: " + restoreErr.message);
  }
});

/**
 * Callable: Admin Maintenance Mode Toggle
 */
exports.setMaintenanceMode = functions.https.onCall(async (data, context) => {
  const adminUser = await assertAdminCaller(context);
  const { active, reason = "Scheduled Maintenance" } = data || {};

  await db.collection("systemSettings").doc("maintenance").set({
    active: !!active,
    reason,
    updatedBy: adminUser.email,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    success: true,
    active: !!active,
    reason
  };
});



/**
 * Callable: Delete Emergency Backup Snapshot
 */
exports.deleteEmergencyBackup = functions.https.onCall(async (data, context) => {
  const adminUser = await assertAdminCaller(context);
  const { backupId } = data || {};

  if (!backupId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing backupId to delete.");
  }

  const backupRef = db.collection("emergencyResetBackups").doc(backupId);
  const backupDoc = await backupRef.get();
  if (!backupDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Emergency backup document not found.");
  }

  const bData = backupDoc.data() || {};
  if (bData.storagePath) {
    try {
      await admin.storage().bucket().file(bData.storagePath).delete({ ignoreNotFound: true });
    } catch (storageErr) {
      console.warn("[deleteEmergencyBackup] Storage cleanup notice:", storageErr.message);
    }
  }

  await backupRef.delete();

  // Audit deletion of backup
  await db.collection("emergencyResetAuditLogs").doc("DEL-BKP-" + Date.now()).set({
    action: "DELETE_BACKUP",
    backupId,
    deletedBy: adminUser.email,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    status: "SUCCESS"
  });

  return {
    success: true,
    deletedBackupId: backupId
  };
});


/**
 * Callable: Delete Emergency Audit Log Entry (PROHIBITED - Strictly Immutable)
 */
exports.deleteAuditLog = functions.https.onCall(async (data, context) => {
  await assertAdminCaller(context);
  throw new functions.https.HttpsError(
    "permission-denied",
    "Security Violation: Audit log entries are strictly immutable and append-only. Modification or deletion is permanently forbidden."
  );
});

/**
 * Callable: Clear All Emergency Audit Logs (PROHIBITED - Strictly Immutable)
 */
exports.clearAllAuditLogs = functions.https.onCall(async (data, context) => {
  await assertAdminCaller(context);
  throw new functions.https.HttpsError(
    "permission-denied",
    "Security Violation: Audit logs are strictly immutable and append-only. Bulk deletion is permanently forbidden."
  );
});

/**
 * ============================================================================
 * JANASEVA – AI KNOWLEDGE CENTRE CLOUD FUNCTIONS & RECEIVER API
 * ============================================================================
 */

exports.submitKnowledgeDocument = functions.runWith({ timeoutSeconds: 120, memory: "512MB" }).https.onCall(async (data, context) => {
  try {
    const { filename, mimeType = "", base64, contributorName = "Public Contributor", categoryHint = "", replaceDocId = null } = data || {};
    if (!filename || !base64 || typeof base64 !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Filename and base64 document payload are required.");
    }
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > 25 * 1024 * 1024) {
      throw new functions.https.HttpsError("invalid-argument", "Document exceeds 25 MB limit.");
    }
    let caller = { uid: "public-contributor", name: contributorName, email: "", role: "public" };
    if (context && context.auth) {
      caller = await authService.getCallerProfile(db, context);
    }
    const sourceReliability = caller.role === "admin" && data?.sourceReliability === "official" ? "official" : "community";
    return await knowledgeService.ingestKnowledgeBuffer(db, {
      buffer, filename, mimeType,
      contributorId: caller.uid,
      contributorName: contributorName || caller.name,
      contributorEmail: caller.email,
      contributorRole: caller.role,
      categoryHint,
      sourceReliability,
      sourceChannel: caller.role === "admin" ? "ADMIN_UPLOAD" : "PUBLIC_UPLOAD",
      replaceDocId
    });
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to process knowledge document.");
  }
});

exports.onKnowledgeJobCreated = functions.runWith({ timeoutSeconds: 180, memory: "512MB" }).firestore
  .document("knowledge_processing_jobs/{jobId}")
  .onCreate(async (snap) => {
    const job = snap.data() || {};
    if (job.status !== "QUEUED" || !job.tempStoragePath || !job.filename) return null;
    try {
      const [buf] = await admin.storage().bucket().file(job.tempStoragePath).download();
      return await knowledgeService.ingestKnowledgeBuffer(db, {
        buffer: buf,
        filename: job.filename,
        mimeType: job.mimeType || "",
        contributorId: job.contributorId || "public",
        contributorName: job.contributorName || "Public Contributor",
        contributorRole: job.contributorRole || "public",
        categoryHint: job.categoryHint || "",
        sourceReliability: job.sourceReliability || "community",
        sourceChannel: "ASYNC_JOB_QUEUE",
        replaceDocId: job.replaceDocId || null
      });
    } catch (err) {
      await snap.ref.set({ status: "FAILED", error: err.message, completedAt: new Date().toISOString() }, { merge: true });
      return null;
    }
  });

exports.searchKnowledgeBase = functions.https.onCall(async (data) => {
  try {
    const {
      query = "",
      lang = "en-IN",
      limit = 6,
      semanticSearch = true,
      crossLanguageSearch = true,
      schemeSearch = true
    } = data || {};
    if (!query || typeof query !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Search query is required.");
    }
    return await knowledgeService.queryKnowledgeBaseServer(db, {
      query,
      lang,
      limit,
      semanticSearch: semanticSearch !== false,
      crossLanguageSearch: crossLanguageSearch !== false,
      schemeSearch: schemeSearch !== false
    });
  } catch (err) {
    rethrowSafeHttpsError(err, "Knowledge search failed.");
  }
});

exports.downloadKnowledgeDocument = functions.https.onCall(async (data, context) => {
  try {
    const { docId, asText = false } = data || {};
    if (!docId) throw new functions.https.HttpsError("invalid-argument", "docId is required.");
    const docSnap = await db.collection("knowledge_documents").doc(String(docId)).get();
    if (!docSnap.exists) throw new functions.https.HttpsError("not-found", "Document not found.");
    const d = docSnap.data();

    let isAdmin = false;
    if (context && context.auth) {
      const caller = await authService.getCallerProfile(db, context);
      isAdmin = caller.role === "admin";
    }
    if (!isAdmin && (d.status !== "INDEXED" || d.enabled === false || d.quarantined)) {
      throw new functions.https.HttpsError("permission-denied", "Access denied: document is disabled or quarantined.");
    }
    const targetPath = asText ? d.privateTextRef : d.privateStorageRef;
    const [buf] = await admin.storage().bucket().file(targetPath).download();
    return {
      success: true,
      filename: asText ? `${d.safeFilename}_extracted.txt` : d.originalFilename,
      mimeType: asText ? "text/plain" : d.mimeType,
      base64: buf.toString("base64")
    };
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to download document.");
  }
});

exports.getKnowledgeAdminOverview = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.assertReceiverOrAdmin(db, context);
    const [docsSnap, jobsSnap, uploadersSnap, auditSnap, apiSnap, apiLogsSnap, bkpSnap, storageSnap] = await Promise.all([
      db.collection("knowledge_documents").orderBy("uploadedAt", "desc").limit(300).get(),
      db.collection("knowledge_processing_jobs").orderBy("startedAt", "desc").limit(200).get(),
      db.collection("knowledge_uploaders").limit(200).get(),
      db.collection("knowledge_audit_logs").orderBy("timestamp", "desc").limit(200).get(),
      db.collection("knowledge_api_receivers").doc("default").get(),
      db.collection("knowledge_api_logs").orderBy("timestamp", "desc").limit(100).get(),
      db.collection("knowledge_backups").orderBy("createdAt", "desc").limit(50).get(),
      db.collection("knowledge_storage_usage").doc("summary").get()
    ]);
    return {
      success: true,
      callerRole: caller.role,
      documents: docsSnap.docs.map((d) => d.data()),
      jobs: jobsSnap.docs.map((d) => d.data()),
      uploaders: uploadersSnap.docs.map((d) => d.data()),
      auditLogs: auditSnap.docs.map((d) => d.data()),
      apiConfig: apiSnap.exists ? apiSnap.data() : { enabled: false },
      apiLogs: apiLogsSnap.docs.map((d) => d.data()),
      backups: bkpSnap.docs.map((d) => d.data()),
      storage: storageSnap.exists ? storageSnap.data() : { totalBytes: 0, totalFiles: 0 }
    };
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to fetch Knowledge Centre admin overview.");
  }
});

exports.manageKnowledgeDocument = functions.https.onCall(async (data, context) => {
  try {
    const caller = await authService.assertReceiverOrAdmin(db, context);
    const { action, docId, enabled, reason = "" } = data || {};
    if (!docId || !action) throw new functions.https.HttpsError("invalid-argument", "action and docId required.");

    if (action === "delete") {
      // Receivers can delete their own uploaded documents; Admins can delete any document
      if (caller.role !== "admin") {
        const snap = await db.collection("knowledge_documents").doc(docId).get();
        if (snap.exists) {
          const docData = snap.data();
          if (docData.sourceReliability === "official" && docData.contributorId && docData.contributorId !== caller.uid) {
            throw new functions.https.HttpsError("permission-denied", "Receivers cannot delete official admin circulars.");
          }
        }
      }
      return await knowledgeService.deleteKnowledgeDocumentServer(db, docId, caller, reason);
    }
    if (action === "setEnabled") {
      const ref = db.collection("knowledge_documents").doc(docId);
      const snap = await ref.get();
      if (!snap.exists) throw new functions.https.HttpsError("not-found", "Document not found.");
      if (snap.data().quarantined && enabled) throw new functions.https.HttpsError("failed-precondition", "Cannot enable quarantined document.");
      await ref.update({ enabled: Boolean(enabled), updatedAt: new Date().toISOString() });
      const [cSnap, eSnap] = await Promise.all([
        db.collection("knowledge_chunks").where("docId", "==", docId).get(),
        db.collection("knowledge_embeddings").where("docId", "==", docId).get()
      ]);
      const ops = [];
      cSnap.forEach((c) => ops.push({ type: "update", ref: c.ref, data: { active: Boolean(enabled) } }));
      eSnap.forEach((e) => ops.push({ type: "update", ref: e.ref, data: { active: Boolean(enabled) } }));
      await knowledgeService.commitBatchedWrites(db, ops);
      await knowledgeService.writeAuditLog(db, enabled ? "KNOWLEDGE_ENABLED" : "KNOWLEDGE_DISABLED", docId, `${enabled ? "Enabled" : "Disabled"} document`, caller);
      return { success: true, docId, enabled: Boolean(enabled) };
    }
    if (action === "reprocess") {
      const snap = await db.collection("knowledge_documents").doc(docId).get();
      if (!snap.exists) throw new functions.https.HttpsError("not-found", "Document not found.");
      const d = snap.data();
      const [buf] = await admin.storage().bucket().file(d.privateStorageRef).download();
      await knowledgeService.deleteKnowledgeDocumentServer(db, docId, caller, "Reprocessing");
      return await knowledgeService.ingestKnowledgeBuffer(db, {
        buffer: buf, filename: d.originalFilename, mimeType: d.mimeType,
        contributorId: d.contributorId, contributorName: d.contributorDisplayName,
        sourceReliability: d.sourceReliability || "community", sourceChannel: "RECEIVER_REPROCESS"
      });
    }
    throw new functions.https.HttpsError("invalid-argument", "Unsupported action.");
  } catch (err) {
    rethrowSafeHttpsError(err, "Knowledge document management action failed.");
  }
});

exports.knowledgeBackupAndRestore = functions.https.onCall(async (data, context) => {
  try {
    const adminCaller = await authService.assertAdmin(db, context);
    const { action, backupId } = data || {};
    if (action === "backup") {
      return await knowledgeService.createKnowledgeBackupServer(db, adminCaller);
    }
    if (action === "restore") {
      return await knowledgeService.restoreKnowledgeBackupServer(db, backupId, adminCaller);
    }
    throw new functions.https.HttpsError("invalid-argument", "Unsupported backup action.");
  } catch (err) {
    rethrowSafeHttpsError(err, "Knowledge backup/restore failed.");
  }
});

exports.updateKnowledgeApiSettings = functions.https.onCall(async (data, context) => {
  try {
    return await knowledgeApiService.updateKnowledgeApiSettings(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to update Receiver API settings.");
  }
});

exports.testKnowledgeRetrieval = functions.https.onCall(async (data, context) => {
  try {
    await authService.assertReceiverOrAdmin(db, context);
    return await knowledgeService.queryKnowledgeBaseServer(db, {
      query: String(data?.query || ""),
      lang: data?.lang || "en-IN",
      limit: Number(data?.limit) || 6
    });
  } catch (err) {
    rethrowSafeHttpsError(err, "Knowledge test query failed.");
  }
});

/**
 * HTTPS Receiver API Endpoint (External Systems -> JANASEVA Knowledge Centre)
 */
exports.knowledgeReceiverApi = functions.runWith({ timeoutSeconds: 60, memory: "512MB" }).https.onRequest(async (req, res) => {
  return await knowledgeApiService.handleReceiverApiHttpRequest(db, req, res);
});

// =============================================================================
// RECEIVER SETTINGS: API MANAGEMENT & RECOVERY CONTROL CENTRE CLOUD FUNCTIONS
// =============================================================================

exports.getReceiverApiManagementOverview = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.getApiManagementOverview(db, context);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to load API Management Overview.");
  }
});

exports.saveApiConfiguration = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.saveApiConfiguration(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to save API Configuration.");
  }
});

exports.testApiIntegrationConnection = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.testApiIntegrationConnection(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "API connection test failed.");
  }
});

exports.rollbackApiConfiguration = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.rollbackApiConfiguration(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "API rollback operation failed.");
  }
});

exports.createManualApiBackup = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.createManualApiBackup(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to create API backup snapshot.");
  }
});

exports.restoreApiBackup = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.restoreApiBackup(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to restore API configuration snapshot.");
  }
});

exports.manageReceiverApiPermissions = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.manageReceiverApiPermissions(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to update Receiver API permissions.");
  }
});

exports.emergencyApiLockdown = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.emergencyApiLockdown(db, context);
  } catch (err) {
    rethrowSafeHttpsError(err, "Emergency API lockdown failed.");
  }
});

exports.saveCustomApiConfiguration = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.saveCustomApiConfig(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to save Custom API configuration.");
  }
});

exports.deleteCustomApiConfiguration = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.deleteCustomApiConfig(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to delete Custom API configuration.");
  }
});

exports.getCustomApiConfigurations = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.getCustomApiConfigs(db, context);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to retrieve Custom API configurations.");
  }
});

exports.rotateCustomApiKey = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.rotateCustomApiKey(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to rotate API Key in Vault.");
  }
});

exports.testCustomApiConnectionBackend = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.testCustomApiConnectionBackend(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Custom API connection test failed.");
  }
});

exports.routeServiceApiRequest = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.routeServiceApiRequest(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to route API service request.");
  }
});

exports.savePersonalApiConfiguration = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.savePersonalApiConfig(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to save personal API configuration.");
  }
});

exports.deletePersonalApiConfiguration = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.deletePersonalApiConfig(db, context, data?.configId);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to delete personal API configuration.");
  }
});

exports.getPersonalApiConfigurations = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.getPersonalApiConfigs(db, context);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to retrieve personal API configurations.");
  }
});

exports.saveNotificationPreferences = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.saveNotificationPreferences(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to save notification preferences.");
  }
});

exports.getNotificationPreferences = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.getNotificationPreferences(db, context);
  } catch (err) {
    rethrowSafeHttpsError(err, "Failed to retrieve notification preferences.");
  }
});

exports.executeApiWithFailover = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.executeApiWithFailover(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "API failover execution failed.");
  }
});

exports.checkSupabaseSubsystems = functions.https.onCall(async (data, context) => {
  try {
    return await apiManagementService.checkSupabaseSubsystems(db, context, data || {});
  } catch (err) {
    rethrowSafeHttpsError(err, "Supabase subsystem health check failed.");
  }
});
