package org.example.cache;

import com.fasterxml.jackson.databind.JsonNode;
import org.example.client.DataGovInClient;
import org.example.service.datagov.McaCompanyMasterDatasetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

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

    public void refreshIfNeeded(String resourceId) {
        if (!McaCompanyMasterDatasetService.RESOURCE_ID.equals(resourceId)) {
            return;
        }
        Optional<DatasetCacheMeta> meta = cacheRepository.findMeta(resourceId);
        if (meta.isPresent()) {
            if (meta.get().status() == DatasetFetchStatus.SYNCING && !isAbandonedSync(meta.get())) {
                return;
            }
            if (meta.get().status() == DatasetFetchStatus.READY
                    && !cacheRepository.isStale(meta.get(), cacheProperties.getRefreshAfterDays())) {
                return;
            }
        }
        startSyncAsync(resourceId);
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
        log.info("Starting full MCA dataset sync (page size {})", pageSize);

        try {
            JsonNode firstPage = dataGovInClient.fetchResource(resourceId, 0, pageSize);
            long portalTotal = parseLong(firstPage, "total");
            String title = textOrDefault(firstPage, "title", "MCA Company Master Data");
            String description = textOrDefault(firstPage, "desc", title);

            cacheRepository.beginSync(resourceId, title, description, portalTotal);
            ingestPage(resourceId, firstPage, 0);

            int offset = parseInt(firstPage, "count");
            cacheRepository.updateProgress(resourceId, offset);

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

            long cached = cacheRepository.countRecords(resourceId);
            cacheRepository.markReady(resourceId, cached);
            log.info("MCA dataset sync complete: {} records cached", cached);
        } catch (Exception ex) {
            log.error("MCA dataset sync failed", ex);
            cacheRepository.markError(resourceId, ex.getMessage());
        }
    }

    private void ingestPage(String resourceId, JsonNode payload, int startIndex) {
        List<Map<String, String>> records = mcaCompanyMasterDatasetService.parseRecords(payload);
        cacheRepository.insertRecords(resourceId, startIndex, records);
        cacheRepository.mergeAggregates(resourceId, mcaCompanyMasterDatasetService.aggregateBatch(records));
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
