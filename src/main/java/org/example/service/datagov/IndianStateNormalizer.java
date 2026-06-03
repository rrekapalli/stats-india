package org.example.service.datagov;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Normalizes state / UT labels from data.gov.in to {@code @svg-maps/india} names. */
public final class IndianStateNormalizer {

    private static final Set<String> NATIONAL_LABELS = Set.of(
            "india",
            "all india",
            "total",
            "all states"
    );

    private static final Map<String, String> STATE_ALIASES = Map.ofEntries(
            Map.entry("andaman and nicobar islands", "Andaman and Nicobar Islands"),
            Map.entry("andaman & nicobar islands", "Andaman and Nicobar Islands"),
            Map.entry("andhra pradesh", "Andhra Pradesh"),
            Map.entry("arunachal pradesh", "Arunachal Pradesh"),
            Map.entry("assam", "Assam"),
            Map.entry("bihar", "Bihar"),
            Map.entry("chandigarh", "Chandigarh"),
            Map.entry("chhattisgarh", "Chhattisgarh"),
            Map.entry("dadra and nagar haveli", "Dadra and Nagar Haveli"),
            Map.entry("dadra & nagar haveli", "Dadra and Nagar Haveli"),
            Map.entry("dadra and nagar haveli and daman and diu", "Dadra and Nagar Haveli and Daman and Diu"),
            Map.entry("daman and diu", "Daman and Diu"),
            Map.entry("daman & diu", "Daman and Diu"),
            Map.entry("delhi", "Delhi"),
            Map.entry("nct of delhi", "Delhi"),
            Map.entry("new delhi", "Delhi"),
            Map.entry("goa", "Goa"),
            Map.entry("gujarat", "Gujarat"),
            Map.entry("haryana", "Haryana"),
            Map.entry("himachal pradesh", "Himachal Pradesh"),
            Map.entry("jammu and kashmir", "Jammu and Kashmir"),
            Map.entry("jammu & kashmir", "Jammu and Kashmir"),
            Map.entry("jharkhand", "Jharkhand"),
            Map.entry("karnataka", "Karnataka"),
            Map.entry("kerala", "Kerala"),
            Map.entry("ladakh", "Ladakh"),
            Map.entry("lakshadweep", "Lakshadweep"),
            Map.entry("madhya pradesh", "Madhya Pradesh"),
            Map.entry("maharashtra", "Maharashtra"),
            Map.entry("manipur", "Manipur"),
            Map.entry("meghalaya", "Meghalaya"),
            Map.entry("mizoram", "Mizoram"),
            Map.entry("nagaland", "Nagaland"),
            Map.entry("odisha", "Odisha"),
            Map.entry("orissa", "Odisha"),
            Map.entry("pondicherry", "Puducherry"),
            Map.entry("puducherry", "Puducherry"),
            Map.entry("punjab", "Punjab"),
            Map.entry("rajasthan", "Rajasthan"),
            Map.entry("sikkim", "Sikkim"),
            Map.entry("tamil nadu", "Tamil Nadu"),
            Map.entry("telangana", "Telangana"),
            Map.entry("tripura", "Tripura"),
            Map.entry("uttar pradesh", "Uttar Pradesh"),
            Map.entry("uttarakhand", "Uttarakhand"),
            Map.entry("uttaranchal", "Uttarakhand"),
            Map.entry("west bengal", "West Bengal")
    );

    private IndianStateNormalizer() {}

    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String key = raw.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
        if (NATIONAL_LABELS.contains(key)) {
            return null;
        }
        if (STATE_ALIASES.containsKey(key)) {
            return STATE_ALIASES.get(key);
        }
        return titleCase(key);
    }

    public static String normalizeLabel(String raw) {
        if (raw == null || raw.isBlank() || "NA".equalsIgnoreCase(raw.trim())) {
            return null;
        }
        return raw.trim();
    }

    public static String stateCodeFor(String stateName) {
        if (stateName == null) {
            return "";
        }
        return switch (stateName) {
            case "Andhra Pradesh" -> "AP";
            case "Arunachal Pradesh" -> "AR";
            case "Assam" -> "AS";
            case "Bihar" -> "BR";
            case "Chhattisgarh" -> "CG";
            case "Delhi" -> "DL";
            case "Goa" -> "GA";
            case "Gujarat" -> "GJ";
            case "Haryana" -> "HR";
            case "Himachal Pradesh" -> "HP";
            case "Jammu and Kashmir" -> "JK";
            case "Jharkhand" -> "JH";
            case "Karnataka" -> "KA";
            case "Kerala" -> "KL";
            case "Madhya Pradesh" -> "MP";
            case "Maharashtra" -> "MH";
            case "Manipur" -> "MN";
            case "Meghalaya" -> "ML";
            case "Mizoram" -> "MZ";
            case "Nagaland" -> "NL";
            case "Odisha" -> "OD";
            case "Punjab" -> "PB";
            case "Rajasthan" -> "RJ";
            case "Sikkim" -> "SK";
            case "Tamil Nadu" -> "TN";
            case "Telangana" -> "TS";
            case "Tripura" -> "TR";
            case "Uttar Pradesh" -> "UP";
            case "Uttarakhand" -> "UK";
            case "West Bengal" -> "WB";
            default -> "";
        };
    }

    private static String titleCase(String value) {
        String[] parts = value.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                sb.append(' ');
            }
            String part = parts[i];
            if (part.length() == 1) {
                sb.append(part.toUpperCase(Locale.ROOT));
            } else {
                sb.append(Character.toUpperCase(part.charAt(0)))
                        .append(part.substring(1));
            }
        }
        return sb.toString();
    }
}
