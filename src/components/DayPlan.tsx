import {
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  MapPin,
  Route as RouteIcon,
  AlertCircle,
} from "lucide-react";
import type { Dataset, Route } from "../types";
import { routeDay, routeFeatures, distance } from "../lib/routes";
export function DayPlan({
  data,
  route,
  day,
  setDay,
  leg,
  setLeg,
}: {
  data: Dataset;
  route: Route;
  day: number;
  setDay: (n: number) => void;
  leg: string | null;
  setLeg: (id: string | null) => void;
}) {
  const days = [1, 2, 3, 4].map((n) => routeDay(data, route.id, n));
  const details = days[day ? day - 1 : 0];
  const features = routeFeatures(data, route, details.day);
  return (
    <section className="day-plan" aria-label="Daily trail plan">
      <div className="day-nav">
        <button
          className={`all-days ${day === 0 ? "active" : ""}`}
          aria-pressed={day === 0}
          onClick={() => setDay(0)}
        >
          Full trip
        </button>
        {days.map((d) => (
          <button
            key={d.day}
            className={day === d.day ? "active" : ""}
            aria-pressed={day === d.day}
            onClick={() => setDay(d.day)}
            data-testid={`day-${d.day}`}
          >
            <strong>Day {d.day}</strong>
            <span>{d.miles ? `${distance(d.miles)} mi` : "Flexible"}</span>
          </button>
        ))}
      </div>
      <div className="day-detail">
        <div className="day-heading">
          <div>
            <span className="muted">
              {day
                ? `Day ${day} · ${["Tue 13", "Wed 14", "Thu 15", "Fri 16"][day - 1]} October`
                : "Start here · Day 1"}
            </span>
            <h3>{details.title}</h3>
          </div>
          {day > 0 && (
            <button className="text-button" onClick={() => setDay(0)}>
              <ArrowLeft size={14} />
              Back to full trip
            </button>
          )}
        </div>
        <p>{details.summary}</p>
        <div className="day-facts">
          <span>
            <RouteIcon size={14} />
            {details.miles
              ? `${distance(details.miles)} mapped mi`
              : "No extra miles counted"}
          </span>
          <span>
            <MapPin size={14} />
            {details.camp}
          </span>
        </div>
        {features.length > 0 && (
          <div className="leg-list" aria-label="Inspect individual trail legs">
            {features.map((f, i) => (
              <button
                key={f.properties.id}
                className={leg === f.properties.id ? "selected" : ""}
                onClick={() =>
                  setLeg(leg === f.properties.id ? null : f.properties.id)
                }
                aria-pressed={leg === f.properties.id}
              >
                <span className="leg-number">{i + 1}</span>
                <span>
                  {f.properties.name}
                  <small>
                    {f.properties.trailNames?.join(" → ") ||
                      "Agency-mapped trail"}
                    {f.properties.coverageGap ? " · source gap" : ""}
                  </small>
                </span>
                <strong>{f.properties.miles?.toFixed(1)} mi</strong>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        )}
        <details open={day > 0}>
          <summary>
            Step-by-step directions <ChevronDown size={15} />
          </summary>
          <ol>
            {details.directions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ol>
        </details>
        <p className="day-warning">
          <AlertCircle size={15} />
          {route.id === "sabrina" && details.day === 3
            ? "Baboon is optional, cairn-marked and not certified Class ≤2. Under a strict limit, omit it and rest or explore established trails near Hungry Packer."
            : details.warning}
        </p>
      </div>
    </section>
  );
}
