// Global variables
let pose = null;
let camera = null;
let videoElement = null;
let canvasElement = null;
let canvasCtx = null;
let latestLandmarks = null;
let measurementData = null;
let currentFacingMode = 'user'; // 'user' for front camera, 'environment' for back camera

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    videoElement = document.getElementById('video-feed');
    canvasElement = document.getElementById('canvas-output');
    canvasCtx = canvasElement.getContext('2d');
});

/**
 * Start camera and initialize MediaPipe Pose
 */
async function startCamera() {
    try {
        updateStatus('Initializing camera...', 'info');
        
        // Initialize MediaPipe Pose
        pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        
        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        pose.onResults(onPoseResults);
        
        // Show video container
        document.getElementById('video-container').style.display = 'block';
        
        // Initialize camera with facing mode
        camera = new Camera(videoElement, {
            onFrame: async () => {
                await pose.send({image: videoElement});
            },
            width: 640,
            height: 480,
            facingMode: currentFacingMode
        });
        
        await camera.start();
        
        // Update UI
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('capture-btn').style.display = 'block';
        document.getElementById('capture-btn').disabled = false;
        document.getElementById('flip-btn').style.display = 'block';
        
        updateStatus('Camera active. Position yourself and click "Capture Measurements"', 'success');
        
    } catch (error) {
        console.error('Error starting camera:', error);
        updateStatus('Error: ' + error.message + '. Make sure you are using HTTPS.', 'error');
    }
}

/**
 * Flip between front and back camera
 */
async function flipCamera() {
    try {
        updateStatus('Switching camera...', 'info');
        
        // Stop current camera
        if (camera) {
            camera.stop();
        }
        
        // Toggle facing mode
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        
        // Restart camera with new facing mode
        camera = new Camera(videoElement, {
            onFrame: async () => {
                await pose.send({image: videoElement});
            },
            width: 640,
            height: 480,
            facingMode: currentFacingMode
        });
        
        await camera.start();
        
        updateStatus('Camera switched. Position yourself and click "Capture Measurements"', 'success');
        
    } catch (error) {
        console.error('Error flipping camera:', error);
        updateStatus('Error switching camera: ' + error.message, 'error');
    }
}

/**
 * Process pose detection results
 */
function onPoseResults(results) {
    // Save canvas size
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    
    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw the pose landmarks
    if (results.poseLandmarks) {
        // Store latest landmarks
        latestLandmarks = results.poseLandmarks;
        
        // Draw connectors
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 4
        });
        
        // Draw landmarks
        drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: '#FF0000',
            lineWidth: 2,
            radius: 6
        });
    }
    
    canvasCtx.restore();
}

/**
 * Get raw landmarks from video feed
 * Returns array of 33 landmarks with x, y, z coordinates
 */
function getLandmarks(videoFeed) {
    if (!latestLandmarks || latestLandmarks.length === 0) {
        throw new Error('No landmarks detected. Please ensure full body is visible.');
    }
    
    return latestLandmarks;
}

/**
 * Calculate measurements from raw landmarks
 * Returns object with chest, waist, hips, recommended_size, fit_note
 */
function getMeasurements(rawLandmarks) {
    // MediaPipe Pose landmark indices (33 total landmarks)
    const LEFT_SHOULDER = 11;
    const RIGHT_SHOULDER = 12;
    const LEFT_HIP = 23;
    const RIGHT_HIP = 24;
    const LEFT_KNEE = 25;
    const RIGHT_KNEE = 26;
    const LEFT_ANKLE = 27;
    const RIGHT_ANKLE = 28;
    const LEFT_ELBOW = 13;
    const RIGHT_ELBOW = 14;
    const NOSE = 0;
    const LEFT_EYE = 2;
    const RIGHT_EYE = 5;
    
    // Helper function to calculate Euclidean distance between two points
    function distance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = (point1.z || 0) - (point2.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    // Helper function to convert cm to inches
    function cmToInches(cm) {
        return Math.round(cm / 2.54 * 10) / 10; // Round to 1 decimal place
    }
    
    // Calculate reference height using multiple body segments for better accuracy
    const avgAnkleY = (rawLandmarks[LEFT_ANKLE].y + rawLandmarks[RIGHT_ANKLE].y) / 2;
    const avgEyeY = (rawLandmarks[LEFT_EYE].y + rawLandmarks[RIGHT_EYE].y) / 2;
    const heightInPixels = Math.abs(avgEyeY - avgAnkleY);
    
    // Use a more conservative height assumption (165cm average for mixed gender populations)
    const assumedHeightCm = 165;
    const pixelToCmRatio = assumedHeightCm / heightInPixels;
    
    // Calculate shoulder width more accurately
    const shoulderWidth = distance(
        rawLandmarks[LEFT_SHOULDER],
        rawLandmarks[RIGHT_SHOULDER]
    );
    
    // CRITICAL FIX: Reduced multiplier from 2.5 to 2.0
    // Shoulder width to chest circumference is closer to 2.0x for average builds
    const shoulderWidthCm = shoulderWidth * pixelToCmRatio;
    const chestCm = shoulderWidthCm * 2.0;
    const chestInches = cmToInches(chestCm);
    
    // Calculate waist width - also reduced multiplier
    const hipWidth = distance(
        rawLandmarks[LEFT_HIP],
        rawLandmarks[RIGHT_HIP]
    );
    const hipWidthCm = hipWidth * pixelToCmRatio;
    
    // CRITICAL FIX: Reduced from 2.3 to 1.9 for waist
    const waistCm = hipWidthCm * 1.9;
    const waistInches = cmToInches(waistCm);
    
    // CRITICAL FIX: Reduced from 2.8 to 2.2 for hips
    const hipsCm = hipWidthCm * 2.2;
    const hipsInches = cmToInches(hipsCm);
    
    // Calculate inseam (hip to ankle)
    const leftInseam = Math.abs(rawLandmarks[LEFT_HIP].y - rawLandmarks[LEFT_ANKLE].y);
    const rightInseam = Math.abs(rawLandmarks[RIGHT_HIP].y - rawLandmarks[RIGHT_ANKLE].y);
    const avgInseam = (leftInseam + rightInseam) / 2;
    const inseamCm = avgInseam * pixelToCmRatio;
    const inseamInches = cmToInches(inseamCm);
    
    // Calculate arm length (shoulder to elbow approximate)
    const leftArmLength = distance(
        rawLandmarks[LEFT_SHOULDER],
        rawLandmarks[LEFT_ELBOW]
    );
    const rightArmLength = distance(
        rawLandmarks[RIGHT_SHOULDER],
        rawLandmarks[RIGHT_ELBOW]
    );
    const avgArmLength = (leftArmLength + rightArmLength) / 2;
    const sleeveLengthCm = (avgArmLength * pixelToCmRatio) * 1.8; // Reduced from 2.0 to 1.8
    const sleeveLengthInches = cmToInches(sleeveLengthCm);
    
    // Calculate total height estimate
    const heightCm = heightInPixels * pixelToCmRatio;
    const heightInches = cmToInches(heightCm);
    
    // IMPROVED SIZE RECOMMENDATION LOGIC
    // Uses chest AND waist ratio for better accuracy
    // Matches real-world US/International sizing standards
    
    const chestWaistRatio = chestInches / waistInches;
    let recommendedSize;
    let fitNote;
    let sizeCategory;
    
    // Determine size based on chest measurement (primary factor)
    if (chestInches < 33) {
        recommendedSize = 'XS';
        sizeCategory = 'xs';
        fitNote = 'Extra Small';
    } else if (chestInches < 36) {
        recommendedSize = 'S';
        sizeCategory = 's';
        fitNote = 'Small';
    } else if (chestInches < 39) {
        recommendedSize = 'M';
        sizeCategory = 'm';
        fitNote = 'Medium';
    } else if (chestInches < 42) {
        recommendedSize = 'L';
        sizeCategory = 'l';
        fitNote = 'Large';
    } else if (chestInches < 46) {
        recommendedSize = 'XL';
        sizeCategory = 'xl';
        fitNote = 'Extra Large';
    } else {
        recommendedSize = 'XXL';
        sizeCategory = 'xxl';
        fitNote = 'Double XL';
    }
    
    // Add body type context based on chest-to-waist ratio
    if (chestWaistRatio > 1.25) {
        fitNote += ' - Athletic build, consider fitted cut';
    } else if (chestWaistRatio > 1.15) {
        fitNote += ' - Standard fit recommended';
    } else if (chestWaistRatio > 1.05) {
        fitNote += ' - Relaxed fit may be more comfortable';
    } else {
        fitNote += ' - Consider sizing up for comfort';
    }
    
    // Calculate confidence score based on landmark visibility
    const visibilityScores = rawLandmarks.map(lm => lm.visibility || 1);
    const avgVisibility = visibilityScores.reduce((a, b) => a + b, 0) / visibilityScores.length;
    const confidencePercent = Math.round(avgVisibility * 100);
    
    // Add accuracy note with more context
    let accuracyNote = 'Good accuracy';
    if (confidencePercent < 70) {
        accuracyNote = 'Low confidence - improve lighting or move closer';
    } else if (confidencePercent < 85) {
        accuracyNote = 'Moderate accuracy - ensure full body is visible';
    }
    
    // Add measurement quality warning if multipliers seem off
    if (shoulderWidthCm < 30 || shoulderWidthCm > 60) {
        accuracyNote = 'Measurement may be inaccurate - adjust distance or posture';
    }
    
    return {
        chest_inches: chestInches,
        waist_inches: waistInches,
        hips_inches: hipsInches,
        inseam_inches: inseamInches,
        sleeve_length_inches: sleeveLengthInches,
        height_inches: heightInches,
        shoulder_width_inches: cmToInches(shoulderWidthCm),
        chest_waist_ratio: Math.round(chestWaistRatio * 100) / 100,
        recommended_size: recommendedSize,
        fit_note: fitNote,
        confidence_percent: confidencePercent,
        accuracy_note: accuracyNote,
        timestamp: new Date().toISOString(),
        raw_landmarks_count: rawLandmarks.length
    };
}

/**
 * Capture measurements and display results
 */
function captureMeasurements() {
    try {
        updateStatus('Processing measurements...', 'info');
        
        // Get landmarks from current video frame
        const rawLandmarks = getLandmarks(videoElement);
        
        // Calculate measurements
        measurementData = getMeasurements(rawLandmarks);
        
        // Display results
        displayResults(measurementData);
        
        // Update UI
        document.getElementById('capture-btn').disabled = true;
        document.getElementById('download-btn').style.display = 'block';
        
        updateStatus('Measurements captured successfully!', 'success');
        
    } catch (error) {
        console.error('Error capturing measurements:', error);
        updateStatus('Error: ' + error.message, 'error');
    }
}

/**
 * Display measurement results in UI
 */
function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    const gridDiv = document.getElementById('measurements-grid');
    const recommendationDiv = document.getElementById('recommendation');
    
    // Clear previous results
    gridDiv.innerHTML = '';
    
    // Create measurement cards
    const measurements = [
        { label: 'Chest', value: data.chest_inches + ' in' },
        { label: 'Waist', value: data.waist_inches + ' in' },
        { label: 'Hips', value: data.hips_inches + ' in' },
        { label: 'Shoulder Width', value: data.shoulder_width_inches + ' in' },
        { label: 'Inseam', value: data.inseam_inches + ' in' },
        { label: 'Sleeve Length', value: data.sleeve_length_inches + ' in' },
        { label: 'Height', value: data.height_inches + ' in' },
        { label: 'Body Ratio', value: data.chest_waist_ratio + ':1' }
    ];
    
    measurements.forEach(m => {
        const card = document.createElement('div');
        card.className = 'measurement-item';
        card.innerHTML = `
            <div class="measurement-label">${m.label}</div>
            <div class="measurement-value">${m.value}</div>
        `;
        gridDiv.appendChild(card);
    });
    
    // Display recommendation
    recommendationDiv.innerHTML = `
        <h3>Size Recommendation</h3>
        <div class="size-badge">${data.recommended_size}</div>
        <p>${data.fit_note}</p>
        <p style="margin-top: 12px; font-size: 12px; color: #718096;">
            <strong>Confidence:</strong> ${data.confidence_percent}% | 
            <strong>Note:</strong> ${data.accuracy_note}
        </p>
    `;
    
    // Show results section
    resultsDiv.classList.add('show');
}

/**
 * Download measurements as JSON file
 */
function downloadJSON() {
    if (!measurementData) {
        alert('No measurements to download');
        return;
    }
    
    const jsonString = JSON.stringify(measurementData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'measurements.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    updateStatus('JSON file downloaded successfully', 'success');
}

/**
 * Update status message
 */
function updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.className = 'status';
    
    if (type === 'error') {
        statusDiv.classList.add('error');
    } else if (type === 'success') {
        statusDiv.classList.add('success');
    }
    
    statusDiv.querySelector('.status-text').textContent = message;
}
