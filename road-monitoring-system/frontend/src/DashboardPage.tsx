import { useEffect, useMemo, useState } from "react";
import MapView from "./MapView";

type Segment = {
  id: number;
  status: "optimal" | "medium" | "maintenance";
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  obstacle_type?: string | null;
};

type Report = {
  id: number;
  segment_id: number;
  author_id: number;
  note: string;
  confirmed: boolean;
};

export default function DashboardPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function loadAll() {
    setErr(null);
    try {
      const segRes = await fetch("http://localhost:8000/segments");
      const segText = await segRes.text();
      if (!segRes.ok) throw new Error(`GET /segments failed: HTTP ${segRes.status}\n${segText}`);
      const segs = JSON.parse(segText) as Segment[];
      setSegments(segs);

      // load all reports by iterating segments
      const all: Report[] = [];
      for (const s of segs) {
        const rRes = await fetch(`http://localhost:8000/segments/${s.id}/reports`);
        const rText = await rRes.text();
        if (!rRes.ok) throw new Error(`GET reports failed: HTTP ${rRes.status}\n${rText}`);
        const rs = JSON.parse(rText) as Report[];
        all.push(...rs);
      }
      setReports(all);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load dashboard data");
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

    const statusCount = {
      optimal: segments.filter((s) => s.status === "optimal").length,
      medium: segments.filter((s) => s.status === "medium").length,
      maintenance: segments.filter((s) => s.status === "maintenance").length,
    };

    return { segTotal, repTotal, confirmed, confirmRate, statusCount };
  }, [segments, reports]);

  const center: [number, number] = useMemo(() => {
    if (segments.length) return [segments[0].start_lat, segments[0].start_lng];
    return [59.3293, 18.0686];
  }, [segments]);

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
            Real-time overview of segments, reports, confirmations.
          </div>
        </div>

        <button
          onClick={loadAll}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            background: "white",
            color: "#111",
            cursor: "pointer",
          }}
        >
          Refresh
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

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Card title="Segments" value={String(stats.segTotal)} sub={`optimal ${stats.statusCount.optimal} / medium ${stats.statusCount.medium} / maintenance ${stats.statusCount.maintenance}`} />
        <Card title="Reports" value={String(stats.repTotal)} sub="All segments combined" />
        <Card title="Confirmed" value={String(stats.confirmed)} sub="Reports marked as confirmed" />
        <Card title="Confirm Rate" value={`${stats.confirmRate}%`} sub="confirmed / total reports" />
      </div>

      <div style={{ marginTop: 14 }}>
        <MapView center={center} segments={segments} selectedSegmentId={null} />
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
                <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                  author: {r.author_id}
                </div>
              </div>
            ))}

          {reports.length === 0 ? <div style={{ color: "#666" }}>No reports yet.</div> : null}
        </div>
      </div>
    </div>
  );
}