package org.example.service;

import org.example.dto.DatasetFilter;
import org.example.dto.StateTimeSeries;
import org.example.dto.StateTimeSeriesLine;
import org.example.service.datagov.DatasetDimensionSpec;
import org.example.service.datagov.GenericAggregateEngine;
import org.example.service.datagov.IndianStateNormalizer;
import org.example.service.datagov.LiveDatasetAggregationMode;
import org.example.service.datagov.LiveDatasetDefinition;

import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/** Builds {@link StateTimeSeries} from cached live dataset rows. */
public final class StateTimeSeriesBuilder {

    private StateTimeSeriesBuilder() {}

    public static StateTimeSeries buildFromDefinition(
            List<Map<String, String>> rows,
            LiveDatasetDefinition def,
            List<DatasetFilter> filters
    ) {
        if (def.yearRecordField() == null || def.yearRecordField().isBlank()) {
            return null;
        }
        return switch (def.aggregationMode()) {
            case COUNT_ROWS -> buildCountSeries(rows, def, filters);
            case SUM_METRIC -> buildSumSeries(rows, def, filters);
            case STATE_SNAPSHOT -> null;
        };
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

    private static StateTimeSeries buildCountSeries(
            List<Map<String, String>> rows,
            LiveDatasetDefinition def,
            List<DatasetFilter> filters
    ) {
        Map<String, Map<Integer, Long>> byStateYear = new LinkedHashMap<>();
        TreeSet<Integer> years = new TreeSet<>();
        List<DatasetFilter> safeFilters = filters == null ? List.of() : filters;
        List<DatasetDimensionSpec> specs = def.allDimensionSpecs();

        for (Map<String, String> row : rows) {
            if (!GenericAggregateEngine.matchesAllFilters(row, safeFilters, specs)) {
                continue;
            }
            Integer year = parseYear(row.get(def.yearRecordField()));
            String state = IndianStateNormalizer.normalize(row.get(def.stateRecordField()));
            if (year == null || state == null) {
                continue;
            }
            years.add(year);
            byStateYear.computeIfAbsent(state, ignored -> new LinkedHashMap<>())
                    .merge(year, 1L, Long::sum);
        }
        return toSeries(byStateYear, years, def.metricUnit());
    }

    private static StateTimeSeries buildSumSeries(
            List<Map<String, String>> rows,
            LiveDatasetDefinition def,
            List<DatasetFilter> filters
    ) {
        Map<String, Map<Integer, Double>> byStateYear = new LinkedHashMap<>();
        TreeSet<Integer> years = new TreeSet<>();
        List<DatasetFilter> safeFilters = filters == null ? List.of() : filters;
        List<DatasetDimensionSpec> specs = def.allDimensionSpecs();

        for (Map<String, String> row : rows) {
            if (!GenericAggregateEngine.matchesAllFilters(row, safeFilters, specs)) {
                continue;
            }
            Integer year = parseYear(row.get(def.yearRecordField()));
            String state = IndianStateNormalizer.normalize(row.get(def.stateRecordField()));
            double metric = parseDouble(row.get(def.metricRecordField()));
            if (year == null || state == null || metric <= 0) {
                continue;
            }
            years.add(year);
            byStateYear.computeIfAbsent(state, ignored -> new LinkedHashMap<>())
                    .merge(year, metric, Double::sum);
        }
        return toSeriesDouble(byStateYear, years, def.metricUnit());
    }

    private static StateTimeSeries toSeries(
            Map<String, Map<Integer, Long>> byStateYear,
            TreeSet<Integer> years,
            String unit
    ) {
        if (years.size() <= 4) {
            return null;
        }
        List<Integer> yearList = new ArrayList<>(years);
        List<StateTimeSeriesLine> lines = byStateYear.entrySet().stream()
                .sorted(Comparator.comparingLong((Map.Entry<String, Map<Integer, Long>> e) ->
                        e.getValue().values().stream().mapToLong(Long::longValue).sum()).reversed())
                .map(e -> {
                    List<Double> values = new ArrayList<>(yearList.size());
                    for (Integer year : yearList) {
                        values.add((double) e.getValue().getOrDefault(year, 0L));
                    }
                    return new StateTimeSeriesLine(
                            e.getKey(),
                            IndianStateNormalizer.stateCodeFor(e.getKey()),
                            values
                    );
                })
                .toList();
        return lines.isEmpty() ? null : new StateTimeSeries(yearList, lines, unit);
    }

    private static StateTimeSeries toSeriesDouble(
            Map<String, Map<Integer, Double>> byStateYear,
            TreeSet<Integer> years,
            String unit
    ) {
        if (years.size() <= 4) {
            return null;
        }
        List<Integer> yearList = new ArrayList<>(years);
        List<StateTimeSeriesLine> lines = byStateYear.entrySet().stream()
                .sorted(Comparator.comparingDouble((Map.Entry<String, Map<Integer, Double>> e) ->
                        e.getValue().values().stream().mapToDouble(Double::doubleValue).sum()).reversed())
                .map(e -> {
                    List<Double> values = new ArrayList<>(yearList.size());
                    for (Integer year : yearList) {
                        values.add(e.getValue().getOrDefault(year, 0.0));
                    }
                    return new StateTimeSeriesLine(
                            e.getKey(),
                            IndianStateNormalizer.stateCodeFor(e.getKey()),
                            values
                    );
                })
                .toList();
        return lines.isEmpty() ? null : new StateTimeSeries(yearList, lines, unit);
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
}
