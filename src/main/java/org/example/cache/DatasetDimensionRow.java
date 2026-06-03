package org.example.cache;

/**
 * Persistent dimension definition stored in {@code dataset_dimension}. Mirrors
 * {@code DatasetDimensionSpec} without the runtime normalizer function so the table
 * stays portable between SQLite and Postgres.
 */
public record DatasetDimensionRow(
        String dimensionId,
        String label,
        String role,
        String sourceField,
        String aggregateKey,
        String countUnit,
        int displayLimit,
        int sortOrder,
        boolean filterable
) {}
