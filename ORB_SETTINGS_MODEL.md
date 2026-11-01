# Orb Settings Model

## Overview
This document defines the settings model for customizing the AIOrb component's appearance and behavior. Settings are stored in the app's configuration and can be adjusted via the SettingsModal.

## Settings Structure

```javascript
{
  "orb": {
    // Global appearance settings
    "baseSize": 80,                    // Base diameter in pixels (affects --size CSS variable)
    "rotationSpeed": 1.0,              // Global multiplier for state-specific rotation speeds
    "pulseIntensity": 0.015,           // Amount of scale pulsation on hover/idle (0-0.1 range)
    "particleCount": 5,                // Number of floating particles around orb
    "particleSize": 5,                 // Size of each particle in pixels
    "particleOpacity": 0.8,            // Base opacity of particles (0-1)
    "enableParticles": true,           // Toggle particle system on/off
    "enableGlow": true,                // Toggle outer glow effects
    "enableHoverPulse": true,          // Toggle hover-induced pulsation
    
    // Color theme settings (HSL values for easier customization)
    "colorTheme": {
      "baseHue": 270,                  // Base hue for idle state (0-360, default purple)
      "hueRange": 60,                  // Total hue range available for state variations
      "saturation": 0.7,               // Color saturation (0-1)
      "lightness": 0.5,                // Color lightness (0-1)
      "alpha": 0.8                     // Base opacity for orb core (0-1)
    },
    
    // State-specific configurations (overrides defaults)
    "states": {
      "idle": {
        "hueOffset": 0,                // Degrees offset from baseHue
        "rotationSpeed": 0.15,         // Radians per second
        "hoverIntensity": 0.08,        // Hover effect strength (0-1)
        "pulseEnabled": true
      },
      "listening": {
        "hueOffset": 0,
        "rotationSpeed": 0.6,
        "hoverIntensity": 0.9,
        "pulseEnabled": true,
        "pulseSpeed": 1.3              // Additional pulse speed when listening
      },
      "thinking": {
        "hueOffset": -35,
        "rotationSpeed": 0.5,
        "hoverIntensity": 0.3,
        "pulseEnabled": false,
        "morphEnabled": true           // Enable border-radius morphing
      },
      "speaking": {
        "hueOffset": 20,
        "rotationSpeed": 0.7,
        "hoverIntensity": 0.9,
        "pulseEnabled": true,
        "pulseSpeed": 1.5
      },
      "error": {
        "hueOffset": 30,               // Shift toward warm red/orange
        "rotationSpeed": 0.25,
        "hoverIntensity": 0.3,
        "pulseEnabled": true,
        "pulseIntensityBoost": 1.5     // Multiplier for error pulse intensity
      },
      "copied": {
        "hueOffset": 100,              // Shift toward green/cyan
        "rotationSpeed": 0.4,
        "hoverIntensity": 0.6,
        "pulseEnabled": true,
        "pulseCount": 3,               // Number of pulse cycles
        "glowBoost": 0.5               // Additional glow intensity
      }
    },
    
    // Animation settings
    "animation": {
      "stateTransitionDuration": 0.3,  // Seconds to transition between states
      "stateTransitionEasing": "ease-in-out",
      "hueLerpFactor": 0.1,            // How quickly hue changes respond (0-1)
      "speedLerpFactor": 0.05,         // How quickly rotation speed changes respond
      "hoverLerpFactor": 0.2           // How quickly hover intensity changes respond
    },
    
    // Advanced/performance settings
    "performance": {
      "quality": "medium",             // low, medium, high (affects shader precision)
      "fpsLimit": 60,                  // Maximum FPS for orb animation
      "reduceMotion": false            // Respects OS reduce motion setting when true
    }
  }
}
```

## Implementation Notes

### 1. Settings Storage
- Store under `config.get('orb')` and `config.set('orb', newSettings)` 
- Merge with defaults on load to ensure all properties exist
- Consider versioning settings schema for future compatibility

### 2. Real-time Updates
- When settings change, send `notch:orb-settings-update` event to renderer
- AIOrb component should listen for this event and update its internal state
- Use lerping/smoothing for visual transitions when possible

### 3. UI Integration (SettingsModal)
- Create "Orb Appearance" section in settings
- Group controls logically:
  * **Size & Motion**: Base size, rotation speed, pulse intensity
  * **Particles**: Count, size, opacity, enable/disable toggle
  * **Color Theme**: Base hue picker, saturation/lightness sliders
  * **State Colors**: Preview of each state with hue offset controls
  * **Animation**: Transition duration, easing options
  * **Advanced**: Quality/FPS settings, motion reduction

### 4. Default Values
The provided defaults maintain current behavior when all settings are at baseline values.

### 5. Backwards Compatibility
- Existing STATE_CONFIG in AIOrb.jsx should be generated from these settings
- Default settings matrix should produce visually identical output to current hardcoded values
- Any new settings should have sensible fallbacks

## Usage in AIOrb.jsx

Instead of the hardcoded `STATE_CONFIG`, the orb should:
1. Load settings via `window.notchAPI?.getOrbSettings()`
2. Generate effective state config by combining:
   - Base color from colorTheme
   - State-specific hueOffset
   - Global rotationSpeed multiplier
   - etc.
3. Apply animation lerping factors for smooth transitions
4. Respect performance settings (quality, fpsLimit, reduceMotion)

## Example Setting Changes

### Make orb more subtle:
- Decrease `baseSize` to 60
- Decrease `pulseIntensity` to 0.008
- Decrease `particleOpacity` to 0.5
- Set `enableGlow` to false

### Change color scheme to blue theme:
- Set `colorTheme.baseHue` to 210 (blue)
- Adjust state hueOffsets accordingly (or keep relative offsets)

### Disable animations for accessibility:
- Set `performance.reduceMotion` to true
- Or globally set animation durations to 0.001ms

## Extension Points

Future settings could include:
- Custom shader parameters (noise scale, distortion amounts)
- Sound feedback volume/types
- Interaction sensitivity (hover radius, click thresholds)
- Presets/themes (minimal, vibrant, dark, light)
- Behavior triggers (what causes state changes)