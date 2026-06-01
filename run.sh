#!/bin/bash

echo "========================================"
echo "Crop Recommendation System - Quick Start"
echo "========================================"
echo ""

echo "Step 1: Checking if model exists..."
if [ ! -f "models/crop_model.pkl" ]; then
    echo "Model not found. Training model..."
    python train_model.py
    if [ $? -ne 0 ]; then
        echo "Error training model. Please check your Python installation and dependencies."
        exit 1
    fi
else
    echo "Model found. Skipping training."
fi

echo ""
echo "Step 2: Starting Flask server..."
echo "Server will be available at http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo ""
python app.py

