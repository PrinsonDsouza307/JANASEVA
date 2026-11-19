/**
 * JANASEVA – Attachment Security & Validation Service
 * Enforces extension, MIME type, size bounds, filename safety, and binary magic-byte inspection.
 */

const functions = require("firebase-functions");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (matches storage.rules)
const MAX_PDF_BYTES = 10 * 1024 * 1024;  // 10 MB (matches storage.rules)

const ALLOWED_TYPES = {
  "image/jpeg": { extensions: [".jpg", ".jpeg"], maxBytes: MAX_IMAGE_BYTES, category: "image" },
  "image/jpg": { extensions: [".jpg", ".jpeg"], maxBytes: MAX_IMAGE_BYTES, category: "image" },
  "image/png": { extensions: [".png"], maxBytes: MAX_IMAGE_BYTES, category: "image" },
  "image/webp": { extensions: [".webp"], maxBytes: MAX_IMAGE_BYTES, category: "image" },
  "application/pdf": { extensions: [".pdf"], maxBytes: MAX_PDF_BYTES, category: "pdf" }
};

/**
 * Verify binary file header (magic bytes) to reject spoofed file extensions/MIME types.
 */
function verifyMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;
  const mime = String(mimeType || "").toLowerCase();

  if (mime === "image/jpeg" || mime === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mime === "image/webp") {
    if (buffer.length < 12) return false;
    return (
      buffer.slice(0, 4).toString("ascii") === "RIFF" &&
      buffer.slice(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mime === "application/pdf") {
    return buffer.slice(0, 5).toString("ascii") === "%PDF-";
  }
  return false;
}

/**
 * Produce a safe alphanumeric filename preserving valid extension.
 */
function sanitizeFilename(rawName, expectedExts) {
  const cleaned = String(rawName || "attachment")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_");
  const lower = cleaned.toLowerCase();
  const matchedExt = expectedExts.find((ext) => lower.endsWith(ext));
  const base = matchedExt ? cleaned.slice(0, -matchedExt.length) : cleaned;
  const safeBase = (base.replace(/^\.+|\.+$/g, "").slice(0, 60)) || "evidence";
  const ext = matchedExt || expectedExts[0];
  return `att_${Date.now()}_${safeBase}${ext}`;
}

/**
 * Validate chat attachment metadata and binary signature, returning safe storage path.
 */
function validateChatAttachment(payload, caller) {
  const {
    filename,
    mimeType,
    sizeBytes,
    headerBase64,
    sessionId = "general",
    maxAttachmentSizeMb = null,
    allowImages = true,
    allowPdf = true
  } = payload || {};
  const normalizedMime = String(mimeType || "").trim().toLowerCase();
  const rule = ALLOWED_TYPES[normalizedMime];

  if (!rule) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Unsupported file type. Allowed formats: JPG, PNG, WEBP, and PDF."
    );
  }
  if (rule.category === "image" && allowImages === false) {
    throw new functions.https.HttpsError("permission-denied", "Image upload is disabled in Chat Settings.");
  }
  if (rule.category === "pdf" && allowPdf === false) {
    throw new functions.https.HttpsError("permission-denied", "PDF upload is disabled in Chat Settings.");
  }

  if (typeof filename !== "string" || filename.trim().length === 0 || filename.length > 255) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid attachment filename.");
  }

  const lowerName = filename.trim().toLowerCase();
  const hasValidExt = rule.extensions.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "File extension does not match its declared MIME type."
    );
  }

  const customMaxBytes = Number.isFinite(Number(maxAttachmentSizeMb)) && Number(maxAttachmentSizeMb) >= 1
    ? Math.min(rule.maxBytes, Math.round(Number(maxAttachmentSizeMb) * 1024 * 1024))
    : rule.maxBytes;

  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > customMaxBytes) {
    const maxMb = Math.round(customMaxBytes / (1024 * 1024));
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Attachment size must be between 1 byte and ${maxMb} MB.`
    );
  }

  if (!headerBase64 || typeof headerBase64 !== "string" || headerBase64.length > 4096) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Binary file signature header is required for security validation."
    );
  }

  const buf = Buffer.from(headerBase64, "base64");
  if (!verifyMagicBytes(buf, normalizedMime)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Security check failed: File contents do not match the declared image or PDF format."
    );
  }

  const safeSession = String(sessionId || "general").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "general";
  const safeFileName = sanitizeFilename(filename, rule.extensions);
  const storagePath = `chatAttachments/${caller.uid}/${safeSession}/${safeFileName}`;

  return {
    valid: true,
    category: rule.category,
    mimeType: normalizedMime,
    safeFileName,
    storagePath,
    ocrAnalyzed: false,
    message: "Attachment verified. Supporting evidence will be stored for official Panchayat review."
  };
}

module.exports = {
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  ALLOWED_TYPES,
  verifyMagicBytes,
  sanitizeFilename,
  validateChatAttachment
};
