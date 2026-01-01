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

        if (isUK && config.metOfficeApiKey) {
            return this.fetchMetOfficeAlerts(config);
        }

        // Use Open-Meteo for alerts (analyze weather data)
        return this.fetchOpenMeteoAlerts(config);
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
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (e) {
                        reject(new Error('Failed to parse response'));
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
        
        // First, check for explicit warnings (if they exist)
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
        
        // If no explicit warnings, generate warnings from probability fields in timeSeries
        if (alerts.length === 0 && data && data.features) {
            data.features.forEach(feature => {
                if (feature.properties && feature.properties.timeSeries) {
                    feature.properties.timeSeries.forEach(day => {
                        if (!day.time) return;
                        
                        const date = day.time.split('T')[0]; // Extract date part
                        const dayProbHeavyRain = day.dayProbabilityOfHeavyRain || 0;
                        const nightProbHeavyRain = day.nightProbabilityOfHeavyRain || 0;
                        const dayProbHeavySnow = day.dayProbabilityOfHeavySnow || 0;
                        const nightProbHeavySnow = day.nightProbabilityOfHeavySnow || 0;
                        const dayProbSferics = day.dayProbabilityOfSferics || 0;
                        const nightProbSferics = day.nightProbabilityOfSferics || 0;
                        const maxWindSpeed = Math.max(day.midday10MWindSpeed || 0, day.midnight10MWindSpeed || 0);
                        const maxWindGust = Math.max(day.midday10MWindGust || 0, day.midnight10MWindGust || 0);
                        
                        // Heavy Rain Warning (probability > 50%)
                        if (dayProbHeavyRain > 50 || nightProbHeavyRain > 50) {
                            const maxProb = Math.max(dayProbHeavyRain, nightProbHeavyRain);
                            alerts.push({
                                event: "Heavy Rain Warning",
                                description: `Heavy rainfall expected (${maxProb}% probability). Surface water flooding possible in places.`,
                                severity: maxProb > 70 ? "Amber" : "Yellow",
                                start: date + "T00:00:00",
                                end: date + "T23:59:59",
                                source: "Met Office Analysis"
                            });
                        }
                        
                        // Heavy Snow Warning (probability > 50%)
                        if (dayProbHeavySnow > 50 || nightProbHeavySnow > 50) {
                            const maxProb = Math.max(dayProbHeavySnow, nightProbHeavySnow);
                            alerts.push({
                                event: "Snow Warning",
                                description: `Heavy snow expected (${maxProb}% probability). Travel disruption likely. Take care on roads and paths.`,
                                severity: maxProb > 70 ? "Amber" : "Yellow",
                                start: date + "T00:00:00",
                                end: date + "T23:59:59",
                                source: "Met Office Analysis"
                            });
                        }
                        
                        // Thunderstorm Warning (probability > 50%)
                        if (dayProbSferics > 50 || nightProbSferics > 50) {
                            const maxProb = Math.max(dayProbSferics, nightProbSferics);
                            alerts.push({
                                event: "Thunderstorm Warning",
                                description: `Thunderstorms expected (${maxProb}% probability) with possible lightning and heavy rain.`,
                                severity: maxProb > 70 ? "Amber" : "Yellow",
                                start: date + "T00:00:00",
                                end: date + "T23:59:59",
                                source: "Met Office Analysis"
                            });
                        }
                        
                        // High Wind Warning (>20 m/s sustained or >25 m/s gusts)
                        // Convert m/s to km/h for comparison (20 m/s ≈ 72 km/h, 25 m/s ≈ 90 km/h)
                        if (maxWindSpeed > 20 || maxWindGust > 25) {
                            const windKmh = Math.round(maxWindSpeed * 3.6);
                            const gustKmh = Math.round(maxWindGust * 3.6);
                            const severity = maxWindSpeed > 25 || maxWindGust > 30 ? "Amber" : "Yellow";
                            alerts.push({
                                event: "Wind Warning",
                                description: `Strong winds expected. Sustained: ${windKmh} km/h, Gusts: ${gustKmh} km/h. Secure loose objects and take care when driving.`,
                                severity: severity,
                                start: date + "T00:00:00",
                                end: date + "T23:59:59",
                                source: "Met Office Analysis"
                            });
                        }
                    });
                }
            });
        }

        return this.deduplicateAlerts(alerts);
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
