import type { RarityCategory } from "@/lib/types/hacd";

/** Configurable rarity category thresholds (score 0-100) */
export const RARITY_CATEGORIES: {
  min: number;
  max: number;
  category: RarityCategory;
}[] = [
  { min: 0, max: 20, category: "Common" },
  { min: 21, max: 40, category: "Uncommon" },
  { min: 41, max: 60, category: "Rare" },
  { min: 61, max: 80, category: "Very Rare" },
  { min: 81, max: 95, category: "Extremely Rare" },
  { min: 96, max: 100, category: "Legendary" },
];

/**
 * Weights for mining-rarity score (must sum to 1.0).
 * Based on Hacash HIP-5 attributes (shape, color, style, letter patterns)
 * as defined on hacash.org + measured on-chain rates (HIP-5 stats).
 *
 * Intentionally excludes market price / ownership — those are not mining rarity.
 */
export const DEFAULT_WEIGHTS = {
  /** HIP-5 shape (protocol: special vs standard) */
  shape: 0.28,
  /** Main / letter-linked color rarity */
  color: 0.22,
  /** HIP-5 style (Pure, Center color, …) from chain stats */
  style: 0.25,
  /** Letter / inscription patterns (Big slam, triple, …) */
  pattern: 0.2,
  /** Joint product of independent trait frequencies (combo uniqueness) */
  combo: 0.05,
} as const;

export type WeightKey = keyof typeof DEFAULT_WEIGHTS;

export const WEIGHT_LABELS: Record<WeightKey, string> = {
  shape: "Shape mining rarity (HIP-5)",
  color: "Color mining rarity (HIP-5)",
  style: "Style mining rarity (HIP-5 stats)",
  pattern: "Letter pattern rarity (name / literals)",
  combo: "Combined trait rarity (shape×color×style×pattern)",
};

/** Official HACD name alphabet (hacash.org / HIP-5) */
export const HACD_ALPHABET = "WTYUIAHXVMEKBSZN" as const;

/**
 * HIP-5 protocol shape rates (from DiamondVisualization HIP-5 + explorer decode).
 * Visual gene first byte 0-255:
 * - values 1..8 → special shapes (each 1/256)
 * - value 0 or 9..255 → Standard (248/256)
 */
export const HIP5_PROTOCOL_SHAPE_FREQ: Record<string, number> = {
  Standard: 248 / 256, // ≈ 0.96875
  Square: 1 / 256,
  Ellipse: 1 / 256,
  Heart: 1 / 256,
  Triangle: 1 / 256,
  Teardrop: 1 / 256,
  Circle: 1 / 256,
  Rhombus: 1 / 256,
  Hexagon: 1 / 256,
  "Special Shape": 8 / 256, // any special
};

/**
 * First-letter color: names use 16-letter alphabet → each letter ≈ 1/16.
 * (HIP-5 main color also comes from visual gene nibble; first letter maps 1:1.)
 */
export const HIP5_PROTOCOL_COLOR_FREQ = 1 / 16; // 0.0625

/**
 * On-chain measured rates from public HIP-5 stats
 * (https://www.hacash.diamonds/types — mainnet counts).
 * Used for style + literal patterns where protocol formula is complex.
 * Updated to match published percentages (as fractions).
 */
export const HIP5_CHAIN_STATS: Record<string, Record<string, number>> = {
  shape: {
    // Prefer protocol for scoring; chain stats as cross-check
    Standard: 1 - 0.032389, // ~96.76% not special-total
    Square: 0.003636,
    Ellipse: 0.004071,
    Heart: 0.004079,
    Triangle: 0.004094,
    Teardrop: 0.003959,
    Circle: 0.004349,
    Rhombus: 0.004199,
    Hexagon: 0.004004,
    "Special Shape": 0.032389,
  },
  color: {
    // Named color classes from HIP-5 board (rare pure/main highlights)
    "W Dark blue": 0.002092,
    "T Blue": 0.002062,
    "Y Red purple": 0.002032,
    "U Blue purple": 0.001852,
    "I Red": 0.002002,
    "A Red cyan": 0.002197,
    "H Pink": 0.002092,
    "X Grey": 0.002114,
    "V Light pink": 0.002039,
    "M Yellow secret": 0.001927,
    "E Secret": 0.002002,
    "K Pink cyan": 0.001964,
    "B Cyan": 0.001829,
    "S Green": 0.002032,
    "Z Gold": 0.002167,
    "N Yellow Cyan": 0.001987,
  },
  style: {
    Pure: 0.000285,
    "Left three pure": 0.003681,
    "Left mix pure": 0.003726,
    "Right three pure": 0.003456,
    "Right mix pure": 0.003561,
    Symmetry: 0.003306,
    "Half divide": 0.003464,
    "Double mix": 0.003509,
    "Center color": 0.049468,
    "Edge color": 0.05072,
    "Sum four color": 0.000001,
    "Sum five color": 0.000015,
    "Sum six color": 0.00099,
    "All 14 color": 0.003456,
    "All 15 color": 0.000202,
    "All 16 color": 0.000001,
    Standard: 0.87,
  },
  literal: {
    "Big slam": 0.000007,
    "Penta repeat": 0.00009,
    "Quadro repeat": 0.001567,
    "Triple repeat": 0.020475,
    "Two letters": 0.000885,
    "Three letters": 0.023055,
    "Half repeat": 0.000352,
    "Symmetric letters": 0.00033,
    "Single num": 0.000067,
    Repetition: 0.000277,
    "Tail four": 0.000832,
    "Tail five": 0.000022,
    "Tail six": 0.000001,
    "Serial num": 0.000142,
    "Serial repeat": 0.001417,
    "Symmetric num": 0.008142,
    None: 0.94,
  },
};

/** @deprecated alias — use HIP5_CHAIN_STATS / protocol maps */
export const HIP5_REFERENCE_FREQUENCIES = HIP5_CHAIN_STATS;

export const FIRST_LETTER_COLOR: Record<string, string> = {
  W: "W Dark blue",
  T: "T Blue",
  Y: "Y Red purple",
  U: "U Blue purple",
  I: "I Red",
  A: "A Red cyan",
  H: "H Pink",
  X: "X Grey",
  V: "V Light pink",
  M: "M Yellow secret",
  E: "E Secret",
  K: "K Pink cyan",
  B: "B Cyan",
  S: "S Green",
  Z: "Z Gold",
  N: "N Yellow Cyan",
};

export const CATEGORY_COLORS: Record<RarityCategory, string> = {
  Common: "#64748b",
  Uncommon: "#22d3ee",
  Rare: "#3b82f6",
  "Very Rare": "#a855f7",
  "Extremely Rare": "#f59e0b",
  Legendary: "#f43f5e",
};

export function getCategory(score: number): RarityCategory {
  const clamped = Math.max(0, Math.min(100, score));
  for (const band of RARITY_CATEGORIES) {
    if (clamped >= band.min && clamped <= band.max) return band.category;
  }
  return "Common";
}

/**
 * Resolve mining frequency for a trait using Hacash protocol + chain stats.
 * Prefer protocol for shape; chain stats for style/literal; protocol 1/16 for color.
 */
export function getOfficialMiningFrequency(
  type: "shape" | "color" | "style" | "literal" | "pattern",
  value: string | null | undefined
): { frequency: number; source: string } | null {
  if (value == null || value === "") return null;

  if (type === "shape") {
    const proto = HIP5_PROTOCOL_SHAPE_FREQ[value];
    if (proto != null) {
      return {
        frequency: proto,
        source: "HIP-5 protocol (visual gene shape byte)",
      };
    }
  }

  if (type === "color") {
    // Letter-linked main color ≈ 1/16 under uniform name letters
    return {
      frequency: HIP5_PROTOCOL_COLOR_FREQ,
      source: "HIP-5 alphabet (16 letters → ~6.25% each)",
    };
  }

  const key = type === "pattern" ? "literal" : type;
  const chain = HIP5_CHAIN_STATS[key]?.[value];
  if (chain != null) {
    return {
      frequency: chain,
      source: "HIP-5 mainnet stats (hacash.diamonds/types)",
    };
  }

  return null;
}
