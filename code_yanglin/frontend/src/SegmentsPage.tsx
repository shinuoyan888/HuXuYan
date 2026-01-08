import { useEffect, useMemo, useState } from "react";
import MapView from "./MapView";

const API_BASE = "/api";

type Segment = {
  id: number;
  status: "optimal" | "medium" | "maintenance";
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  obstacle_type?: string | null;
};

export default function SegmentsPage(props: {
  userId: number;
  selectedSegmentId: number | null;
  onSelectSegment: (id: number) => void;
}) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    start_lat: 59.3293,
    start_lng: 18.0686,
    end_lat: 59.3315,
    end_lng: 18.0708,
    status: "optimal" as "optimal" | "medium" | "maintenance",
    obstacle_type: "",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdcdc",
    background: "#fff",
    color: "#111",
  };

  const selectStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdcdc",
    background: "#fff",
    color: "#111",
  };

  async function loadSegments() {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/segments`);
      if (!res.ok) throw new Error(`GET /segments failed (${res.status})`);
      setSegments(await res.json());
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch segments");
    }
  }

  async function createSegment() {
    setCreating(true);
    setError(null);

    const qs = new URLSearchParams({
      owner_id: String(props.userId),
      start_lat: String(form.start_lat),
      start_lng: String(form.start_lng),
      end_lat: String(form.end_lat),
      end_lng: String(form.end_lng),
      status: form.status,
    });

    if (form.obstacle_type.trim()) {
      qs.set("obstacle_type", form.obstacle_type.trim());
    }

    try {
      const res = await fetch(`${API_BASE}/segments?${qs.toString()}`, {
        method: "POST",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`POST /segments failed (${res.status}): ${t}`);
      }

      const created = await res.json();
      props.onSelectSegment(created.id);
      await loadSegments();
    } catch (e: any) {
      setError(e.message ?? "Failed to create segment");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadSegments();
  }, []);

  const mapCenter: [number, number] = useMemo(() => {
    const sel = segments.find((s) => s.id === props.selectedSegmentId);
    if (sel) return [sel.start_lat, sel.start_lng];
    return [form.start_lat, form.start_lng];
  }, [segments, props.selectedSegmentId, form]);

  return (
    <div style={{ color: "#111" }}>
      <h1 style={{ fontSize: 34, fontWeight: 800 }}>Segments</h1>
      <p style={{ color: "#444" }}>
        Create and select a segment. The selected one will be used in Reports.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* LEFT */}
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                style={inputStyle}
                type="number"
                value={form.start_lat}
                onChange={(e) => setForm({ ...form, start_lat: Number(e.target.value) })}
              />
              <input
                style={inputStyle}
                type="number"
                value={form.start_lng}
                onChange={(e) => setForm({ ...form, start_lng: Number(e.target.value) })}
              />
              <input
                style={inputStyle}
                type="number"
                value={form.end_lat}
                onChange={(e) => setForm({ ...form, end_lat: Number(e.target.value) })}
              />
              <input
                style={inputStyle}
                type="number"
                value={form.end_lng}
                onChange={(e) => setForm({ ...form, end_lng: Number(e.target.value) })}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <select
                style={selectStyle}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as any })
                }
              >
                <option value="optimal">optimal</option>
                <option value="medium">medium</option>
                <option value="maintenance">maintenance</option>
              </select>
            </div>

            <input
              style={{ ...inputStyle, marginTop: 10 }}
              placeholder="obstacle_type (optional)"
              value={form.obstacle_type}
              onChange={(e) =>
                setForm({ ...form, obstacle_type: e.target.value })
              }
            />

            <button
              onClick={createSegment}
              disabled={creating}
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#111",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {creating ? "Creating..." : "Create"}
            </button>

            {error && (
              <div style={{ marginTop: 12, color: "#b91c1c" }}>{error}</div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <strong>Selected segment:</strong>{" "}
            {props.selectedSegmentId
              ? `#${props.selectedSegmentId}`
              : "None"}
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
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
                  {s.obstacle_type && <div>obstacle: {s.obstacle_type}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <MapView
          center={mapCenter}
          segments={segments}
          selectedSegmentId={props.selectedSegmentId}
        />
      </div>
    </div>
  );
}