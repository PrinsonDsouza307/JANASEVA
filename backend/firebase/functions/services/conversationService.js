/**
 * JANASEVA – Conversational AI Orchestration & Memory Service
 * Handles multi-turn dialogue context, intent/slot extraction, verified Panchayat/complaint
 * context injection, external LLM invocation (if configured), and truthful guided fallback.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { enforceRateLimit } = require("./rateLimitService");
const {
  normalizeLang,
  getShortLang,
  detectInputLanguage,
  normalizeAndCorrectText,
  getLocalizedString
} = require("./languageService");
const { generateAIResponse, getProviderStatus, getAssistantRuntimeConfig } = require("./aiProviderService");
const { getVerifiedPanchayats, classifyComplaintLogic } = require("./complaintService");
const { trackSingleComplaint, listAuthorizedComplaints } = require("./trackingService");
const { queryKnowledgeBaseServer } = require("./knowledgeService");
const { sanitizeUntrustedSnippet } = require("./knowledgeSecurity");

const EMERGENCY_CONTACTS = [
  { label: { en: "Police / All-in-One Disaster", kn: "ಪೊಲೀಸ್ / ತುರ್ತು ಸಹಾಯವಾಣಿ", hi: "पुलिस / आपातकालीन सहायता" }, number: "112" },
  { label: { en: "Ambulance & Medical Emergency", kn: "ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ಆರೋಗ್ಯ ತುರ್ತು", hi: "एम्बुलेंस और चिकित्सा सहायता" }, number: "108" },
  { label: { en: "Live Electric Wire / MESCOM-BESCOM", kn: "ವಿದ್ಯುತ್ ತಂತಿ / ಮೆಸ್ಕಾಂ-ಬೆಸ್ಕಾಂ", hi: "बिजली का तार / विद्युत आपात" }, number: "1912" },
  { label: { en: "Fire & Rescue Services", kn: "ಅಗ್ನಿಶಾಮಕ ದಳ", hi: "अग्निशमन सेवा" }, number: "101" }
];

const CATEGORY_DEFINITIONS = [
  {
    value: "Water Supply",
    labels: { en: "Water Supply", kn: "ನೀರು ಸರಬರಾಜು", hi: "पेयजल आपूर्ति" },
    defaultSubject: {
      en: "Drinking water supply disruption / pipeline issue",
      kn: "ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು ಅಥವಾ ಪೈಪ್‌ಲೈನ್ ಸಮಸ್ಯೆ",
      hi: "पेयजल आपूर्ति बाधा या पाइपलाइन समस्या"
    },
    keywords: ["water", "drinking", "pipe", "pipeline", "leak", "leakage", "borewell", "tap", "pump", "ನೀರು", "ಕುಡಿಯುವ", "ಪೈಪ್", "ನಳ", "पानी", "नल", "पाइप"]
  },
  {
    value: "Road Damage",
    labels: { en: "Road Damage", kn: "ರಸ್ತೆ ಹಾನಿ", hi: "सड़क क्षति" },
    defaultSubject: {
      en: "Road damage / pothole repair required",
      kn: "ರಸ್ತೆ ಹಾನಿ / ಗುಂಡಿ ದುರಸ್ತಿ ಅಗತ್ಯ",
      hi: "सड़क क्षति / गड्ढों की मरम्मत आवश्यक"
    },
    keywords: ["road", "pothole", "potholes", "bridge", "culvert", "tar", "asphalt", "street", "ರಸ್ತೆ", "ಗುಂಡಿ", "ಸೇತುವೆ", "सड़क", "गड्ढा", "पुल"]
  },
  {
    value: "Streetlight Problems",
    labels: { en: "Streetlight Problems", kn: "ಬೀದಿದೀಪದ ಸಮಸ್ಯೆ", hi: "स्ट्रीट लाइट समस्या" },
    defaultSubject: {
      en: "Streetlights not working / repair required",
      kn: "ಬೀದಿದೀಪ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿಲ್ಲ / ದುರಸ್ತಿ ಅಗತ್ಯ",
      hi: "स्ट्रीट लाइट खराब / मरम्मत आवश्यक"
    },
    keywords: ["streetlight", "streetlights", "light", "lights", "lamp", "pole", "bulb", "dark", "darkness", "ಬೀದಿದೀಪ", "ದೀಪ", "ಕತ್ತಲೆ", "ಕಂಬ", "स्ट्रीट", "लाइट", "बत्ती", "अंधेरा"]
  },
  {
    value: "Garbage and Cleanliness",
    labels: { en: "Garbage and Cleanliness", kn: "ಕಸ ಮತ್ತು ಸ್ವಚ್ಛತೆ", hi: "कचरा और स्वच्छता" },
    defaultSubject: {
      en: "Garbage collection / cleanliness issue",
      kn: "ಕಸ ವಿಲೇವಾರಿ ಮತ್ತು ಸ್ವಚ್ಛತೆ ಸಮಸ್ಯೆ",
      hi: "कचरा संग्रहण और स्वच्छता समस्या"
    },
    keywords: ["garbage", "waste", "trash", "cleanliness", "dump", "smell", "litter", "ಕಸ", "ಸ್ವಚ್ಛತೆ", "ದುರ್ವಾಸನೆ", "कचरा", "सफाई", "गंदगी"]
  },
  {
    value: "Drainage and Sanitation",
    labels: { en: "Drainage and Sanitation", kn: "ಒಳಚರಂಡಿ ಮತ್ತು ನೈರ್ಮಲ್ಯ", hi: "जल निकासी और स्वच्छता" },
    defaultSubject: {
      en: "Blocked drain / sanitation repair needed",
      kn: "ಚರಂಡಿ ತಡೆ / ನೈರ್ಮಲ್ಯ ದುರಸ್ತಿ ಅಗತ್ಯ",
      hi: "नाली जाम / जल निकासी समस्या"
    },
    keywords: ["drain", "drainage", "gutter", "sanitation", "sewage", "manhole", "mosquito", "ಚರಂಡಿ", "ಒಳಚರಂಡಿ", "ನೈರ್ಮಲ್ಯ", "ಸೊಳ್ಳೆ", "नाली", "जल निकासी", "सीवर"]
  },
  {
    value: "Public Facilities",
    labels: { en: "Public Facilities", kn: "ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯಗಳು", hi: "सार्वजनिक सुविधाएं" },
    defaultSubject: {
      en: "Public facility / community infrastructure issue",
      kn: "ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯ ದುರಸ್ತಿ ಸಮಸ್ಯೆ",
      hi: "सार्वजनिक सुविधा मरम्मत समस्या"
    },
    keywords: ["school", "anganwadi", "bus stop", "park", "hall", "toilet", "public", "hospital", "ಶಾಲೆ", "ಅಂಗನವಾಡಿ", "ಶೌಚಾಲಯ", "ಬಸ್", "स्कूल", "आंगनवाड़ी", "शौचालय"]
  },
  {
    value: "Other Civic Issues",
    labels: { en: "Other Civic Issues", kn: "ಇತರ ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳು", hi: "अन्य नागरिक समस्याएं" },
    defaultSubject: {
      en: "Civic grievance reported to Gram Panchayat",
      kn: "ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗೆ ನಾಗರಿಕ ದೂರು",
      hi: "ग्राम पंचायत को नागरिक शिकायत"
    },
    keywords: ["civic", "issue", "problem", "complaint", "grievance", "ದೂರು", "ಸಮಸ್ಯೆ", "शिकायत", "समस्या"]
  }
];

function detectCategoryFromText(normalizedText) {
  const lower = String(normalizedText || "").toLowerCase();
  for (const cat of CATEGORY_DEFINITIONS) {
    if (cat.value === "Other Civic Issues") continue;
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return cat;
    }
  }
  return null;
}

function matchPanchayatFromText(rawText, panchayats) {
  const lower = String(rawText || "").toLowerCase();
  for (const gp of panchayats) {
    const gpName = String(gp.name || "").toLowerCase();
    const shortName = gpName.replace(/\s*gram\s*panchayat\s*/gi, "").trim();
    if (shortName && shortName.length >= 3 && lower.includes(shortName)) {
      return gp;
    }
    if (gp.panchayatId && lower.includes(gp.panchayatId.toLowerCase())) {
      return gp;
    }
  }
  return null;
}

function extractLocationPhrase(rawText) {
  const s = String(rawText || "").trim();
  const match = s.match(/(?:\bnear\b|\bat\b|\bin\b|\bopposite\b|\bbeside\b|\bvillage\b|\bward\b|\bcross\b)\s+([^,.!?\n]{3,90})/i);
  if (match && match[0]) {
    return match[0].trim();
  }
  if (/[\u0C80-\u0CFF]/.test(s) && /(ಗ್ರಾಮ|ಬಳಿ|ಹತ್ತಿರ|ವಾರ್ಡ್|ಬಸ್|ಶಾಲೆ|ರಸ್ತೆ)/.test(s) && s.length <= 120) {
    return s;
  }
  if (/[\u0900-\u097F]/.test(s) && /(गाँव|पास|निकट|वार्ड|बस|स्कूल|मोहल्ला)/.test(s) && s.length <= 120) {
    return s;
  }
  return "";
}

function getCategoryLabel(catValue, langCode) {
  const sLang = getShortLang(langCode);
  const found = CATEGORY_DEFINITIONS.find((c) => c.value.toLowerCase() === String(catValue || "").toLowerCase());
  return found ? (found.labels[sLang] || found.labels.en) : (catValue || "Other Civic Issues");
}

function getDefaultSubject(catValue, langCode) {
  const sLang = getShortLang(langCode);
  const found = CATEGORY_DEFINITIONS.find((c) => c.value.toLowerCase() === String(catValue || "").toLowerCase());
  return found ? (found.defaultSubject[sLang] || found.defaultSubject.en) : "Gram Panchayat Civic Grievance";
}

function buildSuggestedQuestions(intent, langCode) {
  const sLang = getShortLang(langCode);
  const bank = {
    emergency: {
      en: ["Show Panchayat emergency contacts", "Report an urgent hazard ticket", "Open Panchayat Directory"],
      kn: ["ಪಂಚಾಯತ್ ತುರ್ತು ಸಂಪರ್ಕ ತೋರಿಸಿ", "ತುರ್ತು ಅಪಾಯದ ದೂರು ದಾಖಲಿಸಿ", "ಪಂಚಾಯತ್ ಡೈರೆಕ್ಟರಿ ತೆರೆಯಿರಿ"],
      hi: ["पंचायत आपातकालीन संपर्क दिखाएं", "तत्काल खतरा शिकायत दर्ज करें", "पंचायत निर्देशिका खोलें"]
    },
    tracking: {
      en: ["Check my complaint history", "How long does resolution take?", "Contact my Panchayat official"],
      kn: ["ನನ್ನ ದೂರು ಇತಿಹಾಸ ನೋಡಿ", "ಪರಿಹಾರಕ್ಕೆ ಎಷ್ಟು ಸಮಯ ಬೇಕು?", "ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ"],
      hi: ["मेरा शिकायत इतिहास देखें", "समाधान में कितना समय लगता है?", "पंचायत अधिकारी से संपर्क करें"]
    },
    filing: {
      en: ["Attach supporting evidence", "Submit via full form", "Cancel complaint draft"],
      kn: ["ಪೂರಕ ದಾಖಲೆ ಲಗತ್ತಿಸಿ", "ಪೂರ್ಣ ಫಾರ್ಮ್ ಮೂಲಕ ಸಲ್ಲಿಸಿ", "ದೂರು ಕರಡು ರದ್ದುಮಾಡಿ"],
      hi: ["सहायक प्रमाण संलग्न करें", "पूरे फॉर्म से दर्ज करें", "शिकायत ड्राफ्ट रद्द करें"]
    },
    general: {
      en: ["Register a complaint", "Track my complaint", "Gram Panchayat timings & services", "Contact Panchayat officials"],
      kn: ["ದೂರು ದಾಖಲಿಸಿ", "ನನ್ನ ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ", "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸಮಯ ಮತ್ತು ಸೇವೆಗಳು", "ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ"],
      hi: ["शिकायत दर्ज करें", "मेरी शिकायत ट्रैक करें", "ग्राम पंचायत समय और सेवाएं", "पंचायत अधिकारियों से संपर्क करें"]
    }
  };
  return (bank[intent] || bank.general)[sLang] || bank.general.en;
}

function buildGuidedFaqReply(key, langCode) {
  const sLang = getShortLang(langCode);
  const faq = {
    timings: {
      en: "Gram Panchayat offices are open Monday to Saturday, 10:00 AM – 5:30 PM (closed on Sundays & Government Holidays). You can register or track complaints 24/7 on JANASEVA.",
      kn: "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಚೇರಿಗಳು ಸೋಮವಾರದಿಂದ ಶನಿವಾರದವರೆಗೆ ಬೆಳಿಗ್ಗೆ 10:00 ರಿಂದ ಸಂಜೆ 5:30 ರವರೆಗೆ ತೆರೆದಿರುತ್ತವೆ (ಭಾನುವಾರ ಮತ್ತು ಸರ್ಕಾರಿ ರಜೆಗಳಲ್ಲಿ ಬಂದ್). ಜನಸೇವಾ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ 24/7 ದೂರು ಸಲ್ಲಿಸಬಹುದು.",
      hi: "ग्राम पंचायत कार्यालय सोमवार से शनिवार सुबह 10:00 बजे से शाम 5:30 बजे तक खुले रहते हैं (रविवार और सरकारी अवकाश बंद)। जनसेवा पोर्टल पर 24/7 शिकायत दर्ज और ट्रैक की जा सकती है।"
    },
    eswathu: {
      en: "For e-Swathu (Form 9 & Form 11), property tax payment, or Khata mutation, visit your Gram Panchayat Bapuji Seva Kendra with property deed, latest tax receipt, and Aadhaar ID.",
      kn: "ಇ-ಸ್ವತ್ತು (ನಮೂನೆ 9 ಮತ್ತು 11), ಆಸ್ತಿ ತೆರಿಗೆ ಪಾವತಿ ಅಥವಾ ಖಾತಾ ಬದಲಾವಣೆಗಾಗಿ ಆಸ್ತಿ ದಾಖಲೆ, ತೆರಿಗೆ ರಸೀದಿ ಮತ್ತು ಆಧಾರ್ ಕಾರ್ಡ್‌ನೊಂದಿಗೆ ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಬಾಪೂಜಿ ಸೇವಾ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.",
      hi: "ई-स्वथु (फॉर्म 9 और 11), संपत्ति कर या खाता नामांतरण के लिए संपत्ति दस्तावेज़, पिछली कर रसीद और आधार के साथ अपनी ग्राम पंचायत के बापूजी सेवा केंद्र जाएं।"
    },
    certificates: {
      en: "Birth & Death events must be reported within 21 days at your Gram Panchayat office. Certified copies are issued via the Gram Panchayat / Karnataka e-JanMa portal.",
      kn: "ಜನನ ಮತ್ತು ಮರಣಗಳನ್ನು 21 ದಿನಗಳೊಳಗೆ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಬೇಕು. ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಚೇರಿ ಅಥವಾ ಕರ್ನಾಟಕ ಇ-ಜನ್ಮ ಪೋರ್ಟಲ್ ಮೂಲಕ ಪಡೆಯಬಹುದು.",
      hi: "जन्म और मृत्यु की सूचना 21 दिनों के भीतर ग्राम पंचायत में दर्ज कराना आवश्यक है। प्रमाणपत्र पंचायत कार्यालय या ई-जन्म पोर्टल से प्राप्त किए जा सकते हैं।"
    },
    services: {
      en: "Gram Panchayat services include: (1) Civic Grievance Redressal (Water, Roads, Streetlights, Sanitation), (2) e-Swathu Form 9/11 & Property Tax, (3) Birth & Death Certificates (e-JanMa), (4) Drinking Water Connections, and (5) Trade/Building NOCs via Bapuji Seva Kendra.",
      kn: "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸೇವೆಗಳು: (1) ಕುಂದುಕೊರತೆ ಪರಿಹಾರ (ನೀರು, ರಸ್ತೆ, ಬೀದಿದೀಪ, ಸ್ವಚ್ಛತೆ), (2) ಇ-ಸ್ವತ್ತು ನಮೂನೆ 9/11 ಮತ್ತು ಆಸ್ತಿ ತೆರಿಗೆ, (3) ಜನನ/ಮರಣ ಪ್ರಮಾಣಪತ್ರ (ಇ-ಜನ್ಮ), (4) ಕುಡಿಯುವ ನೀರಿನ ಸಂಪರ್ಕ, ಮತ್ತು (5) ಬಾಪೂಜಿ ಸೇವಾ ಕೇಂದ್ರ ಸೇವೆಗಳು.",
      hi: "ग्राम पंचायत सेवाएं: (1) नागरिक शिकायत निवारण (जल, सड़क, स्ट्रीटलाइट, स्वच्छता), (2) ई-स्वथु फॉर्म 9/11 व संपत्ति कर, (3) जन्म/मृत्यु प्रमाणपत्र (ई-जन्म), (4) पेयजल कनेक्शन, और (5) बापूजी सेवा केंद्र सेवाएं।"
    },
    documents: {
      en: "You can attach JPG, PNG, WEBP images (up to 5 MB) or PDF files (up to 10 MB) using the paperclip or camera icon right in the chat box. Note: Automated OCR text extraction only runs when Cloud Vision OCR is configured on the server; otherwise attachments are securely stored for Panchayat official review.",
      kn: "ನೀವು ಚಾಟ್ ಬಾಕ್ಸ್‌ನಲ್ಲಿರುವ ಪೇಪರ್‌ಕ್ಲಿಪ್ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಬಟನ್ ಬಳಸಿ JPG, PNG, WEBP ಚಿತ್ರಗಳು (5 MB ವರೆಗೆ) ಅಥವಾ PDF (10 MB ವರೆಗೆ) ಲಗತ್ತಿಸಬಹುದು. ಸರ್ವರ್‌ನಲ್ಲಿ OCR ಕಾನ್ಫಿಗರ್ ಆಗಿದ್ದರೆ ಮಾತ್ರ ಸ್ವಯಂಚಾಲಿತ ಪಠ್ಯ ಓದುವಿಕೆ ನಡೆಯುತ್ತದೆ; ಇಲ್ಲದಿದ್ದರೆ ಅಧಿಕೃತ ಪರಿಶೀಲನೆಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ.",
      hi: "आप चैट बॉक्स में पेपरक्लिप या कैमरा आइकन से JPG, PNG, WEBP फ़ोटो (5 MB तक) या PDF (10 MB तक) संलग्न कर सकते हैं। नोट: स्वचालित OCR केवल सर्वर पर कॉन्फ़िगर होने पर चलता है; अन्यथा दस्तावेज़ पंचायत अधिकारी की समीक्षा के लिए सुरक्षित रूप से संलग्न किए जाते हैं।"
    },
    thanks: {
      en: "You are welcome! Please ask anytime if you need help registering a complaint, tracking status, or contacting your Gram Panchayat.",
      kn: "ಧನ್ಯವಾದಗಳು! ದೂರು ದಾಖಲಿಸಲು, ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಲು ಅಥವಾ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಮಾಹಿತಿಗಾಗಿ ಯಾವಾಗ ಬೇಕಾದರೂ ಕೇಳಿ.",
      hi: "आपका स्वागत है! शिकायत दर्ज करने, स्थिति ट्रैक करने या ग्राम पंचायत सेवाओं की जानकारी के लिए कभी भी पूछें।"
    }
  };
  return faq[key]?.[sLang] || faq[key]?.en || "";
}

async function incrementSummaryStat(db, fieldName) {
  if (!db) return;
  try {
    await db.collection("assistantAnalytics").doc("summary").set(
      {
        [fieldName]: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    // Best-effort non-blocking metric
  }
}

function sanitizeChatSettings(raw) {
  const s = (raw && typeof raw === "object") ? raw : {};
  const enabledLangsRaw = (s.enabledLanguages && typeof s.enabledLanguages === "object") ? s.enabledLanguages : {};
  const enabledLanguages = {
    en: enabledLangsRaw.en !== false,
    kn: enabledLangsRaw.kn !== false,
    hi: enabledLangsRaw.hi !== false
  };
  if (!enabledLanguages.en && !enabledLanguages.kn && !enabledLanguages.hi) {
    enabledLanguages.en = true;
  }
  return {
    aiAssistant: s.aiAssistant !== false,
    aiKnowledgeCentre: s.aiKnowledgeCentre !== false,
    onlineAi: s.onlineAi !== false,
    offlineAi: s.offlineAi !== false,
    suggestedQuestions: s.suggestedQuestions !== false,
    autoLanguageDetection: s.autoLanguageDetection === true,
    autoTranslation: s.autoTranslation !== false,
    knowledgeSearch: s.knowledgeSearch !== false,
    semanticSearch: s.semanticSearch !== false,
    crossLanguageSearch: s.crossLanguageSearch !== false,
    contextAware: s.contextAware !== false,
    conversationMemory: s.conversationMemory !== false,
    autoCitation: s.autoCitation !== false,
    complaintUnderstanding: s.complaintUnderstanding !== false,
    schemeSearch: s.schemeSearch !== false,
    enabledLanguages,
    aiProvider: ["auto", "gemini", "openai", "guided"].includes(s.aiProvider) ? s.aiProvider : "auto",
    responseLength: ["concise", "balanced", "detailed"].includes(s.responseLength) ? s.responseLength : "balanced",
    temperature: Number.isFinite(Number(s.temperature)) ? Math.min(1, Math.max(0, Number(s.temperature))) : null,
    timeoutMs: Number.isFinite(Number(s.requestTimeoutMs)) ? Math.min(25000, Math.max(4000, Number(s.requestTimeoutMs))) : null,
    knowledgeSearchLimit: Math.min(10, Math.max(1, Number(s.knowledgeSearchLimit) || 5))
  };
}

/**
 * Main conversational AI request handler.
 */
async function handleChatTurn(db, caller, payload) {
  const {
    message,
    lang = "en-IN",
    history = [],
    draftState = null,
    lastTrackedId = null,
    attachmentsCount = 0,
    attachmentsSummary = [],
    chatSettings: rawChatSettings = null
  } = payload || {};

  const cfgFlags = sanitizeChatSettings(rawChatSettings);
  let activeLang = normalizeLang(lang);
  let sLang = getShortLang(activeLang);

  if (!message || typeof message !== "string" || message.trim().length < 1) {
    throw new functions.https.HttpsError("invalid-argument", getLocalizedString("invalid_message", activeLang));
  }
  const cleanMessage = message.trim();
  if (cleanMessage.length > 1000) {
    throw new functions.https.HttpsError("invalid-argument", getLocalizedString("invalid_message", activeLang));
  }

  // Enforce AI Assistant master switch
  if (!cfgFlags.aiAssistant) {
    return {
      reply:
        sLang === "kn"
          ? "ಚಾಟ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ AI ಸಹಾಯಕವನ್ನು ಆಫ್ ಮಾಡಲಾಗಿದೆ. ಉತ್ತರಗಳನ್ನು ಪಡೆಯಲು Settings -> General ನಲ್ಲಿ AI Assistant ಅನ್ನು ಆನ್ ಮಾಡಿ."
          : sLang === "hi"
          ? "चैट सेटिंग्स में AI सहायक बंद है। उत्तर पाने के लिए Settings -> General में AI Assistant चालू करें।"
          : "AI Assistant is currently turned OFF in Chat Settings. Enable AI Assistant under Settings -> General to resume.",
      lang: activeLang,
      intent: "assistant_disabled",
      suggestedQuestions: [],
      providerStatus: await getProviderStatus(db)
    };
  }

  // Enforce Language Settings & Auto-Language Detection without silent translation into disabled languages
  const detectedLang = detectInputLanguage(cleanMessage);
  const detectedShort = getShortLang(detectedLang);
  const fallbackLangCode = cfgFlags.enabledLanguages.en ? "en-IN" : (cfgFlags.enabledLanguages.kn ? "kn-IN" : "hi-IN");

  if (!cfgFlags.enabledLanguages[sLang]) {
    const fbShort = getShortLang(fallbackLangCode);
    const disabledLabel = sLang === "kn" ? "Kannada" : (sLang === "hi" ? "Hindi" : "English");
    return {
      reply:
        fbShort === "kn"
          ? `${disabledLabel} ಭಾಷೆಯನ್ನು Chat Settings -> Language Settings ನಲ್ಲಿ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಸಕ್ರಿಯಗೊಳಿಸಿದ ಭಾಷೆಯನ್ನು ಬಳಸಿ ಅಥವಾ Settings ನಲ್ಲಿ ಅದನ್ನು ಆನ್ ಮಾಡಿ.`
          : fbShort === "hi"
          ? `${disabledLabel} भाषा Chat Settings -> Language Settings में बंद है। कृपया सक्षम भाषा का उपयोग करें या Settings में इसे चालू करें।`
          : `${disabledLabel} is currently disabled in Chat Settings -> Language Settings. Please enable it in Settings or switch to an enabled language.`,
      lang: fallbackLangCode,
      intent: "language_disabled",
      suggestedQuestions: [],
      providerStatus: await getProviderStatus(db)
    };
  }

  if (cfgFlags.autoLanguageDetection && detectedShort !== sLang) {
    if (!cfgFlags.enabledLanguages[detectedShort]) {
      const disabledLabel = detectedShort === "kn" ? "Kannada (ಕನ್ನಡ)" : (detectedShort === "hi" ? "Hindi (हिन्दी)" : "English");
      return {
        reply:
          sLang === "kn"
            ? `ನೀವು ${disabledLabel} ನಲ್ಲಿ ಸಂದೇಶ ಕಳುಹಿಸಿದ್ದೀರಿ, ಆದರೆ ಆ ಭಾಷೆಯು Chat Settings ನಲ್ಲಿ ಆಫ್ ಆಗಿದೆ.`
            : sLang === "hi"
            ? `आपने ${disabledLabel} में संदेश भेजा है, लेकिन वह भाषा Chat Settings में बंद है।`
            : `Your message is in ${disabledLabel}, which is disabled in Chat Settings -> Language Settings. Please enable ${disabledLabel} to receive responses in it.`,
        lang: activeLang,
        intent: "language_disabled",
        suggestedQuestions: [],
        providerStatus: await getProviderStatus(db)
      };
    }
    if (cfgFlags.autoTranslation) {
      activeLang = detectedLang;
      sLang = detectedShort;
    }
  }

  const effectiveHistory = (cfgFlags.conversationMemory && cfgFlags.contextAware && Array.isArray(history)) ? history : [];
  const withSuggestions = (intentKey) => (cfgFlags.suggestedQuestions ? buildSuggestedQuestions(intentKey, activeLang) : []);

  const runtimeCfg = await getAssistantRuntimeConfig(db);
  await enforceRateLimit(db, caller.uid, "chat", {
    maxPerMinute: runtimeCfg.rateLimitPerMinute,
    maxPerDay: runtimeCfg.rateLimitPerDay
  });

  incrementSummaryStat(db, "totalInteractions");

  const normalizedText = normalizeAndCorrectText(cleanMessage);
  const lower = normalizedText.toLowerCase();
  const panchayats = await getVerifiedPanchayats(db);
  const providerStatus = await getProviderStatus(db);

  // 1. Emergency Guidance (Highest Priority — never delay emergency action)
  const hazardCheck = classifyComplaintLogic(cleanMessage);
  const isExplicitEmergency =
    hazardCheck.isEmergency ||
    /(emergency|ambulance|fire brigade|police|shock|electrocution|112|108|1912|101|ತುರ್ತು|ಅಪಾಯ|ವಿದ್ಯುತ್ ಶಾಕ್|आपातकाल|आपातकालीन|खतरा|करंट)/.test(lower);

  if (isExplicitEmergency) {
    incrementSummaryStat(db, "emergencyAlerts");
    const emergencyReply =
      sLang === "kn"
        ? "ತುರ್ತು ಎಚ್ಚರಿಕೆ: ಜೀವಹಾನಿ ಅಥವಾ ತಕ್ಷಣದ ಅಪಾಯವಿದ್ದರೆ ದಯವಿಟ್ಟು ಚಾಟ್‌ನಲ್ಲಿ ಕಾಯಬೇಡಿ. ತಕ್ಷಣವೇ ಕೆಳಗಿನ ತುರ್ತು ಸಹಾಯವಾಣಿಗಳಿಗೆ ಕರೆ ಮಾಡಿ: 112 (ಪೊಲೀಸ್/ವಿಪತ್ತು), 108 (ಆಂಬ್ಯುಲೆನ್ಸ್), 1912 (ವಿದ್ಯುತ್ ತಂತಿ/ಮೆಸ್ಕಾಂ), 101 (ಅಗ್ನಿಶಾಮಕ). ಸುರಕ್ಷಿತ ಸ್ಥಳಕ್ಕೆ ಹೋದ ನಂತರ ನೀವು ತುರ್ತು ನಾಗರಿಕ ದೂರನ್ನೂ ದಾಖಲಿಸಬಹುದು."
        : sLang === "hi"
        ? "आपातकालीन चेतावनी: किसी भी जानलेवा खतरे या दुर्घटना के लिए कृपया चैट में प्रतीक्षा न करें। तुरंत कॉल करें: 112 (पुलिस/आपदा), 108 (एम्बुलेंस), 1912 (बिजली का तार), 101 (अग्निशमन)। सुरक्षित होने के बाद आप नीचे से तत्काल शिकायत भी दर्ज कर सकते हैं।"
        : "URGENT SAFETY GUIDANCE: If there is an immediate threat to life or safety, do NOT wait on chat. Call emergency services immediately: 112 (Police/Disaster), 108 (Ambulance), 1912 (Live Electric Wire), 101 (Fire). Once safe, you can also log an urgent civic hazard ticket.";

    return {
      reply: emergencyReply,
      lang: activeLang,
      intent: "emergency",
      isEmergency: true,
      emergencyContacts: EMERGENCY_CONTACTS.map((c) => ({ label: c.label[sLang] || c.label.en, number: c.number })),
      suggestedQuestions: withSuggestions("emergency"),
      providerStatus
    };
  }

  // 2. Complaint Tracking & History Queries (Strictly verified against caller's authorized records)
  const explicitIdMatch = cleanMessage.match(/JAN-\d{4}-\d{3,6}/i);
  const wantsTracking =
    Boolean(explicitIdMatch) ||
    /(track|status|complaint history|my complaints|check complaint|progress|action taken|ಸ್ಥಿತಿ|ಟ್ರ್ಯಾಕ್|ದೂರು ಇತಿಹಾಸ|ನನ್ನ ದೂರು|ट्रैक|स्थिति|शिकायत इतिहास|मेरी शिकायत)/.test(lower) ||
    (Boolean(lastTrackedId) && /(who|when|officer|department|remark|update|action|progress|details|ಯಾರು|ಯಾವಾಗ|ಅಧಿಕಾರಿ|ಕ್ರಮ|कौन|कब|अधिकारी|कार्रवाई)/.test(lower));

  if (wantsTracking && !draftState?.active && cfgFlags.complaintUnderstanding) {
    incrementSummaryStat(db, "trackingQueries");
    const targetId = explicitIdMatch ? explicitIdMatch[0].toUpperCase() : (lastTrackedId && /(who|when|officer|department|remark|update|action|progress|details|ಯಾರು|ಯಾವಾಗ|ಅಧಿಕಾರಿ|ಕ್ರಮ|कौन|कब|अधिकारी|कार्रवाई)/.test(lower) ? lastTrackedId : null);

    if (targetId) {
      try {
        const tracked = await trackSingleComplaint(db, caller, targetId);
        const reply =
          sLang === "kn"
            ? `ದೂರು ${tracked.complaintId} (${getCategoryLabel(tracked.category, activeLang)}) ಪ್ರಸ್ತುತ '${tracked.status}' ಸ್ಥಿತಿಯಲ್ಲಿದೆ. ಇಲಾಖೆ: ${tracked.assignedDepartment}. ಸಲ್ಲಿಕೆ ದಿನಾಂಕ: ${tracked.createdAt}.`
            : sLang === "hi"
            ? `शिकायत ${tracked.complaintId} (${getCategoryLabel(tracked.category, activeLang)}) वर्तमान में '${tracked.status}' स्थिति में है। विभाग: ${tracked.assignedDepartment}। दर्ज तिथि: ${tracked.createdAt}।`
            : `Complaint ${tracked.complaintId} (${getCategoryLabel(tracked.category, activeLang)}) is currently '${tracked.status}'. Assigned Department: ${tracked.assignedDepartment}. Submitted: ${tracked.createdAt}.`;

        return {
          reply,
          lang: activeLang,
          intent: "track_single",
          trackedComplaint: tracked,
          lastTrackedId: tracked.complaintId,
          suggestedQuestions: withSuggestions("tracking"),
          navigationTarget: `track.html?id=${encodeURIComponent(tracked.complaintId)}`,
          providerStatus
        };
      } catch (trackErr) {
        if (trackErr.code === "permission-denied") {
          return {
            reply: getLocalizedString("unauthorized_complaint", activeLang),
            lang: activeLang,
            intent: "track_unauthorized",
            errorCode: "PERMISSION_DENIED",
            suggestedQuestions: withSuggestions("general"),
            providerStatus
          };
        }
        return {
          reply: getLocalizedString("complaint_not_found", activeLang),
          lang: activeLang,
          intent: "track_not_found",
          suggestedQuestions: withSuggestions("tracking"),
          providerStatus
        };
      }
    }

    const list = await listAuthorizedComplaints(db, caller, { limit: 10 });
    if (list.length === 0) {
      const emptyMsg =
        sLang === "kn"
          ? "ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಯಾವುದೇ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಹೊಸ ದೂರು ದಾಖಲಿಸಲು ಬಯಸುವಿರಾ?"
          : sLang === "hi"
          ? "आपके खाते में कोई पंजीकृत शिकायत नहीं मिली। क्या आप नई शिकायत दर्ज करना चाहते हैं?"
          : "No registered complaints were found under your account. Would you like to register a new complaint?";
      return {
        reply: emptyMsg,
        lang: activeLang,
        intent: "track_empty",
        trackedComplaints: [],
        suggestedQuestions: withSuggestions("general"),
        providerStatus
      };
    }

    const latest = await trackSingleComplaint(db, caller, list[0].complaintId).catch(() => list[0]);
    const listReply =
      sLang === "kn"
        ? `ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ${list.length} ದೂರು(ಗಳು) ಲಭ್ಯವಿವೆ. ಇತ್ತೀಚಿನ ದೂರು ${latest.complaintId} ಪ್ರಸ್ತುತ '${latest.status}' ಹಂತದಲ್ಲಿದೆ.`
        : sLang === "hi"
        ? `आपके खाते में ${list.length} शिकायत(ें) मिली हैं। आपकी नवीनतम शिकायत ${latest.complaintId} वर्तमान में '${latest.status}' स्थिति में है।`
        : `Found ${list.length} complaint(s) under your account. Your latest complaint ${latest.complaintId} is currently '${latest.status}'.`;

    return {
      reply: listReply,
      lang: activeLang,
      intent: "track_list",
      trackedComplaint: latest,
      trackedComplaints: list,
      lastTrackedId: latest.complaintId,
      suggestedQuestions: withSuggestions("tracking"),
      navigationTarget: "citizen-dashboard.html",
      providerStatus
    };
  }

  // 3. Human Assistance / Panchayat Officials Contact Lookup
  if (/(contact|official|pdo|secretary|president|phone|directory|number|ಹೆಲ್ಪ್|ಅಧಿಕಾರಿ|ಪಿಡಿಒ|ಕಾರ್ಯದರ್ಶಿ|ಸಂಪರ್ಕ|ಡೈರೆಕ್ಟರಿ|अधिकारी|संपर्क|पीडीओ|सचिव|फोन|निर्देशिका)/.test(lower) && !draftState?.active) {
    const matchedGp = matchPanchayatFromText(cleanMessage, panchayats);
    const chosenList = matchedGp ? [matchedGp] : panchayats.slice(0, 4);
    const contactReply =
      sLang === "kn"
        ? (matchedGp
            ? `${matchedGp.name} ಕಚೇರಿ ಸಂಪರ್ಕ ವಿವರಗಳು ಕೆಳಗಿವೆ:`
            : "ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಗಳ ಪರಿಶೀಲಿಸಿದ ಸಂಪರ್ಕ ವಿವರಗಳು ಕೆಳಗಿವೆ. ಸಂಪೂರ್ಣ ಪಟ್ಟಿಗಾಗಿ ಪಂಚಾಯತ್ ಡೈರೆಕ್ಟರಿ ತೆರೆಯಿರಿ.")
        : sLang === "hi"
        ? (matchedGp
            ? `${matchedGp.name} कार्यालय के संपर्क विवरण नीचे दिए गए हैं:`
            : "यहाँ सत्यापित ग्राम पंचायत अधिकारियों के संपर्क विवरण हैं। पूरी सूची के लिए पंचायत निर्देशिका खोलें।")
        : (matchedGp
            ? `Here are the verified office contacts for ${matchedGp.name}:`
            : "Here are verified Gram Panchayat official contacts from the directory. Open the Panchayat Directory for the complete list:");

    return {
      reply: contactReply,
      lang: activeLang,
      intent: "panchayat_contacts",
      panchayatContacts: chosenList.map((g) => ({
        panchayatId: g.panchayatId,
        name: g.name,
        block: g.block,
        district: g.district,
        president: g.president || "Panchayat President",
        secretary: g.secretary || "Panchayat Development Officer (PDO)",
        contactNumber: g.contactNumber || "",
        receiverEmail: g.receiverEmail || "",
        officeAddress: g.officeAddress || ""
      })),
      navigationTarget: "directory.html",
      suggestedQuestions: withSuggestions("general"),
      providerStatus
    };
  }

  // 4. Multi-Turn Intelligent Complaint Registration (Slot Collection)
  const detectedCat = detectCategoryFromText(normalizedText);
  const wantsToCancelDraft = draftState?.active && /^(cancel|stop|nevermind|exit|back|ರದ್ದು|ಬೇಡ|ನಿಲ್ಲಿಸಿ|रद्द|बंद|नहीं)$/i.test(cleanMessage);
  if (wantsToCancelDraft) {
    return {
      reply:
        sLang === "kn"
          ? "ದೂರು ನೋಂದಣಿ ಪ್ರಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. ಬೇರೆ ಯಾವುದೇ ಸಹಾಯ ಬೇಕಿದ್ದಲ್ಲಿ ಕೇಳಿ."
          : sLang === "hi"
          ? "शिकायत पंजीकरण प्रक्रिया रद्द कर दी गई है। किसी अन्य सहायता के लिए बताएं।"
          : "Complaint registration draft cancelled. How else may I assist you?",
      lang: activeLang,
      intent: "draft_cancelled",
      draftState: null,
      readyForPreview: false,
      suggestedQuestions: withSuggestions("general"),
      providerStatus
    };
  }

  const isExplicitComplaintAction = /(register|file|lodge|submit|new complaint|new grievance|report issue|complain|pothole|broken|leakage|overflow|not working|ದೂರು ದಾಖಲಿಸಿ|ದೂರು ಸಲ್ಲಿಸಿ|ಸಮಸ್ಯೆ ವರದಿ|ಗುಂಡಿ|ಸೋರಿಕೆ|शिकायत दर्ज|नई शिकायत|रिपोर्ट करें|गड्ढा|टूटा)/.test(lower);
  const isInformationalQuestion =
    !draftState?.active &&
    !isExplicitComplaintAction &&
    (
      /\?$/.test(cleanMessage) ||
      /^(what|how|who|when|where|which|why|explain|tell me|summarize|list|check|details|info|information|rules|scheme|yojana|eligibility|documents|fee|fees|subsidy|pension|ration|certificate|ಏನು|ಹೇಗೆ|ಯಾವ|ಯಾರು|ವಿವರ|ಯೋಜನೆ|ನಿಯಮ|ಅರ್ಹತೆ|ದಾಖಲೆ|ಶುಲ್ಕ|क्या|कैसे|कौन|कब|कहाँ|योजना|नियम|पात्रता|दस्तावेज|शुल्क)\b/i.test(lower) ||
      /\b(scheme|yojana|eligibility|documents required|rules|guideline|policy|knowledge|circular|notice|pension|subsidy|ಯೋಜನೆ|ನಿಯಮ|ಅರ್ಹತೆ|ದಾಖಲೆ|योजना|नियम|पात्रता|दस्तावेज)\b/i.test(lower)
    );

  const wantsRegisterIntent =
    cfgFlags.complaintUnderstanding &&
    (Boolean(draftState?.active) || (!isInformationalQuestion && (Boolean(detectedCat) || isExplicitComplaintAction)));

  if (wantsRegisterIntent) {
    if (!draftState?.active) {
      incrementSummaryStat(db, "complaintsStarted");
    }

    const nextDraft = {
      active: true,
      category: draftState?.category || detectedCat?.value || null,
      panchayatId: draftState?.panchayatId || null,
      panchayatName: draftState?.panchayatName || null,
      village: draftState?.village || "",
      location: draftState?.location || "",
      subject: draftState?.subject || "",
      description: draftState?.description || "",
      attachmentsCount: Number(attachmentsCount) || Number(draftState?.attachmentsCount) || 0
    };

    if (!nextDraft.category && detectedCat) {
      nextDraft.category = detectedCat.value;
    }

    const gpMatch = matchPanchayatFromText(cleanMessage, panchayats);
    if (gpMatch) {
      nextDraft.panchayatId = gpMatch.panchayatId;
      nextDraft.panchayatName = gpMatch.name;
      if (!nextDraft.village) {
        nextDraft.village = gpMatch.name.replace(/\s*Gram\s*Panchayat\s*/gi, "").trim();
      }
    }

    const loc = extractLocationPhrase(cleanMessage);
    if (loc && !nextDraft.location) {
      nextDraft.location = loc;
    }

    // Distinguish pure intent starters / short location replies from detailed problem descriptions
    const wordCount = cleanMessage.split(/\s+/).filter(Boolean).length;
    const isExactStarter = /^(register a complaint|file a complaint|i want to complain|water supply problems|road damage|streetlight problems|sanitation complaints|ದೂರು ದಾಖಲಿಸಿ|शिकायत दर्ज करें)$/i.test(cleanMessage);
    const isIntentOnlyOpening =
      !draftState?.active &&
      !gpMatch &&
      !loc &&
      wordCount <= 9 &&
      /^(i want to|i would like to|i need to|please|help me|want to)\b.*\b(complain|complaint|grievance|report|issue|problem|register|file|submit)\b/i.test(cleanMessage);
    const isJustLocationReply = Boolean(gpMatch || (draftState?.active && !draftState.panchayatId && !draftState.location && !detectedCat)) && wordCount <= 5 && !detectedCat;

    if (!isExactStarter && !isIntentOnlyOpening && !isJustLocationReply && cleanMessage.length >= 10) {
      if (!nextDraft.description) {
        nextDraft.description = cleanMessage;
      } else if (!nextDraft.description.includes(cleanMessage) && nextDraft.description.length < 1600) {
        nextDraft.description = `${nextDraft.description}. ${cleanMessage}`;
      }
    }

    // Check missing slots in natural order:
    // 1) Category
    if (!nextDraft.category) {
      return {
        reply:
          sLang === "kn"
            ? "ಖಂಡಿತ, ನಾನು ದೂರು ದಾಖಲಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ದಯವಿಟ್ಟು ಸಮಸ್ಯೆಯ ವರ್ಗವನ್ನು ತಿಳಿಸಿ (ಉದಾ: ಕುಡಿಯುವ ನೀರು, ರಸ್ತೆ ಹಾನಿ, ಬೀದಿದೀಪ, ಸ್ವಚ್ಛತೆ/ಚರಂಡಿ, ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯ)?"
            : sLang === "hi"
            ? "ज़रूर, मैं आपकी शिकायत दर्ज करने में मदद करूँगा। कृपया समस्या की श्रेणी बताएं (जैसे: पेयजल, सड़क क्षति, स्ट्रीट लाइट, कचरा/नाली सफाई, सार्वजनिक सुविधा)?"
            : "I can help you register a complaint. What type of issue is it (e.g., Water Supply, Road Damage, Streetlight Problems, Sanitation & Drainage, or Public Facilities)?",
        lang: activeLang,
        intent: "collect_category",
        draftState: nextDraft,
        readyForPreview: false,
        suggestedQuestions: withSuggestions("filing"),
        providerStatus
      };
    }

    // 2) Village / Gram Panchayat & Location
    if (!nextDraft.panchayatId && !nextDraft.village) {
      const catLbl = getCategoryLabel(nextDraft.category, activeLang);
      return {
        reply:
          sLang === "kn"
            ? `${catLbl} ದೂರು ದಾಖಲಿಸಲು, ದಯವಿಟ್ಟು ಯಾವ ಗ್ರಾಮ/ಗ್ರಾಮ ಪಂಚಾಯತ್ ಮತ್ತು ನಿಖರ ಸ್ಥಳ (ಉದಾ: ಬೆತ್ತೋಡಿ, ಮುಖ್ಯ ಬಸ್ ನಿಲ್ದಾಣದ ಹತ್ತಿರ) ಎಂದು ತಿಳಿಸಿ?`
            : sLang === "hi"
            ? `${catLbl} की शिकायत दर्ज करने के लिए कृपया बताएं कि कौन-सा गाँव/ग्राम पंचायत और सटीक स्थान प्रभावित है (जैसे: बेथोडी, मुख्य बस स्टॉप के पास)?`
            : `I can help register your ${catLbl} complaint. Which village / Gram Panchayat and specific location or landmark is affected?`,
        lang: activeLang,
        intent: "collect_location",
        draftState: nextDraft,
        readyForPreview: false,
        suggestedQuestions: withSuggestions("filing"),
        providerStatus
      };
    }

    // Fallback default GP if citizen gave a custom village name or user profile has one
    if (!nextDraft.panchayatId) {
      const fallbackGp = (caller.panchayatId && panchayats.find((g) => g.panchayatId === caller.panchayatId)) || panchayats[0];
      if (fallbackGp) {
        nextDraft.panchayatId = fallbackGp.panchayatId;
        nextDraft.panchayatName = fallbackGp.name;
      }
    }

    // 3) Detailed description (>= 15 chars)
    if (!nextDraft.description || nextDraft.description.trim().length < 15) {
      return {
        reply:
          sLang === "kn"
            ? "ದಯವಿಟ್ಟು ಸಮಸ್ಯೆಯನ್ನು ವಿವರವಾಗಿ ತಿಳಿಸಿ (ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ, ನಿಖರ ಸ್ಥಳ ಮತ್ತು ತೊಂದರೆಯ ವಿವರ)?"
            : sLang === "hi"
            ? "कृपया समस्या का पूरा विवरण बताएं (यह कब से है, सटीक स्थान और लोगों को क्या परेशानी हो रही है)?"
            : "Please describe the problem in detail (what is damaged, exact landmark, and how long it has been an issue).",
        lang: activeLang,
        intent: "collect_description",
        draftState: nextDraft,
        readyForPreview: false,
        suggestedQuestions: withSuggestions("filing"),
        providerStatus
      };
    }

    // Ready for confirmation card!
    if (!nextDraft.subject || nextDraft.subject.length < 5) {
      nextDraft.subject = getDefaultSubject(nextDraft.category, activeLang);
    }

    return {
      reply:
        sLang === "kn"
          ? "ನಿಮ್ಮ ದೂರಿನ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಮುನ್ನೋಟವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸಲ್ಲಿಸಲು ಖಚಿತಪಡಿಸಿ:"
          : sLang === "hi"
          ? "आपकी शिकायत का विवरण तैयार है। कृपया नीचे दिए गए पूर्वावलोकन की समीक्षा करें और जमा करने की पुष्टि करें:"
          : "I have collected all required details. Please review your complaint summary below and click Submit Complaint to confirm (or Edit to make changes):",
      lang: activeLang,
      intent: "complaint_ready",
      draftState: nextDraft,
      readyForPreview: true,
      suggestedQuestions: withSuggestions("filing"),
      providerStatus
    };
  }

  // 5. Query AI Knowledge Centre (RAG Retrieval across Kannada, English & Hindi)
  let ragResult = null;
  const isGreetingOrThanks = /^(hi|hello|hey|namaste|namaskara|ನಮಸ್ಕಾರ|ಹಲೋ|नमस्ते|नमस्कार|thank|thanks|dhanyavad|ಧನ್ಯವಾದ|धन्यवाद|शुक्रिया)\b/i.test(cleanMessage);
  if (!isGreetingOrThanks && cfgFlags.aiKnowledgeCentre && cfgFlags.knowledgeSearch) {
    try {
      let ragQuery = cleanMessage;
      if (cfgFlags.contextAware && cfgFlags.conversationMemory && effectiveHistory.length > 0 && cleanMessage.split(/\s+/).length <= 8) {
        const recentCtx = effectiveHistory.slice(-4).map((h) => String(h.text || "").slice(0, 100)).join(" ");
        if (/\b(it|this|that|they|more|details|documents|eligibility|fee|ಅದರ|ಇದರ|इसके|उसका)\b/i.test(cleanMessage)) {
          ragQuery = `${cleanMessage} ${recentCtx}`.slice(0, 420);
        }
      }
      ragResult = await queryKnowledgeBaseServer(db, {
        query: ragQuery,
        lang: activeLang,
        limit: cfgFlags.knowledgeSearchLimit,
        semanticSearch: cfgFlags.semanticSearch,
        crossLanguageSearch: cfgFlags.crossLanguageSearch,
        schemeSearch: cfgFlags.schemeSearch
      });
    } catch (ragErr) {
      console.warn("[ConversationService] Knowledge RAG warning:", ragErr.message);
    }
  }

  const knowledgeSources = cfgFlags.autoCitation ? (ragResult?.sources || []) : [];

  // 6. External AI Provider Attempt (if server-side key is configured & Online AI enabled)
  if (
    cfgFlags.onlineAi &&
    cfgFlags.aiProvider !== "guided" &&
    providerStatus.configured &&
    providerStatus.aiEnabled &&
    runtimeCfg.preferredProvider !== "guided"
  ) {
    const verifiedContext = {
      citizenRole: caller.role,
      selectedLanguage: activeLang,
      panchayats: cfgFlags.contextAware
        ? panchayats.slice(0, 12).map((g) => ({
            id: g.panchayatId,
            name: g.name,
            block: g.block,
            district: g.district,
            contact: g.contactNumber,
            secretary: g.secretary
          }))
        : [],
      portalPages: ["index.html", "knowledge-centre.html", "complaint.html", "track.html", "citizen-dashboard.html", "directory.html", "about.html"],
      emergencyHelplines: { policeDisaster: "112", ambulance: "108", liveElectricWire: "1912", fire: "101" },
      uploadedAttachmentsMetadata: Array.isArray(attachmentsSummary)
        ? attachmentsSummary.slice(0, 5).map((a) => ({
            name: String(a.name || "").slice(0, 80),
            category: String(a.category || "file"),
            note: "UNTRUSTED_ATTACHMENT_METADATA"
          }))
        : [],
      knowledgeBaseReferences: (ragResult?.retrieval?.results || []).map((hit) => ({
        docId: hit.docId,
        title: hit.title,
        language: hit.language,
        sourceReliability: hit.sourceReliability,
        trustLabel: hit.trustLabel,
        version: hit.version,
        score: hit.score,
        untrustedExcerpt: sanitizeUntrustedSnippet(hit.text, 650)
      })),
      knowledgeConflictNotice: ragResult?.retrieval?.conflictNotice || null
    };

    const aiRes = await generateAIResponse(db, {
      message: cleanMessage,
      lang: activeLang,
      history: effectiveHistory,
      verifiedContext,
      overrides: {
        preferredProvider: cfgFlags.aiProvider,
        responseLength: cfgFlags.responseLength,
        temperature: cfgFlags.temperature,
        timeoutMs: cfgFlags.timeoutMs
      }
    });

    if (aiRes.usedProvider && aiRes.reply) {
      return {
        reply: aiRes.reply,
        lang: activeLang,
        intent: knowledgeSources.length ? "knowledge_rag_ai" : "ai_conversational",
        knowledgeSources,
        hasConflict: Boolean(ragResult?.hasConflict),
        conflictNotice: ragResult?.conflictNotice || null,
        suggestedQuestions: cfgFlags.suggestedQuestions
          ? (aiRes.suggestedQuestions?.length ? aiRes.suggestedQuestions : withSuggestions("general"))
          : [],
        navigationTarget: aiRes.navigationTarget || (knowledgeSources.length ? "knowledge-centre.html" : null),
        providerStatus: aiRes.providerStatus
      };
    }

    if (aiRes.providerError && !ragResult?.found) {
      const errMsg = aiRes.errorCode === "TIMEOUT"
        ? getLocalizedString("provider_timeout", activeLang)
        : getLocalizedString("provider_error", activeLang);
      return {
        reply: errMsg,
        lang: activeLang,
        intent: "provider_error",
        providerError: true,
        errorCode: aiRes.errorCode,
        suggestedQuestions: withSuggestions("general"),
        providerStatus: aiRes.providerStatus
      };
    }
  }

  // 7. Grounded Knowledge Base Retrieval Response (if matching documents were found)
  if (ragResult && ragResult.found && ragResult.reply) {
    return {
      reply: ragResult.reply,
      lang: activeLang,
      intent: "knowledge_rag",
      knowledgeSources,
      hasConflict: Boolean(ragResult.hasConflict),
      conflictNotice: ragResult.conflictNotice || null,
      navigationTarget: "knowledge-centre.html",
      suggestedQuestions: withSuggestions("general"),
      providerStatus
    };
  }

  if (!cfgFlags.onlineAi && !cfgFlags.offlineAi) {
    return {
      reply:
        sLang === "kn"
          ? "Online AI ಮತ್ತು Offline AI ಎರಡನ್ನೂ Chat Settings ನಲ್ಲಿ ಆಫ್ ಮಾಡಲಾಗಿದೆ. ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಪಡೆಯಲು ಕನಿಷ್ಠ ಒಂದನ್ನು ಆನ್ ಮಾಡಿ."
          : sLang === "hi"
          ? "Online AI और Offline AI दोनों Chat Settings में बंद हैं। उत्तर पाने के लिए कम से कम एक मोड चालू करें।"
          : "Both Online AI and Offline AI are disabled in Chat Settings. Please enable at least one mode to continue.",
      lang: activeLang,
      intent: "no_ai_mode",
      knowledgeSources: [],
      suggestedQuestions: [],
      providerStatus
    };
  }

  // 8. Verified Deterministic Civic Knowledge & Conversational Fallback
  let reply = "";
  let intent = "general_help";
  let navTarget = null;

  if (/(timing|hour|open|close|working day|holiday|ಸಮಯ|ರಜೆ|ಕೆಲಸದ ದಿನ|समय|छुट्टी|कब खुल)/.test(lower)) {
    reply = buildGuidedFaqReply("timings", activeLang);
    intent = "faq_timings";
  } else if (/(eswathu|e-swathu|khata|tax|property|form 9|form 11|ಇ-ಸ್ವತ್ತು|ಖಾತಾ|ತೆರಿಗೆ|ई-स्वथु|खाता|संपत्ति कर)/.test(lower)) {
    reply = buildGuidedFaqReply("eswathu", activeLang);
    intent = "faq_eswathu";
  } else if (/(birth|death|certificate|ejanma|e-janma|ಜನನ|ಮರಣ|ಪ್ರಮಾಣಪತ್ರ|जन्म|मृत्यु|प्रमाण)/.test(lower)) {
    reply = buildGuidedFaqReply("certificates", activeLang);
    intent = "faq_certificates";
  } else if (/(service|government|scheme|bapuji|panchayat service|ಸೇವೆ|ಸರ್ಕಾರಿ|ಬಾಪೂಜಿ|सेवा|सरकारी|बापूजी)/.test(lower)) {
    reply = buildGuidedFaqReply("services", activeLang);
    intent = "faq_services";
    navTarget = "about.html";
  } else if (/(document|upload|pdf|photo|camera|ocr|attachment|ದಾಖಲೆ|ಅಪ್ಲೋಡ್|ಫೋಟೋ|दस्तावेज|अपलोड|फोटो)/.test(lower)) {
    reply = buildGuidedFaqReply("documents", activeLang);
    intent = "faq_documents";
  } else if (/(thank|thanks|dhanyavad|ಧನ್ಯವಾದ|धन्यवाद|शुक्रिया)/.test(lower)) {
    reply = buildGuidedFaqReply("thanks", activeLang);
    intent = "faq_thanks";
  } else if (/^(hi|hello|hey|namaste|namaskara|ನಮಸ್ಕಾರ|ಹಲೋ|नमस्ते|नमस्कार)/i.test(cleanMessage)) {
    reply =
      sLang === "kn"
        ? "ನಮಸ್ಕಾರ! ನಾನು ಜನಸೇವಾ AI ಸಹಾಯಕ. ದೂರು ದಾಖಲಿಸಲು, ದೂರಿನ ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಅಥವಾ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸೇವೆಗಳು ಹಾಗೂ ಜ್ಞಾನ ಕೋಶದ ಮಾಹಿತಿಗಾಗಿ ಕೇಳಿ — ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
        : sLang === "hi"
        ? "नमस्कार! मैं जनसेवा AI सहायक हूँ। आप शिकायत दर्ज करने, स्थिति ट्रैक करने या ग्राम पंचायत सेवाओं व ज्ञान केंद्र की जानकारी के बारे में पूछ सकते हैं — बताइए मैं आपकी क्या सहायता करूँ?"
        : "Namaskara! I am the JANASEVA Assistant. You can ask me to register a complaint, track an existing Complaint ID, search the AI Knowledge Centre, check Panchayat timings/services, or find official contacts. How may I help you?";
    intent = "greeting";
  } else if (isInformationalQuestion) {
    reply = ragResult?.reply || (
      sLang === "kn"
        ? "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ JANASEVA ಜ್ಞಾನ ಕೋಶದಲ್ಲಿ ಸಾಕಷ್ಟು ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಪ್ರಶ್ನೆಯನ್ನು ಇನ್ನಷ್ಟು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿ ಅಥವಾ ಸಂಬಂಧಿತ ದಾಖಲೆಯನ್ನು AI Knowledge Centre ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ."
        : sLang === "hi"
        ? "क्षमा करें, आपके प्रश्न के लिए JANASEVA ज्ञान केंद्र में पर्याप्त जानकारी नहीं मिली। कृपया प्रश्न स्पष्ट लिखें या संबंधित दस्तावेज़ AI Knowledge Centre में अपलोड करें।"
        : "Sufficient verified information was not found in the JANASEVA Knowledge Base for this question. Please ask a more specific clarifying question or upload relevant documents to the AI Knowledge Centre."
    );
    intent = "knowledge_not_found";
    navTarget = "knowledge-centre.html";
  } else {
    reply =
      sLang === "kn"
        ? "ನಾನು ಜನಸೇವಾ ನಾಗರಿಕ ಸೇವಾ ಸಹಾಯಕ. ನೀವು: (1) ರಸ್ತೆ, ನೀರು, ಬೀದಿದೀಪ ಅಥವಾ ಸ್ವಚ್ಛತೆಯ ದೂರು ದಾಖಲಿಸಬಹುದು, (2) JAN-2026-XXXX ಸಂಖ್ಯೆಯೊಂದಿಗೆ ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು, ಅಥವಾ (3) AI ಜ್ಞಾನ ಕೋಶ, ಪಂಚಾಯತ್ ಸಮಯ, ಇ-ಸ್ವತ್ತು ಮತ್ತು ಅಧಿಕಾರಿಗಳ ಸಂಪರ್ಕವನ್ನು ಕೇಳಬಹುದು."
        : sLang === "hi"
        ? "मैं जनसेवा नागरिक सेवा सहायक हूँ। आप: (1) सड़क, पानी, स्ट्रीटलाइट या स्वच्छता की शिकायत दर्ज कर सकते हैं, (2) JAN-2026-XXXX द्वारा शिकायत ट्रैक कर सकते हैं, या (3) AI ज्ञान केंद्र, पंचायत समय, ई-स्वथु व अधिकारी संपर्क पूछ सकते हैं।"
        : "I can help you with: (1) Registering a complaint (roads, water, streetlights, sanitation), (2) Tracking your complaint ID or history, (3) Asking questions from the AI Knowledge Centre, or (4) Gram Panchayat services and official contacts. What would you like to do?";
  }

  return {
    reply,
    lang: activeLang,
    intent,
    knowledgeSources,
    navigationTarget: navTarget,
    suggestedQuestions: withSuggestions("general"),
    providerStatus
  };
}

module.exports = {
  EMERGENCY_CONTACTS,
  CATEGORY_DEFINITIONS,
  handleChatTurn
};
