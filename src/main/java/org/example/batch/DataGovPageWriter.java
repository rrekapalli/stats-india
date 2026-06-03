package org.example.batch;

import org.example.cache.DatasetCacheRepository;
import org.example.service.datagov.CachedLiveDatasetService;
import org.example.service.datagov.LiveDatasetDefinition;
import org.example.service.datagov.LiveDatasetRegistry;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;

import java.util.List;
import java.util.Map;

/**
 * Persists a batch of fetched data.gov.in pages into the local cache: inserts records,
 * merges aggregates, and updates {@code dataset_meta.cached_records} so the explorer
 * progress UI reflects ingestion in real time.
 */
public class DataGovPageWriter implements ItemWriter<DataGovIngestionPage> {

    private final DatasetCacheRepository cacheRepository;
    private final CachedLiveDatasetService liveDatasetService;
    private final LiveDatasetRegistry registry;
    private final String resourceId;

    public DataGovPageWriter(
            DatasetCacheRepository cacheRepository,
            CachedLiveDatasetService liveDatasetService,
            LiveDatasetRegistry registry,
            String resourceId
    ) {
        this.cacheRepository = cacheRepository;
        this.liveDatasetService = liveDatasetService;
        this.registry = registry;
        this.resourceId = resourceId;
    }

    @Override
    public void write(Chunk<? extends DataGovIngestionPage> chunk) {
        LiveDatasetDefinition def = registry.require(resourceId);
        long lastOffset = -1;
        long totalWritten = 0;
        for (DataGovIngestionPage page : chunk.getItems()) {
            cacheRepository.insertRecords(resourceId, page.startIndex(), page.records());
            Map<String, Map<String, Integer>> aggregates =
                    liveDatasetService.aggregateBatch(def, page.records());
            if (!aggregates.isEmpty()) {
                cacheRepository.mergeAggregates(resourceId, aggregates);
            }
            lastOffset = (long) page.startIndex() + page.size();
            totalWritten += page.size();
        }
        if (lastOffset >= 0) {
            cacheRepository.updateProgress(resourceId, lastOffset);
        }
        // No need to return; chunk.getItems() count is what Spring Batch records.
        @SuppressWarnings("unused")
        long ignored = totalWritten;
    }
}
