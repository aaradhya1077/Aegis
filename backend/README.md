# ⚙️ DCRM Monitor: FastAPI API Backend

High-performance, lightweight **FastAPI** backend that provides authentication, device registry management, waveform coordinates, and machine learning diagnostics (XGBoost/AdaBoost) for circuit breaker fault observation.

---

## 🏗️ Technical Highlights
* **Web Framework**: FastAPI with automatic Swagger UI documentation generation.
* **Persistent Database**: SQLite with SQLAlchemy ORM.
* **Cryptographic Security**: Saluted `bcrypt` password hashing and signed `HS256` JWT authorization tokens.
* **ML Engines**: XGBoost classifier for primary predictions and AdaBoost classifier for secondary verification.
* **Explainable AI (XAI)**: Local feature contribution calculations comparing inputs against nominal healthy waveform baselines.

---

## 🚀 Setup & Execution

### 1. Configure Python Environment
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Initialize & Seed Database
Seeds default grid operator profiles (`STN-0001` / `STN-0002`), geographical circuit breaker coordinate points, and historical diagnostic waveforms.
```bash
python -m app.seed
```

### 3. Start Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger API docs are available at `http://localhost:8000/docs`.

---

## 🔌 API Routes

### Authentication
* `POST /api/v1/auth/login`: Accepts credentials and returns JWT access tokens alongside HTTPOnly refresh cookies.
* `GET /api/v1/auth/me`: Decodes JWT authorization header and returns logged-in operator details.
* `POST /api/v1/auth/refresh`: Validates refresh token cookie and issues new access token.

### Grid Devices
* `GET /api/v1/devices/`: Returns details of active circuit breakers, including their health index and GPS coordinates.

### Diagnostics & ML
* `GET /api/v1/diagnostics/features`: Lists input parameter names required by the XGBoost/AdaBoost models.
* `POST /api/v1/diagnostics/predict`: Performs fault prediction, calculates local explainability attributions, logs results, and updates device health indexes.
* `GET /api/v1/diagnostics/summary`: Compiles global grid health statistics and recent test runs.

### S3 Waveform Upload
* `POST /api/v1/uploads/presign`: Generates AWS S3 presigned URLs for uploading raw CSV signal logs.
