#!/usr/bin/env bash
# Build the API service and preview a single module locally (Linux).
#
# Usage:
#   ./scripts/build-api.sh [module]              Start API + build [module] + preview
#   ./scripts/build-api.sh [module] build        Rebuild only [module]
#   ./scripts/build-api.sh [module] api          Start only the API service
#
# [module] defaults to "tools". Multiple modules can be comma-separated,
# e.g. "games,tools".
#
# Notes:
#   - Backend services (services/*) run directly via `npm run api`, no compile.
#   - The frontend builds only [module] via OPENWORKSPACE_BUILD_MODULES.

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

API_PORT="${OPENWORKSPACE_API_PORT:-4174}"
PREVIEW_PORT="${OPENWORKSPACE_PREVIEW_PORT:-4321}"

MODULE="tools"
COMMAND=""

info() { printf '[INFO] %s\n' "$1"; }
error() { printf '[ERROR] %s\n' "$1" >&2; }

add_known_fnm_paths() {
    local candidate
    for candidate in \
        "${FNM_DIR:-}" \
        "${XDG_DATA_HOME:-$HOME/.local/share}/fnm" \
        "$HOME/.fnm"; do
        if [[ -n "$candidate" && -x "$candidate/fnm" ]]; then
            export PATH="$candidate:$PATH"
            return
        fi
    done
}

cd "$REPOSITORY_ROOT"

# ── Parse arguments: [module] [build|api] ──
for arg in "$@"; do
    case "$arg" in
        build|api) COMMAND="$arg" ;;
        *) MODULE="$arg" ;;
    esac
done

# ── Initialize fnm / Node version (same as install.sh) ──
add_known_fnm_paths
if ! command -v fnm >/dev/null 2>&1; then
    error "fnm is not installed. Run scripts/install.sh first."
    exit 1
fi
if [[ ! -f .nvmrc ]]; then
    error "Node version file not found: $REPOSITORY_ROOT/.nvmrc"
    exit 1
fi
NODE_VERSION="$(<.nvmrc)"
NODE_VERSION="${NODE_VERSION//$'\r'/}"
if ! FNM_ENV="$(fnm env --shell bash)"; then
    error "Failed to initialize the fnm environment."
    exit 1
fi
eval "$FNM_ENV"
fnm use "$NODE_VERSION"

start_api() {
    if curl -s -o /dev/null "http://127.0.0.1:${API_PORT}/health"; then
        info "API service already running on port ${API_PORT}, skipping."
        return 0
    fi
    info "Starting API service in background (port ${API_PORT})..."
    # Local preview needs CORS to reach 4174 directly; production uses same-origin Nginx.
    export OPENWORKSPACE_API_ALLOWED_ORIGIN="${OPENWORKSPACE_API_ALLOWED_ORIGIN:-*}"
    npm run api >/tmp/openworkspace-api.log 2>&1 &
    API_PID=$!
    info "API PID: ${API_PID}, log: /tmp/openworkspace-api.log"
}

build_module() {
    info "Building only module(s): ${MODULE} ..."
    OPENWORKSPACE_BUILD_MODULES="$MODULE" npm run build
    info "Build complete."
}

preview() {
    info "Starting preview server (port ${PREVIEW_PORT})..."
    npm run preview -- --port "$PREVIEW_PORT" --host 127.0.0.1
}

case "$COMMAND" in
    build)
        build_module
        ;;
    api)
        start_api
        ;;
    "")
        start_api
        build_module
        preview
        ;;
esac
