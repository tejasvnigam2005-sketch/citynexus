"""
CityNexus — AI Accident Detection Microservice
Uses Hugging Face model: hilmantm/detr-traffic-accident-detection
Runs on port 5000
"""

import os
import io
import traceback

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
from transformers import DetrImageProcessor, DetrForObjectDetection

# ── App setup ────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── Load model & processor once at startup ───────────────────────────
MODEL_NAME = "hilmantm/detr-traffic-accident-detection"

print(f"[AI] Loading model: {MODEL_NAME} …")
processor = DetrImageProcessor.from_pretrained(MODEL_NAME)
model = DetrForObjectDetection.from_pretrained(MODEL_NAME)
model.eval()
print("[AI] Model loaded successfully ✓")

# Confidence threshold — ignore detections below this score
CONFIDENCE_THRESHOLD = 0.5


# ── Health check ─────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME})


# ── Detection endpoint ──────────────────────────────────────────────
@app.route("/detect", methods=["POST"])
def detect():
    # --- Validate request ---
    if "image" not in request.files:
        return jsonify({"error": "No image file provided. Send as form-data with key 'image'."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    try:
        # --- Open image ---
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = image.size

        # --- Run inference ---
        inputs = processor(images=image, return_tensors="pt")

        with torch.no_grad():
            outputs = model(**inputs)

        # --- Post-process ---
        target_sizes = torch.tensor([[height, width]])
        results = processor.post_process_object_detection(
            outputs, target_sizes=target_sizes, threshold=CONFIDENCE_THRESHOLD
        )[0]

        detections = []
        for score, label_id, box in zip(
            results["scores"], results["labels"], results["boxes"]
        ):
            label_name = model.config.id2label.get(int(label_id), f"class_{int(label_id)}")
            x1, y1, x2, y2 = box.tolist()

            detections.append({
                "label": label_name,
                "confidence": round(float(score), 4),
                "box": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
            })

        # Sort by confidence descending
        detections.sort(key=lambda d: d["confidence"], reverse=True)

        return jsonify({
            "success": True,
            "count": len(detections),
            "detections": detections,
        })

    except Exception as exc:
        traceback.print_exc()
        return jsonify({"error": f"Inference failed: {str(exc)}"}), 500


# ── Run ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
