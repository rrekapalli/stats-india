package org.example.cache;

import org.example.batch.DatasetIngestionJobService;
import org.example.service.datagov.LiveDatasetDefinition;
import org.example.service.datagov.LiveDatasetRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Thin orchestrator that wires legacy callers (controller, scheduled refresh, startup
 * hook) to the Spring Batch ingestion service. The actual ingestion work is owned by
 * {@link DatasetIngestionJobService}.
 */
@Service
public class DatasetSyncService {

    private static final Logger log = LoggerFactory.getLogger(DatasetSyncService.class);

    private final DatasetCacheRepository cacheRepository;
    private final DatasetCacheProperties cacheProperties;
    private final LiveDatasetRegistry registry;
    private final DatasetIngestionJobService ingestionJobService;

    public DatasetSyncService(
            DatasetCacheRepository cacheRepository,
            DatasetCacheProperties cacheProperties,
            LiveDatasetRegistry registry,
            DatasetIngestionJobService ingestionJobService
    ) {
        this.cacheRepository = cacheRepository;
        this.cacheProperties = cacheProperties;
        this.registry = registry;
        this.ingestionJobService = ingestionJobService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        if (!cacheProperties.isSyncOnStartup()) {
            return;
        }
        for (LiveDatasetDefinition def : registry.all()) {
            refreshIfNeeded(def.resourceId());
        }
    }

    @Scheduled(cron = "${stats-india.cache.refresh-cron:0 0 3 * * SUN}")
    public void scheduledRefresh() {
        for (LiveDatasetDefinition def : registry.all()) {
            refreshIfNeeded(def.resourceId());
        }
    }

    public void refreshIfNeeded(String resourceId) {
        if (!registry.isRegistered(resourceId)) {
            return;
        }
        if (ingestionJobService.isRunning(resourceId)) {
            return;
        }
        Optional<DatasetCacheMeta> meta = cacheRepository.findMeta(resourceId);
        if (meta.isPresent() && meta.get().status() == DatasetFetchStatus.READY
                && !cacheRepository.isStale(meta.get(), cacheProperties.getRefreshAfterDays())) {
            return;
        }
        try {
            ingestionJobService.triggerJob(resourceId);
        } catch (IllegalStateException ex) {
            log.info("Skipping refresh for {}: {}", resourceId, ex.getMessage());
        }
    }

    /** Trigger an ingestion job; throws {@link IllegalStateException} if one is running. */
    public long startSync(String resourceId) {
        return ingestionJobService.triggerJob(resourceId);
    }

    public Optional<DatasetCacheMeta> getMeta(String resourceId) {
        return cacheRepository.findMeta(resourceId);
    }
}
