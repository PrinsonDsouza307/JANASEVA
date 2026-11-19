# JANASEVA folder separation — verification report

## Summary

**File organization completed. Local structural/build and HTTP tests passed. Live shared backend, Android builds/device tests and production acceptance are NOT complete.**

- Reorganized unchanged frontend source into `website/`, unchanged native source into `android/source/`, Firebase Cloud Functions into `backend/firebase/functions/`, database rules into `database/`, historical Netlify gateway into `backend/netlify/functions/`, and tooling into `tools/`.
- Kept `firebase.json` and `netlify.toml` at repository root (required CLI location) with updated internal paths.
- Preserved the original HTML/CSS/JS/image data and APK bytes. Output `website/public/` contains 88 files **identical in content** to the original archive's `JANASEVA/public/` (verified SHA-256 comparisons for all entries).

## Successfully executed tests

1. `python3 tools/check_release.py`: PASS, APK size, signature-archive entries, SHA-256, website hash/link and copy in public output.
2. `python3 tools/build_public.py`: PASS, publishes the frontend and copy of the existing release without exposing backend source/rules.
3. `python3 tools/verify_structure.py`: PASS, checks HTML local asset links across 12 HTML files, required Firebase/Netlify paths, and JavaScript syntax via Node.
4. `node tools/migrate_database.cjs --test`: PASS, synthetic dry-run detects a duplicate and an invalid test record, makes zero cloud writes.
5. Local HTTP server `python3 -m http.server ...`: HTTP 200 verified for homepage, login, complaint, citizen/receiver dashboards, hero image, CSS, JS, APK metadata and APK itself. Local server reports `application/vnd.android.package-archive` for APK MIME type. This does not prove any public HTTPS hosting setup.

## Not passed / not performed

- `python3 tools/preflight_production.py` is **intentionally BLOCKED**: missing real Firebase settings, missing Android Gradle wrapper JAR, original APK not a validated rebuilt shared-backend app. Android source version and historical APK version differ.
- Browser-based automated rendering was attempted, but this execution environment blocked navigation to the local server (`ERR_BLOCKED_BY_ADMINISTRATOR`). It is not a verified browser acceptance test.
- No real Firebase authentication, database write/read, security-rule integration, cloud deployment, Android compilation, on-device APK install, cross-client sync or upgrade test was performed.
- Legacy Netlify API gateway is intentionally **not wired to public routing** until authentication and outbound-request security are reviewed. That API path is not claimed functional in the default static deployment.

See `SETUP_AND_LIMITATIONS.md` for how to complete deployment and shared-database integration.
