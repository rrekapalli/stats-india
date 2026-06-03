package org.example.batch;

import java.time.Instant;

/**
 * One row of {@code dataset_sync_run} — a Spring Batch ingestion run for a single
 * dataset. Surfaced on the Data Ingestion page History tab.
 */
public record DatasetSyncRun(
        long executionId,
        String resourceId,
        String jobName,
        String status,
        long recordsRead,
        long recordsWritten,
        Instant startedAt,
        Instant completedAt,
        String errorMessage
) {}
