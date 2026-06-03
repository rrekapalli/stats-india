package org.example.batch;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class DatasetSyncRunRepository {

    private final JdbcTemplate jdbc;

    public DatasetSyncRunRepository(DataSource dataSource) {
        this.jdbc = new JdbcTemplate(dataSource);
    }

    public void insert(long executionId, String resourceId, String jobName, Instant startedAt) {
        jdbc.update(
                """
                        INSERT INTO dataset_sync_run (
                            execution_id, resource_id, job_name, status,
                            records_read, records_written, started_at, completed_at, error_message
                        ) VALUES (?, ?, ?, 'STARTED', 0, 0, ?, NULL, NULL)
                        ON CONFLICT (execution_id) DO UPDATE SET
                            resource_id = EXCLUDED.resource_id,
                            job_name = EXCLUDED.job_name,
                            status = 'STARTED',
                            started_at = EXCLUDED.started_at,
                            completed_at = NULL,
                            error_message = NULL
                        """,
                executionId,
                resourceId,
                jobName,
                Timestamp.from(startedAt)
        );
    }

    public void complete(
            long executionId,
            String status,
            long recordsRead,
            long recordsWritten,
            Instant completedAt,
            String errorMessage
    ) {
        jdbc.update(
                """
                        UPDATE dataset_sync_run
                        SET status = ?, records_read = ?, records_written = ?,
                            completed_at = ?, error_message = ?
                        WHERE execution_id = ?
                        """,
                status,
                recordsRead,
                recordsWritten,
                Timestamp.from(completedAt),
                truncate(errorMessage, 2000),
                executionId
        );
    }

    public Optional<DatasetSyncRun> findLatestForResource(String resourceId) {
        List<DatasetSyncRun> rows = jdbc.query(
                """
                        SELECT execution_id, resource_id, job_name, status,
                               records_read, records_written, started_at, completed_at, error_message
                        FROM dataset_sync_run
                        WHERE resource_id = ?
                        ORDER BY started_at DESC
                        LIMIT 1
                        """,
                this::mapRun,
                resourceId
        );
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public List<DatasetSyncRun> findHistory(String resourceId, int limit, int offset) {
        return jdbc.query(
                """
                        SELECT execution_id, resource_id, job_name, status,
                               records_read, records_written, started_at, completed_at, error_message
                        FROM dataset_sync_run
                        WHERE resource_id = ?
                        ORDER BY started_at DESC
                        LIMIT ? OFFSET ?
                        """,
                this::mapRun,
                resourceId,
                limit,
                offset
        );
    }

    public long countHistory(String resourceId) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM dataset_sync_run WHERE resource_id = ?",
                Long.class,
                resourceId
        );
        return count != null ? count : 0L;
    }

    private DatasetSyncRun mapRun(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new DatasetSyncRun(
                rs.getLong("execution_id"),
                rs.getString("resource_id"),
                rs.getString("job_name"),
                rs.getString("status"),
                rs.getLong("records_read"),
                rs.getLong("records_written"),
                toInstant(rs.getTimestamp("started_at")),
                toInstant(rs.getTimestamp("completed_at")),
                rs.getString("error_message")
        );
    }

    private static Instant toInstant(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
