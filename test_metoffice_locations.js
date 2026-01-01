/* Test script to try multiple UK locations to find active warnings
 * 
 * Usage:
 *   node test_metoffice_locations.js [API_KEY]
 */

const https = require('https');

const apiKey = process.argv[2] || process.env.METOFFICE_API_KEY;

if (!apiKey) {
    console.error('Error: Met Office API key required');
    console.error('Usage: node test_metoffice_locations.js [API_KEY]');
    console.error('   Or set METOFFICE_API_KEY environment variable');
    process.exit(1);
}

// UK locations that might have warnings
const locations = [
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Manchester', lat: 53.4808, lon: -2.2426 },
    { name: 'Birmingham', lat: 52.4862, lon: -1.8904 },
    { name: 'Edinburgh', lat: 55.9533, lon: -3.1883 },
    { name: 'Cardiff', lat: 51.4816, lon: -3.1791 },
    { name: 'Belfast', lat: 54.5973, lon: -5.9301 },
    { name: 'Leeds', lat: 53.8008, lon: -1.5491 },
    { name: 'Glasgow', lat: 55.8642, lon: -4.2518 },
    { name: 'Liverpool', lat: 53.4084, lon: -2.9916 },
    { name: 'Newcastle', lat: 54.9783, lon: -1.6178 }
];

console.log('=== Testing Met Office API for Multiple UK Locations ===\n');
console.log(`API Key: ${apiKey.substring(0, 10)}...\n`);

let completed = 0;
let locationsWithWarnings = [];

function testLocation(location) {
    return new Promise((resolve) => {
        const url = `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/daily?latitude=${location.lat}&longitude=${location.lon}`;
        
        const options = {
            headers: {
                'apikey': apiKey,
                'Accept': 'application/json'
            }
        };
        
        const req = https.get(url, options, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const alerts = parseMetOfficeAlerts(json);
                    
                    if (alerts.length > 0) {
                        locationsWithWarnings.push({
                            location: location.name,
                            lat: location.lat,
                            lon: location.lon,
                            alerts: alerts
                        });
                        console.log(`✓ ${location.name}: ${alerts.length} warning(s) found`);
                    } else {
                        console.log(`  ${location.name}: No warnings`);
                    }
                } catch (e) {
                    console.log(`✗ ${location.name}: Error - ${e.message}`);
                }
                
                completed++;
                resolve();
            });
        });
        
        req.on('error', err => {
            console.log(`✗ ${location.name}: Request failed - ${err.message}`);
            completed++;
            resolve();
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            console.log(`✗ ${location.name}: Timeout`);
            completed++;
            resolve();
        });
    });
}

// Test all locations sequentially to avoid rate limiting
async function testAllLocations() {
    for (const location of locations) {
        await testLocation(location);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n=== Summary ===\n');
    
    if (locationsWithWarnings.length === 0) {
        console.log('No active warnings found in any of the tested locations.');
        console.log('\nThis could mean:');
        console.log('  - There are currently no active weather warnings');
        console.log('  - Check Met Office website: https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings');
        console.log('  - Try testing during severe weather conditions');
    } else {
        console.log(`Found warnings in ${locationsWithWarnings.length} location(s):\n`);
        locationsWithWarnings.forEach(loc => {
            console.log(`${loc.location} (${loc.lat}, ${loc.lon}):`);
            loc.alerts.forEach((alert, i) => {
                console.log(`  ${i + 1}. [${alert.severity}] ${alert.event}`);
                console.log(`     ${alert.start} to ${alert.end}`);
            });
            console.log('');
        });
        
        console.log('\nYou can test a specific location with:');
        const first = locationsWithWarnings[0];
        console.log(`  node test_metoffice_api.js ${apiKey} ${first.lat} ${first.lon}`);
    }
}

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

testAllLocations().catch(console.error);
