/**
 * JANASEVA – AI Knowledge Centre Multilingual Processing, Chunking, Embeddings & Hybrid RAG Engine
 * Supports English (en), Kannada (kn), and Hindi (hi) + cross-language concept retrieval.
 * Zero external dependencies; optional external neural embeddings adapter supported.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JanasevaKnowledgeRAG = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VECTOR_DIMS = 256;
  const CONCEPT_OFFSET = 192; // Last 64 dims reserved for cross-lingual civic concepts

  // Trilingual Cross-Language Concept Dictionary (English, Kannada, Hindi)
  const CROSS_LINGUAL_CONCEPTS = [
    { id: 0,  key: 'water',       terms: ['water', 'drinking water', 'pipeline', 'borewell', 'tap', 'jal', 'rwss', 'ನೀರು', 'ಕುಡಿಯುವ ನೀರು', 'ಪೈಪ್', 'ನಳ', 'पानी', 'पेयजल', 'नल', 'जल'] },
    { id: 1,  key: 'road',        terms: ['road', 'pothole', 'culvert', 'bridge', 'highway', 'asphalt', 'pwd', 'ರಸ್ತೆ', 'ಗುಂಡಿ', 'ಸೇತುವೆ', 'ಡಾಂಬರು', 'सड़क', 'गड्ढा', 'पुल', 'मार्ग'] },
    { id: 2,  key: 'electricity', terms: ['electricity', 'streetlight', 'power', 'wire', 'pole', 'solar', 'mescom', 'bescom', 'ವಿದ್ಯುತ್', 'ಬೀದಿದೀಪ', 'ಕರೆಂಟ್', 'ಸೋಲಾರ್', 'बिजली', 'विद्युत', 'स्ट्रीटलाइट', 'सौर'] },
    { id: 3,  key: 'sanitation',  terms: ['garbage', 'waste', 'drain', 'drainage', 'sanitation', 'toilet', 'swachh', 'ಕಸ', 'ಸ್ವಚ್ಛತೆ', 'ಚರಂಡಿ', 'ಶೌಚಾಲಯ', 'कचरा', 'सफाई', 'स्वच्छता', 'नाली', 'शौचालय'] },
    { id: 4,  key: 'eswathu',     terms: ['eswathu', 'e-swathu', 'khata', 'property', 'mutation', 'form 9', 'form 11', 'rtc', 'pahani', 'land', 'survey', 'ಇ-ಸ್ವತ್ತು', 'ಖಾತಾ', 'ಆಸ್ತಿ', 'ಪಹಣಿ', 'ಭೂಮಿ', 'ಸರ್ವೆ', 'ई-स्वथु', 'खाता', 'संपत्ति', 'भूमि', 'खसरा'] },
    { id: 5,  key: 'certificate', terms: ['certificate', 'birth', 'death', 'caste', 'income', 'residence', 'ejanma', 'e-janma', 'ಪ್ರಮಾಣಪತ್ರ', 'ಜನನ', 'ಮರಣ', 'ಜಾತಿ', 'ಆದಾಯ', 'प्रमाणपत्र', 'जन्म', 'मृत्यु', 'जाति', 'आय'] },
    { id: 6,  key: 'pension',     terms: ['pension', 'widow', 'old age', 'disability', 'sandhya', 'welfare', 'ಪಿಂಚಣಿ', 'ವೇತನ', 'ವಿಧವಾ', 'ವೃದ್ಧಾಪ್ಯ', 'पेंशन', 'वृद्धावस्था', 'विधवा', 'दिव्यांग'] },
    { id: 7,  key: 'ration',      terms: ['ration', 'pds', 'bpl', 'apl', 'food', 'anna bhagya', 'ಪಡಿತರ', 'ರೇಷನ್', 'ಬಿಪಿಎಲ್', 'ಅನ್ನಭಾಗ್ಯ', 'राशन', 'बीपीएल', 'खाद्य'] },
    { id: 8,  key: 'employment',  terms: ['mgnrega', 'nrega', 'job card', 'wage', 'employment', 'work', 'ನರೇಗಾ', 'ಉದ್ಯೋಗ', 'ಕೂಲಿ', 'ಜಾಬ್ ಕಾರ್ಡ್', 'मनरेगा', 'नरेगा', 'रोजगार', 'मजदूरी'] },
    { id: 9,  key: 'housing',     terms: ['housing', 'awas', 'pmay', 'basava', 'ashraya', 'house', 'home', 'ವಸತಿ', 'ಮನೆ', 'ಆಶ್ರಯ', 'ಬಸವ', 'आवास', 'मकान', 'घर'] },
    { id: 10, key: 'tax',         terms: ['tax', 'fee', 'fees', 'charge', 'payment', 'receipt', 'rupees', 'rs', 'inr', 'ತೆರಿಗೆ', 'ಶುಲ್ಕ', 'ರಸೀದಿ', 'ರೂಪಾಯಿ', 'कर', 'शुल्क', 'रसीद', 'रुपये'] },
    { id: 11, key: 'documents',   terms: ['document', 'documents', 'aadhaar', 'aadhar', 'pan', 'voter', 'id', 'proof', 'attach', 'required', 'ದಾಖಲೆ', 'ದಾಖಲೆಗಳು', 'ಆಧಾರ್', 'ಗುರುತಿನ ಚೀಟಿ', 'ಅಗತ್ಯ', 'दस्तावेज', 'दस्तावेज़', 'आधार', 'पहचान', 'आवश्यक'] },
    { id: 12, key: 'eligibility', terms: ['eligibility', 'eligible', 'criteria', 'qualify', 'who can', 'income limit', 'ಅರ್ಹತೆ', 'ಮಾನದಂಡ', 'ಯಾರು ಅರ್ಹರು', 'पात्रता', 'योग्यता', 'मानदंड', 'कौन'] },
    { id: 13, key: 'process',     terms: ['apply', 'application', 'procedure', 'process', 'steps', 'how to', 'submit', 'online', 'portal', 'ಅರ್ಜಿ', 'ವಿಧಾನ', 'ಹಂತಗಳು', 'ಸಲ್ಲಿಸುವುದು', 'आवेदन', 'प्रक्रिया', 'कैसे', 'चरण', 'जमा'] },
    { id: 14, key: 'timeline',    terms: ['days', 'time', 'timing', 'hours', 'deadline', 'duration', 'schedule', 'holiday', 'ದಿನಗಳು', 'ಸಮಯ', 'ಅವಧಿ', 'ಕೊನೆಯ ದಿನಾಂಕ', 'दिन', 'समय', 'अवधि', 'अंतिम तिथि'] },
    { id: 15, key: 'panchayat',   terms: ['gram panchayat', 'panchayat', 'gram sabha', 'pdo', 'secretary', 'president', 'ward', 'village', 'bapuji', 'ಗ್ರಾಮ ಪಂಚಾಯತ್', 'ಪಂಚಾಯತ್', 'ಗ್ರಾಮ ಸಭೆ', 'ಪಿಡಿಒ', 'ಗ್ರಾಮ', 'ಬಾಪೂಜಿ', 'ग्राम पंचायत', 'पंचायत', 'ग्राम सभा', 'सचिव', 'गाँव'] },
    { id: 16, key: 'agriculture', terms: ['agriculture', 'farmer', 'crop', 'pm kisan', 'kisan', 'seed', 'fertilizer', 'irrigation', 'krishi', 'ಕೃಷಿ', 'ರೈತ', 'ಬೆಳೆ', 'ನೀರಾವರಿ', 'ಬೀಜ', 'कृषि', 'किसान', 'फसल', 'सिंचाई', 'बीज'] },
    { id: 17, key: 'health',      terms: ['health', 'hospital', 'clinic', 'ayushman', 'vaccination', 'medical', 'anganwadi', 'ಆರೋಗ್ಯ', 'ಆಸ್ಪತ್ರೆ', 'ಆಯುಷ್ಮಾನ್', 'ಅಂಗನವಾಡಿ', 'स्वास्थ्य', 'अस्पताल', 'आयुष्मान', 'आंगनवाड़ी'] },
    { id: 18, key: 'education',   terms: ['school', 'scholarship', 'student', 'college', 'vidyasiri', 'education', 'ಶಾಲೆ', 'ವಿದ್ಯಾರ್ಥಿ', 'ವಿದ್ಯಾರ್ಥಿವೇತನ', 'ಶಿಕ್ಷಣ', 'स्कूल', 'छात्र', 'छात्रवृत्ति', 'शिक्षा'] },
    { id: 19, key: 'subsidy',     terms: ['subsidy', 'scheme', 'yojana', 'grant', 'loan', 'benefit', 'fund', 'budget', 'ಯೋಜನೆ', 'ಸಹಾಯಧನ', 'ಅನುದಾನ', 'ಸಾಲ', 'योजना', 'सब्सिडी', 'अनुदान', 'ऋण', 'बजट'] },
    { id: 20, key: 'grievance',   terms: ['complaint', 'grievance', 'janaseva', 'track', 'redressal', 'helpline', 'emergency', 'ದೂರು', 'ಕುಂದುಕೊರತೆ', 'ಸಹಾಯವಾಣಿ', 'शिकायत', 'समाधान', 'हेल्पलाइन'] },
    { id: 21, key: 'officer',     terms: ['officer', 'contact', 'phone', 'email', 'office', 'address', 'desk', 'ಅಧಿಕಾರಿ', 'ಸಂಪರ್ಕ', 'ಕಚೇರಿ', 'ವಿಳಾಸ', 'अधिकारी', 'संपर्क', 'कार्यालय', 'पता'] }
  ];

  const CATEGORY_RULES = [
    { category: 'Government Schemes & Subsidies', terms: ['scheme', 'yojana', 'subsidy', 'pension', 'grant', 'benefit', 'awas', 'kisan', 'ಯೋಜನೆ', 'ಸಹಾಯಧನ', 'ಪಿಂಚಣಿ', 'योजना', 'सब्सिडी', 'पेंशन'] },
    { category: 'Land Records & Revenue (e-Swathu / RTC)', terms: ['eswathu', 'e-swathu', 'khata', 'rtc', 'pahani', 'mutation', 'survey', 'form 9', 'form 11', 'ಇ-ಸ್ವತ್ತು', 'ಖಾತಾ', 'ಪಹಣಿ', 'ई-स्वथु', 'खाता', 'भूमि'] },
    { category: 'Certificates & Citizen Services', terms: ['birth', 'death', 'certificate', 'caste', 'income', 'ejanma', 'ration', 'aadhaar', 'ಜನನ', 'ಮರಣ', 'ಪ್ರಮಾಣಪತ್ರ', 'ಪಡಿತರ', 'जन्म', 'मृत्यु', 'प्रमाणपत्र', 'राशन'] },
    { category: 'Water, Sanitation & Infrastructure', terms: ['water', 'road', 'drain', 'garbage', 'streetlight', 'sanitation', 'borewell', 'ನೀರು', 'ರಸ್ತೆ', 'ಚರಂಡಿ', 'ಬೀದಿದೀಪ', 'पानी', 'सड़क', 'नाली', 'स्वच्छता'] },
    { category: 'Gram Panchayat Rules & Procedures', terms: ['gram panchayat', 'gram sabha', 'rule', 'guideline', 'circular', 'act', 'notice', 'resolution', 'ನಿಯಮ', 'ಸುತ್ತೋಲೆ', 'ಗ್ರಾಮ ಸಭೆ', 'नियम', 'परिपत्र', 'ग्राम सभा'] },
    { category: 'Budgets, Circulars & Notices', terms: ['budget', 'tender', 'audit', 'expenditure', 'financial', 'allocation', 'ಬಜೆಟ್', 'ಟೆಂಡರ್', 'ಲೆಕ್ಕಪರಿಶೋಧನೆ', 'बजट', 'निविदा', 'लेखा'] },
    { category: 'Agriculture & Rural Development', terms: ['agriculture', 'farmer', 'crop', 'irrigation', 'mgnrega', 'soil', 'ಕೃಷಿ', 'ರೈತ', 'ನರೇಗಾ', 'कृषि', 'किसान', 'मनरेगा'] },
    { category: 'Health, Education & Welfare', terms: ['health', 'school', 'anganwadi', 'scholarship', 'hospital', 'ayushman', 'ಆರೋಗ್ಯ', 'ಶಾಲೆ', 'ಅಂಗನವಾಡಿ', 'स्वास्थ्य', 'स्कूल', 'आंगनवाड़ी'] },
    { category: 'Conversation Archive (ChatGPT / Notes)', terms: ['[user]:', '[assistant]:', 'chatgpt', 'conversation'] }
  ];

  /**
   * Stage G: Language Detection (Kannada, Hindi, English, Mixed)
   * Preserves original language without unnecessary translation.
   */
  function detectLanguage(text) {
    const s = String(text || '');
    const knMatches = s.match(/[\u0C80-\u0CFF]/g) || [];
    const hiMatches = s.match(/[\u0900-\u097F]/g) || [];
    const enMatches = s.match(/[A-Za-z]/g) || [];

    const knCount = knMatches.length;
    const hiCount = hiMatches.length;
    const enCount = enMatches.length;
    const total = Math.max(1, knCount + hiCount + enCount);

    const dist = {
      kn: Number((knCount / total).toFixed(3)),
      hi: Number((hiCount / total).toFixed(3)),
      en: Number((enCount / total).toFixed(3))
    };

    const activeLangs = [];
    if (knCount >= 3 || dist.kn >= 0.12) activeLangs.push('kn');
    if (hiCount >= 3 || dist.hi >= 0.12) activeLangs.push('hi');
    if (enCount >= 4 || dist.en >= 0.15) activeLangs.push('en');

    let primary = 'en';
    if (knCount >= hiCount && knCount >= enCount && knCount > 0) primary = 'kn';
    else if (hiCount >= knCount && hiCount >= enCount && hiCount > 0) primary = 'hi';
    else if (dist.kn >= 0.22 && knCount >= 10) primary = 'kn';
    else if (dist.hi >= 0.22 && hiCount >= 10) primary = 'hi';

    if (activeLangs.length === 0) activeLangs.push(primary);

    return {
      primaryLanguage: primary,
      detectedLanguages: activeLangs,
      isMultilingual: activeLangs.length > 1,
      scriptDistribution: dist
    };
  }

  /**
   * Stage H: Clean Text while strictly preserving Kannada/Devanagari matras & tables
   */
  function cleanText(rawText) {
    let s = String(rawText || '');
    if (typeof s.normalize === 'function') {
      s = s.normalize('NFC');
    }
    // Remove zero-width & control chars (except \n, \r, \t)
    s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');
    // Fix broken line-end hyphenation in English text
    s = s.replace(/([A-Za-z])-\r?\n([A-Za-z])/g, '$1$2');
    // Normalize CRLF -> LF, collapse spaces within lines, keep paragraph breaks
    s = s.replace(/\r\n?/g, '\n');
    s = s
      .split('\n')
      .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
      .join('\n');
    s = s.replace(/\n{3,}/g, '\n\n').trim();
    return s;
  }

  /**
   * Stage I: Automatic Document Classification
   */
  function classifyDocument(text, filename = '', format = '') {
    if (format === 'chatgpt_export') {
      return { category: 'Conversation Archive (ChatGPT / Notes)', confidence: 0.95 };
    }
    const sample = `${filename} ${String(text || '').slice(0, 5000)}`.toLowerCase();
    let bestCat = 'Community Knowledge & FAQs';
    let bestScore = 0;

    for (const rule of CATEGORY_RULES) {
      let hits = 0;
      for (const term of rule.terms) {
        if (sample.includes(term)) hits++;
      }
      if (hits > bestScore) {
        bestScore = hits;
        bestCat = rule.category;
      }
    }
    return {
      category: bestCat,
      confidence: bestScore > 0 ? Math.min(0.95, 0.55 + bestScore * 0.08) : 0.45
    };
  }

  /**
   * Multilingual Tokenization (English, Kannada, Hindi)
   */
  function tokenizeMultilingual(text) {
    const cleaned = String(text || '').toLowerCase();
    const matches = cleaned.match(/[a-z0-9]+|[\u0C80-\u0CFF]+|[\u0900-\u097F]+/g) || [];
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were', 'have', 'has', 'had',
      'not', 'but', 'you', 'your', 'can', 'will', 'all', 'any', 'into', 'about', 'what', 'which', 'who',
      'whom', 'whose', 'where', 'when', 'why', 'how', 'is', 'am', 'be', 'been', 'being', 'do', 'does', 'did',
      'of', 'in', 'on', 'at', 'to', 'by', 'or', 'as', 'an', 'it', 'its', 'may', 'shall', 'should', 'would', 'could',
      'ಯಾವ', 'ಏನು', 'ಹೇಗೆ', 'ಎಲ್ಲಿ', 'ಯಾರು', 'ಯಾವಾಗ', 'ಮತ್ತು', 'ಅಥವಾ', 'ಇದೆ', 'ಆಗಿದೆ', 'ಬೇಕು', 'ಬಗ್ಗೆ',
      'क्या', 'कैसे', 'कहाँ', 'कब', 'कौन', 'किस', 'किसके', 'लिए', 'है', 'हैं', 'था', 'थी', 'थे',
      'का', 'की', 'के', 'में', 'से', 'को', 'पर', 'और', 'या', 'करें', 'होता', 'होती'
    ]);
    return matches.filter((t) => t.length >= 2 && !stopWords.has(t));
  }

  function extractKeywords(text, maxCount = 15) {
    const tokens = tokenizeMultilingual(text);
    const freq = new Map();
    for (const tok of tokens) {
      freq.set(tok, (freq.get(tok) || 0) + 1);
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCount)
      .map(([word]) => word);
  }

  function extractSummary(text, maxLen = 320) {
    const clean = cleanText(text);
    if (!clean) return '';
    const sentences = clean.split(/(?<=[.!?।])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length >= 12);
    if (!sentences.length) return clean.slice(0, maxLen);
    let summary = '';
    for (const sent of sentences) {
      if ((summary + ' ' + sent).trim().length > maxLen) break;
      summary = (summary ? summary + ' ' : '') + sent;
    }
    return summary || clean.slice(0, maxLen);
  }

  function extractTitle(text, filename = '', metadata = {}) {
    if (metadata && metadata.title && String(metadata.title).trim().length >= 3) {
      return String(metadata.title).trim().slice(0, 140);
    }
    const lines = cleanText(text).split('\n').map((l) => l.replace(/^#+\s*/, '').trim()).filter((l) => l.length >= 4);
    if (lines.length && lines[0].length <= 120 && !/^[\d\W]+$/.test(lines[0])) {
      return lines[0];
    }
    const base = String(filename || 'Knowledge Document').split(/[/\\]/).pop().replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    return base.slice(0, 140) || 'Knowledge Document';
  }

  /**
   * Stage J: Structure-Aware Text Chunking
   */
  function chunkDocumentText(text, tables = [], options = {}) {
    const maxChunkChars = options.maxChunkChars || 750;
    const overlapChars = options.overlapChars || 120;
    const clean = cleanText(text);
    const chunks = [];

    // 1. Chunk main prose respecting headings & paragraph boundaries
    if (clean) {
      const blocks = clean.split(/\n{2,}/);
      let currentHeading = '';
      let buffer = '';

      const flushBuffer = () => {
        const trimmed = buffer.trim();
        if (!trimmed) return;
        if (trimmed.length <= maxChunkChars) {
          chunks.push({
            text: trimmed,
            sectionTitle: currentHeading || null,
            hasTable: trimmed.includes('|')
          });
        } else {
          // Sentence-aware sliding window split
          const parts = trimmed.split(/(?<=[.!?।\n])\s+/);
          let win = '';
          for (const part of parts) {
            if ((win + ' ' + part).trim().length > maxChunkChars && win.trim().length > 0) {
              chunks.push({ text: win.trim(), sectionTitle: currentHeading || null, hasTable: win.includes('|') });
              const tail = win.trim().slice(-overlapChars);
              win = tail + ' ' + part;
            } else {
              win = (win ? win + ' ' : '') + part;
            }
          }
          if (win.trim()) {
            chunks.push({ text: win.trim(), sectionTitle: currentHeading || null, hasTable: win.includes('|') });
          }
        }
        buffer = '';
      };

      for (const blk of blocks) {
        const trimmed = blk.trim();
        if (!trimmed) continue;
        if (/^#{1,4}\s+/.test(trimmed) || (trimmed.length <= 80 && !/[.!?।]$/.test(trimmed) && !trimmed.includes('\n'))) {
          flushBuffer();
          currentHeading = trimmed.replace(/^#+\s*/, '').slice(0, 100);
          buffer = trimmed;
        } else if ((buffer + '\n\n' + trimmed).length > maxChunkChars) {
          flushBuffer();
          buffer = trimmed;
        } else {
          buffer = buffer ? `${buffer}\n\n${trimmed}` : trimmed;
        }
      }
      flushBuffer();
    }

    // 2. Append structured tables that weren't already covered verbatim
    if (Array.isArray(tables)) {
      for (const tbl of tables) {
        const headerLine = Array.isArray(tbl.headers) ? tbl.headers.join(' | ') : '';
        const rowLines = Array.isArray(tbl.rows) ? tbl.rows.map((r) => (Array.isArray(r) ? r.join(' | ') : String(r))) : [];
        const tblStr = `[Table: ${tbl.title || 'Data'}]\n${headerLine}\n${rowLines.join('\n')}`.trim();
        if (tblStr.length > 15 && !chunks.some((c) => c.text.includes(rowLines[0] || tblStr.slice(0, 40)))) {
          chunks.push({
            text: tblStr.slice(0, maxChunkChars * 1.4),
            sectionTitle: tbl.title || 'Table',
            hasTable: true
          });
        }
      }
    }

    return chunks.map((c, idx) => {
      const langInfo = detectLanguage(c.text);
      return {
        chunkIndex: idx,
        text: c.text,
        sectionTitle: c.sectionTitle,
        hasTable: Boolean(c.hasTable),
        language: langInfo.primaryLanguage,
        charCount: c.text.length,
        tokenCount: tokenizeMultilingual(c.text).length
      };
    });
  }

  /**
   * Detect matching cross-lingual civic concepts in text with word-boundary / Indic inflection accuracy
   */
  function extractConceptIds(text) {
    const rawLower = String(text || '').toLowerCase();
    const tokens = tokenizeMultilingual(rawLower);
    const tokenSet = new Set(tokens);
    const bigrams = new Set();
    for (let i = 0; i < tokens.length - 1; i++) {
      bigrams.add(`${tokens[i]} ${tokens[i + 1]}`);
    }

    const matchesTerm = (term) => {
      if (term.includes(' ')) {
        return bigrams.has(term) || rawLower.includes(` ${term} `);
      }
      if (term.includes('-')) {
        return rawLower.includes(term) || bigrams.has(term.replace(/-/g, ' '));
      }
      if (tokenSet.has(term)) return true;
      const isIndic = /[\u0900-\u0CFF]/.test(term);
      if (isIndic && term.length >= 3) {
        return tokens.some((tok) => tok.startsWith(term));
      }
      if (!isIndic && term.length >= 4) {
        return tokens.some((tok) => tok === `${term}s` || tok === `${term}es` || tok === `${term}ed`);
      }
      return false;
    };

    const matched = [];
    for (const c of CROSS_LINGUAL_CONCEPTS) {
      if (c.terms.some(matchesTerm)) {
        matched.push(c.id);
      }
    }
    return matched;
  }

  function fnv1a32(str, seed = 0x811c9dc5) {
    let h = seed >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  /**
   * Stage L: Generate L2-Normalized 256-dim Multilingual Semantic + Concept Vector
   */
  function generateLocalEmbedding(text) {
    const vec = new Float32Array(VECTOR_DIMS);
    const tokens = tokenizeMultilingual(text);

    // 1. Word unigram hashing (0..191)
    for (const tok of tokens) {
      const h1 = fnv1a32(tok, 0x811c9dc5);
      const h2 = fnv1a32(tok, 0x9e3779b9);
      const idx = h1 % CONCEPT_OFFSET;
      const sign = (h2 & 1) === 0 ? 1 : -1;
      vec[idx] += sign * 1.0;

      // Subword 3-grams for morphological & typo resilience across EN/KN/HI
      if (tok.length >= 4) {
        for (let i = 0; i <= tok.length - 3; i++) {
          const gram = tok.slice(i, i + 3);
          const gIdx = fnv1a32(gram, 0x45d9f3b) % CONCEPT_OFFSET;
          vec[gIdx] += 0.35;
        }
      }
    }

    // 2. Cross-Lingual Civic Concept Projection (192..255)
    const concepts = extractConceptIds(text);
    for (const cId of concepts) {
      const slot = CONCEPT_OFFSET + (cId % (VECTOR_DIMS - CONCEPT_OFFSET));
      vec[slot] += 2.8;
    }

    // L2 normalize
    let normSq = 0;
    for (let i = 0; i < VECTOR_DIMS; i++) normSq += vec[i] * vec[i];
    const norm = Math.sqrt(normSq) || 1;
    const out = new Array(VECTOR_DIMS);
    for (let i = 0; i < VECTOR_DIMS; i++) {
      out[i] = Number((vec[i] / norm).toFixed(5));
    }
    return out;
  }

  function cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      const va = Number(a[i]) || 0;
      const vb = Number(b[i]) || 0;
      dot += va * vb;
      magA += va * va;
      magB += vb * vb;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom > 0 ? Math.max(0, dot / denom) : 0;
  }

  function computeLexicalOverlapScore(queryTokens, docText) {
    if (!queryTokens.length) return 0;
    const docLower = String(docText || '').toLowerCase();
    const docTokens = new Set(tokenizeMultilingual(docLower));
    let exactHits = 0;
    let partialHits = 0;
    for (const qt of queryTokens) {
      if (docTokens.has(qt)) exactHits += 1;
      else if (qt.length >= 4 && docLower.includes(qt)) partialHits += 0.6;
    }
    return Math.min(1, (exactHits + partialHits) / Math.max(1, queryTokens.length));
  }

  /**
   * Search & Hybrid Rank Chunks (Section 5)
   */
  function retrieveRelevantChunks({
    query,
    documents = [],
    chunks = [],
    embeddings = [],
    limit = 6,
    queryExternalVector = null,
    semanticSearch = true,
    crossLanguageSearch = true,
    schemeSearch = true
  }) {
    const qClean = cleanText(query);
    if (!qClean) return { results: [], queryLanguage: 'en', concepts: [], hasConflict: false, conflictNotice: null };

    const qLang = detectLanguage(qClean).primaryLanguage;
    const qTokens = tokenizeMultilingual(qClean);
    const qConcepts = crossLanguageSearch !== false ? extractConceptIds(qClean) : [];
    const qLocalVec = semanticSearch !== false ? generateLocalEmbedding(qClean) : null;
    const isSchemeQuery = schemeSearch !== false &&
      /(scheme|yojana|pension|subsidy|benefit|scholarship|ration|mgnrega|housing|grant|circular|ಯೋಜನೆ|ಪಿಂಚಣಿ|ಸಹಾಯಧನ|ಪಡಿತರ|योजना|पेंशन|सब्सिडी|राशन|लाभ)/i.test(qClean);

    const docMap = new Map();
    for (const d of documents) {
      if (d && d.docId && d.status === 'INDEXED' && d.enabled !== false && !d.quarantined && !d.deleted) {
        docMap.set(d.docId, d);
      }
    }

    const embByChunkId = new Map();
    for (const e of embeddings) {
      if (e && e.chunkId) embByChunkId.set(e.chunkId, e);
    }

    const nowMs = Date.now();
    const scored = [];

    for (const chunk of chunks) {
      if (!chunk || chunk.active === false) continue;
      const parentDoc = docMap.get(chunk.docId);
      if (!parentDoc) continue;

      const embRecord = embByChunkId.get(chunk.chunkId);
      let vecScore = 0;
      if (semanticSearch !== false) {
        if (queryExternalVector && embRecord && Array.isArray(embRecord.externalVector)) {
          vecScore = cosineSimilarity(queryExternalVector, embRecord.externalVector);
        } else if (qLocalVec) {
          const cVec = (embRecord && Array.isArray(embRecord.vector)) ? embRecord.vector : generateLocalEmbedding(chunk.text);
          vecScore = cosineSimilarity(qLocalVec, cVec);
        }
      }

      const lexScore = computeLexicalOverlapScore(qTokens, `${parentDoc.title || ''} ${chunk.sectionTitle || ''} ${chunk.text}`);
      const cConcepts = crossLanguageSearch !== false ? extractConceptIds(`${parentDoc.title || ''} ${chunk.text}`) : [];
      const sharedConcepts = qConcepts.filter((id) => cConcepts.includes(id));
      const conceptOverlap = qConcepts.length
        ? sharedConcepts.length / qConcepts.length
        : 0;
      const conceptTokenCoverage = Math.min(1, sharedConcepts.length / Math.max(1, qTokens.length * 0.5));

      // Reliability & recency boost (only applied to semantically relevant matches)
      const relTier = parentDoc.sourceReliability || 'community';
      const relScore = relTier === 'official' ? 1.0 : (relTier === 'verified_partner' ? 0.85 : 0.65);
      const ageDays = Math.max(0, (nowMs - Date.parse(parentDoc.updatedAt || parentDoc.uploadedAt || new Date().toISOString())) / (1000 * 60 * 60 * 24));
      const recencyScore = Math.max(0.4, 1 - Math.min(0.6, ageDays / 365));
      const schemeBonus = (isSchemeQuery && /scheme|pension|welfare|circular|government|benefit|tax/i.test(`${parentDoc.category || ''} ${parentDoc.title || ''}`)) ? 0.05 : 0;

      const baseRelevance = semanticSearch !== false
        ? ((0.46 * vecScore) + (0.36 * lexScore) + (0.18 * conceptOverlap))
        : ((0.76 * lexScore) + (0.24 * conceptOverlap));
      const chunkLang = chunk.language || parentDoc.primaryLanguage || 'en';
      const isCrossLingual = qLang !== chunkLang;

      const sameLangPass = !isCrossLingual && (
        lexScore >= (semanticSearch !== false ? 0.34 : 0.28) ||
        (semanticSearch !== false && lexScore >= 0.24 && baseRelevance >= 0.25)
      );
      const crossLangPass = crossLanguageSearch !== false &&
        isCrossLingual &&
        sharedConcepts.length >= (qTokens.length >= 5 ? 2 : 1) &&
        conceptOverlap >= 0.5 &&
        conceptTokenCoverage >= 0.45 &&
        (semanticSearch === false || vecScore >= 0.24);

      const finalScore = semanticSearch !== false
        ? Math.min(1, (0.42 * vecScore) + (0.32 * lexScore) + (0.16 * conceptOverlap) + (0.06 * relScore) + (0.04 * recencyScore) + schemeBonus)
        : Math.min(1, (0.68 * lexScore) + (0.22 * conceptOverlap) + (0.06 * relScore) + (0.04 * recencyScore) + schemeBonus);

      if (sameLangPass || crossLangPass) {
        scored.push({
          chunkId: chunk.chunkId,
          docId: parentDoc.docId,
          title: parentDoc.title || parentDoc.originalFilename || 'Knowledge Document',
          fileName: parentDoc.originalFilename || parentDoc.filename || '',
          category: parentDoc.category || 'General Civic Reference',
          language: chunk.language || parentDoc.primaryLanguage || 'en',
          sourceReliability: relTier,
          trustLabel: relTier === 'official' ? 'Official Source' : (relTier === 'verified_partner' ? 'Verified API Import' : 'Community-Contributed'),
          version: parentDoc.version || 1,
          uploadedAt: parentDoc.uploadedAt || parentDoc.createdAt || '',
          chunkIndex: chunk.chunkIndex,
          sectionTitle: chunk.sectionTitle || null,
          text: chunk.text,
          score: Number(finalScore.toFixed(4)),
          breakdown: {
            cosine: Number(vecScore.toFixed(3)),
            lexical: Number(lexScore.toFixed(3)),
            concept: Number(conceptOverlap.toFixed(3)),
            reliability: relScore
          }
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, limit);

    // Detect conflicting facts across distinct sources (e.g., differing numbers/amounts/days)
    let hasConflict = false;
    let conflictNotice = null;
    if (topResults.length >= 2) {
      const distinctDocs = Array.from(new Set(topResults.map((r) => r.docId)));
      if (distinctDocs.length >= 2) {
        const numsA = new Set((topResults[0].text.match(/\b\d+(?:\.\d+)?\b/g) || []).filter((n) => n.length <= 6));
        const other = topResults.find((r) => r.docId !== topResults[0].docId);
        const numsB = new Set((other.text.match(/\b\d+(?:\.\d+)?\b/g) || []).filter((n) => n.length <= 6));
        if (numsA.size > 0 && numsB.size > 0) {
          const diffA = Array.from(numsA).filter((n) => !numsB.has(n));
          const diffB = Array.from(numsB).filter((n) => !numsA.has(n));
          if (diffA.length > 0 && diffB.length > 0 && Math.abs(topResults[0].score - other.score) < 0.18) {
            hasConflict = true;
            conflictNotice = `Multiple sources contain differing values (${topResults[0].title} vs ${other.title}). Prioritizing ${topResults[0].trustLabel} / newer record.`;
          }
        }
      }
    }

    return {
      results: topResults,
      queryLanguage: qLang,
      concepts: qConcepts,
      hasConflict,
      conflictNotice
    };
  }

  /**
   * Build truthful grounded answer when external LLM is unconfigured or offline (Guided RAG)
   */
  function synthesizeGroundedAnswer({ query, retrieval, responseLang = 'en', securityRedactor = null }) {
    const shortLang = String(responseLang || 'en').slice(0, 2).toLowerCase();
    const hits = retrieval?.results || [];

    if (!hits.length) {
      const notFoundMap = {
        kn: 'ಕ್ಷಮಿಸಿ, JANASEVA ಜ್ಞಾನ ಕೋಶದಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಾಕಷ್ಟು ಪರಿಶೀಲಿಸಿದ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಪ್ರಶ್ನೆಯನ್ನು ಇನ್ನಷ್ಟು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿ ಅಥವಾ ಸಂಬಂಧಿತ ದಾಖಲೆಯನ್ನು AI Knowledge Centre ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
        hi: 'क्षमा करें, JANASEVA ज्ञान केंद्र में आपके प्रश्न के लिए पर्याप्त सत्यापित जानकारी नहीं मिली। कृपया अपना प्रश्न थोड़ा स्पष्ट लिखें या संबंधित दस्तावेज़ AI Knowledge Centre में अपलोड करें।',
        en: 'Sufficient verified information was not found in the JANASEVA Knowledge Base to answer this question accurately. Please rephrase your question with more specific terms or contribute relevant documents via the AI Knowledge Centre.'
      };
      return {
        found: false,
        reply: notFoundMap[shortLang] || notFoundMap.en,
        sources: [],
        uncertain: true
      };
    }

    // Deduplicate top sources (max 3 documents)
    const seenDocs = new Set();
    const citations = [];
    const excerptBlocks = [];

    for (const hit of hits) {
      let safeExcerpt = hit.text.slice(0, 380);
      if (typeof securityRedactor === 'function') safeExcerpt = securityRedactor(safeExcerpt);
      if (!seenDocs.has(hit.docId) && citations.length < 4) {
        seenDocs.add(hit.docId);
        citations.push({
          docId: hit.docId,
          title: hit.title,
          fileName: hit.fileName,
          language: hit.language,
          sourceReliability: hit.sourceReliability,
          trustLabel: hit.trustLabel,
          score: hit.score,
          version: hit.version || 1,
          uploadedAt: hit.uploadedAt,
          snippet: safeExcerpt
        });
      }
      if (excerptBlocks.length < 2) {
        const badge = hit.sourceReliability === 'official' ? 'Official' : (hit.sourceReliability === 'verified_partner' ? 'Verified Import' : 'Community Upload');
        excerptBlocks.push(`• **${hit.title}** [${badge}]: ${safeExcerpt}${hit.text.length > 380 ? '...' : ''}`);
      }
    }

    const top = hits[0];
    const hasOfficial = citations.some((c) => c.sourceReliability === 'official');
    const communityWarning = !hasOfficial
      ? (shortLang === 'kn'
          ? 'ಗಮನಿಸಿ: ಕೆಳಗಿನ ಮಾಹಿತಿಯು ಸಮುದಾಯ-ಕೊಡುಗೆ ದಾಖಲೆಗಳಿಂದ ಪಡೆಯಲಾಗಿದೆ ಮತ್ತು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಆದೇಶವೆಂದು ಪರಿಗಣಿಸಬಾರದು.'
          : shortLang === 'hi'
          ? 'नोट: नीचे दी गई जानकारी समुदाय द्वारा अपलोड किए गए दस्तावेज़ों से है, इसे आधिकारिक सरकारी आदेश न मानें।'
          : 'Note: This answer is retrieved from community-contributed documents and should not be treated as an official government order.')
      : '';

    const intro = shortLang === 'kn'
      ? `JANASEVA ಜ್ಞಾನ ಕೋಶದಲ್ಲಿ ಕಂಡುಬಂದ ಸಂಬಂಧಿತ ಮಾಹಿತಿ (ಪ್ರಮುಖ ಮೂಲ: ${top.title}):`
      : shortLang === 'hi'
      ? `JANASEVA ज्ञान केंद्र में मिली संबंधित जानकारी (मुख्य स्रोत: ${top.title}):`
      : `Based on the JANASEVA Knowledge Base (top match: ${top.title}):`;

    const conflictLine = retrieval.hasConflict && retrieval.conflictNotice
      ? `\n⚠️ ${retrieval.conflictNotice}`
      : '';

    const replyParts = [intro, ...excerptBlocks];
    if (communityWarning) replyParts.push(communityWarning);
    if (conflictLine) replyParts.push(conflictLine);

    return {
      found: true,
      reply: replyParts.join('\n\n'),
      sources: citations,
      hasConflict: Boolean(retrieval.hasConflict),
      conflictNotice: retrieval.conflictNotice || null,
      uncertain: top.score < 0.25
    };
  }

  return {
    VECTOR_DIMS,
    CROSS_LINGUAL_CONCEPTS,
    detectLanguage,
    cleanText,
    classifyDocument,
    tokenizeMultilingual,
    extractKeywords,
    extractSummary,
    extractTitle,
    chunkDocumentText,
    extractConceptIds,
    generateLocalEmbedding,
    cosineSimilarity,
    retrieveRelevantChunks,
    synthesizeGroundedAnswer
  };
});
