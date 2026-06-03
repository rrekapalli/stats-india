# shellcheck shell=bash
# Load deployment.conf and workspace .env. Sets ROOT_DIR, DEPLOYMENT_DIR, CONFIG_FILE, ENV_FILE, ARTIFACTS_DIR.

load_stats_india_env() {
    local script_dir="${1:?}"
    DEPLOYMENT_DIR="$(cd "${script_dir}/.." && pwd)"
    ROOT_DIR="$(cd "${DEPLOYMENT_DIR}/.." && pwd)"
    CONFIG_FILE="${DEPLOYMENT_DIR}/proxmox/deployment.conf"
    ENV_FILE="${ROOT_DIR}/.env"
    ARTIFACTS_DIR="${DEPLOYMENT_DIR}/artifacts"

    if [[ -f "$CONFIG_FILE" ]]; then
        set -a
        # shellcheck disable=SC1090
        source <(grep -v '^#' "$CONFIG_FILE" | grep -v '^$' | grep '=') 2>/dev/null || true
        set +a
    fi

    if [[ -f "$ENV_FILE" ]]; then
        set -a
        while IFS= read -r line || [[ -n "$line" ]]; do
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            [[ -z "${line// }" ]] && continue
            [[ ! "$line" =~ = ]] && continue
            eval "export $line" 2>/dev/null || true
        done < "$ENV_FILE"
        set +a
    fi

    CONTAINER_NAME="${STATS_INDIA_CONTAINER_NAME:-stats-india}"
    FIXED_VMID="${STATS_INDIA_VMID:-7001}"
    DOMAIN="${STATS_INDIA_HOST:-stats-india.tailce422e.ts.net}"
    API_PORT="${API_PORT:-8080}"
    UI_PORT="${UI_PORT:-80}"
    CLONE_TEMPLATE="${STATS_INDIA_CLONE_TEMPLATE:-moneytree-lxc-base}"
    CORES="${STATS_INDIA_CORES:-2}"
    MEMORY_MB="${STATS_INDIA_MEMORY_MB:-2048}"
    ROOTFS_GB="${STATS_INDIA_ROOTFS_GB:-16}"
    CONTAINER_USER="${CONTAINER_USER:-raja}"
    CONTAINER_PASSWORD="${CONTAINER_PASSWORD:-}"
    APP_USER="${STATS_INDIA_APP_USER:-stats-india}"
    WEB_ROOT="${STATS_INDIA_WEB_ROOT:-/var/www/stats-india}"
    APP_DIR="${STATS_INDIA_APP_DIR:-/home/${CONTAINER_USER}/app}"
    PROXMOX_HOST="${PROXMOX_HOST:-192.168.29.231}"
    PROXMOX_USER="${PROXMOX_USER:-root}"
    LXC_ROOTFS_STORAGE="${LXC_ROOTFS_STORAGE:-local-storage}"
    LXC_BOOT_DISK_GB="${LXC_BOOT_DISK_GB:-16}"
    CLONE_TEMPLATE_VMID="${CLONE_TEMPLATE_VMID:-9001}"
}
