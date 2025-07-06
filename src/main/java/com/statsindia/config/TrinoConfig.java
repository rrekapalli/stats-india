package com.statsindia.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;

@Configuration
public class TrinoConfig {

    @Value("${trino.datasource.url}")
    private String url;

    @Value("${trino.datasource.driverClassName}")
    private String driverClassName;

    @Value("${trino.datasource.username}")
    private String username;

    @Value("${trino.datasource.password}")
    private String password;

    @Bean
    @ConfigurationProperties("trino.datasource")
    public DataSourceProperties trinoDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "trinoDataSource")
    public DataSource trinoDataSource() {
        DataSource dataSource = trinoDataSourceProperties()
            .initializeDataSourceBuilder()
            .build();

        // Set properties to prevent this DataSource from being used by Hibernate
        if (dataSource instanceof DriverManagerDataSource) {
            ((DriverManagerDataSource) dataSource).setConnectionProperties(new java.util.Properties() {{
                setProperty("hibernate.temp.use_jdbc_metadata_defaults", "false");
            }});
        }

        return dataSource;
    }

    @Bean(name = "trinoJdbcTemplate")
    public JdbcTemplate trinoJdbcTemplate() {
        return new JdbcTemplate(trinoDataSource());
    }
}
