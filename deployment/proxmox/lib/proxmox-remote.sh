# shellcheck shell=bash
# Proxmox LXC helpers (local pct or remote via SSH).

init_proxmox_mode() {
    USE_REMOTE_PROXMOX=false
    if ! command -v pct >/dev/null 2>&1; then
        log_info "pct not found locally; using remote Proxmox (${PROXMOX_HOST})."
        USE_REMOTE_PROXMOX=true
    fi
    PROXMOX_SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=60 -o ServerAliveInterval=30"
}

_proxmox_remote() {
    if [[ -n "${PROXMOX_PASSWORD:-}" ]] && command -v sshpass >/dev/null 2>&1; then
        sshpass -p "$PROXMOX_PASSWORD" ssh $PROXMOX_SSH_OPTS "${PROXMOX_USER}@${PROXMOX_HOST}" "$@"
    else
        ssh $PROXMOX_SSH_OPTS "${PROXMOX_USER}@${PROXMOX_HOST}" "$@"
    fi
}

proxmox_find_container_by_name() {
    local name="$1"
    if [[ "$USE_REMOTE_PROXMOX" == true ]]; then
        _proxmox_remote "pct list 2>/dev/null | awk -v name=\"$name\" '\$NF == name {print \$1}' | head -n1"
    else
        pct list 2>/dev/null | awk -v name="$name" '$NF == name {print $1}' | head -n1
    fi
}

proxmox_container_exists() {
    [[ -n "$(proxmox_find_container_by_name "$1" | tr -d '[:space:]')" ]]
}

proxmox_start_container() {
    local vmid="$1"
    vmid=$(echo "$vmid" | tr -d '[:space:]')
    if [[ "$USE_REMOTE_PROXMOX" == true ]]; then
        _proxmox_remote "pct status $vmid 2>/dev/null | awk '{print \$2}'" | grep -q running && return 0
        _proxmox_remote "pct start $vmid" && sleep 2
    else
        pct status "$vmid" 2>/dev/null | awk '{print $2}' | grep -q running && return 0
        pct start "$vmid" && sleep 2
    fi
}

proxmox_exec_in_container() {
    local vmid="$1" cmd="$2" q
    q=$(printf '%q' "$cmd")
    if [[ "$USE_REMOTE_PROXMOX" == true ]]; then
        _proxmox_remote "pct exec $vmid -- bash -lc $q"
    else
        pct exec "$vmid" -- bash -lc "$cmd"
    fi
}

proxmox_push_file() {
    local vmid="$1" src="$2" dst="$3"
    [[ -f "$src" ]] || { log_error "Missing file: $src"; return 1; }
    local tmp="/tmp/$(basename "$src")-$$"
    if [[ "$USE_REMOTE_PROXMOX" == true ]]; then
        if [[ -n "${PROXMOX_PASSWORD:-}" ]] && command -v sshpass >/dev/null 2>&1; then
            sshpass -p "$PROXMOX_PASSWORD" scp $PROXMOX_SSH_OPTS "$src" "${PROXMOX_USER}@${PROXMOX_HOST}:${tmp}" || return 1
        else
            scp $PROXMOX_SSH_OPTS "$src" "${PROXMOX_USER}@${PROXMOX_HOST}:${tmp}" || return 1
        fi
        _proxmox_remote "pct push $vmid $tmp $dst && rm -f $tmp"
    else
        pct push "$vmid" "$src" "$dst"
    fi
}

proxmox_clone_container() {
    local template_name="$1" new_name="$2" new_vmid="$3" cores="$4" memory="$5"
    local template_vmid="${CLONE_TEMPLATE_VMID:-}"
    if [[ -z "$template_vmid" ]] || [[ ! "$template_vmid" =~ ^[0-9]+$ ]]; then
        if [[ "$USE_REMOTE_PROXMOX" == true ]]; then
            template_vmid=$(_proxmox_remote "pct list 2>/dev/null | tail -n +2 | awk -v name=\"$template_name\" '\$NF == name {print \$1}' | head -n1" | tr -d '[:space:]')
        else
            template_vmid=$(pct list 2>/dev/null | tail -n +2 | awk -v name="$template_name" '$NF == name {print $1}' | head -n1 | tr -d '[:space:]')
        fi
    fi
    [[ -n "$template_vmid" ]] || { log_error "Clone template '$template_name' not found (VMID ${CLONE_TEMPLATE_VMID:-unset})"; return 1; }

    log_info "Cloning template VMID $template_vmid -> $new_name ($new_vmid)..."
    if [[ "$USE_REMOTE_PROXMOX" == true ]]; then
        _proxmox_remote "pct clone $template_vmid $new_vmid --hostname $new_name --full --storage ${LXC_ROOTFS_STORAGE}" || return 1
        _proxmox_remote "pct set $new_vmid --cores $cores --memory $memory --tags stats-india" 2>/dev/null || true
        _proxmox_remote "pct set $new_vmid --net0 name=eth0,bridge=vmbr0,ip=dhcp,ip6=off" 2>/dev/null || true
    else
        pct clone "$template_vmid" "$new_vmid" --hostname "$new_name" --full --storage "${LXC_ROOTFS_STORAGE}" || return 1
        pct set "$new_vmid" --cores "$cores" --memory "$memory" --tags stats-india 2>/dev/null || true
        pct set "$new_vmid" --net0 name=eth0,bridge=vmbr0,ip=dhcp,ip6=off 2>/dev/null || true
    fi
    echo "$new_vmid"
}

ensure_stats_india_container() {
    local recreate="${1:-false}"
    VMID=""
    if proxmox_container_exists "$CONTAINER_NAME"; then
        VMID=$(proxmox_find_container_by_name "$CONTAINER_NAME" | tr -d '[:space:]')
        log_info "Found container '$CONTAINER_NAME' (VMID $VMID)"
        if [[ "$recreate" == true ]]; then
            local rm_script="${DEPLOYMENT_DIR}/proxmox/remove-lxc-from-tailscale.sh"
            [[ -x "$rm_script" ]] && "$rm_script" "$VMID" "$CONTAINER_NAME" 2>/dev/null || true
            log_info "Recreate: destroying VMID $VMID..."
            if [[ "$USE_REMOTE_PROXMOX" == true ]]; then
                _proxmox_remote "pct stop $VMID" 2>/dev/null || true
                sleep 2
                _proxmox_remote "pct destroy $VMID"
            else
                pct stop "$VMID" 2>/dev/null || true
                sleep 2
                pct destroy "$VMID"
            fi
            VMID=""
        fi
    fi

    if [[ -z "$VMID" ]]; then
        if [[ -n "$CLONE_TEMPLATE" ]]; then
            proxmox_clone_container "$CLONE_TEMPLATE" "$CONTAINER_NAME" "$FIXED_VMID" "$CORES" "$MEMORY_MB" >/dev/null
            VMID="$FIXED_VMID"
        else
            log_error "Set STATS_INDIA_CLONE_TEMPLATE in deployment.conf (e.g. moneytree-lxc-base)"
            exit 1
        fi
        if [[ -n "$ROOTFS_GB" ]] && [[ "$ROOTFS_GB" =~ ^[0-9]+$ ]]; then
            if [[ "$USE_REMOTE_PROXMOX" == true ]]; then
                _proxmox_remote "pct resize $VMID rootfs ${ROOTFS_GB}G" 2>/dev/null || true
            else
                pct resize "$VMID" rootfs "${ROOTFS_GB}G" 2>/dev/null || true
            fi
        fi
    fi

    proxmox_start_container "$VMID" || exit 1
    if [[ "$USE_REMOTE_PROXMOX" == true ]]; then
        _proxmox_remote "pct set $VMID --onboot 1 --startup \"order=$VMID\"" 2>/dev/null || true
    else
        pct set "$VMID" --onboot 1 --startup "order=$VMID" 2>/dev/null || true
    fi
}

bootstrap_container_basics() {
    local vmid="$1"
    proxmox_exec_in_container "$vmid" "echo $CONTAINER_NAME > /etc/hostname && hostname -F /etc/hostname" || true
    proxmox_exec_in_container "$vmid" "systemctl stop systemd-resolved 2>/dev/null; systemctl disable systemd-resolved 2>/dev/null; systemctl mask systemd-resolved 2>/dev/null; rm -f /etc/resolv.conf; printf 'nameserver 100.100.100.100\nnameserver 8.8.8.8\nnameserver 8.8.4.4\n' > /etc/resolv.conf" || true
    proxmox_exec_in_container "$vmid" "echo '$CONTAINER_USER:$CONTAINER_PASSWORD' | chpasswd" || true
    proxmox_exec_in_container "$vmid" "command -v ufw >/dev/null 2>&1 && (ufw allow 22/tcp; ufw allow ${UI_PORT}/tcp; ufw allow ${API_PORT}/tcp; ufw --force enable) || true" || true
}

ensure_java21() {
    local vmid="$1"
    if proxmox_exec_in_container "$vmid" "java -version 2>&1" 2>/dev/null | grep -qE 'version \"(21|25)'; then
        log_info "Java already installed"
        return 0
    fi
    log_info "Installing Temurin JRE (21+)..."
    proxmox_exec_in_container "$vmid" "DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq wget apt-transport-https ca-certificates gnupg" || return 1
    proxmox_exec_in_container "$vmid" "wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --batch --yes --dearmor -o /etc/apt/trusted.gpg.d/adoptium.gpg" || return 1
    proxmox_exec_in_container "$vmid" "CODENAME=\$(awk -F= '/^VERSION_CODENAME/{print \$2}' /etc/os-release | tr -d '\n'); echo \"deb https://packages.adoptium.net/artifactory/deb \${CODENAME:-noble} main\" > /etc/apt/sources.list.d/adoptium.list && DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq temurin-21-jre || DEBIAN_FRONTEND=noninteractive apt-get install -y -qq temurin-25-jre" || return 1
}

ensure_nginx() {
    local vmid="$1"
    if proxmox_exec_in_container "$vmid" "dpkg -l nginx 2>/dev/null | grep -q '^ii'"; then
        return 0
    fi
    log_info "Installing nginx and unzip..."
    proxmox_exec_in_container "$vmid" "DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx unzip curl" || return 1
}
