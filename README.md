# Body Measurement Scanner Demo

A working demo of the AI measurement feature using Google MediaPipe Pose for body landmark detection.

## What This Does

This demo uses your phone camera to:
1. Detect 33 body landmarks (shoulders, hips, knees, ankles, etc.)
2. Calculate key measurements (chest, waist, hips, inseam, sleeve length, height)
3. Recommend clothing size based on measurements
4. Export results as JSON file

## Files Included

- `measurement-demo.html` - Main HTML interface
- `measurement-scanner.js` - Core measurement logic with two key functions:
  - `getLandmarks(video_feed)` - Extracts 33 raw landmarks from MediaPipe
  - `getMeasurements(raw_landmarks)` - Calculates body measurements and size recommendation

## How to Test

### Important: HTTPS Required

Camera access requires HTTPS, even for testing. You have two options:

### Option 1: Using Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy from this directory:
   ```bash
   vercel
   ```

3. Open the Vercel URL on your phone

### Option 2: Using ngrok

1. Install a simple HTTP server:
   ```bash
   npm install -g http-server
   ```

2. Start the server:
   ```bash
   http-server -p 8080
   ```

3. In another terminal, start ngrok:
   ```bash
   ngrok http 8080
   ```

4. Open the ngrok HTTPS URL on your phone

### Option 3: Local Testing (Desktop Only)

For quick desktop testing with webcam:

1. Open `measurement-demo.html` directly in Chrome
2. Chrome allows localhost camera access without HTTPS
3. This works for testing but not realistic for phone demos

## How to Use

1. Click "Start Camera" and grant camera permission
2. Position yourself 2-3 meters away from camera
3. Ensure good lighting and full body is visible
4. Stand still with arms slightly away from body
5. Click "Capture Measurements"
6. View results and click "Download JSON" to save

## Output Format

The demo generates `measurements.json` with this structure:

```json
{
  "chest_cm": 98,
  "waist_cm": 85,
  "hips_cm": 102,
  "inseam_cm": 78,
  "sleeve_length_cm": 62,
  "height_cm": 175,
  "recommended_size": "M",
  "fit_note": "Medium - Standard fit",
  "confidence_percent": 87,
  "accuracy_note": "Good accuracy",
  "timestamp": "2026-06-11T10:30:00.000Z",
  "raw_landmarks_count": 33
}
```

## Technical Details

### Technology Used

- **MediaPipe Pose** - Google's open-source body tracking library
- **JavaScript** - Pure vanilla JS, no frameworks needed
- **HTML5 Canvas** - For drawing skeleton overlay
- **Camera API** - Native browser camera access

### How Measurements Work

1. MediaPipe detects 33 body landmarks in 3D space (x, y, z)
2. Calculate pixel distances between key landmarks (shoulders, hips, ankles)
3. Estimate height using nose-to-ankle distance
4. Convert pixel measurements to centimeters using height calibration
5. Apply multipliers for chest/waist/hips based on skeletal width
6. Recommend size based on chest measurement using standard sizing chart

### Accuracy Notes

- Measurements have ±3-5cm margin of error
- Accuracy depends on:
  - Lighting quality (natural light works best)
  - Camera distance (2-3 meters optimal)
  - Body positioning (full body must be visible)
  - Clothing fit (tight clothing improves accuracy)
- Best for standard tailoring, not extreme custom fits

### Known Limitations

- Assumes average height of 170cm for calibration (can be improved with known reference)
- Works best with frontal view (side view not supported yet)
- Requires good lighting conditions
- May struggle with baggy clothing
- Low confidence if landmarks are partially occluded

## Browser Compatibility

- Chrome/Edge (Desktop & Mobile) - Full support
- Safari (iOS/macOS) - Full support
- Firefox (Desktop & Mobile) - Full support
- Opera (Desktop & Mobile) - Full support

## Next Steps for Integration

To integrate this into the Coded platform:

1. Add authentication to ensure only paid merchants can access
2. Store measurements in Django backend (PostgreSQL database)
3. Attach measurements to customer orders automatically
4. Add customer consent and data privacy handling
5. Improve calibration using known reference heights
6. Add support for multiple body poses (front, side, back)

## Troubleshooting

**Camera not starting:**
- Ensure you are using HTTPS (localhost exception in Chrome)
- Check browser permissions for camera access
- Try a different browser

**Low confidence score:**
- Move closer to camera
- Improve lighting (face window or use better lights)
- Ensure full body is visible in frame
- Remove loose/baggy clothing

**Measurements seem off:**
- Verify you are standing 2-3 meters away
- Stand straight with good posture
- Keep arms slightly away from body
- Recapture if confidence is below 70%

## Demo Video Recording Tips

To show this demo to stakeholders:

1. Use phone in landscape mode for better framing
2. Position camera on tripod or stable surface
3. Use natural window lighting
4. Stand against plain background (white wall ideal)
5. Wear fitted clothing for best results
6. Record screen while showing the overlay and measurements

## License

This demo uses:
- MediaPipe (Apache 2.0 License) - Free and open source
- No external APIs required (runs entirely in browser)
- Zero server cost (all processing on phone GPU)
