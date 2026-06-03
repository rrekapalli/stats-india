package org.example.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class DatasetCacheRepository {

    private static final TypeReference<Map<String, String>> RECORD_TYPE = new TypeReference<>() {};

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DatasetCacheRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void initSchema() {
        jdbc.execute("PRAGMA journal_mode=WAL");
        jdbc.execute("PRAGMA synchronous=NORMAL");
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS dataset_meta (
                    resource_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    portal_total INTEGER NOT NULL DEFAULT 0,
                    cached_records INTEGER NOT NULL DEFAULT 0,
                    status TEXT NOT NULL,
                    fetched_at TEXT,
                    sync_started_at TEXT,
                    last_error TEXT
                )
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS dataset_record (
                    resource_id TEXT NOT NULL,
                    row_index INTEGER NOT NULL,
                    cin TEXT,
                    data_json TEXT NOT NULL,
                    PRIMARY KEY (resource_id, row_index)
                )
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS dataset_aggregate (
                    resource_id TEXT NOT NULL,
                    dimension TEXT NOT NULL,
                    agg_key TEXT NOT NULL,
                    count INTEGER NOT NULL,
                    PRIMARY KEY (resource_id, dimension, agg_key)
                )
                """);
        jdbc.execute("""
                CREATE INDEX IF NOT EXISTS idx_dataset_record_resource
                ON dataset_record (resource_id, row_index)
                """);
    }

    public Optional<DatasetCacheMeta> findMeta(String resourceId) {
        List<DatasetCacheMeta> rows = jdbc.query(
                """
                        SELECT resource_id, title, description, portal_total, cached_records,
                               status, fetched_at, sync_started_at, last_error
                        FROM dataset_meta WHERE resource_id = ?
                        """,
                metaRowMapper(),
                resourceId
        );
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public void beginSync(String resourceId, String title, String description, long portalTotal) {
        Instant now = Instant.now();
        jdbc.update(
                """
                        INSERT INTO dataset_meta (
                            resource_id, title, description, portal_total, cached_records,
                            status, fetched_at, sync_started_at, last_error
                        ) VALUES (?, ?, ?, ?, 0, ?, NULL, ?, NULL)
                        ON CONFLICT(resource_id) DO UPDATE SET
                            title = excluded.title,
                            description = excluded.description,
                            portal_total = excluded.portal_total,
                            cached_records = 0,
                            status = excluded.status,
                            fetched_at = NULL,
                            sync_started_at = excluded.sync_started_at,
                            last_error = NULL
                        """,
                resourceId,
                title,
                description,
                portalTotal,
                DatasetFetchStatus.SYNCING.name(),
                now.toString()
        );
        jdbc.update("DELETE FROM dataset_record WHERE resource_id = ?", resourceId);
        jdbc.update("DELETE FROM dataset_aggregate WHERE resource_id = ?", resourceId);
    }

    /** Continue an in-progress cache without wiping existing rows or aggregates. */
    public void resumeSync(String resourceId, String title, String description, long portalTotal) {
        Instant now = Instant.now();
        jdbc.update(
                """
                        INSERT INTO dataset_meta (
                            resource_id, title, description, portal_total, cached_records,
                            status, fetched_at, sync_started_at, last_error
                        ) VALUES (?, ?, ?, ?, 0, ?, NULL, ?, NULL)
                        ON CONFLICT(resource_id) DO UPDATE SET
                            title = excluded.title,
                            description = excluded.description,
                            portal_total = excluded.portal_total,
                            status = ?,
                            sync_started_at = excluded.sync_started_at,
                            last_error = NULL
                        """,
                resourceId,
                title,
                description,
                portalTotal,
                DatasetFetchStatus.SYNCING.name(),
                now.toString(),
                DatasetFetchStatus.SYNCING.name()
        );
    }

    public void updateProgress(String resourceId, long cachedRecords) {
        jdbc.update(
                "UPDATE dataset_meta SET cached_records = ? WHERE resource_id = ?",
                cachedRecords,
                resourceId
        );
    }

    public void markReady(String resourceId, long cachedRecords) {
        Instant now = Instant.now();
        jdbc.update(
                """
                        UPDATE dataset_meta
                        SET status = ?, cached_records = ?, fetched_at = ?, last_error = NULL
                        WHERE resource_id = ?
                        """,
                DatasetFetchStatus.READY.name(),
                cachedRecords,
                now.toString(),
                resourceId
        );
    }

    public void markError(String resourceId, String error) {
        jdbc.update(
                "UPDATE dataset_meta SET status = ?, last_error = ? WHERE resource_id = ?",
                DatasetFetchStatus.ERROR.name(),
                truncate(error, 2000),
                resourceId
        );
    }

    public void insertRecords(String resourceId, int startIndex, List<Map<String, String>> records) {
        if (records.isEmpty()) {
            return;
        }
        jdbc.batchUpdate(
                "INSERT INTO dataset_record (resource_id, row_index, cin, data_json) VALUES (?, ?, ?, ?)",
                new BatchPreparedStatementSetter() {
                    @Override
                    public void setValues(PreparedStatement ps, int i) throws SQLException {
                        Map<String, String> row = records.get(i);
                        ps.setString(1, resourceId);
                        ps.setInt(2, startIndex + i);
                        ps.setString(3, row.getOrDefault("cin", ""));
                        ps.setString(4, toJson(row));
                    }

                    @Override
                    public int getBatchSize() {
                        return records.size();
                    }
                }
        );
    }

    public void mergeAggregates(String resourceId, Map<String, Map<String, Integer>> dimensions) {
        for (Map.Entry<String, Map<String, Integer>> dimension : dimensions.entrySet()) {
            for (Map.Entry<String, Integer> entry : dimension.getValue().entrySet()) {
                jdbc.update(
                        """
                                INSERT INTO dataset_aggregate (resource_id, dimension, agg_key, count)
                                VALUES (?, ?, ?, ?)
                                ON CONFLICT(resource_id, dimension, agg_key)
                                DO UPDATE SET count = count + excluded.count
                                """,
                        resourceId,
                        dimension.getKey(),
                        entry.getKey(),
                        entry.getValue()
                );
            }
        }
    }

    public Map<String, Map<String, Integer>> loadAggregates(String resourceId) {
        Map<String, Map<String, Integer>> result = new LinkedHashMap<>();
        jdbc.query(
                """
                        SELECT dimension, agg_key, count
                        FROM dataset_aggregate
                        WHERE resource_id = ?
                        ORDER BY dimension, count DESC
                        """,
                rs -> {
                    String dimension = rs.getString("dimension");
                    result.computeIfAbsent(dimension, k -> new LinkedHashMap<>())
                            .put(rs.getString("agg_key"), rs.getInt("count"));
                },
                resourceId
        );
        return result;
    }

    public List<Map<String, String>> loadRecords(String resourceId, int offset, int limit) {
        return jdbc.query(
                """
                        SELECT data_json FROM dataset_record
                        WHERE resource_id = ?
                        ORDER BY row_index
                        LIMIT ? OFFSET ?
                        """,
                (rs, rowNum) -> fromJson(rs.getString("data_json")),
                resourceId,
                limit,
                offset
        );
    }

    public long countRecords(String resourceId) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM dataset_record WHERE resource_id = ?",
                Long.class,
                resourceId
        );
        return count != null ? count : 0L;
    }

    public boolean isStale(DatasetCacheMeta meta, int refreshAfterDays) {
        if (meta.status() != DatasetFetchStatus.READY || meta.fetchedAt() == null) {
            return true;
        }
        return meta.fetchedAt().isBefore(Instant.now().minusSeconds(refreshAfterDays * 86_400L));
    }

    private RowMapper<DatasetCacheMeta> metaRowMapper() {
        return (rs, rowNum) -> new DatasetCacheMeta(
                rs.getString("resource_id"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getLong("portal_total"),
                rs.getLong("cached_records"),
                DatasetFetchStatus.valueOf(rs.getString("status")),
                parseInstant(rs.getString("fetched_at")),
                parseInstant(rs.getString("sync_started_at")),
                rs.getString("last_error")
        );
    }

    private Instant parseInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Instant.parse(value);
    }

    private String toJson(Map<String, String> row) {
        try {
            return objectMapper.writeValueAsString(row);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize dataset record", ex);
        }
    }

    private Map<String, String> fromJson(String json) {
        try {
            return objectMapper.readValue(json, RECORD_TYPE);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize dataset record", ex);
        }
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
