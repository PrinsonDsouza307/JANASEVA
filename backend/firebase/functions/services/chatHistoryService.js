/**
 * JANASEVA – Persistent Chat History Service
 * Stores citizen conversations strictly under users/{uid}/chatSessions/{sessionId}
 * with pagination, search filtering, and retention caps.
 */

const functions = require("firebase-functions");
const { normalizeLang } = require("./languageService");

const MAX_MESSAGES_PER_SESSION = 100;
const MAX_SESSIONS_PER_USER = 50;

function sanitizeSessionId(sessionId) {
  const clean = String(sessionId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
  if (!clean || clean.length < 4 || clean.length > 80) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid chat session ID.");
  }
  return clean;
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-MAX_MESSAGES_PER_SESSION).map((m) => ({
    id: String(m.id || "").slice(0, 64),
    sender: m.sender === "user" ? "user" : "assistant",
    text: String(m.text || "").slice(0, 4000),
    lang: normalizeLang(m.lang || "en-IN"),
    timestampIso: typeof m.timestampIso === "string" ? m.timestampIso.slice(0, 50) : new Date().toISOString(),
    isWelcome: Boolean(m.isWelcome),
    status: ["sending", "sent", "failed"].includes(m.status) ? m.status : "sent",
    meta: m.meta && typeof m.meta === "object"
      ? {
          complaintId: m.meta.complaintId ? String(m.meta.complaintId).slice(0, 50) : null,
          isEmergency: Boolean(m.meta.isEmergency),
          attachments: Array.isArray(m.meta.attachments)
            ? m.meta.attachments.slice(0, 5).map((a) => ({
                name: String(a.name || "").slice(0, 120),
                type: String(a.type || "").slice(0, 60),
                size: Number(a.size) || 0
              }))
            : []
        }
      : null
  }));
}

async function saveChatSession(db, caller, payload) {
  const sessionId = sanitizeSessionId(payload?.sessionId);
  const title = String(payload?.title || "New Conversation").trim().slice(0, 140) || "New Conversation";
  const language = normalizeLang(payload?.language || "en-IN");
  const messages = sanitizeMessages(payload?.messages);
  const conversationStatus = ["active", "archived", "completed"].includes(payload?.conversationStatus)
    ? payload.conversationStatus
    : "active";

  const nowIso = new Date().toISOString();
  const colRef = db.collection("users").doc(caller.uid).collection("chatSessions");
  const docRef = colRef.doc(sessionId);
  const existing = await docRef.get();

  const record = {
    sessionId,
    userId: caller.uid,
    title,
    language,
    messages,
    messageCount: messages.length,
    conversationStatus,
    createdAt: existing.exists && existing.data()?.createdAt ? existing.data().createdAt : nowIso,
    updatedAt: nowIso
  };

  await docRef.set(record, { merge: true });

  // Enforce retention cap (prune oldest sessions beyond MAX_SESSIONS_PER_USER)
  try {
    const allSnap = await colRef.orderBy("updatedAt", "desc").limit(MAX_SESSIONS_PER_USER + 10).get();
    if (allSnap.size > MAX_SESSIONS_PER_USER) {
      const batch = db.batch();
      allSnap.docs.slice(MAX_SESSIONS_PER_USER).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (pruneErr) {
    console.warn("[JANASEVA ChatHistory] Prune notice:", pruneErr.message);
  }

  return { success: true, session: record };
}

async function listChatSessions(db, caller, { limit = 15, cursorUpdatedAt = null, search = "" } = {}) {
  const safeLimit = Math.min(30, Math.max(1, Number(limit) || 15));
  const colRef = db.collection("users").doc(caller.uid).collection("chatSessions");
  let query = colRef.orderBy("updatedAt", "desc");
  if (cursorUpdatedAt && typeof cursorUpdatedAt === "string") {
    query = query.startAfter(cursorUpdatedAt);
  }
  const snap = await query.limit(search ? 50 : safeLimit + 1).get();
  let items = snap.docs.map((d) => d.data());

  if (search && typeof search === "string") {
    const q = search.trim().toLowerCase();
    items = items.filter((s) => {
      const inTitle = (s.title || "").toLowerCase().includes(q);
      const inMsgs = Array.isArray(s.messages) && s.messages.some((m) => (m.text || "").toLowerCase().includes(q));
      return inTitle || inMsgs;
    });
  }

  const hasMore = items.length > safeLimit;
  const page = items.slice(0, safeLimit).map((s) => ({
    sessionId: s.sessionId,
    title: s.title,
    language: s.language,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    messageCount: Array.isArray(s.messages) ? s.messages.length : (s.messageCount || 0),
    conversationStatus: s.conversationStatus || "active",
    preview: Array.isArray(s.messages) && s.messages.length ? String(s.messages[s.messages.length - 1].text || "").slice(0, 120) : ""
  }));

  return {
    sessions: page,
    hasMore,
    nextCursor: hasMore && page.length ? page[page.length - 1].updatedAt : null
  };
}

async function getChatSession(db, caller, sessionId) {
  const cleanId = sanitizeSessionId(sessionId);
  const snap = await db.collection("users").doc(caller.uid).collection("chatSessions").doc(cleanId).get();
  if (!snap.exists) {
    throw new functions.https.HttpsError("not-found", "Chat session not found.");
  }
  return snap.data();
}

async function renameChatSession(db, caller, sessionId, title) {
  const cleanId = sanitizeSessionId(sessionId);
  const cleanTitle = String(title || "").trim().slice(0, 140);
  if (!cleanTitle) {
    throw new functions.https.HttpsError("invalid-argument", "Conversation title cannot be empty.");
  }
  const ref = db.collection("users").doc(caller.uid).collection("chatSessions").doc(cleanId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError("not-found", "Chat session not found.");
  }
  const data = snap.data() || {};
  if (data.userId && data.userId !== caller.uid) {
    throw new functions.https.HttpsError("permission-denied", "Access Denied: You may only rename your own conversations.");
  }
  const updatedAt = new Date().toISOString();
  await ref.set({ title: cleanTitle, updatedAt }, { merge: true });
  return { success: true, sessionId: cleanId, title: cleanTitle, updatedAt };
}

async function deleteChatSession(db, caller, sessionId) {
  const cleanId = sanitizeSessionId(sessionId);
  const ref = db.collection("users").doc(caller.uid).collection("chatSessions").doc(cleanId);
  await ref.delete();
  return { success: true, deletedSessionId: cleanId };
}

async function clearAllChatSessions(db, caller) {
  const colRef = db.collection("users").doc(caller.uid).collection("chatSessions");
  let deleted = 0;
  let snap = await colRef.limit(100).get();
  while (!snap.empty) {
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
    snap = await colRef.limit(100).get();
  }
  return { success: true, deletedCount: deleted };
}

module.exports = {
  MAX_MESSAGES_PER_SESSION,
  MAX_SESSIONS_PER_USER,
  saveChatSession,
  listChatSessions,
  getChatSession,
  renameChatSession,
  deleteChatSession,
  clearAllChatSessions
};
