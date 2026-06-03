---
name: stats-india-dev
description: >-
  Develop, build, and deploy Stats India (Angular + Spring Boot, data.gov.in,
  Proxmox LXC VMID 7001, Tailscale). Use when working on explorer, datasets,
  deployment, or infra for this repo.
---
# Stats India development

## Before coding

1. Read `.cursor/AGENTS.md`
2. For infra/deploy issues → `.cursor/docs/infrastructure.md`
3. For new datasets → `.cursor/docs/domain-data-gov-in.md`

## Common tasks

### Run locally

```bash
export DATA_GOV_IN_API_KEY=$(grep '^DATA_GOV_IN_API_KEY=' .env | cut -d= -f2-)
cd ui && npm start          # terminal 1
mvn spring-boot:run -Dfrontend.skip=true   # terminal 2
```

### Build & deploy

```bash
./deployment/prepare-artifacts.sh
./deployment/deploy-all.sh
```

### Add data.gov.in dataset

1. `service/datagov/NewDatasetService.java` — `RESOURCE_ID`, `fetchAndTransform`
2. Wire `DatasetDataService`
3. Catalog entry + frontend id constant
4. Explorer or new feature consumes `/api/datasets/{id}/data`

### Debug production

```bash
curl http://stats-india.tailce422e.ts.net/api/health
# on Proxmox:
pct exec 7001 -- tail -50 /opt/stats-india/logs/api.log
```

## Do not

- Commit `.env` or API keys
- Put secrets in Angular environment files
- Use relative-only URIs in `DataGovInClient`
