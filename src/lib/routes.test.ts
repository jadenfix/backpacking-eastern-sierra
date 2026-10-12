import test from "node:test";
import assert from "node:assert/strict";
import { readDataset, validateDataset } from "../../scripts/validate-data";
import { normalizeData } from "./data";
import {
  filteredRoutes,
  initialRoute,
  isSnapshotStale,
  routeDay,
  routeFeatures,
} from "./routes";

const data = readDataset();

test("all selectable agency routes pass geometry, reference, daily mileage and exact return-to-start validation", () => {
  assert.equal(validateDataset(data).routes, 7);
});

test("invalid coordinates, missing route legs and accidental cross-route reference fail validation", () => {
  const badCoordinate = structuredClone(data);
  badCoordinate.lines.features[0].geometry.coordinates = [
    [181, 37],
    [182, 38],
  ];
  badCoordinate.lines.features[0].geometry.type = "LineString";
  assert.throws(() => validateDataset(badCoordinate), /WGS84/);
  const missing = structuredClone(data);
  missing.routes[0].days[0].featureIds.push("absent-leg");
  assert.throws(() => validateDataset(missing), /missing feature/);
  const wrongDay = structuredClone(data);
  const id = wrongDay.routes[0].days[0].featureIds[0];
  wrongDay.lines.features.find((f) => f.properties.id === id)!.properties.day =
    4;
  assert.throws(() => validateDataset(wrongDay), /another day/);
});

test("Class2 default excludes classic, scramble lines and the optional Baboon hike", () => {
  assert.equal(initialRoute("?route=classic"), "short");
  assert.ok(data.routes.every((r) => String(r.id) !== "classic"));
  const sabrina = data.routes.find((r) => r.id === "sabrina")!;
  assert.deepEqual(routeFeatures(data, sabrina, 3), []);
  assert.equal(routeDay(data, "sabrina", 3).miles, 0);
  assert.ok(/flex|rest|weather/i.test(routeDay(data, "sabrina", 3).title));
});

test("runtime normalization prevents archived route and conditional scramble geometry reentering the map", () => {
  const raw = structuredClone(data);
  const archived = structuredClone(raw.routes[0]);
  Object.assign(archived, { id: "classic" });
  raw.routes.push(archived);
  const excludedLine = structuredClone(raw.lines.features[0]);
  excludedLine.properties = {
    ...excludedLine.properties,
    id: "archived-cecile",
    routeId: "classic",
  };
  raw.lines.features.push(excludedLine);
  const excludedTrail = structuredClone(raw.trails.features[0]);
  excludedTrail.properties = {
    ...excludedTrail.properties,
    id: "conditional-cecile",
    kind: "conditional_scramble",
  };
  raw.trails.features.push(excludedTrail);
  const normalized = normalizeData(raw);
  assert.equal(normalized.routes.length, 7);
  assert.ok(
    !normalized.lines.features.some(
      (f) => f.properties.id === "archived-cecile",
    ),
  );
  assert.ok(
    !normalized.trails.features.some(
      (f) => f.properties.id === "conditional-cecile",
    ),
  );
});

test("day filtering does not silently show other legs on basecamp/rest days", () => {
  for (const route of data.routes)
    for (let day = 1; day <= 4; day++) {
      const selected = routeFeatures(data, route, day);
      const expected = route.days.find((d) => d.day === day)?.featureIds ?? [];
      assert.deepEqual(
        selected.map((f) => f.properties.id).sort(),
        [...expected].sort(),
      );
    }
  assert.deepEqual(
    routeFeatures(
      data,
      data.routes.find((r) => r.id === "short")!,
      2,
    ),
    [],
  );
});

test("search uses exact permit code and route-specific text while mileage bounds restrict matches", () => {
  assert.deepEqual(
    filteredRoutes(data, "  jM05  ", 100).map((r) => r.id),
    ["mcgee"],
  );
  assert.deepEqual(
    filteredRoutes(data, "AA16", 40).map((r) => r.id),
    ["short"],
  );
  assert.equal(filteredRoutes(data, "no-such-lake", 100).length, 0);
  assert.ok(filteredRoutes(data, "", 32).every((r) => r.miles <= 32));
});

test("URL route initialization accepts eligible deep links and rejects missing/invalid/injection values", () => {
  assert.equal(initialRoute("?route=mcgee&day=2"), "mcgee");
  for (const search of [
    "",
    "?route=",
    "?route=CLASSIC",
    "?route=../safe",
    "?route=%3Cscript%3E",
    "?route=__proto__",
  ])
    assert.equal(initialRoute(search), "short");
});

test("permit snapshot expires independently of available quota; unknown timestamps fail closed", () => {
  const checked = Date.parse(data.permits.checkedAt);
  assert.equal(
    isSnapshotStale(data.permits.checkedAt, checked + 60 * 60 * 1000 + 1),
    true,
  );
  assert.equal(
    isSnapshotStale(data.permits.checkedAt, checked + 30 * 60 * 1000),
    false,
  );
  assert.equal(isSnapshotStale("invalid timestamp", checked), true);
  assert.equal(isSnapshotStale("2099-01-01T00:00:00Z", checked), true);
});
