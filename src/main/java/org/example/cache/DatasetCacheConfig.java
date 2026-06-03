package org.example.cache;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Wires the dataset cache repository to the autoconfigured Spring Boot {@link DataSource}
 * (PostgreSQL via HikariCP). Schema is owned by Flyway migrations under
 * {@code src/main/resources/db/migration/}.
 */
@Configuration
public class DatasetCacheConfig {

    @Bean
    DatasetCacheRepository datasetCacheRepository(DataSource dataSource) {
        return new DatasetCacheRepository(new org.springframework.jdbc.core.JdbcTemplate(dataSource));
    }
}
