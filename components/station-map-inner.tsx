"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default marker icon (Leaflet + webpack issue)
const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface StationMapInnerProps {
  latitude: number
  longitude: number
  siteName: string
}

export default function StationMapInner({ latitude, longitude, siteName }: StationMapInnerProps) {
  return (
    <div style={{ height: "240px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(31,58,60,0.08)" }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={icon}>
          <Popup>{siteName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
