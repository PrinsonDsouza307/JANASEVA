# JANASEVA Setup, Database Connection & Deployment Guide

This document specifies the exact setup and commands required to connect both the Web Application and the Android Client to ONE shared Firebase project.

---

## 1. Architecture Overview

- **Authoritative Database:** Cloud Firestore.
- **Authoritative File Store:** Firebase Storage.
- **Authoritative Authentication:** Firebase Auth (Email/Password with custom role claims).
- **Authoritative Server Logic:** Firebase Cloud Functions (Node.js 20).
- **Public Web Host:** Firebase Hosting (publishing only `public/`).
- **Android Shell:** Native Android WebView loading the deployed origin.

---

## 2. Prerequisites & Tools

- Node.js 20+ and npm
- Python 3.10+
- Firebase CLI (`npm install -g firebase-tools`)
- JDK 17 & Android SDK Platform 35 (for Android compilation)

---

## 3. Step-by-Step Connection Procedure

### Step 1: Provision Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com).
2. Create or select a project (e.g. `janaseva-production`).
3. Enable **Authentication** with Email/Password provider.
4. Enable **Cloud Firestore** in production mode.
5. Enable **Cloud Storage**.
6. Register a Web App under Project Settings to obtain the public Web configuration.

### Step 2: Configure Client Settings
Copy the Web configuration object into `js/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "janaseva-production.firebaseapp.com",
  projectId: "janaseva-production",
  storageBucket: "janaseva-production.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef..."
};
```
*(Public client API keys do not expose administrative privileges; security is strictly enforced by server-side rules in `firestore.rules` and `storage.rules`).*

### Step 3: Configure Server Secrets (Cloud Functions)
Never place sensitive credentials in frontend files or repository commits. Set them via Google Cloud Secret Manager:
```bash
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set GOOGLE_CLOUD_VISION_API_KEY
firebase functions:secrets:set WHATSAPP_API_TOKEN
```

### Step 4: Run Local Verification Suite
Ensure all checks pass before deploying:
```bash
node scripts/test_unification.cjs
node scripts/test_integration.cjs
python scripts/check_release.py
node scripts/migrate_database.cjs --test
node scripts/test_comprehensive_verification.cjs
python scripts/build_public.py
```

### Step 5: Deploy Backend Rules, Indexes & Hosting
Deploy strictly to your authenticated Firebase project:
```bash
firebase use janaseva-production

# Deploy database security rules and composite indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy storage security rules
firebase deploy --only storage

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy public hosting assets
firebase deploy --only hosting
```

### Step 6: Provision Authorized Roles
Initial Administrator and Receiver accounts must be provisioned via Firebase Admin SDK or the Firebase Console, never via public registration:
- **Admin:** Assign custom claim `{ role: 'admin' }` and create document in `users/{adminUid}` with `role: "admin"`.
- **Receiver:** Assign custom claim `{ role: 'receiver', panchayatId: 'gp-001' }` and document in `users/{receiverUid}` with `role: "receiver"` and `panchayatId: "gp-001"`.
- **Citizen:** Self-registers freely via `login.html`; backend rules automatically assign and enforce `role: "citizen"`.

### Step 7: Build & Sign Android Application
Compile the Android release APK targeting the deployed HTTPS origin:
```bash
cd Android/source
./gradlew assembleRelease -PJANASEVA_URL=https://janaseva-production.web.app/
```
Verify the signing fingerprint with `apksigner` before distributing to citizens and panchayats.
