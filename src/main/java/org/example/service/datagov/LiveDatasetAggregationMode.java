package org.example.service.datagov;

/** How map metrics and SQLite aggregates are derived from cached portal rows. */
public enum LiveDatasetAggregationMode {
    /** One row per entity; map value = row count per state (MCA companies). */
    COUNT_ROWS,
    /** One row per state/UT; map value = numeric column on that row. */
    STATE_SNAPSHOT,
    /** Many rows per state; map value = sum of numeric metric column. */
    SUM_METRIC
}
