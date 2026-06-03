# Timestamped logging for deploy scripts.
RED="${RED:-\033[0;31m}"
GREEN="${GREEN:-\033[0;32m}"
YELLOW="${YELLOW:-\033[1;33m}"
BLUE="${BLUE:-\033[0;34m}"
CYAN="${CYAN:-\033[0;36m}"
NC="${NC:-\033[0m}"

_log_ts() { date '+%H:%M:%S'; }
log_info()    { echo -e "$(_log_ts) ${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "$(_log_ts) ${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "$(_log_ts) ${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "$(_log_ts) ${RED}[ERROR]${NC} $1"; }
log_prompt()  { echo -e "$(_log_ts) ${CYAN}[?]${NC} $1"; }

stats_india_final_tailscale() {
    local d="${1:?}" vmid="${2:?}" cname="${3:?}"
    local ts_script="${d}/add-lxc-to-tailscale.sh"
    if [[ -x "$ts_script" ]]; then
        log_info "Tailscale join (idempotent)..."
        "$ts_script" "$vmid" "$cname" || true
    else
        log_warn "add-lxc-to-tailscale.sh not found; skip Tailscale join"
    fi
}
