let captureInterval;
let isCapturing = false;
let screenStream = null;
let videoElement = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
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
});

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
    try {
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
        
        const analysisData = await response.json();
        const textarea = document.getElementById(`${backend}-analysis`);
        textarea.value = `[Captured: ${captureTime}]\n${analysisData.analysis}\n\n${textarea.value}`;
        console.log(`Successfully Generate Analysis for ${backend}:`);
    } catch (error) {
        console.error(`Error with ${backend}:`, error);
        const textarea = document.getElementById(`${backend}-analysis`);
        textarea.value = `[Captured: ${captureTime}] Error: ${error.message}\n${textarea.value}`;
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
            analyzeWithBackend(imageBase64, 'ollama', captureTime),
            // analyzeWithBackend(imageBase64, 'screen2words', captureTime)
        ]);
        
    } catch (error) {
        console.error('Error during capture and analysis:', error);
    }
}
