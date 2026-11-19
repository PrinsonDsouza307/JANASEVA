#!/usr/bin/env python3
"""Conservative production blockers; never changes cloud services or files."""
from pathlib import Path
import re, json, sys
ROOT = Path(__file__).resolve().parents[1]
errors, warnings = [], []
text = (ROOT / 'website/js/firebase-config.js').read_text(encoding='utf8')
placeholders = sorted(set(re.findall(r'YOUR_[A-Z0-9_]+|REPLACE_WITH_[A-Z0-9_]+|DEMO_KEY',text)))
if placeholders:
    errors.append('Firebase config placeholders: '+', '.join(placeholders))
if 'readyForProduction = true' in text:
    errors.append('Firebase client must not self-certify production readiness')
if not (ROOT / 'android/source/gradle/wrapper/gradle-wrapper.jar').is_file():
    errors.append('Android Gradle wrapper JAR missing; restore via trusted build tooling')
release = json.loads((ROOT / 'android/releases/release.json').read_text(encoding='utf8'))
gradle = (ROOT / 'android/source/app/build.gradle').read_text(encoding='utf8')
version_code = re.search(r'versionCode\s+(\d+)',gradle)
version_name = re.search(r"versionName\s+'([^']+)'",gradle)
if version_code and version_name and (int(version_code.group(1)) != release.get('versionCode') or version_name.group(1) != release.get('versionName')):
    warnings.append('Bundled APK does not correspond to current Android source version')
if release.get('rebuilt') is not True or release.get('sharedBackendConfigured') is not True:
    errors.append('APK release metadata confirms no validated live-backend rebuild')
for msg in warnings:print('REVIEW:',msg)
for msg in errors:print('BLOCKED:',msg)
if errors:
    print(f'PRODUCTION PREFLIGHT FAILED ({len(errors)} blocker(s)). Do not claim live cross-device sync.')
    sys.exit(1)
print('Static preflight passed; staging, permissions and device tests are still mandatory.')
