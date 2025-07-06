package com.statsindia.config;

import com.statsindia.model.Statistic;
import com.statsindia.repository.StatisticRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.Arrays;

@Configuration
public class DataLoader {

    @Bean
    public CommandLineRunner loadData(StatisticRepository repository) {
        return args -> {
            // Clear existing data
            repository.deleteAll();

            // Add sample data
            repository.saveAll(Arrays.asList(
                new Statistic(null, "Population", "Maharashtra", "Total Population", 112374333.0, LocalDate.of(2011, 1, 1), "Census 2011", "Total population of Maharashtra as per 2011 census"),
                new Statistic(null, "Population", "Uttar Pradesh", "Total Population", 199812341.0, LocalDate.of(2011, 1, 1), "Census 2011", "Total population of Uttar Pradesh as per 2011 census"),
                new Statistic(null, "Economy", "Maharashtra", "GDP", 32.24, LocalDate.of(2020, 3, 31), "Economic Survey", "GDP of Maharashtra in trillion rupees for 2019-20"),
                new Statistic(null, "Economy", "Tamil Nadu", "GDP", 21.67, LocalDate.of(2020, 3, 31), "Economic Survey", "GDP of Tamil Nadu in trillion rupees for 2019-20"),
                new Statistic(null, "Education", "Kerala", "Literacy Rate", 96.2, LocalDate.of(2018, 12, 31), "NFHS", "Literacy rate in Kerala in percentage"),
                new Statistic(null, "Education", "Bihar", "Literacy Rate", 70.9, LocalDate.of(2018, 12, 31), "NFHS", "Literacy rate in Bihar in percentage"),
                new Statistic(null, "Health", "Tamil Nadu", "Infant Mortality Rate", 15.0, LocalDate.of(2019, 12, 31), "SRS", "Infant mortality rate per 1000 live births in Tamil Nadu"),
                new Statistic(null, "Health", "Madhya Pradesh", "Infant Mortality Rate", 48.0, LocalDate.of(2019, 12, 31), "SRS", "Infant mortality rate per 1000 live births in Madhya Pradesh"),
                new Statistic(null, "Agriculture", "Punjab", "Wheat Production", 17.62, LocalDate.of(2020, 6, 30), "Ministry of Agriculture", "Wheat production in million tonnes in Punjab for 2019-20"),
                new Statistic(null, "Agriculture", "West Bengal", "Rice Production", 15.8, LocalDate.of(2020, 6, 30), "Ministry of Agriculture", "Rice production in million tonnes in West Bengal for 2019-20")
            ));

            System.out.println("Sample data loaded successfully!");
        };
    }
}