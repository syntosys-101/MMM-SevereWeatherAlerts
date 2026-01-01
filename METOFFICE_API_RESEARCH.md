# Met Office API Research - Warnings

## Findings

### Current API Response Structure

The Met Office Site-Specific API (`/sitespecific/v0/point/daily`) returns:

```json
{
  "features": [{
    "properties": {
      "requestPointDistance": 221.7807,
      "modelRunDate": "2026-01-01T22:00Z",
      "timeSeries": [
        {
          "time": "2026-01-01T00:00Z",
          "dayProbabilityOfHeavyRain": 0,
          "nightProbabilityOfHeavyRain": 5,
          "dayProbabilityOfHeavySnow": 0,
          "nightProbabilityOfHeavySnow": 1,
          "dayProbabilityOfSferics": 0,  // Thunderstorms
          "nightProbabilityOfSferics": 0,
          "midday10MWindSpeed": 4.63,
          "midnight10MWindSpeed": 4.32,
          // ... other forecast data
        }
      ]
    }
  }]
}
```

### Key Discovery

**The API does NOT return explicit warnings**, but it **DOES return probability fields** that can be used to generate warnings:

1. **Heavy Rain**: `dayProbabilityOfHeavyRain`, `nightProbabilityOfHeavyRain`
2. **Heavy Snow**: `dayProbabilityOfHeavySnow`, `nightProbabilityOfHeavySnow`
3. **Thunderstorms**: `dayProbabilityOfSferics`, `nightProbabilityOfSferics`
4. **High Winds**: `midday10MWindSpeed`, `midnight10MWindSpeed`, `midday10MWindGust`, `midnight10MWindGust`

### Current Code Issue

The code expects `feature.properties.warnings` array, which **does not exist** in the API response. The API only returns forecast data with probability indicators.

### Recommendation

The module should use the **probability fields** from the Met Office API to generate warnings, similar to how it uses Open-Meteo data. This would be more accurate than the current approach.

### Proposed Solution

Update `parseMetOfficeAlerts()` to:
1. Check probability fields in `timeSeries` data
2. Generate warnings when probabilities exceed thresholds:
   - Heavy Rain: `probabilityOfHeavyRain > 50%`
   - Heavy Snow: `probabilityOfHeavySnow > 50%`
   - Thunderstorms: `probabilityOfSferics > 50%`
   - High Winds: `windSpeed > 20 m/s` or `windGust > 25 m/s`

This would make the Met Office integration more useful and accurate.
