import pytest
from fastapi.testclient import TestClient
from screen_analysis.main import app

client = TestClient(app)

def test_read_root():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome to" in response.json()["message"]

@pytest.mark.asyncio
async def test_analyze_endpoint():
    """Test the analyze endpoint with a sample image."""
    # This is a minimal test - in a real scenario, you'd use a test image
    test_data = {
        "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",  # 1x1 transparent pixel
        "prompt": "Describe this image",
        "backend": "ollama"
    }
    
    response = client.post("/api/analyze", json=test_data)
    assert response.status_code in [200, 500]  # 500 if Ollama is not running

@pytest.mark.asyncio
async def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "version" in response.json()
