package org.example.batch;

/**
 * Keys for values shared via Spring Batch {@code ExecutionContext} between the prepare
 * tasklet, the chunk reader, and the job execution listener.
 */
public final class IngestionContextKeys {

    private IngestionContextKeys() {}

    public static final String PORTAL_TOTAL = "portalTotal";
    public static final String START_OFFSET = "startOffset";
    public static final String JOB_NAME_DISPLAY = "jobNameDisplay";
    public static final String RESOURCE_ID = "resourceId";

    public static final String JOB_PARAM_RESOURCE_ID = "resourceId";
    public static final String JOB_PARAM_TIMESTAMP = "timestamp";
}
