package org.example.service;

import org.example.cache.DatasetCacheMeta;
import org.example.cache.DatasetFetchStatus;
import org.example.cache.DatasetSyncService;
import org.example.dto.DatasetDataResponse;
import org.example.dto.DatasetSyncStatus;
import org.example.service.datagov.McaCompanyMasterDatasetService;
import org.springframework.stereotype.Service;

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

    public DatasetDataResponse getDataset(String resourceId, int offset, int limit, boolean includeRecords) {
        if (!McaCompanyMasterDatasetService.RESOURCE_ID.equals(resourceId)) {
            throw new IllegalArgumentException("No live data provider registered for dataset: " + resourceId);
        }

        return mcaCompanyMasterDatasetService.getFromCache(offset, limit, includeRecords);
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
