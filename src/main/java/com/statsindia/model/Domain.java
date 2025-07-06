package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents a domain or subject area in the system.
 * This entity categorizes statistical data into different subject areas or domains.
 * It supports a hierarchical structure through parent-child relationships, allowing for
 * representation of domain hierarchies and sub-domains.
 */
@Getter
@Setter
@Entity
@Table(name = "domain")
public class Domain {
    /** Unique identifier for the domain */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Name of the domain or subject area */
    @Column(name = "domain_name", length = Integer.MAX_VALUE)
    private String domainName;

    /** Detailed description of the domain and its scope */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Reference to parent domain for hierarchical domain structures */
    @Column(name = "parent_id")
    private Integer parentId;

}
