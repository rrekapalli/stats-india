package com.statsindia.controller;

import com.statsindia.model.Metric;
import com.statsindia.service.MetricService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = "http://localhost:4200") // For Angular frontend
public class MetricController {

    private final MetricService metricService;

    @Autowired
    public MetricController(MetricService metricService) {
        this.metricService = metricService;
    }

    @GetMapping
    public ResponseEntity<List<Metric>> getAllMetrics() {
        return ResponseEntity.ok(metricService.getAllMetrics());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Metric> getMetricById(@PathVariable Long id) {
        return metricService.getMetricById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Metric> createMetric(@RequestBody Metric metric) {
        return new ResponseEntity<>(metricService.saveMetric(metric), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Metric> updateMetric(@PathVariable Long id, @RequestBody Metric metric) {
        return metricService.getMetricById(id)
                .map(existingMetric -> {
                    metric.setId(id);
                    return ResponseEntity.ok(metricService.saveMetric(metric));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMetric(@PathVariable Long id) {
        return metricService.getMetricById(id)
                .map(metric -> {
                    metricService.deleteMetric(id);
                    return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Metric>> getMetricsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(metricService.getMetricsByCategory(category));
    }

    @GetMapping("/state/{state}")
    public ResponseEntity<List<Metric>> getMetricsByState(@PathVariable String state) {
        return ResponseEntity.ok(metricService.getMetricsByState(state));
    }

    @GetMapping("/metric/{metric}")
    public ResponseEntity<List<Metric>> getMetricsByMetric(@PathVariable String metric) {
        return ResponseEntity.ok(metricService.getMetricsByMetric(metric));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Metric>> getMetricsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(metricService.getMetricsByDateRange(startDate, endDate));
    }

    @GetMapping("/category/{category}/state/{state}")
    public ResponseEntity<List<Metric>> getMetricsByCategoryAndState(
            @PathVariable String category,
            @PathVariable String state) {
        return ResponseEntity.ok(metricService.getMetricsByCategoryAndState(category, state));
    }
}