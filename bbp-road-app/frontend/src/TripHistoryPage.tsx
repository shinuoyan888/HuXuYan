import { useEffect, useMemo, useState } from "react";
import { listTrips, deleteTrip, type Trip } from "./api";
import MapView from "./MapView";

export default function TripHistoryPage(props: { userId: number }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  async function loadTrips() {
    setLoading(true);
    setErr(null);
    try {
      const data = await listTrips(props.userId);
      setTrips(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, [props.userId]);

  async function handleDelete(tripId: number) {
    if (!confirm(`Delete trip #${tripId}?`)) return;
    try {
      await deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      if (selectedTrip?.id === tripId) setSelectedTrip(null);
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete");
    }
  }

  const tripLine: [number, number][] | null = useMemo(() => {
    const coords = selectedTrip?.geometry?.coordinates;
    if (!Array.isArray(coords)) return null;
    return coords.map(([lon, lat]) => [lat, lon]);
  }, [selectedTrip]);

  const origin: [number, number] | undefined = selectedTrip
    ? [selectedTrip.from_lat, selectedTrip.from_lon]
    : undefined;
  const dest: [number, number] | undefined = selectedTrip
    ? [selectedTrip.to_lat, selectedTrip.to_lon]
    : undefined;

  const totalKm = trips.reduce((acc, t) => acc + t.distance_m, 0) / 1000;
  const totalMin = trips.reduce((acc, t) => acc + t.duration_s, 0) / 60;

  return (
    <div style={{ color: "#111" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>Trip History</h1>
          <div style={{ color: "#444", marginTop: 6 }}>
            View and manage your recorded trips.
          </div>
        </div>
        <button
          onClick={loadTrips}
          disabled={loading}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            background: "white",
            color: "#111",
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && (
        <pre
          style={{
            marginTop: 12,
            whiteSpace: "pre-wrap",
            color: "#b91c1c",
            background: "#fff5f5",
            border: "1px solid #ffd6d6",
            padding: 12,
            borderRadius: 10,
            fontSize: 12,
          }}
        >
          {err}
        </pre>
      )}

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        <div style={{ padding: 14, background: "white", border: "1px solid #eee", borderRadius: 14 }}>
          <div style={{ fontSize: 12, color: "#555" }}>Total Trips</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900 }}>{trips.length}</div>
        </div>
        <div style={{ padding: 14, background: "white", border: "1px solid #eee", borderRadius: 14 }}>
          <div style={{ fontSize: 12, color: "#555" }}>Total Distance</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900 }}>{totalKm.toFixed(1)} km</div>
        </div>
        <div style={{ padding: 14, background: "white", border: "1px solid #eee", borderRadius: 14 }}>
          <div style={{ fontSize: 12, color: "#555" }}>Total Duration</div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900 }}>{Math.round(totalMin)} min</div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div
          style={{
            background: "white",
            border: "1px solid #eee",
            borderRadius: 14,
            padding: 16,
            maxHeight: 500,
            overflow: "auto",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Your Trips</div>
          {trips.length === 0 && <div style={{ color: "#666" }}>No trips recorded yet.</div>}
          {trips.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTrip(t)}
              style={{
                padding: 12,
                marginBottom: 8,
                borderRadius: 10,
                border: selectedTrip?.id === t.id ? "2px solid #3b82f6" : "1px solid #eee",
                background: selectedTrip?.id === t.id ? "#eff6ff" : "#fff",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>Trip #{t.id}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(t.id);
                  }}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#991b1b",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Delete
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "#444" }}>
                {(t.distance_m / 1000).toFixed(2)} km • {Math.round(t.duration_s / 60)} min
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: "#666" }}>
                {t.from_lat.toFixed(4)}, {t.from_lon.toFixed(4)} → {t.to_lat.toFixed(4)}, {t.to_lon.toFixed(4)}
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: "#999" }}>{t.created_at}</div>
            </div>
          ))}
        </div>

        <div>
          {selectedTrip ? (
            <MapView line={tripLine ?? undefined} origin={origin} dest={dest} height={460} />
          ) : (
            <div
              style={{
                height: 460,
                background: "#f9fafb",
                border: "1px solid #eee",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
              }}
            >
              Select a trip to view on map
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
