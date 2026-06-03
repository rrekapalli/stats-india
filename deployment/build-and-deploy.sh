#!/bin/bash
# Build artifacts and deploy Stats India UI and/or API to Proxmox LXC (VMID 7001).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROXMOX_DIR="${SCRIPT_DIR}/proxmox"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

DEPLOY_API=false
DEPLOY_UI=false
RECREATE=false
SKIP_BUILD=false

show_help() {
    cat <<'EOF'
Usage: ./deployment/build-and-deploy.sh [OPTIONS]

OPTIONS:
  --api           Deploy Spring Boot API only
  --ui            Deploy nginx static UI only
  --all           Deploy API then UI (default if no service flag)
  --recreate      Destroy and recreate stats-india LXC before deploy
  --skip-build    Use existing deployment/artifacts
  --help, -h      Show this help

Examples:
  ./deployment/build-and-deploy.sh --all
  ./deployment/build-and-deploy.sh --api --skip-build
  ./deployment/build-and-deploy.sh --ui --recreate
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --api) DEPLOY_API=true; shift ;;
        --ui) DEPLOY_UI=true; shift ;;
        --all) DEPLOY_API=true; DEPLOY_UI=true; shift ;;
        --recreate) RECREATE=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --help|-h) show_help; exit 0 ;;
        *) log_error "Unknown option: $1"; show_help; exit 1 ;;
    esac
done

if [[ "$DEPLOY_API" == false && "$DEPLOY_UI" == false ]]; then
    DEPLOY_API=true
    DEPLOY_UI=true
fi

log_info "Stats India build and deploy"
log_info "  API: $DEPLOY_API | UI: $DEPLOY_UI | Recreate: $RECREATE | Skip build: $SKIP_BUILD"

if [[ "$SKIP_BUILD" != true ]]; then
    "${SCRIPT_DIR}/prepare-artifacts.sh" || exit 1
fi

FAILED=false
RECREATE_FLAG=""
[[ "$RECREATE" == true ]] && RECREATE_FLAG="--recreate"

if [[ "$DEPLOY_API" == true ]]; then
    log_info "Deploying API..."
    if ! "${PROXMOX_DIR}/deploy-api.sh" $RECREATE_FLAG; then
        log_error "API deploy failed"
        FAILED=true
    fi
    RECREATE_FLAG=""
fi

if [[ "$DEPLOY_UI" == true ]]; then
    log_info "Deploying UI..."
    if ! "${PROXMOX_DIR}/deploy-ui.sh" $RECREATE_FLAG; then
        log_error "UI deploy failed"
        FAILED=true
    fi
fi

if [[ "$FAILED" == true ]]; then
    exit 1
fi
log_success "Deployment finished"
