# JANASEVA — Separate Working Folders

This project has distinct folders for website, Android, backend, database, utilities, and documentation. **Use the entire folder as one project**: the folders are separate but share configuration and published assets.

## Folders

- `website/` — all HTML, CSS, JS, assets, service worker and PWA manifest; `website/public/` is the deployable output.
- `android/` — native hosted-origin Android source and the **original historical APK** under `releases/`.
- `backend/` — Firebase Cloud Functions and an **inactive, unverified** legacy Netlify function.
- `database/` — Firestore rules/indexes, Storage rules, and the historical Supabase reference SQL; there is **no local running Firestore database included**.
- `tools/` — website build, integrity check, static structure tests, migration dry-run, production preflight.
- `docs/` — setup and verification instructions. `previous-project-docs/` are retained historical documents with old paths/status claims.

`firebase.json` and `netlify.toml` stay at the project root because the hosting CLIs require them there; their paths point to the separated folders.

## Start the website locally

From **this project's root**:

```bash
python3 tools/check_release.py
python3 tools/build_public.py
python3 tools/verify_structure.py
python3 -m http.server 8080 --directory website/public
```

Open `http://localhost:8080/`. Localhost can run in demonstration mode; local records are **not** shared across devices. A connection to a live Firebase project is required for shared accounts and records.

## Production deployment (do not skip)

1. Read `docs/SETUP_AND_LIMITATIONS.md` and `docs/VERIFICATION_REPORT.md`.
2. Configure **the same Firebase project** in `website/js/firebase-config.js`, enable Auth/Firestore/Storage and run staging acceptance tests.
3. Install Node dependencies at `backend/firebase/functions/` and deploy after reviewing rules and role permissions.
4. Run `python3 tools/build_public.py`; deploy `website/public/` through Firebase or Netlify static hosting.
5. Rebuild and sign the Android source in `android/source/` against your real HTTPS website URL, retaining the app ID and original signing certificate. The current `android/releases/JANASEVA-latest.apk` is **not** that rebuilt app.

**Do not publish the legacy Netlify API gateway as-is.** It is retained at `backend/netlify/functions/api-gateway.js` but disconnected in `netlify.toml` due to the security concerns identified by the original project report. Any UI features relying on `/api/*` require a reviewed and authenticated replacement.

No external servers, accounts, signing keys, databases or devices were supplied, so this archive cannot honestly be described as an end-to-end production-connected app.
