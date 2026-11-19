#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
python3 tools/check_release.py
python3 tools/build_public.py
if command -v node >/dev/null 2>&1; then
  printf 'Starting JANASEVA server on http://localhost:5000/\n'
  node tools/local_server.cjs 5000
else
  printf 'Open http://localhost:8080/ and press Ctrl+C to stop.\n'
  python3 -m http.server 8080 --directory website/public
fi
