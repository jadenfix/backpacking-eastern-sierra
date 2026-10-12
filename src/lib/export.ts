import type { Dataset, Route } from "../types";
import { geometrySegments, routeFeatures, routeDay } from "./routes";
export function xmlEscape(s: string) {
  return s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
}
export function makeGpx(data: Dataset, route: Route) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Eastern Sierra Atlas" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${xmlEscape(data.content.routes[route.id].label)}</name><desc>Agency-mapped planning geometry. Source gaps preserved. Not a current field report, parking authorization or permit. No elevation data.</desc></metadata>${routeFeatures(
    data,
    route,
  )
    .map(
      (f) =>
        `<trk><name>Day ${f.properties.day}: ${xmlEscape(f.properties.name)}</name>${geometrySegments(
          f,
        )
          .map(
            (seg) =>
              `<trkseg>${seg.map((p) => `<trkpt lat="${p[1]}" lon="${p[0]}"></trkpt>`).join("")}</trkseg>`,
          )
          .join("")}</trk>`,
    )
    .join("")}</gpx>`;
}
export function makeNotes(data: Dataset, route: Route) {
  return `${data.content.routes[route.id].label}\nOctober 13–16, 2026 · ${route.miles} mapped miles\n${route.entry}\n\nNOT RESERVED. Permit inventory snapshot ${data.permits.checkedLabel}; refresh on Recreation.gov.\nClass 2 maximum requested; mapped trail intent is not certified current clearance. No Cecile traverse or summit. Parking/current footing need verification.\n\n${[
    1, 2, 3, 4,
  ]
    .map((n) => {
      const d = routeDay(data, route.id, n);
      return `DAY ${n} — ${d.title}\n${d.miles ? d.miles + " mapped miles" : "Flexible day; outings not counted"}\n${d.directions.join("\n")}\nNight: ${d.camp}\n${d.warning}`;
    })
    .join(
      "\n\n",
    )}\n\n${(data.content.routes[route.id].checks ?? data.content.checks).map((c) => `${c.title}: ${c.body}`).join("\n\n")}\n\n${data.content.sources.map((s) => `${s.title}\n${s.url}\n${s.note}`).join("\n\n")}`;
}
export function downloadFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
