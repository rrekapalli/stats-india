#!/bin/bash
# Join stats-india LXC (VMID 7001) to Tailscale — same flow as moneytree deploy scripts.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/add-lxc-to-tailscale.sh" 7001 stats-india
