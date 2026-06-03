package org.example.api;

import org.example.batch.DatasetIngestionJobService;
import org.example.batch.DatasetSyncRun;
import org.example.batch.DatasetSyncRunRepository;
import org.example.cache.DatasetCacheMeta;
import org.example.cache.DatasetCacheRepository;
import org.example.cache.DatasetFetchStatus;
import org.example.dto.DatasetSyncRunDto;
import org.example.dto.IngestionSnapshotEntry;
import org.example.dto.IngestionSnapshotResponse;
import org.example.service.datagov.LiveDatasetDefinition;
import org.example.service.datagov.LiveDatasetRegistry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Lightweight rollup endpoint for the Data Ingestion page sidebar.
 * Returns one entry per registered dataset with its current sync status and latest run.
 */
@RestController
@RequestMapping("/api/ingestion")
public class IngestionController {

    private final LiveDatasetRegistry registry;
    private final DatasetCacheRepository cacheRepository;
    private final DatasetSyncRunRepository syncRunRepository;
    private final DatasetIngestionJobService ingestionJobService;

    public IngestionController(
            LiveDatasetRegistry registry,
            DatasetCacheRepository cacheRepository,
            DatasetSyncRunRepository syncRunRepository,
            DatasetIngestionJobService ingestionJobService
    ) {
        this.registry = registry;
        this.cacheRepository = cacheRepository;
        this.syncRunRepository = syncRunRepository;
        this.ingestionJobService = ingestionJobService;
    }

    @GetMapping("/snapshot")
    public IngestionSnapshotResponse getSnapshot() {
        List<IngestionSnapshotEntry> entries = new ArrayList<>();
        for (LiveDatasetDefinition def : registry.all()) {
            entries.add(buildEntry(def));
        }
        return new IngestionSnapshotResponse(entries);
    }

    private IngestionSnapshotEntry buildEntry(LiveDatasetDefinition def) {
        Optional<DatasetCacheMeta> meta = cacheRepository.findMeta(def.resourceId());
        Optional<DatasetSyncRun> latest = syncRunRepository.findLatestForResource(def.resourceId());
        boolean running = ingestionJobService.isRunning(def.resourceId());

        String status = meta.map(m -> m.status().name()).orElse(DatasetFetchStatus.MISSING.name());
        long portalTotal = meta.map(DatasetCacheMeta::portalTotal).orElse(0L);
        long cached = meta.map(DatasetCacheMeta::cachedRecords).orElse(0L);
        String fetchedAt = meta.map(m -> formatInstant(m.fetchedAt())).orElse(null);
        String syncStartedAt = meta.map(m -> formatInstant(m.syncStartedAt())).orElse(null);
        String lastError = meta.map(DatasetCacheMeta::lastError).orElse(null);

        return new IngestionSnapshotEntry(
                def.resourceId(),
                def.title(),
                def.category(),
                def.sourceOrg(),
                ingestionJobService.jobNameFor(def.resourceId()),
                status,
                portalTotal,
                cached,
                fetchedAt,
                syncStartedAt,
                lastError,
                running,
                latest.map(IngestionController::toRunDto).orElse(null)
        );
    }

    private static DatasetSyncRunDto toRunDto(DatasetSyncRun run) {
        return new DatasetSyncRunDto(
                run.executionId(),
                run.resourceId(),
                run.jobName(),
                run.status(),
                run.recordsRead(),
                run.recordsWritten(),
                formatInstant(run.startedAt()),
                formatInstant(run.completedAt()),
                run.errorMessage()
        );
    }

    private static String formatInstant(Instant instant) {
        return instant != null ? instant.toString() : null;
    }
}
