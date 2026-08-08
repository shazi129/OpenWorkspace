#!/bin/bash
set -e

# ============================================================
# Certbot HTTPS Setup Script for www.vmetu.com
# ============================================================
# Usage: sudo bash certbot-setup.sh
# This script will:
#   1. Install certbot if not already installed
#   2. Configure HTTPS for www.vmetu.com in Nginx
#   3. Check certificate expiry and auto-renew
# ============================================================

DOMAIN="www.vmetu.com"
CERT_NAME="$DOMAIN"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- Step 1: Install certbot ----------
log_info "Step 1: Checking certbot installation..."

if ! command -v certbot &>/dev/null; then
    log_info "certbot not found. Installing certbot and python3-certbot-nginx..."

    if command -v apt-get &>/dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &>/dev/null; then
        yum install -y certbot python3-certbot-nginx
    elif command -v dnf &>/dev/null; then
        dnf install -y certbot python3-certbot-nginx
    else
        log_error "Cannot detect package manager. Please install certbot manually."
        log_error "See: https://certbot.eff.org/instructions"
        exit 1
    fi

    log_info "certbot installed successfully."
else
    log_info "certbot is already installed: $(certbot --version | head -1)"
fi

# ---------- Step 2: Check and configure HTTPS in Nginx ----------
log_info "Step 2: Checking Nginx HTTPS configuration for $DOMAIN..."

# Check if Nginx is running
if ! command -v nginx &>/dev/null; then
    log_error "Nginx is not installed. Please install Nginx first."
    exit 1
fi

# Check if certificate already exists
CERT_PATH="/etc/letsencrypt/live/$CERT_NAME/fullchain.pem"
NGINX_CONF_DIR="/etc/nginx"
SITES_ENABLED="$NGINX_CONF_DIR/sites-enabled"

if [ -f "$CERT_PATH" ]; then
    log_info "Certificate already exists at $CERT_PATH"

    # Check expiry
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY_DATE" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

    log_info "Certificate expires on: $EXPIRY_DATE ($DAYS_LEFT days left)"

    if [ "$DAYS_LEFT" -lt 30 ]; then
        log_warn "Certificate expires in less than 30 days!"
    fi
else
    log_info "No certificate found for $DOMAIN. Will obtain one now."
fi

# Check if Nginx already has HTTPS config for this domain
HTTPS_CONFIGURED=false
if grep -rq "server_name.*$DOMAIN" "$NGINX_CONF_DIR" 2>/dev/null; then
    if grep -rq "listen.*443.*ssl" "$NGINX_CONF_DIR" 2>/dev/null; then
        # Double-check: find the specific server block
        for conf in $(grep -rl "server_name.*$DOMAIN" "$NGINX_CONF_DIR" 2>/dev/null); do
            if grep -q "listen.*443.*ssl" "$conf" 2>/dev/null; then
                HTTPS_CONFIGURED=true
                log_info "HTTPS already configured in: $conf"
                break
            fi
        done
    fi
fi

if [ "$HTTPS_CONFIGURED" = false ]; then
    log_info "HTTPS not configured for $DOMAIN. Running certbot..."

    # Check if Nginx has HTTP server block for this domain
    if ! grep -rq "server_name.*$DOMAIN" "$NGINX_CONF_DIR" 2>/dev/null; then
        log_error "No Nginx server block found for $DOMAIN."
        log_error "Please add an HTTP server block for $DOMAIN first, then run this script again."
        log_error "Example:"
        log_error ""
        log_error "server {"
        log_error "    listen 80;"
        log_error "    server_name $DOMAIN;"
        log_error "    root /var/www/html;"
        log_error "}"
        exit 1
    fi

    # Run certbot to obtain certificate and configure Nginx
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect \
        --email "admin@vmetu.com" 2>/dev/null || \
    certbot --nginx -d "$DOMAIN" --agree-tos --redirect

    if [ $? -eq 0 ]; then
        log_info "HTTPS configured successfully for $DOMAIN!"
    else
        log_error "certbot configuration failed. Please check the error output above."
        exit 1
    fi
fi

# ---------- Step 3: Auto-renewal check ----------
log_info "Step 3: Checking auto-renewal..."

# Certbot automatically sets up a systemd timer or cron job on installation.
# Verify it's active.

if command -v systemctl &>/dev/null; then
    if systemctl is-active --quiet certbot.timer 2>/dev/null; then
        log_info "certbot.timer is active and will auto-renew certificates."
    else
        log_warn "certbot.timer is not active. Attempting to enable..."

        if [ -f /lib/systemd/system/certbot.timer ] || [ -f /etc/systemd/system/certbot.timer ]; then
            systemctl enable --now certbot.timer
            log_info "certbot.timer enabled."
        else
            log_warn "certbot.timer unit not found. Adding cron job as fallback..."

            # Fallback: add a cron job
            CRON_JOB="0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'nginx -s reload'"
            if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
                (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
                log_info "Cron job added: daily certbot renew check at 3 AM."
            fi
        fi
    fi
else
    # No systemd, check cron
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_info "certbot renew cron job found."
    else
        log_warn "No auto-renewal configured. Adding cron job..."
        CRON_JOB="0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'nginx -s reload'"
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log_info "Cron job added."
    fi
fi

# Run a dry-run renewal to verify everything works
log_info "Running certbot renew --dry-run to verify..."
if certbot renew --dry-run 2>&1 | grep -q "Congratulations"; then
    log_info "Dry-run renewal successful. Everything is working correctly."
else
    log_warn "Dry-run had issues, but this may be expected if cert is newly issued."
    log_warn "Run 'certbot renew --dry-run' manually to check."
fi

echo ""
echo "============================================"
log_info "All done!"
log_info "Visit: https://$DOMAIN"
echo "============================================"
