
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
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ==================== ENV SETTINGS ====================
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

app = Flask(__name__)
CORS(app)

# ==================== PATH CONFIG ====================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'm1_model', 'plant_model.h5')
CLASSES_PATH = os.path.join(BASE_DIR, 'm1_model', 'classes.json')

# ==================== SUPPORTED CROPS ====================
SUPPORTED_CROP_CLASSES_PREFIXES = [
    'Tomato',
    'Potato',
    'Pepper__bell__'
]

# ==================== API KEYS FROM ENV ====================
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY1', '')
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')

# If not found in env, try direct (fallback for testing)
if not GEMINI_API_KEY:
    GEMINI_API_KEY = ""

if not OPENROUTER_API_KEY:
    OPENROUTER_API_KEY = ""

print("=" * 60)
print("🌾 PROFESSIONAL PLANT DISEASE DETECTION API")
print("=" * 60)
print(f"📁 Model Path: {MODEL_PATH}")
print(f"📁 Classes Path: {CLASSES_PATH}")
print("🤖 Mode: HYBRID (Gemini -> OpenRouter -> Model Fallback)")
print(f"🔑 Gemini API: {'✅ Available' if GEMINI_API_KEY else '❌ Not configured'}")
print(f"🔑 OpenRouter API: {'✅ Available' if OPENROUTER_API_KEY else '❌ Not configured'}")
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

# ==================== HYBRID VALIDATION WITH LLM ====================

def classify_crop_with_gemini(image_bytes):
    """Use Gemini LLM to verify crop - with error handling and rate limit detection"""
    if not GEMINI_API_KEY:
        print("⚠️ Gemini API key missing - skipping")
        return None, False

    try:
        print("🤖 Attempting Gemini verification...")
        base64_image = base64.b64encode(image_bytes).decode('utf-8')

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

        payload = {
            "contents": [{
                "parts": [
                    {"text": "Look at this image and identify which crop it is. Respond with ONLY the crop name: tomato, potato, or bell pepper. If it's none of these, respond with 'other'. Do NOT include any extra words."},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }]
        }

        res = requests.post(url, json=payload, timeout=10)

        if res.status_code == 200:
            result = res.json()
            crop = result['candidates'][0]['content']['parts'][0]['text'].strip().lower()
            print(f"✅ Gemini result: {crop}")

            if crop in ['tomato', 'potato', 'bell pepper', 'pepper']:
                if 'pepper' in crop:
                    return 'bell pepper', True
                return crop, True
            else:
                print(f"❌ Gemini detected unsupported: {crop}")
                return None, True
        elif res.status_code == 429:  # Rate limit exceeded
            print(f"⚠️ Gemini rate limit exceeded (429) - will try OpenRouter")
            return None, False
        else:
            print(f"⚠️ Gemini error {res.status_code} - trying next option")
            return None, False

    except requests.exceptions.Timeout:
        print("⚠️ Gemini timeout - trying next option")
        return None, False
    except requests.exceptions.ConnectionError:
        print("⚠️ Gemini connection error - trying next option")
        return None, False
    except Exception as e:
        print(f"⚠️ Gemini error: {e} - trying next option")
        return None, False

def classify_crop_with_openrouter(image_bytes):
    """Use OpenRouter LLM to verify crop - as fallback to Gemini"""
    if not OPENROUTER_API_KEY:
        print("⚠️ OpenRouter API key missing - skipping")
        return None, False

    try:
        print("🤖 Attempting OpenRouter verification...")
        base64_image = base64.b64encode(image_bytes).decode('utf-8')

        url = "https://openrouter.ai/api/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "google/gemini-2.0-flash-exp:free",  # Free model on OpenRouter
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Look at this image and identify which crop it is. Respond with ONLY the crop name: tomato, potato, or bell pepper. If it's none of these, respond with 'other'. Do NOT include any extra words."
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
            "max_tokens": 50
        }

        res = requests.post(url, json=payload, headers=headers, timeout=15)

        if res.status_code == 200:
            result = res.json()
            crop = result['choices'][0]['message']['content'].strip().lower()
            print(f"✅ OpenRouter result: {crop}")

            if crop in ['tomato', 'potato', 'bell pepper', 'pepper']:
                if 'pepper' in crop:
                    return 'bell pepper', True
                return crop, True
            else:
                print(f"❌ OpenRouter detected unsupported: {crop}")
                return None, True
        elif res.status_code == 429:  # Rate limit exceeded
            print(f"⚠️ OpenRouter rate limit exceeded (429) - falling back to model")
            return None, False
        else:
            print(f"⚠️ OpenRouter error {res.status_code} - falling back to model")
            return None, False

    except requests.exceptions.Timeout:
        print("⚠️ OpenRouter timeout - falling back to model")
        return None, False
    except requests.exceptions.ConnectionError:
        print("⚠️ OpenRouter connection error - falling back to model")
        return None, False
    except Exception as e:
        print(f"⚠️ OpenRouter error: {e} - falling back to model")
        return None, False

def validate_with_model_only(prediction_result):
    """Validation using model predictions only (no LLM verification)"""
    predicted_class = prediction_result['className']
    confidence = prediction_result['confidence']
    top_3 = prediction_result['top3']
    
    print("\n📋 Model-Only Validation (LLM unavailable)")
    
    # Check 1: Is top prediction from supported crop?
    is_supported = is_supported_crop_class(predicted_class)
    print(f"  Top Prediction: {predicted_class} ({confidence}%)")
    
    # Check 2: Confidence threshold
    is_confident = confidence > 20
    print(f"  Confidence: {confidence}% {'✅ (>20%)' if is_confident else '❌ (need >20%)'}")
    
    # Check 3: All top 3 predictions must be supported crops
    supported_in_top3 = sum(1 for item in top_3 if is_supported_crop_class(item['class'])) 
    all_top3_supported = supported_in_top3 == 3
    print(f"  Top 3 Predictions: {supported_in_top3}/3 are supported")
    
    is_valid = is_supported and is_confident and all_top3_supported
    
    if not is_valid:
        if not is_supported:
            print(f"  ❌ Top prediction is NOT from supported crops")
        if not is_confident:
            print(f"  ❌ Confidence too low (need >20%)")
        if not all_top3_supported:
            print(f"  ❌ Not all top 3 predictions are supported crops")
    
    print(f"  Model-Only Result: {'✅ ACCEPT' if is_valid else '❌ REJECT'}\n")
    
    return is_valid

def is_supported_crop_class(class_name):
    """Check if the predicted class is from a supported crop"""
    for prefix in SUPPORTED_CROP_CLASSES_PREFIXES:
        if class_name.startswith(prefix):
            return True
    return False

def get_crop_name_from_class(class_name):
    """Extract crop name from class name"""
    if class_name.startswith('Tomato'):
        return 'tomato'
    elif class_name.startswith('Potato'):
        return 'potato'
    elif class_name.startswith('Pepper__bell__'):
        return 'bell pepper'
    return 'unknown'

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
        print("🔵 NEW PREDICTION REQUEST")
        print("="*60)

        if 'image' not in request.files:
            return jsonify({"success": False, "error": "NO_IMAGE"}), 400

        file = request.files['image']
        image_bytes = file.read()

        print(f"📁 File: {file.filename} ({len(image_bytes)} bytes)")

        # STEP 1: Get model prediction
        print("🔬 Running model prediction...")
        result = get_disease_prediction(image_bytes)

        if result is None:
            return jsonify({"success": False, "error": "PREDICTION_FAILED"}), 500

        predicted_class = result['className']
        print(f"📊 Model predicted: {predicted_class} ({result['confidence']}%)")

        # STEP 2: Try Gemini LLM verification first
        print("\n" + "="*60)
        print("🤖 STEP 1: LLM VERIFICATION (Gemini)")
        print("="*60)
        
        gemini_crop, gemini_success = classify_crop_with_gemini(image_bytes)
        
        if gemini_success and gemini_crop is not None:
            # Gemini worked! Use its result
            print(f"✅ Gemini approved: {gemini_crop}")
            
            if not is_supported_crop_class(predicted_class):
                print(f"❌ But model predicted unsupported class - REJECT")
                return jsonify({
                    "success": False,
                    "error": "UNSUPPORTED_CROP",
                    "message": "Image does not match a supported crop"
                }), 400
            
            crop = get_crop_name_from_class(predicted_class)
            return jsonify({
                "success": True,
                "crop": crop,
                "verification": "gemini",
                **result
            })
        elif not gemini_success:
            # Gemini failed (rate limit or error) - try OpenRouter
            print("\n" + "="*60)
            print("🤖 STEP 2: LLM VERIFICATION (OpenRouter - Fallback)")
            print("="*60)
            
            openrouter_crop, openrouter_success = classify_crop_with_openrouter(image_bytes)
            
            if openrouter_success and openrouter_crop is not None:
                # OpenRouter worked! Use its result
                print(f"✅ OpenRouter approved: {openrouter_crop}")
                
                if not is_supported_crop_class(predicted_class):
                    print(f"❌ But model predicted unsupported class - REJECT")
                    return jsonify({
                        "success": False,
                        "error": "UNSUPPORTED_CROP",
                        "message": "Image does not match a supported crop"
                    }), 400
                
                crop = get_crop_name_from_class(predicted_class)
                return jsonify({
                    "success": True,
                    "crop": crop,
                    "verification": "openrouter",
                    **result
                })
            else:
                # OpenRouter also failed - use model directly
                print("\n" + "="*60)
                print("⚠️ STEP 3: MODEL-ONLY VERIFICATION (No LLM)")
                print("="*60)
                
                is_valid = validate_with_model_only(result)
                
                if not is_valid:
                    return jsonify({
                        "success": False,
                        "error": "UNSUPPORTED_CROP",
                        "message": "Image does not appear to be a Tomato, Potato, or Bell Pepper leaf"
                    }), 400
                
                # Model validation passed
                crop = get_crop_name_from_class(predicted_class)
                print(f"✅ Model-only validation passed! Crop: {crop}")
                
                return jsonify({
                    "success": True,
                    "crop": crop,
                    "verification": "model_only",
                    **result
                })
        else:
            # Gemini worked but detected unsupported crop
            print(f"❌ Gemini detected unsupported crop")
            return jsonify({
                "success": False,
                "error": "UNSUPPORTED_CROP",
                "message": "Image does not match a supported crop"
            }), 400

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
        "classes": len(classes),
        "gemini_available": bool(GEMINI_API_KEY),
        "openrouter_available": bool(OPENROUTER_API_KEY)
    })

# ==================== RUN ====================
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Server running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
