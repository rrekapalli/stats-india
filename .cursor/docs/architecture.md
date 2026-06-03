# Architecture

## Purpose

Stats India is a single deployable unit that lets users explore [data.gov.in](https://data.gov.in) datasets with:

- Left panel: dataset metadata and dimension breakdowns (accordions)
- Right panel: India choropleth map (d3 + `@svg-maps/india`) and raw data table

First live dataset: **MCA RoC-wise Company Master Data** (~3.6M records on portal; UI uses configurable sample/offset).

## Runtime (production)

```
Browser → nginx :80 (static UI, /api proxy)
              └→ Spring Boot :8080 (REST API)
                      └→ https://api.data.gov.in (JSON, server-side only)
```

| Component | Location in LXC | systemd unit |
|-----------|-----------------|--------------|
| nginx | `/var/www/stats-india` | `nginx` |
| API JAR | `/opt/stats-india/stats-india.jar` | `stats-india-api` |
| API logs | `/opt/stats-india/logs/api.log` | — |

Spring Boot also embeds static files in the JAR (`src/main/resources/static/`) for single-JAR runs; production nginx serves UI separately for faster UI-only deploys.

## Backend (`src/main/java/org/example/`)

| Package / area | Role |
|----------------|------|
| `api/` | REST controllers (`HealthController`, `DatasetController`) |
| `service/` | `DatasetCatalogService` (mock catalog + legacy samples) |
| `service/DatasetDataService` | Routes live dataset fetches by resource UUID |
| `service/datagov/` | Per-dataset fetch + transform (e.g. `McaCompanyMasterDatasetService`) |
| `client/DataGovInClient` | HTTP client to `api.data.gov.in` |
| `config/` | `DataGovInProperties`, `AppConfig` (RestClient timeouts) |
| `dto/` | Records for API responses |
| `web/SpaForwardingController` | SPA fallback for non-`/api` routes when running JAR-only |

### API endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | `{ status, service, version }` |
| GET | `/api/datasets` | Catalog list |
| GET | `/api/datasets/{id}` | Catalog entry |
| GET | `/api/datasets/{id}/dimensions` | Mock dimensions (non-live datasets) |
| GET | `/api/datasets/{id}/state-metrics` | Live metrics for MCA UUID; mock for others |
| GET | `/api/datasets/{id}/data?offset=&limit=` | **Live data** from data.gov.in + transform |

Live dataset id (MCA): `4dbe5667-7b6b-41d7-82af-211562424d9a`

Config: `stats-india.data-gov-in.api-key=${DATA_GOV_IN_API_KEY:}` in `application.properties`.

## Frontend (`ui/`)

| Path | Role |
|------|------|
| `src/app/core/` | Shell, header, footer |
| `src/app/features/explorer/` | Main page: drawers, accordions, map, tabs |
| `src/app/features/explorer/india-state-map/` | d3 choropleth, zoom |
| `src/app/services/stats-api.service.ts` | HTTP client |
| `src/app/models/dataset.models.ts` | TS types + `MCA_COMPANY_MASTER_RESOURCE_ID` |

### Workspace libraries (from moneytree)

| Library | Path alias | Build |
|---------|------------|-------|
| `angular-grid-layout` | `angular-grid-layout` | `npm run build:angular-grid-layout` |
| `dashboard` | `@dashboard/public-api` | `npm run build:dashboard` |
| `d3-dashboards` | `@d3-dashboards/public-api` | `npm run build:d3-dashboards` |

Build output: `../src/main/resources/static` (flat, for Spring Boot).

Dev server: `cd ui && npm start` — proxies `/api` via `ui/proxy.conf.json`.

## Adding a new data.gov.in dataset

1. Add catalog entry in `DatasetCatalogService`.
2. Create `service/datagov/XxxDatasetService` with `RESOURCE_ID`, `fetchAndTransform()`.
3. Register in `DatasetDataService.getDataset()`.
4. Wire explorer (or new feature) to `getDatasetData(id)`.
5. Map state field to `@svg-maps/india` names via normalization map (see MCA service).
