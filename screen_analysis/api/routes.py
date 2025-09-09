import asyncio
import base64
import io
import json
import time
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from PIL import Image
from typing import Optional, AsyncGenerator, Dict, Any
import logging

from core.config import settings
from models.schemas import AnalysisRequest, AnalysisResponse
from services.ollama_service import analyze_with_ollama
from services.screen2words_service import screen2words_service
from services.fastvlm_service import fast_vlm_service
from utils.image_utils import resize_image
from screen_analysis.logger import GLOBAL_LOGGER as log

router = APIRouter()

async def stream_generator(stream):
    for chunk in stream:
        yield chunk

@router.post("/analyze")
async def analyze_image(request: AnalysisRequest):
    """
    Analyze an image using the specified backend.
    
    Supports Ollama, FastVLM and Screen2Words backends.
    """
    try:
        log.info(f"Received analysis request for backend: {request.backend}")
        # Decode the base64 image
        try:
            image_data = base64.b64decode(request.image)
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
        
        start_time = time.time()
        
        # Route to the appropriate backend
        backend_lower = request.backend.lower()
        log.info(f"Processing with backend: {backend_lower}")
        
        if backend_lower == "fastvlm" and request.stream:
            log.info("Calling FastVLM service with streaming...")
            stream = fast_vlm_service.analyze_image(image, request.prompt, stream=True)
            
            async def event_stream():
                try:
                    for text_chunk in stream:
                        # Send each chunk as an SSE event
                        data = {
                            "analysis": text_chunk,
                            "processing_time": time.time() - start_time
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                        await asyncio.sleep(0)  # Allow other tasks to run
                except Exception as e:
                    log.error(f"Error in streaming response: {str(e)}")
                    error_data = {
                        "error": str(e),
                        "processing_time": time.time() - start_time
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"
            return StreamingResponse(
                event_stream(),
                media_type="text/event-stream",
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'  # Disable buffering in nginx if used
                }
            )

        elif backend_lower == "ollama":
            model = request.model or "llava"
            analysis = analyze_with_ollama(image, request.prompt, model)
            backend_used = "ollama"
            model_used = model
            
        elif backend_lower == "screen2words":
            analysis = screen2words_service.analyze(image, request.prompt)
            backend_used = "screen2words"
            model_used = screen2words_service.model_name

        elif backend_lower == "fastvlm":
            log.info("Calling FastVLM service...")
            analysis = fast_vlm_service.analyze_image(image, request.prompt)
            backend_used = "fastvlm"
            model_used = fast_vlm_service.model_name
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported backend: {request.backend}")

        log.info(f"Inference using {backend_used} with model {model_used}")
        
        processing_time = time.time() - start_time
        
        return {
            "analysis": analysis,
            "backend": backend_used,
            "model": model_used,
            "processing_time": processing_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log.exception("Error processing analysis request")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/file", response_model=AnalysisResponse)
async def analyze_image_file(
    file: UploadFile = File(...),
    prompt: str = "Analyze this screen capture and describe what you see in detail.",
    backend: str = "fastvlm",
    model: Optional[str] = None
):
    """
    Alternative endpoint that accepts an image file upload instead of base64.
    """
    try:
        # Read and validate the uploaded file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Convert to base64 for the standard analysis flow
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Use the standard analysis endpoint
        analysis_request = AnalysisRequest(
            image=img_str,
            prompt=prompt,
            backend=backend,
            model=model
        )
        
        return await analyze_image(analysis_request)
        
    except Exception as e:
        logger.exception("Error processing file upload")
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")
