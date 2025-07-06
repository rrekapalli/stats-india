package com.statsindia.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents a jurisdiction or administrative area in the system.
 * This entity stores information about different types of jurisdictions such as
 * national, state, district, or municipal levels. It includes details about the
 * governing authority and administrative boundaries for statistical data organization.
 */
@Getter
@Setter
@Entity
@Table(name = "jurisdiction")
public class Jurisdiction {
    /** Unique identifier for the jurisdiction */
    @Id
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Name of the jurisdiction or administrative area */
    @Column(name = "jurisdiction_name", length = Integer.MAX_VALUE)
    private String jurisdictionName;

    /** Type of jurisdiction (e.g., "National", "State", "District", "Municipal") */
    @Column(name = "jurisdiction_type", length = Integer.MAX_VALUE)
    private String jurisdictionType;

    /** Detailed description of the jurisdiction and its boundaries */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Authority or body that governs this jurisdiction */
    @Column(name = "governing_authority", length = Integer.MAX_VALUE)
    private String governingAuthority;

}
