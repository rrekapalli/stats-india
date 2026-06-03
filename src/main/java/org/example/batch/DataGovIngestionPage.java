package org.example.batch;

import java.util.List;
import java.util.Map;

/**
 * One page of records fetched from data.gov.in: a slice starting at {@code startIndex}
 * with {@code records.size()} rows. Used as the chunk item in the ingestion job
 * (chunk size = 1 page).
 */
public record DataGovIngestionPage(
        int startIndex,
        List<Map<String, String>> records
) {

    public int size() {
        return records.size();
    }
}
