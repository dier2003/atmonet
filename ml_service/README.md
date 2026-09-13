# AtmoNet ML Service

The ML service provides Tanzania-wide rainfall prediction through a FastAPI REST API.

## Model artifacts

- `final_rainfall_model_tanzania.pkl` — trained rainfall prediction model
- `final_rainfall_scaler_tanzania.pkl` — feature scaler
- `final_rainfall_features_tanzania.pkl` — training feature list
- `tanzania_regions_list.pkl` — supported Tanzania regions and coordinates

## Run locally

```bash
python -m venv venv
# Windows
venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Endpoints

- `GET /health` — service health check
- `GET /regions` — supported regions
- `POST /predict` — predict tomorrow's rainfall for a region

Example request:

```json
{
  "region": "Mbeya"
}
```

The service retrieves recent weather data, reconstructs the engineered training features, applies the saved scaler/model, and returns the predicted rainfall.

> This model is a research/prototype component and should be validated against operational meteorological data before use for official emergency decisions.
