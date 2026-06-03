package org.example.service;

import org.example.cache.DatasetCacheMeta;
import org.example.cache.DatasetFetchStatus;
import org.example.cache.DatasetSyncService;
import org.example.dto.DatasetDataResponse;
import org.example.dto.DatasetFilter;
import org.example.dto.DatasetSyncStatus;
import org.example.dto.DimensionGroup;
import org.example.service.datagov.CachedLiveDatasetService;
import org.example.service.datagov.LiveDatasetRegistry;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DatasetDataService {

    private final CachedLiveDatasetService liveDatasetService;
    private final LiveDatasetRegistry registry;
    private final DatasetSyncService datasetSyncService;

    public DatasetDataService(
            CachedLiveDatasetService liveDatasetService,
            LiveDatasetRegistry registry,
            DatasetSyncService datasetSyncService
    ) {
        this.liveDatasetService = liveDatasetService;
        this.registry = registry;
        this.datasetSyncService = datasetSyncService;
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
        datasetSyncService.startSyncAsync(resourceId);
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
