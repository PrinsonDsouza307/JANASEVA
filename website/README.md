# Website

Static multi-page JANASEVA frontend. HTML references `css/`, `js/`, `assets/` relative to the website root; do not separate these three folders from the pages. The web build copies the exact source to `public/`, with the historical APK at `public/android/JANASEVA-latest.apk`.

At the **project root**, run `python3 tools/build_public.py`, then `python3 -m http.server 8080 --directory website/public`. Firebase configuration is in `website/js/firebase-config.js` and currently has placeholders. Development-only localhost demo mode is not cross-device authentication.
