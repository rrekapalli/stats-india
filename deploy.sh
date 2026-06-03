#!/bin/bash
# Build and deploy Stats India UI and/or API to Proxmox LXC (VMID 7001).
#
# Usage:
#   ./deploy.sh --all              # build + deploy API and UI (default)
#   ./deploy.sh --ui               # build + deploy nginx static only
#   ./deploy.sh --api              # build + deploy Spring Boot API only
#   ./deploy.sh --all --recreate   # recreate LXC before first deploy step
#   ./deploy.sh --ui --skip-build  # deploy existing artifacts only

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="${ROOT_DIR}/deployment"
PROXMOX_DIR="${DEPLOYMENT_DIR}/proxmox"
ARTIFACTS_DIR="${DEPLOYMENT_DIR}/artifacts"
STATIC_DIR="${ROOT_DIR}/src/main/resources/static"

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
SKIP_TESTS=true
WITH_TESTS=false

show_help() {
    cat <<'EOF'
Usage: ./deploy.sh [OPTIONS]

Build artifacts and deploy to the stats-india Proxmox LXC (VMID 7001).

OPTIONS:
  --api           Build and deploy Spring Boot API only
  --ui            Build and deploy nginx static UI only
  --all           Build and deploy API then UI (default when no service flag)
  --recreate      Destroy and recreate the LXC before deploy (first step only)
  --skip-build    Deploy using existing deployment/artifacts
  --with-tests    Run Maven tests during API/full builds
  --help, -h      Show this help

Examples:
  ./deploy.sh --all
  ./deploy.sh --ui
  ./deploy.sh --api --skip-build
  ./deploy.sh --all --recreate
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --api) DEPLOY_API=true; shift ;;
        --ui) DEPLOY_UI=true; shift ;;
        --all) DEPLOY_API=true; DEPLOY_UI=true; shift ;;
        --recreate) RECREATE=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --with-tests) WITH_TESTS=true; SKIP_TESTS=false; shift ;;
        --skip-tests) SKIP_TESTS=true; shift ;;
        --help|-h) show_help; exit 0 ;;
        *) log_error "Unknown option: $1"; show_help; exit 1 ;;
    esac
done

if [[ "$DEPLOY_API" == false && "$DEPLOY_UI" == false ]]; then
    DEPLOY_API=true
    DEPLOY_UI=true
fi

build_artifacts() {
    mkdir -p "$ARTIFACTS_DIR"

    if [[ "$DEPLOY_API" == true && "$DEPLOY_UI" == true ]]; then
        log_info "Building API + UI (Maven)..."
        local mvn_args=(clean package)
        [[ "$SKIP_TESTS" == true ]] && mvn_args+=(-DskipTests)
        (cd "$ROOT_DIR" && mvn "${mvn_args[@]}")

        local jar
        jar=$(find "$ROOT_DIR/target" -maxdepth 1 -name 'stats-india-*.jar' ! -name '*-sources.jar' | head -n1)
        [[ -n "$jar" && -f "$jar" ]] || { log_error "JAR not found under target/"; exit 1; }
        cp -f "$jar" "${ARTIFACTS_DIR}/$(basename "$jar")"
        log_success "JAR: ${ARTIFACTS_DIR}/$(basename "$jar")"
    elif [[ "$DEPLOY_API" == true ]]; then
        log_info "Building API only (Maven, skip frontend)..."
        local mvn_args=(clean package -Dfrontend.skip=true)
        [[ "$SKIP_TESTS" == true ]] && mvn_args+=(-DskipTests)
        (cd "$ROOT_DIR" && mvn "${mvn_args[@]}")

        local jar
        jar=$(find "$ROOT_DIR/target" -maxdepth 1 -name 'stats-india-*.jar' ! -name '*-sources.jar' | head -n1)
        [[ -n "$jar" && -f "$jar" ]] || { log_error "JAR not found under target/"; exit 1; }
        cp -f "$jar" "${ARTIFACTS_DIR}/$(basename "$jar")"
        log_success "JAR: ${ARTIFACTS_DIR}/$(basename "$jar")"
    elif [[ "$DEPLOY_UI" == true ]]; then
        log_info "Building UI only (Angular)..."
        (cd "${ROOT_DIR}/ui" && npm run build:app)
    fi

    if [[ "$DEPLOY_UI" == true ]]; then
        [[ -d "$STATIC_DIR" ]] || { log_error "Static dir missing: $STATIC_DIR"; exit 1; }
        [[ -f "${STATIC_DIR}/index.html" ]] || { log_error "index.html missing in static output"; exit 1; }
        rm -f "${ARTIFACTS_DIR}/frontend-dist.zip"
        (cd "$STATIC_DIR" && zip -qr "${ARTIFACTS_DIR}/frontend-dist.zip" .)
        log_success "UI zip: ${ARTIFACTS_DIR}/frontend-dist.zip"
    fi

    log_info "Artifacts in ${ARTIFACTS_DIR}"
    ls -lh "$ARTIFACTS_DIR" 2>/dev/null || true
}

log_info "Stats India deploy"
log_info "  API: $DEPLOY_API | UI: $DEPLOY_UI | Recreate: $RECREATE | Skip build: $SKIP_BUILD"

if [[ "$SKIP_BUILD" != true ]]; then
    build_artifacts
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
