import time
import torch
from PIL import Image
from transformers import Pix2StructProcessor, Pix2StructForConditionalGeneration
from typing import Optional
from utils.image_utils import resize_image
from logger import GLOBAL_LOGGER as log

class Screen2WordsService:
    def __init__(self, model_name: str = "google/pix2struct-screen2words-base"):
        """
        Initialize the Screen2Words service.
        
        Args:
            model_name: Name of the pretrained model to use
        """
        self.model_name = model_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.processor = None
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the model and processor."""
        try:
            self.processor = Pix2StructProcessor.from_pretrained(self.model_name)
            self.model = Pix2StructForConditionalGeneration.from_pretrained(self.model_name)
            self.model.to(self.device)
        except Exception as e:
            raise Exception(f"Failed to load Screen2Words model: {str(e)}")
    
    def analyze(
        self, 
        image: Image.Image, 
        prompt: Optional[str] = None
    ) -> str:
        """
        Analyze an image using Screen2Words.
        
        Args:
            image: PIL Image to analyze
            prompt: Optional prompt/context for the analysis
            
        Returns:
            The analysis result as a string
        """
        if not self.model or not self.processor:
            self._load_model()
        
        try:
            # Start timing
            start_time = time.time()
            
            # Resize image if necessary
            resized_image = resize_image(image)
            # Prepare inputs
            inputs = self.processor(
                images=resized_image, 
                text=prompt if prompt else "",
                return_tensors="pt"
            ).to(self.device)
            log.info(f"Get inputs from Screen2Words")
            # Generate output
            with torch.no_grad():
                outputs = self.model.generate(**inputs)
            
            # Decode output
            result = self.processor.batch_decode(outputs, skip_special_tokens=True)[0].strip()
            
            # Log performance
            duration = time.time() - start_time
            log.info(f"Get responsed from Screen2Words")
            
            return result
            
        except Exception as e:
            raise Exception(f"Error in Screen2Words analysis: {str(e)}")

# Create a singleton instance
screen2words_service = Screen2WordsService()
