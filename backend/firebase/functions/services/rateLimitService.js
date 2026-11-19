/**
 * JANASEVA – Server-Side Rate Limiting Service
 * Uses atomic Firestore transactions on assistantRateLimits/{uid} to enforce
 * per-minute and daily quotas and prevent abuse/cost spikes.
 */

const functions = require("firebase-functions");

const DEFAULT_LIMITS = {
  maxPerMinute: 20,
  maxPerDay: 250
};

/**
 * Enforce sliding minute & daily limits for a caller UID.
 */
async function enforceRateLimit(db, uid, scope = "chat", overrides = {}) {
  if (!uid || typeof uid !== "string") {
    throw new functions.https.HttpsError("unauthenticated", "Valid user identity required.");
  }

  const maxPerMinute = Math.max(3, Math.min(120, Number(overrides.maxPerMinute) || DEFAULT_LIMITS.maxPerMinute));
  const maxPerDay = Math.max(10, Math.min(2000, Number(overrides.maxPerDay) || DEFAULT_LIMITS.maxPerDay));

  const nowMs = Date.now();
  const minuteBucket = Math.floor(nowMs / 60000);
  const dayKey = new Date(nowMs).toISOString().slice(0, 10);
  const docId = `${uid}_${scope}`;
  const ref = db.collection("assistantRateLimits").doc(docId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};

    const currentMinuteCount = data.minuteBucket === minuteBucket ? (Number(data.minuteCount) || 0) : 0;
    const currentDayCount = data.dayKey === dayKey ? (Number(data.dayCount) || 0) : 0;

    if (currentMinuteCount >= maxPerMinute) {
      const retryAfterSeconds = Math.max(1, Math.ceil(((minuteBucket + 1) * 60000 - nowMs) / 1000));
      return { allowed: false, reason: "minute_limit", retryAfterSeconds };
    }

    if (currentDayCount >= maxPerDay) {
      return { allowed: false, reason: "daily_limit", retryAfterSeconds: 3600 };
    }

    tx.set(ref, {
      uid,
      scope,
      minuteBucket,
      minuteCount: currentMinuteCount + 1,
      dayKey,
      dayCount: currentDayCount + 1,
      updatedAtMs: nowMs
    }, { merge: true });

    return {
      allowed: true,
      remainingMinute: maxPerMinute - (currentMinuteCount + 1),
      remainingDay: maxPerDay - (currentDayCount + 1)
    };
  });

  if (!result.allowed) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      result.reason === "daily_limit"
        ? "Daily assistant request quota reached. Please try again tomorrow."
        : `Too many requests. Please wait ${result.retryAfterSeconds} seconds before sending another message.`,
      { reason: result.reason, retryAfterSeconds: result.retryAfterSeconds }
    );
  }

  return result;
}

module.exports = {
  DEFAULT_LIMITS,
  enforceRateLimit
};
