package org.example.dto;

/**
 * One row of dataset ingestion history surfaced on the Data Ingestion page.
 * Backed by {@code dataset_sync_run}.
 */
public record DatasetSyncRunDto(
        long executionId,
        String resourceId,
        String jobName,
        String status,
        long recordsRead,
        long recordsWritten,
        String startedAt,
        String completedAt,
        String errorMessage
) {}
