/**
 * JANASEVA – Backend Authentication & Authorization Service
 * Enforces identity verification and role checks strictly from server auth tokens
 * and authoritative Firestore user documents (never from client-supplied payloads).
 */

const functions = require("firebase-functions");

const BOOTSTRAP_ADMIN_EMAILS = new Set([
  "admin@janaseva.gov.in",
  "",
  "admin@janaseva.in"
]);

/**
 * Require a verified Firebase Auth caller.
 */
function assertAuthenticated(context, message = "Authentication required.") {
  if (!context || !context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError("unauthenticated", message);
  }
  return context.auth;
}

/**
 * Resolve authoritative caller profile & role from token claims and users/{uid}.
 */
async function getCallerProfile(db, context) {
  const auth = assertAuthenticated(context);
  const uid = auth.uid;
  const token = auth.token || {};
  const tokenEmail = (token.email || "").trim().toLowerCase();
  const emailVerified = token.email_verified === true;

  let role = "citizen";
  let panchayatId = token.panchayatId || token.panchayat || null;
  let name = token.name || (tokenEmail ? tokenEmail.split("@")[0] : "Citizen");
  let phone = token.phone_number || "";
  let email = tokenEmail;

  if (token.admin === true || token.role === "admin") {
    role = "admin";
  } else if (emailVerified && BOOTSTRAP_ADMIN_EMAILS.has(tokenEmail)) {
    role = "admin";
  } else if (token.role === "receiver") {
    role = "receiver";
  }

  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists) {
      const u = userDoc.data() || {};
      if (u.name) name = u.name;
      if (u.email) email = String(u.email).trim().toLowerCase();
      if (u.mobile || u.phone) phone = u.mobile || u.phone;
      if (!panchayatId && u.panchayatId) panchayatId = u.panchayatId;

      if (role !== "admin") {
        if (u.role === "admin") {
          role = "admin";
        } else if (u.role === "receiver" && role !== "admin") {
          role = "receiver";
        }
      }
    }
  } catch (err) {
    console.warn("[JANASEVA AuthService] User profile lookup warning:", err.message);
  }

  return {
    uid,
    email,
    emailVerified,
    name,
    phone,
    role,
    panchayatId: panchayatId || null
  };
}

/**
 * Require Administrator privileges.
 */
async function assertAdmin(db, context, message = "Access Denied: Administrator privileges required.") {
  const profile = await getCallerProfile(db, context);
  if (profile.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", message);
  }
  return profile;
}

/**
 * Require Receiver or Administrator privileges.
 */
async function assertReceiverOrAdmin(db, context) {
  const profile = await getCallerProfile(db, context);
  if (profile.role !== "admin" && profile.role !== "receiver") {
    throw new functions.https.HttpsError("permission-denied", "Access Denied: Gram Panchayat official privileges required.");
  }
  return profile;
}

module.exports = {
  assertAuthenticated,
  getCallerProfile,
  assertAdmin,
  assertReceiverOrAdmin
};
