from __future__ import annotations

import math
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(title="BBP + Road Frontend")

# CORS for Vite dev server (5173) and local builds
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in meters."""
    R = 6_371_000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def path_line(from_lat: float, from_lon: float, to_lat: float, to_lon: float, steps: int = 30) -> List[List[float]]:
    coords: List[List[float]] = []  # GeoJSON coords: [lon, lat]
    for i in range(steps + 1):
        t = i / steps
        lat = from_lat + (to_lat - from_lat) * t
        lon = from_lon + (to_lon - from_lon) * t
        coords.append([lon, lat])
    return coords


def path_via(
    from_lat: float,
    from_lon: float,
    to_lat: float,
    to_lon: float,
    via_lat: float,
    via_lon: float,
    steps_each: int = 18,
) -> List[List[float]]:
    a = path_line(from_lat, from_lon, via_lat, via_lon, steps_each)
    b = path_line(via_lat, via_lon, to_lat, to_lon, steps_each)
    return a + b[1:]  # avoid duplicate via point


def path_distance_m(coords: List[List[float]]) -> float:
    d = 0.0
    for i in range(1, len(coords)):
        lon1, lat1 = coords[i - 1]
        lon2, lat2 = coords[i]
        d += haversine_m(lat1, lon1, lat2, lon2)
    return d


def estimate_duration_s(distance_m: float, speed_mps: float = 11.0) -> float:
    return distance_m / speed_mps


# ---- in-memory stores ----
USERS: Dict[int, Dict[str, Any]] = {}
SEGMENTS: Dict[int, Dict[str, Any]] = {}
REPORTS: Dict[int, Dict[str, Any]] = {}
TRIPS: Dict[int, Dict[str, Any]] = {}

_next_user_id = 1
_next_segment_id = 1
_next_report_id = 1
_next_trip_id = 1


# ---- schemas ----
class UserCreate(BaseModel):
    username: str = Field(min_length=1)


class SegmentCreate(BaseModel):
    user_id: int
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    status: str = Field(default="optimal")
    obstacle: Optional[str] = None


class ReportCreate(BaseModel):
    note: Optional[str] = None


class GeoJSONLineString(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]


class TripCreate(BaseModel):
    user_id: int
    from_lat: float
    from_lon: float
    to_lat: float
    to_lon: float
    geometry: Optional[GeoJSONLineString] = None
    distance_m: Optional[float] = None
    duration_s: Optional[float] = None
    use_osrm: bool = False


class RoutesRequest(BaseModel):
    from_lat: float
    from_lon: float
    to_lat: float
    to_lon: float
    n: int = Field(default=3, ge=1, le=5)


def seed_demo_data():
    """Optional starter data for quick testing."""
    global _next_user_id, _next_segment_id
    if USERS:
        return
    u = {"id": _next_user_id, "username": "alice", "created_at": now_iso()}
    USERS[u["id"]] = u
    _next_user_id += 1

    demo_segments = [
        {
            "user_id": u["id"],
            "start_lat": 1.3521,
            "start_lon": 103.8198,
            "end_lat": 1.3621,
            "end_lon": 103.8298,
            "status": "optimal",
            "obstacle": None,
        },
        {
            "user_id": u["id"],
            "start_lat": 1.3321,
            "start_lon": 103.8798,
            "end_lat": 1.3421,
            "end_lon": 103.8898,
            "status": "maintenance",
            "obstacle": "pothole",
        },
    ]

    for seg in demo_segments:
        sid = _next_segment_id
        _next_segment_id += 1
        SEGMENTS[sid] = {
            "id": sid,
            **seg,
            "created_at": now_iso(),
        }


@app.get("/")
def root():
    return JSONResponse({"ok": True, "message": "BBP backend ready"})


# seed one time (in-memory only)
seed_demo_data()


# ---- users ----
@app.post("/api/users")
def create_user(payload: UserCreate):
    global _next_user_id
    for u in USERS.values():
        if u["username"] == payload.username:
            return u
    uid = _next_user_id
    _next_user_id += 1
    u = {"id": uid, "username": payload.username, "created_at": now_iso()}
    USERS[uid] = u
    return u


@app.get("/api/users")
def list_users():
    return list(USERS.values())


# ---- segments ----
@app.get("/api/segments")
def list_segments():
    return list(SEGMENTS.values())


@app.post("/api/segments")
def create_segment(payload: SegmentCreate):
    global _next_segment_id
    if payload.user_id not in USERS:
        raise HTTPException(status_code=404, detail="user_id not found")
    if payload.status not in {"optimal", "medium", "maintenance", "suboptimal"}:
        raise HTTPException(status_code=400, detail="invalid status")

    sid = _next_segment_id
    _next_segment_id += 1
    s = {
        "id": sid,
        "user_id": payload.user_id,
        "start_lat": payload.start_lat,
        "start_lon": payload.start_lon,
        "end_lat": payload.end_lat,
        "end_lon": payload.end_lon,
        "status": payload.status,
        "obstacle": payload.obstacle,
        "created_at": now_iso(),
    }
    SEGMENTS[sid] = s
    return s


# ---- reports ----
@app.post("/api/segments/{segment_id}/reports")
def create_report(segment_id: int, payload: ReportCreate):
    global _next_report_id
    if segment_id not in SEGMENTS:
        raise HTTPException(status_code=404, detail="segment_id not found")
    rid = _next_report_id
    _next_report_id += 1
    r = {
        "id": rid,
        "segment_id": segment_id,
        "note": payload.note,
        "confirmed": False,
        "created_at": now_iso(),
    }
    REPORTS[rid] = r
    return r


@app.get("/api/segments/{segment_id}/reports")
def list_reports(segment_id: int):
    if segment_id not in SEGMENTS:
        raise HTTPException(status_code=404, detail="segment_id not found")
    return [r for r in REPORTS.values() if r["segment_id"] == segment_id]


@app.post("/api/reports/{report_id}/confirm")
def confirm_report(report_id: int):
    if report_id not in REPORTS:
        raise HTTPException(status_code=404, detail="report_id not found")
    REPORTS[report_id]["confirmed"] = True
    return REPORTS[report_id]


@app.get("/api/segments/{segment_id}/aggregate")
def aggregate(segment_id: int):
    if segment_id not in SEGMENTS:
        raise HTTPException(status_code=404, detail="segment_id not found")
    reports = [r for r in REPORTS.values() if r["segment_id"] == segment_id]
    total = len(reports)
    confirmed = sum(1 for r in reports if r["confirmed"])
    return {"segment_id": segment_id, "reports_total": total, "reports_confirmed": confirmed}


# ---- trips ----
@app.post("/api/trips")
def create_trip(payload: TripCreate, use_osrm: bool = Query(default=False)):
    """
    If use_osrm=true, query OSRM for geometry; otherwise fallback to straight interpolation or provided geometry.
    """
    global _next_trip_id
    if payload.user_id not in USERS:
        raise HTTPException(status_code=404, detail="user_id not found")

    coords: List[List[float]]

    if use_osrm:
        osrm_url = (
            "http://router.project-osrm.org/route/v1/driving/"
            f"{payload.from_lon},{payload.from_lat};{payload.to_lon},{payload.to_lat}"
            "?overview=full&geometries=geojson"
        )
        try:
            resp = httpx.get(osrm_url, timeout=12.0)
            resp.raise_for_status()
            data = resp.json()
            route = data["routes"][0]
            coords = route["geometry"]["coordinates"]
            dist = route["distance"]
            dur = route["duration"]
        except Exception:
            # fallback to straight line
            coords = path_line(payload.from_lat, payload.from_lon, payload.to_lat, payload.to_lon, steps=30)
            dist = path_distance_m(coords)
            dur = estimate_duration_s(dist)
    else:
        coords = (
            payload.geometry.coordinates
            if payload.geometry and payload.geometry.coordinates
            else path_line(payload.from_lat, payload.from_lon, payload.to_lat, payload.to_lon, steps=30)
        )
        dist = payload.distance_m if payload.distance_m is not None else path_distance_m(coords)
        dur = payload.duration_s if payload.duration_s is not None else estimate_duration_s(dist)

    tid = _next_trip_id
    _next_trip_id += 1
    trip = {
        "id": tid,
        "user_id": payload.user_id,
        "from_lat": payload.from_lat,
        "from_lon": payload.from_lon,
        "to_lat": payload.to_lat,
        "to_lon": payload.to_lon,
        "distance_m": round(dist, 1),
        "duration_s": round(dur, 1),
        "created_at": now_iso(),
        "geometry": {"type": "LineString", "coordinates": coords},
    }
    TRIPS[tid] = trip
    return trip


# ---- Trip history ----
@app.get("/api/trips")
def list_trips(user_id: int = Query(default=None)):
    """List all trips, optionally filtered by user_id."""
    trips = list(TRIPS.values())
    if user_id is not None:
        trips = [t for t in trips if t["user_id"] == user_id]
    return sorted(trips, key=lambda t: t["created_at"], reverse=True)


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: int):
    if trip_id not in TRIPS:
        raise HTTPException(status_code=404, detail="trip_id not found")
    return TRIPS[trip_id]


@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int):
    if trip_id not in TRIPS:
        raise HTTPException(status_code=404, detail="trip_id not found")
    del TRIPS[trip_id]
    return {"ok": True, "deleted": trip_id}


# ---- Auto-detection & batch confirmation ----
@app.post("/api/segments/{segment_id}/auto-detect")
def auto_detect_segment(segment_id: int):
    """
    Simulates automatic detection of road segment status.
    In production, this would integrate with sensors/cameras.
    Returns detected_status and confidence score.
    """
    import random
    if segment_id not in SEGMENTS:
        raise HTTPException(status_code=404, detail="segment_id not found")
    
    seg = SEGMENTS[segment_id]
    statuses = ["optimal", "medium", "suboptimal", "maintenance"]
    weights = [0.5, 0.25, 0.15, 0.1]  # more likely to be optimal
    detected = random.choices(statuses, weights=weights)[0]
    confidence = round(random.uniform(0.7, 0.98), 2)
    
    return {
        "segment_id": segment_id,
        "current_status": seg["status"],
        "detected_status": detected,
        "confidence": confidence,
        "recommendation": "update" if detected != seg["status"] else "keep",
    }


@app.post("/api/segments/{segment_id}/apply-detection")
def apply_detection(segment_id: int, new_status: str = Query(...)):
    """Apply the detected status to the segment."""
    if segment_id not in SEGMENTS:
        raise HTTPException(status_code=404, detail="segment_id not found")
    if new_status not in {"optimal", "medium", "maintenance", "suboptimal"}:
        raise HTTPException(status_code=400, detail="invalid status")
    
    old_status = SEGMENTS[segment_id]["status"]
    SEGMENTS[segment_id]["status"] = new_status
    return {
        "segment_id": segment_id,
        "old_status": old_status,
        "new_status": new_status,
        "updated_at": now_iso(),
    }


@app.post("/api/reports/batch-confirm")
def batch_confirm_reports(report_ids: List[int]):
    """Confirm multiple reports at once."""
    results = []
    for rid in report_ids:
        if rid in REPORTS:
            REPORTS[rid]["confirmed"] = True
            results.append({"id": rid, "confirmed": True})
        else:
            results.append({"id": rid, "error": "not found"})
    return results


@app.post("/api/segments/{segment_id}/auto-confirm-reports")
def auto_confirm_reports(segment_id: int, threshold: int = Query(default=2)):
    """
    Auto-confirm reports for a segment if they have similar notes (matching pattern).
    threshold = minimum number of similar reports to trigger auto-confirm.
    """
    if segment_id not in SEGMENTS:
        raise HTTPException(status_code=404, detail="segment_id not found")
    
    reports = [r for r in REPORTS.values() if r["segment_id"] == segment_id and not r["confirmed"]]
    if len(reports) < threshold:
        return {"auto_confirmed": 0, "message": f"Need at least {threshold} unconfirmed reports"}
    
    # Simple pattern: confirm all if we have enough reports
    confirmed_ids = []
    for r in reports:
        REPORTS[r["id"]]["confirmed"] = True
        confirmed_ids.append(r["id"])
    
    return {"auto_confirmed": len(confirmed_ids), "report_ids": confirmed_ids}


# ---- Settings ----
SETTINGS: Dict[int, Dict[str, Any]] = {}


class UserSettings(BaseModel):
    auto_detect_enabled: bool = True
    auto_confirm_threshold: int = 2
    default_map_zoom: int = 12
    preferred_route_mode: str = "fastest"  # fastest, shortest, scenic
    notifications_enabled: bool = True
    dark_mode: bool = False
    language: str = "en"


@app.get("/api/users/{user_id}/settings")
def get_user_settings(user_id: int):
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="user_id not found")
    if user_id not in SETTINGS:
        # Return defaults
        SETTINGS[user_id] = UserSettings().model_dump()
    return {"user_id": user_id, **SETTINGS[user_id]}


@app.put("/api/users/{user_id}/settings")
def update_user_settings(user_id: int, payload: UserSettings):
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="user_id not found")
    SETTINGS[user_id] = payload.model_dump()
    return {"user_id": user_id, **SETTINGS[user_id], "updated_at": now_iso()}


@app.patch("/api/users/{user_id}/settings")
def patch_user_settings(user_id: int, updates: Dict[str, Any]):
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="user_id not found")
    if user_id not in SETTINGS:
        SETTINGS[user_id] = UserSettings().model_dump()
    
    allowed_keys = set(UserSettings.model_fields.keys())
    for k, v in updates.items():
        if k in allowed_keys:
            SETTINGS[user_id][k] = v
    return {"user_id": user_id, **SETTINGS[user_id], "updated_at": now_iso()}


# ---- Stats summary ----
@app.get("/api/stats")
def get_stats():
    """Global statistics for dashboard."""
    total_users = len(USERS)
    total_segments = len(SEGMENTS)
    total_reports = len(REPORTS)
    total_trips = len(TRIPS)
    confirmed_reports = sum(1 for r in REPORTS.values() if r["confirmed"])
    
    status_counts = {}
    for seg in SEGMENTS.values():
        st = seg["status"]
        status_counts[st] = status_counts.get(st, 0) + 1
    
    total_distance = sum(t.get("distance_m", 0) for t in TRIPS.values())
    
    return {
        "users": total_users,
        "segments": total_segments,
        "reports": {"total": total_reports, "confirmed": confirmed_reports},
        "trips": total_trips,
        "total_distance_km": round(total_distance / 1000, 2),
        "segment_status_counts": status_counts,
    }


@app.post("/api/routes")
def preview_routes(req: RoutesRequest):
    base = path_line(req.from_lat, req.from_lon, req.to_lat, req.to_lon, steps=32)

    mid_lat = (req.from_lat + req.to_lat) / 2.0
    mid_lon = (req.from_lon + req.to_lon) / 2.0
    dlat = req.to_lat - req.from_lat
    dlon = req.to_lon - req.from_lon

    px, py = dlon, -dlat
    norm = math.sqrt(px * px + py * py) or 1.0
    px /= norm
    py /= norm

    offsets = [0.0]
    if req.n >= 2:
        offsets.append(0.010)
    if req.n >= 3:
        offsets.append(-0.010)
    if req.n >= 4:
        offsets.append(0.018)
    if req.n >= 5:
        offsets.append(-0.018)

    routes = []
    for i, off in enumerate(offsets, start=1):
        if abs(off) < 1e-9:
            coords = base
            label = "Direct"
        else:
            via_lat = mid_lat + py * off
            via_lon = mid_lon + px * off
            coords = path_via(req.from_lat, req.from_lon, req.to_lat, req.to_lon, via_lat, via_lon, steps_each=18)
            label = f"Alt {i-1}"

        dist = path_distance_m(coords)
        dur = estimate_duration_s(dist)

        routes.append(
            {
                "id": i,
                "label": label,
                "distance_m": round(dist, 1),
                "duration_s": round(dur, 1),
                "geometry": {"type": "LineString", "coordinates": coords},
            }
        )

    return routes
