/* MagicMirror² Module: MMM-SevereWeatherAlerts
 * Displays today's weather, severe warnings, and 3-day forecast
 * Uses Met Office for UK, Open-Meteo for other regions
 */

Module.register("MMM-SevereWeatherAlerts", {
    defaults: {
        latitude: 51.5074,          // Default: London
        longitude: -0.1278,
        location: "London",
        updateInterval: 10 * 60 * 1000,  // 10 minutes
        animationSpeed: 1000,
        showForecast: true,
        forecastDays: 3,
        units: "metric",            // metric or imperial
        language: "en",
        rotated: false,             // Set true if display is rotated
        alertSound: false,          // Play sound on new alert
        metOfficeApiKey: null,      // Optional: Met Office DataHub API key for UK
        showNoAlertsMessage: true,
        compactMode: false,         // Smaller display for side panels
        colors: {
            // Base colors
            text: "#ffffff",
            backgroundOverlay: "rgba(0, 0, 0, 0.25)",
            border: "rgba(255, 255, 255, 0.08)",
            
            // Loading & Error states
            loading: "#00ff00",
            errorText: "#ff6b6b",
            errorBackground: "rgba(255, 0, 0, 0.1)",
            errorBorder: "#ff0000",
            
            // Today's weather section
            today: {
                location: "rgba(255, 255, 255, 0.5)",
                icon: "#00ff00",
                iconGlow: "rgba(0, 255, 0, 0.4)",
                temperature: "#ffffff",
                feelsLike: "rgba(255, 255, 255, 0.6)",
                condition: "rgba(255, 255, 255, 0.85)",
                detailText: "rgba(255, 255, 255, 0.6)",
                detailIcon: "#00ff00",
                detailIconOpacity: 0.8,
                detailSuperscript: "rgba(255, 255, 255, 0.5)"
            },
            
            // No alerts message
            noAlerts: {
                text: "#00ff00",
                background: "rgba(0, 255, 0, 0.05)",
                border: "rgba(0, 255, 0, 0.15)"
            },
            
            // Alert severity colors
            alerts: {
                red: {
                    backgroundStart: "rgba(180, 0, 0, 0.9)",
                    backgroundEnd: "rgba(100, 0, 0, 0.85)",
                    border: "#ff0000",
                    shadowOuter: "rgba(255, 0, 0, 0.3)",
                    shadowInner: "rgba(255, 0, 0, 0.1)",
                    shadowOuterAnimated: "rgba(255, 0, 0, 0.5)",
                    shadowInnerAnimated: "rgba(255, 0, 0, 0.2)",
                    stripe1: "#ff0000",
                    stripe2: "#000000"
                },
                amber: {
                    backgroundStart: "rgba(180, 100, 0, 0.9)",
                    backgroundEnd: "rgba(120, 60, 0, 0.85)",
                    border: "#ff8c00",
                    shadowOuter: "rgba(255, 140, 0, 0.2)",
                    shadowInner: "rgba(255, 140, 0, 0.1)"
                },
                yellow: {
                    backgroundStart: "rgba(180, 160, 0, 0.85)",
                    backgroundEnd: "rgba(100, 90, 0, 0.8)",
                    border: "#ffd700",
                    shadowOuter: "rgba(255, 215, 0, 0.2)",
                    shadowInner: "rgba(255, 215, 0, 0.1)"
                },
                badgeBackground: "rgba(0, 0, 0, 0.3)",
                descriptionBorder: "rgba(255, 255, 255, 0.3)"
            },
            
            // Forecast section
            forecast: {
                title: "rgba(255, 255, 255, 0.5)",
                dayBackground: "rgba(255, 255, 255, 0.03)",
                dayHover: "rgba(255, 255, 255, 0.08)",
                dayName: "rgba(255, 255, 255, 0.85)",
                icon: "#00ff00",
                iconGlow: "rgba(0, 255, 0, 0.3)",
                warningIcon: "#ff8c00",
                warningIconGlow: "rgba(255, 140, 0, 0.4)",
                warningBorder: "rgba(255, 140, 0, 0.4)",
                warningBackground: "rgba(255, 140, 0, 0.08)",
                condition: "rgba(255, 255, 255, 0.6)",
                tempHigh: "#ff6b6b",
                tempLow: "#6bc5ff",
                precipitation: "#6bc5ff"
            },
            
            // Scrollbar
            scrollbar: {
                track: "rgba(0, 0, 0, 0.2)",
                thumb: "rgba(0, 255, 0, 0.3)"
            }
        }
    },

    getStyles: function() {
        return ["MMM-SevereWeatherAlerts.css", "weather-icons.css"];
    },

    getScripts: function() {
        return [];
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.alerts = [];
        this.forecast = [];
        this.current = null;
        this.loaded = false;
        this.error = null;
        this.lastUpdate = null;
        
        // Request initial data
        this.getData();
        
        // Schedule updates
        setInterval(() => {
            this.getData();
        }, this.config.updateInterval);
    },

    getData: function() {
        this.sendSocketNotification("GET_WEATHER_DATA", {
            latitude: this.config.latitude,
            longitude: this.config.longitude,
            location: this.config.location,
            metOfficeApiKey: this.config.metOfficeApiKey,
            units: this.config.units,
            forecastDays: this.config.forecastDays + 1  // +1 because we skip today
        });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "WEATHER_DATA") {
            this.alerts = payload.alerts || [];
            this.forecast = payload.forecast || [];
            this.current = payload.current || null;
            this.loaded = true;
            this.error = null;
            this.lastUpdate = new Date();
            this.updateDom(this.config.animationSpeed);
        } else if (notification === "WEATHER_ERROR") {
            this.error = payload.message;
            this.loaded = true;
            this.updateDom(this.config.animationSpeed);
        }
    },

    applyColors: function(wrapper) {
        // MagicMirror merges user config with defaults, so this.config.colors will have all defaults
        // plus any user overrides. We can safely access all properties.
        const colors = this.config.colors;
        const style = wrapper.style;
        
        // Base colors
        style.setProperty('--color-text', colors.text);
        style.setProperty('--color-background-overlay', colors.backgroundOverlay);
        style.setProperty('--color-border', colors.border);
        
        // Loading & Error states
        style.setProperty('--color-loading', colors.loading);
        style.setProperty('--color-error-text', colors.errorText);
        style.setProperty('--color-error-background', colors.errorBackground);
        style.setProperty('--color-error-border', colors.errorBorder);
        
        // Today's weather section
        const today = colors.today || {};
        style.setProperty('--color-today-location', today.location);
        style.setProperty('--color-today-icon', today.icon);
        style.setProperty('--color-today-icon-glow', today.iconGlow);
        style.setProperty('--color-today-temperature', today.temperature);
        style.setProperty('--color-today-feels-like', today.feelsLike);
        style.setProperty('--color-today-condition', today.condition);
        style.setProperty('--color-today-detail-text', today.detailText);
        style.setProperty('--color-today-detail-icon', today.detailIcon);
        style.setProperty('--color-today-detail-icon-opacity', today.detailIconOpacity);
        style.setProperty('--color-today-detail-superscript', today.detailSuperscript);
        
        // No alerts state
        const noAlerts = colors.noAlerts || {};
        style.setProperty('--color-no-alerts-text', noAlerts.text);
        style.setProperty('--color-no-alerts-background', noAlerts.background);
        style.setProperty('--color-no-alerts-border', noAlerts.border);
        
        // Alert severity colors
        const alerts = colors.alerts || {};
        const red = alerts.red || {};
        style.setProperty('--color-alert-red-background-start', red.backgroundStart);
        style.setProperty('--color-alert-red-background-end', red.backgroundEnd);
        style.setProperty('--color-alert-red-border', red.border);
        style.setProperty('--color-alert-red-shadow-outer', red.shadowOuter);
        style.setProperty('--color-alert-red-shadow-inner', red.shadowInner);
        style.setProperty('--color-alert-red-shadow-outer-animated', red.shadowOuterAnimated);
        style.setProperty('--color-alert-red-shadow-inner-animated', red.shadowInnerAnimated);
        style.setProperty('--color-alert-red-stripe1', red.stripe1);
        style.setProperty('--color-alert-red-stripe2', red.stripe2);
        
        const amber = alerts.amber || {};
        style.setProperty('--color-alert-amber-background-start', amber.backgroundStart);
        style.setProperty('--color-alert-amber-background-end', amber.backgroundEnd);
        style.setProperty('--color-alert-amber-border', amber.border);
        style.setProperty('--color-alert-amber-shadow-outer', amber.shadowOuter);
        style.setProperty('--color-alert-amber-shadow-inner', amber.shadowInner);
        
        const yellow = alerts.yellow || {};
        style.setProperty('--color-alert-yellow-background-start', yellow.backgroundStart);
        style.setProperty('--color-alert-yellow-background-end', yellow.backgroundEnd);
        style.setProperty('--color-alert-yellow-border', yellow.border);
        style.setProperty('--color-alert-yellow-shadow-outer', yellow.shadowOuter);
        style.setProperty('--color-alert-yellow-shadow-inner', yellow.shadowInner);
        
        style.setProperty('--color-alert-badge-background', alerts.badgeBackground);
        style.setProperty('--color-alert-description-border', alerts.descriptionBorder);
        
        // Forecast section
        const forecast = colors.forecast || {};
        style.setProperty('--color-forecast-title', forecast.title);
        style.setProperty('--color-forecast-day-background', forecast.dayBackground);
        style.setProperty('--color-forecast-day-hover', forecast.dayHover);
        style.setProperty('--color-forecast-day-name', forecast.dayName);
        style.setProperty('--color-forecast-icon', forecast.icon);
        style.setProperty('--color-forecast-icon-glow', forecast.iconGlow);
        style.setProperty('--color-forecast-warning-icon', forecast.warningIcon);
        style.setProperty('--color-forecast-warning-icon-glow', forecast.warningIconGlow);
        style.setProperty('--color-forecast-warning-border', forecast.warningBorder);
        style.setProperty('--color-forecast-warning-background', forecast.warningBackground);
        style.setProperty('--color-forecast-condition', forecast.condition);
        style.setProperty('--color-forecast-temp-high', forecast.tempHigh);
        style.setProperty('--color-forecast-temp-low', forecast.tempLow);
        style.setProperty('--color-forecast-precipitation', forecast.precipitation);
        
        // Scrollbar
        const scrollbar = colors.scrollbar || {};
        style.setProperty('--color-scrollbar-track', scrollbar.track);
        style.setProperty('--color-scrollbar-thumb', scrollbar.thumb);
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "mmm-severe-weather-alerts" + (this.config.compactMode ? " compact" : "");
        
        if (this.config.rotated) {
            wrapper.classList.add("rotated");
        }
        
        // Apply color configuration
        this.applyColors(wrapper);

        if (!this.loaded) {
            wrapper.innerHTML = '<div class="loading"><i class="fa fa-spinner fa-pulse"></i> Loading weather data...</div>';
            return wrapper;
        }

        if (this.error) {
            wrapper.innerHTML = '<div class="error"><i class="fa fa-exclamation-triangle"></i> ' + this.error + '</div>';
            return wrapper;
        }

        // === TODAY'S WEATHER (TOP - LARGE & CENTERED) ===
        if (this.current) {
            const todayContainer = document.createElement("div");
            todayContainer.className = "today-container";
            
            // Location header (inside box, like forecast title)
            const locationHeader = document.createElement("div");
            locationHeader.className = "today-location";
            locationHeader.textContent = this.config.location;
            todayContainer.appendChild(locationHeader);

            // Main weather row: icon + temperature
            const mainRow = document.createElement("div");
            mainRow.className = "today-main";
            
            const weatherIcon = document.createElement("span");
            weatherIcon.className = "today-icon wi " + this.getWeatherIconClass(this.current.weatherCode, this.current.isDay);
            mainRow.appendChild(weatherIcon);

            const tempDisplay = document.createElement("span");
            tempDisplay.className = "today-temp";
            const unit = this.config.units === "metric" ? "°" : "°";
            tempDisplay.textContent = Math.round(this.current.temperature * 10) / 10 + unit;
            mainRow.appendChild(tempDisplay);

            todayContainer.appendChild(mainRow);

            // Feels like
            if (this.current.feelsLike !== undefined) {
                const feelsLike = document.createElement("div");
                feelsLike.className = "today-feels-like";
                feelsLike.textContent = "Feels like " + Math.round(this.current.feelsLike * 10) / 10 + unit;
                todayContainer.appendChild(feelsLike);
            }

            // Condition text
            const condition = document.createElement("div");
            condition.className = "today-condition";
            condition.textContent = this.current.condition;
            todayContainer.appendChild(condition);

            // Details row: wind, humidity, sunrise/sunset
            const detailsRow = document.createElement("div");
            detailsRow.className = "today-details";

            // Wind
            if (this.current.windSpeed !== undefined) {
                const wind = document.createElement("span");
                wind.className = "today-detail";
                const windDir = this.getWindDirection(this.current.windDirection);
                wind.innerHTML = '<span class="wi wi-strong-wind"></span> ' + 
                                Math.round(this.current.windSpeed) + ' <sup>' + windDir + '</sup>';
                detailsRow.appendChild(wind);
            }

            // Humidity
            if (this.current.humidity !== undefined) {
                const humidity = document.createElement("span");
                humidity.className = "today-detail";
                humidity.innerHTML = '<span class="wi wi-humidity"></span> ' + this.current.humidity + '%';
                detailsRow.appendChild(humidity);
            }

            // Sunrise/Sunset
            if (this.current.sunrise || this.current.sunset) {
                const sunTimes = document.createElement("span");
                sunTimes.className = "today-detail";
                if (this.current.isDay && this.current.sunset) {
                    sunTimes.innerHTML = '<span class="wi wi-sunset"></span> ' + this.formatTime(this.current.sunset);
                } else if (this.current.sunrise) {
                    sunTimes.innerHTML = '<span class="wi wi-sunrise"></span> ' + this.formatTime(this.current.sunrise);
                }
                detailsRow.appendChild(sunTimes);
            }

            todayContainer.appendChild(detailsRow);
            wrapper.appendChild(todayContainer);
        }

        // === ALERTS SECTION (MIDDLE) ===
        const alertsContainer = document.createElement("div");
        alertsContainer.className = "alerts-container";

        // Filter alerts to only show those for forecast days (today + next 3 days)
        // Only show alerts for days that are in the forecast
        const forecastDates = new Set();
        if (this.forecast && this.forecast.length > 0) {
            // Include today and next 3 forecast days
            const daysToShow = Math.min(4, this.forecast.length);
            for (let i = 0; i < daysToShow; i++) {
                const forecastDay = this.forecast[i];
                if (forecastDay && forecastDay.date) {
                    const dayDate = new Date(forecastDay.date);
                    dayDate.setHours(0, 0, 0, 0);
                    forecastDates.add(dayDate.getTime());
                }
            }
        }

        // Filter alerts to only those matching forecast days
        const upcomingAlerts = this.alerts.filter(alert => {
            if (!alert.start) return false;
            const alertStart = new Date(alert.start);
            alertStart.setHours(0, 0, 0, 0);
            return forecastDates.has(alertStart.getTime());
        });

        if (upcomingAlerts.length > 0) {
            upcomingAlerts.forEach(alert => {
                const alertEl = this.createAlertElement(alert);
                alertsContainer.appendChild(alertEl);
            });
        } else if (this.config.showNoAlertsMessage) {
            const noAlerts = document.createElement("div");
            noAlerts.className = "no-alerts";
            noAlerts.innerHTML = '<i class="fa fa-check-circle"></i> No weather warnings';
            alertsContainer.appendChild(noAlerts);
        }

        wrapper.appendChild(alertsContainer);

        // === FORECAST SECTION (BOTTOM - Starting from TOMORROW) ===
        if (this.config.showForecast && this.forecast.length > 1) {
            const forecastContainer = document.createElement("div");
            forecastContainer.className = "forecast-container";
            
            const forecastTitle = document.createElement("div");
            forecastTitle.className = "forecast-title";
            forecastTitle.textContent = this.config.forecastDays + "-Day Forecast";
            forecastContainer.appendChild(forecastTitle);

            const forecastGrid = document.createElement("div");
            forecastGrid.className = "forecast-grid";

            // Skip today (index 0), start from tomorrow
            const futureForecast = this.forecast.slice(1, this.config.forecastDays + 1);
            
            futureForecast.forEach(day => {
                const dayEl = this.createForecastElement(day);
                forecastGrid.appendChild(dayEl);
            });

            forecastContainer.appendChild(forecastGrid);
            wrapper.appendChild(forecastContainer);
        }

        return wrapper;
    },

    createAlertElement: function(alert) {
        const alertEl = document.createElement("div");
        alertEl.className = "alert alert-" + this.getSeverityClass(alert.severity);

        const header = document.createElement("div");
        header.className = "alert-header";

        const icon = document.createElement("i");
        icon.className = "fa " + this.getAlertIcon(alert.event);
        header.appendChild(icon);

        const title = document.createElement("span");
        title.className = "alert-title";
        
        // Add day label if alert has a start date
        let titleText = alert.event || alert.headline || "Weather Alert";
        if (alert.start) {
            const dayLabel = this.getAlertDayLabel(alert.start);
            if (dayLabel) {
                titleText = dayLabel + ": " + titleText;
            }
        }
        title.textContent = titleText;
        header.appendChild(title);

        const severity = document.createElement("span");
        severity.className = "alert-severity";
        severity.textContent = alert.severity || "Warning";
        header.appendChild(severity);

        alertEl.appendChild(header);

        if (alert.description) {
            const desc = document.createElement("div");
            desc.className = "alert-description";
            desc.textContent = this.truncateText(alert.description, 200);
            alertEl.appendChild(desc);
        }

        const meta = document.createElement("div");
        meta.className = "alert-meta";
        
        if (alert.start) {
            const start = document.createElement("span");
            start.innerHTML = '<i class="fa fa-clock-o"></i> ' + this.formatDate(alert.start);
            meta.appendChild(start);
        }
        
        if (alert.end) {
            const end = document.createElement("span");
            end.innerHTML = ' - ' + this.formatDate(alert.end);
            meta.appendChild(end);
        }

        alertEl.appendChild(meta);

        return alertEl;
    },

    createForecastElement: function(day) {
        const dayEl = document.createElement("div");
        dayEl.className = "forecast-day";
        
        if (day.hasWarning) {
            dayEl.classList.add("has-warning");
        }

        const dayName = document.createElement("div");
        dayName.className = "forecast-day-name";
        dayName.textContent = this.getDayName(day.date);
        dayEl.appendChild(dayName);

        const icon = document.createElement("div");
        icon.className = "forecast-icon";
        icon.innerHTML = '<span class="wi ' + this.getWeatherIconClass(day.weatherCode, true) + '"></span>';
        dayEl.appendChild(icon);

        const condition = document.createElement("div");
        condition.className = "forecast-condition";
        condition.textContent = day.condition;
        dayEl.appendChild(condition);

        const temps = document.createElement("div");
        temps.className = "forecast-temps";
        const unit = this.config.units === "metric" ? "°" : "°";
        temps.innerHTML = '<span class="temp-high">' + Math.round(day.tempMax) + unit + '</span>' +
                         '<span class="temp-low">' + Math.round(day.tempMin) + unit + '</span>';
        dayEl.appendChild(temps);

        if (day.precipitation > 0) {
            const precip = document.createElement("div");
            precip.className = "forecast-precip";
            precip.innerHTML = '<span class="wi wi-raindrop"></span> ' + Math.round(day.precipitation) + '%';
            dayEl.appendChild(precip);
        }

        return dayEl;
    },

    getWeatherIconClass: function(code, isDay) {
        // WMO Weather interpretation codes to weather-icons classes
        const dayPrefix = isDay ? "wi-day-" : "wi-night-alt-";
        
        const iconMap = {
            0: isDay ? "wi-day-sunny" : "wi-night-clear",
            1: isDay ? "wi-day-sunny" : "wi-night-clear",
            2: dayPrefix + "cloudy",
            3: "wi-cloudy",
            45: "wi-fog",
            48: "wi-fog",
            51: dayPrefix + "sprinkle",
            53: dayPrefix + "sprinkle",
            55: dayPrefix + "sprinkle",
            56: dayPrefix + "sleet",
            57: dayPrefix + "sleet",
            61: dayPrefix + "rain",
            63: dayPrefix + "rain",
            65: dayPrefix + "rain",
            66: dayPrefix + "rain-mix",
            67: dayPrefix + "rain-mix",
            71: dayPrefix + "snow",
            73: dayPrefix + "snow",
            75: dayPrefix + "snow",
            77: dayPrefix + "snow",
            80: dayPrefix + "showers",
            81: dayPrefix + "showers",
            82: dayPrefix + "showers",
            85: dayPrefix + "snow",
            86: dayPrefix + "snow",
            95: dayPrefix + "thunderstorm",
            96: dayPrefix + "thunderstorm",
            99: dayPrefix + "thunderstorm"
        };
        
        return iconMap[code] || "wi-na";
    },

    getWindDirection: function(degrees) {
        if (degrees === undefined || degrees === null) return "";
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", 
                          "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    },

    formatTime: function(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleTimeString(this.config.language, { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    },

    getSeverityClass: function(severity) {
        if (!severity) return "yellow";
        const s = severity.toLowerCase();
        if (s.includes("extreme") || s.includes("red")) return "red";
        if (s.includes("severe") || s.includes("amber") || s.includes("orange")) return "amber";
        if (s.includes("moderate") || s.includes("yellow")) return "yellow";
        return "yellow";
    },

    getAlertIcon: function(event) {
        if (!event) return "fa-exclamation-triangle";
        const e = event.toLowerCase();
        if (e.includes("thunder") || e.includes("lightning")) return "fa-bolt";
        if (e.includes("wind") || e.includes("gale")) return "fa-wind";
        if (e.includes("rain") || e.includes("flood")) return "fa-cloud-showers-heavy";
        if (e.includes("snow") || e.includes("ice") || e.includes("frost")) return "fa-snowflake";
        if (e.includes("fog")) return "fa-smog";
        if (e.includes("heat") || e.includes("hot")) return "fa-temperature-high";
        if (e.includes("cold") || e.includes("freeze")) return "fa-temperature-low";
        if (e.includes("tornado")) return "fa-tornado";
        if (e.includes("hurricane") || e.includes("cyclone")) return "fa-hurricane";
        return "fa-exclamation-triangle";
    },

    getDayName: function(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
        
        return date.toLocaleDateString(this.config.language, { weekday: 'short' });
    },

    getAlertDayLabel: function(dateStr) {
        if (!dateStr) return null;
        const alertDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        alertDate.setHours(0, 0, 0, 0);
        
        if (alertDate.getTime() === today.getTime()) return "Today";
        if (alertDate.getTime() === tomorrow.getTime()) return "Tomorrow";
        if (alertDate.getTime() === dayAfterTomorrow.getTime()) {
            return dayAfterTomorrow.toLocaleDateString(this.config.language, { weekday: 'short' });
        }
        
        // For alerts beyond 3 days, still show the day name
        return alertDate.toLocaleDateString(this.config.language, { weekday: 'short' });
    },

    formatDate: function(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString(this.config.language, { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    truncateText: function(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + "...";
    }
});
