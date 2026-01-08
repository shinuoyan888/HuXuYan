from __future__ import annotations

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import httpx

from .db import Base, engine, SessionLocal
from . import models

app = FastAPI(title="Road Monitoring System (Package Clean Version)")

# ✅ DEV CORS: allow any localhost port (5173/5175/3000 etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Health
# -----------------------------
@app.get("/")
def health():
    return {"ok": True}


# -----------------------------
# Users (login)
# -----------------------------
@app.post("/users")
def create_or_get_user(username: str, db: Session = Depends(get_db)):
    u = db.query(models.User).filter(models.User.username == username).first()
    if u:
        return {"id": u.id, "username": u.username}

    u = models.User(username=username)
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "username": u.username}


@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": u.id, "username": u.username}


# -----------------------------
# Segments
# (query params style to match your current frontend)
# -----------------------------
@app.post("/segments")
def create_segment(
    owner_id: int,
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
    status: str,
    obstacle_type: str | None = None,
    db: Session = Depends(get_db),
):
    # optional: validate status values
    if status not in ("optimal", "medium", "maintenance"):
        raise HTTPException(status_code=400, detail="Invalid status")

    seg = models.Segment(
        owner_id=owner_id,
        start_lat=start_lat,
        start_lng=start_lng,
        end_lat=end_lat,
        end_lng=end_lng,
        status=status,
        obstacle_type=obstacle_type,
    )
    db.add(seg)
    db.commit()
    db.refresh(seg)

    return {
        "id": seg.id,
        "owner_id": seg.owner_id,
        "start_lat": seg.start_lat,
        "start_lng": seg.start_lng,
        "end_lat": seg.end_lat,
        "end_lng": seg.end_lng,
        "status": seg.status,
        "obstacle_type": seg.obstacle_type,
    }


@app.get("/segments")
def list_segments(db: Session = Depends(get_db)):
    segs = db.query(models.Segment).order_by(models.Segment.id.asc()).all()
    return [
        {
            "id": s.id,
            "owner_id": s.owner_id,
            "start_lat": s.start_lat,
            "start_lng": s.start_lng,
            "end_lat": s.end_lat,
            "end_lng": s.end_lng,
            "status": s.status,
            "obstacle_type": s.obstacle_type,
        }
        for s in segs
    ]


# -----------------------------
# Reports
# -----------------------------
@app.post("/segments/{segment_id}/reports")
def create_report(segment_id: int, author_id: int, note: str, db: Session = Depends(get_db)):
    seg = db.query(models.Segment).filter(models.Segment.id == segment_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")

    r = models.Report(segment_id=segment_id, author_id=author_id, note=note, confirmed=False)
    db.add(r)
    db.commit()
    db.refresh(r)

    return {
        "id": r.id,
        "segment_id": r.segment_id,
        "author_id": r.author_id,
        "note": r.note,
        "confirmed": r.confirmed,
    }


@app.get("/segments/{segment_id}/reports")
def list_reports(segment_id: int, db: Session = Depends(get_db)):
    rs = (
        db.query(models.Report)
        .filter(models.Report.segment_id == segment_id)
        .order_by(models.Report.id.asc())
        .all()
    )
    return [
        {
            "id": r.id,
            "segment_id": r.segment_id,
            "author_id": r.author_id,
            "note": r.note,
            "confirmed": r.confirmed,
        }
        for r in rs
    ]


@app.patch("/reports/{report_id}/confirm")
def confirm_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    r.confirmed = True
    db.commit()
    db.refresh(r)
    return {"id": r.id, "confirmed": r.confirmed}


# -----------------------------
# Stats
# -----------------------------
@app.get("/segments/{segment_id}/stats")
def segment_stats(segment_id: int, db: Session = Depends(get_db)):
    total = db.query(models.Report).filter(models.Report.segment_id == segment_id).count()
    confirmed = (
        db.query(models.Report)
        .filter(models.Report.segment_id == segment_id, models.Report.confirmed == True)
        .count()
    )
    return {"segment_id": segment_id, "reports_total": total, "reports_confirmed": confirmed}


# -----------------------------
# Trips (OSRM)
# -----------------------------
@app.post("/trips/plan")
def plan_trip(owner_id: int, origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float):
    # OSRM expects lon,lat
    url = (
        "http://router.project-osrm.org/route/v1/driving/"
        f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
        "?overview=full&geometries=geojson"
    )
    try:
        r = httpx.get(url, timeout=20.0)
        r.raise_for_status()
        data = r.json()
        route = data["routes"][0]
        return {
            "distance_m": route["distance"],
            "duration_s": route["duration"],
            "geometry": route["geometry"],
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OSRM failed: {e}")