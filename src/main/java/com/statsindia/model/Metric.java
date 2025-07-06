package com.statsindia.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a statistical metric in the system.
 * This entity stores various statistical measurements and indicators along with their metadata.
 * It includes information about the metric value, its source, quality indicators, and relationships
 * with other entities like domain, location, and department.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "metric")
public class Metric {
    /** Unique identifier for the metric */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    /** Category or classification of the metric */
    @Column(name = "category", length = Integer.MAX_VALUE)
    private String category;

    /** State or region to which the metric applies */
    @Column(name = "state", length = Integer.MAX_VALUE)
    private String state;

    /** Name or identifier of the specific metric being measured */
    @Column(name = "metric", length = Integer.MAX_VALUE)
    private String metric;

    /** Numerical value of the metric measurement */
    @Column(name = "value")
    private Double value;

    /** Date when the metric was recorded or measured */
    @Column(name = "record_date")
    private LocalDate recordDate;

    /** Source of the metric data */
    @Column(name = "source", length = Integer.MAX_VALUE)
    private String source;

    /** Detailed description of what the metric represents */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Additional comments or notes about the metric */
    @Column(name = "comments", length = Integer.MAX_VALUE)
    private String comments;

    /** Domain or subject area to which this metric belongs */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "domain_id")
    private Domain domain;

    /** Geographical location to which this metric applies */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    /** Government department or organization responsible for this metric */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    /** Administrative jurisdiction under which this metric falls */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jurisdiction_id")
    private Jurisdiction jurisdiction;

    /** Start date of the time period covered by this metric */
    @Column(name = "time_period_from")
    private LocalDate timePeriodFrom;

    /** End date of the time period covered by this metric */
    @Column(name = "time_period_to")
    private LocalDate timePeriodTo;

    // Data quality attributes
    /** Reference to detailed data quality information for this metric */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_quality_id")
    private DataQuality dataQuality;

    /** Statistical confidence level for this metric's value (typically expressed as a percentage) */
    @Column(name = "confidence_level")
    private Double confidenceLevel;

    /** Statistical margin of error for this metric's value */
    @Column(name = "margin_of_error")
    private Double marginOfError;

    /** Number of samples or observations used to calculate this metric */
    @Column(name = "sample_size")
    private Integer sampleSize;

    // Methodology reference
    /** Reference to the methodology used to collect and calculate this metric */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "methodology_id")
    private Methodology methodology;

    // Data source reference
    /** Reference to the source of data for this metric */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_source_id")
    private DataSource dataSource;

    // Demographic breakdown reference
    /** Reference to demographic information relevant to this metric */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demographic_id")
    private Demographic demographic;

    // Thematic classification reference
    /** Reference to the thematic classification (e.g., SDG goals) for this metric */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thematic_classification_id")
    private ThematicClassification thematicClassification;

    // Benchmark reference
    /** Reference to benchmark values for comparing this metric */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "benchmark_id")
    private Benchmark benchmark;

    // Audit trail
    /** Date and time when this metric record was created */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** User or system that created this metric record */
    @Column(name = "created_by", length = Integer.MAX_VALUE)
    private String createdBy;

    /** Date and time when this metric record was last updated */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** User or system that last updated this metric record */
    @Column(name = "updated_by", length = Integer.MAX_VALUE)
    private String updatedBy;

/*
 TODO [Reverse Engineering] create field to map the 'time_period' column
 Available actions: Define target Java type | Uncomment as is | Remove column mapping
    @Column(name = "time_period", columnDefinition = "daterange")
    private Object timePeriod;
*/
}
