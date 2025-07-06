package com.statsindia.service;

import com.statsindia.model.Statistic;
import com.statsindia.repository.StatisticRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class StatisticService {

    private final StatisticRepository statisticRepository;
    private final TrinoQueryService trinoQueryService;

    @Autowired
    public StatisticService(StatisticRepository statisticRepository, TrinoQueryService trinoQueryService) {
        this.statisticRepository = statisticRepository;
        this.trinoQueryService = trinoQueryService;
    }

    public List<Statistic> getAllStatistics() {
        try {
            return trinoQueryService.getAllStatistics();
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return statisticRepository.findAll();
        }
    }

    public Optional<Statistic> getStatisticById(Long id) {
        // Keep using JPA repository for finding by ID
        return statisticRepository.findById(id);
    }

    public Statistic saveStatistic(Statistic statistic) {
        // Keep using JPA repository for write operations
        return statisticRepository.save(statistic);
    }

    public void deleteStatistic(Long id) {
        // Keep using JPA repository for write operations
        statisticRepository.deleteById(id);
    }

    public List<Statistic> getStatisticsByCategory(String category) {
        try {
            return trinoQueryService.getStatisticsByCategory(category);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return statisticRepository.findByCategory(category);
        }
    }

    public List<Statistic> getStatisticsByState(String state) {
        try {
            return trinoQueryService.getStatisticsByState(state);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return statisticRepository.findByState(state);
        }
    }

    public List<Statistic> getStatisticsByMetric(String metric) {
        try {
            return trinoQueryService.getStatisticsByMetric(metric);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return statisticRepository.findByMetric(metric);
        }
    }

    public List<Statistic> getStatisticsByDateRange(LocalDate startDate, LocalDate endDate) {
        try {
            return trinoQueryService.getStatisticsByDateRange(startDate, endDate);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return statisticRepository.findByRecordDateBetween(startDate, endDate);
        }
    }

    public List<Statistic> getStatisticsByCategoryAndState(String category, String state) {
        try {
            return trinoQueryService.getStatisticsByCategoryAndState(category, state);
        } catch (Exception e) {
            // Fallback to JPA repository if Trino query fails
            return statisticRepository.findByCategoryAndState(category, state);
        }
    }
}
