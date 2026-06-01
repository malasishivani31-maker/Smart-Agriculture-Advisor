# Crop Recommendation System

An AI-powered crop recommendation system that uses machine learning to suggest the best crops based on soil nutrients and weather conditions.

## Features

- 🌾 **ML-Powered Recommendations**: Uses Random Forest Classifier trained on crop data
- 🌤️ **Weather API Integration**: Automatically fetches real-time weather data using OpenWeatherMap API
- 📊 **Interactive Weather Charts**: Visual 5-day forecast with temperature, humidity, and rainfall trends
- 🎨 **Modern Web Interface**: Beautiful, responsive frontend with Chart.js visualizations
- 🔌 **Flask Backend**: RESTful API for crop predictions and weather data
- 💡 **Farming Tips**: Provides actionable advice based on input parameters
- 📍 **Location-Based**: Simply enter your location - weather data is fetched automatically

## Project Structure

```
.
├── server.py                   # Server startup script (recommended)
├── app.py                      # Flask server with weather API integration
├── train_model.py              # Model training script
├── Crop_recommendation.csv     # Dataset
├── requirements.txt            # Python dependencies
├── config.json.example         # Template for weather API key configuration
├── models/                     # Saved models (created after training)
│   ├── crop_model.pkl         # Trained Random Forest model
│   ├── scaler.pkl             # Feature scaler
│   └── crop_dict.json         # Crop label mapping
└── frontend/                   # Frontend files
    ├── Index.html             # Main HTML page
    ├── Script.js              # JavaScript for API calls and charts
    └── style.css              # Styling
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Weather API Key

The application uses OpenWeatherMap API to fetch weather data. You need to get a free API key:

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api) (free tier available)
2. Get your API key from the dashboard
3. **Option A**: Create a `config.json` file:
   ```json
   {
     "weather_api_key": "YOUR_API_KEY_HERE"
   }
   ```
4. **Option B**: Set environment variable:
   ```bash
   # Windows
   set WEATHER_API_KEY=your_api_key_here
   
   # Linux/Mac
   export WEATHER_API_KEY=your_api_key_here
   ```

A `config.json.example` file is provided as a template.

### 3. Start the Server

Simply run the server script:

```bash
python server.py
```

This will automatically:
- Check if the model exists
- Train the model if needed (first time only)
- Start the Flask server

**Alternative: Manual Setup**

If you prefer to train the model separately:

```bash
# Train the model
python train_model.py

# Start the server
python app.py
```

The training script will:
- Load the dataset
- Train a Random Forest Classifier
- Save the model, scaler, and crop dictionary to the `models/` directory

### 4. Access the Web Interface

Once the server is running, open your browser and navigate to:
```
http://localhost:5000
```

## Usage

1. Enter your location (city and country):
   - Example: "Mumbai, India" or "New York, USA"
   - Weather data will be automatically fetched

2. Enter your soil nutrient levels:
   - **Nitrogen (N)**: Soil nitrogen content in ppm
   - **Phosphorus (P)**: Soil phosphorus content in ppm
   - **Potassium (K)**: Soil potassium content in ppm
   - **pH**: Soil pH value (0-14)

3. Click "Get Crop Recommendation"

4. View the results:
   - **Recommended Crop**: AI-powered crop suggestion
   - **Farming Tips**: Actionable advice based on your conditions
   - **Weather Forecast**: 5-day forecast with interactive charts showing:
     - Temperature trends
     - Humidity levels
     - Rainfall predictions

## API Endpoints

### POST `/api/weather`

Fetches current weather and 5-day forecast for a location.

Request body:
```json
{
  "location": "Mumbai, India"
}
```

Response:
```json
{
  "current": {
    "temperature": 28.5,
    "humidity": 65,
    "rainfall": 0,
    "description": "clear sky",
    "icon": "01d",
    "wind_speed": 3.2,
    "pressure": 1013
  },
  "forecast": [...],
  "location": "Mumbai",
  "country": "IN",
  "success": true
}
```

### POST `/api/recommend`

Gets crop recommendation based on soil and weather parameters.

Request body:
```json
{
  "N": 50,
  "P": 55,
  "K": 40,
  "temperature": 25,
  "humidity": 60,
  "ph": 6.5,
  "rainfall": 200
}
```

Response:
```json
{
  "crop": "Rice",
  "crop_index": 1,
  "tips": [
    "Maintain balanced soil nutrients for healthy crop growth.",
    "Rotate crops seasonally to keep soil fertile."
  ],
  "success": true
}
```

## Model Information

- **Algorithm**: Random Forest Classifier
- **Accuracy**: ~99.5% (on test set)
- **Features**: 7 (N, P, K, temperature, humidity, ph, rainfall)
- **Classes**: 22 different crop types

## Supported Crops

Rice, Maize, Jute, Cotton, Coconut, Papaya, Orange, Apple, Muskmelon, Watermelon, Grapes, Mango, Banana, Pomegranate, Lentil, Blackgram, Mungbean, Mothbeans, Pigeonpeas, Kidneybeans, Chickpea, Coffee

## Technologies Used

- **Backend**: Flask, scikit-learn, pandas, numpy
- **Frontend**: HTML, CSS, JavaScript
- **ML Model**: Random Forest Classifier

## Notes

- Make sure to train the model (`train_model.py`) before running the Flask server
- The model uses MinMaxScaler for feature normalization
- The frontend expects the Flask server to run on `localhost:5000`

## Troubleshooting

1. **Model not found error**: Run `train_model.py` first to generate the model files
2. **Port already in use**: Change the port in `app.py` (line with `app.run()`)
3. **Weather API key error**: 
   - Make sure you've created `config.json` with your API key, or
   - Set the `WEATHER_API_KEY` environment variable
   - Verify your API key is valid at [OpenWeatherMap](https://openweathermap.org/api)
4. **Location not found**: Make sure to enter location in format "City, Country" (e.g., "Mumbai, India")
5. **CORS errors**: The Flask server has CORS enabled, so this shouldn't be an issue

## License

This project is for educational purposes.

