package org.example.dto;

import java.util.List;

/** One state's values aligned with {@link StateTimeSeries#years()}. */
public record StateTimeSeriesLine(String state, String stateCode, List<Double> values) {}
