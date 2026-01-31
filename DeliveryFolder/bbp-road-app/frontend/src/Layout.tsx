import { useState, useEffect, type ReactNode } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false); // Close sidebar on desktop
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        onClick={() => {
          props.onNav(p.k);
          if (isMobile) setSidebarOpen(false); // Close sidebar on mobile after navigation
        }}
        style={{
          width: "100%",
          textAlign: "left",
          padding: isMobile ? "14px 16px" : "12px 14px",
          borderRadius: 12,
          border: "1px solid " + (active ? colors.buttonActiveBorder : colors.buttonBorder),
          background: active ? colors.buttonActiveBg : colors.buttonBg,
          color: active ? "white" : colors.text,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: isMobile ? 16 : 15,
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

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = () => (
    <>
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
          onClick={() => {
            props.onLogout();
            if (isMobile) setSidebarOpen(false);
          }}
          style={{
            width: "100%",
            padding: isMobile ? "14px 16px" : "12px 14px",
            borderRadius: 12,
            border: "1px solid " + colors.buttonBorder,
            background: colors.buttonBg,
            color: colors.text,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: isMobile ? 16 : 14,
          }}
        >
          🚪 {t("Logout")}
        </button>
      </div>
    </>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", flexDirection: "column" }}>
        {/* Mobile Header */}
        <header
          style={{
            padding: "12px 16px",
            background: colors.sidebar,
            borderBottom: "1px solid " + colors.sidebarBorder,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid " + colors.buttonBorder,
              background: colors.buttonBg,
              color: colors.text,
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ☰
          </button>
          <div style={{ fontWeight: 700, color: colors.text, fontSize: 14 }}>
            {props.username}
          </div>
          <div style={{ width: 44 }}></div> {/* Spacer for centering */}
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 200,
              }}
            />
            {/* Sidebar */}
            <aside
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "280px",
                maxWidth: "80vw",
                height: "100vh",
                padding: 16,
                background: colors.sidebar,
                borderRight: "1px solid " + colors.sidebarBorder,
                display: "flex",
                flexDirection: "column",
                zIndex: 300,
                overflowY: "auto",
              }}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  alignSelf: "flex-end",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid " + colors.buttonBorder,
                  background: colors.buttonBg,
                  color: colors.text,
                  cursor: "pointer",
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                ✕
              </button>
              <SidebarContent />
            </aside>
          </>
        )}

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            padding: 16,
            background: colors.mainBg,
            overflow: "auto",
            color: colors.text,
          }}
        >
          {props.children}
        </main>
      </div>
    );
  }

  // Desktop layout
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
        <SidebarContent />
      </aside>

      <main style={{ padding: 22, background: colors.mainBg, overflow: "auto", color: colors.text }}>{props.children}</main>
    </div>
  );
}
