#!/usr/bin/env python3
"""Local, non-deploying structural smoke checks; does not test Firebase or Android devices."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, subprocess, sys, tomllib
ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'website' / 'public'
problems = []
class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag in ('script','img','iframe') and d.get('src'):self.urls.append(d['src'])
        if tag=='link' and d.get('href'):self.urls.append(d['href'])
        if tag=='a' and d.get('href') and not d.get('href','').startswith('#'):
            self.urls.append(d['href'])
for doc in sorted(WEB.glob('*.html')):
    parser=Assets()
    parser.feed(doc.read_text(encoding='utf8'))
    for link in parser.urls:
        if link.startswith(('http://','https://','//','data:','blob:','mailto:','tel:','javascript:','#')):continue
        p=unquote(urlsplit(link).path)
        if not p:continue
        candidate = (WEB/p.lstrip('/')) if p.startswith('/') else (doc.parent/p)
        if not candidate.exists():
            # Netlify convenience paths can omit .html but local file server cannot.
            if candidate.with_suffix('.html').exists():continue
            problems.append(f'{doc.name}: missing local asset/route {link}')
for required in ['index.html','sw.js','manifest.json','css/style.css','js/firebase-config.js','android/JANASEVA-latest.apk']:
    if not (WEB / required).is_file():problems.append(f'missing published {required}')
cfg=json.loads((ROOT/'firebase.json').read_text(encoding='utf8'))
paths=[cfg['hosting']['public'],cfg['firestore']['rules'],cfg['firestore']['indexes'],cfg['storage']['rules'],cfg['functions'][0]['source']]
for rel in paths:
    if not (ROOT/rel).exists():problems.append(f'Firebase target missing: {rel}')
net=tomllib.loads((ROOT/'netlify.toml').read_text(encoding='utf8'))
if net['build']['publish'] != 'website/public':problems.append('Netlify publish target is wrong')
if any(x.get('to','').endswith('api-gateway') for x in net.get('redirects',[])):
    problems.append('Unsafe unauthenticated Netlify gateway still active')
for source in sorted((WEB/'js').glob('*.js'))+sorted((ROOT/'backend').rglob('*.js')):
    r=subprocess.run(['node','--check',str(source)],capture_output=True,text=True)
    if r.returncode:problems.append(f'JS syntax {source.relative_to(ROOT)}: {r.stderr[:200]}')
if problems:
    for error in problems:print('FAIL',error)
    print(f'STRUCTURAL SMOKE FAILED: {len(problems)} issue(s)')
    sys.exit(1)
print(f'PASS: checked HTML local resources ({len(list(WEB.glob("*.html")))} pages), Firebase/Netlify targets, and JavaScript syntax.')
print('LIMITATION: This does NOT verify live database, cloud functions, Android compilation or device behavior.')
