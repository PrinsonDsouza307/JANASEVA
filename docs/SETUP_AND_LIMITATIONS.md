# How the separated folders work together

## Working now without cloud access

- The static website can be served on localhost with all included HTML/CSS/JS/images and OCR assets.
- Website's Android download route serves the **unchanged historical APK** copied from `android/releases/`.
- Release SHA-256 and metadata can be validated locally.
- JavaScript can be syntax-checked locally and Firebase/Netlify config file paths verified.
- Database migration dry-run script can run without changing a database.

## Blocked until owner configuration and tests

- Firebase Web App config in `website/js/firebase-config.js` is placeholder-filled. Real auth, shared Firestore records and Firebase Storage do not work without a real project.
- Real Cloud Functions need configured Firebase project, dependencies, service secrets and security tests. `backend/firebase/functions/` only contains source.
- Android native source (`android/source/`) lacks a Gradle wrapper jar, real deployment origin, release-signing access and device/emulator acceptance tests. Historical APK predates hosted-origin source.
- Existing frontend uses some local browser storage, and cross-platform/offline data convergence is not proven by reorganizing files.
- An unreviewed legacy Netlify API forwarder was retained but deliberately unhooked. Cloud integrations depending on `/api/` are not fully operational until a secure endpoint is built.
- Public HTTPS app download requires actual web hosting. No public download URL is verified.

## Commands (run from project root)

```
python3 tools/check_release.py
python3 tools/build_public.py
python3 tools/verify_structure.py
node tools/migrate_database.cjs --test
python3 tools/preflight_production.py
python3 -m http.server 8080 --directory website/public
```

`preflight_production.py` is expected to FAIL while unresolved configuration or Android release blockers exist; failure is the correct security behavior. A local test pass does not certify cloud functionality.

## Firebase project coordination

1. Provision one Firebase Auth/Firestore/Storage/Functions project and staging test users.
2. Set public Firebase SDK settings (not admin secrets) in `website/js/firebase-config.js`.
3. Audit/deploy the database rules and indexes from `database/`; store server secrets in the hosting provider's secure secret store.
4. Deploy reviewed Cloud Functions from `backend/firebase/functions/`.
5. Build/deploy `website/public/` to HTTPS. Confirm role-based operations on the site with multiple browsers.
6. Rebuild/sign Android hosted-origin shell pointing to the exact HTTPS site; upgrade it using the original signing certificate and validated version code; test login, CRUD, attachments, device permissions, offline queues and upgrades on real Android devices.
7. Re-run acceptance on two distinct accounts and devices before claiming synchronized data.
