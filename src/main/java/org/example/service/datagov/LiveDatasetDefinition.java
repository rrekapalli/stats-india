package org.example.service.datagov;

import org.example.dto.DimensionRole;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Static configuration for one data.gov.in resource ingested into SQLite. */
public record LiveDatasetDefinition(
        String resourceId,
        String title,
        String category,
        String sourceOrg,
        String description,
        String updateFrequency,
        LiveDatasetAggregationMode aggregationMode,
        String stateRecordField,
        String metricRecordField,
        String metricUnit,
        String yearRecordField,
        List<DatasetDimensionSpec> rowDimensions,
        List<UnpivotDimensionSpec> unpivotDimensions,
        Map<String, String> portalFieldByRecordField
) {

    public List<DatasetDimensionSpec> allDimensionSpecs() {
        return rowDimensions == null ? List.of() : rowDimensions;
    }

    public static LiveDatasetDefinition mcaCompanyMaster() {
        return new LiveDatasetDefinition(
                "4dbe5667-7b6b-41d7-82af-211562424d9a",
                "RoC-wise Company Master Data",
                "Companies",
                "Ministry of Corporate Affairs",
                "Registrar of Companies (RoC) company registrations by state, status, and industrial classification.",
                "Live (data.gov.in)",
                LiveDatasetAggregationMode.COUNT_ROWS,
                "companyStateCode",
                null,
                "companies",
                "registrationDate",
                List.of(
                        dim("state", "State / UT", DimensionRole.GEOGRAPHY, "companyStateCode", "state", "companies", 0),
                        dim("company-status", "Company status", DimensionRole.CATEGORICAL, "companyStatus", "status", "companies", 0),
                        dim("industry", "Industrial classification", DimensionRole.CATEGORICAL, "companyIndustrialClassification", "industry", "companies", 12),
                        dim("category", "Company category", DimensionRole.CATEGORICAL, "companyCategory", "category", "companies", 0)
                ),
                List.of(),
                portalFields(Map.ofEntries(
                        entry("cin", "CIN"),
                        entry("companyName", "CompanyName"),
                        entry("rocCode", "CompanyROCcode"),
                        entry("companyCategory", "CompanyCategory"),
                        entry("companySubCategory", "CompanySubCategory"),
                        entry("companyClass", "CompanyClass"),
                        entry("authorizedCapital", "AuthorizedCapital"),
                        entry("paidupCapital", "PaidupCapital"),
                        entry("registrationDate", "CompanyRegistrationdate_date"),
                        entry("registeredOfficeAddress", "Registered_Office_Address"),
                        entry("listingStatus", "Listingstatus"),
                        entry("companyStatus", "CompanyStatus"),
                        entry("companyStateCode", "CompanyStateCode"),
                        entry("companyOrigin", "CompanyIndian/Foreign Company"),
                        entry("nicCode", "nic_code"),
                        entry("companyIndustrialClassification", "CompanyIndustrialClassification")
                ))
        );
    }

    public static LiveDatasetDefinition roadAccidents() {
        return snapshot(
                "b5259c20-f9dd-41a0-a180-355100040c02",
                "Road Accidents & Fatalities",
                "Transport",
                "Ministry of Road Transport and Highways",
                "State/UT-wise road accidents and persons killed at level crossings (data.gov.in).",
                "Annual",
                "states_uts",
                "personsKilled",
                "fatalities",
                unpivot("accident-metrics", "Accident metrics", List.of(
                        col("totalRoadAccidents", "Road accidents"),
                        col("personsKilled", "Persons killed")
                ), "cases"),
                Map.of(
                        "state", "states_uts",
                        "totalRoadAccidents", "total_road_accidents",
                        "personsKilled", "persons_killed"
                )
        );
    }

    public static LiveDatasetDefinition censusPopulation() {
        return snapshot(
                "ce79f66f-f8ef-41c9-b6b6-caeba43e69dc",
                "Population Census 2011",
                "Demographics",
                "Office of the Registrar General & Census Commissioner",
                "State/UT-wise total population and Scheduled Caste / Tribe population (Census 2011).",
                "Decennial",
                "india_state_union_territories",
                "populationTotal2011",
                "persons",
                unpivot("population-group", "Population group", List.of(
                        col("populationTotal2011", "Total population"),
                        col("populationSc2011", "Scheduled Castes"),
                        col("populationSt2011", "Scheduled Tribes")
                ), "persons"),
                Map.of(
                        "state", "india_state_union_territories",
                        "populationTotal2011", "population___total___2011",
                        "populationSc2011", "population___scheduled_castes__sc____2011",
                        "populationSt2011", "population___scheduled_tribes__st____2011"
                )
        );
    }

    public static LiveDatasetDefinition registeredDeaths() {
        return snapshot(
                "4613cfaa-abc6-4af8-9e14-6a8778405f97",
                "Civil Registration: Deaths",
                "Demographics",
                "Office of the Registrar General & Census Commissioner",
                "State/UT-wise registered deaths and medically certified deaths (2019).",
                "Annual",
                "state_ut",
                "totalRegisteredDeaths",
                "deaths",
                unpivot("death-type", "Death registration", List.of(
                        col("totalRegisteredDeaths", "Total registered"),
                        col("medicallyCertifiedDeaths", "Medically certified")
                ), "deaths"),
                Map.of(
                        "state", "state_ut",
                        "totalRegisteredDeaths", "total_registered_deaths",
                        "medicallyCertifiedDeaths", "medically_certified_deaths__total_"
                )
        );
    }

    public static LiveDatasetDefinition judicialCases() {
        return snapshot(
                "a0971d87-d02e-4ac5-b109-a72e2c46dd0c",
                "Judicial Case Pendency",
                "Law & Justice",
                "Department of Justice / eCourts",
                "Cases pending in lower judiciary by state (civil, criminal, total) as on 15-12-2022.",
                "Quarterly",
                "state_uts",
                "totalCases",
                "cases",
                unpivot("case-type", "Case type", List.of(
                        col("civilCases", "Civil cases"),
                        col("criminalCases", "Criminal cases"),
                        col("totalCases", "Total pending")
                ), "cases"),
                Map.of(
                        "state", "state_uts",
                        "civilCases", "civil_cases",
                        "criminalCases", "criminal_cases",
                        "totalCases", "_total"
                )
        );
    }

    public static LiveDatasetDefinition cropProduction() {
        return new LiveDatasetDefinition(
                "35be999b-0208-4354-b557-f6ca9a5355de",
                "Crop Production Statistics",
                "Agriculture",
                "Ministry of Agriculture & Farmers Welfare",
                "District-wise, season-wise crop area and production from data.gov.in.",
                "Annual",
                LiveDatasetAggregationMode.SUM_METRIC,
                "stateName",
                "production",
                "000 MT",
                "cropYear",
                List.of(
                        dim("state", "State / UT", DimensionRole.GEOGRAPHY, "stateName", "state", "000 MT", 0),
                        dim("season", "Season", DimensionRole.CATEGORICAL, "season", "season", "000 MT", 8),
                        dim("crop", "Crop", DimensionRole.CATEGORICAL, "crop", "crop", "000 MT", 12)
                ),
                List.of(),
                Map.of(
                        "stateName", "state_name",
                        "districtName", "district_name",
                        "cropYear", "crop_year",
                        "season", "season",
                        "crop", "crop",
                        "area", "area_",
                        "production", "production_"
                )
        );
    }

    public static LiveDatasetDefinition healthFacilities() {
        return snapshot(
                "06a11146-1e39-433a-9f01-3c6fb75d8328",
                "Health Infrastructure",
                "Health",
                "Ministry of Health & Family Welfare",
                "Sub-divisional, district hospitals and mobile medical units by state (2016).",
                "Annual",
                "state_ut",
                "districtHospitals",
                "facilities",
                unpivot("facility-type", "Facility type", List.of(
                        col("subDivisionalHospitals", "Sub-divisional hospitals"),
                        col("districtHospitals", "District hospitals"),
                        col("mobileMedicalUnits", "Mobile medical units")
                ), "facilities"),
                Map.of(
                        "state", "state_ut",
                        "subDivisionalHospitals", "sub_divisional_hospital_sdh___as_on_31st_march_2016",
                        "districtHospitals", "district_hospital_dh___as_on_31st_march_2016",
                        "mobileMedicalUnits", "mobile_medical_units_mmu___as_on_31st_march_2016"
                )
        );
    }

    public static LiveDatasetDefinition educationEnrollment() {
        return snapshot(
                "c9dd07c3-cece-4eb1-91d5-c931b41b115c",
                "School Education GER",
                "Education",
                "Ministry of Education",
                "Gross enrolment ratio (GER) by state for 2021-22 (all, male, female).",
                "Annual",
                "state_ut_wise",
                "gerBoth",
                "percent",
                unpivot("ger-sex", "GER by sex", List.of(
                        col("gerMale", "Male GER"),
                        col("gerFemale", "Female GER"),
                        col("gerBoth", "Overall GER")
                ), "percent"),
                Map.of(
                        "state", "state_ut_wise",
                        "gerMale", "all_male",
                        "gerFemale", "all_female",
                        "gerBoth", "both"
                )
        );
    }

    public static LiveDatasetDefinition renewableEnergy() {
        return snapshot(
                "a2f1d2dc-3852-40e9-9258-5e4ff4cec98f",
                "Renewable Energy Capacity",
                "Energy",
                "Ministry of New and Renewable Energy",
                "Grid-interactive renewable installed capacity by state (MW).",
                "Monthly",
                "state_ut_wise",
                "totalCapacityMw",
                "MW",
                unpivot("renewable-source", "Renewable source", List.of(
                        col("smallHydroMw", "Small hydro"),
                        col("windMw", "Wind"),
                        col("bioMw", "Biomass"),
                        col("solarMw", "Solar"),
                        col("totalCapacityMw", "Total capacity")
                ), "MW"),
                Map.of(
                        "state", "state_ut_wise",
                        "smallHydroMw", "small_hydro_power____megawatt_",
                        "windMw", "wind_power____megawatt_",
                        "bioMw", "bio_power____megawatt_",
                        "solarMw", "solar_power____megawatt_",
                        "totalCapacityMw", "total_capacity____megawatt_"
                )
        );
    }

    private static LiveDatasetDefinition snapshot(
            String resourceId,
            String title,
            String category,
            String sourceOrg,
            String description,
            String updateFrequency,
            String statePortalField,
            String metricRecordField,
            String metricUnit,
            UnpivotDimensionSpec unpivot,
            Map<String, String> fields
    ) {
        Map<String, String> portalFields = new LinkedHashMap<>(fields);
        portalFields.putIfAbsent("state", statePortalField);
        return new LiveDatasetDefinition(
                resourceId,
                title,
                category,
                sourceOrg,
                description,
                updateFrequency,
                LiveDatasetAggregationMode.STATE_SNAPSHOT,
                "state",
                metricRecordField,
                metricUnit,
                null,
                List.of(),
                List.of(unpivot),
                portalFields
        );
    }

    private static UnpivotDimensionSpec unpivot(
            String id,
            String label,
            List<UnpivotColumn> columns,
            String unit
    ) {
        return new UnpivotDimensionSpec(id, label, DimensionRole.CATEGORICAL, columns, unit);
    }

    private static UnpivotColumn col(String field, String label) {
        return new UnpivotColumn(field, label);
    }

    private static DatasetDimensionSpec dim(
            String id,
            String label,
            DimensionRole role,
            String sourceField,
            String aggregateKey,
            String countUnit,
            int displayLimit
    ) {
        return new DatasetDimensionSpec(
                id,
                label,
                role,
                sourceField,
                aggregateKey,
                role == DimensionRole.GEOGRAPHY
                        ? IndianStateNormalizer::normalize
                        : IndianStateNormalizer::normalizeLabel,
                countUnit,
                displayLimit
        );
    }

    private static Map.Entry<String, String> entry(String recordField, String portalField) {
        return Map.entry(recordField, portalField);
    }

    private static Map<String, String> portalFields(Map<String, String> fields) {
        return fields;
    }
}
