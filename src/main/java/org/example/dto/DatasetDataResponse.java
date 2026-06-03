package org.example.dto;

import java.util.List;
import java.util.Map;

public record DatasetDataResponse(
        String resourceId,
        String title,
        String description,
        long totalRecords,
        int fetchedRecords,
        int offset,
        int limit,
        List<StateMetric> stateMetrics,
        List<DimensionGroup> dimensionGroups,
        List<Map<String, String>> records,
        String syncStatus,
        String cachedAt,
        long recordsCached,
        StateTimeSeries stateTimeSeries
) {}
