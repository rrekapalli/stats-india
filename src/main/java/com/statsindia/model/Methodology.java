package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Represents a methodology used for data collection and analysis in the system.
 * This entity stores information about the processes, formulas, and assumptions used
 * to collect and analyze statistical data. It includes version information, effective dates,
 * limitations, and approval details to ensure transparency and reproducibility.
 */
@Getter
@Setter
@Entity
@Table(name = "methodology")
public class Methodology {
    /** Unique identifier for the methodology */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Name of the methodology */
    @Column(name = "methodology_name", length = Integer.MAX_VALUE)
    private String methodologyName;

    /** Version number or identifier of the methodology */
    @Column(name = "version", length = 20)
    private String version;

    /** Date from which this methodology version is effective */
    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    /** Date until which this methodology version is effective */
    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    /** Detailed description of the methodology */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Description of the process used to collect data */
    @Column(name = "data_collection_process", length = Integer.MAX_VALUE)
    private String dataCollectionProcess;

    /** Formula or algorithm used for calculations in this methodology */
    @Column(name = "calculation_formula", length = Integer.MAX_VALUE)
    private String calculationFormula;

    /** Assumptions made in the methodology */
    @Column(name = "assumptions", length = Integer.MAX_VALUE)
    private String assumptions;

    /** Known limitations or constraints of the methodology */
    @Column(name = "limitations", length = Integer.MAX_VALUE)
    private String limitations;

    /** Notes about changes made in this version of the methodology */
    @Column(name = "change_notes", length = Integer.MAX_VALUE)
    private String changeNotes;

    /** References to documents that provide additional information about the methodology */
    @Column(name = "reference_documents", length = Integer.MAX_VALUE)
    private String referenceDocuments;

    /** Indicates whether this is the current active version of the methodology */
    @Column(name = "is_current")
    private Boolean isCurrent;

    /** Person, organization, or entity that approved this methodology */
    @Column(name = "approval_authority", length = Integer.MAX_VALUE)
    private String approvalAuthority;

    /** Date when this methodology was approved */
    @Column(name = "approval_date")
    private LocalDate approvalDate;

    /** How frequently this methodology should be reviewed (e.g., "Annual", "Biennial") */
    @Column(name = "review_frequency", length = Integer.MAX_VALUE)
    private String reviewFrequency;

    /** Date when this methodology is scheduled for its next review */
    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;
}
