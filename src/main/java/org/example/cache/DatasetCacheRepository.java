package org.example.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * JDBC-backed access to the PostgreSQL dataset cache.
 * Schema is owned by Flyway migrations under {@code src/main/resources/db/migration/}.
 */
public class DatasetCacheRepository {

    private static final TypeReference<Map<String, String>> RECORD_TYPE = new TypeReference<>() {};

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DatasetCacheRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
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
        Timestamp now = Timestamp.from(Instant.now());
        jdbc.update(
                """
                        INSERT INTO dataset_meta (
                            resource_id, title, description, portal_total, cached_records,
                            status, fetched_at, sync_started_at, last_error
                        ) VALUES (?, ?, ?, ?, 0, ?, NULL, ?, NULL)
                        ON CONFLICT (resource_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            description = EXCLUDED.description,
                            portal_total = EXCLUDED.portal_total,
                            cached_records = 0,
                            status = EXCLUDED.status,
                            fetched_at = NULL,
                            sync_started_at = EXCLUDED.sync_started_at,
                            last_error = NULL
                        """,
                resourceId,
                title,
                description,
                portalTotal,
                DatasetFetchStatus.SYNCING.name(),
                now
        );
        jdbc.update("DELETE FROM dataset_record WHERE resource_id = ?", resourceId);
        jdbc.update("DELETE FROM dataset_aggregate WHERE resource_id = ?", resourceId);
    }

    /** Continue an in-progress cache without wiping existing rows or aggregates. */
    public void resumeSync(String resourceId, String title, String description, long portalTotal) {
        Timestamp now = Timestamp.from(Instant.now());
        jdbc.update(
                """
                        INSERT INTO dataset_meta (
                            resource_id, title, description, portal_total, cached_records,
                            status, fetched_at, sync_started_at, last_error
                        ) VALUES (?, ?, ?, ?, 0, ?, NULL, ?, NULL)
                        ON CONFLICT (resource_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            description = EXCLUDED.description,
                            portal_total = EXCLUDED.portal_total,
                            status = EXCLUDED.status,
                            sync_started_at = EXCLUDED.sync_started_at,
                            last_error = NULL
                        """,
                resourceId,
                title,
                description,
                portalTotal,
                DatasetFetchStatus.SYNCING.name(),
                now
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
        Timestamp now = Timestamp.from(Instant.now());
        jdbc.update(
                """
                        UPDATE dataset_meta
                        SET status = ?, cached_records = ?, fetched_at = ?, last_error = NULL
                        WHERE resource_id = ?
                        """,
                DatasetFetchStatus.READY.name(),
                cachedRecords,
                now,
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
                "INSERT INTO dataset_record (resource_id, row_index, cin, data_json) VALUES (?, ?, ?, ?::jsonb)",
                new BatchPreparedStatementSetter() {
                    @Override
                    public void setValues(PreparedStatement ps, int i) throws SQLException {
                        Map<String, String> row = records.get(i);
                        ps.setString(1, resourceId);
                        ps.setInt(2, startIndex + i);
                        String cin = row.get("cin");
                        if (cin == null) {
                            ps.setNull(3, Types.VARCHAR);
                        } else {
                            ps.setString(3, cin);
                        }
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
                                ON CONFLICT (resource_id, dimension, agg_key)
                                DO UPDATE SET count = dataset_aggregate.count + EXCLUDED.count
                                """,
                        resourceId,
                        dimension.getKey(),
                        entry.getKey(),
                        entry.getValue().longValue()
                );
            }
        }
    }

    /** Replace the dimension definitions for a resource. */
    public void replaceDimensions(String resourceId, List<DatasetDimensionRow> rows) {
        jdbc.update("DELETE FROM dataset_dimension WHERE resource_id = ?", resourceId);
        if (rows == null || rows.isEmpty()) {
            return;
        }
        jdbc.batchUpdate(
                """
                        INSERT INTO dataset_dimension (
                            resource_id, dimension_id, label, role, source_field,
                            aggregate_key, count_unit, display_limit, sort_order, filterable
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                new BatchPreparedStatementSetter() {
                    @Override
                    public void setValues(PreparedStatement ps, int i) throws SQLException {
                        DatasetDimensionRow row = rows.get(i);
                        ps.setString(1, resourceId);
                        ps.setString(2, row.dimensionId());
                        ps.setString(3, row.label());
                        ps.setString(4, row.role());
                        ps.setString(5, row.sourceField());
                        ps.setString(6, row.aggregateKey());
                        ps.setString(7, row.countUnit());
                        ps.setInt(8, row.displayLimit());
                        ps.setInt(9, row.sortOrder());
                        ps.setBoolean(10, row.filterable());
                    }

                    @Override
                    public int getBatchSize() {
                        return rows.size();
                    }
                }
        );
    }

    public List<DatasetDimensionRow> loadDimensions(String resourceId) {
        return jdbc.query(
                """
                        SELECT dimension_id, label, role, source_field, aggregate_key,
                               count_unit, display_limit, sort_order, filterable
                        FROM dataset_dimension WHERE resource_id = ?
                        ORDER BY sort_order, dimension_id
                        """,
                (rs, rowNum) -> new DatasetDimensionRow(
                        rs.getString("dimension_id"),
                        rs.getString("label"),
                        rs.getString("role"),
                        rs.getString("source_field"),
                        rs.getString("aggregate_key"),
                        rs.getString("count_unit"),
                        rs.getInt("display_limit"),
                        rs.getInt("sort_order"),
                        rs.getBoolean("filterable")
                ),
                resourceId
        );
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
                (org.springframework.jdbc.core.RowCallbackHandler) rs -> {
                    String dimension = rs.getString("dimension");
                    long count = rs.getLong("count");
                    int safeCount = count > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) count;
                    result.computeIfAbsent(dimension, k -> new LinkedHashMap<>())
                            .put(rs.getString("agg_key"), safeCount);
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

    public void forEachRecord(String resourceId, java.util.function.Consumer<Map<String, String>> consumer) {
        jdbc.query(
                """
                        SELECT data_json FROM dataset_record
                        WHERE resource_id = ?
                        ORDER BY row_index
                        """,
                (org.springframework.jdbc.core.RowCallbackHandler) rs -> consumer.accept(fromJson(rs.getString("data_json"))),
                resourceId
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
                toInstant(rs.getTimestamp("fetched_at")),
                toInstant(rs.getTimestamp("sync_started_at")),
                rs.getString("last_error")
        );
    }

    private Instant toInstant(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
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
