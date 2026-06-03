#!/bin/bash
# Convenience entry point: build and deploy all Stats India services to LXC VMID 7001.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/build-and-deploy.sh" --all "$@"
