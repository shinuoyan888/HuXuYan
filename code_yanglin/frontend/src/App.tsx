import { useState } from "react";
import LoginPage from "./LoginPage";
import Layout, { type NavKey } from "./Layout";
import DashboardPage from "./DashboardPage";
import SegmentsPage from "./SegmentsPage";
import ReportsPage from "./ReportsPage";
import TripsPage from "./TripsPage";

type User = {
  id: number;
  username: string;
};

const NAV_TITLES: Record<NavKey, string> = {
  dashboard: "Dashboard",
  segments: "Segments",
  reports: "Reports",
  trips: "Trips",
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <Layout
      userId={user.id}
      username={user.username}
      nav={nav}
      onNav={setNav}
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
      ) : (
        <div>
          <h1 style={{ margin: 0 }}>{NAV_TITLES[nav]}</h1>
          <p style={{ color: "#666", marginTop: 8 }}>
            This page will be implemented next.
          </p>
        </div>
      )}
    </Layout>
  );
}