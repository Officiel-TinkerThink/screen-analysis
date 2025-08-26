import json
import requests
from PIL import Image
from core.config import settings
from utils.image_utils import encode_image_to_base64, resize_image
from logger import GLOBAL_LOGGER as log

def analyze_with_ollama(
    image: Image.Image, 
    prompt: str, 
    model: str = "llava"
) -> str:
    """
    Analyze an image using Ollama's API.
    
    Args:
        image: PIL Image to analyze
        prompt: The prompt to use for analysis
        model: The Ollama model to use (default: "llava")
        
    Returns:
        The analysis result as a string
    """
    # Resize image if necessary
    resized_image = resize_image(image)
    
    # Encode image to base64
    image_base64 = encode_image_to_base64(resized_image)
    
    # Prepare the payload
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "images": [image_base64]
    }
    
    try:
        # Send request to Ollama
        response = requests.post(
            settings.OLLAMA_URL,
            json=payload,
            timeout=300  # 60 seconds timeout
        )
        response.raise_for_status()
        log.info(f"Get Response from Ollama")
        
        # Process the response
        if response.headers.get('content-type') == 'application/json':
            response_data = response.json()
            log.info(f"Get Parsed Response from Ollama")
            return response_data.get('response', '').strip()
        else:
            # Handle streaming response if needed
            full_response = ""
            for line in response.iter_lines():
                if line:
                    response_data = json.loads(line.decode('utf-8'))
                    if 'response' in response_data:
                        full_response += response_data['response']
                    if response_data.get('done', False):
                        break
            log.info(f"Get Parsed Response from Ollama")
            return full_response.strip()
            
    except requests.RequestException as e:
        log.error(f"Error communicating with Ollama: {str(e)}")
        raise Exception(error_msg) from e
