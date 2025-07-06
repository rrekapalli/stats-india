package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents demographic information in the system.
 * This entity stores categorized population data such as age groups, gender, income levels,
 * and education levels. It includes population counts, percentages, and reference years
 * to support demographic analysis and segmentation of statistical data.
 */
@Getter
@Setter
@Entity
@Table(name = "demographic")
public class Demographic {
    /** Unique identifier for the demographic category */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Type of demographic category (e.g., "Age Group", "Gender", "Income Level", "Education Level") */
    @Column(name = "category", length = Integer.MAX_VALUE)
    private String category;

    /** Specific value within the category (e.g., "18-25", "Male", "Middle Income", "Graduate") */
    @Column(name = "value", length = Integer.MAX_VALUE)
    private String value;

    /** Detailed description of this demographic category and value */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Number of people in this demographic category */
    @Column(name = "population_count")
    private Long populationCount;

    /** Percentage of total population in this demographic category */
    @Column(name = "population_percentage")
    private Double populationPercentage;

    /** Year to which this demographic data refers */
    @Column(name = "reference_year")
    private Integer referenceYear;

    /** Indicates whether this is a standard demographic category used across the system */
    @Column(name = "is_standard")
    private Boolean isStandard;

    /** Reference to parent demographic category for hierarchical relationships */
    @Column(name = "parent_id")
    private Integer parentId;
}
