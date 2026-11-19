# JANASEVA — 22-Problem Repair Status

**Baseline:** `JANASEVA1_backup_original.zip` (untouched; work performed in a separate copy)  
**Rule:** No credentials, domains, provider tokens, signing keys, cloud results, or device results have been fabricated.

This register deliberately distinguishes code changes from tasks that require the owner's Firebase/provider accounts or external test environment. A source-only ZIP cannot complete all 22 acceptance tasks.

| # | Problem | Status in this package | Evidence / remaining action |
|---:|---|---|---|
| 1 | Firebase not connected to a real project | BLOCKED | No project credentials supplied. Configure the owner's Firebase Web App and test staging Auth/Firestore/Storage/Functions. |
| 2 | Firebase placeholders | BLOCKED | `js/firebase-config.js` retains explicit placeholders. Replacing them requires genuine project config; production preflight now fails closed while placeholders remain. |
| 3 | LOCAL_SIMULATION fallback / misleading readiness | PARTIALLY FIXED | Firebase SDK initialization no longer sets `readyForProduction=true`; status explicitly says acceptance testing remains unverified. Local persistence remains available for drafts. Cloud submission still needs live staging validation. |
| 4 | Missing Gradle wrapper JAR | BLOCKED | `gradle-wrapper.jar` is absent and no trusted Gradle installation is available in this build environment. Generate with Gradle 8.11.1 using `gradle wrapper --gradle-version 8.11.1`; commit the standard wrapper JAR. |
| 5 | Android source/APK version mismatch | BLOCKED | Source is 1.1/code 2; supplied APK metadata is 1.0/code 1 and marked `rebuilt:false`. A new APK requires Android SDK/build tools, real HTTPS site URL, and original signing key. Historical APK metadata is not falsified. |
| 6 | Website and Android not verified against one live database | BLOCKED | Firebase staging project and Android runtime test required. Shared backend architecture retained; no live sync evidence exists. |
| 7 | Legacy API gateway returns HTTP 503 | INTENTIONALLY DISABLED / REVIEW | Kept disabled because reactivation without authentication, authorization and SSRF review is unsafe. Migrate callers to authenticated Firebase Functions before enabling. |
| 8 | WhatsApp is not a live send | BLOCKED | No WhatsApp Business/Twilio credentials or approved templates. Client must not claim delivery. Configure server-side secrets, consent, webhook and idempotent dispatcher. |
| 9 | SMTP email depends on provider secrets | BLOCKED | No SMTP provider secrets supplied. Configure verified sender and secrets in Functions; test accepted/delivered/bounced states. |
| 10 | Firestore rules not tested against live Firebase | NOT TESTED | Rules retained. Run Firebase Emulator Suite allow/deny tests and staging verification; no rules were weakened. |
| 11 | Storage rules not live-verified | NOT TESTED | Rules retained. Test owner/receiver/admin access, MIME/size spoofing and private evidence in emulator and staging. |
| 12 | Offline sync not end-to-end tested | NOT TESTED | Existing queue retained. Test airplane mode, reconnect, duplicate retries, conflict resolution and account switching across real clients. |
| 13 | Android camera/microphone/location/file picker not device-tested | NOT TESTED | Requires built app and physical Android device; permissions and WebView callbacks must be exercised. |
| 14 | Real-time complaint updates not live-verified | NOT TESTED | Existing Firestore listeners retained. Validate two authenticated clients against deployed Firestore and security rules. |
| 15 | AI Knowledge Centre not production-verified | BLOCKED | Requires chosen provider, server secrets, indexed source documents, access-control tests and abuse limits. |
| 16 | OCR not production-verified | BLOCKED | Requires configured OCR provider and sample-document tests. OCR extraction must not be represented as authenticity verification. |
| 17 | Kannada/English/Hindi translation needs functional QA | NOT TESTED | Dictionaries retained. Run a page-by-page language matrix including dynamic messages, forms, chat, notifications and persistence. |
| 18 | Buttons/forms/links not browser-tested | NOT TESTED | Requires supported browser automation and interaction tests. Existing source-level tests remain. |
| 19 | Responsive layouts not visually verified | NOT TESTED | Requires screenshots at mobile/tablet/desktop breakpoints in real browsers. No CSS redesign performed. |
| 20 | Emergency reset security/recovery tests incomplete | NOT TESTED | Existing safeguards retained. Run staging authorization-denial tests, backup integrity and full restore drill before production use. |
| 21 | Legacy Supabase files remain | REVIEW / RETAINED | Kept to avoid breaking unknown imports/history. Firebase remains the documented authoritative backend; remove Supabase only after dependency and migration review. |
| 22 | Historical documentation/release instructions inconsistent | PARTIALLY FIXED | Added this current status register and production preflight guidance. Older historical documents remain clearly identified; owner-specific deployment values still need completion. |

## Changes made

1. `js/firebase-config.js`: Firebase SDK object initialization is no longer reported as production readiness. Configuration validation now requires all six Firebase Web App fields and rejects missing or placeholder values. Live acceptance tests remain explicitly unverified.
2. `scripts/preflight_production.py`: fail-closed preflight detects Firebase placeholders, false production-readiness claims, missing Gradle wrapper JAR and historical APK/source version mismatch. It does not deploy or modify data.
3. `scripts/check_release.py`: now clearly labels the bundled APK as a historical artifact when metadata does not certify a rebuild and shared-backend configuration; byte integrity is not confused with production release approval.
4. `scripts/test_production_safety.cjs`: expanded to eight checks, including complete Firebase configuration validation and historical APK labeling.
5. `docs/ANDROID_BUILD.md`: corrected the Gradle prerequisite to match the configured Gradle 8.11.1 wrapper distribution.
6. `docs/22_PROBLEM_REPAIR_STATUS.md`: this evidence-based 22-item status register and owner action list; `README.md` points to the register and preflight command.

## Owner actions required to complete the blocked items

- Provide the actual Firebase Web App configuration through a secure local configuration workflow; never send service-account/private keys in chat or commit them.
- Configure Firebase Auth, Firestore, Storage, Functions, indexes, authorized domains, App Check and deployed security rules in staging.
- Configure WhatsApp and SMTP provider accounts/secrets and test recipients.
- Provide the real HTTPS website URL and original Android signing keystore through a secure local build environment.
- Run emulator, browser and physical-device acceptance tests, including emergency-reset backup/restore.

## Final release decision

**NOT PRODUCTION READY.** This package contains safe source-level changes and a stricter preflight, but items marked BLOCKED or NOT TESTED are not claimed as fixed. Do not publish the bundled historical APK as a new release.
