package org.example.dto;

import java.util.List;

/**
 * Multi-year metrics per state for the explorer line-chart widget.
 * {@link #years()} is the shared x-axis; each line's {@link StateTimeSeriesLine#values()}
 * has the same length as {@link #years()}.
 */
public record StateTimeSeries(List<Integer> years, List<StateTimeSeriesLine> lines, String unit) {

    public static final int MIN_YEARS_FOR_CHART = 5;

    public boolean chartable() {
        return years != null && years.size() > 4 && lines != null && !lines.isEmpty();
    }
}
