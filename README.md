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

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (tested on Python 3.15)
- **Node.js 18+** & **npm** (tested on Node v24)

---

### 1. Backend Setup & Startup

Open a terminal in the project root:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (cmd):
.\.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run unit tests to verify installation
pytest

# Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```

The backend will be running at:
- **API Base**: `http://127.0.0.1:8000`
- **Health Endpoint**: `http://127.0.0.1:8000/api/health`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup & Startup

Open a second terminal in the project root:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will be available at:
- **UI Dashboard**: `http://localhost:5173`

The frontend automatically connects to the backend health endpoint and reports operational status.

---

## 🧪 Testing

### Backend Unit Tests
To run the automated test suite:

```bash
cd backend
.\.venv\Scripts\pytest.exe
```

### Frontend Build Verification
To verify TypeScript compilation and asset bundling:

```bash
cd frontend
npm run build
```

---

## 🛡️ Hackathon Guidelines & Simulated Data Disclosure

1. **Simulated Hydrology**: All drain sensor telemetry, inflow rates, and silt measurements are synthetic simulations calibrated for urban stormwater demonstration.
2. **Safety Disclaimer**: DrainSentinel is an advisory public works triage tool and does not claim to predict regional weather phenomena or guarantee absolute flood prevention.
3. **Security**: No AWS access keys or secrets are stored in or exposed to client-side code.

---

## 🗺️ Multi-Stage Roadmap

- [x] **Stage 1: Core Scaffolding & Health Check** *(Current)*
  - FastAPI modular routing, CORS, and health endpoint
  - React + TypeScript + Tailwind CSS client
  - Automated tests and local verification
- [ ] **Stage 2: Storm-Drain Domain Model & Simulated Data Engine**
  - Seeded municipal catchment datasets (silt height, pipe diameter, location coordinates)
  - Scenario toggle (Dry, moderate rainfall, flash storm)
- [ ] **Stage 3: Interactive Geospatial Leaflet Map**
  - GIS map with color-coded risk markers
  - Catchment zone filters and drain inspection details
- [ ] **Stage 4: AI Prioritization Scoring & Triage Dispatch**
  - Risk Priority Index (RPI) calculation
  - Dispatch ticket workflow for municipal field crews
- [ ] **Stage 5: Verified Maintenance Resolution & AWS Cloud Readiness**
  - Photographic verification workflow
  - AWS Lambda (Mangum) and DynamoDB manifests
