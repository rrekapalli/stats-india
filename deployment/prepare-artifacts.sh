#!/bin/bash
# Build Stats India JAR + frontend static zip for deployment.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ARTIFACTS_DIR="${SCRIPT_DIR}/artifacts"
STATIC_DIR="${ROOT_DIR}/src/main/resources/static"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SKIP_TESTS="${SKIP_TESTS:-true}"

main() {
    log_info "Building Stats India (Maven + Angular via frontend-maven-plugin)..."
    mkdir -p "$ARTIFACTS_DIR"

    local mvn_args=(clean package)
    [[ "$SKIP_TESTS" == true ]] && mvn_args+=(-DskipTests)

    (cd "$ROOT_DIR" && mvn "${mvn_args[@]}")

    local jar
    jar=$(find "$ROOT_DIR/target" -maxdepth 1 -name 'stats-india-*.jar' ! -name '*-sources.jar' | head -n1)
    [[ -n "$jar" && -f "$jar" ]] || { log_error "JAR not found under target/"; exit 1; }
    cp -f "$jar" "${ARTIFACTS_DIR}/$(basename "$jar")"
    log_success "JAR: ${ARTIFACTS_DIR}/$(basename "$jar")"

    [[ -d "$STATIC_DIR" ]] || { log_error "Static dir missing: $STATIC_DIR"; exit 1; }
    [[ -f "${STATIC_DIR}/index.html" ]] || { log_error "index.html missing in static output"; exit 1; }

    rm -f "${ARTIFACTS_DIR}/frontend-dist.zip"
    (cd "$STATIC_DIR" && zip -qr "${ARTIFACTS_DIR}/frontend-dist.zip" .)
    log_success "UI zip: ${ARTIFACTS_DIR}/frontend-dist.zip"

    log_info "Artifacts ready in ${ARTIFACTS_DIR}"
    ls -lh "$ARTIFACTS_DIR"
}

case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--skip-tests|--with-tests]"
        exit 0
        ;;
    --with-tests) SKIP_TESTS=false; main ;;
    --skip-tests|"") main ;;
    *) log_error "Unknown option: $1"; exit 1 ;;
esac
