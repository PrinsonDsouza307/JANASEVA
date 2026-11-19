# Inspection and completion status — 15 November 2026

## Inputs and architecture

- Actual attachment: Website.zip, containing JANASEVA/. The requested filename
  JANASEVA(2).zip was not supplied under that name; no assumption of byte identity
  with an earlier archive was made.
- Website: static HTML/CSS/JavaScript, service worker, Firebase Auth/Firestore/
  Storage integration and Node Cloud Functions. Supabase helpers, SQL schema and
  a separate Netlify API gateway also exist.
- Both Firebase and Supabase settings are placeholders. Firebase is the primary
  path used by the inspected auth flow; configuring Supabase alone will not make
  that flow share Firebase accounts.
- APK: com.janaseva.mobile, versionName 1.0, versionCode 1, minSdk 26, targetSdk 34.
  Manifest disables cleartext traffic and app backup. Native DEX strings identify
  a WebView loading https://appassets.androidplatform.net/index.html and bundled
  assets/www/. This is a local virtual origin, not a deployed JANASEVA server.
- The APK's index.html, firebase-config.js and supabase-config.js matched the
  supplied website byte for byte before edits. It bundles an independent snapshot.
  A website deployment cannot update these embedded assets.
- App permissions include Internet and coarse/fine location. Installation and
  runtime permission behavior have not been tested on a device.

## Completed

- Visible homepage hero link and responsive download card; direct anonymous APK
  link with no JavaScript dependency, verified version/size, install instructions,
  explicit local-only release status and SHA-256.
- One canonical APK source at android/JANASEVA-latest.apk; original bytes preserved.
  No rebuilt APK is represented as an update.
- Release JSON/checksum; service worker bypass for APK/release files and cache
  version bump; Firebase/Netlify download headers.
- Allowlisted public build prevents publishing backend files, rules, SQL, docs or
  environment examples as static hosting files. Use public/, never the repo root.
- Website login/registration refuses simulation on public hosts, public startup
  does not trust a cached local user, and missing live profiles default to citizen
  instead of an email-derived privileged role. These are frontend safeguards;
  server rules remain the authority and require separate integration tests.
- Original backend source, rules and SQL are included. No schema changes were
  necessary for the download feature. No migration was run and no records deleted.

## Not completed / cannot be verified with these inputs

| Requirement | Status and dependency |
| --- | --- |
| Live anonymous HTTPS download | Packaged route only; hosting/domain access missing. |
| Shared login, profiles and records | Blocked: no real backend configuration; APK embeds placeholders. |
| App receives website changes | Blocked: source project and original signing material required to rebuild. |
| Feature parity | Unverified; embedded pages start from the same snapshot, but browser APIs, OCR, file downloads/uploads, notifications, location and offline behavior need device testing. |
| Authentication and permission tests | No configured backend or test accounts; no emulator rule suite supplied. |
| Installation/update test | No Android device/emulator or original installed app available. |
| Security certification | Not performed. Existing broad codebase still requires a production review. |

## Specific integration/security concerns to resolve

1. Original local storage and IndexedDB records live independently in each browser
   and app installation. They cannot be merged by deploying a download link.
2. The Netlify gateway accepts POST requests without verifying a user token and can
   forward requests using supplied/provider credentials. Do not enable it publicly
   until token verification, per-action authorization, secret storage, rate limits
   and DNS-aware outbound allowlists are implemented and tested. The current UI
   callers also need tokens. Firebase Hosting does not automatically implement
   Netlify /api routes, so those integrations are not feature complete there.
3. Existing client API-vault and notification configuration features need a review
   to prevent private provider credentials being stored in browser storage. Keep
   provider/service-role secrets server-side; Firebase web config is public config.
4. Firebase startup can fall back to local storage when configuration/SDK loading
   fails. The auth guard reduces misleading public logins but does not convert
   every feature into a fail-closed cloud implementation. Production writes must
   never silently succeed in a separate local database.
5. Review and test Firestore/Storage rules and Cloud Function role checks before
   deploying to a real database. Client role checks are not access control.

## Required next inputs

- Original Android project (MainActivity, build scripts, manifest and assets).
- Original signing keystore, alias and access via a secure build environment.
  Do not paste signing passwords or private keys into chat. The release signer
  certificate SHA-256 is recorded in android/release.json for comparison.
- Intended HTTPS website domain and authorized hosting project access.
- Existing Firebase project ID and public web-app configuration, authorized auth
  domains, backend region, and test citizen/receiver/admin accounts. Server secrets
  must be configured on the host. If Supabase is intended as the primary backend,
  confirm that choice before converting the Firebase-dependent application.
- Existing database schema/rules export and anonymized sample records if real
  data already exists, plus a backup and a separate staging environment.

Choose one Firebase project for both clients. Rebuild Android with the configured
shared services (or an explicitly approved hosted-web shell with tested native
bridges), retain com.janaseva.mobile and the original signer, and increment
versionCode above 1. Increasing versionName alone is not an Android update.
Do not re-sign with a new key or instruct users to uninstall: either can break
updates and lose local data. A decompiled APK is not the original build project.
