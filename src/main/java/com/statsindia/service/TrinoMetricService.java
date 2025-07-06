package com.statsindia.service;

import com.statsindia.model.Metric;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@Service
public class TrinoMetricService {

    private final JdbcTemplate trinoJdbcTemplate;

    public TrinoMetricService(@Qualifier("trinoJdbcTemplate") JdbcTemplate trinoJdbcTemplate) {
        this.trinoJdbcTemplate = trinoJdbcTemplate;
    }

    public List<Metric> getAllMetrics() {
        String sql = "SELECT * FROM postgresql.statsindia.metric";
        return trinoJdbcTemplate.query(sql, new MetricRowMapper());
    }

    public List<Metric> getMetricsByCategory(String category) {
        String sql = "SELECT * FROM postgresql.statsindia.metric WHERE category = ?";
        return trinoJdbcTemplate.query(sql, new MetricRowMapper(), category);
    }

    public List<Metric> getMetricsByState(String state) {
        String sql = "SELECT * FROM postgresql.statsindia.metric WHERE state = ?";
        return trinoJdbcTemplate.query(sql, new MetricRowMapper(), state);
    }

    public List<Metric> getMetricsByMetric(String metric) {
        String sql = "SELECT * FROM postgresql.statsindia.metric WHERE metric = ?";
        return trinoJdbcTemplate.query(sql, new MetricRowMapper(), metric);
    }

    public List<Metric> getMetricsByDateRange(LocalDate startDate, LocalDate endDate) {
        String sql = "SELECT * FROM postgresql.statsindia.metric WHERE record_date BETWEEN ? AND ?";
        return trinoJdbcTemplate.query(sql, new MetricRowMapper(), startDate, endDate);
    }

    public List<Metric> getMetricsByCategoryAndState(String category, String state) {
        String sql = "SELECT * FROM postgresql.statsindia.metric WHERE category = ? AND state = ?";
        return trinoJdbcTemplate.query(sql, new MetricRowMapper(), category, state);
    }

    private static class MetricRowMapper implements RowMapper<Metric> {
        @Override
        public Metric mapRow(ResultSet rs, int rowNum) throws SQLException {
            Metric metric = new Metric();
            metric.setId(rs.getLong("id"));
            metric.setCategory(rs.getString("category"));
            metric.setState(rs.getString("state"));
            metric.setMetric(rs.getString("metric"));
            metric.setValue(rs.getDouble("value"));
            metric.setRecordDate(rs.getObject("record_date", LocalDate.class));
            metric.setSource(rs.getString("source"));
            metric.setDescription(rs.getString("description"));
            return metric;
        }
    }
}
