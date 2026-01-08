import type { ReactNode } from "react";

export type NavKey = "dashboard" | "segments" | "reports" | "trips";

export default function Layout(props: {
  userId: number;
  username: string;
  nav: NavKey;
  onNav: (k: NavKey) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const NavBtn = (p: { k: NavKey; label: string }) => {
    const active = props.nav === p.k;
    return (
      <button
        onClick={() => props.onNav(p.k)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "14px 14px",
          borderRadius: 14,
          border: "1px solid " + (active ? "#111" : "#e5e5e5"),
          background: active ? "#111" : "white",
          color: active ? "white" : "#111",
          cursor: "pointer",
          fontWeight: 800,
          fontSize: 18,
        }}
      >
        {p.label}
      </button>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "100vh" }}>
      <aside
        style={{
          padding: 18,
          background: "#f6f6f6",
          borderRight: "1px solid #eee",
        }}
      >
        <div style={{ fontSize: 12, color: "#555", fontWeight: 700 }}>
          User: {props.username} (#{props.userId})
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <NavBtn k="dashboard" label="Dashboard" />
          <NavBtn k="segments" label="Segments" />
          <NavBtn k="reports" label="Reports" />
          <NavBtn k="trips" label="Trips" />
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={props.onLogout}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid #e5e5e5",
              background: "white",
              color: "#111",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ marginTop: 18, color: "#888", fontSize: 12 }}>
          Backend: localhost:8000
        </div>
      </aside>

      <main style={{ padding: 22, background: "white", overflow: "auto" }}>
        {props.children}
      </main>
    </div>
  );
}