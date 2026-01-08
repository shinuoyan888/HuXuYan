import { useMemo, useState } from "react";
import MapView from "./MapView";
import { createTrip, type Trip } from "./api";

export default function TripsPage(props: { userId: number }) {
  const [originLat, setOriginLat] = useState(1.3521);
  const [originLng, setOriginLng] = useState(103.8198);
  const [destLat, setDestLat] = useState(1.332);
  const [destLng, setDestLng] = useState(103.903);
  const [useOsrm, setUseOsrm] = useState(true);
  const [plannedMode, setPlannedMode] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Trip | null>(null);
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
    setPlannedMode(null);

    try {
      const trip = await createTrip({
        user_id: props.userId,
        from_lat: originLat,
        from_lon: originLng,
        to_lat: destLat,
        to_lon: destLng,
        use_osrm: useOsrm,
      });
      setResult(trip);
      setPlannedMode(useOsrm);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to plan trip");
    } finally {
      setLoading(false);
    }
  }

  const km = result ? (result.distance_m / 1000).toFixed(2) : null;
  const min = result ? Math.round(result.duration_s / 60) : null;
  const modeLabel = plannedMode ?? useOsrm;

  const tripLine: [number, number][] | null = useMemo(() => {
    const coords = result?.geometry?.coordinates;
    if (!Array.isArray(coords)) return null;
    return coords.map(([lon, lat]) => [lat, lon]);
  }, [result]);

  const origin: [number, number] = [originLat, originLng];
  const dest: [number, number] = [destLat, destLng];

  return (
    <div style={{ color: "#111" }}>
      <h1 style={{ margin: 0, color: "#111", fontSize: 34, fontWeight: 800 }}>Trips</h1>
      <p style={{ color: "#444", marginTop: 8 }}>Plan a route using the BBP backend and visualize the LineString.</p>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>from_lat</div>
              <input
                style={inputStyle}
                type="number"
                value={originLat}
                onChange={(e) => setOriginLat(Number(e.target.value))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>from_lon</div>
              <input
                style={inputStyle}
                type="number"
                value={originLng}
                onChange={(e) => setOriginLng(Number(e.target.value))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>to_lat</div>
              <input
                style={inputStyle}
                type="number"
                value={destLat}
                onChange={(e) => setDestLat(Number(e.target.value))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>to_lon</div>
              <input
                style={inputStyle}
                type="number"
                value={destLng}
                onChange={(e) => setDestLng(Number(e.target.value))}
              />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, color: "#222", fontWeight: 600 }}>
            <input type="checkbox" checked={useOsrm} onChange={(e) => setUseOsrm(e.target.checked)} />
            Use OSRM routing (falls back to straight line)
          </label>

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

              <div style={{ padding: 14, borderRadius: 14, background: "#fff", border: "1px solid #eee" }}>
                <div style={{ fontSize: 12, color: "#555" }}>Routing mode</div>
                <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800, color: "#111" }}>
                  {modeLabel ? "OSRM (fallback enabled)" : "Straight line"}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                  geometry points: {result.geometry?.coordinates?.length ?? 0}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 14, color: "#666" }}>No trip yet. Click “Plan Trip”.</div>
          )}
        </div>

        <MapView line={tripLine ?? undefined} origin={origin} dest={dest} />
      </div>
    </div>
  );
}
