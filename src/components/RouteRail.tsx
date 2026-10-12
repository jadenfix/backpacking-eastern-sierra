import { Search, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import type { Dataset, RouteId } from "../types";
import {
  distance,
  filteredRoutes,
  permitCode,
  routeSubtitles,
} from "../lib/routes";
export function RouteRail({
  data,
  selected,
  onSelect,
  query,
  setQuery,
  maxMiles,
  setMaxMiles,
  close,
}: {
  data: Dataset;
  selected: RouteId;
  onSelect: (id: RouteId) => void;
  query: string;
  setQuery: (q: string) => void;
  maxMiles: number;
  setMaxMiles: (n: number) => void;
  close: () => void;
}) {
  const routes = filteredRoutes(data, query, maxMiles);
  return (
    <aside className="route-rail" aria-label="Choose a backpacking route">
      <div className="rail-title">
        <h2>Routes</h2>
        <button
          className="icon-button mobile-close"
          onClick={close}
          aria-label="Close route list"
        >
          <X size={18} />
        </button>
        <SlidersHorizontal size={17} className="muted desktop-only" />
      </div>
      <label className="search-field">
        <Search size={16} />
        <input
          aria-label="Search routes"
          placeholder="Find a route, lake or permit…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button aria-label="Clear search" onClick={() => setQuery("")}>
            <X size={14} />
          </button>
        )}
      </label>
      <label className="filter-label">
        Trip length
        <select
          aria-label="Filter route length"
          value={maxMiles}
          onChange={(e) => setMaxMiles(Number(e.target.value))}
        >
          <option value={999}>All distances</option>
          <option value={40}>Under 40 miles</option>
          <option value={70}>Under 70 miles</option>
        </select>
      </label>
      <div className="rail-count">
        {routes.length} itineraries <span>Class 2 limit requested</span>
      </div>
      <div className="route-list">
        {routes.map((r) => {
          const config = data.content.routes[r.id];
          const photo = data.places.find(
            (p) =>
              p.id ===
              (config.previewPlace ??
                config.stops.find((id) =>
                  data.places.some((p) => p.id === id && p.category === "camp"),
                )),
          )?.photo;
          return (
            <button
              key={r.id}
              className={`route-row ${selected === r.id ? "selected" : ""}`}
              onClick={() => onSelect(r.id)}
              aria-pressed={selected === r.id}
              data-testid={`route-${r.id}`}
            >
              <div className="route-thumb">
                {photo ? (
                  <img
                    src={`${import.meta.env.BASE_URL}${photo.url}`}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span>↗</span>
                )}
              </div>
              <div>
                <h3>
                  {
                    {
                      short: "Minaret focus",
                      safe: "All lakes",
                      balanced: "Even days",
                      rush: "Rush Creek",
                      duck: "Duck Pass",
                      mcgee: "McGee Pass",
                      sabrina: "Sabrina Basin",
                    }[r.id]
                  }
                </h3>
                <p title={routeSubtitles[r.id]}>{routeSubtitles[r.id]}</p>
                <span>
                  {distance(r.miles)} mi <i>·</i> {permitCode(r.id)}
                  {r.id === "short" && <b>Recommended</b>}
                </span>
              </div>
              <ChevronRight size={15} />
            </button>
          );
        })}
      </div>
      {!routes.length && (
        <div className="empty-state">
          <h3>No routes match</h3>
          <p>Try another lake name or clear the distance filter.</p>
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setMaxMiles(999);
            }}
          >
            Reset filters
          </button>
        </div>
      )}
      <div className="rail-footer">
        <strong>A plan, with its evidence.</strong>
        <p>
          Real trail geometry. Historic photos. Access checks that stay visible.
        </p>
        <span>Cecile–Iceberg and summits excluded.</span>
      </div>
    </aside>
  );
}
