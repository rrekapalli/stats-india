package org.example.service.datagov;

import com.fasterxml.jackson.databind.JsonNode;
import org.example.cache.DatasetCacheMeta;
import org.example.cache.DatasetCacheRepository;
import org.example.cache.DatasetFetchStatus;
import org.example.dto.DatasetDataResponse;
import org.example.dto.DatasetFilter;
import org.example.dto.DimensionGroup;
import org.example.dto.DimensionItem;
import org.example.dto.DimensionRole;
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

/**
 * MCA RoC-wise Company Master Data — portal fetch parsing, aggregation, and cache-backed reads.
 * Resource: {@value #RESOURCE_ID}
 *
 * <p>Dimensions are declared in {@link #DIMENSIONS}; aggregation, filtering, and group building
 * delegate to {@link GenericAggregateEngine} so adding a new live dataset is a config exercise.
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

    /**
     * Declarative dimensions. {@code aggregateKey}s match the existing SQLite cache schema so
     * deployed caches keep reading after this refactor without a re-sync.
     */
    public static List<DatasetDimensionSpec> getDimensionSpecs() {
        return DIMENSIONS;
    }

    static final List<DatasetDimensionSpec> DIMENSIONS = List.of(
            new DatasetDimensionSpec(
                    "state",
                    "State / UT",
                    DimensionRole.GEOGRAPHY,
                    "companyStateCode",
                    "state",
                    McaCompanyMasterDatasetService::normalizeState,
                    "companies",
                    0
            ),
            new DatasetDimensionSpec(
                    "company-status",
                    "Company status",
                    DimensionRole.CATEGORICAL,
                    "companyStatus",
                    "status",
                    McaCompanyMasterDatasetService::normalizeLabel,
                    "companies",
                    0
            ),
            new DatasetDimensionSpec(
                    "industry",
                    "Industrial classification",
                    DimensionRole.CATEGORICAL,
                    "companyIndustrialClassification",
                    "industry",
                    McaCompanyMasterDatasetService::normalizeLabel,
                    "companies",
                    12
            ),
            new DatasetDimensionSpec(
                    "category",
                    "Company category",
                    DimensionRole.CATEGORICAL,
                    "companyCategory",
                    "category",
                    McaCompanyMasterDatasetService::normalizeLabel,
                    "companies",
                    0
            )
    );

    private final DatasetCacheRepository cacheRepository;

    public McaCompanyMasterDatasetService(DatasetCacheRepository cacheRepository) {
        this.cacheRepository = cacheRepository;
    }

    public DatasetDataResponse getExploreSummary() {
        Optional<DatasetCacheMeta> metaOpt = cacheRepository.findMeta(RESOURCE_ID);
        if (metaOpt.isEmpty()) {
            return emptyResponse(DatasetFetchStatus.MISSING.name(), null, 0);
        }
        DatasetCacheMeta meta = metaOpt.get();
        Map<String, Map<String, Integer>> aggregates = cacheRepository.loadAggregates(RESOURCE_ID);
        return buildResponse(meta, aggregates, List.of(), 0, 0, null, false);
    }

    public DatasetDataResponse getExploreFiltered(List<DatasetFilter> filters) {
        Optional<DatasetCacheMeta> metaOpt = cacheRepository.findMeta(RESOURCE_ID);
        if (metaOpt.isEmpty()) {
            return emptyResponse(DatasetFetchStatus.MISSING.name(), null, 0);
        }
        DatasetCacheMeta meta = metaOpt.get();
        if (filters == null || filters.isEmpty()) {
            return getExploreSummary();
        }
        FilteredAggregateResult filtered = computeFilteredAggregates(filters);
        return buildResponse(meta, filtered.aggregates(), List.of(), 0, 0, filtered.matchCount(), false);
    }

    /** Paginated row read for the Data tab — meta + page of records only (no aggregate rebuild). */
    public DatasetDataResponse getExploreRecords(int offset, int limit) {
        Optional<DatasetCacheMeta> metaOpt = cacheRepository.findMeta(RESOURCE_ID);
        if (metaOpt.isEmpty()) {
            return emptyResponse(DatasetFetchStatus.MISSING.name(), null, 0);
        }
        DatasetCacheMeta meta = metaOpt.get();
        int safeLimit = Math.max(0, Math.min(limit, 500));
        List<Map<String, String>> records = safeLimit > 0
                ? cacheRepository.loadRecords(RESOURCE_ID, offset, safeLimit)
                : List.of();
        return buildRecordsPageResponse(meta, records, offset, safeLimit);
    }

    public DatasetDataResponse getFromCache(int offset, int limit, boolean includeRecords) {
        return getFromCache(offset, limit, includeRecords, List.of());
    }

    public DatasetDataResponse getFromCache(
            int offset,
            int limit,
            boolean includeRecords,
            List<DatasetFilter> filters
    ) {
        Optional<DatasetCacheMeta> metaOpt = cacheRepository.findMeta(RESOURCE_ID);
        if (metaOpt.isEmpty()) {
            return emptyResponse(DatasetFetchStatus.MISSING.name(), null, 0);
        }
        DatasetCacheMeta meta = metaOpt.get();
        Map<String, Map<String, Integer>> aggregates;
        Long filteredCount = null;
        if (filters != null && !filters.isEmpty()) {
            FilteredAggregateResult filtered = computeFilteredAggregates(filters);
            aggregates = filtered.aggregates();
            filteredCount = filtered.matchCount();
        } else {
            aggregates = cacheRepository.loadAggregates(RESOURCE_ID);
        }
        List<Map<String, String>> records = includeRecords && limit > 0
                ? cacheRepository.loadRecords(RESOURCE_ID, offset, limit)
                : List.of();
        return buildResponse(meta, aggregates, records, offset, limit, filteredCount, false);
    }

    private record FilteredAggregateResult(Map<String, Map<String, Integer>> aggregates, long matchCount) {}

    private FilteredAggregateResult computeFilteredAggregates(List<DatasetFilter> filters) {
        Map<String, Map<String, Integer>> aggregates = new LinkedHashMap<>();
        long[] matchCount = {0L};

        cacheRepository.forEachRecord(RESOURCE_ID, row -> {
            if (!GenericAggregateEngine.matchesAllFilters(row, filters, DIMENSIONS)) {
                return;
            }
            matchCount[0]++;
            GenericAggregateEngine.mergeRow(row, DIMENSIONS, aggregates);
        });

        return new FilteredAggregateResult(aggregates, matchCount[0]);
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
        return GenericAggregateEngine.aggregate(records, DIMENSIONS);
    }

    private DatasetDataResponse buildResponse(
            DatasetCacheMeta meta,
            Map<String, Map<String, Integer>> aggregates,
            List<Map<String, String>> records,
            int offset,
            int limit,
            Long filteredCount,
            boolean skipCountRecords
    ) {
        Map<String, Integer> byState = aggregates.getOrDefault("state", Map.of());

        List<StateMetric> stateMetrics = byState.entrySet().stream()
                .sorted(Comparator.comparingInt(Map.Entry<String, Integer>::getValue).reversed())
                .map(e -> new StateMetric(e.getKey(), stateCode(e.getKey()), e.getValue(), "companies", "cached"))
                .toList();

        long cachedTotal = meta.cachedRecords();
        if (!skipCountRecords && cachedTotal <= 0 && meta.status() == DatasetFetchStatus.READY) {
            cachedTotal = cacheRepository.countRecords(RESOURCE_ID);
        }
        long displayCount = filteredCount != null ? filteredCount : cachedTotal;
        boolean filtered = filteredCount != null;

        List<DimensionGroup> dimensionGroups = new ArrayList<>();
        dimensionGroups.add(summaryGroup(meta.portalTotal(), displayCount, byState.size(), meta.fetchedAt(), filtered));
        dimensionGroups.addAll(GenericAggregateEngine.buildDimensionGroups(aggregates, DIMENSIONS));

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
                displayCount
        );
    }

    private DatasetDataResponse buildRecordsPageResponse(
            DatasetCacheMeta meta,
            List<Map<String, String>> records,
            int offset,
            int limit
    ) {
        return new DatasetDataResponse(
                RESOURCE_ID,
                meta.title(),
                meta.description(),
                meta.portalTotal(),
                records.size(),
                offset,
                limit,
                List.of(),
                List.of(),
                records,
                meta.status().name(),
                formatInstant(meta.fetchedAt()),
                meta.cachedRecords()
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

    private DimensionGroup summaryGroup(
            long portalTotal,
            long cachedRecords,
            int statesRepresented,
            Instant cachedAt,
            boolean filtered
    ) {
        List<DimensionItem> items = new ArrayList<>();
        items.add(new DimensionItem("total-records", "Total records (portal)", String.valueOf(portalTotal), "count"));
        items.add(new DimensionItem(
                "cached-records",
                filtered ? "Records matching filters" : "Records cached locally",
                String.valueOf(cachedRecords),
                "count"
        ));
        items.add(new DimensionItem("states", "States / UTs represented", String.valueOf(statesRepresented), "count"));
        if (cachedAt != null) {
            items.add(new DimensionItem("cached-at", "Last synced", cachedAt.toString(), "timestamp"));
        }
        return new DimensionGroup("summary", "Dataset summary", items, DimensionRole.SUMMARY, items.size(), null, false);
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
