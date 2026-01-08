# app/main.py
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import math

app = FastAPI(title="BBP Prototype (Route B)")

# ---- static ----
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")
def home():
    return FileResponse("app/static/index.html")


# ---- helpers ----
def now_iso() -> str:
    return datetime.utcnow().isoformat()


def haversine_m(lat1, lon1, lat2, lon2) -> float:
    # meters
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def path_line(from_lat, from_lon, to_lat, to_lon, steps: int = 30) -> List[List[float]]:
    # GeoJSON coords: [lon, lat]
    coords = []
    for i in range(steps + 1):
        t = i / steps
        lat = from_lat + (to_lat - from_lat) * t
        lon = from_lon + (to_lon - from_lon) * t
        coords.append([lon, lat])
    return coords


def path_via(from_lat, from_lon, to_lat, to_lon, via_lat, via_lon, steps_each: int = 18) -> List[List[float]]:
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
    # ~40 km/h as a simple demo speed
    return distance_m / speed_mps


# ---- in-memory "db" ----
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
    status: str = Field(default="optimal")
    obstacle: Optional[str] = None


class ReportCreate(BaseModel):
    note: Optional[str] = None


class GeoJSONLineString(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]  # [lon, lat]


class TripCreate(BaseModel):
    user_id: int
    from_lat: float
    from_lon: float
    to_lat: float
    to_lon: float
    # Step6: allow saving selected route geometry
    geometry: Optional[GeoJSONLineString] = None
    distance_m: Optional[float] = None
    duration_s: Optional[float] = None


class RoutesRequest(BaseModel):
    from_lat: float
    from_lon: float
    to_lat: float
    to_lon: float
    n: int = Field(default=3, ge=1, le=5)


# ---- API ----
@app.get("/api/users")
def list_users():
    return list(USERS.values())


@app.post("/api/users")
def create_user(payload: UserCreate):
    global _next_user_id
    # "Create / Get" behavior: return existing if username already exists
    for u in USERS.values():
        if u["username"] == payload.username:
            return u
    uid = _next_user_id
    _next_user_id += 1
    u = {"id": uid, "username": payload.username, "created_at": now_iso()}
    USERS[uid] = u
    return u


@app.get("/api/segments")
def list_segments():
    return list(SEGMENTS.values())


@app.post("/api/segments")
def create_segment(payload: SegmentCreate):
    global _next_segment_id
    if payload.user_id not in USERS:
        raise HTTPException(status_code=404, detail="user_id not found")
    sid = _next_segment_id
    _next_segment_id += 1
    s = {
        "id": sid,
        "user_id": payload.user_id,
        "status": payload.status,
        "obstacle": payload.obstacle,
        "created_at": now_iso(),
    }
    SEGMENTS[sid] = s
    return s


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


@app.post("/api/trips")
def create_trip(payload: TripCreate):
    global _next_trip_id
    if payload.user_id not in USERS:
        raise HTTPException(status_code=404, detail="user_id not found")

    # If Step6 passed geometry, use it; otherwise make a straight route
    if payload.geometry and payload.geometry.coordinates:
        coords = payload.geometry.coordinates
    else:
        coords = path_line(payload.from_lat, payload.from_lon, payload.to_lat, payload.to_lon, steps=30)

    dist = payload.distance_m if payload.distance_m is not None else path_distance_m(coords)
    dur = payload.duration_s if payload.duration_s is not None else estimate_duration_s(dist)

    tid = _next_trip_id
    _next_trip_id += 1
    t = {
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
    TRIPS[tid] = t
    return t


# ------------------- Step6: routes preview -------------------
@app.post("/api/routes")
def preview_routes(req: RoutesRequest):
    """
    Return multiple candidate routes (GeoJSON LineString) for preview.
    This is a demo generator (no real map-matching), but it will produce 2-5 distinct polylines.
    """
    # base line
    base = path_line(req.from_lat, req.from_lon, req.to_lat, req.to_lon, steps=32)

    # compute a perpendicular offset around midpoint to create alternatives
    mid_lat = (req.from_lat + req.to_lat) / 2.0
    mid_lon = (req.from_lon + req.to_lon) / 2.0
    dlat = req.to_lat - req.from_lat
    dlon = req.to_lon - req.from_lon

    # perpendicular unit vector (approx in degrees)
    # (dlon, -dlat) is perpendicular to (dlat, dlon) in lat/lon plane
    px, py = dlon, -dlat
    norm = math.sqrt(px * px + py * py) or 1.0
    px /= norm
    py /= norm

    # offset magnitude in degrees (~0.01 ~ 1km-ish around SG latitudes)
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









