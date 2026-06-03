package org.example.cache;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class DatasetCacheConfig {

    @Bean
    @Primary
    DataSource dataSource(DatasetCacheProperties properties) throws Exception {
        Path dbPath = Path.of(properties.getDbPath()).toAbsolutePath().normalize();
        Files.createDirectories(dbPath.getParent());
        org.sqlite.SQLiteDataSource dataSource = new org.sqlite.SQLiteDataSource();
        dataSource.setUrl("jdbc:sqlite:" + dbPath);
        return dataSource;
    }

    @Bean
    JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean
    DatasetCacheRepository datasetCacheRepository(JdbcTemplate jdbcTemplate) {
        DatasetCacheRepository repository = new DatasetCacheRepository(jdbcTemplate);
        repository.initSchema();
        return repository;
    }
}
