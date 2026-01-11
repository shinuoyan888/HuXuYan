# BBP Road App

Frontend from the road monitoring UI + BBP FastAPI backend (in-memory). No Docker required.

## Backend

1. `cd bbp-road-app/backend`
2. Create venv (optional) and install deps:
   - `python -m venv .venv` then `./.venv/Scripts/activate`
   - `pip install -r requirements.txt`
3. Run: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## Frontend

1. `cd bbp-road-app/frontend`
2. `npm install`
3. `npm run dev` (Vite, default port 5173)

The frontend talks to `http://127.0.0.1:8000/api` directly. Vite proxy is also configured for `/api`.

## Features

### Core Features
- **Users**: Create/get via username (POST /api/users)
- **Segments**: Create with status/obstacle, list all with localized status labels
- **Reports**: Create for a segment, confirm, aggregate counts
- **Trips**: Create trip with OSRM real road routing or fallback geometry

### Advanced Features (DD Implementation)

#### 🛣️ OSRM Routing Integration
- Real road geometry from OSRM public API (bike profile)
- Automatic fallback to mathematical interpolation if OSRM unavailable
- Preview multiple alternative routes with `POST /api/routes`

#### 🌤️ Weather Service
- Mock weather service with deterministic pseudo-random generation
- Weather data based on coordinates and time of day
- Cycling-friendly recommendations
- Endpoints: `GET /api/weather`, `GET /api/weather/route`

#### 🗣️ Internationalization (i18n)
- Backend supports English (en), Chinese (zh), Italian (it)
- Localized status labels, route tags, weather conditions
- User language preference stored in settings
- Endpoints: `GET /api/i18n/translations`, `GET /api/i18n/languages`

#### 🔒 Privacy By Design
- Trip start/end locations obfuscated (~150m radius)
- Private coordinates stored separately from public display
- Three obfuscation methods: noise, grid, truncate

#### 📊 Data Aggregation & Weighted Voting
- Automatic segment status updates based on report analysis
- Weighted voting algorithm:
  - Fresh reports (≤30 days): 2x weight
  - Confirmed reports: 1.5x weight
- Negative/positive keyword detection
- Trigger aggregation via `POST /api/aggregation/trigger`

#### 🔍 Enhanced Auto-Detection
- Sensor-based pothole detection using accelerometer data
- Z-axis thresholds: severe (25 m/s²), pothole (15 m/s²), bump (8 m/s²)
- Speed validation to prevent false positives
- Confidence scoring with GPS accuracy adjustment

#### 📍 Route Planning & Scoring
- Multiple candidate routes with quality scores
- Preference modes: safety_first, shortest, balanced
- Safety-first mode heavily penalizes maintenance/pothole segments
- Tags: Best Surface, Fastest, Shortest, Bumpy, Road Work, etc.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | POST, GET | User management |
| `/api/segments` | POST, GET | Segment CRUD |
| `/api/segments/{id}/reports` | POST, GET | Report management |
| `/api/segments/{id}/aggregate` | GET | Aggregate segment reports |
| `/api/segments/{id}/auto-detect` | POST | Auto-detect segment status |
| `/api/trips` | POST, GET | Trip management |
| `/api/routes` | POST | Preview route alternatives |
| `/api/path/search` | POST | Route planning with scoring |
| `/api/weather` | GET | Get weather for location |
| `/api/stats` | GET | Dashboard statistics |
| `/api/users/{id}/settings` | GET, PUT, PATCH | User settings |
| `/api/i18n/translations` | GET | Get translations |
| `/api/aggregation/trigger` | POST | Trigger data aggregation |

Data lives in memory; restart backend to reset.
