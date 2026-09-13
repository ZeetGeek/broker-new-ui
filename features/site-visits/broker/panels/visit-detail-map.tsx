"use client";

import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";

import "leaflet/dist/leaflet.css";

export default function VisitDetailMap({ latitude, longitude, title }: { latitude: number; longitude: number; title: string }) {
    const destination: [number, number] = [latitude, longitude];
    const [current, setCurrent] = useState<[number, number] | null>(null);
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((position) => setCurrent([position.coords.latitude, position.coords.longitude]), () => setCurrent(null), { enableHighAccuracy: false, maximumAge: 300_000, timeout: 4_000 });
    }, []);
    return <MapContainer center={destination} zoom={13} scrollWheelZoom={false} className="
      rounded-inner block-56 inline-full
    " aria-label={`Map showing ${title}`}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <CircleMarker center={destination} radius={10} pathOptions={{ color: "#0B1F17", fillColor: "#1B7A5A", fillOpacity: 1 }}><Popup>{title}</Popup></CircleMarker>
        {current ? <><CircleMarker center={current} radius={7} pathOptions={{ color: "#0B1F17", fillColor: "#C9F24D", fillOpacity: 1 }}><Popup>Your current location</Popup></CircleMarker><Polyline positions={[current, destination]} pathOptions={{ color: "#1B7A5A", weight: 4 }} /></> : null}
    </MapContainer>;
}
