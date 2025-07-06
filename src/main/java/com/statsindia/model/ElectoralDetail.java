package com.statsindia.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents electoral information in the system.
 * This entity stores details related to electoral constituencies, voting patterns,
 * and other election-related data. It helps in analyzing and visualizing
 * electoral statistics across different regions.
 */
@Getter
@Setter
@Entity
@Table(name = "electoral_details")
public class ElectoralDetail {
    /** Unique identifier for the electoral detail record */
    @Id
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Name of the electoral constituency or electoral detail */
    @Column(name = "name", length = Integer.MAX_VALUE)
    private String name;

    /** Detailed description of the electoral information */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Additional comments or notes about the electoral detail */
    @Column(name = "comments", length = Integer.MAX_VALUE)
    private String comments;

}
