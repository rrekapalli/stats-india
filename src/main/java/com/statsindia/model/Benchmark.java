package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Represents a benchmark in the system.
 * This entity stores reference values or standards against which metrics can be compared.
 * It includes different types of benchmarks such as targets, historical averages, peer comparisons,
 * and industry standards, along with their validity periods and calculation methods.
 */
@Getter
@Setter
@Entity
@Table(name = "benchmark")
public class Benchmark {
    /** Unique identifier for the benchmark */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Name of the benchmark */
    @Column(name = "benchmark_name", length = Integer.MAX_VALUE)
    private String benchmarkName;

    /** Type of benchmark (e.g., "Target", "Historical Average", "Peer Comparison", "Industry Standard") */
    @Column(name = "benchmark_type", length = Integer.MAX_VALUE)
    private String benchmarkType;

    /** Numerical value of the benchmark */
    @Column(name = "benchmark_value")
    private Double benchmarkValue;

    /** Detailed description of the benchmark */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Date from which this benchmark is valid */
    @Column(name = "start_date")
    private LocalDate startDate;

    /** Date until which this benchmark is valid */
    @Column(name = "end_date")
    private LocalDate endDate;

    /** Indicates whether this benchmark is currently active */
    @Column(name = "is_active")
    private Boolean isActive;

    /** Source of the benchmark data or information */
    @Column(name = "source", length = Integer.MAX_VALUE)
    private String source;

    /** Method used to calculate this benchmark value */
    @Column(name = "calculation_method", length = Integer.MAX_VALUE)
    private String calculationMethod;

    /** Reference to the metric to which this benchmark applies */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "metric_id")
    private Metric metric;

    /** Reference to the unit of measure for this benchmark */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_of_measure_id")
    private UnitOfMeasure unitOfMeasure;
}
