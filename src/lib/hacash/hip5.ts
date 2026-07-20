/**
 * HIP-5 visual gene decoding (aligned with explorer diamondgene + diamondsvgimg).
 * https://github.com/hacash/doc/blob/main/HIP/diamond/DiamondVisualization.mediawiki
 */

import { FIRST_LETTER_COLOR } from "@/lib/config/rarity";
import { analyzeNamePattern } from "@/lib/scoring/patterns";

/** Letter → nibble as used by explorer diamondgene.min.js */
export const LETTER_NIBBLE: Record<string, string> = {
  W: "0",
  T: "1",
  Y: "2",
  U: "3",
  I: "4",
  A: "5",
  H: "6",
  X: "7",
  V: "8",
  M: "9",
  E: "a",
  K: "b",
  B: "c",
  S: "d",
  Z: "e",
  N: "f",
};

/**
 * Shape index from visual_gene first byte (life_gene last byte).
 * explorer: a = 16*s[0]+s[1]; if a>8 then a=0 (standard)
 * n[0]=Standard, n[1..8]=special shapes
 */
export const SHAPE_BY_INDEX: string[] = [
  "Standard",
  "Square",
  "Ellipse",
  "Heart",
  "Triangle",
  "Teardrop",
  "Circle",
  "Rhombus",
  "Hexagon",
];

export const COLOR_BY_NIBBLE: string[] = [
  "W Dark blue", // 0
  "T Blue",
  "Y Red purple",
  "U Blue purple",
  "I Red",
  "A Red cyan",
  "H Pink",
  "X Grey",
  "V Light pink",
  "M Yellow secret",
  "E Secret",
  "K Pink cyan",
  "B Cyan",
  "S Green",
  "Z Gold",
  "N Yellow Cyan", // f
];

function hexToNibbles(hex: string): number[] {
  const h = hex.toLowerCase().replace(/[^0-9a-f]/g, "");
  const out: number[] = [];
  for (const c of h) {
    out.push(parseInt(c, 16));
  }
  return out;
}

export interface Hip5Decoded {
  shape: string;
  shapeIndex: number;
  isSpecialShape: boolean;
  color: string;
  colorIndex: number;
  /** Approximate HIP-5 style from facet color diversity */
  style: string;
  uniqueFacetColors: number;
  facetColorIndices: number[];
  visualGene: string;
}

/**
 * Decode shape/color/style from official visual_gene hex.
 */
export function decodeVisualGene(visualGene: string): Hip5Decoded {
  const s = hexToNibbles(visualGene);
  if (s.length < 3) {
    return {
      shape: "Standard",
      shapeIndex: 0,
      isSpecialShape: false,
      color: "Mixed",
      colorIndex: 0,
      style: "Standard",
      uniqueFacetColors: 0,
      facetColorIndices: [],
      visualGene,
    };
  }

  let shapeIndex = 16 * s[0] + s[1];
  if (shapeIndex > 8) shapeIndex = 0;
  const shape = SHAPE_BY_INDEX[shapeIndex] ?? "Standard";
  const isSpecialShape = shapeIndex >= 1 && shapeIndex <= 8;

  const colorIndex = s[2] ?? 0;
  const color = COLOR_BY_NIBBLE[colorIndex] ?? "Mixed";

  // Facet color nibbles roughly start at index 2 (main) through remaining gene
  const facetColorIndices = s.slice(2, Math.min(s.length, 18));
  const unique = new Set(facetColorIndices.filter((x) => x >= 0 && x <= 15));
  const uniqueFacetColors = unique.size;

  let style = "Standard";
  if (uniqueFacetColors <= 1) style = "Pure";
  else if (uniqueFacetColors === 2) style = "Double mix";
  else if (uniqueFacetColors === 3) style = "Left mix pure";
  else if (uniqueFacetColors >= 14) style = "All 14 color";
  else if (uniqueFacetColors >= 10) style = "Sum six color";
  else if (uniqueFacetColors >= 6) style = "Center color";
  else style = "Edge color";

  // Symmetry-ish: if first half colors mirror second
  if (facetColorIndices.length >= 6) {
    const mid = Math.floor(facetColorIndices.length / 2);
    const a = facetColorIndices.slice(0, mid).join(",");
    const b = facetColorIndices.slice(-mid).reverse().join(",");
    if (a === b && uniqueFacetColors > 1) style = "Symmetry";
  }

  return {
    shape,
    shapeIndex,
    isSpecialShape,
    color,
    colorIndex,
    style,
    uniqueFacetColors,
    facetColorIndices,
    visualGene,
  };
}

export function colorFromName(name: string): string {
  const c = name.trim().toUpperCase()[0];
  return FIRST_LETTER_COLOR[c] ?? "Mixed";
}

export function nameTraits(name: string) {
  return analyzeNamePattern(name);
}
