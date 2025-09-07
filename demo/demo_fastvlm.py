import time
from screen_analysis.services.fastvlm_service import fast_vlm_service

image_path = "data/sample/screen_sample.png"
prompt = "What is on the screen?"

print(f"Running FastVLM demo with image: {image_path}")

start_time = time.time()
first_token_time = None
generated_text = ""

analysis_generator = fast_vlm_service.analyze_image(image_path, prompt, stream=True)

print("\n--- Analysis ---")
for new_text in analysis_generator:
    if first_token_time is None:
        first_token_time = time.time()
        ttft = first_token_time - start_time
        print(f"Time to First Token (TTFT): {ttft:.2f}s")
    print(new_text, end="", flush=True)
    generated_text += new_text

end_time = time.time()
full_latency = end_time - start_time

print("\n\n--- Performance ---")
print(f"Full latency: {full_latency:.2f}s")
