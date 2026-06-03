package org.example.dto;

/**
 * One dataset's ingestion snapshot for the Data Ingestion page sidebar.
 * Combines static catalog metadata with current sync status and the latest run.
 */
public record IngestionSnapshotEntry(
        String resourceId,
        String title,
        String category,
        String sourceOrg,
        String jobName,
        String status,
        long portalTotal,
        long cachedRecords,
        String fetchedAt,
        String syncStartedAt,
        String lastError,
        boolean running,
        DatasetSyncRunDto lastRun
) {}
