/**
 * JANASEVA – Multilingual Language Processing & Typo-Tolerant Normalization Service
 * Strictly supports: English (en-IN), Kannada (kn-IN), Hindi (hi-IN).
 */

const SUPPORTED_LANGS = ["en-IN", "kn-IN", "hi-IN"];

const TYPO_MAP = {
  wter: "water",
  watr: "water",
  waater: "water",
  drnking: "drinking",
  drinkng: "drinking",
  pipline: "pipeline",
  leekage: "leakage",
  lekage: "leakage",
  pothol: "pothole",
  pothols: "potholes",
  potholle: "pothole",
  roadd: "road",
  raod: "road",
  rod: "road",
  streeetlight: "streetlight",
  stretlight: "streetlight",
  streetligh: "streetlight",
  streeet: "street",
  ligh: "light",
  electricty: "electricity",
  elecricity: "electricity",
  garbge: "garbage",
  garbag: "garbage",
  sanitasion: "sanitation",
  sanitatin: "sanitation",
  drinage: "drainage",
  dranage: "drainage",
  guter: "gutter",
  compalint: "complaint",
  complint: "complaint",
  complnt: "complaint",
  complanit: "complaint",
  grievence: "grievance",
  grivance: "grievance",
  trak: "track",
  trck: "track",
  statu: "status",
  staus: "status",
  panchayt: "panchayat",
  panchayth: "panchayat",
  emrgency: "emergency",
  emergncy: "emergency",
  helplin: "helpline",
  certifcate: "certificate",
  certificat: "certificate",
  eswatu: "eswathu",
  eswath: "eswathu",
  katha: "khata",
  offical: "official",
  oficer: "officer",
  timming: "timing",
  timmings: "timings"
};

const STRINGS = {
  unauthenticated: {
    en: "Please sign in to access personal grievance tools and AI chat history.",
    kn: "ವೈಯಕ್ತಿಕ ದೂರು ಸೇವೆಗಳು ಮತ್ತು AI ಚಾಟ್ ಇತಿಹಾಸವನ್ನು ಬಳಸಲು ದಯವಿಟ್ಟು ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    hi: "व्यक्तिगत शिकायत सेवाओं और AI चैट इतिहास का उपयोग करने के लिए कृपया साइन इन करें।"
  },
  rate_limited: {
    en: "You are sending messages too quickly. Please wait a moment and try again.",
    kn: "ನೀವು ತುಂಬಾ ವೇಗವಾಗಿ ಸಂದೇಶಗಳನ್ನು ಕಳುಹಿಸುತ್ತಿದ್ದೀರಿ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    hi: "आप बहुत तेज़ी से संदेश भेज रहे हैं। कृपया थोड़ी देर प्रतीक्षा करें और पुनः प्रयास करें।"
  },
  provider_timeout: {
    en: "The AI service took too long to respond. Please retry in a moment.",
    kn: "AI ಸೇವೆಯಿಂದ ಪ್ರತಿಕ್ರಿಯೆ ಬರಲು ಹೆಚ್ಚು ಸಮಯ ಹಿಡಿಯುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    hi: "AI सेवा से उत्तर मिलने में अधिक समय लग रहा है। कृपया थोड़ी देर बाद पुनः प्रयास करें।"
  },
  provider_error: {
    en: "The external AI service is temporarily unavailable. You can retry or use complaint registration, tracking, and directory shortcuts directly.",
    kn: "ಬಾಹ್ಯ AI ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ನೀವು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಬಹುದು ಅಥವಾ ದೂರು ನೋಂದಣಿ, ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಡೈರೆಕ್ಟರಿ ಸೇವೆಗಳನ್ನು ನೇರವಾಗಿ ಬಳಸಬಹುದು.",
    hi: "बाहरी AI सेवा अस्थायी रूप से अनुपलब्ध है। आप पुनः प्रयास कर सकते हैं या सीधे शिकायत पंजीकरण, ट्रैकिंग और निर्देशिका सेवाओं का उपयोग कर सकते हैं।"
  },
  invalid_message: {
    en: "Please enter a valid message between 1 and 1000 characters.",
    kn: "ದಯವಿಟ್ಟು 1 ರಿಂದ 1000 ಅಕ್ಷರಗಳ ಒಳಗಿನ ಮಾನ್ಯ ಸಂದೇಶವನ್ನು ನಮೂದಿಸಿ.",
    hi: "कृपया 1 से 1000 अक्षरों के बीच एक मान्य संदेश दर्ज करें।"
  },
  unauthorized_complaint: {
    en: "Access Denied: You are only authorized to view complaints registered under your account.",
    kn: "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ದಾಖಲಾದ ದೂರುಗಳನ್ನು ಮಾತ್ರ ವೀಕ್ಷಿಸಲು ನಿಮಗೆ ಅನುಮತಿ ಇದೆ.",
    hi: "प्रवेश अस्वीकृत: आप केवल अपने खाते के अंतर्गत दर्ज शिकायतें ही देख सकते हैं।"
  },
  complaint_not_found: {
    en: "No complaint with that ID was found under your account.",
    kn: "ಆ ಐಡಿಯ ಯಾವುದೇ ದೂರು ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಕಂಡುಬಂದಿಲ್ಲ.",
    hi: "आपके खाते में उस आईडी की कोई शिकायत नहीं मिली।"
  },
  maintenance_active: {
    en: "Complaint submissions are temporarily paused due to scheduled portal maintenance.",
    kn: "ನಿಗದಿತ ಪೋರ್ಟಲ್ ನಿರ್ವಹಣೆಯ ಕಾರಣ ದೂರು ಸಲ್ಲಿಕೆಯನ್ನು ತಾತ್ಕಾಲಿಕವಾಗಿ ತಡೆಹಿಡಿಯಲಾಗಿದೆ.",
    hi: "निर्धारित पोर्टल रखरखाव के कारण शिकायत दर्ज करना अस्थायी रूप से रोका गया है।"
  }
};

function normalizeLang(lang) {
  const val = String(lang || "").trim().toLowerCase();
  if (val === "kn" || val.startsWith("kn-")) return "kn-IN";
  if (val === "hi" || val.startsWith("hi-")) return "hi-IN";
  return "en-IN";
}

function getShortLang(lang) {
  const norm = normalizeLang(lang);
  if (norm === "kn-IN") return "kn";
  if (norm === "hi-IN") return "hi";
  return "en";
}

function detectInputLanguage(text) {
  const s = String(text || "");
  if (/[\u0C80-\u0CFF]/.test(s)) return "kn-IN";
  if (/[\u0900-\u097F]/.test(s)) return "hi-IN";
  return "en-IN";
}

function validateResponseLanguage(text, expectedLang) {
  const shortLang = getShortLang(expectedLang);
  if (!text || shortLang === "en") return true;
  if (shortLang === "kn") return /[\u0C80-\u0CFF]/.test(text);
  if (shortLang === "hi") return /[\u0900-\u097F]/.test(text);
  return true;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  const dp = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[al][bl];
}

/**
 * Normalize text and repair common civic spelling mistakes for reliable intent matching.
 */
function normalizeAndCorrectText(text) {
  const raw = String(text || "").trim();
  const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);
  const keywords = Object.values(TYPO_MAP);

  const corrected = tokens.map((tok) => {
    const clean = tok.replace(/[^a-z0-9\u0C80-\u0CFF\u0900-\u097F-]/g, "");
    if (!clean) return tok;
    if (TYPO_MAP[clean]) return TYPO_MAP[clean];
    if (/^[a-z]{4,14}$/.test(clean)) {
      for (const kw of keywords) {
        if (Math.abs(kw.length - clean.length) <= 1 && levenshtein(clean, kw) === 1) {
          return kw;
        }
      }
    }
    return clean;
  });

  return corrected.join(" ");
}

function getLocalizedString(key, langCode) {
  const shortLang = getShortLang(langCode);
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[shortLang] || entry.en;
}

module.exports = {
  SUPPORTED_LANGS,
  normalizeLang,
  getShortLang,
  detectInputLanguage,
  validateResponseLanguage,
  normalizeAndCorrectText,
  getLocalizedString
};
