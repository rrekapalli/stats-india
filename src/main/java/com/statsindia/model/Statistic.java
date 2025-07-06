// This class has been replaced by Metric.java
// Keeping this file as a placeholder to avoid compilation errors in classes that still reference it
// Once all references are updated, this file can be safely deleted

package com.statsindia.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a statistical measurement in the system.
 * This entity has been deprecated and replaced by the Metric class.
 * It is kept as a placeholder to avoid compilation errors in classes that still reference it.
 * Once all references are updated, this class can be safely deleted.
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Deprecated
public class Statistic {

    /** Unique identifier for the statistic */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Category or classification of the statistic */
    private String category;
    /** State or region to which the statistic applies */
    private String state;
    /** Name or identifier of the specific statistic being measured */
    private String metric;
    /** Numerical value of the statistic measurement */
    private Double value;
    /** Date when the statistic was recorded or measured */
    private LocalDate recordDate;
    /** Source of the statistic data */
    private String source;
    /** Detailed description of what the statistic represents */
    private String description;

    // Data quality attributes
    /** Reference to detailed data quality information for this statistic */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_quality_id")
    private DataQuality dataQuality;

    /** Statistical confidence level for this statistic's value (typically expressed as a percentage) */
    private Double confidenceLevel;
    /** Statistical margin of error for this statistic's value */
    private Double marginOfError;
    /** Number of samples or observations used to calculate this statistic */
    private Integer sampleSize;

    // Time dimension reference
    /** Reference to detailed time dimension information for this statistic */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_dimension_id")
    private TimeDimension timeDimension;

    // Methodology reference
    /** Reference to the methodology used to collect and calculate this statistic */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "methodology_id")
    private Methodology methodology;

    // Data source reference
    /** Reference to the source of data for this statistic */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_source_id")
    private DataSource dataSource;

    // Demographic breakdown reference
    /** Reference to demographic information relevant to this statistic */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demographic_id")
    private Demographic demographic;

    // Thematic classification reference
    /** Reference to the thematic classification (e.g., SDG goals) for this statistic */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thematic_classification_id")
    private ThematicClassification thematicClassification;

    // Location reference with enhanced geospatial attributes
    /** Geographical location to which this statistic applies */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    // Benchmark reference
    /** Reference to benchmark values for comparing this statistic */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "benchmark_id")
    private Benchmark benchmark;

    // Audit trail
    /** Date and time when this statistic record was created */
    private LocalDateTime createdAt;
    /** User or system that created this statistic record */
    private String createdBy;
    /** Date and time when this statistic record was last updated */
    private LocalDateTime updatedAt;
    /** User or system that last updated this statistic record */
    private String updatedBy;
}
