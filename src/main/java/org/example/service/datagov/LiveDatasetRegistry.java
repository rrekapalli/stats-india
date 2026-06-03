package org.example.service.datagov;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Registry of all live data.gov.in datasets supported by Stats India. */
@Component
public class LiveDatasetRegistry {

    private static final String PORTAL = "https://data.gov.in";

    private final Map<String, LiveDatasetDefinition> byId;

    public LiveDatasetRegistry() {
        List<LiveDatasetDefinition> datasets = List.of(
                LiveDatasetDefinition.mcaCompanyMaster(),
                LiveDatasetDefinition.roadAccidents(),
                LiveDatasetDefinition.censusPopulation(),
                LiveDatasetDefinition.registeredDeaths(),
                LiveDatasetDefinition.judicialCases(),
                LiveDatasetDefinition.cropProduction(),
                LiveDatasetDefinition.healthFacilities(),
                LiveDatasetDefinition.educationEnrollment(),
                LiveDatasetDefinition.renewableEnergy(),
                // Tier 1 additions (state/UT snapshots)
                LiveDatasetDefinition.crimeAgainstWomen(),
                LiveDatasetDefinition.crimeAgainstScSt(),
                LiveDatasetDefinition.dowryDeaths(),
                LiveDatasetDefinition.civilCasesPending(),
                LiveDatasetDefinition.prison(),
                LiveDatasetDefinition.forestCover(),
                LiveDatasetDefinition.forestChange(),
                LiveDatasetDefinition.literacyHistorical(),
                LiveDatasetDefinition.ruralLiteracy(),
                LiveDatasetDefinition.secondaryGer(),
                LiveDatasetDefinition.stStudentEnrolment(),
                LiveDatasetDefinition.dengue(),
                LiveDatasetDefinition.malaria(),
                LiveDatasetDefinition.tbNotifications(),
                LiveDatasetDefinition.infantMortality(),
                LiveDatasetDefinition.maternalMortality(),
                LiveDatasetDefinition.nrega(),
                LiveDatasetDefinition.groundwater(),
                LiveDatasetDefinition.railwayAccidents(),
                LiveDatasetDefinition.householdsWithoutToilets(),
                LiveDatasetDefinition.stPopulationShare(),
                LiveDatasetDefinition.foreignTouristVisits(),
                LiveDatasetDefinition.startupSeedFund()
        );
        Map<String, LiveDatasetDefinition> map = new LinkedHashMap<>();
        for (LiveDatasetDefinition def : datasets) {
            map.put(def.resourceId(), def);
        }
        this.byId = Map.copyOf(map);
    }

    public Collection<LiveDatasetDefinition> all() {
        return byId.values();
    }

    public Optional<LiveDatasetDefinition> find(String resourceId) {
        return Optional.ofNullable(byId.get(resourceId));
    }

    public LiveDatasetDefinition require(String resourceId) {
        return find(resourceId).orElseThrow(() ->
                new IllegalArgumentException("Unknown live dataset: " + resourceId));
    }

    public boolean isRegistered(String resourceId) {
        return byId.containsKey(resourceId);
    }

    public String portalUrl(String resourceId) {
        return PORTAL + "/resource/" + resourceId;
    }
}
