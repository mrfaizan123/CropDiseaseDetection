import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import json
import os
import cv2
import requests
import base64

# ==================== ENV SETTINGS ====================
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

app = Flask(__name__)
CORS(app)

# ==================== PATH CONFIG ====================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'm1_model', 'plant_model.h5')
CLASSES_PATH = os.path.join(BASE_DIR, 'm1_model', 'classes.json')

# ==================== API KEY ====================
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

SUPPORTED_CROPS = ['tomato', 'potato', 'bell pepper', 'pepper']

print("=" * 60)
print("🌾 PROFESSIONAL PLANT DISEASE DETECTION API")
print("=" * 60)
print(f"📁 Model Path: {MODEL_PATH}")
print(f"📁 Classes Path: {CLASSES_PATH}")
print(f"🔑 Gemini API Key: {'✅ Loaded' if GEMINI_API_KEY else '❌ Not Found'}")
print("=" * 60)

# ==================== FILE CHECK ====================
if not os.path.exists(MODEL_PATH):
    print(f"❌ ERROR: Model not found at {MODEL_PATH}")
    exit(1)

if not os.path.exists(CLASSES_PATH):
    print(f"❌ ERROR: Classes not found at {CLASSES_PATH}")
    exit(1)

# ==================== LAZY MODEL ====================
model = None

def get_model():
    global model
    if model is None:
        print("🔥 Loading model (lazy)...")
        model = load_model(MODEL_PATH, compile=False)
        print("✅ Model loaded successfully")
    return model

# ==================== LOAD CLASSES ====================
with open(CLASSES_PATH, 'r') as f:
    classes = json.load(f)

print(f"✅ Loaded {len(classes)} disease classes")
print("=" * 60)

# ==================== GEMINI ====================
def classify_crop_with_gemini(image_bytes):
    if not GEMINI_API_KEY:
        print("⚠️ Gemini API key missing")
        return None

    try:
        base64_image = base64.b64encode(image_bytes).decode('utf-8')

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

        payload = {
            "contents": [{
                "parts": [
                    {"text": "Identify crop: tomato, potato, bell pepper, or other. Only one word."},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }]
        }

        res = requests.post(url, json=payload, timeout=15)

        if res.status_code == 200:
            result = res.json()
            crop = result['candidates'][0]['content']['parts'][0]['text'].strip().lower()
            print(f"🤖 Gemini result: {crop}")

            if crop in SUPPORTED_CROPS:
                return crop
            elif 'pepper' in crop:
                return 'bell pepper'
            return None
        else:
            print(f"❌ Gemini error: {res.status_code}")
            return None

    except Exception as e:
        print(f"❌ Gemini exception: {e}")
        return None

# ==================== PREPROCESS ====================
def preprocess_image(image_bytes):
    try:
        print(f"📦 Image size: {len(image_bytes)} bytes")

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            print("❌ OpenCV failed to read image")
            return None

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))

        img = np.expand_dims(img, axis=0) / 255.0

        print(f"🧠 Processed shape: {img.shape}")

        return img

    except Exception as e:
        print(f"❌ Preprocess error: {e}")
        return None

# ==================== PREDICTION ====================
def get_disease_prediction(image_bytes):
    processed = preprocess_image(image_bytes)

    if processed is None:
        return None

    try:
        model = get_model()

        print("🚀 Running prediction...")
        preds = model.predict(processed, verbose=0)

        print(f"📊 Raw predictions: {preds}")

        idx = np.argmax(preds[0])
        confidence = float(np.max(preds[0]) * 100)

        top_3_idx = np.argsort(preds[0])[-3:][::-1]

        top_3 = [
            {
                "class": classes[i],
                "confidence": float(preds[0][i] * 100)
            }
            for i in top_3_idx
        ]

        return {
            "className": classes[idx],
            "confidence": round(confidence, 2),
            "top3": top_3,
            "isHealthy": "healthy" in classes[idx].lower()
        }

    except Exception as e:
        print(f"❌ Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return None

# ==================== ROUTES ====================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        print("\n" + "="*60)
        print("🔵 NEW REQUEST")
        print("="*60)

        if 'image' not in request.files:
            return jsonify({"success": False, "error": "NO_IMAGE"}), 400

        file = request.files['image']
        image_bytes = file.read()

        print(f"📁 File: {file.filename}")

        # STEP 1
        print("📷 Gemini crop detection...")
        crop = classify_crop_with_gemini(image_bytes)

        if crop is None:
            return jsonify({
                "success": False,
                "error": "UNSUPPORTED_CROP"
            }), 400

        print(f"✅ Crop: {crop}")

        # STEP 2
        print("🔬 Disease detection...")
        result = get_disease_prediction(image_bytes)

        if result is None:
            return jsonify({"success": False, "error": "PREDICTION_FAILED"}), 500

        print(f"🎯 Result: {result}")

        return jsonify({
            "success": True,
            "crop": crop,
            **result
        })

    except Exception as e:
        print(f"❌ Server error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/health')
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "classes": len(classes)
    })

# ==================== RUN ====================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)