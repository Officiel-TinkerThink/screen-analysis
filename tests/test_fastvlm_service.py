import pytest
from screen_analysis.services.fastvlm_service import fast_vlm_service

def test_analyze_image():
    """Test the analyze_image function of the FastVLMService."""
    image_path = "data/sample/screen_sample.png"
    prompt = "What is on the screen?"

    # Test non-streaming response
    analysis = fast_vlm_service.analyze_image(image_path, prompt)
    assert isinstance(analysis, str)
    assert len(analysis) > 0

    # Test streaming response
    analysis_generator = fast_vlm_service.analyze_image(image_path, prompt, stream=True)
    full_analysis = ""
    for chunk in analysis_generator:
        assert isinstance(chunk, str)
        full_analysis += chunk
    assert len(full_analysis) > 0
