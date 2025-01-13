import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './mapview.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import Leaflet's default icon images
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default icon issues in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const MapView = ({ items, center = [42.05785391642652, -87.67568630010838], zoom = 13 }) => {
  return (
    <MapContainer center={center} zoom={zoom} className="map-view">
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map((item) => (
        <Marker key={item.id} position={[item.latitude, item.longitude]}>
          <Popup>
            <strong>{item.title}</strong><br />
            {item.description}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
