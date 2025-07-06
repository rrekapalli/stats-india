package com.statsindia.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents a category for classifying metrics in the system.
 * This entity organizes metrics into hierarchical categories for better organization and navigation.
 * It supports parent-child relationships between categories and includes information about
 * the unit of measurement applicable to metrics in this category.
 */
@Getter
@Setter
@Entity
@Table(name = "metric_category")
public class MetricCategory {
    /** Unique identifier for the metric category */
    @Id
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Name of the metric category */
    @Column(name = "category_name", length = Integer.MAX_VALUE)
    private String categoryName;

    /** Reference to parent category for hierarchical category structures */
    @Column(name = "parent_id")
    private Integer parentId;

    /** Detailed description of the metric category and its scope */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Reference to the unit of measure applicable to metrics in this category */
    @Column(name = "uom_id")
    private Integer uomId;

}
