/* Deep analysis of Met Office API response to find warnings */

const https = require('https');

const apiKey = "eyJ4NXQjUzI1NiI6Ik5XVTVZakUxTkRjeVl6a3hZbUl4TkdSaFpqSmpOV1l6T1dGaE9XWXpNMk0yTWpRek5USm1OVEE0TXpOaU9EaG1NVFJqWVdNellXUm1ZalUyTTJJeVpBPT0iLCJraWQiOiJnYXRld2F5X2NlcnRpZmljYXRlX2FsaWFzIiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ==.eyJzdWIiOiJzeW50b3N5c0BnbWFpbC5jb21AY2FyYm9uLnN1cGVyIiwiYXBwbGljYXRpb24iOnsib3duZXIiOiJzeW50b3N5c0BnbWFpbC5jb20iLCJ0aWVyUXVvdGFUeXBlIjpudWxsLCJ0aWVyIjoiVW5saW1pdGVkIiwibmFtZSI6InNpdGVfc3BlY2lmaWMtNTc5Nzk4NDUtMWI1NC00ZTNhLWEzZDctMzNkNDUxNTdmNGM3IiwiaWQiOjMzOTQzLCJ1dWlkIjoiMWZlNTRlNGQtZDM1MC00YjZlLWJiZTQtZDExNTBiYTFhYWVjIn0sImlzcyI6Imh0dHBzOlwvXC9hcGktbWFuYWdlci5hcGktbWFuYWdlbWVudC5tZXRvZmZpY2UuY2xvdWQ6NDQzXC9vYXV0aDJcL3Rva2VuIiwidGllckluZm8iOnsid2RoX3NpdGVfc3BlY2lmaWNfZnJlZSI6eyJ0aWVyUXVvdGFUeXBlIjoicmVxdWVzdENvdW50IiwiZ3JhcGhRTE1heENvbXBsZXhpdHkiOjAsImdyYXBoUUxNYXhEZXB0aCI6MCwic3RvcE9uUXVvdGFSZWFjaCI6dHJ1ZSwic3Bpa2VBcnJlc3RMaW1pdCI6MCwic3Bpa2VBcnJlc3RVbml0Ijoic2VjIn19LCJrZXl0eXBlIjoiUFJPRFVDVElPTiIsInN1YnNjcmliZWRBUElzIjpbeyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6IlNpdGVTcGVjaWZpY0ZvcmVjYXN0IiwiY29udGV4dCI6Ilwvc2l0ZXNwZWNpZmljXC92MCIsInB1Ymxpc2hlciI6IkphZ3Vhcl9DSSIsInZlcnNpb24iOiJ2MCIsInN1YnNjcmlwdGlvblRpZXIiOiJ3ZGhfc2l0ZV9zcGVjaWZpY19mcmVlIn1dLCJ0b2tlbl90eXBlIjoiYXBpS2V5IiwiaWF0IjoxNzY3MzA2Nzg4LCJqdGkiOiJmZmRlM2VhZi03YjUwLTRkZTAtYmUwNy1jN2U3N2RjNGViMTMifQ==.C41qWwHcjf1dTcDkPufoo27BA3VmXHM1KCJoBBYJqDnHwM-qdLzTCfGQUDrSzQZj13qzVpH865cnpEXAaEORHv2Cy3LaVBiFL1MGRsbK3OUSncSTiWi5-od4t6gWYNWe2UKNlqlzHAL11xQBVmhF4NLkRI4-zLAN85UxUGoYzR-rpK5NIKUrt0FQvBH_m1pVhddCSBMl3HGdEKUUWTCIvmz_HSKIx7BLfR-knoBeVUFvYmPNVlOzQF7AD4Rxd6Zi3GQb6E_FVLyh-pR1TPYtg-8Q9mzs92qa-zMb8qdCUkpteXMF4Hcc6FaWRo7ewbjjY7jzRWbV_fqvZylOOGHlgA==";

const url = `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/daily?latitude=51.5074&longitude=-0.1278`;

const options = {
    headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
    }
};

console.log('=== Deep Analysis of Met Office API Response ===\n');
console.log('Searching for warnings in all possible locations...\n');

const req = https.get(url, options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            
            // Function to recursively search for warning-related keys
            function findWarnings(obj, path = '') {
                const results = [];
                
                if (typeof obj !== 'object' || obj === null) {
                    return results;
                }
                
                for (const key in obj) {
                    const currentPath = path ? `${path}.${key}` : key;
                    const value = obj[key];
                    
                    // Check if key contains warning-related terms
                    const keyLower = key.toLowerCase();
                    if (keyLower.includes('warn') || 
                        keyLower.includes('alert') || 
                        keyLower.includes('advisory') ||
                        keyLower.includes('severe') ||
                        keyLower.includes('extreme') ||
                        keyLower.includes('hazard')) {
                        results.push({
                            path: currentPath,
                            key: key,
                            value: typeof value === 'object' ? JSON.stringify(value).substring(0, 500) : value
                        });
                    }
                    
                    // Recursively search nested objects
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        results.push(...findWarnings(value, currentPath));
                    } else if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            if (typeof item === 'object' && item !== null) {
                                results.push(...findWarnings(item, `${currentPath}[${index}]`));
                            }
                        });
                    }
                }
                
                return results;
            }
            
            // Search for warnings
            const warningFields = findWarnings(json);
            
            if (warningFields.length > 0) {
                console.log('✓ Found warning-related fields:\n');
                warningFields.forEach(field => {
                    console.log(`  Path: ${field.path}`);
                    console.log(`  Key: ${field.key}`);
                    console.log(`  Value: ${field.value}`);
                    console.log('');
                });
            } else {
                console.log('✗ No warning-related fields found in response');
            }
            
            // Also check the full structure
            console.log('\n=== Full Response Structure ===\n');
            console.log('Top level:', Object.keys(json));
            
            if (json.features && json.features[0]) {
                console.log('\nFeature properties:', Object.keys(json.features[0].properties || {}));
                
                // Check timeSeries for any warning indicators
                if (json.features[0].properties.timeSeries) {
                    console.log('\n=== TimeSeries Sample (first entry) ===');
                    const firstEntry = json.features[0].properties.timeSeries[0];
                    if (firstEntry) {
                        console.log('Keys:', Object.keys(firstEntry));
                        console.log('\nSample entry:');
                        console.log(JSON.stringify(firstEntry, null, 2).substring(0, 1000));
                    }
                }
            }
            
            // Save full response to file for inspection
            const fs = require('fs');
            fs.writeFileSync('/workspace/metoffice_full_response.json', JSON.stringify(json, null, 2));
            console.log('\n✓ Full response saved to metoffice_full_response.json');
            
        } catch (e) {
            console.error('Error:', e.message);
        }
    });
});

req.on('error', err => {
    console.error('Request error:', err.message);
});

req.setTimeout(10000, () => {
    req.destroy();
    console.error('Request timeout');
});
