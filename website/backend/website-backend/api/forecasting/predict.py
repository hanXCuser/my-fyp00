import numpy as np
import joblib
import tensorflow as tf

# Load model & scaler once
scaler = joblib.load("models/scaler.pkl")
model = tf.keras.models.load_model("models/lstm_model.h5", compile=False)

def predict_next(last_12_values):
    arr = np.array(last_12_values).reshape(-1,1)
    scaled = scaler.transform(arr)
    scaled = scaled.reshape(1, 12, 1)

    prediction_scaled = model.predict(scaled)
    prediction = scaler.inverse_transform(prediction_scaled)

    return float(prediction[0][0])