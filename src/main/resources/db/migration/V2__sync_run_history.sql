-- V2: Per-resource batch run history surfaced on the Data Ingestion page.
-- One row per Spring Batch JobExecution; populated by IngestionJobExecutionListener.

CREATE TABLE IF NOT EXISTS dataset_sync_run (
    execution_id      BIGINT      PRIMARY KEY,
    resource_id       TEXT        NOT NULL,
    job_name          TEXT        NOT NULL,
    status            TEXT        NOT NULL,
    records_read      BIGINT      NOT NULL DEFAULT 0,
    records_written   BIGINT      NOT NULL DEFAULT 0,
    started_at        TIMESTAMPTZ NOT NULL,
    completed_at      TIMESTAMPTZ,
    error_message     TEXT
);

CREATE INDEX IF NOT EXISTS idx_dataset_sync_run_resource
    ON dataset_sync_run (resource_id, started_at DESC);
