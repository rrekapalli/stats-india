package org.example.api;

import org.example.dto.DatasetDataResponse;
import org.example.dto.DatasetFilter;
import org.example.dto.DatasetSummary;
import org.example.dto.DatasetSyncStatus;
import org.example.dto.DimensionGroup;
import org.example.dto.StateMetric;
import org.example.service.DatasetDataService;
import org.example.service.DatasetCatalogService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private final DatasetCatalogService catalogService;
    private final DatasetDataService datasetDataService;

    public DatasetController(DatasetCatalogService catalogService, DatasetDataService datasetDataService) {
        this.catalogService = catalogService;
        this.datasetDataService = datasetDataService;
    }

    @GetMapping
    public List<DatasetSummary> listDatasets() {
        return catalogService.listDatasets();
    }

    @GetMapping("/{id}")
    public DatasetSummary getDataset(@PathVariable String id) {
        try {
            return catalogService.getDataset(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @GetMapping("/{id}/dimensions")
    public List<DimensionGroup> getDimensions(@PathVariable String id) {
        try {
            if (datasetDataService.supportsLiveData(id)) {
                return datasetDataService.getExploreSummary(id).dimensionGroups();
            }
            return catalogService.getDimensions(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @GetMapping("/{id}/state-metrics")
    public List<StateMetric> getStateMetrics(@PathVariable String id) {
        try {
            return datasetDataService.getExploreSummary(id).stateMetrics();
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @GetMapping("/{id}/sync")
    public DatasetSyncStatus getSyncStatus(@PathVariable String id) {
        try {
            return datasetDataService.getSyncStatus(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @PostMapping("/{id}/sync")
    public DatasetSyncStatus triggerSync(@PathVariable String id) {
        try {
            datasetDataService.triggerSync(id);
            return datasetDataService.getSyncStatus(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage());
        }
    }

    @GetMapping("/{id}/sync/history")
    public org.example.dto.DatasetSyncHistoryResponse getSyncHistory(
            @PathVariable String id,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        try {
            return datasetDataService.getSyncHistory(id, limit, offset);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    /**
     * Explorer dashboard: read pre-aggregated metrics from the local SQLite cache only.
     */
    @GetMapping("/{id}/explore")
    public DatasetDataResponse getExploreSummary(@PathVariable String id) {
        try {
            return datasetDataService.getExploreSummary(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    /**
     * Explorer cross-filter: scan cached rows and return filtered aggregates (read-only).
     */
    @GetMapping("/{id}/explore/filter")
    public DatasetDataResponse getExploreFiltered(
            @PathVariable String id,
            @RequestParam List<String> filter
    ) {
        try {
            return datasetDataService.getExploreFiltered(id, parseFilters(filter));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    /**
     * Explorer data tab: paginated rows from the local SQLite cache only.
     */
    @GetMapping("/{id}/explore/records")
    public DatasetDataResponse getExploreRecords(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "25") int limit
    ) {
        try {
            return datasetDataService.getExploreRecords(id, offset, limit);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    /**
     * Full dataset API (records + aggregates). Reserved for Data Ingestion / admin use.
     */
    @GetMapping("/{id}/data")
    public DatasetDataResponse getDatasetData(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "1000") int limit,
            @RequestParam(defaultValue = "true") boolean includeRecords,
            @RequestParam(required = false) List<String> filter
    ) {
        try {
            List<DatasetFilter> filters = parseFilters(filter);
            return datasetDataService.getDataset(id, offset, limit, includeRecords, filters);
        } catch (IllegalArgumentException ex) {
            if (ex.getMessage() != null && ex.getMessage().startsWith("No live data provider")) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
            }
            throw ex;
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
        }
    }

    private static List<DatasetFilter> parseFilters(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        return raw.stream()
                .map(DatasetFilter::parse)
                .filter(java.util.Objects::nonNull)
                .toList();
    }
}
