# Android Source, Build Architecture & Release Gates

The maintainable Android application is located in `Android/source/`.
It is a **native Android shell hosting a secure, restricted WebView** (`MainActivity.java`).
Both the web client and the Android app load the same website source code, Firebase configuration, and security rules from the configured origin.

---

## 1. Important Network Architecture Notice: Localhost vs Emulator

- **On an Android Device / Emulator:** `localhost` and `127.0.0.1` refer to the **Android phone itself**, NOT your development workstation!
- **Android Emulator Loopback:** To access a development server running on your computer from the official Android Emulator, use:
  ```
  http://10.0.2.2:5000/
  ```
  (where `5000` is the local hosting port).
- **Physical Device over LAN:** Use your computer's local network IP (e.g. `https://192.168.1.50:5000/` or an HTTPS reverse tunnel like Cloudflare Tunnel / ngrok).
- **Cleartext Traffic Policy:**
  - **Debug Builds:** Allowed solely for local development (`10.0.2.2`, `localhost`, `127.0.0.1`) via `src/debug/AndroidManifest.xml`.
  - **Release Builds:** Strictly enforces HTTPS. Cleartext traffic is hard-blocked (`usesCleartextTraffic="false"`).

---

## 2. Client Settings Requiring an Android Rebuild

| Setting | Location | Rebuild Required? | Notes |
| :--- | :--- | :--- | :--- |
| **Backend Origin URL (`SITE_URL`)** | `Android/source/app/build.gradle` (`-PJANASEVA_URL`) | **YES** | Baked into `BuildConfig.SITE_URL` at compile time. |
| **Android Package / App ID** | `build.gradle` (`applicationId`) | **YES** | Cannot be changed over-the-air. |
| **Version Code / Name** | `build.gradle` (`versionCode`, `versionName`) | **YES** | Governs Google Play & device package updates. |
| **App Icons & Native Splash** | `src/main/res/mipmap/` | **YES** | Stored in native Android resource bundle. |
| **Native Permissions** | `src/main/AndroidManifest.xml` | **YES** | Camera, Audio, Location permissions declared in manifest. |
| **Firebase Web Config** | `js/firebase-config.js` | **NO** | Loaded dynamically from the authoritative hosted origin. |
| **Firestore & Storage Rules** | `firestore.rules`, `storage.rules` | **NO** | Deployed directly to Firebase Cloud; zero client rebuild needed. |
| **UI, CSS, HTML, Languages** | `*.html`, `css/`, `js/` | **NO** | Updates immediately upon web deployment. |

---

## 3. Build Instructions

### Prerequisites
- JDK 17, Gradle 8.11.1 (via the configured wrapper), Android SDK Platform 35 and Build Tools 35.0.0.
- Original release signing key and alias (for release builds).

### A. Debug Build (For Local Testing & Emulator)
Both `./gradlew` (Linux/macOS) and `gradlew.bat` (Windows) are provided in `Android/source/`.
If bootstrapping the wrapper JAR (`gradle-wrapper.jar`) in a fresh environment, run:
```bash
cd Android/source
gradle wrapper --gradle-version 8.11.1
./gradlew assembleDebug -PJANASEVA_URL=http://10.0.2.2:5000/
```
Output: `Android/source/app/build/outputs/apk/debug/app-debug.apk`  
Package: `com.janaseva.mobile.debug` (will not overwrite production installations).

### B. Release Build (Production-Ready)
Configure signing environment variables in your secure CI/CD environment:
```bash
export JANASEVA_KEYSTORE=/path/to/release.keystore
export JANASEVA_STORE_PASSWORD=your_store_password
export JANASEVA_KEY_ALIAS=your_key_alias
export JANASEVA_KEY_PASSWORD=your_key_password

./gradlew assembleRelease -PJANASEVA_URL=https://your-deployed-domain.gov.in/
```

### Signer Verification Gate
Before releasing or replacing any downloadable APK, verify the signature with `apksigner`:
```bash
apksigner verify --print-certs app-release.apk
```
The SHA-256 fingerprint MUST match:
`c4766573d7784766524a2b96619ce54364a2a2a64de280ce3cd55dcd327d9300`

---

## 4. Existing Canonical APK Status

`android/JANASEVA-latest.apk` is the historical 1.0 snapshot. It is intentionally preserved until an officially signed 1.1 replacement APK is built and verified on physical hardware.
Never commit untested release APKs to the source repository.

## Clean-environment Gradle wrapper prerequisite

The supplied source archive contains `gradlew`, `gradlew.bat` and `gradle-wrapper.properties`, but does not contain `gradle/wrapper/gradle-wrapper.jar`. A clean machine therefore cannot rely on the checked-in wrapper until the standard wrapper JAR is restored. With a trusted Gradle 8.11.1 installation available, run from `Android/source`:

```bash
gradle wrapper --gradle-version 8.11.1 --distribution-type bin
./gradlew --version
```

Verify the generated `gradle/wrapper/gradle-wrapper.jar` and wrapper scripts against the official Gradle distribution before committing them. Do not download an unverified JAR from an arbitrary mirror.
