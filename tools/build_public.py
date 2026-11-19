#!/usr/bin/env python3
"""Safely build JANASEVA website/public from website/ and one APK release.
Does not publish database rules, server sources, configuration or documentation.
"""
from pathlib import Path
import os, stat, shutil
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'website'
OUT = SOURCE / 'public'
APK_SOURCE = ROOT / 'android' / 'releases'
def remove_readonly(func, path, exc_info):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        pass
if OUT.exists():
    try:
        shutil.rmtree(OUT, onexc=remove_readonly)
    except (TypeError, AttributeError):
        shutil.rmtree(OUT, onerror=remove_readonly)
OUT.mkdir(parents=True)
for path in SOURCE.glob('*.html'):
    shutil.copy2(path, OUT / path.name)
for name in ('manifest.json', 'sw.js'):
    shutil.copy2(SOURCE / name, OUT / name)
for name in ('assets', 'css', 'js'):
    shutil.copytree(SOURCE / name, OUT / name)
release_out = OUT / 'android'
release_out.mkdir()
for name in ('JANASEVA-latest.apk', 'release.json', 'SHA256SUMS'):
    src = APK_SOURCE / name
    if not src.is_file():
        raise FileNotFoundError(f'Expected Android release file: {src}')
    shutil.copy2(src, release_out / name)
print(f'Built {OUT.relative_to(ROOT)}/ from website and the existing historical Android release.')
