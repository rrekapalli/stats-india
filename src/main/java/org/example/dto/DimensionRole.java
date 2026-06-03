package org.example.dto;

/**
 * Semantic role of a {@link DimensionGroup} so the client (and future analytics layers)
 * can decide how to visualize it without knowing dataset-specific dimension ids.
 */
public enum DimensionRole {
    /** Synthetic KPI tiles: totals, cached counts, last-synced timestamps. */
    SUMMARY,
    /** State/UT, country, district — feeds the map and horizontal states bar. */
    GEOGRAPHY,
    /** Year, period, base year — temporal axis. */
    TEMPORAL,
    /** Discrete categorical breakdown — eligible for pie / vertical bar slots. */
    CATEGORICAL,
    /** Numeric measures (indicators) — not eligible as breakdown axis. */
    MEASURE
}
