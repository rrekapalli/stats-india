package org.example.cache;

import com.fasterxml.jackson.databind.JsonNode;
import org.example.client.DataGovInClient;
import org.example.service.datagov.DatasetDimensionSpec;
import org.example.service.datagov.McaCompanyMasterDatasetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class DatasetSyncService {

    private static final Logger log = LoggerFactory.getLogger(DatasetSyncService.class);

    private final DataGovInClient dataGovInClient;
    private final DatasetCacheRepository cacheRepository;
    private final DatasetCacheProperties cacheProperties;
    private final McaCompanyMasterDatasetService mcaCompanyMasterDatasetService;
    private final AtomicBoolean mcaSyncRunning = new AtomicBoolean(false);

    public DatasetSyncService(
            DataGovInClient dataGovInClient,
            DatasetCacheRepository cacheRepository,
            DatasetCacheProperties cacheProperties,
            McaCompanyMasterDatasetService mcaCompanyMasterDatasetService
    ) {
        this.dataGovInClient = dataGovInClient;
        this.cacheRepository = cacheRepository;
        this.cacheProperties = cacheProperties;
        this.mcaCompanyMasterDatasetService = mcaCompanyMasterDatasetService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        if (!cacheProperties.isSyncOnStartup()) {
            return;
        }
        refreshIfNeeded(McaCompanyMasterDatasetService.RESOURCE_ID);
    }

    @Scheduled(cron = "${stats-india.cache.refresh-cron:0 0 3 * * SUN}")
    public void scheduledRefresh() {
        refreshIfNeeded(McaCompanyMasterDatasetService.RESOURCE_ID);
    }

    /**
     * Starts background ingestion only when the portal has more records than SQLite,
     * or when no cache exists. Does not wipe partial progress — resumes from last offset.
     */
    public void refreshIfNeeded(String resourceId) {
        if (!McaCompanyMasterDatasetService.RESOURCE_ID.equals(resourceId)) {
            return;
        }
        Optional<DatasetCacheMeta> meta = cacheRepository.findMeta(resourceId);
        if (meta.isPresent()
                && meta.get().status() == DatasetFetchStatus.SYNCING
                && !isAbandonedSync(meta.get())) {
            return;
        }
        if (!needsIngestion(resourceId)) {
            return;
        }
        startSyncAsync(resourceId);
    }

    private boolean needsIngestion(String resourceId) {
        long portalTotal = fetchPortalTotal(resourceId);
        if (portalTotal <= 0) {
            return false;
        }
        Optional<DatasetCacheMeta> meta = cacheRepository.findMeta(resourceId);
        if (meta.isEmpty()) {
            return true;
        }
        long cached = cacheRepository.countRecords(resourceId);
        if (cached < portalTotal) {
            return true;
        }
        if (meta.get().status() != DatasetFetchStatus.READY) {
            cacheRepository.markReady(resourceId, cached);
        }
        return false;
    }

    private boolean isAbandonedSync(DatasetCacheMeta meta) {
        if (meta.syncStartedAt() == null) {
            return true;
        }
        return meta.syncStartedAt().isBefore(java.time.Instant.now().minusSeconds(6 * 3600L));
    }

    public void startSyncAsync(String resourceId) {
        if (!McaCompanyMasterDatasetService.RESOURCE_ID.equals(resourceId)) {
            throw new IllegalArgumentException("Sync not supported for dataset: " + resourceId);
        }
        if (!mcaSyncRunning.compareAndSet(false, true)) {
            log.info("MCA dataset sync already running");
            return;
        }
        CompletableFuture.runAsync(() -> {
            try {
                syncMcaCompanyMaster();
            } finally {
                mcaSyncRunning.set(false);
            }
        });
    }

    public Optional<DatasetCacheMeta> getMeta(String resourceId) {
        return cacheRepository.findMeta(resourceId);
    }

    private void syncMcaCompanyMaster() {
        String resourceId = McaCompanyMasterDatasetService.RESOURCE_ID;
        int pageSize = cacheProperties.getPageSize();
        log.info("MCA dataset sync starting (page size {})", pageSize);

        try {
            JsonNode probe = dataGovInClient.fetchResource(resourceId, 0, 1);
            long portalTotal = parseLong(probe, "total");
            String title = textOrDefault(probe, "title", "MCA Company Master Data");
            String description = textOrDefault(probe, "desc", title);

            if (portalTotal <= 0) {
                log.warn("Portal returned zero total records; skipping sync");
                return;
            }

            Optional<DatasetCacheMeta> existing = cacheRepository.findMeta(resourceId);
            long cached = cacheRepository.countRecords(resourceId);

            if (cached >= portalTotal) {
                cacheRepository.markReady(resourceId, cached);
                log.info("MCA cache already complete: {}/{} records", cached, portalTotal);
                return;
            }

            int offset;
            if (cached > 0) {
                cacheRepository.resumeSync(resourceId, title, description, portalTotal);
                offset = (int) cached;
                log.info("Resuming MCA sync from offset {} ({}/{} portal records)", offset, cached, portalTotal);
            } else {
                cacheRepository.beginSync(resourceId, title, description, portalTotal);
                offset = 0;
                log.info("Starting fresh MCA sync (portal total {})", portalTotal);
            }

            persistDimensions(resourceId, McaCompanyMasterDatasetService.getDimensionSpecs());

            ingestFromOffset(resourceId, offset, portalTotal, pageSize);

            long finalCached = cacheRepository.countRecords(resourceId);
            cacheRepository.markReady(resourceId, finalCached);
            log.info("MCA dataset sync complete: {} records cached (portal {})", finalCached, portalTotal);
        } catch (Exception ex) {
            log.error("MCA dataset sync failed", ex);
            cacheRepository.markError(resourceId, ex.getMessage());
        }
    }

    private void ingestFromOffset(String resourceId, int offset, long portalTotal, int pageSize) {
        if (offset == 0) {
            JsonNode firstPage = dataGovInClient.fetchResource(resourceId, 0, pageSize);
            int count = parseInt(firstPage, "count");
            if (count <= 0) {
                return;
            }
            ingestPage(resourceId, firstPage, 0);
            offset = count;
            cacheRepository.updateProgress(resourceId, offset);
            log.info("MCA sync progress: {}/{} records", offset, portalTotal);
        }

        while (offset < portalTotal) {
            sleepBetweenRequests();
            JsonNode page = dataGovInClient.fetchResource(resourceId, offset, pageSize);
            int count = parseInt(page, "count");
            if (count <= 0) {
                break;
            }
            ingestPage(resourceId, page, offset);
            offset += count;
            cacheRepository.updateProgress(resourceId, offset);
            if (offset % 100_000 == 0 || offset >= portalTotal) {
                log.info("MCA sync progress: {}/{} records", offset, portalTotal);
            }
        }
    }

    private long fetchPortalTotal(String resourceId) {
        JsonNode probe = dataGovInClient.fetchResource(resourceId, 0, 1);
        return parseLong(probe, "total");
    }

    private void ingestPage(String resourceId, JsonNode payload, int startIndex) {
        List<Map<String, String>> records = mcaCompanyMasterDatasetService.parseRecords(payload);
        cacheRepository.insertRecords(resourceId, startIndex, records);
        cacheRepository.mergeAggregates(resourceId, mcaCompanyMasterDatasetService.aggregateBatch(records));
    }

    private void persistDimensions(String resourceId, List<DatasetDimensionSpec> specs) {
        List<DatasetDimensionRow> rows = new ArrayList<>(specs.size());
        for (int i = 0; i < specs.size(); i++) {
            DatasetDimensionSpec spec = specs.get(i);
            rows.add(new DatasetDimensionRow(
                    spec.id(),
                    spec.label(),
                    spec.role().name(),
                    spec.sourceField(),
                    spec.resolvedAggregateKey(),
                    spec.countUnit(),
                    spec.displayLimit(),
                    i,
                    spec.sourceField() != null
            ));
        }
        cacheRepository.replaceDimensions(resourceId, rows);
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
            throw new IllegalStateException("Sync interrupted", ex);
        }
    }

    private static long parseLong(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return 0L;
        }
        if (value.isNumber()) {
            return value.asLong();
        }
        try {
            return Long.parseLong(value.asText("0"));
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private static int parseInt(JsonNode node, String field) {
        return (int) parseLong(node, field);
    }

    private static String textOrDefault(JsonNode node, String field, String fallback) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return fallback;
        }
        String text = value.asText("").trim();
        return text.isEmpty() ? fallback : text;
    }
}
