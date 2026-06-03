package org.example.batch;

import com.fasterxml.jackson.databind.JsonNode;
import org.example.cache.DatasetCacheProperties;
import org.example.client.DataGovInClient;
import org.example.service.datagov.LiveDatasetDefinition;
import org.example.service.datagov.LiveDatasetRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.annotation.BeforeStep;
import org.springframework.batch.item.ItemReader;

import java.util.List;
import java.util.Map;

/**
 * Reads one page of data.gov.in records per {@link #read()} call. Resumes from
 * {@code dataset_meta.cached_records} (passed in via job execution context), and
 * stops when the offset reaches {@code portalTotal}.
 *
 * <p>Constructed per-step via {@link DataGovFetchJobConfig} (StepScope), so each
 * job execution gets a fresh reader bound to its {@code resourceId} parameter.
 */
public class DataGovPageReader implements ItemReader<DataGovIngestionPage> {

    private static final Logger log = LoggerFactory.getLogger(DataGovPageReader.class);

    private final DataGovInClient dataGovInClient;
    private final LiveDatasetRegistry registry;
    private final DatasetCacheProperties cacheProperties;
    private final org.example.service.datagov.CachedLiveDatasetService liveDatasetService;
    private final String resourceId;

    private int offset;
    private long portalTotal;
    private boolean firstRead = true;

    public DataGovPageReader(
            DataGovInClient dataGovInClient,
            LiveDatasetRegistry registry,
            DatasetCacheProperties cacheProperties,
            org.example.service.datagov.CachedLiveDatasetService liveDatasetService,
            String resourceId
    ) {
        this.dataGovInClient = dataGovInClient;
        this.registry = registry;
        this.cacheProperties = cacheProperties;
        this.liveDatasetService = liveDatasetService;
        this.resourceId = resourceId;
    }

    @BeforeStep
    public void onBeforeStep(StepExecution stepExecution) {
        Object total = stepExecution.getJobExecution().getExecutionContext().get(IngestionContextKeys.PORTAL_TOTAL);
        Object start = stepExecution.getJobExecution().getExecutionContext().get(IngestionContextKeys.START_OFFSET);
        this.portalTotal = total instanceof Number n ? n.longValue() : 0L;
        this.offset = start instanceof Number n ? n.intValue() : 0;
    }

    @Override
    public DataGovIngestionPage read() {
        if (portalTotal <= 0 || offset >= portalTotal) {
            return null;
        }

        if (!firstRead) {
            sleepBetweenRequests();
        }
        firstRead = false;

        int pageSize = cacheProperties.getPageSize();
        JsonNode payload = fetchPageWithRetry(offset, pageSize);
        int count = parseInt(payload, "count");
        if (count <= 0) {
            log.info("Empty page for {} at offset {}; ending stream", resourceId, offset);
            return null;
        }

        LiveDatasetDefinition def = registry.require(resourceId);
        List<Map<String, String>> records = liveDatasetService.parseRecords(def, payload);
        DataGovIngestionPage page = new DataGovIngestionPage(offset, records);
        offset += count;
        return page;
    }

    /**
     * data.gov.in occasionally returns truncated JSON or transient 5xx errors on
     * large datasets; retry a few times with linear backoff before failing the step.
     */
    private JsonNode fetchPageWithRetry(int currentOffset, int pageSize) {
        int maxAttempts = 5;
        long backoffMs = 2_000L;
        RuntimeException lastError = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return dataGovInClient.fetchResource(resourceId, currentOffset, pageSize);
            } catch (RuntimeException ex) {
                lastError = ex;
                log.warn(
                        "Page fetch failed for {} at offset {} (attempt {}/{}): {}",
                        resourceId, currentOffset, attempt, maxAttempts, ex.getMessage()
                );
                if (attempt == maxAttempts) {
                    break;
                }
                try {
                    Thread.sleep(backoffMs * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Ingestion interrupted", ie);
                }
            }
        }
        throw lastError != null
                ? lastError
                : new IllegalStateException("Failed to fetch page for " + resourceId + " at offset " + currentOffset);
    }

    private void sleepBetweenRequests() {
        long delay = cacheProperties.getRequestDelayMs();
        if (delay <= 0) {
            return;
        }
        try {
            Thread.sleep(delay);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Ingestion interrupted", ex);
        }
    }

    private static int parseInt(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return 0;
        }
        if (value.isNumber()) {
            return value.asInt();
        }
        try {
            return Integer.parseInt(value.asText("0"));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
