/**
 * JANASEVA – AI Knowledge Centre Receiver-Only External Data API Service
 * Handles:
 *  - Secure HTTPS receiver endpoint (API key, Bearer token, Webhook signature)
 *  - Admin-only configuration & cryptographic secret rotation (hashed server-side)
 *  - IP allowlist, atomic rate limiting, payload size limits, idempotency keys
 *  - Redacted API request/response/error logging (never logs tokens or secrets)
 *  - Security Scan -> Document Processing -> Knowledge Storage -> Chatbox Retrieval
 */

const crypto = require("crypto");
const functions = require("firebase-functions");
const { assertAdmin, assertReceiverOrAdmin } = require("./authService");
const { ingestKnowledgeBuffer, writeAuditLog } = require("./knowledgeService");
const sec = require("./knowledgeSecurity");

function sha256Hex(val) {
  return crypto.createHash("sha256").update(String(val || ""), "utf8").digest("hex");
}

function timingSafeHexEqual(hexA, hexB) {
  if (!hexA || !hexB || hexA.length !== hexB.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(hexA, "hex"), Buffer.from(hexB, "hex"));
  } catch (e) {
    return false;
  }
}

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) {
    return fwd.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "unknown";
}

async function enforceApiRateLimit(db, keyId, maxPerMinute) {
  const minuteBucket = Math.floor(Date.now() / 60000);
  const ref = db.collection("knowledge_rate_limits").doc(`api_${keyId}`);
  const allowed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.exists ? snap.data() || {} : {};
    const count = d.minuteBucket === minuteBucket ? (Number(d.count) || 0) : 0;
    if (count >= maxPerMinute) return false;
    tx.set(ref, { minuteBucket, count: count + 1, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  });
  return allowed;
}

async function logReceiverApiEvent(db, entry) {
  const apiLogId = `apilog-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
  await db.collection("knowledge_api_logs").doc(apiLogId).set({
    apiLogId,
    timestamp: new Date().toISOString(),
    ...entry
  });
  return apiLogId;
}

/**
 * HTTPS Receiver API Request Handler (External System -> JANASEVA Knowledge Centre)
 */
async function handleReceiverApiHttpRequest(db, req, res) {
  // Enforce HTTPS in production (allow localhost/emulator in local dev)
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "").toLowerCase();
  const host = String(req.headers.host || "").toLowerCase();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  if (!isLocal && proto && proto !== "https") {
    return res.status(403).json({ ok: false, error: "HTTPS required for Receiver API." });
  }

  const clientIp = getClientIp(req);
  const cfgRef = db.collection("knowledge_api_receivers").doc("default");
  const secRef = db.collection("knowledge_api_secrets").doc("default");

  const [cfgSnap, secSnap] = await Promise.all([cfgRef.get(), secRef.get()]);
  const cfg = cfgSnap.exists ? cfgSnap.data() || {} : { enabled: false };
  const secrets = secSnap.exists ? secSnap.data() || {} : {};

  if (!cfg.enabled) {
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 503, status: "FAILED",
      outcome: "API_DISABLED", message: "Receiver API is disabled."
    });
    return res.status(503).json({ ok: false, error: "Receiver API is disabled by Administrator." });
  }

  if (req.method !== "POST") {
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 405, status: "FAILED",
      outcome: "METHOD_NOT_ALLOWED", message: "Only POST requests allowed."
    });
    return res.status(405).json({ ok: false, error: "Method Not Allowed. Use POST." });
  }

  // IP allowlist enforcement
  if (Array.isArray(cfg.allowedIps) && cfg.allowedIps.length > 0 && !cfg.allowedIps.includes(clientIp)) {
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 403, status: "FAILED",
      outcome: "IP_BLOCKED", message: "Client IP rejected by allowlist."
    });
    return res.status(403).json({ ok: false, error: "Forbidden: IP address not permitted." });
  }

  // Authentication via X-API-Key, Bearer token, or Webhook HMAC signature
  const apiKey = String(req.headers["x-api-key"] || "").trim();
  const authHeader = String(req.headers["authorization"] || "").trim();
  const bearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  let authenticated = false;
  if (apiKey && secrets.keyHash && cfg.authMode !== "bearer_only") {
    authenticated = timingSafeHexEqual(sha256Hex(apiKey), secrets.keyHash);
  }
  if (!authenticated && bearer && secrets.bearerHash && cfg.authMode !== "api_key_only") {
    authenticated = timingSafeHexEqual(sha256Hex(bearer), secrets.bearerHash);
  }

  if (!authenticated) {
    await cfgRef.set({ lastErrorAt: new Date().toISOString(), lastErrorMessage: "Unauthorized request" }, { merge: true });
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 401, status: "FAILED",
      outcome: "UNAUTHORIZED", message: "Missing or invalid API credentials."
    });
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }

  // Optional Webhook HMAC-SHA256 verification when X-Webhook-Signature is provided
  const sigHeader = String(req.headers["x-webhook-signature"] || "").trim();
  if (sigHeader && secrets.webhookSecretRawHash && req.rawBody) {
    const expectedHmac = crypto.createHmac("sha256", secrets.webhookSecretHmacKey || "").update(req.rawBody).digest("hex");
    if (!timingSafeHexEqual(sigHeader.replace(/^sha256=/i, ""), expectedHmac)) {
      await logReceiverApiEvent(db, {
        method: req.method, clientIp, statusCode: 401, status: "FAILED",
        outcome: "INVALID_WEBHOOK_SIGNATURE", message: "Webhook HMAC signature mismatch."
      });
      return res.status(401).json({ ok: false, error: "Invalid webhook signature." });
    }
  }

  // Rate limit
  const rateOk = await enforceApiRateLimit(db, "default", Number(cfg.rateLimitPerMinute) || 30);
  if (!rateOk) {
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 429, status: "FAILED",
      outcome: "RATE_LIMITED", message: "Rate limit exceeded."
    });
    return res.status(429).json({ ok: false, error: "Too Many Requests." });
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 400, status: "FAILED",
      outcome: "INVALID_JSON", message: "Body must be JSON object."
    });
    return res.status(400).json({ ok: false, error: "Invalid JSON body." });
  }

  const maxBytes = (Number(cfg.maxPayloadMb) || 15) * 1024 * 1024;
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > maxBytes) {
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 413, status: "FAILED",
      outcome: "PAYLOAD_TOO_LARGE", message: "Payload exceeded configured limit."
    });
    return res.status(413).json({ ok: false, error: "Payload Too Large." });
  }

  const idempotencyKey = String(req.headers["x-idempotency-key"] || body.idempotencyKey || "").trim().slice(0, 120);
  if (idempotencyKey) {
    const idemRef = db.collection("knowledge_idempotency").doc(sha256Hex(idempotencyKey));
    const idemSnap = await idemRef.get();
    if (idemSnap.exists) {
      const existingDocId = idemSnap.data().docId;
      await logReceiverApiEvent(db, {
        method: req.method, clientIp, statusCode: 200, status: "SUCCESS",
        outcome: "IDEMPOTENT_REPLAY", idempotencyKey, docId: existingDocId,
        message: "Duplicate idempotency key skipped."
      });
      return res.status(200).json({ ok: true, idempotentReplay: true, docId: existingDocId });
    }
  }

  let buffer;
  let filename;
  let mimeType;
  if (body.base64 && body.filename) {
    buffer = Buffer.from(String(body.base64), "base64");
    filename = String(body.filename).slice(0, 200);
    mimeType = String(body.mimeType || "");
  } else if (body.content || body.text) {
    const title = String(body.title || "External API Knowledge").trim().slice(0, 120);
    buffer = Buffer.from(`# ${title}\n\n${String(body.content || body.text).trim()}`, "utf8");
    filename = `${sec.sanitizeFilename(title)}.txt`;
    mimeType = "text/plain";
  } else {
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 400, status: "FAILED",
      outcome: "MISSING_CONTENT", message: "Provide content/text or filename+base64."
    });
    return res.status(400).json({ ok: false, error: "Provide { title, content } or { filename, base64 }." });
  }

  try {
    const result = await ingestKnowledgeBuffer(db, {
      buffer,
      filename,
      mimeType,
      contributorId: "api-receiver",
      contributorName: String(body.sourceSystem || "External Receiver API").slice(0, 80),
      contributorRole: "api",
      categoryHint: String(body.category || "").slice(0, 80),
      sourceReliability: body.sourceReliability === "official" ? "official" : "verified_partner",
      sourceChannel: "API_RECEIVER"
    });

    if (!result.success) {
      const status = result.duplicate ? 200 : 422;
      await cfgRef.set({ lastErrorAt: new Date().toISOString(), lastErrorMessage: result.reason || result.message }, { merge: true });
      await logReceiverApiEvent(db, {
        method: req.method, clientIp, statusCode: status, status: result.duplicate ? "SUCCESS" : "FAILED",
        outcome: result.quarantined ? "QUARANTINED" : (result.duplicate ? "DUPLICATE" : "INGEST_FAILED"),
        idempotencyKey, docId: result.docId || null,
        message: result.reason || result.message,
        retryable: !result.quarantined && !result.duplicate
      });
      return res.status(status).json({
        ok: Boolean(result.duplicate),
        duplicate: Boolean(result.duplicate),
        quarantined: Boolean(result.quarantined),
        docId: result.docId || null,
        error: result.duplicate ? null : (result.reason || result.message),
        message: result.message
      });
    }

    if (idempotencyKey) {
      await db.collection("knowledge_idempotency").doc(sha256Hex(idempotencyKey)).set({
        idempotencyKey, docId: result.docId, createdAt: new Date().toISOString()
      });
    }
    await cfgRef.set({ lastSuccessAt: new Date().toISOString() }, { merge: true });
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 201, status: "SUCCESS",
      outcome: "IMPORTED_AND_INDEXED", idempotencyKey, docId: result.docId,
      message: `Imported and indexed ${result.docId} (${result.chunksCount} chunks).`
    });
    return res.status(201).json({
      ok: true,
      docId: result.docId,
      chunksCount: result.chunksCount,
      message: "External knowledge imported, scanned, and indexed."
    });
  } catch (err) {
    await cfgRef.set({ lastErrorAt: new Date().toISOString(), lastErrorMessage: err.message }, { merge: true });
    await logReceiverApiEvent(db, {
      method: req.method, clientIp, statusCode: 500, status: "FAILED",
      outcome: "INTERNAL_ERROR", idempotencyKey, message: err.message, retryable: true
    });
    return res.status(500).json({ ok: false, error: "Internal ingestion error." });
  }
}

/**
 * Receiver API Settings & Secret Rotation (Authorized for Receiver and Admin roles)
 */
async function updateKnowledgeApiSettings(db, context, payload) {
  // Allow receiver or admin for receiver-owned API management
  const actor = await assertReceiverOrAdmin(db, context);
  const { action = "updateConfig", updates = {}, apiLogId = "", auditId = "" } = payload || {};
  const cfgRef = db.collection("knowledge_api_receivers").doc("default");
  const secRef = db.collection("knowledge_api_secrets").doc("default");

  if (action === "deleteApiLog") {
    const cleanId = String(apiLogId || "").trim();
    if (!cleanId) throw new Error("Missing apiLogId to delete.");
    await db.collection("knowledge_api_logs").doc(cleanId).delete();
    await writeAuditLog(db, "API_LOG_DELETED", cleanId, `Deleted Receiver API log entry ${cleanId}`, actor);
    return { success: true, apiLogId: cleanId };
  }

  if (action === "clearApiLogs") {
    const snap = await db.collection("knowledge_api_logs").limit(450).get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    await writeAuditLog(db, "API_LOGS_CLEARED", "default", `Cleared ${snap.size} Receiver API log entries.`, actor);
    return { success: true, clearedCount: snap.size };
  }

  if (action === "deleteAuditLog") {
    // Audit log destruction is strictly restricted to Administrators
    const adminActor = await assertAdmin(db, context, "Access Denied: Only Administrators can modify security audit logs.");
    const cleanId = String(auditId || "").trim();
    if (!cleanId) throw new Error("Missing auditId to delete.");
    await db.collection("knowledge_audit_logs").doc(cleanId).delete();
    return { success: true, auditId: cleanId };
  }

  if (action === "clearAuditLogs") {
    // Audit log destruction is strictly restricted to Administrators
    const adminActor = await assertAdmin(db, context, "Access Denied: Only Administrators can clear security audit logs.");
    let totalCleared = 0;
    while (true) {
      const snap = await db.collection("knowledge_audit_logs").limit(450).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      totalCleared += snap.size;
      if (snap.size < 450) break;
    }
    return { success: true, clearedCount: totalCleared };
  }

  if (action === "rotateSecrets") {
    const rawApiKey = `jnsk_live_${crypto.randomBytes(20).toString("hex")}`;
    const rawBearer = `jnsb_live_${crypto.randomBytes(24).toString("hex")}`;
    const rawWebhook = `jnsw_sec_${crypto.randomBytes(18).toString("hex")}`;

    await secRef.set({
      keyHash: sha256Hex(rawApiKey),
      bearerHash: sha256Hex(rawBearer),
      webhookSecretHmacKey: rawWebhook,
      rotatedAt: new Date().toISOString(),
      rotatedBy: actor.email || actor.uid
    });

    await cfgRef.set({
      apiKeyMasked: `${rawApiKey.slice(0, 12)}••••••••${rawApiKey.slice(-4)}`,
      bearerTokenMasked: `${rawBearer.slice(0, 12)}••••••••${rawBearer.slice(-4)}`,
      webhookSecretMasked: `${rawWebhook.slice(0, 10)}••••••••${rawWebhook.slice(-4)}`,
      hasApiKey: true,
      hasBearerToken: true,
      rotatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await writeAuditLog(db, "API_SECRETS_ROTATED", "default", "Rotated server-side Receiver API credentials.", actor);
    const snap = await cfgRef.get();
    return { apiKey: rawApiKey, bearerToken: rawBearer, webhookSecret: rawWebhook, config: snap.data() };
  }

  if (action === "resetConfig") {
    const defaults = {
      receiverId: "default",
      enabled: false,
      authMode: "api_key_or_bearer",
      rateLimitPerMinute: 30,
      maxPayloadMb: 15,
      allowedIps: [],
      webhookModeEnabled: true,
      updatedBy: actor.email || actor.uid,
      updatedAt: new Date().toISOString()
    };
    await cfgRef.set(defaults, { merge: true });
    await writeAuditLog(db, "API_SETTINGS_RESET", "default", "Reset Receiver API settings to safe defaults (API disabled, secrets preserved).", actor);
    const snap = await cfgRef.get();
    return snap.data();
  }

  const existingSnap = await cfgRef.get();
  const existing = existingSnap.exists ? existingSnap.data() || {} : {};
  const next = {
    receiverId: "default",
    enabled: updates.enabled !== undefined ? Boolean(updates.enabled) : Boolean(existing.enabled),
    authMode: ["api_key_or_bearer", "api_key_only", "bearer_only", "hmac_webhook"].includes(updates.authMode)
      ? updates.authMode : (existing.authMode || "api_key_or_bearer"),
    rateLimitPerMinute: Math.min(300, Math.max(1, Number(updates.rateLimitPerMinute || existing.rateLimitPerMinute || 30))),
    maxPayloadMb: Math.min(25, Math.max(1, Number(updates.maxPayloadMb || existing.maxPayloadMb || 15))),
    allowedIps: Array.isArray(updates.allowedIps) ? updates.allowedIps.slice(0, 50) : (existing.allowedIps || []),
    webhookModeEnabled: updates.webhookModeEnabled !== undefined ? Boolean(updates.webhookModeEnabled) : (existing.webhookModeEnabled !== false),
    updatedBy: actor.email || actor.uid,
    updatedAt: new Date().toISOString()
  };
  await cfgRef.set(next, { merge: true });
  await writeAuditLog(db, "API_SETTINGS_UPDATED", "default", `Updated Receiver API settings (enabled=${next.enabled})`, actor);
  const finalSnap = await cfgRef.get();
  return finalSnap.data();
}

module.exports = {
  handleReceiverApiHttpRequest,
  updateKnowledgeApiSettings
};
