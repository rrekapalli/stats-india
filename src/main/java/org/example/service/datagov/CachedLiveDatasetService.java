package org.example.service.datagov;

import com.fasterxml.jackson.databind.JsonNode;
import org.example.cache.DatasetCacheMeta;
import org.example.cache.DatasetCacheRepository;
import org.example.cache.DatasetFetchStatus;
import org.example.dto.DatasetDataResponse;
import org.example.dto.DatasetFilter;
import org.example.dto.DimensionGroup;
import org.example.dto.DimensionItem;
import org.example.dto.DimensionRole;
import org.example.dto.StateMetric;
import org.example.dto.StateTimeSeries;
import org.example.service.StateTimeSeriesBuilder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class CachedLiveDatasetService {

    private final DatasetCacheRepository cacheRepository;
    private final LiveDatasetRegistry registry;

    public CachedLiveDatasetService(DatasetCacheRepository cacheRepository, LiveDatasetRegistry registry) {
        this.cacheRepository = cacheRepository;
        this.registry = registry;
    }

    public LiveDatasetDefinition definition(String resourceId) {
        return registry.require(resourceId);
    }

    public DatasetDataResponse getExploreSummary(String resourceId) {
        LiveDatasetDefinition def = registry.require(resourceId);
        Optional<DatasetCacheMeta> metaOpt = cacheRepository.findMeta(resourceId);
        if (metaOpt.isEmpty()) {
            return emptyResponse(def, DatasetFetchStatus.MISSING.name(), null, 0);
        }
        return buildExploreResponse(def, metaOpt.get(), List.of(), null, 0, 0, false);
    }

    public DatasetDataResponse getExploreFiltered(String resourceId, List<DatasetFilter> filters) {
        LiveDatasetDefinition def = registry.require(resourceId);
        Optional<DatasetCacheMeta> metaOpt = cacheRepository.findMeta(resourceId);
        if (metaOpt.isEmpty()) {
            return emptyResponse(def, DatasetFetchStatus.MISSING.name(), null, 0);
        }
        if (filters == null || filters.isEmpty()) {
            return getExploreSummary(resourceId);
        }
        FilteredResult filtered = computeFiltered(def, filters);
        return buildExploreResponse(def, metaOpt.get(), filters, filtered.matchCount(), 0, 0, false);
    }

    public DatasetDataResponse getExploreRecords(String resourceId, int offset, int limit) {
        LiveDatasetDefinition def = registry.require(resourceId);
        Optional<DatasetCacheMeta> metaOpt = cacheRepository.findMeta(resourceId);
        if (metaOpt.isEmpty()) {
            return emptyResponse(def, DatasetFetchStatus.MISSING.name(), null, 0);
        }
        DatasetCacheMeta meta = metaOpt.get();
        int safeLimit = Math.max(0, Math.min(limit, 500));
        List<Map<String, String>> records = safeLimit > 0
                ? cacheRepository.loadRecords(resourceId, offset, safeLimit)
                : List.of();
        return new DatasetDataResponse(
                resourceId,
                meta.title(),
                meta.description(),
                meta.portalTotal(),
                records.size(),
                offset,
                safeLimit,
                List.of(),
                List.of(),
                records,
                meta.status().name(),
                formatInstant(meta.fetchedAt()),
                meta.cachedRecords(),
                null
        );
    }

    public DatasetDataResponse getFromCache(
            String resourceId,
            int offset,
            int limit,
            boolean includeRecords,
            List<DatasetFilter> filters
    ) {
        LiveDatasetDefinition def = registry.require(resourceId);
        Optional<DatasetCacheMeta> metaOpt = cacheRepository.findMeta(resourceId);
        if (metaOpt.isEmpty()) {
            return emptyResponse(def, DatasetFetchStatus.MISSING.name(), null, 0);
        }
        DatasetCacheMeta meta = metaOpt.get();
        List<DatasetFilter> safeFilters = filters == null ? List.of() : filters;
        FilteredResult filtered = safeFilters.isEmpty()
                ? null
                : computeFiltered(def, safeFilters);
        List<Map<String, String>> records = includeRecords && limit > 0
                ? cacheRepository.loadRecords(resourceId, offset, limit)
                : List.of();
        Long matchCount = filtered != null ? filtered.matchCount() : null;
        return buildExploreResponse(def, meta, safeFilters, matchCount, offset, limit, includeRecords, records);
    }

    public List<Map<String, String>> parseRecords(LiveDatasetDefinition def, JsonNode payload) {
        List<Map<String, String>> cleaned = new ArrayList<>();
        JsonNode recordsNode = payload.path("records");
        if (!recordsNode.isArray()) {
            return cleaned;
        }
        for (JsonNode record : recordsNode) {
            Map<String, String> row = new LinkedHashMap<>();
            for (Map.Entry<String, String> mapping : def.portalFieldByRecordField().entrySet()) {
                row.put(mapping.getKey(), cellValue(record, mapping.getValue()));
            }
            cleaned.add(row);
        }
        return cleaned;
    }

    public Map<String, Map<String, Integer>> aggregateBatch(
            LiveDatasetDefinition def,
            List<Map<String, String>> records
    ) {
        return switch (def.aggregationMode()) {
            case COUNT_ROWS -> GenericAggregateEngine.aggregate(records, def.allDimensionSpecs());
            case SUM_METRIC -> sumMetricAggregates(def, records);
            case STATE_SNAPSHOT -> Map.of();
        };
    }

    private DatasetDataResponse buildExploreResponse(
            LiveDatasetDefinition def,
            DatasetCacheMeta meta,
            List<DatasetFilter> filters,
            Long filteredCount,
            int offset,
            int limit,
            boolean includeRecords
    ) {
        return buildExploreResponse(def, meta, filters, filteredCount, offset, limit, includeRecords, List.of());
    }

    private DatasetDataResponse buildExploreResponse(
            LiveDatasetDefinition def,
            DatasetCacheMeta meta,
            List<DatasetFilter> filters,
            Long filteredCount,
            int offset,
            int limit,
            boolean includeRecords,
            List<Map<String, String>> recordsOverride
    ) {
        List<DatasetFilter> safeFilters = filters == null ? List.of() : filters;
        List<Map<String, String>> matching = new ArrayList<>();
        cacheRepository.forEachRecord(meta.resourceId(), row -> {
            if (matchesFilters(def, row, safeFilters)) {
                matching.add(row);
            }
        });

        List<StateMetric> stateMetrics = buildStateMetrics(def, matching, safeFilters);
        List<DimensionGroup> dimensionGroups = buildDimensionGroups(def, matching, meta, filteredCount, safeFilters);
        StateTimeSeries timeSeries = StateTimeSeriesBuilder.buildFromDefinition(
                matching,
                def,
                safeFilters
        );

        long cachedTotal = meta.cachedRecords();
        long displayCount = filteredCount != null ? filteredCount : cachedTotal;
        boolean filtered = filteredCount != null;

        List<Map<String, String>> records = recordsOverride;
        if (includeRecords && records.isEmpty() && limit > 0) {
            records = cacheRepository.loadRecords(meta.resourceId(), offset, limit);
        }

        return new DatasetDataResponse(
                meta.resourceId(),
                meta.title(),
                meta.description(),
                meta.portalTotal(),
                records.size(),
                offset,
                limit,
                stateMetrics,
                dimensionGroups,
                records,
                meta.status().name(),
                formatInstant(meta.fetchedAt()),
                displayCount,
                timeSeries
        );
    }

    private List<StateMetric> buildStateMetrics(
            LiveDatasetDefinition def,
            List<Map<String, String>> rows,
            List<DatasetFilter> filters
    ) {
        String metricField = resolveEffectiveMetricField(def, filters);
        Map<String, Double> byState = new LinkedHashMap<>();
        for (Map<String, String> row : rows) {
            String state = resolveState(def, row);
            if (state == null) {
                continue;
            }
            double contribution = switch (def.aggregationMode()) {
                case COUNT_ROWS -> 1.0;
                case STATE_SNAPSHOT, SUM_METRIC -> parseDouble(row.get(metricField));
            };
            if (contribution <= 0) {
                continue;
            }
            byState.merge(state, contribution, Double::sum);
        }
        return byState.entrySet().stream()
                .sorted(Comparator.comparingDouble(Map.Entry<String, Double>::getValue).reversed())
                .map(e -> new StateMetric(
                        e.getKey(),
                        IndianStateNormalizer.stateCodeFor(e.getKey()),
                        e.getValue(),
                        def.metricUnit(),
                        "cached"
                ))
                .toList();
    }

    private List<DimensionGroup> buildDimensionGroups(
            LiveDatasetDefinition def,
            List<Map<String, String>> rows,
            DatasetCacheMeta meta,
            Long filteredCount,
            List<DatasetFilter> filters
    ) {
        List<DimensionGroup> groups = new ArrayList<>();
        long cachedTotal = meta.cachedRecords();
        long displayCount = filteredCount != null ? filteredCount : cachedTotal;
        groups.add(summaryGroup(def, meta, displayCount, rows, filteredCount != null));

        if (def.aggregationMode() == LiveDatasetAggregationMode.COUNT_ROWS) {
            Map<String, Map<String, Integer>> aggregates = new LinkedHashMap<>();
            for (Map<String, String> row : rows) {
                GenericAggregateEngine.mergeRow(row, def.allDimensionSpecs(), aggregates);
            }
            groups.addAll(GenericAggregateEngine.buildDimensionGroups(aggregates, def.allDimensionSpecs()));
        } else if (def.aggregationMode() == LiveDatasetAggregationMode.SUM_METRIC) {
            Map<String, Map<String, Integer>> aggregates = sumMetricAggregates(def, rows);
            groups.addAll(GenericAggregateEngine.buildDimensionGroups(aggregates, def.allDimensionSpecs()));
        }

        for (UnpivotDimensionSpec unpivot : def.unpivotDimensions()) {
            Optional<DatasetFilter> active = filters.stream()
                    .filter(f -> f != null && unpivot.id().equals(f.dimension()))
                    .findFirst();
            if (active.isPresent()) {
                groups.add(buildUnpivotGroupFiltered(unpivot, rows, active.get()));
            } else {
                groups.add(buildUnpivotGroup(unpivot, rows));
            }
        }
        return groups;
    }

    private DimensionGroup buildUnpivotGroupFiltered(
            UnpivotDimensionSpec spec,
            List<Map<String, String>> rows,
            DatasetFilter filter
    ) {
        for (UnpivotColumn column : spec.columns()) {
            if (!column.label().equalsIgnoreCase(filter.value().trim())) {
                continue;
            }
            double total = 0;
            for (Map<String, String> row : rows) {
                total += parseDouble(row.get(column.recordField()));
            }
            long rounded = Math.round(total);
            DimensionItem item = new DimensionItem(
                    slugify(column.label()),
                    column.label(),
                    rounded + " " + spec.countUnit(),
                    String.valueOf(rounded)
            );
            return new DimensionGroup(
                    spec.id(),
                    spec.label(),
                    List.of(item),
                    spec.role(),
                    1,
                    null,
                    true
            );
        }
        return buildUnpivotGroup(spec, rows);
    }

    private String resolveEffectiveMetricField(LiveDatasetDefinition def, List<DatasetFilter> filters) {
        if (filters == null) {
            return def.metricRecordField();
        }
        for (DatasetFilter filter : filters) {
            if (filter == null || filter.dimension() == null || filter.value() == null) {
                continue;
            }
            for (UnpivotDimensionSpec unpivot : def.unpivotDimensions()) {
                if (!unpivot.id().equals(filter.dimension())) {
                    continue;
                }
                for (UnpivotColumn column : unpivot.columns()) {
                    if (column.label().equalsIgnoreCase(filter.value().trim())) {
                        return column.recordField();
                    }
                }
            }
        }
        return def.metricRecordField();
    }

    private DimensionGroup buildUnpivotGroup(UnpivotDimensionSpec spec, List<Map<String, String>> rows) {
        List<DimensionItem> items = new ArrayList<>();
        for (UnpivotColumn column : spec.columns()) {
            double total = 0;
            for (Map<String, String> row : rows) {
                total += parseDouble(row.get(column.recordField()));
            }
            long rounded = Math.round(total);
            items.add(new DimensionItem(
                    slugify(column.label()),
                    column.label(),
                    rounded + " " + spec.countUnit(),
                    String.valueOf(rounded)
            ));
        }
        return new DimensionGroup(
                spec.id(),
                spec.label(),
                items,
                spec.role(),
                items.size(),
                null,
                true
        );
    }

    private Map<String, Map<String, Integer>> sumMetricAggregates(
            LiveDatasetDefinition def,
            List<Map<String, String>> records
    ) {
        Map<String, Map<String, Integer>> result = new LinkedHashMap<>();
        for (DatasetDimensionSpec spec : def.allDimensionSpecs()) {
            if (spec.sourceField() != null) {
                result.put(spec.resolvedAggregateKey(), new LinkedHashMap<>());
            }
        }
        for (Map<String, String> row : records) {
            double metric = parseDouble(row.get(def.metricRecordField()));
            if (metric <= 0) {
                continue;
            }
            int amount = (int) Math.round(metric);
            for (DatasetDimensionSpec spec : def.allDimensionSpecs()) {
                if (spec.sourceField() == null) {
                    continue;
                }
                String value = applyNormalizer(spec, row.get(spec.sourceField()));
                if (value == null) {
                    continue;
                }
                result.get(spec.resolvedAggregateKey()).merge(value, amount, Integer::sum);
            }
        }
        return result;
    }

    private FilteredResult computeFiltered(LiveDatasetDefinition def, List<DatasetFilter> filters) {
        List<Map<String, String>> matching = new ArrayList<>();
        cacheRepository.forEachRecord(def.resourceId(), row -> {
            if (matchesFilters(def, row, filters)) {
                matching.add(row);
            }
        });
        return new FilteredResult(matching, matching.size());
    }

    private boolean matchesFilters(LiveDatasetDefinition def, Map<String, String> row, List<DatasetFilter> filters) {
        if (filters == null || filters.isEmpty()) {
            return true;
        }
        for (DatasetFilter filter : filters) {
            if (filter == null || filter.dimension() == null || filter.value() == null) {
                continue;
            }
            if ("state".equalsIgnoreCase(filter.dimension())) {
                String state = resolveState(def, row);
                if (state == null || !state.equalsIgnoreCase(filter.value().trim())) {
                    return false;
                }
                continue;
            }
            if (isUnpivotDimension(def, filter.dimension())) {
                continue;
            }
            if (!GenericAggregateEngine.matchesAllFilters(row, List.of(filter), def.allDimensionSpecs())) {
                return false;
            }
        }
        return true;
    }

    private boolean isUnpivotDimension(LiveDatasetDefinition def, String dimensionId) {
        if (dimensionId == null) {
            return false;
        }
        return def.unpivotDimensions().stream().anyMatch(spec -> dimensionId.equals(spec.id()));
    }

    private DimensionGroup summaryGroup(
            LiveDatasetDefinition def,
            DatasetCacheMeta meta,
            long displayCount,
            List<Map<String, String>> rows,
            boolean filtered
    ) {
        List<DimensionItem> items = new ArrayList<>();
        items.add(new DimensionItem("total-records", "Total records (portal)", String.valueOf(meta.portalTotal()), "count"));
        items.add(new DimensionItem(
                "cached-records",
                filtered ? "Records matching filters" : "Records cached locally",
                String.valueOf(displayCount),
                "count"
        ));
        long states = rows.stream().map(row -> resolveState(def, row)).filter(s -> s != null).distinct().count();
        items.add(new DimensionItem("states", "States / UTs represented", String.valueOf(states), "count"));
        if (meta.fetchedAt() != null) {
            items.add(new DimensionItem("cached-at", "Last synced", meta.fetchedAt().toString(), "timestamp"));
        }
        return new DimensionGroup("summary", "Dataset summary", items, DimensionRole.SUMMARY, items.size(), null, false);
    }

    private String resolveState(LiveDatasetDefinition def, Map<String, String> row) {
        return IndianStateNormalizer.normalize(row.get(def.stateRecordField()));
    }

    private static String applyNormalizer(DatasetDimensionSpec spec, String raw) {
        if (spec.normalizer() == null) {
            return raw == null || raw.isBlank() ? null : raw.trim();
        }
        return spec.normalizer().apply(raw);
    }

    private static String cellValue(JsonNode record, String field) {
        JsonNode value = record.get(field);
        if (value == null || value.isNull()) {
            return "";
        }
        if (value.isNumber()) {
            return value.asText("");
        }
        return value.asText("").trim();
    }

    private static double parseDouble(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0;
        }
        try {
            return Double.parseDouble(raw.replace(",", "").trim());
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private static String slugify(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private DatasetDataResponse emptyResponse(
            LiveDatasetDefinition def,
            String syncStatus,
            Instant cachedAt,
            long recordsCached
    ) {
        return new DatasetDataResponse(
                def.resourceId(),
                def.title(),
                def.description(),
                0,
                0,
                0,
                0,
                List.of(),
                List.of(),
                List.of(),
                syncStatus,
                formatInstant(cachedAt),
                recordsCached,
                null
        );
    }

    private static String formatInstant(Instant instant) {
        return instant != null ? instant.toString() : null;
    }

    private record FilteredResult(List<Map<String, String>> rows, long matchCount) {}
}
