from __future__ import annotations

from sqlalchemy import Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .db import Base  # ✅ VERY IMPORTANT: use the SAME Base as db.py


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)

    segments = relationship("Segment", back_populates="owner")
    reports = relationship("Report", back_populates="author")


class Segment(Base):
    __tablename__ = "segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))

    start_lat: Mapped[float] = mapped_column(Float)
    start_lng: Mapped[float] = mapped_column(Float)
    end_lat: Mapped[float] = mapped_column(Float)
    end_lng: Mapped[float] = mapped_column(Float)

    status: Mapped[str] = mapped_column(String)
    obstacle_type: Mapped[str | None] = mapped_column(String, nullable=True)

    owner = relationship("User", back_populates="segments")
    reports = relationship("Report", back_populates="segment")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    segment_id: Mapped[int] = mapped_column(Integer, ForeignKey("segments.id"))
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))

    note: Mapped[str] = mapped_column(String)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    segment = relationship("Segment", back_populates="reports")
    author = relationship("User", back_populates="reports")