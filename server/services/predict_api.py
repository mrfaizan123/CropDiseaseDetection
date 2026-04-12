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

# ==================== OPENROUTER API KEY ====================
OPENROUTER_API_KEY = "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"

SUPPORTED_CROPS = ['tomato', 'potato', 'bell pepper', 'pepper']

print("=" * 60)
print("🌾 PROFESSIONAL PLANT DISEASE DETECTION API")
print("=" * 60)
print(f"📁 Model Path: {MODEL_PATH}")
print(f"📁 Classes Path: {CLASSES_PATH}")
print(f"🔑 OpenRouter API Key: {'✅ Loaded' if OPENROUTER_API_KEY else '❌ Not Found'}")
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

# ==================== OPENROUTER CROP CLASSIFICATION ====================

def classify_crop_with_openrouter(image_bytes):
    """
    Use OpenRouter API (Gemini 2.5 Flash via OpenRouter) to identify crop
    """
    if not OPENROUTER_API_KEY:
        print("⚠️ OpenRouter API key missing")
        return None

    try:
        # Encode image to base64
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        # OpenRouter API endpoint
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "What crop is shown in this image? Answer with ONLY ONE WORD: 'tomato', 'potato', 'bell pepper', or 'other'. Do not add any other text."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 10,
            "temperature": 0
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            crop = result['choices'][0]['message']['content'].strip().lower()
            crop = crop.replace('.', '').strip()
            print(f"🤖 OpenRouter says: '{crop}'")
            
            if crop in SUPPORTED_CROPS:
                return crop
            elif 'pepper' in crop:
                return 'bell pepper'
            else:
                return None
        else:
            print(f"❌ OpenRouter API error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return None

    except Exception as e:
        print(f"❌ OpenRouter exception: {e}")
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

        print(f"📊 Raw predictions shape: {preds.shape}")

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

        # ========== STEP 1: OpenRouter Crop Classification ==========
        print("📷 OpenRouter crop detection...")
        crop = classify_crop_with_openrouter(image_bytes)

        if crop is None:
            return jsonify({
                "success": False,
                "error": "UNSUPPORTED_CROP",
                "message": "This image does not show a supported crop.",
                "supported_crops": ["🍅 Tomato", "🥔 Potato", "🫑 Bell Pepper"]
            }), 400

        print(f"✅ Crop identified: {crop}")

        # ========== STEP 2: Disease Detection ==========
        print("🔬 Disease detection...")
        result = get_disease_prediction(image_bytes)

        if result is None:
            return jsonify({"success": False, "error": "PREDICTION_FAILED"}), 500

        print(f"🎯 Disease: {result['className']}")
        print(f"📊 Confidence: {result['confidence']}%")

        # Map crop to display name
        crop_display = {
            'tomato': '🍅 Tomato',
            'potato': '🥔 Potato',
            'bell pepper': '🫑 Bell Pepper'
        }.get(crop, crop)

        return jsonify({
            "success": True,
            "cropClassifiedBy": "OpenRouter AI (Gemini 2.5 Flash)",
            "cropType": crop_display,
            "className": result['className'],
            "confidence": result['confidence'],
            "isHealthy": result['isHealthy'],
            "top3": result['top3'],
            "message": f"✅ {crop_display} detected. {result['className']} with {result['confidence']}% confidence"
        })

    except Exception as e:
        print(f"❌ Server error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/health')
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "openrouter_available": bool(OPENROUTER_API_KEY),
        "supported_crops": ["Tomato", "Potato", "Bell Pepper"],
        "total_disease_classes": len(classes)
    })

# ==================== RUN ====================
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🚀 STARTING PROFESSIONAL API SERVER")
    print("=" * 60)
    print(f"✅ Your Model: {len(classes)} disease classes")
    print(f"✅ OpenRouter API: {'ENABLED ✅' if OPENROUTER_API_KEY else 'DISABLED ❌'}")
    print(f"✅ Model: Gemini 2.5 Flash via OpenRouter")
    print("🚀 Server running on http://0.0.0.0:5001")
    print("=" * 60 + "\n")
    
    app.run(host="0.0.0.0", port=5001, debug=False)
