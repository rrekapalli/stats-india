package com.statsindia.service;

import com.statsindia.model.Statistic;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@Service
public class TrinoQueryService {

    private final JdbcTemplate trinoJdbcTemplate;

    public TrinoQueryService(@Qualifier("trinoJdbcTemplate") JdbcTemplate trinoJdbcTemplate) {
        this.trinoJdbcTemplate = trinoJdbcTemplate;
    }

    public List<Statistic> getAllStatistics() {
        String sql = "SELECT * FROM postgresql.statsindia.statistic";
        return trinoJdbcTemplate.query(sql, new StatisticRowMapper());
    }

    public List<Statistic> getStatisticsByCategory(String category) {
        String sql = "SELECT * FROM postgresql.statsindia.statistic WHERE category = ?";
        return trinoJdbcTemplate.query(sql, new StatisticRowMapper(), category);
    }

    public List<Statistic> getStatisticsByState(String state) {
        String sql = "SELECT * FROM postgresql.statsindia.statistic WHERE state = ?";
        return trinoJdbcTemplate.query(sql, new StatisticRowMapper(), state);
    }

    public List<Statistic> getStatisticsByMetric(String metric) {
        String sql = "SELECT * FROM postgresql.statsindia.statistic WHERE metric = ?";
        return trinoJdbcTemplate.query(sql, new StatisticRowMapper(), metric);
    }

    public List<Statistic> getStatisticsByDateRange(LocalDate startDate, LocalDate endDate) {
        String sql = "SELECT * FROM postgresql.statsindia.statistic WHERE record_date BETWEEN ? AND ?";
        return trinoJdbcTemplate.query(sql, new StatisticRowMapper(), startDate, endDate);
    }

    public List<Statistic> getStatisticsByCategoryAndState(String category, String state) {
        String sql = "SELECT * FROM postgresql.statsindia.statistic WHERE category = ? AND state = ?";
        return trinoJdbcTemplate.query(sql, new StatisticRowMapper(), category, state);
    }

    private static class StatisticRowMapper implements RowMapper<Statistic> {
        @Override
        public Statistic mapRow(ResultSet rs, int rowNum) throws SQLException {
            Statistic statistic = new Statistic();
            statistic.setId(rs.getLong("id"));
            statistic.setCategory(rs.getString("category"));
            statistic.setState(rs.getString("state"));
            statistic.setMetric(rs.getString("metric"));
            statistic.setValue(rs.getDouble("value"));
            statistic.setRecordDate(rs.getObject("record_date", LocalDate.class));
            statistic.setSource(rs.getString("source"));
            statistic.setDescription(rs.getString("description"));
            return statistic;
        }
    }
}
