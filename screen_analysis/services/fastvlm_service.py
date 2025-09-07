import time
import torch
from PIL import Image
from typing import Optional, Dict, Any
from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer
from threading import Thread
from screen_analysis.logger import GLOBAL_LOGGER as log

class FastVLMService:
    def __init__(self, model_name: str = "apple/FastVLM-0.5B"):
        """
        Initialize the FastVLM service.
        
        Args:
            model_name: Name of the pretrained FastVLM model to use
        """
        self.model_name = model_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = None
        self.model = None
        self.image_token_index = -200  # Default image token index for FastVLM
        self._load_model()
    
    def _load_model(self):
        """Load the model and tokenizer."""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto",
                trust_remote_code=True,
            )
            log.info(f"Loaded FastVLM model on {self.device}")
        except Exception as e:
            raise Exception(f"Failed to load FastVLM model: {str(e)}")
    
    def prepare_inputs(self, prompt: str) -> Dict[str, Any]:
        """
        Prepare model inputs with image token.
        
        Args:
            prompt: The text prompt for the model
            
        Returns:
            Dictionary containing input tensors
        """
        messages = [{"role": "user", "content": f"<image>\n{prompt}"}]
        rendered = self.tokenizer.apply_chat_template(
            messages, add_generation_prompt=True, tokenize=False
        )
        
        pre, post = rendered.split("<image>", 1)
        
        pre_ids = self.tokenizer(pre, return_tensors="pt", add_special_tokens=False).input_ids
        post_ids = self.tokenizer(post, return_tensors="pt", add_special_tokens=False).input_ids
        img_tok = torch.tensor([[self.image_token_index]], dtype=pre_ids.dtype)
        
        input_ids = torch.cat([pre_ids, img_tok, post_ids], dim=1).to(self.device)
        attention_mask = torch.ones_like(input_ids, device=self.device)
        
        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask
        }
    
    def analyze_image(
        self, 
        image: Image, 
        prompt: str = "Describe this image in detail.",
        max_new_tokens: int = 128,
        stream: bool = False
    ):
        """
        Analyze an image using FastVLM.
        
        Args:
            image: PIL Image to analyze
            prompt: The prompt/instruction for the model
            max_new_tokens: Maximum number of tokens to generate
            stream: Whether to stream the output
            
        Returns:
            Generated text or generator for streaming
        """
        log.info("Starting FastVLM image analysis")
        if not self.model or not self.tokenizer:
            self._load_model()
        
        try:
            # Prepare text inputs
            log.info(f"Process input with FastVLM")
            inputs = self.prepare_inputs(prompt)
            
            # Load and preprocess image
            img = image.convert("RGB")
            px = self.model.get_vision_tower().image_processor(
                images=img, 
                return_tensors="pt"
            )[ "pixel_values"]
            px = px.to(self.device, dtype=self.model.dtype)
            
            generation_kwargs = dict(
                inputs=inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                images=px,
                max_new_tokens=max_new_tokens,
            )
            log.info(f"Process image with FastVLM")
            if stream:
                streamer = TextIteratorStreamer(self.tokenizer, skip_special_tokens=True)
                generation_kwargs["streamer"] = streamer
                
                thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
                thread.start()
                
                return streamer
            else:
                with torch.no_grad():
                    output_ids = self.model.generate(**generation_kwargs)  
                log.info(f"Get response from FastVLM")
                return self.tokenizer.decode(output_ids[0], skip_special_tokens=True)

        except Exception as e:
            raise Exception(f"Error in FastVLM analysis: {str(e)}")

fast_vlm_service = FastVLMService()