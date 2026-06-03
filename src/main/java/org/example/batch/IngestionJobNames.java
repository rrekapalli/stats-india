package org.example.batch;

import org.example.service.datagov.LiveDatasetDefinition;

import java.util.Locale;

/**
 * Maps a {@link LiveDatasetDefinition} to a stable, human-readable Spring Batch job name
 * (e.g. {@code fetch-dataset-mca-company-master}). The name is recorded in
 * {@code dataset_sync_run.job_name} for the History tab.
 */
public final class IngestionJobNames {

    private IngestionJobNames() {}

    public static String forDefinition(LiveDatasetDefinition def) {
        return "fetch-dataset-" + slugify(def.title());
    }

    private static String slugify(String value) {
        if (value == null) {
            return "unknown";
        }
        String lower = value.toLowerCase(Locale.ROOT);
        StringBuilder out = new StringBuilder(lower.length());
        boolean lastDash = true;
        for (int i = 0; i < lower.length(); i++) {
            char c = lower.charAt(i);
            if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) {
                out.append(c);
                lastDash = false;
            } else if (!lastDash) {
                out.append('-');
                lastDash = true;
            }
        }
        if (lastDash && !out.isEmpty()) {
            out.deleteCharAt(out.length() - 1);
        }
        return out.isEmpty() ? "unknown" : out.toString();
    }
}
