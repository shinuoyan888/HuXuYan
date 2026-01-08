import { useEffect, useState } from "react";
import {
  listSegments,
  autoDetectSegment,
  applyDetection,
  listReports,
  autoConfirmReports,
  batchConfirmReports,
  type Segment,
  type Report,
  type DetectionResult,
} from "./api";

export default function AutoDetectionPage(props: { userId: number }) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadSegments() {
    setLoading(true);
    setErr(null);
    try {
      const data = await listSegments();
      setSegments(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load segments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSegments();
  }, []);

  async function handleSelectSegment(seg: Segment) {
    setSelectedSegment(seg);
    setDetection(null);
    setMessage(null);
    try {
      const reps = await listReports(seg.id);
      setReports(reps);
    } catch {
      setReports([]);
    }
  }

  async function handleDetect() {
    if (!selectedSegment) return;
    setDetecting(true);
    setErr(null);
    setMessage(null);
    try {
      const result = await autoDetectSegment(selectedSegment.id);
      setDetection(result);
    } catch (e: any) {
      setErr(e?.message ?? "Detection failed");
    } finally {
      setDetecting(false);
    }
  }

  async function handleApplyDetection() {
    if (!selectedSegment || !detection) return;
    try {
      await applyDetection(selectedSegment.id, detection.detected_status);
      setMessage(`Status updated to "${detection.detected_status}"`);
      // Reload segments
      const data = await listSegments();
      setSegments(data);
      const updated = data.find((s) => s.id === selectedSegment.id);
      if (updated) setSelectedSegment(updated);
      setDetection(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to apply");
    }
  }

  async function handleAutoConfirm() {
    if (!selectedSegment) return;
    try {
      const result = await autoConfirmReports(selectedSegment.id, 2);
      setMessage(`Auto-confirmed ${result.auto_confirmed} reports`);
      const reps = await listReports(selectedSegment.id);
      setReports(reps);
    } catch (e: any) {
      setErr(e?.message ?? "Auto-confirm failed");
    }
  }

  async function handleBatchConfirm() {
    const unconfirmed = reports.filter((r) => !r.confirmed).map((r) => r.id);
    if (unconfirmed.length === 0) {
      setMessage("No unconfirmed reports");
      return;
    }
    try {
      await batchConfirmReports(unconfirmed);
      setMessage(`Batch confirmed ${unconfirmed.length} reports`);
      if (selectedSegment) {
        const reps = await listReports(selectedSegment.id);
        setReports(reps);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Batch confirm failed");
    }
  }

  const statusColors: Record<string, string> = {
    optimal: "#22c55e",
    medium: "#eab308",
    suboptimal: "#f97316",
    maintenance: "#ef4444",
  };

  return (
    <div style={{ color: "#111" }}>
      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>Auto Detection & Confirmation</h1>
      <div style={{ color: "#444", marginTop: 6 }}>
        Automatically detect road segment status and confirm reports.
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

      {message && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 10,
            color: "#166534",
            fontWeight: 600,
          }}
        >
          ✓ {message}
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Segments List */}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 800 }}>Segments</div>
            <button
              onClick={loadSegments}
              disabled={loading}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                background: "white",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {loading ? "..." : "Refresh"}
            </button>
          </div>

          {segments.map((seg) => (
            <div
              key={seg.id}
              onClick={() => handleSelectSegment(seg)}
              style={{
                padding: 12,
                marginBottom: 8,
                borderRadius: 10,
                border: selectedSegment?.id === seg.id ? "2px solid #3b82f6" : "1px solid #eee",
                background: selectedSegment?.id === seg.id ? "#eff6ff" : "#fff",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>Segment #{seg.id}</div>
                <div
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: statusColors[seg.status] ?? "#666",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {seg.status}
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                {seg.start_lat.toFixed(4)}, {seg.start_lon.toFixed(4)} → {seg.end_lat.toFixed(4)}, {seg.end_lon.toFixed(4)}
              </div>
            </div>
          ))}
        </div>

        {/* Detection Panel */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* Auto-Detection */}
          <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>🔍 Auto-Detection</div>

            {!selectedSegment ? (
              <div style={{ color: "#666" }}>Select a segment to detect its status.</div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <strong>Selected:</strong> Segment #{selectedSegment.id} ({selectedSegment.status})
                </div>

                <button
                  onClick={handleDetect}
                  disabled={detecting}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: "#3b82f6",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: detecting ? 0.6 : 1,
                  }}
                >
                  {detecting ? "Detecting..." : "Run Detection"}
                </button>

                {detection && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      background: "#f9fafb",
                      borderRadius: 10,
                      border: "1px solid #e5e5e5",
                    }}
                  >
                    <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
                      <div>
                        <strong>Current:</strong> {detection.current_status}
                      </div>
                      <div>
                        <strong>Detected:</strong>{" "}
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: statusColors[detection.detected_status] ?? "#666",
                            color: "white",
                          }}
                        >
                          {detection.detected_status}
                        </span>
                      </div>
                      <div>
                        <strong>Confidence:</strong> {(detection.confidence * 100).toFixed(0)}%
                      </div>
                      <div>
                        <strong>Recommendation:</strong> {detection.recommendation}
                      </div>
                    </div>

                    {detection.recommendation === "update" && (
                      <button
                        onClick={handleApplyDetection}
                        style={{
                          marginTop: 12,
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "none",
                          background: "#22c55e",
                          color: "white",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Apply Detection
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Auto-Confirm Reports */}
          <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>✅ Auto-Confirm Reports</div>

            {!selectedSegment ? (
              <div style={{ color: "#666" }}>Select a segment to manage reports.</div>
            ) : (
              <>
                <div style={{ marginBottom: 10, fontSize: 14 }}>
                  <strong>Reports:</strong> {reports.length} total, {reports.filter((r) => r.confirmed).length} confirmed
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleAutoConfirm}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid #e5e5e5",
                      background: "white",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Auto-Confirm (threshold=2)
                  </button>
                  <button
                    onClick={handleBatchConfirm}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: "#111",
                      color: "white",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Confirm All
                  </button>
                </div>

                {reports.length > 0 && (
                  <div style={{ marginTop: 14, maxHeight: 150, overflow: "auto" }}>
                    {reports.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          padding: 8,
                          marginBottom: 6,
                          borderRadius: 6,
                          background: r.confirmed ? "#f0fdf4" : "#fff5f5",
                          border: `1px solid ${r.confirmed ? "#bbf7d0" : "#fecaca"}`,
                          fontSize: 12,
                        }}
                      >
                        Report #{r.id}: {r.note || "(no note)"} — {r.confirmed ? "✓ Confirmed" : "Unconfirmed"}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
