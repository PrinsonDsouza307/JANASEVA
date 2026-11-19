/**
 * JANASEVA – AI Knowledge Centre Document Parsers & Binary Signature Engine
 * Zero-dependency pure JS/Node-compatible module supporting:
 * PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS, CSV, TXT, MD, JSON, XML,
 * JPG/JPEG, PNG, WEBP, safe ZIP extraction, and ChatGPT exported files.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('zlib'));
  } else {
    root.JanasevaKnowledgeParsers = factory(null);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (nodeZlib) {
  'use strict';

  const MAX_SINGLE_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
  const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;     // 50 MB
  const MAX_ZIP_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
  const MAX_ZIP_ENTRIES = 100;
  const MAX_ZIP_RATIO = 100;
  const MAX_ZIP_DEPTH = 2;

  const BLOCKED_EXTENSIONS = new Set([
    '.exe', '.dll', '.bat', '.cmd', '.ps1', '.psm1', '.sh', '.bash', '.msi', '.msp',
    '.vbs', '.vbe', '.jse', '.wsf', '.wsh', '.scr', '.com', '.pif', '.cpl', '.hta',
    '.jar', '.apk', '.ipa', '.deb', '.rpm', '.dmg', '.iso', '.img', '.sys', '.drv',
    '.php', '.py', '.rb', '.pl', '.cgi', '.reg', '.lnk', '.inf', '.scf'
  ]);

  const SUPPORTED_FORMATS = {
    pdf:  { exts: ['.pdf'], mimes: ['application/pdf'], maxBytes: MAX_SINGLE_FILE_BYTES },
    docx: { exts: ['.docx'], mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], maxBytes: MAX_SINGLE_FILE_BYTES },
    doc:  { exts: ['.doc'], mimes: ['application/msword'], maxBytes: MAX_SINGLE_FILE_BYTES },
    pptx: { exts: ['.pptx'], mimes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'], maxBytes: MAX_SINGLE_FILE_BYTES },
    ppt:  { exts: ['.ppt'], mimes: ['application/vnd.ms-powerpoint'], maxBytes: MAX_SINGLE_FILE_BYTES },
    xlsx: { exts: ['.xlsx'], mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], maxBytes: MAX_SINGLE_FILE_BYTES },
    xls:  { exts: ['.xls'], mimes: ['application/vnd.ms-excel'], maxBytes: MAX_SINGLE_FILE_BYTES },
    csv:  { exts: ['.csv'], mimes: ['text/csv', 'application/csv', 'text/plain'], maxBytes: MAX_SINGLE_FILE_BYTES },
    txt:  { exts: ['.txt'], mimes: ['text/plain'], maxBytes: MAX_SINGLE_FILE_BYTES },
    md:   { exts: ['.md', '.markdown'], mimes: ['text/markdown', 'text/plain'], maxBytes: MAX_SINGLE_FILE_BYTES },
    json: { exts: ['.json'], mimes: ['application/json', 'text/json', 'text/plain'], maxBytes: MAX_SINGLE_FILE_BYTES },
    xml:  { exts: ['.xml'], mimes: ['application/xml', 'text/xml'], maxBytes: MAX_SINGLE_FILE_BYTES },
    jpg:  { exts: ['.jpg', '.jpeg'], mimes: ['image/jpeg', 'image/jpg'], maxBytes: 15 * 1024 * 1024 },
    png:  { exts: ['.png'], mimes: ['image/png'], maxBytes: 15 * 1024 * 1024 },
    webp: { exts: ['.webp'], mimes: ['image/webp'], maxBytes: 15 * 1024 * 1024 },
    zip:  { exts: ['.zip'], mimes: ['application/zip', 'application/x-zip-compressed'], maxBytes: MAX_ARCHIVE_BYTES },
    html: { exts: ['.html', '.htm'], mimes: ['text/html'], maxBytes: MAX_SINGLE_FILE_BYTES }
  };

  function toUint8(input) {
    if (!input) return new Uint8Array(0);
    if (input instanceof Uint8Array) return input;
    if (typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) return new Uint8Array(input);
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
      return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    if (Array.isArray(input)) return new Uint8Array(input);
    if (typeof input === 'string') return utf8Encode(input);
    return new Uint8Array(0);
  }

  function utf8Encode(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(str || ''));
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(String(str || ''), 'utf8'));
    const out = [];
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0xff);
    return new Uint8Array(out);
  }

  function decodeBytes(bytes, encoding = 'utf-8') {
    const u8 = toUint8(bytes);
    if (!u8.length) return '';
    // Check UTF-16 BOM
    if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) {
      return decodeUtf16(u8.subarray(2), true);
    }
    if (u8.length >= 2 && u8[0] === 0xfe && u8[1] === 0xff) {
      return decodeUtf16(u8.subarray(2), false);
    }
    if (typeof TextDecoder !== 'undefined') {
      try {
        return new TextDecoder(encoding, { fatal: false }).decode(u8);
      } catch (e) {}
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength).toString(encoding === 'latin1' ? 'latin1' : 'utf8');
    }
    let out = '';
    for (let i = 0; i < u8.length; i++) out += String.fromCharCode(u8[i]);
    return out;
  }

  function decodeUtf16(u8, littleEndian = true) {
    let out = '';
    for (let i = 0; i + 1 < u8.length; i += 2) {
      const code = littleEndian ? (u8[i] | (u8[i + 1] << 8)) : ((u8[i] << 8) | u8[i + 1]);
      if (code !== 0) out += String.fromCharCode(code);
    }
    return out;
  }

  function asciiAt(u8, start, len) {
    let s = '';
    const end = Math.min(u8.length, start + len);
    for (let i = start; i < end; i++) s += String.fromCharCode(u8[i]);
    return s;
  }

  function readU16LE(u8, off) {
    return u8[off] | (u8[off + 1] << 8);
  }

  function readU32LE(u8, off) {
    return (u8[off] | (u8[off + 1] << 8) | (u8[off + 2] << 16) | (u8[off + 3] << 24)) >>> 0;
  }

  function getExtension(filename) {
    const clean = String(filename || '').trim().toLowerCase().split('?')[0];
    const base = clean.split(/[/\\]/).pop() || '';
    const idx = base.lastIndexOf('.');
    return idx > 0 ? base.slice(idx) : '';
  }

  function hasDangerousDoubleExtension(filename) {
    const base = String(filename || '').trim().toLowerCase().split(/[/\\]/).pop() || '';
    const parts = base.split('.').filter(Boolean);
    if (parts.length < 3) return false;
    return parts.slice(1).some((p) => BLOCKED_EXTENSIONS.has('.' + p));
  }

  function detectExecutableHeader(u8) {
    if (!u8 || u8.length < 2) return null;
    if (u8[0] === 0x4d && u8[1] === 0x5a) return 'PE/Windows Executable (MZ header)';
    if (u8.length >= 4 && u8[0] === 0x7f && u8[1] === 0x45 && u8[2] === 0x4c && u8[3] === 0x46) return 'ELF Binary Executable';
    if (u8.length >= 4 && (
      (u8[0] === 0xfe && u8[1] === 0xed && u8[2] === 0xfa && (u8[3] === 0xce || u8[3] === 0xcf)) ||
      (u8[0] === 0xca && u8[1] === 0xfe && u8[2] === 0xba && u8[3] === 0xbe)
    )) return 'Mach-O / Java Class Executable';
    if (u8[0] === 0x23 && u8[1] === 0x21) {
      const firstLine = asciiAt(u8, 0, 48).toLowerCase();
      if (firstLine.includes('/bin/') || firstLine.includes('python') || firstLine.includes('bash') || firstLine.includes('sh')) {
        return 'Shell / Script Executable (#!)';
      }
    }
    return null;
  }

  function isOle2Header(u8) {
    if (!u8 || u8.length < 8) return false;
    const sig = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    for (let i = 0; i < 8; i++) if (u8[i] !== sig[i]) return false;
    return true;
  }

  function isZipHeader(u8) {
    if (!u8 || u8.length < 4) return false;
    return u8[0] === 0x50 && u8[1] === 0x4b && (
      (u8[2] === 0x03 && u8[3] === 0x04) ||
      (u8[2] === 0x05 && u8[3] === 0x06)
    );
  }

  function isMostlyPrintableText(u8) {
    const sampleLen = Math.min(u8.length, 4096);
    if (sampleLen === 0) return false;
    // Allow UTF-16 BOM
    if ((u8[0] === 0xff && u8[1] === 0xfe) || (u8[0] === 0xfe && u8[1] === 0xff)) return true;
    let controlCount = 0;
    for (let i = 0; i < sampleLen; i++) {
      const b = u8[i];
      if (b === 0) return false; // NUL byte in UTF-8 text indicates binary spoof
      if (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d) controlCount++;
    }
    return controlCount / sampleLen < 0.05;
  }

  /**
   * Pure-JS RFC 1951 Inflate (stored + fixed Huffman + dynamic Huffman)
   * Used when Node zlib is absent (browser synchronous stream decompression).
   */
  const FIXED_LIT_LEN = (() => {
    const lens = new Uint8Array(288);
    for (let i = 0; i <= 143; i++) lens[i] = 8;
    for (let i = 144; i <= 255; i++) lens[i] = 9;
    for (let i = 256; i <= 279; i++) lens[i] = 7;
    for (let i = 280; i <= 287; i++) lens[i] = 8;
    return lens;
  })();
  const FIXED_DIST_LEN = new Uint8Array(32).fill(5);
  const LEN_BASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
  const LEN_EXTRA = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  const DIST_BASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
  const DIST_EXTRA = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  const CL_ORDER = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];

  function buildHuffmanTable(lengths) {
    let maxBits = 0;
    for (let i = 0; i < lengths.length; i++) if (lengths[i] > maxBits) maxBits = lengths[i];
    if (maxBits === 0) return { maxBits: 0, table: new Int32Array(0) };
    const counts = new Int32Array(maxBits + 1);
    for (let i = 0; i < lengths.length; i++) if (lengths[i] > 0) counts[lengths[i]]++;
    const offsets = new Int32Array(maxBits + 1);
    let code = 0;
    for (let bits = 1; bits <= maxBits; bits++) {
      code = (code + counts[bits - 1]) << 1;
      offsets[bits] = code;
    }
    const tableSize = 1 << maxBits;
    const table = new Int32Array(tableSize).fill(-1);
    for (let sym = 0; sym < lengths.length; sym++) {
      const len = lengths[sym];
      if (len === 0) continue;
      const c = offsets[len]++;
      let rev = 0;
      for (let b = 0; b < len; b++) rev = (rev << 1) | ((c >>> b) & 1);
      const val = (sym << 5) | len;
      const step = 1 << len;
      for (let idx = rev; idx < tableSize; idx += step) table[idx] = val;
    }
    return { maxBits, table };
  }

  function inflateRawPureJS(src, maxOutBytes = MAX_ZIP_UNCOMPRESSED_BYTES) {
    const u8 = toUint8(src);
    let pos = 0;
    let bitBuf = 0;
    let bitCnt = 0;
    const out = [];

    function ensureBits(n) {
      while (bitCnt < n) {
        if (pos >= u8.length) throw new Error('Truncated deflate stream');
        bitBuf |= u8[pos++] << bitCnt;
        bitCnt += 8;
      }
    }
    function readBits(n) {
      if (n === 0) return 0;
      ensureBits(n);
      const v = bitBuf & ((1 << n) - 1);
      bitBuf >>>= n;
      bitCnt -= n;
      return v;
    }
    function decodeSym(ht) {
      ensureBits(ht.maxBits);
      const entry = ht.table[bitBuf & ((1 << ht.maxBits) - 1)];
      if (entry < 0) throw new Error('Invalid Huffman symbol in deflate stream');
      const len = entry & 31;
      bitBuf >>>= len;
      bitCnt -= len;
      return entry >>> 5;
    }

    let bfinal = 0;
    do {
      bfinal = readBits(1);
      const btype = readBits(2);
      if (btype === 0) {
        bitBuf = 0; bitCnt = 0;
        if (pos + 4 > u8.length) throw new Error('Truncated stored deflate block');
        const len = readU16LE(u8, pos);
        const nlen = readU16LE(u8, pos + 2);
        pos += 4;
        if ((len ^ 0xffff) !== nlen) throw new Error('Corrupt stored block length');
        if (pos + len > u8.length) throw new Error('Truncated stored block data');
        if (out.length + len > maxOutBytes) throw new Error('Decompressed size limit exceeded (ZIP bomb protection)');
        for (let i = 0; i < len; i++) out.push(u8[pos++]);
      } else if (btype === 1 || btype === 2) {
        let litTable, distTable;
        if (btype === 1) {
          litTable = buildHuffmanTable(FIXED_LIT_LEN);
          distTable = buildHuffmanTable(FIXED_DIST_LEN);
        } else {
          const hlit = readBits(5) + 257;
          const hdist = readBits(5) + 1;
          const hclen = readBits(4) + 4;
          const clLens = new Uint8Array(19);
          for (let i = 0; i < hclen; i++) clLens[CL_ORDER[i]] = readBits(3);
          const clTable = buildHuffmanTable(clLens);
          const allLens = new Uint8Array(hlit + hdist);
          let idx = 0;
          while (idx < hlit + hdist) {
            const s = decodeSym(clTable);
            if (s < 16) {
              allLens[idx++] = s;
            } else if (s === 16) {
              const rep = 3 + readBits(2);
              const prev = idx > 0 ? allLens[idx - 1] : 0;
              for (let r = 0; r < rep && idx < allLens.length; r++) allLens[idx++] = prev;
            } else if (s === 17) {
              const rep = 3 + readBits(3);
              for (let r = 0; r < rep && idx < allLens.length; r++) allLens[idx++] = 0;
            } else if (s === 18) {
              const rep = 11 + readBits(7);
              for (let r = 0; r < rep && idx < allLens.length; r++) allLens[idx++] = 0;
            }
          }
          litTable = buildHuffmanTable(allLens.subarray(0, hlit));
          distTable = buildHuffmanTable(allLens.subarray(hlit));
        }
        while (true) {
          const sym = decodeSym(litTable);
          if (sym < 256) {
            out.push(sym);
            if (out.length > maxOutBytes) throw new Error('Decompressed size limit exceeded (ZIP bomb protection)');
          } else if (sym === 256) {
            break;
          } else {
            const lIdx = sym - 257;
            if (lIdx >= LEN_BASE.length) throw new Error('Invalid length symbol');
            const length = LEN_BASE[lIdx] + readBits(LEN_EXTRA[lIdx]);
            const dSym = decodeSym(distTable);
            if (dSym >= DIST_BASE.length) throw new Error('Invalid distance symbol');
            const dist = DIST_BASE[dSym] + readBits(DIST_EXTRA[dSym]);
            if (dist > out.length) throw new Error('Invalid back-reference distance');
            if (out.length + length > maxOutBytes) throw new Error('Decompressed size limit exceeded (ZIP bomb protection)');
            for (let k = 0; k < length; k++) out.push(out[out.length - dist]);
          }
        }
      } else {
        throw new Error('Reserved deflate block type');
      }
    } while (!bfinal);

    return new Uint8Array(out);
  }

  function inflateRawSync(bytes, maxOutBytes = MAX_ZIP_UNCOMPRESSED_BYTES) {
    const u8 = toUint8(bytes);
    if (nodeZlib) {
      const res = nodeZlib.inflateRawSync(u8, { maxOutputLength: maxOutBytes });
      return toUint8(res);
    }
    return inflateRawPureJS(u8, maxOutBytes);
  }

  function inflateZlibSync(bytes, maxOutBytes = MAX_ZIP_UNCOMPRESSED_BYTES) {
    const u8 = toUint8(bytes);
    if (nodeZlib) {
      const res = nodeZlib.inflateSync(u8, { maxOutputLength: maxOutBytes });
      return toUint8(res);
    }
    if (u8.length < 6) throw new Error('Invalid zlib stream');
    const cmf = u8[0];
    const flg = u8[1];
    if ((cmf & 0x0f) !== 8 || ((cmf * 256 + flg) % 31) !== 0) {
      throw new Error('Unsupported zlib header');
    }
    const offset = (flg & 0x20) ? 6 : 2;
    return inflateRawPureJS(u8.subarray(offset, u8.length - 4), maxOutBytes);
  }

  /**
   * Safe ZIP archive reader with Path Traversal and ZIP Bomb protection.
   */
  function parseZipArchive(bytes, options = {}) {
    const u8 = toUint8(bytes);
    const maxEntries = options.maxEntries || MAX_ZIP_ENTRIES;
    const maxTotalUncompressed = options.maxTotalUncompressed || MAX_ZIP_UNCOMPRESSED_BYTES;
    const maxRatio = options.maxRatio || MAX_ZIP_RATIO;

    if (!isZipHeader(u8)) throw new Error('Invalid ZIP archive signature');

    // Locate End of Central Directory (PK\x05\x06) from end
    let eocdOffset = -1;
    const minOff = Math.max(0, u8.length - 65557);
    for (let i = u8.length - 22; i >= minOff; i--) {
      if (u8[i] === 0x50 && u8[i + 1] === 0x4b && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) {
        eocdOffset = i;
        break;
      }
    }
    if (eocdOffset < 0) throw new Error('Corrupt ZIP archive: missing End of Central Directory');

    const totalEntries = readU16LE(u8, eocdOffset + 10);
    const cdSize = readU32LE(u8, eocdOffset + 12);
    const cdOffset = readU32LE(u8, eocdOffset + 16);

    if (totalEntries > maxEntries) {
      throw new Error(`Security rejection: Archive contains ${totalEntries} entries (limit ${maxEntries}).`);
    }
    if (cdOffset + cdSize > u8.length) {
      throw new Error('Corrupt ZIP archive: Central Directory out of bounds');
    }

    const entries = [];
    let ptr = cdOffset;
    let totalDeclaredUncompressed = 0;

    for (let i = 0; i < totalEntries && ptr + 46 <= cdOffset + cdSize; i++) {
      if (readU32LE(u8, ptr) !== 0x02014b50) {
        throw new Error('Corrupt ZIP Central Directory entry');
      }
      const flags = readU16LE(u8, ptr + 8);
      const method = readU16LE(u8, ptr + 10);
      const compSize = readU32LE(u8, ptr + 20);
      const uncompSize = readU32LE(u8, ptr + 24);
      const nameLen = readU16LE(u8, ptr + 28);
      const extraLen = readU16LE(u8, ptr + 30);
      const commentLen = readU16LE(u8, ptr + 32);
      const extAttr = readU32LE(u8, ptr + 38);
      const localHeaderOffset = readU32LE(u8, ptr + 42);
      const nameBytes = u8.subarray(ptr + 46, ptr + 46 + nameLen);
      const entryName = decodeBytes(nameBytes, 'utf-8');
      ptr += 46 + nameLen + extraLen + commentLen;

      // Path traversal & symlink protection
      if (
        entryName.includes('..') ||
        entryName.startsWith('/') ||
        entryName.startsWith('\\') ||
        /^[a-zA-Z]:/.test(entryName) ||
        entryName.includes('\0')
      ) {
        throw new Error(`Security violation (Path Traversal blocked): "${entryName}"`);
      }

      // Unix symlink bit check (0120000 << 16)
      if (((extAttr >>> 16) & 0o170000) === 0o120000) {
        throw new Error(`Security violation (Symlink blocked in archive): "${entryName}"`);
      }

      if (entryName.endsWith('/')) continue; // Directory entry

      if (flags & 0x01) {
        throw new Error(`Encrypted archive entry not allowed: "${entryName}"`);
      }

      totalDeclaredUncompressed += uncompSize;
      if (totalDeclaredUncompressed > maxTotalUncompressed) {
        throw new Error('Security rejection: Archive exceeds maximum 50MB uncompressed quota (ZIP bomb protection).');
      }
      if (compSize > 0 && uncompSize / compSize > maxRatio) {
        throw new Error(`Security rejection: Extreme compression ratio (${Math.round(uncompSize / compSize)}:1) flagged as potential ZIP bomb.`);
      }

      if (localHeaderOffset + 30 > u8.length || readU32LE(u8, localHeaderOffset) !== 0x04034b50) {
        throw new Error(`Corrupt local file header for "${entryName}"`);
      }
      const lNameLen = readU16LE(u8, localHeaderOffset + 26);
      const lExtraLen = readU16LE(u8, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
      const dataEnd = dataStart + compSize;
      if (dataEnd > u8.length) {
        throw new Error(`Truncated archive payload for "${entryName}"`);
      }
      const compSlice = u8.subarray(dataStart, dataEnd);
      let fileBytes;
      if (method === 0) {
        fileBytes = compSlice;
      } else if (method === 8) {
        const remainingQuota = Math.max(1024, maxTotalUncompressed - (totalDeclaredUncompressed - uncompSize));
        fileBytes = inflateRawSync(compSlice, Math.min(maxTotalUncompressed, Math.max(uncompSize * 2 + 1024, remainingQuota)));
      } else {
        throw new Error(`Unsupported ZIP compression method (${method}) for "${entryName}"`);
      }

      if (compSize > 0 && fileBytes.length / compSize > maxRatio) {
        throw new Error(`Security rejection: Actual compression ratio exceeded ${maxRatio}:1 on "${entryName}".`);
      }

      entries.push({ name: entryName, bytes: fileBytes, compressedSize: compSize, size: fileBytes.length });
    }

    return entries;
  }

  /**
   * Signature + Extension + MIME Verification
   */
  function identifyAndVerifyFile(filename, mimeType, bytes) {
    const u8 = toUint8(bytes);
    const cleanName = String(filename || '').trim();
    const ext = getExtension(cleanName);

    if (!cleanName || cleanName.length > 255) {
      return { valid: false, reason: 'Invalid filename.', code: 'INVALID_FILENAME' };
    }
    if (u8.length === 0) {
      return { valid: false, reason: 'File is empty (0 bytes).', code: 'EMPTY_FILE' };
    }
    if (BLOCKED_EXTENSIONS.has(ext) || hasDangerousDoubleExtension(cleanName)) {
      return {
        valid: false,
        quarantine: true,
        reason: `Executable or dangerous file extension blocked (${ext || cleanName}).`,
        code: 'BLOCKED_EXECUTABLE_EXTENSION'
      };
    }

    const execSig = detectExecutableHeader(u8);
    if (execSig) {
      return {
        valid: false,
        quarantine: true,
        reason: `Malicious or executable binary signature detected: ${execSig}`,
        code: 'EXECUTABLE_SIGNATURE_DETECTED'
      };
    }

    // Determine canonical format from extension & signature
    let format = null;
    for (const [key, spec] of Object.entries(SUPPORTED_FORMATS)) {
      if (spec.exts.includes(ext)) {
        format = key;
        break;
      }
    }

    if (!format) {
      return {
        valid: false,
        reason: `Unsupported file extension "${ext || '(none)'}".`,
        code: 'UNSUPPORTED_EXTENSION'
      };
    }

    const maxBytes = SUPPORTED_FORMATS[format].maxBytes;
    if (u8.length > maxBytes) {
      return {
        valid: false,
        reason: `File size (${(u8.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum ${Math.round(maxBytes / (1024 * 1024))} MB limit.`,
        code: 'FILE_TOO_LARGE'
      };
    }

    // Verify true binary/content signature against declared format
    if (format === 'pdf') {
      const head = asciiAt(u8, 0, 1024);
      if (!head.includes('%PDF-')) {
        return { valid: false, quarantine: true, reason: 'File signature does not match %PDF- header.', code: 'SPOOFED_SIGNATURE' };
      }
    } else if (format === 'jpg') {
      if (!(u8.length >= 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff)) {
        return { valid: false, quarantine: true, reason: 'Invalid JPEG magic bytes.', code: 'SPOOFED_SIGNATURE' };
      }
    } else if (format === 'png') {
      const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      if (u8.length < 8 || !pngSig.every((b, idx) => u8[idx] === b)) {
        return { valid: false, quarantine: true, reason: 'Invalid PNG magic bytes.', code: 'SPOOFED_SIGNATURE' };
      }
    } else if (format === 'webp') {
      if (u8.length < 12 || asciiAt(u8, 0, 4) !== 'RIFF' || asciiAt(u8, 8, 4) !== 'WEBP') {
        return { valid: false, quarantine: true, reason: 'Invalid WEBP RIFF/WEBP signature.', code: 'SPOOFED_SIGNATURE' };
      }
    } else if (format === 'docx' || format === 'pptx' || format === 'xlsx' || format === 'zip') {
      if (!isZipHeader(u8)) {
        return { valid: false, quarantine: true, reason: `Invalid ZIP/OOXML PK signature for .${format} file.`, code: 'SPOOFED_SIGNATURE' };
      }
    } else if (format === 'doc' || format === 'ppt' || format === 'xls') {
      // Allow OLE2 binary OR RTF/XML-saved-as-doc/html text fallback if genuine printable text
      const headAscii = asciiAt(u8, 0, 32);
      if (!isOle2Header(u8) && !headAscii.startsWith('{\\rtf') && !isMostlyPrintableText(u8)) {
        return { valid: false, quarantine: true, reason: `Invalid OLE2 binary signature for .${format} file.`, code: 'SPOOFED_SIGNATURE' };
      }
    } else if (['txt', 'md', 'csv', 'json', 'xml', 'html'].includes(format)) {
      if (!isMostlyPrintableText(u8)) {
        return { valid: false, quarantine: true, reason: `Binary payload disguised as text (.${format}) rejected.`, code: 'SPOOFED_TEXT_BINARY' };
      }
    }

    return {
      valid: true,
      format,
      ext,
      sizeBytes: u8.length,
      mimeType: mimeType || SUPPORTED_FORMATS[format].mimes[0]
    };
  }

  function decodeXmlEntities(str) {
    return String(str || '')
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  }

  function stripXmlTags(xml) {
    return decodeXmlEntities(String(xml || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  }

  /**
   * Extract DOCX text, headings, and tables
   */
  function extractDocx(bytes) {
    const entries = parseZipArchive(bytes);
    const hasMacros = entries.some((e) => /vbaProject\.bin$/i.test(e.name));
    if (hasMacros) {
      return { quarantine: true, reason: 'DOCX contains embedded VBA macro payload (vbaProject.bin).', code: 'OFFICE_MACRO_DETECTED' };
    }
    const docEntry = entries.find((e) => e.name === 'word/document.xml');
    if (!docEntry) throw new Error('Invalid DOCX structure: word/document.xml not found.');

    const xml = decodeBytes(docEntry.bytes, 'utf-8');
    const tables = [];
    const tableBlocks = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
    for (let t = 0; t < tableBlocks.length; t++) {
      const rows = [];
      const trs = tableBlocks[t].match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
      for (const tr of trs) {
        const cells = [];
        const tcs = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
        for (const tc of tcs) {
          const texts = (tc.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || []).map(stripXmlTags).filter(Boolean);
          cells.push(texts.join(' '));
        }
        if (cells.length) rows.push(cells);
      }
      if (rows.length) {
        tables.push({ title: `Table ${t + 1}`, headers: rows[0], rows: rows.slice(1) });
      }
    }

    // Extract paragraphs cleanly
    const paras = [];
    const pBlocks = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
    for (const p of pBlocks) {
      const tMatches = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const line = tMatches.map(stripXmlTags).join('').trim();
      if (line) paras.push(line);
    }

    // Also inspect headers/footers
    for (const extra of entries.filter((e) => /^word\/(header|footer|footnotes)\d*\.xml$/i.test(e.name))) {
      const exXml = decodeBytes(extra.bytes, 'utf-8');
      const exText = (exXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || []).map(stripXmlTags).join(' ').trim();
      if (exText) paras.push(exText);
    }

    let title = '';
    const core = entries.find((e) => e.name === 'docProps/core.xml');
    if (core) {
      const m = decodeBytes(core.bytes, 'utf-8').match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
      if (m) title = stripXmlTags(m[1]);
    }

    return {
      text: paras.join('\n'),
      tables,
      metadata: { title, tableCount: tables.length, paragraphCount: paras.length }
    };
  }

  /**
   * Extract PPTX slides, notes, and tables
   */
  function extractPptx(bytes) {
    const entries = parseZipArchive(bytes);
    if (entries.some((e) => /vbaProject\.bin$/i.test(e.name))) {
      return { quarantine: true, reason: 'PPTX contains embedded VBA macro payload (vbaProject.bin).', code: 'OFFICE_MACRO_DETECTED' };
    }
    const slides = entries
      .filter((e) => /^ppt\/slides\/slide\d+\.xml$/i.test(e.name))
      .sort((a, b) => parseInt(a.name.match(/(\d+)/)[1], 10) - parseInt(b.name.match(/(\d+)/)[1], 10));

    if (!slides.length) throw new Error('Invalid PPTX structure: no slides found.');

    const sections = [];
    const tables = [];
    for (let i = 0; i < slides.length; i++) {
      const xml = decodeBytes(slides[i].bytes, 'utf-8');
      let paras = (xml.match(/<a:p[\s\S]*?<\/a:p>/g) || [])
        .map((p) => (p.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || []).map(stripXmlTags).join('').trim())
        .filter(Boolean);
      if (!paras.length) {
        paras = (xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || []).map(stripXmlTags).filter(Boolean);
      }
      if (paras.length) {
        sections.push(`[Slide ${i + 1}]\n${paras.join('\n')}`);
      }
      const tbls = xml.match(/<a:tbl[\s\S]*?<\/a:tbl>/g) || [];
      for (const tbl of tbls) {
        const rows = (tbl.match(/<a:tr[\s\S]*?<\/a:tr>/g) || []).map((tr) =>
          (tr.match(/<a:tc[\s\S]*?<\/a:tc>/g) || []).map((tc) =>
            (tc.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || []).map(stripXmlTags).join(' ').trim()
          )
        ).filter((r) => r.length);
        if (rows.length) tables.push({ title: `Slide ${i + 1} Table`, headers: rows[0], rows: rows.slice(1) });
      }
    }

    for (const note of entries.filter((e) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(e.name))) {
      const xml = decodeBytes(note.bytes, 'utf-8');
      const noteText = (xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || []).map(stripXmlTags).join(' ').trim();
      if (noteText) sections.push(`[Speaker Notes]\n${noteText}`);
    }

    return {
      text: sections.join('\n\n'),
      tables,
      metadata: { slideCount: slides.length, tableCount: tables.length }
    };
  }

  /**
   * Extract XLSX sheets, shared strings, and tables
   */
  function extractXlsx(bytes) {
    const entries = parseZipArchive(bytes);
    if (entries.some((e) => /vbaProject\.bin$/i.test(e.name))) {
      return { quarantine: true, reason: 'XLSX contains embedded VBA macro payload (vbaProject.bin).', code: 'OFFICE_MACRO_DETECTED' };
    }
    const sharedStrings = [];
    const ssEntry = entries.find((e) => e.name === 'xl/sharedStrings.xml');
    if (ssEntry) {
      const ssXml = decodeBytes(ssEntry.bytes, 'utf-8');
      const siBlocks = ssXml.match(/<si[\s\S]*?<\/si>/g) || [];
      for (const si of siBlocks) {
        const txt = (si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map(stripXmlTags).join('');
        sharedStrings.push(txt);
      }
    }

    const sheetNames = [];
    const wbEntry = entries.find((e) => e.name === 'xl/workbook.xml');
    if (wbEntry) {
      const wbXml = decodeBytes(wbEntry.bytes, 'utf-8');
      const sTags = wbXml.match(/<sheet\b[^>]*>/g) || [];
      for (const sTag of sTags) {
        const nm = sTag.match(/name="([^"]+)"/i);
        if (nm) sheetNames.push(decodeXmlEntities(nm[1]));
      }
    }

    const sheetEntries = entries
      .filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(e.name))
      .sort((a, b) => parseInt(a.name.match(/(\d+)/)[1], 10) - parseInt(b.name.match(/(\d+)/)[1], 10));

    if (!sheetEntries.length) throw new Error('Invalid XLSX structure: no worksheets found.');

    const textParts = [];
    const tables = [];
    let ddeDetected = false;

    for (let sIdx = 0; sIdx < sheetEntries.length; sIdx++) {
      const sheetName = sheetNames[sIdx] || `Sheet ${sIdx + 1}`;
      const xml = decodeBytes(sheetEntries[sIdx].bytes, 'utf-8');
      if (/=CMD\||=MSEXCEL\||=SHELL\(|DDEAUTO/i.test(xml)) ddeDetected = true;

      const rowMatches = xml.match(/<row\b[\s\S]*?<\/row>/g) || [];
      const rows = [];
      for (const rXml of rowMatches) {
        const cells = [];
        const cMatches = rXml.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || [];
        for (const cXml of cMatches) {
          const tMatch = cXml.match(/\bt="([^"]+)"/);
          const cellType = tMatch ? tMatch[1] : '';
          let val = '';
          if (cellType === 'inlineStr') {
            val = (cXml.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map(stripXmlTags).join('');
          } else {
            const vMatch = cXml.match(/<v>([\s\S]*?)<\/v>/);
            if (vMatch) {
              const rawV = decodeXmlEntities(vMatch[1]);
              val = cellType === 's' ? (sharedStrings[parseInt(rawV, 10)] || '') : rawV;
            }
          }
          cells.push(String(val).trim());
        }
        if (cells.some(Boolean)) rows.push(cells);
      }

      if (rows.length) {
        tables.push({ title: sheetName, headers: rows[0], rows: rows.slice(1) });
        const formatted = rows.map((r) => r.join(' | ')).join('\n');
        textParts.push(`[Sheet: ${sheetName}]\n${formatted}`);
      }
    }

    if (ddeDetected) {
      return { quarantine: true, reason: 'XLSX contains dangerous DDE/CMD formula injection.', code: 'SPREADSHEET_FORMULA_INJECTION' };
    }

    return {
      text: textParts.join('\n\n'),
      tables,
      metadata: { sheetCount: sheetEntries.length, tableCount: tables.length }
    };
  }

  /**
   * Minimal OLE2 CFB Stream Reader + Legacy DOC/PPT/XLS text extraction
   */
  function extractOle2Streams(bytes) {
    const u8 = toUint8(bytes);
    if (!isOle2Header(u8) || u8.length < 512) return null;

    const sectorShift = readU16LE(u8, 30);
    const sectorSize = 1 << Math.min(12, Math.max(9, sectorShift));
    const firstDirSec = readU32LE(u8, 48);
    const fat = [];
    for (let i = 0; i < 109; i++) {
      const secId = readU32LE(u8, 76 + i * 4);
      if (secId === 0xffffffff || secId === 0xfffffffe) break;
      const off = (secId + 1) * sectorSize;
      for (let j = 0; j < sectorSize / 4 && off + j * 4 + 4 <= u8.length; j++) {
        fat.push(readU32LE(u8, off + j * 4));
      }
    }

    const readChain = (startSec, maxBytes = 12 * 1024 * 1024) => {
      const chunks = [];
      let sec = startSec;
      let seen = 0;
      let total = 0;
      while (sec !== 0xfffffffe && sec !== 0xffffffff && seen < 16384 && total < maxBytes) {
        const off = (sec + 1) * sectorSize;
        if (off >= u8.length) break;
        const slice = u8.subarray(off, Math.min(u8.length, off + sectorSize));
        chunks.push(slice);
        total += slice.length;
        sec = fat[sec] !== undefined ? fat[sec] : 0xfffffffe;
        seen++;
      }
      const res = new Uint8Array(total);
      let pos = 0;
      for (const c of chunks) { res.set(c, pos); pos += c.length; }
      return res;
    };

    const dirBytes = readChain(firstDirSec, 1024 * 1024);
    const entries = [];
    for (let off = 0; off + 128 <= dirBytes.length; off += 128) {
      const nameLen = readU16LE(dirBytes, off + 64);
      const objType = dirBytes[off + 66];
      if (objType === 0 || nameLen < 2 || nameLen > 64) continue;
      const name = decodeUtf16(dirBytes.subarray(off, off + nameLen - 2), true);
      const startSec = readU32LE(dirBytes, off + 116);
      const size = readU32LE(dirBytes, off + 120);
      if (objType === 2 || objType === 1) {
        entries.push({ name, objType, startSec, size });
      }
    }

    return { entries, readChain };
  }

  function extractPrintableRuns(u8, minRun = 5) {
    const out = [];
    // UTF-16LE runs (supports ASCII + Kannada \u0C80-\u0CFF + Devanagari \u0900-\u097F)
    let cur16 = '';
    for (let i = 0; i + 1 < u8.length; i += 2) {
      const code = u8[i] | (u8[i + 1] << 8);
      const isOk = (code >= 0x20 && code <= 0x7e) || (code >= 0x0900 && code <= 0x097f) || (code >= 0x0c80 && code <= 0x0cff) || code === 0x0a || code === 0x0d;
      if (isOk) {
        cur16 += String.fromCharCode(code);
      } else {
        if (cur16.trim().length >= minRun) out.push(cur16.trim());
        cur16 = '';
      }
    }
    if (cur16.trim().length >= minRun) out.push(cur16.trim());

    // ASCII runs
    let cur8 = '';
    for (let i = 0; i < u8.length; i++) {
      const b = u8[i];
      if ((b >= 0x20 && b <= 0x7e) || b === 0x0a || b === 0x0d) {
        cur8 += String.fromCharCode(b);
      } else {
        if (cur8.trim().length >= minRun && !/^[A-Za-z0-9_]{1,8}$/.test(cur8.trim())) out.push(cur8.trim());
        cur8 = '';
      }
    }
    if (cur8.trim().length >= minRun) out.push(cur8.trim());
    return Array.from(new Set(out));
  }

  function extractLegacyOffice(bytes, format) {
    const u8 = toUint8(bytes);
    const head = asciiAt(u8, 0, 64);
    if (head.startsWith('{\\rtf')) {
      const stripped = decodeBytes(u8, 'utf-8')
        .replace(/\\par\b/g, '\n')
        .replace(/\\[a-z]+\d*\s?/gi, '')
        .replace(/[{}]/g, '')
        .trim();
      return { text: stripped, tables: [], metadata: { subFormat: 'rtf' } };
    }
    if (!isOle2Header(u8)) {
      return { text: decodeBytes(u8, 'utf-8').trim(), tables: [], metadata: { subFormat: 'text-fallback' } };
    }

    const cfb = extractOle2Streams(u8);
    if (!cfb) throw new Error(`Unable to parse OLE2 container for .${format}.`);

    const hasMacroStream = cfb.entries.some((e) => /^(vba|macros|_vba_project)/i.test(e.name));
    if (hasMacroStream) {
      return { quarantine: true, reason: `Legacy .${format} contains embedded VBA macros.`, code: 'OFFICE_MACRO_DETECTED' };
    }

    if (cfb.entries.some((e) => /EncryptedPackage|EncryptionInfo/i.test(e.name))) {
      throw new Error(`Document (.${format}) is password-encrypted and cannot be processed.`);
    }

    const parts = [];
    if (format === 'ppt') {
      const pptStreamEntry = cfb.entries.find((e) => e.name === 'PowerPoint Document');
      if (pptStreamEntry) {
        const sBytes = cfb.readChain(pptStreamEntry.startSec).subarray(0, pptStreamEntry.size);
        for (let i = 0; i + 8 <= sBytes.length; i++) {
          const recType = readU16LE(sBytes, i + 2);
          const recLen = readU32LE(sBytes, i + 4);
          if ((recType === 0x0fa0 || recType === 0x0fa8) && recLen > 0 && i + 8 + recLen <= sBytes.length) {
            const payload = sBytes.subarray(i + 8, i + 8 + recLen);
            const txt = recType === 0x0fa0 ? decodeUtf16(payload, true) : decodeBytes(payload, 'latin1');
            if (txt.trim()) parts.push(txt.trim());
            i += 7 + recLen;
          }
        }
      }
    }

    if (!parts.length) {
      const targetNames = format === 'doc' ? ['WordDocument'] : (format === 'xls' ? ['Workbook', 'Book'] : ['PowerPoint Document']);
      for (const entry of cfb.entries) {
        if (targetNames.includes(entry.name) || parts.length === 0) {
          if (entry.objType === 2 && entry.startSec < 0xfffffffe) {
            const streamData = cfb.readChain(entry.startSec).subarray(0, Math.min(entry.size, 4 * 1024 * 1024));
            const runs = extractPrintableRuns(streamData, 6)
              .filter((r) => !/^(Root Entry|WordDocument|1Table|0Table|SummaryInformation|DocumentSummaryInformation|CompObj|Workbook|PowerPoint Document|Current User)$/i.test(r));
            parts.push(...runs);
          }
        }
      }
    }

    const text = parts.join('\n').trim();
    if (!text) {
      throw new Error(`No readable text could be extracted from legacy .${format} binary.`);
    }
    return { text, tables: [], metadata: { container: 'ole2', streams: cfb.entries.map((e) => e.name) } };
  }

  /**
   * PDF Text, CMap, Metadata & Security Scanner
   */
  function unescapePdfString(raw) {
    let out = '';
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === '\\' && i + 1 < raw.length) {
        const nxt = raw[++i];
        if (nxt === 'n') out += '\n';
        else if (nxt === 'r') out += '\r';
        else if (nxt === 't') out += '\t';
        else if (nxt === 'b') out += '\b';
        else if (nxt === 'f') out += '\f';
        else if (/[0-7]/.test(nxt)) {
          let oct = nxt;
          while (oct.length < 3 && i + 1 < raw.length && /[0-7]/.test(raw[i + 1])) oct += raw[++i];
          out += String.fromCharCode(parseInt(oct, 8));
        } else {
          out += nxt;
        }
      } else {
        out += ch;
      }
    }
    // Check UTF-16BE BOM (\xFE\xFF)
    if (out.length >= 2 && out.charCodeAt(0) === 0xfe && out.charCodeAt(1) === 0xff) {
      let u16 = '';
      for (let j = 2; j + 1 < out.length; j += 2) {
        const code = (out.charCodeAt(j) << 8) | out.charCodeAt(j + 1);
        if (code) u16 += String.fromCharCode(code);
      }
      return u16;
    }
    // Attempt UTF-8 decode if high bytes are present
    if (/[\x80-\xff]/.test(out)) {
      try {
        const bytes = new Uint8Array(out.length);
        for (let k = 0; k < out.length; k++) bytes[k] = out.charCodeAt(k) & 0xff;
        if (typeof TextDecoder !== 'undefined') {
          return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        }
        if (typeof Buffer !== 'undefined') {
          return Buffer.from(bytes).toString('utf8');
        }
      } catch (e) {}
    }
    return out;
  }

  function decodePdfHex(hexStr, cmap) {
    const clean = hexStr.replace(/\s+/g, '');
    if (clean.length >= 4 && clean.startsWith('FEFF')) {
      let out = '';
      for (let i = 4; i + 3 < clean.length; i += 4) {
        out += String.fromCharCode(parseInt(clean.slice(i, i + 4), 16));
      }
      return out;
    }
    if (cmap && cmap.size > 0) {
      let out = '';
      const step = clean.length % 4 === 0 ? 4 : 2;
      for (let i = 0; i + step <= clean.length; i += step) {
        const code = clean.slice(i, i + step).toUpperCase();
        if (cmap.has(code)) out += cmap.get(code);
        else out += String.fromCharCode(parseInt(code, 16));
      }
      return out;
    }
    let out = '';
    for (let i = 0; i + 1 < clean.length; i += 2) {
      const code = parseInt(clean.slice(i, i + 2), 16);
      if (code >= 0x20 || code === 0x0a || code === 0x09) out += String.fromCharCode(code);
    }
    return out;
  }

  function parseToUnicodeCMap(text, cmap) {
    const bfcharBlocks = text.match(/beginbfchar[\s\S]*?endbfchar/g) || [];
    for (const blk of bfcharBlocks) {
      const pairs = blk.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g);
      for (const m of pairs) {
        const src = m[1].toUpperCase();
        const dstHex = m[2];
        let unicode = '';
        for (let i = 0; i + 3 < dstHex.length; i += 4) {
          unicode += String.fromCharCode(parseInt(dstHex.slice(i, i + 4), 16));
        }
        if (unicode) cmap.set(src, unicode);
      }
    }
  }

  function extractPdfTextOperators(streamStr, cmap) {
    const parts = [];
    const btBlocks = streamStr.match(/BT[\s\S]*?ET/g) || [streamStr];
    for (const blk of btBlocks) {
      let line = '';
      // Match literal (...) or hex <...> followed by Tj, ', ", or arrays [...] TJ
      const opRegex = /\(((?:\\.|[^\\()])*)\)\s*(?:Tj|'|")|<([0-9a-fA-F\s]+)>\s*Tj|\[([\s\S]*?)\]\s*TJ/g;
      let m;
      while ((m = opRegex.exec(blk)) !== null) {
        if (m[1] !== undefined) {
          line += unescapePdfString(m[1]);
        } else if (m[2] !== undefined) {
          line += decodePdfHex(m[2], cmap);
        } else if (m[3] !== undefined) {
          const arrItems = m[3].matchAll(/\(((?:\\.|[^\\()])*)\)|<([0-9a-fA-F\s]+)>|(-?\d+(?:\.\d+)?)/g);
          for (const it of arrItems) {
            if (it[1] !== undefined) line += unescapePdfString(it[1]);
            else if (it[2] !== undefined) line += decodePdfHex(it[2], cmap);
            else if (it[3] !== undefined && parseFloat(it[3]) < -120) line += ' ';
          }
        }
      }
      if (line.trim()) parts.push(line.trim());
    }
    return parts.join('\n');
  }

  function extractPdf(bytes) {
    const u8 = toUint8(bytes);
    const rawLatin = decodeBytes(u8, 'latin1');

    // Security inspection for active PDF threats
    const threatMatches = [];
    if (/\/JavaScript\b|\/JS\s*\(/i.test(rawLatin)) threatMatches.push('/JavaScript');
    if (/\/Launch\b/i.test(rawLatin)) threatMatches.push('/Launch');
    if (/\/OpenAction\b[\s\S]{0,120}\/(JavaScript|JS|Launch|URI)/i.test(rawLatin)) threatMatches.push('/OpenAction active payload');
    if (/\/Encrypt\b/i.test(rawLatin)) {
      throw new Error('PDF is password-encrypted and cannot be extracted automatically.');
    }
    if (threatMatches.length > 0) {
      return {
        quarantine: true,
        reason: `Suspicious active PDF actions detected (${threatMatches.join(', ')}).`,
        code: 'PDF_ACTIVE_SCRIPT_THREAT'
      };
    }

    const cmap = new Map();
    const textChunks = [];
    const hasEmbeddedImages = /\/Subtype\s*\/Image\b/i.test(rawLatin);

    // Extract streams
    let cursor = 0;
    while (cursor < rawLatin.length) {
      const sIdx = rawLatin.indexOf('stream', cursor);
      if (sIdx < 0) break;
      let dataStart = sIdx + 6;
      if (rawLatin[dataStart] === '\r' && rawLatin[dataStart + 1] === '\n') dataStart += 2;
      else if (rawLatin[dataStart] === '\n' || rawLatin[dataStart] === '\r') dataStart += 1;

      const eIdx = rawLatin.indexOf('endstream', dataStart);
      if (eIdx < 0) break;

      const dictBefore = rawLatin.slice(Math.max(0, sIdx - 400), sIdx);
      let streamBytes = u8.subarray(dataStart, eIdx);
      while (streamBytes.length > 0 && (streamBytes[streamBytes.length - 1] === 0x0a || streamBytes[streamBytes.length - 1] === 0x0d)) {
        streamBytes = streamBytes.subarray(0, streamBytes.length - 1);
      }

      const isImageStream = /\/Subtype\s*\/Image\b/i.test(dictBefore) || /\/DCTDecode\b/i.test(dictBefore);
      if (!isImageStream) {
        let decodedBytes = streamBytes;
        if (/\/FlateDecode\b/i.test(dictBefore)) {
          try {
            decodedBytes = inflateZlibSync(streamBytes, 15 * 1024 * 1024);
          } catch (e) {
            decodedBytes = streamBytes;
          }
        }
        const sText = decodeBytes(decodedBytes, 'latin1');
        if (sText.includes('beginbfchar')) parseToUnicodeCMap(sText, cmap);
        if (sText.includes('BT') || sText.includes('Tj') || sText.includes('TJ')) {
          const extracted = extractPdfTextOperators(sText, cmap);
          if (extracted) textChunks.push(extracted);
        }
      }
      cursor = eIdx + 9;
    }

    // Also scan direct uncompressed text outside streams if none found
    if (textChunks.length === 0 && rawLatin.includes('BT') && (rawLatin.includes('Tj') || rawLatin.includes('TJ'))) {
      const direct = extractPdfTextOperators(rawLatin, cmap);
      if (direct) textChunks.push(direct);
    }

    const titleMatch = rawLatin.match(/\/Title\s*\(((?:\\.|[^\\()])*)\)/);
    const title = titleMatch ? unescapePdfString(titleMatch[1]).trim() : '';
    const pageCount = (rawLatin.match(/\/Type\s*\/Page\b(?!s)/g) || []).length || 1;
    const combinedText = textChunks.join('\n').trim();

    return {
      text: combinedText,
      tables: [],
      needsOcr: combinedText.length < 25,
      hasEmbeddedImages,
      metadata: { title, pageCount, isScanned: combinedText.length < 25 }
    };
  }

  /**
   * RFC-4180 CSV parser + formula injection protection
   */
  function extractCsv(text) {
    const clean = String(text || '').replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      if (inQuotes) {
        if (ch === '"' && clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (ch === '\r' && clean[i + 1] === '\n') {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
    if (cell.length > 0 || row.length > 0) {
      row.push(cell.trim());
      rows.push(row);
    }

    const nonEmpty = rows.filter((r) => r.some(Boolean));
    const formulaThreat = nonEmpty.some((r) => r.some((c) => /^[=+\-@](?:CMD|MSEXCEL|SHELL|HYPERLINK|IMPORTXML)/i.test(c)));
    if (formulaThreat) {
      return { quarantine: true, reason: 'CSV contains potentially malicious DDE/formula command injection.', code: 'CSV_FORMULA_INJECTION' };
    }

    const headers = nonEmpty[0] || [];
    const dataRows = nonEmpty.slice(1);
    const tables = nonEmpty.length ? [{ title: 'CSV Table', headers, rows: dataRows }] : [];
    const lines = nonEmpty.map((r) => r.join(' | '));
    return {
      text: lines.join('\n'),
      tables,
      metadata: { rowCount: dataRows.length, columnCount: headers.length }
    };
  }

  /**
   * ChatGPT Export & JSON Extractor
   */
  function extractChatGptConversationNode(conv) {
    const title = conv.title || 'ChatGPT Conversation';
    const lines = [`# ${title}`];
    if (conv.mapping && typeof conv.mapping === 'object') {
      const nodes = Object.values(conv.mapping)
        .filter((n) => n && n.message && n.message.content)
        .sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));
      for (const n of nodes) {
        const role = n.message.author?.role || 'unknown';
        if (role === 'system' && n.message.metadata?.is_visually_hidden_from_conversation) continue;
        const parts = Array.isArray(n.message.content.parts)
          ? n.message.content.parts.map((p) => (typeof p === 'string' ? p : (p?.text || ''))).filter(Boolean)
          : [];
        const body = parts.join('\n').trim();
        if (body) lines.push(`[${role.toUpperCase()}]: ${body}`);
      }
    } else if (Array.isArray(conv.messages)) {
      for (const m of conv.messages) {
        const role = m.role || m.author || 'user';
        const body = typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content.join('\n') : '');
        if (body.trim()) lines.push(`[${String(role).toUpperCase()}]: ${body.trim()}`);
      }
    }
    return lines.join('\n\n');
  }

  function flattenJsonValue(val, prefix = '', out = []) {
    if (val === null || val === undefined) return out;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      out.push(prefix ? `${prefix}: ${val}` : String(val));
    } else if (Array.isArray(val)) {
      val.forEach((item, idx) => flattenJsonValue(item, `${prefix}[${idx}]`, out));
    } else if (typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) {
        flattenJsonValue(v, prefix ? `${prefix}.${k}` : k, out);
      }
    }
    return out;
  }

  function extractJsonOrChatGpt(text) {
    const parsed = JSON.parse(String(text || ''));
    const isConvArray = Array.isArray(parsed) && parsed.some((it) => it && (it.mapping || Array.isArray(it.messages)));
    const isSingleConv = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.mapping || Array.isArray(parsed.messages));

    if (isConvArray) {
      const threads = parsed.map(extractChatGptConversationNode).filter(Boolean);
      return {
        text: threads.join('\n\n---\n\n'),
        tables: [],
        isChatGptExport: true,
        metadata: { conversationCount: parsed.length, formatSubtype: 'chatgpt_export' }
      };
    }
    if (isSingleConv) {
      return {
        text: extractChatGptConversationNode(parsed),
        tables: [],
        isChatGptExport: true,
        metadata: { conversationCount: 1, title: parsed.title || 'ChatGPT Conversation', formatSubtype: 'chatgpt_export' }
      };
    }

    // Regular JSON (also build table if uniform array of objects)
    const tables = [];
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
      const headers = Array.from(new Set(parsed.flatMap((o) => Object.keys(o)))).slice(0, 20);
      const rows = parsed.slice(0, 200).map((o) => headers.map((h) => String(o[h] ?? '')));
      tables.push({ title: 'JSON Records', headers, rows });
    }
    const flatLines = flattenJsonValue(parsed);
    return {
      text: flatLines.join('\n'),
      tables,
      isChatGptExport: false,
      metadata: { keyCount: flatLines.length }
    };
  }

  /**
   * XML parser with XXE / Billion-Laughs protection
   */
  function extractXml(text) {
    const raw = String(text || '');
    if (/<!ENTITY\b|<!DOCTYPE\b[\s\S]*?(SYSTEM|PUBLIC|ENTITY)/i.test(raw)) {
      return {
        quarantine: true,
        reason: 'XML contains potentially dangerous <!ENTITY> / XXE declaration.',
        code: 'XML_XXE_THREAT'
      };
    }
    if (/<script\b|javascript:/i.test(raw)) {
      return {
        quarantine: true,
        reason: 'XML contains embedded executable <script> content.',
        code: 'XML_SCRIPT_THREAT'
      };
    }
    const clean = raw
      .replace(/<\?xml[\s\S]*?\?>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, '\n')
      .split('\n')
      .map((l) => decodeXmlEntities(l).trim())
      .filter(Boolean)
      .join('\n');
    return { text: clean, tables: [], metadata: {} };
  }

  /**
   * Safe HTML ChatGPT Export extractor (strips scripts/styles/event handlers)
   */
  function extractHtmlSafe(text) {
    const raw = String(text || '');
    const isChatGptHtml = /conversations|ChatGPT|jsonData\s*=|class="conversation"/i.test(raw);
    const cleaned = raw
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, '\n')
      .split('\n')
      .map((l) => decodeXmlEntities(l).trim())
      .filter(Boolean)
      .join('\n');
    return {
      text: cleaned,
      tables: [],
      isChatGptExport: isChatGptHtml,
      metadata: { formatSubtype: isChatGptHtml ? 'chatgpt_html_export' : 'html' }
    };
  }

  function extractMarkdownTables(mdText) {
    const lines = String(mdText || '').split(/\r?\n/);
    const tables = [];
    for (let i = 0; i + 2 < lines.length; i++) {
      if (lines[i].includes('|') && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        const splitRow = (r) => r.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => c.trim());
        const headers = splitRow(lines[i]);
        const rows = [];
        let j = i + 2;
        while (j < lines.length && lines[j].includes('|')) {
          rows.push(splitRow(lines[j]));
          j++;
        }
        tables.push({ title: `Markdown Table ${tables.length + 1}`, headers, rows });
        i = j - 1;
      }
    }
    return tables;
  }

  /**
   * Inspect Image binary for polyglot threats, dimensions, and embedded text chunks
   */
  function inspectImageBinary(bytes, format) {
    const u8 = toUint8(bytes);
    const rawSample = asciiAt(u8, 0, Math.min(u8.length, 65536)).toLowerCase();
    if (rawSample.includes('<script') || rawSample.includes('<?php')) {
      return { quarantine: true, reason: 'Polyglot script payload detected inside image file.', code: 'IMAGE_POLYGLOT_THREAT' };
    }
    let width = 0;
    let height = 0;
    const embeddedComments = [];

    if (format === 'png' && u8.length >= 24) {
      width = (u8[16] << 24) | (u8[17] << 16) | (u8[18] << 8) | u8[19];
      height = (u8[20] << 24) | (u8[21] << 16) | (u8[22] << 8) | u8[23];
      // Extract tEXt / iTXt chunks (useful for annotated screenshots / metadata)
      let pos = 8;
      while (pos + 12 <= u8.length) {
        const len = (u8[pos] << 24) | (u8[pos + 1] << 16) | (u8[pos + 2] << 8) | u8[pos + 3];
        const chunkType = asciiAt(u8, pos + 4, 4);
        if (len > 0 && pos + 12 + len <= u8.length) {
          if (chunkType === 'tEXt') {
            const raw = decodeBytes(u8.subarray(pos + 8, pos + 8 + len), 'latin1');
            const sep = raw.indexOf('\0');
            if (sep >= 0) {
              const key = raw.slice(0, sep).trim();
              const val = raw.slice(sep + 1).trim();
              if (val && /^(description|comment|ocr_text|text|title|janaseva_ocr)$/i.test(key)) {
                embeddedComments.push(val);
              }
            }
          } else if (chunkType === 'iTXt') {
            const raw = decodeBytes(u8.subarray(pos + 8, pos + 8 + len), 'utf-8');
            const parts = raw.split('\0');
            const key = (parts[0] || '').trim();
            const val = (parts[parts.length - 1] || '').trim();
            if (val && /^(description|comment|ocr_text|text|title|janaseva_ocr)$/i.test(key)) {
              embeddedComments.push(val);
            }
          }
        }
        if (chunkType === 'IEND' || len < 0 || pos + 12 + len > u8.length) break;
        pos += 12 + len;
      }
    } else if (format === 'jpg') {
      let pos = 2;
      while (pos + 4 < u8.length) {
        if (u8[pos] !== 0xff) break;
        const marker = u8[pos + 1];
        const segLen = (u8[pos + 2] << 8) | u8[pos + 3];
        if (segLen < 2 || pos + 2 + segLen > u8.length) break;
        if (marker === 0xc0 || marker === 0xc2) {
          height = (u8[pos + 5] << 8) | u8[pos + 6];
          width = (u8[pos + 7] << 8) | u8[pos + 8];
        } else if (marker === 0xfe) {
          const com = decodeBytes(u8.subarray(pos + 4, pos + 2 + segLen), 'utf-8').trim();
          if (com) embeddedComments.push(com);
        }
        pos += 2 + segLen;
      }
    }

    return {
      text: embeddedComments.join('\n').trim(),
      tables: [],
      needsOcr: embeddedComments.length === 0,
      metadata: { width, height, format, hasEmbeddedText: embeddedComments.length > 0 }
    };
  }

  /**
   * High-level unified document extraction router (Stages C, D, F)
   */
  function extractDocumentContent({ filename, mimeType, bytes, depth = 0 }) {
    const idRes = identifyAndVerifyFile(filename, mimeType, bytes);
    if (!idRes.valid) return idRes;

    const u8 = toUint8(bytes);
    const fmt = idRes.format;

    if (fmt === 'zip') {
      if (depth >= MAX_ZIP_DEPTH) {
        return { valid: false, quarantine: true, reason: 'Nested archive depth limit exceeded.', code: 'ZIP_DEPTH_EXCEEDED' };
      }
      const rawEntries = parseZipArchive(u8);
      const children = [];
      for (const entry of rawEntries) {
        const sub = extractDocumentContent({ filename: entry.name, mimeType: '', bytes: entry.bytes, depth: depth + 1 });
        children.push({ entryName: entry.name, sizeBytes: entry.size, bytes: entry.bytes, ...sub });
      }
      return {
        valid: true,
        format: 'zip',
        isArchive: true,
        children,
        metadata: { entryCount: children.length }
      };
    }

    let extracted;
    if (fmt === 'txt' || fmt === 'md') {
      const txt = decodeBytes(u8, 'utf-8').replace(/^\uFEFF/, '');
      extracted = { text: txt, tables: fmt === 'md' ? extractMarkdownTables(txt) : [], metadata: {} };
    } else if (fmt === 'csv') {
      extracted = extractCsv(decodeBytes(u8, 'utf-8'));
    } else if (fmt === 'json') {
      extracted = extractJsonOrChatGpt(decodeBytes(u8, 'utf-8'));
    } else if (fmt === 'xml') {
      extracted = extractXml(decodeBytes(u8, 'utf-8'));
    } else if (fmt === 'html') {
      extracted = extractHtmlSafe(decodeBytes(u8, 'utf-8'));
    } else if (fmt === 'docx') {
      extracted = extractDocx(u8);
    } else if (fmt === 'pptx') {
      extracted = extractPptx(u8);
    } else if (fmt === 'xlsx') {
      extracted = extractXlsx(u8);
    } else if (fmt === 'doc' || fmt === 'ppt' || fmt === 'xls') {
      extracted = extractLegacyOffice(u8, fmt);
    } else if (fmt === 'pdf') {
      extracted = extractPdf(u8);
    } else if (fmt === 'jpg' || fmt === 'png' || fmt === 'webp') {
      extracted = inspectImageBinary(u8, fmt);
    } else {
      return { valid: false, reason: `No extractor for format ${fmt}`, code: 'NO_EXTRACTOR' };
    }

    if (extracted.quarantine) {
      return { valid: false, quarantine: true, format: fmt, reason: extracted.reason, code: extracted.code };
    }

    return {
      valid: true,
      format: extracted.isChatGptExport ? 'chatgpt_export' : fmt,
      sizeBytes: idRes.sizeBytes,
      mimeType: idRes.mimeType,
      text: extracted.text || '',
      tables: extracted.tables || [],
      needsOcr: Boolean(extracted.needsOcr),
      isChatGptExport: Boolean(extracted.isChatGptExport),
      metadata: extracted.metadata || {}
    };
  }

  return {
    MAX_SINGLE_FILE_BYTES,
    MAX_ARCHIVE_BYTES,
    MAX_ZIP_UNCOMPRESSED_BYTES,
    MAX_ZIP_ENTRIES,
    MAX_ZIP_RATIO,
    BLOCKED_EXTENSIONS,
    SUPPORTED_FORMATS,
    toUint8,
    utf8Encode,
    decodeBytes,
    inflateRawSync,
    inflateZlibSync,
    parseZipArchive,
    identifyAndVerifyFile,
    extractDocumentContent
  };
});
