/**
 * JANASEVA – Server-Side AI Knowledge Centre Processing, Storage, OCR, Vector & Backup Service
 * Implements Stages A–N in Firebase Cloud Functions (Node.js 20) using Firestore + Cloud Storage.
 */

const crypto = require("crypto");
const admin = require("firebase-admin");
const functions = require("firebase-functions");

const parsers = require("./knowledgeParsers");
const sec = require("./knowledgeSecurity");
const rag = require("./knowledgeRag");
const envValidator = require("./envValidator");

const STORAGE_ROOT = "AI_KNOWLEDGE_CENTRE";

function makeId(prefix = "k") {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}

function getBucket() {
  return admin.storage().bucket();
}

async function saveStorageObject(subFolder, key, bufferOrText, contentType = "application/octet-stream") {
  const bucket = getBucket();
  const path = `${STORAGE_ROOT}/${subFolder}/${key}`;
  const buf = Buffer.isBuffer(bufferOrText)
    ? bufferOrText
    : Buffer.from(typeof bufferOrText === "string" ? bufferOrText : JSON.stringify(bufferOrText), "utf8");
  await bucket.file(path).save(buf, { contentType, resumable: false });
  return { path, sizeBytes: buf.length };
}

async function deleteStorageObject(path) {
  if (!path) return;
  try {
    await getBucket().file(path).delete({ ignoreNotFound: true });
  } catch (err) {
    console.warn("[KnowledgeService] Storage delete warning:", err.message);
  }
}

async function writeAuditLog(db, action, targetId, details, actor = {}, extra = {}) {
  const auditId = makeId("kaud");
  await db.collection("knowledge_audit_logs").doc(auditId).set({
    auditId,
    action,
    targetId: String(targetId || ""),
    details: String(details || "").slice(0, 1200),
    actorUid: actor.uid || "public",
    actorName: actor.name || "Public Contributor",
    actorRole: actor.role || "public",
    timestamp: new Date().toISOString(),
    ...extra
  });
}

async function enforcePublicUploadRateLimit(db, actorKey) {
  const safeKey = String(actorKey || "public").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  const minuteBucket = Math.floor(Date.now() / 60000);
  const ref = db.collection("knowledge_rate_limits").doc(`upload_${safeKey}`);

  const allowed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const count = data.minuteBucket === minuteBucket ? (Number(data.count) || 0) : 0;
    if (count >= 30) return false;
    tx.set(ref, { minuteBucket, count: count + 1, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  });

  if (!allowed) {
    throw new functions.https.HttpsError("resource-exhausted", "Upload rate limit exceeded. Please wait one minute before uploading more files.");
  }
}

/**
 * Server-Side OCR (Cloud Vision API / ADC / Gemini Multimodal Vision)
 */
async function performServerOcr(buffer, mimeType) {
  const b64 = buffer.toString("base64");
  const ocrCfg = envValidator.getOcrConfig();
  const aiCfg = envValidator.getAiConfig();
  const visionApiKey = ocrCfg.visionApiKey;
  const geminiKey = aiCfg.geminiKey;
  const isImage = /^image\//i.test(mimeType);

  // 1. Google Cloud Vision REST API (for images)
  if (visionApiKey && isImage) {
    try {
      const resp = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(visionApiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{
            image: { content: b64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            imageContext: { languageHints: ["en", "kn", "hi"] }
          }]
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        const text = json?.responses?.[0]?.fullTextAnnotation?.text || "";
        return { configured: true, engine: "cloud-vision-rest", text: text.trim(), unreadable: !text.trim() };
      }
    } catch (e) {
      console.warn("[KnowledgeOCR] Vision REST warning:", e.message);
    }
  }

  // 2. Google Cloud Vision ADC SDK
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && isImage) {
    try {
      const vision = require("@google-cloud/vision");
      const client = new vision.ImageAnnotatorClient();
      const [res] = await client.documentTextDetection(buffer);
      const text = res?.fullTextAnnotation?.text || res?.textAnnotations?.[0]?.description || "";
      return { configured: true, engine: "cloud-vision-sdk", text: text.trim(), unreadable: !text.trim() };
    } catch (e) {
      console.warn("[KnowledgeOCR] Vision SDK warning:", e.message);
    }
  }

  // 3. Gemini Multimodal OCR (Supports both images and scanned PDFs in EN/KN/HI)
  if (geminiKey && !envValidator.isPlaceholder(geminiKey)) {
    try {
      const model = aiCfg.geminiModel || "gemini-2.5-flash";
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Extract all visible text verbatim from this document/image preserving original Kannada, Hindi, or English scripts and tables. Output only the extracted text, or EMPTY if unreadable." },
              { inlineData: { mimeType: mimeType || "application/pdf", data: b64 } }
            ]
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 2048 }
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        const raw = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "";
        const unreadable = !raw || raw === "EMPTY";
        return { configured: true, engine: "gemini-vision-ocr", text: unreadable ? "" : raw, unreadable };
      }
    } catch (e) {
      console.warn("[KnowledgeOCR] Gemini Vision OCR warning:", e.message);
    }
  }

  return {
    configured: false,
    text: "",
    message: "Automated server OCR is not configured (set GOOGLE_CLOUD_VISION_API_KEY or GEMINI_API_KEY)."
  };
}

/**
 * Optional Neural Embedding Generation (Gemini text-embedding-004 / OpenAI text-embedding-3-small)
 */
async function generateServerEmbedding(text) {
  const aiCfg = envValidator.getAiConfig();
  const geminiKey = aiCfg.geminiKey;
  const openaiKey = aiCfg.openaiKey;

  if (geminiKey && !envValidator.isPlaceholder(geminiKey)) {
    try {
      const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: String(text || "").slice(0, 2000) }] }
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json?.embedding?.values)) {
          return { model: "text-embedding-004", values: json.embedding.values };
        }
      }
    } catch (e) {}
  }

  if (openaiKey && !envValidator.isPlaceholder(openaiKey)) {
    try {
      const baseUrl = aiCfg.openaiBaseUrl || "https://api.openai.com/v1";
      const resp = await fetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "text-embedding-3-small", input: String(text || "").slice(0, 2000) })
      });
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json?.data?.[0]?.embedding)) {
          return { model: "text-embedding-3-small", values: json.data[0].embedding };
        }
      }
    } catch (e) {}
  }

  return null;
}

async function commitBatchedWrites(db, operations) {
  for (let i = 0; i < operations.length; i += 350) {
    const batch = db.batch();
    const slice = operations.slice(i, i + 350);
    for (const op of slice) {
      if (op.type === "set") batch.set(op.ref, op.data, op.options || {});
      else if (op.type === "update") batch.update(op.ref, op.data);
      else if (op.type === "delete") batch.delete(op.ref);
    }
    await batch.commit();
  }
}

async function supersedeDocumentServer(db, oldDocId, newDocId) {
  const oldRef = db.collection("knowledge_documents").doc(oldDocId);
  const oldSnap = await oldRef.get();
  if (oldSnap.exists) {
    await oldRef.update({ enabled: false, status: "SUPERSEDED", supersededByDocId: newDocId, updatedAt: new Date().toISOString() });
  }
  const [chunksSnap, embsSnap] = await Promise.all([
    db.collection("knowledge_chunks").where("docId", "==", oldDocId).get(),
    db.collection("knowledge_embeddings").where("docId", "==", oldDocId).get()
  ]);
  const ops = [];
  chunksSnap.forEach((d) => ops.push({ type: "update", ref: d.ref, data: { active: false } }));
  embsSnap.forEach((d) => ops.push({ type: "update", ref: d.ref, data: { active: false } }));
  if (ops.length) await commitBatchedWrites(db, ops);
}

/**
 * Full Server-Side Ingestion Pipeline (Stages A -> N)
 */
async function ingestKnowledgeBuffer(db, {
  buffer,
  filename,
  mimeType = "",
  contributorId = "public",
  contributorName = "Public Contributor",
  contributorEmail = "",
  contributorRole = "public",
  categoryHint = "",
  sourceReliability = "community",
  sourceChannel = "PUBLIC_UPLOAD",
  replaceDocId = null
}) {
  const actor = { uid: contributorId, name: contributorName, email: contributorEmail, role: contributorRole };
  if (sourceChannel === "PUBLIC_UPLOAD") {
    await enforcePublicUploadRateLimit(db, contributorId);
  }

  const jobId = makeId("kjob");
  const docId = `KDOC-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const nowIso = new Date().toISOString();
  const safeFilename = sec.sanitizeFilename(filename);
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Stage A: Temporary upload & Duplicate check
  const tempKey = `${jobId}/${safeFilename}`;
  const tempStored = await saveStorageObject("temporary_uploads", tempKey, buffer, mimeType || "application/octet-stream");

  await db.collection("knowledge_processing_jobs").doc(jobId).set({
    jobId, docId, filename, fileHash, sizeBytes: buffer.length,
    status: "PROCESSING", currentStage: "A: File Reception",
    stagesCompleted: ["A"], startedAt: nowIso, updatedAt: nowIso
  });

  if (!replaceDocId) {
    const dupSnap = await db.collection("knowledge_documents")
      .where("fileHash", "==", fileHash)
      .where("status", "==", "INDEXED")
      .limit(1)
      .get();
    if (!dupSnap.empty) {
      const existing = dupSnap.docs[0].data();
      await deleteStorageObject(tempStored.path);
      await db.collection("knowledge_processing_jobs").doc(jobId).update({
        status: "DUPLICATE", currentStage: "Duplicate Detected", completedAt: new Date().toISOString()
      });
      await writeAuditLog(db, "DUPLICATE_UPLOAD_SKIPPED", existing.docId, `Duplicate SHA-256 matched "${existing.title}"`, actor, { fileHash, filename });
      return { success: false, duplicate: true, docId: existing.docId, duplicateOf: existing, fileHash, message: `Duplicate file matches existing "${existing.title}".` };
    }
  }

  // Stage B & C: Signature Verification & Extraction
  let extractRes;
  try {
    extractRes = parsers.extractDocumentContent({ filename, mimeType, bytes: buffer });
  } catch (err) {
    extractRes = { valid: false, quarantine: /security violation|zip bomb|path traversal|macro|xxe/i.test(err.message), reason: err.message, code: "PARSE_ERROR" };
  }

  if (!extractRes.valid) {
    await deleteStorageObject(tempStored.path);
    if (extractRes.quarantine) {
      return await quarantineServerDocument(db, { docId, jobId, filename, safeFilename, mimeType, buffer, fileHash, actor, reason: extractRes.reason, code: extractRes.code, sourceChannel });
    }
    return await failServerDocument(db, { docId, jobId, filename, safeFilename, mimeType, buffer, fileHash, actor, stage: "C: File Parsing", reason: extractRes.reason, code: extractRes.code, sourceChannel });
  }

  // Archive handling
  if (extractRes.isArchive) {
    const childrenResults = [];
    let blockedCount = 0;
    for (const child of extractRes.children) {
      if (!child.valid) {
        blockedCount++;
        if (child.quarantine) {
          const cBuf = Buffer.from(child.bytes || []);
          const cHash = crypto.createHash("sha256").update(cBuf).digest("hex");
          await quarantineServerDocument(db, {
            docId: makeId("KDOC-Q"), jobId, filename: child.entryName, safeFilename: sec.sanitizeFilename(child.entryName),
            mimeType: "", buffer: cBuf, fileHash: cHash, actor, reason: `Archive member quarantined: ${child.reason}`, code: child.code, sourceChannel
          });
        }
        continue;
      }
      const res = await ingestKnowledgeBuffer(db, {
        buffer: Buffer.from(child.bytes),
        filename: child.entryName,
        mimeType: child.mimeType,
        contributorId, contributorName, contributorEmail, contributorRole,
        categoryHint, sourceReliability, sourceChannel: `${sourceChannel}_ZIP`
      });
      childrenResults.push(res);
    }
    await deleteStorageObject(tempStored.path);
    await db.collection("knowledge_processing_jobs").doc(jobId).update({
      status: "COMPLETED", currentStage: "N: Archive Processed", stagesCompleted: ["A","B","C","D","M","N"], completedAt: new Date().toISOString()
    });
    const indexedCount = childrenResults.filter((r) => r.success).length;
    return { success: indexedCount > 0, isArchive: true, processedCount: indexedCount, blockedCount, results: childrenResults };
  }

  // Stage E: OCR if needed
  let extractedText = extractRes.text || "";
  let ocrUsed = false;
  let ocrEngine = null;
  if (extractRes.needsOcr) {
    const ocrRes = await performServerOcr(buffer, extractRes.mimeType);
    if (ocrRes.configured && ocrRes.text) {
      extractedText = ocrRes.text;
      ocrUsed = true;
      ocrEngine = ocrRes.engine;
    } else if (!extractedText) {
      await deleteStorageObject(tempStored.path);
      return await failServerDocument(db, {
        docId, jobId, filename, safeFilename, mimeType: extractRes.mimeType, buffer, fileHash, actor,
        format: extractRes.format, stage: "E: OCR Processing",
        reason: ocrRes.unreadable ? "No readable text found during OCR." : (ocrRes.message || "OCR unconfigured."),
        code: ocrRes.unreadable ? "OCR_UNREADABLE" : "OCR_UNCONFIGURED",
        sourceChannel
      });
    }
  }

  // Stage B (Deep Content Security Scan)
  const secRes = sec.scanSecurity({ filename, rawBytes: buffer, extractedText });
  if (secRes.quarantine) {
    await deleteStorageObject(tempStored.path);
    return await quarantineServerDocument(db, {
      docId, jobId, filename, safeFilename, mimeType: extractRes.mimeType, buffer, fileHash, actor,
      format: extractRes.format, reason: secRes.quarantineReasons.join(" | "),
      code: secRes.malwareHits.length ? "MALWARE_DETECTED" : "PROMPT_INJECTION",
      sourceChannel
    });
  }

  // Stage G, H, I, J, K
  const cleanedText = rag.cleanText(extractedText);
  if (!cleanedText || cleanedText.length < 3) {
    await deleteStorageObject(tempStored.path);
    return await failServerDocument(db, {
      docId, jobId, filename, safeFilename, mimeType: extractRes.mimeType, buffer, fileHash, actor,
      format: extractRes.format, stage: "H: Text Cleaning", reason: "No usable text remained.", code: "EMPTY_TEXT", sourceChannel
    });
  }

  const langInfo = rag.detectLanguage(cleanedText);
  const classification = rag.classifyDocument(cleanedText, filename, extractRes.format);
  const finalCategory = categoryHint && categoryHint.trim() ? categoryHint.trim() : classification.category;
  const rawChunks = rag.chunkDocumentText(cleanedText, extractRes.tables || []);
  const title = rag.extractTitle(cleanedText, filename, extractRes.metadata);
  const summary = rag.extractSummary(secRes.pii.detected ? sec.redactSensitivePii(cleanedText) : cleanedText);
  const keywords = rag.extractKeywords(cleanedText, 14);

  let version = 1;
  let previousDocId = null;
  if (replaceDocId) {
    const prevSnap = await db.collection("knowledge_documents").doc(replaceDocId).get();
    if (prevSnap.exists) {
      version = (Number(prevSnap.data().version) || 1) + 1;
      previousDocId = replaceDocId;
      await supersedeDocumentServer(db, replaceDocId, docId);
    }
  }

  // Stage L: Embeddings
  const chunkOps = [];
  const embeddingRecords = [];
  for (const ch of rawChunks) {
    const chunkId = `${docId}_C${ch.chunkIndex}`;
    const embeddingId = `EMB_${chunkId}`;
    const safeChunkText = sec.sanitizeUntrustedSnippet(ch.text, 1200);
    const localVec = rag.generateLocalEmbedding(`${title} ${safeChunkText}`);
    const neural = await generateServerEmbedding(`${title}\n${safeChunkText}`);

    const chunkDoc = {
      chunkId, docId, chunkIndex: ch.chunkIndex, sectionTitle: ch.sectionTitle, hasTable: ch.hasTable,
      language: ch.language, text: safeChunkText, charCount: safeChunkText.length, tokenCount: ch.tokenCount,
      active: true, createdAt: nowIso
    };
    const embDoc = {
      embeddingId, docId, chunkId, dimensions: rag.VECTOR_DIMS,
      model: neural ? `${neural.model}+trilingual-256` : "janaseva-trilingual-hybrid-256",
      vector: localVec,
      externalVector: neural ? neural.values : null,
      active: true, createdAt: nowIso
    };
    chunkOps.push({ type: "set", ref: db.collection("knowledge_chunks").doc(chunkId), data: chunkDoc });
    chunkOps.push({ type: "set", ref: db.collection("knowledge_embeddings").doc(embeddingId), data: embDoc });
    embeddingRecords.push(embDoc);
  }

  // Stage M: Private Cloud Storage placement + Firestore indexing
  await deleteStorageObject(tempStored.path);
  const origStored = await saveStorageObject("original_documents", `${docId}/${safeFilename}`, buffer, extractRes.mimeType);
  const textStored = await saveStorageObject("extracted_text", `${docId}.txt`, cleanedText, "text/plain; charset=utf-8");
  await saveStorageObject("processed_documents", `${docId}.json`, { docId, title, cleanedText, tables: extractRes.tables || [] }, "application/json");
  await saveStorageObject("embeddings", `${docId}.json`, { docId, embeddings: embeddingRecords }, "application/json");

  const docRecord = {
    docId, title, originalFilename: filename, safeFilename,
    format: extractRes.format, mimeType: extractRes.mimeType, sizeBytes: buffer.length, fileHash,
    primaryLanguage: langInfo.primaryLanguage, detectedLanguages: langInfo.detectedLanguages, isMultilingual: langInfo.isMultilingual,
    category: finalCategory, classificationConfidence: classification.confidence,
    sourceReliability: ["official", "verified_partner", "community"].includes(sourceReliability) ? sourceReliability : "community",
    sourceChannel, contributorId, contributorDisplayName: String(contributorName || "Public Contributor").slice(0, 80),
    summary, keywords, wordCount: rag.tokenizeMultilingual(cleanedText).length, charCount: cleanedText.length,
    chunkCount: rawChunks.length, tableCount: (extractRes.tables || []).length,
    ocrUsed, ocrEngine, piiDetected: secRes.pii.detected, piiTypes: secRes.pii.types,
    promptInjectionFlag: secRes.promptInjection.detected, version, previousDocId,
    status: "INDEXED", enabled: true, quarantined: false, deleted: false,
    privateStorageRef: origStored.path, privateTextRef: textStored.path,
    uploadedAt: nowIso, updatedAt: nowIso
  };
  await saveStorageObject("document_metadata", `${docId}.json`, docRecord, "application/json");

  await db.collection("knowledge_documents").doc(docId).set(docRecord);
  if (chunkOps.length) await commitBatchedWrites(db, chunkOps);

  await db.collection("knowledge_uploaders").doc(String(contributorId).slice(0, 128)).set({
    uploaderId: String(contributorId).slice(0, 128),
    displayName: docRecord.contributorDisplayName,
    email: contributorEmail || "",
    role: contributorRole,
    uploadCount: admin.firestore.FieldValue.increment(1),
    indexedCount: admin.firestore.FieldValue.increment(1),
    lastUploadAt: nowIso
  }, { merge: true });

  const completedJob = {
    jobId, docId, filename, fileHash, sizeBytes: buffer.length, status: "COMPLETED",
    currentStage: "N: Available in Chatbox",
    stagesCompleted: ["A","B","C","D", ocrUsed ? "E" : null, "F","G","H","I","J","K","L","M","N"].filter(Boolean),
    chunkCount: rawChunks.length, completedAt: new Date().toISOString()
  };
  await db.collection("knowledge_processing_jobs").doc(jobId).set(completedJob, { merge: true });
  await saveStorageObject("processing_logs", `${jobId}.json`, completedJob, "application/json");

  await db.collection("knowledge_storage_usage").doc("summary").set({
    totalBytes: admin.firestore.FieldValue.increment(buffer.length + textStored.sizeBytes),
    totalFiles: admin.firestore.FieldValue.increment(1),
    updatedAt: new Date().toISOString()
  }, { merge: true });

  await writeAuditLog(db, "KNOWLEDGE_DOCUMENT_INDEXED", docId, `Indexed "${title}" (${extractRes.format}, ${langInfo.primaryLanguage})`, actor);

  // Strip private storage paths before returning to caller
  const { privateStorageRef, privateTextRef, ...publicSafeDoc } = docRecord;
  return { success: true, docId, jobId, document: publicSafeDoc, chunksCount: rawChunks.length };
}

async function quarantineServerDocument(db, { docId, jobId, filename, safeFilename, mimeType, buffer, fileHash, actor, format = "unknown", reason, code, sourceChannel }) {
  const nowIso = new Date().toISOString();
  const stored = await saveStorageObject("quarantined_files", `${docId}/${safeFilename}`, buffer, mimeType || "application/octet-stream");
  const docRecord = {
    docId, title: safeFilename, originalFilename: filename, safeFilename, format, mimeType,
    sizeBytes: buffer.length, fileHash, primaryLanguage: "unknown", category: "Quarantined",
    sourceReliability: "community", sourceChannel, contributorId: actor.uid, contributorDisplayName: actor.name,
    status: "QUARANTINED", enabled: false, quarantined: true, quarantineReason: reason, quarantineCode: code,
    privateStorageRef: stored.path, deleted: false, uploadedAt: nowIso, updatedAt: nowIso
  };
  await db.collection("knowledge_documents").doc(docId).set(docRecord);
  await db.collection("knowledge_processing_jobs").doc(jobId).set({ status: "QUARANTINED", currentStage: "B: Quarantined", error: reason, completedAt: nowIso }, { merge: true });
  await writeAuditLog(db, "SECURITY_QUARANTINE", docId, `Quarantined "${filename}": ${reason}`, actor, { code });
  return { success: false, quarantined: true, docId, jobId, code, reason };
}

async function failServerDocument(db, { docId, jobId, filename, safeFilename, mimeType, buffer, fileHash, actor, format = "unknown", stage, reason, code, sourceChannel }) {
  const nowIso = new Date().toISOString();
  const stored = await saveStorageObject("failed_processing", `${docId}/${safeFilename}`, buffer, mimeType || "application/octet-stream");
  const docRecord = {
    docId, title: safeFilename, originalFilename: filename, safeFilename, format, mimeType,
    sizeBytes: buffer.length, fileHash, primaryLanguage: "unknown", category: "Failed Processing",
    sourceReliability: "community", sourceChannel, contributorId: actor.uid, contributorDisplayName: actor.name,
    status: "FAILED", enabled: false, quarantined: false, failureStage: stage, failureReason: reason, failureCode: code,
    privateStorageRef: stored.path, deleted: false, uploadedAt: nowIso, updatedAt: nowIso
  };
  await db.collection("knowledge_documents").doc(docId).set(docRecord);
  await db.collection("knowledge_processing_jobs").doc(jobId).set({ status: "FAILED", currentStage: stage, error: reason, completedAt: nowIso }, { merge: true });
  await writeAuditLog(db, "PROCESSING_FAILED", docId, `Failed "${filename}" at ${stage}: ${reason}`, actor, { code });
  return { success: false, failed: true, docId, jobId, code, reason };
}

/**
 * Query Knowledge Base for RAG (Used by Chatbox & Search)
 */
async function queryKnowledgeBaseServer(db, {
  query,
  lang = "en-IN",
  limit = 5,
  semanticSearch = true,
  crossLanguageSearch = true,
  schemeSearch = true
}) {
  const safeLimit = Math.min(10, Math.max(1, Number(limit) || 5));
  const [docsSnap, chunksSnap, embsSnap] = await Promise.all([
    db.collection("knowledge_documents").where("status", "==", "INDEXED").limit(300).get(),
    db.collection("knowledge_chunks").where("active", "==", true).limit(1200).get(),
    db.collection("knowledge_embeddings").where("active", "==", true).limit(1200).get()
  ]);

  const documents = docsSnap.docs.map((d) => d.data());
  const chunks = chunksSnap.docs.map((d) => d.data());
  const embeddings = embsSnap.docs.map((d) => d.data());

  let queryExternalVector = null;
  if (semanticSearch !== false && embeddings.some((e) => Array.isArray(e.externalVector))) {
    const qEmb = await generateServerEmbedding(query);
    if (qEmb) queryExternalVector = qEmb.values;
  }

  const retrieval = rag.retrieveRelevantChunks({
    query,
    documents,
    chunks,
    embeddings,
    limit: safeLimit,
    queryExternalVector,
    semanticSearch: semanticSearch !== false,
    crossLanguageSearch: crossLanguageSearch !== false,
    schemeSearch: schemeSearch !== false
  });

  const synthesis = rag.synthesizeGroundedAnswer({
    query, retrieval, responseLang: lang, securityRedactor: sec.redactSensitivePii
  });

  return { handled: true, ...synthesis, retrieval };
}

async function deleteKnowledgeDocumentServer(db, docId, actor, reason = "Deleted by Admin") {
  const docRef = db.collection("knowledge_documents").doc(docId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) throw new functions.https.HttpsError("not-found", "Knowledge document not found.");
  const d = docSnap.data();

  const [chunksSnap, embsSnap] = await Promise.all([
    db.collection("knowledge_chunks").where("docId", "==", docId).get(),
    db.collection("knowledge_embeddings").where("docId", "==", docId).get()
  ]);
  const ops = [{ type: "delete", ref: docRef }];
  chunksSnap.forEach((c) => ops.push({ type: "delete", ref: c.ref }));
  embsSnap.forEach((e) => ops.push({ type: "delete", ref: e.ref }));
  await commitBatchedWrites(db, ops);

  await Promise.all([
    deleteStorageObject(d.privateStorageRef),
    deleteStorageObject(d.privateTextRef),
    deleteStorageObject(`${STORAGE_ROOT}/processed_documents/${docId}.json`),
    deleteStorageObject(`${STORAGE_ROOT}/document_metadata/${docId}.json`),
    deleteStorageObject(`${STORAGE_ROOT}/embeddings/${docId}.json`)
  ]);

  await writeAuditLog(db, "KNOWLEDGE_DOCUMENT_DELETED", docId, `Deleted "${d.title}" and purged ${chunksSnap.size} chunks. Reason: ${reason}`, actor);
  return { success: true, docId, purgedChunks: chunksSnap.size };
}

async function createKnowledgeBackupServer(db, actor) {
  const [docsSnap, chunksSnap, embsSnap, uploadersSnap] = await Promise.all([
    db.collection("knowledge_documents").get(),
    db.collection("knowledge_chunks").get(),
    db.collection("knowledge_embeddings").get(),
    db.collection("knowledge_uploaders").get()
  ]);
  const backupId = `KBKP-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const payload = {
    backupId,
    createdAt: new Date().toISOString(),
    documents: docsSnap.docs.map((d) => d.data()),
    chunks: chunksSnap.docs.map((d) => d.data()),
    embeddings: embsSnap.docs.map((d) => d.data()),
    uploaders: uploadersSnap.docs.map((d) => d.data())
  };
  const serialized = JSON.stringify(payload);
  const sha256Checksum = crypto.createHash("sha256").update(serialized).digest("hex");
  const stored = await saveStorageObject("backups", `${backupId}.json`, serialized, "application/json");

  const meta = {
    backupId, createdAt: payload.createdAt, createdBy: actor.email || actor.uid,
    sha256Checksum, sizeBytes: stored.sizeBytes, storagePath: stored.path, verified: true,
    counts: { documents: payload.documents.length, chunks: payload.chunks.length, embeddings: payload.embeddings.length }
  };
  await db.collection("knowledge_backups").doc(backupId).set(meta);
  await writeAuditLog(db, "KNOWLEDGE_BACKUP_CREATED", backupId, `Created verified knowledge backup ${backupId}`, actor);
  return meta;
}

async function restoreKnowledgeBackupServer(db, backupId, actor) {
  const metaSnap = await db.collection("knowledge_backups").doc(backupId).get();
  if (!metaSnap.exists) throw new functions.https.HttpsError("not-found", "Backup snapshot not found.");
  const meta = metaSnap.data();
  const [buf] = await getBucket().file(meta.storagePath).download();
  const actualHash = crypto.createHash("sha256").update(buf).digest("hex");
  if (actualHash !== meta.sha256Checksum) {
    throw new functions.https.HttpsError("data-loss", "Backup integrity verification failed: checksum mismatch.");
  }
  const payload = JSON.parse(buf.toString("utf8"));
  const ops = [];
  for (const d of payload.documents || []) ops.push({ type: "set", ref: db.collection("knowledge_documents").doc(d.docId), data: d });
  for (const c of payload.chunks || []) ops.push({ type: "set", ref: db.collection("knowledge_chunks").doc(c.chunkId), data: c });
  for (const e of payload.embeddings || []) ops.push({ type: "set", ref: db.collection("knowledge_embeddings").doc(e.embeddingId), data: e });
  await commitBatchedWrites(db, ops);
  await writeAuditLog(db, "KNOWLEDGE_BACKUP_RESTORED", backupId, `Restored ${payload.documents?.length || 0} documents from ${backupId}`, actor);
  return { success: true, restoredDocuments: payload.documents?.length || 0, restoredChunks: payload.chunks?.length || 0 };
}

module.exports = {
  ingestKnowledgeBuffer,
  queryKnowledgeBaseServer,
  deleteKnowledgeDocumentServer,
  createKnowledgeBackupServer,
  restoreKnowledgeBackupServer,
  writeAuditLog,
  supersedeDocumentServer,
  commitBatchedWrites,
  STORAGE_ROOT
};
