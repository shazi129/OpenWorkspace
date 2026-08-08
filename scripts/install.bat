@echo off
setlocal EnableExtensions

set "REPOSITORY_ROOT=%~dp0.."
set "EXIT_CODE=0"

pushd "%REPOSITORY_ROOT%" >nul
if errorlevel 1 (
    echo [ERROR] Failed to enter the OpenWorkspace repository.
    exit /b 1
)

:: Step 1: Install fnm if missing
where fnm >nul 2>nul
if errorlevel 1 (
    echo [INFO] fnm is not installed. Installing via winget...
    winget install Schniz.fnm
    if errorlevel 1 (
        echo [ERROR] Failed to install fnm.
        echo         Please install manually: winget install Schniz.fnm
        set "EXIT_CODE=1"
        goto finish
    )
    echo [INFO] fnm installed successfully.
    echo [INFO] Please close and reopen this terminal, then run this script again.
    set "EXIT_CODE=1"
    goto finish
)

:: Step 2: Read Node version from .nvmrc
if not exist ".nvmrc" (
    echo [ERROR] Node version file not found: %REPOSITORY_ROOT%\.nvmrc
    set "EXIT_CODE=1"
    goto finish
)

set "NODE_VERSION="
set /p NODE_VERSION=<".nvmrc"
if not defined NODE_VERSION (
    echo [ERROR] Node version file is empty: %REPOSITORY_ROOT%\.nvmrc
    set "EXIT_CODE=1"
    goto finish
)

:: Step 3: Initialize fnm environment
for /f "tokens=*" %%z in ('fnm env') do call %%z
if errorlevel 1 (
    echo [ERROR] Failed to initialize the fnm environment.
    set "EXIT_CODE=1"
    goto finish
)

:: Step 4: Install required Node version
echo [INFO] Installing Node.js %NODE_VERSION%...
fnm install %NODE_VERSION%
if errorlevel 1 (
    echo [ERROR] Failed to install Node.js %NODE_VERSION%.
    set "EXIT_CODE=1"
    goto finish
)

:: Step 5: Switch to required Node version
fnm use %NODE_VERSION%
if errorlevel 1 (
    echo [ERROR] Failed to switch to Node.js %NODE_VERSION%.
    set "EXIT_CODE=1"
    goto finish
)

echo [INFO] Node.js %NODE_VERSION% is now active:
node --version

:: Step 6: Install dependencies
if exist "node_modules" (
    echo [INFO] node_modules already exists. Running npm install...
) else (
    echo [INFO] Installing dependencies with npm install...
)
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed.
    set "EXIT_CODE=1"
    goto finish
)

echo [INFO] Installation complete. You can now run: scripts\preview.bat

:finish
popd >nul
exit /b %EXIT_CODE%
