@echo off
setlocal EnableExtensions

set "REPOSITORY_ROOT=%~dp0.."
set "MINIMUM_NODE_VERSION=22.22.2"
set "EXIT_CODE=0"

pushd "%REPOSITORY_ROOT%" >nul
if errorlevel 1 (
    echo [ERROR] Failed to enter the OpenWorkspace repository.
    exit /b 1
)

where fnm >nul 2>nul
if errorlevel 1 goto missing_fnm

if not exist ".nvmrc" goto missing_version_file

set "NODE_VERSION="
set /p NODE_VERSION=<".nvmrc"
if not defined NODE_VERSION goto empty_version_file

rem Initialize fnm for this batch process only.
for /f "tokens=*" %%z in ('fnm env') do call %%z
if errorlevel 1 goto fnm_initialization_failed

fnm use "%NODE_VERSION%"
if errorlevel 1 goto node_switch_failed

node -e "const [major, minor, patch] = process.versions.node.split('.').map(Number); process.exit(major > 22 || (major === 22 && (minor > 22 || (minor === 22 && patch >= 2))) ? 0 : 1)"
if errorlevel 1 goto unsupported_node_version

call npm run build
if errorlevel 1 goto build_failed

call npm run preview
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" echo [ERROR] The preview server exited with code %EXIT_CODE%.
goto finish

:missing_fnm
echo [ERROR] fnm is not installed or is not available in PATH.
echo         Install it with: winget install Schniz.fnm
set "EXIT_CODE=1"
goto finish

:missing_version_file
echo [ERROR] Node version file was not found: %REPOSITORY_ROOT%\.nvmrc
set "EXIT_CODE=1"
goto finish

:empty_version_file
echo [ERROR] Node version file is empty: %REPOSITORY_ROOT%\.nvmrc
set "EXIT_CODE=1"
goto finish

:fnm_initialization_failed
echo [ERROR] Failed to initialize the fnm environment.
set "EXIT_CODE=1"
goto finish

:node_switch_failed
echo [ERROR] Failed to switch to Node.js %NODE_VERSION%.
echo         Install it with: fnm install %NODE_VERSION%
set "EXIT_CODE=1"
goto finish

:unsupported_node_version
for /f "delims=" %%v in ('node --version 2^>nul') do set "ACTIVE_NODE_VERSION=%%v"
echo [ERROR] OpenWorkspace requires Node.js %MINIMUM_NODE_VERSION% or newer; active version is %ACTIVE_NODE_VERSION%.
set "EXIT_CODE=1"
goto finish

:build_failed
echo [ERROR] The production build failed. Preview was not started.
set "EXIT_CODE=1"

:finish
popd >nul
exit /b %EXIT_CODE%
