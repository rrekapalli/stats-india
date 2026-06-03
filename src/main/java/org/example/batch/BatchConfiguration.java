package org.example.batch;

import org.example.cache.DatasetCacheProperties;
import org.example.cache.DatasetCacheRepository;
import org.example.client.DataGovInClient;
import org.example.service.datagov.CachedLiveDatasetService;
import org.example.service.datagov.LiveDatasetRegistry;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.JobScope;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.launch.support.TaskExecutorJobLauncher;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * Spring Batch wiring for stats-india ingestion. One parameterized job
 * ({@code fetch-dataset}) takes {@code resourceId} as a job parameter and runs:
 * <ol>
 *   <li>{@code prepare-ingestion-step} (tasklet) — probes data.gov.in, refreshes
 *       {@code dataset_meta}, persists dimensions, seeds execution context.</li>
 *   <li>{@code fetch-pages-step} (chunk size 1) — pages through data.gov.in,
 *       persists records and aggregates.</li>
 * </ol>
 *
 * <p>The "9 jobs" surfaced on the Data Ingestion page History tab are the same
 * underlying job filtered by {@code resourceId} parameter; the human-readable
 * name (e.g. {@code fetch-dataset-mca-company-master}) lives in
 * {@code dataset_sync_run.job_name} via {@link IngestionJobNames}.
 *
 * <p>JobRepository, JobExplorer, JobOperator, JobRegistry and the (sync) JobLauncher
 * are autoconfigured by Spring Boot from the autoconfigured {@link javax.sql.DataSource}.
 * We override only the launcher to use an async pool so {@code POST /sync} returns
 * immediately to the UI.
 */
@Configuration
public class BatchConfiguration {

    public static final String JOB_NAME = "fetch-dataset";
    public static final String PREPARE_STEP = "prepare-ingestion-step";
    public static final String FETCH_STEP = "fetch-pages-step";

    /**
     * Async launcher: one ingestion job runs at a time (single-thread pool) so
     * data.gov.in rate limits and Postgres writes are predictable.
     */
    @Bean
    @Primary
    public JobLauncher asyncJobLauncher(JobRepository jobRepository) throws Exception {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(1);
        executor.setQueueCapacity(16);
        executor.setThreadNamePrefix("stats-ingest-");
        executor.initialize();

        TaskExecutorJobLauncher launcher = new TaskExecutorJobLauncher();
        launcher.setJobRepository(jobRepository);
        launcher.setTaskExecutor(executor);
        launcher.afterPropertiesSet();
        return launcher;
    }

    @Bean
    @StepScope
    public PrepareIngestionTasklet prepareIngestionTasklet(
            DataGovInClient dataGovInClient,
            DatasetCacheRepository cacheRepository,
            LiveDatasetRegistry registry,
            @Value("#{jobParameters['" + IngestionContextKeys.JOB_PARAM_RESOURCE_ID + "']}") String resourceId
    ) {
        return new PrepareIngestionTasklet(dataGovInClient, cacheRepository, registry, resourceId);
    }

    @Bean
    @StepScope
    public DataGovPageReader dataGovPageReader(
            DataGovInClient dataGovInClient,
            LiveDatasetRegistry registry,
            DatasetCacheProperties cacheProperties,
            CachedLiveDatasetService liveDatasetService,
            @Value("#{jobParameters['" + IngestionContextKeys.JOB_PARAM_RESOURCE_ID + "']}") String resourceId
    ) {
        return new DataGovPageReader(
                dataGovInClient,
                registry,
                cacheProperties,
                liveDatasetService,
                resourceId
        );
    }

    @Bean
    @StepScope
    public DataGovPageWriter dataGovPageWriter(
            DatasetCacheRepository cacheRepository,
            CachedLiveDatasetService liveDatasetService,
            LiveDatasetRegistry registry,
            @Value("#{jobParameters['" + IngestionContextKeys.JOB_PARAM_RESOURCE_ID + "']}") String resourceId
    ) {
        return new DataGovPageWriter(cacheRepository, liveDatasetService, registry, resourceId);
    }

    @Bean
    public Step prepareIngestionStep(
            JobRepository jobRepository,
            PlatformTransactionManager transactionManager,
            PrepareIngestionTasklet prepareIngestionTasklet
    ) {
        return new StepBuilder(PREPARE_STEP, jobRepository)
                .tasklet(prepareIngestionTasklet, transactionManager)
                .build();
    }

    @Bean
    public Step fetchPagesStep(
            JobRepository jobRepository,
            PlatformTransactionManager transactionManager,
            DataGovPageReader dataGovPageReader,
            DataGovPageWriter dataGovPageWriter
    ) {
        return new StepBuilder(FETCH_STEP, jobRepository)
                .<DataGovIngestionPage, DataGovIngestionPage>chunk(1, transactionManager)
                .reader(dataGovPageReader)
                .writer(dataGovPageWriter)
                .build();
    }

    @Bean
    public Job fetchDatasetJob(
            JobRepository jobRepository,
            Step prepareIngestionStep,
            Step fetchPagesStep,
            IngestionJobExecutionListener listener
    ) {
        return new JobBuilder(JOB_NAME, jobRepository)
                .listener(listener)
                .start(prepareIngestionStep)
                .next(fetchPagesStep)
                .build();
    }
}
