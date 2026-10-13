import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";

const output = process.env.DEMO_OUTPUT ?? "docs/demo/frames";
const manifest = JSON.parse(
  readFileSync("docs/demo/source-manifest.json", "utf8"),
);

for (const input of manifest.inputs) {
  const bytes = readFileSync(input.path);
  const actual = createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
  assert.equal(
    actual,
    input.git_blob_sha,
    `Recording source changed: ${input.path}. Regenerate, recapture and review the demo.`,
  );
}
console.log(
  `Verified ${manifest.inputs.length} pinned application inputs for ${manifest.recorded_application_source_sha}`,
);
if (process.argv.includes("--verify-only")) process.exit(0);

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
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
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  acceptDownloads: true,
});
const allowedRemoteDomains = new Set();
const blockedRemoteRequests = [];
const expectedRemote = new Set([
  "basemap.nationalmap.gov",
  "server.arcgisonline.com",
  "tile.openstreetmap.org",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
]);
await context.route("**/*", (route) => {
  const requestUrl = route.request().url();
  const url = new URL(requestUrl);
  if (
    url.hostname === "127.0.0.1" ||
    url.protocol === "data:" ||
    url.protocol === "blob:"
  )
    return route.continue();
  if (expectedRemote.has(url.hostname)) {
    allowedRemoteDomains.add(url.hostname);
    return route.continue();
  }
  blockedRemoteRequests.push(requestUrl);
  return route.abort();
});

const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
let captureActive = true;
let frameIndex = 0;
const frames = [];
const started = Date.now();
const chapterLog = [];
let samplePromise;
const startSampling = () =>
  (async () => {
    while (captureActive) {
      const name = `frame-${String(frameIndex++).padStart(5, "0")}.jpg`;
      await page.screenshot({
        path: `${output}/${name}`,
        type: "jpeg",
        quality: 88,
      });
      frames.push({ name, at: (Date.now() - started) / 1000 });
      await pause(150);
    }
  })();

let exportReceipt;
try {
  await page.goto("http://127.0.0.1:4173/", {
    waitUntil: "networkidle",
  });
  await expect(
    page.getByRole("heading", { name: "Eastern Sierra" }),
  ).toBeVisible();
  await expect(
    page.getByText("Minaret focus", { exact: true }).first(),
  ).toBeVisible();
  await page.addStyleTag({
    content: `
      .app-shell { height: calc(100dvh - 72px) !important; }
      #demo-caption { position: fixed; inset: auto 0 0 0; height: 72px; z-index: 2000;
        background: #18201def; color: #f8f5ef; border-top: 1px solid #42534b;
        display: flex; align-items: center; justify-content: space-between; padding: 0 28px;
        font: 14px/1.25 "DM Sans", system-ui, sans-serif; box-shadow: 0 -12px 35px #17201d22; }
      #demo-caption strong { display:block; font: 24px/1.1 "Libre Caslon Display", Georgia, serif; }
      #demo-caption small { color:#c3cdc7; display:block; margin-top:5px; }
      #demo-caption .demo-tag { border:1px solid #71857b; border-radius:999px; padding:8px 13px;
        color:#f2cfaa; letter-spacing:.07em; font-size:11px; white-space:nowrap; }
    `,
  });
  await page.evaluate((sourceSha) => {
    const caption = document.createElement("div");
    caption.id = "demo-caption";
    caption.innerHTML = `<div><strong id="demo-chapter"></strong><small>Actual production browser · source ${sourceSha.slice(0, 12)} · planning evidence, not field clearance</small></div><span class="demo-tag">HISTORICAL / STATIC DATA</span>`;
    document.body.append(caption);
  }, manifest.recorded_application_source_sha);
  const chapter = async (title) => {
    chapterLog.push({ title, at: (Date.now() - started) / 1000 });
    await page.locator("#demo-chapter").evaluate((node, text) => {
      node.textContent = text;
    }, title);
  };

  samplePromise = startSampling();
  await chapter("01 / Inspect a mapped itinerary and its evidence");
  await pause(2600);
  await page.getByTestId("day-1").click();
  await expect(page.getByText(/Day 1 · Tue 13 October/)).toBeVisible();
  await page.locator(".leg-list button").first().click();
  await chapter("02 / Focus a real agency trail leg — source gaps preserved");
  await pause(2600);

  const nextPlace = page.getByRole("button", { name: "Next route place" });
  await nextPlace.click();
  await expect(page.locator(".inspector-head h2")).toBeVisible();
  const enlarge = page.locator('.photo-frame button[aria-label^="Enlarge"]');
  if (await enlarge.count()) {
    await enlarge.click();
    await expect(page.locator("dialog.photo-modal")).toBeVisible();
    await chapter("03 / Open a licensed historical photograph");
    await pause(2200);
    await page.getByRole("button", { name: "Close photograph" }).click();
  }

  await page.getByRole("button", { name: "Map layers" }).click();
  await page.getByLabel("Nearby mapped trails").check();
  await page.getByLabel("Closed road · 2026 order").check();
  await chapter("04 / Compare nearby trails with the documented road closure");
  await pause(2700);
  await page.getByRole("button", { name: "Close map layers" }).click();

  await page.getByRole("button", { name: "Access", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Access before departure" }),
  ).toBeVisible();
  await chapter("05 / Keep permits, parking and current conditions unresolved");
  await pause(3000);

  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "GPX trail track" }).click();
  const download = await downloadPromise;
  const exportPath = `${output}/exported-route.gpx`;
  await download.saveAs(exportPath);
  const exportBytes = readFileSync(exportPath);
  assert.ok(
    exportBytes.length > 1000,
    "GPX export should contain route geometry",
  );
  assert.match(exportBytes.toString("utf8", 0, 200), /<gpx/);
  exportReceipt = {
    file: download.suggestedFilename(),
    bytes: exportBytes.length,
    sha256: createHash("sha256").update(exportBytes).digest("hex"),
  };
  await expect(page.locator(".toast")).toContainText(
    "GPX exported with source gaps preserved.",
  );
  await chapter(
    "06 / Export the actual GPX — separate source segments retained",
  );
  await pause(2500);

  await page.getByRole("button", { name: "Sources", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Evidence, not assumptions" }),
  ).toBeVisible();
  await chapter("07 / Trace the geometry, rules and photo provenance");
  await pause(2600);
  await page.getByRole("button", { name: "Full stack", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The full stack" }),
  ).toBeVisible();
  await chapter("08 / A static, inspectable atlas — no keys or paid services");
  await pause(2700);
  await page.screenshot({ path: "docs/demo/poster.png", type: "png" });
} finally {
  captureActive = false;
  if (samplePromise) await samplePromise;
  writeFileSync(
    `${output}/frames.json`,
    `${JSON.stringify(
      {
        schema: 1,
        recorded_application_source_sha:
          manifest.recorded_application_source_sha,
        frames,
        chapters: chapterLog,
        page_errors: pageErrors,
        blocked_remote_requests: blockedRemoteRequests,
        allowed_remote_domains: [...allowedRemoteDomains].sort(),
        export_receipt: exportReceipt,
      },
      null,
      2,
    )}\n`,
  );
  await browser.close();
  server.kill();
}

assert.deepEqual(pageErrors, [], "Browser emitted page errors");
assert.deepEqual(
  blockedRemoteRequests,
  [],
  "Capture attempted an unexpected remote request",
);
console.log(
  `Captured ${frames.length} actual browser frames; GPX ${exportReceipt.bytes} bytes; allowed public map/font domains: ${[...allowedRemoteDomains].sort().join(", ")}`,
);
