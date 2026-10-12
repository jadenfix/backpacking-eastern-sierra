# Executed verification — October 12, 2026

This report describes software checks. It is not ranger clearance, a current field report or a permit reservation.

## Automated checks

- TypeScript strict check (including unused variables) and Vite production build passed.
- 11 Node test cases passed. They cover all seven eligible routes, malformed coordinates/references, route/day membership, distance totals, exact return to start, runtime exclusion of archived scramble data, Sabrina's17.0-mile default, flexible-day behavior, URL validation, permit timestamp expiry, GPX segment/coordinate preservation and XML escaping.
- Dataset validator passed: seven routes,33 highlighted route features,425 background trail features.
- npm audit reported0 vulnerabilities, including development dependencies, at the time checked.
- Source is formatted with Prettier; lockfile is committed.

## Browser journeys

Executed with Codex Browser/CUA, not simulated state changes:

- Development desktop: all7 routes ×4 days=28 daily journeys.
- Mobile390×844: all7 routes ×4 days=28 daily journeys; no horizontal overflow.320×740 layout also passed the overflow check.
- Production preview: all7 routes ×4 days=28 daily journeys, plus28 route/section navigation changes. Fresh production console contained no errors.
- Native Safari: every route tested at day1 and day4=14 additional journeys; returned to Minaret full trip. Initial map fit verified after reload.
- Search by permit, empty search state, filter reset and under40-mile filtering passed.
- Nearby trail/closed-road layer toggles, satellite/topo changes, map expansion/restoration, place inspection, all four inspector tabs and photo enlargement/close passed.
- Real browser GPX and GeoJSON downloads completed and their files were inspected. Automated tests check GPX for every route; source gaps remain separate track segments and no elevation is invented.

## Bugs found and fixed

1. Archived Cecile scramble traces could remain in the old map. Removed runtime geometry/selection and added regression checks.
2. Wrong alternative-route descriptions and untimestamped permit counts were replaced with route-specific text and explicit historical snapshots.
3. Invalid/future permit timestamps previously appeared fresh. They now fail closed as stale.
4. Canvas redraw during map unmount caused a Leaflet error. The map now uses SVG; the fresh production navigation run had no errors.
5. Safari could fit bounds before a usable map size existed. The resize observer now reapplies current route bounds after layout; reload showed the full route without a manual correction.
6. Route navigation retained a scrolled detail position. Route/view changes reset the relevant scroll container, including the mobile page.

## Design fidelity ledger

Compared the generated complete-screen concept with the latest browser and native Safari screenshots using view_image. Tested desktop1536×1024 and mobile breakpoints; Browser screenshot output is normalized to1280×720 JPEG, so it is not a native1536×1024 pixel capture. Native Safari provides a separate screenshot at the actual window size.

| Area | Implemented comparison / correction |
|---|---|
| Layout | Three-column route rail, dominant map/day navigator and photo/evidence inspector; compact open rails instead of nested cards. |
| Palette | White/black with restrained earthy uncertainty cues; no decorative gradients. |
| Typography | Serif route/place titles with deliberate sans-serif control typography; increased inspector/control readability. |
| Map/media | Real agency geography and credited historical photos replace concept-invented geography/scenery. |
| Controls | Visible route selection, fit/full-trip recovery, map layers outside the trail center, touch and keyboard-accessible inspector. |
| Responsive | Inspector moves below map at1000px; route drawer replaces rail at700px; tested down to320px. |
| Copy / data | Deliberately corrected concept's invented elevation gains, distances, day counts, pet rules and live availability. No unsupported metrics were implemented. |

No known clipped primary controls or horizontal overflow remain in tested layouts. Design structure was verified against the concept with documented evidence corrections; this is not a claim of pixel identity with its fictional map/data.

## Remaining external gates

- Hiking Class2 ceiling under current snow/ice conditions is not field-certified.
- Overnight parking/current road access remains unresolved as described in Access.
- Permit inventory is the Oct11 snapshot; no booking, payment or issued permit exists.
- External basemap tiles require network access and may fail; a visible fallback notice and alternative basemap remain available.
- GitHub CI / hosted deployment are separate evidence states from this local report. The repository includes CI and an optional manual Pages workflow; deployment is not inferred from a build.
