/**
 * Shared court geometry — single source of truth for dimensions, line positions,
 * and the official Laykold color palette. Used by:
 *   - The new SVG-based <CourtRenderer /> (Explore Mode + Approval Mode)
 *   - Future migration of <Court3D /> away from Three.js
 *
 * All dimensions are in FEET. Courts are rendered LANDSCAPE
 * (length horizontal on screen, nets running vertically down the middle).
 */

// ─── Court Types ──────────────────────────────────────────────────────────

export type CourtType =
  | "tennis"
  | "pickleball"
  | "pickleball_double"
  | "basketball"
  | "basketball_pickleball";

export interface CourtTypeMeta {
  id: CourtType;
  label: string;
  /** Playing surface only, in feet (length × width). */
  playing: { length: number; width: number };
  /** Outer surrounding pad, in feet (length × width). */
  outer: { length: number; width: number };
  /** Whether this court has a net (so the toggle should appear). */
  hasNet: boolean;
  /** Short human-readable dimension string for display. */
  dimensionsLabel: string;
  description: string;
}

export const COURT_TYPES: Record<CourtType, CourtTypeMeta> = {
  tennis: {
    id: "tennis",
    label: "Tennis Court",
    playing: { length: 78, width: 36 },
    outer: { length: 120, width: 60 },
    hasNet: true,
    dimensionsLabel: "60′ × 120′ overall · 36′ × 78′ playing",
    description: "Regulation singles & doubles tennis court",
  },
  pickleball: {
    id: "pickleball",
    label: "Pickleball Court",
    playing: { length: 44, width: 20 },
    outer: { length: 64, width: 34 },
    hasNet: true,
    dimensionsLabel: "34′ × 64′ overall · 20′ × 44′ playing",
    description: "Single regulation pickleball court",
  },
  pickleball_double: {
    id: "pickleball_double",
    label: "Double Pickleball",
    // Two courts stacked with shared outer pad
    playing: { length: 44, width: 44 }, // 20 + 4 shared + 20
    outer: { length: 64, width: 60 },
    hasNet: true,
    dimensionsLabel: "60′ × 64′ overall · two 20′ × 44′ courts",
    description: "Two pickleball courts side-by-side (shared outer pad)",
  },
  basketball: {
    id: "basketball",
    label: "Basketball Court",
    playing: { length: 94, width: 50 },
    outer: { length: 110, width: 64 },
    hasNet: false,
    dimensionsLabel: "64′ × 110′ overall · 50′ × 94′ playing",
    description: "Full regulation basketball court",
  },
  basketball_pickleball: {
    id: "basketball_pickleball",
    label: "Basketball + Pickleball",
    playing: { length: 94, width: 50 },
    outer: { length: 110, width: 64 },
    hasNet: true,
    dimensionsLabel: "64′ × 110′ overall · basketball with 2 pickleball overlay",
    description: "Basketball court with two stacked pickleball courts overlaid",
  },
};

export const COURT_TYPE_LIST: CourtTypeMeta[] = [
  COURT_TYPES.tennis,
  COURT_TYPES.pickleball,
  COURT_TYPES.pickleball_double,
  COURT_TYPES.basketball,
  COURT_TYPES.basketball_pickleball,
];

// ─── Laykold Official Color Palette ────────────────────────────────────────
// These are real Laykold product SKUs from APT's catalog.
// Names must match exactly — they're used on material orders.

export interface LaykoldColor {
  name: string;
  hex: string;
  group: "standard" | "vibrant" | "line";
}

export const LAYKOLD_STANDARDS: LaykoldColor[] = [
  { name: "Forest Green", hex: "#3A4535", group: "standard" },
  { name: "Dark Green", hex: "#4A5538", group: "standard" },
  { name: "Medium Green", hex: "#5C6A43", group: "standard" },
  { name: "Grass Green", hex: "#6F7F42", group: "standard" },
  { name: "Dark Blue", hex: "#2A3F5C", group: "standard" },
  { name: "Light Blue", hex: "#2E7FA8", group: "standard" },
  { name: "Pro Blue", hex: "#2D4F6E", group: "standard" },
  { name: "Royal Purple", hex: "#544863", group: "standard" },
  { name: "Brick Red", hex: "#8B4538", group: "standard" },
  { name: "Burgundy", hex: "#6B3A33", group: "standard" },
  { name: "Dark Grey", hex: "#4A4A4A", group: "standard" },
  { name: "Desert Sand", hex: "#B39B7D", group: "standard" },
];

export const LAYKOLD_VIBRANTS: LaykoldColor[] = [
  { name: "Coral", hex: "#C85B6B", group: "vibrant" },
  { name: "Scarlet", hex: "#9A3A35", group: "vibrant" },
  { name: "Pumpkin", hex: "#D97935", group: "vibrant" },
  { name: "Canary", hex: "#E8C43F", group: "vibrant" },
  { name: "Midnight", hex: "#2B4A8A", group: "vibrant" },
  { name: "Teal", hex: "#2E7A7E", group: "vibrant" },
  { name: "Arctic", hex: "#6BA8C9", group: "vibrant" },
  { name: "Black", hex: "#2A2A2A", group: "vibrant" },
  { name: "Key Lime", hex: "#C5C648", group: "vibrant" },
  { name: "Kiwi", hex: "#8FA645", group: "vibrant" },
  { name: "Silver", hex: "#9A9A9A", group: "vibrant" },
  { name: "Mocha", hex: "#6B4E38", group: "vibrant" },
];

export const LAYKOLD_LINES: LaykoldColor[] = [
  { name: "White", hex: "#FFFFFF", group: "line" },
  { name: "Yellow", hex: "#F2C33D", group: "line" },
  { name: "Blue", hex: "#2C5F8A", group: "line" },
  { name: "Red", hex: "#B83A32", group: "line" },
  { name: "Black", hex: "#1A1A1A", group: "line" },
];

export const LAYKOLD_COURT_COLORS = [...LAYKOLD_STANDARDS, ...LAYKOLD_VIBRANTS];
export const ALL_LAYKOLD_COLORS = [...LAYKOLD_COURT_COLORS, ...LAYKOLD_LINES];

/** Look up a color by name across all groups. Falls back to Pro Blue if not found. */
export function getLaykoldColor(name: string, fallback = "Pro Blue"): LaykoldColor {
  return (
    ALL_LAYKOLD_COLORS.find((c) => c.name === name) ||
    LAYKOLD_STANDARDS.find((c) => c.name === fallback)!
  );
}

export function getColorHex(name: string): string {
  return getLaykoldColor(name).hex;
}

/** Format a color name with the "Laykold" brand prefix for display. */
export function formatLaykoldName(name: string): string {
  return `Laykold ${name}`;
}

// ─── Popular Combinations (Presets) ───────────────────────────────────────

export interface ColorPreset {
  id: string;
  label: string;
  inner: string;
  outer: string;
  line: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "us_open", label: "US Open Look", inner: "Pro Blue", outer: "Dark Green", line: "White" },
  { id: "miami_open", label: "Miami Open", inner: "Teal", outer: "Coral", line: "White" },
  { id: "traditional_green", label: "Traditional Green", inner: "Medium Green", outer: "Forest Green", line: "White" },
  { id: "country_club_red", label: "Country Club Red", inner: "Brick Red", outer: "Burgundy", line: "White" },
  { id: "community_play", label: "Community Play", inner: "Light Blue", outer: "Pro Blue", line: "White" },
  { id: "pickleball_pop", label: "Pickleball Pop", inner: "Canary", outer: "Midnight", line: "White" },
];

// ─── Geometry Helpers ─────────────────────────────────────────────────────

export interface CourtRenderConfig {
  innerColor: string;
  outerColor: string;
  lineColor: string;
  showNet: boolean;
}

/**
 * Given a court type, return SVG viewBox dimensions in feet.
 * Always landscape — length is the X axis (horizontal).
 */
export function getViewBox(courtType: CourtType): { width: number; height: number } {
  const meta = COURT_TYPES[courtType];
  return { width: meta.outer.length, height: meta.outer.width };
}
