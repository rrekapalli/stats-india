package org.example.dto;

import java.util.List;

/**
 * Snapshot of all registered datasets and their current ingestion status.
 * Drives the Data Ingestion page's left sidebar (badges + "running" indicators).
 */
public record IngestionSnapshotResponse(
        List<IngestionSnapshotEntry> datasets
) {}
