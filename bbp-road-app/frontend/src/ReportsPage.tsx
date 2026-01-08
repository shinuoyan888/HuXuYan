import { useEffect, useState } from "react";
import { aggregateSegment, confirmReport, createReport, listReports, type Aggregate, type Report } from "./api";

export default function ReportsPage(props: { userId: number; selectedSegmentId: number | null }) {
  const [note, setNote] = useState("Road feels bumpy today");
  const [reports, setReports] = useState<Report[]>([]);
  const [agg, setAgg] = useState<Aggregate | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdcdc",
    background: "#ffffff",
    color: "#111111",
    outline: "none",
  };

  async function refresh() {
    setErr(null);
    setMsg(null);

    if (!props.selectedSegmentId) {
      setReports([]);
      setAgg(null);
      return;
    }

    try {
      const [rs, ag] = await Promise.all([
        listReports(props.selectedSegmentId),
        aggregateSegment(props.selectedSegmentId),
      ]);
      setReports(rs);
      setAgg(ag);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load reports");
    }
  }

  async function create() {
    if (!props.selectedSegmentId) return;

    setSubmitting(true);
    setErr(null);
    setMsg(null);

    try {
      await createReport(props.selectedSegmentId, { note });
      setNote("");
      setMsg("✅ Report submitted");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create report");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirm(reportId: number) {
    setErr(null);
    setMsg(null);

    try {
      await confirmReport(reportId);
      setMsg(`✅ Confirmed report #${reportId}`);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to confirm report");
    }
  }

  useEffect(() => {
    refresh();
  }, [props.selectedSegmentId]);

  if (!props.selectedSegmentId) {
    return (
      <div style={{ color: "#111" }}>
        <h1 style={{ margin: 0, color: "#111", fontSize: 34, fontWeight: 800 }}>Reports</h1>
        <p style={{ color: "#444", marginTop: 8 }}>
          Please go to <b>Segments</b> and select a segment first.
        </p>
      </div>
    );
  }

  return (
    <div style={{ color: "#111" }}>
      <h1 style={{ margin: 0, color: "#111", fontSize: 34, fontWeight: 800 }}>Reports</h1>
      <p style={{ color: "#444", marginTop: 8 }}>
        Segment: <span style={{ fontFamily: "monospace", color: "#111" }}>#{props.selectedSegmentId}</span>
      </p>

      {agg ? (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", background: "#fff" }}>
            <div style={{ fontSize: 12, color: "#555" }}>Reports total</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{agg.reports_total}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", background: "#fff" }}>
            <div style={{ fontSize: 12, color: "#555" }}>Confirmed</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{agg.reports_confirmed}</div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 14,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10, color: "#111" }}>Create Report</div>

        <input
          style={inputStyle}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe the issue..."
        />

        <button
          onClick={create}
          disabled={submitting || !note.trim()}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            cursor: "pointer",
            opacity: submitting || !note.trim() ? 0.6 : 1,
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>

        <button
          onClick={refresh}
          style={{
            marginTop: 12,
            marginLeft: 10,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            background: "white",
            color: "#111",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>

        {msg ? (
          <pre
            style={{
              marginTop: 12,
              whiteSpace: "pre-wrap",
              background: "#f7f7f7",
              border: "1px solid #eee",
              padding: 10,
              borderRadius: 10,
              fontSize: 12,
              color: "#166534",
            }}
          >
            {msg}
          </pre>
        ) : null}

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
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {reports.map((r) => (
          <div
            key={r.id}
            style={{
              padding: 14,
              borderRadius: 14,
              background: "white",
              border: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: "#111" }}>Report #{r.id}</div>
              <div style={{ color: "#222", marginTop: 6 }}>{r.note}</div>
              <div style={{ color: "#555", marginTop: 6, fontSize: 12 }}>
                confirmed: <b>{String(r.confirmed)}</b>
              </div>
            </div>

            {!r.confirmed ? (
              <button
                onClick={() => confirm(r.id)}
                style={{
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e5e5",
                  background: "white",
                  color: "#111",
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
            ) : (
              <div
                style={{
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Confirmed
              </div>
            )}
          </div>
        ))}

        {reports.length === 0 ? <div style={{ color: "#666" }}>No reports yet.</div> : null}
      </div>
    </div>
  );
}
