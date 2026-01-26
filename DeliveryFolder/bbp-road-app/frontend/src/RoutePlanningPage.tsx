import { useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { searchRoutes, type ScoredRoute, type PathSearchPreference, type Weather, type PathSearchResponse } from "./api";
import { useAppContext } from "./AppContext";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const originIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const destIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitBounds(props: { routes: ScoredRoute[]; origin: [number, number]; dest: [number, number] }) {
  const map = useMap();
  useMemo(() => {
    const pts: [number, number][] = [props.origin, props.dest];
    props.routes.forEach((r) => {
      r.geometry_geojson.coordinates.forEach(([lon, lat]) => {
        pts.push([lat, lon]);
      });
    });
    if (pts.length > 2) {
      const bounds = L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, props.routes, props.origin, props.dest]);
  return null;
}

const ROUTE_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6"];

function RouteTag(props: { tag: string }) {
  const tagColors: Record<string, { bg: string; text: string }> = {
    "Best Surface": { bg: "#dcfce7", text: "#166534" },
    "Shortest": { bg: "#dbeafe", text: "#1e40af" },
    "Slightly Longer": { bg: "#fef3c7", text: "#92400e" },
    "Bumpy": { bg: "#fee2e2", text: "#991b1b" },
    "Road Work": { bg: "#fce7f3", text: "#9d174d" },
  };
  const colors = tagColors[props.tag] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: colors.bg,
        color: colors.text,
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      {props.tag}
    </span>
  );
}

export default function RoutePlanningPage() {
  const { darkMode } = useAppContext();
  // Default to Singapore coordinates
  const [originLat, setOriginLat] = useState(1.3521);
  const [originLon, setOriginLon] = useState(103.8198);
  const [destLat, setDestLat] = useState(1.332);
  const [destLon, setDestLon] = useState(103.903);
  const [preference, setPreference] = useState<PathSearchPreference>("balanced");

  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<ScoredRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [cyclingRecommendation, setCyclingRecommendation] = useState<string | null>(null);
  const [routeSource, setRouteSource] = useState<string | null>(null);

  // Dark mode colors
  const colors = darkMode
    ? {
        text: "#e5e5e5",
        textMuted: "#a0a0a0",
        cardBg: "#16213e",
        cardBorder: "#0f3460",
      }
    : {
        text: "#111",
        textMuted: "#666",
        cardBg: "white",
        cardBorder: "#eee",
      };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #dcdcdc",
    background: "#ffffff",
    color: "#111111",
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
  };

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setRoutes([]);
    setSelectedRouteId(null);
    setWeather(null);
    setCyclingRecommendation(null);
    setRouteSource(null);

    try {
      const result = await searchRoutes(
        { lat: originLat, lon: originLon },
        { lat: destLat, lon: destLon },
        preference
      );
      setRoutes(result.routes);
      if (result.routes.length > 0) {
        setSelectedRouteId(result.routes[0].route_id);
      }
      // Set weather info
      if (result.weather) {
        setWeather(result.weather);
      }
      if (result.cycling_recommendation) {
        setCyclingRecommendation(result.cycling_recommendation);
      }
      if (result.route_source) {
        setRouteSource(result.route_source);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to search routes");
    } finally {
      setLoading(false);
    }
  }

  const origin: [number, number] = [originLat, originLon];
  const dest: [number, number] = [destLat, destLon];
  const center: [number, number] = [(originLat + destLat) / 2, (originLon + destLon) / 2];

  const routeLines = useMemo(() => {
    return routes.map((route) => {
      const coords = route.geometry_geojson.coordinates.map(
        ([lon, lat]) => [lat, lon] as [number, number]
      );
      return { ...route, coords };
    });
  }, [routes]);

  const selectedRoute = routes.find((r) => r.route_id === selectedRouteId);

  return (
    <div>
      <h1 style={{ margin: 0, color: darkMode ? "#e5e5e5" : "#111", fontSize: 34, fontWeight: 800 }}>
        Route Planning & Scoring
      </h1>
      <p style={{ color: darkMode ? "#d0d0d0" : "#444", marginTop: 8 }}>
        Plan routes with intelligent scoring based on road quality and pothole data.
      </p>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        {/* Left Panel - Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Search Form */}
          <div
            style={{
              padding: 14,
              background: "white",
              border: "1px solid #eee",
              borderRadius: 14,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 12, color: "#111", fontSize: 15 }}>
              🗺️ Route Search
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 4, fontWeight: 600 }}>
                Origin (起点)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.0001"
                  placeholder="Latitude"
                  value={originLat}
                  onChange={(e) => setOriginLat(Number(e.target.value))}
                />
                <input
                  style={inputStyle}
                  type="number"
                  step="0.0001"
                  placeholder="Longitude"
                  value={originLon}
                  onChange={(e) => setOriginLon(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 4, fontWeight: 600 }}>
                Destination (终点)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.0001"
                  placeholder="Latitude"
                  value={destLat}
                  onChange={(e) => setDestLat(Number(e.target.value))}
                />
                <input
                  style={inputStyle}
                  type="number"
                  step="0.0001"
                  placeholder="Longitude"
                  value={destLon}
                  onChange={(e) => setDestLon(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 4, fontWeight: 600 }}>
                Preference (偏好)
              </div>
              <select
                style={selectStyle}
                value={preference}
                onChange={(e) => setPreference(e.target.value as PathSearchPreference)}
              >
                <option value="balanced">⚖️ Balanced (平衡)</option>
                <option value="safety_first">🛡️ Safety First (安全优先)</option>
                <option value="shortest">📏 Shortest (最短路线)</option>
              </select>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: loading ? "#9ca3af" : "#2563eb",
                color: "white",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13,
              }}
            >
              {loading ? "Searching..." : "🔍 Search Routes"}
            </button>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 10,
                  background: "#fee2e2",
                  color: "#991b1b",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {/* Route Source Indicator */}
            {routeSource && (
              <div
                style={{
                  marginTop: 10,
                  padding: 8,
                  borderRadius: 8,
                  background: routeSource === "osrm" ? "#dbeafe" : "#fef3c7",
                  color: routeSource === "osrm" ? "#1e40af" : "#92400e",
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {routeSource === "osrm" ? "🛣️ Using real road data (OSRM)" : "📐 Using fallback geometry"}
              </div>
            )}
          </div>

          {/* Route Results */}
          {routes.length > 0 && (
            <div
              style={{
                padding: 14,
                background: "white",
                border: "1px solid #eee",
                borderRadius: 14,
                maxHeight: 350,
                overflowY: "auto",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 10, color: "#111", fontSize: 15 }}>
                📋 Candidate Routes ({routes.length})
              </div>

              {routes.map((route, idx) => (
                <div
                  key={route.route_id}
                  onClick={() => setSelectedRouteId(route.route_id)}
                  style={{
                    padding: 12,
                    marginBottom: 10,
                    borderRadius: 10,
                    border:
                      selectedRouteId === route.route_id
                        ? `2px solid ${ROUTE_COLORS[idx % ROUTE_COLORS.length]}`
                        : "1px solid #eee",
                    background: selectedRouteId === route.route_id ? "#f8fafc" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: ROUTE_COLORS[idx % ROUTE_COLORS.length],
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {route.rank}
                    </div>
                    <div style={{ fontWeight: 700, color: "#111" }}>Route {route.route_id}</div>
                    {route.rank === 1 && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 700,
                          background: "#fef3c7",
                          color: "#92400e",
                        }}
                      >
                        ⭐ BEST
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#666" }}>Distance</div>
                      <div style={{ fontWeight: 700, color: "#111" }}>
                        {(route.total_distance / 1000).toFixed(2)} km
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#666" }}>Quality Score</div>
                      <div
                        style={{
                          fontWeight: 700,
                          color:
                            route.road_quality_score >= 80
                              ? "#16a34a"
                              : route.road_quality_score >= 50
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      >
                        {route.road_quality_score.toFixed(0)}/100
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    {route.tags.map((tag) => (
                      <RouteTag key={tag} tag={tag} />
                    ))}
                  </div>

                  {route.segments_warning.length > 0 && (
                    <div style={{ fontSize: 11, color: "#991b1b" }}>
                      ⚠️ {route.segments_warning.length} warning(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Selected Route Details */}
          {selectedRoute && selectedRoute.segments_warning.length > 0 && (
            <div
              style={{
                padding: 16,
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: 14,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 10, color: "#92400e", fontSize: 14 }}>
                ⚠️ Warnings on Route {selectedRoute.route_id}
              </div>
              {selectedRoute.segments_warning.map((w, i) => (
                <div
                  key={i}
                  style={{
                    padding: 8,
                    marginBottom: 6,
                    borderRadius: 8,
                    background: "white",
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#991b1b" }}>{w.type}</span>
                  <span style={{ color: "#666", marginLeft: 8 }}>
                    ({w.lat.toFixed(4)}, {w.lon.toFixed(4)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Weather Bar + Map */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 650 }}>
          {/* Horizontal Weather Bar */}
          {weather && (
            <div
              style={{
                padding: "10px 16px",
                background: weather.is_cycling_friendly ? "#f0fdf4" : "#fffbeb",
                border: `1px solid ${weather.is_cycling_friendly ? "#bbf7d0" : "#fcd34d"}`,
                borderRadius: 12,
              }}
            >
              {/* First row: Weather icon + all stats */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 18 }}>🌤️</span>
                <span style={{ fontSize: 13, color: "#666" }}>Condition:</span>
                <span style={{ fontWeight: 600, color: "#111", marginRight: 8 }}>{weather.condition_localized || weather.condition}</span>
                <span style={{ fontSize: 13, color: "#666" }}>Temp:</span>
                <span style={{ fontWeight: 600, color: "#111", marginRight: 8 }}>{weather.temperature_c}°C</span>
                <span style={{ fontSize: 13, color: "#666" }}>Wind:</span>
                <span style={{ fontWeight: 600, color: "#111", marginRight: 8 }}>{weather.wind_speed_kmh} km/h</span>
                <span style={{ fontSize: 13, color: "#666" }}>Rain:</span>
                <span style={{ fontWeight: 600, color: "#111" }}>{weather.rain_chance_percent}%</span>
              </div>
              {/* Second row: Cycling recommendation */}
              {cyclingRecommendation && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: weather.is_cycling_friendly ? "#dcfce7" : "#fef9c3",
                    color: weather.is_cycling_friendly ? "#166534" : "#854d0e",
                    fontWeight: 600,
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {weather.is_cycling_friendly ? "✓" : "⚠️"} {cyclingRecommendation}
                </div>
              )}
            </div>
          )}

          {/* Map Container */}
          <div
            style={{
              background: "white",
              border: "1px solid #eee",
              borderRadius: 14,
              overflow: "hidden",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: 10,
                borderBottom: "1px solid #eee",
                fontWeight: 700,
                color: "#111",
                fontSize: 14,
              }}
            >
              🗺️ Map View
            </div>
            <div style={{ flex: 1, minHeight: 550 }}>
            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Draw all routes, selected route on top */}
              {routeLines
                .sort((a, b) => (a.route_id === selectedRouteId ? 1 : b.route_id === selectedRouteId ? -1 : 0))
                .map((route, idx) => {
                  const isSelected = route.route_id === selectedRouteId;
                  const colorIdx = routes.findIndex((r) => r.route_id === route.route_id);
                  return (
                    <Polyline
                      key={route.route_id}
                      positions={route.coords}
                      pathOptions={{
                        color: ROUTE_COLORS[colorIdx % ROUTE_COLORS.length],
                        weight: isSelected ? 7 : 4,
                        opacity: isSelected ? 1 : 0.5,
                      }}
                    />
                  );
                })}

              {/* Warnings */}
              {selectedRoute?.segments_warning.map((w, i) => (
                <CircleMarker
                  key={`warn-${i}`}
                  center={[w.lat, w.lon]}
                  radius={8}
                  pathOptions={{
                    color: "#991b1b",
                    fillColor: "#fecaca",
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <strong>{w.type}</strong>
                    <br />
                    {w.lat.toFixed(4)}, {w.lon.toFixed(4)}
                  </Popup>
                </CircleMarker>
              ))}

              {/* Origin and Destination markers */}
              <Marker position={origin} icon={originIcon}>
                <Popup>📍 Origin</Popup>
              </Marker>
              <Marker position={dest} icon={destIcon}>
                <Popup>🏁 Destination</Popup>
              </Marker>

              {routes.length > 0 && <FitBounds routes={routes} origin={origin} dest={dest} />}
            </MapContainer>
          </div>
          </div>
        </div>
      </div>

      {/* Formula Explanation */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 14,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10, color: "#111", fontSize: 16 }}>
          📊 Scoring Algorithm
        </div>
        <div style={{ color: "#444", fontSize: 13, lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 8px 0" }}>
            Routes are scored using the formula:{" "}
            <code
              style={{
                background: "#f3f4f6",
                padding: "2px 6px",
                borderRadius: 4,
                fontFamily: "monospace",
              }}
            >
              Score = Distance + (PotholeCount × 500m) + (BadRoadLength × 2.0)
            </code>
          </p>
          <p style={{ margin: 0 }}>
            <strong>Lower score = Better route.</strong> A shorter route with potholes may have a
            higher score (worse) than a longer route with smooth roads.
          </p>
        </div>
      </div>
    </div>
  );
}
