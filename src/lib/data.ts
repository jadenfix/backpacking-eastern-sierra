import type { Dataset, Route } from "../types";
import { routeOrder } from "./routes";
export function normalizeData(raw: Dataset): Dataset {
  const routes = routeOrder
    .map((id) => raw.routes.find((r) => r.id === id))
    .filter(Boolean) as Route[];
  if (
    routes.length !== 7 ||
    !raw.lines.features?.length ||
    !raw.trails.features?.length
  )
    throw new Error("Route dataset is incomplete.");
  return {
    ...raw,
    routes,
    trails: {
      ...raw.trails,
      features: raw.trails.features.filter(
        (f) => !f.properties.kind?.includes("scramble"),
      ),
    },
    lines: {
      ...raw.lines,
      features: raw.lines.features.filter(
        (f) => f.properties.routeId !== "classic",
      ),
    },
    places: raw.places.some((p) => p.id === "silver")
      ? raw.places
      : [
          ...raw.places,
          {
            id: "silver",
            name: "Rush Creek trailhead",
            lat: 37.77924,
            lon: -119.1297,
            category: "parking",
            description:
              "Alternative entry near Silver Lake on Highway 158. Confirm the exact permitted overnight parking spaces.",
            photo: null,
            water: null,
          },
        ],
  };
}
export async function loadData(): Promise<Dataset> {
  const names = [
    "places.json",
    "routes.json",
    "content.json",
    "permits.json",
    "trails.geojson",
    "route-lines.geojson",
    "closed-road.geojson",
  ];
  const [places, routes, content, permits, trails, lines, road] =
    await Promise.all(
      names.map(async (name) => {
        const res = await fetch(`${import.meta.env.BASE_URL}data/${name}`);
        if (!res.ok) throw new Error(`Could not load ${name} (${res.status}).`);
        return res.json();
      }),
    );
  return normalizeData({
    places,
    routes: routes.routes,
    content,
    permits,
    trails,
    lines,
    road,
  });
}
