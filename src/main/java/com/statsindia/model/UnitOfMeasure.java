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
@Table(name = "unit_of_measure")
public class UnitOfMeasure {
    @Id
    @Column(name = "id", nullable = false)
    private Integer id;

    @Column(name = "uom_name", length = Integer.MAX_VALUE)
    private String uomName;

    @Column(name = "measuring_units", length = Integer.MAX_VALUE)
    private String measuringUnits;

    @Column(name = "uom_data_type", length = Integer.MAX_VALUE)
    private String uomDataType;

    @Column(name = "denomination", length = Integer.MAX_VALUE)
    private String denomination;

}