from __future__ import annotations

import math
import random
import hashlib
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import httpx
from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(title="BBP + Road Frontend")

# ---- Internationalization (i18n) ----
# Translations for English, Chinese, Italian
I18N_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "en": {
        # Segment statuses
        "optimal": "Optimal",
        "medium": "Fair",
        "suboptimal": "Poor",
        "maintenance": "Under Maintenance",
        # Route tags
        "Fastest": "Fastest",
        "Best Surface": "Best Surface",
        "Shortest": "Shortest",
        "Bumpy": "Bumpy",
        "Road Work": "Road Work",
        "Poor Surface": "Poor Surface",
        "Mixed Surface": "Mixed Surface",
        "Slightly Longer": "Slightly Longer",
        # Warnings
        "Pothole": "Pothole",
        "Bad Road": "Bad Road",
        # Weather
        "Sunny": "Sunny",
        "Cloudy": "Cloudy",
        "Rainy": "Rainy",
        "Windy": "Windy",
        "Stormy": "Stormy",
        "Clear": "Clear",
        # Errors
        "user_id not found": "User not found",
        "segment_id not found": "Segment not found",
        "trip_id not found": "Trip not found",
        "report_id not found": "Report not found",
        "invalid status": "Invalid status",
    },
    "zh": {
        # Segment statuses
        "optimal": "最佳",
        "medium": "一般",
        "suboptimal": "较差",
        "maintenance": "维护中",
        # Route tags
        "Fastest": "最快",
        "Best Surface": "最佳路面",
        "Shortest": "最短",
        "Bumpy": "颠簸",
        "Road Work": "道路施工",
        "Poor Surface": "路况较差",
        "Mixed Surface": "混合路面",
        "Slightly Longer": "稍长",
        # Warnings
        "Pothole": "坑洼",
        "Bad Road": "路况差",
        # Weather
        "Sunny": "晴天",
        "Cloudy": "多云",
        "Rainy": "雨天",
        "Windy": "大风",
        "Stormy": "暴风雨",
        "Clear": "晴朗",
        # Errors
        "user_id not found": "用户未找到",
        "segment_id not found": "路段未找到",
        "trip_id not found": "行程未找到",
        "report_id not found": "报告未找到",
        "invalid status": "无效状态",
    },
    "it": {
        # Segment statuses
        "optimal": "Ottimale",
        "medium": "Discreto",
        "suboptimal": "Scarso",
        "maintenance": "In Manutenzione",
        # Route tags
        "Fastest": "Più Veloce",
        "Best Surface": "Migliore Superficie",
        "Shortest": "Più Breve",
        "Bumpy": "Sconnesso",
        "Road Work": "Lavori in Corso",
        "Poor Surface": "Superficie Scarsa",
        "Mixed Surface": "Superficie Mista",
        "Slightly Longer": "Leggermente Più Lungo",
        # Warnings
        "Pothole": "Buca",
        "Bad Road": "Strada Dissestata",
        # Weather
        "Sunny": "Soleggiato",
        "Cloudy": "Nuvoloso",
        "Rainy": "Piovoso",
        "Windy": "Ventoso",
        "Stormy": "Tempestoso",
        "Clear": "Sereno",
        # Errors
        "user_id not found": "Utente non trovato",
        "segment_id not found": "Segmento non trovato",
        "trip_id not found": "Viaggio non trovato",
        "report_id not found": "Segnalazione non trovata",
        "invalid status": "Stato non valido",
    },
}


def translate(key: str, lang: str = "en") -> str:
    """Translate a key to the specified language."""
    translations = I18N_TRANSLATIONS.get(lang, I18N_TRANSLATIONS["en"])
    return translations.get(key, key)


def translate_list(keys: List[str], lang: str = "en") -> List[str]:
    """Translate a list of keys."""
    return [translate(k, lang) for k in keys]


def get_user_language(user_id: Optional[int]) -> str:
    """Get the language preference for a user."""
    if user_id is None or user_id not in SETTINGS:
        return "en"
    return SETTINGS.get(user_id, {}).get("language", "en")


# ---- Weather Service (Mock) ----
class WeatherService:
    """
    Mock Weather Service that generates realistic weather data
    based on coordinates and time.
    """
    
    # Weather conditions with associated parameters
    WEATHER_CONDITIONS = [
        {"condition": "Sunny", "temp_base": 25, "wind_base": 5, "rain_prob": 0.0},
        {"condition": "Clear", "temp_base": 22, "wind_base": 8, "rain_prob": 0.0},
        {"condition": "Cloudy", "temp_base": 18, "wind_base": 12, "rain_prob": 0.2},
        {"condition": "Windy", "temp_base": 16, "wind_base": 25, "rain_prob": 0.1},
        {"condition": "Rainy", "temp_base": 14, "wind_base": 15, "rain_prob": 0.8},
        {"condition": "Stormy", "temp_base": 12, "wind_base": 35, "rain_prob": 0.9},
    ]
    
    @classmethod
    def get_weather(cls, lat: float, lon: float, lang: str = "en") -> Dict[str, Any]:
        """
        Generate mock weather data based on location and current time.
        Uses deterministic pseudo-random based on coordinates for consistency.
        """
        # Create a deterministic seed from location and hour
        now = datetime.utcnow()
        seed_str = f"{round(lat, 2)}:{round(lon, 2)}:{now.hour}:{now.day}"
        seed = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        
        # Select weather condition (weighted towards good weather)
        weights = [0.35, 0.25, 0.15, 0.10, 0.10, 0.05]
        condition_data = rng.choices(cls.WEATHER_CONDITIONS, weights=weights)[0]
        
        # Add some variation
        temp_variation = rng.uniform(-5, 5)
        wind_variation = rng.uniform(-5, 10)
        
        # Adjust for latitude (higher latitudes = colder)
        lat_factor = abs(lat) / 90.0
        temp_adjustment = -lat_factor * 15
        
        # Adjust for time of day (cooler at night)
        hour = now.hour
        if hour < 6 or hour > 20:
            temp_adjustment -= 5
        elif 10 <= hour <= 16:
            temp_adjustment += 3
        
        temperature = round(condition_data["temp_base"] + temp_variation + temp_adjustment, 1)
        wind_speed = max(0, round(condition_data["wind_base"] + wind_variation, 1))
        rain_chance = round(condition_data["rain_prob"] * 100)
        
        # Humidity based on rain probability
        humidity = round(40 + condition_data["rain_prob"] * 50 + rng.uniform(-10, 10))
        humidity = max(20, min(100, humidity))
        
        condition = condition_data["condition"]
        condition_localized = translate(condition, lang)
        
        # Generate summary string
        summary = f"{condition_localized}, {temperature}°C"
        if wind_speed > 20:
            windy_text = translate("Windy", lang)
            summary = f"{windy_text}, {temperature}°C"
        
        return {
            "condition": condition,
            "condition_localized": condition_localized,
            "temperature_c": temperature,
            "wind_speed_kmh": wind_speed,
            "humidity_percent": humidity,
            "rain_chance_percent": rain_chance,
            "summary": summary,
            "fetched_at": now_iso(),
            "is_cycling_friendly": condition in ["Sunny", "Clear", "Cloudy"] and wind_speed < 25,
        }
    
    @classmethod
    def get_cycling_recommendation(cls, weather: Dict[str, Any], lang: str = "en") -> str:
        """Get a cycling recommendation based on weather."""
        if weather["is_cycling_friendly"]:
            recommendations = {
                "en": "Great conditions for cycling!",
                "zh": "非常适合骑行！",
                "it": "Ottime condizioni per il ciclismo!",
            }
        elif weather["rain_chance_percent"] > 50:
            recommendations = {
                "en": "Rain expected - bring waterproof gear.",
                "zh": "预计有雨 - 请携带防水装备。",
                "it": "Pioggia prevista - porta abbigliamento impermeabile.",
            }
        elif weather["wind_speed_kmh"] > 25:
            recommendations = {
                "en": "Strong winds - cycling may be difficult.",
                "zh": "大风 - 骑行可能困难。",
                "it": "Vento forte - il ciclismo potrebbe essere difficile.",
            }
        else:
            recommendations = {
                "en": "Acceptable conditions, stay alert.",
                "zh": "条件尚可，请保持警惕。",
                "it": "Condizioni accettabili, resta attento.",
            }
        return recommendations.get(lang, recommendations["en"])


# ---- OSRM Routing Service ----
OSRM_BASE_URL = "http://router.project-osrm.org"
OSRM_TIMEOUT = 10.0


async def fetch_osrm_route_async(
    from_lat: float, from_lon: float,
    to_lat: float, to_lon: float,
    profile: str = "bike"
) -> Optional[Dict[str, Any]]:
    """Fetch route from OSRM asynchronously."""
    # OSRM uses 'cycling' profile
    url = (
        f"{OSRM_BASE_URL}/route/v1/{profile}/"
        f"{from_lon},{from_lat};{to_lon},{to_lat}"
        "?overview=full&geometries=geojson&alternatives=true&steps=true"
    )
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=OSRM_TIMEOUT)
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return None


def fetch_osrm_route(
    from_lat: float, from_lon: float,
    to_lat: float, to_lon: float,
    profile: str = "bike",
    alternatives: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Fetch route from OSRM (synchronous).
    Returns OSRM response with real road geometry.
    """
    alt_param = "true" if alternatives else "false"
    url = (
        f"{OSRM_BASE_URL}/route/v1/{profile}/"
        f"{from_lon},{from_lat};{to_lon},{to_lat}"
        f"?overview=full&geometries=geojson&alternatives={alt_param}&steps=true"
    )
    try:
        resp = httpx.get(url, timeout=OSRM_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") == "Ok" and data.get("routes"):
            return data
        return None
    except Exception as e:
        print(f"OSRM request failed: {e}")
        return None

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


# ---- Privacy By Design Helpers ----
PRIVACY_FUZZ_METERS = 150  # Obfuscation radius in meters (~100-200m as per RASD)
PRIVACY_GRID_SIZE_DEG = 0.002  # ~200m grid for snapping


def obfuscate_location(lat: float, lon: float, method: str = "noise") -> tuple:
    """
    Obfuscate a location for privacy protection.
    
    Methods:
    - "noise": Add random noise within PRIVACY_FUZZ_METERS radius
    - "grid": Snap to a fixed grid (more consistent but less private)
    - "truncate": Truncate decimal places (simplest)
    
    Returns: (obfuscated_lat, obfuscated_lon)
    """
    if method == "noise":
        # Add random noise within a circle of PRIVACY_FUZZ_METERS
        # Convert meters to approximate degrees (1 deg latitude ≈ 111km)
        noise_deg = PRIVACY_FUZZ_METERS / 111_000.0
        angle = random.uniform(0, 2 * math.pi)
        radius = random.uniform(0, noise_deg)
        lat_offset = radius * math.cos(angle)
        # Adjust longitude offset by latitude (longitude degrees are smaller near poles)
        lon_offset = radius * math.sin(angle) / max(math.cos(math.radians(lat)), 0.1)
        return (lat + lat_offset, lon + lon_offset)
    
    elif method == "grid":
        # Snap to a grid
        lat_snapped = round(lat / PRIVACY_GRID_SIZE_DEG) * PRIVACY_GRID_SIZE_DEG
        lon_snapped = round(lon / PRIVACY_GRID_SIZE_DEG) * PRIVACY_GRID_SIZE_DEG
        return (lat_snapped, lon_snapped)
    
    elif method == "truncate":
        # Truncate to ~3 decimal places (~100m precision)
        return (round(lat, 3), round(lon, 3))
    
    return (lat, lon)


def obfuscate_trip_geometry(
    coords: List[List[float]], 
    fuzz_distance_m: float = 150
) -> List[List[float]]:
    """
    Obfuscate the first and last ~fuzz_distance_m of a trip geometry
    to protect home/work locations.
    
    coords: List of [lon, lat] pairs (GeoJSON format)
    fuzz_distance_m: Distance in meters to obfuscate from start/end
    
    Returns: Sanitized coordinate list with fuzzed start/end points
    """
    if len(coords) < 2:
        return coords
    
    # Calculate total path distance and find trim indices
    result = coords.copy()
    
    # Calculate distances from start
    dist_from_start = 0.0
    start_trim_idx = 0
    for i in range(1, len(coords)):
        lon1, lat1 = coords[i - 1]
        lon2, lat2 = coords[i]
        dist_from_start += haversine_m(lat1, lon1, lat2, lon2)
        if dist_from_start >= fuzz_distance_m:
            start_trim_idx = i
            break
    
    # Calculate distances from end
    dist_from_end = 0.0
    end_trim_idx = len(coords) - 1
    for i in range(len(coords) - 1, 0, -1):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[i - 1]
        dist_from_end += haversine_m(lat1, lon1, lat2, lon2)
        if dist_from_end >= fuzz_distance_m:
            end_trim_idx = i
            break
    
    # If trip is too short, just obfuscate endpoints
    if start_trim_idx >= end_trim_idx:
        start_lon, start_lat = coords[0]
        end_lon, end_lat = coords[-1]
        fuzzed_start = obfuscate_location(start_lat, start_lon, "noise")
        fuzzed_end = obfuscate_location(end_lat, end_lon, "noise")
        result[0] = [fuzzed_start[1], fuzzed_start[0]]  # [lon, lat]
        result[-1] = [fuzzed_end[1], fuzzed_end[0]]
        return result
    
    # Obfuscate start section
    fuzzed_coords = []
    start_lon, start_lat = coords[start_trim_idx]
    fuzzed_start = obfuscate_location(start_lat, start_lon, "noise")
    fuzzed_coords.append([fuzzed_start[1], fuzzed_start[0]])
    
    # Keep middle section intact
    fuzzed_coords.extend(coords[start_trim_idx:end_trim_idx + 1])
    
    # Obfuscate end section
    end_lon, end_lat = coords[end_trim_idx]
    fuzzed_end = obfuscate_location(end_lat, end_lon, "noise")
    fuzzed_coords.append([fuzzed_end[1], fuzzed_end[0]])
    
    return fuzzed_coords


# ---- Data Aggregation & Voting Service ----
AGGREGATION_FRESHNESS_DAYS = 30  # Reports within this period have higher weight
AGGREGATION_FRESHNESS_WEIGHT = 2.0  # Weight multiplier for fresh reports
AGGREGATION_CONFIRMED_WEIGHT = 1.5  # Weight multiplier for confirmed reports
AGGREGATION_THRESHOLD_BAD = 0.6  # If negative_score > this, segment is "maintenance"
AGGREGATION_THRESHOLD_MEDIUM = 0.3  # If negative_score > this, segment is "medium"


def calculate_report_weight(report: Dict[str, Any]) -> float:
    """
    Calculate the weight of a report based on freshness and confirmation status.
    
    Weighting Rules:
    - Recent reports (last 30 days) get 2x weight
    - Confirmed reports get 1.5x weight
    - Base weight is 1.0
    """
    weight = 1.0
    
    # Freshness weight
    created_at_str = report.get("created_at", "")
    try:
        created_at = datetime.fromisoformat(created_at_str.replace("Z", ""))
        age_days = (datetime.utcnow() - created_at).days
        if age_days <= AGGREGATION_FRESHNESS_DAYS:
            weight *= AGGREGATION_FRESHNESS_WEIGHT
    except (ValueError, TypeError):
        pass  # If date parsing fails, use base weight
    
    # Confirmation weight
    if report.get("confirmed", False):
        weight *= AGGREGATION_CONFIRMED_WEIGHT
    
    return weight


def aggregate_segment_reports(segment_id: int) -> Dict[str, Any]:
    """
    Aggregate reports for a segment using weighted voting.
    
    Algorithm:
    1. Collect all reports for the segment
    2. Calculate weighted scores based on:
       - Report freshness (recent = higher weight)
       - Confirmation status (confirmed = higher weight)
    3. Determine segment status by majority vote:
       - Negative reports (note contains "bad", "pothole", "damage", etc.)
       - Positive reports (note contains "good", "fixed", "clear", etc.)
    4. Calculate final score and update segment status if threshold crossed
    
    Returns aggregation result with scores and recommendation.
    """
    if segment_id not in SEGMENTS:
        return {"error": "segment_id not found"}
    
    reports = [r for r in REPORTS.values() if r["segment_id"] == segment_id]
    
    if not reports:
        return {
            "segment_id": segment_id,
            "reports_total": 0,
            "weighted_negative_score": 0.0,
            "weighted_positive_score": 0.0,
            "recommended_status": SEGMENTS[segment_id]["status"],
            "status_changed": False,
        }
    
    # Keywords for classification
    negative_keywords = ["bad", "pothole", "damage", "broken", "crack", "hole", 
                         "rough", "dangerous", "hazard", "poor", "terrible"]
    positive_keywords = ["good", "fixed", "repaired", "smooth", "clear", 
                         "excellent", "optimal", "safe", "fine"]
    
    total_weight = 0.0
    negative_weight = 0.0
    positive_weight = 0.0
    confirmed_count = 0
    fresh_count = 0
    
    for report in reports:
        weight = calculate_report_weight(report)
        total_weight += weight
        
        if report.get("confirmed"):
            confirmed_count += 1
        
        # Check freshness
        try:
            created_at = datetime.fromisoformat(report.get("created_at", "").replace("Z", ""))
            if (datetime.utcnow() - created_at).days <= AGGREGATION_FRESHNESS_DAYS:
                fresh_count += 1
        except (ValueError, TypeError):
            pass
        
        # Classify report
        note = (report.get("note") or "").lower()
        is_negative = any(kw in note for kw in negative_keywords)
        is_positive = any(kw in note for kw in positive_keywords)
        
        # If no keywords, consider it neutral (slightly negative for caution)
        if is_negative:
            negative_weight += weight
        elif is_positive:
            positive_weight += weight
        else:
            # Neutral reports lean slightly negative for safety
            negative_weight += weight * 0.3
            positive_weight += weight * 0.7
    
    # Calculate normalized scores
    if total_weight > 0:
        negative_score = negative_weight / total_weight
        positive_score = positive_weight / total_weight
    else:
        negative_score = 0.0
        positive_score = 0.0
    
    # Determine recommended status
    current_status = SEGMENTS[segment_id]["status"]
    if negative_score >= AGGREGATION_THRESHOLD_BAD:
        recommended_status = "maintenance"
    elif negative_score >= AGGREGATION_THRESHOLD_MEDIUM:
        recommended_status = "medium"
    elif positive_score > 0.7:
        recommended_status = "optimal"
    else:
        recommended_status = "medium"
    
    # Update segment status if changed
    status_changed = False
    if recommended_status != current_status:
        SEGMENTS[segment_id]["status"] = recommended_status
        SEGMENTS[segment_id]["last_aggregated"] = now_iso()
        status_changed = True
    
    return {
        "segment_id": segment_id,
        "reports_total": len(reports),
        "reports_confirmed": confirmed_count,
        "reports_fresh": fresh_count,
        "weighted_negative_score": round(negative_score, 3),
        "weighted_positive_score": round(positive_score, 3),
        "previous_status": current_status,
        "recommended_status": recommended_status,
        "status_changed": status_changed,
        "aggregated_at": now_iso(),
    }


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
    severity: Optional[str] = None  # "low", "medium", "high"
    report_type: Optional[str] = None  # "pothole", "crack", "debris", "flooding", "other"


class AutoDetectRequest(BaseModel):
    """Request model for sensor-based automatic detection."""
    z_axis_peak: float = Field(..., description="Peak Z-axis acceleration from accelerometer (m/s²)")
    speed: float = Field(..., description="Speed at detection point (m/s)")
    duration_ms: Optional[float] = Field(default=None, description="Duration of vibration event (ms)")
    gps_accuracy_m: Optional[float] = Field(default=None, description="GPS accuracy in meters")


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


class Coordinate(BaseModel):
    lat: float
    lon: float


class PathSearchRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    preferences: str = Field(default="balanced")  # "safety_first", "shortest", "balanced"


class SegmentWarning(BaseModel):
    lat: float
    lon: float
    type: str


class RouteResult(BaseModel):
    route_id: str
    rank: int
    total_distance: float  # meters
    road_quality_score: float  # higher is better (0-100)
    tags: List[str]
    geometry: str  # polyline encoded string or GeoJSON
    segments_warning: List[SegmentWarning]


def seed_demo_data():
    """
    Seed demo data with realistic road segments.
    Segments are placed on actual roads in Singapore (Marina Bay area)
    to align with OSRM routing results.
    """
    global _next_user_id, _next_segment_id
    if USERS:
        return
    u = {"id": _next_user_id, "username": "alice", "created_at": now_iso()}
    USERS[u["id"]] = u
    _next_user_id += 1
    
    # Initialize default settings for demo user
    SETTINGS[u["id"]] = UserSettings().model_dump()

    # Demo segments along real roads in Singapore
    # These coordinates follow actual road paths from OSRM
    demo_segments = [
        # Marina Bay Sands area - Bayfront Avenue (optimal road)
        {
            "user_id": u["id"],
            "start_lat": 1.2834,
            "start_lon": 103.8607,
            "end_lat": 1.2847,
            "end_lon": 103.8592,
            "status": "optimal",
            "obstacle": None,
            "road_name": "Bayfront Avenue",
        },
        # Raffles Boulevard - good cycling path
        {
            "user_id": u["id"],
            "start_lat": 1.2913,
            "start_lon": 103.8558,
            "end_lat": 1.2932,
            "end_lon": 103.8541,
            "status": "optimal",
            "obstacle": None,
            "road_name": "Raffles Boulevard",
        },
        # Nicoll Highway - medium quality
        {
            "user_id": u["id"],
            "start_lat": 1.2996,
            "start_lon": 103.8631,
            "end_lat": 1.3012,
            "end_lon": 103.8658,
            "status": "medium",
            "obstacle": None,
            "road_name": "Nicoll Highway",
        },
        # Beach Road - has potholes (maintenance)
        {
            "user_id": u["id"],
            "start_lat": 1.3021,
            "start_lon": 103.8634,
            "end_lat": 1.3045,
            "end_lon": 103.8612,
            "status": "maintenance",
            "obstacle": "pothole",
            "road_name": "Beach Road",
        },
        # East Coast Park connector - excellent cycling
        {
            "user_id": u["id"],
            "start_lat": 1.3010,
            "start_lon": 103.9125,
            "end_lat": 1.3025,
            "end_lon": 103.9187,
            "status": "optimal",
            "obstacle": None,
            "road_name": "East Coast Park Connector",
        },
        # Orchard Road area - medium due to traffic
        {
            "user_id": u["id"],
            "start_lat": 1.3041,
            "start_lon": 103.8318,
            "end_lat": 1.3025,
            "end_lon": 103.8362,
            "status": "medium",
            "obstacle": None,
            "road_name": "Orchard Road",
        },
        # Bukit Timah Road - suboptimal section
        {
            "user_id": u["id"],
            "start_lat": 1.3251,
            "start_lon": 103.8224,
            "end_lat": 1.3289,
            "end_lon": 103.8198,
            "status": "suboptimal",
            "obstacle": "rough surface",
            "road_name": "Bukit Timah Road",
        },
        # Tampines cycling path - optimal
        {
            "user_id": u["id"],
            "start_lat": 1.3532,
            "start_lon": 103.9456,
            "end_lat": 1.3548,
            "end_lon": 103.9512,
            "status": "optimal",
            "obstacle": None,
            "road_name": "Tampines PCN",
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


# NOTE: seed_demo_data() is called at the end of the file after all classes are defined


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
def list_segments(user_id: Optional[int] = Query(default=None)):
    """List all segments with localized status labels."""
    lang = get_user_language(user_id)
    segments = []
    for seg in SEGMENTS.values():
        seg_copy = dict(seg)
        seg_copy["status_localized"] = translate(seg["status"], lang)
        segments.append(seg_copy)
    return segments


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
    """
    Aggregate reports for a segment using weighted voting algorithm.
    
    The algorithm considers:
    - Freshness: Reports from last 30 days have 2x weight
    - Confirmation: Confirmed reports have 1.5x weight
    - Majority voting: Negative vs positive keywords determine status
    
    Returns detailed aggregation results and updates segment status if threshold crossed.
    """
    if segment_id not in SEGMENTS:
        raise HTTPException(status_code=404, detail="segment_id not found")
    
    return aggregate_segment_reports(segment_id)


@app.post("/api/aggregation/trigger")
def trigger_aggregation_all():
    """
    Trigger data aggregation for ALL segments (simulates cron job from DD).
    
    This endpoint runs the weighted voting algorithm on every segment
    and updates their status automatically based on aggregated reports.
    
    Returns summary of all segments processed and status changes.
    """
    results = []
    status_changes = 0
    
    for segment_id in SEGMENTS:
        result = aggregate_segment_reports(segment_id)
        if result.get("status_changed"):
            status_changes += 1
        results.append(result)
    
    return {
        "triggered_at": now_iso(),
        "segments_processed": len(results),
        "status_changes": status_changes,
        "results": results,
    }


# ---- trips ----
@app.post("/api/trips")
def create_trip(payload: TripCreate, use_osrm: bool = Query(default=False)):
    """
    Create a trip with Privacy By Design:
    - Raw coordinates are stored privately
    - Public geometry has first/last ~150m obfuscated to protect home/work locations
    - Includes weather information for the trip
    
    If use_osrm=true, query OSRM for real road geometry; otherwise fallback to straight interpolation.
    """
    global _next_trip_id
    if payload.user_id not in USERS:
        raise HTTPException(status_code=404, detail="user_id not found")

    coords: List[List[float]]
    route_source = "geometry"
    
    # Get user language for weather
    lang = get_user_language(payload.user_id)

    if use_osrm or payload.use_osrm:
        # Try OSRM for real road geometry (use bike profile)
        osrm_data = fetch_osrm_route(
            payload.from_lat, payload.from_lon,
            payload.to_lat, payload.to_lon,
            profile="bike",
            alternatives=False
        )
        
        if osrm_data and osrm_data.get("routes"):
            route = osrm_data["routes"][0]
            coords = route["geometry"]["coordinates"]
            dist = route["distance"]
            dur = route["duration"]
            route_source = "osrm"
        else:
            # fallback to straight line
            coords = path_line(payload.from_lat, payload.from_lon, payload.to_lat, payload.to_lon, steps=30)
            dist = path_distance_m(coords)
            dur = estimate_duration_s(dist)
            route_source = "fallback"
    else:
        coords = (
            payload.geometry.coordinates
            if payload.geometry and payload.geometry.coordinates
            else path_line(payload.from_lat, payload.from_lon, payload.to_lat, payload.to_lon, steps=30)
        )
        dist = payload.distance_m if payload.distance_m is not None else path_distance_m(coords)
        dur = payload.duration_s if payload.duration_s is not None else estimate_duration_s(dist)

    # Privacy By Design: Obfuscate start/end locations
    # Store raw coordinates privately, but create sanitized public version
    public_coords = obfuscate_trip_geometry(coords, fuzz_distance_m=PRIVACY_FUZZ_METERS)
    
    # Obfuscate exact from/to coordinates for public display
    obf_from = obfuscate_location(payload.from_lat, payload.from_lon, "truncate")
    obf_to = obfuscate_location(payload.to_lat, payload.to_lon, "truncate")
    
    # Get weather for the trip
    mid_lat = (payload.from_lat + payload.to_lat) / 2
    mid_lon = (payload.from_lon + payload.to_lon) / 2
    weather = WeatherService.get_weather(mid_lat, mid_lon, lang)

    tid = _next_trip_id
    _next_trip_id += 1
    trip = {
        "id": tid,
        "user_id": payload.user_id,
        # Obfuscated public coordinates (truncated to ~100m precision)
        "from_lat": obf_from[0],
        "from_lon": obf_from[1],
        "to_lat": obf_to[0],
        "to_lon": obf_to[1],
        # Raw private coordinates stored separately (for user's own access)
        "_private_from_lat": payload.from_lat,
        "_private_from_lon": payload.from_lon,
        "_private_to_lat": payload.to_lat,
        "_private_to_lon": payload.to_lon,
        "distance_m": round(dist, 1),
        "duration_s": round(dur, 1),
        "created_at": now_iso(),
        # Public geometry with obfuscated start/end
        "geometry": {"type": "LineString", "coordinates": public_coords},
        # Raw geometry stored privately
        "_private_geometry": {"type": "LineString", "coordinates": coords},
        # Weather at time of trip creation
        "weather_summary": weather["summary"],
        "weather": weather,
        # Route source info
        "route_source": route_source,
    }
    TRIPS[tid] = trip
    
    # Return public version (exclude private fields)
    return {k: v for k, v in trip.items() if not k.startswith("_private")}


# ---- Trip history ----
def sanitize_trip(trip: Dict[str, Any]) -> Dict[str, Any]:
    """Remove private fields from trip data for public API responses."""
    return {k: v for k, v in trip.items() if not k.startswith("_private")}


@app.get("/api/trips")
def list_trips(user_id: int = Query(default=None), include_private: bool = Query(default=False)):
    """
    List all trips, optionally filtered by user_id.
    
    Privacy By Design: Private location data is only returned if include_private=true
    and the requesting user owns the trip (simplified: based on user_id filter).
    """
    trips = list(TRIPS.values())
    if user_id is not None:
        trips = [t for t in trips if t["user_id"] == user_id]
    
    # Only include private data if explicitly requested AND filtered by owner
    if include_private and user_id is not None:
        result = trips
    else:
        result = [sanitize_trip(t) for t in trips]
    
    return sorted(result, key=lambda t: t["created_at"], reverse=True)


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: int, include_private: bool = Query(default=False)):
    """
    Get a single trip.
    
    Privacy By Design: Private location data is only returned if include_private=true.
    In production, this would also verify user ownership.
    """
    if trip_id not in TRIPS:
        raise HTTPException(status_code=404, detail="trip_id not found")
    
    trip = TRIPS[trip_id]
    if include_private:
        return trip
    return sanitize_trip(trip)


@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int):
    if trip_id not in TRIPS:
        raise HTTPException(status_code=404, detail="trip_id not found")
    del TRIPS[trip_id]
    return {"ok": True, "deleted": trip_id}


# ---- Auto-detection & batch confirmation ----
# Detection thresholds for accelerometer-based pothole detection
DETECT_Z_AXIS_THRESHOLD = 15.0  # m/s² - peak acceleration indicating pothole
DETECT_MIN_SPEED = 2.0  # m/s - minimum speed for valid detection (~7 km/h)
DETECT_SEVERE_Z_THRESHOLD = 25.0  # m/s² - severe pothole threshold
DETECT_MINOR_Z_THRESHOLD = 8.0  # m/s² - minor bump threshold


@app.post("/api/segments/{segment_id}/auto-detect")
def auto_detect_segment(segment_id: int, sensor_data: Optional[AutoDetectRequest] = None):
    """
    Automatic detection of road segment status based on sensor data.
    
    Algorithm:
    - If z_axis_peak > 25 m/s² AND speed > 2 m/s: "maintenance" (severe pothole)
    - If z_axis_peak > 15 m/s² AND speed > 2 m/s: "suboptimal" (pothole detected)
    - If z_axis_peak > 8 m/s² AND speed > 2 m/s: "medium" (minor bump)
    - Otherwise: "optimal"
    
    Speed threshold ensures we don't detect false positives from standing/slow movement.
    
    Parameters:
    - segment_id: ID of the segment to analyze
    - sensor_data: Optional accelerometer/speed data. If not provided, uses random simulation.
    """
    if segment_id not in SEGMENTS:
        raise HTTPException(status_code=404, detail="segment_id not found")
    
    seg = SEGMENTS[segment_id]
    
    if sensor_data:
        # Use provided sensor data for detection
        z_peak = sensor_data.z_axis_peak
        speed = sensor_data.speed
        
        # Detection algorithm based on accelerometer data
        if speed < DETECT_MIN_SPEED:
            # Speed too low, unreliable detection
            detected = "optimal"  # Default to optimal when not moving
            confidence = 0.3
            reason = "Speed below threshold, detection unreliable"
        elif z_peak >= DETECT_SEVERE_Z_THRESHOLD:
            detected = "maintenance"
            confidence = min(0.95, 0.7 + (z_peak - DETECT_SEVERE_Z_THRESHOLD) / 50)
            reason = f"Severe impact detected (z={z_peak:.1f} m/s²)"
        elif z_peak >= DETECT_Z_AXIS_THRESHOLD:
            detected = "suboptimal"
            confidence = min(0.90, 0.6 + (z_peak - DETECT_Z_AXIS_THRESHOLD) / 30)
            reason = f"Pothole impact detected (z={z_peak:.1f} m/s²)"
        elif z_peak >= DETECT_MINOR_Z_THRESHOLD:
            detected = "medium"
            confidence = min(0.85, 0.5 + (z_peak - DETECT_MINOR_Z_THRESHOLD) / 20)
            reason = f"Minor bump detected (z={z_peak:.1f} m/s²)"
        else:
            detected = "optimal"
            confidence = max(0.7, 0.95 - z_peak / 20)
            reason = f"Smooth surface (z={z_peak:.1f} m/s²)"
        
        # Adjust confidence based on GPS accuracy if provided
        if sensor_data.gps_accuracy_m and sensor_data.gps_accuracy_m > 20:
            confidence *= 0.8  # Reduce confidence for poor GPS
            reason += f", GPS accuracy: {sensor_data.gps_accuracy_m:.1f}m"
    else:
        # Fallback to random simulation (legacy behavior)
        statuses = ["optimal", "medium", "suboptimal", "maintenance"]
        weights = [0.5, 0.25, 0.15, 0.1]
        detected = random.choices(statuses, weights=weights)[0]
        confidence = round(random.uniform(0.7, 0.98), 2)
        reason = "Simulated detection (no sensor data provided)"
        z_peak = None
        speed = None
    
    return {
        "segment_id": segment_id,
        "current_status": seg["status"],
        "detected_status": detected,
        "confidence": round(confidence, 2),
        "recommendation": "update" if detected != seg["status"] else "keep",
        "detection_reason": reason,
        "sensor_data": {
            "z_axis_peak": z_peak,
            "speed": speed,
        } if sensor_data else None,
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


# ---- Weather API ----
@app.get("/api/weather")
def get_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    user_id: Optional[int] = Query(default=None)
):
    """
    Get weather data for a location.
    Returns mock weather data with cycling recommendation.
    """
    lang = get_user_language(user_id)
    weather = WeatherService.get_weather(lat, lon, lang)
    weather["cycling_recommendation"] = WeatherService.get_cycling_recommendation(weather, lang)
    return weather


@app.get("/api/weather/route")
def get_route_weather(
    from_lat: float = Query(...),
    from_lon: float = Query(...),
    to_lat: float = Query(...),
    to_lon: float = Query(...),
    user_id: Optional[int] = Query(default=None)
):
    """
    Get weather data for a route (start, midpoint, end).
    """
    lang = get_user_language(user_id)
    mid_lat = (from_lat + to_lat) / 2
    mid_lon = (from_lon + to_lon) / 2
    
    return {
        "start": WeatherService.get_weather(from_lat, from_lon, lang),
        "midpoint": WeatherService.get_weather(mid_lat, mid_lon, lang),
        "end": WeatherService.get_weather(to_lat, to_lon, lang),
    }


# ---- Stats summary ----
@app.get("/api/stats")
def get_stats(user_id: Optional[int] = Query(default=None)):
    """Global statistics for dashboard with localized labels."""
    lang = get_user_language(user_id)
    
    total_users = len(USERS)
    total_segments = len(SEGMENTS)
    total_reports = len(REPORTS)
    total_trips = len(TRIPS)
    confirmed_reports = sum(1 for r in REPORTS.values() if r["confirmed"])
    
    status_counts = {}
    status_counts_localized = {}
    for seg in SEGMENTS.values():
        st = seg["status"]
        status_counts[st] = status_counts.get(st, 0) + 1
        st_loc = translate(st, lang)
        status_counts_localized[st_loc] = status_counts_localized.get(st_loc, 0) + 1
    
    total_distance = sum(t.get("distance_m", 0) for t in TRIPS.values())
    
    return {
        "users": total_users,
        "segments": total_segments,
        "reports": {"total": total_reports, "confirmed": confirmed_reports},
        "trips": total_trips,
        "total_distance_km": round(total_distance / 1000, 2),
        "segment_status_counts": status_counts,
        "segment_status_counts_localized": status_counts_localized,
    }


@app.post("/api/routes")
def preview_routes(req: RoutesRequest, user_id: Optional[int] = Query(default=None)):
    """
    Preview multiple route options between two points.
    Uses OSRM for real road geometry when available.
    """
    lang = get_user_language(user_id)
    route_source = "osrm"
    
    # Try OSRM first
    osrm_data = fetch_osrm_route(
        req.from_lat, req.from_lon,
        req.to_lat, req.to_lon,
        profile="bike",
        alternatives=True
    )
    
    routes = []
    
    if osrm_data and osrm_data.get("routes"):
        # Use real OSRM routes
        osrm_routes = osrm_data["routes"][:req.n]
        labels = ["Direct", "Alt 1", "Alt 2", "Alt 3", "Alt 4"]
        
        for i, route in enumerate(osrm_routes):
            coords = route["geometry"]["coordinates"]
            dist = route["distance"]
            dur = route["duration"]
            
            routes.append({
                "id": i + 1,
                "label": labels[i] if i < len(labels) else f"Alt {i}",
                "distance_m": round(dist, 1),
                "duration_s": round(dur, 1),
                "duration_display": _format_duration(dur),
                "geometry": {"type": "LineString", "coordinates": coords},
                "source": "osrm",
            })
    else:
        # Fallback to math-based routes
        route_source = "fallback"
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
            
            routes.append({
                "id": i,
                "label": label,
                "distance_m": round(dist, 1),
                "duration_s": round(dur, 1),
                "duration_display": _format_duration(dur),
                "geometry": {"type": "LineString", "coordinates": coords},
                "source": "fallback",
            })
    
    # Add weather info
    mid_lat = (req.from_lat + req.to_lat) / 2
    mid_lon = (req.from_lon + req.to_lon) / 2
    weather = WeatherService.get_weather(mid_lat, mid_lon, lang)
    
    return {
        "routes": routes,
        "route_source": route_source,
        "weather_summary": weather["summary"],
        "weather": weather,
    }


# ---- i18n API ----
@app.get("/api/i18n/translations")
def get_translations(lang: str = Query(default="en")):
    """
    Get all translations for a specific language.
    Useful for frontend localization.
    """
    if lang not in I18N_TRANSLATIONS:
        lang = "en"
    return {
        "language": lang,
        "translations": I18N_TRANSLATIONS[lang],
        "available_languages": list(I18N_TRANSLATIONS.keys()),
    }


@app.get("/api/i18n/languages")
def get_available_languages():
    """Get list of available languages."""
    return {
        "languages": [
            {"code": "en", "name": "English", "native_name": "English"},
            {"code": "zh", "name": "Chinese", "native_name": "中文"},
            {"code": "it", "name": "Italian", "native_name": "Italiano"},
        ],
        "default": "en",
    }


# ---- Path Search with Scoring ----
def point_to_segment_distance(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    """Distance from point (px, py) to line segment (ax, ay)-(bx, by)."""
    abx = bx - ax
    aby = by - ay
    apx = px - ax
    apy = py - ay
    ab_sq = abx * abx + aby * aby
    if ab_sq == 0:
        return math.sqrt(apx * apx + apy * apy)
    t = max(0, min(1, (apx * abx + apy * aby) / ab_sq))
    proj_x = ax + t * abx
    proj_y = ay + t * aby
    return math.sqrt((px - proj_x) ** 2 + (py - proj_y) ** 2)


def find_segments_near_route(route_coords: List[List[float]], tolerance_deg: float = 0.002) -> List[Dict[str, Any]]:
    """
    Find all segments in the database that are near the given route.
    route_coords: list of [lon, lat] pairs
    tolerance_deg: roughly ~200m at equator
    """
    nearby_segments = []
    for seg in SEGMENTS.values():
        seg_start = (seg["start_lon"], seg["start_lat"])
        seg_end = (seg["end_lon"], seg["end_lat"])
        seg_mid_lon = (seg_start[0] + seg_end[0]) / 2
        seg_mid_lat = (seg_start[1] + seg_end[1]) / 2
        
        # Check if segment midpoint is close to any point in route
        for i in range(len(route_coords) - 1):
            lon1, lat1 = route_coords[i]
            lon2, lat2 = route_coords[i + 1]
            dist = point_to_segment_distance(seg_mid_lon, seg_mid_lat, lon1, lat1, lon2, lat2)
            if dist < tolerance_deg:
                nearby_segments.append(seg)
                break
    return nearby_segments


def calculate_route_score(
    distance_m: float,
    nearby_segments: List[Dict[str, Any]],
    preferences: str = "balanced"
) -> tuple:
    """
    Calculate route score. Returns (score, quality_score, pothole_count, bad_road_length, tags, warnings).
    
    Score formula varies by preference:
    - safety_first: Heavy penalties for maintenance/potholes, prioritizes surface quality
    - shortest: Minimal penalties, prioritizes distance
    - balanced: Moderate penalties, balances distance and quality
    
    Lower score = better route
    quality_score: 0-100 (higher is better) for display purposes
    
    Tags are mutually exclusive where applicable:
    - "Best Surface" only appears when no issues AND not marked as "Fastest"
    - "Fastest" only appears for shortest preference on direct route
    """
    pothole_count = 0
    bad_road_length_m = 0.0
    maintenance_length_m = 0.0  # Track maintenance separately for safety_first
    medium_length_m = 0.0  # Track medium quality roads
    warnings = []
    
    for seg in nearby_segments:
        status = seg.get("status", "optimal")
        obstacle = seg.get("obstacle")
        seg_len = haversine_m(
            seg["start_lat"], seg["start_lon"],
            seg["end_lat"], seg["end_lon"]
        )
        
        # Count potholes
        if obstacle and "pothole" in obstacle.lower():
            pothole_count += 1
            warnings.append({
                "lat": (seg["start_lat"] + seg["end_lat"]) / 2,
                "lon": (seg["start_lon"] + seg["end_lon"]) / 2,
                "type": "Pothole"
            })
        
        # Track road quality by status
        if status == "maintenance":
            maintenance_length_m += seg_len
            bad_road_length_m += seg_len
            if not any(w["type"] == "Pothole" for w in warnings if 
                abs(w["lat"] - (seg["start_lat"] + seg["end_lat"]) / 2) < 0.0001):
                warnings.append({
                    "lat": (seg["start_lat"] + seg["end_lat"]) / 2,
                    "lon": (seg["start_lon"] + seg["end_lon"]) / 2,
                    "type": "Road Work"
                })
        elif status == "suboptimal":
            bad_road_length_m += seg_len
            warnings.append({
                "lat": (seg["start_lat"] + seg["end_lat"]) / 2,
                "lon": (seg["start_lon"] + seg["end_lon"]) / 2,
                "type": "Bad Road"
            })
        elif status == "medium":
            medium_length_m += seg_len
    
    # Calculate penalty-based score (lower is better)
    if preferences == "safety_first":
        # VERY heavy penalty for maintenance segments (as per RASD requirement)
        # Maintenance roads are essentially treated as impassable for safety
        penalty = (
            (pothole_count * 1200) +  # Very high pothole penalty
            (maintenance_length_m * 10.0) +  # Extreme penalty for maintenance roads
            (bad_road_length_m * 5.0) +  # High penalty for bad roads
            (medium_length_m * 1.5)  # Moderate penalty for medium quality
        )
    elif preferences == "shortest":
        # Light penalty, prioritize distance
        # Still consider safety but much lower weight
        penalty = (
            (pothole_count * 100) + 
            (maintenance_length_m * 0.8) +
            (bad_road_length_m * 0.3) +
            (medium_length_m * 0.1)
        )
    else:  # balanced
        penalty = (
            (pothole_count * 500) + 
            (maintenance_length_m * 4.0) +
            (bad_road_length_m * 2.0) +
            (medium_length_m * 0.5)
        )
    
    score = distance_m + penalty
    
    # Calculate quality score (0-100, higher is better)
    # Based on percentage of route without issues
    max_penalty = distance_m * 3  # theoretical maximum penalty
    if max_penalty > 0:
        quality_score = max(0, min(100, 100 - (penalty / max_penalty) * 100))
    else:
        quality_score = 100
    
    # Generate tags (mutually exclusive logic)
    tags = []
    has_surface_issues = pothole_count > 0 or bad_road_length_m > 0 or maintenance_length_m > 0
    
    # "Best Surface" and "Fastest" are mutually exclusive primary tags
    if not has_surface_issues and preferences != "shortest":
        tags.append("Best Surface")
    elif preferences == "shortest" and not has_surface_issues:
        # For shortest preference, we use "Fastest" not "Best Surface"
        pass  # "Fastest" tag will be added in path_search based on route position
    
    # Secondary tags (can coexist)
    if pothole_count > 0:
        tags.append("Bumpy")
    if maintenance_length_m > 100:
        tags.append("Road Work")
    elif bad_road_length_m > 100:
        tags.append("Poor Surface")
    if medium_length_m > distance_m * 0.3:  # More than 30% medium quality
        tags.append("Mixed Surface")
    
    return score, quality_score, pothole_count, bad_road_length_m, tags, warnings


def encode_polyline(coords: List[List[float]], precision: int = 5) -> str:
    """
    Encode coordinates to polyline format.
    coords: list of [lon, lat] pairs
    """
    def encode_value(value: int) -> str:
        result = ""
        value = ~(value << 1) if value < 0 else (value << 1)
        while value >= 0x20:
            result += chr((0x20 | (value & 0x1f)) + 63)
            value >>= 5
        result += chr(value + 63)
        return result
    
    encoded = ""
    prev_lat, prev_lon = 0, 0
    multiplier = 10 ** precision
    
    for lon, lat in coords:
        lat_int = round(lat * multiplier)
        lon_int = round(lon * multiplier)
        encoded += encode_value(lat_int - prev_lat)
        encoded += encode_value(lon_int - prev_lon)
        prev_lat, prev_lon = lat_int, lon_int
    
    return encoded


def _generate_fallback_routes(
    origin_lat: float, origin_lon: float,
    dest_lat: float, dest_lon: float,
    preferences: str
) -> List[Dict[str, Any]]:
    """
    Generate fallback routes using math-based geometry when OSRM is unavailable.
    """
    base = path_line(origin_lat, origin_lon, dest_lat, dest_lon, steps=32)
    
    mid_lat = (origin_lat + dest_lat) / 2.0
    mid_lon = (origin_lon + dest_lon) / 2.0
    dlat = dest_lat - origin_lat
    dlon = dest_lon - origin_lon
    
    px, py = dlon, -dlat
    norm = math.sqrt(px * px + py * py) or 1.0
    px /= norm
    py /= norm
    
    route_configs = [
        (0.0, "A"),
        (0.012, "B"),
        (-0.012, "C"),
    ]
    
    candidates = []
    base_distance = path_distance_m(base)
    
    for offset, route_id in route_configs:
        if abs(offset) < 1e-9:
            coords = base
        else:
            via_lat = mid_lat + py * offset
            via_lon = mid_lon + px * offset
            coords = path_via(origin_lat, origin_lon, dest_lat, dest_lon, via_lat, via_lon, steps_each=18)
        
        distance_m = path_distance_m(coords)
        duration_s = estimate_duration_s(distance_m)
        
        nearby_segs = find_segments_near_route(coords)
        score, quality_score, pothole_count, bad_road_len, tags, warnings = calculate_route_score(
            distance_m, nearby_segs, preferences
        )
        
        if offset == 0.0:
            if preferences == "shortest":
                tags = ["Fastest"] + [t for t in tags if t != "Best Surface"]
            else:
                tags.insert(0, "Shortest")
        elif distance_m > base_distance:
            tags.append("Slightly Longer")
            tags = [t for t in tags if t != "Fastest"]
        
        candidates.append({
            "route_id": route_id,
            "coords": coords,
            "distance_m": distance_m,
            "duration_s": duration_s,
            "score": score,
            "quality_score": quality_score,
            "tags": tags,
            "warnings": warnings,
            "source": "fallback",
        })
    
    return candidates


@app.post("/api/path/search")
def path_search(
    req: PathSearchRequest,
    user_id: Optional[int] = Query(default=None)
):
    """
    Search for routes with road quality scoring.
    
    Uses OSRM for real road geometry, falls back to math-based routes if OSRM fails.
    Returns 1-3 candidate routes sorted by score (best first).
    Includes weather information and localized labels.
    """
    origin = req.origin
    dest = req.destination
    preferences = req.preferences
    lang = get_user_language(user_id)
    
    candidates = []
    route_source = "osrm"
    
    # Try to get real routes from OSRM
    osrm_data = fetch_osrm_route(
        origin.lat, origin.lon,
        dest.lat, dest.lon,
        profile="bike",
        alternatives=True
    )
    
    if osrm_data and osrm_data.get("routes"):
        # Process OSRM routes
        osrm_routes = osrm_data["routes"]
        route_labels = ["A", "B", "C", "D", "E"]
        
        for idx, route in enumerate(osrm_routes[:3]):
            coords = route["geometry"]["coordinates"]  # Already in [lon, lat] format
            distance_m = route["distance"]
            duration_s = route["duration"]
            
            # Find segments near this route and calculate score
            nearby_segs = find_segments_near_route(coords)
            score, quality_score, pothole_count, bad_road_len, tags, warnings = calculate_route_score(
                distance_m, nearby_segs, preferences
            )
            
            # Add route-specific tags
            if idx == 0:
                # First OSRM route is typically the recommended one
                if preferences == "shortest":
                    tags = ["Fastest"] + [t for t in tags if t != "Best Surface"]
                else:
                    tags.insert(0, "Recommended")
            else:
                tags.insert(0, "Alternative")
            
            candidates.append({
                "route_id": route_labels[idx],
                "coords": coords,
                "distance_m": distance_m,
                "duration_s": duration_s,
                "score": score,
                "quality_score": quality_score,
                "tags": tags,
                "warnings": warnings,
                "source": "osrm",
            })
    else:
        # Fallback to math-based routes
        route_source = "fallback"
        candidates = _generate_fallback_routes(
            origin.lat, origin.lon,
            dest.lat, dest.lon,
            preferences
        )
    
    # Sort by score (lower is better)
    candidates.sort(key=lambda x: x["score"])
    
    # Get weather for the route
    mid_lat = (origin.lat + dest.lat) / 2
    mid_lon = (origin.lon + dest.lon) / 2
    weather = WeatherService.get_weather(mid_lat, mid_lon, lang)
    weather_summary = weather["summary"]
    cycling_recommendation = WeatherService.get_cycling_recommendation(weather, lang)
    
    # Build response with localized labels
    routes = []
    for rank, candidate in enumerate(candidates, start=1):
        # Translate tags
        tags_localized = translate_list(candidate["tags"], lang)
        
        # Translate warnings
        warnings_localized = []
        for w in candidate["warnings"]:
            w_copy = dict(w)
            w_copy["type_localized"] = translate(w["type"], lang)
            warnings_localized.append(w_copy)
        
        routes.append({
            "route_id": candidate["route_id"],
            "rank": rank,
            "total_distance": round(candidate["distance_m"], 1),
            "duration_s": round(candidate.get("duration_s", estimate_duration_s(candidate["distance_m"])), 1),
            "duration_display": _format_duration(candidate.get("duration_s", estimate_duration_s(candidate["distance_m"]))),
            "road_quality_score": round(candidate["quality_score"], 1),
            "tags": candidate["tags"],
            "tags_localized": tags_localized,
            "geometry": encode_polyline(candidate["coords"]),
            "geometry_geojson": {"type": "LineString", "coordinates": candidate["coords"]},
            "segments_warning": candidate["warnings"],
            "segments_warning_localized": warnings_localized,
            "source": candidate["source"],
        })
    
    return {
        "routes": routes,
        "weather_summary": weather_summary,
        "weather": weather,
        "cycling_recommendation": cycling_recommendation,
        "route_source": route_source,
    }


def _format_duration(seconds: float) -> str:
    """Format duration in seconds to human readable string."""
    minutes = int(seconds / 60)
    if minutes < 60:
        return f"{minutes} min"
    hours = minutes // 60
    mins = minutes % 60
    if mins == 0:
        return f"{hours} hr"
    return f"{hours} hr {mins} min"


# ---- Initialize demo data on startup ----
# This is called at module level after all classes are defined
seed_demo_data()
