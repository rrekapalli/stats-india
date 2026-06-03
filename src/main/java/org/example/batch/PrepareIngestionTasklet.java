package org.example.batch;

import com.fasterxml.jackson.databind.JsonNode;
import org.example.cache.DatasetCacheMeta;
import org.example.cache.DatasetCacheRepository;
import org.example.cache.DatasetDimensionRow;
import org.example.cache.DatasetFetchStatus;
import org.example.client.DataGovInClient;
import org.example.service.datagov.DatasetDimensionSpec;
import org.example.service.datagov.LiveDatasetDefinition;
import org.example.service.datagov.LiveDatasetRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * First step of the dataset ingestion job: probes data.gov.in for the portal total and
 * description, refreshes {@code dataset_meta} (begin or resume sync), persists dimension
 * metadata, and writes {@code portalTotal} / {@code startOffset} into the job execution
 * context for the chunk reader to consume.
 */
public class PrepareIngestionTasklet implements Tasklet {

    private static final Logger log = LoggerFactory.getLogger(PrepareIngestionTasklet.class);

    private final DataGovInClient dataGovInClient;
    private final DatasetCacheRepository cacheRepository;
    private final LiveDatasetRegistry registry;
    private final String resourceId;

    public PrepareIngestionTasklet(
            DataGovInClient dataGovInClient,
            DatasetCacheRepository cacheRepository,
            LiveDatasetRegistry registry,
            String resourceId
    ) {
        this.dataGovInClient = dataGovInClient;
        this.cacheRepository = cacheRepository;
        this.registry = registry;
        this.resourceId = resourceId;
    }

    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) {
        LiveDatasetDefinition def = registry.require(resourceId);
        JsonNode probe = dataGovInClient.fetchResource(resourceId, 0, 1);
        long portalTotal = parseLong(probe, "total");
        String title = textOrDefault(probe, "title", def.title());
        String description = textOrDefault(probe, "desc", def.description());

        if (portalTotal <= 0) {
            log.warn("Portal returned zero total records for {}; nothing to ingest", resourceId);
            chunkContext.getStepContext().getStepExecution().getJobExecution().getExecutionContext()
                    .putLong(IngestionContextKeys.PORTAL_TOTAL, 0L);
            chunkContext.getStepContext().getStepExecution().getJobExecution().getExecutionContext()
                    .putLong(IngestionContextKeys.START_OFFSET, 0L);
            return RepeatStatus.FINISHED;
        }

        long cached = cacheRepository.countRecords(resourceId);
        Optional<DatasetCacheMeta> existing = cacheRepository.findMeta(resourceId);
        if (cached >= portalTotal && existing.isPresent()) {
            cacheRepository.markReady(resourceId, cached);
            chunkContext.getStepContext().getStepExecution().getJobExecution().getExecutionContext()
                    .putLong(IngestionContextKeys.PORTAL_TOTAL, portalTotal);
            chunkContext.getStepContext().getStepExecution().getJobExecution().getExecutionContext()
                    .putLong(IngestionContextKeys.START_OFFSET, portalTotal);
            log.info("Cache already complete for {}: {}/{} records", resourceId, cached, portalTotal);
            return RepeatStatus.FINISHED;
        }

        int offset;
        if (cached > 0 && existing.isPresent()
                && existing.get().status() != DatasetFetchStatus.READY) {
            cacheRepository.resumeSync(resourceId, title, description, portalTotal);
            offset = (int) cached;
            log.info("Resuming ingestion for {} from offset {} ({}/{} portal records)",
                    resourceId, offset, cached, portalTotal);
        } else {
            cacheRepository.beginSync(resourceId, title, description, portalTotal);
            offset = 0;
            log.info("Starting fresh ingestion for {} (portal total {})", resourceId, portalTotal);
        }

        persistDimensions(resourceId, def.allDimensionSpecs());

        chunkContext.getStepContext().getStepExecution().getJobExecution().getExecutionContext()
                .putLong(IngestionContextKeys.PORTAL_TOTAL, portalTotal);
        chunkContext.getStepContext().getStepExecution().getJobExecution().getExecutionContext()
                .putLong(IngestionContextKeys.START_OFFSET, offset);
        return RepeatStatus.FINISHED;
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

    private static String textOrDefault(JsonNode node, String field, String fallback) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return fallback;
        }
        String text = value.asText("").trim();
        return text.isEmpty() ? fallback : text;
    }
}
