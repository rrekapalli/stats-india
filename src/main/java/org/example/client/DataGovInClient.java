package org.example.client;

import com.fasterxml.jackson.databind.JsonNode;
import org.example.config.DataGovInProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class DataGovInClient {

    private final RestClient restClient;
    private final DataGovInProperties properties;

    public DataGovInClient(RestClient dataGovInRestClient, DataGovInProperties properties) {
        this.restClient = dataGovInRestClient;
        this.properties = properties;
    }

    /**
     * Fetch a data.gov.in resource catalog in JSON format.
     *
     * @see <a href="https://data.gov.in">data.gov.in API</a>
     */
    public JsonNode fetchResource(String resourceId, int offset, int limit) {
        String apiKey = properties.getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("DATA_GOV_IN_API_KEY");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("DATA_GOV_IN_API_KEY is not configured");
        }

        var uri = UriComponentsBuilder
                .fromUriString(properties.getBaseUrl())
                .path("/resource/{resourceId}")
                .queryParam("api-key", apiKey.trim())
                .queryParam("format", "json")
                .queryParam("offset", Math.max(0, offset))
                .queryParam("limit", Math.min(Math.max(1, limit), 10_000))
                .buildAndExpand(resourceId)
                .toUri();

        JsonNode body = restClient.get()
                .uri(uri)
                .retrieve()
                .body(JsonNode.class);

        if (body == null) {
            throw new IllegalStateException("Empty response from data.gov.in for resource " + resourceId);
        }
        if (body.has("error")) {
            throw new IllegalStateException("data.gov.in error: " + body.get("error").asText());
        }
        return body;
    }
}
