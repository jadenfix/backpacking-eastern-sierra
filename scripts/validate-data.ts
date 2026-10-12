import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { normalizeData } from "../src/lib/data";
import {
  geometrySegments,
  permitCode,
  routeFeatures,
  routeOrder,
} from "../src/lib/routes";
import type { Dataset } from "../src/types";

export function readDataset(): Dataset {
  const read = (name: string) =>
    JSON.parse(
      readFileSync(new URL(`../public/data/${name}`, import.meta.url), "utf8"),
    );
  return normalizeData({
    places: read("places.json"),
    routes: read("routes.json").routes,
    content: read("content.json"),
    permits: read("permits.json"),
    trails: read("trails.geojson"),
    lines: read("route-lines.geojson"),
    road: read("closed-road.geojson"),
  });
}

export function validateDataset(data: Dataset) {
  assert.deepEqual(
    data.routes.map((r) => r.id),
    routeOrder,
    "Exactly the seven eligible routes must be selectable",
  );
  assert.equal(
    new Set(data.lines.features.map((f) => f.properties.id)).size,
    data.lines.features.length,
    "Feature IDs must be unique",
  );
  for (const collection of [data.lines, data.trails, data.road]) {
    for (const feature of collection.features) {
      assert.ok(
        ["LineString", "MultiLineString"].includes(feature.geometry.type),
      );
      for (const segment of geometrySegments(feature)) {
        assert.ok(
          segment.length >= 2,
          `${feature.properties.id}: empty/degenerate segment`,
        );
        for (const coordinate of segment) {
          assert.ok(
            coordinate.length >= 2 && coordinate.every(Number.isFinite),
            "Non-finite coordinate",
          );
          assert.ok(
            Math.abs(coordinate[0]) <= 180 && Math.abs(coordinate[1]) <= 90,
            "Coordinate outside WGS84 bounds",
          );
        }
      }
    }
  }
  for (const place of data.places) {
    assert.ok(Number.isFinite(place.lat) && Math.abs(place.lat) <= 90);
    assert.ok(Number.isFinite(place.lon) && Math.abs(place.lon) <= 180);
  }
  const ids = new Map(data.lines.features.map((f) => [f.properties.id, f]));
  for (const route of data.routes) {
    const config = data.content.routes[route.id];
    assert.ok(
      config && config.days.length === 4 && config.camp.length === 4,
      `${route.id}: incomplete four-day content`,
    );
    assert.ok(
      data.permits.entries[permitCode(route.id)],
      `${route.id}: missing matching permit entry`,
    );
    for (const day of route.days) {
      assert.ok(day.day >= 1 && day.day <= 4 && day.miles >= 0);
      let sum = 0;
      for (const id of day.featureIds) {
        const feature = ids.get(id);
        assert.ok(feature, `${route.id}: missing feature ${id}`);
        assert.equal(
          feature.properties.routeId,
          route.id,
          "Route references another itinerary",
        );
        assert.equal(
          feature.properties.day,
          day.day,
          "Day references another day",
        );
        assert.equal(
          feature.properties.kind,
          "trail",
          "Selectable route includes scrambling",
        );
        sum += feature.properties.miles ?? 0;
      }
      assert.ok(
        Math.abs(sum - day.miles) <= 0.061,
        `${route.id} day ${day.day}: feature mileage mismatch`,
      );
    }
    assert.ok(
      Math.abs(route.days.reduce((n, d) => n + d.miles, 0) - route.miles) <=
        0.201,
      `${route.id}: total mileage mismatch`,
    );
    const segments = routeFeatures(data, route).flatMap(geometrySegments);
    assert.ok(segments.length > 0, `${route.id}: no geometry`);
    assert.deepEqual(
      segments[0][0],
      segments.at(-1)!.at(-1),
      `${route.id}: does not return to its starting point`,
    );
  }
  assert.ok(
    !data.lines.features.some((f) => f.properties.routeId === "classic"),
  );
  assert.ok(
    !data.trails.features.some((f) =>
      /scramble/i.test(f.properties.kind ?? ""),
    ),
  );
  const sabrina = data.routes.find((r) => r.id === "sabrina")!;
  assert.equal(
    sabrina.miles,
    17,
    "Default Sabrina route must exclude Baboon outing mileage",
  );
  assert.equal(
    routeFeatures(data, sabrina, 3).length,
    0,
    "Default Sabrina day 3 must be flexible",
  );
  assert.ok(
    !routeFeatures(data, sabrina).some((f) =>
      /baboon/i.test(f.properties.name),
    ),
  );
  assert.ok(!data.content.routes.sabrina.stops.includes("baboon"));
  assert.ok(
    Number.isFinite(Date.parse(data.permits.checkedAt)),
    "Permit snapshot needs a valid timestamp",
  );
  return {
    routes: data.routes.length,
    routeFeatures: data.lines.features.length,
    trailFeatures: data.trails.features.length,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(
    "Validated agency geometry, references, mileage, loops and eligible route defaults:",
    validateDataset(readDataset()),
  );
}
