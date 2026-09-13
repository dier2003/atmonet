"""
FloodGuard ML Prediction Service — Tanzania-wide
==================================================
Loads the trained nationwide rainfall model and exposes a REST
endpoint that:
  1. Accepts any of Tanzania's 26 supported regions
  2. Fetches the last 35 days of real weather data for that region
  3. Rebuilds the exact same engineered features used during training
  4. Returns tomorrow's predicted rainfall

Run with:
    pip install fastapi uvicorn joblib pandas numpy requests scikit-learn
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import requests

app = FastAPI(title="FloodGuard ML Service (Tanzania-wide)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Load the trained model, scaler, feature list, and region list
# ---------------------------------------------------------
model = joblib.load("final_rainfall_model_tanzania.pkl")
scaler = joblib.load("final_rainfall_scaler_tanzania.pkl")
feature_cols = joblib.load("final_rainfall_features_tanzania.pkl")
tanzania_regions = joblib.load("tanzania_regions_list.pkl")  # list of (name, lat, lon)

CITIES = {name: (lat, lon) for name, lat, lon in tanzania_regions}
REGION_NAMES = list(CITIES.keys())


class PredictRequest(BaseModel):
    region: str = "Mbeya"


def get_season(month: int) -> str:
    if month in [3, 4, 5]:
        return "masika"
    elif month in [10, 11, 12]:
        return "vuli"
    return "dry"


def fetch_recent_weather(lat: float, lon: float) -> pd.DataFrame:
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
        "&past_days=35&forecast_days=1"
        "&timezone=Africa%2FDar_es_Salaam"
    )
    res = requests.get(url, timeout=10)
    if res.status_code != 200:
        raise HTTPException(status_code=502, detail="Weather data fetch failed")

    data = res.json()["daily"]
    df = pd.DataFrame({
        "time": pd.to_datetime(data["time"]),
        "temperature_2m_max": data["temperature_2m_max"],
        "temperature_2m_min": data["temperature_2m_min"],
        "precipitation_sum": data["precipitation_sum"],
    }).sort_values("time").reset_index(drop=True)

    return df


def build_features(df: pd.DataFrame, region: str, lat: float, lon: float) -> pd.DataFrame:
    df["month"] = df["time"].dt.month
    df["day_of_year"] = df["time"].dt.dayofyear
    df["latitude"] = lat
    df["longitude"] = lon
    df["season"] = df["month"].apply(get_season)
    df = pd.get_dummies(df, columns=["season"], prefix="season")

    for col in ["season_dry", "season_masika", "season_vuli"]:
        if col not in df.columns:
            df[col] = False

    df["precip_lag1"] = df["precipitation_sum"].shift(1)
    df["precip_lag7"] = df["precipitation_sum"].shift(7)
    df["temp_max_lag1"] = df["temperature_2m_max"].shift(1)
    df["precip_roll7"] = df["precipitation_sum"].rolling(window=7).mean()
    df["precip_roll30"] = df["precipitation_sum"].rolling(window=30).mean()
    df["temp_max_roll7"] = df["temperature_2m_max"].rolling(window=7).mean()

    # Add all 26 region one-hot columns, setting only the requested one to True
    for r in REGION_NAMES:
        col_name = f"region_{r}"
        if col_name in feature_cols:
            df[col_name] = (r == region)

    return df


@app.get("/health")
def health():
    return {"status": "ok", "service": "FloodGuard ML Service (Tanzania-wide)"}


@app.get("/regions")
def regions():
    return {"regions": REGION_NAMES}


@app.post("/predict")
def predict(req: PredictRequest):
    if req.region not in CITIES:
        raise HTTPException(status_code=400, detail=f"Unknown region: {req.region}. Available: {REGION_NAMES}")

    lat, lon = CITIES[req.region]
    df = fetch_recent_weather(lat, lon)
    df = build_features(df, req.region, lat, lon)
    df = df.dropna().reset_index(drop=True)

    if df.empty:
        raise HTTPException(status_code=500, detail="Not enough data to build features")

    # Ensure column order matches exactly what the model was trained on
    latest_row = df.iloc[[-1]][feature_cols]

    latest_scaled = scaler.transform(latest_row)
    predicted_rainfall = float(model.predict(latest_scaled)[0])
    predicted_rainfall = max(0.0, predicted_rainfall)

    return {
        "region": req.region,
        "latitude": lat,
        "longitude": lon,
        "date_of_forecast": str(df["time"].iloc[-1].date()),
        "predicted_rainfall_tomorrow_mm": round(predicted_rainfall, 2),
        "based_on": {
            "today_precipitation_mm": float(df["precipitation_sum"].iloc[-1]),
            "today_temp_max": float(df["temperature_2m_max"].iloc[-1]),
            "today_temp_min": float(df["temperature_2m_min"].iloc[-1]),
        }
    }