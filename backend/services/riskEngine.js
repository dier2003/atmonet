// services/riskEngine.js
//
// Combines the real ML rainfall prediction (from the Python ml_service)
// with the existing demo risk formula, so flood risk is now grounded
// in an actual trained model instead of purely synthetic numbers.

class PredictionServiceError extends Error {
  constructor(message, statusCode, code, details) {
    super(message);
    this.name = 'PredictionServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function getMlServiceUrl() {
  const configuredUrl = process.env.ML_SERVICE_URL?.trim();
  if (!configuredUrl) {
    throw new PredictionServiceError(
      'ML_SERVICE_URL is not configured.',
      503,
      'ML_SERVICE_NOT_CONFIGURED'
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new PredictionServiceError(
      'ML_SERVICE_URL must be a valid http or https URL.',
      503,
      'ML_SERVICE_URL_INVALID'
    );
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol) || !['', '/'].includes(parsedUrl.pathname) || parsedUrl.search || parsedUrl.hash) {
    throw new PredictionServiceError(
      'ML_SERVICE_URL must contain only the ML service origin, without /predict.',
      503,
      'ML_SERVICE_URL_INVALID'
    );
  }

  return parsedUrl.origin;
}

export async function getMlRainfallPrediction(region = 'Mbeya') {
  const mlServiceUrl = getMlServiceUrl();
  let res;

  try {
    res = await fetch(`${mlServiceUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region })
    });
  } catch (err) {
    throw new PredictionServiceError(
      'The ML service could not be reached.',
      502,
      'ML_SERVICE_UNAVAILABLE',
      { cause: err.message }
    );
  }

  if (!res.ok) {
    const responseBody = await res.text();
    throw new PredictionServiceError(
      `The ML service returned HTTP ${res.status}.`,
      502,
      'ML_SERVICE_HTTP_ERROR',
      { status: res.status, body: responseBody }
    );
  }

  try {
    return await res.json(); // { region, predicted_rainfall_tomorrow_mm, based_on, ... }
  } catch (err) {
    throw new PredictionServiceError(
      'The ML service returned invalid JSON.',
      502,
      'ML_SERVICE_INVALID_RESPONSE',
      { cause: err.message }
    );
  }
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