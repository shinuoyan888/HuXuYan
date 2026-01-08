# Road Monitoring System

A minimal and achievable road monitoring system developed for a university course assignment.  
The system focuses on feasible implementation, clear user interaction flows, and map-based visualization.

---

## Features

- Username-based login
- Road segment creation and visualization
- Manual reporting and confirmation
- Trip planning with distance and duration
- Interactive map visualization

---

## Tech Stack

- Frontend: React, TypeScript, Vite, Leaflet
- Backend: FastAPI, SQLAlchemy
- Database: PostgreSQL
- Routing: OSRM

---

## Project Structure

```text
road-monitoring-system/
├── README.md
├── .gitignore
├── docker-compose.yml
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── LoginPage.tsx
│       ├── SegmentsPage.tsx
│       ├── ReportsPage.tsx
│       ├── TripsPage.tsx
│       ├── MapView.tsx
│       └── main.tsx
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── db.py
│   ├── requirements.txt
│   └── .venv/
```

---

## How to Run

### Prerequisites

- Node.js (v18+)
- Python 3.9+
- Docker (for PostgreSQL)

### Database

```bash
docker compose up -d
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

- API base URL: http://127.0.0.1:8000
- API documentation: http://127.0.0.1:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## API

```text
Base URL: http://127.0.0.1:8000
Docs:     http://127.0.0.1:8000/docs
```

---

## Design Scope

- Manual reporting is implemented in the first release
- Automatic road anomaly detection is considered future work
- Route ranking and trip history are planned extensions

---

## Screenshots

User interface screenshots are included in the accompanying course report  
(Chapter 3: User Interface Design).

---

## License

Educational use only.