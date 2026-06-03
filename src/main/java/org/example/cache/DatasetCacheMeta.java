package org.example.cache;

import java.time.Instant;

public record DatasetCacheMeta(
        String resourceId,
        String title,
        String description,
        long portalTotal,
        long cachedRecords,
        DatasetFetchStatus status,
        Instant fetchedAt,
        Instant syncStartedAt,
        String lastError
) {}
