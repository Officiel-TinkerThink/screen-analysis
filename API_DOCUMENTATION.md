# Screen Analysis API Documentation

## Base URL
All API endpoints are relative to the base URL where the service is hosted (e.g., `http://localhost:8000` if running locally).

## Authentication
This API does not currently require authentication.

## Endpoints

### 1. Analyze Image

**Endpoint:** `POST /analyze`

Analyzes a provided image using the specified AI model and returns the analysis result.

#### Request Body
```json
{
  "image": "base64_encoded_image_string",
  "prompt": "Your analysis prompt",
  "backend": "ollama",
  "ollama_model": "llava"
}
```

#### Parameters
- `image` (string, required): Base64 encoded image data
- `prompt` (string, required): The prompt/instruction for image analysis
- `backend` (string, optional): Currently only "ollama" is supported (default: "ollama")
- `ollama_model` (string, optional): The model to use for analysis (default: "llava")

#### Response
```json
{
  "analysis": "The analysis result from the AI model"
}
```

#### Example Request
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_image_string",
    "prompt": "Describe this image in detail"
  }'
```

### 2. Health Check

**Endpoint:** `GET /health`

Check if the API service is running.

#### Response
```json
{
  "status": "healthy"
}
```

### 3. Web Interface

**Endpoint:** `GET /`

Returns the web interface for the application.

## Error Handling

### Common HTTP Status Codes
- `200 OK`: The request was successful
- `400 Bad Request`: Invalid request format or parameters
- `500 Internal Server Error`: An error occurred during processing

### Error Response Format
```json
{
  "detail": "Error message describing the issue"
}
```

## Setup and Requirements

### Environment Variables
- `OLLAMA_HOST`: Hostname of the Ollama server (default: "localhost")
- `OLLAMA_PORT`: Port of the Ollama server (default: "11434")

### Dependencies
- FastAPI
- Pillow
- requests
- python-multipart
- jinja2