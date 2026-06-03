package org.example.service;

import org.example.dto.DatasetSummary;
import org.example.dto.DimensionGroup;
import org.example.dto.DimensionItem;
import org.example.dto.StateMetric;
import org.example.service.datagov.McaCompanyMasterDatasetService;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class DatasetCatalogService {

    private static final String PORTAL = "https://data.gov.in";

    private final List<DatasetSummary> datasets = List.of(
            new DatasetSummary(
                    McaCompanyMasterDatasetService.RESOURCE_ID,
                    "RoC-wise Company Master Data",
                    "Companies",
                    "Ministry of Corporate Affairs",
                    PORTAL + "/resource/" + McaCompanyMasterDatasetService.RESOURCE_ID,
                    "Registrar of Companies (RoC) company registrations by state, status, and industrial classification.",
                    "Live (data.gov.in)"
            ),
            new DatasetSummary(
                    "population-census",
                    "Population Census Indicators",
                    "Demographics",
                    "Office of the Registrar General & Census Commissioner",
                    PORTAL + "/catalog/population",
                    "State-wise population, density, and urbanization metrics from census publications.",
                    "Decennial"
            ),
            new DatasetSummary(
                    "agriculture-production",
                    "Agricultural Production Statistics",
                    "Agriculture",
                    "Ministry of Agriculture & Farmers Welfare",
                    PORTAL + "/catalog/agriculture",
                    "Crop area, yield, and production statistics by state and season.",
                    "Annual"
            ),
            new DatasetSummary(
                    "health-facilities",
                    "Health Infrastructure",
                    "Health",
                    "Ministry of Health & Family Welfare",
                    PORTAL + "/catalog/health",
                    "Counts of hospitals, PHCs, and health workers by state and district.",
                    "Quarterly"
            ),
            new DatasetSummary(
                    "education-enrollment",
                    "School Education Enrollment",
                    "Education",
                    "Ministry of Education",
                    PORTAL + "/catalog/education",
                    "Gross enrollment ratios and school infrastructure by state.",
                    "Annual"
            ),
            new DatasetSummary(
                    "renewable-energy",
                    "Renewable Energy Capacity",
                    "Energy",
                    "Ministry of New and Renewable Energy",
                    PORTAL + "/catalog/energy",
                    "Installed renewable capacity and generation by state.",
                    "Monthly"
            )
    );

    private final Map<String, List<DimensionGroup>> dimensionsByDataset = Map.of(
            "population-census", List.of(
                    geographyGroup(),
                    timeGroup(),
                    indicatorGroup("Population (millions)", "Density (per km²)", "Urban share (%)")
            ),
            "agriculture-production", List.of(
                    geographyGroup(),
                    timeGroup(),
                    sectorGroup("Cereals", "Pulses", "Oilseeds", "Horticulture"),
                    indicatorGroup("Production (MT)", "Yield (kg/ha)", "Area (000 ha)")
            ),
            "health-facilities", List.of(
                    geographyGroup(),
                    timeGroup(),
                    sectorGroup("Primary care", "Secondary care", "Tertiary care"),
                    indicatorGroup("Facilities count", "Beds per 1000", "Doctors per lakh")
            ),
            "education-enrollment", List.of(
                    geographyGroup(),
                    timeGroup(),
                    sectorGroup("Primary", "Upper primary", "Secondary", "Higher secondary"),
                    indicatorGroup("GER (%)", "Schools count", "Pupil-teacher ratio")
            ),
            "renewable-energy", List.of(
                    geographyGroup(),
                    timeGroup(),
                    sectorGroup("Solar", "Wind", "Biomass", "Small hydro"),
                    indicatorGroup("Installed capacity (MW)", "Generation (MU)", "Share of total (%)")
            )
    );

    private final Map<String, Map<String, Double>> stateMetricTemplates = Map.of(
            "population-census", Map.ofEntries(
                    entry("Maharashtra", 128.0),
                    entry("Uttar Pradesh", 235.0),
                    entry("Bihar", 127.0),
                    entry("West Bengal", 99.0),
                    entry("Madhya Pradesh", 85.0),
                    entry("Tamil Nadu", 77.0),
                    entry("Rajasthan", 81.0),
                    entry("Karnataka", 67.0),
                    entry("Gujarat", 70.0),
                    entry("Andhra Pradesh", 53.0),
                    entry("Odisha", 45.0),
                    entry("Telangana", 38.0),
                    entry("Kerala", 35.0),
                    entry("Jharkhand", 38.0),
                    entry("Assam", 35.0),
                    entry("Punjab", 31.0),
                    entry("Haryana", 28.0),
                    entry("Chhattisgarh", 29.0),
                    entry("Uttarakhand", 11.0),
                    entry("Himachal Pradesh", 7.3),
                    entry("Tripura", 4.1),
                    entry("Meghalaya", 3.3),
                    entry("Manipur", 3.1),
                    entry("Nagaland", 2.2),
                    entry("Goa", 1.6),
                    entry("Arunachal Pradesh", 1.7),
                    entry("Mizoram", 1.2),
                    entry("Sikkim", 0.7),
                    entry("Jammu and Kashmir", 13.0),
                    entry("Delhi", 21.0),
                    entry("Chandigarh", 1.2),
                    entry("Puducherry", 1.5),
                    entry("Andaman and Nicobar Islands", 0.4),
                    entry("Ladakh", 0.3),
                    entry("Lakshadweep", 0.07),
                    entry("Dadra and Nagar Haveli and Daman and Diu", 0.6)
            ),
            "agriculture-production", Map.ofEntries(
                    entry("Maharashtra", 142.0),
                    entry("Uttar Pradesh", 618.0),
                    entry("Bihar", 178.0),
                    entry("West Bengal", 186.0),
                    entry("Madhya Pradesh", 412.0),
                    entry("Tamil Nadu", 112.0),
                    entry("Rajasthan", 268.0),
                    entry("Karnataka", 134.0),
                    entry("Gujarat", 98.0),
                    entry("Andhra Pradesh", 156.0),
                    entry("Odisha", 98.0),
                    entry("Telangana", 118.0),
                    entry("Kerala", 42.0),
                    entry("Punjab", 312.0),
                    entry("Haryana", 168.0)
            ),
            "health-facilities", Map.ofEntries(
                    entry("Maharashtra", 2840.0),
                    entry("Uttar Pradesh", 3120.0),
                    entry("Bihar", 1680.0),
                    entry("West Bengal", 1940.0),
                    entry("Madhya Pradesh", 1760.0),
                    entry("Tamil Nadu", 2100.0),
                    entry("Rajasthan", 1580.0),
                    entry("Karnataka", 1920.0),
                    entry("Gujarat", 1640.0),
                    entry("Kerala", 980.0),
                    entry("Delhi", 720.0)
            ),
            "education-enrollment", Map.ofEntries(
                    entry("Maharashtra", 91.2),
                    entry("Uttar Pradesh", 78.4),
                    entry("Bihar", 72.1),
                    entry("West Bengal", 88.6),
                    entry("Madhya Pradesh", 81.3),
                    entry("Tamil Nadu", 94.5),
                    entry("Rajasthan", 79.8),
                    entry("Karnataka", 89.7),
                    entry("Gujarat", 87.2),
                    entry("Kerala", 96.8),
                    entry("Himachal Pradesh", 95.1)
            ),
            "renewable-energy", Map.ofEntries(
                    entry("Maharashtra", 12840.0),
                    entry("Uttar Pradesh", 5420.0),
                    entry("Gujarat", 18620.0),
                    entry("Rajasthan", 22480.0),
                    entry("Karnataka", 16240.0),
                    entry("Tamil Nadu", 17860.0),
                    entry("Andhra Pradesh", 9840.0),
                    entry("Telangana", 8620.0),
                    entry("Madhya Pradesh", 7240.0),
                    entry("Kerala", 2140.0)
            )
    );

    public List<DatasetSummary> listDatasets() {
        return datasets;
    }

    public DatasetSummary getDataset(String id) {
        return datasets.stream()
                .filter(d -> d.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown dataset: " + id));
    }

    public List<DimensionGroup> getDimensions(String datasetId) {
        return dimensionsByDataset.getOrDefault(datasetId, List.of(
                geographyGroup(),
                timeGroup(),
                indicatorGroup("Value")
        ));
    }

    public List<StateMetric> getStateMetrics(String datasetId) {
        getDataset(datasetId);
        Map<String, Double> values = stateMetricTemplates.getOrDefault(datasetId, stateMetricTemplates.get("population-census"));
        String unit = unitForDataset(datasetId);
        return values.entrySet().stream()
                .map(e -> new StateMetric(
                        e.getKey(),
                        toStateCode(e.getKey()),
                        e.getValue(),
                        unit,
                        "2023-24"
                ))
                .toList();
    }

    private static String unitForDataset(String datasetId) {
        return switch (datasetId) {
            case "population-census" -> "millions";
            case "agriculture-production" -> "000 MT";
            case "health-facilities" -> "facilities";
            case "education-enrollment" -> "percent";
            case "renewable-energy" -> "MW";
            default -> "value";
        };
    }

    private static DimensionGroup geographyGroup() {
        return new DimensionGroup("geography", "Geography", List.of(
                new DimensionItem("country", "Country", "Republic of India", "string"),
                new DimensionItem("state", "State / UT", "State or union territory", "string"),
                new DimensionItem("district", "District", "Administrative district (when available)", "string"),
                new DimensionItem("region", "Region", "North, South, East, West, Central, North-East", "string")
        ));
    }

    private static DimensionGroup timeGroup() {
        return new DimensionGroup("time", "Time", List.of(
                new DimensionItem("year", "Year", "Reference year of the observation", "year"),
                new DimensionItem("period", "Period", "Annual, quarterly, or monthly period", "string"),
                new DimensionItem("base-year", "Base year", "Index or growth base year", "year")
        ));
    }

    private static DimensionGroup sectorGroup(String... sectors) {
        return new DimensionGroup("sector", "Sector", java.util.Arrays.stream(sectors)
                .map(s -> new DimensionItem(
                        s.toLowerCase(Locale.ROOT).replace(' ', '-'),
                        s,
                        "Sector filter for " + s,
                        "string"
                ))
                .toList());
    }

    private static DimensionGroup indicatorGroup(String... indicators) {
        return new DimensionGroup("indicator", "Indicator", java.util.Arrays.stream(indicators)
                .map(i -> new DimensionItem(
                        i.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-"),
                        i,
                        "Measure published on data.gov.in",
                        "number"
                ))
                .toList());
    }

    private static Map.Entry<String, Double> entry(String state, double value) {
        return Map.entry(state, value);
    }

    private static String toStateCode(String state) {
        return state.toUpperCase(Locale.ROOT)
                .replace(" AND ", "_")
                .replace(" ", "_")
                .replace("'", "");
    }
}
