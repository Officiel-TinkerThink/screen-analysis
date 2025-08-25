from pydantic import BaseModel, Field
from typing import Optional

class AnalysisRequest(BaseModel):
    """Schema for analysis request body."""
    image: str = Field(..., description="Base64 encoded image data")
    prompt: str = Field("Analyze this screen capture and describe what you see in detail.", 
                       description="Prompt/instructions for the analysis")
    backend: str = Field("ollama", description="Backend to use for analysis (ollama or screen2words)")
    model: Optional[str] = Field(None, description="Specific model to use with the backend")

class AnalysisResponse(BaseModel):
    """Schema for analysis response."""
    analysis: str = Field(..., description="The analysis result")
    backend: str = Field(..., description="Backend used for analysis")
    model: Optional[str] = Field(None, description="Model used for analysis")
    processing_time: Optional[float] = Field(None, description="Time taken for analysis in seconds")
