# Changelog

## Version 1.1 - June 12, 2026

### New Features

1. **Camera Flip Functionality**
   - Added "Flip Camera" button to switch between front and back camera
   - Useful for taking measurements with help from another person
   - Button appears after camera starts

2. **Measurements in Inches**
   - Changed all measurements from centimeters to inches
   - JSON output now uses `chest_inches`, `waist_inches`, etc.
   - Improved accuracy with decimal precision (e.g., 38.6 inches)
   - Size recommendations now based on inch measurements

### Technical Changes

**JavaScript (measurement-scanner.js):**
- Added `currentFacingMode` variable to track camera orientation
- New `flipCamera()` function to switch between front/back camera
- Added `cmToInches()` helper function for unit conversion
- Updated `getMeasurements()` to return inch-based measurements
- Size chart thresholds adjusted for inches (34, 37, 40, 43, 46 inches)
- Measurement precision changed to 1 decimal place for inches

**HTML (measurement-demo.html):**
- Added "Flip Camera" button in button group
- Button positioned between "Start Camera" and "Capture Measurements"
- Styled as secondary button (gray) to differentiate from primary actions

**Output (measurements.json):**
- Field names changed:
  - `chest_cm` → `chest_inches`
  - `waist_cm` → `waist_inches`
  - `hips_cm` → `hips_inches`
  - `inseam_cm` → `inseam_inches`
  - `sleeve_length_cm` → `sleeve_length_inches`
  - `height_cm` → `height_inches`

### Updated Documentation

- README.md updated with new features and inch-based examples
- Example measurements updated to show decimal precision
- Size chart thresholds documented in inches

### Backwards Compatibility

**Breaking Changes:**
- JSON output format changed from centimeters to inches
- Any existing integrations expecting `_cm` fields will need updates

**Migration Guide:**
If you have existing code expecting centimeter measurements:
```javascript
// Old format
const chest = data.chest_cm;

// New format
const chest = data.chest_inches;

// Convert back to cm if needed
const chestCm = chest * 2.54;
```

### Testing Notes

- Test camera flip on devices with multiple cameras
- Verify measurements are accurate in inches
- Confirm size recommendations match new inch-based thresholds
- Check JSON export contains correct field names

### Known Issues

- Camera flip may not work on devices with single camera
- Some older browsers may not support facingMode switching
- No error is shown if camera flip is unavailable (graceful degradation)
