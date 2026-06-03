package org.example.service;

import org.example.dto.DatasetSummary;
import org.example.dto.DimensionGroup;
import org.example.service.datagov.CachedLiveDatasetService;
import org.example.service.datagov.LiveDatasetDefinition;
import org.example.service.datagov.LiveDatasetRegistry;
import org.springframework.stereotype.Service;

import java.util.List;

/** Catalog metadata for registered live data.gov.in datasets only. */
@Service
public class DatasetCatalogService {

    private final LiveDatasetRegistry registry;
    private final CachedLiveDatasetService liveDatasetService;

    public DatasetCatalogService(LiveDatasetRegistry registry, CachedLiveDatasetService liveDatasetService) {
        this.registry = registry;
        this.liveDatasetService = liveDatasetService;
    }

    public List<DatasetSummary> listDatasets() {
        return registry.all().stream()
                .map(this::toSummary)
                .toList();
    }

    public DatasetSummary getDataset(String id) {
        return toSummary(registry.require(id));
    }

    public List<DimensionGroup> getDimensions(String datasetId) {
        return liveDatasetService.getExploreSummary(datasetId).dimensionGroups();
    }

    private DatasetSummary toSummary(LiveDatasetDefinition def) {
        return new DatasetSummary(
                def.resourceId(),
                def.title(),
                def.category(),
                def.sourceOrg(),
                registry.portalUrl(def.resourceId()),
                def.description(),
                def.updateFrequency()
        );
    }
}
