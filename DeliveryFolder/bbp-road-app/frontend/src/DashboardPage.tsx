import { useEffect, useMemo, useState } from "react";
import { listSegments, listReports, getStats, triggerAggregationAll, type Report, type Segment, type Stats, type AggregationResult } from "./api";
import MapView from "./MapView";
import { useAppContext } from "./AppContext";

export default function DashboardPage() {
  const { darkMode, t } = useAppContext();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [aggregating, setAggregating] = useState(false);
  const [aggregationResult, setAggregationResult] = useState<{ segments_processed: number; status_changes: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Dark mode colors
  const colors = darkMode
    ? {
        text: "#e5e5e5",
        textMuted: "#a0a0a0",
        cardBg: "#16213e",
        cardBorder: "#0f3460",
        buttonBg: "#0f3460",
        buttonBorder: "#0f3460",
      }
    : {
        text: "#111",
        textMuted: "#666",
        cardBg: "white",
        cardBorder: "#eee",
        buttonBg: "white",
        buttonBorder: "#e5e5e5",
      };

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const [segs, statsData] = await Promise.all([
        listSegments(),
        getStats(),
      ]);
      setSegments(segs);
      setStats(statsData);

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

  async function handleTriggerAggregation() {
    setAggregating(true);
    setAggregationResult(null);
    setErr(null);
    try {
      const result = await triggerAggregationAll();
      setAggregationResult({
        segments_processed: result.segments_processed,
        status_changes: result.status_changes,
      });
      // Reload data to reflect status changes
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to trigger aggregation");
    } finally {
      setAggregating(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const localStats = useMemo(() => {
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
        background: colors.cardBg,
        border: "1px solid " + colors.cardBorder,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700 }}>{p.title}</div>
      <div style={{ marginTop: 8, fontSize: 32, fontWeight: 900, color: colors.text }}>{p.value}</div>
      {p.sub ? <div style={{ marginTop: 6, fontSize: 12, color: colors.textMuted }}>{p.sub}</div> : null}
    </div>
  );

  return (
    <div style={{ color: colors.text }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, color: colors.text, fontSize: 34, fontWeight: 900 }}>{t("Dashboard")}</h1>
          <div style={{ color: colors.textMuted, marginTop: 6 }}>
            {t("Overview of users, segments, reports (BBP backend, in-memory).")}
          </div>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid " + colors.buttonBorder,
            background: colors.buttonBg,
            color: colors.text,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
            marginRight: 8,
          }}
        >
          {loading ? t("Loading") + "..." : t("Refresh")}
        </button>

        <button
          onClick={handleTriggerAggregation}
          disabled={aggregating}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            opacity: aggregating ? 0.6 : 1,
            fontWeight: 600,
          }}
        >
          {aggregating ? t("Aggregating...") : "🔄 " + t("Trigger Aggregation")}
        </button>
      </div>

      {aggregationResult && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: darkMode ? "#1a3d2e" : "#f0fdf4",
            border: "1px solid " + (darkMode ? "#2d5a43" : "#bbf7d0"),
            borderRadius: 10,
            color: darkMode ? "#7dd3a8" : "#166534",
          }}
        >
          ✓ {t("Aggregation complete")}: <strong>{aggregationResult.segments_processed}</strong> {t("segments processed")},{" "}
          <strong>{aggregationResult.status_changes}</strong> {t("status changes")}
        </div>
      )}

      {err ? (
        <pre
          style={{
            marginTop: 12,
            whiteSpace: "pre-wrap",
            color: "#b91c1c",
            background: darkMode ? "#3d1a1a" : "#fff5f5",
            border: "1px solid " + (darkMode ? "#5c2828" : "#ffd6d6"),
            padding: 12,
            borderRadius: 10,
            fontSize: 12,
          }}
        >
          {err}
        </pre>
      ) : null}

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Card title={t("Segments")} value={String(localStats.segTotal)} sub={`${t("statuses")}: ${Object.keys(localStats.statusCount).length}`} />
        <Card title={t("Reports")} value={String(localStats.repTotal)} sub={t("Total reports")} />
        <Card title={t("Confirmed")} value={String(localStats.confirmed)} sub={t("Reports confirmed")} />
        <Card title={t("Confirm Rate")} value={`${localStats.confirmRate}%`} sub={t("confirmed / total")} />
        {stats && (
          <>
            <Card title={t("Total Users")} value={String(stats.users)} sub={t("Registered users")} />
            <Card title={t("Total Trips")} value={String(stats.trips)} sub={`${stats.total_distance_km.toFixed(1)} km ${t("total")}`} />
          </>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: colors.cardBg,
          border: "1px solid " + colors.cardBorder,
          borderRadius: 14,
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ fontWeight: 900, color: colors.text }}>{t("Segments Map")}</div>
        <MapView segments={mapSegments} height={320} />

        <div style={{ fontWeight: 900, color: colors.text }}>{t("Segments List")}</div>
        <div style={{ display: "grid", gap: 10 }}>
          {segments.map((s) => (
            <div
              key={s.id}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid " + colors.cardBorder,
                background: colors.cardBg,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 800 }}>{t("Segment")} #{s.id}</div>
                <div style={{ marginTop: 4 }}>{t("User")}: {s.user_id}</div>
                <div style={{ marginTop: 4 }}>{t("status")}: {s.status}</div>
                <div style={{ marginTop: 4 }}>
                  {t("start")}: {s.start_lat.toFixed(4)}, {s.start_lon.toFixed(4)} → {t("end")}: {s.end_lat.toFixed(4)}, {s.end_lon.toFixed(4)}
                </div>
                {s.obstacle ? <div style={{ marginTop: 4 }}>{t("obstacle")}: {s.obstacle}</div> : null}
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>{s.created_at}</div>
            </div>
          ))}

          {segments.length === 0 ? <div style={{ color: colors.textMuted }}>{t("No segments yet.")}</div> : null}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: 16,
          background: colors.cardBg,
          border: "1px solid " + colors.cardBorder,
          borderRadius: 14,
        }}
      >
        <div style={{ fontWeight: 900, color: colors.text }}>{t("Latest reports")}</div>
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
                  border: "1px solid " + colors.cardBorder,
                  background: colors.cardBg,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 800 }}>
                    {t("Report")} #{r.id} — {t("Segment")} #{r.segment_id}
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
                    {r.confirmed ? t("CONFIRMED") : t("UNCONFIRMED")}
                  </div>
                </div>
                <div style={{ marginTop: 8, color: colors.text }}>{r.note}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: colors.textMuted }}>{r.created_at}</div>
              </div>
            ))}

          {reports.length === 0 ? <div style={{ color: colors.textMuted }}>{t("No reports yet.")}</div> : null}
        </div>
      </div>
    </div>
  );
}
