.bin/ollama serve &

pid=$!

sleep 5


echo "Pulling llava model..."

ollama pull llava

wait $pid