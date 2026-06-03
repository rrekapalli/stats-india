package org.example.batch;

import org.example.service.datagov.LiveDatasetDefinition;
import org.example.service.datagov.LiveDatasetRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Public API for triggering and inspecting Spring Batch dataset ingestion jobs.
 * Wraps {@link JobLauncher} with idempotent "is already running" checks, and surfaces
 * history from {@link DatasetSyncRunRepository} for the Data Ingestion UI.
 */
@Service
public class DatasetIngestionJobService {

    private static final Logger log = LoggerFactory.getLogger(DatasetIngestionJobService.class);

    private final JobLauncher jobLauncher;
    private final Job fetchDatasetJob;
    private final JobExplorer jobExplorer;
    private final LiveDatasetRegistry registry;
    private final DatasetSyncRunRepository syncRunRepository;

    public DatasetIngestionJobService(
            JobLauncher jobLauncher,
            Job fetchDatasetJob,
            JobExplorer jobExplorer,
            LiveDatasetRegistry registry,
            DatasetSyncRunRepository syncRunRepository
    ) {
        this.jobLauncher = jobLauncher;
        this.fetchDatasetJob = fetchDatasetJob;
        this.jobExplorer = jobExplorer;
        this.registry = registry;
        this.syncRunRepository = syncRunRepository;
    }

    /**
     * Launch an ingestion job for the given dataset. Returns the new job execution id.
     *
     * @throws IllegalStateException if a job for this dataset is already running
     * @throws IllegalArgumentException if the dataset is not registered
     */
    public long triggerJob(String resourceId) {
        registry.require(resourceId);
        if (isRunning(resourceId)) {
            throw new IllegalStateException("Ingestion already running for dataset: " + resourceId);
        }
        JobParameters params = new JobParametersBuilder()
                .addString(IngestionContextKeys.JOB_PARAM_RESOURCE_ID, resourceId)
                .addLong(IngestionContextKeys.JOB_PARAM_TIMESTAMP, Instant.now().toEpochMilli())
                .toJobParameters();
        try {
            JobExecution execution = jobLauncher.run(fetchDatasetJob, params);
            log.info("Launched ingestion job {} for {}", execution.getId(), resourceId);
            return execution.getId();
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Failed to launch ingestion job for " + resourceId + ": " + ex.getMessage(),
                    ex
            );
        }
    }

    public boolean isRunning(String resourceId) {
        Set<JobExecution> running = jobExplorer.findRunningJobExecutions(BatchConfiguration.JOB_NAME);
        for (JobExecution exec : running) {
            String execResource = exec.getJobParameters()
                    .getString(IngestionContextKeys.JOB_PARAM_RESOURCE_ID);
            if (resourceId.equals(execResource)) {
                return true;
            }
        }
        return false;
    }

    public List<DatasetSyncRun> getHistory(String resourceId, int limit, int offset) {
        registry.require(resourceId);
        return syncRunRepository.findHistory(resourceId, limit, offset);
    }

    public long getHistoryCount(String resourceId) {
        registry.require(resourceId);
        return syncRunRepository.countHistory(resourceId);
    }

    public String jobNameFor(String resourceId) {
        LiveDatasetDefinition def = registry.require(resourceId);
        return IngestionJobNames.forDefinition(def);
    }
}
