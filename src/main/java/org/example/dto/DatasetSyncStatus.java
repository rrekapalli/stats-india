package org.example.dto;

public record DatasetSyncStatus(
        String resourceId,
        String status,
        long portalTotal,
        long cachedRecords,
        String fetchedAt,
        String syncStartedAt,
        String lastError
) {}
