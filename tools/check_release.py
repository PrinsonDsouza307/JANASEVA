#!/usr/bin/env python3
"""Verify integrity and URL of historical APK, not app feature compatibility."""
from pathlib import Path
import hashlib, json, zipfile
ROOT = Path(__file__).resolve().parents[1]
APK_SOURCE = ROOT / 'android' / 'releases'
m = json.loads((APK_SOURCE / 'release.json').read_text(encoding='utf8'))
apk = APK_SOURCE / 'JANASEVA-latest.apk'
assert m['downloadPath'] == 'android/JANASEVA-latest.apk', 'APK must be at public /android/ route'
assert apk.stat().st_size == m['sizeBytes'], 'APK size mismatch'
assert hashlib.sha256(apk.read_bytes()).hexdigest() == m['sha256'], 'APK SHA256 mismatch'
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None, 'APK archive corrupted'
    for name in ('AndroidManifest.xml', 'classes.dex', 'META-INF/JANASEVA.RSA'):
        assert name in z.namelist(), f'Missing APK entry: {name}'
html = (ROOT / 'website' / 'index.html').read_text(encoding='utf8')
assert m['downloadPath'] in html and m['sha256'] in html and 'Download Android App' in html
apks = [p for p in ROOT.rglob('*.apk') if 'public' not in p.relative_to(ROOT).parts]
assert apks == [apk], f'Expected one canonical APK outside built public: {apks}'
published = ROOT / 'website' / 'public' / 'android' / 'JANASEVA-latest.apk'
if published.exists():
    assert published.read_bytes() == apk.read_bytes(), 'Published APK differs from canonical APK'
print('PASS: APK SHA256, archive, website download link and release metadata match.')
if not m.get('rebuilt') or not m.get('sharedBackendConfigured'):
    print('LIMITATION: Original APK is a historical/local-only release, not a rebuilt live-backend app.')
