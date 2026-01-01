/* Node Helper for MMM-SevereWeatherAlerts
 * Fetches current weather, alerts, and forecast data
 */

const NodeHelper = require("node_helper");
const https = require("https");
const http = require("http");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_WEATHER_DATA") {
            this.fetchWeatherData(payload);
        }
    },

    fetchWeatherData: async function(config) {
        try {
            const [currentAndForecast, alerts] = await Promise.all([
                this.fetchCurrentAndForecast(config),
                this.fetchAlerts(config)
            ]);

            // Cross-reference alerts with forecast days
            const forecastWithWarnings = this.mapAlertsToForecast(alerts, currentAndForecast.forecast);

            this.sendSocketNotification("WEATHER_DATA", {
                current: currentAndForecast.current,
                alerts: alerts,
                forecast: forecastWithWarnings
            });
        } catch (error) {
            console.error("MMM-SevereWeatherAlerts Error:", error.message);
            this.sendSocketNotification("WEATHER_ERROR", {
                message: error.message
            });
        }
    },

    fetchCurrentAndForecast: function(config) {
        return new Promise((resolve, reject) => {
            const unit = config.units === "metric" ? "" : "&temperature_unit=fahrenheit&wind_speed_unit=mph";
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}` +
                       `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day` +
                       `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset` +
                       `&timezone=auto&forecast_days=${config.forecastDays}${unit}`;

            this.makeRequest(url)
                .then(data => {
                    const current = this.parseCurrentWeather(data);
                    const forecast = this.parseOpenMeteoForecast(data);
                    resolve({ current, forecast });
                })
                .catch(err => {
                    console.error("Weather fetch error:", err.message);
                    reject(err);
                });
        });
    },

    fetchAlerts: async function(config) {
        // Check if UK location (roughly)
        const isUK = config.latitude >= 49.5 && config.latitude <= 61 &&
                     config.longitude >= -8.5 && config.longitude <= 2;

        if (isUK) {
            // Try RSS feeds first (no API key needed)
            try {
                const alerts = await this.fetchMetOfficeRSSAlerts(config);
                console.log(`Met Office RSS returned ${alerts ? alerts.length : 0} alert(s)`);
                if (alerts) {
                    // Return alerts even if empty (means no warnings)
                    return alerts;
                }
            } catch (err) {
                console.log("Met Office RSS failed, trying API:", err.message);
            }
            
            // Fallback to API if RSS fails and API key is provided
            if (config.metOfficeApiKey) {
                return this.fetchMetOfficeAlerts(config);
            }
        }

        // Use Open-Meteo for alerts (analyze weather data)
        return this.fetchOpenMeteoAlerts(config);
    },

    getUKRegion: function(latitude, longitude) {
        // UK region codes based on approximate boundaries
        // Regions are roughly defined by lat/lon ranges
        
        // Orkney & Shetland
        if (latitude >= 58.5 && longitude >= -3.5) return 'os';
        
        // Highlands & Eilean Siar
        if (latitude >= 56.5 && latitude < 58.5 && longitude >= -6.5 && longitude < -3.5) return 'he';
        
        // Grampian
        if (latitude >= 56.5 && latitude < 58.5 && longitude >= -3.5 && longitude < -1.5) return 'gr';
        
        // Strathclyde
        if (latitude >= 55.0 && latitude < 56.5 && longitude >= -6.5 && longitude < -3.5) return 'st';
        
        // Central, Tayside & Fife
        if (latitude >= 55.5 && latitude < 56.5 && longitude >= -3.5 && longitude < -2.5) return 'ta';
        
        // SW Scotland, Lothian Borders
        if (latitude >= 54.5 && latitude < 56.0 && longitude >= -4.5 && longitude < -2.0) return 'dg';
        
        // Northern Ireland
        if (latitude >= 54.0 && latitude < 55.5 && longitude >= -8.5 && longitude < -5.0) return 'ni';
        
        // Wales
        if (latitude >= 51.0 && latitude < 54.0 && longitude >= -5.5 && longitude < -2.5) return 'wl';
        
        // North West England
        if (latitude >= 53.0 && latitude < 55.0 && longitude >= -3.5 && longitude < -1.5) return 'nw';
        
        // North East England
        if (latitude >= 54.0 && latitude < 55.5 && longitude >= -2.0 && longitude < 0.0) return 'ne';
        
        // Yorkshire & Humber
        if (latitude >= 53.0 && latitude < 54.5 && longitude >= -2.5 && longitude < -0.5) return 'yh';
        
        // West Midlands
        if (latitude >= 52.0 && latitude < 53.5 && longitude >= -3.0 && longitude < -1.0) return 'wm';
        
        // East Midlands
        if (latitude >= 52.0 && latitude < 54.0 && longitude >= -2.0 && longitude < 0.5) return 'em';
        
        // East of England
        if (latitude >= 51.5 && latitude < 53.5 && longitude >= 0.0 && longitude < 1.5) return 'ee';
        
        // South West England
        if (latitude >= 50.0 && latitude < 52.0 && longitude >= -5.5 && longitude < -1.5) return 'sw';
        
        // London & South East England
        if (latitude >= 50.5 && latitude < 52.0 && longitude >= -1.5 && longitude < 1.5) return 'se';
        
        // Default to UK-wide if region can't be determined
        return 'UK';
    },

    fetchMetOfficeRSSAlerts: function(config) {
        return new Promise((resolve, reject) => {
            const region = this.getUKRegion(config.latitude, config.longitude);
            const url = `https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/${region}`;
            
            console.log(`Fetching Met Office RSS alerts for region: ${region} (${config.latitude}, ${config.longitude})`);
            
            this.makeRequest(url)
                .then(xmlData => {
                    if (!xmlData || xmlData.length === 0) {
                        console.log("Met Office RSS returned empty response");
                        resolve([]);
                        return;
                    }
                    this.parseMetOfficeRSS(xmlData)
                        .then(alerts => {
                            console.log(`Parsed ${alerts.length} alert(s) from RSS feed`);
                            resolve(alerts);
                        })
                        .catch(err => {
                            console.log("Error parsing RSS:", err.message);
                            reject(err);
                        });
                })
                .catch(err => {
                    console.log("Error fetching RSS:", err.message);
                    reject(err);
                });
        });
    },

    parseMetOfficeRSS: function(xmlData) {
        return new Promise((resolve, reject) => {
            // Simple XML parsing for RSS feed
            // RSS structure: <rss><channel><item>...</item></channel></rss>
            const alerts = [];
            
            try {
                // Extract items using regex (simple approach, works for RSS)
                const itemRegex = /<item>(.*?)<\/item>/gs;
                const items = xmlData.match(itemRegex) || [];
                
                console.log(`RSS parsing: Found ${items.length} items in feed`);
                
                items.forEach((itemXml, idx) => {
                    try {
                        // Extract fields from RSS item
                        const titleMatch = itemXml.match(/<title>(.*?)<\/title>/s);
                        const descriptionMatch = itemXml.match(/<description>(.*?)<\/description>/s);
                        
                        if (!titleMatch) return;
                        
                        const title = titleMatch[1].trim();
                        const description = descriptionMatch ? descriptionMatch[1].trim() : '';
                        
                        console.log(`RSS item ${idx + 1}: "${title}"`);
                        
                        // Parse title to extract severity and event type
                        // Format: "Yellow warning of snow, ice affecting South West England"
                        let severity = "Yellow";
                        let event = title;
                        
                        if (title.toLowerCase().includes('red warning') || title.toLowerCase().includes('extreme')) {
                            severity = "Red";
                        } else if (title.toLowerCase().includes('amber warning') || title.toLowerCase().includes('severe')) {
                            severity = "Amber";
                        } else if (title.toLowerCase().includes('yellow warning')) {
                            severity = "Yellow";
                        }
                        
                        // Extract event type from title
                        // Format: "[Severity] warning of [event types] affecting [region]"
                        // Example: "Yellow warning of snow, ice affecting South West England"
                        const eventMatch = title.match(/warning of (.+?) affecting/i);
                        if (eventMatch) {
                            event = eventMatch[1].trim();
                            // Capitalize first letter of each word
                            event = event.split(',').map(e => {
                                const trimmed = e.trim();
                                return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                            }).join(', ');
                            event += " Warning";
                        } else {
                            // Fallback: extract from title
                            event = title
                                .replace(/red warning/gi, '')
                                .replace(/amber warning/gi, '')
                                .replace(/yellow warning/gi, '')
                                .replace(/of/gi, '')
                                .replace(/affecting.*/gi, '')
                                .trim();
                            if (!event || event.length < 3) {
                                event = "Weather Warning";
                            }
                        }
                        
                        // Parse dates from description
                        // Format: "valid from 0000 Fri 02 Jan to 1200 Fri 02 Jan"
                        let startDate = null;
                        let endDate = null;
                        
                        const dateTimeRegex = /valid from (\d{4}) (\w{3}) (\d{1,2}) (\w{3}) to (\d{4}) (\w{3}) (\d{1,2}) (\w{3})/i;
                        const dateTimeMatch = description.match(dateTimeRegex);
                        
                        if (dateTimeMatch) {
                            // Parse: "0000 Fri 02 Jan" format
                            const startTime = dateTimeMatch[1]; // "0000"
                            const startDay = dateTimeMatch[2]; // "Fri"
                            const startDateNum = dateTimeMatch[3]; // "02"
                            const startMonth = dateTimeMatch[4]; // "Jan"
                            
                            const endTime = dateTimeMatch[5]; // "1200"
                            const endDay = dateTimeMatch[6]; // "Fri"
                            const endDateNum = dateTimeMatch[7]; // "02"
                            const endMonth = dateTimeMatch[8]; // "Jan"
                            
                            startDate = this.parseMetOfficeDateTime(startDateNum, startMonth, startTime);
                            endDate = this.parseMetOfficeDateTime(endDateNum, endMonth, endTime);
                            
                            console.log(`  Parsed dates: ${startDate} to ${endDate}`);
                        } else {
                            // Try simpler date format: "Fri 02 Jan" or "2026-01-02"
                            const simpleDateRegex = /(\d{4}-\d{2}-\d{2})/g;
                            const dates = description.match(simpleDateRegex) || [];
                            
                            if (dates.length >= 2) {
                                startDate = dates[0] + "T00:00:00Z";
                                endDate = dates[1] + "T23:59:59Z";
                            } else if (dates.length === 1) {
                                startDate = dates[0] + "T00:00:00Z";
                                endDate = dates[0] + "T23:59:59Z";
                            }
                            
                            if (startDate) {
                                console.log(`  Parsed dates (simple): ${startDate} to ${endDate}`);
                            } else {
                                console.log(`  WARNING: Could not parse dates from description`);
                                console.log(`  Description sample: ${description.substring(0, 200)}`);
                            }
                        }
                        
                        // If we have a valid alert
                        if (event && startDate) {
                            alerts.push({
                                event: event,
                                headline: title,
                                description: description,
                                severity: severity,
                                start: startDate,
                                end: endDate || startDate,
                                source: "Met Office RSS"
                            });
                            console.log(`  ✓ Added alert: ${severity} - ${event} - ${startDate}`);
                        } else {
                            console.log(`  ✗ Skipped alert - missing event (${event}) or startDate (${startDate})`);
                        }
                    } catch (itemErr) {
                        console.log(`  Error parsing RSS item ${idx + 1}:`, itemErr.message);
                        console.log(itemErr.stack);
                    }
                });
                
                console.log(`RSS parsing complete: ${alerts.length} alert(s) created`);
                resolve(alerts);
            } catch (err) {
                reject(new Error("Failed to parse RSS XML: " + err.message));
            }
        });
    },

    parseMetOfficeDateTime: function(day, month, time) {
        // Parse format: "02", "Jan", "0000" -> "2026-01-02T00:00:00Z"
        try {
            const monthNames = {
                'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            };
            
            const monthNum = monthNames[month.toLowerCase()] || '01';
            const dayNum = day.padStart(2, '0');
            
            // Determine year - warnings are always for current or very near future
            const now = new Date();
            let year = now.getFullYear();
            const currentMonth = now.getMonth() + 1; // 1-12
            const currentDay = now.getDate();
            const warningMonth = parseInt(monthNum);
            const warningDay = parseInt(dayNum);
            
            // If warning month/day is in the past (same month but day passed, or month passed), use next year
            // Otherwise use current year
            if (warningMonth < currentMonth || 
                (warningMonth === currentMonth && warningDay < currentDay)) {
                year = year + 1;
            }
            
            // Parse time "0000" -> "00:00"
            const hour = time.substring(0, 2);
            const minute = time.substring(2, 4) || "00";
            
            return `${year}-${monthNum}-${dayNum}T${hour}:${minute}:00Z`;
        } catch (err) {
            // Fallback to today
            return new Date().toISOString();
        }
    },

    fetchMetOfficeAlerts: function(config) {
        return new Promise((resolve, reject) => {
            const url = `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/daily?latitude=${config.latitude}&longitude=${config.longitude}`;
            
            const options = {
                headers: {
                    'apikey': config.metOfficeApiKey,
                    'Accept': 'application/json'
                }
            };

            this.makeRequest(url, options)
                .then(data => {
                    const alerts = this.parseMetOfficeAlerts(data);
                    resolve(alerts);
                })
                .catch(err => {
                    console.log("Met Office API failed, falling back to Open-Meteo:", err.message);
                    resolve(this.fetchOpenMeteoAlerts(config));
                });
        });
    },

    fetchOpenMeteoAlerts: function(config) {
        return new Promise((resolve, reject) => {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&current=weather_code,wind_speed_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&timezone=auto&forecast_days=4`;

            this.makeRequest(url)
                .then(data => {
                    const alerts = this.parseOpenMeteoForAlerts(data);
                    resolve(alerts);
                })
                .catch(err => {
                    console.error("Open-Meteo alerts error:", err.message);
                    resolve([]);
                });
        });
    },

    makeRequest: function(url, options = {}) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            
            const req = protocol.get(url, options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    // Check Content-Type to determine if response is JSON or XML
                    const contentType = res.headers['content-type'] || '';
                    const isXML = contentType.includes('xml') || contentType.includes('rss') || 
                                  contentType.includes('text/xml') || contentType.includes('application/rss');
                    
                    if (isXML) {
                        // Return raw XML string for RSS feeds
                        resolve(data);
                    } else {
                        // Try to parse as JSON
                        try {
                            const json = JSON.parse(data);
                            resolve(json);
                        } catch (e) {
                            // If JSON parsing fails but it's not XML, return raw data anyway
                            // (some APIs might return plain text or other formats)
                            resolve(data);
                        }
                    }
                });
            });

            req.on('error', err => {
                reject(err);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    },

    parseCurrentWeather: function(data) {
        if (!data || !data.current) return null;

        const current = data.current;
        const daily = data.daily || {};
        
        const weatherDescriptions = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Foggy",
            48: "Icy fog",
            51: "Light drizzle",
            53: "Drizzle",
            55: "Dense drizzle",
            56: "Freezing drizzle",
            57: "Heavy freezing drizzle",
            61: "Light rain",
            63: "Rain",
            65: "Heavy rain",
            66: "Freezing rain",
            67: "Heavy freezing rain",
            71: "Light snow",
            73: "Snow",
            75: "Heavy snow",
            77: "Snow grains",
            80: "Light showers",
            81: "Showers",
            82: "Heavy showers",
            85: "Snow showers",
            86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with hail",
            99: "Severe thunderstorm"
        };

        return {
            temperature: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            weatherCode: current.weather_code,
            condition: weatherDescriptions[current.weather_code] || "Unknown",
            windSpeed: current.wind_speed_10m,
            windDirection: current.wind_direction_10m,
            isDay: current.is_day === 1,
            sunrise: daily.sunrise ? daily.sunrise[0] : null,
            sunset: daily.sunset ? daily.sunset[0] : null
        };
    },

    parseMetOfficeAlerts: function(data) {
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
    },

    parseOpenMeteoForAlerts: function(data) {
        const alerts = [];
        
        if (!data || !data.daily) return alerts;

        const daily = data.daily;
        const weatherCodes = daily.weather_code || [];
        const windMax = daily.wind_speed_10m_max || [];
        const windGusts = daily.wind_gusts_10m_max || [];
        const dates = daily.time || [];

        for (let i = 0; i < weatherCodes.length; i++) {
            const code = weatherCodes[i];
            const wind = windMax[i] || 0;
            const gusts = windGusts[i] || 0;
            const date = dates[i];

            // Thunderstorms (95-99)
            if (code >= 95) {
                alerts.push({
                    event: "Thunderstorm Warning",
                    description: "Thunderstorms expected with possible lightning and heavy rain. " + 
                                (code >= 96 ? "Hail is also possible." : ""),
                    severity: code >= 96 ? "Amber" : "Yellow",
                    start: date + "T00:00:00",
                    end: date + "T23:59:59",
                    source: "Weather Analysis"
                });
            }

            // Heavy snow (75, 86)
            if (code === 75 || code === 86) {
                alerts.push({
                    event: "Snow Warning",
                    description: "Heavy snow expected. Travel disruption likely. Take care on roads and paths.",
                    severity: "Amber",
                    start: date + "T00:00:00",
                    end: date + "T23:59:59",
                    source: "Weather Analysis"
                });
            }

            // Heavy rain (65, 82)
            if (code === 65 || code === 82) {
                alerts.push({
                    event: "Heavy Rain Warning",
                    description: "Heavy rainfall expected. Surface water flooding possible in places.",
                    severity: "Yellow",
                    start: date + "T00:00:00",
                    end: date + "T23:59:59",
                    source: "Weather Analysis"
                });
            }

            // High winds (>70 km/h sustained or >90 km/h gusts)
            if (wind > 70 || gusts > 90) {
                const severity = wind > 90 || gusts > 120 ? "Amber" : "Yellow";
                alerts.push({
                    event: "Wind Warning",
                    description: `Strong winds expected. Sustained: ${Math.round(wind)} km/h, Gusts: ${Math.round(gusts)} km/h. ` +
                                "Secure loose objects and take care when driving.",
                    severity: severity,
                    start: date + "T00:00:00",
                    end: date + "T23:59:59",
                    source: "Weather Analysis"
                });
            }

            // Dense fog (48)
            if (code === 48) {
                alerts.push({
                    event: "Fog Warning",
                    description: "Dense fog expected with reduced visibility. Allow extra time for travel.",
                    severity: "Yellow",
                    start: date + "T00:00:00",
                    end: date + "T23:59:59",
                    source: "Weather Analysis"
                });
            }
        }

        return this.deduplicateAlerts(alerts);
    },

    parseOpenMeteoForecast: function(data) {
        if (!data || !data.daily) return [];

        const daily = data.daily;
        const forecast = [];

        const weatherDescriptions = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Foggy",
            48: "Icy fog",
            51: "Light drizzle",
            53: "Drizzle",
            55: "Dense drizzle",
            56: "Freezing drizzle",
            57: "Heavy freezing drizzle",
            61: "Light rain",
            63: "Rain",
            65: "Heavy rain",
            66: "Freezing rain",
            67: "Heavy freezing rain",
            71: "Light snow",
            73: "Snow",
            75: "Heavy snow",
            77: "Snow grains",
            80: "Light showers",
            81: "Showers",
            82: "Heavy showers",
            85: "Snow showers",
            86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with hail",
            99: "Severe thunderstorm"
        };

        for (let i = 0; i < daily.time.length; i++) {
            forecast.push({
                date: daily.time[i],
                weatherCode: daily.weather_code[i],
                condition: weatherDescriptions[daily.weather_code[i]] || "Unknown",
                tempMax: daily.temperature_2m_max[i],
                tempMin: daily.temperature_2m_min[i],
                precipitation: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
                hasWarning: false
            });
        }

        return forecast;
    },

    mapAlertsToForecast: function(alerts, forecast) {
        return forecast.map(day => {
            const dayDate = new Date(day.date).toDateString();
            const hasWarning = alerts.some(alert => {
                if (!alert.start) return false;
                const alertDate = new Date(alert.start).toDateString();
                return alertDate === dayDate;
            });
            return { ...day, hasWarning };
        });
    },

    deduplicateAlerts: function(alerts) {
        const seen = new Set();
        const severityOrder = { 'red': 3, 'amber': 2, 'yellow': 1 };
        
        alerts.sort((a, b) => {
            const aOrder = severityOrder[a.severity.toLowerCase()] || 0;
            const bOrder = severityOrder[b.severity.toLowerCase()] || 0;
            return bOrder - aOrder;
        });

        return alerts.filter(alert => {
            const key = alert.event + alert.start;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
});
