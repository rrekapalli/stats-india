package org.example.service.datagov;

import org.example.dto.DimensionRole;

import java.util.List;

/**
 * Builds a categorical dimension by summing named record fields across all rows
 * (used for multi-metric snapshot datasets such as civil vs criminal cases).
 */
public record UnpivotDimensionSpec(
        String id,
        String label,
        DimensionRole role,
        List<UnpivotColumn> columns,
        String countUnit
) {}
