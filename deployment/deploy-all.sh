#!/bin/bash
# Deprecated: use ./deploy.sh --all from the repo root.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
exec "${ROOT_DIR}/deploy.sh" --all "$@"
