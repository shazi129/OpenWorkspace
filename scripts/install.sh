#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

info() {
    printf '[INFO] %s\n' "$1"
}

error() {
    printf '[ERROR] %s\n' "$1" >&2
}

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

if [[ "$(uname -s)" != "Linux" ]]; then
    error "This script supports Linux only."
    exit 1
fi

cd "$REPOSITORY_ROOT"

# Step 1: Install fnm if missing.
add_known_fnm_paths
if ! command -v fnm >/dev/null 2>&1; then
    missing_dependencies=()
    for dependency in curl unzip; do
        if ! command -v "$dependency" >/dev/null 2>&1; then
            missing_dependencies+=("$dependency")
        fi
    done

    if (( ${#missing_dependencies[@]} > 0 )); then
        error "Required command(s) not found: ${missing_dependencies[*]}"
        printf '        Debian/Ubuntu: sudo apt install -y curl unzip\n' >&2
        printf '        Fedora/RHEL:   sudo dnf install -y curl unzip\n' >&2
        printf '        Arch Linux:    sudo pacman -S --needed curl unzip\n' >&2
        exit 1
    fi

    info "fnm is not installed. Installing it with the official installer..."
    curl -fsSL https://fnm.vercel.app/install | bash
    add_known_fnm_paths

    if ! command -v fnm >/dev/null 2>&1; then
        error "fnm was installed but is not available in PATH."
        printf '        Open a new terminal and run this script again.\n' >&2
        exit 1
    fi

    info "fnm installed successfully."
fi

# Step 2: Read the required Node.js version.
if [[ ! -f .nvmrc ]]; then
    error "Node version file not found: $REPOSITORY_ROOT/.nvmrc"
    exit 1
fi

NODE_VERSION="$(<.nvmrc)"
NODE_VERSION="${NODE_VERSION//$'\r'/}"
if [[ -z "${NODE_VERSION//[[:space:]]/}" ]]; then
    error "Node version file is empty: $REPOSITORY_ROOT/.nvmrc"
    exit 1
fi

# Step 3: Initialize fnm for this process.
if ! FNM_ENV="$(fnm env --shell bash)"; then
    error "Failed to initialize the fnm environment."
    exit 1
fi
eval "$FNM_ENV"

# Step 4: Install and activate the required Node.js version.
info "Installing Node.js $NODE_VERSION..."
fnm install "$NODE_VERSION"
fnm use "$NODE_VERSION"

info "Node.js $NODE_VERSION is now active:"
node --version

# Step 5: Install project dependencies.
if [[ -d node_modules ]]; then
    info "node_modules already exists. Running npm install..."
else
    info "Installing dependencies with npm install..."
fi
npm install

info "Installation complete. You can now run: npm run dev"
