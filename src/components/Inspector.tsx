import { useState, useRef, useEffect } from "react";
import {
  ExternalLink,
  ArrowUpRight,
  MapPin,
  Droplets,
  Car,
  TriangleAlert,
  Mountain,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Dataset, Place, Route, Photo } from "../types";
import { permitCode, isSnapshotStale } from "../lib/routes";
export function Inspector({
  data,
  route,
  placeId,
  onPlace,
  onAccess,
}: {
  data: Dataset;
  route: Route;
  placeId: string;
  onPlace: (id: string) => void;
  onAccess: () => void;
}) {
  const [tab, setTab] = useState("about"),
    [enlarged, setEnlarged] = useState(false);
  const config = data.content.routes[route.id],
    place =
      data.places.find((p) => p.id === placeId) ??
      data.places.find((p) => p.id === config.stops[1])!;
  const stops = config.stops
    .map((id) => data.places.find((p) => p.id === id))
    .filter(Boolean) as Place[];
  const i = stops.findIndex((p) => p.id === place.id);
  const p = data.permits.entries[permitCode(route.id)];
  return (
    <aside className="inspector" aria-label="Selected place details">
      <div className="photo-frame">
        {place.photo ? (
          <button
            onClick={() => setEnlarged(true)}
            aria-label={`Enlarge ${place.name} photograph`}
          >
            <img
              src={`${import.meta.env.BASE_URL}${place.photo.url}`}
              alt={place.photo.alt}
            />
            <span className="photo-caption">
              Historical photograph <ArrowUpRight size={15} />
            </span>
          </button>
        ) : (
          <div className="photo-empty">
            <Mountain size={30} />
            <p>
              {place.category === "parking"
                ? "Trailhead reference"
                : "Mapped place reference"}
            </p>
            <small>No verified photo available</small>
          </div>
        )}
        <div className="photo-navigation">
          <button
            className="icon-button"
            aria-label="Previous route place"
            onClick={() =>
              onPlace(
                stops[(Math.max(i, 0) - 1 + stops.length) % stops.length].id,
              )
            }
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="icon-button"
            aria-label="Next route place"
            onClick={() =>
              onPlace(stops[(Math.max(i, 0) + 1) % stops.length].id)
            }
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="inspector-head">
        <h2>{place.name.replace(" trail area", "")}</h2>
        <p>
          {place.category === "peak"
            ? "Scenic reference · no summit route"
            : place.category === "parking"
              ? "Trailhead · parking permission unverified"
              : "Lake / basin reference · not an assigned campsite"}
        </p>
        {place.photo && (
          <small>
            {place.photo.attribution} ·{" "}
            <a href={place.photo.licenseUrl} target="_blank" rel="noreferrer">
              {place.photo.license}
            </a>
          </small>
        )}
      </div>
      <div className="inspector-tabs" role="tablist" aria-label="Place details">
        {["about", "trail", "parking", "water"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="place-description" role="tabpanel">
        {tab === "about" ? (
          <>
            <p>{place.description}</p>
            <div className="coordinate-row">
              <MapPin size={14} />
              {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${place.name} in Google Maps`}
              >
                <ExternalLink size={14} />
              </a>
            </div>
            <p className="small-note">
              Pins identify places, not exact trail endpoints or legal
              campsites.
            </p>
          </>
        ) : tab === "trail" ? (
          <>
            <p>
              Follow the mapped trail itinerary. No Cecile–Iceberg shortcut,
              cross-country pass or summit is part of this plan.
            </p>
            <dl>
              <div>
                <dt>Terrain intent</dt>
                <dd>Hiking trails</dd>
              </div>
              <div>
                <dt>Class 2 ceiling</dt>
                <dd>Not field-certified</dd>
              </div>
              <div>
                <dt>Elevation gain</dt>
                <dd>Not calculated</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>USDA / NPS GIS</dd>
              </div>
            </dl>
            <p className="small-note">
              Snow, ice, washouts or obstacles can change travel difficulty.
              Retreat instead of scrambling around them.
            </p>
          </>
        ) : tab === "parking" ? (
          <>
            <p>
              <Car size={16} />{" "}
              {route.id === "sabrina"
                ? "Forest Service guidance identifies the overnight turnout near the North Lake turnoff; the lake-end lot is day use. Confirm current signs and Hwy 168. The road walk adds mileage."
                : "The route permit does not grant overnight parking. Confirm the exact spaces and road access for October 13–16 before leaving a vehicle."}
            </p>
            <button className="text-button" onClick={onAccess}>
              View route access checks <ArrowUpRight size={14} />
            </button>
          </>
        ) : (
          <>
            <p>
              <Droplets size={16} />{" "}
              {place.water ||
                "No dependable water source established at this place. Carry water to your first confirmed accessible source."}
            </p>
            <p className="small-note">
              Natural sources are expected, not verified today. Treat water.
              Protect a wetted hollow-fiber filter from freezing; ice-covered
              water may be inaccessible.
            </p>
            <a
              href="https://help.sawyer.com/retail/products/squeeze-water-filter"
              target="_blank"
              rel="noreferrer"
            >
              Filter freezing guidance <ExternalLink size={13} />
            </a>
          </>
        )}
      </div>
      <section className="access-summary">
        <h3>Access & permits</h3>
        <button onClick={onAccess}>
          <TriangleAlert size={15} />
          <span>Parking / current footing unverified</span>
          <ArrowUpRight size={14} />
        </button>
        <a href={data.permits.source} target="_blank" rel="noreferrer">
          <TriangleAlert size={15} />
          <span>Permit not reserved · {p.code}</span>
          <ExternalLink size={13} />
        </a>
        <div className="snapshot">
          <strong>
            {p.available} spaces shown <span>Snapshot</span>
          </strong>
          <p>{data.permits.checkedLabel}</p>
          <p>
            {isSnapshotStale(data.permits.checkedAt)
              ? "Inventory may have changed. "
              : ""}
            <a href={data.permits.source} target="_blank" rel="noreferrer">
              Check live availability ↗
            </a>
          </p>
        </div>
      </section>
      <section className="along-way">
        <h3>Along the way</h3>
        <div>
          {stops.map((p) => (
            <button
              key={p.id}
              className={p.id === place.id ? "active" : ""}
              onClick={() => onPlace(p.id)}
            >
              {p.photo && (
                <img
                  src={`${import.meta.env.BASE_URL}${p.photo.url}`}
                  alt=""
                  loading="lazy"
                />
              )}
              <span>{p.name.replace(" trail area", "")}</span>
            </button>
          ))}
        </div>
      </section>
      {enlarged && place.photo && (
        <PhotoDialog
          photo={place.photo}
          name={place.name}
          onClose={() => setEnlarged(false)}
        />
      )}
    </aside>
  );
}

function PhotoDialog({
  photo,
  name,
  onClose,
}: {
  photo: Photo;
  name: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="photo-modal"
      aria-label={name}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        className="icon-button"
        autoFocus
        onClick={onClose}
        aria-label="Close photograph"
      >
        <X />
      </button>
      <figure>
        <img src={`${import.meta.env.BASE_URL}${photo.url}`} alt={photo.alt} />
        <figcaption>
          {photo.attribution} · {photo.license} · historical image ·{" "}
          <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
            Source
          </a>
        </figcaption>
      </figure>
    </dialog>
  );
}
