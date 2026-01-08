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

- Users: create/get via username (POST /api/users)
- Segments: create with status/obstacle, list all
- Reports: create for a segment, confirm, aggregate counts
- Trips: compute straight-line demo route with geometry, show on map

Data lives in memory; restart backend to reset.
