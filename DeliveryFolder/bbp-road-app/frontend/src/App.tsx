import { useState, useEffect } from "react";
import Layout, { type NavKey } from "./Layout";
import DashboardPage from "./DashboardPage";
import SegmentsPage from "./SegmentsPage";
import ReportsPage from "./ReportsPage";
import TripsPage from "./TripsPage";
import TripHistoryPage from "./TripHistoryPage";
import AutoDetectionPage from "./AutoDetectionPage";
import SettingsPage from "./SettingsPage";
import RoutePlanningPage from "./RoutePlanningPage";
import LoginPage from "./LoginPage";
import { AppProvider, useAppContext } from "./AppContext";
import type { User } from "./api";

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);
  const { setUserId, darkMode } = useAppContext();

  // Sync userId with context when user logs in/out
  useEffect(() => {
    setUserId(user?.id ?? null);
  }, [user, setUserId]);

  if (!user) {
    return <LoginPage onLogin={(u) => setUser(u)} />;
  }

  return (
    <Layout
      userId={user.id}
      username={user.username}
      nav={nav}
      onNav={(k) => setNav(k)}
      onLogout={() => {
        setUser(null);
        setNav("dashboard");
        setSelectedSegmentId(null);
      }}
    >
      {nav === "dashboard" ? (
        <DashboardPage />
      ) : nav === "segments" ? (
        <SegmentsPage
          userId={user.id}
          selectedSegmentId={selectedSegmentId}
          onSelectSegment={(id) => setSelectedSegmentId(id)}
        />
      ) : nav === "reports" ? (
        <ReportsPage userId={user.id} selectedSegmentId={selectedSegmentId} />
      ) : nav === "route-planning" ? (
        <RoutePlanningPage />
      ) : nav === "trips" ? (
        <TripsPage userId={user.id} />
      ) : nav === "history" ? (
        <TripHistoryPage userId={user.id} />
      ) : nav === "detection" ? (
        <AutoDetectionPage userId={user.id} />
      ) : nav === "settings" ? (
        <SettingsPage userId={user.id} />
      ) : null}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
