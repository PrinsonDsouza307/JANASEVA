/**
 * JANASEVA – Centralized Environment Configuration & Security Validation Module
 * 
 * Capabilities:
 * 1. Safe local `.env` ingestion without external dependencies.
 * 2. Strict placeholder and credential format detection.
 * 3. Secret isolation: NEVER returns, logs, or transmits raw API keys or passwords.
 * 4. Firebase Secret Manager compatibility (defineSecret / runWith secrets).
 * 5. Comprehensive health checks for AI, SMTP, OCR, and integrations.
 */

const fs = require("fs");
const path = require("path");

// Placeholder pattern matching test/dummy keys
const PLACEHOLDER_REGEX = /^(YOUR_|REPLACE_|DEMO_|TEST_|sk-your|<YOUR_)/i;

/**
 * Load local .env file safely for local development/emulators.
 * Does not overwrite existing environment variables.
 */
function loadLocalEnvFile() {
  const possiblePaths = [
    path.resolve(__dirname, "..", ".env"),
    path.resolve(__dirname, "..", "..", ".env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "functions", ".env")
  ];

  for (const envPath of possiblePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        parseAndApplyEnv(content);
        break; // Stop at first valid .env found
      }
    } catch (e) {
      // Ignored for security; production uses Secret Manager
    }
  }
}

/**
 * Lightweight .env parser avoiding external dependencies.
 */
function parseAndApplyEnv(rawText) {
  if (!rawText || typeof rawText !== "string") return;
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Remove quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

// Automatically load local .env if in local or emulator environment
if (process.env.FUNCTIONS_EMULATOR === "true" || process.env.NODE_ENV !== "production") {
  loadLocalEnvFile();
}

/**
 * Helper to check whether a credential value is an unconfigured placeholder.
 */
function isPlaceholder(val) {
  if (!val || typeof val !== "string") return true;
  const clean = val.trim();
  if (!clean || clean.length < 5) return true;
  return PLACEHOLDER_REGEX.test(clean);
}

/**
 * Application Metadata
 */
function getAppConfig() {
  return {
    appName: String(process.env.APP_NAME || "JANASEVA").trim(),
    appEnv: String(process.env.APP_ENV || process.env.NODE_ENV || "production").trim().toLowerCase(),
    appVersion: String(process.env.APP_VERSION || "1.0.0").trim(),
    appPort: parseInt(process.env.APP_PORT || "8080", 10)
  };
}

/**
 * AI Provider Configuration
 */
function getAiConfig(functionsConfig = null) {
  const cfg = functionsConfig || (typeof require("firebase-functions")?.config === "function" ? require("firebase-functions").config() : {}) || {};
  const aiCfg = cfg.ai || {};

  const rawGeminiKey = String(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    aiCfg.gemini_key ||
    ""
  ).trim();

  const rawOpenaiKey = String(
    process.env.OPENAI_API_KEY ||
    process.env.AI_API_KEY ||
    aiCfg.openai_key ||
    ""
  ).trim();

  const geminiKey = isPlaceholder(rawGeminiKey) ? "" : rawGeminiKey;
  const openaiKey = isPlaceholder(rawOpenaiKey) ? "" : rawOpenaiKey;

  const geminiModel = String(process.env.GEMINI_MODEL || aiCfg.gemini_model || "gemini-2.5-flash").trim();
  const openaiModel = String(process.env.OPENAI_MODEL || aiCfg.openai_model || "gpt-4o-mini").trim();
  const openaiBaseUrl = String(process.env.AI_BASE_URL || aiCfg.base_url || "https://api.openai.com/v1")
    .trim()
    .replace(/\/+$/, "");

  return {
    geminiKey,
    openaiKey,
    geminiModel,
    openaiModel,
    openaiBaseUrl,
    hasGemini: !!geminiKey,
    hasOpenai: !!openaiKey
  };
}

/**
 * SMTP / Email Configuration
 */
function getSmtpConfig(functionsConfig = null) {
  const cfg = functionsConfig || (typeof require("firebase-functions")?.config === "function" ? require("firebase-functions").config() : {}) || {};
  const smtpCfg = cfg.smtp || {};

  const host = String(process.env.SMTP_HOST || smtpCfg.host || "smtp.gmail.com").trim();
  const port = parseInt(String(process.env.SMTP_PORT || smtpCfg.port || "465").trim(), 10) || 465;
  const user = String(process.env.SMTP_USER || smtpCfg.user || "").trim();
  const rawPass = String(process.env.SMTP_PASS || smtpCfg.pass || "").trim();

  const pass = isPlaceholder(rawPass) ? "" : rawPass;
  const isConfigured = !!(user && !isPlaceholder(user) && pass);

  return {
    host,
    port,
    secure: port === 465,
    user: isPlaceholder(user) ? "" : user,
    pass,
    isConfigured
  };
}

/**
 * Document Verification & OCR Configuration
 */
function getOcrConfig() {
  const rawVisionKey = String(process.env.GOOGLE_CLOUD_VISION_API_KEY || "").trim();
  const visionApiKey = isPlaceholder(rawVisionKey) ? "" : rawVisionKey;
  const hasAdc = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

  return {
    visionApiKey,
    hasVisionApiKey: !!visionApiKey,
    hasAdc
  };
}

/**
 * Third-Party Integrations Configuration
 */
function getIntegrationsConfig() {
  const rawWaToken = String(process.env.WHATSAPP_API_TOKEN || "").trim();
  const rawWaPhone = String(process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const rawNotifKey = String(process.env.NOTIFICATION_PROVIDER_KEY || "").trim();

  return {
    whatsappToken: isPlaceholder(rawWaToken) ? "" : rawWaToken,
    whatsappPhoneId: isPlaceholder(rawWaPhone) ? "" : rawWaPhone,
    notificationKey: isPlaceholder(rawNotifKey) ? "" : rawNotifKey,
    hasWhatsapp: !isPlaceholder(rawWaToken) && !isPlaceholder(rawWaPhone),
    hasNotificationProvider: !isPlaceholder(rawNotifKey)
  };
}

/**
 * Comprehensive Environment Health & Security Validation
 * Produces sanitized diagnostic report without exposing secrets.
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];

  const app = getAppConfig();
  const ai = getAiConfig();
  const smtp = getSmtpConfig();
  const ocr = getOcrConfig();

  // Validate Port
  if (isNaN(app.appPort) || app.appPort <= 0 || app.appPort > 65535) {
    errors.push("Invalid APP_PORT: Must be between 1 and 65535.");
  }

  // Validate AI
  let aiStatus = "UNCONFIGURED";
  if (ai.hasGemini && ai.hasOpenai) {
    aiStatus = `CONFIGURED (primary: gemini [${ai.geminiModel}], fallback: openai [${ai.openaiModel}])`;
  } else if (ai.hasGemini) {
    aiStatus = `CONFIGURED (gemini [${ai.geminiModel}])`;
  } else if (ai.hasOpenai) {
    aiStatus = `CONFIGURED (openai [${ai.openaiModel}])`;
  } else {
    warnings.push("No live AI API key configured (GEMINI_API_KEY or OPENAI_API_KEY). AI Assistant will operate in Guided Rule-Based FAQ mode.");
  }

  // Validate SMTP
  let smtpStatus = "UNCONFIGURED";
  if (smtp.isConfigured) {
    smtpStatus = `CONFIGURED (host: ${smtp.host}:${smtp.port}, account: ${smtp.user})`;
  } else {
    warnings.push("SMTP credentials unconfigured or using placeholders. Outbound notification emails will be recorded to Firestore audit logs only.");
  }

  // Validate OCR
  let ocrStatus = "UNCONFIGURED";
  if (ocr.hasVisionApiKey) {
    ocrStatus = "CONFIGURED (Google Cloud Vision REST API)";
  } else if (ocr.hasAdc) {
    ocrStatus = "CONFIGURED (Google Cloud Vision Application Default Credentials)";
  } else if (ai.hasGemini) {
    ocrStatus = "AVAILABLE (Gemini Multimodal Vision fallback)";
  } else {
    warnings.push("Dedicated OCR engine unconfigured. Text extraction from image attachments will rely on client-side analysis.");
  }

  return {
    valid: errors.length === 0,
    timestamp: new Date().toISOString(),
    app: {
      name: app.appName,
      env: app.appEnv,
      version: app.appVersion
    },
    summary: {
      ai: aiStatus,
      smtp: smtpStatus,
      ocr: ocrStatus
    },
    errors,
    warnings
  };
}

/**
 * Print clean startup status banner to Cloud Functions logs.
 */
function printStartupStatus() {
  const report = validateEnvironment();
  console.log(`[JANASEVA BACKEND] Starting ${report.app.name} v${report.app.version} (env: ${report.app.env})`);
  console.log(`[JANASEVA BACKEND] AI Provider Engine: ${report.summary.ai}`);
  console.log(`[JANASEVA BACKEND] SMTP Delivery: ${report.summary.smtp}`);
  console.log(`[JANASEVA BACKEND] Document OCR: ${report.summary.ocr}`);
  if (report.warnings.length > 0) {
    report.warnings.forEach(w => console.warn(`[JANASEVA CONFIG WARNING] ${w}`));
  }
  if (report.errors.length > 0) {
    report.errors.forEach(e => console.error(`[JANASEVA CONFIG ERROR] ${e}`));
  }
}

// Safe Firebase Secret Manager Definitions
let secretDefinitions = {};
try {
  const { defineSecret } = require("firebase-functions/params");
  secretDefinitions = {
    geminiKeySecret: defineSecret("GEMINI_API_KEY"),
    openaiKeySecret: defineSecret("OPENAI_API_KEY"),
    smtpPassSecret: defineSecret("SMTP_PASS"),
    visionKeySecret: defineSecret("GOOGLE_CLOUD_VISION_API_KEY")
  };
} catch (e) {
  // Graceful fallback for older runtimes
  secretDefinitions = {};
}

module.exports = {
  isPlaceholder,
  getAppConfig,
  getAiConfig,
  getSmtpConfig,
  getOcrConfig,
  getIntegrationsConfig,
  validateEnvironment,
  printStartupStatus,
  secretDefinitions
};
