package org.example.api;

import org.example.dto.DatasetDataResponse;
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
            return catalogService.getDimensions(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @GetMapping("/{id}/state-metrics")
    public List<StateMetric> getStateMetrics(@PathVariable String id) {
        if (datasetDataService.supportsLiveData(id)) {
            return datasetDataService.getDataset(id, 0, 0, false).stateMetrics();
        }
        try {
            return catalogService.getStateMetrics(id);
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
        }
    }

    /**
     * Cached dataset rows and aggregates (SQLite). Portal sync runs in the background when stale.
     */
    @GetMapping("/{id}/data")
    public DatasetDataResponse getDatasetData(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "1000") int limit,
            @RequestParam(defaultValue = "true") boolean includeRecords
    ) {
        try {
            return datasetDataService.getDataset(id, offset, limit, includeRecords);
        } catch (IllegalArgumentException ex) {
            if (ex.getMessage() != null && ex.getMessage().startsWith("No live data provider")) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
            }
            throw ex;
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
        }
    }
}
