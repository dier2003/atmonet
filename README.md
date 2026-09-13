# 🌦️ AtmoNet — Tanzania Weather & Flood Early Warning System

**AtmoNet** is a full-stack weather intelligence and flood early-warning platform designed for Tanzania. It combines real weather data, a trained rainfall prediction model, geographic visualization, flood-risk analysis, alerts, analytics, and an AI-style assistant in one web application.

> **Project status:** Active development / demonstration project.

##  What AtmoNet Does

- 🌍 Interactive Tanzania weather and risk map powered by Leaflet
- 🌡️ Weather monitoring and environmental indicators
- 🌧️ Tomorrow's rainfall prediction using a trained Tanzania-wide ML model
- ⚠️ Flood-risk classification: **LOW, MODERATE, HIGH, CRITICAL**
- 🔔 Alert and early-warning interface
- 📊 Analytics and historical-data views
- 💧 Water-level and rainfall risk analysis
- 🤖 AI Assistant for weather and flood-safety guidance
- 📄 Report and emergency-information sections
- 🇹🇿 Tanzania-region-aware predictions using regional coordinates

##  Machine Learning

The ML service is implemented with **Python, FastAPI, pandas, NumPy, scikit-learn and joblib**. The trained model is stored in `ml_service/` together with its scaler, feature list and Tanzania region list.

The prediction pipeline:

1. Receives a Tanzania region.
2. Uses the region's latitude and longitude.
3. Retrieves recent weather observations from **Open-Meteo**.
4. Recreates the engineered features used during training.
5. Applies the saved scaler and trained rainfall model.
6. Predicts rainfall for the next day.
7. Sends the prediction to the Node.js risk engine.
8. Converts rainfall, water level and humidity into a flood-risk assessment.

##  Architecture

```text
                         ┌─────────────────────┐
                         │      AtmoNet UI      │
                         │ React + Leaflet      │
                         │ Recharts + Vite      │
                         └──────────┬──────────┘
                                    │ HTTP
                                    ▼
                         ┌─────────────────────┐
                         │   Node.js Backend   │
                         │      Express        │
                         │ weather / alerts /  │
                         │ prediction / chat   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    ML Service       │
                         │ Python + FastAPI    │
                         │ Trained rainfall ML │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Open-Meteo API   │
                         │ Real weather data   │
                         └─────────────────────┘
```

##  Project Structure

```text
atmonet/
├── frontend/                  # React/Vite web interface
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
├── backend/                   # Node.js/Express API
│   ├── routes/
│   │   ├── alerts.js
│   │   ├── chatbot.js
│   │   ├── prediction.js
│   │   └── weather.js
│   ├── services/
│   │   └── riskEngine.js
│   ├── server.js
│   └── package.json
│
├── ml/                        # ML prediction utilities
│   └── predict.py
│
├── ml_service/                # FastAPI rainfall prediction service
│   ├── main.py
│   ├── final_rainfall_model_tanzania.pkl
│   ├── final_rainfall_scaler_tanzania.pkl
│   ├── final_rainfall_features_tanzania.pkl
│   └── tanzania_regions_list.pkl
│
├── .gitignore
└── README.md
```

##  Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router, Leaflet, Recharts, Lucide React, Axios |
| Backend | Node.js, Express, CORS |
| ML Service | Python, FastAPI, Uvicorn, pandas, NumPy, scikit-learn, joblib, requests |
| Weather Data | Open-Meteo API |
| Mapping | Leaflet / React Leaflet |
| Version Control | Git + GitHub |

##  Run Locally

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

### 2. Backend

Open a second terminal:

```bash
cd backend
npm install
npm run dev
```

Backend API:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 3. ML Service

Open a third terminal:

```bash
cd ml_service
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the service:

```bash
uvicorn main:app --reload --port 8000
```

ML health check:

```text
http://127.0.0.1:8000/health
```

The Node.js risk engine expects the ML service at `http://127.0.0.1:8000` during local development.

## 🔌 Main API Endpoints

### Node.js API — port 5000

```text
GET  /api/health
POST /api/predict
GET  /api/weather
GET  /api/alerts
POST /api/chatbot
```

### ML API — port 8000

```text
GET  /health
GET  /regions
POST /predict
```

Example ML request:

```json
{
  "region": "Mbeya"
}
```

##  Data Source

AtmoNet's ML prediction service retrieves recent weather data from **Open-Meteo** using regional latitude/longitude coordinates. This makes the rainfall prediction pipeline more realistic than a purely static demo-data system.

##  Important Disclaimer

AtmoNet is a research, educational and demonstration project. Its predictions and risk classifications should **not** be treated as a replacement for official emergency warnings or decisions by Tanzania's responsible authorities. Always follow official weather, disaster-management and evacuation guidance.

##  Security & Deployment Notes

Before production deployment:

- Move service URLs and secrets into environment variables.
- Restrict CORS to the deployed frontend domain.
- Add authentication/authorization where required.
- Add API rate limiting and request validation.
- Use HTTPS for all public services.
- Do not commit API keys, passwords or private credentials.
- Consider hosting frontend, backend and ML service as separate deployable services.
- Add automated tests and CI checks before a production release.

##  Future Improvements

- Real-time water-level/IoT sensor integration
- More weather variables such as wind, pressure, humidity and cloud cover
- Improved flood prediction using additional hydrological and geographic features
- Official Tanzania weather/disaster-alert integrations where available
- User location and personalized regional alerts
- Push/SMS notification integration
- Model monitoring, validation and scheduled retraining
- Production database for historical observations and alerts

##  Project

**AtmoNet — Tanzania Weather & Flood Early Warning System**

Built as a full-stack AI/ML and geospatial project focused on improving access to weather intelligence and flood-risk information in Tanzania.

**Repository:** `dier2003/atmonet`

##  License

This project is intended for educational, research and demonstration purposes. See the repository license for terms of use.
