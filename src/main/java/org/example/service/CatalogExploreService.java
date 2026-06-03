package org.example.service;

import org.example.cache.DatasetFetchStatus;
import org.example.dto.DatasetDataResponse;
import org.example.dto.DatasetSummary;
import org.example.dto.DimensionGroup;
import org.example.dto.StateMetric;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Produces a {@link DatasetDataResponse} for mock catalog datasets so the explorer can
 * use a single {@code /explore} contract regardless of whether the dataset is live or
 * sample data. Cross-filtering is a no-op for catalog entries.
 */
@Service
public class CatalogExploreService {

    private final DatasetCatalogService catalogService;

    public CatalogExploreService(DatasetCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    public DatasetDataResponse exploreSummary(String resourceId) {
        DatasetSummary summary = catalogService.getDataset(resourceId);
        List<StateMetric> stateMetrics = catalogService.getStateMetrics(resourceId);
        List<DimensionGroup> dimensionGroups = DimensionMetadataEnricher.enrichAll(
                catalogService.getDimensions(resourceId)
        );
        long total = (long) stateMetrics.stream().mapToDouble(StateMetric::value).sum();
        return new DatasetDataResponse(
                resourceId,
                summary.title(),
                summary.description(),
                total,
                0,
                0,
                0,
                stateMetrics,
                dimensionGroups,
                List.of(),
                DatasetFetchStatus.READY.name(),
                null,
                0L
        );
    }
}
