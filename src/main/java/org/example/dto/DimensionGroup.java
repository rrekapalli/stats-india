package org.example.dto;

import java.util.List;

public record DimensionGroup(String id, String label, List<DimensionItem> items) {}
