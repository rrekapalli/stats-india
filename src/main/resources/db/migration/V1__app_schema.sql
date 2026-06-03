-- V1: Stats India dataset cache schema (PostgreSQL).
-- Mirrors the SQLite schema previously created in DatasetCacheRepository.initSchema(),
-- but uses native Postgres types (JSONB, BOOLEAN, TIMESTAMPTZ).

CREATE TABLE IF NOT EXISTS dataset_meta (
    resource_id       TEXT        PRIMARY KEY,
    title             TEXT        NOT NULL,
    description       TEXT,
    portal_total      BIGINT      NOT NULL DEFAULT 0,
    cached_records    BIGINT      NOT NULL DEFAULT 0,
    status            TEXT        NOT NULL,
    fetched_at        TIMESTAMPTZ,
    sync_started_at   TIMESTAMPTZ,
    last_error        TEXT
);

CREATE TABLE IF NOT EXISTS dataset_record (
    resource_id   TEXT    NOT NULL,
    row_index     INTEGER NOT NULL,
    cin           TEXT,
    data_json     JSONB   NOT NULL,
    PRIMARY KEY (resource_id, row_index)
);

CREATE INDEX IF NOT EXISTS idx_dataset_record_data_jsonb
    ON dataset_record USING GIN (data_json);

CREATE TABLE IF NOT EXISTS dataset_aggregate (
    resource_id   TEXT    NOT NULL,
    dimension     TEXT    NOT NULL,
    agg_key       TEXT    NOT NULL,
    count         BIGINT  NOT NULL,
    PRIMARY KEY (resource_id, dimension, agg_key)
);

CREATE INDEX IF NOT EXISTS idx_dataset_aggregate_lookup
    ON dataset_aggregate (resource_id, dimension);

CREATE TABLE IF NOT EXISTS dataset_dimension (
    resource_id     TEXT    NOT NULL,
    dimension_id    TEXT    NOT NULL,
    label           TEXT    NOT NULL,
    role            TEXT    NOT NULL,
    source_field    TEXT,
    aggregate_key   TEXT,
    count_unit      TEXT,
    display_limit   INTEGER NOT NULL DEFAULT 0,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    filterable      BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (resource_id, dimension_id)
);
