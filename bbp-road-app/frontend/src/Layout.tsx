import type { ReactNode } from "react";

export type NavKey = "dashboard" | "segments" | "reports" | "trips" | "history" | "detection" | "settings";

export default function Layout(props: {
  userId: number;
  username: string;
  nav: NavKey;
  onNav: (k: NavKey) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
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
          border: "1px solid " + (active ? "#111" : "#e5e5e5"),
          background: active ? "#111" : "white",
          color: active ? "white" : "#111",
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
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "100vh" }}>
      <aside
        style={{
          padding: 16,
          background: "#f6f6f6",
          borderRight: "1px solid #eee",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 12, color: "#555", fontWeight: 700 }}>
          User: {props.username} (#{props.userId})
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          <NavBtn k="dashboard" label="Dashboard" icon="📊" />
          <NavBtn k="segments" label="Segments" icon="🛣️" />
          <NavBtn k="reports" label="Reports" icon="📝" />
          <NavBtn k="trips" label="Plan Trip" icon="🗺️" />
          <NavBtn k="history" label="Trip History" icon="📜" />
          <NavBtn k="detection" label="Auto Detection" icon="🔍" />
          <NavBtn k="settings" label="Settings" icon="⚙️" />
        </div>

        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <button
            onClick={props.onLogout}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #e5e5e5",
              background: "white",
              color: "#111",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            🚪 Logout
          </button>

          <div style={{ marginTop: 12, color: "#888", fontSize: 11 }}>
            Backend: http://127.0.0.1:8000
          </div>
        </div>
      </aside>

      <main style={{ padding: 22, background: "white", overflow: "auto" }}>{props.children}</main>
    </div>
  );
}
