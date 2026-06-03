# Development Workflow

## Prerequisites

- Node **22.x**, npm **10.x** (`ui/`)
- Java **21** (matches `pom.xml`; container may run Java 25 from Temurin)
- Maven 3.9+ (or `~/.local/opt/apache-maven-3.9.6/bin/mvn`)
- Copy `.env.example` → `.env`; set `DATA_GOV_IN_API_KEY`, deploy secrets as needed

## Local development

### Frontend only

```bash
cd ui
npm ci
npm start                    # http://localhost:4200, proxies /api
```

Requires API on `:8080` (see below) or mock will fail on live dataset calls.

### API only (embedded static)

```bash
export DATA_GOV_IN_API_KEY=...   # from .env
mvn spring-boot:run -Dfrontend.skip=true
# http://localhost:8080
```

### Full build (libraries + app + JAR)

```bash
cd ui && npm run build          # → src/main/resources/static
mvn clean package -DskipTests -Dfrontend.skip=true
java -jar target/stats-india-1.0.0.jar
```

Or one shot (downloads Node via Maven):

```bash
./deployment/prepare-artifacts.sh
```

## UI library builds

```bash
cd ui
npm run build:libraries    # all three libs
npm run build:app          # app only (libs must be built first)
```

Libraries: `ui/projects/{angular-grid-layout,dashboard,d3-dashboards}`

## Deploy to production LXC

```bash
./deploy.sh --all
# or incremental:
./deploy.sh --api --skip-build
./deploy.sh --ui
./deployment/proxmox/join-tailscale.sh
```

## Testing endpoints

```bash
curl http://localhost:8080/api/health
curl "http://localhost:8080/api/datasets/4dbe5667-7b6b-41d7-82af-211562424d9a/data?limit=5"
```

## Code style (summary)

- **Backend:** Java 21, Spring Boot 3.3, records for DTOs, minimal comments
- **Frontend:** Angular 21 standalone, PrimeNG Aura, OnPush where used, zoneless default
- **Diffs:** Small, focused; reuse moneytree library patterns in `ui/projects/`

See `.cursor/rules/` for file-specific rules.
