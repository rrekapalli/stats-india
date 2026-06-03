package org.example.service;

import org.example.dto.DatasetDataResponse;
import org.example.service.datagov.McaCompanyMasterDatasetService;
import org.springframework.stereotype.Service;

@Service
public class DatasetDataService {

    private final McaCompanyMasterDatasetService mcaCompanyMasterDatasetService;

    public DatasetDataService(McaCompanyMasterDatasetService mcaCompanyMasterDatasetService) {
        this.mcaCompanyMasterDatasetService = mcaCompanyMasterDatasetService;
    }

    public DatasetDataResponse getDataset(String resourceId, int offset, int limit) {
        if (McaCompanyMasterDatasetService.RESOURCE_ID.equals(resourceId)) {
            return mcaCompanyMasterDatasetService.fetchAndTransform(offset, limit);
        }
        throw new IllegalArgumentException("No live data provider registered for dataset: " + resourceId);
    }

    public boolean supportsLiveData(String resourceId) {
        return McaCompanyMasterDatasetService.RESOURCE_ID.equals(resourceId);
    }
}
