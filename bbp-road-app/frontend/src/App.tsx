import { useState } from "react";
import Layout, { type NavKey } from "./Layout";
import DashboardPage from "./DashboardPage";
import SegmentsPage from "./SegmentsPage";
import ReportsPage from "./ReportsPage";
import TripsPage from "./TripsPage";
import TripHistoryPage from "./TripHistoryPage";
import AutoDetectionPage from "./AutoDetectionPage";
import SettingsPage from "./SettingsPage";
import LoginPage from "./LoginPage";
import type { User } from "./api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);

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
