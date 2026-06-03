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

    // --- Tier 1 additions ---------------------------------------------------

    public static LiveDatasetDefinition crimeAgainstWomen() {
        return snapshot(
                "ac95763a-ce69-4559-9159-e08400cb5250",
                "Crime Against Women (2017–2021)",
                "Law & Justice",
                "National Crime Records Bureau",
                "State/UT-wise reported crimes against women, 2017 to 2021.",
                "Annual",
                "state_ut",
                "y2021",
                "cases",
                unpivot("year", "Year", List.of(
                        col("y2017", "2017"),
                        col("y2018", "2018"),
                        col("y2019", "2019"),
                        col("y2020", "2020"),
                        col("y2021", "2021")
                ), "cases"),
                Map.of(
                        "state", "state_ut",
                        "y2017", "_2017",
                        "y2018", "_2018",
                        "y2019", "_2019",
                        "y2020", "_2020",
                        "y2021", "_2021"
                )
        );
    }

    public static LiveDatasetDefinition crimeAgainstScSt() {
        return snapshot(
                "8fa9c773-148e-40ea-8cd0-3cbc56a63b9e",
                "Crime Against SC/ST (2017–2021)",
                "Law & Justice",
                "National Crime Records Bureau",
                "State/UT-wise reported crimes against Scheduled Castes and Scheduled Tribes, 2017–2021.",
                "Annual",
                "state_ut",
                "y2021",
                "cases",
                unpivot("year", "Year", List.of(
                        col("y2017", "2017"),
                        col("y2018", "2018"),
                        col("y2019", "2019"),
                        col("y2020", "2020"),
                        col("y2021", "2021")
                ), "cases"),
                Map.of(
                        "state", "state_ut",
                        "y2017", "_2017",
                        "y2018", "_2018",
                        "y2019", "_2019",
                        "y2020", "_2020",
                        "y2021", "_2021"
                )
        );
    }

    public static LiveDatasetDefinition dowryDeaths() {
        return snapshot(
                "401dafd7-0709-46ee-8ca3-b43969c8c338",
                "Dowry Deaths (2017–2021)",
                "Law & Justice",
                "National Crime Records Bureau",
                "State/UT-wise dowry death cases registered, 2017–2021.",
                "Annual",
                "state_ut",
                "y2021",
                "deaths",
                unpivot("year", "Year", List.of(
                        col("y2017", "2017"),
                        col("y2018", "2018"),
                        col("y2019", "2019"),
                        col("y2020", "2020"),
                        col("y2021", "2021")
                ), "deaths"),
                Map.of(
                        "state", "state_ut",
                        "y2017", "_2017",
                        "y2018", "_2018",
                        "y2019", "_2019",
                        "y2020", "_2020",
                        "y2021", "_2021"
                )
        );
    }

    public static LiveDatasetDefinition civilCasesPending() {
        return snapshot(
                "4f34aa0d-0bca-46c3-a447-02e9b3442d61",
                "Civil Cases Pending (2018–2022)",
                "Law & Justice",
                "Department of Justice",
                "Civil cases pending in subordinate courts by state, 2018 to 2022.",
                "Annual",
                "states_uts",
                "y2022",
                "cases",
                unpivot("year", "Year", List.of(
                        col("y2018", "2018"),
                        col("y2019", "2019"),
                        col("y2020", "2020"),
                        col("y2021", "2021"),
                        col("y2022", "2022")
                ), "cases"),
                Map.of(
                        "state", "states_uts",
                        "y2018", "total_number_of_pending_cases__civil____2018",
                        "y2019", "total_number_of_pending_cases__civil____2019",
                        "y2020", "total_number_of_pending_cases__civil____2020",
                        "y2021", "total_number_of_pending_cases__civil____2021",
                        "y2022", "total_number_of_pending_cases__civil____2022"
                )
        );
    }

    public static LiveDatasetDefinition forestCover() {
        return snapshot(
                "9ff6448f-911a-4e22-ad8c-cc2310231f83",
                "Forest & Tree Cover (ISFR 2015–2019)",
                "Environment",
                "Forest Survey of India",
                "State/UT-wise forest and tree cover (sq. km), India State of Forest Reports 2015, 2017, 2019.",
                "Biennial",
                "state_ut",
                "isfr2019",
                "sq km",
                unpivot("year", "ISFR year", List.of(
                        col("isfr2015", "ISFR 2015"),
                        col("isfr2017", "ISFR 2017"),
                        col("isfr2019", "ISFR 2019")
                ), "sq km"),
                Map.of(
                        "state", "state_ut",
                        "isfr2015", "forest_cover_and_tree_cover__in_square_kilometre____isfr_2015",
                        "isfr2017", "forest_cover_and_tree_cover__in_square_kilometre____isfr_2017",
                        "isfr2019", "forest_cover_and_tree_cover__in_square_kilometre____isfr_2019"
                )
        );
    }

    public static LiveDatasetDefinition forestChange() {
        return snapshot(
                "e02a2162-13ad-4254-a7e0-dbc67c230059",
                "Change in Forest Cover (2017–2021)",
                "Environment",
                "Forest Survey of India",
                "State/UT-wise forest cover snapshots from ISFR 2017, 2019, 2021 with biennial change.",
                "Biennial",
                "states_uts",
                "isfr2021",
                "sq km",
                unpivot("year", "Forest cover", List.of(
                        col("isfr2017", "ISFR 2017"),
                        col("isfr2019", "ISFR 2019"),
                        col("isfr2021", "ISFR 2021"),
                        col("change2017to2019", "Change 2017→2019"),
                        col("change2019to2021", "Change 2019→2021")
                ), "sq km"),
                Map.ofEntries(
                        entry("state", "states_uts"),
                        entry("isfr2017", "forest_cover___isfr_2017___col___a_"),
                        entry("isfr2019", "forest_cover___isfr_2019___col___b_"),
                        entry("isfr2021", "forest_cover___isfr_2021___col___c_"),
                        entry("change2017to2019", "change_in_forest___cover_between_isfr_2017___isfr_2019_col___b_a_"),
                        entry("change2019to2021", "change_in_forest_cover_between_isfr_2019___isfr_2021_col___c_b_")
                )
        );
    }

    public static LiveDatasetDefinition literacyHistorical() {
        return snapshot(
                "4462bd51-65e5-44c1-a4f0-7cd22a51925c",
                "Literacy Rate (1951–2011)",
                "Education",
                "Office of the Registrar General & Census Commissioner",
                "State/UT-wise literacy rate across census decades 1951 through 2011.",
                "Decennial",
                "state_uts",
                "y2011",
                "percent",
                unpivot("year", "Census year", List.of(
                        col("y1951", "1951"),
                        col("y1961", "1961"),
                        col("y1971", "1971"),
                        col("y1981", "1981"),
                        col("y1991", "1991"),
                        col("y2001", "2001"),
                        col("y2011", "2011")
                ), "percent"),
                Map.ofEntries(
                        entry("state", "state_uts"),
                        entry("y1951", "_1951"),
                        entry("y1961", "_1961"),
                        entry("y1971", "_1971"),
                        entry("y1981", "_1981"),
                        entry("y1991", "_1991"),
                        entry("y2001", "_2001"),
                        entry("y2011", "_2011")
                )
        );
    }

    public static LiveDatasetDefinition ruralLiteracy() {
        return snapshot(
                "ebb33c4b-ed21-4f69-8896-571b55523447",
                "Rural Literacy (2019–2024)",
                "Education",
                "Ministry of Education",
                "State/UT-wise rural literacy rate, 2019-20 through 2023-24.",
                "Annual",
                "state_ut",
                "y2023_24",
                "percent",
                unpivot("year", "Year", List.of(
                        col("y2019_20", "2019-20"),
                        col("y2020_21", "2020-21"),
                        col("y2021_22", "2021-22"),
                        col("y2022_23", "2022-23"),
                        col("y2023_24", "2023-24")
                ), "percent"),
                Map.of(
                        "state", "state_ut",
                        "y2019_20", "_2019_20",
                        "y2020_21", "_2020_21",
                        "y2021_22", "_2021_22",
                        "y2022_23", "_2022_23",
                        "y2023_24", "_2023_24"
                )
        );
    }

    public static LiveDatasetDefinition secondaryGer() {
        return snapshot(
                "5f65b654-230c-4fac-9821-4795e6d7a0d9",
                "Secondary & Higher Secondary GER (2014-15)",
                "Education",
                "Ministry of Education",
                "Gross Enrolment Ratio at secondary and higher-secondary level by state (2014-15), all categories.",
                "Annual",
                "states_uts_",
                "secTotal",
                "percent",
                unpivot("level", "Level / sex", List.of(
                        col("secBoys", "Secondary - Boys"),
                        col("secGirls", "Secondary - Girls"),
                        col("secTotal", "Secondary - Total"),
                        col("hrSecBoys", "Higher Sec - Boys"),
                        col("hrSecGirls", "Higher Sec - Girls"),
                        col("hrSecTotal", "Higher Sec - Total")
                ), "percent"),
                Map.ofEntries(
                        entry("state", "states_uts_"),
                        entry("secBoys", "gross_enrollment_ratio__ger__secondary_2014_15___all_categories___boys"),
                        entry("secGirls", "gross_enrollment_ratio__ger__secondary_2014_15___all_categories___girls"),
                        entry("secTotal", "gross_enrollment_ratio__ger__secondary_2014_15___all_categories___total"),
                        entry("hrSecBoys", "gross_enrollment_ratio__ger__hr__secondary_2014_15___all_categories___boys"),
                        entry("hrSecGirls", "gross_enrollment_ratio__ger__hr__secondary_2014_15___all_categories___girls"),
                        entry("hrSecTotal", "gross_enrollment_ratio__ger__hr__secondary_2014_15___all_categories___total")
                )
        );
    }

    public static LiveDatasetDefinition stStudentEnrolment() {
        return snapshot(
                "b0a93318-eb29-4325-bde8-c51ecc84f5ea",
                "ST Student Enrolment (I-XII)",
                "Education",
                "Ministry of Education",
                "Scheduled Tribe student enrolment in classes I to XII by state/UT.",
                "Annual",
                "state_ut",
                "stStudents",
                "students",
                unpivot("metric", "Metric", List.of(
                        col("stStudents", "ST students enrolled (I-XII)")
                ), "students"),
                Map.of(
                        "state", "state_ut",
                        "stStudents", "st_students_enrolled__i_xii_"
                )
        );
    }

    public static LiveDatasetDefinition dengue() {
        return snapshot(
                "bbfa6042-ec2e-4c28-8135-6fc7b3e4c39c",
                "Dengue Cases (2018–2021)",
                "Health",
                "Ministry of Health & Family Welfare (NVBDCP)",
                "State/UT-wise reported dengue cases by year, 2018 to 2021 (provisional).",
                "Annual",
                "state_ut",
                "y2021",
                "cases",
                unpivot("year", "Year", List.of(
                        col("y2018", "2018"),
                        col("y2019", "2019"),
                        col("y2020", "2020"),
                        col("y2021", "2021 (Nov)")
                ), "cases"),
                Map.of(
                        "state", "state_ut",
                        "y2018", "_2018___cases",
                        "y2019", "__2019___cases",
                        "y2020", "_2020___cases",
                        "y2021", "_2021_prov_till_21st_nov___cases"
                )
        );
    }

    public static LiveDatasetDefinition malaria() {
        return snapshot(
                "32232367-a7b6-46cd-a33e-17b0283c733b",
                "Malaria Cases (2018–2021)",
                "Health",
                "Ministry of Health & Family Welfare (NVBDCP)",
                "State/UT-wise malaria cases by year, 2018 to 2021 (October provisional).",
                "Annual",
                "state_ut",
                "y2021",
                "cases",
                unpivot("year", "Year", List.of(
                        col("y2018", "2018"),
                        col("y2019", "2019"),
                        col("y2020", "2020"),
                        col("y2021", "2021 (Oct)")
                ), "cases"),
                Map.of(
                        "state", "state_ut",
                        "y2018", "_2018",
                        "y2019", "_2019",
                        "y2020", "_2020",
                        "y2021", "_2021___till_october_"
                )
        );
    }

    public static LiveDatasetDefinition tbNotifications() {
        return snapshot(
                "e592c160-55ce-42f4-9507-5d3aa875dcd4",
                "TB Notifications (2020–2023)",
                "Health",
                "Central TB Division",
                "State/UT-wise tuberculosis case notifications, 2020 to 2023.",
                "Annual",
                "state_ut",
                "y2023",
                "notifications",
                unpivot("year", "Year", List.of(
                        col("y2020", "2020"),
                        col("y2021", "2021"),
                        col("y2022", "2022"),
                        col("y2023", "2023")
                ), "notifications"),
                Map.of(
                        "state", "state_ut",
                        "y2020", "_2020",
                        "y2021", "_2021",
                        "y2022", "_2022",
                        "y2023", "_2023"
                )
        );
    }

    public static LiveDatasetDefinition infantMortality() {
        return snapshot(
                "10c40a69-4bf1-4243-a8a5-b9bb68cf4320",
                "Infant Mortality Rate (2011)",
                "Health",
                "Office of the Registrar General",
                "State/UT-wise infant mortality rate (per 1000 live births), Total / Rural / Urban (2011).",
                "Annual",
                "state_ut",
                "imrTotal",
                "per 1000",
                unpivot("split", "Split", List.of(
                        col("imrTotal", "Total"),
                        col("imrRural", "Rural"),
                        col("imrUrban", "Urban")
                ), "per 1000"),
                Map.of(
                        "state", "state_ut",
                        "imrTotal", "infant_mortality_rate__imr____total",
                        "imrRural", "infant_mortality_rate__imr____rural",
                        "imrUrban", "infant_mortality_rate__imr____urban"
                )
        );
    }

    public static LiveDatasetDefinition maternalMortality() {
        return snapshot(
                "f0bc05de-567b-4b11-a223-8a22ab5fb61f",
                "Maternal Mortality Ratio (2015–17)",
                "Health",
                "Office of the Registrar General (SRS)",
                "State/UT-wise maternal mortality ratio (per 100,000 live births), 2015-17.",
                "Annual",
                "india_states",
                "mmr",
                "per 100k",
                unpivot("metric", "Metric", List.of(
                        col("mmr", "MMR 2015-17")
                ), "per 100k"),
                Map.of(
                        "state", "india_states",
                        "mmr", "_2015_17"
                )
        );
    }

    public static LiveDatasetDefinition nrega() {
        return snapshot(
                "349279f2-8bd6-4e89-8741-f676c22b2275",
                "MGNREGA Person-days & Wages",
                "Rural Development",
                "Ministry of Rural Development",
                "State/UT-wise MGNREGA person-days generated and wage expenditure (lakhs).",
                "Annual",
                "state_ut_wise",
                "personDaysLakh",
                "lakh",
                unpivot("metric", "Metric", List.of(
                        col("personDaysLakh", "Person-days (lakh)"),
                        col("wageExpenditureLakh", "Wage expenditure (Rs. lakh)")
                ), "lakh"),
                Map.of(
                        "state", "state_ut_wise",
                        "personDaysLakh", "persondays_generated__in_lakh_",
                        "wageExpenditureLakh", "wage_expenditure__in_rs__lakh_"
                )
        );
    }

    public static LiveDatasetDefinition groundwater() {
        return snapshot(
                "d08b5d94-26c9-4573-8f88-4b3b1b49118c",
                "Ground Water Resources (2020)",
                "Water",
                "Central Ground Water Board",
                "State/UT-wise annual ground water recharge, extractable resource, extraction and stage (2020).",
                "Annual",
                "state_ut",
                "stagePct",
                "value",
                unpivot("metric", "Metric", List.of(
                        col("rechargeBcm", "Annual recharge (BCM)"),
                        col("extractableBcm", "Extractable resource (BCM)"),
                        col("extractionTotalBcm", "Total extraction (BCM)"),
                        col("stagePct", "Stage of extraction (%)")
                ), "value"),
                Map.of(
                        "state", "state_ut",
                        "rechargeBcm", "total_annual_ground_water_recharge",
                        "extractableBcm", "annual_extractable_ground_water_resource",
                        "extractionTotalBcm", "current_annual_ground_water_extraction___total",
                        "stagePct", "stage_of_ground_water_extraction____"
                )
        );
    }

    public static LiveDatasetDefinition prison() {
        return snapshot(
                "7bdf8032-bad5-463b-b9e3-e1c767bb99a8",
                "Prison Inmates & Undertrials",
                "Law & Justice",
                "National Crime Records Bureau",
                "State/UT-wise prison inmate and Indian undertrial population.",
                "Annual",
                "state_ut",
                "totalInmates",
                "persons",
                unpivot("metric", "Metric", List.of(
                        col("totalInmates", "Prison inmates"),
                        col("undertrialInmates", "Indian undertrials")
                ), "persons"),
                Map.of(
                        "state", "state_ut",
                        "totalInmates", "prison_inmates",
                        "undertrialInmates", "indian_undertrial_prison_inmates"
                )
        );
    }

    public static LiveDatasetDefinition railwayAccidents() {
        return snapshot(
                "f1d3f4f9-cbc8-4ecb-9ba6-07c80fd0c31a",
                "Railway Accidents (2021)",
                "Transport",
                "Ministry of Railways",
                "State/UT-wise railway accident totals (cases / injured / died) for 2021.",
                "Annual",
                "state_ut",
                "totalDied",
                "incidents",
                unpivot("metric", "Total metric", List.of(
                        col("totalCases", "Total cases"),
                        col("totalInjured", "Total injured"),
                        col("totalDied", "Total died"),
                        col("fallFromTrainDied", "Fall from train - died")
                ), "incidents"),
                Map.of(
                        "state", "state_ut",
                        "totalCases", "total___cases",
                        "totalInjured", "total___injured",
                        "totalDied", "total___died",
                        "fallFromTrainDied", "fall_from_train_collision_with_people_at_tracks___died"
                )
        );
    }

    public static LiveDatasetDefinition householdsWithoutToilets() {
        return snapshot(
                "d722edee-d5bb-45da-9ba1-ef6e2123f176",
                "Households Without Toilets (2016)",
                "Sanitation",
                "Ministry of Drinking Water & Sanitation",
                "State/UT-wise households without toilets as on 8 December 2016.",
                "Snapshot",
                "state_ut_name",
                "households",
                "households",
                unpivot("metric", "Metric", List.of(
                        col("households", "Households without toilets")
                ), "households"),
                Map.of(
                        "state", "state_ut_name",
                        "households", "households_without_toilets_as_on_8_12_2016"
                )
        );
    }

    public static LiveDatasetDefinition stPopulationShare() {
        return snapshot(
                "e5835192-8e12-4df9-ba50-6ec908bcfd3d",
                "ST Population Share by State",
                "Demographics",
                "Office of the Registrar General",
                "State/UT-wise total population and Scheduled Tribe population (lakhs).",
                "Decennial",
                "india___state",
                "totalPopulationLakh",
                "lakh persons",
                unpivot("metric", "Population", List.of(
                        col("totalPopulationLakh", "Total population (lakh)"),
                        col("stPopulationLakh", "ST population (lakh)")
                ), "lakh persons"),
                Map.of(
                        "state", "india___state",
                        "totalPopulationLakh", "total_population__in_lakh_",
                        "stPopulationLakh", "st_population__in_lakh_"
                )
        );
    }

    public static LiveDatasetDefinition foreignTouristVisits() {
        return snapshot(
                "afd9eb6c-72d2-47a4-b4cd-e45ec1ce8fbc",
                "Foreign Tourist Visits (2014–2016)",
                "Tourism",
                "Ministry of Tourism",
                "State/UT-wise foreign tourist arrivals, 2014 to 2016.",
                "Annual",
                "state_ut",
                "y2016",
                "visits",
                unpivot("year", "Year", List.of(
                        col("y2014", "2014"),
                        col("y2015", "2015"),
                        col("y2016", "2016")
                ), "visits"),
                Map.of(
                        "state", "state_ut",
                        "y2014", "year___2014",
                        "y2015", "year___2015",
                        "y2016", "year___2016"
                )
        );
    }

    public static LiveDatasetDefinition startupSeedFund() {
        return snapshot(
                "1ad8b7b8-41ae-464a-a89d-acf6f86a08f0",
                "Startup India Seed Fund (SISFS)",
                "Startups",
                "DPIIT",
                "State/UT-wise funds approved under the Startup India Seed Fund Scheme (Rs. crore).",
                "Periodic",
                "state__ut",
                "fundsApprovedCrore",
                "Rs. crore",
                unpivot("metric", "Metric", List.of(
                        col("fundsApprovedCrore", "Funds approved (Rs. crore)")
                ), "Rs. crore"),
                Map.of(
                        "state", "state__ut",
                        "fundsApprovedCrore", "funds_approved_under_sisfs__in_rs__crore_"
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
