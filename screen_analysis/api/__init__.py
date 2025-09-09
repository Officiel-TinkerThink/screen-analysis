from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path

# Create FastAPI app
app = FastAPI(
    title="Screen Analysis API",
    description="API for analyzing screen captures using different AI backends",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Import and include router
from .routes import router as api_router
app.include_router(api_router, prefix="")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

