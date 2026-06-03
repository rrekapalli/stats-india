# Infrastructure

## Proxmox

| Setting | Value |
|---------|-------|
| Host | `192.168.29.231` (from `.env` `PROXMOX_HOST`) |
| Container name | `stats-india` |
| VMID | **7001** |
| Clone template | `moneytree-lxc-base` (VMID **9001**) — built in moneytree repo |
| Cores / RAM / disk | 2 / 2048 MB / 16 GB |
| Container user | `raja` (SSH); app runs as `stats-india` |

Deploy scripts run from dev machine via SSH + `pct` on Proxmox (`deployment/proxmox/lib/proxmox-remote.sh`).

Config: `deployment/proxmox/deployment.conf`  
Secrets: repo root `.env` (see `.env.example`).

## Tailscale

| Setting | Value |
|---------|-------|
| Tailnet DNS | `tailce422e.ts.net` |
| MagicDNS hostname | **stats-india.tailce422e.ts.net** |
| Tailscale IPv4 | `100.119.9.119` (may change on rejoin) |
| Join script | `deployment/proxmox/join-tailscale.sh` |
| Auto-join on deploy | `add-lxc-to-tailscale.sh` (called from deploy-api/ui) |

Required in `.env`:

- `TS_AUTHKEY=tskey-auth-...` (pre-auth key)
- Optional: `TAILSCALE_API_KEY=tskey-api-...` + `TAILNET_DNS` to dedupe hostname before join

Inside LXC: `tailscale-autojoin.service` ensures join on boot.

## Network / ports (inside LXC)

| Port | Service |
|------|---------|
| 80 | nginx → static UI, proxies `/api/` → localhost:8080 |
| 8080 | Spring Boot API |
| 41641 | Tailscale (UDP) |

UFW allows 22, 80, 8080 on deploy.

## Deployment flow

```bash
./deploy.sh --all                     # build + deploy API + UI to VMID 7001
./deployment/proxmox/join-tailscale.sh   # if Tailscale not yet joined
```

Examples:

```bash
./deploy.sh --ui
./deploy.sh --api
./deploy.sh --all --skip-build
./deploy.sh --all --recreate
```

Artifacts: `deployment/artifacts/stats-india-1.0.0.jar`, `frontend-dist.zip`

## Debugging (on Proxmox host)

```bash
pct exec 7001 -- systemctl status stats-india-api nginx tailscale-autojoin
pct exec 7001 -- tail -50 /opt/stats-india/logs/api.log
pct exec 7001 -- curl -s http://127.0.0.1:8080/api/health
pct exec 7001 -- curl -sI http://127.0.0.1:80/
pct exec 7001 -- tailscale status
```

From dev machine (Tailscale):

```bash
curl http://stats-india.tailce422e.ts.net/api/health
curl "http://stats-india.tailce422e.ts.net/api/datasets/4dbe5667-7b6b-41d7-82af-211562424d9a/data?limit=5"
```

## Known deploy pitfalls (fixed in scripts)

- Quote `STATS_INDIA_JAVA_OPTS` in `.env` (spaces break shell source)
- systemd `Environment=` lines must quote values with spaces
- App directory must be owned by `stats-india` user (`/opt/stats-india`, not `/home/raja/app`)
- `DataGovInClient` must use absolute URI (`fromUriString(baseUrl)`)
- Avoid `systemctl enable nginx` during deploy (hangs); use `reload` only

## Maven on dev machine

System `mvn` may be missing. Local install used: `~/.local/opt/apache-maven-3.9.6/bin/mvn`

Or build UI separately: `cd ui && npm run build` then `mvn package -Dfrontend.skip=true`.
