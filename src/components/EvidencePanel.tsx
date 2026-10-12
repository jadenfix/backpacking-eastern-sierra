import {
  ArrowUpRight,
  ExternalLink,
  TriangleAlert,
  Layers,
  GitBranch,
  Code2,
  Database,
  Map,
} from "lucide-react";
import type { Dataset, Route } from "../types";
import { permitCode } from "../lib/routes";
export function EvidencePanel({
  data,
  route,
  view,
  checks,
  toggleCheck,
}: {
  data: Dataset;
  route: Route;
  view: "access" | "sources" | "stack";
  checks: Record<string, boolean>;
  toggleCheck: (id: string) => void;
}) {
  const code = permitCode(route.id);
  const routeChecks =
    data.content.routes[route.id].checks ??
    (route.id === "rush"
      ? [
          {
            id: "rush-parking",
            title: "Confirm Silver Lake overnight parking",
            body: "Ask for the exact Rush Creek trailhead spaces, Hwy 158 access and current Island Pass conditions for Oct 13–16.",
          },
          ...data.content.checks.filter((c) => c.id === "conditions"),
        ]
      : data.content.checks);
  return (
    <div className="evidence-panel">
      {view === "access" ? (
        <>
          <header>
            <h2>Access before departure</h2>
            <p>{data.content.routes[route.id].label} · October 13–16, 2026</p>
          </header>
          <div className="evidence-callout">
            <TriangleAlert size={20} />
            <div>
              <strong>Mapped does not mean cleared.</strong>
              <p>
                Overnight parking, current snow / ice and final permit issuance
                remain unresolved. Your checkmarks are personal notes, not
                agency verification.
              </p>
            </div>
          </div>
          <section>
            <h3>Permit · {code}</h3>
            <p>
              Correct entry: {data.permits.entries[code].name}.{" "}
              {data.permits.entries[code].available} spaces were shown for one
              person on October 13, checked {data.permits.checkedLabel}.{" "}
              <strong>Nothing is reserved or paid.</strong>
            </p>
            <a
              className="primary-button"
              href={data.permits.source}
              target="_blank"
              rel="noreferrer"
            >
              Open Recreation.gov <ArrowUpRight size={16} />
            </a>
            <p className="small-note">
              Availability is a historical snapshot. A reservation must be
              finalized and the issued permit obtained; it does not override
              closure or parking rules.
            </p>
          </section>
          {["short", "safe", "balanced"].includes(route.id) && (
            <section>
              <h3>Reds Meadow closure · 2026</h3>
              <p>
                Order 05-04-52-26-19 closes Reds Meadow Road and Forest Service
                land within 200 feet on either side during your Tuesday–Friday
                dates. An ordinary wilderness permit is not the stated
                exemption.
              </p>
              <div className="evidence-fact">
                <Layers size={17} />
                <p>
                  The mapped Mammoth Pass / Upper Crater Meadow approach stays
                  approximately <strong>342 metres</strong> from the main road
                  at its closest point in our GIS comparison. That supports
                  avoiding this corridor; it is not current ranger or field
                  clearance.
                </p>
              </div>
              <a
                href="https://www.fs.usda.gov/r05/inyo/alerts/reds-meadow-road-reconstruction-project"
                target="_blank"
                rel="noreferrer"
              >
                Current closure order <ExternalLink size={13} />
              </a>{" "}
              ·{" "}
              <a
                href={`${import.meta.env.BASE_URL}data/reds-meadow-2026-closure-order.pdf`}
                target="_blank"
                rel="noreferrer"
              >
                Signed PDF
              </a>
            </section>
          )}
          <section>
            <h3>Departure checklist</h3>
            <div className="departure-checks">
              {routeChecks.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={!!checks[`${route.id}:${c.id}`]}
                    onChange={() => toggleCheck(`${route.id}:${c.id}`)}
                  />
                  <span>
                    <strong>{c.title}</strong>
                    <p>{c.body}</p>
                  </span>
                </label>
              ))}
            </div>
            <a href="tel:7609245500">Mammoth Ranger Station · 760-924-5500</a>
            <p className="small-note">
              For Lake Mary Road within town: 760-934-8054. No ranger
              confirmation or call has been made by this app.
            </p>
          </section>
          <section>
            <h3>Class 2 maximum & water</h3>
            <p>
              Stay on the hiking-trail itinerary. Cecile–Iceberg, Whitebark
              shortcuts and summit climbs are excluded. Agency geometry does not
              certify a Class 2 ceiling under current conditions.
            </p>
            <p>
              Creeks and lakes are expected natural sources. Verify accessible
              water, treat it, and prevent a wetted hollow-fiber filter from
              freezing. A filter does not solve snow-covered tread or steep ice.
            </p>
            <p>{data.content.routes[route.id].recommendation}</p>
          </section>
        </>
      ) : view === "sources" ? (
        <>
          <header>
            <h2>Evidence, not assumptions</h2>
            <p>Source geometry, access rules and historical photography.</p>
          </header>
          <section>
            <h3>Route geometry</h3>
            <p>
              Actual USDA / NPS trail polylines, with source gaps preserved.
              Approximate mileage excludes campsite detours and ascent. Pins
              represent lake basins, not exact camps.
            </p>
          </section>
          {data.content.sources.map((s) => (
            <section className="source-item" key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                <h3>{s.title}</h3>
                <ExternalLink size={15} />
              </a>
              <p>{s.note}</p>
            </section>
          ))}
          <section>
            <h3>Photography</h3>
            <p>
              Real licensed photos with author and source links in the place
              inspector. Historical images do not establish today’s snow or
              water conditions.
            </p>
            {data.places
              .filter((p) => p.photo)
              .map((p) => (
                <div className="photo-credit" key={p.id}>
                  <a href={p.photo!.sourceUrl} target="_blank" rel="noreferrer">
                    {p.name}
                  </a>
                  <span>
                    {p.photo!.attribution} · {p.photo!.license}
                  </span>
                </div>
              ))}
          </section>
        </>
      ) : (
        <>
          <header>
            <h2>The full stack</h2>
            <p>
              A small, reproducible map application with inspectable source.
            </p>
          </header>
          <div className="stack-flow">
            {[
              {
                Icon: Code2,
                title: "React + TypeScript",
                body: "Accessible controls, synchronized route/day/place state and URL sharing.",
              },
              {
                Icon: Map,
                title: "Leaflet cartography",
                body: "Real agency route lines, topo / satellite / street tiles and clickable leg inspection.",
              },
              {
                Icon: Database,
                title: "Versioned public data",
                body: "GeoJSON, route directions, timestamped permit snapshots and licensed local photos.",
              },
              {
                Icon: GitBranch,
                title: "Vite + GitHub",
                body: "Locked dependencies, type checks, data integrity tests, production build and deployment workflow.",
              },
            ].map(({ Icon, title, body }) => (
              <section key={title}>
                <Icon size={22} />
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </section>
            ))}
          </div>
          <section>
            <h3>Runs locally. Builds anywhere.</h3>
            <pre>
              <code>
                npm ci{`\n`}npm run dev{`\n\n`}npm test{`\n`}npm run validate
                {`\n`}npm run build
              </code>
            </pre>
            <p>
              Static hosting serves the built client, data and images. External
              map tiles require a network connection. There is no paid model
              call, secret key or account database.
            </p>
            <p>
              Booking opens Recreation.gov directly; the app stores no payment
              details and cannot manufacture a reservation.
            </p>
            <a
              href="https://github.com/jadenfix/backpacking-eastern-sierra"
              target="_blank"
              rel="noreferrer"
            >
              Inspect the repository <ArrowUpRight size={15} />
            </a>
          </section>
        </>
      )}
    </div>
  );
}
