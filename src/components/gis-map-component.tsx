"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface Mine {
  id: string;
  name: string;
  state: string;
  district: string;
  subsidiary: string;
  latitude: number;
  longitude: number;
  worker_count: number;
  mine_type: string;
  overall_risk_score: number;
  status: string;
}

interface Inspection {
  id: string;
  mine_name: string;
  latitude: number;
  longitude: number;
  area_inspected: string;
  category: string;
  hazard_level: string;
  observations: string;
  inspected_at: string;
}

interface Props {
  mines: Mine[];
  inspections: Inspection[];
  selectedSubsidiary: string;
  riskFilter: string;
  showHazards: boolean;
  onSelectMine: (mine: Mine) => void;
  mapStyle?: "standard" | "satellite";
}

export default function GisMapComponent({
  mines,
  inspections,
  selectedSubsidiary,
  riskFilter,
  showHazards,
  onSelectMine,
  mapStyle = "standard",
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const hazardsLayerRef = useRef<any>(null);

  // Helper to validate geographic coordinates
  const isValidCoord = (lat: any, lng: any): boolean => {
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  useEffect(() => {
    let isMounted = true;

    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current || (mapContainerRef.current as any)._leaflet_id) {
      return;
    }

    // Dynamic import Leaflet on client only
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      if (mapInstanceRef.current || (mapContainerRef.current as any)._leaflet_id) return;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Center map around Central/Eastern Indian coal belt (Jharkhand / Odisha / Chhattisgarh)
      const map = L.map(mapContainerRef.current, {
        center: [23.5, 85.0],
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
      });

      // Completely Free OpenStreetMap Tiles (No API key required, zero watermarks)
      const standardTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      const satelliteTileUrl =
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

      const initialUrl = mapStyle === "satellite" ? satelliteTileUrl : standardTileUrl;
      const initialAttr =
        mapStyle === "satellite"
          ? "&copy; Esri, Maxar, Earthstar Geographics"
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

      const tileLayer = L.tileLayer(initialUrl, {
        attribution: initialAttr,
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      markersLayerRef.current = L.layerGroup().addTo(map);
      hazardsLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Update Tile Layer if mapStyle changes (Standard vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    import("leaflet").then((L) => {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);

      const standardTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      const satelliteTileUrl =
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

      const url = mapStyle === "satellite" ? satelliteTileUrl : standardTileUrl;
      const attr =
        mapStyle === "satellite"
          ? "&copy; Esri, Maxar, Earthstar Geographics"
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

      const newTileLayer = L.tileLayer(url, {
        attribution: attr,
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      tileLayerRef.current = newTileLayer;
    });
  }, [mapStyle]);

  // Update Mine Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    import("leaflet").then((L) => {
      markersLayerRef.current.clearLayers();

      const filteredMines = mines.filter((m) => {
        if (!isValidCoord(m.latitude, m.longitude)) return false;
        if (selectedSubsidiary !== "ALL" && m.subsidiary !== selectedSubsidiary) return false;
        if (riskFilter === "HIGH" && m.overall_risk_score < 60) return false;
        if (riskFilter === "CRITICAL" && m.overall_risk_score < 75) return false;
        if (riskFilter === "COMPLIANT" && m.overall_risk_score >= 50) return false;
        return true;
      });

      filteredMines.forEach((mine) => {
        const isCritical = mine.overall_risk_score >= 75;
        const isHigh = mine.overall_risk_score >= 60;
        const color = isCritical ? "#EF4444" : isHigh ? "#F97316" : "#10B981";

        const iconHtml = `
          <div style="
            background: ${color};
            color: white;
            border: 2px solid white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          ">
            ${mine.overall_risk_score.toFixed(0)}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "mine-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([mine.latitude, mine.longitude], { icon: customIcon });

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4; min-width: 180px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #1e293b;">${mine.name}</div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 6px;">${mine.subsidiary} · ${mine.state} (${mine.mine_type})</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Statutory Risk:</span>
              <strong style="color: ${color};">${mine.overall_risk_score.toFixed(1)}/100</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Workforce:</span>
              <strong>${mine.worker_count.toLocaleString()} workers</strong>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on("click", () => onSelectMine(mine));
        markersLayerRef.current.addLayer(marker);

        // Danger boundary radius circle for high-risk mines
        if (isCritical || isHigh) {
          const circle = L.circle([mine.latitude, mine.longitude], {
            color: color,
            fillColor: color,
            fillOpacity: 0.12,
            radius: isCritical ? 14000 : 8000,
            weight: 1.5,
          });
          markersLayerRef.current.addLayer(circle);
        }
      });
    });
  }, [mines, selectedSubsidiary, riskFilter, onSelectMine]);

  // Update Hazard Incident pins
  useEffect(() => {
    if (!mapInstanceRef.current || !hazardsLayerRef.current) return;

    import("leaflet").then((L) => {
      hazardsLayerRef.current.clearLayers();
      if (!showHazards) return;

      inspections.forEach((insp) => {
        // Guard against missing coordinates
        if (!isValidCoord(insp.latitude, insp.longitude)) return;

        const isCrit = insp.hazard_level === "critical";
        const isHigh = insp.hazard_level === "high";
        const iconColor = isCrit ? "#DC2626" : isHigh ? "#EA580C" : "#CA8A04";

        const hazardHtml = `
          <div style="
            background: ${iconColor};
            color: white;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 3px;
          ">
            <span>⚠️</span> ${insp.hazard_level.toUpperCase()}
          </div>
        `;

        const hazardIcon = L.divIcon({
          html: hazardHtml,
          className: "hazard-marker",
          iconSize: [64, 20],
          iconAnchor: [32, 10],
        });

        const marker = L.marker([insp.latitude, insp.longitude], { icon: hazardIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; max-width: 220px;">
            <strong style="color: ${iconColor};">[${insp.hazard_level.toUpperCase()}] ${insp.area_inspected}</strong>
            <div style="color: #64748b; margin: 3px 0;">${insp.mine_name} · ${insp.category}</div>
            <p style="margin: 4px 0 0 0; color: #334155;">${insp.observations}</p>
          </div>
        `);
        hazardsLayerRef.current.addLayer(marker);
      });
    });
  }, [inspections, showHazards]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[380px] sm:min-h-[520px] rounded-xl overflow-hidden border border-white/10 shadow-inner z-0"
    />
  );
}
