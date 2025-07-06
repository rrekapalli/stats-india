package com.statsindia.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Represents a time dimension in the system.
 * This entity stores detailed temporal information for time-based analysis of statistical data.
 * It includes various time granularities (year, quarter, month, week, day) and special time attributes
 * like holidays, weekends, and fiscal periods to support comprehensive time-series analysis.
 */
@Getter
@Setter
@Entity
@Table(name = "time_dimension")
public class TimeDimension {
    /** Unique identifier for the time dimension record */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    /** Detailed description of this time dimension record */
    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    /** Complete date in the time dimension */
    @Column(name = "full_date")
    private LocalDate fullDate;

    /** Year component of the date (e.g., 2023) */
    @Column(name = "year")
    private Integer year;

    /** Quarter of the year (1-4) */
    @Column(name = "quarter")
    private Integer quarter;

    /** Month of the year (1-12) */
    @Column(name = "month")
    private Integer month;

    /** Name of the month (e.g., "January", "February") */
    @Column(name = "month_name", length = 20)
    private String monthName;

    /** Week number within the year (1-53) */
    @Column(name = "week_of_year")
    private Integer weekOfYear;

    /** Day of the month (1-31) */
    @Column(name = "day_of_month")
    private Integer dayOfMonth;

    /** Day of the week (1-7, typically 1=Monday, 7=Sunday) */
    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    /** Name of the day (e.g., "Monday", "Tuesday") */
    @Column(name = "day_name", length = 20)
    private String dayName;

    /** Indicates whether this date falls on a weekend */
    @Column(name = "is_weekend")
    private Boolean isWeekend;

    /** Indicates whether this date is a holiday */
    @Column(name = "is_holiday")
    private Boolean isHoliday;

    /** Name of the holiday if this date is a holiday */
    @Column(name = "holiday_name", length = Integer.MAX_VALUE)
    private String holidayName;

    /** Fiscal year to which this date belongs (may differ from calendar year) */
    @Column(name = "fiscal_year")
    private Integer fiscalYear;

    /** Fiscal quarter to which this date belongs (1-4) */
    @Column(name = "fiscal_quarter")
    private Integer fiscalQuarter;

    /** Fiscal month to which this date belongs (1-12) */
    @Column(name = "fiscal_month")
    private Integer fiscalMonth;

    /** Season in which this date falls (e.g., "Spring", "Summer", "Autumn", "Winter") */
    @Column(name = "season", length = 20)
    private String season;

    /** Indicates whether this date is the last day of its month */
    @Column(name = "is_last_day_of_month")
    private Boolean isLastDayOfMonth;

    /** Indicates whether this date is the last day of its quarter */
    @Column(name = "is_last_day_of_quarter")
    private Boolean isLastDayOfQuarter;

    /** Indicates whether this date is the last day of its year */
    @Column(name = "is_last_day_of_year")
    private Boolean isLastDayOfYear;
}
