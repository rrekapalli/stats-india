package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "domain")
public class Domain {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "domain_name", length = Integer.MAX_VALUE)
    private String domainName;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "parent_id")
    private Integer parentId;

}