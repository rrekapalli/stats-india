package org.example.service;

import org.example.cache.DatasetCacheMeta;
import org.example.cache.DatasetFetchStatus;
import org.example.cache.DatasetSyncService;
import org.example.dto.DatasetDataResponse;
import org.example.dto.DatasetFilter;
import org.example.dto.DatasetSyncStatus;
import org.example.service.datagov.McaCompanyMasterDatasetService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DatasetDataService {

    private final McaCompanyMasterDatasetService mcaCompanyMasterDatasetService;
    private final DatasetSyncService datasetSyncService;

    public DatasetDataService(
            McaCompanyMasterDatasetService mcaCompanyMasterDatasetService,
            DatasetSyncService datasetSyncService
    ) {
        this.mcaCompanyMasterDatasetService = mcaCompanyMasterDatasetService;
        this.datasetSyncService = datasetSyncService;
    }

    public DatasetDataResponse getDataset(
            String resourceId,
            int offset,
            int limit,
            boolean includeRecords,
            List<DatasetFilter> filters
    ) {
        if (!McaCompanyMasterDatasetService.RESOURCE_ID.equals(resourceId)) {
            throw new IllegalArgumentException("No live data provider registered for dataset: " + resourceId);
        }

        return mcaCompanyMasterDatasetService.getFromCache(offset, limit, includeRecords, filters);
    }

    public DatasetDataResponse getDataset(String resourceId, int offset, int limit, boolean includeRecords) {
        return getDataset(resourceId, offset, limit, includeRecords, List.of());
    }

    public DatasetDataResponse getExploreSummary(String resourceId) {
        requireLiveDataset(resourceId);
        return mcaCompanyMasterDatasetService.getExploreSummary();
    }

    public DatasetDataResponse getExploreFiltered(String resourceId, List<DatasetFilter> filters) {
        requireLiveDataset(resourceId);
        return mcaCompanyMasterDatasetService.getExploreFiltered(filters);
    }

    public DatasetDataResponse getExploreRecords(String resourceId, int offset, int limit) {
        requireLiveDataset(resourceId);
        return mcaCompanyMasterDatasetService.getExploreRecords(offset, limit);
    }

    public DatasetSyncStatus getSyncStatus(String resourceId) {
        if (!supportsLiveData(resourceId)) {
            throw new IllegalArgumentException("No live data provider registered for dataset: " + resourceId);
        }
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
        if (!supportsLiveData(resourceId)) {
            throw new IllegalArgumentException("No live data provider registered for dataset: " + resourceId);
        }
        datasetSyncService.startSyncAsync(resourceId);
    }

    public boolean supportsLiveData(String resourceId) {
        return McaCompanyMasterDatasetService.RESOURCE_ID.equals(resourceId);
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
