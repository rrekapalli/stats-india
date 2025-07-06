package com.statsindia.service;

import com.statsindia.model.Metric;
import com.statsindia.repository.MetricRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class MetricService {

    private final MetricRepository metricRepository;
    private final TrinoMetricService trinoMetricService;

    @Autowired
    public MetricService(MetricRepository metricRepository, TrinoMetricService trinoMetricService) {
        this.metricRepository = metricRepository;
        this.trinoMetricService = trinoMetricService;
    }

    public List<Metric> getAllMetrics() {
        try {
            return trinoMetricService.getAllMetrics();
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return metricRepository.findAll();
        }
    }

    public Optional<Metric> getMetricById(Long id) {
        // Keep using JPA repository for finding by ID
        return metricRepository.findById(id);
    }

    public Metric saveMetric(Metric metric) {
        // Keep using JPA repository for write operations
        return metricRepository.save(metric);
    }

    public void deleteMetric(Long id) {
        // Keep using JPA repository for write operations
        metricRepository.deleteById(id);
    }

    public List<Metric> getMetricsByCategory(String category) {
        try {
            return trinoMetricService.getMetricsByCategory(category);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return metricRepository.findByCategory(category);
        }
    }

    public List<Metric> getMetricsByState(String state) {
        try {
            return trinoMetricService.getMetricsByState(state);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return metricRepository.findByState(state);
        }
    }

    public List<Metric> getMetricsByMetric(String metric) {
        try {
            return trinoMetricService.getMetricsByMetric(metric);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return metricRepository.findByMetric(metric);
        }
    }

    public List<Metric> getMetricsByDateRange(LocalDate startDate, LocalDate endDate) {
        try {
            return trinoMetricService.getMetricsByDateRange(startDate, endDate);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return metricRepository.findByRecordDateBetween(startDate, endDate);
        }
    }

    public List<Metric> getMetricsByCategoryAndState(String category, String state) {
        try {
            return trinoMetricService.getMetricsByCategoryAndState(category, state);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return metricRepository.findByCategoryAndState(category, state);
        }
    }
}
