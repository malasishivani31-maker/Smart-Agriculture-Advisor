#!/usr/bin/env python3
"""
Crop Recommendation System - Server Startup Script
This script checks for the trained model and starts the Flask server.
"""

import os
import sys
import subprocess

def check_model_exists():
    """Check if the trained model files exist"""
    model_path = "models/crop_model.pkl"
    scaler_path = "models/scaler.pkl"
    dict_path = "models/crop_dict.json"
    
    return all([
        os.path.exists(model_path),
        os.path.exists(scaler_path),
        os.path.exists(dict_path)
    ])

def train_model():
    """Train the ML model"""
    print("=" * 50)
    print("Training ML Model...")
    print("=" * 50)
    
    try:
        # Run the training script
        result = subprocess.run(
            [sys.executable, "train_model.py"],
            check=True,
            capture_output=False
        )
        print("\n✓ Model training completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Error training model: {e}")
        return False
    except FileNotFoundError:
        print("\n✗ Error: train_model.py not found!")
        return False

def start_server():
    """Start the Flask server"""
    print("\n" + "=" * 50)
    print("Starting Flask Server...")
    print("=" * 50)
    print("Server will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    print("=" * 50 + "\n")
    
    try:
        # Import and run the Flask app
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n\nServer stopped by user.")
    except Exception as e:
        print(f"\n✗ Error starting server: {e}")
        sys.exit(1)

def main():
    """Main function"""
    print("\n" + "=" * 50)
    print("Crop Recommendation System - Server Startup")
    print("=" * 50 + "\n")
    
    # Check if model exists
    if not check_model_exists():
        print("Model files not found. Training model...\n")
        if not train_model():
            print("\n✗ Failed to train model. Please check your setup.")
            sys.exit(1)
    else:
        print("✓ Model files found. Skipping training.\n")
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main()

