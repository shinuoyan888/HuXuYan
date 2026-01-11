import type { ReactNode } from "react";
import { useAppContext } from "./AppContext";

export type NavKey = "dashboard" | "segments" | "reports" | "trips" | "history" | "detection" | "settings" | "route-planning";

export default function Layout(props: {
  userId: number;
  username: string;
  nav: NavKey;
  onNav: (k: NavKey) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const { darkMode, t } = useAppContext();

  // Dark mode colors
  const colors = darkMode
    ? {
        bg: "#1a1a2e",
        sidebar: "#16213e",
        sidebarBorder: "#0f3460",
        text: "#e5e5e5",
        textMuted: "#a0a0a0",
        buttonBg: "#0f3460",
        buttonBorder: "#0f3460",
        buttonActiveBg: "#e94560",
        buttonActiveBorder: "#e94560",
        mainBg: "#1a1a2e",
      }
    : {
        bg: "#ffffff",
        sidebar: "#f6f6f6",
        sidebarBorder: "#eee",
        text: "#111",
        textMuted: "#555",
        buttonBg: "white",
        buttonBorder: "#e5e5e5",
        buttonActiveBg: "#111",
        buttonActiveBorder: "#111",
        mainBg: "white",
      };

  const NavBtn = (p: { k: NavKey; label: string; icon?: string }) => {
    const active = props.nav === p.k;
    return (
      <button
        onClick={() => props.onNav(p.k)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid " + (active ? colors.buttonActiveBorder : colors.buttonBorder),
          background: active ? colors.buttonActiveBg : colors.buttonBg,
          color: active ? "white" : colors.text,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {p.icon && <span>{p.icon}</span>}
        {p.label}
      </button>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "100vh", background: colors.bg }}>
      <aside
        style={{
          padding: 16,
          background: colors.sidebar,
          borderRight: "1px solid " + colors.sidebarBorder,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700 }}>
          {t("User")}: {props.username} (#{props.userId})
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          <NavBtn k="dashboard" label={t("Dashboard")} icon="📊" />
          <NavBtn k="segments" label={t("Segments")} icon="🛣️" />
          <NavBtn k="reports" label={t("Reports")} icon="📝" />
          <NavBtn k="route-planning" label={t("Route Planning")} icon="🧭" />
          <NavBtn k="trips" label={t("Plan Trip")} icon="🗺️" />
          <NavBtn k="history" label={t("Trip History")} icon="📜" />
          <NavBtn k="detection" label={t("Auto Detection")} icon="🔍" />
          <NavBtn k="settings" label={t("Settings")} icon="⚙️" />
        </div>

        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <button
            onClick={props.onLogout}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid " + colors.buttonBorder,
              background: colors.buttonBg,
              color: colors.text,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            🚪 {t("Logout")}
          </button>

          <div style={{ marginTop: 12, color: colors.textMuted, fontSize: 11 }}>
            {t("Backend")}: http://127.0.0.1:8000
          </div>
        </div>
      </aside>

      <main style={{ padding: 22, background: colors.mainBg, overflow: "auto", color: colors.text }}>{props.children}</main>
    </div>
  );
}
