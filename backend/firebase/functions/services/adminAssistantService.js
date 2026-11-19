/**
 * JANASEVA – Citizen Feedback & Admin Assistant Operations Service
 * Manages response ratings, reported incorrect answer review queue,
 * permitted analytics, and approved non-secret assistant configuration.
 */

const functions = require("firebase-functions");
const { assertAdmin } = require("./authService");
const { getProviderStatus, getAssistantRuntimeConfig } = require("./aiProviderService");
const { normalizeLang } = require("./languageService");

/**
 * Submit citizen/user feedback on an assistant message.
 */
async function submitAssistantFeedback(db, caller, payload) {
  const {
    feedbackId,
    sessionId = "",
    messageId = "",
    rating,
    reason = "",
    messageSnippet = "",
    language = "en-IN"
  } = payload || {};

  if (!["helpful", "not_helpful", "incorrect"].includes(rating)) {
    throw new functions.https.HttpsError("invalid-argument", "Rating must be 'helpful', 'not_helpful', or 'incorrect'.");
  }

  const cleanId = String(feedbackId || `fb-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);

  const record = {
    feedbackId: cleanId,
    userId: caller.uid,
    userRole: caller.role || "citizen",
    sessionId: String(sessionId || "").slice(0, 80),
    messageId: String(messageId || "").slice(0, 80),
    rating,
    reason: String(reason || "").trim().slice(0, 1000),
    messageSnippet: String(messageSnippet || "").trim().slice(0, 500),
    language: normalizeLang(language),
    status: "open",
    createdAt: new Date().toISOString()
  };

  await db.collection("assistantFeedback").doc(cleanId).set(record);
  return { success: true, feedbackId: cleanId, status: "open" };
}

/**
 * Admin-only: Retrieve operational assistant analytics and reported incorrect answers.
 */
async function getAssistantAdminAnalytics(db, context) {
  await assertAdmin(db, context);

  const [fbSnap, analyticsSnap, providerStatus, runtimeConfig] = await Promise.all([
    db.collection("assistantFeedback").orderBy("createdAt", "desc").limit(100).get().catch(() => null),
    db.collection("assistantAnalytics").doc("summary").get().catch(() => null),
    getProviderStatus(db),
    getAssistantRuntimeConfig(db)
  ]);

  let helpfulCount = 0;
  let notHelpfulCount = 0;
  let incorrectCount = 0;
  const reportedItems = [];

  if (fbSnap && !fbSnap.empty) {
    fbSnap.forEach((d) => {
      const f = d.data() || {};
      if (f.rating === "helpful") helpfulCount++;
      else if (f.rating === "not_helpful") notHelpfulCount++;
      else if (f.rating === "incorrect") {
        incorrectCount++;
        reportedItems.push({
          feedbackId: f.feedbackId || d.id,
          rating: f.rating,
          reason: f.reason || "",
          messageSnippet: f.messageSnippet || "",
          language: f.language || "en-IN",
          status: f.status || "open",
          createdAt: f.createdAt || "",
          adminNote: f.adminNote || ""
        });
      }
    });
  }

  const summaryData = analyticsSnap && analyticsSnap.exists ? analyticsSnap.data() || {} : {};

  return {
    success: true,
    providerStatus,
    runtimeConfig,
    analytics: {
      totalInteractions: Number(summaryData.totalInteractions) || 0,
      complaintsStarted: Number(summaryData.complaintsStarted) || 0,
      trackingQueries: Number(summaryData.trackingQueries) || 0,
      emergencyAlerts: Number(summaryData.emergencyAlerts) || 0,
      feedback: {
        helpful: helpfulCount,
        notHelpful: notHelpfulCount,
        incorrect: incorrectCount,
        total: helpfulCount + notHelpfulCount + incorrectCount
      }
    },
    reportedItems: reportedItems.slice(0, 50)
  };
}

/**
 * Admin-only: Review/resolve a reported incorrect assistant answer.
 */
async function reviewAssistantFeedback(db, context, payload) {
  const adminCaller = await assertAdmin(db, context);
  const { feedbackId, status, adminNote = "" } = payload || {};

  if (!feedbackId || typeof feedbackId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "feedbackId is required.");
  }
  if (!["open", "reviewed", "resolved", "dismissed"].includes(status)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid feedback review status.");
  }

  const cleanId = feedbackId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const ref = db.collection("assistantFeedback").doc(cleanId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError("not-found", "Feedback report not found.");
  }

  await ref.update({
    status,
    adminNote: String(adminNote || "").trim().slice(0, 1000),
    reviewedBy: adminCaller.email || adminCaller.uid,
    reviewedAt: new Date().toISOString()
  });

  return { success: true, feedbackId: cleanId, status };
}

/**
 * Admin-only: Update non-secret assistant runtime settings.
 * Explicitly rejects any attempt to submit API keys or secrets into Firestore.
 */
async function updateAssistantConfig(db, context, payload) {
  const adminCaller = await assertAdmin(db, context);
  const forbiddenKeys = ["apiKey", "geminiKey", "openaiKey", "secret", "token", "password"];
  if (payload && typeof payload === "object") {
    for (const k of Object.keys(payload)) {
      if (forbiddenKeys.some((fk) => k.toLowerCase().includes(fk.toLowerCase()))) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Security Error: API keys and secrets must never be stored in Firestore configuration. Use server-side Firebase Secrets instead."
        );
      }
    }
  }

  const current = await getAssistantRuntimeConfig(db);
  const resetDefaults = {
    aiEnabled: true,
    preferredProvider: "auto",
    temperature: 0.3,
    maxOutputTokens: 650,
    timeoutMs: 14000,
    rateLimitPerMinute: 20,
    rateLimitPerDay: 250,
    welcomeNotice: ""
  };
  const isReset = Boolean(payload && payload.resetToDefaults === true);
  const base = isReset ? resetDefaults : current;

  const next = {
    aiEnabled: !isReset && payload?.aiEnabled !== undefined ? Boolean(payload.aiEnabled) : base.aiEnabled,
    preferredProvider: !isReset && ["auto", "gemini", "openai", "guided"].includes(payload?.preferredProvider)
      ? payload.preferredProvider
      : base.preferredProvider,
    temperature: !isReset && payload?.temperature !== undefined
      ? Math.min(1, Math.max(0, Number(payload.temperature)))
      : base.temperature,
    maxOutputTokens: !isReset && payload?.maxOutputTokens !== undefined
      ? Math.min(1200, Math.max(150, Number(payload.maxOutputTokens)))
      : base.maxOutputTokens,
    timeoutMs: !isReset && payload?.timeoutMs !== undefined
      ? Math.min(25000, Math.max(4000, Number(payload.timeoutMs)))
      : base.timeoutMs,
    rateLimitPerMinute: !isReset && payload?.rateLimitPerMinute !== undefined
      ? Math.min(120, Math.max(3, Number(payload.rateLimitPerMinute)))
      : base.rateLimitPerMinute,
    rateLimitPerDay: !isReset && payload?.rateLimitPerDay !== undefined
      ? Math.min(2000, Math.max(10, Number(payload.rateLimitPerDay)))
      : base.rateLimitPerDay,
    welcomeNotice: !isReset && payload?.welcomeNotice !== undefined
      ? String(payload.welcomeNotice || "").trim().slice(0, 400)
      : base.welcomeNotice,
    updatedBy: adminCaller.email || adminCaller.uid,
    updatedAt: new Date().toISOString()
  };

  await db.collection("systemSettings").doc("assistantConfig").set(next, { merge: true });
  return { success: true, config: next };
}

module.exports = {
  submitAssistantFeedback,
  getAssistantAdminAnalytics,
  reviewAssistantFeedback,
  updateAssistantConfig
};
