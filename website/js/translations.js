// ============================================================================
// JANASEVA MULTILINGUAL TRANSLATION SYSTEM (English, Kannada, Hindi)
// Supports complete DOM, Form, Modal, Tooltip, ARIA, Toast, Dialog & Dynamic Translation
// ============================================================================

const JANASEVA_MONTHS = {
  kn: {
    jan: "ಜನವರಿ", january: "ಜನವರಿ", feb: "ಫೆಬ್ರವರಿ", february: "ಫೆಬ್ರವರಿ",
    mar: "ಮಾರ್ಚ್", march: "ಮಾರ್ಚ್", apr: "ಏಪ್ರಿಲ್", april: "ಏಪ್ರಿಲ್",
    may: "ಮೇ", jun: "ಜೂನ್", june: "ಜೂನ್", jul: "ಜುಲೈ", july: "ಜುಲೈ",
    aug: "ಆಗಸ್ಟ್", august: "ಆಗಸ್ಟ್", sep: "ಸೆಪ್ಟೆಂಬರ್", sept: "ಸೆಪ್ಟೆಂಬರ್", september: "ಸೆಪ್ಟೆಂಬರ್",
    oct: "ಅಕ್ಟೋಬರ್", october: "ಅಕ್ಟೋಬರ್", nov: "ನವೆಂಬರ್", november: "ನವೆಂಬರ್",
    dec: "ಡಿಸೆಂಬರ್", december: "ಡಿಸೆಂಬರ್"
  },
  hi: {
    jan: "जनवरी", january: "जनवरी", feb: "फ़रवरी", february: "फ़रवरी",
    mar: "मार्च", march: "मार्च", apr: "अप्रैल", april: "अप्रैल",
    may: "मई", jun: "जून", june: "जून", jul: "जुलाई", july: "जुलाई",
    aug: "अगस्त", august: "अगस्त", sep: "सितंबर", sept: "सितंबर", september: "सितंबर",
    oct: "अक्टूबर", october: "अक्टूबर", nov: "नवंबर", november: "नवंबर",
    dec: "दिसंबर", december: "दिसंबर"
  }
};

// Dedicated card-label <br> layouts ONLY for .cat-label hero category cards
const JANASEVA_CAT_LABEL_HTML = {
  kn: {
    "water supply issues": "ಕುಡಿಯುವ ನೀರಿನ<br>ಸಮಸ್ಯೆಗಳು",
    "road & infrastructure": "ರಸ್ತೆ ಮತ್ತು<br>ಮೂಲಸೌಕರ್ಯ",
    "garbage & cleanliness": "ಕಸ ಮತ್ತು<br>ಸ್ವಚ್ಛತೆ",
    "streetlight problems": "ಬೀದಿ ದೀಪದ<br>ಸಮಸ್ಯೆಗಳು",
    "drainage & sanitation": "ಒಳಚರಂಡಿ ಮತ್ತು<br>ನೈರ್ಮಲ್ಯ",
    "public facilities": "ಸಾರ್ವಜನಿಕ<br>ಸೌಲಭ್ಯಗಳು",
    "other civic issues": "ಇತರ ನಾಗರಿಕ<br>ಸಮಸ್ಯೆಗಳು"
  },
  hi: {
    "water supply issues": "पेयजल आपूर्ति<br>समस्याएं",
    "road & infrastructure": "सड़क एवं<br>बुनियादी ढांचा",
    "garbage & cleanliness": "कचरा एवं<br>स्वच्छता",
    "streetlight problems": "स्ट्रीट लाइट<br>समस्याएं",
    "drainage & sanitation": "जल निकासी एवं<br>स्वच्छता",
    "public facilities": "सार्वजनिक<br>सुविधाएं",
    "other civic issues": "अन्य नागरिक<br>समस्याएं"
  }
};

const JANASEVA_TRANSLATIONS = {
  kn: {
    "& credentials": "ಮತ್ತು ರುಜುವಾತುಗಳು",
    "& logins": "ಮತ್ತು ಲಾಗಿನ್‌ಗಳು",
    "(action taken)": "(ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ)",
    "(jpg/png/webp, up to 5 mb)": "(JPG/PNG/WEBP, 5 MB ವರೆಗೆ)",
    ") is strictly preserved across all modes.": ") ಎಲ್ಲಾ ಮೋಡ್‌ಗಳಲ್ಲಿ ಕಟ್ಟುನಿಟ್ಟಾಗಿ ಸಂರಕ್ಷಿಸಲ್ಪಡುತ್ತದೆ.",
    ") UNTOUCHABLE": ") ಬದಲಾಯಿಸಲಾಗದು",
    "-- Choose Quick Response Template (Optional) --": "-- ತ್ವರಿತ ಪ್ರತಿಕ್ರಿಯೆ ಟೆಂಪ್ಲೇಟ್ ಆಯ್ಕೆಮಾಡಿ (ಐಚ್ಛಿಕ) --",
    "-- Keep Current Assignment --": "-- ಪ್ರಸ್ತುತ ನಿಯೋಜನೆಯನ್ನು ಉಳಿಸಿಕೊಳ್ಳಿ --",
    "-- select category --": "-- ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ --",
    "-- select gram panchayat --": "-- ಗ್ರಾಮ ಪಂಚಾಯತ್ ಆಯ್ಕೆಮಾಡಿ --",
    "-- select issue category --": "-- ಸಮಸ್ಯೆಯ ವರ್ಗ ಆಯ್ಕೆಮಾಡಿ --",
    "-- Select Standard Rejection Reason --": "-- ಸಾಮಾನ್ಯ ತಿರಸ್ಕಾರದ ಕಾರಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ --",
    "0 Citizens": "0 ನಾಗರಿಕರು",
    "0 Deleted Grievances": "0 ಅಳಿಸಲಾದ ದೂರುಗಳು",
    "0 Events": "0 ಘಟನೆಗಳು",
    "0 Grievances": "0 ದೂರುಗಳು",
    "0 Grievances Found": "0 ದೂರುಗಳು ಕಂಡುಬಂದಿವೆ",
    "0 grievances selected": "0 ದೂರುಗಳು ಆಯ್ಕೆಯಾಗಿವೆ",
    "0 KB • Verified format": "0 KB • ಪರಿಶೀಲಿಸಿದ ಫಾರ್ಮ್ಯಾಟ್",
    "0 Quarantined Records": "0 ಕ್ವಾರಂಟೈನ್ ದಾಖಲೆಗಳು",
    "0 Records": "0 ದಾಖಲೆಗಳು",
    "0 Updates Found": "0 ನವೀಕರಣಗಳು ಕಂಡುಬಂದಿವೆ",
    "0% Initiation": "0% ಪ್ರಾರಂಭ",
    "0% Not Started": "0% ಪ್ರಾರಂಭವಾಗಿಲ್ಲ",
    "0% – Not Started": "0% – ಪ್ರಾರಂಭವಾಗಿಲ್ಲ",
    "07 Nov 2026, 10:24 AM": "07 ನವೆಂಬರ್ 2026, ಬೆಳಗ್ಗೆ 10:24",
    "1. New Complaints": "1. ಹೊಸ ದೂರುಗಳು",
    "1. Security Validation": "1. ಭದ್ರತಾ ಪರಿಶೀಲನೆ",
    "100% Completed": "100% ಪೂರ್ಣಗೊಂಡಿದೆ",
    "100% Full Resolution": "100% ಸಂಪೂರ್ಣ ಪರಿಹಾರ",
    "100% – Completed and Verified": "100% – ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "10–25% – Initial Inspection": "10–25% – ಪ್ರಾರಂಭಿಕ ತಪಾಸಣೆ",
    "2. Maintenance Active": "2. ನಿರ್ವಹಣಾ ಮೋಡ್ ಸಕ್ರಿಯ",
    "2. Received Complaints": "2. ಸ್ವೀಕರಿಸಿದ ದೂರುಗಳು",
    "25% Inspection": "25% ತಪಾಸಣೆ",
    "256-bit ssl encrypted": "256-ಬಿಟ್ SSL ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ",
    "26–50% – Work Started": "26–50% – ಕೆಲಸ ಪ್ರಾರಂಭವಾಗಿದೆ",
    "3. Cryptographic Backup": "3. ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಬ್ಯಾಕಪ್",
    "3. In Progress": "3. ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    "4. Complaints Purge": "4. ದೂರುಗಳ ತೆರವು",
    "4. Pending Complaints": "4. ಬಾಕಿ ಇರುವ ದೂರುಗಳು",
    "5. Delivery Logs Flush": "5. ರವಾನೆ ಲಾಗ್‌ಗಳ ತೆರವು",
    "5. Resolved Complaints": "5. ಪರಿಹರಿಸಿದ ದೂರುಗಳು",
    "50% Work Started": "50% ಕೆಲಸ ಪ್ರಾರಂಭವಾಗಿದೆ",
    "51–75% – Work in Progress": "51–75% – ಕೆಲಸ ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    "6. Account Registry": "6. ಖಾತೆ ನೋಂದಣಿ",
    "6. Rejected Complaints": "6. ತಿರಸ್ಕರಿಸಿದ ದೂರುಗಳು",
    "7 Emergency Security Checkpoints Verification Protocol": "7 ತುರ್ತು ಭದ್ರತಾ ತಪಾಸಣಾ ಹಂತಗಳ ಪರಿಶೀಲನಾ ಪ್ರೋಟೋಕಾಲ್",
    "7-CHECKPOINT GUARDED": "7-ಹಂತದ ಸುರಕ್ಷಿತ",
    "7-CHECKPOINT PROTOCOL": "7-ಹಂತದ ತಪಾಸಣೆ ಪ್ರೋಟೋಕಾಲ್",
    "7. Local & IndexedDB": "7. ಸ್ಥಳೀಯ ಮತ್ತು IndexedDB",
    "7. Reopened Complaints": "7. ಮರುತೆರೆದ ದೂರುಗಳು",
    "75% In Progress": "75% ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    "76–99% – Final Stage": "76–99% – ಅಂತಿಮ ಹಂತ",
    "8 Statuses Configured": "8 ಸ್ಥಿತಿಗಳನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿದೆ",
    "8. Archived Complaints": "8. ಆರ್ಕೈವ್ ಮಾಡಿದ ದೂರುಗಳು",
    "8. Archived Records": "8. ಆರ್ಕೈವ್ ಮಾಡಿದ ದಾಖಲೆಗಳು",
    "8. Verification & Resume": "8. ಪರಿಶೀಲನೆ ಮತ್ತು ಪುನರಾರಂಭ",
    "[JANASEVA RESET ENGINE INITIALIZED]": "[ಜನಸೇವಾ ಮರುಹೊಂದಿಕೆ ಎಂಜಿನ್ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ]",
    "A complete snapshot backup is mandatory prior to deleting any record. Verifying SHA-256 cryptographic checksum.": "ಯಾವುದೇ ದಾಖಲೆ ಅಳಿಸುವ ಮುನ್ನ ಸಂಪೂರ್ಣ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಬ್ಯಾಕಪ್ ಕಡ್ಡಾಯ. SHA-256 ಚೆಕ್‌ಸಮ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ.",
    "a digital platform to connect citizens with their gram panchayat for quick and transparent grievance redressal": "ತ್ವರಿತ ಮತ್ತು ಪಾರದರ್ಶಕ ಕುಂದುಕೊರತೆ ಪರಿಹಾರಕ್ಕಾಗಿ ನಾಗರಿಕರನ್ನು ತಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುವ ಡಿಜಿಟಲ್ ವೇದಿಕೆ",
    "a digital platform to connect citizens with their gram panchayat for quick and transparent grievance redressal.": "ತ್ವರಿತ ಮತ್ತು ಪಾರದರ್ಶಕ ಕುಂದುಕೊರತೆ ಪರಿಹಾರಕ್ಕಾಗಿ ನಾಗರಿಕರನ್ನು ತಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುವ ಡಿಜಿಟಲ್ ವೇದಿಕೆ.",
    "a direct link to your": "ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗೆ",
    "a direct link to your gram panchayat": "ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗೆ ನೇರ ಸಂಪರ್ಕ",
    "about": "ನಮ್ಮ ಬಗ್ಗೆ",
    "about janaseva": "ಜನಸೇವಾ ಬಗ್ಗೆ",
    "about janaseva – gram panchayat grievance portal": "ಜನಸೇವಾ – ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ಪೋರ್ಟಲ್ ಬಗ್ಗೆ",
    "About Portal": "ಪೋರ್ಟಲ್ ಬಗ್ಗೆ",
    "about the portal": "ಪೋರ್ಟಲ್ ಬಗ್ಗೆ",
    "academic project": "ಶೈಕ್ಷಣಿಕ ಯೋಜನೆ",
    "Accept and attach this photograph": "ಈ ಛಾಯಾಚಿತ್ರವನ್ನು ಸ್ವೀಕರಿಸಿ ಮತ್ತು ಲಗತ್ತಿಸಿ",
    "Accidental Data Loss Protection Active:": "ಆಕಸ್ಮಿಕ ಡೇಟಾ ನಷ್ಟ ರಕ್ಷಣೆ ಸಕ್ರಿಯವಾಗಿದೆ:",
    "Acknowledge Impact & Create Backup →": "ಪರಿಣಾಮ ಒಪ್ಪಿಕೊಳ್ಳಿ ಮತ್ತು ಬ್ಯಾಕಪ್ ರಚಿಸಿ →",
    "Acknowledgement Slip": "ಸ್ವೀಕೃತಿ ಚೀಟಿ",
    "action": "ಕ್ರಮ",
    "Action Initiated: Remediation work authorized and staff deployed": "ಕ್ರಮ ಆರಂಭಿಸಲಾಗಿದೆ: ಪರಿಹಾರ ಕಾಮಗಾರಿಗೆ ಅನುಮೋದನೆ ನೀಡಿ ಸಿಬ್ಬಂದಿಯನ್ನು ನಿಯೋಜಿಸಲಾಗಿದೆ",
    "Action Taken": "ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ",
    "action taken": "ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ",
    "Action Taken (Remediation Executed)": "ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ (ಪರಿಹಾರ ಕಾರ್ಯಗತಗೊಳಿಸಲಾಗಿದೆ)",
    "Action Taken: Corrective action executed on site": "ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ: ಸ್ಥಳದಲ್ಲಿ ದುರಸ್ತಿ ಕಾರ್ಯ ಪೂರ್ಣಗೊಂಡಿದೆ",
    "actions": "ಕ್ರಮಗಳು",
    "Activate Maintenance Mode": "ನಿರ್ವಹಣಾ ಮೋಡ್ ಸಕ್ರಿಯಗೊಳಿಸಿ",
    "ACTIVE": "ಸಕ್ರಿಯ",
    "Active (Processing)": "ಸಕ್ರಿಯ (ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ)",
    "Active and archived workflow stages dynamically reflected on Citizen Tracking, Receiver Dashboard, and Citizen Dashboard.": "ನಾಗರಿಕ ಟ್ರ್ಯಾಕಿಂಗ್, ಸ್ವೀಕೃತಿದಾರರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮತ್ತು ನಾಗರಿಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಪ್ರತಿಫಲಿಸುವ ಸಕ್ರಿಯ ಮತ್ತು ಆರ್ಕೈವ್ ಹಂತಗಳು.",
    "Active Complaints": "ಸಕ್ರಿಯ ದೂರುಗಳು",
    "active delivery engine": "ಸಕ್ರಿಯ ವಿತರಣಾ ಎಂಜಿನ್",
    "Active Processing": "ಸಕ್ರಿಯ ಪ್ರಕ್ರಿಯೆ",
    "Active remediation": "ಸಕ್ರಿಯ ಪರಿಹಾರ ಕಾರ್ಯ",
    "Active remediation underway": "ಸಕ್ರಿಯ ಪರಿಹಾರ ಕಾಮಗಾರಿ ನಡೆಯುತ್ತಿದೆ",
    "Active Work": "ಸಕ್ರಿಯ ಕೆಲಸ",
    "add a service (gmail) and copy the service id": "ಸರ್ವಿಸ್ (Gmail) ಸೇರಿಸಿ ಮತ್ತು ಸರ್ವಿಸ್ ಐಡಿ ನಕಲಿಸಿ",
    "add a service (gmail) and copy the service id.": "ಸರ್ವಿಸ್ (Gmail) ಸೇರಿಸಿ ಮತ್ತು ಸರ್ವಿಸ್ ಐಡಿ ನಕಲಿಸಿ.",
    "add announcement, public meeting dates, or special village notices here": "ಪ್ರಕಟಣೆ, ಸಾರ್ವಜನಿಕ ಸಭೆಯ ದಿನಾಂಕಗಳು ಅಥವಾ ವಿಶೇಷ ಗ್ರಾಮ ಸೂಚನೆಗಳನ್ನು ಇಲ್ಲಿ ಸೇರಿಸಿ",
    "add announcement, public meeting dates, or special village notices here...": "ಪ್ರಕಟಣೆ, ಸಾರ್ವಜನಿಕ ಸಭೆಯ ದಿನಾಂಕಗಳು ಅಥವಾ ವಿಶೇಷ ಗ್ರಾಮ ಸೂಚನೆಗಳನ್ನು ಇಲ್ಲಿ ಸೇರಿಸಿ...",
    "Add Banner Image": "ಬ್ಯಾನರ್ ಚಿತ್ರ ಸೇರಿಸಿ",
    "Add Image": "ಚಿತ್ರ ಸೇರಿಸಿ",
    "Add New Complaint Status": "ಹೊಸ ದೂರಿನ ಸ್ಥಿತಿ ಸೇರಿಸಿ",
    "add new gram panchayat": "ಹೊಸ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸೇರಿಸಿ",
    "add new panchayat": "ಹೊಸ ಪಂಚಾಯತ್ ಸೇರಿಸಿ",
    "Add New Status": "ಹೊಸ ಸ್ಥಿತಿ ಸೇರಿಸಿ",
    "add official note": "ಅಧಿಕೃತ ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ",
    "admin": "ನಿರ್ವಾಹಕ",
    "Admin & Official Control Centre – JANASEVA Portal": "ಆಡಳಿತ ಮತ್ತು ಅಧಿಕೃತ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ – ಜನಸೇವಾ ಪೋರ್ಟಲ್",
    "Admin Actor": "ಆಡಳಿತ ಕರ್ತೃ",
    "Admin Banner Image Management": "ಆಡಳಿತ ಬ್ಯಾನರ್ ಚಿತ್ರ ನಿರ್ವಹಣೆ",
    "ADMIN CONTROL": "ಆಡಳಿತ ನಿಯಂತ್ರಣ",
    "Admin Control Centre": "ಆಡಳಿತ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ",
    "Admin Dashboard": "ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "ADMIN PRIVILEGED ONLY": "ಆಡಳಿತಾಧಿಕಾರಿಗೆ ಮಾತ್ರ",
    "Administrative Audit Logs": "ಆಡಳಿತಾತ್ಮಕ ಆಡಿಟ್ ದಾಖಲೆಗಳು",
    "Administrative Audit Trail": "ಆಡಳಿತಾತ್ಮಕ ಆಡಿಟ್ ಹಾದಿ",
    "Administrative Change Justification *": "ಆಡಳಿತಾತ್ಮಕ ಬದಲಾವಣೆ ಸಮರ್ಥನೆ *",
    "Administrative Status Management Audit Log": "ಆಡಳಿತಾತ್ಮಕ ಸ್ಥಿತಿ ನಿರ್ವಹಣಾ ಆಡಿಟ್ ಲಾಗ್",
    "administrator": "ನಿರ್ವಾಹಕ",
    "Administrator account": "ಆಡಳಿತಾಧಿಕಾರಿ ಖಾತೆ",
    "Administrator account": "ಆಡಳಿತಾಧಿಕಾರಿ ಖಾತೆ ()",
    "Administrator Account:": "ಆಡಳಿತಾಧಿಕಾರಿ ಖಾತೆ:",
    "AI": "ಎಐ",
    "AI ANALYTICS": "ಎಐ ವಿಶ್ಲೇಷಣೆ",
    "AI Intelligence": "ಎಐ ಗುಪ್ತಚರ",
    "AI Prioritized Grievances Register": "ಎಐ ಆದ್ಯತೆಯ ದೂರುಗಳ ನೋಂದಣಿ ವಹಿ",
    "AI Priority": "ಎಐ ಆದ್ಯತೆ",
    "AI Rationale": "ಎಐ ವಿವರಣೆ / ಕಾರಣ",
    "AI Supporting Document Verification": "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ದಾಖಲೆ ಪರಿಶೀಲನೆ",
    "AI Supporting Document Verification (Optional: Land Records / RTC, ID, Bills)": "ಎಐ ಪೂರಕ ದಾಖಲೆ ಪರಿಶೀಲನೆ (ಐಚ್ಛಿಕ: ಪಹಣಿ / ಆರ್‌ಟಿಸಿ, ಗುರುತಿನ ಚೀಟಿ, ಬಿಲ್‌ಗಳು)",
    "AI Voice": "ಧ್ವನಿ ಸಹಾಯಕ",
    "AI-directed automated routing across civic line departments.": "ನಾಗರಿಕ ಇಲಾಖೆಗಳಿಗೆ ಎಐ-ನಿರ್ದೇಶಿತ ಸ್ವಯಂಚಾಲಿತ ಹಂಚಿಕೆ.",
    "Alerts": "ಎಚ್ಚರಿಕೆಗಳು",
    "all": "ಎಲ್ಲಾ",
    "All 6 preliminary security checkpoints have been satisfied. When you click below, the system will enter maintenance mode, batch purge operational documents in 500-item chunks, and issue an immutable audit record.": "ಎಲ್ಲಾ 6 ಪ್ರಾಥಮಿಕ ಭದ್ರತಾ ಹಂತಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ. ಕೆಳಗೆ ಕ್ಲಿಕ್ ಮಾಡಿದಾಗ, ಸಿಸ್ಟಮ್ ನಿರ್ವಹಣಾ ಮೋಡ್‌ಗೆ ಪ್ರವೇಶಿಸಿ ದಾಖಲೆಗಳನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ ಮತ್ತು ಶಾಶ್ವತ ಆಡಿಟ್ ದಾಖಲೆಯನ್ನು ನೀಡುತ್ತದೆ.",
    "All 6/8-stage status progression histories": "ಎಲ್ಲಾ 6/8-ಹಂತದ ಸ್ಥಿತಿ ಪ್ರಗತಿ ಇತಿಹಾಸಗಳು",
    "all blocks / taluks": "ಎಲ್ಲಾ ತಾಲೂಕುಗಳು",
    "All Categories": "ಎಲ್ಲಾ ವರ್ಗಗಳು",
    "All citizen accounts and delivery logs": "ಎಲ್ಲಾ ನಾಗರಿಕ ಖಾತೆಗಳು ಮತ್ತು ರವಾನೆ ಲಾಗ್‌ಗಳು",
    "All citizen complaints and attachments": "ಎಲ್ಲಾ ನಾಗರಿಕ ದೂರುಗಳು ಮತ್ತು ಲಗತ್ತುಗಳು",
    "All citizen complaints and tracking IDs": "ಎಲ್ಲಾ ನಾಗರಿಕ ದೂರುಗಳು ಮತ್ತು ಟ್ರ್ಯಾಕಿಂಗ್ ಐಡಿಗಳು",
    "All citizen user accounts & profiles": "ಎಲ್ಲಾ ನಾಗರಿಕ ಬಳಕೆದಾರರ ಖಾತೆಗಳು ಮತ್ತು ಪ್ರೊಫೈಲ್‌ಗಳು",
    "All citizen, receiver, and admin profiles": "ಎಲ್ಲಾ ನಾಗರಿಕ, ಸ್ವೀಕೃತಿದಾರ ಮತ್ತು ಆಡಳಿತ ಪ್ರೊಫೈಲ್‌ಗಳು",
    "All complaint records, citizen details, photographic evidence, and chronological audit entries will be permanently expunged from Cloud Firestore and local storage.": "ಎಲ್ಲಾ ದೂರು ದಾಖಲೆಗಳು, ನಾಗರಿಕ ವಿವರಗಳು, ಛಾಯಾಚಿತ್ರ ಸಾಕ್ಷ್ಯಗಳು ಮತ್ತು ಆಡಿಟ್ ನಮೂದುಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗುತ್ತದೆ.",
    "All complaints, subcollections & review notes": "ಎಲ್ಲಾ ದೂರುಗಳು, ಉಪ-ಸಂಗ್ರಹಗಳು ಮತ್ತು ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿಗಳು",
    "All delivery logs (Email & WhatsApp logs)": "ಎಲ್ಲಾ ರವಾನೆ ಲಾಗ್‌ಗಳು (ಇಮೇಲ್ ಮತ್ತು ವಾಟ್ಸಾಪ್)",
    "all districts": "ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು",
    "All Folders": "ಎಲ್ಲಾ ಫೋಲ್ಡರ್‌ಗಳು",
    "All Gram Panchayat Receiver profiles": "ಎಲ್ಲಾ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸ್ವೀಕೃತಿದಾರರ ಪ್ರೊಫೈಲ್‌ಗಳು",
    "All Gram Panchayats": "ಎಲ್ಲಾ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳು",
    "all gram panchayats (configurable)": "ಎಲ್ಲಾ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳು (ಕಾನ್ಫಿಗರ್ ಮಾಡಬಹುದಾದ)",
    "all gram panchayats (hub)": "ಎಲ್ಲಾ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳು (ಕೇಂದ್ರ)",
    "all grievances": "ಎಲ್ಲಾ ದೂರುಗಳು",
    "All offline submission queues and cached complaints": "ಎಲ್ಲಾ ಆಫ್‌ಲೈನ್ ಸಲ್ಲಿಕೆ ಸರತಿಗಳು ಮತ್ತು ಸಂಗ್ರಹಿತ ದೂರುಗಳು",
    "All Panchayats": "ಎಲ್ಲಾ ಪಂಚಾಯತ್‌ಗಳು",
    "all rights reserved": "ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ",
    "all settings are stored in": "ಎಲ್ಲಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಸಂಗ್ರಹಿಸಲಾಗಿದೆ",
    "all statuses": "ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು",
    "All Statuses": "ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು",
    "All subcollections (status history, reviews, remarks)": "ಎಲ್ಲಾ ಉಪ-ಸಂಗ್ರಹಗಳು (ಸ್ಥಿತಿ ಇತಿಹಾಸ, ವಿಮರ್ಶೆಗಳು, ಟಿಪ್ಪಣಿಗಳು)",
    "all subsequent citizen complaints submitted across the portal will be dispatched to the new address immediately.": "ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸಲ್ಲಿಸಲಾಗುವ ಮುಂದಿನ ಎಲ್ಲಾ ನಾಗರಿಕ ದೂರುಗಳು ತಕ್ಷಣವೇ ಹೊಸ ವಿಳಾಸಕ್ಕೆ ರವಾನೆಯಾಗುತ್ತವೆ.",
    "All Updates": "ಎಲ್ಲಾ ನವೀಕರಣಗಳು",
    "Allocated to designated Panchayat grievance officer.": "ಗೊತ್ತುಪಡಿಸಿದ ಪಂಚಾಯತ್ ಕುಂದುಕೊರತೆ ಅಧಿಕಾರಿಗೆ ನಿಯೋಜಿಸಲಾಗಿದೆ.",
    "Allowed Next Statuses": "ಅನುಮತಿಸಲಾದ ಮುಂದಿನ ಸ್ಥಿತಿಗಳು",
    "Allowed Next Workflow Transitions & Permission Gates": "ಅನುಮತಿಸಲಾದ ಮುಂದಿನ ಕಾರ್ಯಪ್ರವಾಹ ಬದಲಾವಣೆಗಳು ಮತ್ತು ಅನುಮತಿಗಳು",
    "Allowed Transitions & Permission Gates Matrix": "ಅನುಮತಿಸಲಾದ ಬದಲಾವಣೆಗಳು ಮತ್ತು ಅನುಮತಿ ಮ್ಯಾಟ್ರಿಕ್ಸ್",
    "already have an account": "ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ",
    "already have an account?": "ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?",
    "an official notification email has been dispatched to the concerned panchayat receiver. you can track live progress at any time": "ಸಂಬಂಧಪಟ್ಟ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಗೆ ಅಧಿಕೃತ ಇಮೇಲ್ ಕಳುಹಿಸಲಾಗಿದೆ. ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ನೈಜ-ಸಮಯದ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು",
    "an official notification email has been dispatched to the concerned panchayat receiver. you can track live progress at any time.": "ಸಂಬಂಧಪಟ್ಟ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಗೆ ಅಧಿಕೃತ ಇಮೇಲ್ ಕಳುಹಿಸಲಾಗಿದೆ. ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ನೈಜ-ಸಮಯದ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು.",
    "Approve Document": "ದಾಖಲೆಯನ್ನು ಅನುಮೋದಿಸಿ",
    "Archived grievances removed from your active dashboard.": "ನಿಮ್ಮ ಸಕ್ರಿಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ತೆಗೆದುಹಾಕಲಾದ ದೂರುಗಳು.",
    "are you sure you want to change the primary grievance forwarding email address?": "ದೂರು ರವಾನೆಯ ಮುಖ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ಬದಲಾಯಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?",
    "are you sure you want to delete": "ನೀವು ಖಚಿತವಾಗಿ ಅಳಿಸಲು ಬಯಸುವಿರಾ",
    "Are you sure you want to permanently delete this complaint? This action cannot be undone.": "ಈ ದೂರನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಈ ಕ್ರಮವನ್ನು ಹಿಂಪಡೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    "Arm Execution Trigger →": "ಕಾರ್ಯಗತಗೊಳಿಸುವ ಟ್ರಿಗರ್ ಸಿದ್ಧಗೊಳಿಸಿ →",
    "Assigned": "ನಿಯೋಜಿಸಲಾಗಿದೆ",
    "Assigned & reviewed": "ನಿಯೋಜಿಸಲಾಗಿದೆ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "Assigned (Designated to Receiver)": "ನಿಯೋಜಿಸಲಾಗಿದೆ (ಸ್ವೀಕೃತಿದಾರರಿಗೆ ಗೊತ್ತುಪಡಿಸಲಾಗಿದೆ)",
    "Assigned Department": "ನಿಯೋಜಿತ ಇಲಾಖೆ",
    "assigned grievances": "ನಿಯೋಜಿತ ಕುಂದುಕೊರತೆಗಳು",
    "assigned panchayat": "ನಿಯೋಜಿತ ಪಂಚಾಯತ್",
    "Assigned Receiver": "ನಿಯೋಜಿತ ಸ್ವೀಕರಿಸುವವರು",
    "Atomically restores grievances, users, and audit records": "ದೂರುಗಳು, ಬಳಕೆದಾರರು ಮತ್ತು ಆಡಿಟ್ ದಾಖಲೆಗಳನ್ನು ಏಕಕಾಲದಲ್ಲಿ ಮರುಸ್ಥಾಪಿಸುತ್ತದೆ",
    "attach circular / document file (pdf, word, image, text)": "ಸುತ್ತೋಲೆ / ದಾಖಲೆ ಫೈಲ್ ಲಗತ್ತಿಸಿ (PDF, Word, ಚಿತ್ರ, ಪಠ್ಯ)",
    "attached circular / document": "ಲಗತ್ತಿಸಲಾದ ಸುತ್ತೋಲೆ / ದಾಖಲೆ",
    "attached circular / document:": "ಲಗತ್ತಿಸಲಾದ ಸುತ್ತೋಲೆ / ದಾಖಲೆ:",
    "Attached Evidence Photograph:": "ಲಗತ್ತಿಸಲಾದ ಸಾಕ್ಷ್ಯ ಛಾಯಾಚಿತ್ರ:",
    "attached photograph of issue": "ಲಗತ್ತಿಸಲಾದ ಸಮಸ್ಯೆಯ ಭಾವಚಿತ್ರ",
    "attached photograph of issue:": "ಲಗತ್ತಿಸಲಾದ ಸಮಸ್ಯೆಯ ಭಾವಚಿತ್ರ:",
    "Auditable log history of all municipal emergency data reset and recovery operations stored in": "ಎಲ್ಲಾ ತುರ್ತು ಡೇಟಾ ಮರುಹೊಂದಿಕೆ ಮತ್ತು ಮರುಪಡೆಯುವಿಕೆ ಕಾರ್ಯಾಚರಣೆಗಳ ಆಡಿಟ್ ಇತಿಹಾಸ ಸಂಗ್ರಹವಾಗಿದೆ:",
    "Authenticate Password →": "ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ →",
    "Authoritative administrative centre for operational grievance purge, complete factory reset, cryptographic snapshot creation, disaster recovery, and portal maintenance mode.": "ಕಾರ್ಯಾಚರಣಾ ದೂರು ತೆರವು, ಸಂಪೂರ್ಣ ಫ್ಯಾಕ್ಟರಿ ಮರುಹೊಂದಿಕೆ, ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ರಚನೆ, ವಿಪತ್ತು ಮರುಪಡೆಯುವಿಕೆ ಮತ್ತು ಪೋರ್ಟಲ್ ನಿರ್ವಹಣಾ ಮೋಡ್‌ಗಾಗಿ ಅಧಿಕೃತ ಆಡಳಿತ ಕೇಂದ್ರ.",
    "Authoritative grievance lifecycle stages, allowed transitions, role permissions, mandatory evidence & remarks, and notification triggers.": "ಅಧಿಕೃತ ದೂರು ಜೀವನಚಕ್ರ ಹಂತಗಳು, ಅನುಮತಿಸಲಾದ ಬದಲಾವಣೆಗಳು, ಪಾತ್ರ ಅನುಮತಿಗಳು, ಕಡ್ಡಾಯ ಸಾಕ್ಷ್ಯ, ಟಿಪ್ಪಣಿಗಳು ಮತ್ತು ಅಧಿಸೂಚನೆಗಳು.",
    "authorized & active": "ಅಧಿಕೃತ ಮತ್ತು ಸಕ್ರಿಯ",
    "Authorized Access:": "ಅಧಿಕೃತ ಪ್ರವೇಶ:",
    "Automatic Cryptographic Pre-Reset Snapshot created in Checkpoint 3.": "ಹಂತ 3 ರಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ರಚಿಸಲಾಗುತ್ತದೆ.",
    "Avg Resolution Time": "ಸರಾಸರಿ ಪರಿಹಾರ ಸಮಯ",
    "awaiting action": "ಕ್ರಮಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ",
    "Awaiting field action": "ಕ್ಷೇತ್ರ ಕ್ರಮಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ",
    "Awaiting initial assessment by receiver.": "ಸ್ವೀಕೃತಿದಾರರಿಂದ ಪ್ರಾರಂಭಿಕ ಮೌಲ್ಯಮಾಪನಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ.",
    "Back to Admin Dashboard": "ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    "back to login": "ಮರಳಿ ಲಾಗಿನ್‌ಗೆ",
    "backend smtp transmission is secured inside cloud functions.": "ಹಿನ್ನೆಲೆ SMTP ರವಾನೆಯನ್ನು Cloud Functions ಒಳಗೆ ಸುರಕ್ಷಿತಗೊಳಿಸಲಾಗಿದೆ.",
    "Background Color": "ಹಿನ್ನೆಲೆ ಬಣ್ಣ",
    "Backup": "ಬ್ಯಾಕಪ್",
    "Backup & Disaster Recovery Operations": "ಬ್ಯಾಕಪ್ ಮತ್ತು ವಿಪತ್ತು ಮರುಪಡೆಯುವಿಕೆ ಕಾರ್ಯಾಚರಣೆಗಳು",
    "Backup Engine": "ಬ್ಯಾಕಪ್ ಎಂಜಿನ್",
    "Backup Hash": "ಬ್ಯಾಕಪ್ ಹ್ಯಾಶ್",
    "Backup ID": "ಬ್ಯಾಕಪ್ ಐಡಿ",
    "Backup Identifier:": "ಬ್ಯಾಕಪ್ ಗುರುತು:",
    "Backup Verified • Proceed to Re-Auth →": "ಬ್ಯಾಕಪ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ • ಮರು-ದೃಢೀಕರಣಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ →",
    "Badge & Visual Style": "ಬ್ಯಾಡ್ಜ್ ಮತ್ತು ದೃಶ್ಯ ಶೈಲಿ",
    "Badge Color Styling": "ಬ್ಯಾಡ್ಜ್ ಬಣ್ಣ ಶೈಲಿ",
    "Bajpe": "ಬಜ್ಪೆ",
    "Bajpe Gram Panchayat": "ಬಜ್ಪೆ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Banner Image": "ಬ್ಯಾನರ್ ಚಿತ್ರ",
    "bantwal": "ಬಂಟ್ವಾಳ",
    "bantwal rural gram panchayat": "ಬಂಟ್ವಾಳ ಗ್ರಾಮೀಣ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "below:": "ಕೆಳಗೆ:",
    "belthangady": "ಬೆಳ್ತಂಗಡಿ",
    "belthangady gram panchayat": "ಬೆಳ್ತಂಗಡಿ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "bethoddy gp": "ಬೆತ್ತೋಡಿ ಜಿ.ಪಿ",
    "bethoddy gram panchayat": "ಬೆತ್ತೋಡಿ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "bethody gp": "ಬೆತ್ತೋಡಿ ಜಿ.ಪಿ",
    "bethody gram panchayat": "ಬೆತ್ತೋಡಿ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Bethody Panchayat Officer": "ಬೆತೋಡಿ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿ",
    "block / taluk": "ತಾಲೂಕು",
    "Border Color": "ಬಾರ್ಡರ್ ಬಣ್ಣ",
    "brahmavar gram panchayat": "ಬ್ರಹ್ಮಾವರ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Brief explanation displayed in tracking status indicators and citizen portal...": "ಟ್ರ್ಯಾಕಿಂಗ್ ಸ್ಥಿತಿ ಸೂಚಕಗಳು ಮತ್ತು ನಾಗರಿಕ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ತೋರಿಸುವ ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ...",
    "Browse from computer or mobile (Max 10MB)": "ಕಂಪ್ಯೂಟರ್ ಅಥವಾ ಮೊಬೈಲ್‌ನಿಂದ ಆಯ್ಕೆಮಾಡಿ (ಗರಿಷ್ಠ 10MB)",
    "by complaint id": "ದೂರು ಐಡಿ ಮೂಲಕ",
    "by email": "ಇಮೇಲ್ ಮೂಲಕ",
    "Cached Complaints": "ಸಂಗ್ರಹಿಸಿದ ದೂರುಗಳು",
    "Calculating resolution rate...": "ಪರಿಹಾರ ದರವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ...",
    "camera unavailable": "ಕ್ಯಾಮೆರಾ ಲಭ್ಯವಿಲ್ಲ",
    "cancel": "ರದ್ದುಮಾಡಿ",
    "Cancel & Keep Quarantined": "ರದ್ದುಮಾಡಿ ಮತ್ತು ಕ್ವಾರಂಟೈನ್‌ನಲ್ಲಿಡಿ",
    "Cancel and Close": "ರದ್ದುಮಾಡಿ ಮತ್ತು ಮುಚ್ಚಿ",
    "capture a live photograph using your device camera": "ನಿಮ್ಮ ಸಾಧನದ ಕ್ಯಾಮೆರಾ ಬಳಸಿ ಲೈವ್ ಫೋಟೋ ತೆಗೆಯಿರಿ",
    "capture photo": "ಫೋಟೋ ತೆಗೆಯಿರಿ",
    "Capture Photograph": "ಛಾಯಾಚಿತ್ರ ಸೆರೆಹಿಡಿಯಿರಿ",
    "category": "ವರ್ಗ",
    "CATEGORY A": "ವರ್ಗ ಎ",
    "CATEGORY B": "ವರ್ಗ ಬಿ",
    "CATEGORY C": "ವರ್ಗ ಸಿ",
    "CATEGORY D": "ವರ್ಗ ಡಿ",
    "CATEGORY E": "ವರ್ಗ ಇ",
    "CATEGORY F": "ವರ್ಗ ಎಫ್",
    "Category Filter": "ವರ್ಗ ಫಿಲ್ಟರ್",
    "Category-wise Complaint Distribution": "ವರ್ಗವಾರು ದೂರು ಹಂಚಿಕೆ",
    "Centralized grievance management, official citizen response dispatch, 8-stage lifecycle tracking, and Gram Panchayat workload monitoring.": "ಕೇಂದ್ರೀಕೃತ ದೂರು ನಿರ್ವಹಣೆ, ಅಧಿಕೃತ ನಾಗರಿಕ ಪ್ರತಿಕ್ರಿಯೆ, 8-ಹಂತದ ಜೀವನಚಕ್ರ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕೆಲಸದ ಮೇಲ್ವಿಚಾರಣೆ.",
    "Centralized grievance management, official response dispatch, dynamic lifecycle tracking, system configuration, and Gram Panchayat workload monitoring.": "ಕೇಂದ್ರೀಕೃತ ದೂರು ನಿರ್ವಹಣೆ, ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ ರವಾನೆ, ಡೈನಾಮಿಕ್ ಜೀವನಚಕ್ರ ಟ್ರ್ಯಾಕಿಂಗ್, ಸಿಸ್ಟಮ್ ಕಾನ್ಫಿಗರೇಶನ್ ಮತ್ತು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಾರ್ಯಭಾರದ ಮೇಲ್ವಿಚಾರಣೆ.",
    "Centralized permanent repository of every grievance update, official response, and lifecycle progression.": "ಪ್ರತಿ ದೂರಿನ ನವೀಕರಣ, ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ ಮತ್ತು ಜೀವನಚಕ್ರ ಪ್ರಗತಿಯ ಕೇಂದ್ರೀಕೃತ ಶಾಶ್ವತ ಸಂಗ್ರಹ.",
    "Change Grievance Status": "ದೂರಿನ ಸ್ಥಿತಿ ಬದಲಾಯಿಸಿ",
    "change photo": "ಫೋಟೋ ಬದಲಾಯಿಸಿ",
    "check the real-time progress of your complaint": "ನಿಮ್ಮ ದೂರಿನ ನೈಜ-ಸಮಯದ ಪ್ರಗತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ",
    "check the real-time progress of your complaint.": "ನಿಮ್ಮ ದೂರಿನ ನೈಜ-ಸಮಯದ ಪ್ರಗತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "check the real-time progress of your submitted complaint using your complaint id or email": "ನಿಮ್ಮ ದೂರು ಐಡಿ ಅಥವಾ ಇಮೇಲ್ ಬಳಸಿ ನಿಮ್ಮ ಸಲ್ಲಿಸಿದ ದೂರಿನ ನೈಜ-ಸಮಯದ ಪ್ರಗತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ",
    "check the real-time progress of your submitted complaint using your complaint id or email.": "ನಿಮ್ಮ ದೂರು ಐಡಿ ಅಥವಾ ಇಮೇಲ್ ಬಳಸಿ ನಿಮ್ಮ ಸಲ್ಲಿಸಿದ ದೂರಿನ ನೈಜ-ಸಮಯದ ಪ್ರಗತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "check the real-time status until it is resolved": "ಪರಿಹಾರವಾಗುವವರೆಗೆ ನೈಜ-ಸಮಯದ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ",
    "check your complaint status": "ನಿಮ್ಮ ದೂರಿನ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ",
    "Checkpoint 1: Verify Reset Scope": "ಹಂತ 1: ಮರುಹೊಂದಿಕೆ ವ್ಯಾಪ್ತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ",
    "Checkpoint 2: Live Impact Assessment": "ಹಂತ 2: ನೇರ ಪರಿಣಾಮ ಮೌಲ್ಯಮಾಪನ",
    "Checkpoint 3: Cryptographic Pre-Reset Backup": "ಹಂತ 3: ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಬ್ಯಾಕಪ್",
    "Checkpoint 4: Fresh Administrator Re-Authentication": "ಹಂತ 4: ಹೊಸ ಆಡಳಿತಾಧಿಕಾರಿ ಮರು-ದೃಢೀಕರಣ",
    "Checkpoint 5: Security Phrase Confirmation": "ಹಂತ 5: ಭದ್ರತಾ ಪದಗುಚ್ಛ ದೃಢೀಕರಣ",
    "Checkpoint 6: Scope & Consequences Acknowledgment": "ಹಂತ 6: ವ್ಯಾಪ್ತಿ ಮತ್ತು ಪರಿಣಾಮಗಳ ಒಪ್ಪಿಗೆ",
    "Checkpoint 7: Final Armed Confirmation": "ಹಂತ 7: ಅಂತಿಮ ಸಿದ್ಧ ದೃಢೀಕರಣ",
    "Choose a different image file": "ಬೇರೆ ಚಿತ್ರ ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ",
    "choose a photo": "ಭಾವಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "Chronological register of your grievances with live work progress tracking and official responses.": "ನೇರ ಕೆಲಸದ ಪ್ರಗತಿ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳೊಂದಿಗೆ ನಿಮ್ಮ ದೂರುಗಳ ಕಾಲಾನುಕ್ರಮದ ನೋಂದಣಿ ವಹಿ.",
    "citizen": "ನಾಗರಿಕ",
    "Citizen & Official Description": "ನಾಗರಿಕ ಮತ್ತು ಅಧಿಕೃತ ವಿವರಣೆ",
    "Citizen account profiles": "ನಾಗರಿಕ ಖಾತೆ ಪ್ರೊಫೈಲ್‌ಗಳು",
    "Citizen Accounts": "ನಾಗರಿಕ ಖಾತೆಗಳು",
    "Citizen accounts and citizen grievances": "ನಾಗರಿಕ ಖಾತೆಗಳು ಮತ್ತು ನಾಗರಿಕ ದೂರುಗಳು",
    "citizen acknowledgement copy": "ನಾಗರಿಕ ಸ್ವೀಕೃತಿ ಪ್ರತಿ",
    "citizen details": "ನಾಗರಿಕರ ವಿವರಗಳು",
    "Citizen Grievance Dashboard": "ನಾಗರಿಕರ ಕುಂದುಕೊರತೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "Citizen Grievance Dashboard – JANASEVA Portal": "ನಾಗರಿಕರ ಕುಂದುಕೊರತೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ – ಜನಸೇವಾ ಪೋರ್ಟಲ್",
    "citizen grievance redressal at the village level": "ಗ್ರಾಮ ಮಟ್ಟದಲ್ಲಿ ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ನಿವಾರಣೆ",
    "Citizen Grievances": "ನಾಗರಿಕರ ದೂರುಗಳು",
    "Citizen messages & Official responses": "ನಾಗರಿಕರ ಸಂದೇಶಗಳು ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳು",
    "citizen name": "ನಾಗರಿಕರ ಹೆಸರು",
    "Citizen requested grievance withdrawal": "ನಾಗರಿಕರು ದೂರು ಹಿಂಪಡೆಯಲು ವಿನಂತಿಸಿದ್ದಾರೆ",
    "Citizen UID": "ನಾಗರಿಕ ಯುಐಡಿ",
    "Citizen, Receiver, and Administrator accounts": "ನಾಗರಿಕ, ಸ್ವೀಕೃತಿದಾರ ಮತ್ತು ಆಡಳಿತಾಧಿಕಾರಿ ಖಾತೆಗಳು",
    "CITIZENS": "ನಾಗರಿಕರು",
    "civic issues": "ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳು",
    "Clarification Required: Additional landmark/details requested": "ಸ್ಪಷ್ಟೀಕರಣ ಅಗತ್ಯವಿದೆ: ಹೆಚ್ಚುವರಿ ಸ್ಥಳ/ವಿವರಗಳನ್ನು ಕೋರಲಾಗಿದೆ",
    "cleanliness": "ಸ್ವಚ್ಛತೆ",
    "Clear Audit Trail": "ಆಡಿಟ್ ಟ್ರೇಲ್ ತೆರವುಗೊಳಿಸಿ",
    "Clear Email Delivery Audit History": "ಇಮೇಲ್ ರವಾನೆ ಆಡಿಟ್ ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಿ",
    "Clear Filters": "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
    "Clear Grievance Records": "ದೂರು ದಾಖಲೆಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
    "Clear Grievances (Cat B)": "ದೂರುಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ (ವರ್ಗ ಬಿ)",
    "Clear History": "ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಿ",
    "Clear Ledger": "ಲೆಡ್ಜರ್ ತೆರವುಗೊಳಿಸಿ",
    "Clear Selection": "ಆಯ್ಕೆ ತೆರವುಗೊಳಿಸಿ",
    "Clear Temporary Data": "ತಾತ್ಕಾಲಿಕ ಡೇಟಾ ತೆರವುಗೊಳಿಸಿ",
    "Clear Temporary Data (Cat A)": "ತಾತ್ಕಾಲಿಕ ಡೇಟಾ ತೆರವುಗೊಳಿಸಿ (ವರ್ಗ ಎ)",
    "Click or drag and drop to choose an image from device": "ಸಾಧನದಿಂದ ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಎಳೆದು ಬಿಡಿ",
    "click to fill demo credentials": "ಡೆಮೊ ರುಜುವಾತುಗಳನ್ನು ಭರ್ತಿ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    "Click to view full image": "ಪೂರ್ಣ ಚಿತ್ರವನ್ನು ವೀಕ್ಷಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    "clogged drainage channel desilted before monsoon. wastewater flow restored smoothly": "ಮುಂಗಾರಿಗೆ ಮುನ್ನ ಚರಂಡಿ ಹೂಳೆತ್ತಲಾಗಿದೆ. ತ್ಯಾಜ್ಯ ನೀರು ಸರಾಗವಾಗಿ ಹರಿಯುವಂತೆ ಮಾಡಲಾಗಿದೆ",
    "clogged drainage channel desilted before monsoon. wastewater flow restored smoothly.": "ಮುಂಗಾರಿಗೆ ಮುನ್ನ ಚರಂಡಿ ಹೂಳೆತ್ತಲಾಗಿದೆ. ತ್ಯಾಜ್ಯ ನೀರು ಸರಾಗವಾಗಿ ಹರಿಯುವಂತೆ ಮಾಡಲಾಗಿದೆ.",
    "close": "ಮುಚ್ಚಿ",
    "Close Camera (Esc)": "ಕ್ಯಾಮೆರಾ ಮುಚ್ಚಿ (Esc)",
    "CLOUD FIRESTORE": "ಕ್ಲೌಡ್ ಫೈರ್‌ಸ್ಟೋರ್",
    "cloud firestore protected": "Cloud Firestore ಮೂಲಕ ರಕ್ಷಿಸಲಾಗಿದೆ",
    "cloud firestore security": "Cloud Firestore ಭದ್ರತೆ",
    "Comments / Feedback": "ಕಾಮೆಂಟ್‌ಗಳು / ಪ್ರತಿಕ್ರಿಯೆ",
    "community hall ceiling repaired and painted. public booking reopened for villagers": "ಸಮುದಾಯ ಭವನದ ಮೇಲ್ಛಾವಣಿ ದುರಸ್ತಿ ಮಾಡಿ ಬಣ್ಣ ಬಳಿಯಲಾಗಿದೆ. ಗ್ರಾಮಸ್ಥರಿಗೆ ಸಾರ್ವಜನಿಕ ಬುಕಿಂಗ್ ಪುನರಾರಂಭಿಸಲಾಗಿದೆ",
    "community hall ceiling repaired and painted. public booking reopened for villagers.": "ಸಮುದಾಯ ಭವನದ ಮೇಲ್ಛಾವಣಿ ದುರಸ್ತಿ ಮಾಡಿ ಬಣ್ಣ ಬಳಿಯಲಾಗಿದೆ. ಗ್ರಾಮಸ್ಥರಿಗೆ ಸಾರ್ವಜನಿಕ ಬುಕಿಂಗ್ ಪುನರಾರಂಭಿಸಲಾಗಿದೆ.",
    "complaint category": "ದೂರಿನ ವರ್ಗ",
    "Complaint Complete Update History & Audit Trail": "ದೂರಿನ ಸಂಪೂರ್ಣ ನವೀಕರಣ ಇತಿಹಾಸ ಮತ್ತು ಆಡಿಟ್ ಟ್ರೇಲ್",
    "complaint details": "ದೂರಿನ ವಿವರಗಳು",
    "complaint details & status update": "ದೂರಿನ ವಿವರಗಳು ಮತ್ತು ಸ್ಥಿತಿ ನವೀಕರಣ",
    "complaint email recipient settings": "ದೂರು ಇಮೇಲ್ ಸ್ವೀಕೃತಿದಾರರ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "complaint id": "ದೂರು ಐಡಿ",
    "complaint ref": "ದೂರು ಸಂಖ್ಯೆ",
    "Complaint Register": "ದೂರುಗಳ ನೋಂದಣಿ ವಹಿ",
    "complaint resolution notification": "ದೂರು ಪರಿಹಾರ ಅಧಿಸೂಚನೆ",
    "Complaint Status & Workflow Rules": "ದೂರಿನ ಸ್ಥಿತಿ ಮತ್ತು ಕಾರ್ಯಪ್ರವಾಹ ನಿಯಮಗಳು",
    "complaint status tracker": "ದೂರು ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕರ್",
    "complaint status update notification": "ದೂರು ಸ್ಥಿತಿ ಅಪ್‌ಡೇಟ್ ಅಧಿಸೂಚನೆ",
    "complaint submitted successfully": "ದೂರು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ",
    "Complaint Title": "ದೂರಿನ ಶೀರ್ಷಿಕೆ",
    "Complaint Updates Folder": "ದೂರು ನವೀಕರಣಗಳ ಫೋಲ್ಡರ್",
    "COMPLAINTS": "ದೂರುಗಳು",
    "Complaints Filed": "ಸಲ್ಲಿಸಲಾದ ದೂರುಗಳು",
    "Complaints moved to Deleted History are safely archived. Official audit trails and receiver records remain permanently intact. You can restore eligible complaints back to active tracking at any time.": "ಅಳಿಸಿದ ಇತಿಹಾಸಕ್ಕೆ ಸರಿಸಿದ ದೂರುಗಳು ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲ್ಪಡುತ್ತವೆ. ಅಧಿಕೃತ ಆಡಿಟ್ ದಾಖಲೆಗಳು ಶಾಶ್ವತವಾಗಿ ಉಳಿಯುತ್ತವೆ. ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಅರ್ಹ ದೂರುಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಬಹುದು.",
    "Complaints ranked by algorithmic severity, impact scope, and emergency classification.": "ತೀವ್ರತೆ, ಪರಿಣಾಮದ ವ್ಯಾಪ್ತಿ ಮತ್ತು ತುರ್ತು ವರ್ಗೀಕರಣದ ಆಧಾರದ ಮೇಲೆ ದೂರುಗಳನ್ನು ಶ್ರೇಣೀಕರಿಸಲಾಗಿದೆ.",
    "Complete & View Dashboard": "ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನೋಡಿ",
    "complete activity timeline": "ಸಂಪೂರ್ಣ ಚಟುವಟಿಕೆಯ ಸಮಯರೇಖೆ",
    "complete complaint history list": "ಸಂಪೂರ್ಣ ದೂರು ಇತಿಹಾಸ ಪಟ್ಟಿ",
    "Complete factory reset baseline. Purges all operational data & citizen registrations. Super Admin is strictly preserved.": "ಸಂಪೂರ್ಣ ಫ್ಯಾಕ್ಟರಿ ಮರುಹೊಂದಿಕೆ. ಎಲ್ಲಾ ಕಾರ್ಯಾಚರಣಾ ಡೇಟಾ ಮತ್ತು ನಾಗರಿಕ ನೋಂದಣಿಗಳನ್ನು ಅಳಿಸುತ್ತದೆ. ಸೂಪರ್ ಆಡಳಿತ ಸುರಕ್ಷಿತವಾಗಿರುತ್ತದೆ.",
    "Complete ledger": "ಸಂಪೂರ್ಣ ಲೆಡ್ಜರ್",
    "COMPLETE RESET": "ಸಂಪೂರ್ಣ ಮರುಹೊಂದಿಕೆ",
    "Complete System Factory Reset": "ಸಂಪೂರ್ಣ ಸಿಸ್ಟಮ್ ಫ್ಯಾಕ್ಟರಿ ಮರುಹೊಂದಿಕೆ",
    "Complete System Reset": "ಸಂಪೂರ್ಣ ಸಿಸ್ಟಮ್ ಮರುಹೊಂದಿಕೆ",
    "Completed": "ಪೂರ್ಣಗೊಂಡಿದೆ",
    "completed & verified": "ಪೂರ್ಣಗೊಂಡ ಮತ್ತು ಪರಿಶೀಲಿಸಿದ",
    "Completed & Verified": "ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "Completed and Verified": "ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "Completed Work": "ಪೂರ್ಣಗೊಂಡ ಕೆಲಸ",
    "Completion Percentage (0–100%)": "ಪೂರ್ಣಗೊಂಡ ಶೇಕಡಾವಾರು (0–100%)",
    "Comprehensive personal analytics and grievance resolution performance metrics.": "ಸಮಗ್ರ ವೈಯಕ್ತಿಕ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ದೂರು ಪರಿಹಾರ ಕಾರ್ಯಕ್ಷಮತೆ ಅಂಕಿಅಂಶಗಳು.",
    "Computing...": "ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "configure emailjs parameters and cloud functions smtp transport status.": "EmailJS ನಿಯತಾಂಕಗಳು ಮತ್ತು Cloud Functions SMTP ಸಾರಿಗೆ ಸ್ಥಿತಿಯನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ.",
    "configure grievance notification delivery, manage target panchayat recipient email addresses, and inspect delivery audit history.": "ಕುಂದುಕೊರತೆ ಅಧಿಸೂಚನೆ ವಿತರಣೆಯನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ, ಗ್ರಾಮ ಪಂಚಾಯತ್ ಇಮೇಲ್ ವಿಳಾಸಗಳನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ವಿತರಣಾ ಇತಿಹಾಸವನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "configure the email receiver and emailjs details to send complaints from this website to your gram panchayat": "ಈ ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗೆ ದೂರುಗಳನ್ನು ಕಳುಹಿಸಲು ಇಮೇಲ್ ಸ್ವೀಕೃತಿದಾರ ಮತ್ತು EmailJS ವಿವರಗಳನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ",
    "configure the email receiver and emailjs details to send complaints from this website to your gram panchayat.": "ಈ ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗೆ ದೂರುಗಳನ್ನು ಕಳುಹಿಸಲು ಇಮೇಲ್ ಸ್ವೀಕೃತಿದಾರ ಮತ್ತು EmailJS ವಿವರಗಳನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ.",
    "Configured Grievance Lifecycle Statuses": "ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾದ ದೂರು ಜೀವನಚಕ್ರ ಸ್ಥಿತಿಗಳು",
    "confirm deletion": "ಅಳಿಸುವಿಕೆಯನ್ನು ದೃಢೀಕರಿಸಿ",
    "Confirm Mode & View Impact →": "ಮೋಡ್ ದೃಢೀಕರಿಸಿ ಮತ್ತು ಪರಿಣಾಮ ನೋಡಿ →",
    "confirm move to deleted history": "ಅಳಿಸಿದ ಇತಿಹಾಸಕ್ಕೆ ಸರಿಸಲು ದೃಢೀಕರಿಸಿ",
    "confirm new email address": "ಹೊಸ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ದೃಢೀಕರಿಸಿ",
    "confirm password": "ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
    "confirm recipient email change": "ಸ್ವೀಕೃತಿದಾರರ ಇಮೇಲ್ ಬದಲಾವಣೆಯನ್ನು ದೃಢೀಕರಿಸಿ",
    "Confirmation of resolution and sign-off...": "ಪರಿಹಾರ ಮತ್ತು ಅಂತಿಮ ಅನುಮೋದನೆಯ ದೃಢೀಕರಣ...",
    "Confirmation phrase required.": "ದೃಢೀಕರಣ ಪದಗುಚ್ಛ ಅಗತ್ಯವಿದೆ.",
    "connect your emailjs account to enable sending emails from the website": "ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ಇಮೇಲ್‌ಗಳನ್ನು ಕಳುಹಿಸಲು ನಿಮ್ಮ EmailJS ಖಾತೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ",
    "connect your emailjs account to enable sending emails from the website.": "ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ಇಮೇಲ್‌ಗಳನ್ನು ಕಳುಹಿಸಲು ನಿಮ್ಮ EmailJS ಖಾತೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    "connected": "ಸಂಪರ್ಕಗೊಂಡಿದೆ",
    "Consistent": "ಹೊಂದಾಣಿಕೆಯಾಗಿದೆ",
    "contact details": "ಸಂಪರ್ಕ ವಿವರಗಳು",
    "contact number": "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ",
    "contact your respective gram panchayat office for more details or citizen welfare services": "ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಅಥವಾ ನಾಗರಿಕ ಕಲ್ಯಾಣ ಸೇವೆಗಳಿಗಾಗಿ ನಿಮ್ಮ ಸಂಬಂಧಪಟ್ಟ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ",
    "contact your respective gram panchayat office for more details or citizen welfare services.": "ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಅಥವಾ ನಾಗರಿಕ ಕಲ್ಯಾಣ ಸೇವೆಗಳಿಗಾಗಿ ನಿಮ್ಮ ಸಂಬಂಧಪಟ್ಟ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    "Control Centre": "ನಿಯಂತ್ರಣ ಕೇಂದ್ರ",
    "coverage": "ವ್ಯಾಪ್ತಿ",
    "create a password (min 6 chars)": "ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿ (ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು)",
    "create a service": "ಸರ್ವಿಸ್ ರಚಿಸಿ",
    "create a template": "ಟೆಂಪ್ಲೇಟ್ ರಚಿಸಿ",
    "create an account": "ಖಾತೆ ರಚಿಸಿ",
    "Create Backup Snapshot Now": "ಈಗಲೇ ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ರಚಿಸಿ",
    "create your account using your mobile number or email": "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್ ಬಳಸಿ ಖಾತೆ ರಚಿಸಿ",
    "create your account with mobile or email": "ಮೊಬೈಲ್ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    "create your personal janaseva account to submit and track grievances": "ಕುಂದುಕೊರತೆಗಳನ್ನು ಸಲ್ಲಿಸಲು ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಜನಸೇವಾ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    "create your personal janaseva account to submit and track grievances.": "ಕುಂದುಕೊರತೆಗಳನ್ನು ಸಲ್ಲಿಸಲು ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಜನಸೇವಾ ಖಾತೆಯನ್ನು ರಚಿಸಿ.",
    "Created At": "ರಚಿಸಿದ ಸಮಯ",
    "creating account": "ಖಾತೆ ರಚಿಸಲಾಗುತ್ತಿದೆ",
    "creating account...": "ಖಾತೆ ರಚಿಸಲಾಗುತ್ತಿದೆ...",
    "credential hygiene": "ರುಜುವಾತುಗಳ ಭದ್ರತೆ",
    "Cryptographic Pre-Reset Snapshots & Disaster Recovery": "ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ಗಳು ಮತ್ತು ವಿಪತ್ತು ಮರುಪಡೆಯುವಿಕೆ",
    "Cryptographically logged history of all additions, modifications, archival, and deletions of status configurations.": "ಸ್ಥಿತಿ ಕಾನ್ಫಿಗರೇಶನ್‌ಗಳ ಎಲ್ಲಾ ಸೇರ್ಪಡೆ, ಬದಲಾವಣೆ, ಆರ್ಕೈವ್ ಮತ್ತು ಅಳಿಸುವಿಕೆಗಳ ದಾಖಲಿತ ಇತಿಹಾಸ.",
    "Current Active Banner:": "ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ ಬ್ಯಾನರ್:",
    "current active delivery recipient": "ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ ವಿತರಣಾ ಸ್ವೀಕೃತಿದಾರರು",
    "Current Active Status": "ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ ಸ್ಥಿತಿ",
    "Current Administrator Password": "ಪ್ರಸ್ತುತ ಆಡಳಿತಾಧಿಕಾರಿ ಪಾಸ್‌ವರ್ಡ್",
    "Current Count": "ಪ್ರಸ್ತುತ ಸಂಖ್ಯೆ",
    "current file": "ಪ್ರಸ್ತುತ ಫೈಲ್",
    "current file:": "ಪ್ರಸ್ತುತ ಫೈಲ್:",
    "current recipient:": "ಪ್ರಸ್ತುತ ಸ್ವೀಕೃತಿದಾರರು:",
    "current status": "ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ",
    "currently processing": "ಪ್ರಸ್ತುತ ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    "Custom receiver settings and notification preferences": "ಕಸ್ಟಮ್ ಸ್ವೀಕೃತಿದಾರರ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ಅಧಿಸೂಚನೆ ಆದ್ಯತೆಗಳು",
    "dakshina kannada": "ದಕ್ಷಿಣ ಕನ್ನಡ",
    "Dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "Database & Backups": "ಡೇಟಾಬೇಸ್ ಮತ್ತು ಬ್ಯಾಕಪ್‌ಗಳು",
    "date": "ದಿನಾಂಕ",
    "date & time": "ದಿನಾಂಕ ಮತ್ತು ಸಮಯ",
    "date submitted": "ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ",
    "Deactivate Maintenance Mode": "ನಿರ್ವಹಣಾ ಮೋಡ್ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ",
    "default (all gram panchayats fallback)": "ಡೀಫಾಲ್ಟ್ (ಎಲ್ಲಾ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳ ಫಾಲ್‌ಬ್ಯಾಕ್)",
    "Defines valid state transitions, mandatory remarks, evidence enforcement, receiver requirements, and role restrictions.": "ಮಾನ್ಯ ಸ್ಥಿತಿ ಬದಲಾವಣೆಗಳು, ಕಡ್ಡಾಯ ಟಿಪ್ಪಣಿಗಳು, ಸಾಕ್ಷ್ಯ ನಿಯಮಗಳು, ಸ್ವೀಕೃತಿದಾರರ ಅಗತ್ಯಗಳು ಮತ್ತು ಪಾತ್ರ ನಿರ್ಬಂಧಗಳನ್ನು ವ್ಯಾಖ್ಯಾನಿಸುತ್ತದೆ.",
    "Delete": "ಅಳಿಸು",
    "delete": "ಅಳಿಸಿ",
    "Delete Complaint": "ದೂರು ಅಳಿಸಿ",
    "delete gram panchayat": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಳಿಸಿ",
    "Delete Grievance": "ದೂರು ಅಳಿಸಿ",
    "Delete Image": "ಚಿತ್ರ ಅಳಿಸಿ",
    "Delete Snapshot": "ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಅಳಿಸಿ",
    "Delete this complaint permanently": "ಈ ದೂರನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ",
    "Deleted By": "ಅಳಿಸಿದವರು",
    "Deleted By & Reason": "ಅಳಿಸಿದವರು ಮತ್ತು ಕಾರಣ",
    "deleted complaints": "ಅಳಿಸಲಾದ ದೂರುಗಳು",
    "Deleted Complaints Archive": "ಅಳಿಸಲಾದ ದೂರುಗಳ ಆರ್ಕೈವ್",
    "Deleted On": "ಅಳಿಸಿದ ದಿನಾಂಕ",
    "Deleted Timestamp": "ಅಳಿಸಿದ ಸಮಯ",
    "Deleting a grievance from the primary register safely moves it into this quarantine vault. Citizen information, uploaded photos, and chronological audit entries remain fully intact. Records can be restored at any time or permanently eradicated with multi-step authorization.": "ಮುಖ್ಯ ನೋಂದಣಿ ವಹಿಯಿಂದ ದೂರನ್ನು ಅಳಿಸಿದರೆ ಅದು ಸುರಕ್ಷಿತವಾಗಿ ಈ ಕ್ವಾರಂಟೈನ್ ವಾಲ್ಟ್‌ಗೆ ಸೇರುತ್ತದೆ. ನಾಗರಿಕರ ವಿವರಗಳು, ಫೋಟೋಗಳು ಮತ್ತು ಆಡಿಟ್ ದಾಖಲೆಗಳು ಸುರಕ್ಷಿತವಾಗಿರುತ್ತವೆ.",
    "Deletion Date": "ಅಳಿಸಿದ ದಿನಾಂಕ",
    "Deletion Reason": "ಅಳಿಸಿದ ಕಾರಣ",
    "delivered": "ತಲುಪಿಸಲಾಗಿದೆ",
    "delivery failure alert": "ವಿತರಣಾ ವೈಫಲ್ಯ ಎಚ್ಚರಿಕೆ",
    "demo accounts": "ಡೆಮೊ ಖಾತೆಗಳು",
    "Department Redressal Allocation": "ಇಲಾಖಾ ಪರಿಹಾರ ಹಂಚಿಕೆ",
    "describe the issue and upload a photo": "ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "describe the problem": "ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ",
    "describe the problem *": "ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ *",
    "describe your issue and upload a photo": "ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "describe your issue, select category and upload photos": "ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ, ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "description": "ವಿವರಣೆ",
    "Detail reason for reopening this grievance...": "ಈ ದೂರನ್ನು ಮರುತೆರೆಯಲು ವಿವರವಾದ ಕಾರಣ...",
    "detail the action taken, department assigned, inspection results, or resolution notes": "ಕೈಗೊಂಡ ಕ್ರಮ, ನಿಯೋಜಿಸಲಾದ ಇಲಾಖೆ, ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶಗಳು ಅಥವಾ ಪರಿಹಾರ ಟಿಪ್ಪಣಿಗಳನ್ನು ವಿವರಿಸಿ",
    "detail the action taken, department assigned, inspection results, or resolution notes...": "ಕೈಗೊಂಡ ಕ್ರಮ, ನಿಯೋಜಿಸಲಾದ ಇಲಾಖೆ, ಪರಿಶೀಲನಾ ಫಲಿತಾಂಶಗಳು ಅಥವಾ ಪರಿಹಾರ ಟಿಪ್ಪಣಿಗಳನ್ನು ವಿವರಿಸಿ...",
    "Detail why the issue remains unresolved or what additional action is required on site...": "ಸಮಸ್ಯೆ ಏಕೆ ಬಗೆಹರಿದಿಲ್ಲ ಅಥವಾ ಸ್ಥಳದಲ್ಲಿ ಯಾವ ಹೆಚ್ಚುವರಿ ಕ್ರಮದ ಅಗತ್ಯವಿದೆ ಎಂದು ವಿವರಿಸಿ...",
    "Details": "ವಿವರಗಳು",
    "digital grievance initiative": "ಡಿಜಿಟಲ್ ಕುಂದುಕೊರತೆ ಉಪಕ್ರಮ",
    "digital grievance management system": "ಡಿಜಿಟಲ್ ಕುಂದುಕೊರತೆ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ",
    "Digital Grievance Redressal Platform": "ಡಿಜಿಟಲ್ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ವೇದಿಕೆ",
    "directory": "ಡೈರೆಕ್ಟರಿ",
    "Disaster recovery restoration. Reinstates system state from a verified pre-reset snapshot with SHA-256 validation.": "ವಿಪತ್ತು ಮರುಪಡೆಯುವಿಕೆ. SHA-256 ಪರಿಶೀಲನೆಯೊಂದಿಗೆ ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ನಿಂದ ಸಿಸ್ಟಮ್ ಸ್ಥಿತಿಯನ್ನು ಮರುಸ್ಥಾಪಿಸುತ್ತದೆ.",
    "Discard and close": "ತಿರಸ್ಕರಿಸಿ ಮತ್ತು ಮುಚ್ಚಿ",
    "Discard this capture and retake": "ಈ ಚಿತ್ರವನ್ನು ತಿರಸ್ಕರಿಸಿ ಮತ್ತು ಮತ್ತೆ ತೆಗೆಯಿರಿ",
    "dispatch automated tracking receipt emails to citizens upon successful complaint filing.": "ದೂರು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾದಾಗ ನಾಗರಿಕರಿಗೆ ಸ್ವಯಂಚಾಲಿತ ಟ್ರ್ಯಾಕಿಂಗ್ ರಶೀದಿ ಇಮೇಲ್‌ಗಳನ್ನು ಕಳುಹಿಸಿ.",
    "district": "ಜಿಲ್ಲೆ",
    "do not share your emailjs keys publicly": "ನಿಮ್ಮ EmailJS ಕೀಲಿಗಳನ್ನು ಸಾರ್ವಜನಿಕವಾಗಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ",
    "do not share your emailjs keys publicly.": "ನಿಮ್ಮ EmailJS ಕೀಲಿಗಳನ್ನು ಸಾರ್ವಜನಿಕವಾಗಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
    "Document.pdf": "ದಾಖಲೆ.ಪಿಡಿಎಫ್",
    "don't have an account": "ಖಾತೆ ಹೊಂದಿಲ್ಲವೇ",
    "don't have an account?": "ಖಾತೆ ಹೊಂದಿಲ್ಲವೇ?",
    "Download Acknowledgement Slip": "ಸ್ವೀಕೃತಿ ಚೀಟಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "Download Database JSON Export": "ಡೇಟಾಬೇಸ್ ಜೆಸನ್ ರಫ್ತು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "Download Grievance Register CSV": "ದೂರು ನೋಂದಣಿ ಸಿಎಸ್‌ವಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "Download Local JSON Backup": "ಸ್ಥಳೀಯ JSON ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "drag & drop an image here or click to browse": "ಚಿತ್ರವನ್ನು ಇಲ್ಲಿಗೆ ಎಳೆಯಿರಿ ಅಥವಾ ಬ್ರೌಸ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    "drag & drop an image here or click to browse (jpg/png/webp, up to 5 mb)": "ಚಿತ್ರವನ್ನು ಇಲ್ಲಿಗೆ ಎಳೆಯಿರಿ ಅಥವಾ ಬ್ರೌಸ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ (JPG/PNG/WEBP, 5 MB ವರೆಗೆ)",
    "Drag & drop PDF / JPG / PNG (up to 10 MB) or click to browse": "ಪಿಡಿಎಫ್ / ಜೆಪಿಜಿ / ಪಿಎನ್‌ಜಿ (10 ಎಂಬಿ ವರೆಗೆ) ಎಳೆಯಿರಿ ಅಥವಾ ಬ್ರೌಸ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    "drainage": "ಒಳಚರಂಡಿ",
    "drainage &": "ಒಳಚರಂಡಿ ಮತ್ತು",
    "drainage & sanitation": "ಒಳಚರಂಡಿ ಮತ್ತು ನೈರ್ಮಲ್ಯ",
    "drainage and sanitation": "ಒಳಚರಂಡಿ ಮತ್ತು ನೈರ್ಮಲ್ಯ",
    "Drinking Water Supply": "ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು",
    "Duplicate": "ನಕಲಿ",
    "Duplicate grievance already registered": "ಇದೇ ರೀತಿಯ ದೂರನ್ನು ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ",
    "Dynamic Status Folder Navigation:": "ಡೈನಾಮಿಕ್ ಸ್ಥಿತಿ ಫೋಲ್ಡರ್ ನ್ಯಾವಿಗೇಶನ್:",
    "e.g. +91 82422 12345": "ಉದಾ. +91 82422 12345",
    "e.g. ": "ಉದಾ. ",
    "e.g. Asphalt compaction tomorrow, PWD inspection Friday...": "ಉದಾ. ನಾಳೆ ಡಾಂಬರೀಕರಣ, ಶುಕ್ರವಾರ ಪಿಡಬ್ಲ್ಯೂಡಿ ತಪಾಸಣೆ...",
    "e.g. ": "ಉದಾ. ",
    "e.g. dakshina kannada": "ಉದಾ. ದಕ್ಷಿಣ ಕನ್ನಡ",
    "e.g. Filed by mistake, issue resolved locally, duplicate entry...": "ಉದಾ. ತಪ್ಪಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ, ಸಮಸ್ಯೆ ಸ್ಥಳೀಯವಾಗಿ ಬಗೆಹರಿದಿದೆ...",
    "e.g. haleyangadi gram panchayat": "ಉದಾ. ಹಳೆಯಂಗಡಿ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "e.g. officer@example.com": "ಉದಾ. officer@example.com",
    "e.g. jan-2026-xxxx": "ಉದಾ. JAN-2026-XXXX",
    "e.g. main road, haleyangadi - 574146": "ಉದಾ. ಮುಖ್ಯ ರಸ್ತೆ, ಹಳೆಯಂಗಡಿ - 574146",
    "e.g. mangaluru": "ಉದಾ. ಮಂಗಳೂರು",
    "e.g. name@example.com": "ಉದಾ. name@example.com",
    "e.g. officer@panchayat.gov.in": "ಉದಾ. officer@panchayat.gov.in",
    "e.g. prinson dsouza": "ಉದಾ. ಪ್ರಿನ್ಸನ್ ಡಿಸೋಜಾ",
    "e.g. name@example.com": "ಉದಾ. name@example.com",
    "e.g. rajesh shetty": "ಉದಾ. ರಾಜೇಶ್ ಶೆಟ್ಟಿ",
    "e.g. Severe drinking water pipeline leakage near temple": "ಉದಾ. ದೇವಸ್ಥಾನದ ಬಳಿ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್‌ಲೈನ್ ಸೋರಿಕೆ",
    "e.g. sunitha rao": "ಉದಾ. ಸುನೀತಾ ರಾವ್",
    "e.g. Under Field Inspection": "ಉದಾ. ಕ್ಷೇತ್ರ ತಪಾಸಣೆಯಲ್ಲಿದೆ",
    "e.g. under_field_inspection": "ಉದಾ. under_field_inspection",
    "Edit": "ತಿದ್ದು",
    "edit": "ಸಂಪಾದಿಸಿ",
    "Edit / Review": "ತಿದ್ದು / ಪರಿಶೀಲಿಸು",
    "Edit Complaint & Grievance Control Centre": "ದೂರು ತಿದ್ದುಪಡಿ ಮತ್ತು ಕುಂದುಕೊರತೆ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ",
    "Edit Complaint & Lifecycle Status (Admin)": "ದೂರು ಮತ್ತು ಜೀವನಚಕ್ರ ಸ್ಥಿತಿ ತಿದ್ದಿ (ಆಡಳಿತ)",
    "Edit Complaint Status & Official Response in Admin Control Centre": "ಆಡಳಿತ ನಿಯಂತ್ರಣ ಕೇಂದ್ರದಲ್ಲಿ ದೂರಿನ ಸ್ಥಿತಿ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ತಿದ್ದಿ",
    "edit gram panchayat": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸಂಪಾದಿಸಿ",
    "edit gram panchayat details": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ",
    "Edit in Admin": "ನಿರ್ವಾಹಕರಲ್ಲಿ ತಿದ್ದಿ",
    "edit notice or announcements for villagers": "ಗ್ರಾಮಸ್ಥರಿಗೆ ಸೂಚನೆ ಅಥವಾ ಪ್ರಕಟಣೆಗಳನ್ನು ಸಂಪಾದಿಸಿ",
    "edit notice or announcements for villagers...": "ಗ್ರಾಮಸ್ಥರಿಗೆ ಸೂಚನೆ ಅಥವಾ ಪ್ರಕಟಣೆಗಳನ್ನು ಸಂಪಾದಿಸಿ...",
    "Electricity & Streetlights": "ವಿದ್ಯುತ್ ಮತ್ತು ಬೀದಿದೀಪಗಳು",
    "Electricity Supply Company (MESCOM/BESCOM)": "ವಿದ್ಯುತ್ ಸರಬರಾಜು ಕಂಪನಿ (ಮೆಸ್ಕಾಂ/ಬೆಸ್ಕಾಂ)",
    "email": "ಇಮೇಲ್",
    "Email & WhatsApp Logs": "ಇಮೇಲ್ ಮತ್ತು ವಾಟ್ಸಾಪ್ ಲಾಗ್‌ಗಳು",
    "email address": "ಇಮೇಲ್ ವಿಳಾಸ",
    "Email and WhatsApp delivery logs": "ಇಮೇಲ್ ಮತ್ತು ವಾಟ್ಸಾಪ್ ರವಾನೆ ಲಾಗ್‌ಗಳು",
    "email delivery audit history": "ಇಮೇಲ್ ವಿತರಣಾ ಆಡಿಟ್ ಇತಿಹಾಸ",
    "Email delivery logs & WhatsApp dispatch logs": "ಇಮೇಲ್ ಮತ್ತು ವಾಟ್ಸಾಪ್ ರವಾನೆ ಲಾಗ್‌ಗಳು",
    "email delivery pipeline configuration": "ಇಮೇಲ್ ವಿತರಣಾ ಪೈಪ್‌ಲೈನ್ ಕಾನ್ಫಿಗರೇಶನ್",
    "Email Delivery Pipeline Ready": "ಇಮೇಲ್ ರವಾನೆ ಪೈಪ್‌ಲೈನ್ ಸಿದ್ಧವಾಗಿದೆ",
    "email notification preferences": "ಇಮೇಲ್ ಅಧಿಸೂಚನೆ ಆದ್ಯತೆಗಳು",
    "email receiver (panchayat)": "ಇಮೇಲ್ ಸ್ವೀಕೃತಿದಾರ (ಪಂಚಾಯತ್)",
    "email transmission audit details": "ಇಮೇಲ್ ರವಾನೆ ಆಡಿಟ್ ವಿವರಗಳು",
    "Email transmission audit logs & WhatsApp logs": "ಇಮೇಲ್ ಪ್ರಸರಣ ಆಡಿಟ್ ಲಾಗ್‌ಗಳು ಮತ್ತು ವಾಟ್ಸಾಪ್ ಲಾಗ್‌ಗಳು",
    "EmailJS Client Pipeline (Primary)": "ಇಮೇಲ್‌ಜೆಎಸ್ ಕ್ಲೈಂಟ್ ಪೈಪ್‌ಲೈನ್ (ಪ್ರಾಥಮಿಕ)",
    "emailjs configuration": "EmailJS ಸಂರಚನೆ",
    "emailjs public key": "EmailJS ಪಬ್ಲಿಕ್ ಕೀ",
    "emailjs public key *": "EmailJS ಪಬ್ಲಿಕ್ ಕೀ *",
    "emailjs service id": "EmailJS ಸರ್ವಿಸ್ ಐಡಿ",
    "emailjs service id *": "EmailJS ಸರ್ವಿಸ್ ಐಡಿ *",
    "emailjs template id": "EmailJS ಟೆಂಪ್ಲೇಟ್ ಐಡಿ",
    "emailjs template id *": "EmailJS ಟೆಂಪ್ಲೇಟ್ ಐಡಿ *",
    "emailjs uses client public key authentication only.": "EmailJS ಕೇವಲ ಕ್ಲೈಂಟ್ ಸಾರ್ವಜನಿಕ ಕೀ ದೃಢೀಕರಣವನ್ನು ಮಾತ್ರ ಬಳಸುತ್ತದೆ.",
    "Emergency Control Centre": "ತುರ್ತು ನಿಯಂತ್ರಣ ಕೇಂದ್ರ",
    "Emergency Control Centre – Master Emergency Data Reset – JANASEVA": "ತುರ್ತು ನಿಯಂತ್ರಣ ಕೇಂದ್ರ – ಮಾಸ್ಟರ್ ತುರ್ತು ಡೇಟಾ ಮರುಹೊಂದಿಕೆ – ಜನಸೇವಾ",
    "Emergency Data Reset": "ತುರ್ತು ಡೇಟಾ ಮರುಹೊಂದಿಕೆ",
    "empowering rural citizens through a simple and digital grievance system": "ಸರಳ ಮತ್ತು ಡಿಜಿಟಲ್ ಕುಂದುಕೊರತೆ ವ್ಯವಸ್ಥೆಯ ಮೂಲಕ ಗ್ರಾಮೀಣ ನಾಗರಿಕರನ್ನು ಸಬಲೀಕರಣಗೊಳಿಸುವುದು",
    "empowering rural citizens through a simple and digital grievance system.": "ಸರಳ ಮತ್ತು ಡಿಜಿಟಲ್ ಕುಂದುಕೊರತೆ ವ್ಯವಸ್ಥೆಯ ಮೂಲಕ ಗ್ರಾಮೀಣ ನಾಗರಿಕರನ್ನು ಸಬಲೀಕರಣಗೊಳಿಸುವುದು.",
    "Empty all quarantined records": "ಎಲ್ಲಾ ಕ್ವಾರಂಟೈನ್ ದಾಖಲೆಗಳನ್ನು ಖಾಲಿ ಮಾಡಿ",
    "Empty Recycle Bin": "ರಿಸೈಕಲ್ ಬಿನ್ ಖಾಲಿ ಮಾಡಿ",
    "ENFORCED": "ಜಾರಿಯಲ್ಲಿದೆ",
    "enter 10-digit phone number": "10-ಅಂಕಿಯ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
    "Enter administrator password (e.g. your configured password)": "ಆಡಳಿತಾಧಿಕಾರಿ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ (ಉದಾ. your configured password)",
    "enter complaint id (e.g. jan-2026-xxxx)": "ದೂರು ಐಡಿ ನಮೂದಿಸಿ (ಉದಾ. JAN-2026-XXXX)",
    "enter complaint id (e.g. jan-2026-xxxx)": "ದೂರು ಐಡಿ ನಮೂದಿಸಿ (ಉದಾ. JAN-2026-XXXX)",
    "no complaint found. please verify your complaint id and registered email address.": "ಯಾವುದೇ ದೂರು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರು ಐಡಿ ಮತ್ತು ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "enter gram panchayat name": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಹೆಸರು ನಮೂದಿಸಿ",
    "Enter image URL or path of remediation work...": "ಪರಿಹಾರ ಕಾಮಗಾರಿಯ ಚಿತ್ರದ URL ಅಥವಾ ಪಥವನ್ನು ನಮೂದಿಸಿ...",
    "enter official email address": "ಅಧಿಕೃತ ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ",
    "enter pdo full name": "ಪಿಡಿಒ ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ",
    "enter president full name": "ಅಧ್ಯಕ್ಷರ ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ",
    "enter remarks for citizen": "ನಾಗರಿಕರಿಗಾಗಿ ಟಿಪ್ಪಣಿಗಳನ್ನು ನಮೂದಿಸಿ",
    "enter remarks for citizen...": "ನಾಗರಿಕರಿಗಾಗಿ ಟಿಪ್ಪಣಿಗಳನ್ನು ನಮೂದಿಸಿ...",
    "enter taluk name": "ತಾಲೂಕು ಹೆಸರು ನಮೂದಿಸಿ",
    "enter the email address where complaints should be sent": "ದೂರುಗಳನ್ನು ಕಳುಹಿಸಬೇಕಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
    "enter the email address where complaints should be sent.": "ದೂರುಗಳನ್ನು ಕಳುಹಿಸಬೇಕಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
    "Enter updated official response, resolution details, or progress update...": "ನವೀಕರಿಸಿದ ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ, ಪರಿಹಾರದ ವಿವರಗಳು ಅಥವಾ ಪ್ರಗತಿ ನವೀಕರಣವನ್ನು ನಮೂದಿಸಿ...",
    "enter your 10-digit mobile": "ನಿಮ್ಮ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ನಮೂದಿಸಿ",
    "Enter your Complaint ID or registered email address above and click": "ಮೇಲೆ ನಿಮ್ಮ ದೂರು ಐಡಿ ಅಥವಾ ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ಕ್ಲಿಕ್ ಮಾಡಿ",
    "enter your complaint id or the email address used while submitting the complaint": "ನಿಮ್ಮ ದೂರು ಐಡಿ ಅಥವಾ ದೂರು ಸಲ್ಲಿಸುವಾಗ ಬಳಸಿದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
    "enter your complaint id or the email address used while submitting the complaint.": "ನಿಮ್ಮ ದೂರು ಐಡಿ ಅಥವಾ ದೂರು ಸಲ್ಲಿಸುವಾಗ ಬಳಸಿದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
    "enter your credentials to access the digital grievance portal": "ಡಿಜಿಟಲ್ ಕುಂದುಕೊರತೆ ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಲು ನಿಮ್ಮ ರುಜುವಾತುಗಳನ್ನು ನಮೂದಿಸಿ",
    "enter your email": "ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ",
    "enter your email address": "ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
    "enter your email address and we'll send you a link to reset your password": "ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಲು ನಾವು ನಿಮಗೆ ಲಿಂಕ್ ಕಳುಹಿಸುತ್ತೇವೆ",
    "enter your email address and we'll send you a link to reset your password.": "ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಲು ನಾವು ನಿಮಗೆ ಲಿಂಕ್ ಕಳುಹಿಸುತ್ತೇವೆ.",
    "enter your full name": "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
    "enter your mobile number": "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
    "enter your password": "ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
    "enter your registered email": "ನಿಮ್ಮ ನೋಂದಾಯಿತ ಇಮೇಲ್ ನಮೂದಿಸಿ",
    "enter your registered email address and we will dispatch a password reset verification link to your inbox": "ನಿಮ್ಮ ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಇನ್‌ಬಾಕ್ಸ್‌ಗೆ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಪರಿಶೀಲನಾ ಲಿಂಕ್ ಕಳುಹಿಸುತ್ತೇವೆ",
    "enter your registered email address and we will dispatch a password reset verification link to your inbox.": "ನಿಮ್ಮ ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಇನ್‌ಬಾಕ್ಸ್‌ಗೆ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಪರಿಶೀಲನಾ ಲಿಂಕ್ ಕಳುಹಿಸುತ್ತೇವೆ.",
    "Estimated Volume": "ಅಂದಾಜು ಪ್ರಮಾಣ",
    "evaluation demo credentials": "ಮೌಲ್ಯಮಾಪನ ಡೆಮೊ ರುಜುವಾತುಗಳು",
    "evaluation demo credentials:": "ಮೌಲ್ಯಮಾಪನ ಡೆಮೊ ರುಜುವಾತುಗಳು:",
    "every recipient modification creates a permanent record in": "ಪ್ರತಿಯೊಂದು ಸ್ವೀಕೃತಿದಾರರ ಬದಲಾವಣೆಯು ಶಾಶ್ವತ ದಾಖಲೆಯನ್ನು ಸೃಷ್ಟಿಸುತ್ತದೆ",
    "Every recipient modification creates a permanent record in": "ಪ್ರತಿ ಸ್ವೀಕೃತಿದಾರರ ಬದಲಾವಣೆಯೂ ಶಾಶ್ವತ ದಾಖಲೆಯನ್ನು ರಚಿಸುತ್ತದೆ:",
    "Evidence": "ಸಾಕ್ಷ್ಯ",
    "Excludes deleted records": "ಅಳಿಸಿದ ದಾಖಲೆಗಳನ್ನು ಹೊರತುಪಡಿಸಿ",
    "Execute": "ಕಾರ್ಯಗತಗೊಳಿಸಿ",
    "Executing Master Emergency Reset": "ಮಾಸ್ಟರ್ ತುರ್ತು ಮರುಹೊಂದಿಕೆ ಕಾರ್ಯಗತಗೊಳಿಸಲಾಗುತ್ತಿದೆ",
    "Explain why this grievance should be reviewed or deleted by Admin...": "ಆಡಳಿತಾಧಿಕಾರಿಯು ಈ ದೂರನ್ನು ಏಕೆ ಪರಿಶೀಲಿಸಬೇಕು ಅಥವಾ ಅಳಿಸಬೇಕು ಎಂದು ವಿವರಿಸಿ...",
    "export all panchayats to csv file": "ಎಲ್ಲಾ ಪಂಚಾಯತ್‌ಗಳನ್ನು CSV ಫೈಲ್‌ಗೆ ರಫ್ತು ಮಾಡಿ",
    "Export CSV": "ಸಿಎಸ್‌ವಿ ರಫ್ತು",
    "export csv": "CSV ರಫ್ತು ಮಾಡಿ",
    "export directory (csv)": "ಡೈರೆಕ್ಟರಿ ರಫ್ತು ಮಾಡಿ (CSV)",
    "Export Excel / CSV": "ಎಕ್ಸೆಲ್ / ಸಿಎಸ್‌ವಿ ರಫ್ತು",
    "Export filtered updates as CSV": "ಫಿಲ್ಟರ್ ಮಾಡಿದ ನವೀಕರಣಗಳನ್ನು CSV ಆಗಿ ರಫ್ತು ಮಾಡಿ",
    "Export Report": "ವರದಿ ರಫ್ತು ಮಾಡಿ",
    "facilities": "ಸೌಲಭ್ಯಗಳು",
    "failed": "ವಿಫಲವಾಗಿದೆ",
    "Falls outside Gram Panchayat jurisdiction": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ವ್ಯಾಪ್ತಿಯಿಂದ ಹೊರಗಿದೆ",
    "Field work completed; awaiting final sign-off.": "ಸ್ಥಳೀಯ ಕಾಮಗಾರಿ ಪೂರ್ಣಗೊಂಡಿದೆ; ಅಂತಿಮ ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇದೆ.",
    "field work progress tracking": "ಕ್ಷೇತ್ರ ಕಾರ್ಯದ ಪ್ರಗತಿ ಟ್ರ್ಯಾಕಿಂಗ್",
    "Filed Date": "ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ",
    "Filing Date": "ದಾಖಲಿಸಿದ ದಿನಾಂಕ",
    "Filing Timestamp": "ಸಲ್ಲಿಸಿದ ಸಮಯ",
    "fill admin": "ನಿರ್ವಾಹಕ ಭರ್ತಿ",
    "fill citizen": "ನಾಗರಿಕ ಭರ್ತಿ",
    "fill in the details below and attach a photo of the issue": "ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ ಮತ್ತು ಸಮಸ್ಯೆಯ ಫೋಟೋ ಲಗತ್ತಿಸಿ",
    "fill in the details below and attach a photo of the issue.": "ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ ಮತ್ತು ಸಮಸ್ಯೆಯ ಫೋಟೋ ಲಗತ್ತಿಸಿ.",
    "fill receiver": "ಸ್ವೀಕೃತಿದಾರ ಭರ್ತಿ",
    "filter by block / taluk": "ತಾಲೂಕಿನ ಮೂಲಕ ಫಿಲ್ಟರ್ ಮಾಡಿ",
    "filter by district": "ಜಿಲ್ಲೆಯ ಮೂಲಕ ಫಿಲ್ಟರ್ ಮಾಡಿ",
    "filter by status": "ಸ್ಥಿತಿಯ ಮೂಲಕ ಫಿಲ್ಟರ್ ಮಾಡಿ",
    "filter grievances": "ದೂರುಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ",
    "Filter: Action Taken": "ಫಿಲ್ಟರ್: ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ",
    "Filter: All Grievances": "ಫಿಲ್ಟರ್: ಎಲ್ಲಾ ದೂರುಗಳು",
    "Filter: Assigned": "ಫಿಲ್ಟರ್: ನಿಯೋಜಿಸಲಾಗಿದೆ",
    "Filter: In Progress": "ಫಿಲ್ಟರ್: ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    "Filter: Overdue (>7 Days)": "ಫಿಲ್ಟರ್: ವಿಳಂಬವಾಗಿದೆ (>7 ದಿನಗಳು)",
    "Filter: Rejected": "ಫಿಲ್ಟರ್: ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    "Filter: Reopened": "ಫಿಲ್ಟರ್: ಮರುತೆರೆಯಲಾಗಿದೆ",
    "Filter: Resolved": "ಫಿಲ್ಟರ್: ಪರಿಹರಿಸಲಾಗಿದೆ",
    "Filter: Submitted": "ಫಿಲ್ಟರ್: ಸಲ್ಲಿಸಲಾಗಿದೆ",
    "Filter: Under Review": "ಫಿಲ್ಟರ್: ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ",
    "find contact details and key information of all gram panchayats in your area": "ನಿಮ್ಮ ಪ್ರದೇಶದ ಎಲ್ಲಾ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳ ಸಂಪರ್ಕ ವಿವರಗಳು ಮತ್ತು ಪ್ರಮುಖ ಮಾಹಿತಿಯನ್ನು ಹುಡುಕಿ",
    "find contact details and key information of all gram panchayats in your area.": "ನಿಮ್ಮ ಪ್ರದೇಶದ ಎಲ್ಲಾ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳ ಸಂಪರ್ಕ ವಿವರಗಳು ಮತ್ತು ಪ್ರಮುಖ ಮಾಹಿತಿಯನ್ನು ಹುಡುಕಿ.",
    "find contact details of gram panchayats in your area": "ನಿಮ್ಮ ಪ್ರದೇಶದ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳ ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ಹುಡುಕಿ",
    "find contact details of gram panchayats in your area.": "ನಿಮ್ಮ ಪ್ರದೇಶದ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳ ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ಹುಡುಕಿ.",
    "find panchayat": "ಪಂಚಾಯತ್ ಹುಡುಕಿ",
    "Firebase Storage": "ಫೈರ್‌ಬೇಸ್ ಶೇಖರಣೆ",
    "Firestore Collection / Store": "ಫೈರ್‌ಸ್ಟೋರ್ ಸಂಗ್ರಹ / ಸ್ಟೋರ್",
    "Firestore security rules & immutable audit ledger": "ಫೈರ್‌ಸ್ಟೋರ್ ಭದ್ರತಾ ನಿಯಮಗಳು ಮತ್ತು ಬದಲಾಯಿಸಲಾಗದ ಆಡಿಟ್ ಲೆಡ್ಜರ್",
    "Flag for Inquiry": "ವಿಚಾರಣೆಗೆ ಗುರುತುಹಾಕಿ",
    "Flag Grievance for Admin Review": "ಆಡಳಿತ ಪರಿಶೀಲನೆಗಾಗಿ ದೂರನ್ನು ಫ್ಲ್ಯಾಗ್ ಮಾಡಿ",
    "Flagging Category": "ಫ್ಲ್ಯಾಗ್ ಮಾಡುವ ವರ್ಗ",
    "Flushes transient offline drafts, IndexedDB queues, and transmission logs without affecting core data.": "ಮುಖ್ಯ ಡೇಟಾಗೆ ಧಕ್ಕೆಯಾಗದಂತೆ ತಾತ್ಕಾಲಿಕ ಆಫ್‌ಲೈನ್ ಕರಡುಗಳು, IndexedDB ಸರತಿಗಳು ಮತ್ತು ಪ್ರಸರಣ ಲಾಗ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ.",
    "folder. Official audit trails and receiver work records remain intact, and you can restore it anytime.": "ಫೋಲ್ಡರ್‌ಗೆ ಸರಿಸಲಾಗುತ್ತದೆ. ಅಧಿಕೃತ ಆಡಿಟ್ ದಾಖಲೆಗಳು ಸುರಕ್ಷಿತವಾಗಿರುತ್ತವೆ ಮತ್ತು ನೀವು ಅದನ್ನು ಯಾವಾಗ ಬೇಕಾದರೂ ಮರುಸ್ಥಾಪಿಸಬಹುದು.",
    "Follow-up required": "ಮರುಪರಿಶೀಲನೆ ಅಗತ್ಯ",
    "FontAwesome Icon Class": "FontAwesome ಐಕಾನ್ ವರ್ಗ",
    "forgot password": "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ",
    "forgot password?": "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?",
    "forwarded to panchayat": "ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗೆ ರವಾನೆಯಾಗುತ್ತದೆ",
    "Fresh start baseline. Purges all operational data AND registered citizen accounts, preparing portal for fresh deployment.": "ಹೊಸ ಪ್ರಾರಂಭ. ಎಲ್ಲಾ ಕಾರ್ಯಾಚರಣಾ ಡೇಟಾ ಮತ್ತು ನೋಂದಾಯಿತ ನಾಗರಿಕ ಖಾತೆಗಳನ್ನು ಅಳಿಸಿ ಪೋರ್ಟಲ್ ಅನ್ನು ಹೊಸದಾಗಿ ಸಿದ್ಧಪಡಿಸುತ್ತದೆ.",
    "From Date": "ಪ್ರಾರಂಭ ದಿನಾಂಕ",
    "From filing date": "ದೂರು ಸಲ್ಲಿಸಿದ ಪ್ರಾರಂಭ ದಿನಾಂಕ",
    "from the directory": "ಡೈರೆಕ್ಟರಿಯಿಂದ",
    "from the directory?": "ಡೈರೆಕ್ಟರಿಯಿಂದ?",
    "Full Application Data Reset": "ಸಂಪೂರ್ಣ ಅಪ್ಲಿಕೇಶನ್ ಡೇಟಾ ಮರುಹೊಂದಿಕೆ",
    "Full data integrity protection with automatic rollback on error.": "ದೋಷದ ಸಂದರ್ಭದಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತ ರೋಲ್‌ಬ್ಯಾಕ್‌ನೊಂದಿಗೆ ಸಂಪೂರ್ಣ ಡೇಟಾ ರಕ್ಷಣೆ.",
    "full name": "ಪೂರ್ಣ ಹೆಸರು",
    "FULL RESET": "ಸಂಪೂರ್ಣ ಮರುಹೊಂದಿಕೆ",
    "Full System Reset (Cat E)": "ಸಂಪೂರ್ಣ ಸಿಸ್ಟಮ್ ಮರುಹೊಂದಿಕೆ (ವರ್ಗ ಇ)",
    "garbage &": "ಕಸ ಮತ್ತು",
    "garbage & cleanliness": "ಕಸ ಮತ್ತು ಸ್ವಚ್ಛತೆ",
    "garbage and cleanliness": "ಕಸ ಮತ್ತು ಸ್ವಚ್ಛತೆ",
    "garbage cleared from market yard and bleaching powder sprinkled. daily collection schedule enforced": "ಮಾರುಕಟ್ಟೆ ಆವರಣದಿಂದ ಕಸ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ ಮತ್ತು ಬ್ಲೀಚಿಂಗ್ ಪೌಡರ್ ಸಿಂಪಡಿಸಲಾಗಿದೆ. ದೈನಂದಿನ ಸಂಗ್ರಹಣೆ ವೇಳಾಪಟ್ಟಿ ಜಾರಿಗೊಳಿಸಲಾಗಿದೆ",
    "garbage cleared from market yard and bleaching powder sprinkled. daily collection schedule enforced.": "ಮಾರುಕಟ್ಟೆ ಆವರಣದಿಂದ ಕಸ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ ಮತ್ತು ಬ್ಲೀಚಿಂಗ್ ಪೌಡರ್ ಸಿಂಪಡಿಸಲಾಗಿದೆ. ದೈನಂದಿನ ಸಂಗ್ರಹಣೆ ವೇಳಾಪಟ್ಟಿ ಜಾರಿಗೊಳಿಸಲಾಗಿದೆ.",
    "garbage not cleared": "ಕಸ ತೆರವುಗೊಳಿಸಿಲ್ಲ",
    "General Gram Panchayat Administration": "ಸಾಮಾನ್ಯ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಆಡಳಿತ",
    "General Grievance": "ಸಾಮಾನ್ಯ ಕುಂದುಕೊರತೆ",
    "Generate immutable JSON database snapshots or full CSV registers for audit compliance and disaster recovery.": "ಆಡಿಟ್ ಅನುಸರಣೆ ಮತ್ತು ವಿಪತ್ತು ಮರುಪಡೆಯುವಿಕೆಗಾಗಿ ಶಾಶ್ವತ ಜೆಸನ್ ಡೇಟಾಬೇಸ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ಗಳು ಅಥವಾ ಪೂರ್ಣ ಸಿಎಸ್‌ವಿ ದಾಖಲೆಗಳನ್ನು ರಚಿಸಿ.",
    "Generate Report": "ವರದಿ ರಚಿಸಿ",
    "Generated Backup Snapshots & Logs": "ರಚಿಸಲಾದ ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ಗಳು ಮತ್ತು ದಾಖಲೆಗಳು",
    "Generating...": "ರಚಿಸಲಾಗುತ್ತಿದೆ...",
    "get public key": "ಪಬ್ಲಿಕ್ ಕೀ ಪಡೆಯಿರಿ",
    "get these details from your emailjs dashboard (service id, template id and public key). make sure your template is configured to receive the variable": "ನಿಮ್ಮ EmailJS ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಈ ವಿವರಗಳನ್ನು ಪಡೆಯಿರಿ (ಸರ್ವಿಸ್ ಐಡಿ, ಟೆಂಪ್ಲೇಟ್ ಐಡಿ ಮತ್ತು ಪಬ್ಲಿಕ್ ಕೀ). ನಿಮ್ಮ ಟೆಂಪ್ಲೇಟ್ ವೇರಿಯೇಬಲ್ ಸ್ವೀಕರಿಸಲು ಕಾನ್ಫಿಗರ್ ಆಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ",
    "get these details from your emailjs dashboard (service id, template id and public key). make sure your template is configured to receive the variable complaint_photo if you are sending a photo": "ನಿಮ್ಮ EmailJS ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಈ ವಿವರಗಳನ್ನು ಪಡೆಯಿರಿ (ಸರ್ವಿಸ್ ಐಡಿ, ಟೆಂಪ್ಲೇಟ್ ಐಡಿ ಮತ್ತು ಪಬ್ಲಿಕ್ ಕೀ). ನೀವು ಫೋಟೋ ಕಳುಹಿಸುತ್ತಿದ್ದರೆ complaint_photo ವೇರಿಯೇಬಲ್ ಸ್ವೀಕರಿಸಲು ನಿಮ್ಮ ಟೆಂಪ್ಲೇಟ್ ಕಾನ್ಫಿಗರ್ ಆಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ",
    "get these details from your emailjs dashboard (service id, template id and public key). make sure your template is configured to receive the variable complaint_photo if you are sending a photo.": "ನಿಮ್ಮ EmailJS ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಈ ವಿವರಗಳನ್ನು ಪಡೆಯಿರಿ (ಸರ್ವಿಸ್ ಐಡಿ, ಟೆಂಪ್ಲೇಟ್ ಐಡಿ ಮತ್ತು ಪಬ್ಲಿಕ್ ಕೀ). ನೀವು ಫೋಟೋ ಕಳುಹಿಸುತ್ತಿದ್ದರೆ complaint_photo ವೇರಿಯೇಬಲ್ ಸ್ವೀಕರಿಸಲು ನಿಮ್ಮ ಟೆಂಪ್ಲೇಟ್ ಕಾನ್ಫಿಗರ್ ಆಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
    "get updates": "ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಪಡೆಯಿರಿ",
    "go to account -> api keys and copy the public key": "ಖಾತೆ -> API Keys ಗೆ ಹೋಗಿ ಪಬ್ಲಿಕ್ ಕೀ ನಕಲಿಸಿ",
    "go to account -> api keys and copy the public key.": "ಖಾತೆ -> API Keys ಗೆ ಹೋಗಿ ಪಬ್ಲಿಕ್ ಕೀ ನಕಲಿಸಿ.",
    "go to account → api keys and copy the public key": "ಖಾತೆ → API Keys ಗೆ ಹೋಗಿ ಪಬ್ಲಿಕ್ ಕೀ ನಕಲಿಸಿ",
    "go to account → api keys and copy the public key.": "ಖಾತೆ → API Keys ಗೆ ಹೋಗಿ ಪಬ್ಲಿಕ್ ಕೀ ನಕಲಿಸಿ.",
    "go to dashboard.emailjs.com and sign in": "dashboard.emailjs.com ಗೆ ಹೋಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    "go to dashboard.emailjs.com and sign in.": "dashboard.emailjs.com ಗೆ ಹೋಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    "Google Cloud Functions SMTP Transport (Backend)": "ಗೂಗಲ್ ಕ್ಲೌಡ್ ಫಂಕ್ಷನ್ಸ್ ಎಸ್‌ಎಂಟಿಪಿ ಸಾರಿಗೆ (ಹಿನ್ನೆಲೆ)",
    "government of india": "ಭಾರತ ಸರ್ಕಾರ",
    "gram panchayat": "ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Gram Panchayat Desk": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಡೆಸ್ಕ್",
    "gram panchayat directory": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಡೈರೆಕ್ಟರಿ",
    "Gram Panchayat directory and system configurations": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ವಿವರ ಕೋಶ ಮತ್ತು ಸಿಸ್ಟಮ್ ಕಾನ್ಫಿಗರೇಶನ್‌ಗಳು",
    "Gram Panchayat Directory configurations": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ವಿವರ ಕೋಶ ಕಾನ್ಫಿಗರೇಶನ್‌ಗಳು",
    "gram panchayat directory – janaseva portal": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಡೈರೆಕ್ಟರಿ – ಜನಸೇವಾ ಪೋರ್ಟಲ್",
    "gram panchayat grievance portal": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ಪೋರ್ಟಲ್",
    "Gram Panchayat Health & Sanitation Squad": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಆರೋಗ್ಯ ಮತ್ತು ನೈರ್ಮಲ್ಯ ದಳ",
    "gram panchayat official": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿ",
    "gram panchayat president": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧ್ಯಕ್ಷರು",
    "Gram Panchayat Voice Redressal": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಧ್ವನಿ ಪರಿಹಾರ",
    "Grievance Description": "ದೂರಿನ ವಿವರಣೆ",
    "Grievance Details & Official Responses": "ದೂರಿನ ವಿವರಗಳು ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳು",
    "Grievance Documents": "ದೂರು ದಾಖಲೆಗಳು",
    "Grievance ID": "ದೂರು ಐಡಿ",
    "Grievance Lifecycle Progression": "ದೂರಿನ ಜೀವನಚಕ್ರ ಪ್ರಗತಿ",
    "Grievance Management": "ದೂರು ನಿರ್ವಹಣೆ",
    "grievance management dashboard": "ಕುಂದುಕೊರತೆ ನಿರ್ವಹಣಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "Grievance Priority Level": "ದೂರಿನ ಆದ್ಯತೆಯ ಮಟ್ಟ",
    "Grievance Priority Level (AI Assessment & Override)": "ದೂರಿನ ಆದ್ಯತೆಯ ಮಟ್ಟ (ಎಐ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ಬದಲಾವಣೆ)",
    "Grievance records submitted by citizens": "ನಾಗರಿಕರು ಸಲ್ಲಿಸಿದ ದೂರು ದಾಖಲೆಗಳು",
    "Grievance Redressal Officer (Receiver)": "ಕುಂದುಕೊರತೆ ಪರಿಹಾರ ಅಧಿಕಾರಿ (ಸ್ವೀಕೃತಿದಾರ)",
    "Grievance Rejected by Administration": "ಆಡಳಿತದಿಂದ ದೂರು ತಿರಸ್ಕರಿಸಲ್ಪಟ್ಟಿದೆ",
    "Grievance Reopened for Further Verification": "ಹೆಚ್ಚಿನ ಪರಿಶೀಲನೆಗಾಗಿ ದೂರು ಮರುತೆರೆಯಲಾಗಿದೆ",
    "Grievance Resolution Feedback": "ದೂರು ಪರಿಹಾರದ ಪ್ರತಿಕ್ರಿಯೆ",
    "Grievance Resolved: Verified resolution confirmed": "ದೂರು ಪರಿಹರಿಸಲಾಗಿದೆ: ದೃಢೀಕರಿಸಿದ ಪರಿಹಾರ ಖಚಿತಗೊಂಡಿದೆ",
    "Grievance Saved Offline": "ದೂರನ್ನು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ",
    "Grievance Subject / Title": "ದೂರಿನ ವಿಷಯ / ಶೀರ್ಷಿಕೆ",
    "Grievance successfully addressed and verified.": "ದೂರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪರಿಹರಿಸಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
    "Grievances Analyzed": "ವಿಶ್ಲೇಷಿಸಲಾದ ದೂರುಗಳು",
    "Guruvayanakere": "ಗುರುವಾಯನಕೆರೆ",
    "Guruvayanakere Gram Panchayat": "ಗುರುವಾಯನಕೆರೆ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "hide password": "ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಡಿ",
    "HIGH": "ಹೆಚ್ಚಿನ",
    "HIGH (Immediate Attention Required)": "ಹೆಚ್ಚಿನ (ತಕ್ಷಣದ ಗಮನ ಅಗತ್ಯ)",
    "High Priority": "ಹೆಚ್ಚಿನ ಆದ್ಯತೆ",
    "Highest Progress First": "ಹೆಚ್ಚಿನ ಪ್ರಗತಿ ಮೊದಲು",
    "Historical storage": "ಐತಿಹಾಸಿಕ ಸಂಗ್ರಹ",
    "History": "ಇತಿಹಾಸ",
    "home": "ಮುಖಪುಟ",
    "hon. president": "ಗೌರವಾನ್ವಿತ ಅಧ್ಯಕ್ಷರು",
    "Hotspots": "ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು",
    "how it works": "ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?",
    "how it works?": "ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?",
    "how to get emailjs details": "EmailJS ವಿವರಗಳನ್ನು ಪಡೆಯುವುದು ಹೇಗೆ",
    "how to get emailjs details?": "EmailJS ವಿವರಗಳನ್ನು ಪಡೆಯುವುದು ಹೇಗೆ?",
    "Hybrid (EmailJS with Cloud Functions Failover)": "ಹೈಬ್ರಿಡ್ (ಕ್ಲೌಡ್ ಫಂಕ್ಷನ್ಸ್ ಫೇಲ್‌ಓವರ್‌ನೊಂದಿಗೆ ಇಮೇಲ್‌ಜೆಎಸ್)",
    "HYBRID REPOSITORY": "ಹೈಬ್ರಿಡ್ ರೆಪೊಸಿಟರಿ",
    "I am an authorized Administrator executing this emergency operation under municipal governance guidelines.": "ಪೌರಾಡಳಿತ ಮಾರ್ಗಸೂಚಿಗಳ ಅಡಿಯಲ್ಲಿ ಈ ತುರ್ತು ಕಾರ್ಯಾಚರಣೆಯನ್ನು ನಿರ್ವಹಿಸುವ ಅಧಿಕೃತ ಆಡಳಿತಾಧಿಕಾರಿ ನಾನಾಗಿದ್ದೇನೆ.",
    "I confirm that a verified cryptographic pre-reset snapshot backup has been generated with SHA-256 integrity hash.": "SHA-256 ಸಮಗ್ರತಾ ಹ್ಯಾಶ್‌ನೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿದ ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಬ್ಯಾಕಪ್ ರಚಿಸಲಾಗಿದೆ ಎಂದು ನಾನು ದೃಢೀಕರಿಸುತ್ತೇನೆ.",
    "I understand that initiating this reset will permanently erase selected operational grievance records, review histories, and delivery logs.": "ಈ ಮರುಹೊಂದಿಕೆಯನ್ನು ಪ್ರಾರಂಭಿಸುವುದರಿಂದ ಆಯ್ದ ದೂರು ದಾಖಲೆಗಳು, ಪರಿಶೀಲನಾ ಇತಿಹಾಸಗಳು ಮತ್ತು ರವಾನೆ ಲಾಗ್‌ಗಳು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲ್ಪಡುತ್ತವೆ ಎಂದು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ.",
    "ID": "ಐಡಿ",
    "If the reported issue has not been satisfactorily resolved or has recurred, please explain the reason for requesting a reopening for grievance": "ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆಯು ತೃಪ್ತಿಕರವಾಗಿ ಪರಿಹಾರವಾಗದಿದ್ದರೆ ಅಥವಾ ಮರುಕಳಿಸಿದ್ದರೆ, ದೂರು ಮರುತೆರೆಯಲು ವಿನಂತಿಸುವ ಕಾರಣವನ್ನು ವಿವರಿಸಿ",
    "if you are sending a photo.": "ನೀವು ಫೋಟೋ ಕಳುಹಿಸುತ್ತಿದ್ದರೆ.",
    "Immediate Review": "ತಕ್ಷಣದ ಪರಿಶೀಲನೆ",
    "immutable audit trail": "ಬದಲಾಯಿಸಲಾಗದ ಆಡಿಟ್ ದಾಖಲೆ",
    "Immutable chronological log of status transitions, official responses, and reassignments.": "ಸ್ಥಿತಿ ಬದಲಾವಣೆಗಳು, ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಮತ್ತು ಮರುನಿಯೋಜನೆಗಳ ಬದಲಾಗದ ಕಾಲಾನುಕ್ರಮದ ದಾಖಲೆ.",
    "Immutable Emergency Reset Audit Ledger": "ಬದಲಾಯಿಸಲಾಗದ ತುರ್ತು ಮರುಹೊಂದಿಕೆ ಆಡಿಟ್ ಲೆಡ್ಜರ್",
    "Immutable Reset Audit History Ledger": "ಬದಲಾಯಿಸಲಾಗದ ಮರುಹೊಂದಿಕೆ ಆಡಿಟ್ ಲೆಡ್ಜರ್",
    "Impact": "ಪರಿಣಾಮ",
    "import file": "ಫೈಲ್ ಆಮದು ಮಾಡಿ",
    "import new panchayats from file (csv/json)": "ಫೈಲ್‌ನಿಂದ (CSV/JSON) ಹೊಸ ಪಂಚಾಯತ್‌ಗಳನ್ನು ಆಮದು ಮಾಡಿ",
    "import panchayats (csv/json)": "ಪಂಚಾಯತ್‌ಗಳನ್ನು ಆಮದು ಮಾಡಿ (CSV/JSON)",
    "in progress": "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    "in progress (action taken)": "ಪ್ರಗತಿಯಲ್ಲಿದೆ (ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ)",
    "In Progress (Work Underway)": "ಪ್ರಗತಿಯಲ್ಲಿದೆ (ಕೆಲಸ ನಡೆಯುತ್ತಿದೆ)",
    "in progress complaints": "ಪ್ರಗತಿಯಲ್ಲಿರುವ ದೂರುಗಳು",
    "in progress {action taken}": "ಪ್ರಗತಿಯಲ್ಲಿದೆ {ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ}",
    "Include as Node in Citizen Timeline Stepper": "ನಾಗರಿಕ ಟೈಮ್‌ಲೈನ್ ಸ್ಟೆಪ್ಪರ್‌ನಲ್ಲಿ ನೋಡ್ ಆಗಿ ಸೇರಿಸಿ",
    "Incomplete location or landmark details": "ಅಪೂರ್ಣ ಸ್ಥಳ ಅಥವಾ ಹೆಗ್ಗುರುತಿನ ವಿವರಗಳು",
    "Inconsistency Flagged": "ವ್ಯತ್ಯಾಸ ಗುರುತಿಸಲಾಗಿದೆ",
    "IndexedDB offline draft queues and local storage": "IndexedDB ಆಫ್‌ಲೈನ್ ಕರಡು ಸರತಿಗಳು ಮತ್ತು ಸ್ಥಳೀಯ ಸಂಗ್ರಹ",
    "IndexedDB offline submission queue & drafts": "IndexedDB ಆಫ್‌ಲೈನ್ ಸಲ್ಲಿಕೆ ಸರತಿ ಮತ್ತು ಕರಡುಗಳು",
    "infrastructure": "ಮೂಲಸೌಕರ್ಯ",
    "Initial (Incoming)": "ಪ್ರಾರಂಭಿಕ (ಹೊಸದು)",
    "Initial inspection / verification.": "ಪ್ರಾರಂಭಿಕ ತಪಾಸಣೆ / ಪರಿಶೀಲನೆ.",
    "Initiate Complete Factory Reset (Mode B)": "ಸಂಪೂರ್ಣ ಫ್ಯಾಕ್ಟರಿ ಮರುಹೊಂದಿಕೆ ಪ್ರಾರಂಭಿಸಿ (ಮೋಡ್ ಬಿ)",
    "Initiate Operational Reset (Mode A)": "ಕಾರ್ಯಾಚರಣಾ ಮರುಹೊಂದಿಕೆ ಪ್ರಾರಂಭಿಸಿ (ಮೋಡ್ ಎ)",
    "Inspect": "ಪರಿಶೀಲಿಸಿ",
    "Inspection Scheduled: Field inspection scheduled within 48 hours": "ತಪಾಸಣೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ: 48 ಗಂಟೆಗಳ ಒಳಗೆ ಸ್ಥಳ ತಪಾಸಣೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ",
    "Inspection, cost planning, or department coordination.": "ಸ್ಥಳ ತಪಾಸಣೆ, ವೆಚ್ಚ ಯೋಜನೆ ಅಥವಾ ಇಲಾಖಾ ಸಮನ್ವಯ.",
    "Install JANASEVA App for offline village access": "ಆಫ್‌ಲೈನ್ ಗ್ರಾಮ ಪ್ರವೇಶಕ್ಕಾಗಿ ಜನಸೇವಾ ಅಪ್ಲಿಕೇಶನ್ ಸ್ಥಾಪಿಸಿ",
    "Integrity": "ಸಮಗ್ರತೆ",
    "Internal Administrative Note (Officials Only)": "ಆಂತರಿಕ ಆಡಳಿತಾತ್ಮಕ ಟಿಪ್ಪಣಿ (ಅಧಿಕಾರಿಗಳಿಗೆ ಮಾತ್ರ)",
    "invalid credentials. please verify your email and password.": "ಅಮಾನ್ಯ ರುಜುವಾತುಗಳು. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಿ.",
    "irregular water supply": "ಅನಿಯಮಿತ ನೀರು ಸರಬರಾಜು",
    "Issue already resolved prior to inspection": "ತಪಾಸಣೆಗೆ ಮುಂಚಿತವಾಗಿಯೇ ಸಮಸ್ಯೆ ಬಗೆಹರಿದಿದೆ",
    "issue category": "ಸಮಸ್ಯೆಯ ವರ್ಗ",
    "issues": "ಸಮಸ್ಯೆಗಳು",
    "janaseva": "ಜನಸೇವಾ",
    "JANASEVA AI": "ಜನಸೇವಾ ಎಐ",
    "janaseva aims to provide a simple, transparent, and convenient way for citizens to report local issues to their gram panchayat and track their resolution online": "ಜನಸೇವಾ ಗ್ರಾಮೀಣ ನಾಗರಿಕರಿಗೆ ತಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗೆ ಸ್ಥಳೀಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಲು ಮತ್ತು ಅವುಗಳ ಪರಿಹಾರವನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಸರಳ, ಪಾರದರ್ಶಕ ಮತ್ತು ಅನುಕೂಲಕರ ವೇದಿಕೆಯನ್ನು ಒದಗಿಸುವ ಗುರಿಯನ್ನು ಹೊಂದಿದೆ",
    "janaseva aims to provide a simple, transparent, and convenient way for citizens to report local issues to their gram panchayat and track their resolution online.": "ಜನಸೇವಾ ಗ್ರಾಮೀಣ ನಾಗರಿಕರಿಗೆ ತಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗೆ ಸ್ಥಳೀಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಲು ಮತ್ತು ಅವುಗಳ ಪರಿಹಾರವನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಸರಳ, ಪಾರದರ್ಶಕ ಮತ್ತು ಅನುಕೂಲಕರ ವೇದಿಕೆಯನ್ನು ಒದಗಿಸುವ ಗುರಿಯನ್ನು ಹೊಂದಿದೆ.",
    "janaseva – digital grievance management system": "ಜನಸೇವಾ – ಡಿಜಿಟಲ್ ಕುಂದುಕೊರತೆ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ",
    "janaseva – digital grievance management system | login": "ಜನಸೇವಾ – ಡಿಜಿಟಲ್ ಕುಂದುಕೊರತೆ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ | ಲಾಗಿನ್",
    "janaseva – gram panchayat grievance portal": "ಜನಸೇವಾ – ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ಪೋರ್ಟಲ್",
    "janaseva – gram panchayat grievance portal. this portal is an academic student project created for civic grievance demonstration. not an official government of india website": "ಜನಸೇವಾ – ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ಪೋರ್ಟಲ್. ಈ ಪೋರ್ಟಲ್ ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ರಚಿಸಲಾದ ಶೈಕ್ಷಣಿಕ ವಿದ್ಯಾರ್ಥಿ ಯೋಜನೆಯಾಗಿದೆ. ಭಾರತ ಸರ್ಕಾರದ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಅಲ್ಲ",
    "janaseva – gram panchayat grievance portal. this portal is an academic student project created for civic grievance demonstration. not an official government of india website.": "ಜನಸೇವಾ – ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ಪೋರ್ಟಲ್. ಈ ಪೋರ್ಟಲ್ ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ರಚಿಸಲಾದ ಶೈಕ್ಷಣಿಕ ವಿದ್ಯಾರ್ಥಿ ಯೋಜನೆಯಾಗಿದೆ. ಭಾರತ ಸರ್ಕಾರದ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಅಲ್ಲ.",
    "JPG, JPEG, PNG, WEBP • Max 5 MB": "JPG, JPEG, PNG, WEBP • ಗರಿಷ್ಠ 5 MB",
    "JPG, PNG, WEBP": "JPG, PNG, WEBP",
    "Jurisdiction Notice: Forwarded to competent external department": "ವ್ಯಾಪ್ತಿ ಸೂಚನೆ: ಸಕ್ಷಮ ಬಾಹ್ಯ ಇಲಾಖೆಗೆ ರವಾನಿಸಲಾಗಿದೆ",
    "kadaba gram panchayat": "ಕಡಬ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "karkala": "ಕಾರ್ಕಳ",
    "karkala rural gram panchayat": "ಕಾರ್ಕಳ ಗ್ರಾಮೀಣ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "kavoor gp": "ಕಾವೂರು ಜಿ.ಪಿ",
    "kavoor gram panchayat": "ಕಾವೂರು ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Keep Both Grievances": "ಎರಡೂ ದೂರುಗಳನ್ನು ಉಳಿಸಿಕೊಳ್ಳಿ",
    "keep the receiver email address updated for uninterrupted complaint delivery": "ದೂರುಗಳು ಅಡೆತಡೆಯಿಲ್ಲದೆ ತಲುಪಲು ಸ್ವೀಕೃತಿದಾರರ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನವೀಕರಿಸಿ ಇರಿಸಿ",
    "keep the receiver email address updated for uninterrupted complaint delivery.": "ದೂರುಗಳು ಅಡೆತಡೆಯಿಲ್ಲದೆ ತಲುಪಲು ಸ್ವೀಕೃತಿದಾರರ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನವೀಕರಿಸಿ ಇರಿಸಿ.",
    "key features": "ಪ್ರಮುಖ ವೈಶಿಷ್ಟ್ಯಗಳು",
    "Kotekar": "ಕೋಟೆಕಾರ್",
    "Kotekar Gram Panchayat": "ಕೋಟೆಕಾರ್ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "kundapura": "ಕುಂದಾಪುರ",
    "kundapura gram panchayat": "ಕುಂದಾಪುರ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Last Updated": "ಕೊನೆಯ ನವೀಕರಣ",
    "last verified: checking cloud configuration...": "ಕೊನೆಯ ಪರಿಶೀಲನೆ: ಕ್ಲೌಡ್ ಕಾನ್ಫಿಗರೇಶನ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    "Leave empty if on schedule. Otherwise specify reason (weather, contractor, equipment)...": "ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ನಡೆಯುತ್ತಿದ್ದರೆ ಖಾಲಿ ಬಿಡಿ. ಇಲ್ಲದಿದ್ದರೆ ಕಾರಣವನ್ನು ತಿಳಿಸಿ...",
    "List specific repairs, cleanups, or construction done on site...": "ಸ್ಥಳದಲ್ಲಿ ಮಾಡಿದ ನಿರ್ದಿಷ್ಟ ದುರಸ್ತಿ, ಸ್ವಚ್ಛತೆ ಅಥವಾ ನಿರ್ಮಾಣ ಕಾರ್ಯಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ...",
    "Listening... Speak now": "ಆಲಿಸುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ",
    "LIVE": "ಲೈವ್",
    "Live algorithmic hazard detection, systemic failure pattern analysis, recurring civic problem clusters, and priority distribution across Gram Panchayats.": "ಲೈವ್ ಅಲ್ಗಾರಿದಮಿಕ್ ಅಪಾಯ ಪತ್ತೆ, ವ್ಯವಸ್ಥಿತ ವೈಫಲ್ಯದ ಮಾದರಿ ವಿಶ್ಲೇಷಣೆ, ಮರುಕಳಿಸುವ ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳು ಮತ್ತು ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳಲ್ಲಿ ಆದ್ಯತೆಯ ಹಂಚಿಕೆ.",
    "live camera": "ಲೈವ್ ಕ್ಯಾಮೆರಾ",
    "live camera capture": "ಲೈವ್ ಕ್ಯಾಮೆರಾ ಸೆರೆಹಿಡಿಯುವಿಕೆ",
    "live camera or device upload": "ಲೈವ್ ಕ್ಯಾಮೆರಾ ಅಥವಾ ಸಾಧನದ ಅಪ್‌ಲೋಡ್",
    "live camera or upload": "ಲೈವ್ ಕ್ಯಾಮೆರಾ ಅಥವಾ ಅಪ್‌ಲೋಡ್",
    "Live System Impact Assessment": "ನೇರ ಸಿಸ್ಟಮ್ ಪರಿಣಾಮ ಮೌಲ್ಯಮಾಪನ",
    "Live Visual Badge Preview": "ನೇರ ದೃಶ್ಯ ಬ್ಯಾಡ್ಜ್ ಪೂರ್ವವೀಕ್ಷಣೆ",
    "Live wires, epidemics, road caving": "ಲೈವ್ ವಿದ್ಯುತ್ ತಂತಿಗಳು, ಸಾಂಕ್ರಾಮಿಕ ರೋಗಗಳು, ರಸ್ತೆ ಕುಸಿತ",
    "loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ",
    "Loading audit ledger...": "ಆಡಿಟ್ ಲೆಡ್ಜರ್ ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "Loading communication history...": "ಸಂವಹನ ಇತಿಹಾಸವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "Loading emergency backups...": "ತುರ್ತು ಬ್ಯಾಕಪ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "Loading quarantined records...": "ಕ್ವಾರಂಟೈನ್ ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "Loading updates folder records...": "ನವೀಕರಣಗಳ ಫೋಲ್ಡರ್ ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "loading...": "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    "Location": "ಸ್ಥಳ",
    "lodge a complaint": "ದೂರು ದಾಖಲಿಸಿ",
    "lodge complaint": "ದೂರು ದಾಖಲಿಸಿ",
    "Log ID": "ಲಾಗ್ ಐಡಿ",
    "log in to emailjs": "EmailJS ಗೆ ಲಾಗಿನ್ ಆಗಿ",
    "log in to your janaseva account": "ನಿಮ್ಮ ಜನಸೇವಾ ಖಾತೆಗೆ ಲಾಗಿನ್ ಆಗಿ",
    "log in to your janaseva account.": "ನಿಮ್ಮ ಜನಸೇವಾ ಖಾತೆಗೆ ಲಾಗಿನ್ ಆಗಿ.",
    "login": "ಲಾಗಿನ್",
    "login / register": "ಲಾಗಿನ್ / ನೋಂದಣಿ",
    "logout": "ಲಾಗ್‌ಔಟ್",
    "LOW": "ಕಡಿಮೆ",
    "LOW (Minor / Informational Request)": "ಕಡಿಮೆ (ಸಣ್ಣ / ಮಾಹಿತಿ ವಿನಂತಿ)",
    "LOW (Minor / Maintenance)": "ಕಡಿಮೆ (ಸಣ್ಣ / ನಿರ್ವಹಣೆ)",
    "Low Priority": "ಕಡಿಮೆ ಆದ್ಯತೆ",
    "Lowest Progress First": "ಕಡಿಮೆ ಪ್ರಗತಿ ಮೊದಲು",
    "make an email template and copy the template id": "ಇಮೇಲ್ ಟೆಂಪ್ಲೇಟ್ ಮಾಡಿ ಮತ್ತು ಟೆಂಪ್ಲೇಟ್ ಐಡಿ ನಕಲಿಸಿ",
    "make an email template and copy the template id.": "ಇಮೇಲ್ ಟೆಂಪ್ಲೇಟ್ ಮಾಡಿ ಮತ್ತು ಟೆಂಪ್ಲೇಟ್ ಐಡಿ ನಕಲಿಸಿ.",
    "make your village better": "ನಿಮ್ಮ ಗ್ರಾಮವನ್ನು ಉತ್ತಮಗೊಳಿಸಿ",
    "Manage Banner Image": "ಬ್ಯಾನರ್ ಚಿತ್ರ ನಿರ್ವಹಿಸಿ",
    "Manage primary cloud Firestore persistence, storage replication, disaster recovery snapshots, and export archives.": "ಪ್ರಾಥಮಿಕ ಕ್ಲೌಡ್ ಫೈರ್‌ಸ್ಟೋರ್ ಸಂಗ್ರಹಣೆ, ಶೇಖರಣಾ ಪ್ರತಿರೂಪಣೆ, ವಿಪತ್ತು ಮರುಪಡೆಯುವಿಕೆ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ಗಳು ಮತ್ತು ರಫ್ತು ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ.",
    "manage the active destination email address where citizen grievances are delivered.": "ನಾಗರಿಕರ ಕುಂದುಕೊರತೆಗಳು ತಲುಪುವ ಸಕ್ರಿಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಿರ್ವಹಿಸಿ.",
    "Mandatory reason for audit log (e.g., Adding dedicated site inspection stage)...": "ಆಡಿಟ್ ಲಾಗ್‌ಗಾಗಿ ಕಡ್ಡಾಯ ಕಾರಣ (ಉದಾ. ಪ್ರತ್ಯೇಕ ಸ್ಥಳ ತಪಾಸಣೆ ಹಂತವನ್ನು ಸೇರಿಸುವುದು)...",
    "Mandatory Reason for Rejection": "ತಿರಸ್ಕಾರಕ್ಕೆ ಕಡ್ಡಾಯ ಕಾರಣ",
    "mangaluru": "ಮಂಗಳೂರು",
    "Master Emergency Data Reset System": "ಮಾಸ್ಟರ್ ತುರ್ತು ಡೇಟಾ ಮರುಹೊಂದಿಕೆ ವ್ಯವಸ್ಥೆ",
    "Max 10MB": "ಗರಿಷ್ಠ 10MB",
    "Message Type:": "ಸಂದೇಶದ ಪ್ರಕಾರ:",
    "Milestone Order (1-10)": "ಮೈಲಿಗಲ್ಲು ಕ್ರಮ (1-10)",
    "Minor cosmetic & routine maintenance": "ಸಣ್ಣಪುಟ್ಟ ಮತ್ತು ವಾಡಿಕೆಯ ನಿರ್ವಹಣೆ",
    "Missing Required Fields": "ಅಗತ್ಯ ವಿವರಗಳು ಕಾಣೆಯಾಗಿವೆ",
    "mobile number": "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    "Mobile Phone Number": "ಮೊಬೈಲ್ ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    "Mode": "ಮೋಡ್",
    "MODE A": "ಮೋಡ್ ಎ",
    "MODE B": "ಮೋಡ್ ಬಿ",
    "mon - sat: 10:00 am - 5:30 pm": "ಸೋಮ - ಶನಿ: ಬೆಳಿಗ್ಗೆ 10:00 - ಸಂಜೆ 5:30",
    "Monitor complaint allocation, active workloads, and resolution performance across all Gram Panchayats.": "ಎಲ್ಲಾ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳಲ್ಲಿ ದೂರುಗಳ ಹಂಚಿಕೆ, ಸಕ್ರಿಯ ಕೆಲಸದ ಹೊರೆ ಮತ್ತು ಪರಿಹಾರದ ಸಾಧನೆಯನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ.",
    "Month": "ತಿಂಗಳು",
    "Monthly Filing & Resolution History": "ಮಾಸಿಕ ಸಲ್ಲಿಕೆ ಮತ್ತು ಪರಿಹಾರ ಇತಿಹಾಸ",
    "moodbidri": "ಮೂಡುಬಿದಿರೆ",
    "moodbidri gram panchayat": "ಮೂಡುಬಿದಿರೆ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Move Duplicate to Recycle Bin": "ನಕಲಿ ದೂರನ್ನು ರಿಸೈಕಲ್ ಬಿನ್‌ಗೆ ಸರಿಸಿ",
    "Move selected grievances to Protected Recycle Bin": "ಆಯ್ದ ದೂರುಗಳನ್ನು ಸಂರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್‌ಗೆ ಸರಿಸಿ",
    "Move Selected to Recycle Bin": "ಆಯ್ದವುಗಳನ್ನು ರಿಸೈಕಲ್ ಬಿನ್‌ಗೆ ಸರಿಸಿ",
    "move to deleted history": "ಅಳಿಸಿದ ಇತಿಹಾಸಕ್ಕೆ ಸರಿಸಿ",
    "my complaint report": "ನನ್ನ ದೂರು ವರದಿ",
    "my complaint report & analytics": "ನನ್ನ ದೂರು ವರದಿ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ",
    "my complaints": "ನನ್ನ ದೂರುಗಳು",
    "my complaints & history": "ನನ್ನ ದೂರುಗಳು ಮತ್ತು ಇತಿಹಾಸ",
    "My Dashboard": "ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "My Grievances": "ನನ್ನ ದೂರುಗಳು",
    "My Registered Grievances": "ನನ್ನ ನೋಂದಾಯಿತ ದೂರುಗಳು",
    "N/A": "ಲಭ್ಯವಿಲ್ಲ",
    "nadugodu gp": "ನಡುಗೋಡು ಜಿ.ಪಿ",
    "nadugodu gram panchayat": "ನಡುಗೋಡು ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "name": "ಹೆಸರು",
    "need help": "ಸಹಾಯ ಬೇಕೇ",
    "need help?": "ಸಹಾಯ ಬೇಕೇ?",
    "Needs Response": "ಪ್ರತಿಕ್ರಿಯೆಯ ಅಗತ್ಯವಿದೆ",
    "new citizen registration": "ಹೊಸ ನಾಗರಿಕ ನೋಂದಣಿ",
    "new complaint notification": "ಹೊಸ ದೂರು ಅಧಿಸೂಚನೆ",
    "New Grievance": "ಹೊಸ ದೂರು",
    "new led streetlights installed along main road junction. all lights verified functional": "ಮುಖ್ಯ ರಸ್ತೆ ಜಂಕ್ಷನ್‌ನಲ್ಲಿ ಹೊಸ ಎಲ್‌ಇಡಿ ಬೀದಿ ದೀಪಗಳನ್ನು ಅಳವಡಿಸಲಾಗಿದೆ. ಎಲ್ಲಾ ದೀಪಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ ಎಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "new led streetlights installed along main road junction. all lights verified functional.": "ಮುಖ್ಯ ರಸ್ತೆ ಜಂಕ್ಷನ್‌ನಲ್ಲಿ ಹೊಸ ಎಲ್‌ಇಡಿ ಬೀದಿ ದೀಪಗಳನ್ನು ಅಳವಡಿಸಲಾಗಿದೆ. ಎಲ್ಲಾ ದೀಪಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ ಎಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
    "new receiving email address": "ಹೊಸ ಸ್ವೀಕೃತಿ ಇಮೇಲ್ ವಿಳಾಸ",
    "new recipient:": "ಹೊಸ ಸ್ವೀಕೃತಿದಾರರು:",
    "new to janaseva?": "ಜನಸೇವಾಗೆ ಹೊಸಬರೇ?",
    "Newest First": "ಹೊಸದು ಮೊದಲು",
    "next expected action": "ಮುಂದಿನ ನಿರೀಕ್ಷಿತ ಕ್ರಮ",
    "No active emergency public hazards detected across assigned Gram Panchayats.": "ಗೊತ್ತುಪಡಿಸಿದ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ತುರ್ತು ಸಾರ್ವಜನಿಕ ಅಪಾಯಗಳು ಪತ್ತೆಯಾಗಿಲ್ಲ.",
    "no complaint found": "ಯಾವುದೇ ದೂರು ಕಂಡುಬಂದಿಲ್ಲ",
    "No complaints in current scope.": "ಪ್ರಸ್ತುತ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಯಾವುದೇ ದೂರುಗಳಿಲ್ಲ.",
    "No Contact": "ಸಂಪರ್ಕವಿಲ್ಲ",
    "No recurring problem clusters or hotspots detected at this threshold.": "ಈ ಮಿತಿಯಲ್ಲಿ ಯಾವುದೇ ಮರುಕಳಿಸುವ ಸಮಸ್ಯೆಗಳ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು ಪತ್ತೆಯಾಗಿಲ್ಲ.",
    "no smtp passwords are exposed in client-side html or javascript.": "ಕ್ಲೈಂಟ್-ಸೈಡ್ HTML ಅಥವಾ JavaScript ನಲ್ಲಿ ಯಾವುದೇ SMTP ಪಾಸ್‌ವರ್ಡ್ ಬಹಿರಂಗವಾಗಿಲ್ಲ.",
    "Non-civic / unrelated matter": "ನಾಗರಿಕ ಸಮಸ್ಯೆಯಲ್ಲ / ಸಂಬಂಧವಿಲ್ಲದ ವಿಷಯ",
    "None": "ಯಾವುದೂ ಇಲ್ಲ",
    "None recorded yet.": "ಇನ್ನೂ ಯಾವುದೂ ದಾಖಲಾಗಿಲ್ಲ.",
    "NORMAL": "ಸಾಮಾನ್ಯ",
    "NORMAL (Standard Processing Time)": "ಸಾಮಾನ್ಯ (ಪ್ರಮಾಣಿತ ಪ್ರಕ್ರಿಯೆ ಸಮಯ)",
    "NORMAL OPERATIONAL": "ಸಾಮಾನ್ಯ ಕಾರ್ಯಾಚರಣೆ",
    "Normal Priority": "ಸಾಮಾನ್ಯ ಆದ್ಯತೆ",
    "Not Started": "ಪ್ರಾರಂಭವಾಗಿಲ್ಲ",
    "note": "ಟಿಪ್ಪಣಿ",
    "note:": "ಟಿಪ್ಪಣಿ:",
    "notice text...": "ಸೂಚನಾ ಪಠ್ಯ...",
    "Notification Logs": "ಅಧಿಸೂಚನೆ ಲಾಗ್‌ಗಳು",
    "office address": "ಕಚೇರಿ ವಿಳಾಸ",
    "office phone": "ಕಚೇರಿ ದೂರವಾಣಿ",
    "office timings": "ಕಚೇರಿಯ ಸಮಯ",
    "Officer Justification & Notes": "ಅಧಿಕಾರಿಯ ಸಮರ್ಥನೆ ಮತ್ತು ಟಿಪ್ಪಣಿಗಳು",
    "OFFICIAL ADMIN RESPONSE & COMMUNICATION HISTORY": "ಅಧಿಕೃತ ಆಡಳಿತ ಪ್ರತಿಕ್ರಿಯೆ ಮತ್ತು ಸಂವಹನ ಇತಿಹಾಸ",
    "OFFICIAL ADMIN RESPONSE & COMMUNICATION THREAD": "ಅಧಿಕೃತ ಆಡಳಿತ ಪ್ರತಿಕ್ರಿಯೆ ಮತ್ತು ಸಂವಹನ",
    "Official communication threads and messages": "ಅಧಿಕೃತ ಸಂವಹನ ಎಳೆಗಳು ಮತ್ತು ಸಂದೇಶಗಳು",
    "official contact": "ಅಧಿಕೃತ ಸಂಪರ್ಕ",
    "official dashboard": "ಅಧಿಕೃತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "official email": "ಅಧಿಕೃತ ಇಮೇಲ್",
    "official government digital services • protected by role-based authorization": "ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಡಿಜಿಟಲ್ ಸೇವೆಗಳು • ಪಾತ್ರ-ಆಧಾರಿತ ದೃಢೀಕರಣದಿಂದ ರಕ್ಷಿಸಲಾಗಿದೆ",
    "Official Gram Panchayat Receiver logins": "ಅಧಿಕೃತ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸ್ವೀಕೃತಿದಾರರ ಲಾಗಿನ್‌ಗಳು",
    "Official Grievance Control & Response Center": "ಅಧಿಕೃತ ದೂರು ನಿಯಂತ್ರಣ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಕೇಂದ್ರ",
    "official grievance redressal": "ಅಧಿಕೃತ ಕುಂದುಕೊರತೆ ಪರಿಹಾರ",
    "official notes": "ಅಧಿಕೃತ ಟಿಪ್ಪಣಿಗಳು",
    "official notice / announcement": "ಅಧಿಕೃತ ಸೂಚನೆ / ಪ್ರಕಟಣೆ",
    "official notice / announcement text": "ಅಧಿಕೃತ ಸೂಚನೆ / ಪ್ರಕಟಣೆಯ ಪಠ್ಯ",
    "official notice / announcement:": "ಅಧಿಕೃತ ಸೂಚನೆ / ಪ್ರಕಟಣೆ:",
    "Official Public Response (Visible to Citizen)": "ಅಧಿಕೃತ ಸಾರ್ವಜನಿಕ ಪ್ರತಿಕ್ರಿಯೆ (ನಾಗರಿಕರಿಗೆ ಗೋಚರಿಸುತ್ತದೆ)",
    "official receiver": "ಅಧಿಕೃತ ಸ್ವೀಕೃತಿದಾರರು",
    "Official Receiver": "ಅಧಿಕೃತ ಸ್ವೀಕರಿಸುವವರು",
    "official remarks": "ಅಧಿಕೃತ ಟಿಪ್ಪಣಿಗಳು",
    "official remarks / response to citizen": "ಅಧಿಕೃತ ಟಿಪ್ಪಣಿಗಳು / ನಾಗರಿಕರಿಗೆ ಪ್ರತಿಕ್ರಿಯೆ",
    "Official resolution velocity and work completion metrics across your filed grievances.": "ನೀವು ಸಲ್ಲಿಸಿದ ದೂರುಗಳ ಅಧಿಕೃತ ಪರಿಹಾರ ವೇಗ ಮತ್ತು ಕೆಲಸ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಅಂಕಿಅಂಶಗಳು.",
    "Official Responses & Message History": "ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಮತ್ತು ಸಂದೇಶ ಇತಿಹಾಸ",
    "Official Site Work Progress Photo:": "ಅಧಿಕೃತ ಸ್ಥಳ ಕಾಮಗಾರಿ ಪ್ರಗತಿ ಛಾಯಾಚಿತ್ರ:",
    "official update": "ಅಧಿಕೃತ ಅಪ್‌ಡೇಟ್",
    "official updates & remarks": "ಅಧಿಕೃತ ಅಪ್‌ಡೇಟ್‌ಗಳು ಮತ್ತು ಟಿಪ್ಪಣಿಗಳು",
    "Offline Grievance Drafts": "ಆಫ್‌ಲೈನ್ ದೂರು ಕರಡುಗಳು",
    "Offline Mode": "ಆಫ್‌ಲೈನ್ ಮೋಡ್",
    "Offline Queue": "ಆಫ್‌ಲೈನ್ ಸರತಿ",
    "Offline Synchronization": "ಆಫ್‌ಲೈನ್ ಸಿಂಕ್ರೊನೈಸೇಶನ್",
    "Oldest First": "ಹಳೆಯದು ಮೊದಲು",
    "Online": "ಆನ್‌ಲೈನ್",
    "only an authorized administrator should change these settings": "ಅಧಿಕೃತ ನಿರ್ವಾಹಕರು ಮಾತ್ರ ಈ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಬೇಕು",
    "only an authorized administrator should change these settings.": "ಅಧಿಕೃತ ನಿರ್ವಾಹಕರು ಮಾತ್ರ ಈ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಬೇಕು.",
    "only the authenticated receiver account can view and modify these settings. administrators are barred.": "ಕೇವಲ ದೃಢೀಕೃತ ಸ್ವೀಕೃತಿದಾರರ ಖಾತೆ ಮಾತ್ರ ಈ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಬಹುದು ಮತ್ತು ಮಾರ್ಪಡಿಸಬಹುದು. ನಿರ್ವಾಹಕರಿಗೆ ಪ್ರವೇಶವಿಲ್ಲ.",
    "Open": "ತೆರೆದಿದೆ",
    "open camera": "ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ",
    "Open device camera to capture live photograph": "ನೇರ ಛಾಯಾಚಿತ್ರ ತೆಗೆಯಲು ಸಾಧನದ ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ",
    "Open in Full Admin Control Centre": "ಸಂಪೂರ್ಣ ನಿರ್ವಾಹಕ ನಿಯಂತ್ರಣ ಕೇಂದ್ರದಲ್ಲಿ ತೆರೆಯಿರಿ",
    "open live camera": "ಲೈವ್ ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ",
    "Operation Impact": "ಕಾರ್ಯಾಚರಣೆಯ ಪರಿಣಾಮ",
    "Operation Mode": "ಕಾರ್ಯಾಚರಣೆ ಮೋಡ್",
    "Operation Progress": "ಕಾರ್ಯಾಚರಣೆಯ ಪ್ರಗತಿ",
    "Operational Data Reset": "ಕಾರ್ಯಾಚರಣಾ ಡೇಟಾ ಮರುಹೊಂದಿಕೆ",
    "Operational Grievance Data Cleanse": "ಕಾರ್ಯಾಚರಣಾ ದೂರು ಡೇಟಾ ಸ್ವಚ್ಛತೆ",
    "Operational lifecycle cleanse. Purges grievance transactions and messages while keeping all user accounts intact.": "ಕಾರ್ಯಾಚರಣಾ ಸ್ವಚ್ಛತೆ. ಎಲ್ಲಾ ಬಳಕೆದಾರರ ಖಾತೆಗಳನ್ನು ಉಳಿಸಿಕೊಂಡು ದೂರು ವಹಿವಾಟು ಮತ್ತು ಸಂದೇಶಗಳನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ.",
    "OPERATIONAL PURGE": "ಕಾರ್ಯಾಚರಣಾ ತೆರವು",
    "Operator": "ನಿರ್ವಾಹಕರು",
    "Order": "ಕ್ರಮ",
    "Original Submission Date": "ಮೂಲ ಸಲ್ಲಿಕೆ ದಿನಾಂಕ",
    "other": "ಇತರ",
    "Other administrative review required": "ಇತರ ಆಡಳಿತಾತ್ಮಕ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ",
    "other civic issues": "ಇತರ ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳು",
    "our objective": "ನಮ್ಮ ಉದ್ದೇಶ",
    "our vision": "ನಮ್ಮ ದೃಷ್ಟಿಕೋನ",
    "Out of Panchayat scope or duplicate submission.": "ಪಂಚಾಯತ್ ವ್ಯಾಪ್ತಿಯಿಂದ ಹೊರಗಿದೆ ಅಥವಾ ನಕಲಿ ಸಲ್ಲಿಕೆ.",
    "Out of scope / invalid": "ವ್ಯಾಪ್ತಿಯ ಹೊರಗೆ / ಅಮಾನ್ಯ",
    "Outside Gram Panchayat jurisdiction": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ವ್ಯಾಪ್ತಿಯಿಂದ ಹೊರಗಿದೆ",
    "overall resolution rate:": "ಒಟ್ಟಾರೆ ಪರಿಹಾರ ದರ:",
    "Overdue": "ಬಾಕಿ ಉಳಿದಿದೆ",
    "Overdue (>7d)": "ಬಾಕಿ (>೭ ದಿನ)",
    "Overview of required physical tasks and designated field workers...": "ಅಗತ್ಯವಿರುವ ಭೌತಿಕ ಕಾಮಗಾರಿಗಳು ಮತ್ತು ನಿಯೋಜಿತ ಸಿಬ್ಬಂದಿಯ ವಿವರಣೆ...",
    "Panchayat": "ಪಂಚಾಯತ್",
    "Panchayat & Category": "ಪಂಚಾಯತ್ ಮತ್ತು ವರ್ಗ",
    "Panchayat Administrative Services": "ಪಂಚಾಯತ್ ಆಡಳಿತಾತ್ಮಕ ಸೇವೆಗಳು",
    "panchayat bhavan road": "ಪಂಚಾಯತ್ ಭವನ ರಸ್ತೆ",
    "panchayat details": "ಪಂಚಾಯತ್ ವಿವರಗಳು",
    "panchayat development officer": "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ",
    "panchayat development officer (pdo)": "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ (PDO)",
    "Panchayat Directory": "ಪಂಚಾಯತ್ ವಿವರ ಕೋಶ",
    "panchayat directory": "ಪಂಚಾಯತ್ ಡೈರೆಕ್ಟರಿ",
    "Panchayat directory and system settings": "ಪಂಚಾಯತ್ ವಿವರ ಕೋಶ ಮತ್ತು ಸಿಸ್ಟಮ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "panchayat grievance receiver": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕುಂದುಕೊರತೆ ಸ್ವೀಕೃತಿದಾರರು",
    "Panchayat Intelligence & Hotspots": "ಪಂಚಾಯತ್ ಗುಪ್ತಚರ ಮತ್ತು ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು",
    "panchayat name": "ಪಂಚಾಯತ್ ಹೆಸರು",
    "panchayat office": "ಪಂಚಾಯತ್ ಕಚೇರಿ",
    "panchayat official dashboard": "ಪಂಚಾಯತ್ ಅಧಿಕಾರಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "panchayat official dashboard – janaseva portal": "ಪಂಚಾಯತ್ ಅಧಿಕಾರಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ – ಜನಸೇವಾ ಪೋರ್ಟಲ್",
    "panchayat receiver portal": "ಪಂಚಾಯತ್ ಸ್ವೀಕೃತಿದಾರರ ಪೋರ್ಟಲ್",
    "Panchayat Receivers & Workload Distribution": "ಪಂಚಾಯತ್ ಸ್ವೀಕರಿಸುವವರು ಮತ್ತು ಕೆಲಸದ ಹಂಚಿಕೆ",
    "panchayat takes timely action and updates resolution status online": "ಪಂಚಾಯತ್ ಸಕಾಲಿಕ ಕ್ರಮ ಕೈಗೊಳ್ಳುತ್ತದೆ ಮತ್ತು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪರಿಹಾರ ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸುತ್ತದೆ",
    "Panchayats exhibiting recurring problem clusters (≥ 2 incidents in category).": "ಮರುಕಳಿಸುವ ಸಮಸ್ಯೆಯ ಸಮೂಹಗಳನ್ನು ಹೊಂದಿರುವ ಪಂಚಾಯತ್‌ಗಳು (ವಿಭಾಗದಲ್ಲಿ ಕನಿಷ್ಠ 2 ಘಟನೆಗಳು).",
    "password": "ಪಾಸ್‌ವರ್ಡ್",
    "pdo name": "ಪಿಡಿಒ ಹೆಸರು",
    "pending": "ಬಾಕಿ ಉಳಿದಿದೆ",
    "Pending assignment / review": "ನಿಯೋಜನೆ / ಪರಿಶೀಲನೆ ಬಾಕಿ",
    "pending complaints": "ಬಾಕಿ ಇರುವ ದೂರುಗಳು",
    "Pending field team deployment.": "ಕ್ಷೇತ್ರ ತಂಡದ ನಿಯೋಜನೆ ಬಾಕಿ ಇದೆ.",
    "Pending Submissions": "ಬಾಕಿ ಸಲ್ಲಿಕೆಗಳು",
    "Pending Sync": "ಸಿಂಕ್ ಬಾಕಿಯಿದೆ",
    "Pending tasks before site completion...": "ಸ್ಥಳೀಯ ಕಾಮಗಾರಿ ಪೂರ್ಣಗೊಳ್ಳುವ ಮುನ್ನ ಬಾಕಿ ಇರುವ ಕೆಲಸಗಳು...",
    "Permanent audit certificate logged to": "ಶಾಶ್ವತ ಆಡಿಟ್ ಪ್ರಮಾಣಪತ್ರವನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ:",
    "Permanent Database & Backup Health Center": "ಶಾಶ್ವತ ಡೇಟಾಬೇಸ್ ಮತ್ತು ಬ್ಯಾಕಪ್ ಕೇಂದ್ರ",
    "Permanent Deletion Authorization": "ಶಾಶ್ವತ ಅಳಿಸುವಿಕೆ ಅಧಿಕಾರ",
    "Permanently Delete Complaint (Admin Only)": "ದೂರನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ (ಆಡಳಿತಕ್ಕೆ ಮಾತ್ರ)",
    "Permanently Delete Record": "ದಾಖಲೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ",
    "Personal complaint history, verified work progress tracking, chronological activity timeline, and delete management.": "ವೈಯಕ್ತಿಕ ದೂರು ಇತಿಹಾಸ, ಪರಿಶೀಲಿಸಿದ ಕೆಲಸದ ಪ್ರಗತಿ ಟ್ರ್ಯಾಕಿಂಗ್, ಕಾಲಾನುಕ್ರಮದ ಚಟುವಟಿಕೆ ಟೈಮ್‌ಲೈನ್ ಮತ್ತು ಅಳಿಸುವಿಕೆ ನಿರ್ವಹಣೆ.",
    "Personal grievance records associated with your verified account.": "ನಿಮ್ಮ ಪರಿಶೀಲಿಸಿದ ಖಾತೆಗೆ ಸಂಬಂಧಿಸಿದ ವೈಯಕ್ತಿಕ ದೂರುಗಳ ದಾಖಲೆಗಳು.",
    "Photo Captured": "ಫೋಟೋ ಸೆರೆಹಿಡಿಯಲಾಗಿದೆ",
    "photograph of the issue": "ಸಮಸ್ಯೆಯ ಭಾವಚಿತ್ರ",
    "Phrase": "ಪದಗುಚ್ಛ",
    "portal authentication": "ಪೋರ್ಟಲ್ ದೃಢೀಕರಣ",
    "Portal is placed into Emergency Maintenance Mode during the purge.": "ತೆರವು ಸಮಯದಲ್ಲಿ ಪೋರ್ಟಲ್ ಅನ್ನು ತುರ್ತು ನಿರ್ವಹಣಾ ಮೋಡ್‌ನಲ್ಲಿ ಇರಿಸಲಾಗುತ್ತದೆ.",
    "Portal Maintenance Active – Submissions Paused": "ಪೋರ್ಟಲ್ ನಿರ್ವಹಣೆ ಸಕ್ರಿಯವಾಗಿದೆ – ಸಲ್ಲಿಕೆಗಳು ವಿರಾಮಗೊಂಡಿವೆ",
    "Portal Maintenance Mode Status:": "ಪೋರ್ಟಲ್ ನಿರ್ವಹಣಾ ಸ್ಥಿತಿ:",
    "portal name": "ಪೋರ್ಟಲ್ ಹೆಸರು",
    "Potential Duplicate Grievance Review": "ಸಂಭಾವ್ಯ ನಕಲಿ ದೂರಿನ ಪರಿಶೀಲನೆ",
    "POTENTIAL EMERGENCY DETECTED": "ಸಂಭಾವ್ಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಪತ್ತೆಯಾಗಿದೆ",
    "Pre-reset cryptographic backup repository": "ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಬ್ಯಾಕಪ್ ಸಂಗ್ರಹ",
    "Pre-Reset Cryptographic Snapshot Verified & Ready": "ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ಸಿದ್ಧವಾಗಿದೆ",
    "Preserved:": "ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಯುತ್ತದೆ:",
    "president": "ಅಧ್ಯಕ್ಷರು",
    "president name": "ಅಧ್ಯಕ್ಷರ ಹೆಸರು",
    "Prevent accidental automated or single-click destruction. Please type the exact confirmation security phrase.": "ಆಕಸ್ಮಿಕ ಅಳಿಸುವಿಕೆಯನ್ನು ತಡೆಯಲು, ದಯವಿಟ್ಟು ನಿಖರ ದೃಢೀಕರಣ ಭದ್ರತಾ ಪದಗುಚ್ಛವನ್ನು ಟೈಪ್ ಮಾಡಿ.",
    "Primary Firestore": "ಪ್ರಾಥಮಿಕ ಫೈರ್‌ಸ್ಟೋರ್",
    "prinson dsouza": "ಪ್ರಿನ್ಸನ್ ಡಿಸೋಜಾ",
    "Print / Export Report": "ವರದಿ ಮುದ್ರಿಸಿ / ರಫ್ತು ಮಾಡಿ",
    "print / save receipt": "ರಸೀದಿ ಮುದ್ರಿಸಿ / ಉಳಿಸಿ",
    "Print Audit Trail": "ಆಡಿಟ್ ಟ್ರೇಲ್ ಮುದ್ರಿಸಿ",
    "Print or save PDF report": "ವರದಿಯನ್ನು ಮುದ್ರಿಸಿ ಅಥವಾ PDF ಆಗಿ ಉಳಿಸಿ",
    "Print Report": "ವರದಿ ಮುದ್ರಿಸಿ",
    "Priority": "ಆದ್ಯತೆ",
    "privacy policy": "ಗೌಪ್ಯತೆ ನೀತಿ",
    "Privileged municipal administrative console for operational data purge, factory reset, cryptographic snapshots, and portal maintenance controls.": "ಕಾರ್ಯಾಚರಣಾ ಡೇಟಾ ತೆರವು, ಫ್ಯಾಕ್ಟರಿ ಮರುಹೊಂದಿಕೆ, ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ಗಳು ಮತ್ತು ಪೋರ್ಟಲ್ ನಿರ್ವಹಣೆಗಾಗಿ ವಿಶೇಷ ಆಡಳಿತ ಕನ್ಸೋಲ್.",
    "problem description...": "ಸಮಸ್ಯೆಯ ವಿವರಣೆ...",
    "problem photograph": "ಸಮಸ್ಯೆಯ ಭಾವಚಿತ್ರ",
    "problems": "ಸಮಸ್ಯೆಗಳು",
    "Processing step 1 of 8...": "ಹಂತ 1 / 8 ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...",
    "Progress Stage": "ಪ್ರಗತಿಯ ಹಂತ",
    "Protected Grievance Recycle Bin": "ಸಂರಕ್ಷಿತ ದೂರುಗಳ ರಿಸೈಕಲ್ ಬಿನ್",
    "Protected Two-Step Purge Protocol": "ಸಂರಕ್ಷಿತ ಎರಡು-ಹಂತದ ಅಳಿಸುವಿಕೆ ಪ್ರೋಟೋಕಾಲ್",
    "provide accurate details: exact location, landmark, duration of the issue, and impact on villagers": "ನಿಖರವಾದ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ: ನಿಖರವಾದ ಸ್ಥಳ, ಗುರುತು, ಸಮಸ್ಯೆಯ ಅವಧಿ ಮತ್ತು ಗ್ರಾಮಸ್ಥರ ಮೇಲಿನ ಪರಿಣಾಮ",
    "provide accurate details: exact location, landmark, duration of the issue, and impact on villagers...": "ನಿಖರವಾದ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ: ನಿಖರವಾದ ಸ್ಥಳ, ಗುರುತು, ಸಮಸ್ಯೆಯ ಅವಧಿ ಮತ್ತು ಗ್ರಾಮಸ್ಥರ ಮೇಲಿನ ಪರಿಣಾಮ...",
    "public": "ಸಾರ್ವಜನಿಕ",
    "public facilities": "ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯಗಳು",
    "public grievance recorded under civic amenities. inspection scheduled with ward member": "ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯಗಳ ಅಡಿಯಲ್ಲಿ ದೂರು ದಾಖಲಿಸಲಾಗಿದೆ. ವಾರ್ಡ್ ಸದಸ್ಯರೊಂದಿಗೆ ಪರಿಶೀಲನೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ",
    "public grievance recorded under civic amenities. inspection scheduled with ward member.": "ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯಗಳ ಅಡಿಯಲ್ಲಿ ದೂರು ದಾಖಲಿಸಲಾಗಿದೆ. ವಾರ್ಡ್ ಸದಸ್ಯರೊಂದಿಗೆ ಪರಿಶೀಲನೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.",
    "public key": "ಪಬ್ಲಿಕ್ ಕೀ",
    "Public Official Response (Visible to Citizen)": "ಸಾರ್ವಜನಿಕ ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ (ನಾಗರಿಕರಿಗೆ ಗೋಚರಿಸುತ್ತದೆ)",
    "Public Works Department (PWD)": "ಲೋಕೋಪಯೋಗಿ ಇಲಾಖೆ (ಪಿಡಬ್ಲ್ಯೂಡಿ)",
    "Purge Status Audit Trail": "ಸ್ಥಿತಿ ಆಡಿಟ್ ಟ್ರೇಲ್ ತೆರವುಗೊಳಿಸಿ",
    "Purged:": "ತೆರವುಗೊಳಿಸಲಾಗುತ್ತದೆ:",
    "Purges registered citizen user accounts and citizen-filed grievances. Official Panchayat receivers remain active.": "ನೋಂದಾಯಿತ ನಾಗರಿಕ ಖಾತೆಗಳು ಮತ್ತು ನಾಗರಿಕರು ಸಲ್ಲಿಸಿದ ದೂರುಗಳನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ. ಅಧಿಕೃತ ಪಂಚಾಯತ್ ಸ್ವೀಕೃತಿದಾರರು ಸಕ್ರಿಯವಾಗಿರುತ್ತಾರೆ.",
    "purpose": "ಉದ್ದೇಶ",
    "puttur": "ಪುತ್ತೂರು",
    "puttur gram panchayat": "ಪುತ್ತೂರು ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Quarantine Actions": "ಕ್ವಾರಂಟೈನ್ ಕ್ರಮಗಳು",
    "Queued Offline Submissions": "ಸರತಿಯಲ್ಲಿರುವ ಆಫ್‌ಲೈನ್ ಸಲ್ಲಿಕೆಗಳು",
    "quick fill admin": "ನಿರ್ವಾಹಕ ಭರ್ತಿ",
    "quick fill citizen": "ನಾಗರಿಕ ಭರ್ತಿ",
    "quick fill receiver": "ಸ್ವೀಕೃತಿದಾರ ಭರ್ತಿ",
    "Rate": "ದರ",
    "Re-Auth": "ಮರು-ದೃಢೀಕರಣ",
    "re-enter new email address": "ಹೊಸ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ಪುನಃ ನಮೂದಿಸಿ",
    "re-enter your password": "ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಮರು-ನಮೂದಿಸಿ",
    "READY": "ಸಿದ್ಧವಾಗಿದೆ",
    "Ready to Save & Apply": "ಉಳಿಸಲು ಮತ್ತು ಅನ್ವಯಿಸಲು ಸಿದ್ಧ",
    "Real-time inventory of operational records, audit chains, citizen profiles, and storage footprints.": "ಕಾರ್ಯಾಚರಣಾ ದಾಖಲೆಗಳು, ಆಡಿಟ್ ಸರಣಿಗಳು, ನಾಗರಿಕ ಪ್ರೊಫೈಲ್‌ಗಳು ಮತ್ತು ಸಂಗ್ರಹಣೆಯ ನೈಜ-ಸಮಯದ ದಾಸ್ತಾನು.",
    "real-time log of dispatched notifications, gateway statuses, and delivery audits.": "ರವಾನಿಸಲಾದ ಅಧಿಸೂಚನೆಗಳು, ಗೇಟ್‌ವೇ ಸ್ಥಿತಿಗಳು ಮತ್ತು ವಿತರಣಾ ಆಡಿಟ್‌ಗಳ ನೈಜ-ಸಮಯದ ಲಾಗ್.",
    "real-time test verification": "ನೈಜ-ಸಮಯದ ಪರೀಕ್ಷಾರ್ಥ ಪರಿಶೀಲನೆ",
    "rear camera preferred on mobile": "ಮೊಬೈಲ್‌ನಲ್ಲಿ ಹಿಂಬದಿಯ ಕ್ಯಾಮೆರಾ ಆದ್ಯತೆ",
    "Reason / Justification": "ಕಾರಣ / ಸಮರ್ಥನೆ",
    "reason for delay (if any)": "ವಿಳಂಬಕ್ಕೆ ಕಾರಣ (ಯಾವುದಾದರೂ ಇದ್ದರೆ)",
    "Reason for Delay:": "ವಿಳಂಬಕ್ಕೆ ಕಾರಣ:",
    "Reason for Deletion (Optional)": "ಅಳಿಸಲು ಕಾರಣ (ಐಚ್ಛಿಕ)",
    "Reason for Reopening": "ಮರುತೆರೆಯಲು ಕಾರಣ",
    "Receipt": "ರಸೀದಿ",
    "receive an instant email with photo and grievance details when a citizen files a complaint.": "ನಾಗರಿಕರು ದೂರು ಸಲ್ಲಿಸಿದಾಗ ಫೋಟೋ ಮತ್ತು ವಿವರಗಳೊಂದಿಗೆ ತಕ್ಷಣದ ಇಮೇಲ್ ಸ್ವೀಕರಿಸಿ.",
    "receive confirmation when a grievance is officially marked resolved with engineer remarks.": "ಎಂಜಿನಿಯರ್ ಟಿಪ್ಪಣಿಗಳೊಂದಿಗೆ ದೂರು ಅಧಿಕೃತವಾಗಿ ಪರಿಹಾರವಾದಾಗ ದೃಢೀಕರಣವನ್ನು ಸ್ವೀಕರಿಸಿ.",
    "receive copy when complaints transition to in progress, under review, or assigned.": "ದೂರುಗಳು ಪ್ರಗತಿಯಲ್ಲಿದೆ, ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ ಅಥವಾ ನಿಯೋಜಿಸಲಾಗಿದೆ ಸ್ಥಿತಿಗೆ ಬದಲಾದಾಗ ಪ್ರತಿ ಸ್ವೀಕರಿಸಿ.",
    "receive status updates on your registered email": "ನಿಮ್ಮ ನೋಂದಾಯಿತ ಇಮೇಲ್‌ನಲ್ಲಿ ಸ್ಥಿತಿ ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಪಡೆಯಿರಿ",
    "receive status updates on your registered email.": "ನಿಮ್ಮ ನೋಂದಾಯಿತ ಇಮೇಲ್‌ನಲ್ಲಿ ಸ್ಥಿತಿ ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಪಡೆಯಿರಿ.",
    "receiver": "ಸ್ವೀಕೃತಿದಾರ",
    "receiver authority rules": "ಸ್ವೀಕೃತಿದಾರರ ಅಧಿಕಾರ ನಿಯಮಗಳು",
    "receiver email": "ಸ್ವೀಕೃತಿದಾರರ ಇಮೇಲ್",
    "Receiver email configurations & SMTP settings": "ಸ್ವೀಕೃತಿದಾರರ ಇಮೇಲ್ ಕಾನ್ಫಿಗರೇಶನ್‌ಗಳು ಮತ್ತು SMTP ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "Receiver email override configurations": "ಸ್ವೀಕೃತಿದಾರರ ಇಮೇಲ್ ಬದಲಾವಣೆ ಕಾನ್ಫಿಗರೇಶನ್‌ಗಳು",
    "receiver email settings": "ಸ್ವೀಕೃತಿದಾರರ ಇಮೇಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "receiver email settings – janaseva portal": "ಸ್ವೀಕೃತಿದಾರರ ಇಮೇಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು – ಜನಸೇವಾ ಪೋರ್ಟಲ್",
    "receiver gmail address": "ಸ್ವೀಕೃತಿದಾರರ Gmail ವಿಳಾಸ",
    "receiver gmail address *": "ಸ್ವೀಕೃತಿದಾರರ Gmail ವಿಳಾಸ *",
    "Receiver official account profiles": "ಸ್ವೀಕೃತಿದಾರರ ಅಧಿಕೃತ ಖಾತೆ ಪ್ರೊಫೈಲ್‌ಗಳು",
    "receiver settings": "ಸ್ವೀಕೃತಿದಾರರ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "receiver settings & email control": "ಸ್ವೀಕೃತಿದಾರರ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ಇಮೇಲ್ ನಿಯಂತ್ರಣ",
    "receiver:": "ಸ್ವೀಕೃತಿದಾರ:",
    "RECEIVERS": "ಸ್ವೀಕೃತಿದಾರರು",
    "Receivers & Workloads": "ಸ್ವೀಕರಿಸುವವರು ಮತ್ತು ಕೆಲಸದ ಹೊರೆ",
    "Receivers cannot permanently delete grievances. You can flag this grievance for Administrator review with an official reason (e.g. duplicate, spam, or request deletion).": "ಸ್ವೀಕೃತಿದಾರರು ದೂರುಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಅಧಿಕೃತ ಕಾರಣದೊಂದಿಗೆ ಆಡಳಿತಾಧಿಕಾರಿ ಪರಿಶೀಲನೆಗೆ ಫ್ಲ್ಯಾಗ್ ಮಾಡಬಹುದು.",
    "recent complaints": "ಇತ್ತೀಚಿನ ದೂರುಗಳು",
    "recent complaints (public view)": "ಇತ್ತೀಚಿನ ದೂರುಗಳು (ಸಾರ್ವಜನಿಕ ನೋಟ)",
    "recipient": "ಸ್ವೀಕೃತಿದಾರರು",
    "Recomputes & validates SHA-256 hash integrity": "SHA-256 ಹ್ಯಾಶ್ ಸಮಗ್ರತೆಯನ್ನು ಮರುಲೆಕ್ಕಾಚಾರ ಮಾಡಿ ಪರಿಶೀಲಿಸುತ್ತದೆ",
    "Record Count": "ದಾಖಲೆಗಳ ಸಂಖ್ಯೆ",
    "record gateway failure alarms if an email fails to dispatch or bounces.": "ಇಮೇಲ್ ರವಾನಿಸಲು ವಿಫಲವಾದರೆ ಅಥವಾ ಬೌನ್ಸ್ ಆದರೆ ಗೇಟ್‌ವೇ ವೈಫಲ್ಯ ಅಲಾರಂಗಳನ್ನು ದಾಖಲಿಸಿ.",
    "Records Captured": "ದಾಖಲಾದ ಸಂಖ್ಯೆ",
    "Records Purged": "ಅಳಿಸಿದ ದಾಖಲೆಗಳು",
    "Recovery Workflow:": "ಮರುಪಡೆಯುವಿಕೆ ಹಂತಗಳು:",
    "Recurring Problem Hotspots": "ಮರುಕಳಿಸುವ ಸಮಸ್ಯೆಗಳ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು",
    "Recurring Public-Service Problem Patterns & Hotspots": "ಮರುಕಳಿಸುವ ಸಾರ್ವಜನಿಕ ಸೇವಾ ಸಮಸ್ಯೆಗಳು ಮತ್ತು ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು",
    "Recycle Bin": "ರಿಸೈಕಲ್ ಬಿನ್",
    "refresh": "ನವೀಕರಿಸಿ",
    "Refresh Backups": "ಬ್ಯಾಕಪ್‌ಗಳನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "Refresh bin": "ಬಿನ್ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "Refresh Delivery Logs": "ರವಾನೆ ಲಾಗ್‌ಗಳನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "Refresh Ledger": "ಲೆಡ್ಜರ್ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "Refresh Live Data": "ಲೈವ್ ಡೇಟಾವನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "Refresh Metrics": "ಅಂಕಿಅಂಶ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "Refresh Scan": "ಮರು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    "Refresh updates": "ನವೀಕರಣಗಳನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "register": "ನೋಂದಣಿ",
    "register / login": "ನೋಂದಣಿ / ಲಾಗಿನ್",
    "register citizen account": "ನಾಗರಿಕ ಖಾತೆ ನೋಂದಾಯಿಸಿ",
    "register on janaseva to submit complaints, track status, and receive updates": "ದೂರುಗಳನ್ನು ಸಲ್ಲಿಸಲು, ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಮತ್ತು ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಪಡೆಯಲು ಜನಸೇವಾದಲ್ಲಿ ನೋಂದಾಯಿಸಿ",
    "register on janaseva to submit complaints, track status, and receive updates.": "ದೂರುಗಳನ್ನು ಸಲ್ಲಿಸಲು, ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಮತ್ತು ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಪಡೆಯಲು ಜನಸೇವಾದಲ್ಲಿ ನೋಂದಾಯಿಸಿ.",
    "register your account with mobile or email": "ಮೊಬೈಲ್ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    "Registered citizen accounts (role: citizen)": "ನೋಂದಾಯಿತ ನಾಗರಿಕ ಖಾತೆಗಳು (ಪಾತ್ರ: ನಾಗರಿಕ)",
    "Registered Citizens": "ನೋಂದಾಯಿತ ನಾಗರಿಕರು",
    "Registered Citizens Register": "ನೋಂದಾಯಿತ ನಾಗರಿಕರ ನೋಂದಣಿ ವಹಿ",
    "registered email address": "ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸ",
    "Registered Gram Panchayat": "ನೋಂದಾಯಿತ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Registered Users": "ನೋಂದಾಯಿತ ಬಳಕೆದಾರರು",
    "Registration Date": "ನೋಂದಣಿ ದಿನಾಂಕ",
    "registration failed. please check the information entered.": "ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಮೂದಿಸಿದ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "Rejected": "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    "Rejected (Out of Scope / Invalid)": "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ (ವ್ಯಾಪ್ತಿಯ ಹೊರಗೆ / ಅಮಾನ್ಯ)",
    "rejected complaints": "ತಿರಸ್ಕರಿಸಿದ ದೂರುಗಳು",
    "remaining work": "ಬಾಕಿ ಇರುವ ಕೆಲಸ",
    "Remediation work actively underway on site.": "ಸ್ಥಳದಲ್ಲಿ ಪರಿಹಾರ ಕಾಮಗಾರಿ ಭರದಿಂದ ಸಾಗುತ್ತಿದೆ.",
    "remember me": "ನನ್ನನ್ನು ನೆನಪಿಡಿ",
    "Remove": "ತೆಗೆದುಹಾಕಿ",
    "remove photo": "ಫೋಟೋ ತೆಗೆದುಹಾಕಿ",
    "Remove photograph": "ಛಾಯಾಚಿತ್ರವನ್ನು ತೆಗೆದುಹಾಕಿ",
    "Renders as seen by Citizens and Grievance Officers": "ನಾಗರಿಕರು ಮತ್ತು ಕುಂದುಕೊರತೆ ಅಧಿಕಾರಿಗಳಿಗೆ ಕಾಣುವಂತೆ ಪ್ರದರ್ಶಿಸುತ್ತದೆ",
    "Reopened": "ಮರುತೆರೆಯಲಾಗಿದೆ",
    "Reopened (Citizen Follow-up)": "ಮರುತೆರೆಯಲಾಗಿದೆ (ನಾಗರಿಕರ ಮರುಪರಿಶೀಲನೆ)",
    "reopened complaints": "ಮರುತೆರೆಯಲಾದ ದೂರುಗಳು",
    "Reopened for further investigation or citizen appeal.": "ಹೆಚ್ಚಿನ ತನಿಖೆ ಅಥವಾ ನಾಗರಿಕರ ಮನವಿಗಾಗಿ ಮರುತೆರೆಯಲಾಗಿದೆ.",
    "Reopening Justification": "ಮರುತೆರೆಯಲು ಸಮರ್ಥನೆ",
    "Replace Banner Image": "ಬ್ಯಾನರ್ ಚಿತ್ರ ಬದಲಾಯಿಸಿ",
    "reply to citizen": "ನಾಗರಿಕರಿಗೆ ಉತ್ತರಿಸಿ",
    "report issues, stay informed, and help build a cleaner, safer, and better village": "ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ, ಮಾಹಿತಿಯುತರಾಗಿರಿ ಮತ್ತು ಸ್ವಚ್ಛ, ಸುರಕ್ಷಿತ ಹಾಗೂ ಉತ್ತಮ ಗ್ರಾಮ ನಿರ್ಮಿಸಲು ಸಹಾಯ ಮಾಡಿ",
    "report issues, stay informed, and help build a cleaner, safer, and better village.": "ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ, ಮಾಹಿತಿಯುತರಾಗಿರಿ ಮತ್ತು ಸ್ವಚ್ಛ, ಸುರಕ್ಷಿತ ಹಾಗೂ ಉತ್ತಮ ಗ್ರಾಮ ನಿರ್ಮಿಸಲು ಸಹಾಯ ಮಾಡಿ.",
    "report local issues in your area and get them resolved by your gram panchayat": "ನಿಮ್ಮ ಪ್ರದೇಶದ ಸ್ಥಳೀಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಿಂದ ಪರಿಹರಿಸಿಕೊಳ್ಳಿ",
    "report local issues in your area and get them resolved by your gram panchayat.": "ನಿಮ್ಮ ಪ್ರದೇಶದ ಸ್ಥಳೀಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಿಂದ ಪರಿಹರಿಸಿಕೊಳ್ಳಿ.",
    "report local issues in your village and get them resolved by your gram panchayat": "ನಿಮ್ಮ ಗ್ರಾಮದ ಸ್ಥಳೀಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಿಂದ ಪರಿಹರಿಸಿಕೊಳ್ಳಿ",
    "report local issues in your village and get them resolved by your gram panchayat.": "ನಿಮ್ಮ ಗ್ರಾಮದ ಸ್ಥಳೀಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಿಂದ ಪರಿಹರಿಸಿಕೊಳ್ಳಿ.",
    "report local issues in your village and help your gram panchayat take timely action": "ನಿಮ್ಮ ಗ್ರಾಮದ ಸ್ಥಳೀಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸಮಯೋಚಿತ ಕ್ರಮ ಕೈಗೊಳ್ಳಲು ಸಹಾಯ ಮಾಡಿ",
    "report local issues in your village and help your gram panchayat take timely action.": "ನಿಮ್ಮ ಗ್ರಾಮದ ಸ್ಥಳೀಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸಮಯೋಚಿತ ಕ್ರಮ ಕೈಗೊಳ್ಳಲು ಸಹಾಯ ಮಾಡಿ.",
    "report village-level issues with a photo": "ಭಾವಚಿತ್ರದೊಂದಿಗೆ ಗ್ರಾಮ ಮಟ್ಟದ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ",
    "report village-level issues with a photo.": "ಭಾವಚಿತ್ರದೊಂದಿಗೆ ಗ್ರಾಮ ಮಟ್ಟದ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ.",
    "report • submit • track • resolve": "ವರದಿ ಮಾಡಿ • ಸಲ್ಲಿಸಿ • ಟ್ರ್ಯಾಕ್ ಮಾಡಿ • ಪರಿಹರಿಸಿ",
    "report • submit • track • resolve.": "ವರದಿ ಮಾಡಿ • ಸಲ್ಲಿಸಿ • ಟ್ರ್ಯಾಕ್ ಮಾಡಿ • ಪರಿಹರಿಸಿ.",
    "Request Grievance Reopening": "ದೂರನ್ನು ಮರುತೆರೆಯಲು ವಿನಂತಿಸಿ",
    "Requesting camera access...": "ಕ್ಯಾಮೆರಾ ಅನುಮತಿಯನ್ನು ವಿನಂತಿಸಲಾಗುತ್ತಿದೆ...",
    "Reset": "ಮರುಹೊಂದಿಸಿ",
    "Reset Citizen Data": "ನಾಗರಿಕ ಡೇಟಾ ಮರುಹೊಂದಿಸಿ",
    "Reset Citizen Data (Cat C)": "ನಾಗರಿಕ ಡೇಟಾ ಮರುಹೊಂದಿಸಿ (ವರ್ಗ ಸಿ)",
    "Reset Defaults": "ಡೀಫಾಲ್ಟ್ ಮರುಹೊಂದಿಸಿ",
    "reset directory": "ಡೈರೆಕ್ಟರಿ ಮರುಹೊಂದಿಸಿ",
    "Reset filters": "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಮರುಹೊಂದಿಸಿ",
    "reset password": "ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ",
    "Reset Receiver Data": "ಸ್ವೀಕೃತಿದಾರರ ಡೇಟಾ ಮರುಹೊಂದಿಸಿ",
    "Reset Receivers (Cat D)": "ಸ್ವೀಕೃತಿದಾರರನ್ನು ಮರುಹೊಂದಿಸಿ (ವರ್ಗ ಡಿ)",
    "reset to original 12 verified panchayats": "ಮೂಲ 12 ಪರಿಶೀಲಿಸಿದ ಪಂಚಾಯತ್‌ಗಳಿಗೆ ಮರುಹೊಂದಿಸಿ",
    "Reset to standard Gram Panchayat 8-stage schema": "ಪ್ರಮಾಣಿತ 8-ಹಂತದ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಯೋಜನೆಗೆ ಮರುಹೊಂದಿಸಿ",
    "Resolution Rate": "ಪರಿಹಾರ ದರ",
    "Resolution Remarks": "ಪರಿಹಾರದ ಟಿಪ್ಪಣಿಗಳು",
    "resolved": "ಪರಿಹರಿಸಲಾಗಿದೆ",
    "Resolved & signed off": "ಪರಿಹರಿಸಲಾಗಿದೆ ಮತ್ತು ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    "resolved (completed & closed)": "ಪರಿಹರಿಸಲಾಗಿದೆ (ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ಮುಚ್ಚಲಾಗಿದೆ)",
    "resolved and notified": "ಪರಿಹರಿಸಲಾಗಿದೆ ಮತ್ತು ಸೂಚಿಸಲಾಗಿದೆ",
    "resolved complaints": "ಪರಿಹಾರವಾದ ದೂರುಗಳು",
    "restore": "ಮರುಸ್ಥಾಪಿಸಿ",
    "Restore checked grievances": "ಆಯ್ದ ದೂರುಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಿ",
    "Restore from Backup": "ಬ್ಯಾಕಪ್‌ನಿಂದ ಮರುಸ್ಥಾಪಿಸಿ",
    "Restore Selected": "ಆಯ್ದವುಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಿ",
    "Restores receiver profiles and email configurations to standard directory defaults.": "ಸ್ವೀಕೃತಿದಾರರ ಪ್ರೊಫೈಲ್‌ಗಳು ಮತ್ತು ಇಮೇಲ್ ಕಾನ್ಫಿಗರೇಶನ್‌ಗಳನ್ನು ಪ್ರಮಾಣಿತ ಡೀಫಾಲ್ಟ್‌ಗಳಿಗೆ ಮರುಸ್ಥಾಪಿಸುತ್ತದೆ.",
    "retake photo": "ಮತ್ತೆ ಫೋಟೋ ತೆಗೆಯಿರಿ",
    "Retake photograph with camera": "ಕ್ಯಾಮೆರಾದೊಂದಿಗೆ ಮತ್ತೆ ಫೋಟೋ ತೆಗೆಯಿರಿ",
    "Return to Portal": "ಪೋರ್ಟಲ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    "Review": "ಪರಿಶೀಲಿಸಿ",
    "review assigned citizen complaints, inspect uploaded photos, update progress status, and communicate official responses": "ನಿಯೋಜಿಸಲಾದ ನಾಗರಿಕ ದೂರುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಫೋಟೋಗಳನ್ನು ವೀಕ್ಷಿಸಿ, ಪ್ರಗತಿ ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಿ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಸಂವಹಿಸಿ",
    "review assigned citizen complaints, inspect uploaded photos, update progress status, and communicate official responses.": "ನಿಯೋಜಿಸಲಾದ ನಾಗರಿಕ ದೂರುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಫೋಟೋಗಳನ್ನು ವೀಕ್ಷಿಸಿ, ಪ್ರಗತಿ ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಿ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಸಂವಹಿಸಿ.",
    "Review the precise inventory of database collections and records that will be purged.": "ಅಳಿಸಲ್ಪಡುವ ಡೇಟಾಬೇಸ್ ಸಂಗ್ರಹಗಳು ಮತ್ತು ದಾಖಲೆಗಳ ನಿಖರ ದಾಸ್ತಾನನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "road &": "ರಸ್ತೆ ಮತ್ತು",
    "road & infrastructure": "ರಸ್ತೆ ಮತ್ತು ಮೂಲಸೌಕರ್ಯ",
    "road and infrastructure": "ರಸ್ತೆ ಮತ್ತು ಮೂಲಸೌಕರ್ಯ",
    "road damage": "ರಸ್ತೆ ಹಾನಿ",
    "Roads & Infrastructure": "ರಸ್ತೆಗಳು ಮತ್ತು ಮೂಲಸೌಕರ್ಯ",
    "Roads & Street Infrastructure": "ರಸ್ತೆಗಳು ಮತ್ತು ಬೀದಿ ಮೂಲಸೌಕರ್ಯ",
    "Routine lifecycle cleanse. Purges grievance transactions and message logs while keeping accounts and system setup intact.": "ದೈನಂದಿನ ಸ್ವಚ್ಛತೆ. ಖಾತೆಗಳು ಮತ್ತು ಸಿಸ್ಟಮ್ ಸೆಟಪ್ ಉಳಿಸಿಕೊಂಡು ದೂರು ವಹಿವಾಟು ಮತ್ತು ಸಂದೇಶ ಲಾಗ್‌ಗಳನ್ನು ಅಳಿಸುತ್ತದೆ.",
    "Rural Water Supply & Sanitation (RWSS)": "ಗ್ರಾಮೀಣ ಕುಡಿಯುವ ನೀರು ಮತ್ತು ನೈರ್ಮಲ್ಯ (ಆರ್‌ಡಬ್ಲ್ಯುಎಸ್‌ಎಸ್)",
    "Safety Lock Arming in 3s...": "3 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಸುರಕ್ಷತಾ ಲಾಕ್ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...",
    "sanitation": "ನೈರ್ಮಲ್ಯ",
    "Sanitation & Cleanliness": "ನೈರ್ಮಲ್ಯ ಮತ್ತು ಸ್ವಚ್ಛತೆ",
    "save & add panchayat": "ಉಳಿಸಿ ಮತ್ತು ಪಂಚಾಯತ್ ಸೇರಿಸಿ",
    "Save & Apply": "ಉಳಿಸಿ ಮತ್ತು ಅನ್ವಯಿಸಿ",
    "save changes": "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    "save configuration": "ಕಾನ್ಫಿಗರೇಶನ್ ಉಳಿಸಿ",
    "save notification preferences": "ಅಧಿಸೂಚನೆ ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಿ",
    "save panchayat": "ಪಂಚಾಯತ್ ಉಳಿಸಿ",
    "save settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ",
    "Save Status Configuration": "ಸ್ಥಿತಿ ಕಾನ್ಫಿಗರೇಶನ್ ಉಳಿಸಿ",
    "save status update": "ಸ್ಥಿತಿ ನವೀಕರಣವನ್ನು ಉಳಿಸಿ",
    "School/hospital routes, prolonged outages": "ಶಾಲೆ/ಆಸ್ಪತ್ರೆ ರಸ್ತೆಗಳು, ದೀರ್ಘಕಾಲದ ಕಡಿತ",
    "Scope": "ವ್ಯಾಪ್ತಿ",
    "search": "ಹುಡುಕಿ",
    "search by complaint id or citizen name": "ದೂರು ಐಡಿ ಅಥವಾ ನಾಗರಿಕ ಹೆಸರಿನ ಮೂಲಕ ಹುಡುಕಿ",
    "search by complaint id or email": "ದೂರು ಐಡಿ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ ಹುಡುಕಿ",
    "search by complaint id, citizen name, or category": "ದೂರು ಐಡಿ, ನಾಗರಿಕ ಹೆಸರು ಅಥವಾ ವರ್ಗದ ಮೂಲಕ ಹುಡುಕಿ",
    "search by complaint id, citizen name, or category...": "ದೂರು ಐಡಿ, ನಾಗರಿಕ ಹೆಸರು ಅಥವಾ ವರ್ಗದ ಮೂಲಕ ಹುಡುಕಿ...",
    "Search by Complaint ID, citizen, category, or description...": "ದೂರು ಐಡಿ, ನಾಗರಿಕ, ವರ್ಗ ಅಥವಾ ವಿವರಣೆಯ ಮೂಲಕ ಹುಡುಕಿ...",
    "search by complaint id, citizen, or location": "ದೂರು ಐಡಿ, ನಾಗರಿಕ ಅಥವಾ ಸ್ಥಳದ ಮೂಲಕ ಹುಡುಕಿ",
    "search by complaint id, citizen, or location...": "ದೂರು ಐಡಿ, ನಾಗರಿಕ ಅಥವಾ ಸ್ಥಳದ ಮೂಲಕ ಹುಡುಕಿ...",
    "Search by Complaint ID, citizen, remarks, author...": "ದೂರು ಐಡಿ, ನಾಗರಿಕ, ಟಿಪ್ಪಣಿಗಳು, ಲೇಖಕರ ಮೂಲಕ ಹುಡುಕಿ...",
    "Search by Complaint ID, subject, category, location, or remarks...": "ದೂರು ಐಡಿ, ವಿಷಯ, ವರ್ಗ, ಸ್ಥಳ ಅಥವಾ ಟಿಪ್ಪಣಿಗಳ ಮೂಲಕ ಹುಡುಕಿ...",
    "search complaint": "ದೂರು ಹುಡುಕಿ",
    "search complaint id or email...": "ದೂರು ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್ ಹುಡುಕಿ...",
    "search grievances": "ದೂರುಗಳನ್ನು ಹುಡುಕಿ",
    "search grievances...": "ದೂರುಗಳನ್ನು ಹುಡುಕಿ...",
    "Search my grievances by ID, subject, or description...": "ನನ್ನ ದೂರುಗಳನ್ನು ಐಡಿ, ವಿಷಯ ಅಥವಾ ವಿವರಣೆಯ ಮೂಲಕ ಹುಡುಕಿ...",
    "search panchayat name, village or area": "ಪಂಚಾಯತ್ ಹೆಸರು, ಗ್ರಾಮ ಅಥವಾ ಪ್ರದೇಶವನ್ನು ಹುಡುಕಿ",
    "search panchayat name, village or area...": "ಪಂಚಾಯತ್ ಹೆಸರು, ಗ್ರಾಮ ಅಥವಾ ಪ್ರದೇಶವನ್ನು ಹುಡುಕಿ...",
    "search panchayats": "ಪಂಚಾಯತ್‌ಗಳನ್ನು ಹುಡುಕಿ",
    "secretary / pdo": "ಕಾರ್ಯದರ್ಶಿ / ಪಿಡಿಒ",
    "secretary / pdo name": "ಕಾರ್ಯದರ್ಶಿ / ಪಿಡಿಒ ಹೆಸರು",
    "secure ssl portal": "ಸುರಕ್ಷಿತ SSL ಪೋರ್ಟಲ್",
    "security note": "ಭದ್ರತಾ ಟಿಪ್ಪಣಿ",
    "Security Rules": "ಭದ್ರತಾ ನಿಯಮಗಳು",
    "Security rules, authorization policies & deployment configs": "ಭದ್ರತಾ ನಿಯಮಗಳು, ಅಧಿಕಾರ ನೀತಿಗಳು ಮತ್ತು ನಿಯೋಜನೆ ಕಾನ್ಫಿಗರೇಶನ್‌ಗಳು",
    "Select All": "ಎಲ್ಲವನ್ನೂ ಆಯ್ಕೆಮಾಡಿ",
    "Select All Quarantined": "ಎಲ್ಲಾ ಕ್ವಾರಂಟೈನ್ ದಾಖಲೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "Select cryptographic pre-reset snapshot from table": "ಕೋಷ್ಟಕದಿಂದ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಆಯ್ಕೆಮಾಡಿ",
    "select district": "ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ",
    "Select New Banner Image": "ಹೊಸ ಬ್ಯಾನರ್ ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ",
    "select role": "ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "Select Snapshot to Restore (Cat F)": "ಮರುಸ್ಥಾಪಿಸಲು ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಆಯ್ಕೆಮಾಡಿ (ವರ್ಗ ಎಫ್)",
    "select which events trigger automated email delivery.": "ಸ್ವಯಂಚಾಲಿತ ಇಮೇಲ್ ವಿತರಣೆಯನ್ನು ಪ್ರಚೋದಿಸುವ ಘಟನೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    "select your gram panchayat": "ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಆಯ್ಕೆಮಾಡಿ",
    "Send": "ಕಳುಹಿಸಿ",
    "Send a Reply / Follow-up to Gram Panchayat": "ಗ್ರಾಮ ಪಂಚಾಯತಿಗೆ ಪ್ರತ್ಯುತ್ತರ ಕಳುಹಿಸಿ",
    "Send a Reply to Panchayat Officials": "ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಗಳಿಗೆ ಪ್ರತ್ಯುತ್ತರ ಕಳುಹಿಸಿ",
    "Send email notification to citizen": "ನಾಗರಿಕರಿಗೆ ಇಮೇಲ್ ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಿ",
    "send email update": "ಇಮೇಲ್ ಅಪ್‌ಡೇಟ್ ಕಳುಹಿಸಿ",
    "Send Official Response": "ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ ಕಳುಹಿಸಿ",
    "Send Reply": "ಪ್ರತ್ಯುತ್ತರ ಕಳುಹಿಸಿ",
    "send reset link": "ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಿ",
    "send test email": "ಪರೀಕ್ಷಾರ್ಥ ಇಮೇಲ್ ಕಳುಹಿಸಿ",
    "sent to gram panchayat": "ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗೆ ರವಾನೆಯಾಗುತ್ತದೆ",
    "service id": "ಸರ್ವಿಸ್ ಐಡಿ",
    "Session storage and browser cached complaints": "ಸೆಷನ್ ಸ್ಟೋರೇಜ್ ಮತ್ತು ಬ್ರೌಸರ್ ಸಂಗ್ರಹಿತ ದೂರುಗಳು",
    "Settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "SHA-256 Checksum": "SHA-256 ಚೆಕ್‌ಸಮ್",
    "SHA-256 Hash:": "SHA-256 ಹ್ಯಾಶ್:",
    "Share your experience with the resolution quality or timeliness...": "ಪರಿಹಾರದ ಗುಣಮಟ್ಟ ಅಥವಾ ಸಮಯದ ಬಗ್ಗೆ ನಿಮ್ಮ ಅನುಭವವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ...",
    "show password": "ಪಾಸ್‌ವರ್ಡ್ ತೋರಿಸಿ",
    "Showing 0 of 0 grievances": "0 ದೂರುಗಳಲ್ಲಿ 0 ತೋರಿಸಲಾಗುತ್ತಿದೆ",
    "Showing real-time records filtered by selected parameters.": "ಆಯ್ಕೆಮಾಡಿದ ಮಾನದಂಡಗಳ ಆಧಾರದ ಮೇಲೆ ನೈಜ-ಸಮಯದ ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
    "sign in": "ಸೈನ್ ಇನ್",
    "sign in to portal": "ಪೋರ್ಟಲ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    "sign in with your verified credentials to access your personalized citizen portal or official gram panchayat management dashboard": "ನಿಮ್ಮ ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ನಾಗರಿಕ ಪೋರ್ಟಲ್ ಅಥವಾ ಅಧಿಕೃತ ಗ್ರಾಮ ಪಂಚಾಯತ್ ನಿರ್ವಹಣಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶಿಸಲು ನಿಮ್ಮ ಪರಿಶೀಲಿಸಿದ ರುಜುವಾತುಗಳೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    "sign in with your verified credentials to access your personalized citizen portal or official gram panchayat management dashboard.": "ನಿಮ್ಮ ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ನಾಗರಿಕ ಪೋರ್ಟಲ್ ಅಥವಾ ಅಧಿಕೃತ ಗ್ರಾಮ ಪಂಚಾಯತ್ ನಿರ್ವಹಣಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶಿಸಲು ನಿಮ್ಮ ಪರಿಶೀಲಿಸಿದ ರುಜುವಾತುಗಳೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    "sign up": "ಸೈನ್ ಅಪ್",
    "signing in": "ಸೈನ್ ಇನ್ ಆಗುತ್ತಿದೆ",
    "signing in...": "ಸೈನ್ ಇನ್ ಆಗುತ್ತಿದೆ...",
    "simulated": "ಸಿಮ್ಯುಲೇಟೆಡ್",
    "Slip": "ಸ್ವೀಕೃತಿ ಚೀಟಿ",
    "Snapshot ID": "ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಐಡಿ",
    "Soft Delete Protected:": "ಸಾಫ್ಟ್ ಅಳಿಸುವಿಕೆ ಸಂರಕ್ಷಿತ:",
    "Soft-deleted grievances quarantined with zero data loss. Records can be restored or permanently purged by authorized Administrators.": "ಡೇಟಾ ನಷ್ಟವಿಲ್ಲದೆ ಕ್ವಾರಂಟೈನ್ ಮಾಡಲಾದ ಅಳಿಸಿದ ದೂರುಗಳು. ಅಧಿಕೃತ ನಿರ್ವಾಹಕರು ಇವುಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಬಹುದು ಅಥವಾ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಬಹುದು.",
    "Soft-Deletion Protected Storage:": "ಸಾಫ್ಟ್-ಅಳಿಸುವಿಕೆ ಸಂರಕ್ಷಿತ ಸಂಗ್ರಹ:",
    "Sort By": "ಕ್ರಮಬದ್ಧಗೊಳಿಸಿ",
    "Spam / Non-civic / Inappropriate content": "ಸ್ಪ್ಯಾಮ್ / ನಾಗರಿಕೇತರ / ಅನುಚಿತ ವಿಷಯ",
    "Special (Rejected/Reopened)": "ವಿಶೇಷ (ತಿರಸ್ಕರಿಸಿದ/ಮರುತೆರೆದ)",
    "special announcement / public notice": "ವಿಶೇಷ ಪ್ರಕಟಣೆ / ಸಾರ್ವಜನಿಕ ಸೂಚನೆ",
    "special notice / announcement": "ವಿಶೇಷ ಸೂಚನೆ / ಪ್ರಕಟಣೆ",
    "Standalone Control Centre": "ಸ್ವತಂತ್ರ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ",
    "Standard civic grievances": "ಸಾಮಾನ್ಯ ನಾಗರಿಕ ದೂರುಗಳು",
    "State": "ಸ್ಥಿತಿ",
    "State official reason for rejecting this grievance...": "ಈ ದೂರನ್ನು ತಿರಸ್ಕರಿಸಲು ಅಧಿಕೃತ ಕಾರಣವನ್ನು ತಿಳಿಸಿ...",
    "status": "ಸ್ಥಿತಿ",
    "Status & Workflow Rules": "ಸ್ಥಿತಿ ಮತ್ತು ಕಾರ್ಯಪ್ರವಾಹ ನಿಯಮಗಳು",
    "Status Display Name *": "ಸ್ಥಿತಿ ಪ್ರದರ್ಶನ ಹೆಸರು *",
    "Status Filter": "ಸ್ಥಿತಿ ಫಿಲ್ಟರ್",
    "Status History & Messages": "ಸ್ಥಿತಿ ಇತಿಹಾಸ ಮತ್ತು ಸಂದೇಶಗಳು",
    "Status ID": "ಸ್ಥಿತಿ ಐಡಿ",
    "status indicators": "ಸ್ಥಿತಿ ಸೂಚಕಗಳು",
    "Status is Active & Selectable": "ಸ್ಥಿತಿ ಸಕ್ರಿಯವಾಗಿದೆ ಮತ್ತು ಆಯ್ಕೆಮಾಡಬಹುದು",
    "Status Name & Key": "ಸ್ಥಿತಿ ಹೆಸರು ಮತ್ತು ಕೀ",
    "Status Prior Deletion": "ಅಳಿಸುವ ಮುನ್ನ ಇದ್ದ ಸ್ಥಿತಿ",
    "Status Progression": "ಸ್ಥಿತಿ ಪ್ರಗತಿ",
    "Status progression histories and official responses": "ಸ್ಥಿತಿ ಪ್ರಗತಿ ಇತಿಹಾಸಗಳು ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳು",
    "Status Transition": "ಸ್ಥಿತಿ ಬದಲಾವಣೆ",
    "stay updated": "ಮಾಹಿತಿಯುತರಾಗಿರಿ",
    "Stop Audio": "ಆಡಿಯೋ ನಿಲ್ಲಿಸಿ",
    "Storage Estimate": "ಸಂಗ್ರಹಣೆ ಅಂದಾಜು",
    "streetlight": "ಬೀದಿ ದೀಪ",
    "streetlight problems": "ಬೀದಿ ದೀಪದ ಸಮಸ್ಯೆಗಳು",
    "Streetlights & Electricity": "ಬೀದಿದೀಪಗಳು ಮತ್ತು ವಿದ್ಯುತ್",
    "strict receiver-only access": "ಕಟ್ಟುನಿಟ್ಟಾದ ಸ್ವೀಕೃತಿದಾರರಿಗೆ ಮಾತ್ರ ಪ್ರವೇಶ",
    "Strictly Preserved Entities:": "ಕಟ್ಟುನಿಟ್ಟಾಗಿ ಸಂರಕ್ಷಿಸಲಾದ ಘಟಕಗಳು:",
    "Strictly Preserved:": "ಕಟ್ಟುನಿಟ್ಟಾಗಿ ಸಂರಕ್ಷಿಸಲಾಗುತ್ತದೆ:",
    "Subcollection Records": "ಉಪ-ಸಂಗ್ರಹ ದಾಖಲೆಗಳು",
    "Subject": "ವಿಷಯ",
    "Subject / Category": "ವಿಷಯ / ವರ್ಗ",
    "Submit": "ಸಲ್ಲಿಸಿ",
    "submit a complaint": "ದೂರು ಸಲ್ಲಿಸಿ",
    "submit a complaint – janaseva portal": "ದೂರು ಸಲ್ಲಿಸಿ – ಜನಸೇವಾ ಪೋರ್ಟಲ್",
    "submit another": "ಮತ್ತೊಂದು ಸಲ್ಲಿಸಿ",
    "submit another complaint": "ಮತ್ತೊಂದು ದೂರು ಸಲ್ಲಿಸಿ",
    "submit complaint": "ದೂರು ಸಲ್ಲಿಸಿ",
    "Submit Feedback": "ಪ್ರತಿಕ್ರಿಯೆ ಸಲ್ಲಿಸಿ",
    "Submit Flag to Admin": "ಆಡಳಿತಕ್ಕೆ ಫ್ಲ್ಯಾಗ್ ಸಲ್ಲಿಸಿ",
    "Submit Grievance": "ದೂರು ಸಲ್ಲಿಸಿ",
    "Submit New Grievance": "ಹೊಸ ದೂರನ್ನು ಸಲ್ಲಿಸಿ",
    "Submit Reopening Request": "ಮರುತೆರೆಯುವ ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಿ",
    "submitted": "ಸಲ್ಲಿಸಲಾಗಿದೆ",
    "Submitted & logged": "ಸಲ್ಲಿಸಲಾಗಿದೆ ಮತ್ತು ದಾಖಲಾಗಿದೆ",
    "submitted (initial stage)": "ಸಲ್ಲಿಸಲಾಗಿದೆ (ಆರಂಭಿಕ ಹಂತ)",
    "submitted date": "ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ",
    "submitted on": "ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ",
    "submitting complaint": "ದೂರು ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ",
    "submitting complaint...": "ದೂರು ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...",
    "sullia": "ಸುಳ್ಯ",
    "sullia gram panchayat": "ಸುಳ್ಯ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "sunday & government holidays: closed": "ಭಾನುವಾರ ಮತ್ತು ಸರ್ಕಾರಿ ರಜಾದಿನಗಳು: ರಜೆ",
    "Super Admin (": "ಸೂಪರ್ ಆಡಳಿತಾಧಿಕಾರಿ (",
    "Super Admin UNTOUCHABLE": "ಸೂಪರ್ ಆಡಳಿತ () ಬದಲಾಯಿಸಲಾಗದು",
    "Super Administrator": "ಸೂಪರ್ ಆಡಳಿತಾಧಿಕಾರಿ",
    "Super Administrator account": "ಸೂಪರ್ ಆಡಳಿತಾಧಿಕಾರಿ ಖಾತೆ ()",
    "Switch between front and rear cameras": "ಮುಂಭಾಗ ಮತ್ತು ಹಿಂಭಾಗದ ಕ್ಯಾಮೆರಾಗಳ ನಡುವೆ ಬದಲಿಸಿ",
    "switch camera": "ಕ್ಯಾಮೆರಾ ಬದಲಾಯಿಸಿ",
    "Synced with Cloud Firestore & Local Repository": "ಕ್ಲೌಡ್ ಫೈರ್‌ಸ್ಟೋರ್ ಮತ್ತು ಸ್ಥಳೀಯ ಸಂಗ್ರಹದೊಂದಿಗೆ ಸಿಂಕ್ ಆಗಿದೆ",
    "Synchronized": "ಸಿಂಕ್ರೊನೈಸ್ ಮಾಡಲಾಗಿದೆ",
    "System Integrity Safeguards:": "ಸಿಸ್ಟಮ್ ಸಮಗ್ರತೆ ಸುರಕ್ಷತಾ ಕ್ರಮಗಳು:",
    "System Settings": "ಸಿಸ್ಟಮ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "take action / change status": "ಕ್ರಮ ಕೈಗೊಳ್ಳಿ / ಸ್ಥಿತಿ ಬದಲಾಯಿಸಿ",
    "Tap microphone to speak": "ಮಾತನಾಡಲು ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿರಿ",
    "target panchayat configuration": "ಗುರಿ ಪಂಚಾಯತ್ ಸಂರಚನೆ",
    "Target Record Category": "ಗುರಿ ದಾಖಲೆ ವರ್ಗ",
    "TEMP DATA": "ತಾತ್ಕಾಲಿಕ ಡೇಟಾ",
    "template id": "ಟೆಂಪ್ಲೇಟ್ ಐಡಿ",
    "Terminal (Resolved/Closed)": "ಅಂತಿಮ (ಪರಿಹರಿಸಿದ/ಮುಚ್ಚಿದ)",
    "terms of service": "ಸೇವಾ ನಿಯಮಗಳು",
    "Text & Icon Color": "ಪಠ್ಯ ಮತ್ತು ಐಕಾನ್ ಬಣ್ಣ",
    "The Grievance Submission System is temporarily paused for scheduled administrative maintenance. You may still track existing grievances.": "ನಿಗದಿತ ಆಡಳಿತಾತ್ಮಕ ನಿರ್ವಹಣೆಗಾಗಿ ದೂರು ಸಲ್ಲಿಕೆ ವ್ಯವಸ್ಥೆಯನ್ನು ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿಲ್ಲಿಸಲಾಗಿದೆ. ನೀವು ಈಗಾಗಲೇ ಸಲ್ಲಿಸಿದ ದೂರುಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು.",
    "the issue has been addressed and marked as resolved": "ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಲಾಗಿದೆ ಮತ್ತು ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ",
    "the issue has been addressed and marked as resolved.": "ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಲಾಗಿದೆ ಮತ್ತು ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ.",
    "the issue is being verified and necessary action is being planned": "ಸಮಸ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು ಅಗತ್ಯ ಕ್ರಮವನ್ನು ಯೋಜಿಸಲಾಗುತ್ತಿದೆ",
    "the issue is being verified and necessary action is being planned.": "ಸಮಸ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು ಅಗತ್ಯ ಕ್ರಮವನ್ನು ಯೋಜಿಸಲಾಗುತ್ತಿದೆ.",
    "the panchayat has taken up the issue for action": "ಪಂಚಾಯತ್ ಕ್ರಮಕ್ಕಾಗಿ ಸಮಸ್ಯೆಯನ್ನು ಕೈಗೆತ್ತಿಕೊಂಡಿದೆ",
    "the panchayat has taken up the issue for action.": "ಪಂಚಾಯತ್ ಕ್ರಮಕ್ಕಾಗಿ ಸಮಸ್ಯೆಯನ್ನು ಕೈಗೆತ್ತಿಕೊಂಡಿದೆ.",
    "the road inspection was completed by the panchayat engineer. material has been ordered and repair work is scheduled to begin this week": "ಪಂಚಾಯತ್ ಎಂಜಿನಿಯರ್ ಅವರಿಂದ ರಸ್ತೆ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಸಾಮಗ್ರಿಗಳಿಗೆ ಆದೇಶ ನೀಡಲಾಗಿದ್ದು, ಈ ವಾರ ದುರಸ್ತಿ ಕಾರ್ಯ ಪ್ರಾರಂಭವಾಗಲಿದೆ",
    "the road inspection was completed by the panchayat engineer. material has been ordered and repair work is scheduled to begin this week.": "ಪಂಚಾಯತ್ ಎಂಜಿನಿಯರ್ ಅವರಿಂದ ರಸ್ತೆ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಸಾಮಗ್ರಿಗಳಿಗೆ ಆದೇಶ ನೀಡಲಾಗಿದ್ದು, ಈ ವಾರ ದುರಸ್ತಿ ಕಾರ್ಯ ಪ್ರಾರಂಭವಾಗಲಿದೆ.",
    "The system detected matching parameters between these two submissions (citizen, category, panchayat, or description similarity). Review both records below.": "ಈ ಎರಡು ಸಲ್ಲಿಕೆಗಳ ನಡುವೆ ಹೊಂದಾಣಿಕೆಯ ಅಂಶಗಳು ಪತ್ತೆಯಾಗಿವೆ. ಕೆಳಗಿನ ಎರಡೂ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "this gram panchayat": "ಈ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "This grievance will be moved to your": "ಈ ದೂರನ್ನು ನಿಮ್ಮ",
    "this is the email address that will receive all citizen complaints from the website": "ಇದು ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ಎಲ್ಲಾ ನಾಗರಿಕ ದೂರುಗಳನ್ನು ಸ್ವೀಕರಿಸುವ ಇಮೇಲ್ ವಿಳಾಸವಾಗಿದೆ",
    "this is the email address that will receive all citizen complaints from the website.": "ಇದು ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ಎಲ್ಲಾ ನಾಗರಿಕ ದೂರುಗಳನ್ನು ಸ್ವೀಕರಿಸುವ ಇಮೇಲ್ ವಿಳಾಸವಾಗಿದೆ.",
    "this portal connects rural citizens with gram panchayats. academic student project for civic grievance demonstration": "ಈ ಪೋರ್ಟಲ್ ಗ್ರಾಮೀಣ ನಾಗರಿಕರನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ. ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ಶೈಕ್ಷಣಿಕ ವಿದ್ಯಾರ್ಥಿ ಯೋಜನೆ",
    "this portal connects rural citizens with gram panchayats. academic student project for civic grievance demonstration.": "ಈ ಪೋರ್ಟಲ್ ಗ್ರಾಮೀಣ ನಾಗರಿಕರನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ. ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ಶೈಕ್ಷಣಿಕ ವಿದ್ಯಾರ್ಥಿ ಯೋಜನೆ.",
    "this portal is an academic student project created for civic grievance demonstration. not an official government of india website": "ಈ ಪೋರ್ಟಲ್ ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ರಚಿಸಲಾದ ಶೈಕ್ಷಣಿಕ ವಿದ್ಯಾರ್ಥಿ ಯೋಜನೆಯಾಗಿದೆ. ಭಾರತ ಸರ್ಕಾರದ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಅಲ್ಲ",
    "this portal is an academic student project created for civic grievance demonstration. not an official government of india website.": "ಈ ಪೋರ್ಟಲ್ ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ರಚಿಸಲಾದ ಶೈಕ್ಷಣಿಕ ವಿದ್ಯಾರ್ಥಿ ಯೋಜನೆಯಾಗಿದೆ. ಭಾರತ ಸರ್ಕಾರದ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಅಲ್ಲ.",
    "this record will be permanently removed from the portal and database": "ಈ ದಾಖಲೆಯನ್ನು ಪೋರ್ಟಲ್ ಮತ್ತು ಡೇಟಾಬೇಸ್‌ನಿಂದ ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ",
    "this record will be permanently removed from the portal and database.": "ಈ ದಾಖಲೆಯನ್ನು ಪೋರ್ಟಲ್ ಮತ್ತು ಡೇಟಾಬೇಸ್‌ನಿಂದ ಶಾಶ್ವತವಾಗಿ ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ.",
    "Timeline Node": "ಟೈಮ್‌ಲೈನ್ ನೋಡ್",
    "timestamp": "ಸಮಯ ಮುದ್ರೆ",
    "to build cleaner, safer, and better villages through citizen participation and timely action by the gram panchayat": "ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನ ಸಮಯೋಚಿತ ಕ್ರಮ ಮತ್ತು ನಾಗರಿಕರ ಸಹಭಾಗಿತ್ವದ ಮೂಲಕ ಸ್ವಚ್ಛ, ಸುರಕ್ಷಿತ ಮತ್ತು ಉತ್ತಮ ಗ್ರಾಮಗಳನ್ನು ನಿರ್ಮಿಸುವುದು",
    "to build cleaner, safer, and better villages through citizen participation and timely action by the gram panchayat.": "ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನ ಸಮಯೋಚಿತ ಕ್ರಮ ಮತ್ತು ನಾಗರಿಕರ ಸಹಭಾಗಿತ್ವದ ಮೂಲಕ ಸ್ವಚ್ಛ, ಸುರಕ್ಷಿತ ಮತ್ತು ಉತ್ತಮ ಗ್ರಾಮಗಳನ್ನು ನಿರ್ಮಿಸುವುದು.",
    "To confirm authorization, type:": "ಅಧಿಕಾರವನ್ನು ದೃಢೀಕರಿಸಲು ಟೈಪ್ ಮಾಡಿ:",
    "To confirm permanent eradication, please type": "ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದನ್ನು ದೃಢೀಕರಿಸಲು, ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ",
    "To Date": "ಅಂತಿಮ ದಿನಾಂಕ",
    "To filing date": "ದೂರು ಸಲ್ಲಿಸಿದ ಅಂತಿಮ ದಿನಾಂಕ",
    "To prevent unauthorized resets or session hijacking, enter your administrator password to authenticate this destructive action.": "ಅನಧಿಕೃತ ಮರುಹೊಂದಿಕೆಯನ್ನು ತಡೆಯಲು, ಈ ಕ್ರಮವನ್ನು ದೃಢೀಕರಿಸಲು ನಿಮ್ಮ ಆಡಳಿತಾಧಿಕಾರಿ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.",
    "to view the live status, resolution timeline, and official Panchayat responses.": "ನೇರ ಸ್ಥಿತಿ, ಪರಿಹಾರ ಟೈಮ್‌ಲೈನ್ ಮತ್ತು ಅಧಿಕೃತ ಪಂಚಾಯತ್ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು.",
    "total assigned": "ಒಟ್ಟು ನಿಯೋಜಿಸಲಾಗಿದೆ",
    "total complaints": "ಒಟ್ಟು ದೂರುಗಳು",
    "Total Grievances": "ಒಟ್ಟು ದೂರುಗಳು",
    "total panchayats": "ಒಟ್ಟು ಪಂಚಾಯತ್‌ಗಳು",
    "total panchayats: 12": "ಒಟ್ಟು ಪಂಚಾಯತ್‌ಗಳು: 12",
    "Total Size": "ಒಟ್ಟು ಗಾತ್ರ",
    "total submitted": "ಒಟ್ಟು ಸಲ್ಲಿಸಿದವು",
    "Track": "ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "track & get updates": "ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ಅಪ್‌ಡೇಟ್ ಪಡೆಯಿರಿ",
    "track and get updates": "ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ಅಪ್‌ಡೇಟ್ ಪಡೆಯಿರಿ",
    "track another complaint": "ಮತ್ತೊಂದು ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "track complaint": "ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "track complaint now": "ದೂರನ್ನು ಈಗಲೇ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "track complaint status": "ದೂರು ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "track complaint status – janaseva portal": "ದೂರು ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ – ಜನಸೇವಾ ಪೋರ್ಟಲ್",
    "Track Grievance": "ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "track status": "ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "track this complaint": "ಈ ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "track your complaint anytime and get real-time updates from your gram panchayat": "ನಿಮ್ಮ ದೂರನ್ನು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಿಂದ ನೈಜ-ಸಮಯದ ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಪಡೆಯಿರಿ",
    "track your complaint anytime and get real-time updates from your gram panchayat.": "ನಿಮ್ಮ ದೂರನ್ನು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಿಂದ ನೈಜ-ಸಮಯದ ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ಪಡೆಯಿರಿ.",
    "Track Your Grievance": "ನಿಮ್ಮ ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "Tracking Reference": "ಟ್ರ್ಯಾಕಿಂಗ್ ಉಲ್ಲೇಖ",
    "Triggered By": "ಪ್ರಾರಂಭಿಸಿದವರು",
    "Try Again": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    "type": "ಮಾದರಿ",
    "Type & Response / Remarks": "ಮಾದರಿ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ / ಟಿಪ್ಪಣಿಗಳು",
    "Type DELETE to confirm...": "ದೃಢೀಕರಿಸಲು DELETE ಎಂದು ಟೈಪ್ ಮಾಡಿ...",
    "Type RESET JANASEVA exactly": "RESET JANASEVA ಎಂದು ನಿಖರವಾಗಿ ಟೈಪ್ ಮಾಡಿ",
    "Type your follow-up inquiry or update for the officials...": "ಅಧಿಕಾರಿಗಳಿಗಾಗಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಅಥವಾ ವಿವರವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    "Type your inquiry or update...": "ನಿಮ್ಮ ವಿಚಾರಣೆ ಅಥವಾ ವಿವರವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    "Type your official response or internal administrative note here...": "ನಿಮ್ಮ ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ ಅಥವಾ ಆಂತರಿಕ ಆಡಳಿತಾತ್ಮಕ ಟಿಪ್ಪಣಿಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...",
    "udupi": "ಉಡುಪಿ",
    "Ujire": "ಉಜಿರೆ",
    "Ujire Gram Panchayat": "ಉಜಿರೆ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Unable to access your device camera.": "ನಿಮ್ಮ ಸಾಧನದ ಕ್ಯಾಮೆರಾವನ್ನು ಪ್ರವೇಶಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    "Unassigned": "ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ",
    "under review": "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ",
    "under review (inspection / planning)": "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ (ಪರಿಶೀಲನೆ / ಯೋಜನೆ)",
    "Unique Identifier (Slug) *": "ವಿಶಿಷ್ಟ ಗುರುತು (ಸ್ಲಗ್) *",
    "Update Grievance Status & Assignment": "ದೂರಿನ ಸ್ಥಿತಿ ಮತ್ತು ನಿಯೋಜನೆಯನ್ನು ನವೀಕರಿಸಿ",
    "update recipient address": "ಸ್ವೀಕೃತಿದಾರರ ವಿಳಾಸವನ್ನು ನವೀಕರಿಸಿ",
    "Update Ref / Time": "ನವೀಕರಣ ಉಲ್ಲೇಖ / ಸಮಯ",
    "update status": "ಸ್ಥಿತಿ ನವೀಕರಿಸಿ",
    "update status & notify citizen": "ಸ್ಥಿತಿ ನವೀಕರಿಸಿ ಮತ್ತು ನಾಗರಿಕರಿಗೆ ತಿಳಿಸಿ",
    "Update Status & Save Workflow": "ಸ್ಥಿತಿ ನವೀಕರಿಸಿ ಮತ್ತು ಉಳಿಸಿ",
    "Updated": "ನವೀಕರಿಸಲಾಗಿದೆ",
    "Updated By": "ನವೀಕರಿಸಿದವರು",
    "Updates Folder": "ನವೀಕರಣಗಳ ಫೋಲ್ಡರ್",
    "upload / replace circular file": "ಸುತ್ತೋಲೆ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ / ಬದಲಾಯಿಸಿ",
    "upload issue photograph": "ಭಾವಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "Upload PDF or Document Image": "ಪಿಡಿಎಫ್ ಅಥವಾ ದಾಖಲೆಯ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "Upload RTC pahani, address proof, or petition documents. Our AI OCR engine automatically extracts text, validates survey numbers, and checks identity consistency.": "ಪಹಣಿ / ಆರ್‌ಟಿಸಿ, ವಿಳಾಸ ಪುರಾವೆ ಅಥವಾ ಅರ್ಜಿ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಮ್ಮ ಎಐ ಒಸಿಆರ್ ಇಂಜಿನ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪಠ್ಯವನ್ನು ಹೊರತೆಗೆಯುತ್ತದೆ, ಸರ್ವೇ ನಂಬರ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ ಮತ್ತು ಗುರುತಿನ ಹೊಂದಾಣಿಕೆಯನ್ನು ಖಚಿತಪಡಿಸುತ್ತದೆ.",
    "URGENT": "ತುರ್ತು",
    "URGENT (Critical Danger / Hazard / Health Risk)": "ತುರ್ತು (ಗಂಭೀರ ಅಪಾಯ / ಆರೋಗ್ಯ ಅಪಾಯ)",
    "URGENT (Critical Hazard / Emergency)": "ತುರ್ತು (ಗಂಭೀರ ಅಪಾಯ / ತುರ್ತು ಪರಿಸ್ಥಿತಿ)",
    "Urgent / Emergency Hazards": "ತುರ್ತು / ತುರ್ತು ಅಪಾಯಗಳು",
    "Urgent Hazards": "ತುರ್ತು ಅಪಾಯಗಳು",
    "URGENT PUBLIC HAZARDS QUEUE": "ತುರ್ತು ಸಾರ್ವಜನಿಕ ಅಪಾಯಗಳ ಸರತಿ",
    "Use File Upload Instead": "ಬದಲಿಗೆ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಬಳಸಿ",
    "use the send test email button to test emailjs and network delivery at any time.": "ಯಾವುದೇ ಸಮಯದಲ್ಲಿ EmailJS ಮತ್ತು ನೆಟ್‌ವರ್ಕ್ ವಿತರಣೆಯನ್ನು ಪರೀಕ್ಷಿಸಲು ಪರೀಕ್ಷಾರ್ಥ ಇಮೇಲ್ ಕಳುಹಿಸಿ ಬಟನ್ ಬಳಸಿ.",
    "use this photo": "ಈ ಫೋಟೋ ಬಳಸಿ",
    "users": "ಬಳಕೆದಾರರು",
    "Verified & completed": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ಪೂರ್ಣಗೊಂಡಿದೆ",
    "Verified against Firebase Authentication session credentials.": "Firebase ದೃಢೀಕರಣ ಸೆಷನ್ ರುಜುವಾತುಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
    "Verified backups created automatically prior to any data purge. Inspect integrity hashes, download JSON dumps, or restore system state.": "ಯಾವುದೇ ಡೇಟಾ ತೆರವು ಮುನ್ನ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ರಚಿಸಲಾದ ಪರಿಶೀಲಿಸಿದ ಬ್ಯಾಕಪ್‌ಗಳು. ಹ್ಯಾಶ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, JSON ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಸಿಸ್ಟಮ್ ಮರುಸ್ಥಾಪಿಸಿ.",
    "Verified Channel": "ಪರಿಶೀಲಿಸಿದ ಚಾನಲ್",
    "Verified citizen user profiles, contact credentials, and submission history in JANASEVA.": "ಜನಸೇವಾವಿನಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ನಾಗರಿಕ ಪ್ರೊಫೈಲ್‌ಗಳು, ಸಂಪರ್ಕ ವಿವರಗಳು ಮತ್ತು ಸಲ್ಲಿಕೆ ಇತಿಹಾಸ.",
    "Verified cryptographic backup snapshots & audit ledger": "ಪರಿಶೀಲಿಸಿದ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ಗಳು ಮತ್ತು ಆಡಿಟ್ ಲೆಡ್ಜರ್",
    "Verified Official Channel": "ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ ಚಾನಲ್",
    "Verified Progress:": "ಪರಿಶೀಲಿಸಿದ ಪ್ರಗತಿ:",
    "verified work progress": "ಪರಿಶೀಲಿಸಿದ ಕೆಲಸದ ಪ್ರಗತಿ",
    "Verify Phrase & Continue →": "ಪದಗುಚ್ಛ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ →",
    "Verifying administrator security session...": "ಆಡಳಿತಾಧಿಕಾರಿಯ ಭದ್ರತಾ ಸೆಷನ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    "Verifying citizen session...": "ನಾಗರಿಕರ ಭದ್ರತಾ ಅಧಿವೇಶನವನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    "verifying receiver credentials...": "ಸ್ವೀಕೃತಿದಾರರ ರುಜುವಾತುಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    "verifying secure session": "ಸುರಕ್ಷಿತ ಸೆಷನ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ",
    "verifying secure session...": "ಸುರಕ್ಷಿತ ಸೆಷನ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    "verifying security session": "ಭದ್ರತಾ ಸೆಷನ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ",
    "verifying security session...": "ಭದ್ರತಾ ಸೆಷನ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    "view": "ನೋಡಿ",
    "view details": "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    "View in Panchayat Intelligence & Hotspots": "ಪಂಚಾಯತ್ ಗುಪ್ತಚರ ಮತ್ತು ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳಲ್ಲಿ ವೀಕ್ಷಿಸಿ",
    "View your registered grievances, track real-time resolution progress, read official responses, and download filing acknowledgements.": "ನಿಮ್ಮ ನೋಂದಾಯಿತ ದೂರುಗಳನ್ನು ವೀಕ್ಷಿಸಿ, ನೈಜ-ಸಮಯದ ಪರಿಹಾರದ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಓದಿ ಮತ್ತು ಸ್ವೀಕೃತಿ ಪತ್ರಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.",
    "village citizens and gram panchayat officials": "ಗ್ರಾಮದ ನಾಗರಿಕರು ಮತ್ತು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಗಳು",
    "Vittal": "ವಿಟ್ಲ",
    "Vittal Gram Panchayat": "ವಿಟ್ಲ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Water Supply": "ನೀರು ಸರಬರಾಜು",
    "water supply": "ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು",
    "water supply issues": "ಕುಡಿಯುವ ನೀರಿನ ಸಮಸ್ಯೆಗಳು",
    "water supply line leakage repaired near bus stand. normal pressure restored to all ward connections": "ಬಸ್ ನಿಲ್ದಾಣದ ಬಳಿಯ ನೀರಿನ ಪೈಪ್ ಸೋರಿಕೆ ದುರಸ್ತಿ ಮಾಡಲಾಗಿದೆ. ಸಾಮಾನ್ಯ ಒತ್ತಡವನ್ನು ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ",
    "water supply line leakage repaired near bus stand. normal pressure restored to all ward connections.": "ಬಸ್ ನಿಲ್ದಾಣದ ಬಳಿಯ ನೀರಿನ ಪೈಪ್ ಸೋರಿಕೆ ದುರಸ್ತಿ ಮಾಡಲಾಗಿದೆ. ಸಾಮಾನ್ಯ ಒತ್ತಡವನ್ನು ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.",
    "we couldn't locate any complaint with the provided id or email. please double-check your complaint id (e.g. jan-2026-xxxx) or ensure your email address matches the one used during submission": "ಒದಗಿಸಲಾದ ಐಡಿ ಅಥವಾ ಇಮೇಲ್‌ನೊಂದಿಗೆ ಯಾವುದೇ ದೂರು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರು ಐಡಿ ಪರಿಶೀಲಿಸಿ (ಉದಾ. JAN-2026-XXXX) ಅಥವಾ ಸಲ್ಲಿಕೆಯ ಸಮಯದಲ್ಲಿ ಬಳಸಲಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ",
    "we couldn't locate any complaint with the provided id or email. please double-check your complaint id (e.g. jan-2026-xxxx) or ensure your email address matches the one used during submission.": "ಒದಗಿಸಲಾದ ಐಡಿ ಅಥವಾ ಇಮೇಲ್‌ನೊಂದಿಗೆ ಯಾವುದೇ ದೂರು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರು ಐಡಿ ಪರಿಶೀಲಿಸಿ (ಉದಾ. JAN-2026-XXXX) ಅಥವಾ ಸಲ್ಲಿಕೆಯ ಸಮಯದಲ್ಲಿ ಬಳಸಲಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
    "welcome back": "ಮರಳಿ ಸ್ವಾಗತ",
    "welcome back!": "ಮರಳಿ ಸ್ವಾಗತ!",
    "welcome to janaseva": "ಜನಸೇವಾಗೆ ಸುಸ್ವಾಗತ",
    "What is Preserved (Untouched):": "ಏನು ಸುರಕ್ಷಿತವಾಗಿರುತ್ತದೆ:",
    "What is Purged (Deleted):": "ಏನು ಅಳಿಸಲಾಗುತ್ತದೆ:",
    "When activated, new grievance submissions are halted and an official maintenance banner is displayed across the public portal.": "ಸಕ್ರಿಯಗೊಳಿಸಿದಾಗ, ಹೊಸ ದೂರು ಸಲ್ಲಿಕೆಗಳನ್ನು ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿಲ್ಲಿಸಲಾಗುತ್ತದೆ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನಿರ್ವಹಣಾ ಬ್ಯಾನರ್ ಪ್ರದರ್ಶಿಸಲಾಗುತ್ತದೆ.",
    "when updated, all subsequent complaints filed across the portal will be dispatched exclusively to this address. an immutable audit record will be logged.": "ನವೀಕರಿಸಿದಾಗ, ಪೋರ್ಟಲ್‌ನ ಮುಂದಿನ ಎಲ್ಲಾ ದೂರುಗಳು ಈ ವಿಳಾಸಕ್ಕೆ ಮಾತ್ರ ರವಾನೆಯಾಗುತ್ತವೆ. ಬದಲಾಯಿಸಲಾಗದ ಆಡಿಟ್ ದಾಖಲೆಯನ್ನು ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ.",
    "with server-enforced role authentication.": "ನಲ್ಲಿ ಸರ್ವರ್-ಜಾರಿಗೊಳಿಸಿದ ಪಾತ್ರ ದೃಢೀಕರಣದೊಂದಿಗೆ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ.",
    "work completed so far": "ಇದುವರೆಗೆ ಪೂರ್ಣಗೊಂಡ ಕೆಲಸ",
    "Work Description": "ಕೆಲಸದ ವಿವರಣೆ",
    "Work in Progress: Repair and maintenance work actively underway": "ಕೆಲಸ ಪ್ರಗತಿಯಲ್ಲಿದೆ: ದುರಸ್ತಿ ಮತ್ತು ನಿರ್ವಹಣಾ ಕಾರ್ಯಗಳು ಭರದಿಂದ ಸಾಗುತ್ತಿವೆ",
    "Work Progress": "ಕೆಲಸದ ಪ್ರಗತಿ",
    "Work Progress Photograph (Image URL / Attachment)": "ಕೆಲಸದ ಪ್ರಗತಿಯ ಛಾಯಾಚಿತ್ರ (ಚಿತ್ರ URL / ಲಗತ್ತು)",
    "work progress summary": "ಕೆಲಸದ ಪ್ರಗತಿ ಸಾರಾಂಶ",
    "work scope / description": "ಕೆಲಸದ ವ್ಯಾಪ್ತಿ / ವಿವರಣೆ",
    "Workflow Category": "ಕಾರ್ಯಪ್ರವಾಹ ವರ್ಗ",
    "working hours": "ಕೆಲಸದ ಸಮಯ",
    "yes, confirm & save": "ಹೌದು, ದೃಢೀಕರಿಸಿ ಮತ್ತು ಉಳಿಸಿ",
    "yes, delete": "ಹೌದು, ಅಳಿಸಿ",
    "You are initiating an emergency database reset operation. Review the intended scope below before proceeding to impact preview.": "ನೀವು ತುರ್ತು ಡೇಟಾಬೇಸ್ ಮರುಹೊಂದಿಕೆ ಕಾರ್ಯಾಚರಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೀರಿ. ಮುಂದುವರಿಯುವ ಮೊದಲು ಕೆಳಗಿನ ವ್ಯಾಪ್ತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "You are signed in with official role permissions. Unauthorized visitors cannot access this control centre.": "ನೀವು ಅಧಿಕೃತ ಪಾತ್ರದ ಅನುಮತಿಗಳೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ. ಅನಧಿಕೃತ ಸಂದರ್ಶಕರು ಈ ನಿಯಂತ್ರಣ ಕೇಂದ್ರವನ್ನು ಪ್ರವೇಶಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    "you are viewing the dashboard in demonstration mode. to test the role-restricted workflow as an authenticated panchayat officer": "ನೀವು ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮೋಡ್‌ನಲ್ಲಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವೀಕ್ಷಿಸುತ್ತಿದ್ದೀರಿ. ದೃಢೀಕೃತ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಯಾಗಿ ಪಾತ್ರ-ನಿರ್ಬಂಧಿತ ಕೆಲಸದ ಹರಿವನ್ನು ಪರೀಕ್ಷಿಸಲು",
    "you are viewing the dashboard in demonstration mode. to test the role-restricted workflow as an authenticated panchayat officer,": "ನೀವು ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮೋಡ್‌ನಲ್ಲಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವೀಕ್ಷಿಸುತ್ತಿದ್ದೀರಿ. ದೃಢೀಕೃತ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಯಾಗಿ ಪಾತ್ರ-ನಿರ್ಬಂಧಿತ ಕೆಲಸದ ಹರಿವನ್ನು ಪರೀಕ್ಷಿಸಲು,",
    "You must explicitly check each consequence box to enable execution authorization.": "ಕಾರ್ಯಗತಗೊಳಿಸುವ ಅಧಿಕಾರವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು ಪ್ರತಿ ಬಾಕ್ಸ್ ಅನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಗುರುತುಹಾಕಬೇಕು.",
    "your complaint has been successfully received": "ನಿಮ್ಮ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ಸ್ವೀಕರಿಸಲ್ಪಟ್ಟಿದೆ",
    "your complaint has been successfully received.": "ನಿಮ್ಮ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ಸ್ವೀಕರಿಸಲ್ಪಟ್ಟಿದೆ.",
    "your complaint is automatically emailed to the configured panchayat office": "ನಿಮ್ಮ ದೂರು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಂಬಂಧಪಟ್ಟ ಪಂಚಾಯತ್ ಕಚೇರಿಗೆ ಇಮೇಲ್ ಆಗುತ್ತದೆ",
    "your complaint is automatically forwarded to the concerned panchayat office": "ನಿಮ್ಮ ದೂರು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಂಬಂಧಪಟ್ಟ ಪಂಚಾಯತ್ ಕಚೇರಿಗೆ ತಲುಪಿಸಲಾಗುತ್ತದೆ",
    "your complaint is automatically forwarded to the concerned panchayat office.": "ನಿಮ್ಮ ದೂರು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಂಬಂಧಪಟ್ಟ ಪಂಚಾಯತ್ ಕಚೇರಿಗೆ ತಲುಪಿಸಲಾಗುತ್ತದೆ.",
    "your complaint matters": "ನಿಮ್ಮ ದೂರು ನಮಗೆ ಮಹತ್ವದ್ದು",
    "your email": "ನಿಮ್ಮ ಇಮೇಲ್",
    "Your feedback helps improve Gram Panchayat public services. How satisfied are you with the resolution of": "ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಯು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸಾರ್ವಜನಿಕ ಸೇವೆಗಳನ್ನು ಸುಧಾರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. ನೀವು ಪರಿಹಾರದ ಬಗ್ಗೆ ಎಷ್ಟು ತೃಪ್ತರಾಗಿದ್ದೀರಿ:",
    "your grievance has been registered with the gram panchayat. please note down your unique complaint id": "ನಿಮ್ಮ ದೂರನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿಶಿಷ್ಟ ದೂರು ಐಡಿಯನ್ನು ಗುರುತು ಮಾಡಿಕೊಳ್ಳಿ",
    "your grievance has been registered with the gram panchayat. please note down your unique complaint id:": "ನಿಮ್ಮ ದೂರನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿಶಿಷ್ಟ ದೂರು ಐಡಿಯನ್ನು ಗುರುತು ಮಾಡಿಕೊಳ್ಳಿ:",
    "{action taken}": "{ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ}",
    "© 2026 Government of Karnataka. Department of Rural Development and Panchayat Raj.": "© 2026 ಕರ್ನಾಟಕ ಸರ್ಕಾರ. ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಮತ್ತು ಪಂಚಾಯತ್ ರಾಜ್ ಇಲಾಖೆ.",
    "• digital grievance initiative": "• ಡಿಜಿಟಲ್ ಕುಂದುಕೊರತೆ ಉಪಕ್ರಮ",
    "← Back": "← ಹಿಂದೆ",
    "Select Language": "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
    "Toggle Navigation": "ನ್ಯಾವಿಗೇಷನ್ ತೆರೆಯಿರಿ/ಮುಚ್ಚಿ",
    "User Account Menu": "ಬಳಕೆದಾರರ ಖಾತೆ ಮೆನು",
    "Close dialog": "ಸಂವಾದ ಮುಚ್ಚಿ",
    "Close image lightbox": "ಚಿತ್ರ ವೀಕ್ಷಕ ಮುಚ್ಚಿ",
    "Close modal": "ಮಾಡಲ್ ಮುಚ್ಚಿ",
    "Filter Logs": "ದಾಖಲೆಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ",
    "Authentication Options": "ದೃಢೀಕರಣ ಆಯ್ಕೆಗಳು",
    "Complaint Status Summary": "ದೂರುಗಳ ಸ್ಥಿತಿ ಸಾರಾಂಶ",
    "Request Reopening": "ಮರುತೆರೆಯಲು ವಿನಂತಿಸಿ",
    "Submit Resolution Feedback": "ಪರಿಹಾರ ಪ್ರತಿಕ್ರಿಯೆ ಸಲ್ಲಿಸಿ",
    "Toggle password visibility": "ಪಾಸ್‌ವರ್ಡ್ ಗೋಚರತೆ ಬದಲಿಸಿ",
    "Toggle confirm password visibility": "ದೃಢೀಕರಣ ಪಾಸ್‌ವರ್ಡ್ ಗೋಚರತೆ ಬದಲಿಸಿ",
    "Assistant Language": "ಸಹಾಯಕ ಭಾಷೆ",
    "Logged out successfully.": "ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್‌ಔಟ್ ಆಗಿದೆ.",
    "You have been signed out successfully.": "ನೀವು ಯಶಸ್ವಿಯಾಗಿ ಸೈನ್ ಔಟ್ ಆಗಿದ್ದೀರಿ.",
    "Access Denied: Receiver Settings are strictly restricted to the Grievance Receiver. Administrators and Citizens are barred.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ಸ್ವೀಕರಿಸುವವರ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಕೇವಲ ದೂರು ಸ್ವೀಕರಿಸುವ ಅಧಿಕಾರಿಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿವೆ.",
    "Access restricted: Administrator role required.": "ಪ್ರವೇಶ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ: ಆಡಳಿತಾಧಿಕಾರಿ ಪಾತ್ರ ಅಗತ್ಯವಿದೆ.",
    "Access restricted: Gram Panchayat official role required.": "ಪ್ರವೇಶ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ: ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿ ಪಾತ್ರ ಅಗತ್ಯವಿದೆ.",
    "Please enter a valid name": "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
    "Profile updated successfully!": "ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
    "Please fill in all required fields.": "ದಯವಿಟ್ಟು ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    "Password must be at least 6 characters.": "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳನ್ನು ಹೊಂದಿರಬೇಕು.",
    "Passwords do not match.": "ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
    "Please enter a valid email address.": "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
    "An account with this email already exists.": "ಈ ಇಮೇಲ್ ವಿಳಾಸದೊಂದಿಗೆ ಖಾತೆ ಈಗಾಗಲೇ ಅಸ್ತಿತ್ವದಲ್ಲಿದೆ.",
    "Please enter both email and password.": "ದಯವಿಟ್ಟು ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಎರಡನ್ನೂ ನಮೂದಿಸಿ.",
    "Please enter both email address and password.": "ದಯವಿಟ್ಟು ಇಮೇಲ್ ವಿಳಾಸ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಎರಡನ್ನೂ ನಮೂದಿಸಿ.",
    "No account found with this email. Please register first or check your spelling.": "ಈ ಇಮೇಲ್‌ನೊಂದಿಗೆ ಯಾವುದೇ ಖಾತೆ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೊದಲು ನೋಂದಾಯಿಸಿ ಅಥವಾ ಕಾಗುಣಿತ ಪರಿಶೀಲಿಸಿ.",
    "Incorrect password for Administrator account.": "ಆಡಳಿತಾಧಿಕಾರಿ ಖಾತೆಗೆ ತಪ್ಪಾದ ಪಾಸ್‌ವರ್ಡ್.",
    "Incorrect password for Panchayat Official account.": "ಪಂಚಾಯತ್ ಅಧಿಕಾರಿ ಖಾತೆಗೆ ತಪ್ಪಾದ ಪಾಸ್‌ವರ್ಡ್.",
    "Incorrect password for Citizen account.": "ನಾಗರಿಕ ಖಾತೆಗೆ ತಪ್ಪಾದ ಪಾಸ್‌ವರ್ಡ್.",
    "Please enter your registered email address.": "ದಯವಿಟ್ಟು ನಿಮ್ಮ ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
    "Unauthorized: Only authenticated Administrator can perform re-authentication.": "ಅನಧಿಕೃತ: ದೃಢೀಕರಿಸಿದ ಆಡಳಿತಾಧಿಕಾರಿ ಮಾತ್ರ ಮರು-ದೃಢೀಕರಣ ಮಾಡಬಹುದು.",
    "Please enter your current administrator password.": "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಆಡಳಿತಾಧಿಕಾರಿ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.",
    "Invalid administrator password. Access denied.": "ಅಮಾನ್ಯ ಆಡಳಿತಾಧಿಕಾರಿ ಪಾಸ್‌ವರ್ಡ್. ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ.",
    "Invalid administrator password. Security checkpoint verification failed.": "ಅಮಾನ್ಯ ಆಡಳಿತಾಧಿಕಾರಿ ಪಾಸ್‌ವರ್ಡ್. ಭದ್ರತಾ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ.",
    "Authentication failed. Please try again.": "ದೃಢೀಕರಣ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    "Authentication failed. Please verify your credentials.": "ದೃಢೀಕರಣ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "No account found with this email address. Please check your spelling or register as a new citizen.": "ಈ ಇಮೇಲ್ ವಿಳಾಸದೊಂದಿಗೆ ಯಾವುದೇ ಖಾತೆ ಕಂಡುಬಂದಿಲ್ಲ. ಕಾಗುಣಿತ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಹೊಸ ನಾಗರಿಕರಾಗಿ ನೋಂದಾಯಿಸಿ.",
    "Incorrect password entered. Please check your password or use 'Forgot Password?' to reset it.": "ತಪ್ಪಾದ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಅಥವಾ 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?' ಬಳಸಿ ಮರುಹೊಂದಿಸಿ.",
    "Please enter a valid email address (e.g. ).": "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ (ಉದಾ. ).",
    "This account has been disabled by the Gram Panchayat administration.": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಆಡಳಿತದಿಂದ ಈ ಖಾತೆಯನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ.",
    "Access temporarily blocked due to multiple failed attempts. Please try again later or reset your password.": "ಹಲವು ವಿಫಲ ಪ್ರಯತ್ನಗಳಿಂದ ಪ್ರವೇಶವನ್ನು ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ನಂತರ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ.",
    "Network connection issue. Please check your internet connectivity.": "ನೆಟ್‌ವರ್ಕ್ ಸಂಪರ್ಕ ಸಮಸ್ಯೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "An account with this email address is already registered. Please login instead.": "ಈ ಇಮೇಲ್ ವಿಳಾಸದೊಂದಿಗೆ ಖಾತೆ ಈಗಾಗಲೇ ನೋಂದಾಯಿತವಾಗಿದೆ. ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ.",
    "Password is too weak. Please choose a password with at least 6 characters.": "ಪಾಸ್‌ವರ್ಡ್ ತುಂಬಾ ದುರ್ಬಲವಾಗಿದೆ. ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳ ಪಾಸ್‌ವರ್ಡ್ ಆಯ್ಕೆಮಾಡಿ.",
    "Authenticating...": "ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ...",
    "Verified. Redirecting...": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...",
    "Creating Account...": "ಖಾತೆ ರಚಿಸಲಾಗುತ್ತಿದೆ...",
    "Registration successful! Welcome to JANASEVA.": "ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ! ಜನಸೇವೆಗೆ ಸ್ವಾಗತ.",
    "Account Created. Redirecting...": "ಖಾತೆ ರಚಿಸಲಾಗಿದೆ. ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...",
    "Sending...": "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
    "Update Account Profile": "ಖಾತೆ ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ",
    "Account Profile Details": "ಖಾತೆ ಪ್ರೊಫೈಲ್ ವಿವರಗಳು",
    "Edit Profile": "ಪ್ರೊಫೈಲ್ ತಿದ್ದುಪಡಿ",
"edit_profile": "ಪ್ರೊಫೈಲ್ ತಿದ್ದುಪಡಿ",
"Citizen Grievance Portal": "ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಪೋರ್ಟಲ್",
"AI Notebook": "AI ನೋಟ್‌ಬುಕ್",
"ai_notebook": "AI ನೋಟ್‌ಬುಕ್",
"citizen_portal": "ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಪೋರ್ಟಲ್",
"Track Complaints": "ದೂರುಗಳ ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
"track_complaints": "ದೂರುಗಳ ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
"Download Android App": "ಆಂಡ್ರಾಯ್ಡ್ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್",
"download_android_app": "ಆಂಡ್ರಾಯ್ಡ್ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್",
"Admin Dashboard": "ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
"admin_dashboard": "ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
"Receiver Dashboard": "ಸ್ವೀಕೃತಿದಾರರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
"receiver_dashboard": "ಸ್ವೀಕೃತಿದಾರರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
"My Dashboard": "ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
"my_dashboard": "ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "Role": "ಪಾತ್ರ",
    "Citizen": "ನಾಗರಿಕ ಡೆಮೊ ಬಳಕೆದಾರ",
    "System Administrator": "ಸಿಸ್ಟಮ್ ಆಡಳಿತಾಧಿಕಾರಿ",
    "Panchayat Officer": "ಪಂಚಾಯತ್ ಅಧಿಕಾರಿ",
    "Verified ≤ 5MB": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ ≤ 5MB",
    "Verified ≤ 5 MB": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ ≤ 5 MB",
    "Uploaded File": "ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಫೈಲ್",
    "Please select a valid JPG, PNG or WEBP image.": "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ JPG, PNG ಅಥವಾ WEBP ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    "Image size must not exceed 5 MB.": "ಚಿತ್ರದ ಗಾತ್ರವು 5 MB ಮೀರಬಾರದು.",
    "Failed to read image file. Please try again.": "ಚಿತ್ರ ಫೈಲ್ ಓದಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    "Your browser does not support camera access.": "ನಿಮ್ಮ ಬ್ರೌಸರ್ ಕ್ಯಾಮರಾ ಪ್ರವೇಶವನ್ನು ಬೆಂಬಲಿಸುವುದಿಲ್ಲ.",
    "Unable to capture photograph. Please try again.": "ಛಾಯಾಚಿತ್ರ ತೆಗೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    "No photograph captured. Please capture a photo first.": "ಯಾವುದೇ ಛಾಯಾಚಿತ್ರ ಸೆರೆಹಿಡಿಯಲಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೊದಲು ಫೋಟೋ ತೆಗೆಯಿರಿ.",
    "Photograph captured and attached successfully!": "ಛಾಯಾಚಿತ್ರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೆರೆಹಿಡಿದು ಲಗತ್ತಿಸಲಾಗಿದೆ!",
    "Please login or register to submit a grievance.": "ದೂರು ಸಲ್ಲಿಸಲು ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ ಅಥವಾ ನೋಂದಾಯಿಸಿ.",
    "Please enter your full name.": "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.",
    "Please enter a valid 10-digit mobile phone number.": "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    "Please enter a valid 10-digit mobile phone number (e.g. ).": "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (ಉದಾ. ).",
    "Please select your Gram Panchayat.": "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಆಯ್ಕೆಮಾಡಿ.",
    "Please select a grievance category.": "ದಯವಿಟ್ಟು ದೂರಿನ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    "Please enter a concise grievance subject (at least 5 characters).": "ದಯವಿಟ್ಟು ಸಂಕ್ಷಿಪ್ತ ದೂರು ವಿಷಯವನ್ನು ನಮೂದಿಸಿ (ಕನಿಷ್ಠ 5 ಅಕ್ಷರಗಳು).",
    "Please provide a detailed description (at least 15 characters).": "ದಯವಿಟ್ಟು ವಿವರವಾದ ವಿವರಣೆಯನ್ನು ನೀಡಿ (ಕನಿಷ್ಠ 15 ಅಕ್ಷರಗಳು).",
    "Please attach an evidence photograph of the issue.": "ದಯವಿಟ್ಟು ಸಮಸ್ಯೆಯ ಸಾಕ್ಷ್ಯ ಛಾಯಾಚಿತ್ರವನ್ನು ಲಗತ್ತಿಸಿ.",
    "Processing Grievance...": "ದೂರನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...",
    "Saved to offline queue in IndexedDB. Will sync when online.": "IndexedDB ಆಫ್‌ಲೈನ್ ಸರದಿಯಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ. ಆನ್‌ಲೈನ್ ಆದಾಗ ಸಿಂಕ್ ಆಗುತ್ತದೆ.",
    "No active complaint found to print receipt.": "ರಸೀದಿ ಮುದ್ರಿಸಲು ಯಾವುದೇ ಸಕ್ರಿಯ ದೂರು ಕಂಡುಬಂದಿಲ್ಲ.",
    "Please allow popups to download/print the acknowledgement slip.": "ಸ್ವೀಕೃತಿ ಚೀಟಿಯನ್ನು ಡೌನ್‌ಲೋಡ್/ಮುದ್ರಿಸಲು ದಯವಿಟ್ಟು ಪಾಪ್-ಅಪ್‌ಗಳಿಗೆ ಅನುಮತಿ ನೀಡಿ.",
    "JANASEVA AI Intelligence": "ಜನಸೇವಾ ಎಐ ಬುದ್ಧಿಮತ್ತೆ",
    "AI Assessment:": "ಎಐ ಮೌಲ್ಯಮಾಪನ:",
    "Suggested Department:": "ಸೂಚಿಸಲಾದ ಇಲಾಖೆ:",
    "Verified Emergency Contact:": "ಪರಿಶೀಲಿಸಿದ ತುರ್ತು ಸಂಪರ್ಕ:",
    "AI OCR Engine – Supporting Evidence Analysis": "ಎಐ OCR ಎಂಜಿನ್ – ಪೂರಕ ಸಾಕ್ಷ್ಯ ವಿಶ್ಲೇಷಣೆ",
    "AI OCR Engine extracting text and validating document fields...": "ಎಐ OCR ಎಂಜಿನ್ ಪಠ್ಯವನ್ನು ಹೊರತೆಗೆಯುತ್ತಿದೆ ಮತ್ತು ದಾಖಲೆ ಕ್ಷೇತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದೆ...",
    "Document Type:": "ದಾಖಲೆ ಪ್ರಕಾರ:",
    "Verification Outcome:": "ಪರಿಶೀಲನೆ ಫಲಿತಾಂಶ:",
    "Verification Status:": "ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ:",
    "Missing Field Detected": "ಕಾಣೆಯಾದ ಕ್ಷೇತ್ರ ಪತ್ತೆಯಾಗಿದೆ",
    "Missing Required Fields:": "ಕಾಣೆಯಾದ ಅಗತ್ಯ ಕ್ಷೇತ್ರಗಳು:",
    "Missing Info": "ಮಾಹಿತಿ ಕಾಣೆಯಾಗಿದೆ",
    "Attached for Official Review": "ಅಧಿಕೃತ ಪರಿಶೀಲನೆಗಾಗಿ ಲಗತ್ತಿಸಲಾಗಿದೆ",
    "Attached (Manual Review Required - OCR Unconfigured)": "ಲಗತ್ತಿಸಲಾಗಿದೆ (ಹಸ್ತಚಾಲಿತ ಪರಿಶೀಲನೆ ಅಗತ್ಯ - OCR ಕಾನ್ಫಿಗರ್ ಮಾಡಿಲ್ಲ)",
    "Unreadable Document - Manual Review Required": "ಓದಲಾಗದ ದಾಖಲೆ - ಹಸ್ತಚಾಲಿತ ಪರಿಶೀಲನೆ ಅಗತ್ಯ",
    "Text Extracted (Pending Official Verification)": "ಪಠ್ಯ ಹೊರತೆಗೆಯಲಾಗಿದೆ (ಅಧಿಕೃತ ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ)",
    "Rule-Based Keyword NLP": "ನಿಯಮ-ಆಧಾರಿತ ಕೀವರ್ಡ್ NLP",
    "Applicant Name:": "ಅರ್ಜಿದಾರರ ಹೆಸರು:",
    "Survey / Doc No:": "ಸರ್ವೆ / ದಾಖಲೆ ಸಂಖ್ಯೆ:",
    "Panchayat / Village:": "ಪಂಚಾಯತ್ / ಗ್ರಾಮ:",
    "Panchayat / Location:": "ಪಂಚಾಯತ್ / ಸ್ಥಳ:",
    "Document Date:": "ದಾಖಲೆ ದಿನಾಂಕ:",
    "Date on Document:": "ದಾಖಲೆಯಲ್ಲಿರುವ ದಿನಾಂಕ:",
    "Not detected": "ಪತ್ತೆಯಾಗಿಲ್ಲ",
    "Discrepancy": "ವ್ಯತ್ಯಾಸ",
    "Remove Document": "ದಾಖಲೆ ತೆಗೆದುಹಾಕಿ",
    "Document Processing Error:": "ದಾಖಲೆ ಪ್ರಕ್ರಿಯೆ ದೋಷ:",
    "Supporting Document:": "ಪೂರಕ ದಾಖಲೆ:",
    "Classification:": "ವರ್ಗೀಕರಣ:",
    "Land Record / RTC": "ಭೂ ದಾಖಲೆ / ಪಹಣಿ (RTC)",
    "Identity Proof": "ಗುರುತಿನ ಪುರಾವೆ",
    "Address Proof": "ವಿಳಾಸ ಪುರಾವೆ",
    "Supporting Evidence": "ಪೂರಕ ಸಾಕ್ಷ್ಯ",
    "Survey Number / Hissa": "ಸರ್ವೆ ಸಂಖ್ಯೆ / ಹಿಸ್ಸಾ",
    "Village / Gram Panchayat": "ಗ್ರಾಮ / ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Owner / Occupant Name": "ಮಾಲೀಕ / ಅನುಭೋಗದಾರರ ಹೆಸರು",
    "Cardholder Full Name": "ಕಾರ್ಡ್‌ದಾರರ ಪೂರ್ಣ ಹೆಸರು",
    "Unique Identification Number": "ವಿಶಿಷ್ಟ ಗುರುತಿನ ಸಂಖ್ಯೆ",
    "Consumer / Occupant Name": "ಗ್ರಾಹಕ / ನಿವಾಸಿಯ ಹೆಸರು",
    "Panchayat / Address Location": "ಪಂಚಾಯತ್ / ವಿಳಾಸ ಸ್ಥಳ",
    "Priority:": "ಆದ್ಯತೆ:",
    "File:": "ಫೈಲ್:",
    "No Internet Connection:": "ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ:",
    "Your complaint draft has been safely saved in your device's IndexedDB.": "ನಿಮ್ಮ ದೂರಿನ ಕರಡನ್ನು ನಿಮ್ಮ ಸಾಧನದ IndexedDB ಯಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಲಾಗಿದೆ.",
    "Official Citizen Grievance Acknowledgement Slip & Filing Receipt": "ಅಧಿಕೃತ ನಾಗರಿಕ ದೂರು ಸ್ವೀಕೃತಿ ಚೀಟಿ ಮತ್ತು ದಾಖಲಾತಿ ರಸೀದಿ",
    "Unique Grievance Tracking ID": "ವಿಶಿಷ್ಟ ದೂರು ಟ್ರ್ಯಾಕಿಂಗ್ ಐಡಿ",
    "Citizen Email": "ನಾಗರಿಕ ಇಮೇಲ್",
    "Assigned Gram Panchayat": "ನಿಯೋಜಿತ ಗ್ರಾಮ ಪಂಚಾಯತ್",
    "Grievance Category": "ದೂರು ವರ್ಗ",
    "Grievance Subject": "ದೂರು ವಿಷಯ",
    "AI Suggested Priority": "ಎಐ ಸೂಚಿಸಿದ ಆದ್ಯತೆ",
    "Grievance Description:": "ದೂರು ವಿವರಣೆ:",
    "This acknowledgement slip confirms that your grievance has been permanently saved to the official JANASEVA repository.": "ಈ ಸ್ವೀಕೃತಿ ಚೀಟಿಯು ನಿಮ್ಮ ದೂರು ಅಧಿಕೃತ ಜನಸೇವಾ ಭಂಡಾರದಲ್ಲಿ ಶಾಶ್ವತವಾಗಿ ಉಳಿಸಲ್ಪಟ್ಟಿದೆ ಎಂದು ದೃಢಪಡಿಸುತ್ತದೆ.",
    "To check live real-time progress, visit the online tracker with Complaint ID": "ನೇರ ಪ್ರಗತಿಯನ್ನು ಪರಿಶೀಲಿಸಲು, ದೂರು ಐಡಿಯೊಂದಿಗೆ ಆನ್‌ಲೈನ್ ಟ್ರ್ಯಾಕರ್‌ಗೆ ಭೇಟಿ ನೀಡಿ",
    "No document file provided.": "ಯಾವುದೇ ದಾಖಲೆ ಫೈಲ್ ನೀಡಲಾಗಿಲ್ಲ.",
    "Unsupported file type. Please upload a PDF, JPG, or PNG document.": "ಬೆಂಬಲಿತವಲ್ಲದ ಫೈಲ್ ಪ್ರಕಾರ. ದಯವಿಟ್ಟು PDF, JPG, ಅಥವಾ PNG ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
    "Hazardous Live Electric Wire / Electrocution Risk": "ಅಪಾಯಕಾರಿ ಜೀವಂತ ವಿದ್ಯುತ್ ತಂತಿ / ವಿದ್ಯುತ್ ಸ್ಪರ್ಶ ಅಪಾಯ",
    "Public Drinking Water Contamination / Epidemic Risk": "ಸಾರ್ವಜನಿಕ ಕುಡಿಯುವ ನೀರು ಕಲುಷಿತ / ಸಾಂಕ್ರಾಮಿಕ ರೋಗ ಅಪಾಯ",
    "Severe Structural Infrastructure Collapse / Road Severance": "ಗಂಭೀರ ಮೂಲಸೌಕರ್ಯ ಕುಸಿತ / ರಸ್ತೆ ಸಂಪರ್ಕ ಕಡಿತ",
    "Hazardous Open Pit / Deep Manhole near Pedestrian Pathway": "ಪಾದಚಾರಿ ಮಾರ್ಗದ ಬಳಿ ಅಪಾಯಕಾರಿ ತೆರೆದ ಗುಂಡಿ / ಆಳವಾದ ಮ್ಯಾನ್‌ಹೋಲ್",
    "Emergency Redressal / Gram Panchayat Task Force": "ತುರ್ತು ಪರಿಹಾರ / ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಾರ್ಯಪಡೆ",
    "Standard priority assigned for general civic grievance.": "ಸಾಮಾನ್ಯ ನಾಗರಿಕ ದೂರಿಗೆ ಸಾಮಾನ್ಯ ಆದ್ಯತೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.",
    "Elevated priority due to essential public service impact or proximity to sensitive community locations (schools/hospitals).": "ಅಗತ್ಯ ಸಾರ್ವಜನಿಕ ಸೇವೆಯ ಮೇಲಿನ ಪರಿಣಾಮ ಅಥವಾ ಸೂಕ್ಷ್ಮ ಸಮುದಾಯ ಸ್ಥಳಗಳ (ಶಾಲೆ/ಆಸ್ಪತ್ರೆ) ಸಾಮೀಪ್ಯದ ಕಾರಣ ಹೆಚ್ಚಿನ ಆದ್ಯತೆ.",
    "Low severity indicated by description. Non-disruptive civic improvement or minor maintenance.": "ವಿವರಣೆಯಲ್ಲಿ ಕಡಿಮೆ ತೀವ್ರತೆ ಸೂಚಿಸಲಾಗಿದೆ. ಅಡಚಣೆಯಿಲ್ಲದ ನಾಗರಿಕ ಸುಧಾರಣೆ ಅಥವಾ ಸಣ್ಣ ನಿರ್ವಹಣೆ.",
    "Reopen": "ಮರುತೆರೆಯಿರಿ",
    "Restore Complaint": "ದೂರು ಮರುಸ್ಥಾಪಿಸಿ",
    "Purge": "ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ",
    "Archive": "ಆರ್ಕೈವ್ ಮಾಡಿ",
    "Reactivate": "ಮರುಸಕ್ರಿಯಗೊಳಿಸಿ",
    "OFFICIAL RESPONSE": "ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ",
    "Official Response": "ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ",
    "No grievances found matching your current filters": "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    "Try adjusting your search or filter criteria, or file a new grievance.": "ನಿಮ್ಮ ಹುಡುಕಾಟ ಅಥವಾ ಫಿಲ್ಟರ್ ಮಾನದಂಡಗಳನ್ನು ಬದಲಾಯಿಸಿ, ಅಥವಾ ಹೊಸ ದೂರು ದಾಖಲಿಸಿ.",
    "No deleted grievances found": "ಅಳಿಸಲಾದ ಯಾವುದೇ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    "Complaints you soft-delete from your active history will appear here for safe keeping and restoration.": "ಸಕ್ರಿಯ ಇತಿಹಾಸದಿಂದ ನೀವು ತಾತ್ಕಾಲಿಕವಾಗಿ ಅಳಿಸಿದ ದೂರುಗಳು ಮರುಸ್ಥಾಪನೆಗಾಗಿ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
    "No filed complaints to visualize yet.": "ದೃಶ್ಯೀಕರಿಸಲು ಇನ್ನೂ ಯಾವುದೇ ದೂರುಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
    "No monthly filing history found.": "ಯಾವುದೇ ಮಾಸಿಕ ದೂರು ಇತಿಹಾಸ ಕಂಡುಬಂದಿಲ್ಲ.",
    "No activity events recorded yet.": "ಇನ್ನೂ ಯಾವುದೇ ಚಟುವಟಿಕೆ ಘಟನೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
    "Official & Timeline Details": "ಅಧಿಕೃತ ಮತ್ತು ಟೈಮ್‌ಲೈನ್ ವಿವರಗಳು",
    "View Complaint Details, Timeline & Work Progress": "ದೂರಿನ ವಿವರಗಳು, ಟೈಮ್‌ಲೈನ್ ಮತ್ತು ಕೆಲಸದ ಪ್ರಗತಿ ವೀಕ್ಷಿಸಿ",
    "Move to Deleted Complaints": "ಅಳಿಸಿದ ದೂರುಗಳಿಗೆ ಸರಿಸಿ",
    "Restore complaint to Active History": "ದೂರನ್ನು ಸಕ್ರಿಯ ಇತಿಹಾಸಕ್ಕೆ ಮರುಸ್ಥಾಪಿಸಿ",
    "Submitted:": "ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ:",
    "Assigned Receiver:": "ನಿಯೋಜಿತ ಸ್ವೀಕರಿಸುವವರು:",
    "Last Updated:": "ಕೊನೆಯ ನವೀಕರಣ:",
    "Location:": "ಸ್ಥಳ:",
    "Reason": "ಕಾರಣ",
    "Archived": "ಆರ್ಕೈವ್ ಮಾಡಲಾಗಿದೆ",
    "« Prev": "« ಹಿಂದಿನ",
    "Next »": "ಮುಂದಿನ »",
    "« Previous": "« ಹಿಂದಿನದು",
    "No Gram Panchayats found matching your criteria.": "ನಿಮ್ಮ ಮಾನದಂಡಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    "Please fill in all required fields marked with *.": "* ಗುರುತು ಇರುವ ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    "Directory exported to CSV file successfully!": "ಡೈರೆಕ್ಟರಿಯನ್ನು CSV ಫೈಲ್‌ಗೆ ಯಶಸ್ವಿಯಾಗಿ ರಫ್ತು ಮಾಡಲಾಗಿದೆ!",
    "No valid records found in file.": "ಫೈಲ್‌ನಲ್ಲಿ ಮಾನ್ಯವಾದ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    "Reset directory to the original 12 verified Gram Panchayats?": "ಮೂಲ 12 ಪರಿಶೀಲಿಸಿದ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳಿಗೆ ಡೈರೆಕ್ಟರಿಯನ್ನು ಮರುಹೊಂದಿಸುವುದೇ?",
    "Directory reset to default 12 Gram Panchayats.": "ಡೈರೆಕ್ಟರಿಯನ್ನು ಡೀಫಾಲ್ಟ್ 12 ಗ್ರಾಮ ಪಂಚಾಯತ್‌ಗಳಿಗೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.",
    "Notice available": "ಸೂಚನೆ ಲಭ್ಯವಿದೆ",
    "View full information": "ಪೂರ್ಣ ಮಾಹಿತಿ ವೀಕ್ಷಿಸಿ",
    "Edit Panchayat details": "ಪಂಚಾಯತ್ ವಿವರಗಳನ್ನು ತಿದ್ದು",
    "Delete Panchayat": "ಪಂಚಾಯತ್ ಅಳಿಸಿ",
    "Citizen name masked for privacy protection": "ಗೌಪ್ಯತೆ ರಕ್ಷಣೆಗಾಗಿ ನಾಗರಿಕರ ಹೆಸರನ್ನು ಮರೆಮಾಡಲಾಗಿದೆ",
    "(Protected)": "(ರಕ್ಷಿತ)",
    "No photo attached": "ಯಾವುದೇ ಫೋಟೋ ಲಗತ್ತಿಸಲಾಗಿಲ್ಲ",
    "Click image to zoom in/out • Press": "ಜೂಮ್ ಮಾಡಲು ಚಿತ್ರದ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ • ಒತ್ತಿರಿ",
    "to close": "ಮುಚ್ಚಲು",
    "Download": "ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "New Tab": "ಹೊಸ ಟ್ಯಾಬ್",
    "Download full evidence image": "ಪೂರ್ಣ ಸಾಕ್ಷ್ಯ ಚಿತ್ರವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "Open in new window": "ಹೊಸ ವಿಂಡೋದಲ್ಲಿ ತೆರೆಯಿರಿ",
    "Complaint Evidence Photograph": "ದೂರು ಸಾಕ್ಷ್ಯ ಛಾಯಾಚಿತ್ರ",
    "Will synchronize automatically when internet returns.": "ಇಂಟರ್ನೆಟ್ ಮರಳಿದಾಗ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಿಂಕ್ ಆಗುತ್ತದೆ.",
    "Install": "ಸ್ಥಾಪಿಸಿ",
    "Administrator Override Options": "ಆಡಳಿತಾಧಿಕಾರಿ ಓವರ್‌ರೈಡ್ ಆಯ್ಕೆಗಳು",
    "-- No further transitions available --": "-- ಮುಂದಿನ ಯಾವುದೇ ಹಂತದ ಪರಿವರ್ತನೆ ಲಭ್ಯವಿಲ್ಲ --",
    "ADMIN ONLY": "ಆಡಳಿತಾಧಿಕಾರಿಗೆ ಮಾತ್ರ",
    "ADMIN & RECEIVER": "ಆಡಳಿತಾಧಿಕಾರಿ ಮತ್ತು ಸ್ವೀಕರಿಸುವವರು",
    "Admin Only Transition": "ಆಡಳಿತಾಧಿಕಾರಿಗೆ ಮಾತ್ರ ಪರಿವರ್ತನೆ",
    "Mandatory Remarks": "ಕಡ್ಡಾಯ ಟಿಪ್ಪಣಿ",
    "Optional Remarks": "ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿ",
    "Evidence Required": "ಸಾಕ್ಷ್ಯ ಅಗತ್ಯವಿದೆ",
    "Mandatory Evidence": "ಕಡ್ಡಾಯ ಸಾಕ್ಷ್ಯ",
    "Officer Assigned": "ಅಧಿಕಾರಿ ನಿಯೋಜಿತ",
    "Requires Assigned Receiver": "ನಿಯೋಜಿತ ಸ್ವೀಕರಿಸುವವರು ಅಗತ್ಯ",
    "Notify Citizen": "ನಾಗರಿಕರಿಗೆ ತಿಳಿಸಿ",
    "Trigger Notification": "ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಿ",
    "Displayed on Timeline Stepper": "ಟೈಮ್‌ಲೈನ್ ಸ್ಟೆಪ್ಪರ್‌ನಲ್ಲಿ ಪ್ರದರ್ಶಿಸಲಾಗುತ್ತದೆ",
    "Excluded from Stepper": "ಸ್ಟೆಪ್ಪರ್‌ನಿಂದ ಹೊರಗಿಡಲಾಗಿದೆ",
    "From Stage": "ಹಂತದಿಂದ",
    "None (Terminal State)": "ಯಾವುದೂ ಇಲ್ಲ (ಅಂತಿಮ ಹಂತ)",
    "Terminal stage — No further status transitions permitted.": "ಅಂತಿಮ ಹಂತ — ಮುಂದಿನ ಯಾವುದೇ ಸ್ಥಿತಿ ಬದಲಾವಣೆಗಳಿಗೆ ಅನುಮತಿಯಿಲ್ಲ.",
    "Total Assigned:": "ಒಟ್ಟು ನಿಯೋಜಿತ:",
    "Active Pending:": "ಸಕ್ರಿಯ ಬಾಕಿ:",
    "Resolved Grievances:": "ಪರಿಹರಿಸಿದ ದೂರುಗಳು:",
    "Total Registered": "ಒಟ್ಟು ನೋಂದಾಯಿತ",
    "Overdue > 7 days": "7 ದಿನಕ್ಕಿಂತ ಹೆಚ್ಚು ವಿಳಂಬ",
    "Resolution Rate:": "ಪರಿಹಾರ ದರ:",
    "Delete Receiver": "ಸ್ವೀಕರಿಸುವವರನ್ನು ಅಳಿಸಿ",
    "Delete Citizen Account": "ನಾಗರಿಕ ಖಾತೆ ಅಳಿಸಿ",
    "Delete Grievance Officer": "ದೂರು ಅಧಿಕಾರಿಯನ್ನು ಅಳಿಸಿ",
    "Delete Audit Entry": "ಆಡಿಟ್ ದಾಖಲೆ ಅಳಿಸಿ",
    "Delete Backup Snapshot": "ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಅಳಿಸಿ",
    "Delete Status": "ಸ್ಥಿತಿ ಅಳಿಸಿ",
    "Delete Transition Rule": "ಪರಿವರ್ತನೆ ನಿಯಮ ಅಳಿಸಿ",
    "Edit Grievance Details & Status": "ದೂರಿನ ವಿವರಗಳು ಮತ್ತು ಸ್ಥಿತಿ ತಿದ್ದು",
    "Edit Grievance Details, Status & Official Response": "ದೂರಿನ ವಿವರಗಳು, ಸ್ಥಿತಿ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ ತಿದ್ದು",
    "Edit Status & Transition Rules": "ಸ್ಥಿತಿ ಮತ್ತು ಪರಿವರ್ತನೆ ನಿಯಮಗಳನ್ನು ತಿದ್ದು",
    "Flag duplicate or spam for Admin review": "ಆಡಳಿತ ಪರಿಶೀಲನೆಗಾಗಿ ನಕಲಿ ಅಥವಾ ಸ್ಪ್ಯಾಮ್ ಗುರುತಿಸಿ",
    "Move to Protected Recycle Bin": "ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್‌ಗೆ ಸರಿಸಿ",
    "Restore to active complaint registry": "ಸಕ್ರಿಯ ದೂರು ನೋಂದಣಿಗೆ ಮರುಸ್ಥಾಪಿಸಿ",
    "Permanently eradicate from system": "ಸಿಸ್ಟಮ್‌ನಿಂದ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ",
    "Print Acknowledgement Slip": "ಸ್ವೀಕೃತಿ ಚೀಟಿ ಮುದ್ರಿಸಿ",
    "Track Public Status": "ಸಾರ್ವಜನಿಕ ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "View Complete Update History": "ಪೂರ್ಣ ನವೀಕರಣ ಇತಿಹಾಸ ವೀಕ್ಷಿಸಿ",
    "AI Complaint Prioritization": "ಎಐ ದೂರು ಆದ್ಯತೀಕರಣ",
    "POTENTIAL PUBLIC HAZARD DETECTED": "ಸಂಭಾವ್ಯ ಸಾರ್ವಜನಿಕ ಅಪಾಯ ಪತ್ತೆಯಾಗಿದೆ",
    "Helpline:": "ಸಹಾಯವಾಣಿ:",
    "Pending Action": "ಬಾಕಿ ಕ್ರಮ",
    "Updated by:": "ನವೀಕರಿಸಿದವರು:",
    "Resolution Remarks:": "ಪರಿಹಾರ ಟಿಪ್ಪಣಿಗಳು:",
    "Grievances Register Summary": "ದೂರುಗಳ ನೋಂದಣಿ ಸಾರಾಂಶ",
    "JANASEVA Administrative Grievance Report": "ಜನಸೇವಾ ಆಡಳಿತಾತ್ಮಕ ದೂರು ವರದಿ",
    "JANASEVA Administrative Grievance Portal • Academic Civic Redressal Platform": "ಜನಸೇವಾ ಆಡಳಿತಾತ್ಮಕ ದೂರು ಪೋರ್ಟಲ್ • ಶೈಕ್ಷಣಿಕ ನಾಗರಿಕ ಪರಿಹಾರ ವೇದಿಕೆ",
    "Official Comprehensive Administrative Grievance Register & Status Audit": "ಅಧಿಕೃತ ಸಮಗ್ರ ಆಡಳಿತಾತ್ಮಕ ದೂರು ನೋಂದಣಿ ಮತ್ತು ಸ್ಥಿತಿ ಆಡಿಟ್",
    "Official Grievance Registration & Administrative Status Slip": "ಅಧಿಕೃತ ದೂರು ನೋಂದಣಿ ಮತ್ತು ಆಡಳಿತಾತ್ಮಕ ಸ್ಥಿತಿ ಚೀಟಿ",
    "Electronic Record • Signature Not Required": "ಎಲೆಕ್ಟ್ರಾನಿಕ್ ದಾಖಲೆ • ಸಹಿ ಅಗತ್ಯವಿಲ್ಲ",
    "Generated On:": "ರಚಿಸಿದ ದಿನಾಂಕ:",
    "Generated via JANASEVA Receiver Control Centre": "ಜನಸೇವಾ ಸ್ವೀಕರಿಸುವವರ ನಿಯಂತ್ರಣ ಕೇಂದ್ರದ ಮೂಲಕ ರಚಿಸಲಾಗಿದೆ",
    "| Operator:": "| ನಿರ್ವಾಹಕ:",
    "No": "ಇಲ್ಲ",
    "Filtering updates...": "ನವೀಕರಣಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "Retrieving quarantined records...": "ಕ್ವಾರಂಟೈನ್ ಮಾಡಿದ ದಾಖಲೆಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...",
    "No registered citizens found in users collection.": "ಬಳಕೆದಾರರ ಸಂಗ್ರಹದಲ್ಲಿ ಯಾವುದೇ ನೋಂದಾಯಿತ ನಾಗರಿಕರು ಕಂಡುಬಂದಿಲ್ಲ.",
    "No administrative audit entries logged yet.": "ಇನ್ನೂ ಯಾವುದೇ ಆಡಳಿತಾತ್ಮಕ ಆಡಿಟ್ ದಾಖಲೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
    "No backup snapshots recorded yet.": "ಇನ್ನೂ ಯಾವುದೇ ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
    "No complaint updates found matching the criteria.": "ಮಾನದಂಡಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ದೂರು ನವೀಕರಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    "Try choosing another folder or adjusting the search term.": "ಬೇರೆ ಫೋಲ್ಡರ್ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಹುಡುಕಾಟ ಪದವನ್ನು ಸರಿಹೊಂದಿಸಿ.",
    "No grievances are currently in quarantine.": "ಪ್ರಸ್ತುತ ಯಾವುದೇ ದೂರುಗಳು ಕ್ವಾರಂಟೈನ್‌ನಲ್ಲಿಲ್ಲ.",
    "The Protected Recycle Bin is empty.": "ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್ ಖಾಲಿಯಾಗಿದೆ.",
    "No grievances match the selected criteria.": "ಆಯ್ಕೆಮಾಡಿದ ಮಾನದಂಡಗಳಿಗೆ ಯಾವುದೇ ದೂರುಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
    "Try adjusting the filter pills or search terms.": "ಫಿಲ್ಟರ್ ಅಥವಾ ಹುಡುಕಾಟ ಪದಗಳನ್ನು ಸರಿಹೊಂದಿಸಲು ಪ್ರಯತ್ನಿಸಿ.",
    "No statuses configured.": "ಯಾವುದೇ ಸ್ಥಿತಿಗಳನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿಲ್ಲ.",
    "No active statuses defined.": "ಯಾವುದೇ ಸಕ್ರಿಯ ಸ್ಥಿತಿಗಳನ್ನು ವ್ಯಾಖ್ಯಾನಿಸಲಾಗಿಲ್ಲ.",
    "No status management modifications recorded yet.": "ಇನ್ನೂ ಯಾವುದೇ ಸ್ಥಿತಿ ನಿರ್ವಹಣಾ ಬದಲಾವಣೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
    "No other statuses available.": "ಬೇರೆ ಯಾವುದೇ ಸ್ಥಿತಿಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    "[Approved by Officer]": "[ಅಧಿಕಾರಿಯಿಂದ ಅನುಮೋದಿತ]",
    "[Flagged for Field Inquiry]": "[ಕ್ಷೇತ್ರ ವಿಚಾರಣೆಗೆ ಗುರುತಿಸಲಾಗಿದೆ]",
    "[Pending Official Review]": "[ಅಧಿಕೃತ ಪರಿಶೀಲನೆ ಬಾಕಿ]",
    "[Approved by Gram Panchayat Officer]": "[ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧಿಕಾರಿಯಿಂದ ಅನುಮೋದಿತ]",
    "[Flagged for Field Verification]": "[ಕ್ಷೇತ್ರ ಪರಿಶೀಲನೆಗೆ ಗುರುತಿಸಲಾಗಿದೆ]",
    "[Pending Official Verification]": "[ಅಧಿಕೃತ ಪರಿಶೀಲನೆ ಬಾಕಿ]",
    "New Complaint Notice": "ಹೊಸ ದೂರು ಸೂಚನೆ",
    "Citizen Acknowledgment": "ನಾಗರಿಕ ಸ್ವೀಕೃತಿ",
    "Complaint Resolution": "ದೂರು ಪರಿಹಾರ",
    "System Verification Test": "ಸಿಸ್ಟಮ್ ಪರಿಶೀಲನೆ ಪರೀಕ್ಷೆ",
    "Log ID:": "ಲಾಗ್ ಐಡಿ:",
    "Complaint Ref:": "ದೂರು ಉಲ್ಲೇಖ:",
    "Recipient:": "ಸ್ವೀಕರಿಸುವವರು:",
    "Email Type:": "ಇಮೇಲ್ ಪ್ರಕಾರ:",
    "Timestamp:": "ಸಮಯದ ಗುರುತು:",
    "Gateway Failure Reason:": "ಗೇಟ್‌ವೇ ವಿಫಲತೆಯ ಕಾರಣ:",
    "Transmission Successful:": "ರವಾನೆ ಯಶಸ್ವಿಯಾಗಿದೆ:",
    "The notification payload was accepted by the configured delivery pipeline for immediate dispatch.": "ತಕ್ಷಣದ ರವಾನೆಗಾಗಿ ಕಾನ್ಫಿಗರ್ ಮಾಡಿದ ವಿತರಣಾ ವ್ಯವಸ್ಥೆಯಿಂದ ಅಧಿಸೂಚನೆಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ.",
    "Inspect Transmission Details": "ರವಾನೆ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
    "Delete Transmission Log": "ರವಾನೆ ಲಾಗ್ ಅಳಿಸಿ",
    "Loading delivery audit history...": "ವಿತರಣಾ ಆಡಿಟ್ ಇತಿಹಾಸವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    "Could not load logs:": "ಲಾಗ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ:",
    "No email delivery logs match the selected filter.": "ಆಯ್ಕೆಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗೆ ಯಾವುದೇ ಇಮೇಲ್ ವಿತರಣಾ ಲಾಗ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
    "Authorized & Active": "ಅಧಿಕೃತ ಮತ್ತು ಸಕ್ರಿಯ",
    "Warning loading settings from cloud.": "ಕ್ಲೌಡ್‌ನಿಂದ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡುವಲ್ಲಿ ಎಚ್ಚರಿಕೆ.",
    "Please enter a new complaint recipient email address.": "ದಯವಿಟ್ಟು ಹೊಸ ದೂರು ಸ್ವೀಕರಿಸುವವರ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
    "Invalid email format. Please check the address entered.": "ಅಮಾನ್ಯ ಇಮೇಲ್ ವಿನ್ಯಾಸ. ದಯವಿಟ್ಟು ನಮೂದಿಸಿದ ವಿಳಾಸವನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "The confirmation email address does not match. Please verify.": "ದೃಢೀಕರಣ ಇಮೇಲ್ ವಿಳಾಸ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.",
    "The specified email is already the active recipient.": "ನಮೂದಿಸಿದ ಇಮೇಲ್ ಈಗಾಗಲೇ ಸಕ್ರಿಯ ಸ್ವೀಕರಿಸುವವರಾಗಿದ್ದಾರೆ.",
    "Saving to Cloud...": "ಕ್ಲೌಡ್‌ಗೆ ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    "Please provide EmailJS Public Key, Service ID, and Template ID.": "ದಯವಿಟ್ಟು EmailJS Public Key, Service ID, ಮತ್ತು Template ID ನೀಡಿ.",
    "Saving...": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    "Email delivery configuration saved securely to Cloud Firestore.": "ಇಮೇಲ್ ವಿತರಣಾ ಕಾನ್ಫಿಗರೇಶನ್ ಅನ್ನು ಕ್ಲೌಡ್ ಫೈರ್‌ಸ್ಟೋರ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಲಾಗಿದೆ.",
    "Saving Preferences...": "ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    "Notification preferences updated successfully.": "ಅಧಿಸೂಚನೆ ಆದ್ಯತೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.",
    "Email delivery log entry deleted.": "ಇಮೇಲ್ ವಿತರಣಾ ಲಾಗ್ ದಾಖಲೆ ಅಳಿಸಲಾಗಿದೆ.",
    "All email delivery logs cleared.": "ಎಲ್ಲಾ ಇಮೇಲ್ ವಿತರಣಾ ಲಾಗ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.",
    "Please enter a valid receiver email address before testing.": "ಪರೀಕ್ಷಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಸ್ವೀಕರಿಸುವವರ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
    "Access Denied: Administrator Only": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ಆಡಳಿತಾಧಿಕಾರಿಗೆ ಮಾತ್ರ",
    "Banner Image Management is strictly restricted to authenticated System Administrators. Your current role does not have authorization to view or configure banner assets.": "ಬ್ಯಾನರ್ ಚಿತ್ರ ನಿರ್ವಹಣೆಯು ದೃಢೀಕೃತ ಸಿಸ್ಟಮ್ ಆಡಳಿತಾಧಿಕಾರಿಗಳಿಗೆ ಮಾತ್ರ ಕಟ್ಟುನಿಟ್ಟಾಗಿ ಸೀಮಿತವಾಗಿದೆ.",
    "CUSTOM BANNER ACTIVE": "ಕಸ್ಟಮ್ ಬ್ಯಾನರ್ ಸಕ್ರಿಯ",
    "DEFAULT BANNER ACTIVE": "ಡೀಫಾಲ್ಟ್ ಬ್ಯಾನರ್ ಸಕ್ರಿಯ",
    "Upload, preview, replace, and manage the official background banner image displayed in the Admin Control Centre header.": "ಆಡಳಿತ ನಿಯಂತ್ರಣ ಕೇಂದ್ರದ ಹೆಡರ್‌ನಲ್ಲಿ ಪ್ರದರ್ಶಿಸಲಾದ ಅಧಿಕೃತ ಹಿನ್ನೆಲೆ ಬ್ಯಾನರ್ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಪೂರ್ವವೀಕ್ಷಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ.",
    "Live Banner Display Preview": "ನೇರ ಬ್ಯಾನರ್ ಪ್ರದರ್ಶನ ಪೂರ್ವವೀಕ್ಷಣೆ",
    "Demonstrates how the banner appears with the gradient overlay, shield emblem, title, and tricolour separator.": "ಗ್ರೇಡಿಯಂಟ್ ಓವರ್‌ಲೇ, ಗುರಾಣಿ ಚಿಹ್ನೆ, ಶೀರ್ಷಿಕೆ ಮತ್ತು ತ್ರಿವರ್ಣ ವಿಭಜಕದೊಂದಿಗೆ ಬ್ಯಾನರ್ ಹೇಗೆ ಕಾಣುತ್ತದೆ ಎಂಬುದನ್ನು ತೋರಿಸುತ್ತದೆ.",
    "Centralized grievance management, citizen register, official response dispatch, and workload monitoring.": "ಕೇಂದ್ರೀಕೃತ ದೂರು ನಿರ್ವಹಣೆ, ನಾಗರಿಕ ನೋಂದಣಿ, ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ ರವಾನೆ ಮತ್ತು ಕಾರ್ಯಭಾರ ಮೇಲ್ವಿಚಾರಣೆ.",
    "Banner Specification & Status": "ಬ್ಯಾನರ್ ವಿವರಣೆ ಮತ್ತು ಸ್ಥಿತಿ",
    "Active Mode:": "ಸಕ್ರಿಯ ಮೋಡ್:",
    "Filename:": "ಫೈಲ್ ಹೆಸರು:",
    "File Size:": "ಫೈಲ್ ಗಾತ್ರ:",
    "Last Updated Date:": "ಕೊನೆಯ ನವೀಕರಣ ದಿನಾಂಕ:",
    "Uploaded By:": "ಅಪ್‌ಲೋಡ್ ಮಾಡಿದವರು:",
    "Storage Location:": "ಸಂಗ್ರಹಣೆ ಸ್ಥಳ:",
    "Upload & Action Centre": "ಅಪ್‌ಲೋಡ್ ಮತ್ತು ಕ್ರಿಯಾ ಕೇಂದ್ರ",
    "Select high-resolution image from your device.": "ನಿಮ್ಮ ಸಾಧನದಿಂದ ಹೆಚ್ಚಿನ ರೆಸಲ್ಯೂಶನ್ ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    "Choose Banner Image": "ಬ್ಯಾನರ್ ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ",
    "Click to browse or drag & drop from computer or mobile": "ಕಂಪ್ಯೂಟರ್ ಅಥವಾ ಮೊಬೈಲ್‌ನಿಂದ ಬ್ರೌಸ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಎಳೆದು ಬಿಡಿ",
    "Max 10 MB": "ಗರಿಷ್ಠ 10 MB",
    "Landscape Recommended": "ಲ್ಯಾಂಡ್‌ಸ್ಕೇಪ್ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ",
    "Verified Valid Format & Size": "ಮಾನ್ಯವಾದ ಫಾರ್ಮ್ಯಾಟ್ ಮತ್ತು ಗಾತ್ರ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "Uploading to Secure Storage...": "ಸುರಕ್ಷಿತ ಸಂಗ್ರಹಣೆಗೆ ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    "Save & Apply Banner": "ಬ್ಯಾನರ್ ಉಳಿಸಿ ಮತ್ತು ಅನ್ವಯಿಸಿ",
    "Cancel Selection": "ಆಯ್ಕೆ ರದ್ದುಮಾಡಿ",
    "Delete Custom Banner and Restore Default": "ಕಸ್ಟಮ್ ಬ್ಯಾನರ್ ಅಳಿಸಿ ಮತ್ತು ಡೀಫಾಲ್ಟ್ ಮರುಸ್ಥಾಪಿಸಿ",
    "Desktop Screen (Full)": "ಡೆಸ್ಕ್‌ಟಾಪ್ ಪರದೆ (ಪೂರ್ಣ)",
    "Tablet Screen (Medium)": "ಟ್ಯಾಬ್ಲೆಟ್ ಪರದೆ (ಮಧ್ಯಮ)",
    "Security & Compliance Policy:": "ಭದ್ರತೆ ಮತ್ತು ಅನುಸರಣೆ ನೀತಿ:",
    "Only administrators can modify this banner. Uploaded imagery is validated against rigid MIME type signatures to prevent script injection. Large binary files are stored in dedicated cloud storage rather than bloating core transactional database ledgers.": "ಕೇವಲ ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಮಾತ್ರ ಈ ಬ್ಯಾನರ್ ಅನ್ನು ಬದಲಾಯಿಸಬಹುದು. ಸ್ಕ್ರಿಪ್ಟ್ ಇಂಜೆಕ್ಷನ್ ತಡೆಯಲು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಚಿತ್ರಗಳನ್ನು ಕಟ್ಟುನಿಟ್ಟಾದ MIME ಪ್ರಕಾರದಿಂದ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.",
    "Please select an image file to save.": "ಉಳಿಸಲು ದಯವಿಟ್ಟು ಚಿತ್ರ ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ.",
    "Saving Banner...": "ಬ್ಯಾನರ್ ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    "Banner image replaced successfully!": "ಬ್ಯಾನರ್ ಚಿತ್ರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ!",
    "Banner image uploaded successfully!": "ಬ್ಯಾನರ್ ಚಿತ್ರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ!",
    "Banner image updated successfully!": "ಬ್ಯಾನರ್ ಚಿತ್ರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
    "No custom banner is currently active to delete.": "ಅಳಿಸಲು ಪ್ರಸ್ತುತ ಯಾವುದೇ ಕಸ್ಟಮ್ ಬ್ಯಾನರ್ ಸಕ್ರಿಯವಾಗಿಲ್ಲ.",
    "Custom banner deleted. Reverted to default Gram Panchayat design.": "ಕಸ್ಟಮ್ ಬ್ಯಾನರ್ ಅಳಿಸಲಾಗಿದೆ. ಡೀಫಾಲ್ಟ್ ಗ್ರಾಮ ಪಂಚಾಯತ್ ವಿನ್ಯಾಸಕ್ಕೆ ಮರಳಲಾಗಿದೆ.",
    "Banner deleted successfully.": "ಬ್ಯಾನರ್ ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.",
    "Access Denied: Emergency Control Centre requires Administrator privileges.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ತುರ್ತು ನಿಯಂತ್ರಣ ಕೇಂದ್ರಕ್ಕೆ ಆಡಳಿತಾಧಿಕಾರಿ ಸವಲತ್ತುಗಳು ಅಗತ್ಯವಿದೆ.",
    "ACTIVE (SUBMISSIONS PAUSED)": "ಸಕ್ರಿಯ (ದೂರು ಸಲ್ಲಿಕೆ ತಡೆಹಿಡಿಯಲಾಗಿದೆ)",
    "System data was reset from Administrator Control Centre.": "ಆಡಳಿತ ನಿಯಂತ್ರಣ ಕೇಂದ್ರದಿಂದ ಸಿಸ್ಟಮ್ ಡೇಟಾವನ್ನು ಮರುಹೊಂದಿಸಲಾಗಿದೆ.",
    "Access Denied: Only Administrator accounts can launch Emergency Reset.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ಆಡಳಿತಾಧಿಕಾರಿ ಖಾತೆಗಳು ಮಾತ್ರ ತುರ್ತು ಮರುಹೊಂದಿಕೆಯನ್ನು ಪ್ರಾರಂಭಿಸಬಹುದು.",
    "Please create and verify the pre-reset backup snapshot before proceeding.": "ಮುಂದುವರಿಯುವ ಮೊದಲು ದಯವಿಟ್ಟು ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ರಚಿಸಿ ಮತ್ತು ಪರಿಶೀಲಿಸಿ.",
    "Please enter your administrator password to re-authenticate.": "ಮರು-ದೃಢೀಕರಿಸಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆಡಳಿತಾಧಿಕಾರಿ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.",
    "Incorrect password.": "ತಪ್ಪಾದ ಪಾಸ್‌ವರ್ಡ್.",
    "Security checkpoint failed! You must type exactly 'RESET JANASEVA'.": "ಭದ್ರತಾ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ! ನೀವು ನಿಖರವಾಗಿ 'RESET JANASEVA' ಎಂದು ಟೈಪ್ ಮಾಡಬೇಕು.",
    "Please acknowledge all three safety and consequence check items to proceed.": "ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಮೂರು ಸುರಕ್ಷತಾ ಮತ್ತು ಪರಿಣಾಮದ ಅಂಶಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ.",
    "Generating pre-reset cryptographic snapshot backup and computing SHA-256 hash...": "ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಬ್ಯಾಕಪ್ ರಚಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು SHA-256 ಹ್ಯಾಶ್ ಲೆಕ್ಕಿಸಲಾಗುತ್ತಿದೆ...",
    "Phrase matches perfectly.": "ವಾಕ್ಯವು ನಿಖರವಾಗಿ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ.",
    "Type": "ಟೈಪ್ ಮಾಡಿ",
    "exactly.": "ನಿಖರವಾಗಿ.",
    "EXECUTE EMERGENCY DATA RESET NOW": "ತುರ್ತು ಡೇಟಾ ಮರುಹೊಂದಿಕೆಯನ್ನು ಈಗಲೇ ಕಾರ್ಯಗತಗೊಳಿಸಿ",
    "Reset Completed Successfully!": "ಮರುಹೊಂದಿಕೆ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ!",
    "Emergency Data Reset completed successfully.": "ತುರ್ತು ಡೇಟಾ ಮರುಹೊಂದಿಕೆ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ.",
    "Reset Aborted with Error": "ದೋಷದೊಂದಿಗೆ ಮರುಹೊಂದಿಕೆ ಸ್ಥಗಿತಗೊಂಡಿದೆ",
    "An error occurred during reset.": "ಮರುಹೊಂದಿಕೆಯ ಸಮಯದಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ.",
    "Close Console": "ಕನ್ಸೋಲ್ ಮುಚ್ಚಿ",
    "No pre-reset backup snapshots available yet.": "ಇನ್ನೂ ಯಾವುದೇ ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    "Restoration in progress. Verifying checksum and writing records...": "ಮರುಸ್ಥಾಪನೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ. ಚೆಕ್‌ಸಮ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಬರೆಯಲಾಗುತ್ತಿದೆ...",
    "Unauthorized: Only Administrator can delete backups.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿ ಮಾತ್ರ ಬ್ಯಾಕಪ್‌ಗಳನ್ನು ಅಳಿಸಬಹುದು.",
    "All emergency reset audit logs have been successfully cleared.": "ಎಲ್ಲಾ ತುರ್ತು ಮರುಹೊಂದಿಕೆ ಆಡಿಟ್ ಲಾಗ್‌ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.",
    "No emergency reset audit logs recorded yet. Ledger is clean.": "ಇನ್ನೂ ಯಾವುದೇ ತುರ್ತು ಮರುಹೊಂದಿಕೆ ಆಡಿಟ್ ಲಾಗ್‌ಗಳು ದಾಖಲಾಗಿಲ್ಲ. ಲೆಡ್ಜರ್ ಸ್ವಚ್ಛವಾಗಿದೆ.",
    "Citizen Grievances & Attachments": "ನಾಗರಿಕ ದೂರುಗಳು ಮತ್ತು ಲಗತ್ತುಗಳು",
    "Status Histories & Review Notes": "ಸ್ಥಿತಿ ಇತಿಹಾಸ ಮತ್ತು ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿಗಳು",
    "Email & WhatsApp Notifications": "ಇಮೇಲ್ ಮತ್ತು ವಾಟ್ಸಾಪ್ ಅಧಿಸೂಚನೆಗಳು",
    "Registered Citizen Accounts": "ನೋಂದಾಯಿತ ನಾಗರಿಕ ಖಾತೆಗಳು",
    "Gram Panchayat Official Receivers": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಧಿಕೃತ ಸ್ವೀಕರಿಸುವವರು",
    "Super Admin Account": "ಸೂಪರ್ ಆಡಳಿತಾಧಿಕಾರಿ ಖಾತೆ",
    "IndexedDB Offline Submission Queue": "IndexedDB ಆಫ್‌ಲೈನ್ ಸಲ್ಲಿಕೆ ಸರದಿ",
    "WIPED": "ಅಳಿಸಲಾಗಿದೆ",
    "PRESERVED": "ಸುರಕ್ಷಿತವಾಗಿದೆ",
    "PRESERVED ALWAYS": "ಯಾವಾಗಲೂ ಸುರಕ್ಷಿತ",
    "FLUSHED": "ತೆರವುಗೊಳಿಸಲಾಗಿದೆ",
    "VERIFIED": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "Download JSON Snapshot": "JSON ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "Restore this Snapshot": "ಈ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಮರುಸ್ಥಾಪಿಸಿ",
    "Permanently Delete Snapshot": "ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ",
    "Delete Log Entry": "ಲಾಗ್ ದಾಖಲೆ ಅಳಿಸಿ",
    "CATEGORY A – CLEAR TEMP DATA": "ವರ್ಗ A – ತಾತ್ಕಾಲಿಕ ಡೇಟಾ ತೆರವುಗೊಳಿಸಿ",
    "Flush Temporary Caches & Delivery Logs": "ತಾತ್ಕಾಲಿಕ ಕ್ಯಾಶ್ ಮತ್ತು ವಿತರಣಾ ಲಾಗ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
    "Clears offline IndexedDB draft queues, session storage, and email/WhatsApp logs. All citizen grievances and user profiles remain untouched.": "ಆಫ್‌ಲೈನ್ IndexedDB ಕರಡು ಸರದಿ, ಸೆಷನ್ ಸಂಗ್ರಹಣೆ ಮತ್ತು ಇಮೇಲ್/ವಾಟ್ಸಾಪ್ ಲಾಗ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ. ಎಲ್ಲಾ ನಾಗರಿಕ ದೂರುಗಳು ಮತ್ತು ಬಳಕೆದಾರರ ಪ್ರೊಫೈಲ್‌ಗಳು ಸುರಕ್ಷಿತವಾಗಿರುತ್ತವೆ.",
    "CATEGORY B – GRIEVANCE RECORDS RESET": "ವರ್ಗ B – ದೂರು ದಾಖಲೆಗಳ ಮರುಹೊಂದಿಕೆ",
    "CATEGORY B – OPERATIONAL RESET": "ವರ್ಗ B – ಕಾರ್ಯಾಚರಣೆ ಮರುಹೊಂದಿಕೆ",
    "Purges complaints, review timelines, official responses, and delivery logs while preserving all user account profiles and settings.": "ಎಲ್ಲಾ ಬಳಕೆದಾರರ ಖಾತೆ ಪ್ರೊಫೈಲ್‌ಗಳು ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿಕೊಂಡು ದೂರುಗಳು, ಪರಿಶೀಲನಾ ಟೈಮ್‌ಲೈನ್‌ಗಳು, ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಮತ್ತು ವಿತರಣಾ ಲಾಗ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ.",
    "Purges complaints, review timelines, chat messages and offline queues while preserving all administrator, receiver, and citizen user profiles.": "ಎಲ್ಲಾ ಆಡಳಿತಾಧಿಕಾರಿ, ಸ್ವೀಕರಿಸುವವರು ಮತ್ತು ನಾಗರಿಕ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ಉಳಿಸಿಕೊಂಡು ದೂರುಗಳು, ಟೈಮ್‌ಲೈನ್‌ಗಳು, ಚಾಟ್ ಸಂದೇಶಗಳು ಮತ್ತು ಆಫ್‌ಲೈನ್ ಸರದಿಗಳನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ.",
    "CATEGORY C – CITIZEN REGISTRY RESET": "ವರ್ಗ C – ನಾಗರಿಕ ನೋಂದಣಿ ಮರುಹೊಂದಿಕೆ",
    "Reset Citizen Accounts & Registrations": "ನಾಗರಿಕ ಖಾತೆಗಳು ಮತ್ತು ನೋಂದಣಿಗಳನ್ನು ಮರುಹೊಂದಿಸಿ",
    "Purges citizen user registrations and their grievances. Gram Panchayat receivers and Administrator remain active.": "ನಾಗರಿಕ ಬಳಕೆದಾರ ನೋಂದಣಿಗಳು ಮತ್ತು ಅವರ ದೂರುಗಳನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ. ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸ್ವೀಕರಿಸುವವರು ಮತ್ತು ಆಡಳಿತಾಧಿಕಾರಿ ಸಕ್ರಿಯವಾಗಿರುತ್ತಾರೆ.",
    "CATEGORY D – RECEIVER DATA RESET": "ವರ್ಗ D – ಸ್ವೀಕರಿಸುವವರ ಡೇಟಾ ಮರುಹೊಂದಿಕೆ",
    "Reset Receiver Settings & Delivery Profiles": "ಸ್ವೀಕರಿಸುವವರ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ವಿತರಣಾ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ಮರುಹೊಂದಿಸಿ",
    "Restores receiver profile configurations and email delivery settings to system defaults. Citizen complaints and citizen accounts remain intact.": "ಸ್ವೀಕರಿಸುವವರ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಇಮೇಲ್ ವಿತರಣಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಡೀಫಾಲ್ಟ್‌ಗೆ ಮರುಸ್ಥಾಪಿಸುತ್ತದೆ. ನಾಗರಿಕ ದೂರುಗಳು ಮತ್ತು ಖಾತೆಗಳು ಸುರಕ್ಷಿತವಾಗಿರುತ್ತವೆ.",
    "CATEGORY E – COMPLETE FACTORY RESET": "ವರ್ಗ E – ಸಂಪೂರ್ಣ ಫ್ಯಾಕ್ಟರಿ ಮರುಹೊಂದಿಕೆ",
    "Complete system factory reset. Purges all operational data and citizen registrations. Super Admin account is strictly preserved.": "ಸಂಪೂರ್ಣ ಸಿಸ್ಟಮ್ ಫ್ಯಾಕ್ಟರಿ ಮರುಹೊಂದಿಕೆ. ಎಲ್ಲಾ ಕಾರ್ಯಾಚರಣೆ ಡೇಟಾ ಮತ್ತು ನಾಗರಿಕ ನೋಂದಣಿಗಳನ್ನು ಅಳಿಸುತ್ತದೆ. ಸೂಪರ್ ಆಡಳಿತಾಧಿಕಾರಿ () ಸುರಕ್ಷಿತವಾಗಿರುತ್ತಾರೆ.",
    "Complete System Baseline Reset": "ಸಂಪೂರ್ಣ ಸಿಸ್ಟಮ್ ಮೂಲ ಮರುಹೊಂದಿಕೆ",
    "Purges all complaints, notifications, and citizen registrations for fresh deployment baseline. Strictly preserves Super Admin account.": "ಹೊಸ ನಿಯೋಜನೆಗಾಗಿ ಎಲ್ಲಾ ದೂರುಗಳು, ಅಧಿಸೂಚನೆಗಳು ಮತ್ತು ನಾಗರಿಕ ನೋಂದಣಿಗಳನ್ನು ಅಳಿಸುತ್ತದೆ. ಸೂಪರ್ ಆಡಳಿತಾಧಿಕಾರಿ () ಸುರಕ್ಷಿತವಾಗಿರುತ್ತಾರೆ.",
    "Please type your reply before sending.": "ಕಳುಹಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಟೈಪ್ ಮಾಡಿ.",
    "Your reply has been sent to the Gram Panchayat desk.": "ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಡೆಸ್ಕ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.",
    "Complaint record not found.": "ದೂರು ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ.",
    "Receipt generator is still loading. Please try again in a moment.": "ರಸೀದಿ ಜನರೇಟರ್ ಇನ್ನೂ ಲೋಡ್ ಆಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    "Moving...": "ಸರಿಸಲಾಗುತ್ತಿದೆ...",
    "Move to Deleted History": "ಅಳಿಸಿದ ಇತಿಹಾಸಕ್ಕೆ ಸರಿಸಿ",
    "Thank you! Your feedback has been recorded.": "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ.",
    "Please provide a detailed explanation for reopening (at least 10 characters).": "ಮರುತೆರೆಯಲು ದಯವಿಟ್ಟು ವಿವರವಾದ ಕಾರಣವನ್ನು ನೀಡಿ (ಕನಿಷ್ಠ 10 ಅಕ್ಷರಗಳು).",
    "Please type your reply or inquiry before sending.": "ಕಳುಹಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಉತ್ತರ ಅಥವಾ ವಿಚಾರಣೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ.",
    "Please sign in to post a follow-up reply.": "ಮುಂದುವರಿದ ಉತ್ತರವನ್ನು ಕಳುಹಿಸಲು ದಯವಿಟ್ಟು ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    "Your reply has been submitted to the Gram Panchayat desk.": "ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತ್ ಡೆಸ್ಕ್‌ಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ.",
    "Please enter a Complaint ID or Email to search.": "ಹುಡುಕಲು ದಯವಿಟ್ಟು ದೂರು ಐಡಿ ಅಥವಾ ಇಮೇಲ್ ನಮೂದಿಸಿ.",
    "To search by email, please log in with your verified account.": "ಇಮೇಲ್ ಮೂಲಕ ಹುಡುಕಲು, ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪರಿಶೀಲಿಸಿದ ಖಾತೆಯೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ.",
    "Access Denied: You can only query grievances registered to your verified account.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ನಿಮ್ಮ ಪರಿಶೀಲಿಸಿದ ಖಾತೆಗೆ ನೋಂದಾಯಿಸಲಾದ ದೂರುಗಳನ್ನು ಮಾತ್ರ ನೀವು ಹುಡುಕಬಹುದು.",
    "Unauthorized: Official privileges required to edit complaint status.": "ಅನಧಿಕೃತ: ದೂರಿನ ಸ್ಥಿತಿಯನ್ನು ತಿದ್ದಲು ಅಧಿಕೃತ ಸವಲತ್ತುಗಳು ಅಗತ್ಯವಿದೆ.",
    "Unauthorized: Only officials can update grievance status.": "ಅನಧಿಕೃತ: ಅಧಿಕಾರಿಗಳು ಮಾತ್ರ ದೂರಿನ ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಬಹುದು.",
    "Unauthorized: Only System Administrators can delete complaints.": "ಅನಧಿಕೃತ: ಸಿಸ್ಟಮ್ ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಮಾತ್ರ ದೂರುಗಳನ್ನು ಅಳಿಸಬಹುದು.",
    "No update records available to export": "ರಫ್ತು ಮಾಡಲು ಯಾವುದೇ ನವೀಕರಣ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ",
    "No complaints available to export": "ರಫ್ತು ಮಾಡಲು ಯಾವುದೇ ದೂರುಗಳು ಲಭ್ಯವಿಲ್ಲ",
    "Popup blocker prevented print view. Please allow popups.": "ಪಾಪ್-ಅಪ್ ಬ್ಲಾಕರ್ ಮುದ್ರಣ ವೀಕ್ಷಣೆಯನ್ನು ತಡೆದಿದೆ. ದಯವಿಟ್ಟು ಪಾಪ್-ಅಪ್‌ಗಳಿಗೆ ಅನುಮತಿ ನೀಡಿ.",
    "Dispatching...": "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
    "Updating Lifecycle...": "ಜೀವನಚಕ್ರ ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...",
    "Please enter an official response or internal note.": "ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ ಅಥವಾ ಆಂತರಿಕ ಟಿಪ್ಪಣಿ ನಮೂದಿಸಿ.",
    "Please provide a mandatory reason for rejecting this grievance.": "ಈ ದೂರನ್ನು ತಿರಸ್ಕರಿಸಲು ದಯವಿಟ್ಟು ಕಡ್ಡಾಯ ಕಾರಣವನ್ನು ನೀಡಿ.",
    "Please provide justification for reopening this grievance.": "ಈ ದೂರನ್ನು ಮರುತೆರೆಯಲು ದಯವಿಟ್ಟು ಸಮರ್ಥನೆಯನ್ನು ನೀಡಿ.",
    "No records available to export.": "ರಫ್ತು ಮಾಡಲು ಯಾವುದೇ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    "Excel/CSV grievance register downloaded successfully!": "ಎಕ್ಸೆಲ್/CSV ದೂರು ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!",
    "Dashboard synchronized with permanent database.": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಶಾಶ್ವತ ಡೇಟಾಬೇಸ್‌ನೊಂದಿಗೆ ಸಿಂಕ್ ಆಗಿದೆ.",
    "Panchayat Intelligence & Hotspot scan refreshed successfully.": "ಪಂಚಾಯತ್ ಗುಪ್ತಚರ ಮತ್ತು ಹಾಟ್‌ಸ್ಪಾಟ್ ಸ್ಕ್ಯಾನ್ ಯಶಸ್ವಿಯಾಗಿ ರಿಫ್ರೆಶ್ ಆಗಿದೆ.",
    "Intelligence report exported successfully.": "ಗುಪ್ತಚರ ವರದಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಫ್ತು ಮಾಡಲಾಗಿದೆ.",
    "Status Name and Identifier are mandatory.": "ಸ್ಥಿತಿಯ ಹೆಸರು ಮತ್ತು ಗುರುತಿನ ಸಂಕೇತ ಕಡ್ಡಾಯವಾಗಿದೆ.",
    "Administrative Change Justification is required for the audit log.": "ಆಡಿಟ್ ಲಾಗ್‌ಗಾಗಿ ಆಡಳಿತಾತ್ಮಕ ಬದಲಾವಣೆಯ ಸಮರ್ಥನೆ ಅಗತ್ಯವಿದೆ.",
    "Saving Status...": "ಸ್ಥಿತಿ ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    "No updates to export.": "ರಫ್ತು ಮಾಡಲು ಯಾವುದೇ ನವೀಕರಣಗಳಿಲ್ಲ.",
    "Unauthorized: Admin privilege required to manage audit records.": "ಅನಧಿಕೃತ: ಆಡಿಟ್ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಆಡಳಿತಾಧಿಕಾರಿ ಸವಲತ್ತು ಅಗತ್ಯವಿದೆ.",
    "Status audit record deleted successfully.": "ಸ್ಥಿತಿ ಆಡಿಟ್ ದಾಖಲೆ ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.",
    "Unauthorized: Admin privilege required to clear audit records.": "ಅನಧಿಕೃತ: ಆಡಿಟ್ ದಾಖಲೆಗಳನ್ನು ತೆರವುಗೊಳಿಸಲು ಆಡಳಿತಾಧಿಕಾರಿ ಸವಲತ್ತು ಅಗತ್ಯವಿದೆ.",
    "Status management audit trail cleared successfully.": "ಸ್ಥಿತಿ ನಿರ್ವಹಣೆ ಆಡಿಟ್ ಇತಿಹಾಸವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.",
    "Official Gram Panchayat 8-stage schema successfully restored!": "ಅಧಿಕೃತ ಗ್ರಾಮ ಪಂಚಾಯತ್ 8-ಹಂತದ ಸ್ಕೀಮಾ ಯಶಸ್ವಿಯಾಗಿ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ!",
    "Unauthorized: Only Administrators can restore quarantined grievances.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಮಾತ್ರ ಕ್ವಾರಂಟೈನ್ ದೂರುಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಬಹುದು.",
    "Storage Manager is unavailable. Cannot restore grievance.": "ಸ್ಟೋರೇಜ್ ಮ್ಯಾನೇಜರ್ ಲಭ್ಯವಿಲ್ಲ. ದೂರನ್ನು ಮರುಸ್ಥಾಪಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    "Unauthorized: Only Administrators can permanently purge records.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಮಾತ್ರ ದಾಖಲೆಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಬಹುದು.",
    "Please type DELETE to authorize permanent destruction.": "ಶಾಶ್ವತ ಅಳಿಸುವಿಕೆಯನ್ನು ದೃಢೀಕರಿಸಲು ದಯವಿಟ್ಟು DELETE ಎಂದು ಟೈಪ್ ಮಾಡಿ.",
    "Unauthorized: Only Administrators can empty the Recycle Bin.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಮಾತ್ರ ರಿಸೈಕಲ್ ಬಿನ್ ಖಾಲಿ ಮಾಡಬಹುದು.",
    "Recycle Bin is already empty.": "ರಿಸೈಕಲ್ ಬಿನ್ ಈಗಾಗಲೇ ಖಾಲಿಯಾಗಿದೆ.",
    "Action cancelled: authorization code did not match.": "ಕ್ರಿಯೆ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ: ದೃಢೀಕರಣ ಕೋಡ್ ಹೊಂದಿಕೆಯಾಗಲಿಲ್ಲ.",
    "Protected Recycle Bin emptied successfully.": "ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್ ಯಶಸ್ವಿಯಾಗಿ ಖಾಲಿ ಮಾಡಲಾಗಿದೆ.",
    "Unauthorized: Only Administrators can bulk delete records.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಮಾತ್ರ ಸಾಮೂಹಿಕವಾಗಿ ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಬಹುದು.",
    "Unauthorized: Only Administrators can restore quarantined records.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಮಾತ್ರ ಕ್ವಾರಂಟೈನ್ ದಾಖಲೆಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಬಹುದು.",
    "Please check at least one quarantined grievance to restore.": "ಮರುಸ್ಥಾಪಿಸಲು ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಕ್ವಾರಂಟೈನ್ ದೂರನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    "Storage Manager is unavailable. Cannot restore selected grievances.": "ಸ್ಟೋರೇಜ್ ಮ್ಯಾನೇಜರ್ ಲಭ್ಯವಿಲ್ಲ. ಆಯ್ಕೆಮಾಡಿದ ದೂರುಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    "Please provide officer justification notes for Administrator review.": "ಆಡಳಿತಾಧಿಕಾರಿ ಪರಿಶೀಲನೆಗಾಗಿ ದಯವಿಟ್ಟು ಅಧಿಕಾರಿ ಸಮರ್ಥನಾ ಟಿಪ್ಪಣಿಗಳನ್ನು ನೀಡಿ.",
    "Access Denied: Complaint Status Management is restricted to Administrators only.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ದೂರು ಸ್ಥಿತಿ ನಿರ್ವಹಣೆಯು ಆಡಳಿತಾಧಿಕಾರಿಗಳಿಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ.",
    "Access Denied: Emergency Data Reset is strictly restricted to Administrators only.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ತುರ್ತು ಡೇಟಾ ಮರುಹೊಂದಿಕೆಯು ಆಡಳಿತಾಧಿಕಾರಿಗಳಿಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ.",
    "Access Denied: Banner Image Management is strictly restricted to Administrators only.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ಬ್ಯಾನರ್ ಚಿತ್ರ ನಿರ್ವಹಣೆಯು ಆಡಳಿತಾಧಿಕಾರಿಗಳಿಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ.",
    "Access Denied: Protected Recycle Bin is restricted to Administrators only.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್ ಆಡಳಿತಾಧಿಕಾರಿಗಳಿಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ.",
    "Access Denied: Only Administrators can delete grievance records.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: ಆಡಳಿತಾಧಿಕಾರಿಗಳು ಮಾತ್ರ ದೂರು ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಬಹುದು.",
    "Unauthorized: Only Administrator can delete registered citizen profiles.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿ ಮಾತ್ರ ನೋಂದಾಯಿತ ನಾಗರಿಕ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ಅಳಿಸಬಹುದು.",
    "Unauthorized: Only Administrator can remove Grievance Officers.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿ ಮಾತ್ರ ದೂರು ಅಧಿಕಾರಿಗಳನ್ನು ತೆಗೆದುಹಾಕಬಹುದು.",
    "Protected Account: System Super Administrator account cannot be deleted.": "ರಕ್ಷಿತ ಖಾತೆ: ಸಿಸ್ಟಮ್ ಸೂಪರ್ ಆಡಳಿತಾಧಿಕಾರಿ ಖಾತೆಯನ್ನು ಅಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    "Unauthorized: Only Administrator can delete audit records.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿ ಮಾತ್ರ ಆಡಿಟ್ ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಬಹುದು.",
    "Audit log entry deleted successfully.": "ಆಡಿಟ್ ಲಾಗ್ ದಾಖಲೆ ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.",
    "Unauthorized: Only Administrator can clear the audit trail.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿ ಮಾತ್ರ ಆಡಿಟ್ ಇತಿಹಾಸವನ್ನು ತೆರವುಗೊಳಿಸಬಹುದು.",
    "Administrative audit trail cleared.": "ಆಡಳಿತಾತ್ಮಕ ಆಡಿಟ್ ಇತಿಹಾಸವನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.",
    "Unauthorized: Only Administrator can delete backup snapshots.": "ಅನಧಿಕೃತ: ಆಡಳಿತಾಧಿಕಾರಿ ಮಾತ್ರ ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್‌ಗಳನ್ನು ಅಳಿಸಬಹುದು.",
    "Enter maintenance notice for citizens (or leave default):": "ನಾಗರಿಕರಿಗಾಗಿ ನಿರ್ವಹಣಾ ಸೂಚನೆಯನ್ನು ನಮೂದಿಸಿ (ಅಥವಾ ಡೀಫಾಲ್ಟ್ ಬಿಡಿ):",
    "Scheduled System Maintenance in Progress": "ನಿಗದಿತ ಸಿಸ್ಟಮ್ ನಿರ್ವಹಣೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    "Routine workflow retirement": "ನಿಯಮಿತ ಕಾರ್ಯಪ್ರವಾಹ ನಿವೃತ್ತಿ",
    "Enter administrative reason for restoring default schema:": "ಡೀಫಾಲ್ಟ್ ಸ್ಕೀಮಾ ಮರುಸ್ಥಾಪಿಸಲು ಆಡಳಿತಾತ್ಮಕ ಕಾರಣವನ್ನು ನಮೂದಿಸಿ:",
    "Restored official Gram Panchayat 8-stage grievance lifecycle schema": "ಅಧಿಕೃತ ಗ್ರಾಮ ಪಂಚಾಯತ್ 8-ಹಂತದ ದೂರು ಜೀವನಚಕ್ರ ಸ್ಕೀಮಾ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ",
    "Are you sure you want to delete this email transmission log entry?": "ಈ ಇಮೇಲ್ ರವಾನೆ ಲಾಗ್ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?",
    "Are you sure you want to permanently clear all email delivery audit history logs?": "ಎಲ್ಲಾ ಇಮೇಲ್ ವಿತರಣಾ ಆಡಿಟ್ ಇತಿಹಾಸ ಲಾಗ್‌ಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ತೆರವುಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?",
    "CLEAR AUDIT TRAIL CONFIRMATION: Are you sure you want to permanently clear the ENTIRE Administrative Audit Trail? All historical security entries will be removed permanently.": "ಆಡಿಟ್ ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸುವ ದೃಢೀಕರಣ: ಸಂಪೂರ್ಣ ಆಡಳಿತಾತ್ಮಕ ಆಡಿಟ್ ಇತಿಹಾಸವನ್ನು ಶಾಶ್ವತವಾಗಿ ತೆರವುಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಎಲ್ಲಾ ಐತಿಹಾಸಿಕ ಭದ್ರತಾ ದಾಖಲೆಗಳು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲ್ಪಡುತ್ತವೆ.",
    "WARNING: Are you sure you want to clear the entire Administrative Status Management Audit Trail? This will purge all status change history logs permanently.": "ಎಚ್ಚರಿಕೆ: ಸಂಪೂರ್ಣ ಆಡಳಿತಾತ್ಮಕ ಸ್ಥಿತಿ ನಿರ್ವಹಣಾ ಆಡಿಟ್ ಇತಿಹಾಸವನ್ನು ತೆರವುಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಇದು ಎಲ್ಲಾ ಸ್ಥಿತಿ ಬದಲಾವಣೆ ಲಾಗ್‌ಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುತ್ತದೆ.",
    "Are you sure you want to reset Complaint Statuses to the official Gram Panchayat 8-stage schema? This will restore: Submitted, Assigned, Under Review, In Progress, Action Taken, Resolved, Rejected, Reopened.": "ದೂರು ಸ್ಥಿತಿಗಳನ್ನು ಅಧಿಕೃತ ಗ್ರಾಮ ಪಂಚಾಯತ್ 8-ಹಂತದ ಸ್ಕೀಮಾಗೆ ಮರುಹೊಂದಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?",
    "Are you sure you want to clear the entire Emergency Reset Audit History Ledger? All recorded audit entries will be permanently deleted.": "ಸಂಪೂರ್ಣ ತುರ್ತು ಮರುಹೊಂದಿಕೆ ಆಡಿಟ್ ಇತಿಹಾಸ ಲೆಡ್ಜರ್ ಅನ್ನು ತೆರವುಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಎಲ್ಲಾ ದಾಖಲಾದ ಆಡಿಟ್ ನಮೂದುಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗುತ್ತದೆ.",
    "Verified": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    "Pending": "ಬಾಕಿ ಇದೆ",
    "Active": "ಸಕ್ರಿಯ",
    "Inactive": "ನಿಷ್ಕ್ರಿಯ",
    "Error:": "ದೋಷ:",
    "Save Error:": "ಉಳಿಸುವ ದೋಷ:",
    "Delete Error:": "ಅಳಿಸುವ ದೋಷ:",
    "Restore Error:": "ಮರುಸ್ಥಾಪನೆ ದೋಷ:",
    "Archival Error:": "ಆರ್ಕೈವ್ ದೋಷ:",
    "Reset Failed:": "ಮರುಹೊಂದಿಕೆ ವಿಫಲವಾಗಿದೆ:",
    "Clear Error:": "ತೆರವುಗೊಳಿಸುವ ದೋಷ:",
    "Upload Failed:": "ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ:",
    "Delete Failed:": "ಅಳಿಸುವಿಕೆ ವಿಫಲವಾಗಿದೆ:",
    "Error saving complaint:": "ದೂರು ಉಳಿಸುವಲ್ಲಿ ದೋಷ:",
    "Error updating recipient:": "ಸ್ವೀಕರಿಸುವವರನ್ನು ನವೀಕರಿಸುವಲ್ಲಿ ದೋಷ:",
    "Error updating preferences:": "ಆದ್ಯತೆಗಳನ್ನು ನವೀಕರಿಸುವಲ್ಲಿ ದೋಷ:",
    "Failed to parse file:": "ಫೈಲ್ ಓದಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to save configuration:": "ಕಾನ್ಫಿಗರೇಶನ್ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to delete citizen:": "ನಾಗರಿಕರನ್ನು ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to delete receiver:": "ಸ್ವೀಕರಿಸುವವರನ್ನು ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to delete audit log:": "ಆಡಿಟ್ ಲಾಗ್ ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to clear audit trail:": "ಆಡಿಟ್ ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to delete backup snapshot:": "ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to clear email logs:": "ಇಮೇಲ್ ಲಾಗ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to delete log entry:": "ಲಾಗ್ ದಾಖಲೆ ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to update maintenance mode:": "ನಿರ್ವಹಣಾ ಮೋಡ್ ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to remove transition:": "ಪರಿವರ್ತನೆ ತೆಗೆದುಹಾಕಲು ವಿಫಲವಾಗಿದೆ:",
    "Failed to clear audit ledger:": "ಆಡಿಟ್ ಲೆಡ್ಜರ್ ತೆರವುಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ:",
    "Test email failed:": "ಪರೀಕ್ಷಾ ಇಮೇಲ್ ವಿಫಲವಾಗಿದೆ:",
    "Could not download backup:": "ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ:",
    "Restoration Failed:": "ಮರುಸ್ಥಾಪನೆ ವಿಫಲವಾಗಿದೆ:",
    "Backup Failed:": "ಬ್ಯಾಕಪ್ ವಿಫಲವಾಗಿದೆ:",
    "Back": "ಹಿಂದೆ",
    "Overdue (>7 Days)": "ವಿಳಂಬವಾಗಿದೆ (>7 ದಿನಗಳು)",
    "0 KB": "0 KB",
    "Super Admin": "ಸೂಪರ್ ಆಡಳಿತಾಧಿಕಾರಿ",
    "All settings are stored in": "ಎಲ್ಲಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು",
    "AI Assistant Ops": "AI ಸಹಾಯಕ ನಿರ್ವಹಣೆ",
    "AI Assistant Configuration & Analytics": "AI ಸಹಾಯಕ ಕಾನ್ಫಿಗರೇಶನ್ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ",
    "Inspect live server AI provider status, citizen feedback metrics, reported incorrect answers, and approved runtime guardrails.": "ಲೈವ್ ಸರ್ವರ್ AI ಪೂರೈಕೆದಾರರ ಸ್ಥಿತಿ, ನಾಗರಿಕರ ಪ್ರತಿಕ್ರಿಯೆ ಅಂಕಿಅಂಶಗಳು, ವರದಿಯಾದ ತಪ್ಪು ಉತ್ತರಗಳು ಮತ್ತು ಅನುಮೋದಿತ ಮಿತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "AI PROVIDER STATUS": "AI ಪೂರೈಕೆದಾರರ ಸ್ಥಿತಿ",
    "HELPFUL FEEDBACK": "ಉಪಯುಕ್ತ ಪ್ರತಿಕ್ರಿಯೆ",
    "NOT HELPFUL": "ಉಪಯುಕ್ತವಲ್ಲ",
    "REPORTED INCORRECT": "ತಪ್ಪು ವರದಿಗಳು",
    "Approved Assistant Guardrail Configuration (No Secrets Stored Here)": "ಅನುಮೋದಿತ ಸಹಾಯಕ ಕಾನ್ಫಿಗರೇಶನ್ (ಇಲ್ಲಿ ರಹಸ್ಯ ಕೀಗಳನ್ನು ಸಂಗ್ರಹಿಸಲಾಗುವುದಿಲ್ಲ)",
    "Reported Incorrect Assistant Responses": "ವರದಿಯಾದ ತಪ್ಪು ಸಹಾಯಕ ಉತ್ತರಗಳು",
    "Access Denied: AI Assistant Operations are restricted to Administrators only.": "ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ: AI ಸಹಾಯಕ ಕಾರ್ಯಾಚರಣೆಗಳು ಆಡಳಿತಾಧಿಕಾರಿಗಳಿಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿವೆ.",
    "Knowledge Centre": "ಜ್ಞಾನ ಕೇಂದ್ರ",
    "IP Chat": "IP ಚಾಟ್",
    "IP Chat – External Messaging Service": "IP ಚಾಟ್ – ಬಾಹ್ಯ ಸಂದೇಶ ಸೇವೆ",
    "AI Knowledge Centre": "AI ಜ್ಞಾನ ಕೇಂದ್ರ",
    "AI KNOWLEDGE CENTRE": "AI ಜ್ಞಾನ ಕೇಂದ್ರ",
    "AI Knowledge Centre – JANASEVA Portal": "AI ಜ್ಞಾನ ಕೇಂದ್ರ – ಜನಸೇವಾ ಪೋರ್ಟಲ್",
    "Contribute civic guides, circulars, schemes, and multilingual documents directly to the community RAG knowledge base. Safe documents become searchable in JANASEVA AI automatically.": "ನಾಗರಿಕ ಮಾರ್ಗದರ್ಶಿಗಳು, ಸುತ್ತೋಲೆಗಳು, ಯೋಜನೆಗಳು ಮತ್ತು ಬಹುಭಾಷಾ ದಾಖಲೆಗಳನ್ನು ಸಮುದಾಯ RAG ಜ್ಞಾನ ಕೋಶಕ್ಕೆ ನೇರವಾಗಿ ಕೊಡುಗೆ ನೀಡಿ. ಸುರಕ್ಷಿತ ದಾಖಲೆಗಳು ತಾನಾಗಿಯೇ JANASEVA AI ನಲ್ಲಿ ಹುಡುಕಲು ಲಭ್ಯವಾಗುತ್ತವೆ.",
    "Indexed Documents": "ಸೂಚ್ಯಂಕಿತ ದಾಖಲೆಗಳು",
    "Knowledge Chunks": "ಜ್ಞಾನ ಭಾಗಗಳು",
    "Contributors": "ಕೊಡುಗೆದಾರರು",
    "Multilingual RAG": "ಬಹುಭಾಷಾ RAG",
    "Contribute Knowledge Documents": "ಜ್ಞಾನ ದಾಖಲೆಗಳನ್ನು ಕೊಡುಗೆ ನೀಡಿ",
    "Open public contribution — no admin approval queue required. Security scan, text extraction, language detection, and AI indexing run automatically.": "ಮುಕ್ತ ಸಾರ್ವಜನಿಕ ಕೊಡುಗೆ — ಆಡಳಿತಾಧಿಕಾರಿ ಅನುಮೋದನೆ ಅಗತ್ಯವಿಲ್ಲ. ಭದ್ರತಾ ಸ್ಕ್ಯಾನ್, ಪಠ್ಯ ಹೊರತೆಗೆಯುವಿಕೆ, ಭಾಷೆ ಪತ್ತೆ ಮತ್ತು AI ಸೂಚ್ಯಂಕೀಕರಣ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ನಡೆಯುತ್ತವೆ.",
    "Ask AI Chat": "AI ಚಾಟ್ ಕೇಳಿ",
    "Contributor Name (Optional)": "ಕೊಡುಗೆದಾರರ ಹೆಸರು (ಐಚ್ಛಿಕ)",
    "Topic / Category Hint": "ವಿಷಯ / ವರ್ಗ ಸೂಚನೆ",
    "Auto-Detect (Recommended)": "ಸ್ವಯಂ ಪತ್ತೆ (ಶಿಫಾರಸು)",
    "Update Existing Document (Optional)": "ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ದಾಖಲೆಯನ್ನು ನವೀಕರಿಸಿ (ಐಚ್ಛಿಕ)",
    "Upload as New Document": "ಹೊಸ ದಾಖಲೆಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "Drag & Drop Files or Folders Here": "ಫೈಲ್‌ಗಳು ಅಥವಾ ಫೋಲ್ಡರ್‌ಗಳನ್ನು ಇಲ್ಲಿ ಎಳೆದು ಬಿಡಿ",
    "Select Files": "ಫೈಲ್‌ಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "Upload Folder": "ಫೋಲ್ಡರ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    "Upload & Scanning Pipeline": "ಅಪ್‌ಲೋಡ್ ಮತ್ತು ಸ್ಕ್ಯಾನಿಂಗ್ ಪೈಪ್‌ಲೈನ್",
    "Clear Finished": "ಪೂರ್ಣಗೊಂಡವುಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ",
    "Search Community Knowledge Base": "ಸಮುದಾಯ ಜ್ಞಾನ ಕೋಶವನ್ನು ಹುಡುಕಿ",
    "Browse indexed documents across Kannada, English, and Hindi.": "ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಹಿಂದಿ ಭಾಷೆಗಳಲ್ಲಿನ ಸೂಚ್ಯಂಕಿತ ದಾಖಲೆಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ.",
    "All Languages": "ಎಲ್ಲಾ ಭಾಷೆಗಳು",
    "All Source Types": "ಎಲ್ಲಾ ಮೂಲ ಪ್ರಕಾರಗಳು",
    "Official Source": "ಅಧಿಕೃತ ಮೂಲ",
    "Verified API Import": "ಪರಿಶೀಲಿತ API ಆಮದು",
    "Community-Contributed": "ಸಮುದಾಯ-ಕೊಡುಗೆ",
    "Recent Upload History": "ಇತ್ತೀಚಿನ ಅಪ್‌ಲೋಡ್ ಇತಿಹಾಸ",
    "Real-time status of recent community submissions, duplicates, and failed uploads.": "ಇತ್ತೀಚಿನ ಸಮುದಾಯ ಸಲ್ಲಿಕೆಗಳು, ನಕಲುಗಳು ಮತ್ತು ವಿಫಲ ಅಪ್‌ಲೋಡ್‌ಗಳ ನೈಜ-ಸಮಯದ ಸ್ಥಿತಿ.",
    "Document Details": "ದಾಖಲೆ ವಿವರಗಳು",
    "Extracted Content (Original Language Preserved)": "ಹೊರತೆಗೆದ ವಿಷಯ (ಮೂಲ ಭಾಷೆ ಸಂರಕ್ಷಿಸಲಾಗಿದೆ)",
    "Download Original": "ಮೂಲವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "Download Text": "ಪಠ್ಯವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    "Ask AI About This": "ಇದರ ಬಗ್ಗೆ AI ಗೆ ಕೇಳಿ",
    "Community knowledge collection oversight, document inspection, security quarantine, Receiver API settings, backup & RAG testing.": "ಸಮುದಾಯ ಜ್ಞಾನ ಸಂಗ್ರಹ ಮೇಲ್ವಿಚಾರಣೆ, ದಾಖಲೆ ಪರಿಶೀಲನೆ, ಭದ್ರತಾ ಕ್ವಾರಂಟೈನ್, ರಿಸೀವರ್ API ಸೆಟ್ಟಿಂಗ್‌ಗಳು, ಬ್ಯಾಕಪ್ ಮತ್ತು RAG ಪರೀಕ್ಷೆ.",
    "Saved": "ಉಳಿಸಲಾಗಿದೆ",
    "Unsaved Changes": "ಉಳಿಸದ ಬದಲಾವಣೆಗಳು",
    "Resetting...": "ಮರುಹೊಂದಿಸಲಾಗುತ್ತಿದೆ...",
    "Refreshing...": "ರಿಫ್ರೆಶ್ ಆಗುತ್ತಿದೆ...",
    "Sync Error": "ಸಿಂಕ್ ದೋಷ",
    "Synced": "ಸಿಂಕ್ ಆಗಿದೆ",
    "Reset to Defaults": "ಡೀಫಾಲ್ಟ್‌ಗಳಿಗೆ ಮರುಹೊಂದಿಸಿ",
    "Reset to Default": "ಡೀಫಾಲ್ಟ್‌ಗೆ ಮರುಹೊಂದಿಸಿ",
    "Refresh Profile": "ಪ್ರೊಫೈಲ್ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "Refresh Status": "ಸ್ಥಿತಿ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "Refresh Authorization Info": "ದೃಢೀಕರಣ ಮಾಹಿತಿ ರಿಫ್ರೆಶ್ ಮಾಡಿ",
    "Validate Config": "ವಿನ್ಯಾಸ ಪರಿಶೀಲಿಸಿ",
    "Save Profile": "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ",
    "Save Recipient Address": "ಸ್ವೀಕೃತಿದಾರರ ವಿಳಾಸ ಉಳಿಸಿ",
    "Save Maintenance Settings": "ನಿರ್ವಹಣೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ",
    "Reset to Normal Operational": "ಸಾಮಾನ್ಯ ಕಾರ್ಯಾಚರಣೆಗೆ ಮರುಹೊಂದಿಸಿ",
    "Enable Portal Maintenance Mode (Pause Citizen Submissions)": "ಪೋರ್ಟಲ್ ನಿರ್ವಹಣೆ ಮೋಡ್ ಸಕ್ರಿಯಗೊಳಿಸಿ (ನಾಗರಿಕ ಸಲ್ಲಿಕೆಗಳನ್ನು ವಿರಾಮಗೊಳಿಸಿ)",
    "Public Citizen Maintenance Notice": "ಸಾರ್ವಜನಿಕ ನಾಗರಿಕ ನಿರ್ವಹಣೆ ಸೂಚನೆ",
    "Portal Maintenance Mode Settings:": "ಪೋರ್ಟಲ್ ನಿರ್ವಹಣೆ ಮೋಡ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು:",
    "Profile & Preferences": "ಪ್ರೊಫೈಲ್ ಮತ್ತು ಆದ್ಯತೆಗಳು",
    "My Profile Settings": "ನನ್ನ ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "Portal Language & Display Preferences": "ಪೋರ್ಟಲ್ ಭಾಷೆ ಮತ್ತು ಪ್ರದರ್ಶನ ಆದ್ಯತೆಗಳು",
    "Manage your verified citizen name, contact phone, and home Gram Panchayat.": "ನಿಮ್ಮ ಪರಿಶೀಲಿಸಿದ ನಾಗರಿಕ ಹೆಸರು, ಸಂಪರ್ಕ ಫೋನ್ ಮತ್ತು ಗ್ರಾಮ ಪಂಚಾಯಿತಿಯನ್ನು ನಿರ್ವಹಿಸಿ.",
    "Customize preferred portal language and dashboard view preferences.": "ಆದ್ಯತೆಯ ಪೋರ್ಟಲ್ ಭಾಷೆ ಮತ್ತು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವೀಕ್ಷಣೆ ಆದ್ಯತೆಗಳನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡಿ.",
    "Preferred Portal Language": "ಆದ್ಯತೆಯ ಪೋರ್ಟಲ್ ಭಾಷೆ",
    "Auto-Expand Timeline Updates": "ಟೈಮ್‌ಲೈನ್ ನವೀಕರಣಗಳನ್ನು ಸ್ವಯಂ-ವಿಸ್ತರಿಸಿ",
    "Show the newest grievance timeline milestones expanded inside detail popups.": "ವಿವರ ಪಾಪ್‌ಅಪ್‌ಗಳಲ್ಲಿ ಇತ್ತೀಚಿನ ದೂರು ಟೈಮ್‌ಲೈನ್ ಮೈಲಿಗಲ್ಲುಗಳನ್ನು ವಿಸ್ತರಿಸಿ ತೋರಿಸಿ.",
    "Email Status Alerts Opt-In": "ಇಮೇಲ್ ಸ್ಥಿತಿ ಎಚ್ಚರಿಕೆಗಳ ಆಯ್ಕೆ",
    "Receive email acknowledgments and official resolution summaries for your complaints.": "ನಿಮ್ಮ ದೂರುಗಳಿಗಾಗಿ ಇಮೇಲ್ ರಸೀದಿಗಳು ಮತ್ತು ಅಧಿಕೃತ ಪರಿಹಾರ ಸಾರಾಂಶಗಳನ್ನು ಪಡೆಯಿರಿ.",
    "Compact List Density": "ಸಂಕ್ಷಿಪ್ತ ಪಟ್ಟಿ ಸಾಂದ್ರತೆ",
    "Use denser spacing in complaint summary tables.": "ದೂರು ಸಾರಾಂಶ ಕೋಷ್ಟಕಗಳಲ್ಲಿ ಕಡಿಮೆ ಅಂತರವನ್ನು ಬಳಸಿ.",
    "Save Preferences": "ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಿ",
    "Read-Only System Policy": "ಓದಲು-ಮಾತ್ರ ಸಿಸ್ಟಮ್ ನೀತಿ",
    "Authorized Officer Name": "ಅಧಿಕೃತ ಅಧಿಕಾರಿಯ ಹೆಸರು",
    "Contact Phone Number": "ಸಂಪರ್ಕ ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    "Assigned Gram Panchayat / Hub": "ನಿಯೋಜಿತ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ / ಕೇಂದ್ರ",
    "Reset Form": "ಫಾರ್ಮ್ ಮರುಹೊಂದಿಸಿ",
    "Refresh": "ರಿಫ್ರೆಶ್",
    "Save Configuration": "ವಿನ್ಯಾಸವನ್ನು ಉಳಿಸಿ",
    "Save Notification Preferences": "ಅಧಿಸೂಚನೆ ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಿ",
    "Save Receiver Config": "ರಿಸೀವರ್ ಕಾನ್ಫಿಗ್ ಉಳಿಸಿ",
    "Delete / Reset Default": "ಅಳಿಸಿ / ಡೀಫಾಲ್ಟ್ ಮರುಹೊಂದಿಸಿ"
  },
  hi: {
    "& credentials": "और क्रेडेंशियल",
    "& logins": "और लॉगिन",
    "(action taken)": "(कार्रवाई की गई)",
    "(jpg/png/webp, up to 5 mb)": "(JPG/PNG/WEBP, 5 MB तक)",
    ") is strictly preserved across all modes.": ") सभी मोड में सख्ती से सुरक्षित रहता है।",
    ") UNTOUCHABLE": ") अपरिवर्तनीय",
    "-- Choose Quick Response Template (Optional) --": "-- त्वरित प्रतिक्रिया टेम्पलेट चुनें (वैकल्पिक) --",
    "-- Keep Current Assignment --": "-- वर्तमान आवंटन बनाए रखें --",
    "-- select category --": "-- श्रेणी चुनें --",
    "-- select gram panchayat --": "-- ग्राम पंचायत चुनें --",
    "-- select issue category --": "-- समस्या श्रेणी चुनें --",
    "-- Select Standard Rejection Reason --": "-- मानक अस्वीकृति कारण चुनें --",
    "0 Citizens": "0 नागरिक",
    "0 Deleted Grievances": "0 हटाई गई शिकायतें",
    "0 Events": "0 घटनाएँ",
    "0 Grievances": "0 शिकायतें",
    "0 Grievances Found": "0 शिकायतें मिलीं",
    "0 grievances selected": "0 शिकायतें चयनित",
    "0 KB • Verified format": "0 KB • सत्यापित फ़ॉर्मेट",
    "0 Quarantined Records": "0 क्वारंटाइन रिकॉर्ड",
    "0 Records": "0 रिकॉर्ड",
    "0 Updates Found": "0 अपडेट मिले",
    "0% Initiation": "0% प्रारंभ",
    "0% Not Started": "0% शुरू नहीं हुआ",
    "0% – Not Started": "0% – शुरू नहीं हुआ",
    "07 Nov 2026, 10:24 AM": "07 नवंबर 2026, पूर्वाह्न 10:24",
    "1. New Complaints": "1. नई शिकायतें",
    "1. Security Validation": "1. सुरक्षा सत्यापन",
    "100% Completed": "100% पूर्ण",
    "100% Full Resolution": "100% पूर्ण समाधान",
    "100% – Completed and Verified": "100% – पूर्ण एवं सत्यापित",
    "10–25% – Initial Inspection": "10–25% – प्रारंभिक निरीक्षण",
    "2. Maintenance Active": "2. रखरखाव सक्रिय",
    "2. Received Complaints": "2. प्राप्त शिकायतें",
    "25% Inspection": "25% निरीक्षण",
    "256-bit ssl encrypted": "256-बिट एसएसएल एन्क्रिप्टेड",
    "26–50% – Work Started": "26–50% – कार्य शुरू",
    "3. Cryptographic Backup": "3. क्रिप्टोग्राफ़िक बैकअप",
    "3. In Progress": "3. प्रगति पर",
    "4. Complaints Purge": "4. शिकायत शुद्धि",
    "4. Pending Complaints": "4. लंबित शिकायतें",
    "5. Delivery Logs Flush": "5. डिलीवरी लॉग शुद्धि",
    "5. Resolved Complaints": "5. हल की गई शिकायतें",
    "50% Work Started": "50% कार्य शुरू",
    "51–75% – Work in Progress": "51–75% – कार्य प्रगति पर",
    "6. Account Registry": "6. खाता रजिस्ट्री",
    "6. Rejected Complaints": "6. अस्वीकृत शिकायतें",
    "7 Emergency Security Checkpoints Verification Protocol": "7 आपातकालीन सुरक्षा जाँच चरण सत्यापन प्रोटोकॉल",
    "7-CHECKPOINT GUARDED": "7-चरणीय सुरक्षित",
    "7-CHECKPOINT PROTOCOL": "7-चरणीय जाँच प्रोटोकॉल",
    "7. Local & IndexedDB": "7. स्थानीय एवं IndexedDB",
    "7. Reopened Complaints": "7. पुनः खोली गई शिकायतें",
    "75% In Progress": "75% प्रगति पर",
    "76–99% – Final Stage": "76–99% – अंतिम चरण",
    "8 Statuses Configured": "8 स्थितियाँ कॉन्फ़िगर की गईं",
    "8. Archived Complaints": "8. संग्रहीत शिकायतें",
    "8. Archived Records": "8. संग्रहीत रिकॉर्ड",
    "8. Verification & Resume": "8. सत्यापन और पुनः प्रारंभ",
    "[JANASEVA RESET ENGINE INITIALIZED]": "[जनसेवा रीसेट इंजन प्रारंभ]",
    "A complete snapshot backup is mandatory prior to deleting any record. Verifying SHA-256 cryptographic checksum.": "किसी भी रिकॉर्ड को हटाने से पहले पूर्ण स्नैपशॉट बैकअप अनिवार्य है। SHA-256 चेकसम सत्यापित हो रहा है।",
    "a digital platform to connect citizens with their gram panchayat for quick and transparent grievance redressal": "त्वरित और पारदर्शी शिकायत निवारण के लिए नागरिकों को उनकी ग्राम पंचायत से जोड़ने वाला डिजिटल मंच।",
    "a digital platform to connect citizens with their gram panchayat for quick and transparent grievance redressal.": "त्वरित और पारदर्शी शिकायत निवारण के लिए नागरिकों को उनकी ग्राम पंचायत से जोड़ने वाला डिजिटल मंच।",
    "a direct link to your": "आपकी ग्राम पंचायत से",
    "a direct link to your gram panchayat": "आपकी ग्राम पंचायत से सीधा संपर्क",
    "about": "हमारे बारे में",
    "about janaseva": "जनसेवा के बारे में",
    "about janaseva – gram panchayat grievance portal": "जनसेवा – ग्राम पंचायत शिकायत निवारण पोर्टल के बारे में",
    "About Portal": "पोर्टल के बारे में",
    "about the portal": "पोर्टल के बारे में",
    "academic project": "शैक्षणिक परियोजना",
    "Accept and attach this photograph": "यह फ़ोटो स्वीकार करें और संलग्न करें",
    "Accidental Data Loss Protection Active:": "आकस्मिक डेटा हानि सुरक्षा सक्रिय:",
    "Acknowledge Impact & Create Backup →": "प्रभाव स्वीकार करें और बैकअप बनाएं →",
    "Acknowledgement Slip": "पावती पर्ची",
    "action": "कार्रवाई",
    "Action Initiated: Remediation work authorized and staff deployed": "कार्रवाई शुरू: उपचारात्मक कार्य अधिकृत और कर्मचारी तैनात",
    "Action Taken": "कार्रवाई की गई",
    "action taken": "कार्रवाई की गई",
    "Action Taken (Remediation Executed)": "कार्रवाई की गई (उपचार निष्पादित)",
    "Action Taken: Corrective action executed on site": "कार्रवाई की गई: मौके पर सुधारात्मक कार्रवाई पूरी की गई",
    "actions": "कार्रवाई",
    "Activate Maintenance Mode": "रखरखाव मोड सक्रिय करें",
    "ACTIVE": "सक्रिय",
    "Active (Processing)": "सक्रिय (प्रक्रियाधीन)",
    "Active and archived workflow stages dynamically reflected on Citizen Tracking, Receiver Dashboard, and Citizen Dashboard.": "नागरिक ट्रैकिंग, प्राप्तकर्ता डैशबोर्ड और नागरिक डैशबोर्ड पर दिखने वाले सक्रिय और संग्रहीत कार्यप्रवाह चरण।",
    "Active Complaints": "सक्रिय शिकायतें",
    "active delivery engine": "सक्रिय वितरण इंजन",
    "Active Processing": "सक्रिय प्रक्रिया",
    "Active remediation": "सक्रिय समाधान कार्य",
    "Active remediation underway": "सक्रिय सुधार कार्य जारी",
    "Active Work": "सक्रिय कार्य",
    "add a service (gmail) and copy the service id": "एक सर्विस (Gmail) जोड़ें और सर्विस आईडी कॉपी करें।",
    "add a service (gmail) and copy the service id.": "एक सर्विस (Gmail) जोड़ें और सर्विस आईडी कॉपी करें।",
    "add announcement, public meeting dates, or special village notices here": "घोषणा, सार्वजनिक बैठक की तारीखें या विशेष ग्राम सूचनाएं यहां जोड़ें",
    "add announcement, public meeting dates, or special village notices here...": "घोषणा, सार्वजनिक बैठक की तारीखें या विशेष ग्राम सूचनाएं यहां जोड़ें...",
    "Add Banner Image": "बैनर छवि जोड़ें",
    "Add Image": "छवि जोड़ें",
    "Add New Complaint Status": "नई शिकायत स्थिति जोड़ें",
    "add new gram panchayat": "नई ग्राम पंचायत जोड़ें",
    "add new panchayat": "नई पंचायत जोड़ें",
    "Add New Status": "नई स्थिति जोड़ें",
    "add official note": "आधिकारिक टिप्पणी जोड़ें",
    "admin": "व्यवस्थापक",
    "Admin & Official Control Centre – JANASEVA Portal": "प्रशासन एवं आधिकारिक नियंत्रण केंद्र – जनसेवा पोर्टल",
    "Admin Actor": "प्रशासन कर्ता",
    "Admin Banner Image Management": "प्रशासन बैनर छवि प्रबंधन",
    "ADMIN CONTROL": "प्रशासन नियंत्रण",
    "Admin Control Centre": "प्रशासनिक नियंत्रण केंद्र",
    "Admin Dashboard": "प्रशासन डैशबोर्ड",
    "ADMIN PRIVILEGED ONLY": "केवल प्रशासक के लिए",
    "Administrative Audit Logs": "प्रशासनिक ऑडिट लॉग",
    "Administrative Audit Trail": "प्रशासनिक ऑडिट ट्रेल",
    "Administrative Change Justification *": "प्रशासनिक परिवर्तन औचित्य *",
    "Administrative Status Management Audit Log": "प्रशासनिक स्थिति प्रबंधन ऑडिट लॉग",
    "administrator": "व्यवस्थापक",
    "Administrator account": "प्रशासक खाता",
    "Administrator account": "प्रशासक खाता ()",
    "Administrator Account:": "प्रशासक खाता:",
    "AI": "एआई",
    "AI ANALYTICS": "एआई विश्लेषण",
    "AI Intelligence": "एआई इंटेलिजेंस",
    "AI Prioritized Grievances Register": "एआई प्राथमिकता प्राप्त शिकायत रजिस्टर",
    "AI Priority": "एआई प्राथमिकता",
    "AI Rationale": "एआई तर्क / कारण",
    "AI Supporting Document Verification": "एआई सहायक दस्तावेज सत्यापन",
    "AI Supporting Document Verification (Optional: Land Records / RTC, ID, Bills)": "एआई सहायक दस्तावेज़ सत्यापन (वैकल्पिक: भूमि रिकॉर्ड / आरटीसी, पहचान पत्र, बिल)",
    "AI Voice": "वॉयस सहायक",
    "AI-directed automated routing across civic line departments.": "नागरिक लाइन विभागों में एआई-निर्देशित स्वचालित रूटिंग।",
    "Alerts": "अलर्ट",
    "all": "सभी",
    "All 6 preliminary security checkpoints have been satisfied. When you click below, the system will enter maintenance mode, batch purge operational documents in 500-item chunks, and issue an immutable audit record.": "सभी 6 प्रारंभिक सुरक्षा चरण पूरे हो चुके हैं। नीचे क्लिक करने पर सिस्टम रखरखाव मोड में आकर दस्तावेज़ साफ़ करेगा और स्थायी ऑडिट रिकॉर्ड जारी करेगा।",
    "All 6/8-stage status progression histories": "सभी 6/8-चरणीय स्थिति प्रगति इतिहास",
    "all blocks / taluks": "सभी ब्लॉक / तालुका",
    "All Categories": "सभी श्रेणियाँ",
    "All citizen accounts and delivery logs": "सभी नागरिक खाते और डिलीवरी लॉग",
    "All citizen complaints and attachments": "सभी नागरिक शिकायतें और संलग्नक",
    "All citizen complaints and tracking IDs": "सभी नागरिक शिकायतें और ट्रैकिंग आईडी",
    "All citizen user accounts & profiles": "सभी नागरिक उपयोगकर्ता खाते और प्रोफ़ाइल",
    "All citizen, receiver, and admin profiles": "सभी नागरिक, प्राप्तकर्ता और प्रशासक प्रोफ़ाइल",
    "All complaint records, citizen details, photographic evidence, and chronological audit entries will be permanently expunged from Cloud Firestore and local storage.": "सभी शिकायत रिकॉर्ड, नागरिक विवरण, फ़ोटो साक्ष्य और ऑडिट प्रविष्टियाँ स्थायी रूप से हटा दी जाएंगी।",
    "All complaints, subcollections & review notes": "सभी शिकायतें, उप-संग्रह और समीक्षा टिप्पणियाँ",
    "All delivery logs (Email & WhatsApp logs)": "सभी डिलीवरी लॉग (ईमेल और व्हाट्सएप)",
    "all districts": "सभी जिले",
    "All Folders": "सभी फ़ोल्डर",
    "All Gram Panchayat Receiver profiles": "सभी ग्राम पंचायत प्राप्तकर्ता प्रोफ़ाइल",
    "All Gram Panchayats": "सभी ग्राम पंचायतें",
    "all gram panchayats (configurable)": "सभी ग्राम पंचायतें (कॉन्फ़िगर करने योग्य)",
    "all gram panchayats (hub)": "सभी ग्राम पंचायतें (हब)",
    "all grievances": "सभी शिकायतें",
    "All offline submission queues and cached complaints": "सभी ऑफ़लाइन सबमिशन कतारें और कैश शिकायतें",
    "All Panchayats": "सभी पंचायतें",
    "all rights reserved": "सर्वाधिकार सुरक्षित",
    "all settings are stored in": "सभी सेटिंग्स संग्रहीत हैं",
    "all statuses": "सभी स्थितियां",
    "All Statuses": "सभी स्थितियाँ",
    "All subcollections (status history, reviews, remarks)": "सभी उप-संग्रह (स्थिति इतिहास, समीक्षाएं, टिप्पणियाँ)",
    "all subsequent citizen complaints submitted across the portal will be dispatched to the new address immediately.": "पोर्टल पर दर्ज की जाने वाली अगली सभी नागरिक शिकायतें तुरंत नए पते पर भेजी जाएंगी।",
    "All Updates": "सभी अपडेट",
    "Allocated to designated Panchayat grievance officer.": "नामित पंचायत शिकायत अधिकारी को आवंटित किया गया।",
    "Allowed Next Statuses": "अनुमत अगली स्थितियाँ",
    "Allowed Next Workflow Transitions & Permission Gates": "अनुमत अगले कार्यप्रवाह परिवर्तन एवं अनुमतियाँ",
    "Allowed Transitions & Permission Gates Matrix": "अनुमत परिवर्तन एवं अनुमति मैट्रिक्स",
    "already have an account": "पहले से खाता है",
    "already have an account?": "पहले से खाता है?",
    "an official notification email has been dispatched to the concerned panchayat receiver. you can track live progress at any time": "संबंधित पंचायत अधिकारी को आधिकारिक ईमेल भेज दिया गया है। आप किसी भी समय स्थिति ट्रैक कर सकते हैं।",
    "an official notification email has been dispatched to the concerned panchayat receiver. you can track live progress at any time.": "संबंधित पंचायत अधिकारी को आधिकारिक ईमेल भेज दिया गया है। आप किसी भी समय स्थिति ट्रैक कर सकते हैं।",
    "Approve Document": "दस्तावेज स्वीकृत करें",
    "Archived grievances removed from your active dashboard.": "आपके सक्रिय डैशबोर्ड से हटाई गई संग्रहीत शिकायतें।",
    "are you sure you want to change the primary grievance forwarding email address?": "क्या आप वाकई प्राथमिक शिकायत अग्रेषण ईमेल पता बदलना चाहते हैं?",
    "are you sure you want to delete": "क्या आप निश्चित रूप से हटाना चाहते हैं",
    "Are you sure you want to permanently delete this complaint? This action cannot be undone.": "क्या आप वाकई इस शिकायत को स्थायी रूप से हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
    "Arm Execution Trigger →": "निष्पादन ट्रिगर तैयार करें →",
    "Assigned": "आवंटित",
    "Assigned & reviewed": "सौंपी और जांची गईं",
    "Assigned (Designated to Receiver)": "आवंटित (प्राप्तकर्ता को निर्दिष्ट)",
    "Assigned Department": "आवंटित विभाग",
    "assigned grievances": "आवंटित शिकायतें",
    "assigned panchayat": "आवंटित पंचायत",
    "Assigned Receiver": "आवंटित प्राप्तकर्ता",
    "Atomically restores grievances, users, and audit records": "शिकायतों, उपयोगकर्ताओं और ऑडिट रिकॉर्ड को एक साथ पुनर्स्थापित करता है",
    "attach circular / document file (pdf, word, image, text)": "परिपत्र / दस्तावेज फाइल संलग्न करें (PDF, Word, इमेज, टेक्स्ट)",
    "attached circular / document": "संलग्न परिपत्र / दस्तावेज",
    "attached circular / document:": "संलग्न परिपत्र / दस्तावेज:",
    "Attached Evidence Photograph:": "संलग्न साक्ष्य फोटोग्राफ:",
    "attached photograph of issue": "समस्या का संलग्न फोटो",
    "attached photograph of issue:": "समस्या का संलग्न फोटो:",
    "Auditable log history of all municipal emergency data reset and recovery operations stored in": "सभी आपातकालीन डेटा रीसेट और रिकवरी कार्यों का ऑडिट इतिहास यहाँ संग्रहीत है:",
    "Authenticate Password →": "पासवर्ड प्रमाणित करें →",
    "Authoritative administrative centre for operational grievance purge, complete factory reset, cryptographic snapshot creation, disaster recovery, and portal maintenance mode.": "परिचालन शिकायत शुद्धि, पूर्ण फ़ैक्टरी रीसेट, क्रिप्टोग्राफ़िक स्नैपशॉट निर्माण, आपदा रिकवरी और पोर्टल रखरखाव मोड के लिए आधिकारिक केंद्र।",
    "Authoritative grievance lifecycle stages, allowed transitions, role permissions, mandatory evidence & remarks, and notification triggers.": "आधिकारिक शिकायत जीवनचक्र चरण, अनुमत परिवर्तन, भूमिका अनुमतियाँ, अनिवार्य साक्ष्य, टिप्पणियाँ और सूचना ट्रिगर।",
    "authorized & active": "अधिकृत और सक्रिय",
    "Authorized Access:": "अधिकृत पहुंच:",
    "Automatic Cryptographic Pre-Reset Snapshot created in Checkpoint 3.": "चरण 3 में स्वचालित क्रिप्टोग्राफ़िक प्री-रीसेट स्नैपशॉट बनाया जाएगा।",
    "Avg Resolution Time": "औसत समाधान समय",
    "awaiting action": "कार्रवाई की प्रतीक्षा में",
    "Awaiting field action": "क्षेत्रीय कार्रवाई की प्रतीक्षा में",
    "Awaiting initial assessment by receiver.": "प्राप्तकर्ता द्वारा प्रारंभिक मूल्यांकन की प्रतीक्षा है।",
    "Back to Admin Dashboard": "प्रशासन डैशबोर्ड पर वापस जाएं",
    "back to login": "लॉगिन पर वापस जाएं",
    "backend smtp transmission is secured inside cloud functions.": "बैकएंड एसएमटीपी ट्रांसमिशन क्लाउड फंक्शन्स के अंदर सुरक्षित है।",
    "Background Color": "पृष्ठभूमि रंग",
    "Backup": "बैकअप",
    "Backup & Disaster Recovery Operations": "बैकअप और आपदा पुनर्प्राप्ति संचालन",
    "Backup Engine": "बैकअप इंजन",
    "Backup Hash": "बैकअप हैश",
    "Backup ID": "बैकअप आईडी",
    "Backup Identifier:": "बैकअप पहचानकर्ता:",
    "Backup Verified • Proceed to Re-Auth →": "बैकअप सत्यापित • पुनः प्रमाणीकरण पर जाएं →",
    "Badge & Visual Style": "बैज और दृश्य शैली",
    "Badge Color Styling": "बैज रंग शैली",
    "Bajpe": "बजपे",
    "Bajpe Gram Panchayat": "बजपे ग्राम पंचायत",
    "Banner Image": "बैनर छवि",
    "bantwal": "बंटवाल",
    "bantwal rural gram panchayat": "बंटवाल ग्रामीण ग्राम पंचायत",
    "below:": "नीचे:",
    "belthangady": "बेलथंगडी",
    "belthangady gram panchayat": "बेलथंगडी ग्राम पंचायत",
    "bethoddy gp": "बेथोडी ग्रा.पं",
    "bethoddy gram panchayat": "बेथोडी ग्राम पंचायत",
    "bethody gp": "बेथोडी ग्रा.पं",
    "bethody gram panchayat": "बेथोडी ग्राम पंचायत",
    "Bethody Panchayat Officer": "बेथोडी पंचायत अधिकारी",
    "block / taluk": "ब्लॉक / तालुका",
    "Border Color": "बॉर्डर रंग",
    "brahmavar gram panchayat": "ब्रह्मावर ग्राम पंचायत",
    "Brief explanation displayed in tracking status indicators and citizen portal...": "ट्रैकिंग स्थिति संकेतकों और नागरिक पोर्टल में प्रदर्शित संक्षिप्त विवरण...",
    "Browse from computer or mobile (Max 10MB)": "कंप्यूटर या मोबाइल से चुनें (अधिकतम 10MB)",
    "by complaint id": "शिकायत आईडी द्वारा",
    "by email": "ईमेल द्वारा",
    "Cached Complaints": "कैश की गई शिकायतें",
    "Calculating resolution rate...": "समाधान दर की गणना हो रही है...",
    "camera unavailable": "कैमरा उपलब्ध नहीं है",
    "cancel": "रद्द करें",
    "Cancel & Keep Quarantined": "रद्द करें और क्वारंटाइन में रखें",
    "Cancel and Close": "रद्द करें और बंद करें",
    "capture a live photograph using your device camera": "अपने डिवाइस कैमरे से लाइव फ़ोटो खींचें",
    "capture photo": "फ़ोटो खींचें",
    "Capture Photograph": "फ़ोटो खींचें",
    "category": "श्रेणी",
    "CATEGORY A": "श्रेणी A",
    "CATEGORY B": "श्रेणी B",
    "CATEGORY C": "श्रेणी C",
    "CATEGORY D": "श्रेणी D",
    "CATEGORY E": "श्रेणी E",
    "CATEGORY F": "श्रेणी F",
    "Category Filter": "श्रेणी फ़िल्टर",
    "Category-wise Complaint Distribution": "श्रेणीवार शिकायत वितरण",
    "Centralized grievance management, official citizen response dispatch, 8-stage lifecycle tracking, and Gram Panchayat workload monitoring.": "केंद्रीकृत शिकायत प्रबंधन, आधिकारिक नागरिक प्रतिक्रिया, 8-चरणीय जीवन चक्र ट्रैकिंग और ग्राम पंचायत कार्यभार निगरानी।",
    "Centralized grievance management, official response dispatch, dynamic lifecycle tracking, system configuration, and Gram Panchayat workload monitoring.": "केंद्रीकृत शिकायत प्रबंधन, आधिकारिक उत्तर प्रेषण, गतिशील जीवनचक्र ट्रैकिंग, सिस्टम कॉन्फ़िगरेशन और ग्राम पंचायत कार्यभार निगरानी।",
    "Centralized permanent repository of every grievance update, official response, and lifecycle progression.": "प्रत्येक शिकायत अपडेट, आधिकारिक उत्तर और जीवनचक्र प्रगति का केंद्रीकृत स्थायी संग्रह।",
    "Change Grievance Status": "शिकायत की स्थिति बदलें",
    "change photo": "फोटो बदलें",
    "check the real-time progress of your complaint": "अपनी शिकायत की वास्तविक स्थिति देखें।",
    "check the real-time progress of your complaint.": "अपनी शिकायत की वास्तविक स्थिति देखें।",
    "check the real-time progress of your submitted complaint using your complaint id or email": "अपनी शिकायत आईडी या ईमेल का उपयोग करके अपनी दर्ज शिकायत की वास्तविक स्थिति देखें।",
    "check the real-time progress of your submitted complaint using your complaint id or email.": "अपनी शिकायत आईडी या ईमेल का उपयोग करके अपनी दर्ज शिकायत की वास्तविक स्थिति देखें।",
    "check the real-time status until it is resolved": "समाधान होने तक वास्तविक समय की स्थिति देखें",
    "check your complaint status": "अपनी शिकायत की स्थिति जांचें",
    "Checkpoint 1: Verify Reset Scope": "चरण 1: रीसेट दायरा सत्यापित करें",
    "Checkpoint 2: Live Impact Assessment": "चरण 2: लाइव प्रभाव मूल्यांकन",
    "Checkpoint 3: Cryptographic Pre-Reset Backup": "चरण 3: क्रिप्टोग्राफ़िक प्री-रीसेट बैकअप",
    "Checkpoint 4: Fresh Administrator Re-Authentication": "चरण 4: प्रशासक पुनः प्रमाणीकरण",
    "Checkpoint 5: Security Phrase Confirmation": "चरण 5: सुरक्षा वाक्यांश पुष्टि",
    "Checkpoint 6: Scope & Consequences Acknowledgment": "चरण 6: दायरा और परिणाम स्वीकृति",
    "Checkpoint 7: Final Armed Confirmation": "चरण 7: अंतिम पुष्टि",
    "Choose a different image file": "कोई अन्य छवि फ़ाइल चुनें",
    "choose a photo": "फोटो चुनें",
    "Chronological register of your grievances with live work progress tracking and official responses.": "लाइव कार्य प्रगति ट्रैकिंग और आधिकारिक उत्तरों के साथ आपकी शिकायतों का कालानुक्रमिक रजिस्टर।",
    "citizen": "नागरिक",
    "Citizen & Official Description": "नागरिक और आधिकारिक विवरण",
    "Citizen account profiles": "नागरिक खाता प्रोफ़ाइल",
    "Citizen Accounts": "नागरिक खाते",
    "Citizen accounts and citizen grievances": "नागरिक खाते और नागरिक शिकायतें",
    "citizen acknowledgement copy": "नागरिक पावती प्रति",
    "citizen details": "नागरिक का विवरण",
    "Citizen Grievance Dashboard": "नागरिक शिकायत डैशबोर्ड",
    "Citizen Grievance Dashboard – JANASEVA Portal": "नागरिक शिकायत डैशबोर्ड – जनसेवा पोर्टल",
    "citizen grievance redressal at the village level": "ग्राम स्तर पर नागरिक शिकायत निवारण",
    "Citizen Grievances": "नागरिक शिकायतें",
    "Citizen messages & Official responses": "नागरिक संदेश और आधिकारिक प्रतिक्रियाएं",
    "citizen name": "नागरिक का नाम",
    "Citizen requested grievance withdrawal": "नागरिक ने शिकायत वापस लेने का अनुरोध किया",
    "Citizen UID": "नागरिक यूआईडी",
    "Citizen, Receiver, and Administrator accounts": "नागरिक, प्राप्तकर्ता और प्रशासक खाते",
    "CITIZENS": "नागरिक",
    "civic issues": "नागरिक समस्याएं",
    "Clarification Required: Additional landmark/details requested": "स्पष्टीकरण आवश्यक: अतिरिक्त स्थल/विवरण का अनुरोध किया गया",
    "cleanliness": "स्वच्छता",
    "Clear Audit Trail": "ऑडिट ट्रेल साफ़ करें",
    "Clear Email Delivery Audit History": "ईमेल डिलीवरी ऑडिट इतिहास साफ़ करें",
    "Clear Filters": "फ़िल्टर साफ़ करें",
    "Clear Grievance Records": "शिकायत रिकॉर्ड साफ़ करें",
    "Clear Grievances (Cat B)": "शिकायतें साफ़ करें (श्रेणी B)",
    "Clear History": "इतिहास साफ़ करें",
    "Clear Ledger": "बहीखाता साफ़ करें",
    "Clear Selection": "चयन साफ़ करें",
    "Clear Temporary Data": "अस्थायी डेटा साफ़ करें",
    "Clear Temporary Data (Cat A)": "अस्थायी डेटा साफ़ करें (श्रेणी A)",
    "Click or drag and drop to choose an image from device": "डिवाइस से छवि चुनने के लिए क्लिक करें या खींचकर छोड़ें",
    "click to fill demo credentials": "डेमो क्रेडेंशियल भरने के लिए क्लिक करें",
    "Click to view full image": "पूरी छवि देखने के लिए क्लिक करें",
    "clogged drainage channel desilted before monsoon. wastewater flow restored smoothly": "मानसून से पहले अवरुद्ध नाले की गाद निकाली गई। अपशिष्ट जल का प्रवाह सुचारू रूप से बहाल किया गया।",
    "clogged drainage channel desilted before monsoon. wastewater flow restored smoothly.": "मानसून से पहले अवरुद्ध नाले की गाद निकाली गई। अपशिष्ट जल का प्रवाह सुचारू रूप से बहाल किया गया।",
    "close": "बंद करें",
    "Close Camera (Esc)": "कैमरा बंद करें (Esc)",
    "CLOUD FIRESTORE": "क्लाउड फ़ायरस्टोर",
    "cloud firestore protected": "क्लाउड फायरस्टोर संरक्षित",
    "cloud firestore security": "क्लाउड फायरस्टोर सुरक्षा",
    "Comments / Feedback": "टिप्पणियां / प्रतिक्रिया",
    "community hall ceiling repaired and painted. public booking reopened for villagers": "सामुदायिक भवन की छत की मरम्मत और पुताई की गई। ग्रामीणों के लिए सार्वजनिक बुकिंग फिर से शुरू की गई।",
    "community hall ceiling repaired and painted. public booking reopened for villagers.": "सामुदायिक भवन की छत की मरम्मत और पुताई की गई। ग्रामीणों के लिए सार्वजनिक बुकिंग फिर से शुरू की गई।",
    "complaint category": "शिकायत श्रेणी",
    "Complaint Complete Update History & Audit Trail": "शिकायत का संपूर्ण अपडेट इतिहास एवं ऑडिट ट्रेल",
    "complaint details": "शिकायत का विवरण",
    "complaint details & status update": "शिकायत विवरण और स्थिति अपडेट",
    "complaint email recipient settings": "शिकायत ईमेल प्राप्तकर्ता सेटिंग्स",
    "complaint id": "शिकायत आईडी",
    "complaint ref": "शिकायत संदर्भ",
    "Complaint Register": "शिकायत रजिस्टर",
    "complaint resolution notification": "शिकायत निवारण अधिसूचना",
    "Complaint Status & Workflow Rules": "शिकायत स्थिति एवं कार्यप्रवाह नियम",
    "complaint status tracker": "शिकायत स्थिति ट्रैकर",
    "complaint status update notification": "शिकायत स्थिति अपडेट अधिसूचना",
    "complaint submitted successfully": "शिकायत सफलतापूर्वक दर्ज की गई",
    "Complaint Title": "शिकायत शीर्षक",
    "Complaint Updates Folder": "शिकायत अपडेट फ़ोल्डर",
    "COMPLAINTS": "शिकायतें",
    "Complaints Filed": "दर्ज शिकायतें",
    "Complaints moved to Deleted History are safely archived. Official audit trails and receiver records remain permanently intact. You can restore eligible complaints back to active tracking at any time.": "हटाए गए इतिहास में भेजी गई शिकायतें सुरक्षित रूप से संग्रहीत हैं। आधिकारिक ऑडिट रिकॉर्ड स्थायी रहते हैं और आप पात्र शिकायतों को कभी भी पुनर्स्थापित कर सकते हैं।",
    "Complaints ranked by algorithmic severity, impact scope, and emergency classification.": "गंभीरता, प्रभाव के दायरे और आपातकालीन वर्गीकरण के आधार पर शिकायतों को रैंक किया गया है।",
    "Complete & View Dashboard": "पूर्ण करें और डैशबोर्ड देखें",
    "complete activity timeline": "संपूर्ण गतिविधि समयरेखा",
    "complete complaint history list": "संपूर्ण शिकायत इतिहास सूची",
    "Complete factory reset baseline. Purges all operational data & citizen registrations. Super Admin is strictly preserved.": "पूर्ण फ़ैक्टरी रीसेट। सभी परिचालन डेटा और नागरिक पंजीकरण हटाता है। सुपर एडमिन सुरक्षित रहता है।",
    "Complete ledger": "संपूर्ण बहीखाता",
    "COMPLETE RESET": "पूर्ण रीसेट",
    "Complete System Factory Reset": "पूर्ण सिस्टम फ़ैक्टरी रीसेट",
    "Complete System Reset": "पूर्ण सिस्टम रीसेट",
    "Completed": "पूर्ण",
    "completed & verified": "पूर्ण और सत्यापित",
    "Completed & Verified": "पूर्ण एवं सत्यापित",
    "Completed and Verified": "पूर्ण एवं सत्यापित",
    "Completed Work": "पूर्ण कार्य",
    "Completion Percentage (0–100%)": "पूर्णता प्रतिशत (0–100%)",
    "Comprehensive personal analytics and grievance resolution performance metrics.": "व्यापक व्यक्तिगत विश्लेषण और शिकायत समाधान प्रदर्शन आँकड़े।",
    "Computing...": "गणना हो रही है...",
    "configure emailjs parameters and cloud functions smtp transport status.": "ईमेलजेएस पैरामीटर और क्लाउड फंक्शन्स एसएमटीपी परिवहन स्थिति कॉन्फ़िगर करें।",
    "configure grievance notification delivery, manage target panchayat recipient email addresses, and inspect delivery audit history.": "शिकायत अधिसूचना वितरण कॉन्फ़िगर करें, पंचायत प्राप्तकर्ता ईमेल प्रबंधित करें और वितरण ऑडिट इतिहास देखें।",
    "configure the email receiver and emailjs details to send complaints from this website to your gram panchayat": "इस वेबसाइट से अपनी ग्राम पंचायत को शिकायतें भेजने के लिए ईमेल प्राप्तकर्ता और EmailJS विवरण कॉन्फ़िगर करें।",
    "configure the email receiver and emailjs details to send complaints from this website to your gram panchayat.": "इस वेबसाइट से अपनी ग्राम पंचायत को शिकायतें भेजने के लिए ईमेल प्राप्तकर्ता और EmailJS विवरण कॉन्फ़िगर करें।",
    "Configured Grievance Lifecycle Statuses": "कॉन्फ़िगर की गई शिकायत जीवनचक्र स्थितियाँ",
    "confirm deletion": "हटाने की पुष्टि करें",
    "Confirm Mode & View Impact →": "मोड की पुष्टि करें और प्रभाव देखें →",
    "confirm move to deleted history": "हटाए गए इतिहास में ले जाने की पुष्टि करें",
    "confirm new email address": "नए ईमेल पते की पुष्टि करें",
    "confirm password": "पासवर्ड की पुष्टि करें",
    "confirm recipient email change": "प्राप्तकर्ता ईमेल परिवर्तन की पुष्टि करें",
    "Confirmation of resolution and sign-off...": "समाधान और साइन-ऑफ की पुष्टि...",
    "Confirmation phrase required.": "पुष्टि वाक्यांश आवश्यक है।",
    "connect your emailjs account to enable sending emails from the website": "वेबसाइट से ईमेल भेजने के लिए अपने EmailJS खाते को कनेक्ट करें।",
    "connect your emailjs account to enable sending emails from the website.": "वेबसाइट से ईमेल भेजने के लिए अपने EmailJS खाते को कनेक्ट करें।",
    "connected": "कनेक्टेड",
    "Consistent": "सुसंगत है",
    "contact details": "संपर्क विवरण",
    "contact number": "संपर्क नंबर",
    "contact your respective gram panchayat office for more details or citizen welfare services": "अधिक जानकारी या नागरिक कल्याण सेवाओं के लिए अपने संबंधित ग्राम पंचायत कार्यालय से संपर्क करें।",
    "contact your respective gram panchayat office for more details or citizen welfare services.": "अधिक जानकारी या नागरिक कल्याण सेवाओं के लिए अपने संबंधित ग्राम पंचायत कार्यालय से संपर्क करें।",
    "Control Centre": "नियंत्रण केंद्र",
    "coverage": "दायरा",
    "create a password (min 6 chars)": "पासवर्ड बनाएं (न्यूनतम 6 अक्षर)",
    "create a service": "एक सर्विस बनाएं",
    "create a template": "एक टेम्पलेट बनाएं",
    "create an account": "खाता बनाएं",
    "Create Backup Snapshot Now": "अभी बैकअप स्नैपशॉट बनाएं",
    "create your account using your mobile number or email": "अपने मोबाइल नंबर या ईमेल का उपयोग करके अपना खाता बनाएं",
    "create your account with mobile or email": "मोबाइल या ईमेल से अपना खाता बनाएं",
    "create your personal janaseva account to submit and track grievances": "शिकायतें दर्ज करने और ट्रैक करने के लिए अपना व्यक्तिगत जनसेवा खाता बनाएं।",
    "create your personal janaseva account to submit and track grievances.": "शिकायतें दर्ज करने और ट्रैक करने के लिए अपना व्यक्तिगत जनसेवा खाता बनाएं।",
    "Created At": "निर्माण समय",
    "creating account": "खाता बनाया जा रहा है",
    "creating account...": "खाता बनाया जा रहा है...",
    "credential hygiene": "क्रेडेंशियल सुरक्षा",
    "Cryptographic Pre-Reset Snapshots & Disaster Recovery": "क्रिप्टोग्राफिक प्री-रीसेट स्नैपशॉट और आपदा पुनर्प्राप्ति",
    "Cryptographically logged history of all additions, modifications, archival, and deletions of status configurations.": "स्थिति कॉन्फ़िगरेशन के सभी परिवर्धन, संशोधन, संग्रह और विलोपन का दर्ज इतिहास।",
    "Current Active Banner:": "वर्तमान सक्रिय बैनर:",
    "current active delivery recipient": "वर्तमान सक्रिय वितरण प्राप्तकर्ता",
    "Current Active Status": "वर्तमान सक्रिय स्थिति",
    "Current Administrator Password": "वर्तमान प्रशासक पासवर्ड",
    "Current Count": "वर्तमान संख्या",
    "current file": "वर्तमान फ़ाइल",
    "current file:": "वर्तमान फ़ाइल:",
    "current recipient:": "वर्तमान प्राप्तकर्ता:",
    "current status": "वर्तमान स्थिति",
    "currently processing": "वर्तमान में प्रगति पर",
    "Custom receiver settings and notification preferences": "कस्टम प्राप्तकर्ता सेटिंग्स और सूचना प्राथमिकताएँ",
    "dakshina kannada": "दक्षिण कन्नड़",
    "Dashboard": "डैशबोर्ड",
    "Database & Backups": "डेटाबेस और बैकअप",
    "date": "दिनांक",
    "date & time": "दिनांक और समय",
    "date submitted": "दर्ज करने की तिथि",
    "Deactivate Maintenance Mode": "रखरखाव मोड निष्क्रिय करें",
    "default (all gram panchayats fallback)": "डिफ़ॉल्ट (सभी ग्राम पंचायतों का फ़ॉलबैक)",
    "Defines valid state transitions, mandatory remarks, evidence enforcement, receiver requirements, and role restrictions.": "मान्य स्थिति परिवर्तन, अनिवार्य टिप्पणियाँ, साक्ष्य नियम, प्राप्तकर्ता आवश्यकताएँ और भूमिका प्रतिबंध परिभाषित करता है।",
    "Delete": "हटाएं",
    "delete": "हटाएं",
    "Delete Complaint": "शिकायत हटाएं",
    "delete gram panchayat": "ग्राम पंचायत हटाएं",
    "Delete Grievance": "शिकायत हटाएं",
    "Delete Image": "छवि हटाएं",
    "Delete Snapshot": "स्नैपशॉट हटाएं",
    "Delete this complaint permanently": "इस शिकायत को स्थायी रूप से हटाएं",
    "Deleted By": "हटाने वाला",
    "Deleted By & Reason": "हटाने वाला एवं कारण",
    "deleted complaints": "हटाई गई शिकायतें",
    "Deleted Complaints Archive": "हटाई गई शिकायतों का संग्रह",
    "Deleted On": "हटाने की तिथि",
    "Deleted Timestamp": "हटाने का समय",
    "Deleting a grievance from the primary register safely moves it into this quarantine vault. Citizen information, uploaded photos, and chronological audit entries remain fully intact. Records can be restored at any time or permanently eradicated with multi-step authorization.": "मुख्य रजिस्टर से शिकायत हटाने पर वह सुरक्षित रूप से इस क्वारंटाइन वॉल्ट में चली जाती है। नागरिक विवरण, फ़ोटो और ऑडिट रिकॉर्ड सुरक्षित रहते हैं।",
    "Deletion Date": "हटाने की तिथि",
    "Deletion Reason": "हटाने का कारण",
    "delivered": "डिलीवर किया गया",
    "delivery failure alert": "वितरण विफलता अलर्ट",
    "demo accounts": "डेमो खाते",
    "Department Redressal Allocation": "विभागीय निवारण आवंटन",
    "describe the issue and upload a photo": "समस्या का विवरण दें और फोटो अपलोड करें",
    "describe the problem": "समस्या का विवरण दें",
    "describe the problem *": "समस्या का विवरण दें *",
    "describe your issue and upload a photo": "अपनी समस्या का विवरण दें और फोटो अपलोड करें",
    "describe your issue, select category and upload photos": "अपनी समस्या बताएं, श्रेणी चुनें और फोटो अपलोड करें",
    "description": "विवरण",
    "Detail reason for reopening this grievance...": "इस शिकायत को पुनः खोलने का विस्तृत कारण...",
    "detail the action taken, department assigned, inspection results, or resolution notes": "की गई कार्रवाई, सौंपे गए विभाग, निरीक्षण परिणाम या समाधान नोट्स का विवरण दें",
    "detail the action taken, department assigned, inspection results, or resolution notes...": "की गई कार्रवाई, सौंपे गए विभाग, निरीक्षण परिणाम या समाधान नोट्स का विवरण दें...",
    "Detail why the issue remains unresolved or what additional action is required on site...": "समस्या अभी तक क्यों हल नहीं हुई है या मौके पर क्या अतिरिक्त कार्रवाई आवश्यक है, इसका विवरण दें...",
    "Details": "विवरण",
    "digital grievance initiative": "डिजिटल शिकायत पहल",
    "digital grievance management system": "डिजिटल शिकायत प्रबंधन प्रणाली",
    "Digital Grievance Redressal Platform": "डिजिटल शिकायत निवारण मंच",
    "directory": "डायरेक्टरी",
    "Disaster recovery restoration. Reinstates system state from a verified pre-reset snapshot with SHA-256 validation.": "आपदा रिकवरी। SHA-256 सत्यापन के साथ सत्यापित स्नैपशॉट से सिस्टम स्थिति बहाल करता है।",
    "Discard and close": "छोड़ें और बंद करें",
    "Discard this capture and retake": "इसे छोड़ें और दोबारा खींचें",
    "dispatch automated tracking receipt emails to citizens upon successful complaint filing.": "शिकायत दर्ज होने पर नागरिकों को स्वचालित ट्रैकिंग रसीद ईमेल भेजें।",
    "district": "जिला",
    "do not share your emailjs keys publicly": "अपनी EmailJS कुंजियों को सार्वजनिक रूप से साझा न करें।",
    "do not share your emailjs keys publicly.": "अपनी EmailJS कुंजियों को सार्वजनिक रूप से साझा न करें।",
    "Document.pdf": "दस्तावेज़.पीडीएफ",
    "don't have an account": "खाता नहीं है",
    "don't have an account?": "खाता नहीं है?",
    "Download Acknowledgement Slip": "पावती पर्ची डाउनलोड करें",
    "Download Database JSON Export": "डेटाबेस जेसन निर्यात डाउनलोड करें",
    "Download Grievance Register CSV": "शिकायत रजिस्टर सीएसवी डाउनलोड करें",
    "Download Local JSON Backup": "स्थानीय JSON बैकअप डाउनलोड करें",
    "drag & drop an image here or click to browse": "फोटो को यहां खींचें या ब्राउज़ करने के लिए क्लिक करें",
    "drag & drop an image here or click to browse (jpg/png/webp, up to 5 mb)": "फोटो को यहां खींचें या ब्राउज़ करने के लिए क्लिक करें (JPG/PNG/WEBP, 5 MB तक)",
    "Drag & drop PDF / JPG / PNG (up to 10 MB) or click to browse": "पीडीएफ / जेपीजी / पीएनजी (10 एमबी तक) खींचें और छोड़ें या ब्राउज़ करने के लिए क्लिक करें",
    "drainage": "जल निकासी",
    "drainage &": "जल निकासी एवं",
    "drainage & sanitation": "जल निकासी एवं स्वच्छता",
    "drainage and sanitation": "जल निकासी एवं स्वच्छता",
    "Drinking Water Supply": "पेयजल आपूर्ति",
    "Duplicate": "डुप्लीकेट",
    "Duplicate grievance already registered": "समान शिकायत पहले से ही पंजीकृत है",
    "Dynamic Status Folder Navigation:": "गतिशील स्थिति फ़ोल्डर नेविगेशन:",
    "e.g. +91 82422 12345": "उदा. +91 82422 12345",
    "e.g. ": "उदा. ",
    "e.g. Asphalt compaction tomorrow, PWD inspection Friday...": "उदा. कल डामरीकरण, शुक्रवार को पीडब्ल्यूडी निरीक्षण...",
    "e.g. ": "उदा. ",
    "e.g. dakshina kannada": "उदा. दक्षिण कन्नड़",
    "e.g. Filed by mistake, issue resolved locally, duplicate entry...": "उदा. गलती से दर्ज, स्थानीय रूप से हल, डुप्लीकेट प्रविष्टि...",
    "e.g. haleyangadi gram panchayat": "उदा. हालियांगडी ग्राम पंचायत",
    "e.g. officer@example.com": "उदा. officer@example.com",
    "e.g. jan-2026-xxxx": "उदा. JAN-2026-XXXX",
    "e.g. main road, haleyangadi - 574146": "उदा. मुख्य मार्ग, हालियांगडी - 574146",
    "e.g. mangaluru": "उदा. मंगलुरु",
    "e.g. name@example.com": "उदा. name@example.com",
    "e.g. officer@panchayat.gov.in": "उदा. officer@panchayat.gov.in",
    "e.g. prinson dsouza": "उदा. प्रिंसन डिसूजा",
    "e.g. name@example.com": "उदा. name@example.com",
    "e.g. rajesh shetty": "उदा. राजेश शेट्टी",
    "e.g. Severe drinking water pipeline leakage near temple": "उदा. मंदिर के पास पेयजल पाइपलाइन में गंभीर रिसाव",
    "e.g. sunitha rao": "उदा. सुनीता राव",
    "e.g. Under Field Inspection": "उदा. क्षेत्रीय निरीक्षण में",
    "e.g. under_field_inspection": "उदा. under_field_inspection",
    "Edit": "संपादित करें",
    "edit": "संपादित करें",
    "Edit / Review": "संपादित करें / समीक्षा",
    "Edit Complaint & Grievance Control Centre": "शिकायत संपादन एवं नियंत्रण केंद्र",
    "Edit Complaint & Lifecycle Status (Admin)": "शिकायत एवं जीवनचक्र स्थिति संपादित करें (प्रशासन)",
    "Edit Complaint Status & Official Response in Admin Control Centre": "प्रशासन नियंत्रण केंद्र में शिकायत स्थिति और आधिकारिक उत्तर संपादित करें",
    "edit gram panchayat": "ग्राम पंचायत संपादित करें",
    "edit gram panchayat details": "ग्राम पंचायत विवरण संपादित करें",
    "Edit in Admin": "व्यवस्थापक में संपादित करें",
    "edit notice or announcements for villagers": "ग्रामीणों के लिए सूचना या घोषणाएं संपादित करें",
    "edit notice or announcements for villagers...": "ग्रामीणों के लिए सूचना या घोषणाएं संपादित करें...",
    "Electricity & Streetlights": "बिजली और स्ट्रीटलाइट",
    "Electricity Supply Company (MESCOM/BESCOM)": "विद्युत आपूर्ति कंपनी (मेसकॉम/बेस्कॉम)",
    "email": "ईमेल",
    "Email & WhatsApp Logs": "ईमेल और व्हाट्सएप लॉग",
    "email address": "ईमेल पता",
    "Email and WhatsApp delivery logs": "ईमेल और व्हाट्सएप डिलीवरी लॉग",
    "email delivery audit history": "ईमेल वितरण ऑडिट इतिहास",
    "Email delivery logs & WhatsApp dispatch logs": "ईमेल और व्हाट्सएप प्रेषण लॉग",
    "email delivery pipeline configuration": "ईमेल वितरण पाइपलाइन कॉन्फ़िगरेशन",
    "Email Delivery Pipeline Ready": "ईमेल वितरण पाइपलाइन तैयार",
    "email notification preferences": "ईमेल अधिसूचना प्राथमिकताएं",
    "email receiver (panchayat)": "ईमेल प्राप्तकर्ता (पंचायत)",
    "email transmission audit details": "ईमेल ट्रांसमिशन ऑडिट विवरण",
    "Email transmission audit logs & WhatsApp logs": "ईमेल प्रेषण ऑडिट लॉग और व्हाट्सएप लॉग",
    "EmailJS Client Pipeline (Primary)": "ईमेलजेएस क्लाइंट पाइपलाइन (प्राथमिक)",
    "emailjs configuration": "EmailJS कॉन्फ़िगरेशन",
    "emailjs public key": "EmailJS पब्लिक की",
    "emailjs public key *": "EmailJS पब्लिक की *",
    "emailjs service id": "EmailJS सर्विस आईडी",
    "emailjs service id *": "EmailJS सर्विस आईडी *",
    "emailjs template id": "EmailJS टेम्पलेट आईडी",
    "emailjs template id *": "EmailJS टेम्पलेट आईडी *",
    "emailjs uses client public key authentication only.": "ईमेलजेएस केवल क्लाइंट पब्लिक की प्रमाणीकरण का उपयोग करता है।",
    "Emergency Control Centre": "आपातकालीन नियंत्रण केंद्र",
    "Emergency Control Centre – Master Emergency Data Reset – JANASEVA": "आपातकालीन नियंत्रण केंद्र – मास्टर डेटा रीसेट – जनसेवा",
    "Emergency Data Reset": "आपातकालीन डेटा रीसेट",
    "empowering rural citizens through a simple and digital grievance system": "एक सरल और डिजिटल शिकायत प्रणाली के माध्यम से ग्रामीण नागरिकों को सशक्त बनाना।",
    "empowering rural citizens through a simple and digital grievance system.": "एक सरल और डिजिटल शिकायत प्रणाली के माध्यम से ग्रामीण नागरिकों को सशक्त बनाना।",
    "Empty all quarantined records": "सभी क्वारंटाइन रिकॉर्ड खाली करें",
    "Empty Recycle Bin": "रीसायकल बिन खाली करें",
    "ENFORCED": "लागू",
    "enter 10-digit phone number": "10-अंकों का फोन नंबर दर्ज करें",
    "Enter administrator password (e.g. your configured password)": "प्रशासक पासवर्ड दर्ज करें (उदा. your configured password)",
    "enter complaint id (e.g. jan-2026-xxxx)": "शिकायत आईडी दर्ज करें (उदा. JAN-2026-XXXX)",
    "enter complaint id (e.g. jan-2026-xxxx)": "शिकायत आईडी दर्ज करें (उदा. JAN-2026-XXXX)",
    "no complaint found. please verify your complaint id and registered email address.": "कोई शिकायत नहीं मिली। कृपया अपनी शिकायत आईडी और पंजीकृत ईमेल पता सत्यापित करें।",
    "enter gram panchayat name": "ग्राम पंचायत का नाम दर्ज करें",
    "Enter image URL or path of remediation work...": "सुधार कार्य की छवि का URL या पथ दर्ज करें...",
    "enter official email address": "आधिकारिक ईमेल पता दर्ज करें",
    "enter pdo full name": "पीडीओ का पूरा नाम दर्ज करें",
    "enter president full name": "अध्यक्ष का पूरा नाम दर्ज करें",
    "enter remarks for citizen": "नागरिक के लिए टिप्पणी दर्ज करें",
    "enter remarks for citizen...": "नागरिक के लिए टिप्पणी दर्ज करें...",
    "enter taluk name": "तालुका का नाम दर्ज करें",
    "enter the email address where complaints should be sent": "वह ईमेल पता दर्ज करें जहां शिकायतें भेजी जानी चाहिए।",
    "enter the email address where complaints should be sent.": "वह ईमेल पता दर्ज करें जहां शिकायतें भेजी जानी चाहिए।",
    "Enter updated official response, resolution details, or progress update...": "अपडेट किया गया आधिकारिक उत्तर, समाधान विवरण या प्रगति अपडेट दर्ज करें...",
    "enter your 10-digit mobile": "अपना 10-अंकों का मोबाइल दर्ज करें",
    "Enter your Complaint ID or registered email address above and click": "ऊपर अपनी शिकायत आईडी या पंजीकृत ईमेल पता दर्ज करें और क्लिक करें",
    "enter your complaint id or the email address used while submitting the complaint": "अपनी शिकायत आईडी या शिकायत दर्ज करते समय उपयोग किया गया ईमेल पता दर्ज करें।",
    "enter your complaint id or the email address used while submitting the complaint.": "अपनी शिकायत आईडी या शिकायत दर्ज करते समय उपयोग किया गया ईमेल पता दर्ज करें।",
    "enter your credentials to access the digital grievance portal": "डिजिटल शिकायत पोर्टल तक पहुंचने के लिए अपनी साख दर्ज करें",
    "enter your email": "अपना ईमेल दर्ज करें",
    "enter your email address": "अपना ईमेल पता दर्ज करें",
    "enter your email address and we'll send you a link to reset your password": "अपना ईमेल पता दर्ज करें और हम आपको अपना पासवर्ड रीसेट करने के लिए एक लिंक भेजेंगे।",
    "enter your email address and we'll send you a link to reset your password.": "अपना ईमेल पता दर्ज करें और हम आपको अपना पासवर्ड रीसेट करने के लिए एक लिंक भेजेंगे।",
    "enter your full name": "अपना पूरा नाम दर्ज करें",
    "enter your mobile number": "अपना मोबाइल नंबर दर्ज करें",
    "enter your password": "अपना पासवर्ड दर्ज करें",
    "enter your registered email": "अपना पंजीकृत ईमेल दर्ज करें",
    "enter your registered email address and we will dispatch a password reset verification link to your inbox": "अपना पंजीकृत ईमेल पता दर्ज करें और हम आपके इनबॉक्स में पासवर्ड रीसेट सत्यापन लिंक भेजेंगे।",
    "enter your registered email address and we will dispatch a password reset verification link to your inbox.": "अपना पंजीकृत ईमेल पता दर्ज करें और हम आपके इनबॉक्स में पासवर्ड रीसेट सत्यापन लिंक भेजेंगे।",
    "Estimated Volume": "अनुमानित आकार",
    "evaluation demo credentials": "मूल्यांकन डेमो क्रेडेंशियल",
    "evaluation demo credentials:": "मूल्यांकन डेमो क्रेडेंशियल:",
    "every recipient modification creates a permanent record in": "प्रत्येक प्राप्तकर्ता संशोधन का स्थायी रिकॉर्ड दर्ज होता है:",
    "Every recipient modification creates a permanent record in": "प्रत्येक प्राप्तकर्ता संशोधन का स्थायी रिकॉर्ड दर्ज होता है:",
    "Evidence": "साक्ष्य",
    "Excludes deleted records": "हटाए गए रिकॉर्ड छोड़कर",
    "Execute": "निष्पादित करें",
    "Executing Master Emergency Reset": "मास्टर आपातकालीन रीसेट निष्पादित हो रहा है",
    "Explain why this grievance should be reviewed or deleted by Admin...": "बताएं कि प्रशासक को इस शिकायत की समीक्षा या विलोपन क्यों करना चाहिए...",
    "export all panchayats to csv file": "सभी पंचायतों को CSV फ़ाइल में निर्यात करें",
    "Export CSV": "सीएसवी निर्यात",
    "export csv": "CSV निर्यात करें",
    "export directory (csv)": "डायरेक्टरी निर्यात करें (CSV)",
    "Export Excel / CSV": "एक्सेल / सीएसवी निर्यात",
    "Export filtered updates as CSV": "फ़िल्टर किए गए अपडेट CSV के रूप में निर्यात करें",
    "Export Report": "रिपोर्ट निर्यात करें",
    "facilities": "सुविधाएं",
    "failed": "विफल",
    "Falls outside Gram Panchayat jurisdiction": "ग्राम पंचायत के अधिकार क्षेत्र से बाहर है",
    "Field work completed; awaiting final sign-off.": "क्षेत्रीय कार्य पूरा हुआ; अंतिम साइन-ऑफ की प्रतीक्षा है।",
    "field work progress tracking": "क्षेत्रीय कार्य प्रगति ट्रैकिंग",
    "Filed Date": "दर्ज करने की तिथि",
    "Filing Date": "दाखिल करने की तिथि",
    "Filing Timestamp": "दाखिल करने का समय",
    "fill admin": "व्यवस्थापक भरें",
    "fill citizen": "नागरिक भरें",
    "fill in the details below and attach a photo of the issue": "नीचे दिए गए विवरण भरें और समस्या का फोटो संलग्न करें।",
    "fill in the details below and attach a photo of the issue.": "नीचे दिए गए विवरण भरें और समस्या का फोटो संलग्न करें।",
    "fill receiver": "प्राप्तकर्ता भरें",
    "filter by block / taluk": "तालुका के अनुसार फ़िल्टर करें",
    "filter by district": "जिले के अनुसार फ़िल्टर करें",
    "filter by status": "स्थिति के अनुसार फ़िल्टर करें",
    "filter grievances": "शिकायतों को फ़िल्टर करें",
    "Filter: Action Taken": "फ़िल्टर: कार्रवाई की गई",
    "Filter: All Grievances": "फ़िल्टर: सभी शिकायतें",
    "Filter: Assigned": "फ़िल्टर: आवंटित",
    "Filter: In Progress": "फ़िल्टर: प्रगति पर",
    "Filter: Overdue (>7 Days)": "फ़िल्टर: विलंबित (>7 दिन)",
    "Filter: Rejected": "फ़िल्टर: अस्वीकृत",
    "Filter: Reopened": "फ़िल्टर: पुनः खोली गई",
    "Filter: Resolved": "फ़िल्टर: समाधानित",
    "Filter: Submitted": "फ़िल्टर: दर्ज की गई",
    "Filter: Under Review": "फ़िल्टर: समीक्षाधीन",
    "find contact details and key information of all gram panchayats in your area": "अपने क्षेत्र की सभी ग्राम पंचायतों के संपर्क विवरण और महत्वपूर्ण जानकारी प्राप्त करें।",
    "find contact details and key information of all gram panchayats in your area.": "अपने क्षेत्र की सभी ग्राम पंचायतों के संपर्क विवरण और महत्वपूर्ण जानकारी प्राप्त करें।",
    "find contact details of gram panchayats in your area": "अपने क्षेत्र की ग्राम पंचायतों के संपर्क विवरण प्राप्त करें।",
    "find contact details of gram panchayats in your area.": "अपने क्षेत्र की ग्राम पंचायतों के संपर्क विवरण प्राप्त करें।",
    "find panchayat": "पंचायत खोजें",
    "Firebase Storage": "फायरबेस स्टोरेज",
    "Firestore Collection / Store": "फ़ायरस्टोर संग्रह / स्टोर",
    "Firestore security rules & immutable audit ledger": "फ़ायरस्टोर सुरक्षा नियम और अपरिवर्तनीय ऑडिट बहीखाता",
    "Flag for Inquiry": "जांच के लिए चिह्नित करें",
    "Flag Grievance for Admin Review": "प्रशासन समीक्षा के लिए शिकायत फ़्लैग करें",
    "Flagging Category": "फ़्लैग श्रेणी",
    "Flushes transient offline drafts, IndexedDB queues, and transmission logs without affecting core data.": "मुख्य डेटा को प्रभावित किए बिना अस्थायी ऑफ़लाइन ड्राफ़्ट, IndexedDB कतारें और लॉग साफ़ करता है।",
    "folder. Official audit trails and receiver work records remain intact, and you can restore it anytime.": "फ़ोल्डर में भेज दी जाएगी। आधिकारिक ऑडिट रिकॉर्ड सुरक्षित रहेंगे और आप इसे कभी भी पुनर्स्थापित कर सकते हैं।",
    "Follow-up required": "अनुवर्ती कार्रवाई आवश्यक",
    "FontAwesome Icon Class": "FontAwesome आइकन क्लास",
    "forgot password": "पासवर्ड भूल गए",
    "forgot password?": "पासवर्ड भूल गए?",
    "forwarded to panchayat": "ग्राम पंचायत को भेजा गया",
    "Fresh start baseline. Purges all operational data AND registered citizen accounts, preparing portal for fresh deployment.": "नई शुरुआत। सभी परिचालन डेटा और पंजीकृत नागरिक खातों को हटाकर पोर्टल को नए सिरे से तैयार करता है।",
    "From Date": "प्रारंभ तिथि",
    "From filing date": "दाखिल करने की प्रारंभ तिथि",
    "from the directory": "डायरेक्टरी से",
    "from the directory?": "डायरेक्टरी से?",
    "Full Application Data Reset": "पूर्ण एप्लिकेशन डेटा रीसेट",
    "Full data integrity protection with automatic rollback on error.": "त्रुटि होने पर स्वचालित रोलबैक के साथ पूर्ण डेटा सुरक्षा।",
    "full name": "पूरा नाम",
    "FULL RESET": "पूर्ण रीसेट",
    "Full System Reset (Cat E)": "पूर्ण सिस्टम रीसेट (श्रेणी E)",
    "garbage &": "कचरा एवं",
    "garbage & cleanliness": "कचरा एवं स्वच्छता",
    "garbage and cleanliness": "कचरा एवं स्वच्छता",
    "garbage cleared from market yard and bleaching powder sprinkled. daily collection schedule enforced": "बाजार प्रांगण से कचरा साफ किया गया और ब्लीचिंग पाउडर का छिड़काव किया गया। दैनिक संग्रहण कार्यक्रम लागू किया गया।",
    "garbage cleared from market yard and bleaching powder sprinkled. daily collection schedule enforced.": "बाजार प्रांगण से कचरा साफ किया गया और ब्लीचिंग पाउडर का छिड़काव किया गया। दैनिक संग्रहण कार्यक्रम लागू किया गया।",
    "garbage not cleared": "कचरा नहीं उठाया गया",
    "General Gram Panchayat Administration": "सामान्य ग्राम पंचायत प्रशासन",
    "General Grievance": "सामान्य शिकायत",
    "Generate immutable JSON database snapshots or full CSV registers for audit compliance and disaster recovery.": "ऑडिट अनुपालन और आपदा पुनर्प्राप्ति के लिए अपरिवर्तनीय जेसन डेटाबेस स्नैपशॉट या पूर्ण सीएसवी रजिस्टर उत्पन्न करें।",
    "Generate Report": "रिपोर्ट तैयार करें",
    "Generated Backup Snapshots & Logs": "उत्पन्न बैकअप स्नैपशॉट और लॉग",
    "Generating...": "बनाया जा रहा है...",
    "get public key": "पब्लिक की प्राप्त करें",
    "get these details from your emailjs dashboard (service id, template id and public key). make sure your template is configured to receive the variable": "अपने EmailJS डैशबोर्ड से ये विवरण प्राप्त करें (सर्विस आईडी, टेम्पलेट आईडी और पब्लिक की)। सुनिश्चित करें कि आपका टेम्पलेट वेरिएबल प्राप्त करने के लिए कॉन्फ़िगर किया गया है",
    "get these details from your emailjs dashboard (service id, template id and public key). make sure your template is configured to receive the variable complaint_photo if you are sending a photo": "अपने EmailJS डैशबोर्ड से ये विवरण प्राप्त करें (सर्विस आईडी, टेम्पलेट आईडी और पब्लिक की)। यदि आप फोटो भेज रहे हैं तो सुनिश्चित करें कि आपका टेम्पलेट complaint_photo वेरिएबल प्राप्त करने के लिए कॉन्फ़िगर किया गया है।",
    "get these details from your emailjs dashboard (service id, template id and public key). make sure your template is configured to receive the variable complaint_photo if you are sending a photo.": "अपने EmailJS डैशबोर्ड से ये विवरण प्राप्त करें (सर्विस आईडी, टेम्पलेट आईडी और पब्लिक की)। यदि आप फोटो भेज रहे हैं तो सुनिश्चित करें कि आपका टेम्पलेट complaint_photo वेरिएबल प्राप्त करने के लिए कॉन्फ़िगर किया गया है।",
    "get updates": "अपडेट प्राप्त करें",
    "go to account -> api keys and copy the public key": "खाता -> API Keys पर जाएं और पब्लिक की कॉपी करें।",
    "go to account -> api keys and copy the public key.": "खाता -> API Keys पर जाएं और पब्लिक की कॉपी करें।",
    "go to account → api keys and copy the public key": "खाता → API Keys पर जाएं और पब्लिक की कॉपी करें।",
    "go to account → api keys and copy the public key.": "खाता → API Keys पर जाएं और पब्लिक की कॉपी करें।",
    "go to dashboard.emailjs.com and sign in": "dashboard.emailjs.com पर जाएं और साइन इन करें।",
    "go to dashboard.emailjs.com and sign in.": "dashboard.emailjs.com पर जाएं और साइन इन करें।",
    "Google Cloud Functions SMTP Transport (Backend)": "गूगल क्लाउड फ़ंक्शंस एसएमटीपी ट्रांसपोर्ट (बैकएंड)",
    "government of india": "भारत सरकार",
    "gram panchayat": "ग्राम पंचायत",
    "Gram Panchayat Desk": "ग्राम पंचायत डेस्क",
    "gram panchayat directory": "ग्राम पंचायत डायरेक्टरी",
    "Gram Panchayat directory and system configurations": "ग्राम पंचायत निर्देशिका और सिस्टम कॉन्फ़िगरेशन",
    "Gram Panchayat Directory configurations": "ग्राम पंचायत निर्देशिका कॉन्फ़िगरेशन",
    "gram panchayat directory – janaseva portal": "ग्राम पंचायत डायरेक्टरी – जनसेवा पोर्टल",
    "gram panchayat grievance portal": "ग्राम पंचायत शिकायत निवारण पोर्टल",
    "Gram Panchayat Health & Sanitation Squad": "ग्राम पंचायत स्वास्थ्य एवं स्वच्छता दल",
    "gram panchayat official": "ग्राम पंचायत अधिकारी",
    "gram panchayat president": "ग्राम पंचायत अध्यक्ष",
    "Gram Panchayat Voice Redressal": "ग्राम पंचायत वॉयस निवारण",
    "Grievance Description": "शिकायत का विवरण",
    "Grievance Details & Official Responses": "शिकायत विवरण और आधिकारिक प्रतिक्रियाएं",
    "Grievance Documents": "शिकायत दस्तावेज़",
    "Grievance ID": "शिकायत आईडी",
    "Grievance Lifecycle Progression": "शिकायत जीवनचक्र प्रगति",
    "Grievance Management": "शिकायत प्रबंधन",
    "grievance management dashboard": "शिकायत प्रबंधन डैशबोर्ड",
    "Grievance Priority Level": "शिकायत प्राथमिकता स्तर",
    "Grievance Priority Level (AI Assessment & Override)": "शिकायत प्राथमिकता स्तर (एआई मूल्यांकन एवं परिवर्तन)",
    "Grievance records submitted by citizens": "नागरिकों द्वारा दर्ज शिकायत रिकॉर्ड",
    "Grievance Redressal Officer (Receiver)": "शिकायत निवारण अधिकारी (प्राप्तकर्ता)",
    "Grievance Rejected by Administration": "प्रशासन द्वारा शिकायत अस्वीकृत",
    "Grievance Reopened for Further Verification": "अग्रिम सत्यापन के लिए शिकायत पुनः खोली गई",
    "Grievance Resolution Feedback": "शिकायत समाधान फीडबैक",
    "Grievance Resolved: Verified resolution confirmed": "शिकायत का समाधान: सत्यापित समाधान की पुष्टि",
    "Grievance Saved Offline": "शिकायत ऑफ़लाइन सुरक्षित की गई",
    "Grievance Subject / Title": "शिकायत का विषय / शीर्षक",
    "Grievance successfully addressed and verified.": "शिकायत का सफलतापूर्वक समाधान और सत्यापन किया गया।",
    "Grievances Analyzed": "विश्लेषित शिकायतें",
    "Guruvayanakere": "गुरुवायनाकेरे",
    "Guruvayanakere Gram Panchayat": "गुरुवायनाकेरे ग्राम पंचायत",
    "hide password": "पासवर्ड छिपाएं",
    "HIGH": "उच्च",
    "HIGH (Immediate Attention Required)": "उच्च (तत्काल ध्यान आवश्यक)",
    "High Priority": "उच्च प्राथमिकता",
    "Highest Progress First": "उच्चतम प्रगति पहले",
    "Historical storage": "ऐतिहासिक संग्रह",
    "History": "इतिहास",
    "home": "होम",
    "hon. president": "माननीय अध्यक्ष",
    "Hotspots": "हॉटस्पॉट",
    "how it works": "यह कैसे काम करता है?",
    "how it works?": "यह कैसे काम करता है?",
    "how to get emailjs details": "EmailJS विवरण कैसे प्राप्त करें",
    "how to get emailjs details?": "EmailJS विवरण कैसे प्राप्त करें?",
    "Hybrid (EmailJS with Cloud Functions Failover)": "हाइब्रिड (क्लाउड फ़ंक्शंस फ़ेलओवर के साथ ईमेलजेएस)",
    "HYBRID REPOSITORY": "हाइब्रिड रिपॉज़िटरी",
    "I am an authorized Administrator executing this emergency operation under municipal governance guidelines.": "मैं नगरपालिका शासन दिशानिर्देशों के तहत यह आपातकालीन कार्य करने वाला अधिकृत प्रशासक हूँ।",
    "I confirm that a verified cryptographic pre-reset snapshot backup has been generated with SHA-256 integrity hash.": "मैं पुष्टि करता/करती हूँ कि SHA-256 अखंडता हैश के साथ सत्यापित प्री-रीसेट स्नैपशॉट बैकअप बनाया गया है।",
    "I understand that initiating this reset will permanently erase selected operational grievance records, review histories, and delivery logs.": "मैं समझता/समझती हूँ कि इस रीसेट से चयनित शिकायत रिकॉर्ड, समीक्षा इतिहास और डिलीवरी लॉग स्थायी रूप से मिट जाएंगे।",
    "ID": "आईडी",
    "If the reported issue has not been satisfactorily resolved or has recurred, please explain the reason for requesting a reopening for grievance": "यदि रिपोर्ट की गई समस्या का संतोषजनक समाधान नहीं हुआ है या दोबारा हुई है, तो कृपया शिकायत पुनः खोलने का अनुरोध करने का कारण बताएं",
    "if you are sending a photo.": "यदि आप फोटो भेज रहे हैं।",
    "Immediate Review": "तत्काल समीक्षा",
    "immutable audit trail": "अपरिवर्तनीय ऑडिट ट्रेल",
    "Immutable chronological log of status transitions, official responses, and reassignments.": "स्थिति परिवर्तनों, आधिकारिक प्रतिक्रियाओं और पुनर्नियुक्तियों का अपरिवर्तनीय कालानुक्रमिक लॉग।",
    "Immutable Emergency Reset Audit Ledger": "अपरिवर्तनीय आपातकालीन रीसेट ऑडिट बहीखाता",
    "Immutable Reset Audit History Ledger": "अपरिवर्तनीय रीसेट ऑडिट लेज़र",
    "Impact": "प्रभाव",
    "import file": "फ़ाइल आयात करें",
    "import new panchayats from file (csv/json)": "फ़ाइल (CSV/JSON) से नई पंचायतें आयात करें",
    "import panchayats (csv/json)": "पंचायतें आयात करें (CSV/JSON)",
    "in progress": "प्रगति पर है",
    "in progress (action taken)": "प्रगति पर (कार्रवाई की गई)",
    "In Progress (Work Underway)": "प्रगति पर (काम जारी है)",
    "in progress complaints": "प्रगतिरत शिकायतें",
    "in progress {action taken}": "प्रगति पर {कार्रवाई की गई}",
    "Include as Node in Citizen Timeline Stepper": "नागरिक समयरेखा स्टेपर में नोड के रूप में शामिल करें",
    "Incomplete location or landmark details": "अधूरा स्थान या स्थल चिह्न विवरण",
    "Inconsistency Flagged": "विसंगति पाई गई",
    "IndexedDB offline draft queues and local storage": "IndexedDB ऑफ़लाइन ड्राफ़्ट कतारें और स्थानीय संग्रहण",
    "IndexedDB offline submission queue & drafts": "IndexedDB ऑफ़लाइन सबमिशन कतार और ड्राफ़्ट",
    "infrastructure": "बुनियादी ढांचा",
    "Initial (Incoming)": "प्रारंभिक (आने वाली)",
    "Initial inspection / verification.": "प्रारंभिक निरीक्षण / सत्यापन।",
    "Initiate Complete Factory Reset (Mode B)": "पूर्ण फ़ैक्टरी रीसेट शुरू करें (मोड B)",
    "Initiate Operational Reset (Mode A)": "परिचालन रीसेट शुरू करें (मोड A)",
    "Inspect": "निरीक्षण करें",
    "Inspection Scheduled: Field inspection scheduled within 48 hours": "निरीक्षण निर्धारित: 48 घंटों के भीतर क्षेत्र निरीक्षण निर्धारित",
    "Inspection, cost planning, or department coordination.": "निरीक्षण, लागत योजना या विभागीय समन्वय।",
    "Install JANASEVA App for offline village access": "ऑफ़लाइन ग्राम उपयोग के लिए जनसेवा ऐप इंस्टॉल करें",
    "Integrity": "अखंडता",
    "Internal Administrative Note (Officials Only)": "आंतरिक प्रशासनिक नोट (केवल अधिकारियों के लिए)",
    "invalid credentials. please verify your email and password.": "अमान्य क्रेडेंशियल्स। कृपया अपना ईमेल और पासवर्ड सत्यापित करें।",
    "irregular water supply": "अनियमित जल आपूर्ति",
    "Issue already resolved prior to inspection": "निरीक्षण से पहले ही समस्या का समाधान हो चुका है",
    "issue category": "समस्या श्रेणी",
    "issues": "समस्याएं",
    "janaseva": "जनसेवा",
    "JANASEVA AI": "जनसेवा एआई",
    "janaseva aims to provide a simple, transparent, and convenient way for citizens to report local issues to their gram panchayat and track their resolution online": "जनसेवा का उद्देश्य नागरिकों को अपनी ग्राम पंचायत में स्थानीय समस्याओं की रिपोर्ट करने और उनके समाधान को ऑनलाइन ट्रैक करने का एक सरल, पारदर्शी और सुविधाजनक मंच प्रदान करना है।",
    "janaseva aims to provide a simple, transparent, and convenient way for citizens to report local issues to their gram panchayat and track their resolution online.": "जनसेवा का उद्देश्य नागरिकों को अपनी ग्राम पंचायत में स्थानीय समस्याओं की रिपोर्ट करने और उनके समाधान को ऑनलाइन ट्रैक करने का एक सरल, पारदर्शी और सुविधाजनक मंच प्रदान करना है।",
    "janaseva – digital grievance management system": "जनसेवा – डिजिटल शिकायत प्रबंधन प्रणाली",
    "janaseva – digital grievance management system | login": "जनसेवा – डिजिटल शिकायत प्रबंधन प्रणाली | लॉगिन",
    "janaseva – gram panchayat grievance portal": "जनसेवा – ग्राम पंचायत शिकायत निवारण पोर्टल",
    "janaseva – gram panchayat grievance portal. this portal is an academic student project created for civic grievance demonstration. not an official government of india website": "जनसेवा – ग्राम पंचायत शिकायत निवारण पोर्टल। यह पोर्टल नागरिक शिकायत प्रदर्शन के लिए बनाई गई एक शैक्षणिक छात्र परियोजना है। भारत सरकार की आधिकारिक वेबसाइट नहीं है।",
    "janaseva – gram panchayat grievance portal. this portal is an academic student project created for civic grievance demonstration. not an official government of india website.": "जनसेवा – ग्राम पंचायत शिकायत निवारण पोर्टल। यह पोर्टल नागरिक शिकायत प्रदर्शन के लिए बनाई गई एक शैक्षणिक छात्र परियोजना है। भारत सरकार की आधिकारिक वेबसाइट नहीं है।",
    "JPG, JPEG, PNG, WEBP • Max 5 MB": "JPG, JPEG, PNG, WEBP • अधिकतम 5 MB",
    "JPG, PNG, WEBP": "JPG, PNG, WEBP",
    "Jurisdiction Notice: Forwarded to competent external department": "अधिकार क्षेत्र सूचना: सक्षम बाहरी विभाग को अग्रेषित",
    "kadaba gram panchayat": "कडबा ग्राम पंचायत",
    "karkala": "कारकला",
    "karkala rural gram panchayat": "कारकला ग्रामीण ग्राम पंचायत",
    "kavoor gp": "कावूर ग्रा.पं",
    "kavoor gram panchayat": "कावूर ग्राम पंचायत",
    "Keep Both Grievances": "दोनों शिकायतें रखें",
    "keep the receiver email address updated for uninterrupted complaint delivery": "निर्बाध शिकायत वितरण के लिए प्राप्तकर्ता का ईमेल पता अद्यतन रखें।",
    "keep the receiver email address updated for uninterrupted complaint delivery.": "निर्बाध शिकायत वितरण के लिए प्राप्तकर्ता का ईमेल पता अद्यतन रखें।",
    "key features": "मुख्य विशेषताएं",
    "Kotekar": "कोटेकार",
    "Kotekar Gram Panchayat": "कोटेकार ग्राम पंचायत",
    "kundapura": "कुंडापुरा",
    "kundapura gram panchayat": "कुंडापुरा ग्राम पंचायत",
    "Last Updated": "अंतिम अपडेट",
    "last verified: checking cloud configuration...": "अंतिम सत्यापन: क्लाउड कॉन्फ़िगरेशन की जांच हो रही है...",
    "Leave empty if on schedule. Otherwise specify reason (weather, contractor, equipment)...": "समय पर होने पर खाली छोड़ें। अन्यथा कारण बताएं...",
    "List specific repairs, cleanups, or construction done on site...": "स्थल पर की गई विशिष्ट मरम्मत, सफाई या निर्माण कार्यों की सूची...",
    "Listening... Speak now": "सुन रहा हूँ... अब बोलें",
    "LIVE": "लाइव",
    "Live algorithmic hazard detection, systemic failure pattern analysis, recurring civic problem clusters, and priority distribution across Gram Panchayats.": "लाइव एल्गोरिदमिक खतरा पहचान, प्रणालीगत विफलता पैटर्न विश्लेषण, बार-बार आने वाली नागरिक समस्याएं और ग्राम पंचायतों में प्राथमिकता वितरण।",
    "live camera": "लाइव कैमरा",
    "live camera capture": "लाइव कैमरा कैप्चर",
    "live camera or device upload": "लाइव कैमरा या डिवाइस अपलोड",
    "live camera or upload": "लाइव कैमरा या अपलोड",
    "Live System Impact Assessment": "लाइव सिस्टम प्रभाव आकलन",
    "Live Visual Badge Preview": "लाइव दृश्य बैज पूर्वावलोकन",
    "Live wires, epidemics, road caving": "जीवित तार, महामारी, सड़क धंसना",
    "loading": "लोड हो रहा है",
    "Loading audit ledger...": "ऑडिट बहीखाता लोड हो रहा है...",
    "Loading communication history...": "संचार इतिहास लोड हो रहा है...",
    "Loading emergency backups...": "आपातकालीन बैकअप लोड हो रहे हैं...",
    "Loading quarantined records...": "क्वारंटाइन रिकॉर्ड लोड हो रहे हैं...",
    "Loading updates folder records...": "अपडेट फ़ोल्डर रिकॉर्ड लोड हो रहे हैं...",
    "loading...": "लोड हो रहा है...",
    "Location": "स्थान",
    "lodge a complaint": "शिकायत दर्ज करें",
    "lodge complaint": "शिकायत दर्ज करें",
    "Log ID": "लॉग आईडी",
    "log in to emailjs": "EmailJS में लॉगिन करें",
    "log in to your janaseva account": "अपने जनसेवा खाते में लॉगिन करें।",
    "log in to your janaseva account.": "अपने जनसेवा खाते में लॉगिन करें।",
    "login": "लॉगिन",
    "login / register": "लॉगिन / पंजीकरण",
    "logout": "लॉगआउट",
    "LOW": "निम्न",
    "LOW (Minor / Informational Request)": "निम्न (मामूली / सूचना अनुरोध)",
    "LOW (Minor / Maintenance)": "निम्न (मामूली / रखरखाव)",
    "Low Priority": "कम प्राथमिकता",
    "Lowest Progress First": "न्यूनतम प्रगति पहले",
    "make an email template and copy the template id": "एक ईमेल टेम्पलेट बनाएं और टेम्पलेट आईडी कॉपी करें।",
    "make an email template and copy the template id.": "एक ईमेल टेम्पलेट बनाएं और टेम्पलेट आईडी कॉपी करें।",
    "make your village better": "अपने गांव को बेहतर बनाएं",
    "Manage Banner Image": "बैनर छवि प्रबंधित करें",
    "Manage primary cloud Firestore persistence, storage replication, disaster recovery snapshots, and export archives.": "प्राथमिक क्लाउड फायरस्टोर दृढ़ता, भंडारण प्रतिकृति, आपदा पुनर्प्राप्ति स्नैपशॉट और निर्यात अभिलेखागार प्रबंधित करें।",
    "manage the active destination email address where citizen grievances are delivered.": "सक्रिय गंतव्य ईमेल पता प्रबंधित करें जहां नागरिक शिकायतें पहुंचाई जाती हैं।",
    "Mandatory reason for audit log (e.g., Adding dedicated site inspection stage)...": "ऑडिट लॉग के लिए अनिवार्य कारण (उदा. स्थल निरीक्षण चरण जोड़ना)...",
    "Mandatory Reason for Rejection": "अस्वीकृति का अनिवार्य कारण",
    "mangaluru": "मंगलुरु",
    "Master Emergency Data Reset System": "मास्टर आपातकालीन डेटा रीसेट प्रणाली",
    "Max 10MB": "अधिकतम 10MB",
    "Message Type:": "संदेश का प्रकार:",
    "Milestone Order (1-10)": "मील का पत्थर क्रम (1-10)",
    "Minor cosmetic & routine maintenance": "मामूली और नियमित रखरखाव",
    "Missing Required Fields": "आवश्यक फ़ील्ड अनुपस्थित हैं",
    "mobile number": "मोबाइल नंबर",
    "Mobile Phone Number": "मोबाइल फोन नंबर",
    "Mode": "मोड",
    "MODE A": "मोड A",
    "MODE B": "मोड B",
    "mon - sat: 10:00 am - 5:30 pm": "सोम - शनि: सुबह 10:00 - शाम 5:30",
    "Monitor complaint allocation, active workloads, and resolution performance across all Gram Panchayats.": "सभी ग्राम पंचायतों में शिकायत आवंटन, सक्रिय कार्यभार और समाधान प्रदर्शन की निगरानी करें।",
    "Month": "माह",
    "Monthly Filing & Resolution History": "मासिक दर्ज एवं समाधान इतिहास",
    "moodbidri": "मूडबिद्री",
    "moodbidri gram panchayat": "मूडबिद्री ग्राम पंचायत",
    "Move Duplicate to Recycle Bin": "डुप्लीकेट को रीसायकल बिन में भेजें",
    "Move selected grievances to Protected Recycle Bin": "चयनित शिकायतों को सुरक्षित रीसायकल बिन में भेजें",
    "Move Selected to Recycle Bin": "चयनित को रीसायकल बिन में भेजें",
    "move to deleted history": "हटाए गए इतिहास में ले जाएं",
    "my complaint report": "मेरी शिकायत रिपोर्ट",
    "my complaint report & analytics": "मेरी शिकायत रिपोर्ट और विश्लेषण",
    "my complaints": "मेरी शिकायतें",
    "my complaints & history": "मेरी शिकायतें और इतिहास",
    "My Dashboard": "मेरा डैशबोर्ड",
    "My Grievances": "मेरी शिकायतें",
    "My Registered Grievances": "मेरी पंजीकृत शिकायतें",
    "N/A": "उपलब्ध नहीं",
    "nadugodu gp": "नाडुगोडू ग्रा.पं",
    "nadugodu gram panchayat": "नाडुगोडू ग्राम पंचायत",
    "name": "नाम",
    "need help": "सहायता चाहिए",
    "need help?": "सहायता चाहिए?",
    "Needs Response": "प्रतिक्रिया की आवश्यकता",
    "new citizen registration": "नया नागरिक पंजीकरण",
    "new complaint notification": "नई शिकायत अधिसूचना",
    "New Grievance": "नई शिकायत",
    "new led streetlights installed along main road junction. all lights verified functional": "मुख्य सड़क जंक्शन पर नई एलईडी स्ट्रीट लाइटें लगाई गईं। सभी लाइटें चालू पाई गईं।",
    "new led streetlights installed along main road junction. all lights verified functional.": "मुख्य सड़क जंक्शन पर नई एलईडी स्ट्रीट लाइटें लगाई गईं। सभी लाइटें चालू पाई गईं।",
    "new receiving email address": "नया प्राप्तकर्ता ईमेल पता",
    "new recipient:": "नया प्राप्तकर्ता:",
    "new to janaseva?": "जनसेवा पर नए हैं?",
    "Newest First": "नवीनतम पहले",
    "next expected action": "अगली अपेक्षित कार्रवाई",
    "No active emergency public hazards detected across assigned Gram Panchayats.": "आवंटित ग्राम पंचायतों में कोई सक्रिय आपातकालीन सार्वजनिक खतरा नहीं मिला।",
    "no complaint found": "कोई शिकायत नहीं मिली",
    "No complaints in current scope.": "वर्तमान दायरे में कोई शिकायत नहीं है।",
    "No Contact": "कोई संपर्क नहीं",
    "No recurring problem clusters or hotspots detected at this threshold.": "इस सीमा पर कोई बार-बार आने वाले समस्या समूह या हॉटस्पॉट नहीं मिले।",
    "no smtp passwords are exposed in client-side html or javascript.": "क्लाइंट-साइड HTML या जावास्क्रिप्ट में कोई एसएमटीपी पासवर्ड उजागर नहीं है।",
    "Non-civic / unrelated matter": "गैर-नागरिक / असंबंधित मामला",
    "None": "कोई नहीं",
    "None recorded yet.": "अभी तक कोई रिकॉर्ड नहीं।",
    "NORMAL": "सामान्य",
    "NORMAL (Standard Processing Time)": "सामान्य (मानक प्रसंस्करण समय)",
    "NORMAL OPERATIONAL": "सामान्य परिचालन",
    "Normal Priority": "सामान्य प्राथमिकता",
    "Not Started": "शुरू नहीं हुआ",
    "note": "टिप्पणी",
    "note:": "टिप्पणी:",
    "notice text...": "सूचना पाठ...",
    "Notification Logs": "सूचना लॉग",
    "office address": "कार्यालय का पता",
    "office phone": "कार्यालय फोन",
    "office timings": "कार्यालय का समय",
    "Officer Justification & Notes": "अधिकारी का औचित्य और टिप्पणियाँ",
    "OFFICIAL ADMIN RESPONSE & COMMUNICATION HISTORY": "आधिकारिक प्रशासनिक प्रतिक्रिया और संचार इतिहास",
    "OFFICIAL ADMIN RESPONSE & COMMUNICATION THREAD": "आधिकारिक प्रशासनिक प्रतिक्रिया और संचार",
    "Official communication threads and messages": "आधिकारिक संवाद थ्रेड और संदेश",
    "official contact": "आधिकारिक संपर्क",
    "official dashboard": "आधिकारिक डैशबोर्ड",
    "official email": "आधिकारिक ईमेल",
    "official government digital services • protected by role-based authorization": "आधिकारिक सरकारी डिजिटल सेवाएं • भूमिका-आधारित प्राधिकरण द्वारा सुरक्षित",
    "Official Gram Panchayat Receiver logins": "आधिकारिक ग्राम पंचायत प्राप्तकर्ता लॉगिन",
    "Official Grievance Control & Response Center": "आधिकारिक शिकायत नियंत्रण और प्रतिक्रिया केंद्र",
    "official grievance redressal": "आधिकारिक शिकायत निवारण",
    "official notes": "आधिकारिक टिप्पणी",
    "official notice / announcement": "आधिकारिक सूचना / घोषणा",
    "official notice / announcement text": "आधिकारिक सूचना / घोषणा पाठ",
    "official notice / announcement:": "आधिकारिक सूचना / घोषणा:",
    "Official Public Response (Visible to Citizen)": "आधिकारिक सार्वजनिक उत्तर (नागरिक को दृश्यमान)",
    "official receiver": "आधिकारिक प्राप्तकर्ता",
    "Official Receiver": "आधिकारिक प्राप्तकर्ता",
    "official remarks": "आधिकारिक टिप्पणी",
    "official remarks / response to citizen": "आधिकारिक टिप्पणी / नागरिक को उत्तर",
    "Official resolution velocity and work completion metrics across your filed grievances.": "आपकी दर्ज शिकायतों पर आधिकारिक समाधान गति और कार्य पूर्णता आँकड़े।",
    "Official Responses & Message History": "आधिकारिक प्रतिक्रियाएं और संदेश इतिहास",
    "Official Site Work Progress Photo:": "आधिकारिक स्थल कार्य प्रगति फ़ोटो:",
    "official update": "आधिकारिक अपडेट",
    "official updates & remarks": "आधिकारिक अपडेट और टिप्पणियां",
    "Offline Grievance Drafts": "ऑफ़लाइन शिकायत ड्राफ्ट",
    "Offline Mode": "ऑफ़लाइन मोड",
    "Offline Queue": "ऑफ़लाइन कतार",
    "Offline Synchronization": "ऑफ़लाइन सिंक्रोनाइज़ेशन",
    "Oldest First": "सबसे पुराना पहले",
    "Online": "ऑनलाइन",
    "only an authorized administrator should change these settings": "केवल अधिकृत व्यवस्थापक को ही ये सेटिंग्स बदलनी चाहिए।",
    "only an authorized administrator should change these settings.": "केवल अधिकृत व्यवस्थापक को ही ये सेटिंग्स बदलनी चाहिए।",
    "only the authenticated receiver account can view and modify these settings. administrators are barred.": "केवल प्रमाणित प्राप्तकर्ता खाता ही इन सेटिंग्स को देख और बदल सकता है। प्रशासकों को अनुमति नहीं है।",
    "Open": "खुला",
    "open camera": "कैमरा खोलें",
    "Open device camera to capture live photograph": "लाइव फ़ोटो लेने के लिए डिवाइस कैमरा खोलें",
    "Open in Full Admin Control Centre": "पूर्ण व्यवस्थापक नियंत्रण केंद्र में खोलें",
    "open live camera": "लाइव कैमरा खोलें",
    "Operation Impact": "ऑपरेशन प्रभाव",
    "Operation Mode": "संचालन मोड",
    "Operation Progress": "संचालन प्रगति",
    "Operational Data Reset": "परिचालन डेटा रीसेट",
    "Operational Grievance Data Cleanse": "परिचालन शिकायत डेटा शुद्धि",
    "Operational lifecycle cleanse. Purges grievance transactions and messages while keeping all user accounts intact.": "परिचालन जीवनचक्र शुद्धि। सभी उपयोगकर्ता खातों को सुरक्षित रखते हुए शिकायत लेनदेन और संदेश हटाता है।",
    "OPERATIONAL PURGE": "परिचालन शुद्धि",
    "Operator": "ऑपरेटर",
    "Order": "क्रम",
    "Original Submission Date": "मूल सबमिशन तिथि",
    "other": "अन्य",
    "Other administrative review required": "अन्य प्रशासनिक समीक्षा आवश्यक",
    "other civic issues": "अन्य नागरिक समस्याएं",
    "our objective": "हमारा उद्देश्य",
    "our vision": "हमारा दृष्टिकोण",
    "Out of Panchayat scope or duplicate submission.": "पंचायत के दायरे से बाहर या डुप्लीकेट प्रस्तुति।",
    "Out of scope / invalid": "दायरे से बाहर / अमान्य",
    "Outside Gram Panchayat jurisdiction": "ग्राम पंचायत अधिकार क्षेत्र से बाहर",
    "overall resolution rate:": "समग्र समाधान दर:",
    "Overdue": "अतिदेय",
    "Overdue (>7d)": "अतिदेय (>७ दिन)",
    "Overview of required physical tasks and designated field workers...": "आवश्यक भौतिक कार्यों और नामित क्षेत्रीय कर्मचारियों का विवरण...",
    "Panchayat": "पंचायत",
    "Panchayat & Category": "पंचायत एवं श्रेणी",
    "Panchayat Administrative Services": "पंचायत प्रशासनिक सेवाएं",
    "panchayat bhavan road": "पंचायत भवन मार्ग",
    "panchayat details": "पंचायत विवरण",
    "panchayat development officer": "पंचायत विकास अधिकारी",
    "panchayat development officer (pdo)": "पंचायत विकास अधिकारी (PDO)",
    "Panchayat Directory": "पंचायत निर्देशिका",
    "panchayat directory": "पंचायत डायरेक्टरी",
    "Panchayat directory and system settings": "पंचायत निर्देशिका और सिस्टम सेटिंग्स",
    "panchayat grievance receiver": "ग्राम पंचायत शिकायत प्राप्तकर्ता",
    "Panchayat Intelligence & Hotspots": "पंचायत इंटेलिजेंस और हॉटस्पॉट",
    "panchayat name": "पंचायत का नाम",
    "panchayat office": "पंचायत कार्यालय",
    "panchayat official dashboard": "पंचायत अधिकारी डैशबोर्ड",
    "panchayat official dashboard – janaseva portal": "पंचायत अधिकारी डैशबोर्ड – जनसेवा पोर्टल",
    "panchayat receiver portal": "पंचायत प्राप्तकर्ता पोर्टल",
    "Panchayat Receivers & Workload Distribution": "पंचायत प्राप्तकर्ता और कार्यभार वितरण",
    "panchayat takes timely action and updates resolution status online": "पंचायत समय पर कार्रवाई करती है और ऑनलाइन समाधान की स्थिति अपडेट करती है",
    "Panchayats exhibiting recurring problem clusters (≥ 2 incidents in category).": "बार-बार आने वाले समस्या समूहों को प्रदर्शित करने वाली पंचायतें (श्रेणी में ≥ 2 घटनाएं)।",
    "password": "पासवर्ड",
    "pdo name": "पीडीओ का नाम",
    "pending": "लंबित",
    "Pending assignment / review": "नियुक्ति / समीक्षा लंबित",
    "pending complaints": "लंबित शिकायतें",
    "Pending field team deployment.": "क्षेत्रीय टीम की तैनाती लंबित है।",
    "Pending Submissions": "लंबित सबमिशन",
    "Pending Sync": "सिंक लंबित",
    "Pending tasks before site completion...": "कार्य पूर्ण होने से पहले शेष कार्य...",
    "Permanent audit certificate logged to": "स्थायी ऑडिट प्रमाणपत्र दर्ज किया जाएगा:",
    "Permanent Database & Backup Health Center": "स्थायी डेटाबेस और बैकअप स्वास्थ्य केंद्र",
    "Permanent Deletion Authorization": "स्थायी विलोपन प्राधिकरण",
    "Permanently Delete Complaint (Admin Only)": "शिकायत स्थायी रूप से हटाएं (केवल प्रशासन)",
    "Permanently Delete Record": "रिकॉर्ड स्थायी रूप से हटाएं",
    "Personal complaint history, verified work progress tracking, chronological activity timeline, and delete management.": "व्यक्तिगत शिकायत इतिहास, सत्यापित कार्य प्रगति ट्रैकिंग, कालानुक्रमिक गतिविधि समयरेखा और विलोपन प्रबंधन।",
    "Personal grievance records associated with your verified account.": "आपके सत्यापित खाते से जुड़े व्यक्तिगत शिकायत रिकॉर्ड।",
    "Photo Captured": "फ़ोटो कैप्चर हो गया",
    "photograph of the issue": "समस्या का फोटो",
    "Phrase": "वाक्यांश",
    "portal authentication": "पोर्टल प्रमाणीकरण",
    "Portal is placed into Emergency Maintenance Mode during the purge.": "शुद्धि के दौरान पोर्टल आपातकालीन रखरखाव मोड में रहेगा।",
    "Portal Maintenance Active – Submissions Paused": "पोर्टल रखरखाव सक्रिय – सबमिशन रुके हुए हैं",
    "Portal Maintenance Mode Status:": "पोर्टल रखरखाव मोड स्थिति:",
    "portal name": "पोर्टल का नाम",
    "Potential Duplicate Grievance Review": "संभावित डुप्लीकेट शिकायत समीक्षा",
    "POTENTIAL EMERGENCY DETECTED": "संभावित आपातकाल का पता चला",
    "Pre-reset cryptographic backup repository": "प्री-रीसेट क्रिप्टोग्राफ़िक बैकअप संग्रह",
    "Pre-Reset Cryptographic Snapshot Verified & Ready": "प्री-रीसेट क्रिप्टोग्राफ़िक स्नैपशॉट सत्यापित और तैयार",
    "Preserved:": "सुरक्षित रहेगा:",
    "president": "अध्यक्ष",
    "president name": "अध्यक्ष का नाम",
    "Prevent accidental automated or single-click destruction. Please type the exact confirmation security phrase.": "आकस्मिक विलोपन रोकने के लिए कृपया सटीक सुरक्षा वाक्यांश टाइप करें।",
    "Primary Firestore": "प्राथमिक फायरस्टोर",
    "prinson dsouza": "प्रिंसन डिसूजा",
    "Print / Export Report": "रिपोर्ट प्रिंट / निर्यात करें",
    "print / save receipt": "रसीद प्रिंट / सहेजें",
    "Print Audit Trail": "ऑडिट ट्रेल प्रिंट करें",
    "Print or save PDF report": "रिपोर्ट प्रिंट करें या PDF सहेजें",
    "Print Report": "रिपोर्ट प्रिंट करें",
    "Priority": "प्राथमिकता",
    "privacy policy": "गोपनीयता नीति",
    "Privileged municipal administrative console for operational data purge, factory reset, cryptographic snapshots, and portal maintenance controls.": "परिचालन डेटा शुद्धि, फ़ैक्टरी रीसेट, क्रिप्टोग्राफ़िक स्नैपशॉट और पोर्टल रखरखाव नियंत्रण के लिए विशेष प्रशासनिक कंसोल।",
    "problem description...": "समस्या का विवरण...",
    "problem photograph": "समस्या का फोटो",
    "problems": "समस्याएं",
    "Processing step 1 of 8...": "चरण 1 / 8 संसाधित हो रहा है...",
    "Progress Stage": "प्रगति चरण",
    "Protected Grievance Recycle Bin": "सुरक्षित शिकायत रीसायकल बिन",
    "Protected Two-Step Purge Protocol": "सुरक्षित दो-चरणीय विलोपन प्रोटोकॉल",
    "provide accurate details: exact location, landmark, duration of the issue, and impact on villagers": "सटीक विवरण प्रदान करें: सटीक स्थान, पहचान चिह्न, समस्या की अवधि और ग्रामीणों पर प्रभाव",
    "provide accurate details: exact location, landmark, duration of the issue, and impact on villagers...": "सटीक विवरण प्रदान करें: सटीक स्थान, पहचान चिह्न, समस्या की अवधि और ग्रामीणों पर प्रभाव...",
    "public": "सार्वजनिक",
    "public facilities": "सार्वजनिक सुविधाएं",
    "public grievance recorded under civic amenities. inspection scheduled with ward member": "नागरिक सुविधाओं के अंतर्गत जन शिकायत दर्ज की गई। वार्ड सदस्य के साथ निरीक्षण निर्धारित है।",
    "public grievance recorded under civic amenities. inspection scheduled with ward member.": "नागरिक सुविधाओं के अंतर्गत जन शिकायत दर्ज की गई। वार्ड सदस्य के साथ निरीक्षण निर्धारित है।",
    "public key": "पब्लिक की",
    "Public Official Response (Visible to Citizen)": "सार्वजनिक आधिकारिक प्रतिक्रिया (नागरिकों को दृश्यमान)",
    "Public Works Department (PWD)": "लोक निर्माण विभाग (पीडब्ल्यूडी)",
    "Purge Status Audit Trail": "स्थिति ऑडिट ट्रेल साफ़ करें",
    "Purged:": "हटाया जाएगा:",
    "Purges registered citizen user accounts and citizen-filed grievances. Official Panchayat receivers remain active.": "पंजीकृत नागरिक खाते और उनकी शिकायतें हटाता है। आधिकारिक पंचायत प्राप्तकर्ता सक्रिय रहते हैं।",
    "purpose": "उद्देश्य",
    "puttur": "पुत्तूर",
    "puttur gram panchayat": "पुत्तूर ग्राम पंचायत",
    "Quarantine Actions": "क्वारंटाइन कार्रवाइयाँ",
    "Queued Offline Submissions": "कतारबद्ध ऑफ़लाइन सबमिशन",
    "quick fill admin": "व्यवस्थापक भरें",
    "quick fill citizen": "नागरिक भरें",
    "quick fill receiver": "प्राप्तकर्ता भरें",
    "Rate": "दर",
    "Re-Auth": "पुनः प्रमाणीकरण",
    "re-enter new email address": "नया ईमेल पता पुनः दर्ज करें",
    "re-enter your password": "अपना पासवर्ड पुनः दर्ज करें",
    "READY": "तैयार",
    "Ready to Save & Apply": "सहेजने और लागू करने के लिए तैयार",
    "Real-time inventory of operational records, audit chains, citizen profiles, and storage footprints.": "परिचालन रिकॉर्ड, ऑडिट श्रृंखला, नागरिक प्रोफ़ाइल और संग्रहण का रीयल-टाइम विवरण।",
    "real-time log of dispatched notifications, gateway statuses, and delivery audits.": "प्रेषित सूचनाओं, गेटवे स्थिति और वितरण ऑडिट का वास्तविक समय लॉग।",
    "real-time test verification": "रीयल-टाइम परीक्षण सत्यापन",
    "rear camera preferred on mobile": "मोबाइल पर रियर कैमरा बेहतर है",
    "Reason / Justification": "कारण / औचित्य",
    "reason for delay (if any)": "देरी का कारण (यदि कोई हो)",
    "Reason for Delay:": "देरी का कारण:",
    "Reason for Deletion (Optional)": "हटाने का कारण (वैकल्पिक)",
    "Reason for Reopening": "पुनः खोलने का कारण",
    "Receipt": "रसीद",
    "receive an instant email with photo and grievance details when a citizen files a complaint.": "जब कोई नागरिक शिकायत दर्ज करे तो फोटो और विवरण के साथ तुरंत ईमेल प्राप्त करें।",
    "receive confirmation when a grievance is officially marked resolved with engineer remarks.": "इंजीनियर की टिप्पणी के साथ शिकायत आधिकारिक रूप से हल होने पर पुष्टि प्राप्त करें।",
    "receive copy when complaints transition to in progress, under review, or assigned.": "प्रगति में, समीक्षाधीन या असाइन स्थिति में बदलने पर प्रति प्राप्त करें।",
    "receive status updates on your registered email": "अपने पंजीकृत ईमेल पर स्थिति अपडेट प्राप्त करें।",
    "receive status updates on your registered email.": "अपने पंजीकृत ईमेल पर स्थिति अपडेट प्राप्त करें।",
    "receiver": "प्राप्तकर्ता",
    "receiver authority rules": "प्राप्तकर्ता अधिकार नियम",
    "receiver email": "प्राप्तकर्ता ईमेल",
    "Receiver email configurations & SMTP settings": "प्राप्तकर्ता ईमेल कॉन्फ़िगरेशन और SMTP सेटिंग्स",
    "Receiver email override configurations": "प्राप्तकर्ता ईमेल ओवरराइड कॉन्फ़िगरेशन",
    "receiver email settings": "प्राप्तकर्ता ईमेल सेटिंग्स",
    "receiver email settings – janaseva portal": "प्राप्तकर्ता ईमेल सेटिंग्स – जनसेवा पोर्टल",
    "receiver gmail address": "प्राप्तकर्ता Gmail पता",
    "receiver gmail address *": "प्राप्तकर्ता Gmail पता *",
    "Receiver official account profiles": "प्राप्तकर्ता आधिकारिक खाता प्रोफ़ाइल",
    "receiver settings": "प्राप्तकर्ता सेटिंग्स",
    "receiver settings & email control": "प्राप्तकर्ता सेटिंग्स और ईमेल नियंत्रण",
    "receiver:": "प्राप्तकर्ता:",
    "RECEIVERS": "प्राप्तकर्ता",
    "Receivers & Workloads": "प्राप्तकर्ता और कार्यभार",
    "Receivers cannot permanently delete grievances. You can flag this grievance for Administrator review with an official reason (e.g. duplicate, spam, or request deletion).": "प्राप्तकर्ता शिकायतों को स्थायी रूप से नहीं हटा सकते। आप आधिकारिक कारण के साथ प्रशासक समीक्षा के लिए इसे फ़्लैग कर सकते हैं।",
    "recent complaints": "हालिया शिकायतें",
    "recent complaints (public view)": "हालिया शिकायतें (सार्वजनिक दृश्य)",
    "recipient": "प्राप्तकर्ता",
    "Recomputes & validates SHA-256 hash integrity": "SHA-256 हैश अखंडता की पुनः गणना और सत्यापन करता है",
    "Record Count": "रिकॉर्ड संख्या",
    "record gateway failure alarms if an email fails to dispatch or bounces.": "ईमेल भेजने में विफल होने या बाउंस होने पर गेटवे विफलता अलार्म रिकॉर्ड करें।",
    "Records Captured": "रिकॉर्ड संख्या",
    "Records Purged": "हटाए गए रिकॉर्ड",
    "Recovery Workflow:": "रिकवरी कार्यप्रवाह:",
    "Recurring Problem Hotspots": "बार-बार आने वाली समस्याओं के हॉटस्पॉट",
    "Recurring Public-Service Problem Patterns & Hotspots": "बार-बार होने वाली सार्वजनिक समस्याएं और हॉटस्पॉट",
    "Recycle Bin": "रीसायकल बिन",
    "refresh": "रिफ्रेश",
    "Refresh Backups": "बैकअप रीफ़्रेश करें",
    "Refresh bin": "बिन रीफ़्रेश करें",
    "Refresh Delivery Logs": "वितरण लॉग रीफ़्रेश करें",
    "Refresh Ledger": "बहीखाता रीफ़्रेश करें",
    "Refresh Live Data": "लाइव डेटा रीफ़्रेश करें",
    "Refresh Metrics": "आँकड़े रीफ़्रेश करें",
    "Refresh Scan": "स्कैन रीफ़्रेश करें",
    "Refresh updates": "अपडेट रीफ़्रेश करें",
    "register": "पंजीकरण",
    "register / login": "पंजीकरण / लॉगिन",
    "register citizen account": "नागरिक खाता पंजीकृत करें",
    "register on janaseva to submit complaints, track status, and receive updates": "शिकायत दर्ज करने, स्थिति ट्रैक करने और अपडेट पाने के लिए जनसेवा पर पंजीकरण करें।",
    "register on janaseva to submit complaints, track status, and receive updates.": "शिकायत दर्ज करने, स्थिति ट्रैक करने और अपडेट पाने के लिए जनसेवा पर पंजीकरण करें।",
    "register your account with mobile or email": "मोबाइल या ईमेल से अपना खाता बनाएं",
    "Registered citizen accounts (role: citizen)": "पंजीकृत नागरिक खाते (भूमिका: नागरिक)",
    "Registered Citizens": "पंजीकृत नागरिक",
    "Registered Citizens Register": "पंजीकृत नागरिकों का रजिस्टर",
    "registered email address": "पंजीकृत ईमेल पता",
    "Registered Gram Panchayat": "पंजीकृत ग्राम पंचायत",
    "Registered Users": "पंजीकृत उपयोगकर्ता",
    "Registration Date": "पंजीकरण तिथि",
    "registration failed. please check the information entered.": "पंजीकरण विफल रहा। कृपया दर्ज की गई जानकारी की जांच करें।",
    "Rejected": "खारिज",
    "Rejected (Out of Scope / Invalid)": "अस्वीकृत (दायरे से बाहर / अमान्य)",
    "rejected complaints": "अस्वीकृत शिकायतें",
    "remaining work": "शेष कार्य",
    "Remediation work actively underway on site.": "मौके पर सुधारात्मक कार्य सक्रिय रूप से जारी है।",
    "remember me": "मुझे याद रखें",
    "Remove": "हटाएं",
    "remove photo": "फोटो हटाएं",
    "Remove photograph": "फ़ोटोग्राफ़ हटाएं",
    "Renders as seen by Citizens and Grievance Officers": "नागरिकों और शिकायत अधिकारियों को जैसा दिखता है वैसा प्रदर्शित होता है",
    "Reopened": "पुनः खोला गया",
    "Reopened (Citizen Follow-up)": "पुनः खोला गया (नागरिक अनुवर्ती)",
    "reopened complaints": "पुनः खोली गई शिकायतें",
    "Reopened for further investigation or citizen appeal.": "आगे की जांच या नागरिक अपील के लिए पुनः खोला गया।",
    "Reopening Justification": "पुनः खोलने का औचित्य",
    "Replace Banner Image": "बैनर छवि बदलें",
    "reply to citizen": "नागरिक को उत्तर दें",
    "report issues, stay informed, and help build a cleaner, safer, and better village": "समस्याओं की रिपोर्ट करें, जागरूक रहें और स्वच्छ, सुरक्षित तथा बेहतर गांव बनाने में मदद करें।",
    "report issues, stay informed, and help build a cleaner, safer, and better village.": "समस्याओं की रिपोर्ट करें, जागरूक रहें और स्वच्छ, सुरक्षित तथा बेहतर गांव बनाने में मदद करें।",
    "report local issues in your area and get them resolved by your gram panchayat": "अपने क्षेत्र की स्थानीय समस्याओं की रिपोर्ट करें और अपनी ग्राम पंचायत द्वारा उनका समाधान पाएं।",
    "report local issues in your area and get them resolved by your gram panchayat.": "अपने क्षेत्र की स्थानीय समस्याओं की रिपोर्ट करें और अपनी ग्राम पंचायत द्वारा उनका समाधान पाएं।",
    "report local issues in your village and get them resolved by your gram panchayat": "अपने गांव की स्थानीय समस्याओं की रिपोर्ट करें और अपनी ग्राम पंचायत द्वारा उनका समाधान कराएं।",
    "report local issues in your village and get them resolved by your gram panchayat.": "अपने गांव की स्थानीय समस्याओं की रिपोर्ट करें और अपनी ग्राम पंचायत द्वारा उनका समाधान कराएं।",
    "report local issues in your village and help your gram panchayat take timely action": "अपने गांव की स्थानीय समस्याओं की रिपोर्ट करें और अपनी ग्राम पंचायत को समय पर कार्रवाई करने में मदद करें।",
    "report local issues in your village and help your gram panchayat take timely action.": "अपने गांव की स्थानीय समस्याओं की रिपोर्ट करें और अपनी ग्राम पंचायत को समय पर कार्रवाई करने में मदद करें।",
    "report village-level issues with a photo": "फोटो के साथ गांव स्तर की समस्याओं की रिपोर्ट करें।",
    "report village-level issues with a photo.": "फोटो के साथ गांव स्तर की समस्याओं की रिपोर्ट करें।",
    "report • submit • track • resolve": "रिपोर्ट करें • दर्ज करें • ट्रैक करें • समाधान पाएं",
    "report • submit • track • resolve.": "रिपोर्ट करें • दर्ज करें • ट्रैक करें • समाधान पाएं.",
    "Request Grievance Reopening": "शिकायत पुनः खोलने का अनुरोध करें",
    "Requesting camera access...": "कैमरा अनुमति का अनुरोध हो रहा है...",
    "Reset": "रीसेट",
    "Reset Citizen Data": "नागरिक डेटा रीसेट करें",
    "Reset Citizen Data (Cat C)": "नागरिक डेटा रीसेट करें (श्रेणी C)",
    "Reset Defaults": "डिफ़ॉल्ट रीसेट करें",
    "reset directory": "डायरेक्टरी रीसेट करें",
    "Reset filters": "फ़िल्टर रीसेट करें",
    "reset password": "पासवर्ड रीसेट करें",
    "Reset Receiver Data": "प्राप्तकर्ता डेटा रीसेट करें",
    "Reset Receivers (Cat D)": "प्राप्तकर्ता रीसेट करें (श्रेणी D)",
    "reset to original 12 verified panchayats": "मूल 12 सत्यापित पंचायतों पर रीसेट करें",
    "Reset to standard Gram Panchayat 8-stage schema": "मानक 8-चरणीय ग्राम पंचायत स्कीमा पर रीसेट करें",
    "Resolution Rate": "समाधान दर",
    "Resolution Remarks": "समाधान टिप्पणियाँ",
    "resolved": "समाधान हो गया",
    "Resolved & signed off": "सुलझाया और सत्यापित",
    "resolved (completed & closed)": "समाधान हो गया (पूर्ण और बंद)",
    "resolved and notified": "समाधान और सूचित",
    "resolved complaints": "सुलझाई गई शिकायतें",
    "restore": "पुनर्स्थापित करें",
    "Restore checked grievances": "चयनित शिकायतें पुनर्स्थापित करें",
    "Restore from Backup": "बैकअप से पुनर्स्थापित करें",
    "Restore Selected": "चयनित पुनर्स्थापित करें",
    "Restores receiver profiles and email configurations to standard directory defaults.": "प्राप्तकर्ता प्रोफ़ाइल और ईमेल कॉन्फ़िगरेशन को मानक डिफ़ॉल्ट पर पुनर्स्थापित करता है।",
    "retake photo": "फ़ोटो दोबारा लें",
    "Retake photograph with camera": "कैमरे से फ़ोटो दोबारा लें",
    "Return to Portal": "पोर्टल पर वापस जाएं",
    "Review": "समीक्षा करें",
    "review assigned citizen complaints, inspect uploaded photos, update progress status, and communicate official responses": "आवंटित नागरिक शिकायतों की समीक्षा करें, अपलोड किए गए फोटो का निरीक्षण करें, प्रगति स्थिति अपडेट करें और आधिकारिक प्रतिक्रिया दें।",
    "review assigned citizen complaints, inspect uploaded photos, update progress status, and communicate official responses.": "आवंटित नागरिक शिकायतों की समीक्षा करें, अपलोड किए गए फोटो का निरीक्षण करें, प्रगति स्थिति अपडेट करें और आधिकारिक प्रतिक्रिया दें।",
    "Review the precise inventory of database collections and records that will be purged.": "हटाए जाने वाले डेटाबेस संग्रहों और रिकॉर्ड की सटीक सूची की समीक्षा करें।",
    "road &": "सड़क एवं",
    "road & infrastructure": "सड़क एवं बुनियादी ढांचा",
    "road and infrastructure": "सड़क एवं बुनियादी ढांचा",
    "road damage": "सड़क क्षति",
    "Roads & Infrastructure": "सड़कें और बुनियादी ढांचा",
    "Roads & Street Infrastructure": "सड़कें और बुनियादी ढांचा",
    "Routine lifecycle cleanse. Purges grievance transactions and message logs while keeping accounts and system setup intact.": "नियमित शुद्धि। खातों और सिस्टम सेटअप को सुरक्षित रखते हुए शिकायत लेनदेन और संदेश लॉग हटाता है।",
    "Rural Water Supply & Sanitation (RWSS)": "ग्रामीण जलापूर्ति एवं स्वच्छता (आरडब्ल्यूएसएस)",
    "Safety Lock Arming in 3s...": "3 सेकंड में सुरक्षा लॉक सक्रिय हो रहा है...",
    "sanitation": "स्वच्छता",
    "Sanitation & Cleanliness": "स्वच्छता और सफाई",
    "save & add panchayat": "सहेजें और पंचायत जोड़ें",
    "Save & Apply": "सहेजें और लागू करें",
    "save changes": "परिवर्तन सहेजें",
    "save configuration": "कॉन्फ़िगरेशन सहेजें",
    "save notification preferences": "अधिसूचना प्राथमिकताएं सहेजें",
    "save panchayat": "पंचायत सहेजें",
    "save settings": "सेटिंग्स सहेजें",
    "Save Status Configuration": "स्थिति कॉन्फ़िगरेशन सहेजें",
    "save status update": "स्थिति अपडेट सहेजें",
    "School/hospital routes, prolonged outages": "स्कूल/अस्पताल मार्ग, लंबी रुकावटें",
    "Scope": "दायरा",
    "search": "खोजें",
    "search by complaint id or citizen name": "शिकायत आईडी या नागरिक के नाम से खोजें",
    "search by complaint id or email": "शिकायत आईडी या ईमेल द्वारा खोजें",
    "search by complaint id, citizen name, or category": "शिकायत आईडी, नागरिक का नाम या श्रेणी के अनुसार खोजें",
    "search by complaint id, citizen name, or category...": "शिकायत आईडी, नागरिक का नाम या श्रेणी के अनुसार खोजें...",
    "Search by Complaint ID, citizen, category, or description...": "शिकायत आईडी, नागरिक, श्रेणी या विवरण से खोजें...",
    "search by complaint id, citizen, or location": "शिकायत आईडी, नागरिक या स्थान के अनुसार खोजें",
    "search by complaint id, citizen, or location...": "शिकायत आईडी, नागरिक या स्थान के अनुसार खोजें...",
    "Search by Complaint ID, citizen, remarks, author...": "शिकायत आईडी, नागरिक, टिप्पणियों या लेखक से खोजें...",
    "Search by Complaint ID, subject, category, location, or remarks...": "शिकायत आईडी, विषय, श्रेणी, स्थान या टिप्पणियों से खोजें...",
    "search complaint": "शिकायत खोजें",
    "search complaint id or email...": "शिकायत आईडी या ईमेल खोजें...",
    "search grievances": "शिकायतें खोजें",
    "search grievances...": "शिकायतें खोजें...",
    "Search my grievances by ID, subject, or description...": "मेरी शिकायतों को आईडी, विषय या विवरण से खोजें...",
    "search panchayat name, village or area": "पंचायत का नाम, गांव या क्षेत्र खोजें",
    "search panchayat name, village or area...": "पंचायत का नाम, गांव या क्षेत्र खोजें...",
    "search panchayats": "पंचायतें खोजें",
    "secretary / pdo": "सचिव / पीडीओ",
    "secretary / pdo name": "सचिव / पीडीओ का नाम",
    "secure ssl portal": "सुरक्षित SSL पोर्टल",
    "security note": "सुरक्षा टिप्पणी",
    "Security Rules": "सुरक्षा नियम",
    "Security rules, authorization policies & deployment configs": "सुरक्षा नियम, प्राधिकरण नीतियाँ और परिनियोजन कॉन्फ़िगरेशन",
    "Select All": "सभी चुनें",
    "Select All Quarantined": "सभी क्वारंटाइन चुनें",
    "Select cryptographic pre-reset snapshot from table": "तालिका से क्रिप्टोग्राफ़िक स्नैपशॉट चुनें",
    "select district": "जिला चुनें",
    "Select New Banner Image": "नई बैनर छवि चुनें",
    "select role": "भूमिका चुनें",
    "Select Snapshot to Restore (Cat F)": "पुनर्स्थापित करने के लिए स्नैपशॉट चुनें (श्रेणी F)",
    "select which events trigger automated email delivery.": "चुनें कि कौन सी घटनाएं स्वचालित ईमेल वितरण को ट्रिगर करेंगी।",
    "select your gram panchayat": "अपनी ग्राम पंचायत चुनें",
    "Send": "भेजें",
    "Send a Reply / Follow-up to Gram Panchayat": "ग्राम पंचायत को उत्तर / अनुवर्ती भेजें",
    "Send a Reply to Panchayat Officials": "पंचायत अधिकारियों को उत्तर भेजें",
    "Send email notification to citizen": "नागरिक को ईमेल अधिसूचना भेजें",
    "send email update": "ईमेल अपडेट भेजें",
    "Send Official Response": "आधिकारिक प्रतिक्रिया भेजें",
    "Send Reply": "उत्तर भेजें",
    "send reset link": "रीसेट लिंक भेजें",
    "send test email": "टेस्ट ईमेल भेजें",
    "sent to gram panchayat": "ग्राम पंचायत को भेजी गई",
    "service id": "सर्विस आईडी",
    "Session storage and browser cached complaints": "सत्र संग्रहण और ब्राउज़र कैश की गई शिकायतें",
    "Settings": "सेटिंग्स",
    "SHA-256 Checksum": "SHA-256 चेकसम",
    "SHA-256 Hash:": "SHA-256 हैश:",
    "Share your experience with the resolution quality or timeliness...": "समाधान की गुणवत्ता या समयबद्धता पर अपना अनुभव साझा करें...",
    "show password": "पासवर्ड दिखाएं",
    "Showing 0 of 0 grievances": "0 में से 0 शिकायतें दिखाई जा रही हैं",
    "Showing real-time records filtered by selected parameters.": "चयनित मापदंडों के आधार पर वास्तविक समय के रिकॉर्ड दिखाए जा रहे हैं।",
    "sign in": "साइन इन करें",
    "sign in to portal": "पोर्टल में साइन इन करें",
    "sign in with your verified credentials to access your personalized citizen portal or official gram panchayat management dashboard": "अपने व्यक्तिगत नागरिक पोर्टल या आधिकारिक ग्राम पंचायत प्रबंधन डैशबोर्ड तक पहुंचने के लिए अपने सत्यापित क्रेडेंशियल के साथ साइन इन करें।",
    "sign in with your verified credentials to access your personalized citizen portal or official gram panchayat management dashboard.": "अपने व्यक्तिगत नागरिक पोर्टल या आधिकारिक ग्राम पंचायत प्रबंधन डैशबोर्ड तक पहुंचने के लिए अपने सत्यापित क्रेडेंशियल के साथ साइन इन करें।",
    "sign up": "साइन अप करें",
    "signing in": "साइन इन हो रहा है",
    "signing in...": "साइन इन हो रहा है...",
    "simulated": "सिम्युलेटेड",
    "Slip": "पावती पर्ची",
    "Snapshot ID": "स्नैपशॉट आईडी",
    "Soft Delete Protected:": "सॉफ़्ट डिलीट सुरक्षित:",
    "Soft-deleted grievances quarantined with zero data loss. Records can be restored or permanently purged by authorized Administrators.": "बिना डेटा हानि के क्वारंटाइन की गई हटाई गई शिकायतें। अधिकृत प्रशासक इन्हें पुनर्स्थापित या स्थायी रूप से हटा सकते हैं।",
    "Soft-Deletion Protected Storage:": "सॉफ़्ट-विलोपन सुरक्षित संग्रहण:",
    "Sort By": "क्रमबद्ध करें",
    "Spam / Non-civic / Inappropriate content": "स्पैम / गैर-नागरिक / अनुचित सामग्री",
    "Special (Rejected/Reopened)": "विशेष (अस्वीकृत/पुनः खोली गई)",
    "special announcement / public notice": "विशेष घोषणा / सार्वजनिक सूचना",
    "special notice / announcement": "विशेष सूचना / घोषणा",
    "Standalone Control Centre": "स्टैंडअलोन नियंत्रण केंद्र",
    "Standard civic grievances": "मानक नागरिक शिकायतें",
    "State": "स्थिति",
    "State official reason for rejecting this grievance...": "इस शिकायत को अस्वीकार करने का आधिकारिक कारण बताएं...",
    "status": "स्थिति",
    "Status & Workflow Rules": "स्थिति एवं कार्यप्रवाह नियम",
    "Status Display Name *": "स्थिति प्रदर्शन नाम *",
    "Status Filter": "स्थिति फ़िल्टर",
    "Status History & Messages": "स्थिति इतिहास एवं संदेश",
    "Status ID": "स्थिति आईडी",
    "status indicators": "स्थिति संकेतक",
    "Status is Active & Selectable": "स्थिति सक्रिय और चयन योग्य है",
    "Status Name & Key": "स्थिति नाम और कुंजी",
    "Status Prior Deletion": "हटाने से पहले की स्थिति",
    "Status Progression": "स्थिति प्रगति",
    "Status progression histories and official responses": "स्थिति प्रगति इतिहास और आधिकारिक उत्तर",
    "Status Transition": "स्थिति परिवर्तन",
    "stay updated": "अपडेट रहें",
    "Stop Audio": "ऑडियो बंद करें",
    "Storage Estimate": "संग्रहण अनुमान",
    "streetlight": "स्ट्रीट लाइट",
    "streetlight problems": "स्ट्रीट लाइट समस्याएं",
    "Streetlights & Electricity": "स्ट्रीटलाइट और बिजली",
    "strict receiver-only access": "सख्त प्राप्तकर्ता-केवल पहुंच",
    "Strictly Preserved Entities:": "कड़ाई से सुरक्षित घटक:",
    "Strictly Preserved:": "कड़ाई से सुरक्षित:",
    "Subcollection Records": "उप-संग्रह रिकॉर्ड",
    "Subject": "विषय",
    "Subject / Category": "विषय / श्रेणी",
    "Submit": "जमा करें",
    "submit a complaint": "शिकायत दर्ज करें",
    "submit a complaint – janaseva portal": "शिकायत दर्ज करें – जनसेवा पोर्टल",
    "submit another": "दूसरी दर्ज करें",
    "submit another complaint": "दूसरी शिकायत दर्ज करें",
    "submit complaint": "शिकायत दर्ज करें",
    "Submit Feedback": "फीडबैक सबमिट करें",
    "Submit Flag to Admin": "प्रशासन को फ़्लैग भेजें",
    "Submit Grievance": "शिकायत दर्ज करें",
    "Submit New Grievance": "नई शिकायत दर्ज करें",
    "Submit Reopening Request": "पुनः खोलने का अनुरोध सबमिट करें",
    "submitted": "दर्ज की गई",
    "Submitted & logged": "दर्ज एवं लॉग की गईं",
    "submitted (initial stage)": "दर्ज की गई (प्रारंभिक चरण)",
    "submitted date": "दर्ज करने की तिथि",
    "submitted on": "दर्ज करने की तिथि",
    "submitting complaint": "शिकायत दर्ज की जा रही है",
    "submitting complaint...": "शिकायत दर्ज की जा रही है...",
    "sullia": "सुल्लिया",
    "sullia gram panchayat": "सुल्लिया ग्राम पंचायत",
    "sunday & government holidays: closed": "रविवार और सरकारी छुट्टियां: बंद",
    "Super Admin (": "सुपर एडमिन (",
    "Super Admin UNTOUCHABLE": "सुपर एडमिन () अपरिवर्तनीय",
    "Super Administrator": "सुपर प्रशासक",
    "Super Administrator account": "सुपर प्रशासक खाता ()",
    "Switch between front and rear cameras": "फ्रंट और रियर कैमरे के बीच बदलें",
    "switch camera": "कैमरा बदलें",
    "Synced with Cloud Firestore & Local Repository": "क्लाउड फ़ायरस्टोर और स्थानीय संग्रह से सिंक किया गया",
    "Synchronized": "सिंक्रनाइज़ किया गया",
    "System Integrity Safeguards:": "सिस्टम अखंडता सुरक्षा उपाय:",
    "System Settings": "सिस्टम सेटिंग्स",
    "take action / change status": "कार्रवाई करें / स्थिति बदलें",
    "Tap microphone to speak": "बोलने के लिए माइक दबाएं",
    "target panchayat configuration": "लक्षित पंचायत कॉन्फ़िगरेशन",
    "Target Record Category": "लक्षित रिकॉर्ड श्रेणी",
    "TEMP DATA": "अस्थायी डेटा",
    "template id": "टेम्पलेट आईडी",
    "Terminal (Resolved/Closed)": "अंतिम (समाधान/बंद)",
    "terms of service": "सेवा की शर्तें",
    "Text & Icon Color": "टेक्स्ट और आइकन रंग",
    "The Grievance Submission System is temporarily paused for scheduled administrative maintenance. You may still track existing grievances.": "निर्धारित प्रशासनिक रखरखाव के लिए शिकायत सबमिशन प्रणाली अस्थायी रूप से रोकी गई है। आप मौजूदा शिकायतें ट्रैक कर सकते हैं।",
    "the issue has been addressed and marked as resolved": "समस्या का समाधान कर दिया गया है और इसे पूर्ण चिह्नित किया गया है।",
    "the issue has been addressed and marked as resolved.": "समस्या का समाधान कर दिया गया है और इसे पूर्ण चिह्नित किया गया है।",
    "the issue is being verified and necessary action is being planned": "समस्या का सत्यापन किया जा रहा है और आवश्यक कार्रवाई की योजना बनाई जा रही है।",
    "the issue is being verified and necessary action is being planned.": "समस्या का सत्यापन किया जा रहा है और आवश्यक कार्रवाई की योजना बनाई जा रही है।",
    "the panchayat has taken up the issue for action": "पंचायत ने कार्रवाई के लिए मामला हाथ में ले लिया है।",
    "the panchayat has taken up the issue for action.": "पंचायत ने कार्रवाई के लिए मामला हाथ में ले लिया है।",
    "the road inspection was completed by the panchayat engineer. material has been ordered and repair work is scheduled to begin this week": "पंचायत इंजीनियर द्वारा सड़क निरीक्षण पूरा कर लिया गया है। सामग्री का आदेश दिया गया है और इस सप्ताह मरम्मत कार्य शुरू होने वाला है।",
    "the road inspection was completed by the panchayat engineer. material has been ordered and repair work is scheduled to begin this week.": "पंचायत इंजीनियर द्वारा सड़क निरीक्षण पूरा कर लिया गया है। सामग्री का आदेश दिया गया है और इस सप्ताह मरम्मत कार्य शुरू होने वाला है।",
    "The system detected matching parameters between these two submissions (citizen, category, panchayat, or description similarity). Review both records below.": "सिस्टम ने इन दोनों शिकायतों के बीच समान मापदंड पाए हैं। नीचे दोनों रिकॉर्ड की समीक्षा करें।",
    "this gram panchayat": "यह ग्राम पंचायत",
    "This grievance will be moved to your": "यह शिकायत आपके",
    "this is the email address that will receive all citizen complaints from the website": "यह वह ईमेल पता है जो वेबसाइट से सभी नागरिक शिकायतें प्राप्त करेगा।",
    "this is the email address that will receive all citizen complaints from the website.": "यह वह ईमेल पता है जो वेबसाइट से सभी नागरिक शिकायतें प्राप्त करेगा।",
    "this portal connects rural citizens with gram panchayats. academic student project for civic grievance demonstration": "यह पोर्टल ग्रामीण नागरिकों को ग्राम पंचायतों से जोड़ता है। नागरिक शिकायत प्रदर्शन के लिए शैक्षणिक छात्र परियोजना।",
    "this portal connects rural citizens with gram panchayats. academic student project for civic grievance demonstration.": "यह पोर्टल ग्रामीण नागरिकों को ग्राम पंचायतों से जोड़ता है। नागरिक शिकायत प्रदर्शन के लिए शैक्षणिक छात्र परियोजना।",
    "this portal is an academic student project created for civic grievance demonstration. not an official government of india website": "यह पोर्टल नागरिक शिकायत प्रदर्शन के लिए बनाई गई एक शैक्षणिक छात्र परियोजना है। भारत सरकार की आधिकारिक वेबसाइट नहीं है।",
    "this portal is an academic student project created for civic grievance demonstration. not an official government of india website.": "यह पोर्टल नागरिक शिकायत प्रदर्शन के लिए बनाई गई एक शैक्षणिक छात्र परियोजना है। भारत सरकार की आधिकारिक वेबसाइट नहीं है।",
    "this record will be permanently removed from the portal and database": "यह रिकॉर्ड पोर्टल और डेटाबेस से स्थायी रूप से हटा दिया जाएगा।",
    "this record will be permanently removed from the portal and database.": "यह रिकॉर्ड पोर्टल और डेटाबेस से स्थायी रूप से हटा दिया जाएगा।",
    "Timeline Node": "समयरेखा नोड",
    "timestamp": "समय",
    "to build cleaner, safer, and better villages through citizen participation and timely action by the gram panchayat": "नागरिक भागीदारी और ग्राम पंचायत द्वारा समय पर कार्रवाई के माध्यम से स्वच्छ, सुरक्षित और बेहतर गांव बनाना।",
    "to build cleaner, safer, and better villages through citizen participation and timely action by the gram panchayat.": "नागरिक भागीदारी और ग्राम पंचायत द्वारा समय पर कार्रवाई के माध्यम से स्वच्छ, सुरक्षित और बेहतर गांव बनाना।",
    "To confirm authorization, type:": "प्राधिकरण की पुष्टि के लिए टाइप करें:",
    "To confirm permanent eradication, please type": "स्थायी रूप से हटाने की पुष्टि करने के लिए कृपया टाइप करें",
    "To Date": "अंतिम तिथि",
    "To filing date": "दाखिल करने की अंतिम तिथि",
    "To prevent unauthorized resets or session hijacking, enter your administrator password to authenticate this destructive action.": "अनधिकृत रीसेट रोकने के लिए, इस कार्रवाई को प्रमाणित करने हेतु अपना प्रशासक पासवर्ड दर्ज करें।",
    "to view the live status, resolution timeline, and official Panchayat responses.": "लाइव स्थिति, समाधान समयरेखा और आधिकारिक पंचायत उत्तर देखने के लिए।",
    "total assigned": "कुल आवंटित",
    "total complaints": "कुल शिकायतें",
    "Total Grievances": "कुल शिकायतें",
    "total panchayats": "कुल पंचायतें",
    "total panchayats: 12": "कुल पंचायतें: 12",
    "Total Size": "कुल आकार",
    "total submitted": "कुल जमा की गई",
    "Track": "ट्रैक करें",
    "track & get updates": "ट्रैक करें और अपडेट पाएं",
    "track and get updates": "ट्रैक करें और अपडेट पाएं",
    "track another complaint": "दूसरी शिकायत ट्रैक करें",
    "track complaint": "शिकायत ट्रैक करें",
    "track complaint now": "शिकायत अभी ट्रैक करें",
    "track complaint status": "शिकायत की स्थिति ट्रैक करें",
    "track complaint status – janaseva portal": "शिकायत की स्थिति ट्रैक करें – जनसेवा पोर्टल",
    "Track Grievance": "शिकायत ट्रैक करें",
    "track status": "स्थिति ट्रैक करें",
    "track this complaint": "इस शिकायत को ट्रैक करें",
    "track your complaint anytime and get real-time updates from your gram panchayat": "अपनी शिकायत को कभी भी ट्रैक करें और अपनी ग्राम पंचायत से वास्तविक समय के अपडेट प्राप्त करें।",
    "track your complaint anytime and get real-time updates from your gram panchayat.": "अपनी शिकायत को कभी भी ट्रैक करें और अपनी ग्राम पंचायत से वास्तविक समय के अपडेट प्राप्त करें।",
    "Track Your Grievance": "अपनी शिकायत ट्रैक करें",
    "Tracking Reference": "ट्रैकिंग संदर्भ",
    "Triggered By": "आरंभकर्ता",
    "Try Again": "पुनः प्रयास करें",
    "type": "प्रकार",
    "Type & Response / Remarks": "प्रकार एवं उत्तर / टिप्पणियाँ",
    "Type DELETE to confirm...": "पुष्टि के लिए DELETE टाइप करें...",
    "Type RESET JANASEVA exactly": "ठीक RESET JANASEVA टाइप करें",
    "Type your follow-up inquiry or update for the officials...": "अधिकारियों के लिए अपनी पूछताछ या अपडेट टाइप करें...",
    "Type your inquiry or update...": "अपनी पूछताछ या अपडेट टाइप करें...",
    "Type your official response or internal administrative note here...": "अपनी आधिकारिक प्रतिक्रिया या आंतरिक प्रशासनिक नोट यहां टाइप करें...",
    "udupi": "उडुपी",
    "Ujire": "उजिरे",
    "Ujire Gram Panchayat": "उजिरे ग्राम पंचायत",
    "Unable to access your device camera.": "आपके डिवाइस कैमरे तक पहुँचने में असमर्थ।",
    "Unassigned": "असाइन नहीं किया गया",
    "under review": "समीक्षाधीन",
    "under review (inspection / planning)": "समीक्षाधीन (निरीक्षण / योजना)",
    "Unique Identifier (Slug) *": "विशिष्ट पहचानकर्ता (स्लग) *",
    "Update Grievance Status & Assignment": "शिकायत की स्थिति और आवंटन अपडेट करें",
    "update recipient address": "प्राप्तकर्ता का पता अपडेट करें",
    "Update Ref / Time": "अपडेट संदर्भ / समय",
    "update status": "स्थिति अपडेट करें",
    "update status & notify citizen": "स्थिति अपडेट करें और नागरिक को सूचित करें",
    "Update Status & Save Workflow": "स्थिति अपडेट करें और सहेजें",
    "Updated": "अपडेट किया गया",
    "Updated By": "अपडेटकर्ता",
    "Updates Folder": "अपडेट फ़ोल्डर",
    "upload / replace circular file": "परिपत्र फ़ाइल अपलोड / बदलें",
    "upload issue photograph": "समस्या का फोटो अपलोड करें",
    "Upload PDF or Document Image": "पीडीएफ या दस्तावेज चित्र अपलोड करें",
    "Upload RTC pahani, address proof, or petition documents. Our AI OCR engine automatically extracts text, validates survey numbers, and checks identity consistency.": "आरटीसी पहानी, पते का प्रमाण या याचिका दस्तावेज अपलोड करें। हमारा एआई ओसीआर इंजन स्वचालित रूप से टेक्स्ट निकालता है, सर्वेक्षण संख्याओं को मान्य करता है और पहचान की स्थिरता की जांच करता है।",
    "URGENT": "अत्यावश्यक",
    "URGENT (Critical Danger / Hazard / Health Risk)": "अत्यावश्यक (गंभीर खतरा / स्वास्थ्य जोखिम)",
    "URGENT (Critical Hazard / Emergency)": "अत्यावश्यक (गंभीर खतरा / आपातकाल)",
    "Urgent / Emergency Hazards": "अति आवश्यक / आपातकालीन खतरे",
    "Urgent Hazards": "अति आवश्यक खतरे",
    "URGENT PUBLIC HAZARDS QUEUE": "अति आवश्यक सार्वजनिक खतरे",
    "Use File Upload Instead": "इसके बजाय फ़ाइल अपलोड उपयोग करें",
    "use the send test email button to test emailjs and network delivery at any time.": "किसी भी समय ईमेलजेएस और नेटवर्क वितरण का परीक्षण करने के लिए परीक्षण ईमेल भेजें बटन का उपयोग करें।",
    "use this photo": "यह फ़ोटो उपयोग करें",
    "users": "उपयोगकर्ता",
    "Verified & completed": "सत्यापित एवं पूर्ण",
    "Verified against Firebase Authentication session credentials.": "Firebase प्रमाणीकरण सत्र क्रेडेंशियल से सत्यापित।",
    "Verified backups created automatically prior to any data purge. Inspect integrity hashes, download JSON dumps, or restore system state.": "किसी भी डेटा शुद्धि से पहले स्वचालित रूप से बनाए गए सत्यापित बैकअप। हैश जांचें, JSON डाउनलोड करें या सिस्टम बहाल करें।",
    "Verified Channel": "सत्यापित चैनल",
    "Verified citizen user profiles, contact credentials, and submission history in JANASEVA.": "जनसेवा में सत्यापित नागरिक प्रोफाइल, संपर्क क्रेडेंशियल्स और सबमिशन इतिहास।",
    "Verified cryptographic backup snapshots & audit ledger": "सत्यापित क्रिप्टोग्राफ़िक बैकअप स्नैपशॉट और ऑडिट बहीखाता",
    "Verified Official Channel": "सत्यापित आधिकारिक चैनल",
    "Verified Progress:": "सत्यापित प्रगति:",
    "verified work progress": "सत्यापित कार्य प्रगति",
    "Verify Phrase & Continue →": "वाक्यांश सत्यापित करें और आगे बढ़ें →",
    "Verifying administrator security session...": "प्रशासक सुरक्षा सत्र सत्यापित हो रहा है...",
    "Verifying citizen session...": "नागरिक सुरक्षा सत्र का सत्यापन किया जा रहा है...",
    "verifying receiver credentials...": "प्राप्तकर्ता क्रेडेंशियल्स का सत्यापन हो रहा है...",
    "verifying secure session": "सुरक्षित सत्र का सत्यापन किया जा रहा है",
    "verifying secure session...": "सुरक्षित सत्र का सत्यापन किया जा रहा है...",
    "verifying security session": "सुरक्षा सत्र का सत्यापन किया जा रहा है",
    "verifying security session...": "सुरक्षा सत्र का सत्यापन किया जा रहा है...",
    "view": "देखें",
    "view details": "विवरण देखें",
    "View in Panchayat Intelligence & Hotspots": "पंचायत इंटेलिजेंस और हॉटस्पॉट में देखें",
    "View your registered grievances, track real-time resolution progress, read official responses, and download filing acknowledgements.": "अपनी पंजीकृत शिकायतों को देखें, वास्तविक समय समाधान प्रगति को ट्रैक करें, आधिकारिक प्रतिक्रियाएं पढ़ें और पावती डाउनलोड करें।",
    "village citizens and gram panchayat officials": "गांव के नागरिक और ग्राम पंचायत अधिकारी",
    "Vittal": "विट्टल",
    "Vittal Gram Panchayat": "विट्टल ग्राम पंचायत",
    "Water Supply": "जलापूर्ति",
    "water supply": "पेयजल आपूर्ति",
    "water supply issues": "पेयजल आपूर्ति समस्याएं",
    "water supply line leakage repaired near bus stand. normal pressure restored to all ward connections": "बस स्टैंड के पास पेयजल पाइप रिसाव की मरम्मत की गई है। सभी वार्डों में सामान्य दबाव बहाल कर दिया गया है।",
    "water supply line leakage repaired near bus stand. normal pressure restored to all ward connections.": "बस स्टैंड के पास पेयजल पाइप रिसाव की मरम्मत की गई है। सभी वार्डों में सामान्य दबाव बहाल कर दिया गया है।",
    "we couldn't locate any complaint with the provided id or email. please double-check your complaint id (e.g. jan-2026-xxxx) or ensure your email address matches the one used during submission": "प्रदान की गई आईडी या ईमेल से कोई शिकायत नहीं मिली। कृपया अपनी शिकायत आईडी दोबारा जांचें (उदा. JAN-2026-XXXX) या सुनिश्चित करें कि आपका ईमेल पता वही है जो सबमिशन के दौरान उपयोग किया गया था।",
    "we couldn't locate any complaint with the provided id or email. please double-check your complaint id (e.g. jan-2026-xxxx) or ensure your email address matches the one used during submission.": "प्रदान की गई आईडी या ईमेल से कोई शिकायत नहीं मिली। कृपया अपनी शिकायत आईडी दोबारा जांचें (उदा. JAN-2026-XXXX) या सुनिश्चित करें कि आपका ईमेल पता वही है जो सबमिशन के दौरान उपयोग किया गया था।",
    "welcome back": "वापसी पर स्वागत है",
    "welcome back!": "वापसी पर स्वागत है!",
    "welcome to janaseva": "जनसेवा में आपका स्वागत है",
    "What is Preserved (Untouched):": "क्या सुरक्षित रहेगा:",
    "What is Purged (Deleted):": "क्या हटाया जाएगा:",
    "When activated, new grievance submissions are halted and an official maintenance banner is displayed across the public portal.": "सक्रिय होने पर नई शिकायतें रोक दी जाती हैं और सार्वजनिक पोर्टल पर आधिकारिक रखरखाव बैनर दिखाया जाता है।",
    "when updated, all subsequent complaints filed across the portal will be dispatched exclusively to this address. an immutable audit record will be logged.": "अपडेट होने पर पोर्टल की सभी आगामी शिकायतें केवल इसी पते पर भेजी जाएंगी। एक स्थायी ऑडिट रिकॉर्ड दर्ज होगा।",
    "with server-enforced role authentication.": "में संग्रहीत हैं।",
    "work completed so far": "अब तक पूर्ण कार्य",
    "Work Description": "कार्य विवरण",
    "Work in Progress: Repair and maintenance work actively underway": "कार्य प्रगति पर: मरम्मत और रखरखाव कार्य सक्रिय रूप से जारी",
    "Work Progress": "कार्य प्रगति",
    "Work Progress Photograph (Image URL / Attachment)": "कार्य प्रगति फ़ोटोग्राफ़ (छवि URL / संलग्नक)",
    "work progress summary": "कार्य प्रगति सारांश",
    "work scope / description": "कार्य का दायरा / विवरण",
    "Workflow Category": "कार्यप्रवाह श्रेणी",
    "working hours": "कार्य समय",
    "yes, confirm & save": "हाँ, पुष्टि करें और सहेजें",
    "yes, delete": "हां, हटाएं",
    "You are initiating an emergency database reset operation. Review the intended scope below before proceeding to impact preview.": "आप आपातकालीन डेटाबेस रीसेट ऑपरेशन शुरू कर रहे हैं। आगे बढ़ने से पहले नीचे दिए गए दायरे की समीक्षा करें।",
    "You are signed in with official role permissions. Unauthorized visitors cannot access this control centre.": "आप आधिकारिक भूमिका अनुमतियों के साथ साइन इन हैं। अनधिकृत आगंतुक इस नियंत्रण केंद्र तक नहीं पहुंच सकते।",
    "you are viewing the dashboard in demonstration mode. to test the role-restricted workflow as an authenticated panchayat officer": "आप प्रदर्शन मोड में डैशबोर्ड देख रहे हैं। एक प्रमाणित पंचायत अधिकारी के रूप में भूमिका-प्रतिबंधित वर्कफ़्लो का परीक्षण करने के लिए",
    "you are viewing the dashboard in demonstration mode. to test the role-restricted workflow as an authenticated panchayat officer,": "आप प्रदर्शन मोड में डैशबोर्ड देख रहे हैं। एक प्रमाणित पंचायत अधिकारी के रूप में भूमिका-प्रतिबंधित वर्कफ़्लो का परीक्षण करने के लिए,",
    "You must explicitly check each consequence box to enable execution authorization.": "निष्पादन प्राधिकरण सक्षम करने के लिए आपको प्रत्येक बॉक्स को चुनना होगा।",
    "your complaint has been successfully received": "आपकी शिकायत सफलतापूर्वक प्राप्त हो गई है।",
    "your complaint has been successfully received.": "आपकी शिकायत सफलतापूर्वक प्राप्त हो गई है।",
    "your complaint is automatically emailed to the configured panchayat office": "आपकी शिकायत संबंधित पंचायत कार्यालय को स्वतः ईमेल कर दी जाती है",
    "your complaint is automatically forwarded to the concerned panchayat office": "आपकी शिकायत स्वचालित रूप से संबंधित पंचायत कार्यालय को भेज दी जाती है",
    "your complaint is automatically forwarded to the concerned panchayat office.": "आपकी शिकायत स्वचालित रूप से संबंधित पंचायत कार्यालय को भेज दी जाती है।",
    "your complaint matters": "आपकी शिकायत हमारे लिए महत्वपूर्ण है",
    "your email": "आपका ईमेल",
    "Your feedback helps improve Gram Panchayat public services. How satisfied are you with the resolution of": "आपकी प्रतिक्रिया ग्राम पंचायत की सार्वजनिक सेवाओं को बेहतर बनाने में मदद करती है। आप समाधान से कितने संतुष्ट हैं:",
    "your grievance has been registered with the gram panchayat. please note down your unique complaint id": "आपकी शिकायत ग्राम पंचायत में दर्ज कर ली गई है। कृपया अपनी विशिष्ट शिकायत आईडी नोट कर लें",
    "your grievance has been registered with the gram panchayat. please note down your unique complaint id:": "आपकी शिकायत ग्राम पंचायत में दर्ज कर ली गई है। कृपया अपनी विशिष्ट शिकायत आईडी नोट कर लें:",
    "{action taken}": "{कार्रवाई की गई}",
    "© 2026 Government of Karnataka. Department of Rural Development and Panchayat Raj.": "© 2026 कर्नाटक सरकार। ग्रामीण विकास एवं पंचायत राज विभाग।",
    "• digital grievance initiative": "• डिजिटल शिकायत पहल",
    "← Back": "← वापस",
    "Select Language": "भाषा चुनें",
    "Toggle Navigation": "नेविगेशन खोलें/बंद करें",
    "User Account Menu": "उपयोगकर्ता खाता मेनू",
    "Close dialog": "संवाद बंद करें",
    "Close image lightbox": "छवि व्यूअर बंद करें",
    "Close modal": "मॉडल बंद करें",
    "Filter Logs": "लॉग फ़िल्टर करें",
    "Authentication Options": "प्रमाणीकरण विकल्प",
    "Complaint Status Summary": "शिकायत स्थिति सारांश",
    "Request Reopening": "पुनः खोलने का अनुरोध करें",
    "Submit Resolution Feedback": "समाधान प्रतिक्रिया सबमिट करें",
    "Toggle password visibility": "पासवर्ड दृश्यता बदलें",
    "Toggle confirm password visibility": "पुष्टि पासवर्ड दृश्यता बदलें",
    "Assistant Language": "सहायक भाषा",
    "Logged out successfully.": "सफलतापूर्वक लॉगआउट हो गया।",
    "You have been signed out successfully.": "आप सफलतापूर्वक साइन आउट हो गए हैं।",
    "Access Denied: Receiver Settings are strictly restricted to the Grievance Receiver. Administrators and Citizens are barred.": "पहुँच अस्वीकृत: प्राप्तकर्ता सेटिंग्स केवल शिकायत प्राप्तकर्ता अधिकारी तक ही सीमित हैं।",
    "Access restricted: Administrator role required.": "पहुँच प्रतिबंधित: व्यवस्थापक भूमिका आवश्यक है।",
    "Access restricted: Gram Panchayat official role required.": "पहुँच प्रतिबंधित: ग्राम पंचायत अधिकारी भूमिका आवश्यक है।",
    "Please enter a valid name": "कृपया एक मान्य नाम दर्ज करें",
    "Profile updated successfully!": "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!",
    "Please fill in all required fields.": "कृपया सभी आवश्यक फ़ील्ड भरें।",
    "Password must be at least 6 characters.": "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।",
    "Passwords do not match.": "पासवर्ड मेल नहीं खाते।",
    "Please enter a valid email address.": "कृपया एक मान्य ईमेल पता दर्ज करें।",
    "An account with this email already exists.": "इस ईमेल पते से खाता पहले से मौजूद है।",
    "Please enter both email and password.": "कृपया ईमेल और पासवर्ड दोनों दर्ज करें।",
    "Please enter both email address and password.": "कृपया ईमेल पता और पासवर्ड दोनों दर्ज करें।",
    "No account found with this email. Please register first or check your spelling.": "इस ईमेल के साथ कोई खाता नहीं मिला। कृपया पहले पंजीकरण करें या वर्तनी जांचें।",
    "Incorrect password for Administrator account.": "व्यवस्थापक खाते के लिए गलत पासवर्ड।",
    "Incorrect password for Panchayat Official account.": "पंचायत अधिकारी खाते के लिए गलत पासवर्ड।",
    "Incorrect password for Citizen account.": "नागरिक खाते के लिए गलत पासवर्ड।",
    "Please enter your registered email address.": "कृपया अपना पंजीकृत ईमेल पता दर्ज करें।",
    "Unauthorized: Only authenticated Administrator can perform re-authentication.": "अनधिकृत: केवल प्रमाणित व्यवस्थापक ही पुनः प्रमाणीकरण कर सकते हैं।",
    "Please enter your current administrator password.": "कृपया अपना वर्तमान व्यवस्थापक पासवर्ड दर्ज करें।",
    "Invalid administrator password. Access denied.": "अमान्य व्यवस्थापक पासवर्ड। पहुँच अस्वीकृत।",
    "Invalid administrator password. Security checkpoint verification failed.": "अमान्य व्यवस्थापक पासवर्ड। सुरक्षा जांच विफल।",
    "Authentication failed. Please try again.": "प्रमाणीकरण विफल रहा। कृपया पुनः प्रयास करें।",
    "Authentication failed. Please verify your credentials.": "प्रमाणीकरण विफल रहा। कृपया अपने विवरण सत्यापित करें।",
    "No account found with this email address. Please check your spelling or register as a new citizen.": "इस ईमेल पते से कोई खाता नहीं मिला। कृपया वर्तनी जांचें या नए नागरिक के रूप में पंजीकरण करें।",
    "Incorrect password entered. Please check your password or use 'Forgot Password?' to reset it.": "गलत पासवर्ड दर्ज किया गया। कृपया पासवर्ड जांचें या रीसेट करने के लिए 'पासवर्ड भूल गए?' का उपयोग करें।",
    "Please enter a valid email address (e.g. ).": "कृपया एक मान्य ईमेल पता दर्ज करें (उदा. )।",
    "This account has been disabled by the Gram Panchayat administration.": "ग्राम पंचायत प्रशासन द्वारा इस खाते को निष्क्रिय कर दिया गया है।",
    "Access temporarily blocked due to multiple failed attempts. Please try again later or reset your password.": "कई असफल प्रयासों के कारण पहुँच अस्थायी रूप से अवरुद्ध है। कृपया बाद में प्रयास करें या पासवर्ड रीसेट करें।",
    "Network connection issue. Please check your internet connectivity.": "नेटवर्क कनेक्शन समस्या। कृपया अपनी इंटरनेट कनेक्टिविटी जांचें।",
    "An account with this email address is already registered. Please login instead.": "इस ईमेल पते से खाता पहले से पंजीकृत है। कृपया लॉगिन करें।",
    "Password is too weak. Please choose a password with at least 6 characters.": "पासवर्ड बहुत कमजोर है। कृपया कम से कम 6 अक्षरों का पासवर्ड चुनें।",
    "Authenticating...": "प्रमाणीकरण हो रहा है...",
    "Verified. Redirecting...": "सत्यापित। पुनर्निर्देशित किया जा रहा है...",
    "Creating Account...": "खाता बनाया जा रहा है...",
    "Registration successful! Welcome to JANASEVA.": "पंजीकरण सफल! जनसेवा में आपका स्वागत है।",
    "Account Created. Redirecting...": "खाता बन गया। पुनर्निर्देशित किया जा रहा है...",
    "Sending...": "भेजा जा रहा है...",
    "Update Account Profile": "खाता प्रोफ़ाइल अपडेट करें",
    "Account Profile Details": "खाता प्रोफ़ाइल विवरण",
    "Edit Profile": "प्रोफ़ाइल संपादित करें",
"edit_profile": "प्रोफ़ाइल संपादित करें",
"Citizen Grievance Portal": "नागरिक शिकायत पोर्टल",
"AI Notebook": "AI नोटबुक",
"ai_notebook": "AI नोटबुक",
"citizen_portal": "नागरिक शिकायत पोर्टल",
"Track Complaints": "शिकायतों की स्थिति ट्रैक करें",
"track_complaints": "शिकायतों की स्थिति ट्रैक करें",
"Download Android App": "एंड्रॉइड ऐप डाउनलोड करें",
"download_android_app": "एंड्रॉइड ऐप डाउनलोड करें",
"Admin Dashboard": "व्यवस्थापक डैशबोर्ड",
"admin_dashboard": "व्यवस्थापक डैशबोर्ड",
"Receiver Dashboard": "प्राप्तकर्ता डैशबोर्ड",
"receiver_dashboard": "प्राप्तकर्ता डैशबोर्ड",
"My Dashboard": "मेरा डैशबोर्ड",
"my_dashboard": "मेरा डैशबोर्ड",
    "Role": "भूमिका",
    "Citizen": "नागरिक डेमो उपयोगकर्ता",
    "System Administrator": "सिस्टम व्यवस्थापक",
    "Panchayat Officer": "पंचायत अधिकारी",
    "Verified ≤ 5MB": "सत्यापित ≤ 5MB",
    "Verified ≤ 5 MB": "सत्यापित ≤ 5 MB",
    "Uploaded File": "अपलोड की गई फ़ाइल",
    "Please select a valid JPG, PNG or WEBP image.": "कृपया एक मान्य JPG, PNG या WEBP छवि चुनें।",
    "Image size must not exceed 5 MB.": "छवि का आकार 5 MB से अधिक नहीं होना चाहिए।",
    "Failed to read image file. Please try again.": "छवि फ़ाइल पढ़ने में विफल। कृपया पुनः प्रयास करें।",
    "Your browser does not support camera access.": "आपका ब्राउज़र कैमरा एक्सेस का समर्थन नहीं करता है।",
    "Unable to capture photograph. Please try again.": "फ़ोटो कैप्चर करने में असमर्थ। कृपया पुनः प्रयास करें।",
    "No photograph captured. Please capture a photo first.": "कोई फ़ोटो कैप्चर नहीं की गई। कृपया पहले फ़ोटो लें।",
    "Photograph captured and attached successfully!": "फ़ोटो सफलतापूर्वक कैप्चर और संलग्न की गई!",
    "Please login or register to submit a grievance.": "शिकायत दर्ज करने के लिए कृपया लॉगिन या पंजीकरण करें।",
    "Please enter your full name.": "कृपया अपना पूरा नाम दर्ज करें।",
    "Please enter a valid 10-digit mobile phone number.": "कृपया एक मान्य 10 अंकों का मोबाइल फ़ोन नंबर दर्ज करें।",
    "Please enter a valid 10-digit mobile phone number (e.g. ).": "कृपया एक मान्य 10 अंकों का मोबाइल नंबर दर्ज करें (उदा. )।",
    "Please select your Gram Panchayat.": "कृपया अपनी ग्राम पंचायत चुनें।",
    "Please select a grievance category.": "कृपया शिकायत की श्रेणी चुनें।",
    "Please enter a concise grievance subject (at least 5 characters).": "कृपया संक्षिप्त शिकायत विषय दर्ज करें (कम से कम 5 अक्षर)।",
    "Please provide a detailed description (at least 15 characters).": "कृपया विस्तृत विवरण प्रदान करें (कम से कम 15 अक्षर)।",
    "Please attach an evidence photograph of the issue.": "कृपया समस्या का प्रमाण फ़ोटो संलग्न करें।",
    "Processing Grievance...": "शिकायत संसाधित की जा रही है...",
    "Saved to offline queue in IndexedDB. Will sync when online.": "IndexedDB ऑफ़लाइन कतार में सहेजा गया। ऑनलाइन होने पर सिंक हो जाएगा।",
    "No active complaint found to print receipt.": "रसीद प्रिंट करने के लिए कोई सक्रिय शिकायत नहीं मिली।",
    "Please allow popups to download/print the acknowledgement slip.": "पावती पर्ची डाउनलोड/प्रिंट करने के लिए कृपया पॉपअप की अनुमति दें।",
    "JANASEVA AI Intelligence": "जनसेवा एआई इंटेलिजेंस",
    "AI Assessment:": "एआई मूल्यांकन:",
    "Suggested Department:": "सुझाया गया विभाग:",
    "Verified Emergency Contact:": "सत्यापित आपातकालीन संपर्क:",
    "AI OCR Engine – Supporting Evidence Analysis": "एआई OCR इंजन – सहायक साक्ष्य विश्लेषण",
    "AI OCR Engine extracting text and validating document fields...": "एआई OCR इंजन टेक्स्ट निकाल रहा है और दस्तावेज़ फ़ील्ड सत्यापित कर रहा है...",
    "Document Type:": "दस्तावेज़ प्रकार:",
    "Verification Outcome:": "सत्यापन परिणाम:",
    "Verification Status:": "सत्यापन स्थिति:",
    "Missing Field Detected": "अनुपलब्ध फ़ील्ड मिला",
    "Missing Required Fields:": "अनुपलब्ध आवश्यक फ़ील्ड:",
    "Missing Info": "जानकारी अनुपलब्ध",
    "Attached for Official Review": "आधिकारिक समीक्षा के लिए संलग्न",
    "Attached (Manual Review Required - OCR Unconfigured)": "संलग्न (मैन्युअल समीक्षा आवश्यक - OCR कॉन्फ़िगर नहीं)",
    "Unreadable Document - Manual Review Required": "अपठनीय दस्तावेज़ - मैन्युअल समीक्षा आवश्यक",
    "Text Extracted (Pending Official Verification)": "टेक्स्ट निकाला गया (आधिकारिक सत्यापन लंबित)",
    "Rule-Based Keyword NLP": "नियम-आधारित कीवर्ड NLP",
    "Applicant Name:": "आवेदक का नाम:",
    "Survey / Doc No:": "सर्वे / दस्तावेज़ संख्या:",
    "Panchayat / Village:": "पंचायत / गाँव:",
    "Panchayat / Location:": "पंचायत / स्थान:",
    "Document Date:": "दस्तावेज़ तिथि:",
    "Date on Document:": "दस्तावेज़ पर तिथि:",
    "Not detected": "पहचाना नहीं गया",
    "Discrepancy": "विसंगति",
    "Remove Document": "दस्तावेज़ हटाएं",
    "Document Processing Error:": "दस्तावेज़ प्रसंस्करण त्रुटि:",
    "Supporting Document:": "सहायक दस्तावेज़:",
    "Classification:": "वर्गीकरण:",
    "Land Record / RTC": "भूमि रिकॉर्ड / आरटीसी (RTC)",
    "Identity Proof": "पहचान प्रमाण",
    "Address Proof": "पता प्रमाण",
    "Supporting Evidence": "सहायक साक्ष्य",
    "Survey Number / Hissa": "सर्वे संख्या / हिस्सा",
    "Village / Gram Panchayat": "गाँव / ग्राम पंचायत",
    "Owner / Occupant Name": "मालिक / अधिभोगी का नाम",
    "Cardholder Full Name": "कार्डधारक का पूरा नाम",
    "Unique Identification Number": "विशिष्ट पहचान संख्या",
    "Consumer / Occupant Name": "उपभोक्ता / निवासी का नाम",
    "Panchayat / Address Location": "पंचायत / पता स्थान",
    "Priority:": "प्राथमिकता:",
    "File:": "फ़ाइल:",
    "No Internet Connection:": "इंटरनेट कनेक्शन नहीं है:",
    "Your complaint draft has been safely saved in your device's IndexedDB.": "आपकी शिकायत का ड्राफ्ट आपके डिवाइस के IndexedDB में सुरक्षित रूप से सहेजा गया है।",
    "Official Citizen Grievance Acknowledgement Slip & Filing Receipt": "आधिकारिक नागरिक शिकायत पावती पर्ची और पंजीकरण रसीद",
    "Unique Grievance Tracking ID": "विशिष्ट शिकायत ट्रैकिंग आईडी",
    "Citizen Email": "नागरिक ईमेल",
    "Assigned Gram Panchayat": "नियुक्त ग्राम पंचायत",
    "Grievance Category": "शिकायत श्रेणी",
    "Grievance Subject": "शिकायत विषय",
    "AI Suggested Priority": "एआई सुझाई गई प्राथमिकता",
    "Grievance Description:": "शिकायत विवरण:",
    "This acknowledgement slip confirms that your grievance has been permanently saved to the official JANASEVA repository.": "यह पावती पर्ची पुष्टि करती है कि आपकी शिकायत आधिकारिक जनसेवा पोर्टल में स्थायी रूप से दर्ज हो गई है।",
    "To check live real-time progress, visit the online tracker with Complaint ID": "लाइव प्रगति जांचने के लिए, शिकायत आईडी के साथ ऑनलाइन ट्रैकर पर जाएं",
    "No document file provided.": "कोई दस्तावेज़ फ़ाइल प्रदान नहीं की गई।",
    "Unsupported file type. Please upload a PDF, JPG, or PNG document.": "असमर्थित फ़ाइल प्रकार। कृपया PDF, JPG, या PNG दस्तावेज़ अपलोड करें।",
    "Hazardous Live Electric Wire / Electrocution Risk": "खतरनाक जीवित बिजली का तार / करंट लगने का खतरा",
    "Public Drinking Water Contamination / Epidemic Risk": "सार्वजनिक पेयजल संदूषण / महामारी का खतरा",
    "Severe Structural Infrastructure Collapse / Road Severance": "गंभीर बुनियादी ढांचा ढहना / सड़क संपर्क टूटना",
    "Hazardous Open Pit / Deep Manhole near Pedestrian Pathway": "पैदल मार्ग के पास खतरनाक खुला गड्ढा / गहरा मैनहोल",
    "Emergency Redressal / Gram Panchayat Task Force": "आपातकालीन निवारण / ग्राम पंचायत कार्यबल",
    "Standard priority assigned for general civic grievance.": "सामान्य नागरिक शिकायत के लिए मानक प्राथमिकता निर्धारित की गई।",
    "Elevated priority due to essential public service impact or proximity to sensitive community locations (schools/hospitals).": "आवश्यक सार्वजनिक सेवा प्रभाव या संवेदनशील सामुदायिक स्थानों (स्कूल/अस्पताल) के पास होने के कारण उच्च प्राथमिकता।",
    "Low severity indicated by description. Non-disruptive civic improvement or minor maintenance.": "विवरण में कम गंभीरता दर्शाई गई। गैर-बाधाकारी नागरिक सुधार या मामूली रखरखाव।",
    "Reopen": "पुनः खोलें",
    "Restore Complaint": "शिकायत पुनर्स्थापित करें",
    "Purge": "स्थायी रूप से हटाएं",
    "Archive": "आर्काइव करें",
    "Reactivate": "पुनः सक्रिय करें",
    "OFFICIAL RESPONSE": "आधिकारिक उत्तर",
    "Official Response": "आधिकारिक उत्तर",
    "No grievances found matching your current filters": "आपके वर्तमान फ़िल्टर से मेल खाने वाली कोई शिकायत नहीं मिली",
    "Try adjusting your search or filter criteria, or file a new grievance.": "अपनी खोज या फ़िल्टर मानदंड बदलें, या नई शिकायत दर्ज करें।",
    "No deleted grievances found": "कोई हटाई गई शिकायत नहीं मिली",
    "Complaints you soft-delete from your active history will appear here for safe keeping and restoration.": "सक्रिय इतिहास से आपके द्वारा हटाई गई शिकायतें सुरक्षित पुनर्स्थापना के लिए यहाँ दिखाई देंगी।",
    "No filed complaints to visualize yet.": "प्रदर्शित करने के लिए अभी तक कोई शिकायत दर्ज नहीं है।",
    "No monthly filing history found.": "कोई मासिक शिकायत इतिहास नहीं मिला।",
    "No activity events recorded yet.": "अभी तक कोई गतिविधि दर्ज नहीं की गई है।",
    "Official & Timeline Details": "आधिकारिक एवं समयरेखा विवरण",
    "View Complaint Details, Timeline & Work Progress": "शिकायत विवरण, समयरेखा और कार्य प्रगति देखें",
    "Move to Deleted Complaints": "हटाई गई शिकायतों में भेजें",
    "Restore complaint to Active History": "सक्रिय इतिहास में शिकायत पुनर्स्थापित करें",
    "Submitted:": "दर्ज तिथि:",
    "Assigned Receiver:": "नियुक्त प्राप्तकर्ता:",
    "Last Updated:": "अंतिम अपडेट:",
    "Location:": "स्थान:",
    "Reason": "कारण",
    "Archived": "आर्काइव्ड",
    "« Prev": "« पिछला",
    "Next »": "अगला »",
    "« Previous": "« पिछला",
    "No Gram Panchayats found matching your criteria.": "आपके मानदंडों से मेल खाने वाली कोई ग्राम पंचायत नहीं मिली।",
    "Please fill in all required fields marked with *.": "कृपया * से चिह्नित सभी आवश्यक फ़ील्ड भरें।",
    "Directory exported to CSV file successfully!": "निर्देशिका सफलतापूर्वक CSV फ़ाइल में निर्यात की गई!",
    "No valid records found in file.": "फ़ाइल में कोई मान्य रिकॉर्ड नहीं मिला।",
    "Reset directory to the original 12 verified Gram Panchayats?": "निर्देशिका को मूल 12 सत्यापित ग्राम पंचायतों पर रीसेट करें?",
    "Directory reset to default 12 Gram Panchayats.": "निर्देशिका डिफ़ॉल्ट 12 ग्राम पंचायतों पर रीसेट हो गई।",
    "Notice available": "सूचना उपलब्ध है",
    "View full information": "पूरी जानकारी देखें",
    "Edit Panchayat details": "पंचायत विवरण संपादित करें",
    "Delete Panchayat": "पंचायत हटाएं",
    "Citizen name masked for privacy protection": "गोपनीयता सुरक्षा के लिए नागरिक का नाम छिपाया गया है",
    "(Protected)": "(सुरक्षित)",
    "No photo attached": "कोई फ़ोटो संलग्न नहीं",
    "Click image to zoom in/out • Press": "ज़ूम इन/आउट करने के लिए छवि पर क्लिक करें • दबाएं",
    "to close": "बंद करने के लिए",
    "Download": "डाउनलोड करें",
    "New Tab": "नया टैब",
    "Download full evidence image": "पूर्ण साक्ष्य छवि डाउनलोड करें",
    "Open in new window": "नई विंडो में खोलें",
    "Complaint Evidence Photograph": "शिकायत साक्ष्य फ़ोटोग्राफ़",
    "Will synchronize automatically when internet returns.": "इंटरनेट वापस आने पर स्वतः सिंक हो जाएगा।",
    "Install": "इंस्टॉल करें",
    "Administrator Override Options": "व्यवस्थापक ओवरराइड विकल्प",
    "-- No further transitions available --": "-- आगे कोई स्थिति परिवर्तन उपलब्ध नहीं --",
    "ADMIN ONLY": "केवल व्यवस्थापक",
    "ADMIN & RECEIVER": "व्यवस्थापक और प्राप्तकर्ता",
    "Admin Only Transition": "केवल व्यवस्थापक परिवर्तन",
    "Mandatory Remarks": "अनिवार्य टिप्पणी",
    "Optional Remarks": "वैकल्पिक टिप्पणी",
    "Evidence Required": "साक्ष्य आवश्यक",
    "Mandatory Evidence": "अनिवार्य साक्ष्य",
    "Officer Assigned": "अधिकारी नियुक्त",
    "Requires Assigned Receiver": "नियुक्त प्राप्तकर्ता आवश्यक",
    "Notify Citizen": "नागरिक को सूचित करें",
    "Trigger Notification": "अधिसूचना भेजें",
    "Displayed on Timeline Stepper": "समयरेखा स्टेपर पर प्रदर्शित",
    "Excluded from Stepper": "स्टेपर से बाहर",
    "From Stage": "चरण से",
    "None (Terminal State)": "कोई नहीं (अंतिम चरण)",
    "Terminal stage — No further status transitions permitted.": "अंतिम चरण — आगे किसी स्थिति परिवर्तन की अनुमति नहीं है।",
    "Total Assigned:": "कुल नियुक्त:",
    "Active Pending:": "सक्रिय लंबित:",
    "Resolved Grievances:": "हल की गई शिकायतें:",
    "Total Registered": "कुल पंजीकृत",
    "Overdue > 7 days": "7 दिनों से अधिक लंबित",
    "Resolution Rate:": "समाधान दर:",
    "Delete Receiver": "प्राप्तकर्ता हटाएं",
    "Delete Citizen Account": "नागरिक खाता हटाएं",
    "Delete Grievance Officer": "शिकायत अधिकारी हटाएं",
    "Delete Audit Entry": "ऑडिट प्रविष्टि हटाएं",
    "Delete Backup Snapshot": "बैकअप स्नैपशॉट हटाएं",
    "Delete Status": "स्थिति हटाएं",
    "Delete Transition Rule": "परिवर्तन नियम हटाएं",
    "Edit Grievance Details & Status": "शिकायत विवरण और स्थिति संपादित करें",
    "Edit Grievance Details, Status & Official Response": "शिकायत विवरण, स्थिति और आधिकारिक उत्तर संपादित करें",
    "Edit Status & Transition Rules": "स्थिति और परिवर्तन नियम संपादित करें",
    "Flag duplicate or spam for Admin review": "व्यवस्थापक समीक्षा के लिए डुप्लिकेट या स्पैम चिह्नित करें",
    "Move to Protected Recycle Bin": "सुरक्षित रीसायकल बिन में भेजें",
    "Restore to active complaint registry": "सक्रिय शिकायत रजिस्टर में पुनर्स्थापित करें",
    "Permanently eradicate from system": "सिस्टम से स्थायी रूप से मिटाएं",
    "Print Acknowledgement Slip": "पावती पर्ची प्रिंट करें",
    "Track Public Status": "सार्वजनिक स्थिति ट्रैक करें",
    "View Complete Update History": "पूर्ण अपडेट इतिहास देखें",
    "AI Complaint Prioritization": "एआई शिकायत प्राथमिकता निर्धारण",
    "POTENTIAL PUBLIC HAZARD DETECTED": "संभावित सार्वजनिक खतरा पाया गया",
    "Helpline:": "हेल्पलाइन:",
    "Pending Action": "लंबित कार्रवाई",
    "Updated by:": "अपडेटकर्ता:",
    "Resolution Remarks:": "समाधान टिप्पणी:",
    "Grievances Register Summary": "शिकायत रजिस्टर सारांश",
    "JANASEVA Administrative Grievance Report": "जनसेवा प्रशासनिक शिकायत रिपोर्ट",
    "JANASEVA Administrative Grievance Portal • Academic Civic Redressal Platform": "जनसेवा प्रशासनिक शिकायत पोर्टल • शैक्षणिक नागरिक निवारण मंच",
    "Official Comprehensive Administrative Grievance Register & Status Audit": "आधिकारिक व्यापक प्रशासनिक शिकायत रजिस्टर और स्थिति ऑडिट",
    "Official Grievance Registration & Administrative Status Slip": "आधिकारिक शिकायत पंजीकरण और प्रशासनिक स्थिति पर्ची",
    "Electronic Record • Signature Not Required": "इलेक्ट्रॉनिक रिकॉर्ड • हस्ताक्षर आवश्यक नहीं",
    "Generated On:": "निर्मित तिथि:",
    "Generated via JANASEVA Receiver Control Centre": "जनसेवा प्राप्तकर्ता नियंत्रण केंद्र के माध्यम से निर्मित",
    "| Operator:": "| ऑपरेटर:",
    "No": "नहीं",
    "Filtering updates...": "अपडेट फ़िल्टर किए जा रहे हैं...",
    "Retrieving quarantined records...": "क्वारंटाइन रिकॉर्ड प्राप्त किए जा रहे हैं...",
    "No registered citizens found in users collection.": "उपयोगकर्ता संग्रह में कोई पंजीकृत नागरिक नहीं मिला।",
    "No administrative audit entries logged yet.": "अभी तक कोई प्रशासनिक ऑडिट प्रविष्टि दर्ज नहीं की गई है।",
    "No backup snapshots recorded yet.": "अभी तक कोई बैकअप स्नैपशॉट दर्ज नहीं किया गया है।",
    "No complaint updates found matching the criteria.": "मानदंडों से मेल खाने वाले कोई शिकायत अपडेट नहीं मिले।",
    "Try choosing another folder or adjusting the search term.": "अन्य फ़ोल्डर चुनें या खोज शब्द समायोजित करें।",
    "No grievances are currently in quarantine.": "वर्तमान में कोई शिकायत क्वारंटाइन में नहीं है।",
    "The Protected Recycle Bin is empty.": "सुरक्षित रीसायकल बिन खाली है।",
    "No grievances match the selected criteria.": "चयनित मानदंडों से कोई शिकायत मेल नहीं खाती।",
    "Try adjusting the filter pills or search terms.": "फ़िल्टर या खोज शब्द समायोजित करने का प्रयास करें।",
    "No statuses configured.": "कोई स्थिति कॉन्फ़िगर नहीं की गई।",
    "No active statuses defined.": "कोई सक्रिय स्थिति परिभाषित नहीं की गई।",
    "No status management modifications recorded yet.": "अभी तक कोई स्थिति प्रबंधन संशोधन दर्ज नहीं किया गया है।",
    "No other statuses available.": "कोई अन्य स्थिति उपलब्ध नहीं है।",
    "[Approved by Officer]": "[अधिकारी द्वारा स्वीकृत]",
    "[Flagged for Field Inquiry]": "[फ़ील्ड जांच के लिए चिह्नित]",
    "[Pending Official Review]": "[आधिकारिक समीक्षा लंबित]",
    "[Approved by Gram Panchayat Officer]": "[ग्राम पंचायत अधिकारी द्वारा स्वीकृत]",
    "[Flagged for Field Verification]": "[फ़ील्ड सत्यापन के लिए चिह्नित]",
    "[Pending Official Verification]": "[आधिकारिक सत्यापन लंबित]",
    "New Complaint Notice": "नई शिकायत सूचना",
    "Citizen Acknowledgment": "नागरिक पावती",
    "Complaint Resolution": "शिकायत समाधान",
    "System Verification Test": "सिस्टम सत्यापन परीक्षण",
    "Log ID:": "लॉग आईडी:",
    "Complaint Ref:": "शिकायत संदर्भ:",
    "Recipient:": "प्राप्तकर्ता:",
    "Email Type:": "ईमेल प्रकार:",
    "Timestamp:": "समय चिह्न:",
    "Gateway Failure Reason:": "गेटवे विफलता कारण:",
    "Transmission Successful:": "प्रेषण सफल:",
    "The notification payload was accepted by the configured delivery pipeline for immediate dispatch.": "तत्काल प्रेषण के लिए कॉन्फ़िगर किए गए डिलीवरी सिस्टम द्वारा सूचना स्वीकार कर ली गई है।",
    "Inspect Transmission Details": "प्रेषण विवरण देखें",
    "Delete Transmission Log": "प्रेषण लॉग हटाएं",
    "Loading delivery audit history...": "वितरण ऑडिट इतिहास लोड हो रहा है...",
    "Could not load logs:": "लॉग लोड नहीं हो सके:",
    "No email delivery logs match the selected filter.": "चयनित फ़िल्टर से कोई ईमेल वितरण लॉग मेल नहीं खाता।",
    "Authorized & Active": "अधिकृत और सक्रिय",
    "Warning loading settings from cloud.": "क्लाउड से सेटिंग्स लोड करने में चेतावनी।",
    "Please enter a new complaint recipient email address.": "कृपया नया शिकायत प्राप्तकर्ता ईमेल पता दर्ज करें।",
    "Invalid email format. Please check the address entered.": "अमान्य ईमेल प्रारूप। कृपया दर्ज किया गया पता जांचें।",
    "The confirmation email address does not match. Please verify.": "पुष्टि ईमेल पता मेल नहीं खाता। कृपया सत्यापित करें।",
    "The specified email is already the active recipient.": "निर्दिष्ट ईमेल पहले से ही सक्रिय प्राप्तकर्ता है।",
    "Saving to Cloud...": "क्लाउड में सहेजा जा रहा है...",
    "Please provide EmailJS Public Key, Service ID, and Template ID.": "कृपया EmailJS Public Key, Service ID, और Template ID प्रदान करें।",
    "Saving...": "सहेजा जा रहा है...",
    "Email delivery configuration saved securely to Cloud Firestore.": "ईमेल वितरण कॉन्फ़िगरेशन क्लाउड फ़ायरस्टोर में सुरक्षित रूप से सहेजा गया।",
    "Saving Preferences...": "प्राथमिकताएं सहेजी जा रही हैं...",
    "Notification preferences updated successfully.": "अधिसूचना प्राथमिकताएं सफलतापूर्वक अपडेट की गईं।",
    "Email delivery log entry deleted.": "ईमेल वितरण लॉग प्रविष्टि हटाई गई।",
    "All email delivery logs cleared.": "सभी ईमेल वितरण लॉग साफ़ किए गए।",
    "Please enter a valid receiver email address before testing.": "परीक्षण करने से पहले कृपया एक मान्य प्राप्तकर्ता ईमेल पता दर्ज करें।",
    "Access Denied: Administrator Only": "पहुँच अस्वीकृत: केवल व्यवस्थापक",
    "Banner Image Management is strictly restricted to authenticated System Administrators. Your current role does not have authorization to view or configure banner assets.": "बैनर छवि प्रबंधन केवल प्रमाणित सिस्टम व्यवस्थापकों तक ही सीमित है।",
    "CUSTOM BANNER ACTIVE": "कस्टम बैनर सक्रिय",
    "DEFAULT BANNER ACTIVE": "डिफ़ॉल्ट बैनर सक्रिय",
    "Upload, preview, replace, and manage the official background banner image displayed in the Admin Control Centre header.": "व्यवस्थापक नियंत्रण केंद्र हेडर में प्रदर्शित आधिकारिक पृष्ठभूमि बैनर छवि को अपलोड, पूर्वावलोकन और प्रबंधित करें।",
    "Live Banner Display Preview": "लाइव बैनर प्रदर्शन पूर्वावलोकन",
    "Demonstrates how the banner appears with the gradient overlay, shield emblem, title, and tricolour separator.": "दिखाता है कि ग्रेडिएंट ओवरले, ढाल चिह्न, शीर्षक और तिरंगे विभाजक के साथ बैनर कैसा दिखता है।",
    "Centralized grievance management, citizen register, official response dispatch, and workload monitoring.": "केंद्रीकृत शिकायत प्रबंधन, नागरिक पंजीकरण, आधिकारिक उत्तर प्रेषण और कार्यभार निगरानी।",
    "Banner Specification & Status": "बैनर विनिर्देश और स्थिति",
    "Active Mode:": "सक्रिय मोड:",
    "Filename:": "फ़ाइल का नाम:",
    "File Size:": "फ़ाइल आकार:",
    "Last Updated Date:": "अंतिम अपडेट तिथि:",
    "Uploaded By:": "अपलोडकर्ता:",
    "Storage Location:": "संग्रहण स्थान:",
    "Upload & Action Centre": "अपलोड एवं कार्रवाई केंद्र",
    "Select high-resolution image from your device.": "अपने डिवाइस से उच्च-रिज़ॉल्यूशन वाली छवि चुनें।",
    "Choose Banner Image": "बैनर छवि चुनें",
    "Click to browse or drag & drop from computer or mobile": "कंप्यूटर या मोबाइल से ब्राउज़ करने के लिए क्लिक करें या ड्रैग एंड ड्रॉप करें",
    "Max 10 MB": "अधिकतम 10 MB",
    "Landscape Recommended": "लैंडस्केप अनुशंसित",
    "Verified Valid Format & Size": "मान्य प्रारूप और आकार सत्यापित",
    "Uploading to Secure Storage...": "सुरक्षित संग्रहण में अपलोड हो रहा है...",
    "Save & Apply Banner": "बैनर सहेजें और लागू करें",
    "Cancel Selection": "चयन रद्द करें",
    "Delete Custom Banner and Restore Default": "कस्टम बैनर हटाएं और डिफ़ॉल्ट पुनर्स्थापित करें",
    "Desktop Screen (Full)": "डेस्कटॉप स्क्रीन (पूर्ण)",
    "Tablet Screen (Medium)": "टैबलेट स्क्रीन (मध्यम)",
    "Security & Compliance Policy:": "सुरक्षा एवं अनुपालन नीति:",
    "Only administrators can modify this banner. Uploaded imagery is validated against rigid MIME type signatures to prevent script injection. Large binary files are stored in dedicated cloud storage rather than bloating core transactional database ledgers.": "केवल व्यवस्थापक ही इस बैनर को बदल सकते हैं। स्क्रिप्ट इंजेक्शन रोकने के लिए अपलोड की गई छवि की कठोर MIME प्रकार से जांच की जाती है।",
    "Please select an image file to save.": "सहेजने के लिए कृपया एक छवि फ़ाइल चुनें।",
    "Saving Banner...": "बैनर सहेजा जा रहा है...",
    "Banner image replaced successfully!": "बैनर छवि सफलतापूर्वक बदली गई!",
    "Banner image uploaded successfully!": "बैनर छवि सफलतापूर्वक अपलोड की गई!",
    "Banner image updated successfully!": "बैनर छवि सफलतापूर्वक अपडेट की गई!",
    "No custom banner is currently active to delete.": "हटाने के लिए वर्तमान में कोई कस्टम बैनर सक्रिय नहीं है।",
    "Custom banner deleted. Reverted to default Gram Panchayat design.": "कस्टम बैनर हटाया गया। डिफ़ॉल्ट ग्राम पंचायत डिज़ाइन पर वापस लाया गया।",
    "Banner deleted successfully.": "बैनर सफलतापूर्वक हटाया गया।",
    "Access Denied: Emergency Control Centre requires Administrator privileges.": "पहुँच अस्वीकृत: आपातकालीन नियंत्रण केंद्र के लिए व्यवस्थापक अधिकार आवश्यक हैं।",
    "ACTIVE (SUBMISSIONS PAUSED)": "सक्रिय (शिकायत पंजीकरण रुका है)",
    "System data was reset from Administrator Control Centre.": "व्यवस्थापक नियंत्रण केंद्र से सिस्टम डेटा रीसेट किया गया।",
    "Access Denied: Only Administrator accounts can launch Emergency Reset.": "पहुँच अस्वीकृत: केवल व्यवस्थापक खाते ही आपातकालीन रीसेट शुरू कर सकते हैं।",
    "Please create and verify the pre-reset backup snapshot before proceeding.": "आगे बढ़ने से पहले कृपया प्री-रीसेट बैकअप स्नैपशॉट बनाएं और सत्यापित करें।",
    "Please enter your administrator password to re-authenticate.": "पुनः प्रमाणीकरण के लिए कृपया अपना व्यवस्थापक पासवर्ड दर्ज करें।",
    "Incorrect password.": "गलत पासवर्ड।",
    "Security checkpoint failed! You must type exactly 'RESET JANASEVA'.": "सुरक्षा जांच विफल! आपको बिल्कुल 'RESET JANASEVA' टाइप करना होगा।",
    "Please acknowledge all three safety and consequence check items to proceed.": "आगे बढ़ने के लिए कृपया तीनों सुरक्षा और परिणाम जांच बिंदुओं को स्वीकार करें।",
    "Generating pre-reset cryptographic snapshot backup and computing SHA-256 hash...": "प्री-रीसेट क्रिप्टोग्राफ़िक स्नैपशॉट बैकअप बनाया जा रहा है और SHA-256 हैश की गणना की जा रही है...",
    "Phrase matches perfectly.": "वाक्यांश बिल्कुल मेल खाता है।",
    "Type": "टाइप करें",
    "exactly.": "बिल्कुल सही।",
    "EXECUTE EMERGENCY DATA RESET NOW": "आपातकालीन डेटा रीसेट अभी निष्पादित करें",
    "Reset Completed Successfully!": "रीसेट सफलतापूर्वक पूरा हुआ!",
    "Emergency Data Reset completed successfully.": "आपातकालीन डेटा रीसेट सफलतापूर्वक पूरा हुआ।",
    "Reset Aborted with Error": "त्रुटि के साथ रीसेट रद्द हुआ",
    "An error occurred during reset.": "रीसेट के दौरान एक त्रुटि हुई।",
    "Close Console": "कंसोल बंद करें",
    "No pre-reset backup snapshots available yet.": "अभी तक कोई प्री-रीसेट बैकअप स्नैपशॉट उपलब्ध नहीं है।",
    "Restoration in progress. Verifying checksum and writing records...": "पुनर्स्थापना प्रगति पर है। चेकसम सत्यापित किया जा रहा है और रिकॉर्ड लिखे जा रहे हैं...",
    "Unauthorized: Only Administrator can delete backups.": "अनधिकृत: केवल व्यवस्थापक ही बैकअप हटा सकते हैं।",
    "All emergency reset audit logs have been successfully cleared.": "सभी आपातकालीन रीसेट ऑडिट लॉग सफलतापूर्वक साफ़ कर दिए गए हैं।",
    "No emergency reset audit logs recorded yet. Ledger is clean.": "अभी तक कोई आपातकालीन रीसेट ऑडिट लॉग दर्ज नहीं किया गया है। लेजर साफ़ है।",
    "Citizen Grievances & Attachments": "नागरिक शिकायतें एवं संलग्नक",
    "Status Histories & Review Notes": "स्थिति इतिहास एवं समीक्षा टिप्पणियाँ",
    "Email & WhatsApp Notifications": "ईमेल एवं व्हाट्सएप अधिसूचनाएं",
    "Registered Citizen Accounts": "पंजीकृत नागरिक खाते",
    "Gram Panchayat Official Receivers": "ग्राम पंचायत आधिकारिक प्राप्तकर्ता",
    "Super Admin Account": "सुपर एडमिन खाता",
    "IndexedDB Offline Submission Queue": "IndexedDB ऑफ़लाइन सबमिशन कतार",
    "WIPED": "मिटाया गया",
    "PRESERVED": "सुरक्षित",
    "PRESERVED ALWAYS": "सदैव सुरक्षित",
    "FLUSHED": "साफ़ किया गया",
    "VERIFIED": "सत्यापित",
    "Download JSON Snapshot": "JSON स्नैपशॉट डाउनलोड करें",
    "Restore this Snapshot": "इस स्नैपशॉट को पुनर्स्थापित करें",
    "Permanently Delete Snapshot": "स्नैपशॉट स्थायी रूप से हटाएं",
    "Delete Log Entry": "लॉग प्रविष्टि हटाएं",
    "CATEGORY A – CLEAR TEMP DATA": "श्रेणी A – अस्थायी डेटा साफ़ करें",
    "Flush Temporary Caches & Delivery Logs": "अस्थायी कैश और डिलीवरी लॉग साफ़ करें",
    "Clears offline IndexedDB draft queues, session storage, and email/WhatsApp logs. All citizen grievances and user profiles remain untouched.": "ऑफ़लाइन IndexedDB ड्राफ्ट कतार, सेशन स्टोरेज और ईमेल/व्हाट्सएप लॉग साफ़ करता है। सभी नागरिक शिकायतें और प्रोफ़ाइल सुरक्षित रहते हैं।",
    "CATEGORY B – GRIEVANCE RECORDS RESET": "श्रेणी B – शिकायत रिकॉर्ड रीसेट",
    "CATEGORY B – OPERATIONAL RESET": "श्रेणी B – संचालन रीसेट",
    "Purges complaints, review timelines, official responses, and delivery logs while preserving all user account profiles and settings.": "सभी उपयोगकर्ता प्रोफ़ाइल और सेटिंग्स को सुरक्षित रखते हुए शिकायतें, समयरेखा, आधिकारिक उत्तर और डिलीवरी लॉग साफ़ करता है।",
    "Purges complaints, review timelines, chat messages and offline queues while preserving all administrator, receiver, and citizen user profiles.": "सभी व्यवस्थापक, प्राप्तकर्ता और नागरिक प्रोफ़ाइल सुरक्षित रखते हुए शिकायतें, समयरेखा, चैट संदेश और ऑफ़लाइन कतार साफ़ करता है।",
    "CATEGORY C – CITIZEN REGISTRY RESET": "श्रेणी C – नागरिक पंजीकरण रीसेट",
    "Reset Citizen Accounts & Registrations": "नागरिक खाते और पंजीकरण रीसेट करें",
    "Purges citizen user registrations and their grievances. Gram Panchayat receivers and Administrator remain active.": "नागरिक उपयोगकर्ता पंजीकरण और उनकी शिकायतें हटाता है। ग्राम पंचायत प्राप्तकर्ता और व्यवस्थापक सक्रिय रहते हैं।",
    "CATEGORY D – RECEIVER DATA RESET": "श्रेणी D – प्राप्तकर्ता डेटा रीसेट",
    "Reset Receiver Settings & Delivery Profiles": "प्राप्तकर्ता सेटिंग्स और डिलीवरी प्रोफ़ाइल रीसेट करें",
    "Restores receiver profile configurations and email delivery settings to system defaults. Citizen complaints and citizen accounts remain intact.": "प्राप्तकर्ता प्रोफ़ाइल और ईमेल वितरण सेटिंग्स को डिफ़ॉल्ट पर पुनर्स्थापित करता है। नागरिक शिकायतें और खाते सुरक्षित रहते हैं।",
    "CATEGORY E – COMPLETE FACTORY RESET": "श्रेणी E – पूर्ण फ़ैक्टरी रीसेट",
    "Complete system factory reset. Purges all operational data and citizen registrations. Super Admin account is strictly preserved.": "पूर्ण सिस्टम फ़ैक्टरी रीसेट। सभी संचालन डेटा और नागरिक पंजीकरण हटाता है। सुपर एडमिन () सदैव सुरक्षित रहता है।",
    "Complete System Baseline Reset": "पूर्ण सिस्टम बेसलाइन रीसेट",
    "Purges all complaints, notifications, and citizen registrations for fresh deployment baseline. Strictly preserves Super Admin account.": "नई तैनाती के लिए सभी शिकायतें, अधिसूचनाएं और नागरिक पंजीकरण हटाता है। सुपर एडमिन () सदैव सुरक्षित रहता है।",
    "Please type your reply before sending.": "भेजने से पहले कृपया अपना उत्तर लिखें।",
    "Your reply has been sent to the Gram Panchayat desk.": "आपका उत्तर ग्राम पंचायत डेस्क पर भेज दिया गया है।",
    "Complaint record not found.": "शिकायत रिकॉर्ड नहीं मिला।",
    "Receipt generator is still loading. Please try again in a moment.": "रसीद जनरेटर अभी लोड हो रहा है। कृपया कुछ क्षण बाद पुनः प्रयास करें।",
    "Moving...": "स्थानांतरित हो रहा है...",
    "Move to Deleted History": "हटाए गए इतिहास में भेजें",
    "Thank you! Your feedback has been recorded.": "धन्यवाद! आपकी प्रतिक्रिया दर्ज कर ली गई है।",
    "Please provide a detailed explanation for reopening (at least 10 characters).": "पुनः खोलने के लिए कृपया विस्तृत कारण बताएं (कम से कम 10 अक्षर)।",
    "Please type your reply or inquiry before sending.": "भेजने से पहले कृपया अपना उत्तर या प्रश्न लिखें।",
    "Please sign in to post a follow-up reply.": "उत्तर पोस्ट करने के लिए कृपया साइन इन करें।",
    "Your reply has been submitted to the Gram Panchayat desk.": "आपका उत्तर ग्राम पंचायत डेस्क पर जमा कर दिया गया है।",
    "Please enter a Complaint ID or Email to search.": "खोजने के लिए कृपया शिकायत आईडी या ईमेल दर्ज करें।",
    "To search by email, please log in with your verified account.": "ईमेल से खोजने के लिए कृपया अपने सत्यापित खाते से लॉगिन करें।",
    "Access Denied: You can only query grievances registered to your verified account.": "पहुँच अस्वीकृत: आप केवल अपने सत्यापित खाते से जुड़ी शिकायतों की जांच कर सकते हैं।",
    "Unauthorized: Official privileges required to edit complaint status.": "अनधिकृत: शिकायत की स्थिति संपादित करने के लिए आधिकारिक अधिकार आवश्यक हैं।",
    "Unauthorized: Only officials can update grievance status.": "अनधिकृत: केवल अधिकारी ही शिकायत स्थिति अपडेट कर सकते हैं।",
    "Unauthorized: Only System Administrators can delete complaints.": "अनधिकृत: केवल सिस्टम व्यवस्थापक ही शिकायतें हटा सकते हैं।",
    "No update records available to export": "निर्यात करने के लिए कोई अपडेट रिकॉर्ड उपलब्ध नहीं है",
    "No complaints available to export": "निर्यात करने के लिए कोई शिकायत उपलब्ध नहीं है",
    "Popup blocker prevented print view. Please allow popups.": "पॉपअप ब्लॉकर ने प्रिंट दृश्य को रोक दिया। कृपया पॉपअप की अनुमति दें।",
    "Dispatching...": "भेजा जा रहा है...",
    "Updating Lifecycle...": "जीवनचक्र अपडेट हो रहा है...",
    "Please enter an official response or internal note.": "कृपया आधिकारिक उत्तर या आंतरिक टिप्पणी दर्ज करें।",
    "Please provide a mandatory reason for rejecting this grievance.": "इस शिकायत को अस्वीकार करने के लिए कृपया अनिवार्य कारण बताएं।",
    "Please provide justification for reopening this grievance.": "इस शिकायत को पुनः खोलने के लिए कृपया औचित्य प्रदान करें।",
    "No records available to export.": "निर्यात करने के लिए कोई रिकॉर्ड उपलब्ध नहीं है।",
    "Excel/CSV grievance register downloaded successfully!": "एक्सेल/CSV शिकायत रजिस्टर सफलतापूर्वक डाउनलोड हो गया!",
    "Dashboard synchronized with permanent database.": "डैशबोर्ड स्थायी डेटाबेस के साथ सिंक हो गया।",
    "Panchayat Intelligence & Hotspot scan refreshed successfully.": "पंचायत इंटेलिजेंस और हॉटस्पॉट स्कैन सफलतापूर्वक रीफ़्रेश हुआ।",
    "Intelligence report exported successfully.": "इंटेलिजेंस रिपोर्ट सफलतापूर्वक निर्यात की गई।",
    "Status Name and Identifier are mandatory.": "स्थिति का नाम और पहचानकर्ता अनिवार्य हैं।",
    "Administrative Change Justification is required for the audit log.": "ऑडिट लॉग के लिए प्रशासनिक परिवर्तन औचित्य आवश्यक है।",
    "Saving Status...": "स्थिति सहेजी जा रही है...",
    "No updates to export.": "निर्यात करने के लिए कोई अपडेट नहीं है।",
    "Unauthorized: Admin privilege required to manage audit records.": "अनधिकृत: ऑडिट रिकॉर्ड प्रबंधित करने के लिए व्यवस्थापक अधिकार आवश्यक हैं।",
    "Status audit record deleted successfully.": "स्थिति ऑडिट रिकॉर्ड सफलतापूर्वक हटाया गया।",
    "Unauthorized: Admin privilege required to clear audit records.": "अनधिकृत: ऑडिट रिकॉर्ड साफ़ करने के लिए व्यवस्थापक अधिकार आवश्यक हैं।",
    "Status management audit trail cleared successfully.": "स्थिति प्रबंधन ऑडिट ट्रेल सफलतापूर्वक साफ़ किया गया।",
    "Official Gram Panchayat 8-stage schema successfully restored!": "आधिकारिक ग्राम पंचायत 8-चरणीय स्कीमा सफलतापूर्वक पुनर्स्थापित किया गया!",
    "Unauthorized: Only Administrators can restore quarantined grievances.": "अनधिकृत: केवल व्यवस्थापक ही क्वारंटाइन शिकायतें पुनर्स्थापित कर सकते हैं।",
    "Storage Manager is unavailable. Cannot restore grievance.": "स्टोरेज मैनेजर अनुपलब्ध है। शिकायत पुनर्स्थापित नहीं की जा सकती।",
    "Unauthorized: Only Administrators can permanently purge records.": "अनधिकृत: केवल व्यवस्थापक ही रिकॉर्ड स्थायी रूप से हटा सकते हैं।",
    "Please type DELETE to authorize permanent destruction.": "स्थायी विनाश को अधिकृत करने के लिए कृपया DELETE टाइप करें।",
    "Unauthorized: Only Administrators can empty the Recycle Bin.": "अनधिकृत: केवल व्यवस्थापक ही रीसायकल बिन खाली कर सकते हैं।",
    "Recycle Bin is already empty.": "रीसायकल बिन पहले से ही खाली है।",
    "Action cancelled: authorization code did not match.": "कार्रवाई रद्द: प्राधिकरण कोड मेल नहीं खाया।",
    "Protected Recycle Bin emptied successfully.": "सुरक्षित रीसायकल बिन सफलतापूर्वक खाली किया गया।",
    "Unauthorized: Only Administrators can bulk delete records.": "अनधिकृत: केवल व्यवस्थापक ही एक साथ रिकॉर्ड हटा सकते हैं।",
    "Unauthorized: Only Administrators can restore quarantined records.": "अनधिकृत: केवल व्यवस्थापक ही क्वारंटाइन रिकॉर्ड पुनर्स्थापित कर सकते हैं।",
    "Please check at least one quarantined grievance to restore.": "पुनर्स्थापित करने के लिए कृपया कम से कम एक क्वारंटाइन शिकायत चुनें।",
    "Storage Manager is unavailable. Cannot restore selected grievances.": "स्टोरेज मैनेजर अनुपलब्ध है। चयनित शिकायतें पुनर्स्थापित नहीं की जा सकतीं।",
    "Please provide officer justification notes for Administrator review.": "कृपया व्यवस्थापक समीक्षा के लिए अधिकारी औचित्य टिप्पणी प्रदान करें।",
    "Access Denied: Complaint Status Management is restricted to Administrators only.": "पहुँच अस्वीकृत: शिकायत स्थिति प्रबंधन केवल व्यवस्थापकों तक सीमित है।",
    "Access Denied: Emergency Data Reset is strictly restricted to Administrators only.": "पहुँच अस्वीकृत: आपातकालीन डेटा रीसेट केवल व्यवस्थापकों तक सीमित है।",
    "Access Denied: Banner Image Management is strictly restricted to Administrators only.": "पहुँच अस्वीकृत: बैनर छवि प्रबंधन केवल व्यवस्थापकों तक सीमित है।",
    "Access Denied: Protected Recycle Bin is restricted to Administrators only.": "पहुँच अस्वीकृत: सुरक्षित रीसायकल बिन केवल व्यवस्थापकों तक सीमित है।",
    "Access Denied: Only Administrators can delete grievance records.": "पहुँच अस्वीकृत: केवल व्यवस्थापक ही शिकायत रिकॉर्ड हटा सकते हैं।",
    "Unauthorized: Only Administrator can delete registered citizen profiles.": "अनधिकृत: केवल व्यवस्थापक ही पंजीकृत नागरिक प्रोफ़ाइल हटा सकते हैं।",
    "Unauthorized: Only Administrator can remove Grievance Officers.": "अनधिकृत: केवल व्यवस्थापक ही शिकायत अधिकारियों को हटा सकते हैं।",
    "Protected Account: System Super Administrator account cannot be deleted.": "सुरक्षित खाता: सिस्टम सुपर एडमिन खाता हटाया नहीं जा सकता।",
    "Unauthorized: Only Administrator can delete audit records.": "अनधिकृत: केवल व्यवस्थापक ही ऑडिट रिकॉर्ड हटा सकते हैं।",
    "Audit log entry deleted successfully.": "ऑडिट लॉग प्रविष्टि सफलतापूर्वक हटाई गई।",
    "Unauthorized: Only Administrator can clear the audit trail.": "अनधिकृत: केवल व्यवस्थापक ही ऑडिट ट्रेल साफ़ कर सकते हैं।",
    "Administrative audit trail cleared.": "प्रशासनिक ऑडिट ट्रेल साफ़ किया गया।",
    "Unauthorized: Only Administrator can delete backup snapshots.": "अनधिकृत: केवल व्यवस्थापक ही बैकअप स्नैपशॉट हटा सकते हैं।",
    "Enter maintenance notice for citizens (or leave default):": "नागरिकों के लिए रखरखाव सूचना दर्ज करें (या डिफ़ॉल्ट छोड़ें):",
    "Scheduled System Maintenance in Progress": "निर्धारित सिस्टम रखरखाव प्रगति पर है",
    "Routine workflow retirement": "नियमित वर्कफ़्लो सेवानिवृत्ति",
    "Enter administrative reason for restoring default schema:": "डिफ़ॉल्ट स्कीमा पुनर्स्थापित करने के लिए प्रशासनिक कारण दर्ज करें:",
    "Restored official Gram Panchayat 8-stage grievance lifecycle schema": "आधिकारिक ग्राम पंचायत 8-चरणीय शिकायत जीवनचक्र स्कीमा पुनर्स्थापित किया गया",
    "Are you sure you want to delete this email transmission log entry?": "क्या आप वाकई इस ईमेल प्रेषण लॉग प्रविष्टि को हटाना चाहते हैं?",
    "Are you sure you want to permanently clear all email delivery audit history logs?": "क्या आप वाकई सभी ईमेल वितरण ऑडिट इतिहास लॉग को स्थायी रूप से साफ़ करना चाहते हैं?",
    "CLEAR AUDIT TRAIL CONFIRMATION: Are you sure you want to permanently clear the ENTIRE Administrative Audit Trail? All historical security entries will be removed permanently.": "ऑडिट ट्रेल साफ़ करने की पुष्टि: क्या आप वाकई संपूर्ण प्रशासनिक ऑडिट ट्रेल को स्थायी रूप से साफ़ करना चाहते हैं? सभी ऐतिहासिक सुरक्षा प्रविष्टियाँ स्थायी रूप से हट जाएँगी।",
    "WARNING: Are you sure you want to clear the entire Administrative Status Management Audit Trail? This will purge all status change history logs permanently.": "चेतावनी: क्या आप वाकई संपूर्ण प्रशासनिक स्थिति प्रबंधन ऑडिट ट्रेल को साफ़ करना चाहते हैं? इससे सभी स्थिति परिवर्तन लॉग स्थायी रूप से हट जाएँगे।",
    "Are you sure you want to reset Complaint Statuses to the official Gram Panchayat 8-stage schema? This will restore: Submitted, Assigned, Under Review, In Progress, Action Taken, Resolved, Rejected, Reopened.": "क्या आप वाकई शिकायत स्थितियों को आधिकारिक ग्राम पंचायत 8-चरणीय स्कीमा पर रीसेट करना चाहते हैं?",
    "Are you sure you want to clear the entire Emergency Reset Audit History Ledger? All recorded audit entries will be permanently deleted.": "क्या आप वाकई संपूर्ण आपातकालीन रीसेट ऑडिट इतिहास लेजर को साफ़ करना चाहते हैं? सभी दर्ज ऑडिट प्रविष्टियाँ स्थायी रूप से हटा दी जाएँगी।",
    "Verified": "सत्यापित",
    "Pending": "लंबित",
    "Active": "सक्रिय",
    "Inactive": "निष्क्रिय",
    "Error:": "त्रुटि:",
    "Save Error:": "सहेजने में त्रुटि:",
    "Delete Error:": "हटाने में त्रुटि:",
    "Restore Error:": "पुनर्स्थापना त्रुटि:",
    "Archival Error:": "आर्काइव त्रुटि:",
    "Reset Failed:": "रीसेट विफल:",
    "Clear Error:": "साफ़ करने में त्रुटि:",
    "Upload Failed:": "अपलोड विफल:",
    "Delete Failed:": "हटाने में विफल:",
    "Error saving complaint:": "शिकायत सहेजने में त्रुटि:",
    "Error updating recipient:": "प्राप्तकर्ता अपडेट करने में त्रुटि:",
    "Error updating preferences:": "प्राथमिकताएं अपडेट करने में त्रुटि:",
    "Failed to parse file:": "फ़ाइल पढ़ने में विफल:",
    "Failed to save configuration:": "कॉन्फ़िगरेशन सहेजने में विफल:",
    "Failed to delete citizen:": "नागरिक हटाने में विफल:",
    "Failed to delete receiver:": "प्राप्तकर्ता हटाने में विफल:",
    "Failed to delete audit log:": "ऑडिट लॉग हटाने में विफल:",
    "Failed to clear audit trail:": "ऑडिट ट्रेल साफ़ करने में विफल:",
    "Failed to delete backup snapshot:": "बैकअप स्नैपशॉट हटाने में विफल:",
    "Failed to clear email logs:": "ईमेल लॉग साफ़ करने में विफल:",
    "Failed to delete log entry:": "लॉग प्रविष्टि हटाने में विफल:",
    "Failed to update maintenance mode:": "रखरखाव मोड अपडेट करने में विफल:",
    "Failed to remove transition:": "परिवर्तन नियम हटाने में विफल:",
    "Failed to clear audit ledger:": "ऑडिट लेजर साफ़ करने में विफल:",
    "Test email failed:": "परीक्षण ईमेल विफल:",
    "Could not download backup:": "बैकअप डाउनलोड नहीं हो सका:",
    "Restoration Failed:": "पुनर्स्थापना विफल:",
    "Backup Failed:": "बैकअप विफल:",
    "Back": "वापस",
    "Overdue (>7 Days)": "विलंबित (>7 दिन)",
    "0 KB": "0 KB",
    "Super Admin": "सुपर एडमिन",
    "All settings are stored in": "सभी सेटिंग्स सर्वर-प्रवर्तित भूमिका प्रमाणीकरण के साथ",
    "AI Assistant Ops": "AI सहायक संचालन",
    "AI Assistant Configuration & Analytics": "AI सहायक कॉन्फ़िगरेशन और विश्लेषण",
    "Inspect live server AI provider status, citizen feedback metrics, reported incorrect answers, and approved runtime guardrails.": "लाइव सर्वर AI प्रदाता स्थिति, नागरिक प्रतिक्रिया आंकड़े, रिपोर्ट किए गए गलत उत्तर और अनुमोदित नियम देखें।",
    "AI PROVIDER STATUS": "AI प्रदाता स्थिति",
    "HELPFUL FEEDBACK": "मददगार प्रतिक्रिया",
    "NOT HELPFUL": "मददगार नहीं",
    "REPORTED INCORRECT": "गलत उत्तर रिपोर्ट",
    "Approved Assistant Guardrail Configuration (No Secrets Stored Here)": "अनुमोदित सहायक कॉन्फ़िगरेशन (यहाँ कोई गुप्त कुंजी संग्रहीत नहीं होती)",
    "Reported Incorrect Assistant Responses": "रिपोर्ट किए गए गलत सहायक उत्तर",
    "Access Denied: AI Assistant Operations are restricted to Administrators only.": "प्रवेश अस्वीकृत: AI सहायक संचालन केवल प्रशासकों के लिए सीमित हैं।",
    "Knowledge Centre": "ज्ञान केंद्र",
    "IP Chat": "IP चैट",
    "IP Chat – External Messaging Service": "IP चैट – बाहरी संदेश सेवा",
    "AI Knowledge Centre": "AI ज्ञान केंद्र",
    "AI KNOWLEDGE CENTRE": "AI ज्ञान केंद्र",
    "AI Knowledge Centre – JANASEVA Portal": "AI ज्ञान केंद्र – जनसेवा पोर्टल",
    "Contribute civic guides, circulars, schemes, and multilingual documents directly to the community RAG knowledge base. Safe documents become searchable in JANASEVA AI automatically.": "नागरिक मार्गदर्शिकाएँ, परिपत्र, योजनाएँ और बहुभाषी दस्तावेज़ सीधे सामुदायिक RAG ज्ञान कोष में योगदान करें। सुरक्षित दस्तावेज़ स्वतः JANASEVA AI में खोजे जा सकेंगे।",
    "Indexed Documents": "अनुक्रमित दस्तावेज़",
    "Knowledge Chunks": "ज्ञान खंड",
    "Contributors": "योगदानकर्ता",
    "Multilingual RAG": "बहुभाषी RAG",
    "Contribute Knowledge Documents": "ज्ञान दस्तावेज़ योगदान करें",
    "Open public contribution — no admin approval queue required. Security scan, text extraction, language detection, and AI indexing run automatically.": "खुला सार्वजनिक योगदान — व्यवस्थापक स्वीकृति कतार की आवश्यकता नहीं। सुरक्षा स्कैन, पाठ निष्कर्षण, भाषा पहचान और AI अनुक्रमण स्वतः चलते हैं।",
    "Ask AI Chat": "AI चैट से पूछें",
    "Contributor Name (Optional)": "योगदानकर्ता का नाम (वैकल्पिक)",
    "Topic / Category Hint": "विषय / श्रेणी संकेत",
    "Auto-Detect (Recommended)": "स्वतः पहचान (अनुशित)",
    "Update Existing Document (Optional)": "मौजूदा दस्तावेज़ अपडेट करें (वैकल्पिक)",
    "Upload as New Document": "नए दस्तावेज़ के रूप में अपलोड करें",
    "Drag & Drop Files or Folders Here": "फ़ाइलें या फ़ोल्डर यहाँ खींचें और छोड़ें",
    "Select Files": "फ़ाइलें चुनें",
    "Upload Folder": "फ़ोल्डर अपलोड करें",
    "Upload & Scanning Pipeline": "अपलोड और स्कैनिंग पाइपलाइन",
    "Clear Finished": "पूर्ण हुए साफ़ करें",
    "Search Community Knowledge Base": "सामुदायिक ज्ञान कोष खोजें",
    "Browse indexed documents across Kannada, English, and Hindi.": "कन्नड़, अंग्रेज़ी और हिंदी में अनुक्रमित दस्तावेज़ देखें।",
    "All Languages": "सभी भाषाएँ",
    "All Source Types": "सभी स्रोत प्रकार",
    "Official Source": "आधिकारिक स्रोत",
    "Verified API Import": "सत्यापित API आयात",
    "Community-Contributed": "सामुदायिक योगदान",
    "Recent Upload History": "हाल का अपलोड इतिहास",
    "Real-time status of recent community submissions, duplicates, and failed uploads.": "हाल की सामुदायिक प्रस्तुतियों, डुप्लिकेट और विफल अपलोड की वास्तविक समय स्थिति।",
    "Document Details": "दस्तावेज़ विवरण",
    "Extracted Content (Original Language Preserved)": "निष्कर्षित सामग्री (मूल भाषा सुरक्षित)",
    "Download Original": "मूल फ़ाइल डाउनलोड करें",
    "Download Text": "पाठ डाउनलोड करें",
    "Ask AI About This": "इसके बारे में AI से पूछें",
    "Community knowledge collection oversight, document inspection, security quarantine, Receiver API settings, backup & RAG testing.": "सामुदायिक ज्ञान संग्रह निगरानी, दस्तावेज़ निरीक्षण, सुरक्षा क्वारंटाइन, रिसीवर API सेटिंग्स, बैकअप और RAG परीक्षण।",
    "Saved": "सहेजा गया",
    "Unsaved Changes": "असहेजे गए परिवर्तन",
    "Resetting...": "रीसेट हो रहा है...",
    "Refreshing...": "रीफ़्रेश हो रहा है...",
    "Sync Error": "सिंक त्रुटि",
    "Synced": "सिंक किया गया",
    "Reset to Defaults": "डिफ़ॉल्ट पर रीसेट करें",
    "Reset to Default": "डिफ़ॉल्ट पर रीसेट करें",
    "Refresh Profile": "प्रोफ़ाइल रीफ़्रेश करें",
    "Refresh Status": "स्थिति रीफ़्रेश करें",
    "Refresh Authorization Info": "प्राधिकरण जानकारी रीफ़्रेश करें",
    "Validate Config": "कॉन्फ़िग सत्यापित करें",
    "Save Profile": "प्रोफ़ाइल सहेजें",
    "Save Recipient Address": "प्राप्तकर्ता पता सहेजें",
    "Save Maintenance Settings": "रखरखाव सेटिंग्स सहेजें",
    "Reset to Normal Operational": "सामान्य संचालन पर रीसेट करें",
    "Enable Portal Maintenance Mode (Pause Citizen Submissions)": "पोर्टल रखरखाव मोड सक्षम करें (नागरिक शिकायतें रोकें)",
    "Public Citizen Maintenance Notice": "सार्वजनिक नागरिक रखरखाव सूचना",
    "Portal Maintenance Mode Settings:": "पोर्टल रखरखाव मोड सेटिंग्स:",
    "Profile & Preferences": "प्रोफ़ाइल और प्राथमिकताएँ",
    "My Profile Settings": "मेरी प्रोफ़ाइल सेटिंग्स",
    "Portal Language & Display Preferences": "पोर्टल भाषा और प्रदर्शन प्राथमिकताएँ",
    "Manage your verified citizen name, contact phone, and home Gram Panchayat.": "अपना सत्यापित नागरिक नाम, संपर्क फ़ोन और ग्राम पंचायत प्रबंधित करें।",
    "Customize preferred portal language and dashboard view preferences.": "पसंदीदा पोर्टल भाषा और डैशबोर्ड दृश्य प्राथमिकताएँ अनुकूलित करें।",
    "Preferred Portal Language": "पसंदीदा पोर्टल भाषा",
    "Auto-Expand Timeline Updates": "टाइमलाइन अपडेट स्वतः विस्तृत करें",
    "Show the newest grievance timeline milestones expanded inside detail popups.": "विवरण पॉपअप के भीतर नवीनतम शिकायत टाइमलाइन चरण विस्तृत दिखाएँ।",
    "Email Status Alerts Opt-In": "ईमेल स्थिति अलर्ट विकल्प",
    "Receive email acknowledgments and official resolution summaries for your complaints.": "अपनी शिकायतों के लिए ईमेल पावती और आधिकारिक समाधान सारांश प्राप्त करें।",
    "Compact List Density": "सघन सूची दृश्य",
    "Use denser spacing in complaint summary tables.": "शिकायत सारांश तालिकाओं में सघन रिक्ति का उपयोग करें।",
    "Save Preferences": "प्राथमिकताएँ सहेजें",
    "Read-Only System Policy": "केवल-पठनीय सिस्टम नीति",
    "Authorized Officer Name": "अधिकृत अधिकारी का नाम",
    "Contact Phone Number": "संपर्क फ़ोन नंबर",
    "Assigned Gram Panchayat / Hub": "नियुक्त ग्राम पंचायत / केंद्र",
    "Reset Form": "फ़ॉर्म रीसेट करें",
    "Refresh": "रीफ़्रेश",
    "Save Configuration": "कॉन्फ़िगरेशन सहेजें",
    "Save Notification Preferences": "अधिसूचना प्राथमिकताएँ सहेजें",
    "Save Receiver Config": "रिसीवर कॉन्फ़िग सहेजें",
    "Delete / Reset Default": "हटाएँ / डिफ़ॉल्ट रीसेट करें"
  }
};
class JanasevaTranslator {
  constructor() {
    let raw = null;
    try {
      raw = localStorage.getItem('janaseva_lang');
    } catch (e) {}
    this.currentLang = this.normalizeLangCode(raw);
    try {
      if (raw !== null && raw !== this.currentLang) {
        localStorage.setItem('janaseva_lang', this.currentLang);
      }
    } catch (e) {}

    this.translations = JANASEVA_TRANSLATIONS;
    this.isTranslating = false;
    this._observer = null;
    this.missingKeys = new Set();

    // Normalized lookup maps & reverse lookup maps
    this.normKn = new Map();
    this.normHi = new Map();
    this.reverseKn = new Map();
    this.reverseHi = new Map();
    this.initMaps();

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = this.currentLang;
    }
  }

  normalizeLangCode(lang) {
    if (lang === 'kn' || lang === 'kn-IN') return 'kn';
    if (lang === 'hi' || lang === 'hi-IN') return 'hi';
    return 'en';
  }

  stripHtmlBreaks(str) {
    if (!str) return '';
    return String(str).replace(/<br\s*[\/]?\>/gi, ' ').replace(/\s+/g, ' ').trim();
  }

  initMaps() {
    for (const [k, rawV] of Object.entries(this.translations.kn || {})) {
      const v = this.stripHtmlBreaks(rawV);
      const nk = this.normalize(k);
      if (nk) {
        this.normKn.set(nk, v);
        const sk = this.stripPunct(nk);
        if (sk && !this.normKn.has(sk)) this.normKn.set(sk, v);
      }
      const nv = this.normalize(v);
      if (nv) {
        this.reverseKn.set(nv, nk);
        const sv = this.stripPunct(nv);
        if (sv && !this.reverseKn.has(sv)) this.reverseKn.set(sv, nk);
      }
    }

    for (const [k, rawV] of Object.entries(this.translations.hi || {})) {
      const v = this.stripHtmlBreaks(rawV);
      const nk = this.normalize(k);
      if (nk) {
        this.normHi.set(nk, v);
        const sk = this.stripPunct(nk);
        if (sk && !this.normHi.has(sk)) this.normHi.set(sk, v);
      }
      const nv = this.normalize(v);
      if (nv) {
        this.reverseHi.set(nv, nk);
        const sv = this.stripPunct(nv);
        if (sv && !this.reverseHi.has(sv)) this.reverseHi.set(sv, nk);
      }
    }
  }

  normalize(str) {
    if (!str) return '';
    return String(str)
      .replace(/&amp;/gi, '&')
      .replace(/&ndash;/gi, '–')
      .replace(/&bull;/gi, '•')
      .replace(/&times;/gi, '×')
      .replace(/&laquo;/gi, '«')
      .replace(/&raquo;/gi, '»')
      .replace(/&rarr;/gi, '→')
      .replace(/&larr;/gi, '←')
      .replace(/&copy;/gi, '©')
      .replace(/&larr;/gi, '←')
      .replace(/&copy;/gi, '©')
      .replace(/&ge;/gi, '≥')
      .replace(/&le;/gi, '≤')
      .replace(/<br\s*[\/]?\>/gi, ' ')
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  stripPunct(str) {
    if (!str) return '';
    return str
      .replace(/^[•\-\–\—\*\>\:\.\,\s]+/, '')
      .replace(/[\:\.\,\?\!\*\;\(\)\{\}\[\]\s]+$/, '')
      .replace(/["'“”]/g, '')
      .trim();
  }

  findEnKey(text) {
    if (!text) return null;
    const clean = this.normalize(text);
    if (!clean) return null;

    if (this.normKn.has(clean) || this.normHi.has(clean)) return clean;
    if (this.reverseKn.has(clean)) return this.reverseKn.get(clean);
    if (this.reverseHi.has(clean)) return this.reverseHi.get(clean);

    const stripped = this.stripPunct(clean);
    if (stripped && stripped !== clean) {
      if (this.normKn.has(stripped) || this.normHi.has(stripped)) return stripped;
      if (this.reverseKn.has(stripped)) return this.reverseKn.get(stripped);
      if (this.reverseHi.has(stripped)) return this.reverseHi.get(stripped);
    }

    if (clean.startsWith('filter:')) {
      const sub = this.stripPunct(clean.substring(7));
      if (this.normKn.has(sub) || this.normHi.has(sub)) return 'filter:' + sub;
    }
    if (clean.startsWith(':')) {
      const sub = this.stripPunct(clean.substring(1));
      if (this.normKn.has(sub) || this.normHi.has(sub)) return ':' + sub;
    }

    return null;
  }

  lookup(enKey, lang) {
    lang = this.normalizeLangCode(lang);
    if (!enKey) return null;
    if (lang === 'en') return enKey;

    const map = (lang === 'kn') ? this.normKn : (lang === 'hi' ? this.normHi : null);
    if (!map) return null;

    if (map.has(enKey)) return map.get(enKey);

    const stripped = this.stripPunct(enKey);
    if (stripped && map.has(stripped)) {
      const t = map.get(stripped);
      if (enKey.endsWith(':') && !t.endsWith(':')) return t + ':';
      if (enKey.endsWith('*') && !t.endsWith('*')) return t + ' *';
      return t;
    }

    if (enKey.startsWith('filter:')) {
      const sub = this.stripPunct(enKey.substring(7));
      if (map.has(sub)) {
        const prefix = lang === 'kn' ? 'ಫಿಲ್ಟರ್: ' : 'फ़िल्टर: ';
        return prefix + map.get(sub);
      }
    }

    if (enKey.startsWith(':')) {
      const sub = this.stripPunct(enKey.substring(1));
      if (map.has(sub)) return ': ' + map.get(sub);
    }

    return null;
  }

  _formatTime(timePart, ampm, lang) {
    const hour = parseInt(timePart.split(':')[0], 10);
    if (lang === 'kn') {
      const period = ampm === 'am' ? 'ಬೆಳಗ್ಗೆ ' : (ampm === 'pm' ? (hour === 12 || hour < 4 ? 'ಮಧ್ಯಾಹ್ನ ' : 'ಸಂಜೆ ') : '');
      return period + timePart;
    }
    const period = ampm === 'am' ? 'सुबह ' : (ampm === 'pm' ? (hour === 12 || hour < 4 ? 'दोपहर ' : 'शाम ') : '');
    return period + timePart;
  }

  translateDynamic(text, lang) {
    lang = this.normalizeLangCode(lang);
    if (!text || lang === 'en') return null;
    const raw = String(text).replace(/\s+/g, ' ').trim();
    if (!raw) return null;

    let m;

    // A1. Date / Timestamp: "11 Nov 2026, 10:29 am", "07 November 2026, 10:24", "04 Nov 2026"
    const dateRe = /^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|Sept|Oct|October|Nov|November|Dec|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep)\s+(\d{4})(?:,\s*(\d{1,2}:\d{2})(?::\d{2})?\s*(am|pm)?)?$/i;
    if ((m = raw.match(dateRe))) {
      const day = m[1];
      const monKey = m[2].toLowerCase();
      const monName = (JANASEVA_MONTHS[lang] && (JANASEVA_MONTHS[lang][monKey] || JANASEVA_MONTHS[lang][monKey.slice(0, 3)])) || m[2];
      let out = `${day} ${monName} ${m[3]}`;
      if (m[4]) {
        const ampm = m[5] ? m[5].toLowerCase() : '';
        out += `, ${this._formatTime(m[4], ampm, lang)}`;
      }
      return out;
    }

    // A2. Month Year: "Nov 2026", "November 2026"
    if ((m = raw.match(/^(January|February|March|April|May|June|July|August|September|Sept|October|Nov|November|Dec|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct)\s+(\d{4})$/i))) {
      const mk = m[1].toLowerCase();
      const monName = (JANASEVA_MONTHS[lang] && (JANASEVA_MONTHS[lang][mk] || JANASEVA_MONTHS[lang][mk.slice(0, 3)])) || m[1];
      return `${monName} ${m[2]}`;
    }

    // A3. Standalone Time: "10:29 am", "04:55 PM"
    if ((m = raw.match(/^(\d{1,2}:\d{2})\s*(am|pm)$/i))) {
      return this._formatTime(m[1], m[2].toLowerCase(), lang);
    }

    // B. Counts, Metrics, Pagination, Units
    if ((m = raw.match(/^(\d+)\s+Records?\s+Found$/i))) {
      const n = m[1];
      return lang === 'kn' ? (n === '1' ? `${n} ದಾಖಲೆ ಕಂಡುಬಂದಿದೆ` : `${n} ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿವೆ`) : (n === '1' ? `${n} रिकॉर्ड मिला` : `${n} रिकॉर्ड मिले`);
    }
    if ((m = raw.match(/^(\d+)\s+Grievances?\s+Found$/i))) {
      const n = m[1];
      return lang === 'kn' ? (n === '1' ? `${n} ದೂರು ಕಂಡುಬಂದಿದೆ` : `${n} ದೂರುಗಳು ಕಂಡುಬಂದಿವೆ`) : (n === '1' ? `${n} शिकायत मिली` : `${n} शिकायतें मिलीं`);
    }
    if ((m = raw.match(/^(\d+)\s+Updates?\s+Found$/i))) {
      const n = m[1];
      return lang === 'kn' ? (n === '1' ? `${n} ನವೀಕರಣ ಕಂಡುಬಂದಿದೆ` : `${n} ನವೀಕರಣಗಳು ಕಂಡುಬಂದಿವೆ`) : `${n} अपडेट मिले`;
    }
    if ((m = raw.match(/^(\d+)\s+Quarantined\s+Records?$/i))) {
      return lang === 'kn' ? `${m[1]} ಕ್ವಾರಂಟೈನ್ ದಾಖಲೆಗಳು` : `${m[1]} क्वारंटाइन रिकॉर्ड`;
    }
    if ((m = raw.match(/^(\d+)\s+Deleted\s+Grievances?$/i))) {
      const n = m[1];
      return lang === 'kn' ? (n === '1' ? `${n} ಅಳಿಸಲಾದ ದೂರು` : `${n} ಅಳಿಸಲಾದ ದೂರುಗಳು`) : (n === '1' ? `${n} हटाई गई शिकायत` : `${n} हटाई गई शिकायतें`);
    }
    if ((m = raw.match(/^(\d+)\s+grievances?\s+selected$/i))) {
      const n = m[1];
      return lang === 'kn' ? (n === '1' ? `${n} ದೂರು ಆಯ್ಕೆಯಾಗಿದೆ` : `${n} ದೂರುಗಳು ಆಯ್ಕೆಯಾಗಿವೆ`) : (n === '1' ? `${n} शिकायत चयनित` : `${n} शिकायतें चयनित`);
    }
    if ((m = raw.match(/^(\d+)\s+Statuses?\s+Configured$/i))) {
      return lang === 'kn' ? `${m[1]} ಸ್ಥಿತಿಗಳನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿದೆ` : `${m[1]} स्थितियाँ कॉन्फ़िगर की गईं`;
    }
    if ((m = raw.match(/^(\d+)\s+Active\s*\/\s*(\d+)\s+Total\s+Configured$/i))) {
      return lang === 'kn' ? `${m[1]} ಸಕ್ರಿಯ / ${m[2]} ಒಟ್ಟು ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿದೆ` : `${m[1]} सक्रिय / ${m[2]} कुल कॉन्फ़िगर`;
    }
    if ((m = raw.match(/^(\d+)\s+Grievances?\s+Analyzed$/i))) {
      return lang === 'kn' ? `${m[1]} ದೂರುಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ` : `${m[1]} शिकायतों का विश्लेषण`;
    }
    if ((m = raw.match(/^(\d+)\s+Alerts?$/i))) {
      return lang === 'kn' ? (m[1] === '1' ? '1 ಎಚ್ಚರಿಕೆ' : `${m[1]} ಎಚ್ಚರಿಕೆಗಳು`) : `${m[1]} अलर्ट`;
    }
    if ((m = raw.match(/^(\d+)\s+Recorded\s+Events?$/i))) {
      return lang === 'kn' ? `${m[1]} ದಾಖಲಾದ ಘಟನೆಗಳು` : `${m[1]} दर्ज घटनाएँ`;
    }
    if ((m = raw.match(/^(\d+)\s+Events?$/i))) {
      return lang === 'kn' ? `${m[1]} ಘಟನೆಗಳು` : `${m[1]} घटनाएँ`;
    }
    if ((m = raw.match(/^(\d+)\s+Citizens?$/i))) {
      return lang === 'kn' ? `${m[1]} ನಾಗರಿಕರು` : `${m[1]} नागरिक`;
    }
    if ((m = raw.match(/^(\d+)\s+Grievances?$/i))) {
      return lang === 'kn' ? `${m[1]} ದೂರುಗಳು` : `${m[1]} शिकायतें`;
    }
    if ((m = raw.match(/^(\d+)\s+Records?$/i))) {
      return lang === 'kn' ? `${m[1]} ದಾಖಲೆಗಳು` : `${m[1]} रिकॉर्ड`;
    }
    if ((m = raw.match(/^(\d+)\s+Hours?$/i))) {
      return lang === 'kn' ? `${m[1]} ಗಂಟೆಗಳು` : `${m[1]} घंटे`;
    }
    if ((m = raw.match(/^(\d+(?:\.\d+)?)\s+Days?$/i))) {
      return lang === 'kn' ? `${m[1]} ದಿನಗಳು` : `${m[1]} दिन`;
    }
    if ((m = raw.match(/^(\d+)\s+Filed$/i))) {
      return lang === 'kn' ? `${m[1]} ದಾಖಲಾಗಿದೆ` : `${m[1]} दर्ज`;
    }
    if ((m = raw.match(/^Stage\s+(\d+)$/i))) {
      return lang === 'kn' ? `ಹಂತ ${m[1]}` : `चरण ${m[1]}`;
    }
    if ((m = raw.match(/^(\d+)\s+Transitions?$/i))) {
      return lang === 'kn' ? `${m[1]} ಪರಿವರ್ತನೆ(ಗಳು)` : `${m[1]} संक्रमण`;
    }
    if ((m = raw.match(/^(\d+)\s+Complaints?\s*\((\d+%)\)$/i))) {
      return lang === 'kn' ? `${m[1]} ದೂರುಗಳು (${m[2]})` : `${m[1]} शिकायतें (${m[2]})`;
    }
    if ((m = raw.match(/^(\d+)\s+Incidents?\s+Reported\s*\((\d+%)\s+of\s+GP\)$/i))) {
      return lang === 'kn' ? `${m[1]} ಪ್ರಕರಣಗಳು ವರದಿಯಾಗಿವೆ (ಗ್ರಾ.ಪಂ.ನ ${m[2]})` : `${m[1]} घटनाएँ दर्ज (ग्राम पंचायत का ${m[2]})`;
    }
    if ((m = raw.match(/^(\d+)\s+Offline\s+Submissions?\s+Queued:?$/i))) {
      return lang === 'kn' ? `${m[1]} ಆಫ್‌ಲೈನ್ ದೂರುಗಳು ಸರದಿಯಲ್ಲಿವೆ:` : `${m[1]} ऑफ़लाइन शिकायतें कतार में हैं:`;
    }
    if ((m = raw.match(/^Total\s+Panchayats:\s*(\d+)$/i))) {
      return lang === 'kn' ? `ಒಟ್ಟು ಪಂಚಾಯತ್‌ಗಳು: ${m[1]}` : `कुल पंचायतें: ${m[1]}`;
    }
    if ((m = raw.match(/^Page\s+(\d+)\s+of\s+(\d+)$/i))) {
      return lang === 'kn' ? `ಪುಟ ${m[1]} / ${m[2]}` : `पृष्ठ ${m[1]} / ${m[2]}`;
    }
    if ((m = raw.match(/^(\d+%)\s+Confidence$/i))) {
      return lang === 'kn' ? `${m[1]} ವಿಶ್ವಾಸಾರ್ಹತೆ` : `${m[1]} विश्वास`;
    }
    if ((m = raw.match(/^Showing\s+(\d+(?:[–\-]\d+)?)\s+of\s+(\d+)\s+grievances$/i))) {
      return lang === 'kn' ? `${m[2]} ದೂರುಗಳಲ್ಲಿ ${m[1]} ತೋರಿಸಲಾಗುತ್ತಿದೆ` : `${m[2]} में से ${m[1]} शिकायतें दिखाई जा रही हैं`;
    }
    if ((m = raw.match(/^(\d+)\s+of\s+(\d+)\s+active\s+grievances\s+resolved\s*\((\d+%)\)$/i))) {
      return lang === 'kn' ? `${m[2]} ಸಕ್ರಿಯ ದೂರುಗಳಲ್ಲಿ ${m[1]} ಪರಿಹರಿಸಲಾಗಿದೆ (${m[3]})` : `${m[2]} सक्रिय शिकायतों में से ${m[1]} हल (${m[3]})`;
    }
    if ((m = raw.match(/^(\d+(?:\.\d+)?)\s*KB\s*•\s*Verified\s+format$/i))) {
      return lang === 'kn' ? `${m[1]} KB • ಪರಿಶೀಲಿಸಿದ ಫಾರ್ಮ್ಯಾಟ್` : `${m[1]} KB • सत्यापित फ़ॉर्मेट`;
    }
    if ((m = raw.match(/^Processing\s+step\s+(\d+)\s+of\s+(\d+)\.\.\.$/i))) {
      return lang === 'kn' ? `ಹಂತ ${m[1]} / ${m[2]} ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...` : `चरण ${m[1]} / ${m[2]} संसाधित हो रहा है...`;
    }
    if ((m = raw.match(/^Safety\s+Lock\s+Arming\s+in\s+(\d+)s\.\.\.$/i))) {
      return lang === 'kn' ? `${m[1]} ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಸುರಕ್ಷತಾ ಲಾಕ್ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...` : `${m[1]} सेकंड में सुरक्षा लॉक सक्रिय हो रहा है...`;
    }

    // C. Progress, Status, Prefix & Stage Patterns
    if ((m = raw.match(/^Progress:\s*(\d+%)\s*\((.+)\)$/i))) {
      return lang === 'kn' ? `ಪ್ರಗತಿ: ${m[1]} (${this.get(m[2], lang)})` : `प्रगति: ${m[1]} (${this.get(m[2], lang)})`;
    }
    if ((m = raw.match(/^Work\s+Progress:\s*(\d+%)\s*\((.+)\)$/i))) {
      return lang === 'kn' ? `ಕೆಲಸದ ಪ್ರಗತಿ: ${m[1]} (${this.get(m[2], lang)})` : `कार्य प्रगति: ${m[1]} (${this.get(m[2], lang)})`;
    }
    if ((m = raw.match(/^(\d+%)\s*[–\-]\s*(.+)$/i))) {
      return `${m[1]} – ${this.get(m[2], lang)}`;
    }
    if ((m = raw.match(/^Completed:\s*(.+)$/i))) {
      return lang === 'kn' ? `ಪೂರ್ಣಗೊಂಡಿದೆ: ${m[1]}` : `पूर्ण: ${m[1]}`;
    }
    if ((m = raw.match(/^Edit\s+Status:\s*(.+)$/i))) {
      return lang === 'kn' ? `ಸ್ಥಿತಿ ತಿದ್ದು: ${this.get(m[1], lang)}` : `स्थिति संपादित करें: ${this.get(m[1], lang)}`;
    }
    if ((m = raw.match(/^Status\s+Changed\s+to\s+(.+)$/i))) {
      return lang === 'kn' ? `ಸ್ಥಿತಿಯನ್ನು ${this.get(m[1], lang)} ಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ` : `स्थिति ${this.get(m[1], lang)} में बदली गई`;
    }
    if ((m = raw.match(/^Status:\s*(.+)$/i))) {
      return lang === 'kn' ? `ಸ್ಥಿತಿ: ${this.get(m[1], lang)}` : `स्थिति: ${this.get(m[1], lang)}`;
    }
    if ((m = raw.match(/^(.+?)\s+Discrepancy:?$/i))) {
      return lang === 'kn' ? `${this.get(m[1], lang)} ವ್ಯತ್ಯಾಸ:` : `${this.get(m[1], lang)} विसंगति:`;
    }
    if ((m = raw.match(/^(.+?)\s+\(Current\s+Status\)$/i))) {
      return lang === 'kn' ? `${this.get(m[1], lang)} (ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ)` : `${this.get(m[1], lang)} (वर्तमान स्थिति)`;
    }
    if ((m = raw.match(/^(.+?)\s+\(Admin\s+Override\)$/i))) {
      return lang === 'kn' ? `${this.get(m[1], lang)} (ಆಡಳಿತಾಧಿಕಾರಿ ಓವರ್‌ರೈಡ್)` : `${this.get(m[1], lang)} (व्यवस्थापक ओवरराइड)`;
    }
    if ((m = raw.match(/^File:\s*(.+)$/i))) {
      return lang === 'kn' ? `ಫೈಲ್: ${m[1]}` : `फ़ाइल: ${m[1]}`;
    }
    if ((m = raw.match(/^Ref:\s*(.+)$/i))) {
      return lang === 'kn' ? `ಉಲ್ಲೇಖ: ${m[1]}` : `संदर्भ: ${m[1]}`;
    }
    if ((m = raw.match(/^Reason:\s*(.+)$/i))) {
      return lang === 'kn' ? `ಕಾರಣ: ${this.get(m[1], lang)}` : `कारण: ${this.get(m[1], lang)}`;
    }

    // D. Dynamic Panchayat, Receiver, Dashboard & Profile Strings
    if ((m = raw.match(/^(.+?)\s+Official\s+Receiver$/i))) {
      const gp = this.get(m[1], lang);
      return lang === 'kn' ? `${gp} ಅಧಿಕೃತ ಸ್ವೀಕರಿಸುವವರು` : `${gp} आधिकारिक प्राप्तकर्ता`;
    }
    if ((m = raw.match(/^(.+?)\s+Official\s+Dashboard$/i))) {
      const gp = this.get(m[1], lang);
      return lang === 'kn' ? `${gp} ಅಧಿಕೃತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್` : `${gp} आधिकारिक डैशबोर्ड`;
    }
    if ((m = raw.match(/^Review\s+citizen\s+grievances\s+assigned\s+to\s+(.+?),\s+inspect\s+evidence,\s+update\s+8-stage\s+progress,\s+and\s+communicate\s+official\s+responses\.$/i))) {
      const gp = this.get(m[1], lang);
      return lang === 'kn'
        ? `${gp} ಗೆ ನಿಯೋಜಿಸಲಾದ ನಾಗರಿಕ ದೂರುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಸಾಕ್ಷ್ಯಗಳನ್ನು ತಪಾಸಣೆ ಮಾಡಿ, 8-ಹಂತದ ಪ್ರಗತಿಯನ್ನು ನವೀಕರಿಸಿ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಕಳುಹಿಸಿ.`
        : `${gp} को सौंपे गए नागरिक शिकायतों की समीक्षा करें, साक्ष्य जांचें, 8-चरणीय प्रगति अपडेट करें और आधिकारिक उत्तर भेजें।`;
    }
    if ((m = raw.match(/^Personal\s+grievance\s+history,\s+work\s+tracking,\s+and\s+status\s+timeline\s+for\s+(.+?)\s+\(([^)]+)\)\.\s+Strictly\s+private\s+to\s+your\s+account\.$/i))) {
      return lang === 'kn'
        ? `${m[1]} (${m[2]}) ಅವರಿಗಾಗಿ ವೈಯಕ್ತಿಕ ದೂರುಗಳ ಇತಿಹಾಸ, ಕೆಲಸದ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಸ್ಥಿತಿ ಟೈಮ್‌ಲೈನ್. ನಿಮ್ಮ ಖಾತೆಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಖಾಸಗಿಯಾಗಿದೆ.`
        : `${m[1]} (${m[2]}) के लिए व्यक्तिगत शिकायत इतिहास, कार्य ट्रैकिंग और स्थिति समयरेखा। यह आपके खाते के लिए पूरी तरह निजी है।`;
    }
    if ((m = raw.match(/^(.+?)\s+Gram\s+Panchayat$/i))) {
      return lang === 'kn' ? `${m[1]} ಗ್ರಾಮ ಪಂಚಾಯತ್` : `${m[1]} ग्राम पंचायत`;
    }
    if ((m = raw.match(/^(.+?)\s+GP$/i))) {
      return lang === 'kn' ? `${m[1]} ಗ್ರಾ.ಪಂ.` : `${m[1]} ग्राम पंचायत`;
    }
    if ((m = raw.match(/^Evidence\s+Photograph\s+[—\-]\s+(.+)$/i))) {
      return lang === 'kn' ? `ಸಾಕ್ಷ್ಯ ಛಾಯಾಚಿತ್ರ — ${this.get(m[1], lang)}` : `साक्ष्य फ़ोटोग्राफ़ — ${this.get(m[1], lang)}`;
    }
    if ((m = raw.match(/^Filter:\s*(.+)$/i))) {
      return lang === 'kn' ? `ಫಿಲ್ಟರ್: ${this.get(m[1], lang)}` : `फ़िल्टर: ${this.get(m[1], lang)}`;
    }
    if ((m = raw.match(/^JANASEVA\s+Grievance\s+Acknowledgement\s+Slip\s+[–\-]\s+(.+)$/i))) {
      return lang === 'kn' ? `ಜನಸೇವಾ ದೂರು ಸ್ವೀಕೃತಿ ಚೀಟಿ – ${m[1]}` : `जनसेवा शिकायत पावती पर्ची – ${m[1]}`;
    }

    // E. Parameterized Toasts, Alerts, Confirmations, Prompts & AI/OCR Messages
    if ((m = raw.match(/^Welcome\s+back,\s*(.+?)!$/i))) {
      return lang === 'kn' ? `ಮರಳಿ ಸ್ವಾಗತ, ${m[1]}!` : `वापसी पर स्वागत है, ${m[1]}!`;
    }
    if ((m = raw.match(/^Password\s+reset\s+link\s+sent\s+to\s+(.+?)\.$/i))) {
      return lang === 'kn' ? `ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಅನ್ನು ${m[1]} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.` : `पासवर्ड रीसेट लिंक ${m[1]} पर भेजा गया है।`;
    }
    if ((m = raw.match(/^Found\s+(\d+)\s+grievances\s+for\s+this\s+email\.\s+Showing\s+the\s+most\s+recent\.$/i))) {
      return lang === 'kn'
        ? `ಈ ಇಮೇಲ್‌ಗಾಗಿ ${m[1]} ದೂರುಗಳು ಕಂಡುಬಂದಿವೆ. ಇತ್ತೀಚಿನದನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.`
        : `इस ईमेल के लिए ${m[1]} शिकायतें मिलीं। सबसे हाल की शिकायत दिखाई जा रही है।`;
    }
    if ((m = raw.match(/^Complaint\s+ID\s+"([^"]+)"\s+not\s+found\.$/i))) {
      return lang === 'kn' ? `ದೂರು ಐಡಿ "${m[1]}" ಕಂಡುಬಂದಿಲ್ಲ.` : `शिकायत आईडी "${m[1]}" नहीं मिली।`;
    }
    if ((m = raw.match(/^No\s+grievances\s+found\s+registered\s+with\s+"([^"]+)"\.$/i))) {
      return lang === 'kn' ? `"${m[1]}" ಹೆಸರಿನಲ್ಲಿ ಯಾವುದೇ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ.` : `"${m[1]}" के नाम से कोई शिकायत दर्ज नहीं मिली।`;
    }
    if ((m = raw.match(/^Grievance\s+([A-Z0-9\-]+)\s+status\s+updated\s+to\s+"(.+?)"!$/i))) {
      const st = this.get(m[2], lang);
      return lang === 'kn' ? `ದೂರು ${m[1]} ಸ್ಥಿತಿಯನ್ನು "${st}" ಗೆ ನವೀಕರಿಸಲಾಗಿದೆ!` : `शिकायत ${m[1]} की स्थिति "${st}" में अपडेट की गई!`;
    }
    if ((m = raw.match(/^Grievance\s+([A-Z0-9\-]+)\s+moved\s+to\s+Deleted\s+Complaints\.$/i))) {
      return lang === 'kn' ? `ದೂರು ${m[1]} ಅನ್ನು ಅಳಿಸಿದ ದೂರುಗಳಿಗೆ ಸರಿಸಲಾಗಿದೆ.` : `शिकायत ${m[1]} को हटाई गई शिकायतों में भेज दिया गया।`;
    }
    if ((m = raw.match(/^Grievance\s+([A-Z0-9\-]+)\s+has\s+been\s+restored\s+to\s+your\s+Active\s+Complaints\s+list\.$/i))) {
      return lang === 'kn' ? `ದೂರು ${m[1]} ಅನ್ನು ನಿಮ್ಮ ಸಕ್ರಿಯ ದೂರುಗಳ ಪಟ್ಟಿಗೆ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.` : `शिकायत ${m[1]} को आपकी सक्रिय शिकायतों की सूची में पुनर्स्थापित किया गया है।`;
    }
    if ((m = raw.match(/^Grievance\s+([A-Z0-9\-]+)\s+has\s+been\s+reopened\s+for\s+investigation\.$/i))) {
      return lang === 'kn' ? `ತನಿಖೆಗಾಗಿ ದೂರು ${m[1]} ಅನ್ನು ಮರುತೆರೆಯಲಾಗಿದೆ.` : `जांच के लिए शिकायत ${m[1]} को पुनः खोला गया है।`;
    }
    if ((m = raw.match(/^Grievance\s+([A-Z0-9\-]+)\s+safely\s+quarantined\s+in\s+Protected\s+Recycle\s+Bin\.$/i))) {
      return lang === 'kn' ? `ದೂರು ${m[1]} ಅನ್ನು ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಕ್ವಾರಂಟೈನ್ ಮಾಡಲಾಗಿದೆ.` : `शिकायत ${m[1]} को सुरक्षित रीसायकल बिन में क्वारंटाइन किया गया।`;
    }
    if ((m = raw.match(/^Grievance\s+([A-Z0-9\-]+)\s+successfully\s+restored\s+to\s+active\s+registry!$/i))) {
      return lang === 'kn' ? `ದೂರು ${m[1]} ಅನ್ನು ಸಕ್ರಿಯ ನೋಂದಣಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ!` : `शिकायत ${m[1]} को सक्रिय रजिस्टर में सफलतापूर्वक पुनर्स्थापित किया गया!`;
    }
    if ((m = raw.match(/^Grievance\s+([A-Z0-9\-]+)\s+flagged\s+for\s+Administrator\s+review\.$/i))) {
      return lang === 'kn' ? `ಆಡಳಿತಾಧಿಕಾರಿ ಪರಿಶೀಲನೆಗಾಗಿ ದೂರು ${m[1]} ಅನ್ನು ಗುರುತಿಸಲಾಗಿದೆ.` : `व्यवस्थापक समीक्षा के लिए शिकायत ${m[1]} को चिह्नित किया गया।`;
    }
    if ((m = raw.match(/^Grievance\s+([A-Z0-9\-]+)\s+removed\.$/i))) {
      return lang === 'kn' ? `ದೂರು ${m[1]} ತೆಗೆದುಹಾಕಲಾಗಿದೆ.` : `शिकायत ${m[1]} हटाई गई।`;
    }
    if ((m = raw.match(/^Grievance\s+([A-Z0-9\-]+)\s+was\s+not\s+found\.$/i))) {
      return lang === 'kn' ? `ದೂರು ${m[1]} ಕಂಡುಬಂದಿಲ್ಲ.` : `शिकायत ${m[1]} नहीं मिली।`;
    }
    if ((m = raw.match(/^Grievance\s+permanently\s+recorded!\s+ID:\s*(.+)$/i))) {
      return lang === 'kn' ? `ದೂರು ಶಾಶ್ವತವಾಗಿ ದಾಖಲಾಗಿದೆ! ಐಡಿ: ${m[1]}` : `शिकायत स्थायी रूप से दर्ज की गई! आईडी: ${m[1]}`;
    }
    if ((m = raw.match(/^Offline\s+grievance\s+synchronized\s+successfully!\s+Official\s+ID:\s*(.+)$/i))) {
      return lang === 'kn' ? `ಆಫ್‌ಲೈನ್ ದೂರು ಯಶಸ್ವಿಯಾಗಿ ಸಿಂಕ್ ಆಗಿದೆ! ಅಧಿಕೃತ ಐಡಿ: ${m[1]}` : `ऑफ़लाइन शिकायत सफलतापूर्वक सिंक हुई! आधिकारिक आईडी: ${m[1]}`;
    }
    if ((m = raw.match(/^Complaint\s+([A-Z0-9\-]+)\s+moved\s+to\s+Protected\s+Recycle\s+Bin\.$/i))) {
      return lang === 'kn' ? `ದೂರು ${m[1]} ಅನ್ನು ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್‌ಗೆ ಸರಿಸಲಾಗಿದೆ.` : `शिकायत ${m[1]} को सुरक्षित रीसायकल बिन में भेज दिया गया।`;
    }
    if ((m = raw.match(/^Record\s+([A-Z0-9\-]+)\s+permanently\s+destroyed\s+from\s+database\.$/i))) {
      return lang === 'kn' ? `ದಾಖಲೆ ${m[1]} ಅನ್ನು ಡೇಟಾಬೇಸ್‌ನಿಂದ ಶಾಶ್ವತವಾಗಿ ನಾಶಪಡಿಸಲಾಗಿದೆ.` : `रिकॉर्ड ${m[1]} डेटाबेस से स्थायी रूप से नष्ट कर दिया गया।`;
    }
    if ((m = raw.match(/^Cannot\s+(change\s+status|submit\s+reopen\s+request):\s*(.+)$/i))) {
      const reason = this.get(m[2], lang);
      if (m[1].toLowerCase().includes('reopen')) {
        return lang === 'kn' ? `ಮರುತೆರೆಯುವ ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ: ${reason}` : `पुनः खोलने का अनुरोध सबमिट नहीं किया जा सकता: ${reason}`;
      }
      return lang === 'kn' ? `ಸ್ಥಿತಿಯನ್ನು ಬದಲಾಯಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ: ${reason}` : `स्थिति बदली नहीं जा सकती: ${reason}`;
    }
    if ((m = raw.match(/^Document\s+verification\s+status\s+updated\s+to:\s*(.+)$/i))) {
      return lang === 'kn' ? `ದಾಖಲೆ ಪರಿಶೀಲನೆ ಸ್ಥಿತಿಯನ್ನು ಇದಕ್ಕೆ ನವೀಕರಿಸಲಾಗಿದೆ: ${this.get(m[1], lang)}` : `दस्तावेज़ सत्यापन स्थिति अपडेट की गई: ${this.get(m[1], lang)}`;
    }
    if ((m = raw.match(/^Portal\s+maintenance\s+mode\s+is\s+now\s+(ENABLED|DISABLED)\.$/i))) {
      const on = m[1].toUpperCase() === 'ENABLED';
      return lang === 'kn'
        ? `ಪೋರ್ಟಲ್ ನಿರ್ವಹಣಾ ಮೋಡ್ ಈಗ ${on ? 'ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ' : 'ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ'}.`
        : `पोर्टल रखरखाव मोड अब ${on ? 'सक्रिय' : 'निष्क्रिय'} है।`;
    }
    if ((m = raw.match(/^Grievance\s+Submissions\s+Paused:\s*(.+)$/i))) {
      return lang === 'kn' ? `ದೂರು ಸಲ್ಲಿಕೆ ತಡೆಹಿಡಿಯಲಾಗಿದೆ: ${this.get(m[1], lang)}` : `शिकायत पंजीकरण रोका गया: ${this.get(m[1], lang)}`;
    }
    if ((m = raw.match(/^Active\s+recipient\s+updated!\s+All\s+new\s+complaints\s+will\s+be\s+routed\s+to\s+(.+)$/i))) {
      return lang === 'kn' ? `ಸಕ್ರಿಯ ಸ್ವೀಕರಿಸುವವರನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ! ಎಲ್ಲಾ ಹೊಸ ದೂರುಗಳನ್ನು ${m[1]} ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.` : `सक्रिय प्राप्तकर्ता अपडेट किया गया! सभी नई शिकायतें ${m[1]} को भेजी जाएंगी।`;
    }
    if ((m = raw.match(/^Test\s+email\s+successfully\s+(?:dispatched|delivered)\s+to\s+(.+?)(?:\s+via\s+EmailJS)?[!.]$/i))) {
      return lang === 'kn' ? `ಪರೀಕ್ಷಾ ಇಮೇಲ್ ಅನ್ನು ${m[1]} ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ!` : `परीक्षण ईमेल ${m[1]} पर सफलतापूर्वक भेजा गया!`;
    }
    if ((m = raw.match(/^Dispatching\s+Test\s+to\s+(.+?)\.\.\.$/i))) {
      return lang === 'kn' ? `${m[1]} ಗೆ ಪರೀಕ್ಷೆ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...` : `${m[1]} को परीक्षण भेजा जा रहा है...`;
    }
    if ((m = raw.match(/^Database\s+backup\s+snapshot\s+(.+?)\s+created\s+successfully!$/i))) {
      return lang === 'kn' ? `ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ${m[1]} ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ!` : `डेटाबेस बैकअप स्नैपशॉट ${m[1]} सफलतापूर्वक बनाया गया!`;
    }
    if ((m = raw.match(/^Backup\s+snapshot\s+(.+?)\s+permanently\s+deleted\.$/i))) {
      return lang === 'kn' ? `ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ${m[1]} ಅನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗಿದೆ.` : `बैकअप स्नैपशॉट ${m[1]} स्थायी रूप से हटाया गया।`;
    }
    if ((m = raw.match(/^Audit\s+log\s+"(.+?)"\s+deleted\s+successfully\.$/i))) {
      return lang === 'kn' ? `ಆಡಿಟ್ ಲಾಗ್ "${m[1]}" ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.` : `ऑडिट लॉग "${m[1]}" सफलतापूर्वक हटाया गया।`;
    }
    if ((m = raw.match(/^Citizen\s+profile\s+"(.+?)"\s+successfully\s+deleted\.$/i))) {
      return lang === 'kn' ? `ನಾಗರಿಕ ಪ್ರೊಫೈಲ್ "${m[1]}" ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.` : `नागरिक प्रोफ़ाइल "${m[1]}" सफलतापूर्वक हटाई गई।`;
    }
    if ((m = raw.match(/^Grievance\s+Officer\s+"(.+?)"\s+successfully\s+removed\.$/i))) {
      return lang === 'kn' ? `ದೂರು ಅಧಿಕಾರಿ "${m[1]}" ಅವರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.` : `शिकायत अधिकारी "${m[1]}" को सफलतापूर्वक हटाया गया।`;
    }
    if ((m = raw.match(/^Panchayat\s+"(.+?)"\s+(added|updated)\s+successfully!$/i))) {
      const act = m[2].toLowerCase() === 'added' ? (lang === 'kn' ? 'ಸೇರಿಸಲಾಗಿದೆ' : 'जोड़ी गई') : (lang === 'kn' ? 'ನವೀಕರಿಸಲಾಗಿದೆ' : 'अपडेट की गई');
      return lang === 'kn' ? `ಪಂಚಾಯತ್ "${m[1]}" ಯಶಸ್ವಿಯಾಗಿ ${act}!` : `पंचायत "${m[1]}" सफलतापूर्वक ${act}!`;
    }
    if ((m = raw.match(/^Panchayat\s+"(.+?)"\s+deleted\.$/i))) {
      return lang === 'kn' ? `ಪಂಚಾಯತ್ "${m[1]}" ಅಳಿಸಲಾಗಿದೆ.` : `पंचायत "${m[1]}" हटाई गई।`;
    }
    if ((m = raw.match(/^Successfully\s+imported\s+(\d+)\s+Panchayats\s+from\s+file!$/i))) {
      return lang === 'kn' ? `ಫೈಲ್‌ನಿಂದ ${m[1]} ಪಂಚಾಯತ್‌ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಆಮದು ಮಾಡಲಾಗಿದೆ!` : `फ़ाइल से ${m[1]} पंचायतें सफलतापूर्वक आयात की गईं!`;
    }
    if ((m = raw.match(/^Status\s+"(.+?)"\s+(saved\s+successfully!|not\s+found\.|reactivated!|archived\s+safely.+|successfully\s+removed!|force\s+deleted.+)$/i))) {
      const st = this.get(m[1], lang);
      const tail = m[2].toLowerCase();
      if (tail.startsWith('saved')) return lang === 'kn' ? `ಸ್ಥಿತಿ "${st}" ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!` : `स्थिति "${st}" सफलतापूर्वक सहेजी गई!`;
      if (tail.startsWith('not found')) return lang === 'kn' ? `ಸ್ಥಿತಿ "${st}" ಕಂಡುಬಂದಿಲ್ಲ.` : `स्थिति "${st}" नहीं मिली।`;
      if (tail.startsWith('reactivated')) return lang === 'kn' ? `ಸ್ಥಿತಿ "${st}" ಮರುಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ!` : `स्थिति "${st}" पुनः सक्रिय की गई!`;
      if (tail.startsWith('archived')) return lang === 'kn' ? `ಹಳೆಯ ದಾಖಲೆಗಳಿಗೆ ಧಕ್ಕೆಯಾಗದಂತೆ "${st}" ಸ್ಥಿತಿಯನ್ನು ಆರ್ಕೈವ್ ಮಾಡಲಾಗಿದೆ!` : `ऐतिहासिक रिकॉर्ड को प्रभावित किए बिना "${st}" स्थिति आर्काइव की गई!`;
      if (tail.startsWith('successfully removed')) return lang === 'kn' ? `ಸ್ಥಿತಿ "${st}" ಯಶಸ್ವಿಯಾಗಿ ತೆಗೆದುಹಾಕಲಾಗಿದೆ!` : `स्थिति "${st}" सफलतापूर्वक हटाई गई!`;
      return lang === 'kn' ? `ಸ್ಥಿತಿ "${st}" ಬಲವಂತವಾಗಿ ಅಳಿಸಲಾಗಿದೆ ಮತ್ತು ಸಂಬಂಧಿತ ದೂರುಗಳನ್ನು 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' ಹಂತಕ್ಕೆ ವರ್ಗಾಯಿಸಲಾಗಿದೆ.` : `स्थिति "${st}" को हटाया गया और संबंधित शिकायतों को 'समीक्षाधीन' में स्थानांतरित किया गया।`;
    }
    if ((m = raw.match(/^Selected\s+status\s+"(.+?)"\.\s+Click\s+"Update\s+Status"\s+below\s+to\s+commit\.$/i))) {
      const st = this.get(m[1], lang);
      return lang === 'kn' ? `"${st}" ಸ್ಥಿತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ. ದೃಢೀಕರಿಸಲು ಕೆಳಗಿನ "ಸ್ಥಿತಿ ನವೀಕರಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.` : `स्थिति "${st}" चयनित की गई। पुष्टि करने के लिए नीचे "स्थिति अपडेट करें" पर क्लिक करें।`;
    }
    if ((m = raw.match(/^Transition\s+to\s+"(.+?)"\s+is\s+not\s+permitted\s+from\s+current\s+status\.$/i))) {
      const st = this.get(m[1], lang);
      return lang === 'kn' ? `ಪ್ರಸ್ತುತ ಸ್ಥಿತಿಯಿಂದ "${st}" ಗೆ ಬದಲಾಯಿಸಲು ಅನುಮತಿಯಿಲ್ಲ.` : `वर्तमान स्थिति से "${st}" में परिवर्तन की अनुमति नहीं है।`;
    }
    if ((m = raw.match(/^Exported\s+(\d+)\s+updates\s+to\s+CSV\.$/i))) {
      return lang === 'kn' ? `${m[1]} ನವೀಕರಣಗಳನ್ನು CSV ಗೆ ರಫ್ತು ಮಾಡಲಾಗಿದೆ.` : `${m[1]} अपडेट CSV में निर्यात किए गए।`;
    }
    if ((m = raw.match(/^(\d+)\s+grievances\s+moved\s+to\s+Protected\s+Recycle\s+Bin\.$/i))) {
      return lang === 'kn' ? `${m[1]} ದೂರುಗಳನ್ನು ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್‌ಗೆ ಸರಿಸಲಾಗಿದೆ.` : `${m[1]} शिकायतें सुरक्षित रीसायकल बिन में भेजी गईं।`;
    }
    if ((m = raw.match(/^(\d+)\s+grievances\s+restored\s+to\s+active\s+register\.$/i))) {
      return lang === 'kn' ? `${m[1]} ದೂರುಗಳನ್ನು ಸಕ್ರಿಯ ನೋಂದಣಿಗೆ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.` : `${m[1]} शिकायतें सक्रिय रजिस्टर में पुनर्स्थापित की गईं।`;
    }
    if ((m = raw.match(/^Restored\s+(\d+)\s+grievance\(s\);\s*(\d+)\s+could\s+not\s+be\s+restored\.$/i))) {
      return lang === 'kn' ? `${m[1]} ದೂರು(ಗಳನ್ನು) ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ; ${m[2]} ಮರುಸ್ಥಾಪಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.` : `${m[1]} शिकायत(ें) पुनर्स्थापित हुईं; ${m[2]} पुनर्स्थापित नहीं हो सकीं।`;
    }
    if ((m = raw.match(/^Workflow\s+Error:\s+Transition\s+from\s+"(.+?)"\s+to\s+"(.+?)"\s+is\s+not\s+permitted\s+by\s+system\s+workflow\s+rules\.$/i))) {
      const s1 = this.get(m[1], lang), s2 = this.get(m[2], lang);
      return lang === 'kn' ? `ಕಾರ್ಯಪ್ರವಾಹ ದೋಷ: "${s1}" ನಿಂದ "${s2}" ಗೆ ಬದಲಾಯಿಸಲು ಸಿಸ್ಟಮ್ ನಿಯಮಗಳ ಪ್ರಕಾರ ಅನುಮತಿಯಿಲ್ಲ.` : `वर्कफ़्लो त्रुटि: "${s1}" से "${s2}" में परिवर्तन की अनुमति नहीं है।`;
    }
    if ((m = raw.match(/^Mandatory\s+Requirement:\s+Please\s+provide\s+remarks\/justification\s+for\s+transitioning\s+to\s+"(.+?)"\.$/i))) {
      const st = this.get(m[1], lang);
      return lang === 'kn' ? `ಕಡ್ಡಾಯ ಅಗತ್ಯ: "${st}" ಹಂತಕ್ಕೆ ಬದಲಾಯಿಸಲು ದಯವಿಟ್ಟು ಟಿಪ್ಪಣಿ/ಸಮರ್ಥನೆ ನೀಡಿ.` : `अनिवार्य आवश्यकता: "${st}" पर जाने के लिए कृपया टिप्पणी/औचित्य प्रदान करें।`;
    }
    if ((m = raw.match(/^Mandatory\s+Requirement:\s+Transition\s+to\s+"(.+?)"\s+requires\s+supporting\s+verification\s+evidence\.$/i))) {
      const st = this.get(m[1], lang);
      return lang === 'kn' ? `ಕಡ್ಡಾಯ ಅಗತ್ಯ: "${st}" ಹಂತಕ್ಕೆ ಬದಲಾಯಿಸಲು ಪೂರಕ ಪರಿಶೀಲನಾ ಸಾಕ್ಷ್ಯ ಅಗತ್ಯವಿದೆ.` : `अनिवार्य आवश्यकता: "${st}" पर जाने के लिए सहायक सत्यापन साक्ष्य आवश्यक है।`;
    }
    if ((m = raw.match(/^Assignment\s+Error:\s+Transition\s+to\s+"(.+?)"\s+requires\s+a\s+designated\s+Receiver\.$/i))) {
      const st = this.get(m[1], lang);
      return lang === 'kn' ? `ನಿಯೋಜನೆ ದೋಷ: "${st}" ಹಂತಕ್ಕೆ ಬದಲಾಯಿಸಲು ನಿಯೋಜಿತ ಸ್ವೀಕರಿಸುವವರು ಅಗತ್ಯ.` : `नियुक्ति त्रुटि: "${st}" पर जाने के लिए एक नामित प्राप्तकर्ता आवश्यक है।`;
    }
    if ((m = raw.match(/^CRITICAL\s+SAFETY\s+ALERT:\s+Detected\s+indicators\s+of\s+(.+?)\.\s+Requires\s+immediate\s+on-site\s+human\s+inspection\.$/i))) {
      return lang === 'kn'
        ? `ಗಂಭೀರ ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ: ${this.get(m[1], lang)} ಲಕ್ಷಣಗಳು ಪತ್ತೆಯಾಗಿವೆ. ತಕ್ಷಣದ ಸ್ಥಳ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ.`
        : `गंभीर सुरक्षा चेतावनी: ${this.get(m[1], lang)} के संकेत मिले हैं। तत्काल स्थलीय निरीक्षण आवश्यक है।`;
    }
    if ((m = raw.match(/^Multiple\s+repeated\s+(.+?)\s+complaints\s+reported\s+in\s+(.+?)\.\s+Recommended\s+for\s+preventive\s+infrastructure\s+overhaul\s+by\s+Department\.$/i))) {
      return lang === 'kn'
        ? `${this.get(m[2], lang)} ನಲ್ಲಿ ಹಲವು ಬಾರಿ ${this.get(m[1], lang)} ದೂರುಗಳು ವರದಿಯಾಗಿವೆ. ಇಲಾಖೆಯಿಂದ ಮುನ್ನೆಚ್ಚರಿಕಾ ಮೂಲಸೌಕರ್ಯ ದುರಸ್ತಿಗೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.`
        : `${this.get(m[2], lang)} में बार-बार ${this.get(m[1], lang)} की कई शिकायतें दर्ज हुई हैं। विभाग द्वारा निवारक सुधार की अनुशंसा की जाती है।`;
    }
    if ((m = raw.match(/^Routine\s+public\s+infrastructure\s+grievance\.\s+Assigned\s+to\s+(.+?)\s+for\s+standard\s+redressal\.$/i))) {
      return lang === 'kn'
        ? `ಸಾಮಾನ್ಯ ಸಾರ್ವಜನಿಕ ಮೂಲಸೌಕರ್ಯ ದೂರು. ನಿಯಮಿತ ಪರಿಹಾರಕ್ಕಾಗಿ ${this.get(m[1], lang)} ಗೆ ನಿಯೋಜಿಸಲಾಗಿದೆ.`
        : `नियमित सार्वजनिक बुनियादी ढांचा शिकायत। मानक निवारण के लिए ${this.get(m[1], lang)} को सौंपा गया।`;
    }
    if ((m = raw.match(/^Last\s+updated:\s+Just\s+now\s+by\s+(.+)$/i))) {
      return lang === 'kn' ? `ಕೊನೆಯ ನವೀಕರಣ: ಈಗಷ್ಟೇ (${m[1]})` : `अंतिम अपडेट: अभी (${m[1]})`;
    }
    if ((m = raw.match(/^All\s+operational\s+data\s+successfully\s+purged\.\s+Pre-reset\s+snapshot\s+(.+?)\s+secured\.$/i))) {
      return lang === 'kn' ? `ಎಲ್ಲಾ ಕಾರ್ಯಾಚರಣೆ ಡೇಟಾವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ. ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ${m[1]} ಸುರಕ್ಷಿತವಾಗಿದೆ.` : `सभी संचालन डेटा सफलतापूर्वक साफ़ किए गए। प्री-रीसेट स्नैपशॉट ${m[1]} सुरक्षित है।`;
    }
    if ((m = raw.match(/^Document\s+name\s+"([^"]+)"\s+differs\s+from\s+registered\s+name\s+"([^"]+)"\.\s+Please\s+verify\s+identity\s+match\.$/i))) {
      return lang === 'kn' ? `ದಾಖಲೆಯಲ್ಲಿರುವ ಹೆಸರು "${m[1]}" ನೋಂದಾಯಿತ ಹೆಸರು "${m[2]}" ಗಿಂತ ಭಿನ್ನವಾಗಿದೆ. ದಯವಿಟ್ಟು ಗುರುತನ್ನು ಪರಿಶೀಲಿಸಿ.` : `दस्तावेज़ का नाम "${m[1]}" पंजीकृत नाम "${m[2]}" से भिन्न है। कृपया पहचान सत्यापित करें।`;
    }
    if ((m = raw.match(/^Document\s+pertains\s+to\s+location\s+"([^"]+)",\s+while\s+grievance\s+is\s+filed\s+under\s+"([^"]+)"\.$/i))) {
      return lang === 'kn' ? `ದಾಖಲೆಯು "${m[1]}" ಸ್ಥಳಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ, ಆದರೆ ದೂರು "${m[2]}" ಅಡಿಯಲ್ಲಿ ದಾಖಲಾಗಿದೆ.` : `दस्तावेज़ "${m[1]}" स्थान से संबंधित है, जबकि शिकायत "${m[2]}" के अंतर्गत दर्ज की गई है।`;
    }
    if ((m = raw.match(/^Missing\s+Required\s+Fields:\s*(.+?)\.\s*Please\s+provide\s+these\s+details\s+manually\.$/i))) {
      return lang === 'kn' ? `ಕಾಣೆಯಾದ ಅಗತ್ಯ ಕ್ಷೇತ್ರಗಳು: ${this.get(m[1], lang)}. ದಯವಿಟ್ಟು ಈ ವಿವರಗಳನ್ನು ಹಸ್ತಚಾಲಿತವಾಗಿ ನಮೂದಿಸಿ.` : `अनुपलब्ध आवश्यक फ़ील्ड: ${this.get(m[1], lang)}। कृपया यह विवरण मैन्युअल रूप से दर्ज करें।`;
    }
    if ((m = raw.match(/^Move\s+(?:grievance|complaint)\s+([A-Z0-9\-]+)\s+to\s+the\s+Protected\s+Recycle\s+Bin\?/i))) {
      return lang === 'kn'
        ? `ದೂರು ${m[1]} ಅನ್ನು ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್‌ಗೆ ಸರಿಸುವುದೇ? ಎಲ್ಲಾ ಸಾಕ್ಷ್ಯಗಳು ಮತ್ತು ಇತಿಹಾಸವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಕ್ವಾರಂಟೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗುತ್ತದೆ.`
        : `क्या शिकायत ${m[1]} को सुरक्षित रीसायकल बिन में भेजें? सभी साक्ष्य और इतिहास क्वारंटाइन में सुरक्षित रहेंगे।`;
    }
    if ((m = raw.match(/^Move\s+(\d+)\s+selected\s+grievances\s+to\s+the\s+Protected\s+Recycle\s+Bin\?/i))) {
      return lang === 'kn'
        ? `ಆಯ್ಕೆಮಾಡಿದ ${m[1]} ದೂರುಗಳನ್ನು ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್‌ಗೆ ಸರಿಸುವುದೇ? ಅವುಗಳನ್ನು ಯಾವಾಗ ಬೇಕಾದರೂ ಮರುಸ್ಥಾಪಿಸಬಹುದು.`
        : `क्या चयनित ${m[1]} शिकायतों को सुरक्षित रीसायकल बिन में भेजें? इन्हें कभी भी पुनर्स्थापित किया जा सकता है।`;
    }
    if ((m = raw.match(/^Move\s+detected\s+duplicate\s+grievance\s+([A-Z0-9\-]+)\s+to\s+the\s+Protected\s+Recycle\s+Bin\?$/i))) {
      return lang === 'kn' ? `ಪತ್ತೆಯಾದ ನಕಲಿ ದೂರು ${m[1]} ಅನ್ನು ರಕ್ಷಿತ ರಿಸೈಕಲ್ ಬಿನ್‌ಗೆ ಸರಿಸುವುದೇ?` : `क्या पहचानी गई डुप्लिकेट शिकायत ${m[1]} को सुरक्षित रीसायकल बिन में भेजें?`;
    }
    if ((m = raw.match(/^Replace\s+Current\s+Banner\?\s+Are\s+you\s+sure\s+you\s+want\s+to\s+replace\s+"([^"]+)"\s+with\s+"([^"]+)"/i))) {
      return lang === 'kn'
        ? `ಪ್ರಸ್ತುತ ಬ್ಯಾನರ್ ಬದಲಾಯಿಸುವುದೇ?\n\n"${m[1]}" ಬದಲಿಗೆ "${m[2]}" ಅನ್ನು ಅಧಿಕೃತ ಬ್ಯಾನರ್ ಆಗಿ ಹೊಂದಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?`
        : `क्या वर्तमान बैनर बदलें?\n\nक्या आप वाकई "${m[1]}" को "${m[2]}" से आधिकारिक बैनर के रूप में बदलना चाहते हैं?`;
    }
    if (/^Delete\s+Custom\s+Banner\s+Image\?/i.test(raw)) {
      return lang === 'kn'
        ? 'ಕಸ್ಟಮ್ ಬ್ಯಾನರ್ ಚಿತ್ರವನ್ನು ಅಳಿಸುವುದೇ?\n\nಇದು ಆಡಳಿತ ನಿಯಂತ್ರಣ ಕೇಂದ್ರದ ಹೆಡರ್ ಅನ್ನು ಡೀಫಾಲ್ಟ್ ಗ್ರಾಮ ಪಂಚಾಯತ್ ವಿನ್ಯಾಸಕ್ಕೆ ಮರುಸ್ಥಾಪಿಸುತ್ತದೆ.'
        : 'क्या कस्टम बैनर छवि हटाएं?\n\nइससे व्यवस्थापक नियंत्रण केंद्र हेडर तुरंत डिफ़ॉल्ट ग्राम पंचायत डिज़ाइन पर वापस आ जाएगा।';
    }
    if ((m = raw.match(/^DELETE\s+CITIZEN\s+CONFIRMATION:\s+Are\s+you\s+sure\s+you\s+want\s+to\s+permanently\s+delete\s+citizen\s+"([^"]+)"/i))) {
      return lang === 'kn' ? `ನಾಗರಿಕ ಖಾತೆ ಅಳಿಸುವ ದೃಢೀಕರಣ: ನಾಗರಿಕ "${m[1]}" ಖಾತೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?` : `नागरिक खाता हटाने की पुष्टि: क्या आप वाकई नागरिक "${m[1]}" को स्थायी रूप से हटाना चाहते हैं?`;
    }
    if ((m = raw.match(/^DELETE\s+RECEIVER\s+CONFIRMATION:\s+Are\s+you\s+sure\s+you\s+want\s+to\s+delete\s+Grievance\s+Officer\s+"([^"]+)"/i))) {
      return lang === 'kn' ? `ಸ್ವೀಕರಿಸುವವರನ್ನು ಅಳಿಸುವ ದೃಢೀಕರಣ: ದೂರು ಅಧಿಕಾರಿ "${m[1]}" ಅವರನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?` : `प्राप्तकर्ता हटाने की पुष्टि: क्या आप वाकई शिकायत अधिकारी "${m[1]}" को हटाना चाहते हैं?`;
    }
    if ((m = raw.match(/^DELETE\s+AUDIT\s+ENTRY\s+CONFIRMATION:\s+Are\s+you\s+sure\s+you\s+want\s+to\s+permanently\s+delete\s+audit\s+record\s+(.+?)\?$/i))) {
      return lang === 'kn' ? `ಆಡಿಟ್ ದಾಖಲೆ ಅಳಿಸುವ ದೃಢೀಕರಣ: ಆಡಿಟ್ ದಾಖಲೆ ${m[1]} ಅನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ?` : `ऑडिट प्रविष्टि हटाने की पुष्टि: क्या आप वाकई ऑडिट रिकॉर्ड ${m[1]} को स्थायी रूप से हटाना चाहते हैं?`;
    }
    if ((m = raw.match(/^DELETE\s+BACKUP\s+(?:SNAPSHOT\s+)?CONFIRMATION:\s+Are\s+you\s+sure\s+you\s+want\s+to\s+permanently\s+delete\s+backup\s+snapshot\s+([^\s?]+)/i))) {
      return lang === 'kn' ? `ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ಅಳಿಸುವ ದೃಢೀಕರಣ: ಬ್ಯಾಕಪ್ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್ ${m[1]} ಅನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ?` : `बैकअप स्नैपशॉट हटाने की पुष्टि: क्या आप वाकई बैकअप स्नैपशॉट ${m[1]} को स्थायी रूप से हटाना चाहते हैं?`;
    }
    if ((m = raw.match(/^RESTORE\s+CONFIRMATION:\s+Are\s+you\s+sure\s+you\s+want\s+to\s+restore\s+the\s+system\s+state\s+from\s+pre-reset\s+backup\s+([^\s?]+)/i))) {
      return lang === 'kn' ? `ಮರುಸ್ಥಾಪನೆ ದೃಢೀಕರಣ: ಪೂರ್ವ-ಮರುಹೊಂದಿಕೆ ಬ್ಯಾಕಪ್ ${m[1]} ನಿಂದ ಸಿಸ್ಟಮ್ ಸ್ಥಿತಿಯನ್ನು ಮರುಸ್ಥಾಪಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?` : `पुनर्स्थापना पुष्टि: क्या आप वाकई प्री-रीसेट बैकअप ${m[1]} से सिस्टम स्थिति पुनर्स्थापित करना चाहते हैं?`;
    }
    if ((m = raw.match(/^EMPTY\s+RECYCLE\s+BIN\s+WARNING:\s+Are\s+you\s+sure\s+you\s+want\s+to\s+permanently\s+eradicate\s+ALL\s+(\d+)\s+quarantined\s+records/i))) {
      return lang === 'kn' ? `ರಿಸೈಕಲ್ ಬಿನ್ ಖಾಲಿ ಮಾಡುವ ಎಚ್ಚರಿಕೆ: ಕ್ವಾರಂಟೈನ್‌ನಲ್ಲಿರುವ ಎಲ್ಲಾ ${m[1]} ದಾಖಲೆಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?` : `रीसायकल बिन खाली करने की चेतावनी: क्या आप वाकई सभी ${m[1]} क्वारंटाइन रिकॉर्ड स्थायी रूप से मिटाना चाहते हैं?`;
    }
    if ((m = raw.match(/^To\s+authorize\s+permanent\s+destruction\s+of\s+ALL\s+(\d+)\s+records,\s+type\s+"PURGE ALL"\s+below:$/i))) {
      return lang === 'kn' ? `ಎಲ್ಲಾ ${m[1]} ದಾಖಲೆಗಳ ಶಾಶ್ವತ ನಾಶವನ್ನು ದೃಢೀಕರಿಸಲು ಕೆಳಗೆ "PURGE ALL" ಎಂದು ಟೈಪ್ ಮಾಡಿ:` : `सभी ${m[1]} रिकॉर्ड के स्थायी विनाश को अधिकृत करने के लिए नीचे "PURGE ALL" टाइप करें:`;
    }
    if ((m = raw.match(/^Enter\s+administrative\s+justification\s+to\s+(reactivate|archive)\s+"(.+?)":$/i))) {
      const act = m[1].toLowerCase() === 'archive' ? (lang === 'kn' ? 'ಆರ್ಕೈವ್ ಮಾಡಲು' : 'आर्काइव करने के लिए') : (lang === 'kn' ? 'ಮರುಸಕ್ರಿಯಗೊಳಿಸಲು' : 'पुनः सक्रिय करने के लिए');
      const st = this.get(m[2], lang);
      return lang === 'kn' ? `"${st}" ಸ್ಥಿತಿಯನ್ನು ${act} ಆಡಳಿತಾತ್ಮಕ ಸಮರ್ಥನೆಯನ್ನು ನಮೂದಿಸಿ:` : `स्थिति "${st}" को ${act} प्रशासनिक औचित्य दर्ज करें:`;
    }
    if ((m = raw.match(/^Enter\s+administrative\s+justification\s+for\s+deleting\s+status\s+"(.+?)":$/i))) {
      return lang === 'kn' ? `ಸ್ಥಿತಿ "${this.get(m[1], lang)}" ಅಳಿಸಲು ಆಡಳಿತಾತ್ಮಕ ಸಮರ್ಥನೆಯನ್ನು ನಮೂದಿಸಿ:` : `स्थिति "${this.get(m[1], lang)}" हटाने के लिए प्रशासनिक औचित्य दर्ज करें:`;
    }
    if ((m = raw.match(/^Are\s+you\s+sure\s+you\s+want\s+to\s+remove\s+the\s+transition\s+rule:\s*"([^"]+)"/i))) {
      return lang === 'kn' ? `ಈ ಪರಿವರ್ತನೆ ನಿಯಮವನ್ನು ತೆಗೆದುಹಾಕಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?` : `क्या आप वाकई इस परिवर्तन नियम को हटाना चाहते हैं?`;
    }
    if ((m = raw.match(/^Are\s+you\s+sure\s+you\s+want\s+to\s+delete\s+this\s+status\s+audit\s+log\s+entry\s+\(([^)]+)\)\?$/i))) {
      return lang === 'kn' ? `ಈ ಸ್ಥಿತಿ ಆಡಿಟ್ ಲಾಗ್ ದಾಖಲೆಯನ್ನು (${m[1]}) ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?` : `क्या आप वाकई इस स्थिति ऑडिट लॉग प्रविष्टि (${m[1]}) को हटाना चाहते हैं?`;
    }
    if ((m = raw.match(/^Are\s+you\s+sure\s+you\s+want\s+to\s+delete\s+audit\s+log\s+entry\s+"([^"]+)"/i))) {
      return lang === 'kn' ? `ಆಡಿಟ್ ಲಾಗ್ ದಾಖಲೆ "${m[1]}" ಅನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?` : `क्या आप वाकई ऑडिट लॉग प्रविष्टि "${m[1]}" को स्थायी रूप से हटाना चाहते हैं?`;
    }
    if ((m = raw.match(/^WARNING:\s+Status\s+"([^"]+)"\s+is\s+a\s+core\s+grievance\s+lifecycle\s+status/i))) {
      const st = this.get(m[1], lang);
      return lang === 'kn' ? `ಎಚ್ಚರಿಕೆ: "${st}" ಸ್ಥಿತಿಯು ಪ್ರಮುಖ ದೂರು ಜೀವನಚಕ್ರ ಸ್ಥಿತಿಯಾಗಿದೆ. ಇದನ್ನು ಅಳಿಸುವುದರಿಂದ ಸಿಸ್ಟಮ್ ಕಾರ್ಯಪ್ರವಾಹದಿಂದ ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ. ನೀವು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಮುಂದುವರಿಯಲು ಖಚಿತವಾಗಿದ್ದೀರಾ?` : `चेतावनी: स्थिति "${st}" एक मुख्य शिकायत जीवनचक्र स्थिति है। इसे हटाने से यह सिस्टम वर्कफ़्लो से हट जाएगी। क्या आप वाकई इसे स्थायी रूप से हटाना चाहते हैं?`;
    }
    if ((m = raw.match(/^Are\s+you\s+sure\s+you\s+want\s+to\s+permanently\s+delete\s+status\s+"([^"]+)"/i))) {
      const st = this.get(m[1], lang);
      return lang === 'kn' ? `"${st}" ಸ್ಥಿತಿಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಹಳೆಯ ದೂರುಗಳು ಇದನ್ನು ಉಲ್ಲೇಖಿಸಿದರೆ, ದೂರುಗಳ ಸ್ಥಿತಿ ವರ್ಗಾವಣೆ ಅಗತ್ಯವಿರುತ್ತದೆ.` : `क्या आप वाकई स्थिति "${st}" को स्थायी रूप से हटाना चाहते हैं? यदि पुराने रिकॉर्ड इस स्थिति का उपयोग करते हैं, तो उन्हें स्थानांतरित करना होगा।`;
    }
    if ((m = raw.match(/^(.+?)\s+Do\s+you\s+want\s+to\s+FORCE\s+DELETE\s+this\s+status\s+anyway\?/i))) {
      return lang === 'kn' ? `${this.get(m[1], lang)}\n\nನೀವು ಹೇಗಾದರೂ ಈ ಸ್ಥಿತಿಯನ್ನು ಬಲವಂತವಾಗಿ ಅಳಿಸಲು ಬಯಸುವಿರಾ? (ಸಂಬಂಧಿತ ದೂರುಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ'ಗೆ ವರ್ಗಾಯಿಸಲಾಗುತ್ತದೆ)` : `${this.get(m[1], lang)}\n\nक्या आप फिर भी इस स्थिति को बलपूर्वक हटाना चाहते हैं? (संबंधित शिकायतों को 'समीक्षाधीन' में स्थानांतरित किया जाएगा)`;
    }
    if (/^WARNING:\s+Are\s+you\s+sure\s+you\s+want\s+to\s+clear\s+the\s+entire\s+Administrative\s+Status\s+Management\s+Audit\s+Trail\?/i.test(raw)) {
      return lang === 'kn' ? 'ಎಚ್ಚರಿಕೆ: ಸಂಪೂರ್ಣ ಆಡಳಿತಾತ್ಮಕ ಸ್ಥಿತಿ ನಿರ್ವಹಣಾ ಆಡಿಟ್ ಇತಿಹಾಸವನ್ನು ತೆರವುಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಇದು ಎಲ್ಲಾ ಸ್ಥಿತಿ ಬದಲಾವಣೆ ಇತಿಹಾಸವನ್ನು ಅಳಿಸುತ್ತದೆ.' : 'चेतावनी: क्या आप वाकई संपूर्ण प्रशासनिक स्थिति प्रबंधन ऑडिट ट्रेल को साफ़ करना चाहते हैं? इससे सभी स्थिति परिवर्तन इतिहास हट जाएगा।';
    }
    if (/^Are\s+you\s+sure\s+you\s+want\s+to\s+reset\s+Complaint\s+Statuses\s+to\s+the\s+official\s+Gram\s+Panchayat\s+8-stage\s+schema\?/i.test(raw)) {
      return lang === 'kn' ? 'ದೂರು ಸ್ಥಿತಿಗಳನ್ನು ಅಧಿಕೃತ ಗ್ರಾಮ ಪಂಚಾಯತ್ 8-ಹಂತದ ಸ್ಕೀಮಾಗೆ ಮರುಹೊಂದಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಇದು ಡೀಫಾಲ್ಟ್ ಸ್ಥಿತಿಗಳು ಮತ್ತು ಪರಿವರ್ತನೆ ನಿಯಮಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸುತ್ತದೆ.' : 'क्या आप वाकई शिकायत स्थितियों को आधिकारिक ग्राम पंचायत 8-चरणीय स्कीमा पर रीसेट करना चाहते हैं? इससे सभी डिफ़ॉल्ट स्थितियां और नियम पुनर्स्थापित हो जाएंगे।';
    }
    if (/^CLEAR\s+AUDIT\s+TRAIL\s+CONFIRMATION:/i.test(raw)) {
      return lang === 'kn' ? 'ಆಡಿಟ್ ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸುವ ದೃಢೀಕರಣ: ಸಂಪೂರ್ಣ ಆಡಳಿತಾತ್ಮಕ ಆಡಿಟ್ ಇತಿಹಾಸವನ್ನು ಶಾಶ್ವತವಾಗಿ ತೆರವುಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?' : 'ऑडिट ट्रेल साफ़ करने की पुष्टि: क्या आप वाकई संपूर्ण प्रशासनिक ऑडिट ट्रेल को स्थायी रूप से साफ़ करना चाहते हैं?';
    }
    if ((m = raw.match(/^Restoration\s+Complete!\s+Restored:\s*-\s*Grievances:\s*(\d+)\s*-\s*Logs:\s*(\d+)\s*-\s*Users:\s*(\d+)/i))) {
      return lang === 'kn' ? `ಮರುಸ್ಥಾಪನೆ ಪೂರ್ಣಗೊಂಡಿದೆ!\n\nಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ:\n- ದೂರುಗಳು: ${m[1]}\n- ಲಾಗ್‌ಗಳು: ${m[2]}\n- ಬಳಕೆದಾರರು: ${m[3]}` : `पुनर्स्थापना पूर्ण!\n\nपुनर्स्थापित:\n- शिकायतें: ${m[1]}\n- लॉग: ${m[2]}\n- उपयोगकर्ता: ${m[3]}`;
    }
    if ((m = raw.match(/^([^:]+):\s*(.+)$/))) {
      const lhs = m[1].trim();
      if (lhs.length <= 60 && !/^https?$/i.test(lhs)) {
        const prefixKey = this.findEnKey(lhs + ':') || this.findEnKey(lhs);
        if (prefixKey) {
          const pTrans = this.lookup(prefixKey, lang);
          if (pTrans) {
            const cleanP = pTrans.replace(/:+$/, '');
            const vTrans = this.get(m[2], lang);
            return `${cleanP}: ${vTrans}`;
          }
        }
      }
    }
    if ((m = raw.match(/^\(([^()]+)\)$/))) {
      const innerKey = this.findEnKey(m[1].trim());
      if (innerKey) {
        const tInner = this.lookup(innerKey, lang);
        if (tInner) return `(${tInner})`;
      }
    }

    return null;
  }

  _shouldTrackMissing(text) {
    if (!text) return false;
    const s = String(text).trim();
    if (s.length < 2 || s.length > 180) return false;
    if (/^(JAN|USR|LOG|DOC|BKP|RST|UPD|MSG)-/i.test(s)) return false;
    if (/^https?:\/\//i.test(s) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) return false;
    if (/^[\+\d\s\-\(\)\.\/:%]+$/.test(s)) return false;
    return /[A-Za-z]{2,}/.test(s);
  }

  get(text, targetLang = this.currentLang) {
    if (!text) return text;
    const lang = this.normalizeLangCode(targetLang);
    if (lang === 'en') return this.stripHtmlBreaks(text);

    const enKey = this.findEnKey(text);
    if (enKey) {
      const trans = this.lookup(enKey, lang);
      if (trans !== null) return this.stripHtmlBreaks(trans);
    }

    const dyn = this.translateDynamic(text, lang);
    if (dyn !== null) return this.stripHtmlBreaks(dyn);

    if (this._shouldTrackMissing(text)) {
      this.missingKeys.add(this.stripHtmlBreaks(text));
    }
    return text;
  }

  getMissingKeys() {
    return Array.from(this.missingKeys);
  }

  reportMissingKeys() {
    const list = this.getMissingKeys();
    if (list.length > 0 && typeof console !== 'undefined' && console.info) {
      console.info(`[JANASEVA i18n] ${list.length} untranslated key(s) observed:`, list);
    }
    return list;
  }

  setLanguage(lang) {
    lang = this.normalizeLangCode(lang);
    this.currentLang = lang;
    try {
      localStorage.setItem('janaseva_lang', lang);
      const voiceLang = lang === 'kn' ? 'kn-IN' : (lang === 'hi' ? 'hi-IN' : 'en-IN');
      localStorage.setItem('janaseva_chat_lang', voiceLang);
    } catch (e) {}

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }

    this.applyTranslations();
    window.dispatchEvent(new CustomEvent('janaseva:langChanged', { detail: { lang } }));
  }

  _hasNonIconChildren(el) {
    for (const child of el.children) {
      if (child.tagName && child.tagName.toUpperCase() !== 'I') return true;
    }
    return false;
  }

  applyTranslations(root = document.body) {
    if (this.isTranslating) return;
    this.isTranslating = true;

    try {
      const lang = this.currentLang;

      // 1. Synchronize all language selectors on the page
      document.querySelectorAll('.janaseva-lang-select').forEach(sel => {
        if (sel.value !== lang) sel.value = lang;
      });

      // 2. Document Title
      if (document.title) {
        if (!document._origTitle) {
          document._origTitle = document.title;
        } else if (document._lastTransTitle && document.title !== document._lastTransTitle && document.title !== document._origTitle) {
          document._origTitle = document.title;
        }
        if (lang === 'en') {
          document.title = document._origTitle;
          document._lastTransTitle = document._origTitle;
        } else {
          const transTitle = this.get(document._origTitle, lang);
          if (transTitle) {
            document.title = transTitle;
            document._lastTransTitle = transTitle;
          }
        }
      }

      // 3. Category Cards (.cat-label)
      document.querySelectorAll('.cat-label').forEach(el => {
        if (!el.hasAttribute('data-orig-en')) {
          el.setAttribute('data-orig-en', el.innerHTML.trim());
        }
        const orig = el.getAttribute('data-orig-en');
        if (lang === 'en') {
          el.innerHTML = orig;
        } else {
          const normKey = this.normalize(orig);
          const htmlMap = JANASEVA_CAT_LABEL_HTML[lang];
          if (htmlMap && htmlMap[normKey]) {
            el.innerHTML = htmlMap[normKey];
          } else {
            const trans = this.get(orig, lang);
            if (trans && trans !== orig) el.textContent = trans;
          }
        }
      });

      // 4. Simple Badges & Status Pills (only without nested non-<i> elements)
      document.querySelectorAll('.status-badge-pill, .badge-pill, .status-badge, .ai-priority-pill, .category-badge, .hotspot-badge').forEach(el => {
        if (el.closest('#janaseva-ai-chat-drawer') || el.closest('#janaseva-ai-assistant-widget')) return;
        if (this._hasNonIconChildren(el)) return;

        const icon = el.querySelector('i');
        const currentText = Array.from(el.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.nodeValue.trim())
          .filter(Boolean)
          .join(' ') || el.textContent.trim();

        if (!el.hasAttribute('data-orig-en')) {
          el.setAttribute('data-orig-en', currentText);
        } else if (el._lastTransBadge !== undefined && currentText !== el._lastTransBadge && currentText !== el.getAttribute('data-orig-en')) {
          el.setAttribute('data-orig-en', currentText);
        }

        const orig = el.getAttribute('data-orig-en');
        if (!orig) return;

        const targetText = (lang === 'en') ? orig : this.get(orig, lang);
        if (targetText && (lang === 'en' || targetText !== orig)) {
          const textNodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
          if (icon && textNodes.length > 0) {
            textNodes[0].nodeValue = ' ' + targetText;
            for (let i = 1; i < textNodes.length; i++) textNodes[i].nodeValue = '';
          } else if (!icon && textNodes.length > 0) {
            textNodes[0].nodeValue = targetText;
            for (let i = 1; i < textNodes.length; i++) textNodes[i].nodeValue = '';
          } else {
            el.textContent = targetText;
            if (icon) el.insertBefore(icon, el.firstChild);
          }
          el._lastTransBadge = targetText;
        }
      });

      // 5. Form Placeholders (AI drawer handles its own placeholder)
      document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
        if (input.closest('#janaseva-ai-chat-drawer') || input.closest('#janaseva-ai-assistant-widget')) return;
        const curPh = input.getAttribute('placeholder') || '';
        if (!input.hasAttribute('data-orig-ph')) {
          input.setAttribute('data-orig-ph', curPh);
        } else if (input._lastTransPh !== undefined && curPh !== input._lastTransPh && curPh !== input.getAttribute('data-orig-ph')) {
          input.setAttribute('data-orig-ph', curPh);
        }
        const orig = input.getAttribute('data-orig-ph');
        if (lang === 'en') {
          input.setAttribute('placeholder', orig);
          input._lastTransPh = orig;
        } else {
          const trans = this.get(orig, lang);
          if (trans) {
            input.setAttribute('placeholder', trans);
            input._lastTransPh = trans;
          }
        }
      });

      // 6. Select Options & Optgroups (Excluding the language selector itself!)
      document.querySelectorAll('select:not(.janaseva-lang-select) option').forEach(opt => {
        if (opt.closest('#janaseva-ai-chat-drawer') || opt.closest('#janaseva-ai-assistant-widget')) return;
        const curTxt = opt.textContent.trim();
        if (!opt.hasAttribute('data-orig-opt')) {
          opt.setAttribute('data-orig-opt', curTxt);
        } else if (opt._lastTransOpt !== undefined && curTxt !== opt._lastTransOpt && curTxt !== opt.getAttribute('data-orig-opt')) {
          opt.setAttribute('data-orig-opt', curTxt);
        }
        const orig = opt.getAttribute('data-orig-opt');
        if (lang === 'en') {
          opt.textContent = orig;
          opt._lastTransOpt = orig;
        } else {
          const trans = this.get(orig, lang);
          if (trans) {
            opt.textContent = trans;
            opt._lastTransOpt = trans;
          }
        }
      });

      document.querySelectorAll('select:not(.janaseva-lang-select) optgroup[label]').forEach(grp => {
        const curLbl = grp.getAttribute('label') || '';
        if (!grp.hasAttribute('data-orig-label')) {
          grp.setAttribute('data-orig-label', curLbl);
        } else if (grp._lastTransLabel !== undefined && curLbl !== grp._lastTransLabel && curLbl !== grp.getAttribute('data-orig-label')) {
          grp.setAttribute('data-orig-label', curLbl);
        }
        const orig = grp.getAttribute('data-orig-label');
        if (lang === 'en') {
          grp.setAttribute('label', orig);
          grp._lastTransLabel = orig;
        } else {
          const trans = this.get(orig, lang);
          if (trans) {
            grp.setAttribute('label', trans);
            grp._lastTransLabel = trans;
          }
        }
      });

      // 7. Tooltips and Title attributes
      document.querySelectorAll('[title]').forEach(el => {
        if (el.closest('#janaseva-ai-chat-drawer') || el.closest('#janaseva-ai-assistant-widget') || el.classList?.contains('janaseva-lang-select')) return;
        const curTitle = el.getAttribute('title') || '';
        if (!el.hasAttribute('data-orig-title')) {
          el.setAttribute('data-orig-title', curTitle);
        } else if (el._lastTransTitle !== undefined && curTitle !== el._lastTransTitle && curTitle !== el.getAttribute('data-orig-title')) {
          el.setAttribute('data-orig-title', curTitle);
        }
        const orig = el.getAttribute('data-orig-title');
        if (lang === 'en') {
          el.setAttribute('title', orig);
          el._lastTransTitle = orig;
        } else {
          const trans = this.get(orig, lang);
          if (trans) {
            el.setAttribute('title', trans);
            el._lastTransTitle = trans;
          }
        }
      });

      // 7b. Accessibility ARIA labels (excluding language selectors and AI assistant drawer)
      document.querySelectorAll('[aria-label]').forEach(el => {
        if (el.closest('#janaseva-ai-chat-drawer') || el.closest('#janaseva-ai-assistant-widget') || el.classList?.contains('janaseva-lang-select')) return;
        const curAria = el.getAttribute('aria-label') || '';
        if (!curAria) return;
        if (!el.hasAttribute('data-orig-aria')) {
          el.setAttribute('data-orig-aria', curAria);
        } else if (el._lastTransAria !== undefined && curAria !== el._lastTransAria && curAria !== el.getAttribute('data-orig-aria')) {
          el.setAttribute('data-orig-aria', curAria);
        }
        const orig = el.getAttribute('data-orig-aria');
        if (lang === 'en') {
          el.setAttribute('aria-label', orig);
          el._lastTransAria = orig;
        } else {
          const trans = this.get(orig, lang);
          if (trans) {
            el.setAttribute('aria-label', trans);
            el._lastTransAria = trans;
          }
        }
      });

      // 8. General TreeWalker across ALL visible text nodes
      if (root) {
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              const tag = parent.tagName.toUpperCase();
              if (['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE', 'KBD'].includes(tag)) {
                return NodeFilter.FILTER_REJECT;
              }
              if (
                parent.closest('[data-no-translate]') ||
                parent.closest('.no-translate') ||
                parent.closest('.cat-label') ||
                parent.closest('.janaseva-lang-select') ||
                parent.closest('#janaseva-ai-chat-drawer') ||
                parent.closest('#janaseva-ai-assistant-widget')
              ) {
                return NodeFilter.FILTER_REJECT;
              }
              const pill = parent.closest('.status-badge-pill, .badge-pill, .status-badge, .ai-priority-pill, .category-badge, .hotspot-badge');
              if (pill && !this._hasNonIconChildren(pill)) {
                return NodeFilter.FILTER_REJECT;
              }
              const val = node.nodeValue.trim();
              if (!val || /^[0-9\+\-\:\.\,\(\)\/\#\*\s•→←×«»–?]+$/.test(val)) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        const nodesToTranslate = [];
        let currentNode = walker.nextNode();
        while (currentNode) {
          nodesToTranslate.push(currentNode);
          currentNode = walker.nextNode();
        }

        nodesToTranslate.forEach(node => {
          const raw = node.nodeValue;
          const trimmed = raw.trim();
          if (!trimmed) return;

          if (!node._origEn) {
            node._origEn = trimmed;
          } else if (node._lastTranslated !== undefined && trimmed !== node._lastTranslated && trimmed !== node._origEn) {
            node._origEn = trimmed;
          }
          const orig = node._origEn;

          const leadingMatch = raw.match(/^\s*/)[0];
          const trailingMatch = raw.match(/\s*$/)[0];

          if (lang === 'en') {
            node.nodeValue = leadingMatch + orig + trailingMatch;
            node._lastTranslated = orig;
          } else {
            const trans = this.get(orig, lang);
            if (trans && trans !== orig) {
              node.nodeValue = leadingMatch + trans + trailingMatch;
              node._lastTranslated = trans;
            }
          }
        });
      }

    } finally {
      if (this._observer) {
        try { this._observer.takeRecords(); } catch (e) {}
      }
      this.isTranslating = false;
    }
  }
}

// Global Singleton Instance & Localization Helpers
window.janasevaTranslator = new JanasevaTranslator();
window.janasevaT = function(text, targetLang) {
  return window.janasevaTranslator ? window.janasevaTranslator.get(text, targetLang) : text;
};
window.janasevaAlert = function(msg) {
  return window.alert(window.janasevaT(msg));
};
window.janasevaConfirm = function(msg) {
  return window.confirm(window.janasevaT(msg));
};
window.janasevaPrompt = function(msg, defVal, translateDef = false) {
  const localizedDef = (translateDef && defVal !== undefined) ? window.janasevaT(defVal) : defVal;
  return window.prompt(window.janasevaT(msg), localizedDef);
};

// Attach DOMContentLoaded Handlers & MutationObserver
document.addEventListener('DOMContentLoaded', () => {
  window.janasevaTranslator.applyTranslations();

  document.querySelectorAll('.janaseva-lang-select').forEach(sel => {
    sel.value = window.janasevaTranslator.currentLang;
    sel.addEventListener('change', (e) => {
      const newLang = window.janasevaTranslator.normalizeLangCode(e.target.value);
      window.janasevaTranslator.setLanguage(newLang);

      if (typeof window.showToast === 'function') {
        const msg = newLang === 'kn' ? 'ಭಾಷೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ' :
                    newLang === 'hi' ? 'भाषा को सफलतापूर्वक हिन्दी में बदल दिया गया है' :
                    'Language successfully switched to English';
        window.showToast(msg, 'success');
      }
    });
  });

  let observerTimer = null;
  const isIgnoredNode = (n) => {
    const el = n.nodeType === Node.ELEMENT_NODE ? n : n.parentElement;
    if (!el) return true;
    return Boolean(
      el.classList?.contains('toast') ||
      el.closest('.toast-container') ||
      el.closest('#janaseva-ai-chat-drawer') ||
      el.closest('#janaseva-ai-assistant-widget') ||
      el.closest('.janaseva-lang-select')
    );
  };

  const observer = new MutationObserver((mutations) => {
    if (window.janasevaTranslator.isTranslating) return;
    if (window.janasevaTranslator.currentLang === 'en') return;

    let shouldTranslate = false;
    for (const m of mutations) {
      if (m.type === 'characterData') {
        if (!isIgnoredNode(m.target)) {
          shouldTranslate = true;
          break;
        }
      } else if (m.type === 'childList' && m.addedNodes.length > 0) {
        for (const n of m.addedNodes) {
          if ((n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) && !isIgnoredNode(n)) {
            shouldTranslate = true;
            break;
          }
        }
      }
      if (shouldTranslate) break;
    }

    if (shouldTranslate) {
      clearTimeout(observerTimer);
      observerTimer = setTimeout(() => {
        window.janasevaTranslator.applyTranslations();
      }, 40);
    }
  });

  window.janasevaTranslator._observer = observer;
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
});
