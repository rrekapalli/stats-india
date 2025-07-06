package com.statsindia.config;

import com.statsindia.model.Metric;
import com.statsindia.repository.MetricRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.Arrays;

@Configuration
public class MetricDataLoader {

    @Bean
    public CommandLineRunner loadMetricData(MetricRepository repository) {
        return args -> {
            // Clear existing data
            repository.deleteAll();

            // Create sample metrics
            Metric metric1 = new Metric();
            metric1.setCategory("Population");
            metric1.setState("Maharashtra");
            metric1.setMetric("Total Population");
            metric1.setValue(112374333.0);
            metric1.setRecordDate(LocalDate.of(2011, 1, 1));
            metric1.setSource("Census 2011");
            metric1.setDescription("Total population of Maharashtra as per 2011 census");

            Metric metric2 = new Metric();
            metric2.setCategory("Population");
            metric2.setState("Uttar Pradesh");
            metric2.setMetric("Total Population");
            metric2.setValue(199812341.0);
            metric2.setRecordDate(LocalDate.of(2011, 1, 1));
            metric2.setSource("Census 2011");
            metric2.setDescription("Total population of Uttar Pradesh as per 2011 census");

            Metric metric3 = new Metric();
            metric3.setCategory("Economy");
            metric3.setState("Maharashtra");
            metric3.setMetric("GDP");
            metric3.setValue(32.24);
            metric3.setRecordDate(LocalDate.of(2020, 3, 31));
            metric3.setSource("Economic Survey");
            metric3.setDescription("GDP of Maharashtra in trillion rupees for 2019-20");

            Metric metric4 = new Metric();
            metric4.setCategory("Economy");
            metric4.setState("Tamil Nadu");
            metric4.setMetric("GDP");
            metric4.setValue(21.67);
            metric4.setRecordDate(LocalDate.of(2020, 3, 31));
            metric4.setSource("Economic Survey");
            metric4.setDescription("GDP of Tamil Nadu in trillion rupees for 2019-20");

            Metric metric5 = new Metric();
            metric5.setCategory("Education");
            metric5.setState("Kerala");
            metric5.setMetric("Literacy Rate");
            metric5.setValue(96.2);
            metric5.setRecordDate(LocalDate.of(2018, 12, 31));
            metric5.setSource("NFHS");
            metric5.setDescription("Literacy rate in Kerala in percentage");

            Metric metric6 = new Metric();
            metric6.setCategory("Education");
            metric6.setState("Bihar");
            metric6.setMetric("Literacy Rate");
            metric6.setValue(70.9);
            metric6.setRecordDate(LocalDate.of(2018, 12, 31));
            metric6.setSource("NFHS");
            metric6.setDescription("Literacy rate in Bihar in percentage");

            Metric metric7 = new Metric();
            metric7.setCategory("Health");
            metric7.setState("Tamil Nadu");
            metric7.setMetric("Infant Mortality Rate");
            metric7.setValue(15.0);
            metric7.setRecordDate(LocalDate.of(2019, 12, 31));
            metric7.setSource("SRS");
            metric7.setDescription("Infant mortality rate per 1000 live births in Tamil Nadu");

            Metric metric8 = new Metric();
            metric8.setCategory("Health");
            metric8.setState("Madhya Pradesh");
            metric8.setMetric("Infant Mortality Rate");
            metric8.setValue(48.0);
            metric8.setRecordDate(LocalDate.of(2019, 12, 31));
            metric8.setSource("SRS");
            metric8.setDescription("Infant mortality rate per 1000 live births in Madhya Pradesh");

            Metric metric9 = new Metric();
            metric9.setCategory("Agriculture");
            metric9.setState("Punjab");
            metric9.setMetric("Wheat Production");
            metric9.setValue(17.62);
            metric9.setRecordDate(LocalDate.of(2020, 6, 30));
            metric9.setSource("Ministry of Agriculture");
            metric9.setDescription("Wheat production in million tonnes in Punjab for 2019-20");

            Metric metric10 = new Metric();
            metric10.setCategory("Agriculture");
            metric10.setState("West Bengal");
            metric10.setMetric("Rice Production");
            metric10.setValue(15.8);
            metric10.setRecordDate(LocalDate.of(2020, 6, 30));
            metric10.setSource("Ministry of Agriculture");
            metric10.setDescription("Rice production in million tonnes in West Bengal for 2019-20");

            // Save all metrics
            repository.saveAll(Arrays.asList(metric1, metric2, metric3, metric4, metric5, metric6, metric7, metric8, metric9, metric10));

            System.out.println("Sample metric data loaded successfully!");
        };
    }
}
