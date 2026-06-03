package org.example.dto;

import java.util.List;

/**
 * Paginated history of ingestion runs for one dataset.
 */
public record DatasetSyncHistoryResponse(
        String resourceId,
        long total,
        int limit,
        int offset,
        List<DatasetSyncRunDto> runs
) {}
