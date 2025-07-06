package com.statsindia.repository;

import com.statsindia.model.Statistic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StatisticRepository extends JpaRepository<Statistic, Long> {
    
    List<Statistic> findByCategory(String category);
    
    List<Statistic> findByState(String state);
    
    List<Statistic> findByMetric(String metric);
    
    List<Statistic> findByRecordDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Statistic> findByCategoryAndState(String category, String state);
}