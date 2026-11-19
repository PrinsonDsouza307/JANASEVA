# Deployment and acceptance procedure

## Preview / download-only hosting

1. From JANASEVA/, run `python3 scripts/check_release.py` before building public/.
2. Run `python3 scripts/build_public.py`.
3. Preview with `python3 -m http.server 8080 --directory public`.
4. For a download-only Firebase preview on an authorized project, use the Firebase
   CLI to select the project, then `firebase deploy --only hosting --project YOUR_PROJECT_ID`.
   This does not deploy backend functions or rules. A public download-only preview
   is still not a working shared-data portal; retain the release limitation text.
5. Once deployed, the stable route is
   `https://YOUR_ACTUAL_DOMAIN/android/JANASEVA-latest.apk`. This is a template,
   not an existing verified public URL. No login gate should cover this path.
6. Netlify configuration builds public/ but also includes the inherited gateway.
   Do not deploy that function publicly before resolving the security issues in
   INTEGRATION-STATUS.md. Static-only hosting can omit the functions configuration.

Hosting documentation: https://firebase.google.com/docs/hosting/full-config
and https://firebase.google.com/docs/hosting/quickstart

## Production backend (blocked until inputs and staging validation)

Use the existing Firebase project instead of creating separate web/app databases.
Enter only public Firebase web settings in js/firebase-config.js. Enable the
intended sign-in providers and authorized domains. Audit the existing callable
functions, rules and client fallback behavior. Configure server-side provider
secrets using the deployment platform; never publish private environment files.
Install dependencies inside functions/ and test in a separate staging project
before any backend deploy. Review dependency versions and supported Node runtime.

The existing supabase-schema.sql is reference source, not a new safe incremental
migration. Do not execute it against a populated database without reviewing its
DDL and taking a backup. This delivery introduces no database migration.
For legacy local records, design an authenticated, validated and idempotent import
using stable IDs; require record ownership checks and provide rollback. Do not
upload arbitrary local roles or overwrite cloud profiles from local storage.

## Android release

Obtain the original source and signing access. Configure the same backend and
complete feature/runtime tests. Sign with the existing certificate; increment
versionCode. Use Android SDK `apksigner verify --verbose --print-certs` and check
certificate equality. Test `adb install -r` against an installed old release and
verify its records survive. Never treat archive signature checks as device tests.
Replace the one canonical APK, update release.json, SHA256SUMS and homepage
version/size/hash together, run release checks, rebuild public/ and redeploy.

## Acceptance gates (not yet passed)

- In a signed-out/incognito desktop and Android browser, GET the public APK URL:
  HTTP 200, APK MIME type, attachment filename, no login redirect, correct byte
  count and SHA-256. Check that a prior service worker cannot serve an old APK.
- Fresh install and in-place signed update on supported Android versions.
- Register on web; log in on Android with the same Firebase account. Repeat in
  reverse. Edit profiles and create/update/track complaints on both clients.
- Confirm both clients read the same cloud records, including after logout/login;
  define whether a refresh or live listener is required for each view.
- Citizen cannot edit another citizen's records; receiver access stays scoped to
  assigned panchayats; administrator access requires server-granted permission.
  Test direct API/rules access with missing, expired and wrong-role tokens.
- Validate upload MIME/size/ownership, location consent, OCR language packs,
  notification delivery, knowledge centre, API integrations and mobile downloads.
- Test offline/reconnect, duplicate writes, revoked users and denied permissions.
- Take a backup before migration, rehearse rollback and retain old releases outside
  the public hosting directory. Never remove app data to make an update install.
