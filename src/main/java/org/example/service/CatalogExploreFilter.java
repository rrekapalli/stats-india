package org.example.service;

import org.example.dto.DatasetDataResponse;
import org.example.dto.DatasetFilter;
import org.example.dto.DimensionGroup;
import org.example.dto.DimensionItem;
import org.example.dto.DimensionRole;
import org.example.dto.StateMetric;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Applies cross-widget filters to catalog (sample) explore responses by scaling
 * state metrics and numeric dimension breakdowns proportionally. Keeps the same
 * {@code /explore/filter} contract as live SQLite-backed datasets.
 */
final class CatalogExploreFilter {

    private CatalogExploreFilter() {}

    static DatasetDataResponse apply(DatasetDataResponse base, List<DatasetFilter> filters) {
        List<StateMetric> stateMetrics = new ArrayList<>(base.stateMetrics());
        List<DimensionGroup> dimensionGroups = copyDimensionGroups(base.dimensionGroups());

        double nationalTotal = stateMetrics.stream().mapToDouble(StateMetric::value).sum();
        if (nationalTotal <= 0 || filters.isEmpty()) {
            return base;
        }

        double scale = 1.0;
        String selectedStateName = null;

        for (DatasetFilter filter : filters) {
            if (filter == null || filter.dimension() == null || filter.value() == null) {
                continue;
            }
            if (isStateDimension(filter.dimension())) {
                Optional<StateMetric> match = findState(stateMetrics, filter.value());
                if (match.isPresent()) {
                    selectedStateName = match.get().state();
                    scale *= match.get().value() / nationalTotal;
                }
                continue;
            }
            DimensionGroup group = findGroup(dimensionGroups, filter.dimension());
            if (group == null) {
                continue;
            }
            DimensionItem item = findItem(group, filter.value());
            if (item != null) {
                scale *= shareForItem(group, item);
            }
        }

        final double filterScale = scale;
        double filteredTotal = nationalTotal * filterScale;

        if (selectedStateName != null) {
            StateMetric selected = findState(stateMetrics, selectedStateName).orElseThrow();
            stateMetrics = List.of(new StateMetric(
                    selected.state(),
                    selected.stateCode(),
                    filteredTotal,
                    selected.unit(),
                    selected.year()
            ));
        } else {
            stateMetrics = stateMetrics.stream()
                    .map(m -> new StateMetric(
                            m.state(),
                            m.stateCode(),
                            m.value() * filterScale,
                            m.unit(),
                            m.year()
                    ))
                    .toList();
        }

        dimensionGroups = scaleDimensionGroups(
                dimensionGroups,
                filters,
                filterScale,
                filteredTotal
        );

        return new DatasetDataResponse(
                base.resourceId(),
                base.title(),
                base.description(),
                base.totalRecords(),
                base.fetchedRecords(),
                base.offset(),
                base.limit(),
                stateMetrics,
                dimensionGroups,
                base.records(),
                base.syncStatus(),
                base.cachedAt(),
                Math.round(filteredTotal)
        );
    }

    private static List<DimensionGroup> scaleDimensionGroups(
            List<DimensionGroup> groups,
            List<DatasetFilter> filters,
            double scale,
            double filteredTotal
    ) {
        List<DimensionGroup> result = new ArrayList<>(groups.size());
        for (DimensionGroup group : groups) {
            if (isReservedGroup(group)) {
                result.add(group);
                continue;
            }
            Optional<DatasetFilter> active = filters.stream()
                    .filter(f -> f != null && group.id().equals(f.dimension()))
                    .findFirst();
            if (active.isPresent()) {
                DimensionItem item = findItem(group, active.get().value());
                if (item != null) {
                    result.add(replaceGroupItems(group, List.of(toFilteredItem(item, filteredTotal))));
                    continue;
                }
            }
            if (hasNumericCounts(group)) {
                result.add(replaceGroupItems(group, group.items().stream()
                        .map(item -> toScaledItem(item, scale))
                        .toList()));
            } else {
                result.add(group);
            }
        }
        return result;
    }

    private static boolean isReservedGroup(DimensionGroup group) {
        if (group.role() == DimensionRole.SUMMARY
                || group.role() == DimensionRole.GEOGRAPHY
                || group.role() == DimensionRole.TEMPORAL) {
            return true;
        }
        return "summary".equals(group.id()) || "geography".equals(group.id()) || "time".equals(group.id());
    }

    private static boolean isStateDimension(String dimension) {
        return "state".equalsIgnoreCase(dimension);
    }

    private static double shareForItem(DimensionGroup group, DimensionItem item) {
        int count = parsePositiveInt(item.valueType());
        if (count > 0) {
            int sum = group.items().stream().mapToInt(dimItem -> parsePositiveInt(dimItem.valueType())).sum();
            return sum > 0 ? (double) count / sum : equalShare(group);
        }
        return equalShare(group);
    }

    private static double equalShare(DimensionGroup group) {
        int size = group.items() == null ? 0 : group.items().size();
        return size > 0 ? 1.0 / size : 1.0;
    }

    private static boolean hasNumericCounts(DimensionGroup group) {
        return group.items().stream().anyMatch(item -> parsePositiveInt(item.valueType()) > 0);
    }

    private static DimensionItem toScaledItem(DimensionItem item, double scale) {
        int count = parsePositiveInt(item.valueType());
        if (count <= 0) {
            return item;
        }
        long scaled = Math.round(count * scale);
        return new DimensionItem(
                item.id(),
                item.label(),
                scaled + " aggregated records",
                String.valueOf(scaled)
        );
    }

    private static DimensionItem toFilteredItem(DimensionItem item, double filteredTotal) {
        long total = Math.round(filteredTotal);
        return new DimensionItem(
                item.id(),
                item.label(),
                total + " aggregated records",
                String.valueOf(total)
        );
    }

    private static DimensionGroup replaceGroupItems(DimensionGroup group, List<DimensionItem> items) {
        return new DimensionGroup(
                group.id(),
                group.label(),
                items,
                group.role(),
                items.size(),
                group.sourceField(),
                group.filterable()
        );
    }

    private static List<DimensionGroup> copyDimensionGroups(List<DimensionGroup> groups) {
        return groups.stream()
                .map(g -> new DimensionGroup(
                        g.id(),
                        g.label(),
                        new ArrayList<>(g.items()),
                        g.role(),
                        g.cardinality(),
                        g.sourceField(),
                        g.filterable()
                ))
                .toList();
    }

    private static DimensionGroup findGroup(List<DimensionGroup> groups, String id) {
        if (id == null) {
            return null;
        }
        for (DimensionGroup group : groups) {
            if (id.equals(group.id())) {
                return group;
            }
        }
        return null;
    }

    private static DimensionItem findItem(DimensionGroup group, String value) {
        if (group.items() == null || value == null) {
            return null;
        }
        String needle = value.trim();
        for (DimensionItem item : group.items()) {
            if (item.label() != null && item.label().equalsIgnoreCase(needle)) {
                return item;
            }
        }
        return null;
    }

    private static Optional<StateMetric> findState(List<StateMetric> metrics, String stateName) {
        if (stateName == null) {
            return Optional.empty();
        }
        String needle = stateName.trim().toLowerCase(Locale.ROOT);
        return metrics.stream()
                .filter(m -> m.state() != null && m.state().trim().toLowerCase(Locale.ROOT).equals(needle))
                .findFirst();
    }

    private static int parsePositiveInt(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        try {
            return Math.max(0, Integer.parseInt(value.trim()));
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }
}
