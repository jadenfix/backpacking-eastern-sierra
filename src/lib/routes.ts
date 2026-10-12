import type { Dataset, Route, RouteId, TrailFeature } from "../types";
export const routeOrder: RouteId[] = [
  "short",
  "safe",
  "balanced",
  "rush",
  "duck",
  "mcgee",
  "sabrina",
];
export const permitCode = (id: RouteId) =>
  ({
    short: "AA16",
    safe: "AA16",
    balanced: "AA16",
    rush: "AA05",
    duck: "JM01",
    mcgee: "JM05",
    sabrina: "JM17",
  })[id];
export const routeSubtitles: Record<RouteId, string> = {
  short: "Minaret Lake · same-trail return",
  safe: "Minaret, Ediza, Garnet & Thousand Island",
  balanced: "Every lake · two nights near Ediza",
  rush: "Silver Lake entry · northern lake basins",
  duck: "Purple Lake, Virginia & Silver Divide",
  mcgee: "Big McGee, Tully & Lake Virginia",
  sabrina: "Hungry Packer & Midnight · trail base",
};
export function routeFeatures(
  data: Dataset,
  route: Route,
  day = 0,
): TrailFeature[] {
  const ids = new Set(
    route.days
      .filter((d) => !day || d.day === day)
      .flatMap((d) => d.featureIds),
  );
  return data.lines.features.filter((f) => ids.has(f.properties.id));
}
export function geometrySegments(feature: TrailFeature): number[][][] {
  return feature.geometry.type === "LineString"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
}
export function routeDay(data: Dataset, id: RouteId, n: number) {
  const config = data.content.routes[id],
    mapped = data.routes
      .find((r) => r.id === id)!
      .days.find((d) => d.day === n);
  return {
    ...(config.days[n - 1] ?? data.content.routes.safe.days[n - 1]!),
    day: n,
    miles: mapped?.miles ?? 0,
    featureIds: mapped?.featureIds ?? [],
    camp: config.camp[n - 1],
  };
}
export function initialRoute(search: string): RouteId {
  const id = new URLSearchParams(search).get("route");
  return routeOrder.includes(id as RouteId) ? (id as RouteId) : "short";
}
export function filteredRoutes(data: Dataset, query: string, maxMiles: number) {
  const q = query.toLocaleLowerCase().trim();
  return data.routes.filter(
    (r) =>
      r.miles <= maxMiles &&
      `${data.content.routes[r.id].label} ${data.content.routes[r.id].intro} ${routeSubtitles[r.id]} ${permitCode(r.id)}`
        .toLocaleLowerCase()
        .includes(q),
  );
}
export const distance = (n: number) => n.toFixed(1);
export function isSnapshotStale(checkedAt: string, now = Date.now()) {
  const parsed = new Date(checkedAt).getTime();
  return (
    !Number.isFinite(parsed) || parsed > now || now - parsed > 60 * 60 * 1000
  );
}
