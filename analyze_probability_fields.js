/* Analyze probability fields in Met Office API that could indicate warnings */

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/workspace/metoffice_full_response.json', 'utf8'));

console.log('=== Analyzing Probability Fields for Warning Indicators ===\n');

const timeSeries = data.features[0].properties.timeSeries;

console.log('Probability fields found in timeSeries:\n');

timeSeries.forEach((entry, index) => {
    const date = entry.time;
    const probFields = {};
    
    // Extract all probability fields
    Object.keys(entry).forEach(key => {
        if (key.toLowerCase().includes('prob') || 
            key.toLowerCase().includes('heavy') ||
            key.toLowerCase().includes('sferic')) {
            probFields[key] = entry[key];
        }
    });
    
    if (Object.keys(probFields).length > 0) {
        console.log(`\nDate: ${date}`);
        console.log('Probability/Warning Indicators:');
        Object.entries(probFields).forEach(([key, value]) => {
            // Highlight high probabilities that might indicate warnings
            const isHigh = typeof value === 'number' && value > 50;
            const marker = isHigh ? ' ⚠️ HIGH' : '';
            console.log(`  ${key}: ${value}${marker}`);
        });
        
        // Check for warning conditions
        const warnings = [];
        if (entry.dayProbabilityOfHeavyRain > 50 || entry.nightProbabilityOfHeavyRain > 50) {
            warnings.push(`Heavy Rain (${Math.max(entry.dayProbabilityOfHeavyRain || 0, entry.nightProbabilityOfHeavyRain || 0)}%)`);
        }
        if (entry.dayProbabilityOfHeavySnow > 50 || entry.nightProbabilityOfHeavySnow > 50) {
            warnings.push(`Heavy Snow (${Math.max(entry.dayProbabilityOfHeavySnow || 0, entry.nightProbabilityOfHeavySnow || 0)}%)`);
        }
        if (entry.dayProbabilityOfSferics > 50 || entry.nightProbabilityOfSferics > 50) {
            warnings.push(`Thunderstorms (${Math.max(entry.dayProbabilityOfSferics || 0, entry.nightProbabilityOfSferics || 0)}%)`);
        }
        if (entry.midday10MWindSpeed > 20 || entry.midnight10MWindSpeed > 20) {
            warnings.push(`High Winds (${Math.max(entry.midday10MWindSpeed || 0, entry.midnight10MWindSpeed || 0)} m/s)`);
        }
        
        if (warnings.length > 0) {
            console.log('\n  ⚠️ POTENTIAL WARNINGS DETECTED:');
            warnings.forEach(w => console.log(`    - ${w}`));
        }
    }
});

console.log('\n\n=== Summary ===');
console.log('The Met Office API includes probability fields that can be used to generate warnings:');
console.log('  - dayProbabilityOfHeavyRain / nightProbabilityOfHeavyRain');
console.log('  - dayProbabilityOfHeavySnow / nightProbabilityOfHeavySnow');
console.log('  - dayProbabilityOfSferics / nightProbabilityOfSferics (thunderstorms)');
console.log('  - Wind speed data (midday10MWindSpeed, midnight10MWindSpeed)');
console.log('\nThese fields are NOT explicit warnings, but can be used to generate warnings');
console.log('when probabilities exceed certain thresholds (e.g., >50% for heavy rain/snow).');
