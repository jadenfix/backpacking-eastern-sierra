import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
} from "geojson";
export type RouteId =
  "short" | "safe" | "balanced" | "rush" | "duck" | "mcgee" | "sabrina";
export interface Photo {
  url: string;
  sourceUrl: string;
  attribution: string;
  license: string;
  licenseUrl: string;
  alt: string;
  caption?: string;
}
export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: string;
  description: string;
  water: string | null;
  coordinateEvidence?: string;
  photo: Photo | null;
}
export interface Day {
  day: number;
  name: string;
  miles: number;
  featureIds: string[];
  legs: string[];
}
export interface Route {
  id: RouteId;
  title: string;
  miles: number;
  days: Day[];
  status: string;
  entry: string;
  description: string;
  distanceBasis: string;
}
export interface Check {
  id: string;
  title: string;
  body: string;
}
export interface DayContent {
  title: string;
  summary: string;
  stops: string[];
  directions: string[];
  warning: string;
}
export interface RouteContent {
  label: string;
  tag: string;
  intro: string;
  recommendation: string;
  stops: string[];
  camp: string[];
  days: (DayContent | null)[];
  permitCode?: string;
  previewPlace?: string;
  checks?: Check[];
}
export interface Source {
  title: string;
  url: string;
  note: string;
}
export interface Content {
  routes: Record<RouteId, RouteContent>;
  checks: Check[];
  sources: Source[];
}
export interface Permit {
  code: string;
  name: string;
  available: number;
  quota: number;
}
export interface Permits {
  checkedAt: string;
  checkedLabel: string;
  date: string;
  exit: string;
  group: number;
  source: string;
  entries: Record<string, Permit>;
}
export interface TrailProperties {
  id: string;
  routeId?: string;
  day?: number;
  name: string;
  kind?: string;
  miles?: number;
  trailNames?: string[];
  source?: string;
  source_url?: string;
  notes?: string;
  coverageGap?: boolean;
}
export type TrailFeature = Feature<
  LineString | MultiLineString,
  TrailProperties
>;
export type TrailCollection = FeatureCollection<
  LineString | MultiLineString,
  TrailProperties
>;
export interface Dataset {
  places: Place[];
  routes: Route[];
  content: Content;
  permits: Permits;
  trails: TrailCollection;
  lines: TrailCollection;
  road: TrailCollection;
}
