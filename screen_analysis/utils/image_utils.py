import io
import base64
from PIL import Image
from pathlib import Path
from typing import Tuple, Optional
from core.config import settings
from logger import GLOBAL_LOGGER as log

def resize_image(image: Image.Image, max_pixels: int = 1_800_000) -> Image.Image:
    """
    Resize the image if it exceeds max_pixels while maintaining aspect ratio.
    
    Args:
        image: PIL Image object
        max_pixels: Maximum allowed number of pixels (default: 1.8M)
        
    Returns:
        Resized PIL Image object if necessary, otherwise the original image
    """
    current_pixels = image.width * image.height
    
    if current_pixels <= max_pixels:
        return image
    
    scale_factor = (max_pixels / current_pixels) ** 0.5
    new_width = int(image.width * scale_factor)
    new_height = int(image.height * scale_factor)
    log.info(f"Resize image from {image.width}x{image.height} to {new_width}x{new_height}")
    
    return image.resize((new_width, new_height), Image.LANCZOS)

def encode_image_to_base64(image: Image.Image, format: str = "JPEG") -> str:
    """
    Encode a PIL Image to base64 string.
    
    Args:
        image: PIL Image to encode
        format: Image format (default: JPEG)
        
    Returns:
        Base64 encoded string of the image
    """
    buffered = io.BytesIO()
    image.save(buffered, format=format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def save_image(image_data: bytes, filename: str, directory: Optional[Path] = None) -> Path:
    """
    Save image data to a file.
    
    Args:
        image_data: Raw image data
        filename: Name of the file to save
        directory: Directory to save the file (default: static directory)
        
    Returns:
        Path to the saved file
    """
    if directory is None:
        directory = settings.STATIC_DIR
    
    directory.mkdir(parents=True, exist_ok=True)
    filepath = directory / filename
    
    with open(filepath, "wb") as f:
        f.write(image_data)
        
    return filepath
