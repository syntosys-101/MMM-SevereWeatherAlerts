/* Test script for Met Office API
 * 
 * Usage:
 *   node test_metoffice_api.js [API_KEY] [LATITUDE] [LONGITUDE]
 * 
 * Example:
 *   node test_metoffice_api.js YOUR_API_KEY 51.5074 -0.1278
 */

const https = require('https');

// Get command line arguments
const apiKey = process.argv[2] || process.env.METOFFICE_API_KEY;
const latitude = parseFloat(process.argv[3]) || 51.5074; // London default
const longitude = parseFloat(process.argv[4]) || -0.1278;

if (!apiKey) {
    console.error('Error: Met Office API key required');
    console.error('Usage: node test_metoffice_api.js [API_KEY] [LATITUDE] [LONGITUDE]');
    console.error('   Or set METOFFICE_API_KEY environment variable');
    console.error('\nGet your API key from: https://datahub.metoffice.gov.uk/');
    process.exit(1);
}

console.log('=== Met Office API Test ===\n');
console.log(`Location: ${latitude}, ${longitude}`);
console.log(`API Key: ${apiKey.substring(0, 10)}...\n`);

const url = `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/daily?latitude=${latitude}&longitude=${longitude}`;

const options = {
    headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
    }
};

console.log('Request URL:', url);
console.log('Request Headers:', JSON.stringify(options.headers, null, 2));
console.log('\nMaking request...\n');

const req = https.get(url, options, (res) => {
    let data = '';
    
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);
    console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
    console.log('\n--- Response Body ---\n');
    
    res.on('data', chunk => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            
            // Pretty print the full response
            console.log(JSON.stringify(json, null, 2));
            
            // Parse and display alerts
            console.log('\n=== Parsed Alerts ===\n');
            const alerts = parseMetOfficeAlerts(json);
            
            if (alerts.length === 0) {
                console.log('No weather warnings found for this location.');
                console.log('\nNote: This could mean:');
                console.log('  - No active warnings for this location');
                console.log('  - Try a different UK location');
                console.log('  - Check if warnings exist at: https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings');
            } else {
                alerts.forEach((alert, i) => {
                    console.log(`\nAlert ${i + 1}:`);
                    console.log(`  Event: ${alert.event}`);
                    console.log(`  Severity: ${alert.severity}`);
                    console.log(`  Headline: ${alert.headline || 'N/A'}`);
                    console.log(`  Start: ${alert.start}`);
                    console.log(`  End: ${alert.end}`);
                    console.log(`  Description: ${alert.description ? alert.description.substring(0, 100) + '...' : 'N/A'}`);
                    console.log(`  Source: ${alert.source}`);
                });
                
                console.log(`\nTotal alerts found: ${alerts.length}`);
            }
            
        } catch (e) {
            console.error('Failed to parse JSON response:');
            console.error(data);
            console.error('\nError:', e.message);
        }
    });
});

req.on('error', err => {
    console.error('Request error:', err.message);
    console.error('\nPossible issues:');
    console.error('  - Invalid API key');
    console.error('  - Network connectivity');
    console.error('  - API endpoint changed');
});

req.setTimeout(10000, () => {
    req.destroy();
    console.error('Request timeout');
});

// Parse function (same as in node_helper.js)
function parseMetOfficeAlerts(data) {
    const alerts = [];
    
    if (data && data.features) {
        data.features.forEach(feature => {
            if (feature.properties && feature.properties.warnings) {
                feature.properties.warnings.forEach(warning => {
                    alerts.push({
                        event: warning.warningType || "Weather Warning",
                        headline: warning.headline,
                        description: warning.description,
                        severity: warning.warningLevel || "Yellow",
                        start: warning.validFrom,
                        end: warning.validTo,
                        source: "Met Office"
                    });
                });
            }
        });
    }
    
    return alerts;
}
