# Design intent

The planner uses a restrained white-and-black visual language with clear typography, generous spacing and real destination photography. The map is the working center of the page, with trip choices and day-by-day inspection visible around it. Color, when used on the map, supports geographic distinctions rather than adding decorative complexity.

## One trip, several levels of detail

The desktop layout has three columns: a route rail, the map workspace and a day-plan / place inspector. The rail makes all seven trips easy to switch between and shows their approximate distance and permit entry. The map shows the full selected itinerary with optional trail context. The inspector provides daily travel, legal-access evidence and real historical photographs without obscuring the route.

Selecting a day narrows attention while preserving a clear path back to the full trip. Selecting a place exposes its description, water caveat and photo attribution. Persistent fit-route and reset actions recover from exploratory panning. Route changes update map geometry, daily mileage, primary stops and permit entry together; stale information from a previous trip must not linger.

Essential controls remain visible and usable without hovering. Hover and focus previews add detail; they do not contain the only route warning or booking status. Keep previews beside their triggers where possible, dismissible, and away from zoom, layers and route controls. Touch and keyboard users need the same inspection actions, visible focus and large targets.

## Responsive layout

At widths of 1,000 pixels or less, move the inspector below the map so the route remains readable. At 700 pixels or less, place the route rail in a drawer with an obvious open/close control and the current route still visible. The drawer must support keyboard focus, dismissal and touch scrolling. Allow the document to scroll vertically; do not shrink three desktop columns into unreadable phone panels or require horizontal scrolling.

Photos should use an intentional crop and retain access to their full image and credits. Dense evidence belongs in an expandable inspection surface or source link, while unresolved parking, permit status and terrain constraints remain visible in the primary trip view.

## Evidence corrections are part of the design

- Use actual agency GIS geometry. A concept rendering can guide composition, but its imagined trail lines, lake shapes or distances must never become route data.
- Show approximate mapped mileage; omit invented elevation profiles, cumulative ascent or other metrics not calculated from an appropriate source.
- Show historical permit checks with their timestamp and unreserved status. Do not invent a live availability indicator or a successful booking.
- Exclude Cecile from runtime routes under the Class 2 ceiling. Remove Baboon from Sabrina's default itinerary and show the resulting 17.0-mile planning estimate and flexible day 3.
- Preserve closure analysis as GIS evidence, distinguish it from authorization, and leave overnight parking unresolved until verified.
- Use sourced wilderness rules. Do not add plausible-looking dog restrictions or other unsupported policy claims to make a card feel complete.
- Use real, correctly located photographs with author and license information. Historical beauty does not establish today's snow, water or footing.

The desired result is calm enough to understand the whole trip immediately and precise enough to inspect a single day, trail or open logistical question without losing context.
