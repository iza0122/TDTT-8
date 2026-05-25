import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { Shop } from '../discovery-services';
// ĐỂ NGOÀI COMPONENT: Chỉ chạy 1 lần duy nhất khi file được load
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapViewProps {
  shops: Shop[];
  center: [number, number];
  radius: number;
}

// Cải tiến: Component phụ để di chuyển camera khi center đổi
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

export default function MapView({ shops, center, radius }: MapViewProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <RecenterMap center={center} />

      <Circle 
        center={center} 
        radius={radius * 1000} 
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
      />

      {shops.map((shop) => (
        <Marker key={shop.id} position={[shop.lat, shop.lng]}>
          <Popup><strong>{shop.name}</strong></Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}