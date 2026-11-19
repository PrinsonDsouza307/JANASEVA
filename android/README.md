# Android

`source/` is Android Gradle source for a **hosted HTTPS website WebView**. It has to be rebuilt after the web host/domain is known; the code pins `BuildConfig.SITE_URL` at build time.

`releases/JANASEVA-latest.apk` is the original historical v1.0 APK (not rebuilt and not sharing a working Firebase backend). `releases/release.json` contains SHA-256, version and signer fingerprint. The website build publishes a copy at `/android/JANASEVA-latest.apk`.

Build using Android SDK 35, Java 17 and Gradle 8.11.1; the supplied source **lacks** `gradle/wrapper/gradle-wrapper.jar`, and no new APK was built in this reorganization. With a trusted Gradle installation and configured URL, build debug from `android/source/` using `gradle assembleDebug -PJANASEVA_URL=http://10.0.2.2:8080/` for emulator or `gradle assembleRelease -PJANASEVA_URL=https://YOUR_REAL_DOMAIN/` with original keystore environment variables. Release updates must be signed by the existing signer and be tested before changing the downloaded APK.
