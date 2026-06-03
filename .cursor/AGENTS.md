# Stats India — Agent Guide

Open Government Data explorer for India: Angular UI + Spring Boot API, deployed as a single LXC on Proxmox with Tailscale MagicDNS.

## Read first

| Priority | Path | Purpose |
|----------|------|---------|
| 1 | `.cursor/rules/platform-versions.mdc` | Java, Angular, Spring versions |
| 2 | `.cursor/docs/architecture.md` | Repo layout, runtime, API surface |
| 3 | `.cursor/docs/infrastructure.md` | Proxmox LXC, Tailscale, deploy |
| 4 | `.cursor/docs/domain-data-gov-in.md` | data.gov.in API, datasets, transforms |
| 5 | `.cursor/docs/development-workflow.md` | Local dev, build, deploy commands |

## Repo map

```
stats-india/
├── ui/                    # Angular 21 app + workspace libraries
├── src/main/java/         # Spring Boot API (org.example.*)
├── src/main/resources/static/   # Production UI output (ng build)
├── deployment/            # Proxmox deploy scripts, artifacts/
├── .env                   # Secrets (gitignored) — Proxmox, Tailscale, DATA_GOV_IN_API_KEY
└── pom.xml                # Maven: builds UI via frontend-maven-plugin, packages JAR
```

## Production URLs

- **UI:** http://stats-india.tailce422e.ts.net/
- **API:** http://stats-india.tailce422e.ts.net/api/health
- **LAN fallback:** http://192.168.29.62/ (Tailscale IP may change; hostname is stable)

## Conventions

- Minimize diff scope; match existing patterns in `ui/` and `org.example`.
- Secrets only in `.env`, never committed.
- Prefer JSON from data.gov.in; one transformer service per dataset resource UUID.
- User-generated markdown docs go in `Docs/` if requested; baseline lives in `.cursor/docs/`.

## Related workspace

**moneytree** (`../moneytree`) shares Proxmox host, Tailscale tailnet (`tailce422e.ts.net`), and LXC base template `moneytree-lxc-base` (VMID 9001). UI libraries in `ui/projects/` were imported from moneytree.
