import { useEffect, useMemo, useState } from "react";
import { createSegmentWithCoords, listSegments, type Segment } from "./api";
import MapView from "./MapView";

const STATUS_OPTIONS = ["optimal", "suboptimal", "maintenance"] as const;

type StatusOption = (typeof STATUS_OPTIONS)[number];

export default function SegmentsPage(props: {
  userId: number;
  selectedSegmentId: number | null;
  onSelectSegment: (id: number) => void;
}) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    status: "optimal" as StatusOption,
    obstacle: "",
    start_lat: 1.3521,
    start_lon: 103.8198,
    end_lat: 1.3621,
    end_lon: 103.8298,
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdcdc",
    background: "#fff",
    color: "#111",
  };

  async function loadSegments() {
    try {
      setError(null);
      const res = await listSegments();
      setSegments(res);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch segments");
    }
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const created = await createSegmentWithCoords({
        user_id: props.userId,
        start_lat: form.start_lat,
        start_lon: form.start_lon,
        end_lat: form.end_lat,
        end_lon: form.end_lon,
        status: form.status,
        obstacle: form.obstacle.trim() || null,
      });
      await loadSegments();
      props.onSelectSegment(created.id);
      setForm({ ...form, obstacle: "" });
    } catch (e: any) {
      setError(e.message ?? "Failed to create segment");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadSegments();
  }, []);

  const mapSegments = useMemo(
    () =>
      segments.map((s) => ({
        id: s.id,
        status: s.status,
        start: [s.start_lat, s.start_lon] as [number, number],
        end: [s.end_lat, s.end_lon] as [number, number],
      })),
    [segments]
  );

  const mapCenter: [number, number] = mapSegments[0]?.start ?? [form.start_lat, form.start_lon];

  return (
    <div style={{ color: "#111" }}>
      <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>Segments</h1>
      <p style={{ color: "#444", marginTop: 6 }}>Create a segment for the logged-in user and pick one for reports.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              border: "1px solid #eee",
              background: "#fff",
            }}
          >
            <h3>Create Segment</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input
                style={inputStyle}
                type="number"
                value={form.start_lat}
                onChange={(e) => setForm({ ...form, start_lat: Number(e.target.value) })}
                placeholder="start_lat"
              />
              <input
                style={inputStyle}
                type="number"
                value={form.start_lon}
                onChange={(e) => setForm({ ...form, start_lon: Number(e.target.value) })}
                placeholder="start_lon"
              />
              <input
                style={inputStyle}
                type="number"
                value={form.end_lat}
                onChange={(e) => setForm({ ...form, end_lat: Number(e.target.value) })}
                placeholder="end_lat"
              />
              <input
                style={inputStyle}
                type="number"
                value={form.end_lon}
                onChange={(e) => setForm({ ...form, end_lon: Number(e.target.value) })}
                placeholder="end_lon"
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: "#555" }}>Status</label>
              <select
                style={{ ...inputStyle, marginTop: 6 }}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as StatusOption })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: "#555" }}>Obstacle (optional)</label>
              <input
                style={{ ...inputStyle, marginTop: 6 }}
                placeholder="e.g. pothole"
                value={form.obstacle}
                onChange={(e) => setForm({ ...form, obstacle: e.target.value })}
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#111",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                opacity: creating ? 0.6 : 1,
              }}
            >
              {creating ? "Creating..." : "Create"}
            </button>

            {error && (
              <div style={{ marginTop: 12, color: "#b91c1c" }}>{error}</div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <strong>Selected segment:</strong> {props.selectedSegmentId ? `#${props.selectedSegmentId}` : "None"}
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <MapView segments={mapSegments} height={360} />

          {segments.map((s) => {
            const selected = s.id === props.selectedSegmentId;
            return (
              <div
                key={s.id}
                onClick={() => props.onSelectSegment(s.id)}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: selected ? "2px solid #111" : "1px solid #eee",
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                <strong>Segment #{s.id}</strong>
                <div>status: {s.status}</div>
                <div>user: {s.user_id}</div>
                <div>
                  start: {s.start_lat.toFixed(4)}, {s.start_lon.toFixed(4)} → end: {s.end_lat.toFixed(4)}, {s.end_lon.toFixed(4)}
                </div>
                {s.obstacle ? <div>obstacle: {s.obstacle}</div> : null}
                {s.created_at ? <div style={{ color: "#666", fontSize: 12 }}>{s.created_at}</div> : null}
              </div>
            );
          })}

          {segments.length === 0 ? <div style={{ color: "#666" }}>No segments yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
