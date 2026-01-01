# Testing Met Office API

This guide explains how to test the Met Office API to verify that severe weather warnings are being retrieved correctly.

## Prerequisites

1. **Get a Met Office API Key**:
   - Register at [Met Office DataHub](https://datahub.metoffice.gov.uk/)
   - Subscribe to the free "Site-specific" API
   - Copy your API key

2. **Node.js installed** (should already be available if you're running MagicMirror)

## Test Scripts

Two test scripts are provided:

### 1. Test Single Location (`test_metoffice_api.js`)

Tests a specific UK location and shows the raw API response and parsed alerts.

**Usage:**
```bash
# Using command line argument
node test_metoffice_api.js YOUR_API_KEY 51.5074 -0.1278

# Using environment variable
export METOFFICE_API_KEY=YOUR_API_KEY
node test_metoffice_api.js 51.5074 -0.1278

# Default location (London)
node test_metoffice_api.js YOUR_API_KEY
```

**Example Output:**
```
=== Met Office API Test ===

Location: 51.5074, -0.1278
API Key: abc123def4...

Request URL: https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/daily?latitude=51.5074&longitude=-0.1278
Making request...

Status Code: 200
Status Message: OK

--- Response Body ---
{
  "features": [
    {
      "properties": {
        "warnings": [
          {
            "warningType": "Heavy Rain",
            "headline": "Heavy rain warning",
            "description": "Heavy rainfall expected...",
            "warningLevel": "Yellow",
            "validFrom": "2024-01-15T00:00:00Z",
            "validTo": "2024-01-16T23:59:59Z"
          }
        ]
      }
    }
  ]
}

=== Parsed Alerts ===

Alert 1:
  Event: Heavy Rain
  Severity: Yellow
  Headline: Heavy rain warning
  Start: 2024-01-15T00:00:00Z
  End: 2024-01-16T23:59:59Z
  Description: Heavy rainfall expected...
  Source: Met Office

Total alerts found: 1
```

### 2. Test Multiple Locations (`test_metoffice_locations.js`)

Tests multiple UK locations to find which ones have active warnings. Useful for finding locations with current warnings.

**Usage:**
```bash
# Using command line argument
node test_metoffice_locations.js YOUR_API_KEY

# Using environment variable
export METOFFICE_API_KEY=YOUR_API_KEY
node test_metoffice_locations.js
```

**Example Output:**
```
=== Testing Met Office API for Multiple UK Locations ===

✓ Manchester: 2 warning(s) found
  London: No warnings
  Birmingham: No warnings
✓ Edinburgh: 1 warning(s) found
  Cardiff: No warnings
  ...

=== Summary ===

Found warnings in 2 location(s):

Manchester (53.4808, -2.2426):
  1. [Yellow] Heavy Rain
     2024-01-15T00:00:00Z to 2024-01-16T23:59:59Z
  2. [Amber] Wind
     2024-01-15T12:00:00Z to 2024-01-16T12:00:00Z

Edinburgh (55.9533, -3.1883):
  1. [Yellow] Snow
     2024-01-16T00:00:00Z to 2024-01-17T23:59:59Z
```

## Common UK Test Locations

Here are some UK coordinates you can test with:

| Location | Latitude | Longitude |
|----------|----------|-----------|
| London | 51.5074 | -0.1278 |
| Manchester | 53.4808 | -0.2426 |
| Birmingham | 52.4862 | -1.8904 |
| Edinburgh | 55.9533 | -3.1883 |
| Cardiff | 51.4816 | -3.1791 |
| Belfast | 54.5973 | -5.9301 |
| Leeds | 53.8008 | -1.5491 |
| Glasgow | 55.8642 | -4.2518 |
| Liverpool | 53.4084 | -2.9916 |
| Newcastle | 54.9783 | -1.6178 |

## Troubleshooting

### No Warnings Found

If no warnings are found, this could mean:

1. **No active warnings**: There may genuinely be no warnings for that location
   - Check the [Met Office warnings website](https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings)
   - Try testing during severe weather conditions

2. **API Key Issues**:
   - Verify your API key is correct
   - Check that you've subscribed to the "Site-specific" API
   - Ensure the API key hasn't expired

3. **Location Issues**:
   - Verify coordinates are within UK bounds (latitude: 49.5-61, longitude: -8.5 to 2)
   - Try a different location

### API Errors

**401 Unauthorized**:
- Invalid or missing API key
- API key not activated

**403 Forbidden**:
- API key doesn't have access to this endpoint
- Subscription not active

**404 Not Found**:
- Invalid coordinates (outside UK)
- API endpoint changed

**429 Too Many Requests**:
- Rate limit exceeded
- Wait a few minutes and try again

**500 Server Error**:
- Met Office API issue
- Try again later

## Verifying Integration

After testing the API directly, verify the module integration:

1. **Add API key to config**:
   ```javascript
   {
       module: "MMM-SevereWeatherAlerts",
       config: {
           latitude: 51.5074,
           longitude: -0.1278,
           location: "London",
           metOfficeApiKey: "YOUR_API_KEY"
       }
   }
   ```

2. **Check MagicMirror logs**:
   - Look for "Met Office API failed" messages
   - Check if alerts are being parsed correctly

3. **Verify display**:
   - Alerts should show with day labels (Today/Tomorrow/Day name)
   - Only alerts for forecast days (today + next 3) should display
   - Severity colors should match (Red/Amber/Yellow)

## Expected Behavior

When warnings are present:

- **Alerts Section**: Shows warnings with day labels
  - "Today: [Alert Name]"
  - "Tomorrow: [Alert Name]"
  - "[Day]: [Alert Name]"

- **Forecast Section**: Days with warnings show amber border/background

- **Filtering**: Only warnings for today + next 3 days are shown

## Notes

- The Met Office API may not always have active warnings
- Warnings are location-specific - different areas may have different warnings
- The API falls back to Open-Meteo if Met Office API fails
- Open-Meteo analyzes weather data to generate warnings even without Met Office API
