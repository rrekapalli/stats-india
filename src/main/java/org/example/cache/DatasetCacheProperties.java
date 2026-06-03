package org.example.cache;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stats-india.cache")
public class DatasetCacheProperties {

    /** SQLite database file path (parent directory is created on startup). */
    private String dbPath = "./data/datasets.db";

    /** Records per data.gov.in API request (max 10_000). */
    private int pageSize = 10_000;

    /** Pause between portal page requests to avoid rate limits. */
    private long requestDelayMs = 300;

    /** Re-fetch from portal when cache is older than this many days. */
    private int refreshAfterDays = 7;

    /** Cron for scheduled refresh (default: Sunday 03:00). */
    private String refreshCron = "0 0 3 * * SUN";

    /** Kick off background sync on application startup when cache is missing or stale. */
    private boolean syncOnStartup = true;

    public String getDbPath() {
        return dbPath;
    }

    public void setDbPath(String dbPath) {
        this.dbPath = dbPath;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public long getRequestDelayMs() {
        return requestDelayMs;
    }

    public void setRequestDelayMs(long requestDelayMs) {
        this.requestDelayMs = requestDelayMs;
    }

    public int getRefreshAfterDays() {
        return refreshAfterDays;
    }

    public void setRefreshAfterDays(int refreshAfterDays) {
        this.refreshAfterDays = refreshAfterDays;
    }

    public String getRefreshCron() {
        return refreshCron;
    }

    public void setRefreshCron(String refreshCron) {
        this.refreshCron = refreshCron;
    }

    public boolean isSyncOnStartup() {
        return syncOnStartup;
    }

    public void setSyncOnStartup(boolean syncOnStartup) {
        this.syncOnStartup = syncOnStartup;
    }
}
