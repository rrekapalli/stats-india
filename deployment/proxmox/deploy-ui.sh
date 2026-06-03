#!/bin/bash
# Deploy Stats India Angular UI (static) to nginx on LXC VMID 7001.
# Usage: ./deploy-ui.sh [--recreate] [path/to/frontend-dist.zip]
# nginx proxies /api to Spring Boot on localhost:8080.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/deploy-logging.sh
source "${SCRIPT_DIR}/scripts/deploy-logging.sh"
# shellcheck source=lib/load-env.sh
source "${SCRIPT_DIR}/lib/load-env.sh" "$SCRIPT_DIR"
# shellcheck source=lib/proxmox-remote.sh
source "${SCRIPT_DIR}/lib/proxmox-remote.sh"

RECREATE=false
ZIP_PATH=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --recreate) RECREATE=true; shift ;;
        -*) log_error "Unknown option: $1"; exit 1 ;;
        *) ZIP_PATH="$1"; shift ;;
    esac
done

load_stats_india_env "$SCRIPT_DIR"
init_proxmox_mode

if [[ -z "$CONTAINER_PASSWORD" ]]; then
    log_error "Set CONTAINER_PASSWORD in ${ENV_FILE}"
    exit 1
fi

if [[ -z "$ZIP_PATH" ]]; then
    ZIP_PATH="${ARTIFACTS_DIR}/frontend-dist.zip"
fi
[[ -f "$ZIP_PATH" ]] || { log_error "UI zip not found: $ZIP_PATH. Run ./deployment/prepare-artifacts.sh"; exit 1; }

log_info "=== Stats India UI deploy ==="
log_info "Zip: $ZIP_PATH"

ensure_stats_india_container "$RECREATE"
bootstrap_container_basics "$VMID"
ensure_nginx "$VMID"

log_info "Preparing web root ${WEB_ROOT}..."
proxmox_exec_in_container "$VMID" "mkdir -p ${WEB_ROOT} && rm -rf ${WEB_ROOT}/*" || true

REMOTE_ZIP="/tmp/frontend-dist.zip"
proxmox_push_file "$VMID" "$ZIP_PATH" "$REMOTE_ZIP"
proxmox_exec_in_container "$VMID" "unzip -o -q ${REMOTE_ZIP} -d ${WEB_ROOT} && rm -f ${REMOTE_ZIP} && chown -R www-data:www-data ${WEB_ROOT}" || exit 1

NGINX_TEMPLATE="${SCRIPT_DIR}/nginx/stats-india.conf.template"
[[ -f "$NGINX_TEMPLATE" ]] || { log_error "Missing nginx template"; exit 1; }
NGINX_CONF=$(sed -e "s|__DOMAIN__|${DOMAIN}|g" -e "s|__WEB_ROOT__|${WEB_ROOT}|g" -e "s|__API_PORT__|${API_PORT}|g" "$NGINX_TEMPLATE")
TMP_NGINX="/tmp/stats-india-nginx.conf"
echo "$NGINX_CONF" > "$TMP_NGINX"
proxmox_push_file "$VMID" "$TMP_NGINX" "/etc/nginx/sites-available/stats-india"
rm -f "$TMP_NGINX"

proxmox_exec_in_container "$VMID" "ln -sf /etc/nginx/sites-available/stats-india /etc/nginx/sites-enabled/stats-india && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl reload nginx 2>/dev/null || systemctl restart nginx" || exit 1

if proxmox_exec_in_container "$VMID" "curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:${UI_PORT}/" 2>/dev/null | grep -qE '200|304'; then
    log_success "UI serving on port ${UI_PORT}"
else
    log_warn "UI curl check inconclusive; verify manually"
fi

stats_india_final_tailscale "$SCRIPT_DIR" "$VMID" "$CONTAINER_NAME"

log_success "UI deployed to ${CONTAINER_NAME} (VMID ${VMID})"
log_info "  http://${DOMAIN}/"
