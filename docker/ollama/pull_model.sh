#!/usr/bin/env bash
set -e

# Start Ollama server in background
ollama serve &
OLLAMA_PID=$!

# Wait until server is ready
echo "Waiting for Ollama server..."
until curl -s http://localhost:11434/api/version > /dev/null; do
  sleep 2
done
echo "Ollama server is up."

# Check if model is already pulled
if ollama list | grep -q "$MODEL"; then
  echo "Model $MODEL already present, skipping pull."
else
  echo "Pulling model $MODEL..."
  ollama pull "$MODEL"
fi

# Keep Ollama running in foreground
wait $OLLAMA_PID