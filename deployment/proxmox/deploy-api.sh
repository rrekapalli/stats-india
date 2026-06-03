#!/bin/bash
# Deploy Stats India Spring Boot API to LXC VMID 7001 (stats-india).
# Usage: ./deploy-api.sh [--recreate] [path/to/stats-india-*.jar]
# Run from Proxmox host (pct) or deploy host with PROXMOX_* in .env.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/deploy-logging.sh
source "${SCRIPT_DIR}/scripts/deploy-logging.sh"
# shellcheck source=lib/load-env.sh
source "${SCRIPT_DIR}/lib/load-env.sh" "$SCRIPT_DIR"
# shellcheck source=lib/proxmox-remote.sh
source "${SCRIPT_DIR}/lib/proxmox-remote.sh"

RECREATE=false
JAR_PATH=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --recreate) RECREATE=true; shift ;;
        -*) log_error "Unknown option: $1"; exit 1 ;;
        *) JAR_PATH="$1"; shift ;;
    esac
done

load_stats_india_env "$SCRIPT_DIR"
init_proxmox_mode

if [[ -z "$CONTAINER_PASSWORD" ]]; then
    log_error "Set CONTAINER_PASSWORD in ${ENV_FILE}"
    exit 1
fi

if [[ -z "$JAR_PATH" ]]; then
    JAR_PATH=$(find "$ARTIFACTS_DIR" -maxdepth 1 -name 'stats-india-*.jar' ! -name '*-sources.jar' 2>/dev/null | head -n1)
    if [[ -z "$JAR_PATH" ]]; then
        JAR_PATH=$(find "$ROOT_DIR/target" -maxdepth 1 -name 'stats-india-*.jar' ! -name '*-sources.jar' 2>/dev/null | head -n1)
    fi
fi
[[ -n "$JAR_PATH" && -f "$JAR_PATH" ]] || { log_error "JAR not found. Run ./deploy.sh --api or pass jar path."; exit 1; }

log_info "=== Stats India API deploy ==="
log_info "JAR: $JAR_PATH"

ensure_stats_india_container "$RECREATE"
bootstrap_container_basics "$VMID"
ensure_java21 "$VMID"

log_info "Creating app user and directories..."
proxmox_exec_in_container "$VMID" "id -u ${APP_USER} >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin -d ${APP_DIR} ${APP_USER}" || true
proxmox_exec_in_container "$VMID" "mkdir -p ${APP_DIR}/logs && chown -R ${APP_USER}:${APP_USER} ${APP_DIR} && chmod 755 ${APP_DIR}" || true

REMOTE_JAR="${APP_DIR}/stats-india.jar"
log_info "Uploading JAR..."
proxmox_push_file "$VMID" "$JAR_PATH" "$REMOTE_JAR"
proxmox_exec_in_container "$VMID" "chown ${APP_USER}:${APP_USER} ${REMOTE_JAR} && chmod 644 ${REMOTE_JAR}"

SPRING_PROFILES="${SPRING_PROFILES_ACTIVE:-prod}"
JAVA_OPTS="${STATS_INDIA_JAVA_OPTS:--Xms256m -Xmx1536m}"
DATAGOV_ENV_LINE=""
if [[ -n "${DATA_GOV_IN_API_KEY:-}" ]]; then
    DATAGOV_ENV_LINE="Environment=\"DATA_GOV_IN_API_KEY=${DATA_GOV_IN_API_KEY}\""
fi

# PostgreSQL connection (pg18 shared with moneytree). DATABASE_URL takes precedence
# over DB_HOST/DB_PORT/DB_NAME if set explicitly in .env.
DB_HOST_VALUE="${DB_HOST:-pg18.tailce422e.ts.net}"
DB_PORT_VALUE="${DB_PORT:-6432}"
DB_NAME_VALUE="${DB_NAME:-stats-india}"
DATABASE_URL_VALUE="${DATABASE_URL:-jdbc:postgresql://${DB_HOST_VALUE}:${DB_PORT_VALUE}/${DB_NAME_VALUE}}"
DB_USERNAME_VALUE="${DB_USERNAME:-stats_india}"
if [[ -z "${DB_PASSWORD:-}" ]]; then
    log_warn "DB_PASSWORD is not set; the API will not be able to connect to PostgreSQL."
fi
DATABASE_URL_LINE="Environment=\"DATABASE_URL=${DATABASE_URL_VALUE}\""
DB_USERNAME_LINE="Environment=\"DB_USERNAME=${DB_USERNAME_VALUE}\""
DB_PASSWORD_LINE="Environment=\"DB_PASSWORD=${DB_PASSWORD:-}\""

log_info "Installing systemd unit..."
UNIT=$(cat <<EOF
[Unit]
Description=Stats India API (Spring Boot)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment="SPRING_PROFILES_ACTIVE=${SPRING_PROFILES}"
Environment="SERVER_PORT=${API_PORT}"
${DATAGOV_ENV_LINE}
${DATABASE_URL_LINE}
${DB_USERNAME_LINE}
${DB_PASSWORD_LINE}
ExecStart=/usr/bin/java ${JAVA_OPTS} -jar ${REMOTE_JAR}
Restart=on-failure
RestartSec=5
StandardOutput=append:${APP_DIR}/logs/api.log
StandardError=append:${APP_DIR}/logs/api.log

[Install]
WantedBy=multi-user.target
EOF
)
TMP_UNIT="/tmp/stats-india-api.service"
echo "$UNIT" > "$TMP_UNIT"
proxmox_push_file "$VMID" "$TMP_UNIT" "/etc/systemd/system/stats-india-api.service"
rm -f "$TMP_UNIT"

proxmox_exec_in_container "$VMID" "systemctl daemon-reload && systemctl enable stats-india-api && systemctl restart stats-india-api"
sleep 3

if proxmox_exec_in_container "$VMID" "curl -sf http://127.0.0.1:${API_PORT}/api/health" >/dev/null 2>&1; then
    log_success "API health check OK on port ${API_PORT}"
else
    log_warn "Health check failed; tail logs: pct exec ${VMID} -- tail -50 ${APP_DIR}/logs/api.log"
fi

stats_india_final_tailscale "$SCRIPT_DIR" "$VMID" "$CONTAINER_NAME"

log_success "API deployed to ${CONTAINER_NAME} (VMID ${VMID})"
log_info "  Internal: http://127.0.0.1:${API_PORT}/api/health"
log_info "  Public (via nginx): http://${DOMAIN}/api/health"
