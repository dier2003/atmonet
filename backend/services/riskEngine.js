// services/riskEngine.js
//
// Combines the real ML rainfall prediction (from the Python ml_service)
// with the existing demo risk formula, so flood risk is now grounded
// in an actual trained model instead of purely synthetic numbers.

const ML_SERVICE_URL = 'http://127.0.0.1:8000';

export async function getMlRainfallPrediction(region = 'Mbeya') {
  const res = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region })
  });

  if (!res.ok) {
    throw new Error(`ML service error: ${res.status}`);
  }

  return res.json(); // { region, predicted_rainfall_tomorrow_mm, based_on, ... }
}

export function calculateRisk({ rainfall = 0, water_level = 0, humidity = 0, temperature = 0 }) {
  let score = rainfall * 0.45 + water_level * 10 * 0.45 + humidity * 0.10;
  score = Math.max(0, Math.min(99, score));
  const risk = score >= 80 ? 'CRITICAL' : score >= 65 ? 'HIGH' : score >= 40 ? 'MODERATE' : 'LOW';
  return {
    risk,
    probability: Math.round(score),
    recommendation: (risk === 'CRITICAL' || risk === 'HIGH')
      ? 'Activate warning procedures and review evacuation routes.'
      : 'Continue monitoring environmental conditions.'
  };
}

// New combined function: fetch real ML prediction, then feed it into
// the existing risk formula so the frontend gets ONE clean response.
export async function calculateRiskWithML({ region = 'Mbeya', water_level = 0, humidity = 0, temperature = 0 }) {
  const mlResult = await getMlRainfallPrediction(region);
  const predictedRainfall = mlResult.predicted_rainfall_tomorrow_mm;

  const risk = calculateRisk({
    rainfall: predictedRainfall,
    water_level,
    humidity,
    temperature: temperature || mlResult.based_on.today_temp_max
  });

  return {
    ...risk,
    region,
    predicted_rainfall_tomorrow_mm: predictedRainfall,
    forecast_date: mlResult.date_of_forecast
  };
}