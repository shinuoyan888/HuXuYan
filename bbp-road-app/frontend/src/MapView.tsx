import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitBounds(props: { line?: [number, number][]; origin?: [number, number]; dest?: [number, number]; segments?: { start: [number, number]; end: [number, number] }[] }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [];
    if (props.line) pts.push(...props.line);
    if (props.origin) pts.push(props.origin);
    if (props.dest) pts.push(props.dest);
    if (props.segments) props.segments.forEach((s) => { pts.push(s.start, s.end); });
    if (pts.length) {
      const bounds = L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, props.line, props.origin, props.dest, props.segments]);
  return null;
}

export default function MapView(props: {
  line?: [number, number][];
  origin?: [number, number];
  dest?: [number, number];
  segments?: { id: number; status: string; start: [number, number]; end: [number, number] }[];
  height?: number;
}) {
  const center: [number, number] = props.origin || props.dest || props.line?.[0] || props.segments?.[0]?.start || [1.3521, 103.8198];

  const statusColor = (s: string) => {
    if (s === "optimal") return "#16a34a";
    if (s === "medium" || s === "suboptimal") return "#f59e0b";
    if (s === "maintenance") return "#ef4444";
    return "#2563eb";
  };

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #eee",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 12, borderBottom: "1px solid #eee", color: "#111", fontWeight: 800 }}>Map</div>

      <div style={{ height: props.height ?? 420 }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {props.segments?.map((s) => (
            <Polyline
              key={`seg-${s.id}`}
              positions={[s.start, s.end]}
              pathOptions={{ color: statusColor(s.status), weight: 6, opacity: 0.8 }}
            />
          ))}

          {props.line ? (
            <Polyline positions={props.line} pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.9 }} />
          ) : null}

          {props.origin ? <Marker position={props.origin} icon={icon} /> : null}
          {props.dest ? <Marker position={props.dest} icon={icon} /> : null}

          <FitBounds line={props.line} origin={props.origin} dest={props.dest} segments={props.segments?.map((s) => ({ start: s.start, end: s.end }))} />
        </MapContainer>
      </div>
    </div>
  );
}
