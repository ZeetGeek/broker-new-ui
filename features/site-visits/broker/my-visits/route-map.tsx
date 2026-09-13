"use client";

import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip } from "react-leaflet";

import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";

import "leaflet/dist/leaflet.css";

export default function RouteMap({ visits }: { visits: BrokerSiteVisit[] }) {
    const points = visits.flatMap((visit) => visit.property.latitude != null && visit.property.longitude != null ? [[visit.property.latitude, visit.property.longitude] as [number, number]] : []);
    const center = points[0] ?? [21.1702, 72.8311];
    return <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="
      block-full inline-full min-block-[360px]
    " aria-label="Map of today’s visit route"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{points.length > 1 ? <Polyline positions={points} pathOptions={{ color: "#1B7A5A", weight: 4 }} /> : null}{visits.map((visit, index) => visit.property.latitude != null && visit.property.longitude != null ? <CircleMarker key={visit.id} center={[visit.property.latitude, visit.property.longitude]} radius={12} pathOptions={{ color: "#0B1F17", fillColor: "#C9F24D", fillOpacity: 1 }}><Tooltip permanent direction="center" opacity={1} className="
      site-visit-route-marker
    ">{index + 1}</Tooltip><Popup>{index + 1}. {visit.property.title} · {visit.buyers[0].name}</Popup></CircleMarker> : null)}</MapContainer>;
}
