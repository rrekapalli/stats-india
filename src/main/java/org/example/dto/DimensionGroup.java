package org.example.dto;

import java.util.List;

/**
 * A named breakdown axis returned by the explore API. Optional metadata fields
 * ({@link #role}, {@link #cardinality}, {@link #sourceField}, {@link #filterable})
 * let the UI pick chart types and wire cross-filters without dataset-specific code.
 */
public record DimensionGroup(
        String id,
        String label,
        List<DimensionItem> items,
        DimensionRole role,
        Integer cardinality,
        String sourceField,
        boolean filterable
) {

    /** Backward-compatible constructor — leaves metadata unset for clients that infer it. */
    public DimensionGroup(String id, String label, List<DimensionItem> items) {
        this(id, label, items, null, null, null, false);
    }
}
