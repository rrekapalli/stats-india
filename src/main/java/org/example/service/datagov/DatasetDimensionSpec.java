package org.example.service.datagov;

import org.example.dto.DimensionRole;

import java.util.function.Function;

/**
 * Declarative specification of one dimension on a live dataset. The {@link GenericAggregateEngine}
 * uses {@link #sourceField} + {@link #normalizer} to compute per-value counts from raw records,
 * and the explore response uses {@link #id}, {@link #label}, {@link #role} for the API surface.
 *
 * @param id             dimension id surfaced to the UI (e.g. {@code company-status})
 * @param label          human label (e.g. {@code Company status})
 * @param role           semantic role driving chart-type selection
 * @param sourceField    record JSON key (camelCase, e.g. {@code companyStatus})
 * @param aggregateKey   SQLite cache key — keeps existing aggregates readable when {@code id} changes
 * @param normalizer     converts raw field value to display value, or null to drop the row
 * @param countUnit      noun shown in item descriptions (e.g. {@code companies})
 * @param displayLimit   max top-N items returned, 0 for no limit
 */
public record DatasetDimensionSpec(
        String id,
        String label,
        DimensionRole role,
        String sourceField,
        String aggregateKey,
        Function<String, String> normalizer,
        String countUnit,
        int displayLimit
) {

    public String resolvedAggregateKey() {
        return aggregateKey == null || aggregateKey.isBlank() ? id : aggregateKey;
    }
}
