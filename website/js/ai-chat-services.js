/**
 * JANASEVA 3.0 – AI Chat Services Module
 * Provides:
 *  1. Complete 3-Language UI & Dialogue Dictionary (en, kn, hi)
 *  2. Binary Magic-Byte Attachment Security Validator (JPG, PNG, WEBP, PDF)
 *  3. UID-Isolated Persistent Chat History & Export Engine (TXT / Printable PDF)
 *  4. Typo-Tolerant Civic NLU, Slot-Filling & Knowledge Engine (Local/Offline Parity)
 */
(function (window) {
  'use strict';

  const JANASEVA_CHAT_DICT = {
    // Header & Connection Status
    header_title: { en: "JANASEVA AI", kn: "ಜನಸೇವಾ AI", hi: "जनसेवा AI" },
    header_sub: { en: "Gram Panchayat & Knowledge Assistant", kn: "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಮತ್ತು ಜ್ಞಾನ ಸಹಾಯಕ", hi: "ग्राम पंचायत व ज्ञान सहायक" },
    status_online_ai: { en: "Live AI", kn: "ಲೈವ್ AI", hi: "लाइव AI" },
    status_guided_mode: { en: "Local Mode", kn: "ಸ್ಥಳೀಯ ಮೋಡ್", hi: "लोकल मोड" },
    status_offline_kb: { en: "Offline KB", kn: "ಆಫ್‌ಲೈನ್ KB", hi: "ऑफलाइन KB" },
    status_offline: { en: "Offline", kn: "ಆಫ್‌ಲೈನ್", hi: "ऑफलाइन" },
    status_syncing: { en: "Syncing...", kn: "ಸಿಂಕ್...", hi: "सिंक..." },
    status_error: { en: "AI Error", kn: "AI ದೋಷ", hi: "AI त्रुटि" },
    ai_unconfigured_banner: {
      en: "External LLM API key is not configured on the server. Running JANASEVA Guided Citizen Assistant (real complaint registration, tracking & Panchayat directory connected).",
      kn: "ಸರ್ವರ್‌ನಲ್ಲಿ ಬಾಹ್ಯ AI API ಕೀ ಕಾನ್ಫಿಗರ್ ಆಗಿಲ್ಲ. ಜನಸೇವಾ ಮಾರ್ಗದರ್ಶಿ ಸಹಾಯಕ ಚಾಲನೆಯಲ್ಲಿದೆ (ನೈಜ ದೂರು ನೋಂದಣಿ, ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಡೈರೆಕ್ಟರಿ ಸಂಪರ್ಕಿತವಾಗಿದೆ).",
      hi: "सर्वर पर बाहरी AI API कुंजी कॉन्फ़िगर नहीं है। जनसेवा गाइडेड सहायक सक्रिय है (वास्तविक शिकायत पंजीकरण, ट्रैकिंग और पंचायत निर्देशिका जुड़ी हुई है)।"
    },

    // Header Actions & Tooltips
    new_chat_title: { en: "New Chat", kn: "ಹೊಸ ಚಾಟ್", hi: "नई चैट" },
    history_title: { en: "Conversation History", kn: "ಸಂಭಾಷಣೆ ಇತಿಹಾಸ", hi: "चैट इतिहास" },
    settings_title: { en: "Chat Settings", kn: "ಚಾಟ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು", hi: "चैट सेटिंग्स" },
    rename_chat_title: { en: "Rename Conversation", kn: "ಸಂಭಾಷಣೆ ಮರುಹೆಸರಿಸಿ", hi: "बातचीत का नाम बदलें" },
    view_doc_btn: { en: "Open Document", kn: "ದಾಖಲೆ ತೆರೆಯಿರಿ", hi: "दस्तावेज़ खोलें" },
    minimize_title: { en: "Minimize", kn: "ಕುಗ್ಗಿಸಿ", hi: "छोटा करें" },
    maximize_title: { en: "Expand Window", kn: "ವಿಂಡೋ ವಿಸ್ತರಿಸಿ", hi: "विंडो बड़ा करें" },
    restore_size_title: { en: "Restore Size", kn: "ಸಾಮಾನ್ಯ ಗಾತ್ರ", hi: "सामान्य आकार" },
    clear_chat_title: { en: "Clear Conversation", kn: "ಸಂಭಾಷಣೆ ಅಳಿಸಿ", hi: "बातचीत साफ़ करें" },
    close_title: { en: "Close", kn: "ಮುಚ್ಚಿ", hi: "बंद करें" },
    lang_select_label: { en: "Assistant Language", kn: "ಸಹಾಯಕ ಭಾಷೆ", hi: "सहायक भाषा" },
    voice_settings_title: { en: "Voice & Audio Settings", kn: "ಧ್ವನಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳು", hi: "आवाज़ सेटिंग्स" },
    summarize_btn: { en: "Summarize", kn: "ಸಾರಾಂಶ", hi: "सारांश" },
    export_txt_btn: { en: "Export TXT", kn: "TXT ರಫ್ತು", hi: "TXT निर्यात" },
    export_pdf_btn: { en: "Print / PDF", kn: "ಮುದ್ರಣ / PDF", hi: "प्रिंट / PDF" },
    quick_actions_toggle: { en: "Quick Actions", kn: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು", hi: "त्वरित कार्य" },

    // Welcome Screen
    welcome_heading: { en: "Hello! I'm JANASEVA AI. How can I help you today?", kn: "ನಮಸ್ಕಾರ! ನಾನು ಜನಸೇವಾ AI. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?", hi: "नमस्कार! मैं जनसेवा AI हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?" },
    welcome: {
      en: "Hello! I'm JANASEVA AI. Ask me about Gram Panchayat documents and schemes in the Knowledge Centre, register a complaint, or track an existing grievance.",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ಜನಸೇವಾ AI. ಜ್ಞಾನ ಕೋಶದಲ್ಲಿರುವ ಗ್ರಾಮ ಪಂಚಾಯತ್ ದಾಖಲೆಗಳು ಮತ್ತು ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ, ದೂರು ದಾಖಲಿಸಿ ಅಥವಾ ದೂರಿನ ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
      hi: "नमस्कार! मैं जनसेवा AI हूँ। ज्ञान केंद्र के दस्तावेज़ों व योजनाओं के बारे में पूछें, शिकायत दर्ज करें, या अपनी शिकायत की स्थिति ट्रैक करें।"
    },

    // Smart Quick Actions (All 12)
    qa_1: { en: "Register a complaint", kn: "ದೂರು ದಾಖಲಿಸಿ", hi: "शिकायत दर्ज करें" },
    qa_2: { en: "Track my complaint", kn: "ನನ್ನ ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ", hi: "मेरी शिकायत ट्रैक करें" },
    qa_3: { en: "Check complaint history", kn: "ದೂರು ಇತಿಹಾಸ ನೋಡಿ", hi: "शिकायत इतिहास देखें" },
    qa_4: { en: "Check complaint status", kn: "ದೂರಿನ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ", hi: "शिकायत स्थिति जांचें" },
    qa_5: { en: "Gram Panchayat services", kn: "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸೇವೆಗಳು", hi: "ग्राम पंचायत सेवाएं" },
    qa_6: { en: "Water supply problems", kn: "ಕುಡಿಯುವ ನೀರಿನ ಸಮಸ್ಯೆ", hi: "पेयजल आपूर्ति समस्या" },
    qa_7: { en: "Road damage", kn: "ರಸ್ತೆ ಹಾನಿ ದೂರು", hi: "सड़क क्षति शिकायत" },
    qa_8: { en: "Streetlight problems", kn: "ಬೀದಿದೀಪದ ಸಮಸ್ಯೆ", hi: "स्ट्रीट लाइट समस्या" },
    qa_9: { en: "Sanitation complaints", kn: "ಸ್ವಚ್ಛತೆ / ಚರಂಡಿ ದೂರು", hi: "स्वच्छता / नाली शिकायत" },
    qa_10: { en: "Contact Panchayat officials", kn: "ಪಂಚಾಯತ್ ಅಧಿಕಾರಿ ಸಂಪರ್ಕ", hi: "पंचायत अधिकारी संपर्क" },
    qa_11: { en: "Government service information", kn: "ಸರ್ಕಾರಿ ಸೇವಾ ಮಾಹಿತಿ", hi: "सरकारी सेवा जानकारी" },
    qa_12: { en: "Emergency assistance", kn: "ತುರ್ತು ಸಹಾಯ", hi: "आपातकालीन सहायता" },

    // Composer & Message Actions
    input_placeholder: { en: "Type or speak your message... (Shift+Enter for new line)", kn: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ...", hi: "अपना संदेश लिखें या बोलें..." },
    send_btn_label: { en: "Send message", kn: "ಸಂದೇಶ ಕಳುಹಿಸಿ", hi: "संदेश भेजें" },
    stop_generating_label: { en: "Stop generating", kn: "ಉತ್ಪಾದನೆ ನಿಲ್ಲಿಸಿ", hi: "उत्तर रोकें" },
    mic_btn_label: { en: "Voice input", kn: "ಧ್ವನಿ ಇನ್‌ಪುಟ್", hi: "वॉयस इनपुट" },
    attach_btn_label: { en: "Attach image or PDF", kn: "ಚಿತ್ರ ಅಥವಾ PDF ಲಗತ್ತಿಸಿ", hi: "फ़ोटो या PDF संलग्न करें" },
    camera_btn_label: { en: "Capture photo with camera", kn: "ಕ್ಯಾಮೆರಾದಿಂದ ಫೋಟೋ ತೆಗೆಯಿರಿ", hi: "कैमरे से फ़ोटो लें" },
    floating_btn_label: { en: "JANASEVA AI", kn: "ಜನಸೇವಾ AI", hi: "जनसेवा AI" },
    floating_btn_aria: { en: "Open JANASEVA AI Voice & Chat Assistant", kn: "ಜನಸೇವಾ AI ಧ್ವನಿ ಮತ್ತು ಚಾಟ್ ಸಹಾಯಕ ತೆರೆಯಿರಿ", hi: "जनसेवा AI वॉयस और चैट सहायक खोलें" },
    typing_status: { en: "JANASEVA AI is preparing response...", kn: "ಜನಸೇವಾ AI ಉತ್ತರ ಸಿದ್ಧಪಡಿಸುತ್ತಿದೆ...", hi: "जनसेवा AI उत्तर तैयार कर रहा है..." },
    scroll_latest_label: { en: "Latest messages", kn: "ಹೊಸ ಸಂದೇಶಗಳು", hi: "नए संदेश" },
    you_label: { en: "You", kn: "ನೀವು", hi: "आप" },
    assistant_label: { en: "JANASEVA AI", kn: "ಜನಸೇವಾ AI", hi: "जनसेवा AI" },
    msg_sending: { en: "Sending...", kn: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...", hi: "भेजा जा रहा है..." },
    msg_sent: { en: "Sent", kn: "ಕಳುಹಿಸಲಾಗಿದೆ", hi: "भेजा गया" },
    msg_failed: { en: "Failed", kn: "ವಿಫಲವಾಗಿದೆ", hi: "विफल" },
    copy_btn: { en: "Copy", kn: "ನಕಲಿಸಿ", hi: "कॉपी" },
    copied_btn: { en: "Copied", kn: "ನಕಲಿಸಲಾಗಿದೆ", hi: "कॉपी हुआ" },
    retry_btn: { en: "Retry", kn: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", hi: "पुनः प्रयास" },
    regenerate_btn: { en: "Regenerate", kn: "ಮತ್ತೆ ರಚಿಸಿ", hi: "पुनः उत्तर दें" },
    read_aloud: { en: "Read aloud", kn: "ಗಟ್ಟಿಯಾಗಿ ಓದಿ", hi: "बोलकर सुनाएं" },
    replay_audio: { en: "Replay", kn: "ಮರುಪ್ರಸಾರ", hi: "दोबारा सुनें" },
    stop_audio: { en: "Stop Audio", kn: "ಧ್ವನಿ ನಿಲ್ಲಿಸಿ", hi: "ऑडियो रोकें" },
    tap_to_speak: { en: "Tap mic to speak", kn: "ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿರಿ", hi: "बोलने के लिए माइक दबाएं" },
    listening: { en: "Listening... Speak now", kn: "ಆಲಿಸುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ", hi: "सुन रहा हूँ... अब बोलें" },

    // Voice Settings
    voice_label: { en: "Voice:", kn: "ಧ್ವನಿ:", hi: "आवाज़:" },
    speed_label: { en: "Speed:", kn: "ವೇಗ:", hi: "गति:" },
    auto_speak_label: { en: "Auto-speak replies", kn: "ಸ್ವಯಂ ಧ್ವನಿ ಓದು", hi: "स्वतः बोलकर सुनाएं" },
    no_native_voice: { en: "No native browser voice for this language", kn: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಪ್ಯಾಕ್ ಲಭ್ಯವಿಲ್ಲ", hi: "इस ब्राउज़र में हिन्दी आवाज़ उपलब्ध नहीं है" },

    // Validation & Error Notifications
    empty_input_warning: { en: "Please type or speak a message first.", kn: "ದಯವಿಟ್ಟು ಮೊದಲು ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ.", hi: "कृपया पहले कोई संदेश लिखें या बोलें।" },
    length_limit_warning: { en: "Message cannot exceed 1000 characters.", kn: "ಸಂದೇಶವು 1000 ಅಕ್ಷರಗಳನ್ನು ಮೀರಬಾರದು.", hi: "संदेश 1000 अक्षरों से अधिक नहीं हो सकता।" },
    duplicate_submit_guard: { en: "Please wait — your previous message is still processing.", kn: "ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ — ಹಿಂದಿನ ಸಂದೇಶ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ.", hi: "कृपया प्रतीक्षा करें — पिछला संदेश अभी संसाधित हो रहा है।" },
    generation_stopped: { en: "Response generation stopped.", kn: "ಪ್ರತಿಕ್ರಿಯೆ ಉತ್ಪಾದನೆಯನ್ನು ನಿಲ್ಲಿಸಲಾಗಿದೆ.", hi: "उत्तर तैयार करना रोक दिया गया।" },
    lang_changed_pill: { en: "Language set to English", kn: "ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಹೊಂದಿಸಲಾಗಿದೆ", hi: "भाषा हिन्दी में सेट की गई" },
    clear_chat_confirm: { en: "Clear current conversation and reset draft memory?", kn: "ಪ್ರಸ್ತುತ ಸಂಭಾಷಣೆ ಮತ್ತು ಕರಡು ಮೆಮೊರಿಯನ್ನು ತೆರವುಗೊಳಿಸುವುದೇ?", hi: "क्या वर्तमान बातचीत और ड्राफ्ट मेमोरी साफ़ करें?" },
    confirm_yes: { en: "Confirm", kn: "ಖಚಿತಪಡಿಸಿ", hi: "पुष्टि करें" },
    confirm_cancel: { en: "Cancel", kn: "ರದ್ದುಮಾಡಿ", hi: "रद्द करें" },

    // Speech Errors
    speech_not_supported: { en: "Voice recognition is not supported in this browser. Please type your message.", kn: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.", hi: "इस ब्राउज़र में वॉयस पहचान समर्थित नहीं है। कृपया टाइप करें।" },
    stt_lang_not_supported: { en: "Speech recognition for this language is not supported on this device/browser.", kn: "ಈ ಸಾಧನ/ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ.", hi: "इस डिवाइस/ब्राउज़र में हिन्दी वॉयस पहचान समर्थित नहीं है।" },
    mic_permission_denied: { en: "Microphone permission was denied. Please enable microphone access in browser settings.", kn: "ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಅನುಮತಿಸಿ.", hi: "माइक की अनुमति अस्वीकृत। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।" },
    network_error: { en: "Network error during speech/assistant service. Check your connection and retry.", kn: "ಧ್ವನಿ/ಸಹಾಯಕ ಸೇವೆಯಲ್ಲಿ ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", hi: "वॉयस/सहायक सेवा में नेटवर्क त्रुटि। कनेक्शन जांचें और पुनः प्रयास करें।" },
    voice_not_supported_warning: { en: "No compatible speech voice installed for this language on your browser.", kn: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಔಟ್‌ಪುಟ್ ಲಭ್ಯವಿಲ್ಲ. ಪಠ್ಯ ಉತ್ತರ ತೋರಿಸಲಾಗುತ್ತಿದೆ.", hi: "इस ब्राउज़र में हिन्दी आवाज़ उपलब्ध नहीं है। टेक्स्ट उत्तर दिखाया जा रहा है।" },

    // Attachment & Camera
    att_invalid_type: { en: "Unsupported file. Only JPG, PNG, WEBP images (max 5 MB) and PDF files (max 10 MB) are allowed.", kn: "ಬೆಂಬಲಿಸದ ಫೈಲ್. JPG, PNG, WEBP ಚಿತ್ರಗಳು (5 MB) ಮತ್ತು PDF (10 MB) ಮಾತ್ರ ಅನುಮತಿಸಲಾಗಿದೆ.", hi: "असमर्थित फ़ाइल। केवल JPG, PNG, WEBP चित्र (5 MB तक) और PDF (10 MB तक) मान्य हैं।" },
    att_too_large: { en: "File exceeds maximum allowed size limit.", kn: "ಫೈಲ್ ಗಾತ್ರ ಅನುಮತಿಸಿದ ಮಿತಿಯನ್ನು ಮೀರಿದೆ.", hi: "फ़ाइल का आकार अनुमत सीमा से अधिक है।" },
    att_spoofed: { en: "File security check failed: contents do not match a valid image or PDF.", kn: "ಫೈಲ್ ಭದ್ರತಾ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ: ಫೈಲ್ ವಿಷಯ ಮಾನ್ಯವಾಗಿಲ್ಲ.", hi: "फ़ाइल सुरक्षा जांच विफल: सामग्री मान्य चित्र या PDF से मेल नहीं खाती।" },
    att_ready_note: { en: "Evidence attached (verified format for Gram Panchayat review — automated OCR requires server Vision config).", kn: "ಸಾಕ್ಷ್ಯವನ್ನು ಲಗತ್ತಿಸಲಾಗಿದೆ (ಗ್ರಾಮ ಪಂಚಾಯತ್ ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧ).", hi: "प्रमाण संलग्न किया गया (ग्राम पंचायत समीक्षा के लिए तैयार)।" },
    cam_title: { en: "Capture Complaint Photo", kn: "ದೂರಿನ ಫೋಟೋ ಸೆರೆಹಿಡಿಯಿರಿ", hi: "शिकायत फ़ोटो लें" },
    cam_switch: { en: "Switch Camera", kn: "ಕ್ಯಾಮೆರಾ ಬದಲಿಸಿ", hi: "कैमरा बदलें" },
    cam_capture: { en: "Capture", kn: "ಫೋಟೋ ತೆಗೆ", hi: "फ़ोटो खींचें" },
    cam_retake: { en: "Retake", kn: "ಮತ್ತೆ ತೆಗೆಯಿರಿ", hi: "दोबारा लें" },
    cam_use: { en: "Use Photo", kn: "ಫೋಟೋ ಬಳಸಿ", hi: "फ़ोटो उपयोग करें" },
    cam_err_perm: { en: "Camera permission denied. Please allow camera access or upload a photo file.", kn: "ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಅನುಮತಿ ನೀಡಿ ಅಥವಾ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.", hi: "कैमरा अनुमति अस्वीकृत। कृपया अनुमति दें या फ़ाइल अपलोड करें।" },
    cam_err_none: { en: "No camera device found. Please upload an image file instead.", kn: "ಕ್ಯಾಮೆರಾ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಚಿತ್ರ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.", hi: "कोई कैमरा नहीं मिला। कृपया फ़ाइल अपलोड करें।" },

    // Grievance Preview Card & Edit Form
    preview_badge: { en: "Complaint Preview & Confirmation", kn: "ದೂರು ಮುನ್ನೋಟ ಮತ್ತು ದೃಢೀಕರಣ", hi: "शिकायत पूर्वावलोकन और पुष्टि" },
    lbl_category: { en: "Category:", kn: "ವರ್ಗ:", hi: "श्रेणी:" },
    lbl_panchayat: { en: "Gram Panchayat:", kn: "ಗ್ರಾಮ ಪಂಚಾಯತ್:", hi: "ग्राम पंचायत:" },
    lbl_location: { en: "Village / Location:", kn: "ಗ್ರಾಮ / ಸ್ಥಳ:", hi: "गाँव / स्थान:" },
    lbl_subject: { en: "Subject:", kn: "ವಿಷಯ:", hi: "विषय:" },
    lbl_description: { en: "Description:", kn: "ವಿವರಣೆ:", hi: "विवरण:" },
    lbl_attachments: { en: "Evidence Attachments:", kn: "ಲಗತ್ತುಗಳು:", hi: "संलग्नक:" },
    no_attachments: { en: "None attached (optional)", kn: "ಲಗತ್ತುಗಳಿಲ್ಲ (ಐಚ್ಛಿಕ)", hi: "कोई संलग्नक नहीं (वैकल्पिक)" },
    btn_submit_complaint: { en: "Submit Complaint", kn: "ದೂರು ಸಲ್ಲಿಸಿ", hi: "शिकायत जमा करें" },
    btn_edit_complaint: { en: "Edit", kn: "ತಿದ್ದುಪಡಿ", hi: "संपादित करें" },
    btn_cancel_edit: { en: "Cancel", kn: "ರದ್ದುಮಾಡು", hi: "रद्द करें" },
    btn_save_draft_edit: { en: "Save Details", kn: "ವಿವರ ಉಳಿಸಿ", hi: "विवरण सहेजें" },
    submitting_loading: { en: "Submitting complaint to official Gram Panchayat register...", kn: "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧಿಕೃತ ದಾಖಲೆಗೆ ದೂರು ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...", hi: "ग्राम पंचायत रजिस्टर में शिकायत दर्ज की जा रही है..." },
    submission_cancelled: { en: "Complaint submission cancelled. You can edit details or start over anytime.", kn: "ದೂರು ಸಲ್ಲಿಕೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. ನೀವು ವಿವರಗಳನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಬಹುದು ಅಥವಾ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಬಹುದು.", hi: "शिकायत जमा करना रद्द कर दिया गया। आप विवरण संपादित कर सकते हैं या पुनः प्रयास कर सकते हैं।" },
    filing_prompt: { en: "I have prepared your grievance details. Please review carefully and click Submit Complaint to confirm:", kn: "ನಿಮ್ಮ ದೂರಿನ ವಿವರಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸಲ್ಲಿಸಲು ಖಚಿತಪಡಿಸಿ:", hi: "आपकी शिकायत का विवरण तैयार है। कृपया जांचें और जमा करने के लिए पुष्टि करें:" },
    filing_success_offline: { en: "You are offline. Your complaint was saved safely in IndexedDB offline queue and will auto-sync when internet returns.", kn: "ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ದೂರನ್ನು IndexedDB ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಲಾಗಿದೆ; ಇಂಟರ್ನೆಟ್ ಬಂದಾಗ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಕೆಯಾಗುತ್ತದೆ.", hi: "आप ऑफ़लाइन हैं। शिकायत सुरक्षित रूप से IndexedDB कतार में सहेजी गई है और इंटरनेट आने पर स्वतः जमा होगी।" },
    filing_failed: { en: "Complaint submission failed.", kn: "ದೂರು ಸಲ್ಲಿಕೆ ವಿಫಲವಾಗಿದೆ.", hi: "शिकायत सबमिशन विफल रहा।" },
    sign_in_to_submit: { en: "Please sign in first to submit a complaint to the live portal.", kn: "ಲೈವ್ ಪೋರ್ಟಲ್‌ಗೆ ದೂರು ಸಲ್ಲಿಸಲು ದಯವಿಟ್ಟು ಮೊದಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.", hi: "लाइव पोर्टल पर शिकायत जमा करने के लिए कृपया पहले साइन इन करें।" },
    btn_sign_in_now: { en: "Sign In", kn: "ಸೈನ್ ಇನ್", hi: "साइन इन करें" },
    btn_track_this: { en: "Track Complaint", kn: "ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ", hi: "शिकायत ट्रैक करें" },
    btn_open_form: { en: "Open Full Form", kn: "ಪೂರ್ಣ ಫಾರ್ಮ್ ತೆರೆಯಿರಿ", hi: "पूरा फॉर्म खोलें" },

    // Tracking & History
    track_login_required: { en: "Please sign in to view or track your personal complaints. Citizens can only view their own authorized records.", kn: "ನಿಮ್ಮ ದೂರುಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ದಯವಿಟ್ಟು ಸೈನ್ ಇನ್ ಮಾಡಿ. ನಾಗರಿಕರು ತಮ್ಮ ಸ್ವಂತ ದೂರುಗಳನ್ನು ಮಾತ್ರ ನೋಡಬಹುದು.", hi: "अपनी शिकायतें देखने या ट्रैक करने के लिए कृपया साइन इन करें। नागरिक केवल अपनी अधिकृत शिकायतें देख सकते हैं।" },
    track_no_complaints: { en: "No complaints were found under your account.", kn: "ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಯಾವುದೇ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ.", hi: "आपके खाते में कोई शिकायत नहीं मिली।" },
    lbl_submitted_on: { en: "Submitted:", kn: "ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ:", hi: "दर्ज तिथि:" },
    lbl_department: { en: "Department:", kn: "ಇಲಾಖೆ:", hi: "विभाग:" },
    lbl_officer: { en: "Assigned Desk:", kn: "ನಿಯೋಜಿತ ಅಧಿಕಾರಿ:", hi: "नियुक्त अधिकारी:" },
    lbl_action_taken: { en: "Latest Update / Action Taken:", kn: "ಇತ್ತೀಚಿನ ಕ್ರಮ / ಟಿಪ್ಪಣಿ:", hi: "नवीनतम कार्रवाई / अपडेट:" },
    lbl_resolution: { en: "Resolution Details:", kn: "ಪರಿಹಾರ ವಿವರ:", hi: "समाधान विवरण:" },
    lbl_timeline: { en: "Progress Timeline", kn: "ಪ್ರಗತಿ ಹಂತಗಳು", hi: "प्रगति समयरेखा" },

    // History Panel
    hist_heading: { en: "Saved Conversations", kn: "ಉಳಿಸಿದ ಸಂಭಾಷಣೆಗಳು", hi: "सहेजी गई बातचीत" },
    hist_search_ph: { en: "Search conversations...", kn: "ಸಂಭಾಷಣೆ ಹುಡುಕಿ...", hi: "बातचीत खोजें..." },
    hist_empty: { en: "No saved conversations yet.", kn: "ಇನ್ನೂ ಯಾವುದೇ ಉಳಿಸಿದ ಸಂಭಾಷಣೆಗಳಿಲ್ಲ.", hi: "अभी तक कोई सहेजी गई बातचीत नहीं है।" },
    hist_delete_one: { en: "Delete this conversation?", kn: "ಈ ಸಂಭಾಷಣೆಯನ್ನು ಅಳಿಸುವುದೇ?", hi: "क्या यह बातचीत हटाएं?" },
    hist_clear_all: { en: "Clear All", kn: "ಎಲ್ಲಾ ಅಳಿಸಿ", hi: "सभी साफ़ करें" },
    hist_clear_all_confirm: { en: "Delete ALL saved conversations from your account?", kn: "ನಿಮ್ಮ ಎಲ್ಲಾ ಉಳಿಸಿದ ಸಂಭಾಷಣೆಗಳನ್ನು ಅಳಿಸುವುದೇ?", hi: "क्या अपनी सभी सहेजी गई बातचीत हटाएं?" },
    hist_load_more: { en: "Load More", kn: "ಇನ್ನಷ್ಟು ಲೋಡ್ ಮಾಡಿ", hi: "और लोड करें" },
    hist_msgs: { en: "messages", kn: "ಸಂದೇಶಗಳು", hi: "संदेश" },

    // Feedback & Summary
    fb_helpful: { en: "Helpful", kn: "ಉಪಯುಕ್ತ", hi: "मददगार" },
    fb_not_helpful: { en: "Not helpful", kn: "ಉಪಯುಕ್ತವಲ್ಲ", hi: "मददगार नहीं" },
    fb_report: { en: "Report issue", kn: "ದೋಷ ವರದಿ", hi: "गलत उत्तर रिपोर्ट" },
    fb_thanks: { en: "Feedback recorded. Thank you!", kn: "ಪ್ರತಿಕ್ರಿಯೆ ದಾಖಲಾಗಿದೆ. ಧನ್ಯವಾದಗಳು!", hi: "प्रतिक्रिया दर्ज हो गई। धन्यवाद!" },
    fb_report_prompt: { en: "Briefly describe what was wrong or missing:", kn: "ಏನು ತಪ್ಪಾಗಿದೆ ಅಥವಾ ಕೊರತೆಯಿದೆ ಎಂದು ತಿಳಿಸಿ:", hi: "संक्षेप में बताएं कि क्या गलत या अधूरा था:" },
    fb_submit: { en: "Submit Report", kn: "ವರದಿ ಸಲ್ಲಿಸಿ", hi: "रिपोर्ट भेजें" },
    summary_title: { en: "Conversation Summary", kn: "ಸಂಭಾಷಣೆ ಸಾರಾಂಶ", hi: "बातचीत सारांश" },

    // Knowledge Centre RAG Citations
    sources_heading: { en: "Knowledge Sources & References", kn: "ಜ್ಞಾನ ಮೂಲಗಳು ಮತ್ತು ಉಲ್ಲೇಖಗಳು", hi: "ज्ञान स्रोत और संदर्भ" },
    source_official: { en: "Official Source", kn: "ಅಧಿಕೃತ ಮೂಲ", hi: "आधिकारिक स्रोत" },
    source_community: { en: "Community Upload", kn: "ಸಮುದಾಯ ಕೊಡುಗೆ", hi: "समुदाय अपलोड" },
    source_api: { en: "Verified API Import", kn: "ಪರಿಶೀಲಿಸಿದ API", hi: "सत्यापित API" },
    open_knowledge_centre: { en: "Open AI Knowledge Centre", kn: "AI ಜ್ಞಾನ ಕೇಂದ್ರ ತೆರೆಯಿರಿ", hi: "AI ज्ञान केंद्र खोलें" },
    view_excerpt: { en: "View excerpt", kn: "ಉಲ್ಲೇಖ ನೋಡಿ", hi: "अंश देखें" },
    download_doc: { en: "Download", kn: "ಡೌನ್‌ಲೋಡ್", hi: "डाउनलोड" }
  };

  const CATEGORY_MAP = {
    "Drinking Water": { en: "Drinking Water", kn: "ಕುಡಿಯುವ ನೀರು", hi: "पेयजल" },
    "Water Supply": { en: "Water Supply", kn: "ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು", hi: "पेयजल आपूर्ति" },
    "Water Supply Issues": { en: "Water Supply Issues", kn: "ಕುಡಿಯುವ ನೀರಿನ ಸಮಸ್ಯೆಗಳು", hi: "पेयजल आपूर्ति समस्याएं" },
    "Road Damage": { en: "Road Damage", kn: "ರಸ್ತೆ ಹಾನಿ", hi: "सड़क क्षति" },
    "Road & Infrastructure": { en: "Road & Infrastructure", kn: "ರಸ್ತೆ ಮತ್ತು ಮೂಲಸೌಕರ್ಯ", hi: "सड़क एवं बुनियादी ढांचा" },
    "Roads & Infrastructure": { en: "Roads & Infrastructure", kn: "ರಸ್ತೆ ಮತ್ತು ಮೂಲಸೌಕರ್ಯ", hi: "सड़क एवं बुनियादी ढांचा" },
    "Streetlights": { en: "Streetlights", kn: "ಬೀದಿದೀಪಗಳು", hi: "स्ट्रीट लाइट" },
    "Streetlight Problems": { en: "Streetlight Problems", kn: "ಬೀದಿ ದೀಪದ ಸಮಸ್ಯೆಗಳು", hi: "स्ट्रीट लाइट समस्याएं" },
    "Electricity & Streetlights": { en: "Electricity & Streetlights", kn: "ವಿದ್ಯುತ್ ಮತ್ತು ಬೀದಿ ದೀಪಗಳು", hi: "बिजली एवं स्ट्रीट लाइट" },
    "Garbage and Cleanliness": { en: "Garbage and Cleanliness", kn: "ಕಸ ಮತ್ತು ಸ್ವಚ್ಛತೆ", hi: "कचरा और स्वच्छता" },
    "Garbage & Cleanliness": { en: "Garbage & Cleanliness", kn: "ಕಸ ಮತ್ತು ಸ್ವಚ್ಛತೆ", hi: "कचरा एवं स्वच्छता" },
    "Drainage and Sanitation": { en: "Drainage and Sanitation", kn: "ಒಳಚರಂಡಿ ಮತ್ತು ನೈರ್ಮಲ್ಯ", hi: "जल निकासी और स्वच्छता" },
    "Drainage & Sanitation": { en: "Drainage & Sanitation", kn: "ಒಳಚರಂಡಿ ಮತ್ತು ನೈರ್ಮಲ್ಯ", hi: "जल निकासी एवं स्वच्छता" },
    "Sanitation & Drainage": { en: "Sanitation & Drainage", kn: "ಸ್ವಚ್ಛತೆ ಮತ್ತು ಒಳಚರಂಡಿ", hi: "स्वच्छता और जल निकासी" },
    "Sanitation & Cleanliness": { en: "Sanitation & Cleanliness", kn: "ನೈರ್ಮಲ್ಯ ಮತ್ತು ಸ್ವಚ್ಛತೆ", hi: "स्वच्छता एवं सफाई" },
    "Public Facilities": { en: "Public Facilities", kn: "ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯಗಳು", hi: "सार्वजनिक सुविधाएं" },
    "Other Civic Issues": { en: "Other Civic Issues", kn: "ಇತರ ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳು", hi: "अन्य नागरिक समस्याएं" }
  };

  const STATUS_MAP = {
    "Submitted": { en: "Submitted", kn: "ಸಲ್ಲಿಕೆಯಾಗಿದೆ", hi: "दर्ज किया गया" },
    "Assigned": { en: "Assigned", kn: "ನಿಯೋಜಿಸಲಾಗಿದೆ", hi: "आवंटित" },
    "Under Review": { en: "Under Review", kn: "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ", hi: "समीक्षाधीन" },
    "In Progress": { en: "In Progress", kn: "ಪ್ರಗತಿಯಲ್ಲಿದೆ", hi: "प्रगति पर" },
    "Action Taken": { en: "Action Taken", kn: "ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ", hi: "कार्रवाई की गई" },
    "Resolved": { en: "Resolved", kn: "ಪರಿಹರಿಸಲಾಗಿದೆ", hi: "समाधान हुआ" },
    "Rejected": { en: "Rejected", kn: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ", hi: "अस्वीकृत" },
    "Reopened": { en: "Reopened", kn: "ಮರುತೆರೆಯಲಾಗಿದೆ", hi: "पुनः खोला गया" }
  };

  const TYPO_MAP = {
    wter: "water", watr: "water", drnking: "drinking", pipline: "pipeline", lekage: "leakage",
    pothol: "pothole", pothols: "potholes", roadd: "road", raod: "road",
    stretlight: "streetlight", streeetlight: "streetlight", streeet: "street", ligh: "light",
    garbge: "garbage", sanitasion: "sanitation", drinage: "drainage", guter: "gutter",
    compalint: "complaint", complint: "complaint", grievence: "grievance",
    trak: "track", trck: "track", statu: "status", panchayt: "panchayat",
    emrgency: "emergency", certifcate: "certificate", eswatu: "eswathu", offical: "official", timming: "timing"
  };

  function getShortLang(langCode) {
    const s = String(langCode || "").toLowerCase();
    if (s.startsWith("kn")) return "kn";
    if (s.startsWith("hi")) return "hi";
    return "en";
  }

  function dictGet(key, langCode) {
    const sLang = getShortLang(langCode);
    const entry = JANASEVA_CHAT_DICT[key];
    if (!entry) return key;
    return entry[sLang] || entry.en;
  }

  function normalizeTypoText(text) {
    return String(text || "")
      .toLowerCase()
      .split(/\s+/)
      .map((w) => {
        const clean = w.replace(/[^a-z0-9\u0C80-\u0CFF\u0900-\u097F-]/g, "");
        return TYPO_MAP[clean] || clean || w;
      })
      .join(" ");
  }

  /**
   * Client-side Attachment Security Validator (extension + MIME + size + magic bytes)
   */
  async function validateChatAttachmentFile(file, options = {}) {
    if (!file) return { valid: false, errorKey: "att_invalid_type" };
    const name = String(file.name || "").toLowerCase();
    const mime = String(file.type || "").toLowerCase();

    const isPdf = mime === "application/pdf" || name.endsWith(".pdf");
    const isJpeg = mime === "image/jpeg" || mime === "image/jpg" || name.endsWith(".jpg") || name.endsWith(".jpeg");
    const isPng = mime === "image/png" || name.endsWith(".png");
    const isWebp = mime === "image/webp" || name.endsWith(".webp");

    if (!isPdf && !isJpeg && !isPng && !isWebp) {
      return { valid: false, errorKey: "att_invalid_type" };
    }
    if (isPdf && options.allowPdf === false) {
      return { valid: false, errorKey: "att_pdf_disabled", reason: "PDF uploads are disabled in Chat Settings." };
    }
    if (!isPdf && options.allowImages === false) {
      return { valid: false, errorKey: "att_image_disabled", reason: "Image uploads are disabled in Chat Settings." };
    }

    const expectedMime = isPdf ? "application/pdf" : (isPng ? "image/png" : (isWebp ? "image/webp" : "image/jpeg"));
    if (mime && mime !== expectedMime && !(mime === "image/jpg" && expectedMime === "image/jpeg")) {
      return { valid: false, errorKey: "att_invalid_type" };
    }

    const categoryCap = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const configuredCap = Number.isFinite(Number(options.maxAttachmentSizeMb)) && Number(options.maxAttachmentSizeMb) >= 1
      ? Math.min(categoryCap, Math.round(Number(options.maxAttachmentSizeMb) * 1024 * 1024))
      : categoryCap;
    if (!file.size || file.size > configuredCap) {
      return { valid: false, errorKey: "att_too_large" };
    }

    // Magic-byte binary inspection
    let headerBytes = null;
    try {
      const slice = file.slice(0, 16);
      const buf = slice.arrayBuffer
        ? await slice.arrayBuffer()
        : await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = () => rej(r.error);
            r.readAsArrayBuffer(slice);
          });
      headerBytes = new Uint8Array(buf);
    } catch (e) {
      return { valid: false, errorKey: "att_spoofed" };
    }

    let magicOk = false;
    if (isJpeg) {
      magicOk = headerBytes.length >= 3 && headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff;
    } else if (isPng) {
      magicOk =
        headerBytes.length >= 8 &&
        headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4e && headerBytes[3] === 0x47 &&
        headerBytes[4] === 0x0d && headerBytes[5] === 0x0a && headerBytes[6] === 0x1a && headerBytes[7] === 0x0a;
    } else if (isWebp) {
      magicOk =
        headerBytes.length >= 12 &&
        String.fromCharCode(headerBytes[0], headerBytes[1], headerBytes[2], headerBytes[3]) === "RIFF" &&
        String.fromCharCode(headerBytes[8], headerBytes[9], headerBytes[10], headerBytes[11]) === "WEBP";
    } else if (isPdf) {
      magicOk =
        headerBytes.length >= 5 &&
        String.fromCharCode(headerBytes[0], headerBytes[1], headerBytes[2], headerBytes[3], headerBytes[4]) === "%PDF-";
    }

    if (!magicOk) {
      return { valid: false, errorKey: "att_spoofed" };
    }

    let binary = "";
    for (let i = 0; i < headerBytes.length; i++) binary += String.fromCharCode(headerBytes[i]);
    const headerBase64 = btoa(binary);

    const safeFileName = String(file.name || "evidence")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);

    return {
      valid: true,
      category: isPdf ? "pdf" : "image",
      mimeType: expectedMime,
      safeFileName,
      size: file.size,
      headerBase64
    };
  }

  /**
   * UID-Scoped Chat History Manager (LocalStorage + Optional Firestore Sync)
   */
  class JanasevaChatHistoryStore {
    getStorageKey(uid) {
      const safeUid = uid ? String(uid).replace(/[^a-zA-Z0-9_-]/g, "_") : "guest";
      return `JANASEVA_chat_sessions_${safeUid}`;
    }

    loadLocalSessions(uid) {
      if (!uid) return [];
      try {
        const raw = localStorage.getItem(this.getStorageKey(uid));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }

    saveLocalSessions(uid, sessions) {
      if (!uid) return;
      try {
        localStorage.setItem(this.getStorageKey(uid), JSON.stringify(sessions.slice(0, 50)));
      } catch (e) {
        console.warn("[JANASEVA History] Local save warning:", e);
      }
    }

    async saveSession(uid, session) {
      if (!uid || !session || !session.sessionId) return null;
      const list = this.loadLocalSessions(uid);
      const idx = list.findIndex((s) => s.sessionId === session.sessionId);
      const cleanSession = {
        sessionId: session.sessionId,
        userId: uid,
        title: String(session.title || "Conversation").slice(0, 140),
        language: session.language || "en-IN",
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        conversationStatus: session.conversationStatus || "active",
        messageCount: Array.isArray(session.messages) ? session.messages.length : 0,
        messages: (session.messages || []).slice(-100).map((m) => ({
          id: m.id,
          sender: m.sender,
          text: String(m.text || "").slice(0, 4000),
          lang: m.lang || "en",
          timestampIso: m.timestamp instanceof Date ? m.timestamp.toISOString() : (m.timestampIso || new Date().toISOString()),
          isWelcome: Boolean(m.isWelcome),
          status: m.status || "sent"
        }))
      };

      if (idx >= 0) list[idx] = cleanSession;
      else list.unshift(cleanSession);
      list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      this.saveLocalSessions(uid, list);

      if (window.isFirebaseAvailable && window.fbDb && typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) {
        try {
          await window.fbDb
            .collection("users")
            .doc(uid)
            .collection("chatSessions")
            .doc(cleanSession.sessionId)
            .set(cleanSession, { merge: true });
        } catch (err) {
          console.warn("[JANASEVA History] Cloud session sync notice:", err.message);
          window.janasevaOfflineDB?.queueChatSessionSync?.(uid, cleanSession);
        }
      } else if (!navigator.onLine) {
        window.janasevaOfflineDB?.queueChatSessionSync?.(uid, cleanSession);
      }
      return cleanSession;
    }

    async renameSession(uid, sessionId, newTitle) {
      if (!uid || !sessionId) return null;
      const cleanTitle = String(newTitle || "").trim().slice(0, 140);
      if (!cleanTitle) throw new Error("Conversation title cannot be empty.");
      const list = this.loadLocalSessions(uid);
      const nowIso = new Date().toISOString();
      const idx = list.findIndex((s) => s.sessionId === sessionId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], title: cleanTitle, updatedAt: nowIso };
        list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        this.saveLocalSessions(uid, list);
      }

      if (navigator.onLine && window.isFirebaseAvailable && typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) {
        try {
          if (typeof firebase.functions === "function") {
            const fn = firebase.functions().httpsCallable("renameChatSession");
            await fn({ sessionId, title: cleanTitle });
          } else if (window.fbDb) {
            await window.fbDb.collection("users").doc(uid).collection("chatSessions").doc(sessionId).set({
              title: cleanTitle,
              updatedAt: nowIso
            }, { merge: true });
          }
        } catch (e) {
          if (idx >= 0) window.janasevaOfflineDB?.queueChatSessionSync?.(uid, list[idx]);
        }
      } else if (idx >= 0 && !navigator.onLine) {
        window.janasevaOfflineDB?.queueChatSessionSync?.(uid, list[idx]);
      }
      return { sessionId, title: cleanTitle, updatedAt: nowIso };
    }

    async applyAutoCleanup(uid, retentionDays = 30) {
      if (!uid) return 0;
      const safeDays = Math.max(1, Number(retentionDays) || 30);
      const cutoffMs = Date.now() - (safeDays * 24 * 60 * 60 * 1000);
      const list = this.loadLocalSessions(uid);
      const toDelete = list.filter((s) => {
        const ts = Date.parse(s.updatedAt || s.createdAt || 0);
        return Number.isFinite(ts) && ts > 0 && ts < cutoffMs;
      });
      if (!toDelete.length) return 0;
      const keep = list.filter((s) => !toDelete.some((d) => d.sessionId === s.sessionId));
      this.saveLocalSessions(uid, keep);
      for (const item of toDelete) {
        await this.deleteSession(uid, item.sessionId).catch(() => {});
      }
      return toDelete.length;
    }

    async listSessions(uid, { search = "", page = 1, pageSize = 8 } = {}) {
      if (!uid) return { sessions: [], total: 0, hasMore: false };
      let list = this.loadLocalSessions(uid);

      if (window.isFirebaseAvailable && window.fbDb && typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) {
        try {
          const snap = await window.fbDb
            .collection("users")
            .doc(uid)
            .collection("chatSessions")
            .orderBy("updatedAt", "desc")
            .limit(40)
            .get();
          if (!snap.empty) {
            const merged = new Map();
            list.forEach((s) => merged.set(s.sessionId, s));
            snap.forEach((d) => merged.set(d.id, d.data()));
            list = Array.from(merged.values()).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
            this.saveLocalSessions(uid, list);
          }
        } catch (e) {}
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((s) =>
          (s.title || "").toLowerCase().includes(q) ||
          (Array.isArray(s.messages) && s.messages.some((m) => (m.text || "").toLowerCase().includes(q)))
        );
      }

      const end = page * pageSize;
      return {
        sessions: list.slice(0, end),
        total: list.length,
        hasMore: list.length > end
      };
    }

    async deleteSession(uid, sessionId) {
      if (!uid || !sessionId) return;
      const list = this.loadLocalSessions(uid).filter((s) => s.sessionId !== sessionId);
      this.saveLocalSessions(uid, list);

      if (window.isFirebaseAvailable && window.fbDb && typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) {
        try {
          await window.fbDb.collection("users").doc(uid).collection("chatSessions").doc(sessionId).delete();
        } catch (e) {}
      }
    }

    async clearAll(uid) {
      if (!uid) return;
      this.saveLocalSessions(uid, []);
      if (window.isFirebaseAvailable && window.fbDb && typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) {
        try {
          const snap = await window.fbDb.collection("users").doc(uid).collection("chatSessions").limit(50).get();
          const batch = window.fbDb.batch();
          snap.forEach((d) => batch.delete(d.ref));
          if (!snap.empty) await batch.commit();
        } catch (e) {}
      }
    }

    exportAsText(session) {
      const lines = [
        "=========================================================",
        "JANASEVA – AI Assistant Conversation Transcript",
        `Title: ${session.title || "Conversation"}`,
        `Language: ${session.language || "en-IN"}`,
        `Exported: ${new Date().toLocaleString("en-IN")}`,
        "=========================================================",
        ""
      ];
      (session.messages || []).forEach((m) => {
        const who = m.sender === "user" ? "Citizen" : "JANASEVA AI";
        const ts = m.timestampIso || (m.timestamp instanceof Date ? m.timestamp.toISOString() : "");
        lines.push(`[${ts}] ${who}:`);
        lines.push(String(m.text || "").replace(/<[^>]+>/g, ""));
        lines.push("");
      });
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `JANASEVA_Chat_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    exportAsPrintablePdf(session, escFn) {
      const w = window.open("", "_blank", "width=820,height=900");
      if (!w) return false;
      const rows = (session.messages || [])
        .map((m) => {
          const isUser = m.sender === "user";
          const ts = new Date(m.timestampIso || m.timestamp || Date.now()).toLocaleString("en-IN");
          return `
            <div style="margin-bottom:12px;padding:10px 14px;border-radius:8px;border:1px solid ${isUser ? "#bfdbfe" : "#cbd5e1"};background:${isUser ? "#eff6ff" : "#f8fafc"};">
              <div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:4px;">${isUser ? "Citizen" : "JANASEVA AI"} &bull; ${escFn(ts)}</div>
              <div style="font-size:13.5px;color:#0f172a;white-space:pre-wrap;">${escFn(String(m.text || ""))}</div>
            </div>
          `;
        })
        .join("");

      w.document.open();
      w.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>JANASEVA Chat Transcript</title>
          <style>
            body{font-family:Segoe UI,Arial,sans-serif;padding:28px;color:#0f172a;}
            .hdr{border-bottom:2px solid #0b2545;padding-bottom:12px;margin-bottom:18px;}
            @media print{.no-print{display:none;}}
          </style>
        </head>
        <body>
          <div class="hdr">
            <h2 style="margin:0;color:#0b2545;">JANASEVA – Citizen Assistant Transcript</h2>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${escFn(session.title || "Conversation")} &bull; ${escFn(new Date().toLocaleString("en-IN"))}</p>
          </div>
          ${rows}
          <div class="no-print" style="text-align:center;margin-top:20px;">
            <button onclick="window.print()" style="padding:10px 22px;background:#0f56b3;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer;">Print / Save as PDF</button>
          </div>
        </body>
        </html>
      `);
      w.document.close();
      return true;
    }
  }

  /**
   * Local / Offline Multi-Turn Civic NLU & Dialogue Fallback Engine
   */
  class JanasevaCivicEngine {
    getPanchayats() {
      if (typeof JanasevaDB !== "undefined") {
        const list = JanasevaDB.get("panchayats", []);
        if (Array.isArray(list) && list.length) return list;
      }
      return [];
    }

    detectCategory(lowerText) {
      if (/(water|drinking|pipe|leakage|borewell|tap|ನೀರು|ಪೈಪ್|ನಳ|पानी|नल)/.test(lowerText)) return "Water Supply";
      if (/(road|pothole|bridge|culvert|tar|ರಸ್ತೆ|ಗುಂಡಿ|ಸೇತುವೆ|सड़क|गड्ढा)/.test(lowerText)) return "Road Damage";
      if (/(light|streetlight|lamp|pole|dark|ಬೀದಿದೀಪ|ದೀಪ|ಕತ್ತಲೆ|स्ट्रीट|लाइट|बत्ती)/.test(lowerText)) return "Streetlight Problems";
      if (/(garbage|waste|trash|cleanliness|ಕಸ|ಸ್ವಚ್ಛತೆ|कचरा|सफाई)/.test(lowerText)) return "Garbage and Cleanliness";
      if (/(drain|drainage|gutter|sanitation|sewage|ಚರಂಡಿ|ಒಳಚರಂಡಿ|ನೈರ್ಮಲ್ಯ|नाली|जल निकासी)/.test(lowerText)) return "Drainage and Sanitation";
      if (/(school|anganwadi|toilet|bus stop|public|hall|ಶಾಲೆ|ಅಂಗನವಾಡಿ|स्कूल)/.test(lowerText)) return "Public Facilities";
      return null;
    }

    matchPanchayat(rawText) {
      const lower = String(rawText || "").toLowerCase();
      const gps = this.getPanchayats();
      for (const gp of gps) {
        const shortName = String(gp.name || "").toLowerCase().replace(/\s*gram\s*panchayat\s*/gi, "").trim();
        if (shortName && shortName.length >= 3 && lower.includes(shortName)) {
          return gp;
        }
      }
      return null;
    }

    extractLocation(rawText) {
      const m = String(rawText || "").match(/(?:\bnear\b|\bat\b|\bin\b|\bopposite\b|\bvillage\b|\bward\b)\s+([^,.!?\n]{3,90})/i);
      if (m && m[0]) return m[0].trim();
      if (/[\u0C80-\u0CFF]/.test(rawText) && /(ಗ್ರಾಮ|ಬಳಿ|ಹತ್ತಿರ|ವಾರ್ಡ್|ಬಸ್|ಶಾಲೆ)/.test(rawText)) return rawText.trim().slice(0, 100);
      if (/[\u0900-\u097F]/.test(rawText) && /(गाँव|पास|निकट|वार्ड|बस|स्कूल)/.test(rawText)) return rawText.trim().slice(0, 100);
      return "";
    }

    buildDefaultSubject(category, langCode) {
      const s = getShortLang(langCode);
      const map = {
        "Water Supply": { en: "Drinking water supply / pipeline issue", kn: "ಕುಡಿಯುವ ನೀರು / ಪೈಪ್‌ಲೈನ್ ಸಮಸ್ಯೆ", hi: "पेयजल / पाइपलाइन समस्या" },
        "Road Damage": { en: "Road damage / pothole repair required", kn: "ರಸ್ತೆ ಹಾನಿ / ಗುಂಡಿ ದುರಸ್ತಿ", hi: "सड़क क्षति / गड्ढे की मरम्मत" },
        "Streetlight Problems": { en: "Streetlight not working / repair needed", kn: "ಬೀದಿದೀಪ ದುರಸ್ತಿ ಸಮಸ್ಯೆ", hi: "स्ट्रीट लाइट मरम्मत समस्या" },
        "Garbage and Cleanliness": { en: "Garbage clearance & cleanliness issue", kn: "ಕಸ ವಿಲೇವಾರಿ ಮತ್ತು ಸ್ವಚ್ಛತೆ", hi: "कचरा संग्रहण व स्वच्छता" },
        "Drainage and Sanitation": { en: "Drainage blockage / sanitation issue", kn: "ಒಳಚರಂಡಿ ಮತ್ತು ನೈರ್ಮಲ್ಯ ಸಮಸ್ಯೆ", hi: "नाली जाम व स्वच्छता समस्या" },
        "Public Facilities": { en: "Public facility infrastructure issue", kn: "ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯ ಸಮಸ್ಯೆ", hi: "सार्वजनिक सुविधा समस्या" }
      };
      return (map[category] && (map[category][s] || map[category].en)) || "Gram Panchayat Civic Grievance";
    }

    processLocalTurn({ message, lang, draftState, lastTrackedId, user, attachmentsCount, settings = {} }) {
      const sLang = getShortLang(lang);
      const norm = normalizeTypoText(message);
      const lower = norm.toLowerCase();
      const complaintEnabled = settings.complaintUnderstanding !== false;

      // 1. Emergency
      if (/(live wire|electric wire|shock|electrocution|ambulance|fire|police|collapsed|112|108|1912|101|ತುರ್ತು|ವಿದ್ಯುತ್ ಶಾಕ್|आपात|बिजली का तार)/.test(lower)) {
        return {
          intent: "emergency",
          isEmergency: true,
          emergencyContacts: [
            { label: sLang === "kn" ? "ಪೊಲೀಸ್ / ವಿಪತ್ತು" : (sLang === "hi" ? "पुलिस / आपदा" : "Police / Disaster"), number: "112" },
            { label: sLang === "kn" ? "ಆಂಬ್ಯುಲೆನ್ಸ್" : (sLang === "hi" ? "एम्बुलेंस" : "Ambulance"), number: "108" },
            { label: sLang === "kn" ? "ವಿದ್ಯುತ್ ತುರ್ತು (MESCOM)" : (sLang === "hi" ? "विद्युत आपात" : "Live Electric Wire"), number: "1912" },
            { label: sLang === "kn" ? "ಅಗ್ನಿಶಾಮಕ" : (sLang === "hi" ? "अग्निशमन" : "Fire & Rescue"), number: "101" }
          ],
          reply: sLang === "kn"
            ? "ತುರ್ತು ಎಚ್ಚರಿಕೆ: ತಕ್ಷಣದ ಅಪಾಯವಿದ್ದರೆ ಚಾಟ್‌ನಲ್ಲಿ ಕಾಯಬೇಡಿ. ದಯವಿಟ್ಟು ತಕ್ಷಣ 112, 108 ಅಥವಾ 1912 ಗೆ ಕರೆ ಮಾಡಿ."
            : (sLang === "hi"
              ? "आपातकालीन चेतावनी: किसी भी तत्काल खतरे के लिए चैट की प्रतीक्षा न करें। कृपया तुरंत 112, 108 या 1912 पर कॉल करें।"
              : "URGENT SAFETY NOTICE: Do not wait on chat for emergencies. Call 112 (Police/Disaster), 108 (Ambulance), 1912 (Live Wire), or 101 (Fire) immediately."),
          suggestedQuestions: [dictGet("qa_10", lang), dictGet("qa_1", lang)]
        };
      }

      // 2. Track / History / Follow-up
      const idMatch = message.match(/JAN-\d{4}-\d{3,6}/i);
      const wantsTrack =
        Boolean(idMatch) ||
        /(track|status|complaint history|my complaints|check complaint|progress|ಸ್ಥಿತಿ|ಟ್ರ್ಯಾಕ್|ಇತಿಹಾಸ|ನನ್ನ ದೂರು|ट्रैक|स्थिति|इतिहास|मेरी शिकायत)/.test(lower) ||
        (Boolean(lastTrackedId) && /(who|when|officer|department|remark|update|action|progress|ಯಾರು|ಯಾವಾಗ|ಅಧಿಕಾರಿ|कौन|कब|अधिकारी)/.test(lower));

      if (wantsTrack && !draftState?.active && complaintEnabled) {
        return {
          intent: "local_track",
          targetId: idMatch ? idMatch[0].toUpperCase() : (lastTrackedId && /(who|when|officer|department|remark|update|action|progress|ಯಾರು|ಯಾವಾಗ|ಅಧಿಕಾರಿ|कौन|कब|अधिकारी)/.test(lower) ? lastTrackedId : null)
        };
      }

      // 3. Contacts / Officials
      if (/(contact|official|pdo|secretary|president|directory|phone|ಅಧಿಕಾರಿ|ಪಿಡಿಒ|ಸಂಪರ್ಕ|ಡೈರೆಕ್ಟರಿ|अधिकारी|संपर्क|पीडीओ|निर्देशिका)/.test(lower) && !draftState?.active) {
        const gpMatch = this.matchPanchayat(message);
        const gps = gpMatch ? [gpMatch] : this.getPanchayats().slice(0, 4);
        return {
          intent: "panchayat_contacts",
          panchayatContacts: gps,
          navigationTarget: "directory.html",
          reply: sLang === "kn"
            ? "ಪರಿಶೀಲಿಸಿದ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಗಳ ಸಂಪರ್ಕ ವಿವರಗಳು ಕೆಳಗಿವೆ:"
            : (sLang === "hi"
              ? "सत्यापित ग्राम पंचायत अधिकारियों के संपर्क विवरण नीचे दिए गए हैं:"
              : "Here are verified Gram Panchayat official contacts from the JANASEVA directory:"),
          suggestedQuestions: [dictGet("qa_1", lang), dictGet("qa_5", lang)]
        };
      }

      // 4. Complaint Slot Collection
      const cat = this.detectCategory(lower);
      const wantsCancel = draftState?.active && /^(cancel|stop|back|ರದ್ದು|ಬೇಡ|रद्द|नहीं)$/i.test(message.trim());
      if (wantsCancel) {
        return {
          intent: "draft_cancelled",
          draftState: null,
          readyForPreview: false,
          reply: dictGet("submission_cancelled", lang),
          suggestedQuestions: [dictGet("qa_1", lang), dictGet("qa_2", lang)]
        };
      }

      const isExplicitComplaintSignal = /(register|file|lodge|submit|complain|complaint|grievance|problem|issue|broken|not working|pothole|leakage|overflow|ದೂರು|ಸಮಸ್ಯೆ|ಗುಂಡಿ|ಸೋರಿಕೆ|शिकायत|समस्या|गड्ढा|टूटा)/.test(lower);
      const isInformationalKnowledgeQuery =
        !draftState?.active &&
        !isExplicitComplaintSignal &&
        (
          /\?$/.test(message.trim()) ||
          /^(what|how|who|when|where|which|why|explain|tell me|summarize|list|rules|scheme|yojana|eligibility|documents|fee|fees|subsidy|pension|ration|certificate|ಏನು|ಹೇಗೆ|ಯಾವ|ಯಾರು|ವಿವರ|ಯೋಜನೆ|ನಿಯಮ|ಅರ್ಹತೆ|ದಾಖಲೆ|ಶುಲ್ಕ|क्या|कैसे|कौन|कब|कहाँ|योजना|नियम|पात्रता|दस्तावेज|शुल्क)\b/i.test(lower) ||
          /\b(scheme|yojana|eligibility|documents required|rules|guideline|policy|knowledge|circular|notice|pension|subsidy|ಯೋಜನೆ|ನಿಯಮ|ಅರ್ಹತೆ|ದಾಖಲೆ|योजना|नियम|पात्रता|दस्तावेज)\b/i.test(lower)
        );

      const wantsComplaint =
        complaintEnabled &&
        (Boolean(draftState?.active) || (!isInformationalKnowledgeQuery && (Boolean(cat) || isExplicitComplaintSignal)));

      if (wantsComplaint) {
        const nextDraft = {
          active: true,
          category: draftState?.category || cat || null,
          panchayatId: draftState?.panchayatId || null,
          panchayatName: draftState?.panchayatName || null,
          village: draftState?.village || "",
          location: draftState?.location || "",
          subject: draftState?.subject || "",
          description: draftState?.description || "",
          attachmentsCount: Number(attachmentsCount) || Number(draftState?.attachmentsCount) || 0
        };

        const gpMatch = this.matchPanchayat(message);
        if (gpMatch) {
          nextDraft.panchayatId = gpMatch.panchayatId;
          nextDraft.panchayatName = gpMatch.name;
          if (!nextDraft.village) {
            nextDraft.village = gpMatch.name.replace(/\s*Gram\s*Panchayat\s*/gi, "").trim();
          }
        }
        const loc = this.extractLocation(message);
        if (loc && !nextDraft.location) {
          nextDraft.location = loc;
        } else if (draftState?.active && !nextDraft.village && !nextDraft.location && message.trim().length <= 60 && !cat) {
          nextDraft.village = message.trim();
        }

        const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
        const isStarterPhrase = /^(register a complaint|water supply problems|road damage|streetlight problems|sanitation complaints|ದೂರು ದಾಖಲಿಸಿ|शिकायत दर्ज करें)$/i.test(message.trim());
        const isIntentOnlyOpening =
          !draftState?.active &&
          !gpMatch &&
          !loc &&
          wordCount <= 9 &&
          /^(i want to|i would like to|i need to|please|help me|want to)\b.*\b(complain|complaint|grievance|report|issue|problem|register|file|submit)\b/i.test(message.trim());
        const isPureLocationTurn = Boolean(draftState?.active && !draftState.village && !draftState.panchayatId && (gpMatch || loc || wordCount <= 5));

        if (!isStarterPhrase && !isIntentOnlyOpening && !isPureLocationTurn && message.trim().length >= 8) {
          if (!nextDraft.description) nextDraft.description = message.trim();
          else if (!nextDraft.description.includes(message.trim())) nextDraft.description = `${nextDraft.description}. ${message.trim()}`;
        }

        if (!nextDraft.category) {
          return {
            intent: "collect_category",
            draftState: nextDraft,
            reply: sLang === "kn"
              ? "ಖಂಡಿತ! ದಯವಿಟ್ಟು ಸಮಸ್ಯೆಯ ವರ್ಗವನ್ನು ತಿಳಿಸಿ (ಕುಡಿಯುವ ನೀರು, ರಸ್ತೆ ಹಾನಿ, ಬೀದಿದೀಪ, ಕಸ/ಚರಂಡಿ ಅಥವಾ ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯ)?"
              : (sLang === "hi"
                ? "ज़रूर! कृपया समस्या की श्रेणी बताएं (पेयजल, सड़क क्षति, स्ट्रीट लाइट, कचरा/नाली या सार्वजनिक सुविधा)?"
                : "I can help register your complaint. Which category applies (Water Supply, Road Damage, Streetlight Problems, Sanitation & Drainage, or Public Facilities)?"),
            suggestedQuestions: [dictGet("qa_6", lang), dictGet("qa_7", lang), dictGet("qa_8", lang), dictGet("qa_9", lang)]
          };
        }

        if (!nextDraft.panchayatId && !nextDraft.village && !nextDraft.location) {
          const catLbl = getCategoryLabel(nextDraft.category, lang);
          return {
            intent: "collect_location",
            draftState: nextDraft,
            reply: sLang === "kn"
              ? `${catLbl} ದೂರು ದಾಖಲಿಸಲು, ದಯವಿಟ್ಟು ಯಾವ ಗ್ರಾಮ / ಗ್ರಾಮ ಪಂಚಾಯತ್ ಮತ್ತು ನಿಖರ ಸ್ಥಳ ಎಂದು ತಿಳಿಸಿ?`
              : (sLang === "hi"
                ? `${catLbl} की शिकायत के लिए कृपया बताएं कि कौन-सा गाँव / ग्राम पंचायत और स्थान प्रभावित है?`
                : `I can help register your ${catLbl} complaint. Which village / Gram Panchayat and exact location is affected?`),
            suggestedQuestions: ["How do I find my Gram Panchayat?", "How can I track a complaint?", "What documents can I upload?"]
          };
        }

        if (!nextDraft.panchayatId) {
          const gps = this.getPanchayats();
          const chosen = (user && user.panchayatId && gps.find((g) => g.panchayatId === user.panchayatId)) || gps[0];
          nextDraft.panchayatId = chosen.panchayatId;
          nextDraft.panchayatName = chosen.name;
        }

        if (!nextDraft.description || nextDraft.description.trim().length < 15) {
          return {
            intent: "collect_description",
            draftState: nextDraft,
            reply: sLang === "kn"
              ? "ದಯವಿಟ್ಟು ಸಮಸ್ಯೆಯ ಸಂಪೂರ್ಣ ವಿವರವನ್ನು ತಿಳಿಸಿ (ಏನಾಗಿದೆ, ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ, ಸ್ಥಳದ ಗುರುತು)?"
              : (sLang === "hi"
                ? "कृपया समस्या का विस्तृत विवरण बताएं (क्या समस्या है, कब से है और आसपास का प्रमुख स्थान)?"
                : "Please describe the issue in detail (what is damaged, how severe it is, and how long it has persisted)."),
            suggestedQuestions: [dictGet("qa_1", lang)]
          };
        }

        if (!nextDraft.subject) {
          nextDraft.subject = this.buildDefaultSubject(nextDraft.category, lang);
        }

        return {
          intent: "complaint_ready",
          draftState: nextDraft,
          readyForPreview: true,
          reply: dictGet("filing_prompt", lang)
        };
      }

      // 5. Civic Services & FAQs
      if (/(timing|hour|open|close|working day|ಸಮಯ|ರಜೆ|समय|छुट्टी)/.test(lower)) {
        return {
          intent: "faq_timings",
          reply: sLang === "kn"
            ? "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಚೇರಿಗಳು ಸೋಮವಾರದಿಂದ ಶನಿವಾರ ಬೆಳಿಗ್ಗೆ 10:00 – ಸಂಜೆ 5:30 ರವರೆಗೆ ತೆರೆದಿರುತ್ತವೆ (ಭಾನುವಾರ ಮತ್ತು ಸರ್ಕಾರಿ ರಜೆಗಳಲ್ಲಿ ಬಂದ್). ಜನಸೇವಾ ಪೋರ್ಟಲ್ 24/7 ಲಭ್ಯವಿದೆ."
            : (sLang === "hi"
              ? "ग्राम पंचायत कार्यालय सोमवार से शनिवार सुबह 10:00 से शाम 5:30 बजे तक खुले रहते हैं (रविवार व सरकारी अवकाश बंद)। जनसेवा पोर्टल 24/7 उपलब्ध है।"
              : "Gram Panchayat offices operate Monday–Saturday, 10:00 AM to 5:30 PM (closed Sundays & Govt. Holidays). You can file or track complaints 24/7 on JANASEVA."),
          suggestedQuestions: [dictGet("qa_5", lang), dictGet("qa_10", lang)]
        };
      }

      if (/(service|government|eswathu|khata|birth|death|certificate|bapuji|ಸೇವೆ|ಇ-ಸ್ವತ್ತು|ಜನನ|ಮರಣ|सेवा|सरकारी|ई-स्वथु|जन्म|मृत्यु)/.test(lower)) {
        return {
          intent: "faq_services",
          navigationTarget: "about.html",
          reply: sLang === "kn"
            ? "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸೇವೆಗಳು: (1) ರಸ್ತೆ, ನೀರು, ಬೀದಿದೀಪ ಮತ್ತು ಸ್ವಚ್ಛತಾ ದೂರುಗಳು, (2) ಇ-ಸ್ವತ್ತು (ನಮೂನೆ 9/11) ಮತ್ತು ಆಸ್ತಿ ತೆರಿಗೆ — ಬಾಪೂಜಿ ಸೇವಾ ಕೇಂದ್ರದ ಮೂಲಕ, (3) ಜನನ ಮತ್ತು ಮರಣ ಪ್ರಮಾಣಪತ್ರ (21 ದಿನಗಳಲ್ಲಿ ನೋಂದಣಿ / ಇ-ಜನ್ಮ ಪೋರ್ಟಲ್)."
            : (sLang === "hi"
              ? "ग्राम पंचायत सेवाएं: (1) सड़क, पानी, स्ट्रीटलाइट और स्वच्छता शिकायतें, (2) ई-स्वथु (फॉर्म 9/11) व संपत्ति कर — बापूजी सेवा केंद्र द्वारा, (3) जन्म और मृत्यु प्रमाणपत्र (21 दिनों के भीतर पंजीकरण / ई-जन्म पोर्टल)।"
              : "Gram Panchayat & Government Services: (1) Civic grievance redressal (Water, Roads, Streetlights, Sanitation), (2) e-Swathu Form 9/11 & Property Tax at Bapuji Seva Kendra, (3) Birth & Death Certificates (register within 21 days / e-JanMa portal)."),
          suggestedQuestions: [dictGet("qa_1", lang), dictGet("qa_10", lang), dictGet("qa_11", lang)]
        };
      }

      if (/^(hi|hello|hey|namaste|namaskara|ನಮಸ್ಕಾರ|ಹಲೋ|नमस्ते|नमस्कार)/i.test(message.trim())) {
        return {
          intent: "greeting",
          reply: dictGet("welcome", lang),
          suggestedQuestions: [dictGet("qa_1", lang), dictGet("qa_2", lang), dictGet("qa_5", lang)]
        };
      }

      if (/(thank|thanks|dhanyavad|ಧನ್ಯವಾದ|धन्यवाद|शुक्रिया)/.test(lower)) {
        return {
          intent: "thanks",
          reply: sLang === "kn"
            ? "ಧನ್ಯವಾದಗಳು! ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸೇವೆಗಳಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಬೇರೆ ಯಾವುದೇ ಸಹಾಯ ಬೇಕಿದ್ದಲ್ಲಿ ಕೇಳಿ."
            : (sLang === "hi"
              ? "आपका स्वागत है! ग्राम पंचायत सेवाओं से जुड़ी किसी भी सहायता के लिए बेझिझक पूछें।"
              : "You are welcome! Feel free to ask anytime if you need help registering or tracking a complaint."),
          suggestedQuestions: [dictGet("qa_1", lang), dictGet("qa_2", lang)]
        };
      }

      if (isInformationalKnowledgeQuery) {
        return {
          intent: "local_knowledge_query",
          query: message,
          fallbackReply: sLang === "kn"
            ? "ಕ್ಷಮಿಸಿ, JANASEVA ಜ್ಞಾನ ಕೋಶದಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಾಕಷ್ಟು ಪರಿಶೀಲಿಸಿದ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಪ್ರಶ್ನೆಯನ್ನು ಇನ್ನಷ್ಟು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿ ಅಥವಾ ಸಂಬಂಧಿತ ದಾಖಲೆಯನ್ನು AI Knowledge Centre ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ."
            : (sLang === "hi"
              ? "क्षमा करें, JANASEVA ज्ञान केंद्र में आपके प्रश्न के लिए पर्याप्त सत्यापित जानकारी नहीं मिली। कृपया प्रश्न स्पष्ट करें या संबंधित दस्तावेज़ AI Knowledge Centre में अपलोड करें।"
              : "Sufficient verified information was not found in the JANASEVA Knowledge Base for this question. Please rephrase with specific terms or upload relevant documents to the AI Knowledge Centre."),
          suggestedQuestions: [dictGet("qa_1", lang), dictGet("qa_5", lang), dictGet("qa_10", lang)]
        };
      }

      return {
        intent: "local_knowledge_fallback",
        query: message,
        fallbackReply: sLang === "kn"
          ? "ನಾನು ಜನಸೇವಾ ಸಹಾಯಕ. ನೀವು ದೂರು ದಾಖಲಿಸಲು ('ರಸ್ತೆ ಗುಂಡಿ ಸಮಸ್ಯೆ'), ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ('JAN-2026-XXXX ಟ್ರ್ಯಾಕ್ ಮಾಡಿ'), ಅಥವಾ AI ಜ್ಞಾನ ಕೋಶ ಮತ್ತು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸೇವೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು."
          : (sLang === "hi"
            ? "मैं जनसेवा सहायक हूँ। आप शिकायत दर्ज करने ('सड़क में गड्ढे की समस्या'), शिकायत ट्रैक करने ('JAN-2026-XXXX ट्रैक करें'), या AI ज्ञान केंद्र और ग्राम पंचायत सेवाओं के बारे में पूछ सकते हैं।"
            : "I can help you register a civic complaint (water, roads, streetlights, sanitation), track a Complaint ID (e.g., JAN-2026-XXXX), search uploaded documents in the AI Knowledge Centre, or look up Gram Panchayat services. What would you like to do?"),
        suggestedQuestions: [dictGet("qa_1", lang), dictGet("qa_2", lang), dictGet("qa_5", lang), dictGet("qa_10", lang)]
      };
    }

    buildConversationSummary(messages, draft, lang) {
      const sLang = getShortLang(lang);
      const userMsgs = (messages || []).filter((m) => m.sender === "user");
      const lastUser = userMsgs.length ? userMsgs[userMsgs.length - 1].text : "";
      const ids = Array.from(new Set(
        (messages || [])
          .map((m) => String(m.text || "").match(/JAN-\d{4}-\d{3,6}/gi) || [])
          .flat()
          .map((x) => x.toUpperCase())
      ));

      if (sLang === "kn") {
        return [
          `ಒಟ್ಟು ಬಳಕೆದಾರ ಸಂದೇಶಗಳು: ${userMsgs.length}`,
          ids.length ? `ಉಲ್ಲೇಖಿಸಲಾದ ದೂರು ಐಡಿಗಳು: ${ids.join(", ")}` : null,
          draft ? `ಪ್ರಸ್ತುತ ದೂರು ಕರಡು: ${getCategoryLabel(draft.category, lang)} (${draft.panchayatName || draft.village || "ಸ್ಥಳ ಬಾಕಿ"})` : null,
          lastUser ? `ಕೊನೆಯ ವಿನಂತಿ: "${lastUser.slice(0, 100)}"` : null
        ].filter(Boolean).join("\n");
      }
      if (sLang === "hi") {
        return [
          `कुल उपयोगकर्ता संदेश: ${userMsgs.length}`,
          ids.length ? `उल्लिखित शिकायत आईडी: ${ids.join(", ")}` : null,
          draft ? `वर्तमान शिकायत ड्राफ्ट: ${getCategoryLabel(draft.category, lang)} (${draft.panchayatName || draft.village || "स्थान शेष"})` : null,
          lastUser ? `अंतिम अनुरोध: "${lastUser.slice(0, 100)}"` : null
        ].filter(Boolean).join("\n");
      }
      return [
        `User messages in session: ${userMsgs.length}`,
        ids.length ? `Referenced Complaint IDs: ${ids.join(", ")}` : null,
        draft ? `Active Complaint Draft: ${getCategoryLabel(draft.category, lang)} (${draft.panchayatName || draft.village || "location pending"})` : null,
        lastUser ? `Latest inquiry: "${lastUser.slice(0, 100)}"` : null
      ].filter(Boolean).join("\n");
    }
  }

  function getCategoryLabel(cat, langCode) {
    const s = getShortLang(langCode);
    const row = CATEGORY_MAP[cat];
    if (row) return row[s] || row.en;
    if (window.janasevaTranslator && s !== "en") return window.janasevaTranslator.get(cat, s);
    return cat || "";
  }

  function getStatusLabel(status, langCode) {
    const s = getShortLang(langCode);
    const row = STATUS_MAP[status];
    if (row) return row[s] || row.en;
    if (window.janasevaTranslator && s !== "en") return window.janasevaTranslator.get(status, s);
    return status || "";
  }

  const DEFAULT_CHAT_SETTINGS = {
    // A. General Settings
    aiAssistant: true,
    aiKnowledgeCentre: true,
    onlineAi: true,
    offlineAi: true,
    conversationHistory: true,
    suggestedQuestions: true,
    streamingResponses: true,
    autoLanguageDetection: false,

    // B. Communication Settings
    voiceInput: true,
    voiceResponses: true,
    textToSpeech: true,
    autoVoicePlayback: false,
    speechRate: 0.95,
    attachments: true,
    imageUpload: true,
    pdfUpload: true,
    documentAnalysis: true,

    // C. Intelligence Settings
    knowledgeSearch: true,
    semanticSearch: true,
    crossLanguageSearch: true,
    contextAwareResponses: true,
    conversationMemory: true,
    autoKnowledgeCitation: true,
    complaintUnderstanding: true,
    schemeSearch: true,

    // D. Language Settings (Strictly EN, KN, HI)
    activeLanguage: "en-IN",
    enableEnglish: true,
    enableKannada: true,
    enableHindi: true,
    autoTranslation: true,

    // E. Privacy & Control Settings
    saveChatHistory: true,
    saveAttachments: true,
    rememberContext: true,
    anonymousAnalytics: true,
    autoChatCleanup: false,
    cleanupRetentionDays: 30,

    // F. Advanced Settings (Non-secret only; API keys stay on backend)
    aiProvider: "auto",
    aiModel: "auto",
    responseLength: "balanced",
    temperature: 0.3,
    requestTimeoutMs: 14000,
    maxAttachmentSizeMb: 5,
    knowledgeSearchLimit: 5,
    offlineStorageLimitMb: 25
  };

  class JanasevaChatSettingsManager {
    constructor() {
      this._cacheByUid = new Map();
    }

    getDefaults() {
      return { ...DEFAULT_CHAT_SETTINGS };
    }

    _storageKey(uid) {
      const safe = uid ? String(uid).replace(/[^a-zA-Z0-9_-]/g, "_") : "guest";
      return `JANASEVA_chat_settings_${safe}`;
    }

    sanitize(raw) {
      const d = this.getDefaults();
      const s = (raw && typeof raw === "object") ? raw : {};
      const out = {
        aiAssistant: s.aiAssistant !== false,
        aiKnowledgeCentre: s.aiKnowledgeCentre !== false,
        onlineAi: s.onlineAi !== false,
        offlineAi: s.offlineAi !== false,
        conversationHistory: s.conversationHistory !== false,
        suggestedQuestions: s.suggestedQuestions !== false,
        streamingResponses: s.streamingResponses !== false,
        autoLanguageDetection: Boolean(s.autoLanguageDetection),

        voiceInput: s.voiceInput !== false,
        voiceResponses: s.voiceResponses !== false,
        textToSpeech: s.textToSpeech !== false,
        autoVoicePlayback: Boolean(s.autoVoicePlayback),
        speechRate: Math.min(1.5, Math.max(0.75, Number(s.speechRate ?? d.speechRate) || d.speechRate)),
        attachments: s.attachments !== false,
        imageUpload: s.imageUpload !== false,
        pdfUpload: s.pdfUpload !== false,
        documentAnalysis: s.documentAnalysis !== false,

        knowledgeSearch: s.knowledgeSearch !== false,
        semanticSearch: s.semanticSearch !== false,
        crossLanguageSearch: s.crossLanguageSearch !== false,
        contextAwareResponses: s.contextAwareResponses !== false,
        conversationMemory: s.conversationMemory !== false,
        autoKnowledgeCitation: s.autoKnowledgeCitation !== false,
        complaintUnderstanding: s.complaintUnderstanding !== false,
        schemeSearch: s.schemeSearch !== false,

        activeLanguage: ["en-IN", "kn-IN", "hi-IN"].includes(s.activeLanguage) ? s.activeLanguage : d.activeLanguage,
        enableEnglish: s.enableEnglish !== false,
        enableKannada: s.enableKannada !== false,
        enableHindi: s.enableHindi !== false,
        autoTranslation: s.autoTranslation !== false,

        saveChatHistory: s.saveChatHistory !== false,
        saveAttachments: s.saveAttachments !== false,
        rememberContext: s.rememberContext !== false,
        anonymousAnalytics: s.anonymousAnalytics !== false,
        autoChatCleanup: Boolean(s.autoChatCleanup),
        cleanupRetentionDays: Math.min(365, Math.max(7, Number(s.cleanupRetentionDays ?? d.cleanupRetentionDays) || 30)),

        aiProvider: ["auto", "gemini", "openai", "guided"].includes(s.aiProvider) ? s.aiProvider : "auto",
        aiModel: ["auto", "gemini-2.5-flash", "gpt-4o-mini", "deterministic-civic-nlu"].includes(s.aiModel) ? s.aiModel : "auto",
        responseLength: ["concise", "balanced", "detailed"].includes(s.responseLength) ? s.responseLength : "balanced",
        temperature: Math.min(1, Math.max(0, Number(s.temperature ?? d.temperature))),
        requestTimeoutMs: Math.min(25000, Math.max(4000, Number(s.requestTimeoutMs ?? d.requestTimeoutMs) || d.requestTimeoutMs)),
        maxAttachmentSizeMb: Math.min(10, Math.max(1, Number(s.maxAttachmentSizeMb ?? d.maxAttachmentSizeMb) || d.maxAttachmentSizeMb)),
        knowledgeSearchLimit: Math.min(10, Math.max(1, Number(s.knowledgeSearchLimit ?? d.knowledgeSearchLimit) || d.knowledgeSearchLimit)),
        offlineStorageLimitMb: Math.min(100, Math.max(5, Number(s.offlineStorageLimitMb ?? d.offlineStorageLimitMb) || d.offlineStorageLimitMb)),
        updatedAt: s.updatedAt || null,
        updatedBy: s.updatedBy || null
      };

      // Guarantee at least one enabled language
      if (!out.enableEnglish && !out.enableKannada && !out.enableHindi) {
        out.enableEnglish = true;
      }
      // Keep activeLanguage aligned to an enabled language
      const activeShort = getShortLang(out.activeLanguage);
      if (activeShort === "en" && !out.enableEnglish) {
        out.activeLanguage = out.enableKannada ? "kn-IN" : "hi-IN";
      } else if (activeShort === "kn" && !out.enableKannada) {
        out.activeLanguage = out.enableEnglish ? "en-IN" : "hi-IN";
      } else if (activeShort === "hi" && !out.enableHindi) {
        out.activeLanguage = out.enableEnglish ? "en-IN" : "kn-IN";
      }
      if (!Number.isFinite(out.temperature)) out.temperature = d.temperature;
      return out;
    }

    validate(candidate) {
      const s = candidate || {};
      if (!s.enableEnglish && !s.enableKannada && !s.enableHindi) {
        return { valid: false, error: "At least one supported language (English, Kannada, or Hindi) must remain enabled." };
      }
      const temp = Number(s.temperature);
      if (isNaN(temp) || temp < 0 || temp > 1) {
        return { valid: false, error: "Response Temperature must be between 0.0 and 1.0." };
      }
      const timeoutMs = Number(s.requestTimeoutMs);
      if (isNaN(timeoutMs) || timeoutMs < 4000 || timeoutMs > 25000) {
        return { valid: false, error: "Request Timeout must be between 4000 ms and 25000 ms." };
      }
      const maxMb = Number(s.maxAttachmentSizeMb);
      if (isNaN(maxMb) || maxMb < 1 || maxMb > 10) {
        return { valid: false, error: "Maximum Attachment Size must be between 1 MB and 10 MB." };
      }
      const kbLimit = Number(s.knowledgeSearchLimit);
      if (isNaN(kbLimit) || kbLimit < 1 || kbLimit > 10) {
        return { valid: false, error: "Knowledge Search Limit must be between 1 and 10 documents." };
      }
      return { valid: true, sanitized: this.sanitize(s) };
    }

    loadLocal(uid = null) {
      try {
        const raw = localStorage.getItem(this._storageKey(uid));
        if (raw) {
          const parsed = this.sanitize(JSON.parse(raw));
          this._cacheByUid.set(uid || "guest", parsed);
          return parsed;
        }
      } catch (e) {}
      const d = this.getDefaults();
      // Honor initial legacy storage prefs on first upgrade
      try {
        const legacyRate = parseFloat(localStorage.getItem("janaseva_chat_speech_rate") || "");
        if (Number.isFinite(legacyRate) && legacyRate >= 0.75 && legacyRate <= 1.5) d.speechRate = legacyRate;
        if (localStorage.getItem("janaseva_chat_auto_speak") === "true") d.autoVoicePlayback = true;
      } catch (e) {}
      this._cacheByUid.set(uid || "guest", d);
      return d;
    }

    async refreshFromRemote(uid = null) {
      let settings = this.loadLocal(uid);
      if (uid && navigator.onLine && window.isFirebaseAvailable && window.fbDb && typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser?.uid === uid) {
        const snap = await window.fbDb.collection("users").doc(uid).get();
        if (snap.exists) {
          const uData = snap.data() || {};
          if (uData.uiPreferences && uData.uiPreferences.chatSettings) {
            settings = this.sanitize(uData.uiPreferences.chatSettings);
            this._saveLocalOnly(uid, settings);
          }
        }
      }
      this._cacheByUid.set(uid || "guest", settings);
      return settings;
    }

    _saveLocalOnly(uid, sanitized) {
      try {
        localStorage.setItem(this._storageKey(uid), JSON.stringify(sanitized));
        localStorage.setItem("janaseva_chat_speech_rate", String(sanitized.speechRate));
        localStorage.setItem("janaseva_chat_auto_speak", String(Boolean(sanitized.autoVoicePlayback)));
      } catch (e) {}
      this._cacheByUid.set(uid || "guest", sanitized);
    }

    async save(uid, rawSettings, actorEmail = "") {
      const check = this.validate(rawSettings);
      if (!check.valid) throw new Error(check.error);

      const nowIso = new Date().toISOString();
      const toSave = {
        ...check.sanitized,
        updatedAt: nowIso,
        updatedBy: actorEmail || (uid ? `uid:${uid}` : "guest")
      };
      this._saveLocalOnly(uid, toSave);

      if (uid && navigator.onLine && window.isFirebaseAvailable && window.fbDb && typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser?.uid === uid) {
        const userRef = window.fbDb.collection("users").doc(uid);
        const snap = await userRef.get();
        const existingPrefs = (snap.exists && snap.data()?.uiPreferences && typeof snap.data().uiPreferences === "object")
          ? snap.data().uiPreferences
          : {};
        await userRef.update({
          uiPreferences: { ...existingPrefs, chatSettings: toSave },
          preferredLang: getShortLang(toSave.activeLanguage),
          updatedAt: nowIso,
          updatedBy: toSave.updatedBy
        });
      }

      window.dispatchEvent(new CustomEvent("janaseva:chatSettingsChanged", { detail: { uid, settings: toSave } }));
      return toSave;
    }

    async reset(uid, actorEmail = "") {
      const defaults = this.getDefaults();
      return await this.save(uid, defaults, actorEmail);
    }
  }

  window.JanasevaChatServices = {
    DICT: JANASEVA_CHAT_DICT,
    CATEGORY_MAP,
    STATUS_MAP,
    DEFAULT_CHAT_SETTINGS,
    getShortLang,
    dictGet,
    getCategoryLabel,
    getStatusLabel,
    validateChatAttachmentFile,
    chatSettingsManager: new JanasevaChatSettingsManager(),
    historyStore: new JanasevaChatHistoryStore(),
    civicEngine: new JanasevaCivicEngine()
  };
})(window);
