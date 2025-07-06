package com.statsindia.repository;

import com.statsindia.model.Metric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MetricRepository extends JpaRepository<Metric, Long> {
    
    List<Metric> findByCategory(String category);
    
    List<Metric> findByState(String state);
    
    List<Metric> findByMetric(String metric);
    
    List<Metric> findByRecordDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Metric> findByCategoryAndState(String category, String state);
}