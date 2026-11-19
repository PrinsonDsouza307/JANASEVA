@echo off
REM ============================================================================
REM JANASEVA – Local Development Server
REM Starts Firebase Emulators (Auth, Firestore, RTDB, Storage, Functions, Hosting)
REM with database sync between Realtime Database and Firestore
REM ============================================================================

echo.
echo ========================================
echo  JANASEVA Local Development Server
echo ========================================
echo.

REM Check if firebase CLI is available
where firebase >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Firebase CLI not found. Install with: npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

REM Check for Java (required for Firestore and RTDB emulators)
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Java not found. Firebase emulators require Java 11+.
    echo [WARNING] Install Java from: https://adoptium.net/
    echo [WARNING] Attempting to start anyway...
    echo.
)

REM Navigate to project root
cd /d "%~dp0"

REM Install functions dependencies if needed
if not exist "backend\firebase\functions\node_modules" (
    echo [SETUP] Installing Cloud Functions dependencies...
    cd backend\firebase\functions
    npm install
    cd ..\..\..
    echo.
)

echo [START] Launching Firebase Emulators...
echo.
echo   Auth Emulator:      http://localhost:9099
echo   Firestore Emulator: http://localhost:8080
echo   RTDB Emulator:      http://localhost:9000
echo   Functions Emulator: http://localhost:5001
echo   Storage Emulator:   http://localhost:9199
echo   Hosting (Website):  http://localhost:5000
echo   Emulator UI:        http://localhost:4000
echo.
echo   Press Ctrl+C to stop all emulators.
echo.

REM Set emulator environment variables for the sync tool
set FIRESTORE_EMULATOR_HOST=localhost:8080
set FIREBASE_DATABASE_EMULATOR_HOST=localhost:9000
set FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
set FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

REM Start Firebase emulators with import/export for data persistence
firebase emulators:start --project janaseva-5f4bd --import=.emulator-data --export-on-exit=.emulator-data
