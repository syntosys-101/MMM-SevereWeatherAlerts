# Color Configuration Plan

## Overview
This plan outlines how to make all colors in the MMM-SevereWeatherAlerts module configurable via the config, while maintaining current defaults.

## Color Categories Identified

### 1. Base Colors
- **Text Color**: `#ffffff` - Main text color
- **Background Overlay**: `rgba(0, 0, 0, 0.25)` - Container backgrounds
- **Border Color**: `rgba(255, 255, 255, 0.08)` - Subtle borders

### 2. Loading State
- **Loading Text**: `#00ff00` - Green loading indicator

### 3. Error State
- **Error Text**: `#ff6b6b` - Light red error text
- **Error Background**: `rgba(255, 0, 0, 0.1)` - Red tinted background
- **Error Border**: `#ff0000` - Red border

### 4. Today's Weather Section
- **Location Header**: `rgba(255, 255, 255, 0.5)` - Muted white
- **Weather Icon**: `#00ff00` - Green icon with glow
  - **Icon Glow**: `rgba(0, 255, 0, 0.4)` - Drop shadow
- **Temperature**: `#ffffff` - White temperature display
- **Feels Like**: `rgba(255, 255, 255, 0.6)` - Muted white
- **Condition Text**: `rgba(255, 255, 255, 0.85)` - Slightly muted white
- **Detail Text**: `rgba(255, 255, 255, 0.6)` - Muted white
- **Detail Icon**: `#00ff00` with `opacity: 0.8` - Green detail icons
- **Detail Superscript**: `rgba(255, 255, 255, 0.5)` - Very muted white

### 5. No Alerts State
- **Text**: `#00ff00` - Green success text
- **Background**: `rgba(0, 255, 0, 0.05)` - Very subtle green background
- **Border**: `rgba(0, 255, 0, 0.15)` - Subtle green border

### 6. Alert Severity Colors

#### Red Alerts (Extreme)
- **Background Gradient Start**: `rgba(180, 0, 0, 0.9)`
- **Background Gradient End**: `rgba(100, 0, 0, 0.85)`
- **Border**: `#ff0000`
- **Box Shadow Outer**: `rgba(255, 0, 0, 0.3)`
- **Box Shadow Inner**: `rgba(255, 0, 0, 0.1)`
- **Animation Shadow Outer**: `rgba(255, 0, 0, 0.5)`
- **Animation Shadow Inner**: `rgba(255, 0, 0, 0.2)`
- **Stripe Color 1**: `#ff0000`
- **Stripe Color 2**: `#000000`

#### Amber Alerts (Severe)
- **Background Gradient Start**: `rgba(180, 100, 0, 0.9)`
- **Background Gradient End**: `rgba(120, 60, 0, 0.85)`
- **Border**: `#ff8c00`
- **Box Shadow Outer**: `rgba(255, 140, 0, 0.2)`
- **Box Shadow Inner**: `rgba(255, 140, 0, 0.1)`

#### Yellow Alerts (Moderate)
- **Background Gradient Start**: `rgba(180, 160, 0, 0.85)`
- **Background Gradient End**: `rgba(100, 90, 0, 0.8)`
- **Border**: `#ffd700`
- **Box Shadow Outer**: `rgba(255, 215, 0, 0.2)`
- **Box Shadow Inner**: `rgba(255, 215, 0, 0.1)`

### 7. Alert Details
- **Alert Severity Badge Background**: `rgba(0, 0, 0, 0.3)` - Dark overlay
- **Alert Description Border**: `rgba(255, 255, 255, 0.3)` - Subtle left border

### 8. Forecast Section
- **Forecast Title**: `rgba(255, 255, 255, 0.5)` - Muted white (same as location)
- **Forecast Day Background**: `rgba(255, 255, 255, 0.03)` - Very subtle background
- **Forecast Day Hover**: `rgba(255, 255, 255, 0.08)` - Slightly brighter on hover
- **Forecast Day Name**: `rgba(255, 255, 255, 0.85)` - Slightly muted white
- **Forecast Icon**: `#00ff00` - Green icon
  - **Icon Glow**: `rgba(0, 255, 0, 0.3)` - Drop shadow
- **Forecast Warning Icon**: `#ff8c00` - Amber icon (when has warning)
  - **Warning Icon Glow**: `rgba(255, 140, 0, 0.4)` - Amber glow
- **Forecast Warning Border**: `rgba(255, 140, 0, 0.4)` - Amber border
- **Forecast Warning Background**: `rgba(255, 140, 0, 0.08)` - Amber tint
- **Forecast Condition**: `rgba(255, 255, 255, 0.6)` - Muted white
- **Temp High**: `#ff6b6b` - Light red
- **Temp Low**: `#6bc5ff` - Light blue
- **Precipitation**: `#6bc5ff` - Light blue (same as temp low)

### 9. Scrollbar
- **Scrollbar Track**: `rgba(0, 0, 0, 0.2)` - Dark track
- **Scrollbar Thumb**: `rgba(0, 255, 0, 0.3)` - Green thumb

## Implementation Strategy

### Approach: CSS Custom Properties (CSS Variables)
Use CSS custom properties that can be dynamically set via inline styles in the JavaScript module. This approach:
- Keeps CSS maintainable
- Allows runtime color changes
- Supports all color formats (hex, rgb, rgba)
- Maintains current defaults

### Config Structure

```javascript
defaults: {
    // ... existing config options ...
    
    colors: {
        // Base Colors
        text: "#ffffff",
        backgroundOverlay: "rgba(0, 0, 0, 0.25)",
        border: "rgba(255, 255, 255, 0.08)",
        
        // Loading State
        loading: "#00ff00",
        
        // Error State
        errorText: "#ff6b6b",
        errorBackground: "rgba(255, 0, 0, 0.1)",
        errorBorder: "#ff0000",
        
        // Today's Weather
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
        
        // No Alerts State
        noAlerts: {
            text: "#00ff00",
            background: "rgba(0, 255, 0, 0.05)",
            border: "rgba(0, 255, 0, 0.15)"
        },
        
        // Alert Severity Colors
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
        
        // Forecast Section
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
}
```

### Implementation Steps

1. **Update `MMM-SevereWeatherAlerts.js`**:
   - Add `colors` object to `defaults` with all current color values
   - In `getDom()`, apply CSS custom properties to the wrapper element using inline styles
   - Create a helper function to set all CSS variables from the config

2. **Update `MMM-SevereWeatherAlerts.css`**:
   - Replace all hardcoded color values with CSS custom properties (variables)
   - Use `var(--variable-name, fallback)` syntax for backwards compatibility
   - Keep fallback values as current defaults

3. **CSS Variable Naming Convention**:
   - Use kebab-case: `--color-text`, `--color-loading`, etc.
   - Group related variables: `--color-today-icon`, `--color-alert-red-border`
   - Use descriptive names that match config structure

### Example CSS Variable Usage

```css
.mmm-severe-weather-alerts {
    color: var(--color-text, #ffffff);
}

.mmm-severe-weather-alerts .loading {
    color: var(--color-loading, #00ff00);
}

.mmm-severe-weather-alerts .today-icon {
    color: var(--color-today-icon, #00ff00);
    filter: drop-shadow(0 0 10px var(--color-today-icon-glow, rgba(0, 255, 0, 0.4)));
}
```

### JavaScript Variable Application

```javascript
applyColors: function(wrapper) {
    const colors = this.config.colors;
    const style = wrapper.style;
    
    // Base colors
    style.setProperty('--color-text', colors.text);
    style.setProperty('--color-background-overlay', colors.backgroundOverlay);
    style.setProperty('--color-border', colors.border);
    
    // Loading
    style.setProperty('--color-loading', colors.loading);
    
    // Error
    style.setProperty('--color-error-text', colors.errorText);
    style.setProperty('--color-error-background', colors.errorBackground);
    style.setProperty('--color-error-border', colors.errorBorder);
    
    // Today's weather
    style.setProperty('--color-today-location', colors.today.location);
    style.setProperty('--color-today-icon', colors.today.icon);
    style.setProperty('--color-today-icon-glow', colors.today.iconGlow);
    // ... etc for all colors
    
    // Alerts
    style.setProperty('--color-alert-red-background-start', colors.alerts.red.backgroundStart);
    style.setProperty('--color-alert-red-background-end', colors.alerts.red.backgroundEnd);
    // ... etc for all alert colors
    
    // Forecast
    style.setProperty('--color-forecast-title', colors.forecast.title);
    // ... etc for all forecast colors
    
    // Scrollbar
    style.setProperty('--color-scrollbar-track', colors.scrollbar.track);
    style.setProperty('--color-scrollbar-thumb', colors.scrollbar.thumb);
}
```

## Benefits

1. **Backwards Compatible**: Defaults match current colors exactly
2. **Flexible**: Users can override any color individually
3. **Maintainable**: CSS remains clean with variables
4. **Performant**: CSS variables are efficient
5. **Complete**: All colors are configurable

## Testing Considerations

- Verify all colors render correctly with defaults
- Test partial color overrides (user only changes some colors)
- Ensure gradients work with custom colors
- Test alert animations with custom red alert colors
- Verify scrollbar colors apply correctly
- Test in both normal and compact modes

## Documentation Updates Needed

- Update README.md with color configuration examples
- Add example configs showing color customization
- Document color format requirements (hex, rgb, rgba all supported)
