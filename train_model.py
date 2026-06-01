import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Load the dataset
print("Loading dataset...")
crop = pd.read_csv("Crop_recommendation.csv")

# Create crop dictionary for mapping
crop_dict = {
    'rice': 1, 'maize': 2, 'jute': 3, 'cotton': 4, 'coconut': 5, 'papaya': 6,
    'orange': 7, 'apple': 8, 'muskmelon': 9, 'watermelon': 10, 'grapes': 11,
    'mango': 12, 'banana': 13, 'pomegranate': 14, 'lentil': 15, 'blackgram': 16,
    'mungbean': 17, 'mothbeans': 18, 'pigeonpeas': 19, 'kidneybeans': 20,
    'chickpea': 21, 'coffee': 22
}

# Map labels to numbers
crop['crop_num'] = crop['label'].map(crop_dict)

# Prepare features and target
X = crop.drop(['label', 'crop_num'], axis=1)
y = crop['crop_num']

# Split the data
print("Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale the features
print("Scaling features...")
scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train the model
print("Training Random Forest model...")
rfc = RandomForestClassifier(random_state=42)
rfc.fit(X_train_scaled, y_train)

# Calculate accuracy
from sklearn.metrics import accuracy_score
y_pred = rfc.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model accuracy: {accuracy:.4f}")

# Save the model and scaler
print("Saving model and scaler...")
os.makedirs("models", exist_ok=True)
joblib.dump(rfc, "models/crop_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")

# Save crop dictionary for reverse mapping
import json
reverse_crop_dict = {v: k.capitalize() for k, v in crop_dict.items()}
with open("models/crop_dict.json", "w") as f:
    json.dump(reverse_crop_dict, f)

print("Model training completed successfully!")
print(f"Model saved to: models/crop_model.pkl")
print(f"Scaler saved to: models/scaler.pkl")
print(f"Crop dictionary saved to: models/crop_dict.json")

