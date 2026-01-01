/* Check Met Office API structure for warnings */

const https = require('https');

const apiKey = process.argv[2] || "eyJ4NXQjUzI1NiI6Ik5XVTVZakUxTkRjeVl6a3hZbUl4TkdSaFpqSmpOV1l6T1dGaE9XWXpNMk0yTWpRek5USm1OVEE0TXpOaU9EaG1NVFJqWVdNellXUm1ZalUyTTJJeVpBPT0iLCJraWQiOiJnYXRld2F5X2NlcnRpZmljYXRlX2FsaWFzIiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ==.eyJzdWIiOiJzeW50b3N5c0BnbWFpbC5jb21AY2FyYm9uLnN1cGVyIiwiYXBwbGljYXRpb24iOnsib3duZXIiOiJzeW50b3N5c0BnbWFpbC5jb20iLCJ0aWVyUXVvdGFUeXBlIjpudWxsLCJ0aWVyIjoiVW5saW1pdGVkIiwibmFtZSI6InNpdGVfc3BlY2lmaWMtNTc5Nzk4NDUtMWI1NC00ZTNhLWEzZDctMzNkNDUxNTdmNGM3IiwiaWQiOjMzOTQzLCJ1dWlkIjoiMWZlNTRlNGQtZDM1MC00YjZlLWJiZTQtZDExNTBiYTFhYWVjIn0sImlzcyI6Imh0dHBzOlwvXC9hcGktbWFuYWdlci5hcGktbWFuYWdlbWVudC5tZXRvZmZpY2UuY2xvdWQ6NDQzXC9vYXV0aDJcL3Rva2VuIiwidGllckluZm8iOnsid2RoX3NpdGVfc3BlY2lmaWNfZnJlZSI6eyJ0aWVyUXVvdGFUeXBlIjoicmVxdWVzdENvdW50IiwiZ3JhcGhRTE1heENvbXBsZXhpdHkiOjAsImdyYXBoUUxNYXhEZXB0aCI6MCwic3RvcE9uUXVvdGFSZWFjaCI6dHJ1ZSwic3Bpa2VBcnJlc3RMaW1pdCI6MCwic3Bpa2VBcnJlc3RVbml0Ijoic2VjIn19LCJrZXl0eXBlIjoiUFJPRFVDVElPTiIsInN1YnNjcmliZWRBUElzIjpbeyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6IlNpdGVTcGVjaWZpY0ZvcmVjYXN0IiwiY29udGV4dCI6Ilwvc2l0ZXNwZWNpZmljXC92MCIsInB1Ymxpc2hlciI6IkphZ3Vhcl9DSSIsInZlcnNpb24iOiJ2MCIsInN1YnNjcmlwdGlvblRpZXIiOiJ3ZGhfc2l0ZV9zcGVjaWZpY19mcmVlIn1dLCJ0b2tlbl90eXBlIjoiYXBpS2V5IiwiaWF0IjoxNzY3MzA2Nzg4LCJqdGkiOiJmZmRlM2VhZi03YjUwLTRkZTAtYmUwNy1jN2U3N2RjNGViMTMifQ==.C41qWwHcjf1dTcDkPufoo27BA3VmXHM1KCJoBBYJqDnHwM-qdLzTCfGQUDrSzQZj13qzVpH865cnpEXAaEORHv2Cy3LaVBiFL1MGRsbK3OUSncSTiWi5-od4t6gWYNWe2UKNlqlzHAL11xQBVmhF4NLkRI4-zLAN85UxUGoYzR-rpK5NIKUrt0FQvBH_m1pVhddCSBMl3HGdEKUUWTCIvmz_HSKIx7BLfR-knoBeVUFvYmPNVlOzQF7AD4Rxd6Zi3GQb6E_FVLyh-pR1TPYtg-8Q9mzs92qa-zMb8qdCUkpteXMF4Hcc6FaWRo7ewbjjY7jzRWbV_fqvZylOOGHlgA==";

console.log('=== Checking Met Office API Structure ===\n');

// Test the current endpoint
const url = `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/daily?latitude=51.5074&longitude=-0.1278`;

const options = {
    headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
    }
};

console.log('Testing endpoint:', url);
console.log('Looking for warnings structure...\n');

const req = https.get(url, options, (res) => {
    let data = '';
    
    res.on('data', chunk => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            
            console.log('=== Response Structure Analysis ===\n');
            console.log('Top-level keys:', Object.keys(json));
            
            if (json.features && json.features.length > 0) {
                console.log('\nFeatures array length:', json.features.length);
                console.log('First feature keys:', Object.keys(json.features[0]));
                
                if (json.features[0].properties) {
                    console.log('\nProperties keys:', Object.keys(json.features[0].properties));
                    
                    // Check for warnings
                    if (json.features[0].properties.warnings) {
                        console.log('\n✓ Found warnings property!');
                        console.log('Warnings:', JSON.stringify(json.features[0].properties.warnings, null, 2));
                    } else {
                        console.log('\n✗ No warnings property found');
                        console.log('Available properties:', Object.keys(json.features[0].properties));
                    }
                    
                    // Check if warnings might be elsewhere
                    console.log('\n=== Checking for warning-related fields ===');
                    const props = json.features[0].properties;
                    Object.keys(props).forEach(key => {
                        if (key.toLowerCase().includes('warn') || 
                            key.toLowerCase().includes('alert') ||
                            key.toLowerCase().includes('advisory')) {
                            console.log(`Found potential warning field: ${key}`);
                            console.log('Value:', JSON.stringify(props[key], null, 2).substring(0, 500));
                        }
                    });
                }
            }
            
            // Check if there's a different structure
            console.log('\n=== Full response structure (first 1000 chars) ===');
            console.log(JSON.stringify(json, null, 2).substring(0, 1000));
            
        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.log('Raw response (first 500 chars):', data.substring(0, 500));
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
