package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "thematic_classification")
public class ThematicClassification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "classification_name", length = Integer.MAX_VALUE)
    private String classificationName;

    @Column(name = "classification_type", length = Integer.MAX_VALUE)
    private String classificationType;  // e.g., "SDG", "Policy Initiative", "Government Program"

    @Column(name = "code", length = 50)
    private String code;  // e.g., "SDG 1", "SDG 1.1", "PMAY"

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "parent_id")
    private Integer parentId;  // For hierarchical classifications

    @Column(name = "start_year")
    private Integer startYear;

    @Column(name = "end_year")
    private Integer endYear;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "governing_body", length = Integer.MAX_VALUE)
    private String governingBody;  // e.g., "UN", "Ministry of Finance", "NITI Aayog"

    @Column(name = "reference_url", length = Integer.MAX_VALUE)
    private String referenceUrl;

    @Column(name = "icon_url", length = Integer.MAX_VALUE)
    private String iconUrl;

    @Column(name = "color_code", length = 20)
    private String colorCode;  // For visualization purposes
}