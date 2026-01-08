import { useMemo, useState } from "react";
import MapView from "./MapView";

const API_BASE = "http://127.0.0.1:8000";

type TripResp = {
  distance_m: number;
  duration_s: number;
  geometry?: any; // GeoJSON LineString, coords: [lng, lat]
};

export default function TripsPage(props: { userId: number }) {
  const [originLat, setOriginLat] = useState(59.3293);
  const [originLng, setOriginLng] = useState(18.0686);
  const [destLat, setDestLat] = useState(59.332);
  const [destLng, setDestLng] = useState(18.0649);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TripResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdcdc",
    background: "#ffffff",
    color: "#111111",
    outline: "none",
  };

  async function plan() {
    setLoading(true);
    setErr(null);
    setResult(null);

    const qs = new URLSearchParams({
      owner_id: String(props.userId),
      origin_lat: String(originLat),
      origin_lng: String(originLng),
      dest_lat: String(destLat),
      dest_lng: String(destLng),
    });

    try {
      const url = `${API_BASE}/trips/plan?${qs.toString()}`;
      const res = await fetch(url, { method: "POST" });
      const text = await res.text();
      if (!res.ok) throw new Error(`POST /trips/plan failed: HTTP ${res.status}\n${text}`);
      setResult(JSON.parse(text));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to plan trip");
    } finally {
      setLoading(false);
    }
  }

  const km = result ? (result.distance_m / 1000).toFixed(2) : null;
  const min = result ? Math.round(result.duration_s / 60) : null;

  const tripLine: [number, number][] | null = useMemo(() => {
    const coords = result?.geometry?.coordinates;
    if (!Array.isArray(coords)) return null;
    // GeoJSON is [lng, lat] -> Leaflet wants [lat, lng]
    return coords.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
  }, [result]);

  const center: [number, number] = [originLat, originLng];
  const origin: [number, number] = [originLat, originLng];
  const dest: [number, number] = [destLat, destLng];

  return (
    <div style={{ color: "#111" }}>
      <h1 style={{ margin: 0, color: "#111", fontSize: 34, fontWeight: 800 }}>Trips</h1>
      <p style={{ color: "#444", marginTop: 8 }}>Plan a route (OSRM) and view it on the map.</p>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Left: planner + stats */}
        <div
          style={{
            padding: 16,
            background: "white",
            border: "1px solid #eee",
            borderRadius: 14,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 10, color: "#111" }}>Trip Planner</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>origin_lat</div>
              <input
                style={inputStyle}
                type="number"
                value={originLat}
                onChange={(e) => setOriginLat(Number(e.target.value))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>origin_lng</div>
              <input
                style={inputStyle}
                type="number"
                value={originLng}
                onChange={(e) => setOriginLng(Number(e.target.value))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>dest_lat</div>
              <input
                style={inputStyle}
                type="number"
                value={destLat}
                onChange={(e) => setDestLat(Number(e.target.value))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>dest_lng</div>
              <input
                style={inputStyle}
                type="number"
                value={destLng}
                onChange={(e) => setDestLng(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            onClick={plan}
            disabled={loading}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Planning..." : "Plan Trip"}
          </button>

          {err ? (
            <pre
              style={{
                marginTop: 12,
                whiteSpace: "pre-wrap",
                color: "#b91c1c",
                background: "#fff5f5",
                border: "1px solid #ffd6d6",
                padding: 10,
                borderRadius: 10,
                fontSize: 12,
              }}
            >
              {err}
            </pre>
          ) : null}

          {result ? (
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: 14, borderRadius: 14, background: "#fff", border: "1px solid #eee" }}>
                <div style={{ fontSize: 12, color: "#555" }}>Distance</div>
                <div style={{ marginTop: 6, fontSize: 26, fontWeight: 900, color: "#111" }}>
                  {km} km
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 14, background: "#fff", border: "1px solid #eee" }}>
                <div style={{ fontSize: 12, color: "#555" }}>Duration</div>
                <div style={{ marginTop: 6, fontSize: 26, fontWeight: 900, color: "#111" }}>
                  {min} min
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 14, color: "#666" }}>No trip yet. Click “Plan Trip”.</div>
          )}
        </div>

        {/* Right: map */}
        <MapView center={center} tripLine={tripLine ?? undefined} origin={origin} dest={dest} />
      </div>
    </div>
  );
}