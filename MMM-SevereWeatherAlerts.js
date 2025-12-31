/* MagicMirror² Module: MMM-SevereWeatherAlerts
 * Displays severe weather warnings with 3-day forecast
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
        alertSound: false,          // Play sound on new alert (requires additional setup)
        metOfficeApiKey: null,      // Optional: Met Office DataHub API key for UK
        showNoAlertsMessage: true,
        compactMode: false          // Smaller display for side panels
    },

    getStyles: function() {
        return ["MMM-SevereWeatherAlerts.css", "font-awesome.css"];
    },

    getScripts: function() {
        return [];
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.alerts = [];
        this.forecast = [];
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
            forecastDays: this.config.forecastDays
        });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "WEATHER_DATA") {
            this.alerts = payload.alerts || [];
            this.forecast = payload.forecast || [];
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

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "mmm-severe-weather-alerts" + (this.config.compactMode ? " compact" : "");
        
        if (this.config.rotated) {
            wrapper.classList.add("rotated");
        }

        if (!this.loaded) {
            wrapper.innerHTML = '<div class="loading"><i class="fa fa-spinner fa-pulse"></i> Loading weather data...</div>';
            return wrapper;
        }

        if (this.error) {
            wrapper.innerHTML = '<div class="error"><i class="fa fa-exclamation-triangle"></i> ' + this.error + '</div>';
            return wrapper;
        }

        // Alerts section
        const alertsContainer = document.createElement("div");
        alertsContainer.className = "alerts-container";

        if (this.alerts.length > 0) {
            this.alerts.forEach(alert => {
                const alertEl = this.createAlertElement(alert);
                alertsContainer.appendChild(alertEl);
            });
        } else if (this.config.showNoAlertsMessage) {
            const noAlerts = document.createElement("div");
            noAlerts.className = "no-alerts";
            noAlerts.innerHTML = '<i class="fa fa-check-circle"></i> No active weather warnings';
            alertsContainer.appendChild(noAlerts);
        }

        wrapper.appendChild(alertsContainer);

        // Forecast section
        if (this.config.showForecast && this.forecast.length > 0) {
            const forecastContainer = document.createElement("div");
            forecastContainer.className = "forecast-container";
            
            const forecastTitle = document.createElement("div");
            forecastTitle.className = "forecast-title";
            forecastTitle.textContent = this.config.forecastDays + "-Day Outlook";
            forecastContainer.appendChild(forecastTitle);

            const forecastGrid = document.createElement("div");
            forecastGrid.className = "forecast-grid";

            this.forecast.slice(0, this.config.forecastDays).forEach(day => {
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
        title.textContent = alert.event || alert.headline || "Weather Alert";
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
        
        // Check if this day has associated warnings
        if (day.hasWarning) {
            dayEl.classList.add("has-warning");
        }

        const dayName = document.createElement("div");
        dayName.className = "forecast-day-name";
        dayName.textContent = this.getDayName(day.date);
        dayEl.appendChild(dayName);

        const icon = document.createElement("div");
        icon.className = "forecast-icon";
        icon.innerHTML = this.getWeatherIcon(day.weatherCode);
        dayEl.appendChild(icon);

        const condition = document.createElement("div");
        condition.className = "forecast-condition";
        condition.textContent = day.condition;
        dayEl.appendChild(condition);

        const temps = document.createElement("div");
        temps.className = "forecast-temps";
        const unit = this.config.units === "metric" ? "°C" : "°F";
        temps.innerHTML = '<span class="temp-high">' + Math.round(day.tempMax) + unit + '</span>' +
                         '<span class="temp-low">' + Math.round(day.tempMin) + unit + '</span>';
        dayEl.appendChild(temps);

        if (day.precipitation > 0) {
            const precip = document.createElement("div");
            precip.className = "forecast-precip";
            precip.innerHTML = '<i class="fa fa-tint"></i> ' + Math.round(day.precipitation) + '%';
            dayEl.appendChild(precip);
        }

        return dayEl;
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

    getWeatherIcon: function(code) {
        // WMO Weather interpretation codes
        const icons = {
            0: '<i class="fa fa-sun"></i>',           // Clear
            1: '<i class="fa fa-sun"></i>',           // Mainly clear
            2: '<i class="fa fa-cloud-sun"></i>',     // Partly cloudy
            3: '<i class="fa fa-cloud"></i>',         // Overcast
            45: '<i class="fa fa-smog"></i>',         // Fog
            48: '<i class="fa fa-smog"></i>',         // Depositing rime fog
            51: '<i class="fa fa-cloud-rain"></i>',   // Light drizzle
            53: '<i class="fa fa-cloud-rain"></i>',   // Moderate drizzle
            55: '<i class="fa fa-cloud-rain"></i>',   // Dense drizzle
            61: '<i class="fa fa-cloud-showers-heavy"></i>', // Slight rain
            63: '<i class="fa fa-cloud-showers-heavy"></i>', // Moderate rain
            65: '<i class="fa fa-cloud-showers-heavy"></i>', // Heavy rain
            71: '<i class="fa fa-snowflake"></i>',    // Slight snow
            73: '<i class="fa fa-snowflake"></i>',    // Moderate snow
            75: '<i class="fa fa-snowflake"></i>',    // Heavy snow
            80: '<i class="fa fa-cloud-rain"></i>',   // Rain showers
            81: '<i class="fa fa-cloud-showers-heavy"></i>', // Moderate showers
            82: '<i class="fa fa-cloud-showers-heavy"></i>', // Violent showers
            85: '<i class="fa fa-snowflake"></i>',    // Snow showers
            86: '<i class="fa fa-snowflake"></i>',    // Heavy snow showers
            95: '<i class="fa fa-bolt"></i>',         // Thunderstorm
            96: '<i class="fa fa-bolt"></i>',         // Thunderstorm with hail
            99: '<i class="fa fa-bolt"></i>'          // Thunderstorm with heavy hail
        };
        return icons[code] || '<i class="fa fa-question"></i>';
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
