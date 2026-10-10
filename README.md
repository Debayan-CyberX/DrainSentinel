# DrainSentinel 🌧️🛡️

> **AI-Assisted Municipal Storm-Drain Intelligence Platform**  
> Proactively identifying clogged stormwater drains, prioritizing inspection dispatches during heavy rainfall, and tracking maintenance through verified resolution.

---

## 📌 Project Overview

DrainSentinel is an environmental engineering intelligence platform designed for municipal public works departments. Urban flooding during extreme weather events is often triggered not by overwhelming regional rainfall, but by localized storm drain obstructions (sediment accumulation, debris, trash, and silt blockages).

DrainSentinel combines drainage network telemetry, elevation and catchment gradient heuristics, and AI prioritization scoring to rank at-risk drains before surface runoff accumulates into street-level flooding.

---

## 🏗️ Architecture & Tech Stack

```
+-------------------------------------------------------------+
|                      DrainSentinel UI                       |
|           React (TypeScript) + Vite + Tailwind CSS          |
|    - Geospatial Leaflet Map with risk pins                  |
|    - Real-time Health & Telemetry Status Monitor            |
|    - Triage & Maintenance Crew Dispatch Queue               |
+------------------------------+------------------------------+
                               | REST API (JSON)
                               v
+-------------------------------------------------------------+
|                   FastAPI Backend Service                   |
|                   Python 3.15 + Pydantic v2                 |
|    - Health Monitoring (`/api/health`)                      |
|    - Storm-Drain Network Graph & Synthetic Sensors          |
|    - Priority Scoring Engine (Heuristic / AI Risk)          |
+------------------------------+------------------------------+
                               | Future Cloud Deployment
                               v
+-------------------------------------------------------------+
|              AWS Serverless Architecture (Planned)          |
|    API Gateway -> AWS Lambda (Mangum) -> Amazon DynamoDB    |
|       S3 (Photo Resolution Storage) | SNS (Alerts)          |
+-------------------------------------------------------------+
```

### Stack Components
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet & React-Leaflet, Lucide React
- **Backend**: Python 3.15, FastAPI, Uvicorn, Pydantic v2, Pytest
- **Simulated Hydrological Data**: Clearly labelled synthetic urban catchment drain telemetry
- **Cloud Deployment Target**: AWS Lambda (via Mangum adapter), API Gateway, DynamoDB, S3, SNS

---

