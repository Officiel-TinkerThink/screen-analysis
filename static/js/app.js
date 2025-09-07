let captureInterval;
let isCapturing = false;
let screenStream = null;
let videoElement = null;
let isOnCam = false;
let cameraElement = null;
let cameraStream = null;
let currentCameraDeviceId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    cameraElement = document.getElementById('camera-preview');
    const toggleCameraBtn = document.getElementById('toggle-camera');
    const cameraDeviceSelect = document.getElementById('camera-device');
    
    // Initialize screen capture
    initScreenCapture();

    // Set up capture button
    const captureButton = document.getElementById('toggle-capture');
    captureButton.addEventListener('click', function() {
        if (isCapturing) {
            stopCapture();
        } else {
            startCapture();
        }
    });

    // Handle interval changes
    document.getElementById('interval').addEventListener('change', function() {
        if (isCapturing) {
            const wasCapturing = isCapturing;
            stopCapture();
            if (wasCapturing) {
                startCapture();
            }
        }
    });
    
    // Camera toggle button
    toggleCameraBtn.addEventListener('click', async () => {
        if (isOnCam) {
            await closeCamera();
            toggleCameraBtn.textContent = 'Start Camera';
            cameraDeviceSelect.style.display = 'none';
        } else {
            await openCamera();
            if (isOnCam) {
                toggleCameraBtn.textContent = 'Stop Camera';
                cameraDeviceSelect.style.display = 'inline-block';
            }
        }
    });
    
    // Handle camera device change
    cameraDeviceSelect.addEventListener('change', async () => {
        if (isOnCam) {
            currentCameraDeviceId = cameraDeviceSelect.value;
            await openCamera();
        }
    });
});

/* Camera Section */

async function openCamera() {
    try {
        // Stop any existing stream
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                deviceId: currentCameraDeviceId ? { exact: currentCameraDeviceId } : undefined,
                facingMode: currentCameraDeviceId ? undefined : 'user'
            },
            audio: false
        };

        // Get available devices if not already populated
        if (currentCameraDeviceId === null) {
            await populateCameraDevices();
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraElement.srcObject = stream;
        cameraStream = stream;
        isOnCam = true;
        
        // Play the video element
        await cameraElement.play();
        
        return true;
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access the camera. Please ensure you have granted camera permissions.');
        isOnCam = false;
        return false;
    }
}

async function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    if (cameraElement) {
        cameraElement.srcObject = null;
    }
    isOnCam = false;
    return true;
}

async function populateCameraDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const cameraSelect = document.getElementById('camera-device');
        
        // Clear existing options except the first one
        while (cameraSelect.options.length > 1) {
            cameraSelect.remove(1);
        }
        
        // Add available cameras
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);
            
            // Select the first camera by default
            if (index === 0) {
                currentCameraDeviceId = device.deviceId;
            }
        });
        
        return videoDevices.length > 0;
    } catch (error) {
        console.error('Error enumerating devices:', error);
        return false;
    }
}

async function initScreenCapture() {
    try {
        // Show the preview container
        const previewContainer = document.querySelector('.preview-container');
        previewContainer.style.display = 'block';
        
        // Request screen share with higher quality settings
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
                cursor: "never",
                displaySurface: "monitor",
                width: { ideal: 1920 },      // Request higher resolution
                height: { ideal: 1080 },
                frameRate: { ideal: 30, max: 60 },  // Request higher frame rate
                resizeMode: "none"           // Prevent automatic resizing
            }
        });
        
        // Set up preview element
        const previewElement = document.getElementById('screen-preview');
        previewElement.srcObject = screenStream;
        
        // Set up video element for capture with quality settings
        videoElement = document.createElement('video');
        videoElement.srcObject = screenStream;
        videoElement.playsInline = true;
        videoElement.muted = true;
        videoElement.setAttribute('autoplay', '');
        videoElement.setAttribute('playsinline', '');
        
        await videoElement.play();
        
        // Hide the placeholder image
        document.getElementById('screen-capture').classList.add('hidden');
        
        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
            previewContainer.style.display = 'none'; // Hide the preview when sharing is stopped
            if (isCapturing) {
                stopCapture();
            }
        };
        
        // Enable the capture button
        document.getElementById('toggle-capture').disabled = false;
    } catch (error) {
        console.error('Error initializing screen capture:', error);
        const textarea = document.getElementById('analysis-text');
        textarea.value = 'Error: Could not initialize screen sharing. Please refresh the page and try again.';
    }
}

function startCapture() {
    if (!screenStream) {
        console.error('Screen stream not available');
        return;
    }
    
    isCapturing = true;
    document.getElementById('toggle-capture').textContent = 'Stop Capture';
    const interval = document.getElementById('interval').value * 1000;
    captureAndAnalyze();
    captureInterval = setInterval(captureAndAnalyze, interval);
}

function stopCapture() {
    isCapturing = false;
    clearInterval(captureInterval);
    document.getElementById('toggle-capture').textContent = 'Start Capture';
    
    // Don't stop the screen sharing stream or clear video element
    // This allows restarting capture without re-prompting for permission
    
    // Keep the last captured image visible
    // No need to clear the screenCapture.src
}

async function analyzeWithBackend(imageBase64, backend, captureTime) {
    const textarea = document.getElementById(`${backend}-analysis`);
    
    try {
        // Show loading state
        const originalValue = textarea.value;
        textarea.value = `[${captureTime}] Analyzing...\n${originalValue}`;
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageBase64,
                prompt: 'Analyze this screen capture and describe what you see in detail.',
                backend: backend
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const analysisData = await response.json();
        
        // Format the analysis with timestamp and divider
        const formattedAnalysis = `[${captureTime}] ${backend.toUpperCase()}\n${'='.repeat(40)}\n${analysisData.analysis}\n\n`;
        
        // Update the textarea with the new analysis at the top
        textarea.value = formattedAnalysis + originalValue;
        
        console.log(`Successfully generated analysis for ${backend}`);
    } catch (error) {
        console.error(`Error with ${backend}:`, error);
        textarea.value = `[${captureTime}] Error: ${error.message}\n${textarea.value}`;
    }
}

async function captureAndAnalyze() {
    if (!screenStream || !videoElement) return;
    
    try {
        // Capture the screen
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
        document.getElementById('screen-capture').src = 'data:image/jpeg;base64,' + imageBase64;
        
        // Get the capture time once and use it for both analyses
        const captureTime = new Date().toLocaleTimeString();

        
        // Add a log message to the browser console
        const logMessage = `Captured at ${captureTime}`;
        console.log(logMessage);

        
        // Analyze with both backends in parallel
        await Promise.all([
            analyzeWithBackend(imageBase64, 'fastvlm', captureTime)
            // analyzeWithBackend(imageBase64, 'ollama', captureTime),
            // analyzeWithBackend(imageBase64, 'screen2words', captureTime)
        ]);
        
    } catch (error) {
        console.error('Error during capture and analysis:', error);
    }
}
