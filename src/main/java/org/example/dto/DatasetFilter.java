package org.example.dto;

/**
 * Cross-widget filter: dimension id (e.g. {@code state}, {@code company-status}) and display value.
 */
public record DatasetFilter(String dimension, String value) {

    public static DatasetFilter parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        int sep = raw.indexOf(':');
        if (sep <= 0 || sep >= raw.length() - 1) {
            return null;
        }
        String dimension = raw.substring(0, sep).trim();
        String value = raw.substring(sep + 1).trim();
        if (dimension.isEmpty() || value.isEmpty()) {
            return null;
        }
        return new DatasetFilter(dimension, value);
    }
}
