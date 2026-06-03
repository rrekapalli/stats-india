# Stats India Deployment

Deploy the Stats India UI (nginx) and API (Spring Boot) to a single Proxmox LXC container **stats-india** (VMID **7001**).

## Layout

```
deployment/
├── prepare-artifacts.sh      # mvn package → JAR + frontend-dist.zip
├── build-and-deploy.sh       # build + deploy API/UI
├── deploy-all.sh               # alias for build-and-deploy --all
├── artifacts/                  # built outputs (gitignored)
└── proxmox/
    ├── deployment.conf         # VMID, hostname, ports, clone template
    ├── deploy-api.sh           # Spring Boot systemd on :8080
    ├── deploy-ui.sh            # nginx static on :80, /api → :8080
    ├── join-tailscale.sh         # convenience: join VMID 7001 as stats-india
    ├── add-lxc-to-tailscale.sh
    ├── remove-lxc-from-tailscale.sh
    ├── nginx/stats-india.conf.template
    └── lib/                    # shared Proxmox helpers
```

Workspace secrets live in the repo root **`.env`** (see `.env.example`).

## Prerequisites

1. Proxmox host with `pct` (run scripts on the host, or set `PROXMOX_*` in `.env` for remote SSH).
2. LXC clone template **`moneytree-lxc-base`** (VMID 9001) from the [moneytree](https://github.com/your-org/moneytree) repo — includes Java 21+, SSH, Tailscale package, user `raja`.
3. Copy `.env.example` → `.env` and set `CONTAINER_PASSWORD`, `PROXMOX_PASSWORD`, and `TS_AUTHKEY` (same pre-auth key as moneytree works on the same tailnet).

## Tailscale (MagicDNS)

Same pattern as moneytree: set `TS_AUTHKEY=tskey-auth-...` and optional `TAILSCALE_API_KEY` + `TAILNET_DNS` in `.env`, then:

```bash
./deployment/proxmox/join-tailscale.sh
# or: ./deployment/proxmox/add-lxc-to-tailscale.sh 7001 stats-india
```

Deploy scripts also run Tailscale join idempotently after API/UI deploy. Once joined:

- **UI:** http://stats-india.tailce422e.ts.net/
- **API:** http://stats-india.tailce422e.ts.net/api/health

Tailscale IP for this node: check with `pct exec 7001 -- tailscale ip -4` on the Proxmox host.

## Quick start

```bash
# From repo root
cp .env.example .env   # edit secrets

# Build JAR + UI zip
./deployment/prepare-artifacts.sh

# Deploy API + UI to VMID 7001
./deployment/deploy-all.sh

# Or deploy individually
./deployment/proxmox/deploy-api.sh
./deployment/proxmox/deploy-ui.sh
```

## Runtime architecture (single LXC)

| Service | Port | Role |
|---------|------|------|
| nginx | 80 | Serves Angular static from `/var/www/stats-india` |
| Spring Boot | 8080 | REST API at `/api/*` (systemd `stats-india-api`) |

nginx proxies `location /api/` to `http://127.0.0.1:8080`.

## Options

```bash
./deployment/build-and-deploy.sh --api --skip-build
./deployment/build-and-deploy.sh --ui
./deployment/build-and-deploy.sh --all --recreate   # destroy + clone LXC first
./deployment/prepare-artifacts.sh --with-tests      # run Maven tests
```

## Configuration

- **`deployment/proxmox/deployment.conf`** — non-secret deploy constants (VMID, memory, template name).
- **`.env`** — passwords, Tailscale keys, Proxmox credentials, Java opts.

After deploy, the app should be available at `http://stats-india.<your-tailnet>/` (MagicDNS if Tailscale join succeeded).

## Troubleshooting

```bash
# On Proxmox host
pct exec 7001 -- systemctl status stats-india-api
pct exec 7001 -- tail -50 /opt/stats-india/logs/api.log
pct exec 7001 -- curl -s http://127.0.0.1:8080/api/health
pct exec 7001 -- curl -sI http://127.0.0.1:80/
```

Recreate container from template:

```bash
./deployment/proxmox/deploy-api.sh --recreate
./deployment/proxmox/deploy-ui.sh
```
