package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a data source in the system.
 * This entity stores information about the origin of statistical data, including the source name,
 * organization, contact information, and update frequency.
 * It also includes metadata about the data format, licensing, and reliability of the source.
 */
@Getter
@Setter
@Entity
@Table(name = "data_source")
public class DataSource {
    /** Unique identifier for the data source */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Name of the data source */
    @Column(name = "source_name", length = Integer.MAX_VALUE)
    private String sourceName;

    /** Type of data source (e.g., "Government Agency", "Survey", "Census", "External API", "Research Study") */
    @Column(name = "source_type", length = Integer.MAX_VALUE)
    private String sourceType;

    /** Organization or entity that provides or maintains the data source */
    @Column(name = "organization", length = Integer.MAX_VALUE)
    private String organization;

    /** Detailed description of the data source and its contents */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** URL or web address where the data source can be accessed */
    @Column(name = "url", length = Integer.MAX_VALUE)
    private String url;

    /** Contact information for inquiries about the data source */
    @Column(name = "contact_info", length = Integer.MAX_VALUE)
    private String contactInfo;

    /** How frequently the data source is updated (e.g., "Daily", "Monthly", "Quarterly", "Annually") */
    @Column(name = "update_frequency", length = Integer.MAX_VALUE)
    private String updateFrequency;

    /** Date and time when the data source was last updated */
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    /** Date when the next update to the data source is expected */
    @Column(name = "next_update_expected")
    private LocalDate nextUpdateExpected;

    /** Format of the data (e.g., "CSV", "JSON", "XML", "API") */
    @Column(name = "data_format", length = Integer.MAX_VALUE)
    private String dataFormat;

    /** Type of license under which the data is published */
    @Column(name = "license_type", length = Integer.MAX_VALUE)
    private String licenseType;

    /** URL to the full license text or details */
    @Column(name = "license_url", length = Integer.MAX_VALUE)
    private String licenseUrl;

    /** Recommended citation format for referencing this data source */
    @Column(name = "citation", length = Integer.MAX_VALUE)
    private String citation;

    /** Score indicating the reliability of the data source (typically on a scale from 0.0 to 1.0) */
    @Column(name = "reliability_score")
    private Double reliabilityScore;

    /** Method used to integrate data from this source (e.g., "Manual Upload", "API", "Scheduled Import") */
    @Column(name = "integration_method", length = Integer.MAX_VALUE)
    private String integrationMethod;

    /** Indicates whether an API key is required to access this data source */
    @Column(name = "api_key_required")
    private Boolean apiKeyRequired;

    /** Details about authentication requirements for accessing the data source */
    @Column(name = "authentication_details", length = Integer.MAX_VALUE)
    private String authenticationDetails;

    /** Additional notes or comments about the data source */
    @Column(name = "notes", length = Integer.MAX_VALUE)
    private String notes;
}
