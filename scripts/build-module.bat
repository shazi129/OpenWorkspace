@echo off
setlocal EnableExtensions

if "%~1"=="" (
    echo Usage: build-module.bat games,introduction,tools
    echo Builds only the specified modules ^(comma-separated^).
    exit /b 1
)

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
    echo [ERROR] fnm is not installed or not in PATH.
    echo         Install it with: winget install Schniz.fnm
    set "EXIT_CODE=1"
    goto finish
)

:: Step 2: Read Node version from .nvmrc
if not exist ".nvmrc" (
    echo [ERROR] Node version file not found.
    set "EXIT_CODE=1"
    goto finish
)

set "NODE_VERSION="
set /p NODE_VERSION=<".nvmrc"
if not defined NODE_VERSION (
    echo [ERROR] Node version file is empty.
    set "EXIT_CODE=1"
    goto finish
)

:: Step 3: Initialize fnm and switch Node version
for /f "tokens=*" %%z in ('fnm env') do call %%z
if errorlevel 1 (
    echo [ERROR] Failed to initialize fnm environment.
    set "EXIT_CODE=1"
    goto finish
)

fnm use %NODE_VERSION%
if errorlevel 1 (
    echo [ERROR] Failed to switch to Node.js %NODE_VERSION%.
    set "EXIT_CODE=1"
    goto finish
)

:: Step 4: Build with module filter
set "OPENWORKSPACE_BUILD_MODULES=%~1"
echo [INFO] Building modules: %OPENWORKSPACE_BUILD_MODULES%
call npm run build
set "EXIT_CODE=%ERRORLEVEL%"

:finish
popd >nul
exit /b %EXIT_CODE%
