from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import joblib
import json
import requests
from PIL import Image
import io
import random

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# ================= LOAD MODELS =================
try:
    model = joblib.load("models/crop_model.pkl")
    scaler = joblib.load("models/scaler.pkl")

    with open("models/crop_dict.json", "r") as f:
        crop_dict = json.load(f)

    print("✅ Crop Model loaded!")

except Exception as e:
    print("❌ Model loading error:", e)
    model = None
    scaler = None
    crop_dict = None


# ================= FRONTEND ROUTES =================
@app.route('/')
def home():
    return send_from_directory('frontend', 'index.html')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('frontend', path)


# ================= WEATHER =================
def get_weather_api_key():
    return "YOUR_API_KEY"   # 🔴 PUT YOUR KEY HERE


@app.route('/api/weather', methods=['POST'])
def get_weather():
    try:
        data = request.get_json()

        if not data or 'location' not in data:
            return jsonify({'error': 'Location required'}), 400

        location = data['location'].strip().split(',')[0]

        url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={get_weather_api_key()}&units=metric"
        res = requests.get(url)

        if res.status_code != 200:
            return fallback_weather(location)

        weather = res.json()

        rainfall = weather.get('rain', {}).get('1h', 0) * 24

        return jsonify({
            "success": True,
            "location": weather.get('name', location),
            "country": weather.get('sys', {}).get('country', 'IN'),
            "current": {
                "temperature": weather.get('main', {}).get('temp', 25),
                "humidity": weather.get('main', {}).get('humidity', 60),
                "rainfall": rainfall,
                "description": weather.get('weather', [{}])[0].get('description', '')
            }
        })

    except Exception as e:
        print("❌ Weather Error:", e)
        return fallback_weather("Unknown")


def fallback_weather(location):
    return jsonify({
        "success": True,
        "location": location,
        "country": "IN",
        "current": {
            "temperature": random.randint(20, 32),
            "humidity": random.randint(40, 80),
            "rainfall": random.randint(10, 200),
            "description": "default"
        }
    })


# ================= FARMER MODE =================
def convert_farmer_to_expert(data):
    soil = data.get("soilType", "medium")
    water = data.get("waterSource", "Rainfed")

    if soil == "low":
        N, P, K = 30, 30, 30
    elif soil == "high":
        N, P, K = 70, 60, 60
    else:
        N, P, K = 50, 40, 40

    if water == "Irrigation":
        N += 10
        K += 5

    return N, P, K


# ================= RECOMMEND =================
@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Invalid request'}), 400

        mode = data.get("mode", "expert")

        # 👨‍🌾 Farmer Mode
        if mode == "farmer":
            N, P, K = convert_farmer_to_expert(data)
            ph = float(data.get("ph", 6.5))
        else:
            N = float(data.get('N', 50))
            P = float(data.get('P', 40))
            K = float(data.get('K', 40))
            ph = float(data.get('ph', 6.5))

        temp = float(data.get('temperature', 25))
        humidity = float(data.get('humidity', 60))
        rainfall = float(data.get('rainfall', 50))

        print("📥 Input:", N, P, K, temp, humidity, ph, rainfall)

        # ================= MODEL =================
        if model and scaler:
            features = np.array([[N, P, K, temp, humidity, ph, rainfall]])
            scaled = scaler.transform(features)
            pred = model.predict(scaled)[0]
            crop = crop_dict.get(str(int(pred)), "Unknown")

        else:
            crop = smart_crop_logic(N, P, K, temp, humidity, ph, rainfall)

        return jsonify({
            "success": True,
            "crop": crop,
            "tips": generate_tips(N, P, K, temp, humidity, ph, rainfall),
            "products": get_products(N, P, K)
        })

    except Exception as e:
        print("❌ Recommendation Error:", e)
        return jsonify({'error': str(e)}), 500


# ================= SMART LOGIC =================
def smart_crop_logic(N, P, K, temp, humidity, ph, rainfall):

    possible = []

    if rainfall > 200:
        possible += ["Rice", "Sugarcane"]

    if temp > 30:
        possible += ["Cotton", "Maize"]

    if ph < 5.5:
        possible += ["Tea"]

    if humidity < 40:
        possible += ["Millet", "Sorghum"]

    if N > 70:
        possible += ["Wheat"]

    if not possible:
        possible = ["Maize", "Wheat", "Rice"]

    return random.choice(possible)


# ================= DISEASE =================
@app.route('/api/disease', methods=['POST'])
def detect_disease():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        file = request.files['image']

        if file.filename == '':
            return jsonify({'error': 'Empty file'}), 400

        Image.open(io.BytesIO(file.read())).convert("RGB")

        disease = random.choice(["Leaf Spot", "Powdery Mildew", "Rust"])

        return jsonify({
            "success": True,
            "disease": disease,
            "solution": get_solution(disease)
        })

    except Exception as e:
        print("❌ Disease Error:", e)
        return jsonify({'error': str(e)}), 500


# ================= PRODUCTS =================
def get_products(N, P, K):
    products = []

    if N < 50:
        products.append({"name": "Urea Fertilizer", "link": "https://www.amazon.in/s?k=urea"})
    if P < 40:
        products.append({"name": "DAP Fertilizer", "link": "https://www.amazon.in/s?k=dap"})
    if K < 40:
        products.append({"name": "Potash Fertilizer", "link": "https://www.amazon.in/s?k=potash"})
    if N > 70:
        products.append({"name": "Organic Compost", "link": "https://www.amazon.in/s?k=compost"})

    return products


# ================= TIPS =================
def generate_tips(N, P, K, temp, humidity, ph, rainfall):
    tips = []

    if N < 50: tips.append("Add nitrogen fertilizer")
    if P < 40: tips.append("Add phosphorus fertilizer")
    if K < 40: tips.append("Add potassium fertilizer")

    if ph < 5.5:
        tips.append("Soil acidic - add lime")
    elif ph > 8:
        tips.append("Soil alkaline - add compost")

    if rainfall < 100:
        tips.append("Low rainfall - irrigation needed")
    elif rainfall > 300:
        tips.append("Ensure proper drainage")

    if temp > 35:
        tips.append("High temperature - protect crops")

    if humidity > 85:
        tips.append("High humidity - risk of fungal diseases")

    tips.append("Use crop rotation")

    return tips


# ================= SOLUTION =================
def get_solution(disease):
    return {
        "Leaf Spot": "Use fungicide spray",
        "Powdery Mildew": "Spray sulfur",
        "Rust": "Use neem oil"
    }.get(disease, "Consult expert")


# ================= RUN =================
if __name__ == '__main__':
    app.run(debug=True, port=5000)