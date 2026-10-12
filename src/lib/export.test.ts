import test from "node:test";
import assert from "node:assert/strict";
import { readDataset } from "../../scripts/validate-data";
import { makeGpx, makeNotes } from "./export";
import { geometrySegments, routeFeatures } from "./routes";
const data = readDataset();

test("each GPX preserves every agency segment and coordinate without bridging source gaps or inventing elevation", () => {
  for (const route of data.routes) {
    const gpx = makeGpx(data, route);
    const features = routeFeatures(data, route);
    const expected = features.flatMap(geometrySegments);
    const segments = [...gpx.matchAll(/<trkseg>([\s\S]*?)<\/trkseg>/g)].map(
      (match) =>
        [
          ...match[1].matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)"><\/trkpt>/g),
        ].map((point) => [Number(point[2]), Number(point[1])]),
    );
    assert.deepEqual(
      segments,
      expected,
      `${route.id}: export altered agency topology`,
    );
    assert.equal((gpx.match(/<trk>/g) ?? []).length, features.length);
    assert.ok(gpx.startsWith('<?xml version="1.0"'));
    assert.ok(gpx.includes("http://www.topografix.com/GPX/1/1"));
    assert.ok(!gpx.includes("<ele>"), "No source elevation exists");
  }
});

test("GPX escapes destination and track names, including entity-looking text and XML delimiters", () => {
  const injected = structuredClone(data);
  const route = injected.routes[0];
  const unsafe = `Lake <spur> & "A" 'B' &amp;`;
  injected.content.routes[route.id].label = unsafe;
  const id = route.days[0].featureIds[0];
  injected.lines.features.find((f) => f.properties.id === id)!.properties.name =
    unsafe;
  const gpx = makeGpx(injected, route);
  const escaped =
    "Lake &lt;spur&gt; &amp; &quot;A&quot; &apos;B&apos; &amp;amp;";
  assert.ok(gpx.includes(`<name>${escaped}</name>`));
  assert.ok(gpx.includes(`Day 1: ${escaped}</name>`));
  assert.ok(!gpx.includes("<spur>"));
});

test("exported notes retain permit snapshot and unresolved physical/legal evidence instead of implying a booking", () => {
  for (const route of data.routes) {
    const notes = makeNotes(data, route);
    assert.ok(notes.includes("NOT RESERVED."));
    assert.ok(notes.includes(data.permits.checkedLabel));
    assert.ok(notes.includes(route.entry));
    assert.ok(notes.includes("not certified current clearance"));
    assert.ok(notes.includes("Parking/current footing need verification"));
    assert.equal((notes.match(/DAY [1-4] —/g) ?? []).length, 4);
    assert.ok(!notes.includes("undefined"));
  }
});
