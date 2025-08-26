import base64
import io
import time
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from PIL import Image
from typing import Optional
import logging

from core.config import settings
from models.schemas import AnalysisRequest, AnalysisResponse
from services.ollama_service import analyze_with_ollama
from services.screen2words_service import screen2words_service
from utils.image_utils import resize_image

router = APIRouter()
templates = Jinja2Templates(directory=str(settings.TEMPLATES_DIR))
logger = logging.getLogger(__name__)

@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Serve the main application page."""
    return templates.TemplateResponse("index.html", {"request": request})

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(request: AnalysisRequest):
    """
    Analyze an image using the specified backend.
    
    Supports both Ollama and Screen2Words backends.
    """
    try:
        # Decode the base64 image
        try:
            image_data = base64.b64decode(request.image)
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
        
        start_time = time.time()
        
        # Route to the appropriate backend
        if request.backend.lower() == "ollama":
            model = request.model or "llava"
            analysis = analyze_with_ollama(image, request.prompt, model)
            backend_used = "ollama"
            model_used = model
            
        elif request.backend.lower() == "screen2words":
            analysis = screen2words_service.analyze(image, request.prompt)
            backend_used = "screen2words"
            model_used = screen2words_service.model_name
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported backend: {request.backend}")
        
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
        logger.exception("Error processing analysis request")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/file", response_model=AnalysisResponse)
async def analyze_image_file(
    file: UploadFile = File(...),
    prompt: str = "Analyze this screen capture and describe what you see in detail.",
    backend: str = "ollama",
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
