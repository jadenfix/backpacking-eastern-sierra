import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";

const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let serverOutput = "";
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (chunk) => {
    serverOutput = (serverOutput + chunk.toString()).slice(-12000);
  });
let ready = false;
for (let attempt = 0; attempt < 180; attempt++) {
  if (server.exitCode !== null)
    throw new Error(`Preview server exited:\n${serverOutput}`);
  try {
    const response = await fetch("http://127.0.0.1:4173/", {
      signal: AbortSignal.timeout(800),
    });
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 100));
}
if (!ready) throw new Error(`Preview startup timed out:\n${serverOutput}`);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function downloadedBytes(download) {
  const path = await download.path();
  assert.ok(path, "Browser should retain the downloaded file");
  return readFileSync(path);
}

async function runJourney(viewport, mobile) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      url.hostname === "127.0.0.1" ||
      url.protocol === "data:" ||
      url.protocol === "blob:"
    )
      return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://127.0.0.1:4173/?route=sabrina&day=3");
  await expect(page.getByTestId("day-3")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".route-heading h2")).toContainText("Sabrina");
  assert.equal(new URL(page.url()).searchParams.get("route"), "sabrina");
  assert.equal(new URL(page.url()).searchParams.get("day"), "3");

  if (mobile) await page.getByRole("button", { name: "Change route" }).click();
  await page.getByLabel("Search routes").fill("AA05");
  await expect(page.getByTestId("route-rush")).toBeVisible();
  await page.getByTestId("route-rush").click();
  await expect(page.locator(".route-heading h2")).toContainText("Rush Creek");
  assert.equal(new URL(page.url()).searchParams.get("route"), "rush");
  assert.equal(new URL(page.url()).searchParams.get("day"), null);

  await page.getByRole("button", { name: "Access", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Access before departure" }),
  ).toBeVisible();
  const firstCheck = page.locator(".departure-checks input").first();
  await firstCheck.check();
  await page.reload();
  await page.getByRole("button", { name: "Access", exact: true }).click();
  await expect(page.locator(".departure-checks input").first()).toBeChecked();

  await page.getByRole("button", { name: "Sources", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Evidence, not assumptions" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Full stack", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The full stack" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore", exact: true }).click();

  if (!mobile) {
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const gpxPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "GPX trail track" }).click();
    const gpx = await downloadedBytes(await gpxPromise);
    assert.ok(gpx.length > 1000);
    assert.match(gpx.toString("utf8", 0, 300), /<gpx/);
    await expect(page.locator(".toast")).toContainText(
      "GPX exported with source gaps preserved.",
    );

    await page.getByRole("button", { name: "Export", exact: true }).click();
    const geoPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "GeoJSON geometry" }).click();
    const geo = JSON.parse(
      (await downloadedBytes(await geoPromise)).toString(),
    );
    assert.equal(geo.type, "FeatureCollection");
    assert.ok(geo.features.length > 0);
  }

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  assert.ok(
    dimensions.content <= dimensions.viewport + 1,
    `Horizontal overflow: ${JSON.stringify(dimensions)}`,
  );
  assert.deepEqual(errors, []);
  await context.close();
  console.log(
    `PASS: production atlas route/deep-link/evidence/checklist/export journey at ${viewport.width}x${viewport.height}`,
  );
}

try {
  await runJourney({ width: 1440, height: 900 }, false);
  await runJourney({ width: 390, height: 844 }, true);
} finally {
  await browser.close();
  server.kill();
}
