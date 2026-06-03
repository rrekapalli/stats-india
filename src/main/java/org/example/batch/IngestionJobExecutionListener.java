package org.example.batch;

import org.example.cache.DatasetCacheRepository;
import org.example.service.datagov.LiveDatasetDefinition;
import org.example.service.datagov.LiveDatasetRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobExecutionListener;
import org.springframework.batch.core.StepExecution;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Owns the {@code dataset_sync_run} row for each ingestion job execution: writes a
 * STARTED row before the job, and on completion updates the row plus marks
 * {@code dataset_meta} READY or ERROR.
 */
@Component
public class IngestionJobExecutionListener implements JobExecutionListener {

    private static final Logger log = LoggerFactory.getLogger(IngestionJobExecutionListener.class);

    private final DatasetSyncRunRepository syncRunRepository;
    private final DatasetCacheRepository cacheRepository;
    private final LiveDatasetRegistry registry;

    public IngestionJobExecutionListener(
            DatasetSyncRunRepository syncRunRepository,
            DatasetCacheRepository cacheRepository,
            LiveDatasetRegistry registry
    ) {
        this.syncRunRepository = syncRunRepository;
        this.cacheRepository = cacheRepository;
        this.registry = registry;
    }

    @Override
    public void beforeJob(JobExecution jobExecution) {
        String resourceId = jobExecution.getJobParameters()
                .getString(IngestionContextKeys.JOB_PARAM_RESOURCE_ID);
        if (resourceId == null) {
            return;
        }
        LiveDatasetDefinition def = registry.require(resourceId);
        String jobName = IngestionJobNames.forDefinition(def);
        Instant startedAt = jobExecution.getCreateTime() != null
                ? jobExecution.getCreateTime().atZone(java.time.ZoneOffset.UTC).toInstant()
                : Instant.now();
        syncRunRepository.insert(jobExecution.getId(), resourceId, jobName, startedAt);
        jobExecution.getExecutionContext().putString(IngestionContextKeys.RESOURCE_ID, resourceId);
        jobExecution.getExecutionContext().putString(IngestionContextKeys.JOB_NAME_DISPLAY, jobName);
    }

    @Override
    public void afterJob(JobExecution jobExecution) {
        String resourceId = jobExecution.getJobParameters()
                .getString(IngestionContextKeys.JOB_PARAM_RESOURCE_ID);
        if (resourceId == null) {
            return;
        }

        long recordsRead = 0;
        long recordsWritten = 0;
        for (StepExecution step : jobExecution.getStepExecutions()) {
            recordsRead += step.getReadCount();
            recordsWritten += step.getWriteCount();
        }

        BatchStatus status = jobExecution.getStatus();
        Instant completedAt = jobExecution.getEndTime() != null
                ? jobExecution.getEndTime().atZone(java.time.ZoneOffset.UTC).toInstant()
                : Instant.now();
        String error = jobExecution.getAllFailureExceptions().isEmpty()
                ? jobExecution.getExitStatus().getExitDescription()
                : jobExecution.getAllFailureExceptions().getFirst().getMessage();

        long pageRecords = computePageRecords(jobExecution);
        if (pageRecords > 0) {
            recordsWritten = pageRecords;
            recordsRead = pageRecords;
        }

        syncRunRepository.complete(
                jobExecution.getId(),
                status.name(),
                recordsRead,
                recordsWritten,
                completedAt,
                isBlank(error) ? null : error
        );

        long cached = cacheRepository.countRecords(resourceId);
        if (status == BatchStatus.COMPLETED) {
            cacheRepository.markReady(resourceId, cached);
        } else {
            cacheRepository.markError(
                    resourceId,
                    isBlank(error) ? "Ingestion " + status.name() : error
            );
        }
        log.info("Ingestion job {} for {} ended with status {} ({} records cached)",
                jobExecution.getId(), resourceId, status, cached);
    }

    /**
     * Each chunk item is a page; multiplying step write count by the configured page size
     * is unreliable for the final partial page, so we recompute "records written this run"
     * from {@code dataset_meta} (cached_records) minus the start offset.
     */
    private long computePageRecords(JobExecution jobExecution) {
        Object total = jobExecution.getExecutionContext().get(IngestionContextKeys.PORTAL_TOTAL);
        Object start = jobExecution.getExecutionContext().get(IngestionContextKeys.START_OFFSET);
        if (!(total instanceof Number) || !(start instanceof Number)) {
            return 0;
        }
        String resourceId = jobExecution.getJobParameters()
                .getString(IngestionContextKeys.JOB_PARAM_RESOURCE_ID);
        long cached = cacheRepository.countRecords(resourceId);
        long startOffset = ((Number) start).longValue();
        return Math.max(0, cached - startOffset);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
