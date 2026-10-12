import { useEffect, useState, useRef } from "react";
import {
  Mountain,
  Download,
  ChevronDown,
  Menu,
  ArrowUpRight,
  Share2,
  LocateFixed,
  Check,
  RotateCcw,
} from "lucide-react";
import type { Dataset, RouteId } from "./types";
import { loadData } from "./lib/data";
import { initialRoute, routeDay, routeFeatures } from "./lib/routes";
import { downloadFile, makeGpx, makeNotes } from "./lib/export";
import { RouteRail } from "./components/RouteRail";
import { MapCanvas } from "./components/MapCanvas";
import { DayPlan } from "./components/DayPlan";
import { Inspector } from "./components/Inspector";
import { EvidencePanel } from "./components/EvidencePanel";
type View = "explore" | "access" | "sources" | "stack";
export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState("");
  const [selected, setSelected] = useState<RouteId>(() =>
    initialRoute(location.search),
  );
  const [day, setDay] = useState(0),
    [leg, setLeg] = useState<string | null>(null),
    [place, setPlace] = useState("minaret"),
    [view, setView] = useState<View>("explore"),
    [query, setQuery] = useState(""),
    [maxMiles, setMaxMiles] = useState(999),
    [mobileRoutes, setMobileRoutes] = useState(false),
    [expanded, setExpanded] = useState(false),
    [fitRequest, setFitRequest] = useState(0),
    [showNearby, setShowNearby] = useState(false),
    [exportOpen, setExportOpen] = useState(false),
    [toast, setToast] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("sierra-atlas-checks") ?? "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    loadData()
      .then((d) => {
        setData(d);
        const conf = d.content.routes[selected];
        setPlace(
          conf.previewPlace ??
            conf.stops.find((id) =>
              d.places.some((p) => p.id === id && p.category === "camp"),
            ) ??
            conf.stops[0],
        );
        const initialDay = Number(
          new URLSearchParams(location.search).get("day"),
        );
        if (initialDay >= 1 && initialDay <= 4) setDay(initialDay);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
    if (matchMedia("(max-width:700px)").matches)
      window.scrollTo({ top: 0, behavior: "instant" });
  }, [selected, view]);
  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set("route", selected);
    if (day) url.searchParams.set("day", String(day));
    else url.searchParams.delete("day");
    history.replaceState(null, "", url);
  }, [selected, day]);
  useEffect(() => {
    try {
      localStorage.setItem("sierra-atlas-checks", JSON.stringify(checks));
    } catch {}
  }, [checks]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setExportOpen(false);
        setMobileRoutes(false);
        setExpanded(false);
      }
    }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const selectRoute = (id: RouteId) => {
    setSelected(id);
    setDay(0);
    setLeg(null);
    setView("explore");
    setMobileRoutes(false);
    if (data) {
      const c = data.content.routes[id];
      setPlace(
        c.previewPlace ??
          c.stops.find((id) =>
            data.places.some((p) => p.id === id && p.category === "camp"),
          ) ??
          c.stops[0],
      );
    }
  };
  const selectDay = (n: number) => {
    setDay(n);
    setLeg(null);
    if (data && n) {
      const d = routeDay(data, selected, n);
      setPlace(d.stops[d.stops.length - 1]);
    }
  };
  const selectLeg = (id: string | null) => {
    setLeg(id);
    if (data && id) {
      const f = data.lines.features.find((f) => f.properties.id === id);
      if (f?.properties.day) {
        setDay(f.properties.day);
        const d = routeDay(data, selected, f.properties.day);
        setPlace(d.stops[d.stops.length - 1]);
      }
    }
  };
  const selectPlace = (id: string) => {
    setPlace(id);
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setToast("Route link copied. It opens this route and day.");
    } catch {
      setToast(
        "Copy the URL from the address bar to share this route and day.",
      );
    }
  };
  if (error)
    return (
      <main className="load-state">
        <Mountain size={36} />
        <h1>The atlas couldn’t load</h1>
        <p>{error}</p>
        <button className="primary-button" onClick={() => location.reload()}>
          <RotateCcw size={16} />
          Try again
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="load-state" role="status">
        <Mountain size={38} />
        <h1>Eastern Sierra</h1>
        <p>Loading trails and places…</p>
        <div className="loading-line" />
      </main>
    );
  const route = data.routes.find((r) => r.id === selected)!,
    config = data.content.routes[selected];
  return (
    <div className={`app-shell ${expanded ? "map-expanded" : ""}`}>
      <a className="skip-link" href="#workspace">
        Skip to itinerary
      </a>
      <header className="app-header">
        <div className="brand">
          <Mountain size={23} />
          <h1>Eastern Sierra</h1>
          <span>October 13–16, 2026</span>
        </div>
        <nav aria-label="Main navigation">
          {(["explore", "access", "sources", "stack"] as View[]).map((v) => (
            <button
              key={v}
              aria-current={view === v ? "page" : undefined}
              onClick={() => {
                setView(v);
                setExpanded(false);
              }}
            >
              {v === "stack" ? "Full stack" : v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button share-button"
            onClick={share}
            aria-label="Copy route link"
          >
            <Share2 size={17} />
          </button>
          <div className="export-wrap">
            <button
              className="export-button"
              onClick={() => setExportOpen(!exportOpen)}
              aria-expanded={exportOpen}
            >
              <Download size={15} />
              <span>Export</span>
              <ChevronDown size={13} />
            </button>
            {exportOpen && (
              <div className="export-menu" aria-label="Export selected route">
                <button
                  onClick={() => {
                    downloadFile(
                      makeGpx(data, route),
                      `${selected}-route.gpx`,
                      "application/gpx+xml",
                    );
                    setExportOpen(false);
                    setToast("GPX exported with source gaps preserved.");
                  }}
                >
                  GPX trail track
                </button>
                <button
                  onClick={() => {
                    downloadFile(
                      JSON.stringify(
                        {
                          type: "FeatureCollection",
                          features: routeFeatures(data, route),
                        },
                        null,
                        2,
                      ),
                      `${selected}-route.geojson`,
                      "application/geo+json",
                    );
                    setExportOpen(false);
                    setToast("GeoJSON exported.");
                  }}
                >
                  GeoJSON geometry
                </button>
                <button
                  onClick={() => {
                    downloadFile(
                      makeNotes(data, route),
                      `${selected}-trip-notes.txt`,
                      "text/plain",
                    );
                    setExportOpen(false);
                    setToast("Directions and evidence exported.");
                  }}
                >
                  Directions & evidence
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="status-strip">
        <span>
          <i />
          Class 2 limit · Cecile–Iceberg excluded
        </span>
        <button
          onClick={() => {
            setView("access");
            setExpanded(false);
          }}
        >
          Parking & current conditions unverified <ArrowUpRight size={12} />
        </button>
      </div>
      <div
        className={`workspace ${mobileRoutes ? "routes-open" : ""}`}
        id="workspace"
      >
        <RouteRail
          data={data}
          selected={selected}
          onSelect={selectRoute}
          query={query}
          setQuery={setQuery}
          maxMiles={maxMiles}
          setMaxMiles={setMaxMiles}
          close={() => setMobileRoutes(false)}
        />
        <main ref={mainRef} className="main-workspace">
          <div className="mobile-route-bar">
            <button onClick={() => setMobileRoutes(true)}>
              <Menu size={16} />
              Change route
            </button>
            <span>{config.label}</span>
          </div>
          {view === "explore" ? (
            <>
              <div className="route-heading">
                <div>
                  <h2>{config.label}</h2>
                  <p>
                    {selected === "sabrina"
                      ? "Hiking-trail base plan · Baboon path omitted"
                      : selected === "short"
                        ? "Recommended · hiking trails, no scramble or summit"
                        : "Hiking-trail itinerary · no scramble or summit objective"}
                  </p>
                </div>
                <div className="route-stat">
                  <strong>
                    {route.miles.toFixed(1)}
                    <span>mi</span>
                  </strong>
                  <small>Mapped total</small>
                </div>
                <button
                  className="icon-button fit-button"
                  aria-label="Fit selected route"
                  onClick={() => setFitRequest((n) => n + 1)}
                >
                  <LocateFixed size={18} />
                </button>
              </div>
              <MapCanvas
                data={data}
                route={route}
                day={day}
                leg={leg}
                place={place}
                onPlace={selectPlace}
                onLeg={selectLeg}
                expanded={expanded}
                onExpand={() => setExpanded(!expanded)}
                fitRequest={fitRequest}
                showNearby={showNearby}
                setShowNearby={setShowNearby}
              />
              {!expanded && (
                <DayPlan
                  data={data}
                  route={route}
                  day={day}
                  setDay={selectDay}
                  leg={leg}
                  setLeg={selectLeg}
                />
              )}
            </>
          ) : (
            <EvidencePanel
              data={data}
              route={route}
              view={view}
              checks={checks}
              toggleCheck={(id) => setChecks((c) => ({ ...c, [id]: !c[id] }))}
            />
          )}
        </main>
        <Inspector
          key={selected}
          data={data}
          route={route}
          placeId={place}
          onPlace={selectPlace}
          onAccess={() => {
            setView("access");
            setExpanded(false);
          }}
        />
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
