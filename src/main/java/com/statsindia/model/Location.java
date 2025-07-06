package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "location")
public class Location {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "location_type", length = Integer.MAX_VALUE)
    private String locationType;

    @Column(name = "name", length = Integer.MAX_VALUE)
    private String name;

    @Column(name = "lat")
    private Double lat;

    @Column(name = "lan")
    private Double lan;

    @Column(name = "digipin", length = Integer.MAX_VALUE)
    private String digipin;

    @Column(name = "location_code", length = Integer.MAX_VALUE)
    private String locationCode;

    @Column(name = "location_sub_code", length = Integer.MAX_VALUE)
    private String locationSubCode;

    @Column(name = "electoral_code", length = Integer.MAX_VALUE)
    private String electoralCode;

    @Column(name = "postal_code", length = Integer.MAX_VALUE)
    private String postalCode;

}