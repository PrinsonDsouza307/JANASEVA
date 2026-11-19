/**
 * JANASEVA – AI Knowledge Centre Security Inspection, Hashing & Guardrail Engine
 * Handles SHA-256 duplicate detection, malware/EICAR/script scanning, prompt injection
 * detection, PII detection, spam/abuse detection, and untrusted-content isolation.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('crypto'));
  } else {
    root.JanasevaKnowledgeSecurity = factory(null);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (nodeCrypto) {
  'use strict';

  const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

  const MALWARE_PATTERNS = [
    { name: 'EICAR Malware Test Signature', re: /EICAR-STANDARD-ANTIVIRUS-TEST-FILE/i, severity: 'CRITICAL' },
    { name: 'Embedded PE Executable (Base64 MZ)', re: /TVqQAAMAAAAEAAAA/, severity: 'CRITICAL' },
    { name: 'Inline Script Payload (<script>)', re: /<script\b[^>]*>[\s\S]*?<\/script>/i, severity: 'HIGH' },
    { name: 'JavaScript Event Handler Injection', re: /\bon(?:error|load|click|mouseover)\s*=\s*["'][^"']*(?:alert|eval|fetch|document\.cookie)/i, severity: 'HIGH' },
    { name: 'System Shell Execution Command', re: /(?:WScript\.Shell|ActiveXObject|powershell\s+-enc|cmd\.exe\s+\/c|bash\s+-i\s+>&)/i, severity: 'CRITICAL' }
  ];

  const PROMPT_INJECTION_PATTERNS = [
    { name: 'Instruction Override', re: /ignore\s+(?:all\s+)?(?:previous|prior|above|system)\s+instructions/i, weight: 40 },
    { name: 'Rule Disregard Directive', re: /disregard\s+(?:all\s+)?(?:rules|guidelines|safety|instructions)/i, weight: 40 },
    { name: 'System Prompt Extraction', re: /(?:reveal|print|dump|output|show)\s+(?:your\s+)?(?:system\s+prompt|hidden\s+instructions|api\s+keys?|secrets?)/i, weight: 45 },
    { name: 'Role Hijack / Jailbreak', re: /(?:you\s+are\s+now\s+(?:DAN|unrestricted|admin)|developer\s+mode\s+enabled|jailbreak\s+mode)/i, weight: 45 },
    { name: 'ChatML / Control Token Injection', re: /(?:<\|im_start\|>system|<\|system\|>|\[INST\]|<<SYS>>)/i, weight: 50 },
    { name: 'Assistant Override Framing', re: /(?:system\s*:\s*override|new\s+system\s+instruction\s*:|forget\s+everything\s+you\s+know)/i, weight: 35 }
  ];

  function toUint8(input) {
    if (!input) return new Uint8Array(0);
    if (input instanceof Uint8Array) return input;
    if (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) return new Uint8Array(input);
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    if (typeof input === 'string') {
      if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(input);
      const out = [];
      for (let i = 0; i < input.length; i++) out.push(input.charCodeAt(i) & 0xff);
      return new Uint8Array(out);
    }
    return new Uint8Array(0);
  }

  async function computeSha256Hex(input) {
    const u8 = toUint8(input);
    if (nodeCrypto) {
      return nodeCrypto.createHash('sha256').update(u8).digest('hex');
    }
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const digest = await crypto.subtle.digest('SHA-256', u8);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback deterministic 64-hex hash if crypto.subtle unavailable
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < u8.length; i++) {
      h1 = Math.imul(h1 ^ u8[i], 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ ((u8[i] << 3) | i), 0x85ebca6b) >>> 0;
    }
    return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).repeat(4);
  }

  function detectPromptInjection(text) {
    const s = String(text || '');
    const matched = [];
    let riskScore = 0;
    for (const pat of PROMPT_INJECTION_PATTERNS) {
      if (pat.re.test(s)) {
        matched.push(pat.name);
        riskScore += pat.weight;
      }
    }
    return {
      detected: matched.length > 0,
      riskScore: Math.min(100, riskScore),
      shouldQuarantine: riskScore >= 70,
      patterns: matched
    };
  }

  function detectPii(text) {
    const s = String(text || '');
    const piiTypes = [];
    const aadhaarMatches = s.match(/\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g) || [];
    if (aadhaarMatches.length > 0 && /(aadhaar|uidai|ಆಧಾರ್|आधार|id\s*no)/i.test(s)) {
      piiTypes.push({ type: 'AADHAAR_NUMBER', count: aadhaarMatches.length });
    }
    const panMatches = s.match(/\b[A-Z]{5}\d{4}[A-Z]\b/g) || [];
    if (panMatches.length > 0) {
      piiTypes.push({ type: 'PAN_CARD', count: panMatches.length });
    }
    const ifscMatches = s.match(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g) || [];
    if (ifscMatches.length > 0) {
      piiTypes.push({ type: 'IFSC_BANK_CODE', count: ifscMatches.length });
    }
    const emailMatches = s.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    if (emailMatches.length >= 5) {
      piiTypes.push({ type: 'BULK_EMAIL_LIST', count: emailMatches.length });
    }
    const phoneMatches = s.match(/(?:\+91[\s-]?)?[6-9]\d{9}\b/g) || [];
    if (phoneMatches.length >= 8) {
      piiTypes.push({ type: 'BULK_PHONE_LIST', count: phoneMatches.length });
    }
    return {
      detected: piiTypes.length > 0,
      types: piiTypes
    };
  }

  function redactSensitivePii(text) {
    let out = String(text || '');
    out = out.replace(/\b([2-9]\d{3})[\s-]?(\d{4})[\s-]?(\d{4})\b/g, (full, a, b, c, offset, src) => {
      const ctx = src.slice(Math.max(0, offset - 40), offset + full.length + 20);
      if (/(aadhaar|uidai|ಆಧಾರ್|आधार|id)/i.test(ctx)) {
        return `XXXX-XXXX-${c}`;
      }
      return full;
    });
    out = out.replace(/\b([A-Z]{5})(\d{4})([A-Z])\b/g, 'XXXXX$2$3');
    return out;
  }

  function detectSpamOrAbuse(text) {
    const s = String(text || '').trim();
    if (!s) return { isSpam: false, reasons: [] };
    const reasons = [];
    if (/(.)\1{30,}/.test(s)) reasons.push('Excessive repeated character spam');
    const urls = s.match(/https?:\/\/[^\s]+/gi) || [];
    const words = s.split(/\s+/).filter(Boolean);
    if (urls.length > 20 && words.length > 0 && (urls.length / words.length) > 0.45) {
      reasons.push('Excessive promotional link flood');
    }
    if (/(?:buy\s+crypto|casino\s+bonus|viagra|lottery\s+winner|click\s+here\s+to\s+claim\s+\$)/i.test(s)) {
      reasons.push('Known commercial spam keywords');
    }
    return { isSpam: reasons.length > 0, reasons };
  }

  function scanSecurity({ filename, rawBytes, extractedText = '' }) {
    const u8 = toUint8(rawBytes);
    let rawAsciiSample = '';
    const sampleLimit = Math.min(u8.length, 262144);
    for (let i = 0; i < sampleLimit; i++) {
      const b = u8[i];
      rawAsciiSample += (b >= 0x20 && b <= 0x7e) || b === 0x0a || b === 0x0d || b === 0x09 ? String.fromCharCode(b) : ' ';
    }

    const combinedText = `${rawAsciiSample}\n${extractedText}`;
    const malwareHits = [];
    for (const pat of MALWARE_PATTERNS) {
      if (pat.re.test(combinedText)) {
        malwareHits.push({ name: pat.name, severity: pat.severity });
      }
    }

    const injection = detectPromptInjection(extractedText);
    const pii = detectPii(extractedText);
    const spam = detectSpamOrAbuse(extractedText);

    const quarantineReasons = [];
    if (malwareHits.length > 0) {
      quarantineReasons.push(`Malicious payload detected: ${malwareHits.map((m) => m.name).join(', ')}`);
    }
    if (injection.shouldQuarantine) {
      quarantineReasons.push(`High-risk prompt injection attempt detected: ${injection.patterns.join(', ')}`);
    }
    if (spam.isSpam) {
      quarantineReasons.push(`Spam/abuse content detected: ${spam.reasons.join(', ')}`);
    }

    return {
      safe: quarantineReasons.length === 0,
      quarantine: quarantineReasons.length > 0,
      quarantineReasons,
      malwareHits,
      promptInjection: injection,
      pii,
      spam,
      filename: String(filename || '')
    };
  }

  function sanitizeUntrustedSnippet(text, maxLen = 800) {
    let clean = String(text || '');
    for (const pat of PROMPT_INJECTION_PATTERNS) {
      clean = clean.replace(pat.re, '[filtered-directive]');
    }
    clean = clean.replace(/<\/?(?:script|iframe|object|embed|style)[^>]*>/gi, '');
    return clean.trim().slice(0, maxLen);
  }

  function sanitizeFilename(rawName) {
    const base = String(rawName || 'document.txt').trim().split(/[/\\]/).pop() || 'document.txt';
    const cleaned = base.replace(/[^a-zA-Z0-9._\-\u0C80-\u0CFF\u0900-\u097F ]/g, '_').replace(/\s+/g, '_');
    return cleaned.slice(0, 120) || 'document';
  }

  return {
    EICAR_SIGNATURE,
    computeSha256Hex,
    detectPromptInjection,
    detectPii,
    redactSensitivePii,
    detectSpamOrAbuse,
    scanSecurity,
    sanitizeUntrustedSnippet,
    sanitizeFilename
  };
});
