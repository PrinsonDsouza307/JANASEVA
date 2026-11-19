@echo off
cd /d "%~dp0"
echo ===================================================
echo   JANASEVA Local Development & Hosting Launcher
echo ===================================================
echo.
echo [1/3] Verifying release integrity...
python tools\check_release.py
if errorlevel 1 (
  echo Integrity check FAILED.
  pause
  exit /b 1
)

echo [2/3] Building website/public distribution...
python tools\build_public.py
if errorlevel 1 (
  echo Website build FAILED.
  pause
  exit /b 1
)

echo [3/3] Starting local HTTP server with clean URL routing...
echo.
echo Local Website: http://localhost:5000/
echo.
echo Available Pages:
echo   - Home:               http://localhost:5000/
echo   - Citizen Dashboard:  http://localhost:5000/citizen-dashboard
echo   - File Grievance:     http://localhost:5000/complaint
echo   - Track Grievance:    http://localhost:5000/track
echo   - Login / Register:   http://localhost:5000/login
echo   - Receiver Dashboard: http://localhost:5000/receiver-dashboard
echo   - Directory:          http://localhost:5000/directory
echo   - Knowledge Centre:   http://localhost:5000/knowledge-centre
echo.
echo Database Sync Status:
echo   - In-browser sync: ACTIVE (js/rtdb-firestore-sync.js)
echo   - Background CLI sync: Run "node tools\sync_databases.cjs --status"
echo.
echo Press Ctrl+C to stop the server.
echo.

where node >nul 2>&1
if %errorlevel% equ 0 (
  node tools\local_server.cjs 5000
) else (
  echo Node.js not detected; falling back to Python HTTP server on port 8080...
  echo Open http://localhost:8080/index.html
  python -m http.server 8080 --directory website\public
)

pause
