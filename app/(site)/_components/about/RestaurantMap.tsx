"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLACE } from "./about-data";

const pinIcon = L.divIcon({
  className: "",
  html: '<span class="map-pin"><span class="map-pin-ring"></span><span class="map-pin-dot"></span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -10],
});

export default function RestaurantMap() {
  return (
    <>
      <MapContainer
        center={PLACE.coords}
        zoom={16}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ backgroundColor: "#1a1c22" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <Marker position={PLACE.coords} icon={pinIcon}>
          <Popup>
            <strong>{PLACE.name}</strong>
            <br />
            {PLACE.address}
          </Popup>
        </Marker>
      </MapContainer>

      <style jsx global>{`
        .map-pin {
          position: relative;
          display: block;
          width: 24px;
          height: 24px;
        }
        .map-pin-dot {
          position: absolute;
          inset: 8px;
          border-radius: 9999px;
          background: #e05a5a;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
        }
        .map-pin-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: rgba(224, 90, 90, 0.45);
          animation: mapPulse 1.8s ease-out infinite;
        }
        @keyframes mapPulse {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.7);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .map-pin-ring {
            animation: none;
          }
        }
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: #20232b;
          color: #fff;
        }
      `}</style>
    </>
  );
}
