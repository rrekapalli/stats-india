package org.example.service.datagov;

import com.fasterxml.jackson.databind.JsonNode;
import org.example.cache.DatasetCacheMeta;
import org.example.cache.DatasetCacheRepository;
import org.example.cache.DatasetFetchStatus;
import org.example.dto.DatasetDataResponse;
import org.example.dto.DimensionGroup;
import org.example.dto.DimensionItem;
import org.example.dto.StateMetric;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * MCA RoC-wise Company Master Data — portal fetch parsing, aggregation, and cache-backed reads.
 * Resource: {@value #RESOURCE_ID}
 */
@Service
public class McaCompanyMasterDatasetService {

    public static final String RESOURCE_ID = "4dbe5667-7b6b-41d7-82af-211562424d9a";

    private static final Map<String, String> STATE_ALIASES = Map.ofEntries(
            Map.entry("andaman and nicobar islands", "Andaman and Nicobar Islands"),
            Map.entry("andhra pradesh", "Andhra Pradesh"),
            Map.entry("arunachal pradesh", "Arunachal Pradesh"),
            Map.entry("assam", "Assam"),
            Map.entry("bihar", "Bihar"),
            Map.entry("chandigarh", "Chandigarh"),
            Map.entry("chhattisgarh", "Chhattisgarh"),
            Map.entry("dadra and nagar haveli", "Dadra and Nagar Haveli"),
            Map.entry("dadra & nagar haveli", "Dadra and Nagar Haveli"),
            Map.entry("daman and diu", "Daman and Diu"),
            Map.entry("daman & diu", "Daman and Diu"),
            Map.entry("delhi", "Delhi"),
            Map.entry("nct of delhi", "Delhi"),
            Map.entry("new delhi", "Delhi"),
            Map.entry("goa", "Goa"),
            Map.entry("gujarat", "Gujarat"),
            Map.entry("haryana", "Haryana"),
            Map.entry("himachal pradesh", "Himachal Pradesh"),
            Map.entry("jammu and kashmir", "Jammu and Kashmir"),
            Map.entry("jammu & kashmir", "Jammu and Kashmir"),
            Map.entry("jharkhand", "Jharkhand"),
            Map.entry("karnataka", "Karnataka"),
            Map.entry("kerala", "Kerala"),
            Map.entry("lakshadweep", "Lakshadweep"),
            Map.entry("madhya pradesh", "Madhya Pradesh"),
            Map.entry("maharashtra", "Maharashtra"),
            Map.entry("manipur", "Manipur"),
            Map.entry("meghalaya", "Meghalaya"),
            Map.entry("mizoram", "Mizoram"),
            Map.entry("nagaland", "Nagaland"),
            Map.entry("odisha", "Odisha"),
            Map.entry("orissa", "Odisha"),
            Map.entry("pondicherry", "Puducherry"),
            Map.entry("puducherry", "Puducherry"),
            Map.entry("punjab", "Punjab"),
            Map.entry("rajasthan", "Rajasthan"),
            Map.entry("sikkim", "Sikkim"),
            Map.entry("tamil nadu", "Tamil Nadu"),
            Map.entry("telangana", "Telangana"),
            Map.entry("tripura", "Tripura"),
            Map.entry("uttar pradesh", "Uttar Pradesh"),
            Map.entry("uttarakhand", "Uttarakhand"),
            Map.entry("uttaranchal", "Uttarakhand"),
            Map.entry("west bengal", "West Bengal")
    );

    private final DatasetCacheRepository cacheRepository;

    public McaCompanyMasterDatasetService(DatasetCacheRepository cacheRepository) {
        this.cacheRepository = cacheRepository;
    }

    public DatasetDataResponse getFromCache(int offset, int limit, boolean includeRecords) {
        Optional<DatasetCacheMeta> metaOpt = cacheRepository.findMeta(RESOURCE_ID);
        if (metaOpt.isEmpty()) {
            return emptyResponse(DatasetFetchStatus.MISSING.name(), null, 0);
        }
        DatasetCacheMeta meta = metaOpt.get();
        Map<String, Map<String, Integer>> aggregates = cacheRepository.loadAggregates(RESOURCE_ID);
        List<Map<String, String>> records = includeRecords && limit > 0
                ? cacheRepository.loadRecords(RESOURCE_ID, offset, limit)
                : List.of();
        return buildResponse(meta, aggregates, records, offset, limit);
    }

    public List<Map<String, String>> parseRecords(JsonNode payload) {
        List<Map<String, String>> cleanedRecords = new ArrayList<>();
        JsonNode recordsNode = payload.path("records");
        if (recordsNode.isArray()) {
            for (JsonNode record : recordsNode) {
                cleanedRecords.add(cleanRecord(record));
            }
        }
        return cleanedRecords;
    }

    public Map<String, Map<String, Integer>> aggregateBatch(List<Map<String, String>> records) {
        Map<String, Integer> byState = new LinkedHashMap<>();
        Map<String, Integer> byStatus = new LinkedHashMap<>();
        Map<String, Integer> byIndustry = new LinkedHashMap<>();
        Map<String, Integer> byCategory = new LinkedHashMap<>();

        for (Map<String, String> row : records) {
            String state = normalizeState(row.get("companyStateCode"));
            if (state != null) {
                byState.merge(state, 1, Integer::sum);
            }
            String status = normalizeLabel(row.get("companyStatus"));
            if (status != null) {
                byStatus.merge(status, 1, Integer::sum);
            }
            String industry = normalizeLabel(row.get("companyIndustrialClassification"));
            if (industry != null) {
                byIndustry.merge(industry, 1, Integer::sum);
            }
            String category = normalizeLabel(row.get("companyCategory"));
            if (category != null) {
                byCategory.merge(category, 1, Integer::sum);
            }
        }

        Map<String, Map<String, Integer>> dimensions = new LinkedHashMap<>();
        dimensions.put("state", byState);
        dimensions.put("status", byStatus);
        dimensions.put("industry", byIndustry);
        dimensions.put("category", byCategory);
        return dimensions;
    }

    private DatasetDataResponse buildResponse(
            DatasetCacheMeta meta,
            Map<String, Map<String, Integer>> aggregates,
            List<Map<String, String>> records,
            int offset,
            int limit
    ) {
        Map<String, Integer> byState = aggregates.getOrDefault("state", Map.of());
        Map<String, Integer> byStatus = aggregates.getOrDefault("status", Map.of());
        Map<String, Integer> byIndustry = aggregates.getOrDefault("industry", Map.of());
        Map<String, Integer> byCategory = aggregates.getOrDefault("category", Map.of());

        List<StateMetric> stateMetrics = byState.entrySet().stream()
                .sorted(Comparator.comparingInt(Map.Entry<String, Integer>::getValue).reversed())
                .map(e -> new StateMetric(e.getKey(), stateCode(e.getKey()), e.getValue(), "companies", "cached"))
                .toList();

        long cachedTotal = meta.cachedRecords();
        if (cachedTotal <= 0 && meta.status() == DatasetFetchStatus.READY) {
            cachedTotal = cacheRepository.countRecords(RESOURCE_ID);
        }
        List<DimensionGroup> dimensionGroups = List.of(
                summaryGroup(meta.portalTotal(), cachedTotal, byState.size(), meta.fetchedAt()),
                countGroup("company-status", "Company status", byStatus),
                countGroup("industry", "Industrial classification", topEntries(byIndustry, 12)),
                countGroup("category", "Company category", byCategory),
                countGroup("state", "State / UT", byState)
        );

        return new DatasetDataResponse(
                RESOURCE_ID,
                meta.title(),
                meta.description(),
                meta.portalTotal(),
                records.size(),
                offset,
                limit,
                stateMetrics,
                dimensionGroups,
                records,
                meta.status().name(),
                formatInstant(meta.fetchedAt()),
                cachedTotal
        );
    }

    private DatasetDataResponse emptyResponse(String syncStatus, Instant cachedAt, long recordsCached) {
        return new DatasetDataResponse(
                RESOURCE_ID,
                "MCA Company Master Data",
                "Registrar of Companies company registrations by state, status, and industrial classification.",
                0,
                0,
                0,
                0,
                List.of(),
                List.of(),
                List.of(),
                syncStatus,
                formatInstant(cachedAt),
                recordsCached
        );
    }

    private DimensionGroup summaryGroup(long portalTotal, long cachedRecords, int statesRepresented, Instant cachedAt) {
        List<DimensionItem> items = new ArrayList<>();
        items.add(item("total-records", "Total records (portal)", String.valueOf(portalTotal), "count"));
        items.add(item("cached-records", "Records cached locally", String.valueOf(cachedRecords), "count"));
        items.add(item("states", "States / UTs represented", String.valueOf(statesRepresented), "count"));
        if (cachedAt != null) {
            items.add(item("cached-at", "Last synced", cachedAt.toString(), "timestamp"));
        }
        return new DimensionGroup("summary", "Dataset summary", items);
    }

    private DimensionGroup countGroup(String id, String label, Map<String, Integer> counts) {
        List<DimensionItem> items = counts.entrySet().stream()
                .sorted(Comparator.comparingInt(Map.Entry<String, Integer>::getValue).reversed())
                .map(e -> item(
                        slugify(e.getKey()),
                        e.getKey(),
                        e.getValue() + " companies",
                        String.valueOf(e.getValue())
                ))
                .toList();
        return new DimensionGroup(id, label, items);
    }

    private Map<String, Integer> topEntries(Map<String, Integer> source, int max) {
        return source.entrySet().stream()
                .sorted(Comparator.comparingInt(Map.Entry<String, Integer>::getValue).reversed())
                .limit(max)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    private DimensionItem item(String id, String label, String description, String valueType) {
        return new DimensionItem(id, label, description, valueType);
    }

    private Map<String, String> cleanRecord(JsonNode record) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("cin", trim(record, "CIN"));
        row.put("companyName", trim(record, "CompanyName"));
        row.put("rocCode", trim(record, "CompanyROCcode"));
        row.put("companyCategory", trim(record, "CompanyCategory"));
        row.put("companySubCategory", trim(record, "CompanySubCategory"));
        row.put("companyClass", trim(record, "CompanyClass"));
        row.put("authorizedCapital", trim(record, "AuthorizedCapital"));
        row.put("paidupCapital", trim(record, "PaidupCapital"));
        row.put("registrationDate", trim(record, "CompanyRegistrationdate_date"));
        row.put("registeredOfficeAddress", trim(record, "Registered_Office_Address"));
        row.put("listingStatus", trim(record, "Listingstatus"));
        row.put("companyStatus", trim(record, "CompanyStatus"));
        row.put("companyStateCode", trim(record, "CompanyStateCode"));
        row.put("companyOrigin", trim(record, "CompanyIndian/Foreign Company"));
        row.put("nicCode", trim(record, "nic_code"));
        row.put("companyIndustrialClassification", trim(record, "CompanyIndustrialClassification"));
        return row;
    }

    static String normalizeState(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String key = raw.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
        if (STATE_ALIASES.containsKey(key)) {
            return STATE_ALIASES.get(key);
        }
        return titleCase(key);
    }

    private static String normalizeLabel(String raw) {
        if (raw == null || raw.isBlank() || "NA".equalsIgnoreCase(raw.trim())) {
            return null;
        }
        return raw.trim();
    }

    private static String titleCase(String value) {
        String[] parts = value.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                sb.append(' ');
            }
            String part = parts[i];
            if (part.length() == 1) {
                sb.append(part.toUpperCase(Locale.ROOT));
            } else {
                sb.append(Character.toUpperCase(part.charAt(0)))
                        .append(part.substring(1));
            }
        }
        return sb.toString();
    }

    private static String stateCode(String stateName) {
        return switch (stateName) {
            case "Andhra Pradesh" -> "AP";
            case "Arunachal Pradesh" -> "AR";
            case "Assam" -> "AS";
            case "Bihar" -> "BR";
            case "Chhattisgarh" -> "CG";
            case "Delhi" -> "DL";
            case "Goa" -> "GA";
            case "Gujarat" -> "GJ";
            case "Haryana" -> "HR";
            case "Himachal Pradesh" -> "HP";
            case "Jammu and Kashmir" -> "JK";
            case "Jharkhand" -> "JH";
            case "Karnataka" -> "KA";
            case "Kerala" -> "KL";
            case "Madhya Pradesh" -> "MP";
            case "Maharashtra" -> "MH";
            case "Manipur" -> "MN";
            case "Meghalaya" -> "ML";
            case "Mizoram" -> "MZ";
            case "Nagaland" -> "NL";
            case "Odisha" -> "OD";
            case "Punjab" -> "PB";
            case "Rajasthan" -> "RJ";
            case "Sikkim" -> "SK";
            case "Tamil Nadu" -> "TN";
            case "Telangana" -> "TS";
            case "Tripura" -> "TR";
            case "Uttar Pradesh" -> "UP";
            case "Uttarakhand" -> "UK";
            case "West Bengal" -> "WB";
            default -> "";
        };
    }

    private static String slugify(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private static String trim(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return "";
        }
        return value.asText("").trim();
    }

    private static String formatInstant(Instant instant) {
        return instant != null ? instant.toString() : null;
    }
}
