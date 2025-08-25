FROM ollama/ollama:latest

# Basic configuration
ENV OLLAMA_HOST=0.0.0.0 \
    OLLAMA_ORIGINS=*

# Expose API port
EXPOSE 11434

# Data volume
VOLUME ["/root/.ollama"]

# Simple health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:11434/api/version || exit 1

# Run Ollama
CMD ["ollama", "serve"]
