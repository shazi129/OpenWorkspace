@echo off
setlocal EnableExtensions

rem Build the API service and preview a single module locally (Windows).
rem
rem Usage:
rem   build-api.bat [module]              Start API + build [module] only + preview
rem   build-api.bat [module] build        Rebuild only [module] (keep services running)
rem   build-api.bat [module] api          Start only the API service
rem
rem [module] defaults to "tools". Multiple modules can be comma-separated,
rem e.g. "games,tools".
rem
rem Notes:
rem   - Backend services (services/*) run directly via `npm run api`, no compile.
rem   - The frontend builds only [module] via OPENWORKSPACE_BUILD_MODULES.

set "REPOSITORY_ROOT=%~dp0.."
set "EXIT_CODE=0"

set "MODULE=tools"
set "COMMAND="

set "API_PORT=4174"
if defined OPENWORKSPACE_API_PORT set "API_PORT=%OPENWORKSPACE_API_PORT%"
set "PREVIEW_PORT=4321"
if defined OPENWORKSPACE_PREVIEW_PORT set "PREVIEW_PORT=%OPENWORKSPACE_PREVIEW_PORT%"

pushd "%REPOSITORY_ROOT%" >nul
if errorlevel 1 (
    echo [ERROR] Failed to enter the OpenWorkspace repository.
    exit /b 1
)

rem ---- Parse arguments: [module] [build|api] ----
if /i "%~1"=="build"  set "COMMAND=build"
if /i "%~1"=="api"    set "COMMAND=api"
if /i "%~2"=="build"  set "COMMAND=build"
if /i "%~2"=="api"    set "COMMAND=api"
if not "%~1"=="" if not "%~1"=="build" if not "%~1"=="api" set "MODULE=%~1"
if not "%~2"=="" if not "%~2"=="build" if not "%~2"=="api" set "MODULE=%~2"

rem ---- Initialize fnm / Node version (same as preview.bat) ----
where fnm >nul 2>nul
if errorlevel 1 goto :missing_fnm
if not exist ".nvmrc" goto :missing_version_file

set "NODE_VERSION="
set /p NODE_VERSION=<".nvmrc"
if not defined NODE_VERSION goto :empty_version_file

for /f "tokens=*" %%z in ('fnm env') do call %%z
if errorlevel 1 goto :fnm_init_failed
fnm use "%NODE_VERSION%"
if errorlevel 1 goto :node_switch_failed

rem ---- Dispatch ----
if "%COMMAND%"=="api"   goto :start_api
if "%COMMAND%"=="build" goto :build_module

:run_all
call :start_api
if errorlevel 1 goto :finish
call :build_module
if errorlevel 1 goto :finish
goto :preview

:start_api
curl -s -o nul "http://127.0.0.1:%API_PORT%/health" 2>nul
if not errorlevel 1 (
    echo [INFO] API service already running on port %API_PORT%, skipping.
    exit /b 0
)
echo [INFO] Starting API service in background (port %API_PORT%)...
rem Local preview needs CORS to reach 4174 directly; production uses same-origin Nginx.
set "OPENWORKSPACE_API_ALLOWED_ORIGIN=*"
start "openworkspace-api" /min cmd /c "npm run api"
set "EXIT_CODE=0"
exit /b 0

:build_module
echo [INFO] Building only module(s): %MODULE% ...
set "OPENWORKSPACE_BUILD_MODULES=%MODULE%"
call npm run build
set "EXIT_CODE=%ERRORLEVEL%"
exit /b %EXIT_CODE%

:preview
echo [INFO] Starting preview server (port %PREVIEW_PORT%)...
call npm run preview -- --port %PREVIEW_PORT% --host 127.0.0.1
set "EXIT_CODE=%ERRORLEVEL%"
goto :finish

:missing_fnm
echo [ERROR] fnm is not installed or not in PATH.
echo         Install with: winget install Schniz.fnm
set "EXIT_CODE=1"
goto :finish

:missing_version_file
echo [ERROR] Node version file not found: %REPOSITORY_ROOT%\.nvmrc
set "EXIT_CODE=1"
goto :finish

:empty_version_file
echo [ERROR] Node version file is empty: %REPOSITORY_ROOT%\.nvmrc
set "EXIT_CODE=1"
goto :finish

:fnm_init_failed
echo [ERROR] Failed to initialize the fnm environment.
set "EXIT_CODE=1"
goto :finish

:node_switch_failed
echo [ERROR] Failed to switch to Node.js %NODE_VERSION%.
echo         Install with: fnm install %NODE_VERSION%
set "EXIT_CODE=1"

:finish
popd >nul
exit /b %EXIT_CODE%
