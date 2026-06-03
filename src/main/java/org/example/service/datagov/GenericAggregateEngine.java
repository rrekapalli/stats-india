package org.example.service.datagov;

import org.example.dto.DatasetFilter;
import org.example.dto.DimensionGroup;
import org.example.dto.DimensionItem;
import org.example.dto.DimensionRole;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Dataset-agnostic aggregation, filter matching, and dimension-group construction driven by
 * {@link DatasetDimensionSpec} entries. Lets new live datasets be wired up by registering a
 * spec list rather than copy-pasting hardcoded {@code switch} statements.
 */
public final class GenericAggregateEngine {

    private GenericAggregateEngine() {}

    /** Aggregate a batch of records into {@code Map<aggregateKey, Map<value, count>>}. */
    public static Map<String, Map<String, Integer>> aggregate(
            List<Map<String, String>> records,
            List<DatasetDimensionSpec> specs
    ) {
        Map<String, Map<String, Integer>> result = emptyAggregates(specs);
        for (Map<String, String> row : records) {
            mergeRow(row, specs, result);
        }
        return result;
    }

    /** Mutate {@code target} with this row's counts. */
    public static void mergeRow(
            Map<String, String> row,
            List<DatasetDimensionSpec> specs,
            Map<String, Map<String, Integer>> target
    ) {
        for (DatasetDimensionSpec spec : specs) {
            if (spec.sourceField() == null) {
                continue;
            }
            String value = applyNormalizer(spec, row.get(spec.sourceField()));
            if (value == null) {
                continue;
            }
            target.computeIfAbsent(spec.resolvedAggregateKey(), k -> new LinkedHashMap<>())
                    .merge(value, 1, Integer::sum);
        }
    }

    public static boolean matchesAllFilters(
            Map<String, String> row,
            List<DatasetFilter> filters,
            List<DatasetDimensionSpec> specs
    ) {
        if (filters == null || filters.isEmpty()) {
            return true;
        }
        for (DatasetFilter filter : filters) {
            if (!matchesFilter(row, filter, specs)) {
                return false;
            }
        }
        return true;
    }

    private static boolean matchesFilter(
            Map<String, String> row,
            DatasetFilter filter,
            List<DatasetDimensionSpec> specs
    ) {
        DatasetDimensionSpec spec = findSpec(specs, filter.dimension());
        if (spec == null || spec.sourceField() == null) {
            return true;
        }
        String value = applyNormalizer(spec, row.get(spec.sourceField()));
        return filter.value().equals(value);
    }

    /**
     * Build enriched {@link DimensionGroup}s from cached aggregates. Items are sorted by count
     * descending and trimmed to {@link DatasetDimensionSpec#displayLimit}. Specs without
     * {@link DatasetDimensionSpec#sourceField} are skipped (caller injects them — e.g. summary).
     */
    public static List<DimensionGroup> buildDimensionGroups(
            Map<String, Map<String, Integer>> aggregates,
            List<DatasetDimensionSpec> specs
    ) {
        List<DimensionGroup> groups = new ArrayList<>(specs.size());
        for (DatasetDimensionSpec spec : specs) {
            if (spec.sourceField() == null) {
                continue;
            }
            Map<String, Integer> counts = aggregates.getOrDefault(spec.resolvedAggregateKey(), Map.of());
            groups.add(toDimensionGroup(spec, counts));
        }
        return groups;
    }

    public static DimensionGroup toDimensionGroup(
            DatasetDimensionSpec spec,
            Map<String, Integer> counts
    ) {
        Map<String, Integer> top = topN(counts, spec.displayLimit());
        List<DimensionItem> items = top.entrySet().stream()
                .sorted(Comparator.comparingInt(Map.Entry<String, Integer>::getValue).reversed())
                .map(e -> new DimensionItem(
                        slugify(e.getKey()),
                        e.getKey(),
                        formatItemDescription(e.getValue(), spec.countUnit()),
                        String.valueOf(e.getValue())
                ))
                .toList();
        return new DimensionGroup(
                spec.id(),
                spec.label(),
                items,
                spec.role(),
                items.size(),
                spec.sourceField(),
                spec.role() == DimensionRole.CATEGORICAL || spec.role() == DimensionRole.GEOGRAPHY
        );
    }

    public static DatasetDimensionSpec findSpec(List<DatasetDimensionSpec> specs, String id) {
        if (id == null) {
            return null;
        }
        for (DatasetDimensionSpec spec : specs) {
            if (id.equals(spec.id())) {
                return spec;
            }
        }
        return null;
    }

    private static Map<String, Map<String, Integer>> emptyAggregates(List<DatasetDimensionSpec> specs) {
        Map<String, Map<String, Integer>> result = new LinkedHashMap<>();
        for (DatasetDimensionSpec spec : specs) {
            if (spec.sourceField() != null) {
                result.put(spec.resolvedAggregateKey(), new LinkedHashMap<>());
            }
        }
        return result;
    }

    private static String applyNormalizer(DatasetDimensionSpec spec, String raw) {
        if (spec.normalizer() == null) {
            return raw == null || raw.isBlank() ? null : raw.trim();
        }
        return spec.normalizer().apply(raw);
    }

    private static Map<String, Integer> topN(Map<String, Integer> source, int limit) {
        if (limit <= 0 || source.size() <= limit) {
            return source;
        }
        return source.entrySet().stream()
                .sorted(Comparator.comparingInt(Map.Entry<String, Integer>::getValue).reversed())
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    private static String formatItemDescription(int count, String unit) {
        String noun = unit == null || unit.isBlank() ? "records" : unit;
        return count + " " + noun;
    }

    private static String slugify(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}
