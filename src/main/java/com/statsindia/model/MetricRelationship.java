package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Represents relationships between metrics in the system.
 * This entity captures various types of connections between metrics, such as derivation,
 * correlation, causation, or composition relationships. It includes information about
 * relationship strength, formulas for derived metrics, and temporal validity of the relationship.
 */
@Getter
@Setter
@Entity
@Table(name = "metric_relationship")
public class MetricRelationship {
    /** Unique identifier for the metric relationship */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Reference to the source metric in the relationship */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_metric_id")
    private Metric sourceMetric;

    /** Reference to the target metric in the relationship */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_metric_id")
    private Metric targetMetric;

    /** Type of relationship between metrics (e.g., "Derived", "Component", "Correlated", "Causal", "Predecessor") */
    @Column(name = "relationship_type", length = Integer.MAX_VALUE)
    private String relationshipType;

    /** Strength of the relationship between metrics (for correlation or causal relationships, -1.0 to 1.0) */
    @Column(name = "relationship_strength")
    private Double relationshipStrength;

    /** Detailed description of the relationship between metrics */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Calculation formula for derived metrics */
    @Column(name = "formula", length = Integer.MAX_VALUE)
    private String formula;

    /** Indicates whether this relationship is currently active */
    @Column(name = "is_active")
    private Boolean isActive;

    /** Date from which this relationship is valid */
    @Column(name = "start_date")
    private LocalDate startDate;

    /** Date until which this relationship is valid */
    @Column(name = "end_date")
    private LocalDate endDate;

    /** Weight of this component in composite indicators */
    @Column(name = "weight")
    private Double weight;

    /** Statistical confidence level for this relationship */
    @Column(name = "confidence_level")
    private Double confidenceLevel;

    /** Additional notes or comments about the relationship */
    @Column(name = "notes", length = Integer.MAX_VALUE)
    private String notes;
}
