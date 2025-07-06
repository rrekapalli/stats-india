package com.statsindia.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "jurisdiction")
public class Jurisdiction {
    @Id
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "jurisdiction_name", length = Integer.MAX_VALUE)
    private String jurisdictionName;

    @Column(name = "jurisdiction_type", length = Integer.MAX_VALUE)
    private String jurisdictionType;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "governing_authority", length = Integer.MAX_VALUE)
    private String governingAuthority;

}