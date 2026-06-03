# Domain: data.gov.in

## Overview

[data.gov.in](https://data.gov.in) is India's Open Government Data portal. Stats India consumes the **Resource API**:

```
GET https://api.data.gov.in/resource/{uuid}?api-key=...&format=json&offset=&limit=
```

- Prefer **`format=json`** (also supports csv, xml)
- API key: register at data.gov.in; store as `DATA_GOV_IN_API_KEY` in `.env`
- Keys are **server-side only** — never expose in Angular bundle

## Response shape (JSON)

```json
{
  "title": "...",
  "desc": "...",
  "total": 3666025,
  "count": 1000,
  "offset": "0",
  "limit": "1000",
  "records": [ { "FieldName": "value", ... } ]
}
```

Field names match CSV headers (PascalCase, occasional special chars like `CompanyIndian/Foreign Company`).

## First dataset: MCA Company Master

| Property | Value |
|----------|-------|
| Resource UUID | `4dbe5667-7b6b-41d7-82af-211562424d9a` |
| Title | Registrars of Companies (RoC)-wise Company Master Data |
| Source org | Ministry of Corporate Affairs |
| Key fields | `CompanyStateCode`, `CompanyStatus`, `CompanyIndustrialClassification`, `CompanyName`, `CIN`, … |
| Transform service | `McaCompanyMasterDatasetService` |

### Transform outputs

- **`stateMetrics`**: count of companies per state in sample (for choropleth)
- **`dimensionGroups`**: summary, status, industry, category, state breakdowns
- **`records`**: cleaned camelCase rows for Data tab

### State name normalization

Portal uses lowercase/inconsistent state codes (`karnataka`, `nct of delhi`). Map to `@svg-maps/india` location names via `STATE_ALIASES` + title-case in `McaCompanyMasterDatasetService.normalizeState()`.

## Sample vs full data

Current explorer loads **offset=0, limit=1000** (portal total ~3.6M). Map and accordions reflect the **sample**, not national totals. Future work: pagination, filters, server-side aggregation, or data.gov.in filter params.

## Adding datasets

Pattern for each new resource UUID:

1. **`XxxDatasetService`** — `public static final String RESOURCE_ID`, `fetchAndTransform(offset, limit)`
2. Clean/marshal fields in a dedicated method (don't genericize too early)
3. Register in **`DatasetDataService`**
4. Catalog entry in **`DatasetCatalogService`**
5. Frontend constant + explorer wiring

Generic client stays in **`DataGovInClient`**; dataset-specific logic stays in `service/datagov/`.
