package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents a geographical location in the system.
 * This entity stores information about various types of locations including states, districts, cities, etc.
 * It includes geographical coordinates, boundary information, and various identification codes.
 */
@Getter
@Setter
@Entity
@Table(name = "location")
public class Location {
    /** Unique identifier for the location */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Type of location (e.g., state, district, city, village) */
    @Column(name = "location_type", length = Integer.MAX_VALUE)
    private String locationType;

    /** Name of the location */
    @Column(name = "name", length = Integer.MAX_VALUE)
    private String name;

    /** Detailed description of the location */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Latitude coordinate of the location */
    @Column(name = "lat")
    private Double lat;

    /** Longitude coordinate of the location */
    @Column(name = "lan")
    private Double lan;

    /** Digital PIN code or unique identifier for the location */
    @Column(name = "digipin", length = Integer.MAX_VALUE)
    private String digipin;

    /** Official location code used by government or administrative systems */
    @Column(name = "location_code", length = Integer.MAX_VALUE)
    private String locationCode;

    /** Secondary or sub-level location code */
    @Column(name = "location_sub_code", length = Integer.MAX_VALUE)
    private String locationSubCode;

    /** Electoral constituency code for the location */
    @Column(name = "electoral_code", length = Integer.MAX_VALUE)
    private String electoralCode;

    /** Postal or ZIP code for the location */
    @Column(name = "postal_code", length = Integer.MAX_VALUE)
    private String postalCode;

    // Geospatial enhancements
    /** GeoJSON format representation of the location's boundary as a polygon */
    @Column(name = "polygon_boundary", length = Integer.MAX_VALUE)
    private String polygonBoundary;

    /** Classification of the location as urban, rural, or semi-urban */
    @Column(name = "urban_rural_classification", length = 20)
    private String urbanRuralClassification;

    /** Population density measured in people per square kilometer */
    @Column(name = "population_density")
    private Double populationDensity;

    /** Total area of the location in square kilometers */
    @Column(name = "area_sq_km")
    private Double areaSqKm;

    /** Elevation of the location above sea level in meters */
    @Column(name = "elevation_meters")
    private Double elevationMeters;

    /** GeoJSON format representation of the location's rectangular bounding box */
    @Column(name = "bounding_box", length = Integer.MAX_VALUE)
    private String boundingBox;

    /** GeoJSON format representation of the location's central point */
    @Column(name = "centroid", length = Integer.MAX_VALUE)
    private String centroid;

    /** External Geographic Information System identifier for integration with other GIS platforms */
    @Column(name = "gis_identifier", length = Integer.MAX_VALUE)
    private String gisIdentifier;
}
