import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";

type Segment = {
  id: number;
  status: "optimal" | "medium" | "maintenance";
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
};

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function statusColor(s: Segment["status"]) {
  if (s === "optimal") return "#16a34a";      // green
  if (s === "medium") return "#f59e0b";       // amber
  return "#ef4444";                           // red
}

export default function MapView(props: {
  center: [number, number];
  segments?: Segment[];
  selectedSegmentId?: number | null;
  tripLine?: [number, number][];
  origin?: [number, number];
  dest?: [number, number];
}) {
  const segs = props.segments ?? [];

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #eee",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 12, borderBottom: "1px solid #eee", color: "#111", fontWeight: 800 }}>
        Map
      </div>

      <div style={{ height: 420 }}>
        <MapContainer center={props.center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Segments lines */}
          {segs.map((s) => {
            const line: [number, number][] = [
              [s.start_lat, s.start_lng],
              [s.end_lat, s.end_lng],
            ];
            const selected = props.selectedSegmentId === s.id;

            return (
              <Polyline
                key={`seg-${s.id}`}
                positions={line}
                pathOptions={{
                  color: statusColor(s.status),
                  weight: selected ? 9 : 5,
                  opacity: 0.9,
                }}
              />
            );
          })}

          {/* Segment start markers */}
          {segs.map((s) => (
            <Marker key={`m-${s.id}`} position={[s.start_lat, s.start_lng]} icon={icon}>
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 800 }}>Segment #{s.id}</div>
                  <div>Status: {s.status}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Trip route */}
          {props.tripLine ? (
            <Polyline positions={props.tripLine} pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.9 }} />
          ) : null}

          {/* Trip markers */}
          {props.origin ? (
            <Marker position={props.origin} icon={icon}>
              <Popup>Origin</Popup>
            </Marker>
          ) : null}
          {props.dest ? (
            <Marker position={props.dest} icon={icon}>
              <Popup>Destination</Popup>
            </Marker>
          ) : null}
        </MapContainer>
      </div>

      <div style={{ padding: 12, borderTop: "1px solid #eee", fontSize: 12, color: "#444" }}>
        <span style={{ fontWeight: 800, color: "#16a34a" }}>●</span> optimal &nbsp;&nbsp;
        <span style={{ fontWeight: 800, color: "#f59e0b" }}>●</span> medium &nbsp;&nbsp;
        <span style={{ fontWeight: 800, color: "#ef4444" }}>●</span> maintenance &nbsp;&nbsp;
        <span style={{ fontWeight: 800, color: "#2563eb" }}>●</span> trip route
      </div>
    </div>
  );
}