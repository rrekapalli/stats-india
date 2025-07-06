package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "metric")
public class Metric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "metric_name", length = Integer.MAX_VALUE)
    private String metricName;

    @Column(name = "metric_value")
    private Double metricValue;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Column(name = "comments", length = Integer.MAX_VALUE)
    private String comments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "domain_id")
    private Domain domain;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jurisdiction_id")
    private Jurisdiction jurisdiction;

    @Column(name = "time_period_from")
    private LocalDate timePeriodFrom;

    @Column(name = "time_period_to")
    private LocalDate timePeriodTo;

/*
 TODO [Reverse Engineering] create field to map the 'time_period' column
 Available actions: Define target Java type | Uncomment as is | Remove column mapping
    @Column(name = "time_period", columnDefinition = "daterange")
    private Object timePeriod;
*/
}