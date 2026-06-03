package org.example.service;

import org.example.batch.DatasetIngestionJobService;
import org.example.batch.DatasetSyncRun;
import org.example.cache.DatasetCacheMeta;
import org.example.cache.DatasetFetchStatus;
import org.example.cache.DatasetSyncService;
import org.example.dto.DatasetDataResponse;
import org.example.dto.DatasetFilter;
import org.example.dto.DatasetSyncHistoryResponse;
import org.example.dto.DatasetSyncRunDto;
import org.example.dto.DatasetSyncStatus;
import org.example.dto.DimensionGroup;
import org.example.service.datagov.CachedLiveDatasetService;
import org.example.service.datagov.LiveDatasetRegistry;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class DatasetDataService {

    private final CachedLiveDatasetService liveDatasetService;
    private final LiveDatasetRegistry registry;
    private final DatasetSyncService datasetSyncService;
    private final DatasetIngestionJobService ingestionJobService;

    public DatasetDataService(
            CachedLiveDatasetService liveDatasetService,
            LiveDatasetRegistry registry,
            DatasetSyncService datasetSyncService,
            DatasetIngestionJobService ingestionJobService
    ) {
        this.liveDatasetService = liveDatasetService;
        this.registry = registry;
        this.datasetSyncService = datasetSyncService;
        this.ingestionJobService = ingestionJobService;
    }

    public DatasetDataResponse getDataset(
            String resourceId,
            int offset,
            int limit,
            boolean includeRecords,
            List<DatasetFilter> filters
    ) {
        requireLiveDataset(resourceId);
        return liveDatasetService.getFromCache(resourceId, offset, limit, includeRecords, filters);
    }

    public DatasetDataResponse getDataset(String resourceId, int offset, int limit, boolean includeRecords) {
        return getDataset(resourceId, offset, limit, includeRecords, List.of());
    }

    public DatasetDataResponse getExploreSummary(String resourceId) {
        requireLiveDataset(resourceId);
        return enrichDimensions(liveDatasetService.getExploreSummary(resourceId));
    }

    public DatasetDataResponse getExploreFiltered(String resourceId, List<DatasetFilter> filters) {
        requireLiveDataset(resourceId);
        if (filters == null || filters.isEmpty()) {
            return getExploreSummary(resourceId);
        }
        return enrichDimensions(liveDatasetService.getExploreFiltered(resourceId, filters));
    }

    public DatasetDataResponse getExploreRecords(String resourceId, int offset, int limit) {
        requireLiveDataset(resourceId);
        return liveDatasetService.getExploreRecords(resourceId, offset, limit);
    }

    private DatasetDataResponse enrichDimensions(DatasetDataResponse response) {
        List<DimensionGroup> enriched = DimensionMetadataEnricher.enrichAll(response.dimensionGroups());
        return new DatasetDataResponse(
                response.resourceId(),
                response.title(),
                response.description(),
                response.totalRecords(),
                response.fetchedRecords(),
                response.offset(),
                response.limit(),
                response.stateMetrics(),
                enriched,
                response.records(),
                response.syncStatus(),
                response.cachedAt(),
                response.recordsCached(),
                response.stateTimeSeries()
        );
    }

    public DatasetSyncStatus getSyncStatus(String resourceId) {
        requireLiveDataset(resourceId);
        return datasetSyncService.getMeta(resourceId)
                .map(this::toSyncStatus)
                .orElse(new DatasetSyncStatus(
                        resourceId,
                        DatasetFetchStatus.MISSING.name(),
                        0,
                        0,
                        null,
                        null,
                        null
                ));
    }

    public void triggerSync(String resourceId) {
        requireLiveDataset(resourceId);
        datasetSyncService.startSync(resourceId);
    }

    public DatasetSyncHistoryResponse getSyncHistory(String resourceId, int limit, int offset) {
        requireLiveDataset(resourceId);
        int safeLimit = Math.max(1, Math.min(limit, 200));
        int safeOffset = Math.max(0, offset);
        List<DatasetSyncRun> runs = ingestionJobService.getHistory(resourceId, safeLimit, safeOffset);
        long total = ingestionJobService.getHistoryCount(resourceId);
        List<DatasetSyncRunDto> dtos = runs.stream().map(DatasetDataService::toRunDto).toList();
        return new DatasetSyncHistoryResponse(resourceId, total, safeLimit, safeOffset, dtos);
    }

    public boolean isIngestionRunning(String resourceId) {
        requireLiveDataset(resourceId);
        return ingestionJobService.isRunning(resourceId);
    }

    public String ingestionJobName(String resourceId) {
        requireLiveDataset(resourceId);
        return ingestionJobService.jobNameFor(resourceId);
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

    public boolean supportsLiveData(String resourceId) {
        return registry.isRegistered(resourceId);
    }

    private void requireLiveDataset(String resourceId) {
        if (!supportsLiveData(resourceId)) {
            throw new IllegalArgumentException("No live data provider registered for dataset: " + resourceId);
        }
    }

    private DatasetSyncStatus toSyncStatus(DatasetCacheMeta meta) {
        return new DatasetSyncStatus(
                meta.resourceId(),
                meta.status().name(),
                meta.portalTotal(),
                meta.cachedRecords(),
                meta.fetchedAt() != null ? meta.fetchedAt().toString() : null,
                meta.syncStartedAt() != null ? meta.syncStartedAt().toString() : null,
                meta.lastError()
        );
    }
}
