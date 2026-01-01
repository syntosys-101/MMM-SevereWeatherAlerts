# MMM-SevereWeatherAlerts

A MagicMirror² module that displays **severe weather warnings** and alerts with a 3-day forecast outlook.

![Screenshot placeholder](screenshot.png)

## Features

- 🚨 **Severe Weather Warnings** - Displays active weather alerts with severity levels (Red/Amber/Yellow)
- 🌍 **Global Coverage** - Uses Open-Meteo API (no API key required) for worldwide weather data
- 🇬🇧 **Met Office Support** - Optional integration with Met Office DataHub API for enhanced UK coverage
- 📅 **3-Day Forecast** - Shows weather outlook with visual indicators for days with warnings
- 🎨 **Emergency Broadcast Aesthetic** - Bold, attention-grabbing warning display
- 🎨 **Fully Customizable Colors** - Configure all colors via config to match your theme
- 📱 **Responsive Design** - Supports both standard and compact display modes
- 🔄 **Auto-rotating Display Support** - Works with rotated portrait displays

## Alert Types Detected

The module analyzes weather data and generates warnings for:

- ⛈️ **Thunderstorms** - Lightning and heavy rain
- 🌨️ **Heavy Snow** - Significant snowfall
- 🌧️ **Heavy Rain** - Potential flooding
- 💨 **High Winds** - Strong sustained winds or gusts
- 🌫️ **Dense Fog** - Reduced visibility

## Installation

### 1. Clone this repository

```bash
cd ~/MagicMirror/modules
git clone https://github.com/syntosys-101/MMM-SevereWeatherAlerts.git
```

### 2. No dependencies required!

The module uses built-in Node.js modules only.

## Configuration

Add to your `config/config.js`:

```javascript
{
    module: "MMM-SevereWeatherAlerts",
    position: "top_right",  // or any position
    config: {
        latitude: 51.5074,         // Your latitude
        longitude: -0.1278,        // Your longitude
        location: "London",        // Display name
        updateInterval: 600000,    // 10 minutes
        showForecast: true,
        forecastDays: 3,
        units: "metric",           // or "imperial"
        rotated: false             // Set true if display is rotated
    }
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `latitude` | `51.5074` | Your location latitude |
| `longitude` | `-0.1278` | Your location longitude |
| `location` | `"London"` | Display name for your location |
| `updateInterval` | `600000` | Update interval in ms (10 min default) |
| `showForecast` | `true` | Show 3-day forecast below alerts |
| `forecastDays` | `3` | Number of forecast days (1-7) |
| `units` | `"metric"` | Temperature units: `"metric"` or `"imperial"` |
| `language` | `"en"` | Language for date formatting |
| `rotated` | `false` | Set `true` if your display is rotated 90° |
| `compactMode` | `false` | Smaller display for narrow panels |
| `showNoAlertsMessage` | `true` | Show message when no alerts active |
| `metOfficeApiKey` | `null` | Optional: Met Office DataHub API key |
| `colors` | `{...}` | Color customization object (see [Color Configuration](#color-configuration)) |

### Color Configuration

All colors in the module can be customized via the `colors` config option. Colors support hex (`#ffffff`), rgb (`rgb(255, 255, 255)`), and rgba (`rgba(255, 255, 255, 0.5)`) formats.

**Default colors match the current module appearance.** You only need to specify colors you want to change.

#### Basic Color Structure

```javascript
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
```

#### Color Configuration Examples

**Example 1: Change accent color from green to blue**

```javascript
{
    module: "MMM-SevereWeatherAlerts",
    position: "top_right",
    config: {
        latitude: 51.5074,
        longitude: -0.1278,
        location: "London",
        colors: {
            today: {
                icon: "#00aaff",
                iconGlow: "rgba(0, 170, 255, 0.4)"
            },
            forecast: {
                icon: "#00aaff",
                iconGlow: "rgba(0, 170, 255, 0.3)"
            },
            loading: "#00aaff",
            noAlerts: {
                text: "#00aaff",
                border: "rgba(0, 170, 255, 0.15)"
            },
            scrollbar: {
                thumb: "rgba(0, 170, 255, 0.3)"
            }
        }
    }
}
```

**Example 2: Customize alert colors**

```javascript
{
    module: "MMM-SevereWeatherAlerts",
    position: "top_right",
    config: {
        latitude: 51.5074,
        longitude: -0.1278,
        location: "London",
        colors: {
            alerts: {
                red: {
                    border: "#ff3333",
                    backgroundStart: "rgba(200, 0, 0, 0.95)",
                    backgroundEnd: "rgba(120, 0, 0, 0.9)"
                },
                amber: {
                    border: "#ffaa00",
                    backgroundStart: "rgba(200, 120, 0, 0.9)",
                    backgroundEnd: "rgba(140, 80, 0, 0.85)"
                }
            }
        }
    }
}
```

**Example 3: Dark theme with purple accents**

```javascript
{
    module: "MMM-SevereWeatherAlerts",
    position: "top_right",
    config: {
        latitude: 51.5074,
        longitude: -0.1278,
        location: "London",
        colors: {
            text: "#e0e0e0",
            backgroundOverlay: "rgba(0, 0, 0, 0.4)",
            today: {
                icon: "#9d4edd",
                iconGlow: "rgba(157, 78, 221, 0.5)",
                temperature: "#ffffff"
            },
            forecast: {
                icon: "#9d4edd",
                iconGlow: "rgba(157, 78, 221, 0.4)",
                tempHigh: "#ff6b9d",
                tempLow: "#90e0ef"
            },
            loading: "#9d4edd",
            noAlerts: {
                text: "#9d4edd",
                background: "rgba(157, 78, 221, 0.08)",
                border: "rgba(157, 78, 221, 0.2)"
            }
        }
    }
}
```

**Note:** You can override any individual color property. Colors not specified will use the default values.

### Finding Your Coordinates

1. Go to [Google Maps](https://maps.google.com)
2. Right-click on your location
3. The coordinates will appear at the top of the menu

## Met Office API (Optional - UK Only)

For enhanced UK weather warnings, you can optionally use the Met Office DataHub API:

1. Register at [Met Office DataHub](https://datahub.metoffice.gov.uk/)
2. Subscribe to the free "Site-specific" API
3. Add your API key to the config:

```javascript
config: {
    metOfficeApiKey: "your-api-key-here",
    // ... other options
}
```

**Note:** The module works perfectly without the Met Office API - it will analyze Open-Meteo weather data to detect severe conditions.

## Example Configurations

### Standard Display (Top Right)

```javascript
{
    module: "MMM-SevereWeatherAlerts",
    position: "top_right",
    config: {
        latitude: 53.4808,
        longitude: -2.2426,
        location: "Manchester"
    }
}
```

### Compact Mode (Side Panel)

```javascript
{
    module: "MMM-SevereWeatherAlerts",
    position: "top_left",
    config: {
        latitude: 55.9533,
        longitude: -3.1883,
        location: "Edinburgh",
        compactMode: true,
        forecastDays: 2
    }
}
```

### Rotated Display (Portrait Mode)

```javascript
{
    module: "MMM-SevereWeatherAlerts",
    position: "bottom_bar",
    config: {
        latitude: 51.4545,
        longitude: -2.5879,
        location: "Bristol",
        rotated: true
    }
}
```

### With Matrix Rain Background

Works great alongside [MMM-MatrixRain](https://github.com/syntosys-101/MMM-MatrixRain):

```javascript
{
    module: "MMM-MatrixRain",
    position: "fullscreen_below",
    config: { rotated: true }
},
{
    module: "MMM-SevereWeatherAlerts",
    position: "top_right",
    config: {
        latitude: 51.5074,
        longitude: -0.1278,
        location: "London",
        rotated: true
    }
}
```

### Custom Color Theme

```javascript
{
    module: "MMM-SevereWeatherAlerts",
    position: "top_right",
    config: {
        latitude: 51.5074,
        longitude: -0.1278,
        location: "London",
        colors: {
            today: {
                icon: "#00aaff",
                iconGlow: "rgba(0, 170, 255, 0.4)"
            },
            forecast: {
                icon: "#00aaff",
                tempHigh: "#ff6b6b",
                tempLow: "#6bc5ff"
            }
        }
    }
}
```

## Alert Severity Levels

| Level | Colour | Description |
|-------|--------|-------------|
| **Red** | 🔴 | Extreme weather - Take action |
| **Amber** | 🟠 | Severe weather - Be prepared |
| **Yellow** | 🟡 | Weather awareness - Be aware |

## Troubleshooting

### Module not loading
- Check the browser console (F12) for errors
- Ensure the module folder is named exactly `MMM-SevereWeatherAlerts`

### No weather data
- Verify your latitude/longitude are correct
- Check your internet connection
- The Open-Meteo API may have temporary issues

### Alerts not appearing
- The module only shows alerts when severe weather is detected
- Try setting your coordinates to a location with current severe weather to test

## Credits

- Weather data provided by [Open-Meteo](https://open-meteo.com/)
- Optional UK data from [Met Office](https://www.metoffice.gov.uk/)

## License

MIT License - see [LICENSE](LICENSE) file
