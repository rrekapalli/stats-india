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
@Table(name = "metric_category")
public class MetricCategory {
    @Id
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "category_name", length = Integer.MAX_VALUE)
    private String categoryName;

    @Column(name = "parent_id")
    private Integer parentId;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "uom_id")
    private Integer uomId;

}