package org.example.dto;

public record DatasetSummary(
        String id,
        String title,
        String category,
        String source,
        String portalUrl,
        String description,
        String updateFrequency
) {}
