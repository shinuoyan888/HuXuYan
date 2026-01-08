import { useEffect, useMemo, useState } from "react";
import { listSegments, listReports, type Report, type Segment } from "./api";
import MapView from "./MapView";

export default function DashboardPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const segs = await listSegments();
      setSegments(segs);

      const all: Report[] = [];
      for (const s of segs) {
        const rs = await listReports(s.id);
        all.push(...rs);
      }
      setReports(all);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const segTotal = segments.length;
    const repTotal = reports.length;
    const confirmed = reports.filter((r) => r.confirmed).length;
    const confirmRate = repTotal ? Math.round((confirmed / repTotal) * 100) : 0;

    const statusCount: Record<string, number> = {};
    for (const s of segments) {
      const key = s.status || "unknown";
      statusCount[key] = (statusCount[key] ?? 0) + 1;
    }

    return { segTotal, repTotal, confirmed, confirmRate, statusCount };
  }, [segments, reports]);

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

  const Card = (p: { title: string; value: string; sub?: string }) => (
    <div
      style={{
        background: "white",
        border: "1px solid #eee",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: "#555", fontWeight: 700 }}>{p.title}</div>
      <div style={{ marginTop: 8, fontSize: 32, fontWeight: 900, color: "#111" }}>{p.value}</div>
      {p.sub ? <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>{p.sub}</div> : null}
    </div>
  );

  return (
    <div style={{ color: "#111" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, color: "#111", fontSize: 34, fontWeight: 900 }}>Dashboard</h1>
          <div style={{ color: "#444", marginTop: 6 }}>
            Overview of users, segments, reports (BBP backend, in-memory).
          </div>
        </div>

        <button
          onClick={loadAll}
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

      {err ? (
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
      ) : null}

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Card title="Segments" value={String(stats.segTotal)} sub={`statuses: ${Object.keys(stats.statusCount).length}`} />
        <Card title="Reports" value={String(stats.repTotal)} sub="Total reports" />
        <Card title="Confirmed" value={String(stats.confirmed)} sub="Reports confirmed" />
        <Card title="Confirm Rate" value={`${stats.confirmRate}%`} sub="confirmed / total" />
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 14,
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ fontWeight: 900, color: "#111" }}>Segments Map</div>
        <MapView segments={mapSegments} height={320} />

        <div style={{ fontWeight: 900, color: "#111" }}>Segments List</div>
        <div style={{ display: "grid", gap: 10 }}>
          {segments.map((s) => (
            <div
              key={s.id}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #eee",
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>Segment #{s.id}</div>
                <div style={{ marginTop: 4 }}>user: {s.user_id}</div>
                <div style={{ marginTop: 4 }}>status: {s.status}</div>
                <div style={{ marginTop: 4 }}>
                  start: {s.start_lat.toFixed(4)}, {s.start_lon.toFixed(4)} → end: {s.end_lat.toFixed(4)}, {s.end_lon.toFixed(4)}
                </div>
                {s.obstacle ? <div style={{ marginTop: 4 }}>obstacle: {s.obstacle}</div> : null}
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>{s.created_at}</div>
            </div>
          ))}

          {segments.length === 0 ? <div style={{ color: "#666" }}>No segments yet.</div> : null}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: 16,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 14,
        }}
      >
        <div style={{ fontWeight: 900, color: "#111" }}>Latest reports</div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {reports
            .slice()
            .sort((a, b) => b.id - a.id)
            .slice(0, 6)
            .map((r) => (
              <div
                key={r.id}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #eee",
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 800 }}>
                    Report #{r.id} — Segment #{r.segment_id}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid " + (r.confirmed ? "#bbf7d0" : "#fee2e2"),
                      background: r.confirmed ? "#f0fdf4" : "#fff1f2",
                      color: r.confirmed ? "#166534" : "#9f1239",
                    }}
                  >
                    {r.confirmed ? "CONFIRMED" : "UNCONFIRMED"}
                  </div>
                </div>
                <div style={{ marginTop: 8, color: "#222" }}>{r.note}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>{r.created_at}</div>
              </div>
            ))}

          {reports.length === 0 ? <div style={{ color: "#666" }}>No reports yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
