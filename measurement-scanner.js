// Global variables
let pose = null;
let camera = null;
let videoElement = null;
let canvasElement = null;
let canvasCtx = null;
let latestLandmarks = null;
let measurementData = null;

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
        
        // Initialize camera
        camera = new Camera(videoElement, {
            onFrame: async () => {
                await pose.send({image: videoElement});
            },
            width: 640,
            height: 480
        });
        
        await camera.start();
        
        // Update UI
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('capture-btn').style.display = 'block';
        document.getElementById('capture-btn').disabled = false;
        
        updateStatus('Camera active. Position yourself and click "Capture Measurements"', 'success');
        
    } catch (error) {
        console.error('Error starting camera:', error);
        updateStatus('Error: ' + error.message + '. Make sure you are using HTTPS.', 'error');
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
    
    // Helper function to calculate Euclidean distance between two points
    function distance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = (point1.z || 0) - (point2.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    // Calculate reference height (nose to average ankle position)
    const avgAnkleY = (rawLandmarks[LEFT_ANKLE].y + rawLandmarks[RIGHT_ANKLE].y) / 2;
    const heightInPixels = Math.abs(rawLandmarks[NOSE].y - avgAnkleY);
    
    // Assume average human height of 170cm for calibration
    const assumedHeightCm = 170;
    const pixelToCmRatio = assumedHeightCm / heightInPixels;
    
    // Calculate shoulder width (chest proxy)
    const shoulderWidth = distance(
        rawLandmarks[LEFT_SHOULDER],
        rawLandmarks[RIGHT_SHOULDER]
    );
    const chestCm = Math.round((shoulderWidth * pixelToCmRatio) * 2.5); // Chest is ~2.5x shoulder width
    
    // Calculate waist width (hip area, slightly above actual hips)
    const hipWidth = distance(
        rawLandmarks[LEFT_HIP],
        rawLandmarks[RIGHT_HIP]
    );
    const waistCm = Math.round((hipWidth * pixelToCmRatio) * 2.3); // Waist multiplier
    
    // Calculate hip width
    const hipsCm = Math.round((hipWidth * pixelToCmRatio) * 2.8); // Hips are wider
    
    // Calculate inseam (hip to ankle)
    const leftInseam = Math.abs(rawLandmarks[LEFT_HIP].y - rawLandmarks[LEFT_ANKLE].y);
    const rightInseam = Math.abs(rawLandmarks[RIGHT_HIP].y - rawLandmarks[RIGHT_ANKLE].y);
    const avgInseam = (leftInseam + rightInseam) / 2;
    const inseamCm = Math.round(avgInseam * pixelToCmRatio);
    
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
    const sleeveLengthCm = Math.round((avgArmLength * pixelToCmRatio) * 2); // Full sleeve is ~2x shoulder-to-elbow
    
    // Calculate total height estimate
    const heightCm = Math.round(heightInPixels * pixelToCmRatio);
    
    // Determine recommended size based on chest measurement
    let recommendedSize;
    let fitNote;
    
    if (chestCm < 86) {
        recommendedSize = 'XS';
        fitNote = 'Extra Small - Best for slim builds';
    } else if (chestCm < 94) {
        recommendedSize = 'S';
        fitNote = 'Small - Fitted cut recommended';
    } else if (chestCm < 102) {
        recommendedSize = 'M';
        fitNote = 'Medium - Standard fit';
    } else if (chestCm < 110) {
        recommendedSize = 'L';
        fitNote = 'Large - Comfortable fit';
    } else if (chestCm < 118) {
        recommendedSize = 'XL';
        fitNote = 'Extra Large - Relaxed fit';
    } else {
        recommendedSize = 'XXL';
        fitNote = 'Double XL - Generous fit for comfort';
    }
    
    // Calculate confidence score based on landmark visibility
    const visibilityScores = rawLandmarks.map(lm => lm.visibility || 1);
    const avgVisibility = visibilityScores.reduce((a, b) => a + b, 0) / visibilityScores.length;
    const confidencePercent = Math.round(avgVisibility * 100);
    
    // Add accuracy note
    let accuracyNote = 'Good accuracy';
    if (confidencePercent < 70) {
        accuracyNote = 'Low confidence - improve lighting or move closer';
    } else if (confidencePercent < 85) {
        accuracyNote = 'Moderate accuracy - ensure full body is visible';
    }
    
    return {
        chest_cm: chestCm,
        waist_cm: waistCm,
        hips_cm: hipsCm,
        inseam_cm: inseamCm,
        sleeve_length_cm: sleeveLengthCm,
        height_cm: heightCm,
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
        { label: 'Chest', value: data.chest_cm + ' cm' },
        { label: 'Waist', value: data.waist_cm + ' cm' },
        { label: 'Hips', value: data.hips_cm + ' cm' },
        { label: 'Inseam', value: data.inseam_cm + ' cm' },
        { label: 'Sleeve Length', value: data.sleeve_length_cm + ' cm' },
        { label: 'Height', value: data.height_cm + ' cm' }
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
