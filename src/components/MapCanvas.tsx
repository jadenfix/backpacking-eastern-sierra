import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Layers,
  LocateFixed,
  Maximize2,
  Minimize2,
  Map as MapIcon,
  X,
} from "lucide-react";
import type { Dataset, Route } from "../types";
import { routeFeatures, geometrySegments } from "../lib/routes";
interface Props {
  data: Dataset;
  route: Route;
  day: number;
  leg: string | null;
  place: string;
  onPlace: (id: string) => void;
  onLeg: (id: string) => void;
  expanded: boolean;
  onExpand: () => void;
  fitRequest: number;
  showNearby: boolean;
  setShowNearby: (x: boolean) => void;
}
const escape = (x: string) =>
  x.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function MapCanvas({
  data,
  route,
  day,
  leg,
  place,
  onPlace,
  onLeg,
  expanded,
  onExpand,
  fitRequest,
  showNearby,
  setShowNearby,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    tile = useRef<L.TileLayer | null>(null);
  const group = useRef<L.LayerGroup | null>(null),
    background = useRef<L.LayerGroup | null>(null),
    closure = useRef<L.LayerGroup | null>(null);
  const fitBoundsRef = useRef<L.LatLngBounds | null>(null);
  const handlers = useRef({ onPlace, onLeg });
  handlers.current = { onPlace, onLeg };
  const [basemap, setBasemap] = useState("topo"),
    [layersOpen, setLayersOpen] = useState(false),
    [showPeaks, setShowPeaks] = useState(true),
    [showWater, setShowWater] = useState(false),
    [showClosure, setShowClosure] = useState(false),
    [tileError, setTileError] = useState(false),
    [tileLoading, setTileLoading] = useState(true);
  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      preferCanvas: false,
      attributionControl: true,
    }).setView([37.65, -119.1], 11);
    map.current = m;
    L.control.zoom({ position: "topleft" }).addTo(m);
    L.control
      .scale({ imperial: true, metric: true, position: "bottomleft" })
      .addTo(m);
    group.current = L.layerGroup().addTo(m);
    background.current = L.layerGroup().addTo(m);
    closure.current = L.layerGroup().addTo(m);
    const ro = new ResizeObserver(() => {
      m.invalidateSize();
      if (
        fitBoundsRef.current &&
        host.current &&
        host.current.clientWidth > 100 &&
        host.current.clientHeight > 100
      )
        m.fitBounds(fitBoundsRef.current, {
          padding: [45, 45],
          animate: false,
        });
    });
    ro.observe(host.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (tile.current) m.removeLayer(tile.current);
    setTileError(false);
    const urls: Record<string, [string, string]> = {
      topo: [
        "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
        "USGS The National Map",
      ],
      satellite: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        "Esri, Maxar & contributors",
      ],
      street: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        "© OpenStreetMap contributors",
      ],
    };
    const [url, credit] = urls[basemap];
    tile.current = L.tileLayer(url, { maxZoom: 17, attribution: credit })
      .on("loading", () => {
        setTileLoading(true);
        setTileError(false);
      })
      .on("load", () => setTileLoading(false))
      .on("tileerror", () => setTileError(true))
      .addTo(m);
  }, [basemap]);
  useEffect(() => {
    const g = background.current;
    if (!g) return;
    g.clearLayers();
    if (showNearby)
      L.geoJSON(data.trails as GeoJSON.GeoJsonObject, {
        style: { color: "#71827c", weight: 1, opacity: 0.35 },
        onEachFeature: (f, l) =>
          l.bindTooltip(escape(f.properties.name ?? "Mapped trail"), {
            sticky: true,
          }),
      }).addTo(g);
  }, [data, showNearby]);
  useEffect(() => {
    const g = closure.current;
    if (!g) return;
    g.clearLayers();
    if (showClosure)
      L.geoJSON(data.road as GeoJSON.GeoJsonObject, {
        style: { color: "#b9502f", weight: 5, opacity: 0.65 },
        onEachFeature: (_, l) =>
          l.bindTooltip(
            "Reds Meadow Road · weekday closure includes land within 200 ft. Road line only; buffer not rendered.",
            { sticky: true },
          ),
      }).addTo(g);
  }, [data, showClosure]);
  useEffect(() => {
    const g = group.current;
    if (!g) return;
    g.clearLayers();
    const all = routeFeatures(data, route);
    const shown = day ? all.filter((f) => f.properties.day === day) : all;
    for (const f of all) {
      const selected =
        (!day || f.properties.day === day) && (!leg || f.properties.id === leg);
      const active = leg === f.properties.id;
      const layer = L.geoJSON(f as GeoJSON.GeoJsonObject, {
        style: {
          color: active ? "#b56732" : "#202725",
          weight: active ? 6 : selected ? 3.8 : 2,
          opacity: selected ? 1 : 0.23,
          lineCap: "round",
        },
      }).addTo(g);
      layer.bindTooltip(
        `<strong>Day ${f.properties.day}</strong> · ${escape(f.properties.name)}<br>${f.properties.miles?.toFixed(1) ?? "Approximate"} mapped mi · click to inspect`,
        { sticky: true },
      );
      layer.on("click", () => handlers.current.onLeg(f.properties.id));
    }
    const config = data.content.routes[route.id];
    const relevant = new Set(config.stops);
    if (showPeaks && ["short", "safe", "balanced", "rush"].includes(route.id)) {
      relevant.add("banner");
      relevant.add("ritter");
    }
    if (day) {
      const ids =
        (config.days[day - 1] ?? data.content.routes.safe.days[day - 1])
          ?.stops ?? [];
      ids.forEach((id) => relevant.add(id));
    }
    for (const p of data.places.filter(
      (p) => relevant.has(p.id) && p.id !== "cecile",
    )) {
      if (p.category === "peak" && !showPeaks) continue;
      const icon = L.divIcon({
        className: "place-marker",
        html: `<span class="${p.id === place ? "chosen" : ""} ${p.category === "peak" ? "peak" : ""}">${p.category === "parking" ? "P" : p.category === "peak" ? "△" : showWater && p.water ? "≈" : "•"}</span>`,
        iconSize: [27, 27],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([p.lat, p.lon], {
        icon,
        title: p.name,
        keyboard: true,
      })
        .bindTooltip(
          escape(p.name) + (p.category === "peak" ? " · viewpoint only" : ""),
          {
            direction: p.id === place ? "right" : "top",
            permanent: p.id === place,
            className: p.id === place ? "place-label" : "",
          },
        )
        .on("click", () => handlers.current.onPlace(p.id))
        .addTo(g);
      marker.getElement()?.setAttribute("aria-label", `Inspect ${p.name}`);
    }
    if (shown.length === 0 && day) {
      const p = data.places.find((p) => p.id === place);
      if (p)
        g.addLayer(
          L.circleMarker([p.lat, p.lon], {
            radius: 35,
            color: "#202725",
            weight: 1,
            fillOpacity: 0.06,
          }),
        );
    }
  }, [data, route, day, leg, place, showPeaks, showWater]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const features = routeFeatures(data, route, day);
    const positions = features.flatMap((f) =>
      geometrySegments(f).flatMap((s) =>
        s.map((p) => [p[1], p[0]] as L.LatLngTuple),
      ),
    );
    fitBoundsRef.current = positions.length ? L.latLngBounds(positions) : null;
    if (fitBoundsRef.current)
      m.fitBounds(fitBoundsRef.current, {
        padding: [45, 45],
        animate: false,
      });
    else {
      const p = data.places.find((p) => p.id === place);
      if (p) m.setView([p.lat, p.lon], 13, { animate: false });
    }
  }, [data, route, day, fitRequest]);
  const centerPlace = () => {
    const p = data.places.find((p) => p.id === place);
    if (p)
      map.current?.setView([p.lat, p.lon], 13, {
        animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
  };
  return (
    <div className="map-wrap">
      <div
        ref={host}
        className="map-canvas"
        role="region"
        aria-label={`Trail map: ${data.content.routes[route.id].label}`}
      />
      <div className="map-tools">
        <button
          className="icon-button"
          onClick={() => setLayersOpen(!layersOpen)}
          aria-expanded={layersOpen}
          aria-label="Map layers"
        >
          <Layers size={17} />
        </button>
        <button
          className="icon-button"
          onClick={centerPlace}
          aria-label="Center selected place"
        >
          <LocateFixed size={17} />
        </button>
        <button
          className="icon-button"
          onClick={onExpand}
          aria-label={expanded ? "Exit full map" : "Expand map"}
        >
          {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>
      {layersOpen && (
        <section className="layer-popover" aria-label="Map layers settings">
          <div>
            <strong>Map layers</strong>
            <button
              className="icon-button"
              onClick={() => setLayersOpen(false)}
              aria-label="Close map layers"
            >
              <X size={16} />
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={showNearby}
              onChange={(e) => setShowNearby(e.target.checked)}
            />
            Nearby mapped trails
          </label>
          <label>
            <input
              type="checkbox"
              checked={showPeaks}
              onChange={(e) => setShowPeaks(e.target.checked)}
            />
            Peak viewpoints
          </label>
          <label>
            <input
              type="checkbox"
              checked={showWater}
              onChange={(e) => setShowWater(e.target.checked)}
            />
            Expected natural water
          </label>
          <label>
            <input
              type="checkbox"
              checked={showClosure}
              onChange={(e) => setShowClosure(e.target.checked)}
            />
            Closed road · 2026 order
          </label>
          <p>
            Water and access are unverified. Peak pins are scenery, not summit
            routes. Closure buffer not rendered.
          </p>
        </section>
      )}
      <label className="basemap-control">
        <MapIcon size={15} />
        <select
          aria-label="Basemap"
          value={basemap}
          onChange={(e) => setBasemap(e.target.value)}
        >
          <option value="topo">Topo</option>
          <option value="satellite">Satellite</option>
          <option value="street">Street</option>
        </select>
      </label>
      {tileError && (
        <div className="map-notice" role="status">
          Some background tiles did not load. Route lines remain visible; try
          another basemap.
        </div>
      )}
      <div className="map-legend">
        <span>
          <i />
          Selected trail
        </span>
        <span
          className="source-note"
          data-testid={tileLoading ? "map-loading" : "map-ready"}
        >
          {tileLoading
            ? "Loading background…"
            : "USDA / NPS · source gaps preserved"}
        </span>
      </div>
    </div>
  );
}
