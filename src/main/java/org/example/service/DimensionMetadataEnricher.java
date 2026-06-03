package org.example.service;

import org.example.dto.DimensionGroup;
import org.example.dto.DimensionItem;
import org.example.dto.DimensionRole;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Adds role + cardinality + filter metadata to {@link DimensionGroup} instances built by
 * legacy code paths (catalog mocks, MCA aggregator) so the UI can pick chart types
 * uniformly. Pure functions — no Spring component needed.
 */
public final class DimensionMetadataEnricher {

    private static final Set<String> GEOGRAPHY_IDS = Set.of("state", "geography", "geographic", "location");
    private static final Set<String> TEMPORAL_IDS = Set.of("time", "temporal", "period");
    private static final Set<String> SUMMARY_IDS = Set.of("summary");
    private static final Set<String> MEASURE_IDS = Set.of("indicator", "measure", "metric");

    private DimensionMetadataEnricher() {}

    public static List<DimensionGroup> enrichAll(List<DimensionGroup> groups) {
        return groups.stream().map(DimensionMetadataEnricher::enrich).toList();
    }

    public static DimensionGroup enrich(DimensionGroup group) {
        if (group == null) {
            return null;
        }
        DimensionRole role = group.role() != null ? group.role() : inferRole(group);
        Integer cardinality = group.cardinality() != null ? group.cardinality() : computeCardinality(group);
        String sourceField = group.sourceField();
        boolean filterable = group.filterable()
                || (sourceField != null && (role == DimensionRole.CATEGORICAL || role == DimensionRole.GEOGRAPHY));
        return new DimensionGroup(
                group.id(),
                group.label(),
                group.items(),
                role,
                cardinality,
                sourceField,
                filterable
        );
    }

    private static DimensionRole inferRole(DimensionGroup group) {
        String id = group.id() == null ? "" : group.id().toLowerCase(Locale.ROOT);
        if (SUMMARY_IDS.contains(id)) {
            return DimensionRole.SUMMARY;
        }
        if (GEOGRAPHY_IDS.contains(id)) {
            return DimensionRole.GEOGRAPHY;
        }
        if (TEMPORAL_IDS.contains(id)) {
            return DimensionRole.TEMPORAL;
        }
        if (MEASURE_IDS.contains(id)) {
            return DimensionRole.MEASURE;
        }
        return DimensionRole.CATEGORICAL;
    }

    private static int computeCardinality(DimensionGroup group) {
        List<DimensionItem> items = group.items();
        if (items == null || items.isEmpty()) {
            return 0;
        }
        int numeric = 0;
        int labeled = 0;
        for (DimensionItem item : items) {
            if (item.label() != null && !item.label().isBlank()) {
                labeled++;
            }
            if (parsePositiveInt(item.valueType()) > 0) {
                numeric++;
            }
        }
        return numeric > 0 ? numeric : labeled;
    }

    private static int parsePositiveInt(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }
}
