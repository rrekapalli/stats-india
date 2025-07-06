package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents data quality metrics in the system.
 * This entity stores information about the quality and reliability of statistical data,
 * including confidence levels, margins of error, sample sizes, and verification methods.
 * It helps users assess the trustworthiness and limitations of the data.
 */
@Getter
@Setter
@Entity
@Table(name = "data_quality")
public class DataQuality {
    /** Unique identifier for the data quality record */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Statistical confidence level (typically expressed as a percentage, e.g., 95%) */
    @Column(name = "confidence_level")
    private Double confidenceLevel;

    /** Statistical margin of error indicating the precision of measurements */
    @Column(name = "margin_of_error")
    private Double marginOfError;

    /** Number of samples or observations used in data collection */
    @Column(name = "sample_size")
    private Integer sampleSize;

    /** Percentage indicating how complete the dataset is (0-100%) */
    @Column(name = "data_completeness_percentage")
    private Double dataCompletenessPercentage;

    /** Date when the data quality was last verified or assessed */
    @Column(name = "last_verified_date")
    private java.time.LocalDate lastVerifiedDate;

    /** Method used to verify or validate the data quality */
    @Column(name = "verification_method", length = Integer.MAX_VALUE)
    private String verificationMethod;

    /** Documented limitations or caveats about the data quality */
    @Column(name = "known_limitations", length = Integer.MAX_VALUE)
    private String knownLimitations;

    /** Overall quality score (typically on a scale, e.g., 0-1 or 0-10) */
    @Column(name = "quality_score")
    private Double qualityScore;

    /** Detailed description of the data quality metrics and assessment */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;
}
