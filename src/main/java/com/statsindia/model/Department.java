package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents a government department or organizational unit in the system.
 * This entity stores information about departments that produce or manage statistical data.
 * It supports a hierarchical structure through parent-child relationships, allowing for
 * representation of organizational hierarchies and departmental structures.
 */
@Getter
@Setter
@Entity
@Table(name = "department")
public class Department {

    /** Unique identifier for the department */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Name of the department or organizational unit */
    @Column(name = "department_name", length = Integer.MAX_VALUE)
    private String departmentName;

    /** Detailed description of the department's role and responsibilities */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Reference to parent department for hierarchical organizational structures */
    @Column(name = "parent_id")
    private Integer parentId;
}
