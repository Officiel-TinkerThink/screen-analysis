FROM ollama/ollama:latest

# Environment
ENV OLLAMA_HOST=0.0.0.0 \
    OLLAMA_ORIGINS=* \
    MODEL=llava

# Install curl (and optionally bash if your script uses bash features)
RUN apt-get update && apt-get install -y curl bash && rm -rf /var/lib/apt/lists/*

# Copy pull script
COPY ./docker/ollama/pull_model.sh /usr/local/bin/pull_model.sh
RUN chmod +x /usr/local/bin/pull_model.sh

# Expose default Ollama API port
EXPOSE 11434

# Persist model cache
VOLUME ["/root/.ollama"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:11434/api/version || exit 1

# Entrypoint: script will pull model then start Ollama server
ENTRYPOINT ["/usr/local/bin/pull_model.sh"]