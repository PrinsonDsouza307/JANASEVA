/**
 * JANASEVA 3.0 – Multilingual AI Chat & Voice Assistant
 *
 * Upgraded Citizen-Service Assistant supporting:
 * - English (en-IN), Kannada (kn-IN), Hindi (hi-IN)
 * - Real Firebase Cloud Functions AI backend + truthful Guided NLU fallback
 * - Multi-turn conversation memory & slot-filling complaint registration
 * - Explicit confirmation preview card with inline Edit, Cancel, Submit & idempotency
 * - Authorized complaint tracking with visual 6-stage timeline & progress history
 * - Binary-verified image/PDF attachments + live device camera capture
 * - Persistent UID-scoped conversation history (search, pagination, delete, TXT/PDF export)
 * - Web Speech STT/TTS with voice selector, speech speed control, replay & stop
 * - Citizen feedback (helpful, not helpful, report incorrect) & smart navigation
 */

class JanasevaVoiceAssistant {
  constructor() {
    this.supportedLanguages = ['en-IN', 'kn-IN', 'hi-IN'];

    // Centralized Chat Settings (Sections A-F)
    this.chatSettings = this.loadChatSettings();
    this.currentLang = this.resolveInitialLanguage();

    // Speech APIs
    this.recognition = null;
    this.isListening = false;
    this._recognitionCancelled = false;
    this.synth = window.speechSynthesis || null;
    this.speechRate = this.chatSettings.speechRate || this.loadSpeechRate();
    this.autoSpeak = typeof this.chatSettings.autoVoicePlayback === 'boolean'
      ? this.chatSettings.autoVoicePlayback
      : this.loadAutoSpeak();
    this.selectedVoice = null;
    this.availableVoices = [];

    // Session & Dialogue Memory
    this.sessionId = this.createSessionId();
    this.sessionCreatedAt = new Date().toISOString();
    this.sessionTitle = '';
    this.messages = [];
    this.currentGrievanceDraft = null;
    this.chatDraftState = null;
    this.isAwaitingConfirmation = false;
    this.lastTrackedId = null;

    // Attachment & Request Lifecycle State
    this.pendingAttachments = [];
    this.isGenerating = false;
    this.isSubmittingComplaint = false;
    this.activeRequestToken = 0;
    this.activeAbortFlag = false;
    this.providerStatus = { configured: false, connected: false, provider: 'guided-citizen-engine' };
    this.isSyncing = false;
    this.hasOfflineKnowledge = false;
    this.unreadCount = 0;
    this.historyPage = 1;
    this.isExpanded = false;
    this.showQuickActions = false;
    this.settingsOpen = false;
    this.settingsActiveTab = 'general';

    // Camera state
    this._camStream = null;
    this._camFacing = 'environment';
    this._camPendingBlob = null;
    this._camPendingDataUrl = null;

    this.initDictionary();
    this.initSpeechRecognition();
    this.initSpeechSynthesis();
    this.refreshOfflineKnowledgeAvailability();
  }

  get services() {
    return window.JanasevaChatServices || null;
  }

  loadChatSettings() {
    const uid = this.getCurrentUser()?.uid || null;
    if (this.services && this.services.chatSettingsManager) {
      return this.services.chatSettingsManager.loadLocal(uid);
    }
    return {
      aiAssistant: true, aiKnowledgeCentre: true, onlineAi: true, offlineAi: true,
      conversationHistory: true, suggestedQuestions: true, streamingResponses: true, autoLanguageDetection: true,
      voiceInput: true, voiceResponses: true, textToSpeech: true, autoVoicePlayback: false, speechRate: 0.95,
      attachments: true, imageUpload: true, pdfUpload: true, documentAnalysis: true,
      knowledgeSearch: true, semanticSearch: true, crossLanguageSearch: true, contextAwareResponses: true,
      conversationMemory: true, autoKnowledgeCitation: true, complaintUnderstanding: true, schemeSearch: true,
      enableEnglish: true, enableKannada: true, enableHindi: true, autoTranslation: true,
      saveChatHistory: true, saveAttachments: true, rememberContext: true, anonymousAnalytics: false,
      autoChatCleanup: false, cleanupRetentionDays: 30,
      aiProvider: 'auto', aiModel: 'default', responseLength: 'balanced', temperature: 0.35,
      requestTimeoutMs: 12000, maxAttachmentSizeMb: 5, knowledgeSearchLimit: 5, offlineStorageLimitMb: 25
    };
  }

  getChatSettings() {
    return this.chatSettings || this.loadChatSettings();
  }

  isLanguageEnabled(langCode = this.currentLang, cfg = this.getChatSettings()) {
    const short = this.getResponseLangShort(langCode);
    if (short === 'kn') return cfg.enableKannada !== false;
    if (short === 'hi') return cfg.enableHindi !== false;
    return cfg.enableEnglish !== false;
  }

  pickEnabledLanguage(cfg = this.getChatSettings()) {
    if (cfg.enableEnglish !== false) return 'en-IN';
    if (cfg.enableKannada !== false) return 'kn-IN';
    if (cfg.enableHindi !== false) return 'hi-IN';
    return 'en-IN';
  }

  async refreshOfflineKnowledgeAvailability() {
    try {
      if (window.janasevaOfflineDB && typeof window.janasevaOfflineDB.getAll === 'function') {
        const docs = await window.janasevaOfflineDB.getAll('knowledge_documents');
        this.hasOfflineKnowledge = Array.isArray(docs) && docs.some((d) => !d.isDeleted);
        this.updateConnectionBadge();
        return this.hasOfflineKnowledge;
      }
    } catch (e) {}
    return false;
  }

  createSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  loadSpeechRate() {
    try {
      const r = parseFloat(localStorage.getItem('janaseva_chat_speech_rate') || '0.95');
      return Number.isFinite(r) && r >= 0.5 && r <= 2.0 ? r : 0.95;
    } catch (e) {
      return 0.95;
    }
  }

  loadAutoSpeak() {
    try {
      return localStorage.getItem('janaseva_chat_auto_speak') === 'true';
    } catch (e) {
      return false;
    }
  }

  resolveInitialLanguage() {
    try {
      const sitePref = localStorage.getItem('janaseva_lang');
      if (sitePref === 'kn') return 'kn-IN';
      if (sitePref === 'hi') return 'hi-IN';
      if (sitePref === 'en') return 'en-IN';
      const chatPref = localStorage.getItem('janaseva_chat_lang');
      if (chatPref && this.supportedLanguages.includes(chatPref)) return chatPref;
    } catch (e) {}
    return 'en-IN';
  }

  getResponseLangShort(langCode = this.currentLang) {
    if (langCode === 'kn' || String(langCode).startsWith('kn')) return 'kn';
    if (langCode === 'hi' || String(langCode).startsWith('hi')) return 'hi';
    return 'en';
  }

  validateResponseLanguage(responseText, expectedLangCode = this.currentLang) {
    const shortLang = this.getResponseLangShort(expectedLangCode);
    if (!responseText || shortLang === 'en') return true;
    if (shortLang === 'kn') return /[\u0C80-\u0CFF]/.test(responseText);
    if (shortLang === 'hi') return /[\u0900-\u097F]/.test(responseText);
    return true;
  }

  initDictionary() {
    this.dict = (this.services && this.services.DICT) ? this.services.DICT : {
      header_title: { en: "JANASEVA AI", kn: "ಜನಸೇವಾ AI", hi: "जनसेवा AI" },
      header_sub: { en: "Multilingual Citizen Service Assistant", kn: "ಬಹುಭಾಷಾ ನಾಗರಿಕ ಸೇವಾ ಸಹಾಯಕ", hi: "बहुभाषी नागरिक सेवा सहायक" },
      welcome: {
        en: "Namaskara! Welcome to JANASEVA AI Assistant.",
        kn: "ನಮಸ್ಕಾರ! ಜನಸೇವಾ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಸಹಾಯಕಕ್ಕೆ ಸ್ವಾಗತ.",
        hi: "नमस्कार! जनसेवा AI सहायक में आपका स्वागत है।"
      },
      input_placeholder: { en: "Type or speak your message...", kn: "ಮಾತನಾಡಿ ಅಥವಾ ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...", hi: "बोलें या संदेश टाइप करें..." },
      lang_select_label: { en: "Assistant Language", kn: "ಸಹಾಯಕ ಭಾಷೆ", hi: "सहायक भाषा" },
      read_aloud: { en: "Read aloud", kn: "ಗಟ್ಟಿಯಾಗಿ ಓದಿ", hi: "बोलकर सुनाएं" },
      stop_audio: { en: "Stop Audio", kn: "ಧ್ವನಿ ನಿಲ್ಲಿಸಿ", hi: "ऑडियो रोकें" },
      tap_to_speak: { en: "Tap mic to speak", kn: "ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿರಿ", hi: "बोलने के लिए माइक दबाएं" },
      listening: { en: "Listening... Speak now", kn: "ಆಲಿಸುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ", hi: "सुन रहा हूँ... अब बोलें" },
      floating_btn_label: { en: "JANASEVA AI", kn: "ಜನಸೇವಾ AI", hi: "जनसेवा AI" },
      floating_btn_aria: { en: "Open JANASEVA AI Assistant", kn: "ಜನಸೇವಾ AI ತೆರೆಯಿರಿ", hi: "जनसेवा AI खोलें" },
      preview_badge: { en: "Complaint Preview & Confirmation", kn: "ದೂರು ಮುನ್ನೋಟ", hi: "शिकायत पूर्वावलोकन" },
      lbl_category: { en: "Category:", kn: "ವರ್ಗ:", hi: "श्रेणी:" },
      lbl_panchayat: { en: "Gram Panchayat:", kn: "ಗ್ರಾಮ ಪಂಚಾಯತ್:", hi: "ग्राम पंचायत:" },
      lbl_location: { en: "Village / Location:", kn: "ಗ್ರಾಮ / ಸ್ಥಳ:", hi: "गाँव / स्थान:" },
      lbl_subject: { en: "Subject:", kn: "ವಿಷಯ:", hi: "विषय:" },
      lbl_description: { en: "Description:", kn: "ವಿವರಣೆ:", hi: "विवरण:" },
      btn_submit_complaint: { en: "Submit Complaint", kn: "ದೂರು ಸಲ್ಲಿಸಿ", hi: "शिकायत जमा करें" },
      btn_cancel_edit: { en: "Cancel", kn: "ರದ್ದುಮಾಡು", hi: "रद्द करें" },
      filing_prompt: { en: "Please review your complaint details:", kn: "ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ:", hi: "कृपया विवरण की समीक्षा करें:" },
      submission_cancelled: { en: "Complaint submission cancelled.", kn: "ದೂರು ಸಲ್ಲಿಕೆ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.", hi: "शिकायत सबमिशन रद्द कर दिया गया।" }
    };
  }

  getLocalizedText(key) {
    return this.getLocalizedDict(key, this.currentLang);
  }

  getLocalizedDict(key, langCode) {
    if (this.services && this.services.DICT && this.services.DICT[key]) {
      return this.services.dictGet(key, langCode);
    }
    const shortLang = this.getResponseLangShort(langCode);
    if (this.dict && this.dict[key]) {
      return this.dict[key][shortLang] || this.dict[key].en;
    }
    return key;
  }

  getStatusName(status, langCode = this.currentLang) {
    if (this.services) return this.services.getStatusLabel(status, langCode);
    return status;
  }

  getCategoryName(cat, langCode = this.currentLang) {
    if (this.services) return this.services.getCategoryLabel(cat, langCode);
    const shortLang = this.getResponseLangShort(langCode);
    const fallbackMap = {
      "Drinking Water": { en: "Drinking Water", kn: "ಕುಡಿಯುವ ನೀರು", hi: "पेयजल" },
      "Water Supply Issues": { en: "Water Supply Issues", kn: "ಕುಡಿಯುವ ನೀರಿನ ಸಮಸ್ಯೆಗಳು", hi: "पेयजल आपूर्ति समस्याएं" }
    };
    if (fallbackMap[cat]) return fallbackMap[cat][shortLang] || fallbackMap[cat].en;
    if (window.janasevaTranslator && shortLang !== 'en') return window.janasevaTranslator.get(cat, shortLang);
    return cat;
  }

  getPanchayatName(gpName, langCode = this.currentLang) {
    const shortLang = this.getResponseLangShort(langCode);
    if (!gpName || shortLang === 'en') return gpName;
    if (window.janasevaTranslator) return window.janasevaTranslator.get(gpName, shortLang);
    return gpName;
  }

  setLanguage(langCode, fromUser = false) {
    if (langCode === 'kn' || langCode === 'kn-IN') langCode = 'kn-IN';
    else if (langCode === 'hi' || langCode === 'hi-IN') langCode = 'hi-IN';
    else langCode = 'en-IN';

    const cfg = this.getChatSettings();
    if (!this.isLanguageEnabled(langCode, cfg)) {
      const langNames = { 'en-IN': 'English', 'kn-IN': 'Kannada (ಕನ್ನಡ)', 'hi-IN': 'Hindi (हिन्दी)' };
      const fallback = this.isLanguageEnabled(this.currentLang, cfg) ? this.currentLang : this.pickEnabledLanguage(cfg);
      if (fromUser) {
        this.addSystemMessage(`${langNames[langCode] || langCode} is disabled in Chat Settings → Language.`);
      }
      const langSelect = document.getElementById('ai-lang-select');
      if (langSelect) langSelect.value = fallback;
      if (this.currentLang === fallback) return;
      langCode = fallback;
    }

    const oldLang = this.currentLang;
    this.currentLang = langCode;
    const shortCode = this.getResponseLangShort(langCode);

    try {
      localStorage.setItem('janaseva_chat_lang', langCode);
      localStorage.setItem('janaseva_lang', shortCode);
    } catch (e) {}

    this.stopSpeaking();
    if (this.recognition) this.recognition.lang = langCode;
    this.updateVoiceForLang(langCode);

    const langSelect = document.getElementById('ai-lang-select');
    if (langSelect && langSelect.value !== langCode) {
      langSelect.value = langCode;
    }

    this.updateInterfaceTranslations();
    this.updateWelcomeMessageOnLangChange();
    this.applyRuntimeSettingsToDOM();

    if (fromUser && cfg.autoTranslation !== false && window.janasevaTranslator && window.janasevaTranslator.currentLang !== shortCode) {
      window.janasevaTranslator.setLanguage(shortCode);
    }

    if (fromUser && oldLang !== langCode) {
      this.addSystemMessage(this.getLocalizedText('lang_changed_pill'));
    }
  }

  // ============================================================================
  // UI TRANSLATION SYNC
  // ============================================================================

  updateInterfaceTranslations() {
    const setText = (sel, key) => {
      const el = document.querySelector(sel);
      if (el) el.innerText = this.getLocalizedText(key);
    };
    const setAttr = (id, attr, key) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute(attr, this.getLocalizedText(key));
    };

    setText('#janaseva-ai-chat-drawer .ai-header-title', 'header_title');
    setText('#janaseva-ai-chat-drawer .ai-header-sub', 'header_sub');
    setAttr('ai-lang-select', 'aria-label', 'lang_select_label');

    const input = document.getElementById('ai-chat-input');
    if (input) input.placeholder = this.getLocalizedText('input_placeholder');

    setAttr('ai-new-chat-btn', 'title', 'new_chat_title');
    setAttr('ai-new-chat-btn', 'aria-label', 'new_chat_title');
    setAttr('ai-history-btn', 'title', 'history_title');
    setAttr('ai-history-btn', 'aria-label', 'history_title');
    setAttr('ai-minimize-btn', 'title', 'minimize_title');
    setAttr('ai-minimize-btn', 'aria-label', 'minimize_title');
    setAttr('ai-maximize-btn', 'title', this.isExpanded ? 'restore_size_title' : 'maximize_title');
    setAttr('ai-maximize-btn', 'aria-label', this.isExpanded ? 'restore_size_title' : 'maximize_title');
    setAttr('ai-clear-chat-btn', 'title', 'clear_chat_title');
    setAttr('ai-clear-chat-btn', 'aria-label', 'clear_chat_title');
    setAttr('ai-close-chat-btn', 'title', 'close_title');
    setAttr('ai-close-chat-btn', 'aria-label', 'close_title');
    setAttr('ai-send-btn', 'aria-label', 'send_btn_label');
    setAttr('ai-send-btn', 'title', 'send_btn_label');
    setAttr('ai-stop-gen-btn', 'aria-label', 'stop_generating_label');
    setAttr('ai-stop-gen-btn', 'title', 'stop_generating_label');
    setAttr('ai-mic-btn', 'aria-label', 'mic_btn_label');
    setAttr('ai-mic-btn', 'title', 'mic_btn_label');
    setAttr('ai-attach-btn', 'aria-label', 'attach_btn_label');
    setAttr('ai-attach-btn', 'title', 'attach_btn_label');
    setAttr('ai-camera-btn', 'aria-label', 'camera_btn_label');
    setAttr('ai-camera-btn', 'title', 'camera_btn_label');

    const statusLabel = document.getElementById('ai-mic-status-label');
    if (statusLabel) {
      statusLabel.innerText = this.isListening ? this.getLocalizedText('listening') : this.getLocalizedText('tap_to_speak');
    }

    const stopBtn = document.getElementById('ai-stop-audio-btn');
    if (stopBtn) {
      const stopTxt = this.getLocalizedText('stop_audio');
      stopBtn.title = stopTxt;
      stopBtn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i> <span>${escapeHtml(stopTxt)}</span>`;
    }

    // Header & panel buttons
    setAttr('ai-settings-btn', 'title', 'settings_title');
    setAttr('ai-settings-btn', 'aria-label', 'settings_title');
    const utilMap = [
      ['#ai-summarize-btn span', 'summarize_btn'],
      ['#ai-export-txt-btn span', 'export_txt_btn'],
      ['#ai-export-pdf-btn span', 'export_pdf_btn'],
      ['#ai-scroll-latest-btn .ai-scroll-txt', 'scroll_latest_label'],
      ['#ai-welcome-heading', 'welcome_heading'],
      ['#ai-hist-title-lbl', 'hist_heading'],
      ['#ai-hist-clear-all-btn', 'hist_clear_all'],
      ['#ai-hist-load-more-btn', 'hist_load_more'],
      ['#ai-lbl-voice', 'voice_label'],
      ['#ai-lbl-speed', 'speed_label'],
      ['#ai-lbl-autospeak', 'auto_speak_label'],
      ['#ai-typing-text', 'typing_status']
    ];
    utilMap.forEach(([sel, key]) => setText(sel, key));

    const histSearch = document.getElementById('ai-hist-search');
    if (histSearch) histSearch.placeholder = this.getLocalizedText('hist_search_ph');

    // Welcome Suggested Prompt chips
    document.querySelectorAll('#ai-welcome-prompts .ai-welcome-chip').forEach((chip) => {
      const key = chip.getAttribute('data-qa-key');
      const span = chip.querySelector('span');
      if (key && span) span.innerText = this.getLocalizedText(key);
    });

    // Message Action Tooltips
    const readTitle = this.getLocalizedText('read_aloud');
    const copyTitle = this.getLocalizedText('copy_btn');
    const regenTitle = this.getLocalizedText('regenerate_btn');
    document.querySelectorAll('#ai-chat-messages .ai-read-bubble-btn').forEach((b) => {
      b.title = readTitle;
      b.setAttribute('aria-label', readTitle);
    });
    document.querySelectorAll('#ai-chat-messages .ai-copy-bubble-btn').forEach((b) => {
      b.title = copyTitle;
      b.setAttribute('aria-label', copyTitle);
    });
    document.querySelectorAll('#ai-chat-messages .ai-regen-bubble-btn').forEach((b) => {
      b.title = regenTitle;
      b.setAttribute('aria-label', regenTitle);
    });

    // Floating Launcher
    const floatLabel = document.querySelector('.ai-assistant-floating-btn .ai-btn-label');
    if (floatLabel) floatLabel.innerText = this.getLocalizedText('floating_btn_label');
    setAttr('janaseva-ai-assistant-widget', 'aria-label', 'floating_btn_aria');

    // Active Preview Card
    const card = document.getElementById('ai-active-preview-card');
    if (card && this.currentGrievanceDraft) {
      this.refreshPreviewCardTranslations(card, this.currentGrievanceDraft);
    }

    // Camera Modal labels
    setText('#ai-cam-title-txt', 'cam_title');
    setText('#ai-cam-switch span', 'cam_switch');
    setText('#ai-cam-capture span', 'cam_capture');
    setText('#ai-cam-retake span', 'cam_retake');
    setText('#ai-cam-use span', 'cam_use');

    this.updateConnectionBadge();
    this.renderVoiceSelector();
  }

  updateWelcomeMessageOnLangChange() {
    const welcomeTexts = [
      this.getLocalizedDict('welcome', 'en-IN'),
      this.getLocalizedDict('welcome', 'kn-IN'),
      this.getLocalizedDict('welcome', 'hi-IN')
    ];

    const bubbles = document.querySelectorAll('#ai-chat-messages .ai-bubble.assistant');
    bubbles.forEach((b) => {
      const text = b.innerText.trim();
      const isWelcome =
        b.getAttribute('data-msg-type') === 'welcome' ||
        welcomeTexts.some((w) => text.includes(w.substring(0, 26)));
      if (isWelcome) {
        const newWelcome = this.getLocalizedText('welcome');
        b.setAttribute('data-msg-type', 'welcome');
        b.setAttribute('data-msg-lang', this.getResponseLangShort());
        const bodyEl = b.querySelector('.ai-bubble-content');
        if (bodyEl) {
          bodyEl.innerHTML = this.formatSafeMessageHtml(newWelcome);
        } else {
          b.innerHTML = `<div class="ai-bubble-content">${this.formatSafeMessageHtml(newWelcome)}</div>`;
        }
        const row = b.closest('.ai-message-row');
        if (row) {
          const readBtn = row.querySelector('.ai-read-bubble-btn');
          if (readBtn) readBtn.onclick = () => this.speak(newWelcome);
          const copyBtn = row.querySelector('.ai-copy-bubble-btn');
          if (copyBtn) copyBtn.onclick = () => this.copyMessageText(newWelcome, copyBtn);
        }
      }
    });

    if (this.messages.length > 0) {
      this.messages.forEach((m) => {
        if (m.sender === 'assistant' && (m.isWelcome || welcomeTexts.some((w) => m.text.includes(w.substring(0, 26))))) {
          m.text = this.getLocalizedText('welcome');
        }
      });
    }
  }

  updateConnectionBadge() {
    const badge = document.getElementById('ai-conn-status-pill');
    if (!badge) return;
    const cfg = this.getChatSettings();

    if (this.isSyncing) {
      badge.className = 'ai-conn-pill syncing';
      badge.title = 'Synchronizing knowledge base & message queue';
      badge.innerHTML = `<span class="dot"></span> ${escapeHtml(this.getLocalizedText('status_syncing'))}`;
      return;
    }

    if (!navigator.onLine) {
      const hasLocalKb = cfg.offlineAi !== false && cfg.aiKnowledgeCentre !== false && this.hasOfflineKnowledge;
      badge.className = hasLocalKb ? 'ai-conn-pill offline-kb' : 'ai-conn-pill offline';
      badge.title = hasLocalKb ? 'Offline – Local offline knowledge base active' : 'Offline – Limited connectivity mode';
      badge.innerHTML = `<span class="dot"></span> ${escapeHtml(this.getLocalizedText(hasLocalKb ? 'status_offline_kb' : 'status_offline'))}`;
      return;
    }

    if (this.providerStatus && this.providerStatus.connected && cfg.onlineAi !== false) {
      badge.className = 'ai-conn-pill online-ai';
      badge.title = 'Online – Live Cloud AI provider connected';
      badge.innerHTML = `<span class="dot"></span> ${escapeHtml(this.getLocalizedText('status_online_ai'))}`;
    } else if (this.providerStatus && this.providerStatus.lastErrorCode && this.providerStatus.lastErrorCode !== 'NOT_CONFIGURED') {
      badge.className = 'ai-conn-pill error';
      badge.title = 'AI Provider Error – Check server API configuration';
      badge.innerHTML = `<span class="dot"></span> ${escapeHtml(this.getLocalizedText('status_error'))}`;
    } else {
      badge.className = 'ai-conn-pill guided';
      badge.title = 'Local Mode – AI Provider not configured. Running on verified Gram Panchayat knowledge base.';
      badge.innerHTML = `<span class="dot"></span> ${escapeHtml(this.getLocalizedText('status_guided_mode'))}`;
    }
  }

  // ============================================================================
  // LIVE SPEECH RECOGNITION & SYNTHESIS
  // ============================================================================

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLang;

      this.recognition.onstart = () => {
        this._recognitionCancelled = false;
        this.isListening = true;
        this.updateMicUI(true);
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        let finalStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalStr += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        const inputEl = document.getElementById('ai-chat-input');
        if (inputEl) {
          inputEl.value = finalStr || interim;
          this.autoResizeInput();
          this.updateCharCounter();
        }
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        this.updateMicUI(false);
        this._recognitionCancelled = true;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.addSystemMessage(this.getLocalizedText('mic_permission_denied'));
        } else if (event.error === 'language-not-supported') {
          this.addSystemMessage(this.getLocalizedText('stt_lang_not_supported'));
        } else if (event.error === 'network') {
          this.addSystemMessage(this.getLocalizedText('network_error'));
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateMicUI(false);
        if (this._recognitionCancelled) return;
        const inputEl = document.getElementById('ai-chat-input');
        if (inputEl && inputEl.value.trim().length > 1) {
          const text = inputEl.value.trim();
          inputEl.value = '';
          this.autoResizeInput();
          this.updateCharCounter();
          this.handleUserMessage(text);
        }
      };
    } catch (e) {
      console.warn('[JANASEVA AI STT] Init caught:', e);
    }
  }

  initSpeechSynthesis() {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth.getVoices() || [];
      this.availableVoices = voices;
      this.updateVoiceForLang(this.currentLang, voices);
      this.renderVoiceSelector();
    };
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }

  getMatchingVoicesForLang(langCode, voicesList = null) {
    const voices = voicesList || (this.synth ? this.synth.getVoices() : []);
    if (!voices || !voices.length) return [];
    const prefix = langCode.split('-')[0].toLowerCase();
    return voices.filter((v) => {
      const vl = (v.lang || '').replace('_', '-').toLowerCase();
      const vn = (v.name || '').toLowerCase();
      return vl === langCode.toLowerCase() ||
        vl.startsWith(prefix + '-') ||
        vl === prefix ||
        (prefix === 'kn' && vn.includes('kannada')) ||
        (prefix === 'hi' && (vn.includes('hindi') || vn.includes('kalpana') || vn.includes('hemant'))) ||
        (prefix === 'en' && vn.includes('english'));
    });
  }

  updateVoiceForLang(langCode, voicesList = null) {
    if (!this.synth) return;
    const voices = voicesList || this.synth.getVoices();
    if (!voices || !voices.length) return;
    const matching = this.getMatchingVoicesForLang(langCode, voices);
    if (!matching.length) {
      this.selectedVoice = null;
      return;
    }
    const exact = matching.find((v) => v.lang.replace('_', '-').toLowerCase() === langCode.toLowerCase());
    this.selectedVoice = exact || matching[0];
  }

  renderVoiceSelector() {
    const sel = document.getElementById('ai-voice-select');
    if (!sel) return;
    const matching = this.getMatchingVoicesForLang(this.currentLang);
    if (!matching.length) {
      sel.innerHTML = `<option value="">${escapeHtml(this.getLocalizedText('no_native_voice'))}</option>`;
      sel.disabled = true;
      return;
    }
    sel.disabled = false;
    sel.innerHTML = matching
      .map((v, idx) => `<option value="${escapeHtml(v.voiceURI || v.name)}" ${(this.selectedVoice && this.selectedVoice.name === v.name) || (!this.selectedVoice && idx === 0) ? 'selected' : ''}>${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`)
      .join('');
  }

  speak(text, isManual = false) {
    const cfg = this.getChatSettings();
    if (cfg.voiceResponses === false || cfg.textToSpeech === false) {
      if (isManual) {
        this.addSystemMessage('Voice responses / Text-to-Speech are disabled in Chat Settings.');
      }
      return;
    }
    if (!this.synth || !text) return;
    this.stopSpeaking();

    const prefix = this.currentLang.split('-')[0].toLowerCase();
    if (!this.selectedVoice) this.updateVoiceForLang(this.currentLang);

    if (this.selectedVoice) {
      const vl = (this.selectedVoice.lang || '').replace('_', '-').toLowerCase().split('-')[0];
      const vn = (this.selectedVoice.name || '').toLowerCase();
      const nameMatches = vn.includes(prefix === 'kn' ? 'kannada' : (prefix === 'hi' ? 'hindi' : 'english'));
      if (vl !== prefix && !nameMatches) {
        this.addSystemMessage(this.getLocalizedText('voice_not_supported_warning'));
        return;
      }
    } else if (prefix === 'kn' || prefix === 'hi') {
      this.addSystemMessage(this.getLocalizedText('voice_not_supported_warning'));
      return;
    }

    const cleanText = String(text).replace(/<[^>]+>/g, '').replace(/\*+/g, '').replace(/\[.*?\]/g, '').trim();
    if (!cleanText) return;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = this.currentLang;
      utterance.rate = Number(cfg.speechRate || this.speechRate) || 0.95;
      if (this.selectedVoice) {
        try { utterance.voice = this.selectedVoice; } catch (e) {}
      }
      const stopBtn = document.getElementById('ai-stop-audio-btn');
      utterance.onstart = () => { if (stopBtn) stopBtn.classList.add('speaking'); };
      utterance.onend = () => { if (stopBtn) stopBtn.classList.remove('speaking'); };
      utterance.onerror = () => { if (stopBtn) stopBtn.classList.remove('speaking'); };
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('[JANASEVA AI TTS] Speak error:', err);
    }
  }

  stopSpeaking() {
    if (this.synth && (this.synth.speaking || this.synth.pending)) {
      this.synth.cancel();
    }
    const stopBtn = document.getElementById('ai-stop-audio-btn');
    if (stopBtn) stopBtn.classList.remove('speaking');
  }

  toggleListening() {
    const cfg = this.getChatSettings();
    if (cfg.voiceInput === false) {
      this.addSystemMessage('Voice input is disabled in Chat Settings → Communication.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.addSystemMessage(this.getLocalizedText('speech_not_supported'));
      return;
    }

    if (this.isListening) {
      this._recognitionCancelled = false;
      if (this.recognition) this.recognition.stop();
    } else {
      this.stopSpeaking();
      if (!this.recognition) this.initSpeechRecognition();
      if (this.recognition) {
        this.recognition.lang = this.currentLang;
        try {
          this.recognition.start();
        } catch (err) {
          this.addSystemMessage(this.getLocalizedText('speech_not_supported'));
        }
      }
    }
  }

  updateMicUI(active) {
    const micBtn = document.getElementById('ai-mic-btn');
    const micStatus = document.getElementById('ai-mic-status-label');
    if (!micBtn) return;
    if (active) {
      micBtn.classList.add('recording-pulse');
      micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
      if (micStatus) micStatus.innerText = this.getLocalizedText('listening');
    } else {
      micBtn.classList.remove('recording-pulse');
      micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
      if (micStatus) micStatus.innerText = this.getLocalizedText('tap_to_speak');
    }
  }

  // ============================================================================
  // CONVERSATION CONTROLLER & MEMORY
  // ============================================================================

  detectScriptLanguage(text) {
    const s = String(text || '');
    if (/[\u0C80-\u0CFF]/.test(s)) return 'kn-IN';
    if (/[\u0900-\u097F]/.test(s)) return 'hi-IN';
    if (/[A-Za-z]{2,}/.test(s)) return 'en-IN';
    return null;
  }

  async revealAssistantStream(msgRecord, fullText, reqToken, cfg) {
    if (!msgRecord || cfg.streamingResponses === false || !fullText || fullText.length < 40) return;
    const row = document.querySelector(`#ai-chat-messages .ai-message-row[data-msg-id="${msgRecord.id}"]`);
    const contentEl = row ? row.querySelector('.ai-bubble-content') : null;
    if (!contentEl) return;

    const steps = 6;
    const chunkLen = Math.max(12, Math.ceil(fullText.length / steps));
    for (let pos = chunkLen; pos < fullText.length; pos += chunkLen) {
      if (this.activeAbortFlag || reqToken !== this.activeRequestToken) return;
      contentEl.innerHTML = this.formatSafeMessageHtml(fullText.slice(0, pos));
      this.scrollToBottom();
      await new Promise((r) => setTimeout(r, 18));
    }
    if (!this.activeAbortFlag && reqToken === this.activeRequestToken) {
      contentEl.innerHTML = this.formatSafeMessageHtml(fullText);
      this.scrollToBottom();
    }
  }

  async handleUserMessage(userText, options = {}) {
    const cfg = this.getChatSettings();
    const raw = String(userText || '').trim();
    if (!raw) {
      this.addSystemMessage(this.getLocalizedText('empty_input_warning'));
      return;
    }
    if (cfg.aiAssistant === false) {
      this.addSystemMessage('AI Assistant is currently turned off in Chat Settings → General. Enable "AI Assistant" to resume chatting.');
      return;
    }
    if (raw.length > 1000) {
      this.addSystemMessage(this.getLocalizedText('length_limit_warning'));
      return;
    }
    if (this.isGenerating) {
      this.addSystemMessage(this.getLocalizedText('duplicate_submit_guard'));
      return;
    }

    // Enforce Language Settings & Auto Language Detection without silent disabled translation
    const detectedLang = this.detectScriptLanguage(raw);
    if (detectedLang && !this.isLanguageEnabled(detectedLang, cfg)) {
      const langNames = { 'en-IN': 'English', 'kn-IN': 'Kannada', 'hi-IN': 'Hindi' };
      const welcomeHero = document.getElementById('ai-welcome-hero');
      if (welcomeHero) welcomeHero.style.display = 'none';
      this.addMessage('user', raw, { status: 'sent' });
      const activeFallback = this.isLanguageEnabled(this.currentLang, cfg) ? this.currentLang : this.pickEnabledLanguage(cfg);
      this.currentLang = activeFallback;
      this.addMessage(
        'assistant',
        `${langNames[detectedLang] || detectedLang} is currently disabled in Chat Settings → Language. I will not translate into disabled languages; please ask in an enabled language or enable ${langNames[detectedLang] || detectedLang} in Settings.`,
        { forUserText: raw }
      );
      return;
    }
    if (detectedLang && cfg.autoLanguageDetection !== false && detectedLang !== this.currentLang) {
      this.setLanguage(detectedLang, false);
    }
    if (!this.isLanguageEnabled(this.currentLang, cfg)) {
      this.currentLang = this.pickEnabledLanguage(cfg);
      this.updateInterfaceTranslations();
    }

    // Remove welcome hero banner once conversation begins
    const welcomeHero = document.getElementById('ai-welcome-hero');
    if (welcomeHero) welcomeHero.style.display = 'none';

    const allowAttachmentsNow = cfg.attachments !== false;
    const attachedSnapshot = allowAttachmentsNow ? this.pendingAttachments.slice() : [];
    let userMsgRecord = options.retryMsgRecord || null;
    if (!userMsgRecord) {
      userMsgRecord = this.addMessage('user', raw, {
        status: 'sending',
        attachments: attachedSnapshot
      });
    } else {
      this.setMessageStatus(userMsgRecord.id, 'sending');
    }

    if (!this.sessionTitle) {
      this.sessionTitle = raw.slice(0, 60);
    }

    // Clear composer pending attachments if sent
    if (!options.isRegenerate && !options.retryMsgRecord) {
      this.pendingAttachments = [];
      this.renderAttachmentStrip();
    }

    this.setGeneratingState(true);
    const reqToken = ++this.activeRequestToken;
    this.activeAbortFlag = false;

    try {
      // 1. Confirmation / cancellation shortcut when preview card is open
      const lower = raw.toLowerCase();
      if (this.isAwaitingConfirmation && this.currentGrievanceDraft) {
        const confirmWords = ['yes', 'submit', 'confirm', 'proceed', 'ಹೌದು', 'ಸಲ್ಲಿಸು', 'ಖಚಿತಪಡಿಸು', 'हाँ', 'सबमिट', 'जमा', 'पुष्टि'];
        const cancelWords = ['no', 'cancel', 'stop', 'ಬೇಡ', 'ರದ್ದು', 'ನಿಲ್ಲಿಸು', 'नहीं', 'रद्द', 'रोको'];
        if (confirmWords.some((w) => lower === w || lower.startsWith(w + ' '))) {
          this.setMessageStatus(userMsgRecord.id, 'sent');
          this.setGeneratingState(false);
          await this.executeGrievanceSubmission();
          return;
        }
        if (cancelWords.some((w) => lower === w || lower.startsWith(w + ' '))) {
          this.isAwaitingConfirmation = false;
          this.chatDraftState = null;
          const card = document.getElementById('ai-active-preview-card');
          if (card) card.remove();
          this.setMessageStatus(userMsgRecord.id, 'sent');
          this.setGeneratingState(false);
          const cancelMsg = this.getLocalizedText('submission_cancelled');
          this.addMessage('assistant', cancelMsg, { forUserText: raw });
          if (this.autoSpeak && cfg.voiceResponses !== false && cfg.textToSpeech !== false && cfg.autoVoicePlayback !== false) {
            this.speak(cancelMsg);
          }
          await this.persistCurrentSession();
          return;
        }
      }

      // 2. Determine backend vs local path
      const user = this.getCurrentUser();
      const canCallFunctions =
        navigator.onLine &&
        cfg.onlineAi !== false &&
        window.isFirebaseAvailable &&
        typeof firebase !== 'undefined' &&
        typeof firebase.functions === 'function' &&
        firebase.auth &&
        firebase.auth().currentUser;

      let responsePayload = null;
      const useHistoryMemory =
        cfg.conversationMemory !== false &&
        cfg.rememberContext !== false &&
        cfg.contextAwareResponses !== false;

      if (canCallFunctions) {
        const recentHistory = useHistoryMemory
          ? this.messages
              .filter((m) => !m.isWelcome && m.id !== userMsgRecord.id)
              .slice(-10)
              .map((m) => ({ sender: m.sender, text: m.text }))
          : [];

        const fn = firebase.functions().httpsCallable('chatAssistant');
        const res = await fn({
          message: raw.slice(0, 1000),
          lang: this.currentLang,
          sessionId: this.sessionId,
          history: recentHistory,
          draftState: cfg.complaintUnderstanding !== false ? this.chatDraftState : null,
          lastTrackedId: useHistoryMemory ? this.lastTrackedId : null,
          attachmentsCount: (this.currentGrievanceDraft?.attachments?.length || 0) + attachedSnapshot.length,
          chatSettings: cfg
        });
        responsePayload = res && res.data ? res.data : null;
      } else if (
        navigator.onLine &&
        cfg.onlineAi !== false &&
        window.isFirebaseAvailable &&
        typeof firebase !== 'undefined' &&
        typeof firebase.functions === 'function' &&
        (!firebase.auth || !firebase.auth().currentUser)
      ) {
        // Unauthenticated public FAQ endpoint (never accesses private complaints/history)
        try {
          const isPrivateAttempt = /JAN-\d{4}-\d{3,6}|track|status|history|register|complain|ದೂರು|ಟ್ರ್ಯಾಕ್|शिकायत|ट्रैक/i.test(raw);
          if (!isPrivateAttempt) {
            const pubFn = firebase.functions().httpsCallable('publicPortalFaq');
            const pubRes = await pubFn({ message: raw.slice(0, 500), lang: this.currentLang, chatSettings: cfg });
            if (pubRes && pubRes.data) responsePayload = pubRes.data;
          }
        } catch (e) {}
      }

      // Abort check if citizen clicked "Stop generating"
      if (this.activeAbortFlag || reqToken !== this.activeRequestToken) {
        this.setMessageStatus(userMsgRecord.id, 'sent');
        return;
      }

      // 3. Fallback to Local / Offline Multi-turn Civic Engine if cloud callable wasn't used
      if (!responsePayload) {
        if (!navigator.onLine && cfg.offlineAi === false) {
          this.setMessageStatus(userMsgRecord.id, 'sent');
          this.addMessage('assistant', 'Offline AI Mode is currently disabled in Chat Settings → General. Please reconnect to the internet or enable Offline AI.', { forUserText: raw });
          await this.persistCurrentSession();
          return;
        }
        responsePayload = await this.runLocalCivicAssistant(raw, user, attachedSnapshot);
      }

      if (this.activeAbortFlag || reqToken !== this.activeRequestToken) {
        this.setMessageStatus(userMsgRecord.id, 'sent');
        return;
      }

      this.setMessageStatus(userMsgRecord.id, 'sent');

      if (responsePayload.providerStatus) {
        this.providerStatus = responsePayload.providerStatus;
        this.updateConnectionBadge();
      }

      // Update conversation memory state
      if (responsePayload.lastTrackedId && useHistoryMemory) this.lastTrackedId = responsePayload.lastTrackedId;
      if (responsePayload.draftState !== undefined) this.chatDraftState = responsePayload.draftState;

      // Render assistant text + progressive stream + contextual cards
      const replyText = responsePayload.reply || this.getLocalizedText('network_error');
      const suggestedList = cfg.suggestedQuestions === false ? [] : (responsePayload.suggestedQuestions || []);
      const aMsg = this.addMessage('assistant', replyText, {
        forUserText: raw,
        suggestedQuestions: suggestedList,
        navigationTarget: responsePayload.navigationTarget || null,
        isEmergency: Boolean(responsePayload.isEmergency)
      });

      await this.revealAssistantStream(aMsg, replyText, reqToken, cfg);
      if (this.activeAbortFlag || reqToken !== this.activeRequestToken) return;

      if (responsePayload.isEmergency && Array.isArray(responsePayload.emergencyContacts)) {
        this.renderEmergencyCard(responsePayload.emergencyContacts);
      }

      if (Array.isArray(responsePayload.panchayatContacts) && responsePayload.panchayatContacts.length) {
        this.renderPanchayatContactsCard(responsePayload.panchayatContacts);
      }

      if (responsePayload.trackedComplaint) {
        this.renderTrackedComplaintCard(responsePayload.trackedComplaint, responsePayload.trackedComplaints || null);
      } else if (Array.isArray(responsePayload.trackedComplaints) && responsePayload.trackedComplaints.length) {
        this.renderComplaintHistoryCards(responsePayload.trackedComplaints);
      }

      if (cfg.autoKnowledgeCitation !== false && Array.isArray(responsePayload.knowledgeSources) && responsePayload.knowledgeSources.length) {
        this.renderKnowledgeSourcesCard(responsePayload.knowledgeSources, responsePayload.conflictNotice || null);
      }

      if (cfg.complaintUnderstanding !== false && responsePayload.readyForPreview && responsePayload.draftState) {
        this.prepareDraftFromConversation(responsePayload.draftState, attachedSnapshot);
      }

      // If AI provider errored truthfully on server, attach retry option
      if (responsePayload.providerError && aMsg) {
        this.attachRetryActionToUserMsg(userMsgRecord.id);
      }

      if (this.autoSpeak && cfg.voiceResponses !== false && cfg.textToSpeech !== false && cfg.autoVoicePlayback !== false) {
        this.speak(replyText);
      }
      await this.persistCurrentSession();
    } catch (err) {
      console.warn('[JANASEVA AI] Message handling error:', err);
      this.setMessageStatus(userMsgRecord.id, 'failed');
      this.attachRetryActionToUserMsg(userMsgRecord.id);
      const errMsg = err?.code === 'resource-exhausted'
        ? (err.message || this.getLocalizedText('network_error'))
        : this.getLocalizedText('network_error');
      this.addSystemMessage(errMsg);
    } finally {
      if (reqToken === this.activeRequestToken) {
        this.setGeneratingState(false);
      }
    }
  }

  getCurrentUser() {
    if (window.authService && window.authService.currentUser) {
      return window.authService.currentUser;
    }
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      const fbUser = firebase.auth().currentUser;
      return {
        uid: fbUser.uid,
        name: fbUser.displayName || 'Citizen',
        email: fbUser.email || '',
        role: 'citizen'
      };
    }
    return null;
  }

  async runLocalCivicAssistant(rawMessage, user = null, attachedSnapshot = []) {
    const cfg = this.getChatSettings();
    const engine = this.services ? this.services.civicEngine : null;
    if (!engine) {
      return { reply: this.getLocalizedText('welcome'), suggestedQuestions: [] };
    }

    const res = engine.processLocalTurn({
      message: rawMessage,
      lang: this.currentLang,
      draftState: cfg.complaintUnderstanding !== false ? this.chatDraftState : null,
      lastTrackedId: (cfg.conversationMemory !== false && cfg.rememberContext !== false) ? this.lastTrackedId : null,
      user,
      attachmentsCount: (Array.isArray(attachedSnapshot) ? attachedSnapshot.length : 0) + (this.currentGrievanceDraft?.attachments?.length || 0),
      settings: cfg
    });

    if (res.intent === 'local_track') {
      return await this.resolveLocalTrackingResponse(res.targetId, user);
    }

    // Query AI Knowledge Centre RAG when appropriate (knowledge query, fallback, or non-complaint FAQ)
    const allowKnowledgeRag = cfg.aiKnowledgeCentre !== false && cfg.knowledgeSearch !== false;
    const shouldQueryKnowledge =
      allowKnowledgeRag && (
        res.intent === 'local_knowledge_query' ||
        res.intent === 'local_knowledge_fallback' ||
        res.intent === 'faq_services' ||
        res.intent === 'faq_timings' ||
        (cfg.schemeSearch !== false && /scheme|subsidy|pension|ration|pmay|mgnrega|benefit|eligibility|ಯೋಜನೆ|योजना|पात्रता/i.test(rawMessage))
      );

    if (shouldQueryKnowledge && window.JanasevaKnowledgeCentre && typeof window.JanasevaKnowledgeCentre.queryKnowledgeRAG === 'function') {
      try {
        const useMemory = cfg.conversationMemory !== false && cfg.contextAwareResponses !== false && cfg.rememberContext !== false;
        const recentHistory = useMemory
          ? this.messages.filter((m) => !m.isWelcome).slice(-6).map((m) => ({ sender: m.sender, text: m.text }))
          : [];
        const ragRes = await window.JanasevaKnowledgeCentre.queryKnowledgeRAG({
          query: res.query || rawMessage,
          responseLang: this.currentLang,
          history: recentHistory,
          limit: Number(cfg.knowledgeSearchLimit || 5),
          semanticSearch: cfg.semanticSearch !== false,
          crossLanguageSearch: cfg.crossLanguageSearch !== false,
          schemeSearch: cfg.schemeSearch !== false,
          contextAware: cfg.contextAwareResponses !== false
        });

        const topScore = ragRes?.retrieval?.results?.[0]?.score || 0;
        const strongMatch = ragRes && ragRes.found && (
          res.intent === 'local_knowledge_query' ||
          res.intent === 'local_knowledge_fallback' ||
          topScore >= 0.34
        );

        if (strongMatch) {
          return {
            intent: 'knowledge_rag',
            reply: ragRes.reply,
            knowledgeSources: cfg.autoKnowledgeCitation === false ? [] : (ragRes.sources || []),
            hasConflict: Boolean(ragRes.hasConflict),
            conflictNotice: ragRes.conflictNotice || null,
            navigationTarget: 'knowledge-centre.html',
            suggestedQuestions: cfg.suggestedQuestions === false ? [] : (res.suggestedQuestions || []),
            providerStatus: { configured: false, connected: false, provider: 'guided-citizen-engine' }
          };
        }

        if (res.intent === 'local_knowledge_query' || res.intent === 'local_knowledge_fallback') {
          return {
            intent: res.intent === 'local_knowledge_query' ? 'knowledge_not_found' : 'fallback',
            reply: res.fallbackReply || ragRes.reply,
            knowledgeSources: [],
            navigationTarget: res.intent === 'local_knowledge_query' ? 'knowledge-centre.html' : null,
            suggestedQuestions: cfg.suggestedQuestions === false ? [] : (res.suggestedQuestions || []),
            providerStatus: { configured: false, connected: false, provider: 'guided-citizen-engine' }
          };
        }
      } catch (ragErr) {
        console.warn('[JANASEVA AI] Local RAG query warning:', ragErr.message);
      }
    }

    if (res.intent === 'local_knowledge_query' || res.intent === 'local_knowledge_fallback') {
      return {
        intent: 'fallback',
        reply: allowKnowledgeRag
          ? res.fallbackReply
          : 'AI Knowledge Centre retrieval or Knowledge Search is currently turned off in Chat Settings. Enable it in Settings → General or Intelligence to search uploaded documents.',
        suggestedQuestions: cfg.suggestedQuestions === false ? [] : (res.suggestedQuestions || []),
        providerStatus: { configured: false, connected: false, provider: 'guided-citizen-engine' }
      };
    }

    return {
      ...res,
      suggestedQuestions: cfg.suggestedQuestions === false ? [] : (res.suggestedQuestions || []),
      providerStatus: {
        configured: false,
        connected: false,
        provider: 'guided-citizen-engine'
      }
    };
  }

  async resolveLocalTrackingResponse(targetId, user) {
    if (!user) {
      return {
        intent: 'track_login_required',
        reply: this.getLocalizedText('track_login_required'),
        navigationTarget: 'login.html',
        suggestedQuestions: [this.getLocalizedText('qa_5'), this.getLocalizedText('qa_12')]
      };
    }

    let complaints = [];
    if (window.isFirebaseAvailable && window.fbDb) {
      try {
        const snap = user.role === 'admin'
          ? await window.fbDb.collection('complaints').limit(20).get()
          : (user.role === 'receiver' && user.panchayatId
              ? await window.fbDb.collection('complaints').where('panchayatId', '==', user.panchayatId).limit(20).get()
              : await window.fbDb.collection('complaints').where('userId', '==', user.uid).limit(20).get());
        snap.forEach((d) => complaints.push(d.data()));
      } catch (e) {}
    }

    if (!complaints.length && typeof JanasevaDB !== 'undefined') {
      const all = JanasevaDB.get('complaints', []);
      if (user.role === 'admin') {
        complaints = all;
      } else if (user.role === 'receiver' && user.panchayatId) {
        complaints = all.filter((c) => c.panchayatId === user.panchayatId);
      } else {
        complaints = all.filter((c) =>
          c.userId === user.uid ||
          c.citizenUid === user.uid ||
          (user.email && c.citizenEmail && c.citizenEmail.toLowerCase() === user.email.toLowerCase())
        );
      }
    }

    complaints = complaints.filter((c) => c && c.deletedByCitizen !== true);

    if (targetId) {
      // Check if complaint exists under another owner in local DB (for strict unauthorized denial)
      let found = complaints.find((c) => String(c.complaintId || '').toUpperCase() === targetId);
      if (!found && typeof JanasevaDB !== 'undefined') {
        const existsElsewhere = JanasevaDB.get('complaints', []).some((c) => String(c.complaintId || '').toUpperCase() === targetId);
        if (existsElsewhere) {
          const s = this.getResponseLangShort();
          return {
            intent: 'track_unauthorized',
            reply: s === 'kn'
              ? `ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ದೂರು ${targetId} ನಿಮ್ಮ ಖಾತೆಗೆ ಸೇರಿಲ್ಲ.`
              : (s === 'hi'
                ? `प्रवेश अस्वीकृत: शिकायत ${targetId} आपके खाते के अंतर्गत नहीं है।`
                : `Access Denied: Complaint ${targetId} does not belong to your account.`),
            suggestedQuestions: [this.getLocalizedText('qa_3'), this.getLocalizedText('qa_1')]
          };
        }
      }
      if (!found) {
        const s = this.getResponseLangShort();
        return {
          intent: 'track_not_found',
          reply: s === 'kn'
            ? `ದೂರು ಸಂಖ್ಯೆ ${targetId} ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಕಂಡುಬಂದಿಲ್ಲ.`
            : (s === 'hi'
              ? `शिकायत संख्या ${targetId} आपके खाते में नहीं मिली।`
              : `Complaint ${targetId} was not found under your account.`),
          suggestedQuestions: [this.getLocalizedText('qa_3'), this.getLocalizedText('qa_1')]
        };
      }

      const timeline = await this.fetchComplaintTimelineLocal(found);
      const s = this.getResponseLangShort();
      const locStatus = this.getStatusName(found.status || 'Submitted');
      const locCat = this.getCategoryName(found.category || 'General');
      return {
        intent: 'track_single',
        lastTrackedId: found.complaintId,
        trackedComplaint: { ...found, timeline },
        navigationTarget: `track.html?id=${encodeURIComponent(found.complaintId)}`,
        reply: s === 'kn'
          ? `ದೂರು ${found.complaintId} (${locCat}) ಪ್ರಸ್ತುತ '${locStatus}' ಸ್ಥಿತಿಯಲ್ಲಿದೆ.`
          : (s === 'hi'
            ? `शिकायत ${found.complaintId} (${locCat}) वर्तमान में '${locStatus}' स्थिति में है।`
            : `Complaint ${found.complaintId} (${locCat}) is currently '${locStatus}'.`),
        suggestedQuestions: [this.getLocalizedText('qa_3'), this.getLocalizedText('qa_10')]
      };
    }

    if (!complaints.length) {
      return {
        intent: 'track_empty',
        reply: this.getLocalizedText('track_no_complaints'),
        suggestedQuestions: [this.getLocalizedText('qa_1')]
      };
    }

    complaints.sort((a, b) => new Date(b.submissionTimestamp || b.createdAt || 0) - new Date(a.submissionTimestamp || a.createdAt || 0));
    const latest = complaints[0];
    const timeline = await this.fetchComplaintTimelineLocal(latest);
    const s = this.getResponseLangShort();
    return {
      intent: 'track_list',
      lastTrackedId: latest.complaintId,
      trackedComplaint: { ...latest, timeline },
      trackedComplaints: complaints.slice(0, 8),
      navigationTarget: 'citizen-dashboard.html',
      reply: s === 'kn'
        ? `ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ${complaints.length} ದೂರು(ಗಳು) ಕಂಡುಬಂದಿವೆ. ಇತ್ತೀಚಿನ ದೂರು ${latest.complaintId} '${this.getStatusName(latest.status)}' ಹಂತದಲ್ಲಿದೆ.`
        : (s === 'hi'
          ? `आपके खाते में ${complaints.length} शिकायत(ें) मिलीं। नवीनतम शिकायत ${latest.complaintId} '${this.getStatusName(latest.status)}' स्थिति में है।`
          : `Found ${complaints.length} complaint(s) under your account. Latest: ${latest.complaintId} (${this.getStatusName(latest.status)}).`),
      suggestedQuestions: [this.getLocalizedText('qa_1'), this.getLocalizedText('qa_10')]
    };
  }

  async fetchComplaintTimelineLocal(complaint) {
    const cid = complaint.complaintId;
    let timeline = [];
    if (window.complaintStorageManager && typeof window.complaintStorageManager.getComplaintHistory === 'function') {
      try {
        const upds = await window.complaintStorageManager.getComplaintHistory(cid);
        timeline = upds.map((u) => ({
          oldStatus: u.oldStatus,
          newStatus: u.newStatus,
          note: u.remarks || '',
          timestamp: u.formattedDate || u.timestamp || '',
          updatedBy: u.authorName || 'Gram Panchayat Desk'
        }));
      } catch (e) {}
    }
    if (!timeline.length && typeof JanasevaDB !== 'undefined') {
      const sh = JanasevaDB.get('statusHistory', []).filter((h) => h.complaintId === cid);
      timeline = sh.map((h) => ({
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        note: h.officialNote || '',
        timestamp: h.timestamp || '',
        updatedBy: 'Gram Panchayat Desk'
      }));
    }
    if (!timeline.length) {
      timeline.push({
        oldStatus: null,
        newStatus: complaint.status || 'Submitted',
        note: complaint.officialResponse || '',
        timestamp: complaint.updatedAt || complaint.createdAt || '',
        updatedBy: 'Gram Panchayat Desk'
      });
    }
    return timeline;
  }

  // ============================================================================
  // INTELLIGENT COMPLAINT DRAFT & SUBMISSION
  // ============================================================================

  /**
   * Preserved entry point (called directly by tests/translation-test.html and quick start)
   */
  async handleFilingIntent(userText) {
    const user = this.getCurrentUser();
    const isKn = this.currentLang.startsWith('kn');
    const isHi = this.currentLang.startsWith('hi');
    const lower = String(userText || '').toLowerCase();

    let category = 'Road Damage';
    let sub = {
      en: 'Road damage / pothole repair required',
      kn: 'ಗ್ರಾಮದ ಮುಖ್ಯ ರಸ್ತೆ ಗುಂಡಿ ಅಥವಾ ದುರಸ್ತಿ',
      hi: 'सड़क मरम्मत और गड्ढों की समस्या'
    };

    if (lower.includes('water') || lower.includes('ನೀರು') || lower.includes('drinking') || lower.includes('pipe') || lower.includes('पानी')) {
      category = 'Drinking Water';
      sub = {
        en: 'Drinking water supply disruption / pipe leakage',
        kn: 'ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್‌ಲೈನ್ ಸೋರಿಕೆ ಅಥವಾ ಕೊರತೆ',
        hi: 'पेयजल पाइपलाइन रिसाव या आपूर्ति समस्या'
      };
    } else if (lower.includes('light') || lower.includes('street') || lower.includes('ದೀಪ') || lower.includes('ವಿದ್ಯುತ್') || lower.includes('बिजली') || lower.includes('बत्ती')) {
      category = 'Streetlight Problems';
      sub = {
        en: 'Streetlight non-functional / replacement needed',
        kn: 'ಬೀದಿದೀಪ ದುರಸ್ತಿ ಅಥವಾ ಹೊಸ ಬೀದಿದೀಪ ಅಳವಡಿಕೆ',
        hi: 'स्ट्रीट लाइट मरम्मत या खराबी'
      };
    } else if (lower.includes('garbage') || lower.includes('waste') || lower.includes('drain') || lower.includes('ಕಸ') || lower.includes('ಚರಂಡಿ') || lower.includes('कचरा') || lower.includes('नाली')) {
      category = 'Drainage and Sanitation';
      sub = {
        en: 'Garbage clearance / drain blockage',
        kn: 'ಕಸ ವಿಲೇವಾರಿ ಅಥವಾ ಚರಂಡಿ ಸ್ವಚ್ಛತೆ ಸಮಸ್ಯೆ',
        hi: 'कचरा निस्तारण और नाली सफाई'
      };
    }

    const panchayatId = (user && user.panchayatId) ? user.panchayatId : '';
    const panchayatName = (user && user.panchayatName) ? user.panchayatName : '';
    const chosenSub = isKn ? sub.kn : (isHi ? sub.hi : sub.en);
    this._draftSubjectMap = sub;

    const nowFormatted = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
    const nowISO = new Date().toISOString();

    this.currentGrievanceDraft = {
      userId: user ? user.uid : null,
      citizenUid: user ? user.uid : null,
      citizenName: user ? user.name : '',
      citizenEmail: user ? user.email : '',
      citizenPhone: user ? (user.mobile || user.phone || '') : '',
      panchayatId,
      panchayatName,
      village: '',
      location: '',
      category,
      subject: chosenSub,
      description: userText,
      photoURL: null,
      supportingDocuments: [],
      attachments: [],
      submissionDate: nowFormatted,
      submissionTimestamp: nowISO,
      createdAt: nowFormatted,
      updatedAt: nowFormatted,
      clientSubmissionId: 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
    };

    this.isAwaitingConfirmation = true;
    const promptMsg = this.getLocalizedText('filing_prompt');
    this.addMessage('assistant', promptMsg);
    if (this.autoSpeak) this.speak(promptMsg);
    this.renderPreviewCard(this.currentGrievanceDraft);
  }

  prepareDraftFromConversation(draftState, attachedSnapshot = []) {
    const user = this.getCurrentUser();
    const nowFormatted = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
    const nowISO = new Date().toISOString();

    const prevAttachments = (this.currentGrievanceDraft && Array.isArray(this.currentGrievanceDraft.attachments))
      ? this.currentGrievanceDraft.attachments
      : [];
    const mergedAttachments = [...prevAttachments, ...attachedSnapshot];

    this._draftSubjectMap = null;
    this.currentGrievanceDraft = {
      userId: user ? user.uid : null,
      citizenUid: user ? user.uid : null,
      citizenName: user ? user.name : '',
      citizenEmail: user ? user.email : '',
      citizenPhone: user ? (user.mobile || user.phone || '') : '',
      panchayatId: draftState.panchayatId || (user && user.panchayatId) || '',
      panchayatName: draftState.panchayatName || (user && user.panchayatName) || '',
      village: draftState.village || '',
      location: draftState.location || '',
      category: draftState.category || 'Other Civic Issues',
      subject: draftState.subject || (this.services ? this.services.civicEngine.buildDefaultSubject(draftState.category, this.currentLang) : 'Civic Grievance'),
      description: draftState.description || '',
      photoURL: null,
      supportingDocuments: [],
      attachments: mergedAttachments,
      submissionDate: nowFormatted,
      submissionTimestamp: nowISO,
      createdAt: nowFormatted,
      updatedAt: nowFormatted,
      clientSubmissionId: 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
    };

    this.isAwaitingConfirmation = true;
    this.renderPreviewCard(this.currentGrievanceDraft);
  }

  renderPreviewCard(draft) {
    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer) return;

    const existing = document.getElementById('ai-active-preview-card');
    if (existing) existing.remove();

    const localizedCat = this.getCategoryName(draft.category);
    const localizedGp = this.getPanchayatName(draft.panchayatName);
    const locationTxt = [draft.village, draft.location].filter(Boolean).join(', ') || '—';
    const attNames = (draft.attachments || []).map((a) => escapeHtml(a.safeFileName || a.name)).join(', ');

    const card = document.createElement('div');
    card.className = 'ai-preview-card';
    card.id = 'ai-active-preview-card';
    card.innerHTML = `
      <div class="ai-preview-badge"><i class="fa-solid fa-file-signature"></i> <span class="lbl-badge">${escapeHtml(this.getLocalizedText('preview_badge'))}</span></div>
      <div class="ai-preview-view-mode">
        <div class="ai-preview-row"><span class="lbl-cat">${escapeHtml(this.getLocalizedText('lbl_category'))}</span> <strong class="val-cat">${escapeHtml(localizedCat)}</strong></div>
        <div class="ai-preview-row"><span class="lbl-gp">${escapeHtml(this.getLocalizedText('lbl_panchayat'))}</span> <strong class="val-gp">${escapeHtml(localizedGp)}</strong></div>
        <div class="ai-preview-row"><span class="lbl-loc">${escapeHtml(this.getLocalizedText('lbl_location'))}</span> <strong class="val-loc">${escapeHtml(locationTxt)}</strong></div>
        <div class="ai-preview-row"><span class="lbl-sub">${escapeHtml(this.getLocalizedText('lbl_subject'))}</span> <strong class="val-sub">${escapeHtml(draft.subject)}</strong></div>
        <div class="ai-preview-row ai-preview-row-col"><span class="lbl-desc">${escapeHtml(this.getLocalizedText('lbl_description'))}</span> <em class="val-desc">"${escapeHtml(draft.description)}"</em></div>
        <div class="ai-preview-row"><span class="lbl-att">${escapeHtml(this.getLocalizedText('lbl_attachments'))}</span> <span class="val-att">${attNames || escapeHtml(this.getLocalizedText('no_attachments'))}</span></div>
        <div class="ai-preview-actions">
          <button type="button" class="btn-confirm-voice-submit" id="ai-btn-confirm-submit">
            <i class="fa-solid fa-check"></i> <span>${escapeHtml(this.getLocalizedText('btn_submit_complaint'))}</span>
          </button>
          <button type="button" class="btn-edit-voice-submit" id="ai-btn-edit-submit">
            <i class="fa-solid fa-pen"></i> <span>${escapeHtml(this.getLocalizedText('btn_edit_complaint'))}</span>
          </button>
          <button type="button" class="btn-cancel-voice-submit" id="ai-btn-cancel-submit">
            <i class="fa-solid fa-xmark"></i> <span>${escapeHtml(this.getLocalizedText('btn_cancel_edit'))}</span>
          </button>
        </div>
      </div>
      <div class="ai-preview-edit-mode" style="display:none;"></div>
    `;

    chatContainer.appendChild(card);
    this.scrollToBottom();

    card.querySelector('#ai-btn-confirm-submit')?.addEventListener('click', () => this.executeGrievanceSubmission());
    card.querySelector('#ai-btn-edit-submit')?.addEventListener('click', () => this.openPreviewEditMode(card));
    card.querySelector('#ai-btn-cancel-submit')?.addEventListener('click', () => {
      this.isAwaitingConfirmation = false;
      this.chatDraftState = null;
      this.currentGrievanceDraft = null;
      card.remove();
      const cancelMsg = this.getLocalizedText('submission_cancelled');
      this.addMessage('assistant', cancelMsg);
      if (this.autoSpeak) this.speak(cancelMsg);
    });
  }

  openPreviewEditMode(card) {
    if (!this.currentGrievanceDraft || !card) return;
    const draft = this.currentGrievanceDraft;
    const viewEl = card.querySelector('.ai-preview-view-mode');
    const editEl = card.querySelector('.ai-preview-edit-mode');
    if (!viewEl || !editEl) return;

    const gps = this.services ? this.services.civicEngine.getPanchayats() : [
      null
    ];
    const cats = [
      'Road Damage', 'Water Supply', 'Garbage and Cleanliness',
      'Streetlight Problems', 'Drainage and Sanitation', 'Public Facilities', 'Other Civic Issues'
    ];

    editEl.innerHTML = `
      <div class="ai-edit-field">
        <label>${escapeHtml(this.getLocalizedText('lbl_category'))}</label>
        <select id="ai-edit-cat" class="ai-edit-input">
          ${cats.map((c) => `<option value="${escapeHtml(c)}" ${c === draft.category ? 'selected' : ''}>${escapeHtml(this.getCategoryName(c))}</option>`).join('')}
        </select>
      </div>
      <div class="ai-edit-field">
        <label>${escapeHtml(this.getLocalizedText('lbl_panchayat'))}</label>
        <select id="ai-edit-gp" class="ai-edit-input">
          ${gps.map((g) => `<option value="${escapeHtml(g.panchayatId)}" ${g.panchayatId === draft.panchayatId ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
        </select>
      </div>
      <div class="ai-edit-field">
        <label>${escapeHtml(this.getLocalizedText('lbl_location'))}</label>
        <input id="ai-edit-loc" type="text" class="ai-edit-input" maxlength="180" value="${escapeHtml([draft.village, draft.location].filter(Boolean).join(', '))}">
      </div>
      <div class="ai-edit-field">
        <label>${escapeHtml(this.getLocalizedText('lbl_subject'))}</label>
        <input id="ai-edit-sub" type="text" class="ai-edit-input" maxlength="180" value="${escapeHtml(draft.subject || '')}">
      </div>
      <div class="ai-edit-field">
        <label>${escapeHtml(this.getLocalizedText('lbl_description'))}</label>
        <textarea id="ai-edit-desc" class="ai-edit-input" rows="3" maxlength="1900">${escapeHtml(draft.description || '')}</textarea>
      </div>
      <div class="ai-preview-actions">
        <button type="button" class="btn-confirm-voice-submit" id="ai-btn-save-edit"><i class="fa-solid fa-floppy-disk"></i> ${escapeHtml(this.getLocalizedText('btn_save_draft_edit'))}</button>
        <button type="button" class="btn-cancel-voice-submit" id="ai-btn-cancel-edit">${escapeHtml(this.getLocalizedText('btn_cancel_edit'))}</button>
      </div>
    `;

    viewEl.style.display = 'none';
    editEl.style.display = 'block';

    editEl.querySelector('#ai-btn-save-edit').addEventListener('click', () => {
      const catSel = editEl.querySelector('#ai-edit-cat');
      const gpSel = editEl.querySelector('#ai-edit-gp');
      const locVal = editEl.querySelector('#ai-edit-loc').value.trim();
      const subVal = editEl.querySelector('#ai-edit-sub').value.trim();
      const descVal = editEl.querySelector('#ai-edit-desc').value.trim();

      if (subVal.length < 5 || descVal.length < 15) {
        this.addSystemMessage(this.getResponseLangShort() === 'kn'
          ? 'ವಿಷಯ ಕನಿಷ್ಠ 5 ಅಕ್ಷರಗಳು ಮತ್ತು ವಿವರಣೆ ಕನಿಷ್ಠ 15 ಅಕ್ಷರಗಳಿರಬೇಕು.'
          : (this.getResponseLangShort() === 'hi'
            ? 'विषय कम से कम 5 अक्षर और विवरण कम से कम 15 अक्षर का होना चाहिए।'
            : 'Subject must be at least 5 characters and description at least 15 characters.'));
        return;
      }

      const chosenGp = gps.find((g) => g.panchayatId === gpSel.value);
      draft.category = catSel.value;
      draft.panchayatId = gpSel.value;
      draft.panchayatName = chosenGp ? chosenGp.name : draft.panchayatName;
      draft.location = locVal;
      draft.village = '';
      draft.subject = subVal;
      draft.description = descVal;
      this._draftSubjectMap = null;
      this.renderPreviewCard(draft);
    });

    editEl.querySelector('#ai-btn-cancel-edit').addEventListener('click', () => {
      editEl.style.display = 'none';
      viewEl.style.display = 'block';
    });
  }

  refreshPreviewCardTranslations(card, draft) {
    const q = (sel, val) => {
      const el = card.querySelector(sel);
      if (el) el.innerText = val;
    };
    q('.lbl-badge', this.getLocalizedText('preview_badge'));
    q('.lbl-cat', this.getLocalizedText('lbl_category'));
    q('.val-cat', this.getCategoryName(draft.category));
    q('.lbl-gp', this.getLocalizedText('lbl_panchayat'));
    q('.val-gp', this.getPanchayatName(draft.panchayatName));
    q('.lbl-loc', this.getLocalizedText('lbl_location'));
    q('.lbl-sub', this.getLocalizedText('lbl_subject'));
    if (this._draftSubjectMap) {
      const s = this.getResponseLangShort();
      q('.val-sub', this._draftSubjectMap[s] || this._draftSubjectMap.en || draft.subject);
    }
    q('.lbl-desc', this.getLocalizedText('lbl_description'));
    q('.lbl-att', this.getLocalizedText('lbl_attachments'));
    q('#ai-btn-confirm-submit span', this.getLocalizedText('btn_submit_complaint'));
    q('#ai-btn-edit-submit span', this.getLocalizedText('btn_edit_complaint'));
    q('#ai-btn-cancel-submit span', this.getLocalizedText('btn_cancel_edit'));
  }

  async executeGrievanceSubmission() {
    if (!this.currentGrievanceDraft || this.isSubmittingComplaint) return;

    const user = this.getCurrentUser();
    if (!user || !user.uid) {
      const signInMsg = this.getLocalizedText('sign_in_to_submit');
      this.addMessage('assistant', signInMsg, { navigationTarget: 'login.html?redirect=complaint.html' });
      return;
    }

    const draft = { ...this.currentGrievanceDraft };
    if (!draft.subject || draft.subject.trim().length < 5) {
      draft.subject = this.services ? this.services.civicEngine.buildDefaultSubject(draft.category, this.currentLang) : 'Gram Panchayat Grievance';
    }
    if (!draft.description || draft.description.trim().length < 15) {
      draft.description = `${draft.subject} - ${draft.description || ''}`.trim();
      if (draft.description.length < 15) draft.description += ' (Reported via JANASEVA AI)';
    }

    this.isSubmittingComplaint = true;
    const card = document.getElementById('ai-active-preview-card');
    const submitBtn = document.getElementById('ai-btn-confirm-submit');
    if (submitBtn) submitBtn.disabled = true;
    if (card) {
      card.innerHTML = `<div class="ai-submitting-box"><i class="fa-solid fa-spinner fa-spin"></i> <span>${escapeHtml(this.getLocalizedText('submitting_loading'))}</span></div>`;
    }

    try {
      draft.userId = user.uid;
      draft.citizenUid = user.uid;
      draft.citizenName = user.name || draft.citizenName || 'Citizen';
      draft.citizenEmail = user.email || draft.citizenEmail || '';
      draft.citizenPhone = user.mobile || user.phone || draft.citizenPhone || '';
      draft.citizenMobileNumber = draft.citizenPhone;

      // Offline handling
      if (!navigator.onLine && window.janasevaOfflineDB) {
        await window.janasevaOfflineDB.enqueueSubmission(draft, user.uid);
        this.isAwaitingConfirmation = false;
        this.chatDraftState = null;
        this.currentGrievanceDraft = null;
        if (card) card.remove();
        const offMsg = this.getLocalizedText('filing_success_offline');
        this.addMessage('assistant', offMsg);
        if (this.autoSpeak) this.speak(offMsg);
        return;
      }

      // Upload attached evidence if Firebase Storage is active
      const uploadedUrls = await this.uploadDraftAttachments(draft, user);
      if (uploadedUrls.photoURL) draft.photoURL = uploadedUrls.photoURL;
      if (uploadedUrls.docs.length) draft.supportingDocuments = uploadedUrls.docs;

      let officialId = null;
      const canCallFn =
        window.isFirebaseAvailable &&
        typeof firebase !== 'undefined' &&
        typeof firebase.functions === 'function' &&
        firebase.auth &&
        firebase.auth().currentUser;

      if (canCallFn) {
        const fn = firebase.functions().httpsCallable('registerComplaintFromChat');
        const res = await fn({
          category: draft.category,
          panchayatId: draft.panchayatId,
          village: draft.village,
          location: draft.location,
          subject: draft.subject,
          description: draft.description,
          photoURL: draft.photoURL,
          supportingDocuments: draft.supportingDocuments,
          clientSubmissionId: draft.clientSubmissionId
        });
        if (!res || !res.data || !res.data.complaintId) {
          throw new Error('Server did not return a valid Complaint ID.');
        }
        officialId = res.data.complaintId;
        if (typeof JanasevaDB !== 'undefined' && res.data.complaint) {
          const local = JanasevaDB.get('complaints', []);
          if (!local.some((c) => c.complaintId === officialId)) {
            local.unshift(res.data.complaint);
            JanasevaDB.set('complaints', local);
          }
        }
      } else if (typeof window.executeComplaintSubmission === 'function') {
        const res = await window.executeComplaintSubmission(draft, null);
        officialId = res.complaintId;
      } else {
        // Local simulation repository persistence
        const sim = (typeof JanasevaDB !== 'undefined') ? JanasevaDB.get('complaints', []) : [];
        const dup = sim.find((c) => c.clientSubmissionId && c.clientSubmissionId === draft.clientSubmissionId);
        if (dup) {
          officialId = dup.complaintId;
        } else {
          officialId = 'JAN-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
          draft.complaintId = officialId;
          draft.status = 'Submitted';
          draft.sourceChannel = 'AI_CHAT_ASSISTANT';
          const classRes = window.janasevaComplaintPrioritizer
            ? window.janasevaComplaintPrioritizer.analyzeComplaint(draft.description, draft.category)
            : { priority: 'NORMAL', department: 'General Administration', rationale: 'Standard grievance', isEmergency: false };
          draft.aiPriority = classRes.priority;
          draft.assignedDepartment = classRes.department;
          draft.officialResponse = 'Your grievance has been recorded and routed to the Gram Panchayat queue.';
          sim.unshift(draft);
          if (typeof JanasevaDB !== 'undefined') JanasevaDB.set('complaints', sim);
          if (window.complaintStorageManager) {
            await window.complaintStorageManager.recordComplaintUpdate(draft, {
              oldStatus: null,
              newStatus: 'Submitted',
              updateType: 'INITIAL_SUBMISSION',
              remarks: 'Submitted via JANASEVA AI Assistant',
              actor: { name: draft.citizenName, email: draft.citizenEmail, role: 'citizen', uid: user.uid }
            });
          }
        }
      }

      if (card) card.remove();
      this.isAwaitingConfirmation = false;
      this.chatDraftState = null;
      this.currentGrievanceDraft = null;
      this.lastTrackedId = officialId;

      const s = this.getResponseLangShort();
      const successMsg = s === 'kn'
        ? `ನಿಮ್ಮ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ! ಅಧಿಕೃತ ದೂರು ಸಂಖ್ಯೆ: ${officialId}`
        : (s === 'hi'
          ? `आपकी शिकायत सफलतापूर्वक दर्ज हो गई है! आधिकारिक शिकायत संख्या: ${officialId}`
          : `Your complaint has been registered successfully! Official Complaint ID: ${officialId}`);

      this.addMessage('assistant', successMsg, {
        complaintId: officialId,
        navigationTarget: `track.html?id=${encodeURIComponent(officialId)}`
      });
      if (this.autoSpeak) this.speak(successMsg);
      window.dispatchEvent(new CustomEvent('janaseva:complaint_submitted', { detail: { complaintId: officialId } }));
      await this.persistCurrentSession();
    } catch (err) {
      console.error('[JANASEVA AI] Submission failed:', err);
      if (card) {
        this.renderPreviewCard(this.currentGrievanceDraft);
      }
      const failMsg = `${this.getLocalizedText('filing_failed')} (${err.message || 'Error'})`;
      this.addMessage('assistant', failMsg);
    } finally {
      this.isSubmittingComplaint = false;
    }
  }

  async uploadDraftAttachments(draft, user) {
    const out = { photoURL: draft.photoURL || null, docs: [] };
    const list = Array.isArray(draft.attachments) ? draft.attachments : [];
    if (!list.length) return out;

    if (window.isFirebaseAvailable && window.fbStorage && firebase.auth && firebase.auth().currentUser) {
      for (let i = 0; i < list.length; i++) {
        const att = list[i];
        if (!att || !att.file) continue;
        try {
          const safeName = (att.safeFileName || `att_${i}`).replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `chatAttachments/${user.uid}/${this.sessionId}/${Date.now()}_${safeName}`;
          const snap = await window.fbStorage.ref().child(path).put(att.file, { contentType: att.mimeType });
          const url = await snap.ref.getDownloadURL();
          if (att.category === 'image' && !out.photoURL) out.photoURL = url;
          else out.docs.push(url);
        } catch (upErr) {
          console.warn('[JANASEVA AI] Storage attachment upload fallback:', upErr.message);
        }
      }
    } else {
      // Local simulation fallback: store bounded preview URL for images <= 200KB only
      for (const att of list) {
        if (att && att.category === 'image' && att.dataUrl && att.dataUrl.length <= 250000 && !out.photoURL) {
          out.photoURL = att.dataUrl;
        }
      }
    }
    return out;
  }

  // ============================================================================
  // INTERACTIVE CHAT CARDS (TRACKING, TIMELINE, CONTACTS, EMERGENCY)
  // ============================================================================

  renderTrackedComplaintCard(c, historyList = null) {
    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer || !c) return;

    const stages = ['Submitted', 'Assigned', 'Under Review', 'In Progress', 'Action Taken', 'Resolved'];
    const currentLower = String(c.status || 'Submitted').toLowerCase();
    let activeIdx = stages.findIndex((st) => st.toLowerCase() === currentLower);
    if (activeIdx < 0) activeIdx = 0;

    const stepperHtml = stages
      .map((st, idx) => {
        const stateCls = currentLower === 'rejected'
          ? (idx === 0 ? 'done' : '')
          : (idx < activeIdx ? 'done' : (idx === activeIdx ? 'current' : ''));
        return `<div class="ai-tl-step ${stateCls}"><span class="ai-tl-dot"></span><span class="ai-tl-name">${escapeHtml(this.getStatusName(st))}</span></div>`;
      })
      .join('');

    const timelineEvents = Array.isArray(c.timeline) ? c.timeline.slice(-5) : [];
    const eventsHtml = timelineEvents.length
      ? `<div class="ai-tl-events">${timelineEvents.map((ev) => `
          <div class="ai-tl-event-row">
            <strong>${escapeHtml(this.getStatusName(ev.newStatus || c.status))}</strong>
            <span class="ai-tl-time">${escapeHtml(ev.timestamp || '')}</span>
            ${ev.note ? `<div class="ai-tl-note">${escapeHtml(ev.note)}</div>` : ''}
          </div>
        `).join('')}</div>`
      : '';

    const card = document.createElement('div');
    card.className = 'ai-rich-card ai-track-card';
    card.innerHTML = `
      <div class="ai-rich-head">
        <span class="ai-cid-tag">${escapeHtml(c.complaintId)}</span>
        <span class="ai-status-chip">${escapeHtml(this.getStatusName(c.status || 'Submitted'))}</span>
      </div>
      <div class="ai-rich-grid">
        <div><span>${escapeHtml(this.getLocalizedText('lbl_category'))}</span> <strong>${escapeHtml(this.getCategoryName(c.category))}</strong></div>
        <div><span>${escapeHtml(this.getLocalizedText('lbl_panchayat'))}</span> <strong>${escapeHtml(this.getPanchayatName(c.panchayatName || c.panchayatId))}</strong></div>
        <div><span>${escapeHtml(this.getLocalizedText('lbl_submitted_on'))}</span> <strong>${escapeHtml(c.createdAt || c.submissionDate || '—')}</strong></div>
        <div><span>${escapeHtml(this.getLocalizedText('lbl_department'))}</span> <strong>${escapeHtml(c.assignedDepartment || 'General Administration')}</strong></div>
        ${c.assignedReceiverName ? `<div><span>${escapeHtml(this.getLocalizedText('lbl_officer'))}</span> <strong>${escapeHtml(c.assignedReceiverName)}</strong></div>` : ''}
      </div>
      ${c.officialResponse ? `<div class="ai-rich-note"><span>${escapeHtml(this.getLocalizedText('lbl_action_taken'))}</span> ${escapeHtml(c.officialResponse)}</div>` : ''}
      ${c.rejectionReason ? `<div class="ai-rich-alert danger">${escapeHtml(c.rejectionReason)}</div>` : ''}
      ${c.reopenReason ? `<div class="ai-rich-alert warn">${escapeHtml(c.reopenReason)}</div>` : ''}
      <div class="ai-tl-title">${escapeHtml(this.getLocalizedText('lbl_timeline'))}</div>
      <div class="ai-tl-stepper">${stepperHtml}</div>
      ${eventsHtml}
      <div class="ai-rich-footer">
        <a class="ai-card-link-btn" href="track.html?id=${encodeURIComponent(c.complaintId)}">
          <i class="fa-solid fa-magnifying-glass"></i> ${escapeHtml(this.getLocalizedText('btn_track_this'))}
        </a>
      </div>
    `;
    chatContainer.appendChild(card);

    if (Array.isArray(historyList) && historyList.length > 1) {
      this.renderComplaintHistoryCards(historyList.slice(1, 5));
    }
    this.scrollToBottom();
  }

  renderComplaintHistoryCards(list) {
    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer || !Array.isArray(list) || !list.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'ai-rich-card ai-hist-list-card';
    wrap.innerHTML = list
      .map((c) => `
        <button type="button" class="ai-mini-complaint-row" data-cid="${escapeHtml(c.complaintId)}">
          <span class="ai-cid-tag">${escapeHtml(c.complaintId)}</span>
          <span class="ai-mini-cat">${escapeHtml(this.getCategoryName(c.category))}</span>
          <span class="ai-status-chip">${escapeHtml(this.getStatusName(c.status))}</span>
        </button>
      `)
      .join('');

    wrap.querySelectorAll('.ai-mini-complaint-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-cid');
        if (cid) this.handleUserMessage(`Track ${cid}`);
      });
    });

    chatContainer.appendChild(wrap);
    this.scrollToBottom();
  }

  renderEmergencyCard(contacts) {
    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer) return;
    const card = document.createElement('div');
    card.className = 'ai-rich-card ai-emergency-card';
    card.innerHTML = contacts
      .map((c) => `
        <a class="ai-emerg-row" href="tel:${escapeHtml(c.number)}">
          <span><i class="fa-solid fa-phone-volume"></i> ${escapeHtml(c.label)}</span>
          <strong>${escapeHtml(c.number)}</strong>
        </a>
      `)
      .join('');
    chatContainer.appendChild(card);
    this.scrollToBottom();
  }

  renderPanchayatContactsCard(gps) {
    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer) return;
    const card = document.createElement('div');
    card.className = 'ai-rich-card ai-contacts-card';
    card.innerHTML = gps
      .map((g) => `
        <div class="ai-gp-contact-row">
          <div class="ai-gp-name">${escapeHtml(this.getPanchayatName(g.name))}</div>
          <div class="ai-gp-meta">${escapeHtml(g.secretary || 'PDO')} &bull; ${escapeHtml(g.block || '')}</div>
          <div class="ai-gp-links">
            ${g.contactNumber ? `<a href="tel:${escapeHtml(g.contactNumber.replace(/\s+/g, ''))}"><i class="fa-solid fa-phone"></i> ${escapeHtml(g.contactNumber)}</a>` : ''}
            ${g.receiverEmail ? `<a href="mailto:${escapeHtml(g.receiverEmail)}"><i class="fa-solid fa-envelope"></i> ${escapeHtml(g.receiverEmail)}</a>` : ''}
          </div>
        </div>
      `)
      .join('');
    chatContainer.appendChild(card);
    this.scrollToBottom();
  }

  renderKnowledgeSourcesCard(sources, conflictNotice = null) {
    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer || !Array.isArray(sources) || !sources.length) return;

    const card = document.createElement('div');
    card.className = 'ai-rich-card ai-knowledge-sources-card';
    card.setAttribute('data-no-translate', 'true');

    const rowsHtml = sources.map((src) => {
      const trustCls = src.sourceReliability === 'official' ? 'official' : (src.sourceReliability === 'verified_partner' ? 'api' : 'community');
      const trustLbl = src.sourceReliability === 'official'
        ? this.getLocalizedText('source_official')
        : (src.sourceReliability === 'verified_partner' ? this.getLocalizedText('source_api') : this.getLocalizedText('source_community'));
      const langBadge = String(src.language || 'en').toUpperCase();
      return `
        <div class="ai-ksrc-item">
          <div class="ai-ksrc-head">
            <strong class="ai-ksrc-title">${escapeHtml(src.title || src.fileName || 'Document')}</strong>
            <div class="ai-ksrc-badges">
              <span class="ai-ksrc-trust ${trustCls}">${escapeHtml(trustLbl)}</span>
              <span class="ai-ksrc-lang">${escapeHtml(langBadge)}</span>
              <span class="ai-ksrc-score">v${Number(src.version || 1)} &bull; ${Math.round((Number(src.score) || 0) * 100)}%</span>
            </div>
          </div>
          ${src.snippet ? `<div class="ai-ksrc-snippet">${escapeHtml(src.snippet)}</div>` : ''}
          <div class="ai-ksrc-actions">
            <button type="button" class="ai-ksrc-view-btn" data-doc-id="${escapeHtml(src.docId)}">
              <i class="fa-regular fa-file-lines"></i> ${escapeHtml(this.getLocalizedText('view_doc_btn'))}
            </button>
            <button type="button" class="ai-ksrc-dl-btn" data-doc-id="${escapeHtml(src.docId)}">
              <i class="fa-solid fa-download"></i> ${escapeHtml(this.getLocalizedText('download_doc'))}
            </button>
          </div>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <details class="ai-ksrc-details" open>
        <summary class="ai-ksrc-summary">
          <span><i class="fa-solid fa-book-open-reader"></i> ${escapeHtml(this.getLocalizedText('sources_heading'))} (${sources.length})</span>
          <i class="fa-solid fa-chevron-down"></i>
        </summary>
        ${conflictNotice ? `<div class="ai-rich-alert warn" style="margin:6px 0;"><i class="fa-solid fa-scale-balanced"></i> ${escapeHtml(conflictNotice)}</div>` : ''}
        <div class="ai-ksrc-list">${rowsHtml}</div>
      </details>
    `;

    card.querySelectorAll('.ai-ksrc-view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const docId = btn.getAttribute('data-doc-id');
        if (docId) this.openKnowledgeDocumentModal(docId);
      });
    });

    card.querySelectorAll('.ai-ksrc-dl-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const docId = btn.getAttribute('data-doc-id');
        if (docId && window.JanasevaKnowledgeCentre) {
          window.JanasevaKnowledgeCentre.downloadDocument(docId).catch((err) => {
            this.addSystemMessage(err.message || 'Download unavailable.');
          });
        }
      });
    });

    chatContainer.appendChild(card);
    this.scrollToBottom();
  }

  async openKnowledgeDocumentModal(docId) {
    const modal = document.getElementById('ai-doc-viewer-modal');
    const titleEl = document.getElementById('ai-doc-viewer-title');
    const bodyEl = document.getElementById('ai-doc-viewer-body');
    const dlBtn = document.getElementById('ai-doc-viewer-dl');
    if (!modal || !bodyEl) return;

    modal.style.display = 'flex';
    if (titleEl) titleEl.innerText = 'Loading document...';
    bodyEl.innerHTML = '<div class="ai-doc-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading document preview...</div>';

    try {
      if (!window.JanasevaKnowledgeCentre || typeof window.JanasevaKnowledgeCentre.getDocumentDetailsForView !== 'function') {
        throw new Error('Knowledge Centre viewer service is unavailable.');
      }
      const details = await window.JanasevaKnowledgeCentre.getDocumentDetailsForView(docId);
      const doc = details?.doc;
      const chunks = Array.isArray(details?.chunks) ? details.chunks : [];
      if (!doc) throw new Error('Document metadata not found.');

      if (titleEl) titleEl.innerText = doc.title || doc.fileName || 'Knowledge Document';
      const reliability = doc.sourceReliability || 'community';
      const reliabilityLbl = reliability === 'official' ? this.getLocalizedText('source_official')
        : (reliability === 'verified_partner' ? this.getLocalizedText('source_api') : this.getLocalizedText('source_community'));

      const excerptText = doc.extractedText || doc.summary || chunks.map((c) => c.content || c.text || '').filter(Boolean).join('\n\n') || 'No extracted text available.';

      bodyEl.innerHTML = `
        <div class="ai-doc-meta-bar">
          <span class="ai-ksrc-trust ${escapeHtml(reliability)}">${escapeHtml(reliabilityLbl)}</span>
          <span class="ai-ksrc-lang">${escapeHtml(String(doc.language || 'en').toUpperCase())}</span>
          <span class="ai-ksrc-score">v${Number(doc.version || 1)} &bull; ${escapeHtml(doc.category || 'General')}</span>
        </div>
        ${doc.summary ? `<div class="ai-doc-summary-box"><strong>Summary</strong><p>${escapeHtml(doc.summary)}</p></div>` : ''}
        <div class="ai-doc-content-box">
          <strong>Extracted Content (${chunks.length} section${chunks.length === 1 ? '' : 's'})</strong>
          <pre class="ai-doc-pre">${escapeHtml(excerptText.slice(0, 6000))}${excerptText.length > 6000 ? '\n\n... [Download full file to read complete document]' : ''}</pre>
        </div>
      `;

      if (dlBtn) {
        dlBtn.style.display = 'inline-flex';
        dlBtn.onclick = () => {
          window.JanasevaKnowledgeCentre.downloadDocument(docId).catch((err) => {
            this.addSystemMessage(err.message || 'Download unavailable.');
          });
        };
      }
    } catch (err) {
      if (titleEl) titleEl.innerText = 'Document Preview';
      bodyEl.innerHTML = `<div class="ai-rich-alert warn">${escapeHtml(err.message || 'Unable to load document preview.')}</div>`;
      if (dlBtn) dlBtn.style.display = 'none';
    }
  }

  closeKnowledgeDocumentModal() {
    const modal = document.getElementById('ai-doc-viewer-modal');
    if (modal) modal.style.display = 'none';
  }

  askAboutKnowledge(promptText) {
    this.toggleDrawer(true);
    if (promptText) {
      this.handleUserMessage(String(promptText));
    }
  }

  // ============================================================================
  // ATTACHMENTS & LIVE CAMERA CAPTURE
  // ============================================================================

  async handleFileAttach(file) {
    if (!file || !this.services) return;
    const cfg = this.getChatSettings();
    if (cfg.attachments === false) {
      this.addSystemMessage('Attachments are disabled in Chat Settings → Communication.');
      return;
    }

    const res = await this.services.validateChatAttachmentFile(file, {
      allowImages: cfg.imageUpload !== false,
      allowPdf: cfg.pdfUpload !== false && cfg.documentAnalysis !== false,
      maxAttachmentSizeMb: Number(cfg.maxAttachmentSizeMb || 5)
    });
    if (!res.valid) {
      const customErr = res.customMessage || this.getLocalizedText(res.errorKey);
      this.addSystemMessage(customErr);
      return;
    }

    let dataUrl = null;
    if (res.category === 'image') {
      dataUrl = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => resolve(null);
        r.readAsDataURL(file);
      });
    }

    // Optional backend magic-byte pre-check if live Firebase Functions available
    if (
      navigator.onLine &&
      window.isFirebaseAvailable &&
      typeof firebase !== 'undefined' &&
      typeof firebase.functions === 'function' &&
      firebase.auth &&
      firebase.auth().currentUser
    ) {
      try {
        const fn = firebase.functions().httpsCallable('validateChatAttachment');
        await fn({
          filename: file.name,
          mimeType: res.mimeType,
          sizeBytes: file.size,
          headerBase64: res.headerBase64,
          sessionId: this.sessionId,
          chatSettings: cfg
        });
      } catch (srvErr) {
        this.addSystemMessage(srvErr.message || this.getLocalizedText('att_spoofed'));
        return;
      }
    }

    const attItem = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      file,
      safeFileName: res.safeFileName,
      name: file.name,
      mimeType: res.mimeType,
      category: res.category,
      size: file.size,
      dataUrl
    };

    if (this.pendingAttachments.length >= 3) this.pendingAttachments.shift();
    this.pendingAttachments.push(attItem);

    if (this.currentGrievanceDraft) {
      this.currentGrievanceDraft.attachments = this.currentGrievanceDraft.attachments || [];
      this.currentGrievanceDraft.attachments.push(attItem);
      const card = document.getElementById('ai-active-preview-card');
      if (card) this.renderPreviewCard(this.currentGrievanceDraft);
    }

    this.renderAttachmentStrip();
    this.addSystemMessage(this.getLocalizedText('att_ready_note'));
  }

  renderAttachmentStrip() {
    const strip = document.getElementById('ai-attachment-strip');
    if (!strip) return;
    if (!this.pendingAttachments.length) {
      strip.style.display = 'none';
      strip.innerHTML = '';
      return;
    }

    strip.style.display = 'flex';
    strip.innerHTML = this.pendingAttachments
      .map((a) => `
        <div class="ai-att-chip">
          ${a.dataUrl ? `<img src="${escapeHtml(a.dataUrl)}" alt="Preview" class="ai-att-thumb">` : `<i class="fa-solid fa-file-pdf ai-att-pdf-icon"></i>`}
          <span class="ai-att-name">${escapeHtml(a.safeFileName)} (${(a.size / 1024).toFixed(0)} KB)</span>
          <button type="button" class="ai-att-rm-btn" data-att-id="${escapeHtml(a.id)}" aria-label="Remove attachment">&times;</button>
        </div>
      `)
      .join('');

    strip.querySelectorAll('.ai-att-rm-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-att-id');
        this.pendingAttachments = this.pendingAttachments.filter((x) => x.id !== id);
        this.renderAttachmentStrip();
      });
    });
  }

  async openCameraModal() {
    const cfg = this.getChatSettings();
    if (cfg.attachments === false || cfg.imageUpload === false) {
      this.addSystemMessage('Image upload / Camera is disabled in Chat Settings → Communication.');
      return;
    }
    const modal = document.getElementById('ai-camera-modal');
    if (!modal) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.addSystemMessage(this.getLocalizedText('cam_err_none'));
      document.getElementById('ai-file-input')?.click();
      return;
    }

    modal.style.display = 'flex';
    document.getElementById('ai-cam-review-controls').style.display = 'none';
    document.getElementById('ai-cam-live-controls').style.display = 'flex';
    document.getElementById('ai-cam-preview-wrap').style.display = 'none';
    document.getElementById('ai-cam-error').style.display = 'none';
    await this.startCameraStream();
  }

  async startCameraStream() {
    this.stopCameraStream();
    const video = document.getElementById('ai-cam-video');
    const errBox = document.getElementById('ai-cam-error');
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: this._camFacing } }, audio: false });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      this._camStream = stream;
      if (video) {
        video.style.display = 'block';
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
    } catch (err) {
      if (video) video.style.display = 'none';
      if (errBox) {
        errBox.style.display = 'block';
        const isPerm = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
        errBox.innerText = this.getLocalizedText(isPerm ? 'cam_err_perm' : 'cam_err_none');
      }
    }
  }

  stopCameraStream() {
    if (this._camStream) {
      this._camStream.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
      this._camStream = null;
    }
    const video = document.getElementById('ai-cam-video');
    if (video) video.srcObject = null;
  }

  closeCameraModal() {
    this.stopCameraStream();
    const modal = document.getElementById('ai-camera-modal');
    if (modal) modal.style.display = 'none';
    this._camPendingBlob = null;
    this._camPendingDataUrl = null;
  }

  captureCameraPhoto() {
    const video = document.getElementById('ai-cam-video');
    const canvas = document.getElementById('ai-cam-canvas');
    if (!video || !canvas || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    canvas.toBlob((blob) => {
      if (!blob) return;
      this._camPendingBlob = blob;
      this._camPendingDataUrl = dataUrl;
      const img = document.getElementById('ai-cam-preview-img');
      if (img) img.src = dataUrl;
      document.getElementById('ai-cam-preview-wrap').style.display = 'flex';
      document.getElementById('ai-cam-live-controls').style.display = 'none';
      document.getElementById('ai-cam-review-controls').style.display = 'flex';
      try { video.pause(); } catch (e) {}
    }, 'image/jpeg', 0.88);
  }

  useCapturedCameraPhoto() {
    if (!this._camPendingBlob) return;
    const file = new File([this._camPendingBlob], `JANASEVA_CHAT_CAM_${Date.now()}.jpg`, { type: 'image/jpeg' });
    this.closeCameraModal();
    this.handleFileAttach(file);
  }

  // ============================================================================
  // CHAT HISTORY MANAGEMENT, FEEDBACK & SUMMARY
  // ============================================================================

  async persistCurrentSession() {
    const cfg = this.getChatSettings();
    if (cfg.conversationHistory === false || cfg.saveChatHistory === false) return;
    const user = this.getCurrentUser();
    if (!user || !user.uid || !this.services) return;
    if (this.messages.filter((m) => !m.isWelcome).length === 0) return;

    const cleanMessages = cfg.saveAttachments === false
      ? this.messages.map((m) => ({ ...m, attachments: [] }))
      : this.messages;

    await this.services.historyStore.saveSession(user.uid, {
      sessionId: this.sessionId,
      title: this.sessionTitle || 'JANASEVA Conversation',
      language: this.currentLang,
      createdAt: this.sessionCreatedAt,
      messages: cleanMessages
    });

    if (cfg.autoChatCleanup && typeof this.services.historyStore.applyAutoCleanup === 'function') {
      await this.services.historyStore.applyAutoCleanup(user.uid, cfg.cleanupRetentionDays || 30);
    }
  }

  async toggleHistoryPanel(force = null) {
    const cfg = this.getChatSettings();
    const panel = document.getElementById('ai-history-panel');
    if (!panel) return;
    if (force !== false && cfg.conversationHistory === false) {
      this.addSystemMessage('Conversation history is turned off in Chat Settings → General.');
      return;
    }
    const next = force === null ? !panel.classList.contains('open') : Boolean(force);
    if (next && this.settingsOpen) this.toggleSettingsPanel(false);
    panel.classList.toggle('open', next);
    if (next) {
      this.historyPage = 1;
      await this.renderHistoryList();
    } else {
      const hConfirm = document.getElementById('ai-hist-confirm-banner');
      if (hConfirm) hConfirm.style.display = 'none';
    }
  }

  async toggleSettingsPanel(force = null) {
    const panel = document.getElementById('ai-settings-panel');
    if (!panel) return;
    const next = force === null ? !panel.classList.contains('open') : Boolean(force);
    if (next) {
      await this.toggleHistoryPanel(false);
      this.populateSettingsForm(this.getChatSettings());
    }
    this.settingsOpen = next;
    panel.classList.toggle('open', next);
    const btn = document.getElementById('ai-settings-btn');
    if (btn) btn.classList.toggle('active', next);
  }

  async renderHistoryList() {
    const listEl = document.getElementById('ai-hist-list');
    const loadMoreBtn = document.getElementById('ai-hist-load-more-btn');
    if (!listEl || !this.services) return;
    const user = this.getCurrentUser();
    if (!user || !user.uid) {
      listEl.innerHTML = `<div class="ai-hist-empty">${escapeHtml(this.getLocalizedText('sign_in_to_submit'))}</div>`;
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    const search = document.getElementById('ai-hist-search')?.value || '';
    const res = await this.services.historyStore.listSessions(user.uid, {
      search,
      page: this.historyPage,
      pageSize: 8
    });

    if (!res.sessions.length) {
      listEl.innerHTML = `<div class="ai-hist-empty">${escapeHtml(this.getLocalizedText('hist_empty'))}</div>`;
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    listEl.innerHTML = res.sessions
      .map((s) => {
        const dt = new Date(s.updatedAt || s.createdAt || Date.now()).toLocaleString(this.currentLang, {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        return `
          <div class="ai-hist-item ${s.sessionId === this.sessionId ? 'active' : ''}" data-sid="${escapeHtml(s.sessionId)}">
            <button type="button" class="ai-hist-open-btn" data-sid="${escapeHtml(s.sessionId)}">
              <div class="ai-hist-item-title">${escapeHtml(s.title || 'Conversation')}</div>
              <div class="ai-hist-item-meta">${escapeHtml(dt)} &bull; ${Number(s.messageCount || 0)} ${escapeHtml(this.getLocalizedText('hist_msgs'))}</div>
            </button>
            <div class="ai-hist-item-btns">
              <button type="button" class="ai-hist-rename-btn" data-rename-sid="${escapeHtml(s.sessionId)}" title="${escapeHtml(this.getLocalizedText('rename_chat_title'))}" aria-label="${escapeHtml(this.getLocalizedText('rename_chat_title'))}">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button type="button" class="ai-hist-del-btn" data-del-sid="${escapeHtml(s.sessionId)}" aria-label="Delete conversation">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    listEl.querySelectorAll('.ai-hist-open-btn').forEach((b) => {
      b.addEventListener('click', () => this.openSavedSession(b.getAttribute('data-sid')));
    });

    listEl.querySelectorAll('.ai-hist-rename-btn').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = b.getAttribute('data-rename-sid');
        const item = b.closest('.ai-hist-item');
        const titleEl = item?.querySelector('.ai-hist-item-title');
        const currentTitle = titleEl ? titleEl.innerText.trim() : 'Conversation';
        if (!item || item.querySelector('.ai-hist-rename-form')) return;

        const form = document.createElement('div');
        form.className = 'ai-hist-rename-form';
        form.innerHTML = `
          <input type="text" class="ai-hist-rename-input" maxlength="80" value="${escapeHtml(currentTitle)}">
          <button type="button" class="ai-hist-rename-save" aria-label="Save title"><i class="fa-solid fa-check"></i></button>
          <button type="button" class="ai-hist-rename-cancel" aria-label="Cancel rename"><i class="fa-solid fa-xmark"></i></button>
        `;
        item.appendChild(form);
        const inp = form.querySelector('.ai-hist-rename-input');
        inp.focus();
        inp.select();

        const saveRename = async () => {
          const nextTitle = inp.value.trim();
          if (!nextTitle) return;
          if (typeof this.services.historyStore.renameSession === 'function') {
            await this.services.historyStore.renameSession(user.uid, sid, nextTitle);
          }
          if (sid === this.sessionId) this.sessionTitle = nextTitle;
          await this.renderHistoryList();
        };

        form.querySelector('.ai-hist-rename-save').onclick = (ev) => { ev.stopPropagation(); saveRename(); };
        form.querySelector('.ai-hist-rename-cancel').onclick = (ev) => { ev.stopPropagation(); form.remove(); };
        inp.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') { ev.preventDefault(); saveRename(); }
          if (ev.key === 'Escape') { ev.stopPropagation(); form.remove(); }
        });
      });
    });

    listEl.querySelectorAll('.ai-hist-del-btn').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = b.getAttribute('data-del-sid');
        this.requestInlineConfirm(this.getLocalizedText('hist_delete_one'), async () => {
          await this.services.historyStore.deleteSession(user.uid, sid);
          if (sid === this.sessionId) this.startNewConversation(false);
          await this.renderHistoryList();
        });
      });
    });

    if (loadMoreBtn) loadMoreBtn.style.display = res.hasMore ? 'block' : 'none';
  }

  async openSavedSession(sessionId) {
    const user = this.getCurrentUser();
    if (!user || !this.services) return;
    const res = await this.services.historyStore.listSessions(user.uid, { page: 1, pageSize: 50 });
    const found = res.sessions.find((s) => s.sessionId === sessionId);
    if (!found) return;

    this.sessionId = found.sessionId;
    this.sessionTitle = found.title || '';
    this.sessionCreatedAt = found.createdAt || new Date().toISOString();
    this.currentGrievanceDraft = null;
    this.chatDraftState = null;
    this.isAwaitingConfirmation = false;
    this.messages = [];

    const container = document.getElementById('ai-chat-messages');
    if (container) container.innerHTML = '';
    const welcomeHero = document.getElementById('ai-welcome-hero');
    if (welcomeHero) welcomeHero.style.display = 'none';

    (found.messages || []).forEach((m) => {
      this.addMessage(m.sender, m.text, {
        isWelcome: m.isWelcome,
        timestamp: m.timestampIso ? new Date(m.timestampIso) : new Date(),
        status: m.status || 'sent',
        skipAutoUnread: true
      });
    });
    this.toggleHistoryPanel(false);
  }

  startNewConversation(savePrevious = true) {
    if (savePrevious) this.persistCurrentSession();
    this.stopSpeaking();
    this.sessionId = this.createSessionId();
    this.sessionCreatedAt = new Date().toISOString();
    this.sessionTitle = '';
    this.messages = [];
    this.currentGrievanceDraft = null;
    this.chatDraftState = null;
    this.isAwaitingConfirmation = false;
    this.lastTrackedId = null;
    this.pendingAttachments = [];
    this.renderAttachmentStrip();

    const chatContainer = document.getElementById('ai-chat-messages');
    if (chatContainer) chatContainer.innerHTML = '';
    const welcomeHero = document.getElementById('ai-welcome-hero');
    if (welcomeHero) welcomeHero.style.display = 'block';
    this.addMessage('assistant', this.getLocalizedText('welcome'), { isWelcome: true, skipAutoUnread: true });
  }

  clearChat() {
    this.requestInlineConfirm(this.getLocalizedText('clear_chat_confirm'), () => {
      this.startNewConversation(false);
    });
  }

  requestInlineConfirm(promptText, onConfirm) {
    const histPanel = document.getElementById('ai-history-panel');
    const histOpen = Boolean(histPanel && histPanel.classList.contains('open'));
    const bar = histOpen
      ? (document.getElementById('ai-hist-confirm-banner') || document.getElementById('ai-confirm-banner'))
      : document.getElementById('ai-confirm-banner');
    if (!bar) {
      if (typeof window.confirm === 'function' && window.confirm(promptText)) onConfirm();
      return;
    }
    bar.innerHTML = `
      <span class="ai-confirm-msg">${escapeHtml(promptText)}</span>
      <div class="ai-confirm-btns">
        <button type="button" class="ai-confirm-yes">${escapeHtml(this.getLocalizedText('confirm_yes'))}</button>
        <button type="button" class="ai-confirm-no">${escapeHtml(this.getLocalizedText('confirm_cancel'))}</button>
      </div>
    `;
    bar.style.display = 'flex';
    const yesBtn = bar.querySelector('.ai-confirm-yes');
    const noBtn = bar.querySelector('.ai-confirm-no');
    yesBtn.onclick = async () => {
      yesBtn.disabled = true;
      bar.style.display = 'none';
      try {
        await onConfirm();
      } finally {
        yesBtn.disabled = false;
      }
    };
    noBtn.onclick = () => {
      bar.style.display = 'none';
    };
  }

  async submitFeedback(messageId, snippet, rating, reason = '') {
    const user = this.getCurrentUser();
    const payload = {
      feedbackId: 'fb-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      sessionId: this.sessionId,
      messageId,
      rating,
      reason,
      messageSnippet: String(snippet || '').slice(0, 400),
      language: this.currentLang,
      createdAt: new Date().toISOString()
    };

    try {
      if (
        user &&
        window.isFirebaseAvailable &&
        typeof firebase !== 'undefined' &&
        typeof firebase.functions === 'function' &&
        firebase.auth &&
        firebase.auth().currentUser
      ) {
        const fn = firebase.functions().httpsCallable('submitAssistantFeedback');
        await fn(payload);
      } else if (typeof JanasevaDB !== 'undefined') {
        const list = JanasevaDB.get('assistant_feedback', []);
        list.unshift({ ...payload, userId: user ? user.uid : 'guest', status: 'open' });
        JanasevaDB.set('assistant_feedback', list.slice(0, 200));
      }
      this.addSystemMessage(this.getLocalizedText('fb_thanks'));
    } catch (e) {
      this.addSystemMessage(e.message || 'Feedback saved locally.');
    }
  }

  generateConversationSummary() {
    if (!this.services) return;
    const summary = this.services.civicEngine.buildConversationSummary(
      this.messages,
      this.currentGrievanceDraft || this.chatDraftState,
      this.currentLang
    );
    const title = this.getLocalizedText('summary_title');
    this.addMessage('assistant', `**${title}**\n${summary}`);
  }

  // ============================================================================
  // UI MOUNTING, COMPOSER, SCROLLING & ACCESSIBILITY
  // ============================================================================

  mountUI() {
    if (document.getElementById('janaseva-ai-assistant-widget')) return;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = 'janaseva-ai-assistant-widget';
    trigger.className = 'ai-assistant-floating-btn';
    trigger.setAttribute('aria-label', this.getLocalizedText('floating_btn_aria'));
    trigger.innerHTML = `
      <div class="ai-btn-pulse"></div>
      <i class="fa-solid fa-headset"></i>
      <span class="ai-btn-label">${escapeHtml(this.getLocalizedText('floating_btn_label'))}</span>
      <span class="ai-unread-badge" id="ai-unread-badge" style="display:none;">0</span>
    `;
    document.body.appendChild(trigger);

    const drawer = document.createElement('section');
    drawer.id = 'janaseva-ai-chat-drawer';
    drawer.className = 'ai-chat-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'JANASEVA AI Assistant');
    drawer.setAttribute('data-no-translate', 'true');
    drawer.setAttribute('data-no-auto-translate', 'true');
    drawer.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-header-brand">
          <div class="ai-header-avatar"><i class="fa-solid fa-robot"></i></div>
          <div class="ai-header-text">
            <div class="ai-header-title-row">
              <span class="ai-header-title">${escapeHtml(this.getLocalizedText('header_title'))}</span>
              <span class="ai-conn-pill guided" id="ai-conn-status-pill"><span class="dot"></span> ${escapeHtml(this.getLocalizedText('status_guided_mode'))}</span>
            </div>
            <div class="ai-header-sub">${escapeHtml(this.getLocalizedText('header_sub'))}</div>
          </div>
        </div>
        <div class="ai-header-controls">
          <button type="button" class="ai-control-btn" id="ai-new-chat-btn" title="${escapeHtml(this.getLocalizedText('new_chat_title'))}"><i class="fa-solid fa-square-plus"></i></button>
          <button type="button" class="ai-control-btn" id="ai-history-btn" title="${escapeHtml(this.getLocalizedText('history_title'))}"><i class="fa-solid fa-clock-rotate-left"></i></button>
          <button type="button" class="ai-control-btn" id="ai-settings-btn" title="${escapeHtml(this.getLocalizedText('settings_title'))}"><i class="fa-solid fa-gear"></i></button>
          <button type="button" class="ai-control-btn" id="ai-maximize-btn" title="${escapeHtml(this.getLocalizedText('maximize_title'))}"><i class="fa-solid fa-expand"></i></button>
          <button type="button" class="ai-control-btn" id="ai-clear-chat-btn" title="${escapeHtml(this.getLocalizedText('clear_chat_title'))}"><i class="fa-solid fa-trash-can"></i></button>
          <button type="button" class="ai-control-btn" id="ai-close-chat-btn" title="${escapeHtml(this.getLocalizedText('close_title'))}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>

      <div class="ai-confirm-banner" id="ai-confirm-banner" style="display:none;" role="alertdialog"></div>

      <div class="ai-history-panel" id="ai-history-panel">
        <div class="ai-hist-top">
          <strong id="ai-hist-title-lbl">${escapeHtml(this.getLocalizedText('hist_heading'))}</strong>
          <div style="display:flex;gap:6px;align-items:center;">
            <span id="ai-sync-pending-pill" class="ai-sync-pending-pill" style="display:none;"></span>
            <button type="button" id="ai-hist-clear-all-btn" class="ai-hist-danger-btn">${escapeHtml(this.getLocalizedText('hist_clear_all'))}</button>
            <button type="button" id="ai-hist-close-btn" class="ai-hist-close-btn" aria-label="Close history">&times;</button>
          </div>
        </div>
        <div class="ai-confirm-banner ai-hist-confirm-banner" id="ai-hist-confirm-banner" style="display:none;" role="alertdialog"></div>
        <input type="search" id="ai-hist-search" class="ai-hist-search-input" placeholder="${escapeHtml(this.getLocalizedText('hist_search_ph'))}">
        <div id="ai-hist-list" class="ai-hist-list"></div>
        <button type="button" id="ai-hist-load-more-btn" class="ai-hist-load-more" style="display:none;">${escapeHtml(this.getLocalizedText('hist_load_more'))}</button>
      </div>

      ${this.buildSettingsPanelHtml()}

      <div class="ai-chat-body-wrap">
        <div class="ai-welcome-hero" id="ai-welcome-hero">
          <div class="ai-welcome-crest"><i class="fa-solid fa-landmark"></i></div>
          <div class="ai-welcome-title" id="ai-welcome-heading">${escapeHtml(this.getLocalizedText('welcome_heading'))}</div>
          <div class="ai-welcome-prompts" id="ai-welcome-prompts">
            ${this.buildQuickActionButtonsHtml()}
          </div>
        </div>

        <div class="ai-chat-body" id="ai-chat-messages" role="log" aria-live="polite"></div>

        <div class="ai-typing-indicator" id="ai-typing-indicator" style="display:none;" aria-live="polite">
          <span class="ai-dots"><i></i><i></i><i></i></span>
          <span id="ai-typing-text">${escapeHtml(this.getLocalizedText('typing_status'))}</span>
        </div>

        <button type="button" id="ai-scroll-latest-btn" class="ai-scroll-latest-btn" style="display:none;">
          <i class="fa-solid fa-arrow-down"></i> <span class="ai-scroll-txt">${escapeHtml(this.getLocalizedText('scroll_latest_label'))}</span>
          <span class="ai-scroll-unread" id="ai-scroll-unread" style="display:none;">0</span>
        </button>
      </div>

      <div class="ai-speech-status-bar" id="ai-speech-status-bar">
        <span id="ai-mic-status-label">${escapeHtml(this.getLocalizedText('tap_to_speak'))}</span>
        <button type="button" id="ai-stop-audio-btn" class="ai-mini-stop-btn" title="${escapeHtml(this.getLocalizedText('stop_audio'))}">
          <i class="fa-solid fa-volume-xmark"></i> <span>${escapeHtml(this.getLocalizedText('stop_audio'))}</span>
        </button>
      </div>

      <div class="ai-attachment-strip" id="ai-attachment-strip" style="display:none;"></div>

      <div class="ai-chat-footer">
        <input type="file" id="ai-file-input" accept="image/jpeg,image/png,image/webp,application/pdf" style="display:none;">
        <div class="ai-composer-tools">
          <button type="button" class="ai-tool-btn" id="ai-attach-btn" title="${escapeHtml(this.getLocalizedText('attach_btn_label'))}" aria-label="${escapeHtml(this.getLocalizedText('attach_btn_label'))}"><i class="fa-solid fa-paperclip"></i></button>
          <button type="button" class="ai-tool-btn" id="ai-camera-btn" title="${escapeHtml(this.getLocalizedText('camera_btn_label'))}" aria-label="${escapeHtml(this.getLocalizedText('camera_btn_label'))}"><i class="fa-solid fa-camera"></i></button>
          <button type="button" class="ai-mic-action-btn" id="ai-mic-btn" title="${escapeHtml(this.getLocalizedText('mic_btn_label'))}" aria-label="${escapeHtml(this.getLocalizedText('mic_btn_label'))}"><i class="fa-solid fa-microphone"></i></button>
        </div>
        <div class="ai-input-wrap">
          <textarea id="ai-chat-input" class="ai-chat-text-input" rows="1" maxlength="1050" placeholder="${escapeHtml(this.getLocalizedText('input_placeholder'))}"></textarea>
          <div class="ai-input-right">
            <span id="ai-char-counter" class="ai-char-counter">0/1000</span>
            <button type="button" id="ai-stop-gen-btn" class="ai-stop-gen-btn" style="display:none;" title="${escapeHtml(this.getLocalizedText('stop_generating_label'))}" aria-label="${escapeHtml(this.getLocalizedText('stop_generating_label'))}"><i class="fa-solid fa-square"></i></button>
            <button type="button" id="ai-send-btn" class="ai-send-action-btn" title="${escapeHtml(this.getLocalizedText('send_btn_label'))}" aria-label="${escapeHtml(this.getLocalizedText('send_btn_label'))}"><i class="fa-solid fa-paper-plane"></i></button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    // Knowledge Document Viewer Modal
    const docModal = document.createElement('div');
    docModal.id = 'ai-doc-viewer-modal';
    docModal.className = 'ai-cam-modal-overlay ai-doc-modal-overlay';
    docModal.style.display = 'none';
    docModal.setAttribute('data-no-translate', 'true');
    docModal.setAttribute('role', 'dialog');
    docModal.setAttribute('aria-modal', 'true');
    docModal.innerHTML = `
      <div class="ai-doc-modal-card">
        <div class="ai-cam-header">
          <strong id="ai-doc-viewer-title">Knowledge Document</strong>
          <button type="button" id="ai-doc-viewer-close" class="ai-cam-close-btn" aria-label="Close preview">&times;</button>
        </div>
        <div id="ai-doc-viewer-body" class="ai-doc-viewer-body"></div>
        <div class="ai-doc-viewer-footer">
          <button type="button" id="ai-doc-viewer-dl" class="ai-cam-btn primary"><i class="fa-solid fa-download"></i> <span>${escapeHtml(this.getLocalizedText('download_doc'))}</span></button>
          <button type="button" id="ai-doc-viewer-done" class="ai-cam-btn">${escapeHtml(this.getLocalizedText('close_title'))}</button>
        </div>
      </div>
    `;
    document.body.appendChild(docModal);

    // Camera Modal
    const camModal = document.createElement('div');
    camModal.id = 'ai-camera-modal';
    camModal.className = 'ai-cam-modal-overlay';
    camModal.style.display = 'none';
    camModal.setAttribute('data-no-translate', 'true');
    camModal.setAttribute('role', 'dialog');
    camModal.setAttribute('aria-modal', 'true');
    camModal.innerHTML = `
      <div class="ai-cam-card">
        <div class="ai-cam-header">
          <strong id="ai-cam-title-txt">${escapeHtml(this.getLocalizedText('cam_title'))}</strong>
          <button type="button" id="ai-cam-close" class="ai-cam-close-btn" aria-label="Close">&times;</button>
        </div>
        <div class="ai-cam-viewport">
          <video id="ai-cam-video" autoplay playsinline muted></video>
          <canvas id="ai-cam-canvas" style="display:none;"></canvas>
          <div id="ai-cam-preview-wrap" class="ai-cam-preview-wrap" style="display:none;">
            <img id="ai-cam-preview-img" alt="Captured photo">
          </div>
          <div id="ai-cam-error" class="ai-cam-error" style="display:none;"></div>
        </div>
        <div class="ai-cam-controls" id="ai-cam-live-controls">
          <button type="button" id="ai-cam-switch" class="ai-cam-btn"><i class="fa-solid fa-camera-rotate"></i> <span>${escapeHtml(this.getLocalizedText('cam_switch'))}</span></button>
          <button type="button" id="ai-cam-capture" class="ai-cam-btn primary"><i class="fa-solid fa-camera"></i> <span>${escapeHtml(this.getLocalizedText('cam_capture'))}</span></button>
        </div>
        <div class="ai-cam-controls" id="ai-cam-review-controls" style="display:none;">
          <button type="button" id="ai-cam-retake" class="ai-cam-btn"><i class="fa-solid fa-rotate-left"></i> <span>${escapeHtml(this.getLocalizedText('cam_retake'))}</span></button>
          <button type="button" id="ai-cam-use" class="ai-cam-btn primary"><i class="fa-solid fa-check"></i> <span>${escapeHtml(this.getLocalizedText('cam_use'))}</span></button>
        </div>
      </div>
    `;
    document.body.appendChild(camModal);

    this.bindUIEvents(trigger, drawer);
    this.registerChatSettingsUSM();
    this.populateSettingsForm(this.getChatSettings());
    this.applyRuntimeSettingsToDOM();
    this.addMessage('assistant', this.getLocalizedText('welcome'), { isWelcome: true, skipAutoUnread: true });
    this.updateConnectionBadge();
    this.renderVoiceSelector();
    this.hydrateRemoteChatSettingsOnInit();
  }

  buildSettingsPanelHtml() {
    const toggle = (id, label, desc = '') => `
      <label class="ai-set-switch-row" for="${id}">
        <span class="ai-set-switch-copy">
          <strong>${escapeHtml(label)}</strong>
          ${desc ? `<small>${escapeHtml(desc)}</small>` : ''}
        </span>
        <span class="ai-switch-pill">
          <input type="checkbox" id="${id}" data-setting-key="${escapeHtml(id.replace('cs-', ''))}">
          <span class="ai-switch-slider"></span>
        </span>
      </label>
    `;

    return `
      <div class="ai-settings-panel" id="ai-settings-panel" role="dialog" aria-label="Chat Settings">
        <div class="ai-settings-head">
          <div class="ai-settings-head-left">
            <i class="fa-solid fa-sliders"></i>
            <strong>Chat &amp; Assistant Settings</strong>
          </div>
          <button type="button" id="ai-settings-close-btn" class="ai-hist-close-btn" aria-label="Close settings">&times;</button>
        </div>

        <div id="ai-chat-usm-status" class="ai-chat-usm-status"></div>

        <form id="ai-chat-settings-form" class="ai-settings-scroll">
          <div class="ai-set-group">
            <div class="ai-set-group-title"><i class="fa-solid fa-toggle-on"></i> A. General</div>
            ${toggle('cs-aiAssistant', 'AI Assistant', 'Master switch for conversational assistance')}
            ${toggle('cs-aiKnowledgeCentre', 'AI Knowledge Centre Integration', 'Ground answers in verified documents & schemes')}
            ${toggle('cs-onlineAi', 'Online AI Mode', 'Use cloud AI & live server search when online')}
            ${toggle('cs-offlineAi', 'Offline AI Mode', 'Use cached local knowledge & guided workflows offline')}
            ${toggle('cs-conversationHistory', 'Conversation History', 'Allow saving and browsing previous chats')}
            ${toggle('cs-suggestedQuestions', 'Suggested Questions', 'Show helpful starter & follow-up prompts')}
            ${toggle('cs-streamingResponses', 'Streaming Responses', 'Smoothly reveal generated responses')}
            ${toggle('cs-autoLanguageDetection', 'Auto Language Detection', 'Match script typed in English, Kannada, or Hindi')}
          </div>

          <div class="ai-set-group">
            <div class="ai-set-group-title"><i class="fa-solid fa-microphone-lines"></i> B. Communication</div>
            ${toggle('cs-voiceInput', 'Voice Input', 'Enable microphone speech-to-text')}
            ${toggle('cs-voiceResponses', 'Voice Responses', 'Allow reading assistant replies aloud')}
            ${toggle('cs-textToSpeech', 'Text-to-Speech (TTS)', 'Enable browser speech synthesis engine')}
            <label class="ai-set-switch-row" for="ai-auto-speak">
              <span class="ai-set-switch-copy">
                <strong id="ai-lbl-autospeak">${escapeHtml(this.getLocalizedText('auto_speak_label'))}</strong>
                <small>Automatically speak each new assistant reply</small>
              </span>
              <span class="ai-switch-pill">
                <input type="checkbox" id="ai-auto-speak" ${this.autoSpeak ? 'checked' : ''}>
                <span class="ai-switch-slider"></span>
              </span>
            </label>
            <div class="ai-set-field-row">
              <label id="ai-lbl-speed" for="ai-speech-rate">${escapeHtml(this.getLocalizedText('speed_label'))}</label>
              <select id="ai-speech-rate" class="ai-vp-select">
                <option value="0.75">0.75x</option>
                <option value="0.95" selected>1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
              </select>
            </div>
            <div class="ai-set-field-row">
              <label id="ai-lbl-voice" for="ai-voice-select">${escapeHtml(this.getLocalizedText('voice_label'))}</label>
              <select id="ai-voice-select" class="ai-vp-select"></select>
            </div>
            ${toggle('cs-attachments', 'Attachments', 'Allow uploading files into the chat composer')}
            ${toggle('cs-imageUpload', 'Image Upload & Camera', 'Enable JPG/PNG/WEBP photo uploads & camera')}
            ${toggle('cs-pdfUpload', 'PDF Upload', 'Enable PDF attachment upload for grievances')}
            ${toggle('cs-documentAnalysis', 'Document Analysis', 'Inspect and summarize uploaded attachments')}
          </div>

          <div class="ai-set-group">
            <div class="ai-set-group-title"><i class="fa-solid fa-brain"></i> C. Intelligence &amp; RAG</div>
            ${toggle('cs-knowledgeSearch', 'Knowledge Search', 'Search indexed Knowledge Centre documents')}
            ${toggle('cs-semanticSearch', 'Semantic Search', 'Blend meaning-based vector ranking with keywords')}
            ${toggle('cs-crossLanguageSearch', 'Cross-Language Search', 'Match queries across English, Kannada & Hindi docs')}
            ${toggle('cs-contextAwareResponses', 'Context-Aware Responses', 'Use current session context for follow-up queries')}
            ${toggle('cs-conversationMemory', 'Conversation Memory', 'Remember recent turns inside the active chat')}
            ${toggle('cs-autoKnowledgeCitation', 'Auto Knowledge Citation', 'Attach source cards with Open & Download links')}
            ${toggle('cs-complaintUnderstanding', 'Complaint Understanding', 'Guide civic grievance slot-filling & tracking')}
            ${toggle('cs-schemeSearch', 'Government Scheme Search', 'Prioritize government scheme & eligibility records')}
          </div>

          <div class="ai-set-group">
            <div class="ai-set-group-title"><i class="fa-solid fa-language"></i> D. Language (EN / KN / HI)</div>
            <div class="ai-set-field-row">
              <label for="ai-lang-select">${escapeHtml(this.getLocalizedText('lang_select_label'))}</label>
              <select id="ai-lang-select" class="ai-vp-select">
                <option value="en-IN" ${this.currentLang === 'en-IN' ? 'selected' : ''}>English</option>
                <option value="kn-IN" ${this.currentLang === 'kn-IN' ? 'selected' : ''}>ಕನ್ನಡ</option>
                <option value="hi-IN" ${this.currentLang === 'hi-IN' ? 'selected' : ''}>हिन्दी</option>
              </select>
            </div>
            ${toggle('cs-enableEnglish', 'Enable English', 'At least one language stays enabled')}
            ${toggle('cs-enableKannada', 'Enable Kannada (ಕನ್ನಡ)', 'Never silently translates if turned off')}
            ${toggle('cs-enableHindi', 'Enable Hindi (हिन्दी)', 'Never silently translates if turned off')}
            ${toggle('cs-autoTranslation', 'Auto-Translate Portal Sync', 'Sync portal UI translations with chat language')}
          </div>

          <div class="ai-set-group">
            <div class="ai-set-group-title"><i class="fa-solid fa-shield-halved"></i> E. Privacy &amp; Control</div>
            ${toggle('cs-saveChatHistory', 'Save Chat History', 'Store conversations for future access')}
            ${toggle('cs-saveAttachments', 'Save Attachments Metadata', 'Keep attachment names inside saved logs')}
            ${toggle('cs-rememberContext', 'Remember Context', 'Retain tracked IDs and topic across turns')}
            ${toggle('cs-anonymousAnalytics', 'Anonymous Analytics', 'Help improve assistant quality without PII')}
            ${toggle('cs-autoChatCleanup', 'Auto Chat Cleanup', 'Prune conversations older than retention window')}
            <div class="ai-set-field-row">
              <label for="cs-cleanupRetentionDays">Cleanup Retention</label>
              <select id="cs-cleanupRetentionDays" class="ai-vp-select">
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
            <div class="ai-set-utility-grid">
              <button type="button" class="ai-set-util-btn" id="ai-summarize-btn"><i class="fa-solid fa-list-check"></i> <span>${escapeHtml(this.getLocalizedText('summarize_btn'))}</span></button>
              <button type="button" class="ai-set-util-btn" id="ai-export-txt-btn"><i class="fa-solid fa-file-lines"></i> <span>${escapeHtml(this.getLocalizedText('export_txt_btn'))}</span></button>
              <button type="button" class="ai-set-util-btn" id="ai-export-pdf-btn"><i class="fa-solid fa-print"></i> <span>${escapeHtml(this.getLocalizedText('export_pdf_btn'))}</span></button>
              <button type="button" class="ai-set-util-btn" id="ai-clear-cache-btn"><i class="fa-solid fa-broom"></i> <span>Clear Local Cache</span></button>
            </div>
          </div>

          <details class="ai-set-group ai-settings-advanced" id="ai-settings-advanced-details">
            <summary class="ai-set-group-title ai-set-adv-summary">
              <span><i class="fa-solid fa-microchip"></i> F. Advanced (Model, Limits &amp; Sync)</span>
              <i class="fa-solid fa-chevron-down"></i>
            </summary>
            <div class="ai-set-adv-body">
              <div class="ai-set-field-row">
                <label for="cs-aiProvider">Preferred Provider</label>
                <select id="cs-aiProvider" class="ai-vp-select">
                  <option value="auto">Auto (Server Default)</option>
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="guided">Guided Local Engine</option>
                </select>
              </div>
              <div class="ai-set-field-row">
                <label for="cs-responseLength">Response Length</label>
                <select id="cs-responseLength" class="ai-vp-select">
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              <div class="ai-set-field-row">
                <label for="cs-temperature">Temperature (<span id="cs-temp-val">0.3</span>)</label>
                <input type="range" id="cs-temperature" min="0" max="1" step="0.05" value="0.3">
              </div>
              <div class="ai-set-field-row">
                <label for="cs-requestTimeoutMs">Request Timeout</label>
                <select id="cs-requestTimeoutMs" class="ai-vp-select">
                  <option value="6000">6 sec</option>
                  <option value="12000">12 sec</option>
                  <option value="14000" selected>14 sec (Default)</option>
                  <option value="20000">20 sec</option>
                  <option value="25000">25 sec</option>
                </select>
              </div>
              <div class="ai-set-field-row">
                <label for="cs-maxAttachmentSizeMb">Max Attachment Size</label>
                <select id="cs-maxAttachmentSizeMb" class="ai-vp-select">
                  <option value="2">2 MB</option>
                  <option value="5">5 MB</option>
                  <option value="10">10 MB (PDF only)</option>
                </select>
              </div>
              <div class="ai-set-field-row">
                <label for="cs-knowledgeSearchLimit">RAG Results Limit</label>
                <select id="cs-knowledgeSearchLimit" class="ai-vp-select">
                  <option value="3">3 docs</option>
                  <option value="5">5 docs</option>
                  <option value="8">8 docs</option>
                  <option value="10">10 docs</option>
                </select>
              </div>
              <div class="ai-set-field-row">
                <label for="cs-offlineStorageLimitMb">Offline KB Cache Limit</label>
                <select id="cs-offlineStorageLimitMb" class="ai-vp-select">
                  <option value="10">10 MB</option>
                  <option value="25">25 MB</option>
                  <option value="50">50 MB</option>
                  <option value="100">100 MB</option>
                </select>
              </div>
              <div class="ai-set-sync-row">
                <button type="button" id="ai-sync-kb-now-btn" class="ai-set-util-btn"><i class="fa-solid fa-arrows-rotate"></i> <span>Sync Knowledge &amp; Chats Now</span></button>
                <small id="ai-sync-stats-lbl"></small>
              </div>
            </div>
          </details>
        </form>

        <div class="ai-settings-footer-bar">
          <button type="button" id="ai-chat-settings-refresh-btn" class="usm-btn usm-btn-refresh" title="Reload saved settings"><i class="fa-solid fa-rotate"></i> Refresh</button>
          <button type="button" id="ai-chat-settings-reset-btn" class="usm-btn usm-btn-reset" title="Reset defaults"><i class="fa-solid fa-rotate-left"></i> Reset to Default</button>
          <button type="button" id="ai-chat-settings-save-btn" class="usm-btn usm-btn-save" title="Save settings"><i class="fa-solid fa-floppy-disk"></i> Save</button>
        </div>
      </div>
    `;
  }

  buildQuickActionButtonsHtml() {
    const items = [
      { key: 'qa_1', icon: 'fa-circle-plus', action: () => this.handleUserMessage(this.getLocalizedText('qa_1')) },
      { key: 'qa_2', icon: 'fa-magnifying-glass', action: () => this.handleUserMessage(this.getLocalizedText('qa_2')) },
      { key: 'qa_5', icon: 'fa-landmark', action: () => this.handleUserMessage(this.getLocalizedText('qa_5')) },
      { key: 'qa_11', icon: 'fa-book-open', action: () => this.handleUserMessage(this.getLocalizedText('qa_11')) }
    ];
    this._quickActionHandlers = items;
    return items
      .map((it, idx) => `<button type="button" class="ai-welcome-chip" data-qa-idx="${idx}" data-qa-key="${it.key}"><i class="fa-solid ${it.icon}"></i> <span>${escapeHtml(this.getLocalizedText(it.key))}</span></button>`)
      .join('');
  }

  populateSettingsForm(cfg = this.getChatSettings()) {
    const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (!el || val === undefined || val === null) return;
      const strVal = String(val);
      if (el.tagName === 'SELECT') {
        const hasMatch = Array.from(el.options).some((o) => o.value === strVal);
        if (!hasMatch && el.options.length > 0) {
          const numVal = Number(val);
          let nearest = el.options[0];
          if (Number.isFinite(numVal)) {
            let bestDiff = Infinity;
            Array.from(el.options).forEach((o) => {
              const d = Math.abs(Number(o.value) - numVal);
              if (Number.isFinite(d) && d < bestDiff) { bestDiff = d; nearest = o; }
            });
          }
          el.value = nearest.value;
          return;
        }
      }
      el.value = strVal;
    };

    [
      'aiAssistant', 'aiKnowledgeCentre', 'onlineAi', 'offlineAi', 'conversationHistory', 'suggestedQuestions',
      'streamingResponses', 'autoLanguageDetection', 'voiceInput', 'voiceResponses', 'textToSpeech',
      'attachments', 'imageUpload', 'pdfUpload', 'documentAnalysis',
      'knowledgeSearch', 'semanticSearch', 'crossLanguageSearch', 'contextAwareResponses',
      'conversationMemory', 'autoKnowledgeCitation', 'complaintUnderstanding', 'schemeSearch',
      'enableEnglish', 'enableKannada', 'enableHindi', 'autoTranslation',
      'saveChatHistory', 'saveAttachments', 'rememberContext', 'anonymousAnalytics', 'autoChatCleanup'
    ].forEach((k) => setChk(`cs-${k}`, cfg[k]));

    setChk('ai-auto-speak', cfg.autoVoicePlayback);
    setVal('ai-speech-rate', cfg.speechRate || 0.95);
    setVal('cs-cleanupRetentionDays', cfg.cleanupRetentionDays || 30);
    setVal('cs-aiProvider', cfg.aiProvider || 'auto');
    setVal('cs-responseLength', cfg.responseLength || 'balanced');
    setVal('cs-temperature', cfg.temperature !== undefined ? cfg.temperature : 0.35);
    const tempVal = document.getElementById('cs-temp-val');
    if (tempVal) tempVal.innerText = String(cfg.temperature !== undefined ? cfg.temperature : 0.35);
    setVal('cs-requestTimeoutMs', cfg.requestTimeoutMs || 12000);
    setVal('cs-maxAttachmentSizeMb', cfg.maxAttachmentSizeMb || 5);
    setVal('cs-knowledgeSearchLimit', cfg.knowledgeSearchLimit || 5);
    setVal('cs-offlineStorageLimitMb', cfg.offlineStorageLimitMb || 25);
  }

  readSettingsForm() {
    const getChk = (id, def = true) => { const el = document.getElementById(id); return el ? Boolean(el.checked) : def; };
    const getVal = (id, def) => { const el = document.getElementById(id); return el ? el.value : def; };

    const raw = {
      aiAssistant: getChk('cs-aiAssistant', true),
      aiKnowledgeCentre: getChk('cs-aiKnowledgeCentre', true),
      onlineAi: getChk('cs-onlineAi', true),
      offlineAi: getChk('cs-offlineAi', true),
      conversationHistory: getChk('cs-conversationHistory', true),
      suggestedQuestions: getChk('cs-suggestedQuestions', true),
      streamingResponses: getChk('cs-streamingResponses', true),
      autoLanguageDetection: getChk('cs-autoLanguageDetection', true),
      voiceInput: getChk('cs-voiceInput', true),
      voiceResponses: getChk('cs-voiceResponses', true),
      textToSpeech: getChk('cs-textToSpeech', true),
      autoVoicePlayback: getChk('ai-auto-speak', false),
      speechRate: parseFloat(getVal('ai-speech-rate', '0.95')),
      attachments: getChk('cs-attachments', true),
      imageUpload: getChk('cs-imageUpload', true),
      pdfUpload: getChk('cs-pdfUpload', true),
      documentAnalysis: getChk('cs-documentAnalysis', true),
      knowledgeSearch: getChk('cs-knowledgeSearch', true),
      semanticSearch: getChk('cs-semanticSearch', true),
      crossLanguageSearch: getChk('cs-crossLanguageSearch', true),
      contextAwareResponses: getChk('cs-contextAwareResponses', true),
      conversationMemory: getChk('cs-conversationMemory', true),
      autoKnowledgeCitation: getChk('cs-autoKnowledgeCitation', true),
      complaintUnderstanding: getChk('cs-complaintUnderstanding', true),
      schemeSearch: getChk('cs-schemeSearch', true),
      enableEnglish: getChk('cs-enableEnglish', true),
      enableKannada: getChk('cs-enableKannada', true),
      enableHindi: getChk('cs-enableHindi', true),
      autoTranslation: getChk('cs-autoTranslation', true),
      saveChatHistory: getChk('cs-saveChatHistory', true),
      saveAttachments: getChk('cs-saveAttachments', true),
      rememberContext: getChk('cs-rememberContext', true),
      anonymousAnalytics: getChk('cs-anonymousAnalytics', false),
      autoChatCleanup: getChk('cs-autoChatCleanup', false),
      cleanupRetentionDays: parseInt(getVal('cs-cleanupRetentionDays', '30'), 10),
      aiProvider: getVal('cs-aiProvider', 'auto'),
      aiModel: 'default',
      responseLength: getVal('cs-responseLength', 'balanced'),
      temperature: parseFloat(getVal('cs-temperature', '0.35')),
      requestTimeoutMs: parseInt(getVal('cs-requestTimeoutMs', '12000'), 10),
      maxAttachmentSizeMb: parseInt(getVal('cs-maxAttachmentSizeMb', '5'), 10),
      knowledgeSearchLimit: parseInt(getVal('cs-knowledgeSearchLimit', '5'), 10),
      offlineStorageLimitMb: parseInt(getVal('cs-offlineStorageLimitMb', '25'), 10)
    };
    return this.services && this.services.chatSettingsManager
      ? this.services.chatSettingsManager.sanitize(raw)
      : raw;
  }

  applyRuntimeSettingsToDOM() {
    const cfg = this.getChatSettings();
    this.speechRate = cfg.speechRate || 0.95;
    this.autoSpeak = Boolean(cfg.autoVoicePlayback);

    const micBtn = document.getElementById('ai-mic-btn');
    if (micBtn) micBtn.style.display = cfg.voiceInput !== false ? 'inline-flex' : 'none';

    const attachAllowed = cfg.attachments !== false && (cfg.imageUpload !== false || cfg.pdfUpload !== false);
    const attachBtn = document.getElementById('ai-attach-btn');
    if (attachBtn) attachBtn.style.display = attachAllowed ? 'inline-flex' : 'none';

    const camBtn = document.getElementById('ai-camera-btn');
    if (camBtn) camBtn.style.display = (cfg.attachments !== false && cfg.imageUpload !== false) ? 'inline-flex' : 'none';

    const fileInput = document.getElementById('ai-file-input');
    if (fileInput) {
      const mimes = [];
      if (cfg.imageUpload !== false) mimes.push('image/jpeg', 'image/png', 'image/webp');
      if (cfg.pdfUpload !== false && cfg.documentAnalysis !== false) mimes.push('application/pdf');
      fileInput.accept = mimes.join(',');
    }

    const histBtn = document.getElementById('ai-history-btn');
    if (histBtn) histBtn.style.display = cfg.conversationHistory !== false ? 'inline-flex' : 'none';

    const welcomePrompts = document.getElementById('ai-welcome-prompts');
    if (welcomePrompts) welcomePrompts.style.display = cfg.suggestedQuestions !== false ? 'grid' : 'none';

    const showTts = cfg.voiceResponses !== false && cfg.textToSpeech !== false;
    document.querySelectorAll('#ai-chat-messages .ai-read-bubble-btn').forEach((b) => {
      b.style.display = showTts ? 'inline-flex' : 'none';
    });
    const speechBar = document.getElementById('ai-speech-status-bar');
    if (speechBar) {
      speechBar.style.display = (cfg.voiceInput !== false || showTts) ? 'flex' : 'none';
    }

    const inputEl = document.getElementById('ai-chat-input');
    if (inputEl) {
      inputEl.disabled = cfg.aiAssistant === false;
      if (cfg.aiAssistant === false) {
        inputEl.placeholder = 'AI Assistant is paused in Chat Settings → General';
      } else {
        inputEl.placeholder = this.getLocalizedText('input_placeholder');
      }
    }

    if (!this.isLanguageEnabled(this.currentLang, cfg)) {
      this.currentLang = this.pickEnabledLanguage(cfg);
      this.updateInterfaceTranslations();
    }

    const langSel = document.getElementById('ai-lang-select');
    if (langSel) {
      langSel.querySelectorAll('option').forEach((opt) => {
        opt.disabled = !this.isLanguageEnabled(opt.value, cfg);
      });
      langSel.value = this.currentLang;
    }

    this.updateConnectionBadge();
  }

  async hydrateRemoteChatSettingsOnInit() {
    const user = this.getCurrentUser();
    if (!user || !user.uid || !this.services || !this.services.chatSettingsManager) return;
    try {
      const merged = await this.services.chatSettingsManager.refreshFromRemote(user.uid);
      this.chatSettings = merged;
      if (window.JanasevaSettings) {
        window.JanasevaSettings.runProgrammaticUpdate('ai-chat-settings', () => {
          this.populateSettingsForm(merged);
        });
      } else {
        this.populateSettingsForm(merged);
      }
      this.applyRuntimeSettingsToDOM();
    } catch (e) {}
  }

  registerChatSettingsUSM() {
    if (!window.JanasevaSettings || typeof window.JanasevaSettings.registerSection !== 'function') return;
    window.JanasevaSettings.registerSection({
      sectionId: 'ai-chat-settings',
      sectionName: 'AI Chat & Knowledge Settings',
      containerEl: document.getElementById('ai-settings-panel'),
      formEl: document.getElementById('ai-chat-settings-form'),
      statusHostEl: document.getElementById('ai-chat-usm-status'),
      saveBtn: document.getElementById('ai-chat-settings-save-btn'),
      resetBtn: document.getElementById('ai-chat-settings-reset-btn'),
      refreshBtn: document.getElementById('ai-chat-settings-refresh-btn'),
      confirmResetTitle: 'Reset AI Chat Settings?',
      confirmResetMessage: 'This will restore all Chat General, Voice, Intelligence, Language, Privacy, and Advanced preferences to their defaults.',
      onSave: async () => {
        const user = this.getCurrentUser();
        const candidate = this.readSettingsForm();
        const saved = await this.services.chatSettingsManager.save(user?.uid || null, candidate, user?.email || '');
        this.chatSettings = saved;
        this.populateSettingsForm(saved);
        this.applyRuntimeSettingsToDOM();
        if (saved.autoChatCleanup && user?.uid && this.services.historyStore.applyAutoCleanup) {
          await this.services.historyStore.applyAutoCleanup(user.uid, saved.cleanupRetentionDays);
        }
        return {
          message: 'Chat settings saved & applied.',
          meta: {
            lastSavedAt: saved.updatedAt || new Date().toISOString(),
            updatedBy: user?.email || 'citizen'
          }
        };
      },
      onReset: async () => {
        const user = this.getCurrentUser();
        const resetCfg = await this.services.chatSettingsManager.reset(user?.uid || null, user?.email || '');
        this.chatSettings = resetCfg;
        this.populateSettingsForm(resetCfg);
        this.applyRuntimeSettingsToDOM();
        return {
          message: 'Chat settings restored to defaults.',
          meta: { lastSavedAt: new Date().toISOString() }
        };
      },
      onRefresh: async () => {
        const user = this.getCurrentUser();
        const fresh = await this.services.chatSettingsManager.refreshFromRemote(user?.uid || null);
        this.chatSettings = fresh;
        this.populateSettingsForm(fresh);
        this.applyRuntimeSettingsToDOM();
        return {
          message: 'Reloaded latest chat settings.',
          meta: { lastRefreshedAt: new Date().toISOString() }
        };
      }
    });
  }

  async syncOfflineDataNow() {
    const lbl = document.getElementById('ai-sync-stats-lbl');
    const cfg = this.getChatSettings();
    this.isSyncing = true;
    this.updateConnectionBadge();
    if (lbl) lbl.innerText = 'Synchronizing...';

    try {
      let syncedDocs = 0;
      if (window.JanasevaKnowledgeCentre && typeof window.JanasevaKnowledgeCentre.syncOfflineKnowledgeCache === 'function') {
        const res = await window.JanasevaKnowledgeCentre.syncOfflineKnowledgeCache({
          maxMb: Number(cfg.offlineStorageLimitMb || 25),
          force: true
        });
        syncedDocs = res?.docCount || 0;
      }
      let chatSynced = 0;
      if (window.janasevaOfflineDB && typeof window.janasevaOfflineDB.syncChatQueue === 'function') {
        chatSynced = await window.janasevaOfflineDB.syncChatQueue();
      }
      await this.refreshOfflineKnowledgeAvailability();
      if (lbl) lbl.innerText = `Cached ${syncedDocs} KB docs • Synced ${chatSynced} queued chats`;
    } catch (e) {
      if (lbl) lbl.innerText = e.message || 'Sync skipped (offline)';
    } finally {
      this.isSyncing = false;
      this.updateConnectionBadge();
    }
  }

  bindUIEvents(trigger, drawer) {
    trigger.addEventListener('click', () => this.toggleDrawer());
    document.getElementById('ai-close-chat-btn')?.addEventListener('click', () => this.toggleDrawer(false));
    document.getElementById('ai-maximize-btn')?.addEventListener('click', () => this.toggleExpand());
    document.getElementById('ai-new-chat-btn')?.addEventListener('click', () => this.startNewConversation(true));
    document.getElementById('ai-history-btn')?.addEventListener('click', () => this.toggleHistoryPanel());
    document.getElementById('ai-settings-btn')?.addEventListener('click', () => this.toggleSettingsPanel());
    document.getElementById('ai-settings-close-btn')?.addEventListener('click', () => this.toggleSettingsPanel(false));
    document.getElementById('ai-hist-close-btn')?.addEventListener('click', () => this.toggleHistoryPanel(false));
    document.getElementById('ai-clear-chat-btn')?.addEventListener('click', () => this.clearChat());
    document.getElementById('ai-mic-btn')?.addEventListener('click', () => this.toggleListening());
    document.getElementById('ai-stop-audio-btn')?.addEventListener('click', () => this.stopSpeaking());

    document.querySelectorAll('#ai-welcome-prompts .ai-welcome-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const idx = Number(chip.getAttribute('data-qa-idx'));
        if (this._quickActionHandlers && this._quickActionHandlers[idx]) {
          this._quickActionHandlers[idx].action();
        }
      });
    });

    const tempSlider = document.getElementById('cs-temperature');
    if (tempSlider) {
      tempSlider.addEventListener('input', () => {
        const tv = document.getElementById('cs-temp-val');
        if (tv) tv.innerText = String(tempSlider.value);
      });
    }

    document.getElementById('ai-clear-cache-btn')?.addEventListener('click', () => {
      this.requestInlineConfirm('Clear cached local chat logs on this browser?', async () => {
        const user = this.getCurrentUser();
        if (user?.uid && this.services?.historyStore) {
          await this.services.historyStore.clearAll(user.uid);
        }
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith('janaseva_chat_sessions_')) localStorage.removeItem(k);
          });
        } catch (e) {}
        this.addSystemMessage('Local chat cache cleared.');
      });
    });

    document.getElementById('ai-sync-kb-now-btn')?.addEventListener('click', () => this.syncOfflineDataNow());

    document.getElementById('ai-doc-viewer-close')?.addEventListener('click', () => this.closeKnowledgeDocumentModal());
    document.getElementById('ai-doc-viewer-done')?.addEventListener('click', () => this.closeKnowledgeDocumentModal());

    const speechRateEl = document.getElementById('ai-speech-rate');
    if (speechRateEl) {
      speechRateEl.value = String(this.speechRate);
      speechRateEl.addEventListener('change', (e) => {
        this.speechRate = parseFloat(e.target.value) || 0.95;
        this.chatSettings.speechRate = this.speechRate;
        try { localStorage.setItem('janaseva_chat_speech_rate', String(this.speechRate)); } catch (er) {}
      });
    }

    document.getElementById('ai-voice-select')?.addEventListener('change', (e) => {
      const val = e.target.value;
      const found = this.availableVoices.find((v) => (v.voiceURI || v.name) === val);
      if (found) this.selectedVoice = found;
    });

    document.getElementById('ai-auto-speak')?.addEventListener('change', (e) => {
      this.autoSpeak = Boolean(e.target.checked);
      this.chatSettings.autoVoicePlayback = this.autoSpeak;
      try { localStorage.setItem('janaseva_chat_auto_speak', String(this.autoSpeak)); } catch (er) {}
    });

    document.getElementById('ai-summarize-btn')?.addEventListener('click', () => {
      this.toggleSettingsPanel(false);
      this.generateConversationSummary();
    });
    document.getElementById('ai-export-txt-btn')?.addEventListener('click', () => {
      if (this.services) {
        this.services.historyStore.exportAsText({
          title: this.sessionTitle || 'JANASEVA Chat',
          language: this.currentLang,
          messages: this.messages
        });
      }
    });
    document.getElementById('ai-export-pdf-btn')?.addEventListener('click', () => {
      if (this.services) {
        this.services.historyStore.exportAsPrintablePdf({
          title: this.sessionTitle || 'JANASEVA Chat',
          language: this.currentLang,
          messages: this.messages
        }, escapeHtml);
      }
    });

    // History Search, Clear All, Load More
    document.getElementById('ai-hist-search').addEventListener('input', () => {
      this.historyPage = 1;
      this.renderHistoryList();
    });
    document.getElementById('ai-hist-load-more-btn').addEventListener('click', () => {
      this.historyPage++;
      this.renderHistoryList();
    });
    document.getElementById('ai-hist-clear-all-btn').addEventListener('click', () => {
      const user = this.getCurrentUser();
      if (!user || !this.services) return;
      this.requestInlineConfirm(this.getLocalizedText('hist_clear_all_confirm'), async () => {
        await this.services.historyStore.clearAll(user.uid);
        this.startNewConversation(false);
        await this.renderHistoryList();
      });
    });

    // Language Sync
    document.getElementById('ai-lang-select').addEventListener('change', (e) => this.setLanguage(e.target.value, true));
    window.addEventListener('janaseva:langChanged', (e) => {
      if (e.detail && e.detail.lang) {
        const mapped = e.detail.lang === 'kn' ? 'kn-IN' : (e.detail.lang === 'hi' ? 'hi-IN' : 'en-IN');
        if (this.currentLang !== mapped) this.setLanguage(mapped, false);
      }
    });

    // Isolate sessions & refresh settings when user changes / logs out
    window.addEventListener('janaseva:authChanged', () => {
      this.chatSettings = this.loadChatSettings();
      this.populateSettingsForm(this.chatSettings);
      this.applyRuntimeSettingsToDOM();
      this.hydrateRemoteChatSettingsOnInit();
      this.startNewConversation(false);
      this.toggleHistoryPanel(false);
      this.toggleSettingsPanel(false);
    });

    window.addEventListener('janaseva:chatSettingsChanged', (e) => {
      if (e.detail && e.detail.settings) {
        this.chatSettings = e.detail.settings;
        this.applyRuntimeSettingsToDOM();
      }
    });

    window.addEventListener('janaseva:chatSyncState', (e) => {
      this.isSyncing = Boolean(e.detail && e.detail.syncing);
      this.updateConnectionBadge();
      this.refreshOfflineKnowledgeAvailability();
    });

    // Online/Offline Badge updates
    window.addEventListener('online', () => this.updateConnectionBadge());
    window.addEventListener('offline', () => this.updateConnectionBadge());

    // Attachment & Camera
    const fileInput = document.getElementById('ai-file-input');
    document.getElementById('ai-attach-btn').addEventListener('click', () => fileInput?.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileAttach(e.target.files[0]);
        fileInput.value = '';
      }
    });
    document.getElementById('ai-camera-btn').addEventListener('click', () => this.openCameraModal());
    document.getElementById('ai-cam-close').addEventListener('click', () => this.closeCameraModal());
    document.getElementById('ai-cam-switch').addEventListener('click', () => {
      this._camFacing = this._camFacing === 'environment' ? 'user' : 'environment';
      this.startCameraStream();
    });
    document.getElementById('ai-cam-capture').addEventListener('click', () => this.captureCameraPhoto());
    document.getElementById('ai-cam-retake').addEventListener('click', () => {
      document.getElementById('ai-cam-preview-wrap').style.display = 'none';
      document.getElementById('ai-cam-review-controls').style.display = 'none';
      document.getElementById('ai-cam-live-controls').style.display = 'flex';
      document.getElementById('ai-cam-video')?.play().catch(() => {});
    });
    document.getElementById('ai-cam-use').addEventListener('click', () => this.useCapturedCameraPhoto());

    // Composer Input: Auto-expand, Enter-to-send, Shift+Enter newline, char counter
    const inputEl = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const stopGenBtn = document.getElementById('ai-stop-gen-btn');

    const submitInput = () => {
      const text = inputEl.value.trim();
      if (!text) {
        this.addSystemMessage(this.getLocalizedText('empty_input_warning'));
        return;
      }
      if (text.length > 1000) {
        this.addSystemMessage(this.getLocalizedText('length_limit_warning'));
        return;
      }
      if (this.isGenerating) {
        this.addSystemMessage(this.getLocalizedText('duplicate_submit_guard'));
        return;
      }
      inputEl.value = '';
      this.autoResizeInput();
      this.updateCharCounter();
      this.handleUserMessage(text);
    };

    sendBtn.addEventListener('click', submitInput);
    stopGenBtn.addEventListener('click', () => this.stopGenerating());
    inputEl.addEventListener('input', () => {
      this.autoResizeInput();
      this.updateCharCounter();
    });
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        submitInput();
      }
    });

    // Scroll-to-latest tracking
    const msgLog = document.getElementById('ai-chat-messages');
    const scrollBtn = document.getElementById('ai-scroll-latest-btn');
    msgLog.addEventListener('scroll', () => {
      const distFromBottom = msgLog.scrollHeight - msgLog.scrollTop - msgLog.clientHeight;
      const isNearBottom = distFromBottom < 48;
      scrollBtn.style.display = isNearBottom ? 'none' : 'inline-flex';
      if (isNearBottom) {
        const uBadge = document.getElementById('ai-scroll-unread');
        if (uBadge) { uBadge.innerText = '0'; uBadge.style.display = 'none'; }
      }
    });
    scrollBtn.addEventListener('click', () => this.scrollToBottom());

    // Escape closes doc modal, camera modal, settings/history overlays, or drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const docMod = document.getElementById('ai-doc-viewer-modal');
        if (docMod && docMod.style.display === 'flex') {
          this.closeKnowledgeDocumentModal();
          return;
        }
        const cam = document.getElementById('ai-camera-modal');
        if (cam && cam.style.display === 'flex') {
          this.closeCameraModal();
          return;
        }
        if (this.settingsOpen) {
          this.toggleSettingsPanel(false);
          return;
        }
        const histPanel = document.getElementById('ai-history-panel');
        if (histPanel && histPanel.classList.contains('open')) {
          this.toggleHistoryPanel(false);
          return;
        }
        if (drawer.classList.contains('active')) {
          this.toggleDrawer(false);
        }
      }
    });

    // Mobile virtual keyboard & short-viewport adaptation
    const syncDrawerViewport = () => {
      if (!drawer.classList.contains('active')) return;
      const isMobile = window.innerWidth <= 600;
      const vv = window.visualViewport;
      if (vv && (isMobile || vv.height < window.innerHeight * 0.85 || vv.height <= 520)) {
        const kbOpen = vv.height < window.innerHeight - 90;
        drawer.classList.toggle('ai-keyboard-open', kbOpen);
        if (isMobile) {
          if (kbOpen) {
            // Pin drawer to visible viewport above software keyboard
            drawer.style.top = `${Math.max(0, Math.round(vv.offsetTop))}px`;
            drawer.style.height = `${Math.round(vv.height)}px`;
            drawer.style.maxHeight = `${Math.round(vv.height)}px`;
            drawer.style.bottom = 'auto';
            const chatBody = document.getElementById('ai-chat-messages');
            if (chatBody) {
              chatBody.scrollTop = chatBody.scrollHeight;
            }
          } else {
            // Clean edge-to-edge full screen mobile mode
            drawer.style.top = '0px';
            drawer.style.bottom = '0px';
            drawer.style.height = '100dvh';
            drawer.style.maxHeight = '100dvh';
          }
        } else {
          // Tablet / Desktop short viewport
          const bottomPx = kbOpen
            ? Math.max(6, Math.round(window.innerHeight - vv.height - vv.offsetTop + 6))
            : (window.innerHeight <= 520 ? 8 : (window.innerWidth <= 768 ? 72 : 88));
          const availH = Math.max(220, Math.round(vv.height - bottomPx - 10));
          drawer.style.bottom = `${bottomPx}px`;
          drawer.style.top = '';
          drawer.style.maxHeight = `${availH}px`;
          drawer.style.height = `${Math.min(640, availH)}px`;
        }
      } else {
        drawer.style.maxHeight = '';
        drawer.style.height = '';
        drawer.style.bottom = '';
        drawer.style.top = '';
        drawer.classList.remove('ai-keyboard-open');
      }
    };
    this._syncDrawerViewport = syncDrawerViewport;
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncDrawerViewport);
      window.visualViewport.addEventListener('scroll', syncDrawerViewport);
    }
    window.addEventListener('orientationchange', () => setTimeout(syncDrawerViewport, 120));
    inputEl.addEventListener('focus', () => setTimeout(syncDrawerViewport, 80));
    inputEl.addEventListener('blur', () => setTimeout(syncDrawerViewport, 120));
  }

  autoResizeInput() {
    const el = document.getElementById('ai-chat-input');
    if (!el) return;
    el.style.height = 'auto';
    const isShort = window.innerHeight <= 520;
    const maxH = isShort ? 64 : 100;
    const newHeight = Math.min(maxH, Math.max(34, el.scrollHeight));
    el.style.height = newHeight + 'px';
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  }

  updateCharCounter() {
    const el = document.getElementById('ai-chat-input');
    const cnt = document.getElementById('ai-char-counter');
    if (!el || !cnt) return;
    const len = el.value.length;
    cnt.innerText = `${len}/1000`;
    cnt.classList.toggle('visible', len > 0);
    cnt.classList.toggle('warn', len >= 850 && len <= 1000);
    cnt.classList.toggle('over', len > 1000);
  }

  setGeneratingState(active) {
    this.isGenerating = Boolean(active);
    const typing = document.getElementById('ai-typing-indicator');
    const sendBtn = document.getElementById('ai-send-btn');
    const stopBtn = document.getElementById('ai-stop-gen-btn');
    if (typing) typing.style.display = active ? 'flex' : 'none';
    if (sendBtn) sendBtn.style.display = active ? 'none' : 'inline-flex';
    if (stopBtn) stopBtn.style.display = active ? 'inline-flex' : 'none';
    if (active) this.scrollToBottom();
  }

  stopGenerating() {
    if (!this.isGenerating) return;
    this.activeAbortFlag = true;
    this.activeRequestToken++;
    this.setGeneratingState(false);
    this.addSystemMessage(this.getLocalizedText('generation_stopped'));
  }

  toggleExpand() {
    const drawer = document.getElementById('janaseva-ai-chat-drawer');
    const btn = document.getElementById('ai-maximize-btn');
    if (!drawer) return;
    this.isExpanded = !this.isExpanded;
    drawer.classList.toggle('expanded', this.isExpanded);
    if (btn) {
      btn.innerHTML = this.isExpanded ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
      btn.title = this.getLocalizedText(this.isExpanded ? 'restore_size_title' : 'maximize_title');
    }
  }

  toggleDrawer(show = null) {
    const drawer = document.getElementById('janaseva-ai-chat-drawer');
    if (!drawer) return;
    if (show === null) drawer.classList.toggle('active');
    else if (show) drawer.classList.add('active');
    else drawer.classList.remove('active');

    const isOpen = drawer.classList.contains('active');
    const trigger = document.getElementById('janaseva-ai-assistant-widget');
    if (trigger) {
      trigger.classList.toggle('drawer-open', isOpen);
    }
    if (isOpen) {
      this.unreadCount = 0;
      const badge = document.getElementById('ai-unread-badge');
      if (badge) { badge.style.display = 'none'; badge.innerText = '0'; }
      if (this._syncDrawerViewport) this._syncDrawerViewport();
      setTimeout(() => document.getElementById('ai-chat-input')?.focus(), 120);
    } else {
      drawer.style.maxHeight = '';
      drawer.style.height = '';
      drawer.style.bottom = '';
      drawer.classList.remove('ai-keyboard-open');
      this.stopSpeaking();
      if (this.isListening && this.recognition) {
        this._recognitionCancelled = true;
        this.recognition.stop();
      }
    }
  }

  scrollToBottom() {
    const container = document.getElementById('ai-chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  formatSafeMessageHtml(rawText) {
    const inlineFormat = (escapedLine) => escapedLine
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    const lines = escapeHtml(String(rawText || '')).split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Markdown table block
      if (
        line.startsWith('|') &&
        line.endsWith('|') &&
        i + 1 < lines.length &&
        /^\|?[\s:|-]+\|[\s:|-]+\|?$/.test(lines[i + 1].trim())
      ) {
        const parseRow = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => inlineFormat(c.trim()));
        const headers = parseRow(line);
        i += 2;
        const bodyRows = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          bodyRows.push(parseRow(lines[i]));
          i++;
        }
        const ths = headers.map((h) => `<th>${h}</th>`).join('');
        const trs = bodyRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
        out.push(`<div class="ai-md-table-wrap"><table class="ai-md-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`);
        continue;
      }

      // Headings
      const h3 = line.match(/^###\s+(.+)$/);
      const h2 = line.match(/^#{1,2}\s+(.+)$/);
      if (h3) {
        out.push(`<h4 class="ai-md-heading">${inlineFormat(h3[1])}</h4>`);
        i++;
        continue;
      }
      if (h2) {
        out.push(`<h3 class="ai-md-heading">${inlineFormat(h2[1])}</h3>`);
        i++;
        continue;
      }

      // Unordered list
      if (/^[-*•]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
          items.push(`<li>${inlineFormat(lines[i].trim().replace(/^[-*•]\s+/, ''))}</li>`);
          i++;
        }
        out.push(`<ul class="ai-md-list">${items.join('')}</ul>`);
        continue;
      }

      // Ordered list
      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(`<li>${inlineFormat(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
          i++;
        }
        out.push(`<ol class="ai-md-list">${items.join('')}</ol>`);
        continue;
      }

      if (!line) {
        if (out.length && !out[out.length - 1].endsWith('</p>') && !out[out.length - 1].endsWith('</div>')) {
          out.push('<br>');
        }
        i++;
        continue;
      }

      out.push(`<p class="ai-md-p">${inlineFormat(lines[i])}</p>`);
      i++;
    }

    return out.join('');
  }

  formatMsgTime(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj || Date.now());
    try {
      return d.toLocaleTimeString(this.currentLang, { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  addMessage(sender, text, meta = {}) {
    const msgId = 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const tsDate = meta.timestamp instanceof Date ? meta.timestamp : new Date();
    const msgRecord = {
      id: msgId,
      sender,
      text: String(text || ''),
      lang: this.getResponseLangShort(),
      timestamp: tsDate,
      isWelcome: Boolean(meta.isWelcome),
      status: meta.status || 'sent'
    };
    this.messages.push(msgRecord);

    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer) return msgRecord;

    const wasNearBottom = (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight) < 60;

    const row = document.createElement('div');
    row.className = `ai-message-row ${sender}`;
    row.setAttribute('data-msg-id', msgId);

    const metaTop = document.createElement('div');
    metaTop.className = 'ai-msg-meta';
    metaTop.innerHTML = `
      <span class="ai-msg-author">${escapeHtml(this.getLocalizedText(sender === 'user' ? 'you_label' : 'assistant_label'))}</span>
      <span class="ai-msg-time">${escapeHtml(this.formatMsgTime(tsDate))}</span>
      ${sender === 'user' ? `<span class="ai-msg-status" id="status_${msgId}">${escapeHtml(this.getLocalizedText(msgRecord.status === 'sending' ? 'msg_sending' : 'msg_sent'))}</span>` : ''}
    `;

    const bubble = document.createElement('div');
    bubble.className = `ai-bubble ${sender}`;
    if (msgRecord.isWelcome) bubble.setAttribute('data-msg-type', 'welcome');
    bubble.setAttribute('data-msg-lang', msgRecord.lang);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'ai-bubble-content';
    contentDiv.innerHTML = this.formatSafeMessageHtml(msgRecord.text);
    bubble.appendChild(contentDiv);

    if (Array.isArray(meta.attachments) && meta.attachments.length) {
      const attBadge = document.createElement('div');
      attBadge.className = 'ai-msg-attachments';
      attBadge.innerHTML = meta.attachments.map((a) => `<span><i class="fa-solid fa-paperclip"></i> ${escapeHtml(a.safeFileName || a.name)}</span>`).join(' ');
      bubble.appendChild(attBadge);
    }

    row.appendChild(metaTop);
    row.appendChild(bubble);

    // Message Action Toolbar
    const actionsBar = document.createElement('div');
    actionsBar.className = 'ai-msg-actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'ai-action-mini ai-copy-bubble-btn';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copyBtn.title = this.getLocalizedText('copy_btn');
    copyBtn.setAttribute('aria-label', copyBtn.title);
    copyBtn.onclick = () => this.copyMessageText(msgRecord.text, copyBtn);
    actionsBar.appendChild(copyBtn);

    if (sender === 'assistant') {
      const cfg = this.getChatSettings();
      const showTts = cfg.voiceResponses !== false && cfg.textToSpeech !== false;
      const readBtn = document.createElement('button');
      readBtn.type = 'button';
      readBtn.className = 'ai-action-mini ai-read-bubble-btn';
      readBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      readBtn.title = this.getLocalizedText('read_aloud');
      readBtn.setAttribute('aria-label', readBtn.title);
      readBtn.style.display = showTts ? 'inline-flex' : 'none';
      readBtn.onclick = () => this.speak(msgRecord.text, true);
      actionsBar.appendChild(readBtn);

      if (!msgRecord.isWelcome && meta.forUserText) {
        const regenBtn = document.createElement('button');
        regenBtn.type = 'button';
        regenBtn.className = 'ai-action-mini ai-regen-bubble-btn';
        regenBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
        regenBtn.title = this.getLocalizedText('regenerate_btn');
        regenBtn.setAttribute('aria-label', regenBtn.title);
        regenBtn.onclick = () => this.handleUserMessage(meta.forUserText, { isRegenerate: true });
        actionsBar.appendChild(regenBtn);
      }

      if (!msgRecord.isWelcome) {
        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'ai-action-mini';
        upBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i>';
        upBtn.title = this.getLocalizedText('fb_helpful');
        upBtn.onclick = () => {
          upBtn.classList.add('voted');
          this.submitFeedback(msgId, msgRecord.text, 'helpful');
        };

        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'ai-action-mini';
        downBtn.innerHTML = '<i class="fa-regular fa-thumbs-down"></i>';
        downBtn.title = this.getLocalizedText('fb_not_helpful');
        downBtn.onclick = () => {
          downBtn.classList.add('voted');
          this.submitFeedback(msgId, msgRecord.text, 'not_helpful');
        };

        const flagBtn = document.createElement('button');
        flagBtn.type = 'button';
        flagBtn.className = 'ai-action-mini';
        flagBtn.innerHTML = '<i class="fa-regular fa-flag"></i>';
        flagBtn.title = this.getLocalizedText('fb_report');
        flagBtn.onclick = () => this.openReportInlineForm(row, msgId, msgRecord.text);

        actionsBar.appendChild(upBtn);
        actionsBar.appendChild(downBtn);
        actionsBar.appendChild(flagBtn);
      }
    }

    row.appendChild(actionsBar);

    if (meta.navigationTarget) {
      const navBtn = document.createElement('a');
      navBtn.className = 'ai-nav-pill-btn';
      navBtn.href = meta.navigationTarget;
      navBtn.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> ${escapeHtml(this.resolveNavLabel(meta.navigationTarget))}`;
      row.appendChild(navBtn);
    }

    if (sender === 'assistant' && Array.isArray(meta.suggestedQuestions) && meta.suggestedQuestions.length) {
      const sugWrap = document.createElement('div');
      sugWrap.className = 'ai-suggested-wrap';
      meta.suggestedQuestions.slice(0, 4).forEach((qText) => {
        const qBtn = document.createElement('button');
        qBtn.type = 'button';
        qBtn.className = 'ai-suggested-chip';
        qBtn.innerText = qText;
        qBtn.onclick = () => this.handleUserMessage(qText);
        sugWrap.appendChild(qBtn);
      });
      row.appendChild(sugWrap);
    }

    chatContainer.appendChild(row);

    // Unread indicator handling
    const drawer = document.getElementById('janaseva-ai-chat-drawer');
    if (sender === 'assistant' && !meta.skipAutoUnread && drawer && !drawer.classList.contains('active')) {
      this.unreadCount++;
      const badge = document.getElementById('ai-unread-badge');
      if (badge) {
        badge.innerText = String(this.unreadCount);
        badge.style.display = 'inline-flex';
      }
    }

    if (wasNearBottom || sender === 'user') {
      this.scrollToBottom();
    } else if (sender === 'assistant') {
      const uBadge = document.getElementById('ai-scroll-unread');
      if (uBadge) {
        uBadge.innerText = String((parseInt(uBadge.innerText, 10) || 0) + 1);
        uBadge.style.display = 'inline-flex';
      }
    }

    return msgRecord;
  }

  resolveNavLabel(target) {
    if (String(target).includes('login.html')) return this.getLocalizedText('btn_sign_in_now');
    if (String(target).includes('track.html')) return this.getLocalizedText('btn_track_this');
    if (String(target).includes('complaint.html')) return this.getLocalizedText('btn_open_form');
    if (String(target).includes('directory.html')) return this.getLocalizedText('qa_10');
    if (String(target).includes('citizen-dashboard.html')) return this.getLocalizedText('qa_3');
    if (String(target).includes('knowledge-centre.html')) return this.getLocalizedText('open_knowledge_centre');
    return this.getLocalizedText('qa_11');
  }

  setMessageStatus(msgId, status) {
    const rec = this.messages.find((m) => m.id === msgId);
    if (rec) rec.status = status;
    const el = document.getElementById(`status_${msgId}`);
    if (!el) return;
    el.className = `ai-msg-status ${status}`;
    el.innerText = this.getLocalizedText(
      status === 'sending' ? 'msg_sending' : (status === 'failed' ? 'msg_failed' : 'msg_sent')
    );
  }

  attachRetryActionToUserMsg(msgId) {
    const row = document.querySelector(`#ai-chat-messages .ai-message-row[data-msg-id="${msgId}"]`);
    if (!row || row.querySelector('.ai-retry-bubble-btn')) return;
    const actionsBar = row.querySelector('.ai-msg-actions');
    const rec = this.messages.find((m) => m.id === msgId);
    if (!actionsBar || !rec) return;

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'ai-action-mini ai-retry-bubble-btn';
    retryBtn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> ${escapeHtml(this.getLocalizedText('retry_btn'))}`;
    retryBtn.onclick = () => {
      retryBtn.remove();
      this.handleUserMessage(rec.text, { retryMsgRecord: rec });
    };
    actionsBar.appendChild(retryBtn);
  }

  openReportInlineForm(row, msgId, snippet) {
    if (row.querySelector('.ai-report-inline')) return;
    const box = document.createElement('div');
    box.className = 'ai-report-inline';
    box.innerHTML = `
      <input type="text" class="ai-report-input" maxlength="500" placeholder="${escapeHtml(this.getLocalizedText('fb_report_prompt'))}">
      <button type="button" class="ai-report-submit-btn">${escapeHtml(this.getLocalizedText('fb_submit'))}</button>
    `;
    box.querySelector('.ai-report-submit-btn').onclick = () => {
      const reason = box.querySelector('.ai-report-input').value.trim();
      box.remove();
      this.submitFeedback(msgId, snippet, 'incorrect', reason);
    };
    row.appendChild(box);
    box.querySelector('.ai-report-input').focus();
  }

  async copyMessageText(text, btn) {
    const clean = String(text || '').replace(/\*\*([^*]+)\*\*/g, '$1');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clean);
      }
      if (btn) {
        const prev = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        btn.title = this.getLocalizedText('copied_btn');
        setTimeout(() => { btn.innerHTML = prev; btn.title = this.getLocalizedText('copy_btn'); }, 1500);
      }
    } catch (e) {}
  }

  addSystemMessage(text) {
    const chatContainer = document.getElementById('ai-chat-messages');
    if (!chatContainer) return;
    const sysEl = document.createElement('div');
    sysEl.className = 'ai-system-pill';
    sysEl.innerText = text;
    chatContainer.appendChild(sysEl);
    this.scrollToBottom();
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.janasevaVoiceAssistant = new JanasevaVoiceAssistant();
document.addEventListener('DOMContentLoaded', () => {
  window.janasevaVoiceAssistant.mountUI();
});
