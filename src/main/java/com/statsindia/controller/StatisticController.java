package com.statsindia.controller;

import com.statsindia.model.Statistic;
import com.statsindia.service.StatisticService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@CrossOrigin(origins = "http://localhost:4200") // For Angular frontend
public class StatisticController {

    private final StatisticService statisticService;

    @Autowired
    public StatisticController(StatisticService statisticService) {
        this.statisticService = statisticService;
    }

    @GetMapping
    public ResponseEntity<List<Statistic>> getAllStatistics() {
        return ResponseEntity.ok(statisticService.getAllStatistics());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Statistic> getStatisticById(@PathVariable Long id) {
        return statisticService.getStatisticById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Statistic> createStatistic(@RequestBody Statistic statistic) {
        return new ResponseEntity<>(statisticService.saveStatistic(statistic), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Statistic> updateStatistic(@PathVariable Long id, @RequestBody Statistic statistic) {
        return statisticService.getStatisticById(id)
                .map(existingStatistic -> {
                    statistic.setId(id);
                    return ResponseEntity.ok(statisticService.saveStatistic(statistic));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStatistic(@PathVariable Long id) {
        return statisticService.getStatisticById(id)
                .map(statistic -> {
                    statisticService.deleteStatistic(id);
                    return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Statistic>> getStatisticsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(statisticService.getStatisticsByCategory(category));
    }

    @GetMapping("/state/{state}")
    public ResponseEntity<List<Statistic>> getStatisticsByState(@PathVariable String state) {
        return ResponseEntity.ok(statisticService.getStatisticsByState(state));
    }

    @GetMapping("/metric/{metric}")
    public ResponseEntity<List<Statistic>> getStatisticsByMetric(@PathVariable String metric) {
        return ResponseEntity.ok(statisticService.getStatisticsByMetric(metric));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Statistic>> getStatisticsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(statisticService.getStatisticsByDateRange(startDate, endDate));
    }

    @GetMapping("/category/{category}/state/{state}")
    public ResponseEntity<List<Statistic>> getStatisticsByCategoryAndState(
            @PathVariable String category,
            @PathVariable String state) {
        return ResponseEntity.ok(statisticService.getStatisticsByCategoryAndState(category, state));
    }
}