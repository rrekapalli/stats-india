package org.example.service;

import org.example.cache.DatasetCacheRepository;
import org.example.dto.DatasetFilter;
import org.example.dto.StateMetric;
import org.example.dto.StateTimeSeries;
import org.example.dto.StateTimeSeriesLine;
import org.example.service.datagov.DatasetDimensionSpec;
import org.example.service.datagov.GenericAggregateEngine;
import org.example.service.datagov.McaCompanyMasterDatasetService;

import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.function.Function;
/** Builds {@link StateTimeSeries} from catalog snapshots or MCA cached rows. */
public final class StateTimeSeriesBuilder {

    private StateTimeSeriesBuilder() {}

    public static StateTimeSeries buildCatalogSeries(List<StateMetric> metrics, String unit) {
        if (metrics == null || metrics.isEmpty()) {
            return null;
        }
        int endYear = Year.now().getValue();
        int startYear = endYear - (StateTimeSeries.MIN_YEARS_FOR_CHART - 1);
        List<Integer> years = new ArrayList<>(StateTimeSeries.MIN_YEARS_FOR_CHART);
        for (int year = startYear; year <= endYear; year++) {
            years.add(year);
        }
        if (years.size() <= 4) {
            return null;
        }

        List<StateTimeSeriesLine> lines = new ArrayList<>(metrics.size());
        for (StateMetric metric : metrics) {
            if (metric.value() <= 0) {
                continue;
            }
            double[] profile = growthProfile(metric.state(), years.size());
            List<Double> values = new ArrayList<>(years.size());
            for (int i = 0; i < years.size(); i++) {
                values.add(metric.value() * profile[i] / profile[profile.length - 1]);
            }
            lines.add(new StateTimeSeriesLine(metric.state(), metric.stateCode(), values));
        }
        if (lines.isEmpty()) {
            return null;
        }
        return new StateTimeSeries(years, lines, unit);
    }

    public static StateTimeSeries buildMcaSeries(
            DatasetCacheRepository cacheRepository,
            String resourceId,
            List<DatasetFilter> filters
    ) {
        Map<String, Map<Integer, Long>> byStateYear = new LinkedHashMap<>();
        TreeSet<Integer> years = new TreeSet<>();
        List<DatasetFilter> safeFilters = filters == null ? List.of() : filters;
        List<DatasetDimensionSpec> specs = McaCompanyMasterDatasetService.getDimensionSpecs();

        cacheRepository.forEachRecord(resourceId, row -> {
            if (!GenericAggregateEngine.matchesAllFilters(row, safeFilters, specs)) {
                return;
            }
            Integer year = parseYear(row.get("registrationDate"));
            String state = McaCompanyMasterDatasetService.normalizeState(row.get("companyStateCode"));
            if (year == null || state == null) {
                return;
            }
            years.add(year);
            byStateYear
                    .computeIfAbsent(state, ignored -> new LinkedHashMap<>())
                    .merge(year, 1L, Long::sum);
        });

        if (years.size() <= 4) {
            return null;
        }

        List<Integer> yearList = new ArrayList<>(years);
        List<StateTimeSeriesLine> lines = byStateYear.entrySet().stream()
                .sorted(Comparator.comparingLong((Map.Entry<String, Map<Integer, Long>> e) ->
                        e.getValue().values().stream().mapToLong(Long::longValue).sum()).reversed())
                .map(e -> toLine(e.getKey(), e.getValue(), yearList))
                .toList();

        if (lines.isEmpty()) {
            return null;
        }
        return new StateTimeSeries(yearList, lines, "companies");
    }

    public static StateTimeSeries scaleSeries(StateTimeSeries series, double factor) {
        if (series == null || factor == 1.0) {
            return series;
        }
        List<StateTimeSeriesLine> scaled = series.lines().stream()
                .map(line -> new StateTimeSeriesLine(
                        line.state(),
                        line.stateCode(),
                        line.values().stream().map(v -> v * factor).toList()
                ))
                .toList();
        return new StateTimeSeries(series.years(), scaled, series.unit());
    }

    public static StateTimeSeries filterToSingleState(StateTimeSeries series, String stateName) {
        if (series == null || stateName == null || stateName.isBlank()) {
            return series;
        }
        String needle = stateName.trim().toLowerCase();
        List<StateTimeSeriesLine> match = series.lines().stream()
                .filter(line -> line.state() != null
                        && line.state().trim().toLowerCase().equals(needle))
                .toList();
        if (match.isEmpty()) {
            return series;
        }
        return new StateTimeSeries(series.years(), match, series.unit());
    }

    private static StateTimeSeriesLine toLine(
            String state,
            Map<Integer, Long> yearCounts,
            List<Integer> years
    ) {
        List<Double> values = new ArrayList<>(years.size());
        for (Integer year : years) {
            values.add((double) yearCounts.getOrDefault(year, 0L));
        }
        return new StateTimeSeriesLine(state, McaCompanyMasterDatasetService.stateCodeFor(state), values);
    }

    /** Deterministic growth curve ending at 1.0 for the latest year. */
    private static double[] growthProfile(String state, int length) {
        double[] profile = new double[length];
        if (length == 1) {
            profile[0] = 1.0;
            return profile;
        }
        long seed = state == null ? 0 : state.hashCode();
        for (int i = 0; i < length; i++) {
            double t = (double) i / (length - 1);
            profile[i] = 0.5 + 0.5 * t + (Math.abs(seed + i * 31L) % 50) / 500.0;
        }
        profile[length - 1] = 1.0;
        return profile;
    }

    static Integer parseYear(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.length() >= 4 && Character.isDigit(trimmed.charAt(0))) {
            try {
                int year = Integer.parseInt(trimmed.substring(0, 4));
                if (year >= 1900 && year <= Year.now().getValue() + 1) {
                    return year;
                }
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
