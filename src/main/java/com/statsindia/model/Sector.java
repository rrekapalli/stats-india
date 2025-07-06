package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents an economic or social sector in the system.
 * This entity categorizes statistical data into different sectors such as agriculture,
 * education, healthcare, or industry. It supports a hierarchical structure through
 * parent-child relationships, allowing for representation of sector hierarchies and sub-sectors.
 */
@Getter
@Setter
@Entity
@Table(name = "sector")
public class Sector {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "sector_name", length = Integer.MAX_VALUE)
    private String sectorName;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "parent_id")
    private Integer parentId;

}
