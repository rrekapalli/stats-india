package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_visualization")
public class UserVisualization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "visualization_name", length = Integer.MAX_VALUE)
    private String visualizationName;

    @Column(name = "visualization_type", length = Integer.MAX_VALUE)
    private String visualizationType;  // e.g., "Dashboard", "Chart", "Map", "Table", "Custom View"

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "configuration", length = Integer.MAX_VALUE)
    private String configuration;  // JSON configuration for the visualization

    @Column(name = "filters", length = Integer.MAX_VALUE)
    private String filters;  // JSON representation of applied filters

    @Column(name = "metrics_included", length = Integer.MAX_VALUE)
    private String metricsIncluded;  // Comma-separated list of metric IDs or JSON array

    @Column(name = "is_public")
    private Boolean isPublic;

    @Column(name = "is_featured")
    private Boolean isFeatured;

    @Column(name = "created_by", length = Integer.MAX_VALUE)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = Integer.MAX_VALUE)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_viewed_at")
    private LocalDateTime lastViewedAt;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "thumbnail_url", length = Integer.MAX_VALUE)
    private String thumbnailUrl;

    @Column(name = "annotations", length = Integer.MAX_VALUE)
    private String annotations;  // JSON array of annotations on the visualization

    @Column(name = "insights", length = Integer.MAX_VALUE)
    private String insights;  // Auto-generated or user-added insights about the data
}