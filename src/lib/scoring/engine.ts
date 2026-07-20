import {
  DEFAULT_WEIGHTS,
  getCategory,
  getOfficialMiningFrequency,
  type WeightKey,
} from "@/lib/config/rarity";
import type {
  HacdDiamond,
  RarityAnalysis,
  TraitFrequency,
  TraitScore,
  ScoreBreakdown,
} from "@/lib/types/hacd";
import {
  analyzeNamePattern,
  frequencyToScore,
} from "@/lib/scoring/patterns";

export interface FrequencyTable {
  counts: Map<string, Map<string, number>>;
  population: number;
}

export function buildFrequencyTable(diamonds: HacdDiamond[]): FrequencyTable {
  const counts = new Map<string, Map<string, number>>();
  const bump = (type: string, value: string | null | undefined) => {
    if (value == null || value === "") return;
    if (!counts.has(type)) counts.set(type, new Map());
    const m = counts.get(type)!;
    m.set(value, (m.get(value) ?? 0) + 1);
  };

  for (const d of diamonds) {
    const t = d.traits;
    bump("shape", t.shape);
    bump("color", t.color);
    bump("style", t.style);
    bump("literal", t.literal ?? t.pattern);
    bump("pattern", t.pattern);
  }

  return { counts, population: diamonds.length };
}

/**
 * Mining frequency for scoring: always prefer Hacash protocol / HIP-5 chain stats.
 * Local index is only for rank/percentile among compared diamonds.
 */
function miningFreq(
  type: "shape" | "color" | "style" | "literal" | "pattern",
  value: string | null | undefined
): { frequency: number; source: string } | null {
  return getOfficialMiningFrequency(type, value);
}

function traitScore(
  key: string,
  label: string,
  value: string | number | boolean | null,
  frequency: number | null,
  weight: number,
  available: boolean,
  note?: string
): TraitScore {
  const rarityScore =
    available && frequency != null ? frequencyToScore(frequency) : null;
  return {
    key,
    label,
    value,
    frequency,
    frequencyPercent: frequency != null ? frequency * 100 : null,
    rarityScore,
    weight,
    contribution: 0,
    available,
    note,
  };
}

function redistributeWeights(
  available: Partial<Record<WeightKey, number | null>>
): Record<WeightKey, number> {
  const keys = Object.keys(DEFAULT_WEIGHTS) as WeightKey[];
  let totalAvail = 0;
  for (const k of keys) {
    if (available[k] != null) totalAvail += DEFAULT_WEIGHTS[k];
  }
  const result = {} as Record<WeightKey, number>;
  if (totalAvail <= 0) {
    for (const k of keys) result[k] = 0;
    return result;
  }
  for (const k of keys) {
    result[k] = available[k] != null ? DEFAULT_WEIGHTS[k] / totalAvail : 0;
  }
  return result;
}

function miningComponents(diamond: HacdDiamond): {
  breakdown: ScoreBreakdown;
  shapeF: { frequency: number; source: string } | null;
  colorF: { frequency: number; source: string } | null;
  styleF: { frequency: number; source: string } | null;
  patternF: { frequency: number; source: string } | null;
  comboFreq: number | null;
  literalValue: string;
  nameAnalysis: ReturnType<typeof analyzeNamePattern>;
} {
  const t = diamond.traits;
  const nameAnalysis = analyzeNamePattern(diamond.name);
  const literalValue = t.literal ?? t.pattern ?? nameAnalysis.pattern;

  const shapeF = miningFreq("shape", t.shape);
  const colorF = miningFreq("color", t.color);
  const styleF = miningFreq("style", t.style);
  const patternF = miningFreq("literal", literalValue);

  const shapeRaw =
    shapeF != null ? frequencyToScore(shapeF.frequency) : null;
  const colorRaw =
    colorF != null ? frequencyToScore(colorF.frequency) : null;
  const styleRaw =
    styleF != null ? frequencyToScore(styleF.frequency) : null;

  let patternRaw: number | null =
    patternF != null ? frequencyToScore(patternF.frequency) : null;
  // Pattern is still "how rare is this letter outcome when mining a name"
  if (patternRaw != null && nameAnalysis.symmetry) {
    patternRaw = Math.min(100, patternRaw + 8);
  }
  if (patternRaw != null && nameAnalysis.maxRepeat >= 3) {
    patternRaw = Math.min(
      100,
      patternRaw + 4 * (nameAnalysis.maxRepeat - 2)
    );
  }

  // Joint mining rarity ≈ product of independent trait rates (HIP-5 style)
  const freqs = [shapeF?.frequency, colorF?.frequency, styleF?.frequency, patternF?.frequency].filter(
    (f): f is number => f != null && f > 0
  );
  let comboFreq: number | null = null;
  let comboRaw: number | null = null;
  if (freqs.length >= 2) {
    comboFreq = freqs.reduce((a, b) => a * b, 1);
    comboRaw = frequencyToScore(comboFreq);
  }

  return {
    breakdown: {
      shape: shapeRaw,
      color: colorRaw,
      style: styleRaw,
      pattern: patternRaw,
      combo: comboRaw,
    },
    shapeF,
    colorF,
    styleF,
    patternF,
    comboFreq,
    literalValue,
    nameAnalysis,
  };
}

export function analyzeDiamond(
  diamond: HacdDiamond,
  allDiamonds: HacdDiamond[],
  options?: {
    lastSyncedAt?: string | null;
    dataSource?: string;
  }
): RarityAnalysis {
  const {
    breakdown,
    shapeF,
    colorF,
    styleF,
    patternF,
    comboFreq,
    literalValue,
    nameAnalysis,
  } = miningComponents(diamond);

  const t = diamond.traits;
  const weights = redistributeWeights(breakdown);

  let rarityScore =
    (breakdown.shape ?? 0) * weights.shape +
    (breakdown.color ?? 0) * weights.color +
    (breakdown.style ?? 0) * weights.style +
    (breakdown.pattern ?? 0) * weights.pattern +
    (breakdown.combo ?? 0) * weights.combo;

  rarityScore = Math.round(Math.max(0, Math.min(100, rarityScore)) * 10) / 10;

  const traits: TraitScore[] = [
    traitScore(
      "shape",
      "Shape (HIP-5 mining)",
      t.shape,
      shapeF?.frequency ?? null,
      weights.shape,
      t.shape != null,
      shapeF
        ? `Mining chance ~${(shapeF.frequency * 100).toFixed(3)}%. ${shapeF.source}`
        : "Data unavailable"
    ),
    traitScore(
      "color",
      "Color (HIP-5 mining)",
      t.color,
      colorF?.frequency ?? null,
      weights.color,
      t.color != null,
      colorF
        ? `Mining chance ~${(colorF.frequency * 100).toFixed(2)}%. ${colorF.source}`
        : "Data unavailable"
    ),
    traitScore(
      "style",
      "Style (HIP-5 stats)",
      t.style,
      styleF?.frequency ?? null,
      weights.style,
      t.style != null,
      styleF
        ? `Observed ~${(styleF.frequency * 100).toFixed(3)}% on chain. ${styleF.source}`
        : "Data unavailable"
    ),
    traitScore(
      "pattern",
      "Letter pattern (name)",
      literalValue,
      patternF?.frequency ?? null,
      weights.pattern,
      true,
      patternF
        ? `Pattern rate ~${(patternF.frequency * 100).toFixed(3)}%. ${patternF.source}`
        : "Pattern classified from 6-letter name"
    ),
    traitScore(
      "combo",
      "Combined mining rarity",
      comboFreq != null
        ? `~1 in ${Math.max(1, Math.round(1 / comboFreq)).toLocaleString()}`
        : null,
      comboFreq,
      weights.combo,
      comboFreq != null,
      comboFreq != null
        ? "Approximate joint probability: product of shape × color × style × pattern rates (HIP-5)."
        : "Need multiple scored traits"
    ),
    traitScore(
      "symmetry",
      "Name symmetry",
      nameAnalysis.symmetry,
      nameAnalysis.symmetry ? 0.00033 : 0.9,
      0,
      true,
      nameAnalysis.symmetry
        ? "Symmetric names are rare letter outcomes"
        : "Not a palindrome / half-repeat"
    ),
    traitScore(
      "visualGene",
      "Visual gene",
      t.visualGene,
      null,
      0,
      t.visualGene != null,
      t.visualGene
        ? "Used to derive HIP-5 shape/color/style (not scored alone)"
        : "Data unavailable"
    ),
    traitScore(
      "number",
      "Diamond number",
      diamond.number,
      null,
      0,
      true,
      "Serial mint order (not a HIP-5 visual trait; shown for reference only)"
    ),
    traitScore(
      "bornBlock",
      "Born block height",
      t.bornBlockHeight,
      null,
      0,
      t.bornBlockHeight != null,
      t.bornBlockHeight != null
        ? "On-chain mint height (reference)"
        : "Data unavailable"
    ),
    traitScore(
      "bid",
      "Bid amount (HAC)",
      t.bidAmountHac,
      null,
      0,
      t.bidAmountHac != null,
      "Auction bid is economic cost, not visual mining rarity"
    ),
  ];

  for (const tr of traits) {
    if (tr.available && tr.rarityScore != null && tr.weight > 0) {
      tr.contribution = Math.round(tr.rarityScore * tr.weight * 10) / 10;
    } else {
      tr.contribution = 0;
    }
  }

  // Rank / percentile among current comparison set (local index)
  const scoreMap = new Map<string, number>();
  for (const d of allDiamonds) {
    if (d.id === diamond.id) {
      scoreMap.set(d.id, rarityScore);
      continue;
    }
    scoreMap.set(d.id, computeScoreOnly(d));
  }
  const sorted = [...scoreMap.entries()].sort((a, b) => b[1] - a[1]);
  const rank = sorted.findIndex(([id]) => id === diamond.id) + 1;
  const totalAnalyzed = allDiamonds.length;
  const below = sorted.filter(([, s]) => s < rarityScore).length;
  const percentile =
    totalAnalyzed > 1
      ? Math.round((below / (totalAnalyzed - 1)) * 1000) / 10
      : 50;

  const availableTraits = traits.filter((x) => x.available && x.weight > 0).length;
  const officialTraits = [shapeF, colorF, styleF, patternF].filter(Boolean).length;
  const completeness = officialTraits / 4;
  const confidenceScore = Math.min(
    100,
    Math.round(
      completeness * 70 +
        (diamond.isDemo ? 0 : 15) +
        (options?.dataSource?.includes("mainnet") ? 10 : 0) +
        5
    )
  );
  const isEstimate = confidenceScore < 75 || diamond.isDemo || officialTraits < 3;
  const confidenceNote = diamond.isDemo
    ? "Demo data: not live chain."
    : isEstimate
      ? "Mining rarity uses HIP-5 protocol rates + published mainnet trait stats. Percentile is only vs the local index sample."
      : "Mining rarity grounded in HIP-5 protocol (shape/color) and mainnet HIP-5 stats (style/pattern).";

  const scored = traits
    .filter((x) => x.available && x.rarityScore != null && x.weight > 0)
    .sort((a, b) => (b.rarityScore ?? 0) - (a.rarityScore ?? 0));
  const strengths = scored
    .filter((x) => (x.rarityScore ?? 0) >= 55)
    .slice(0, 4)
    .map(
      (x) =>
        `${x.label}: ${String(x.value)} (~${x.frequencyPercent?.toFixed(3) ?? "?"}%)`
    );
  const weaknesses = scored
    .filter((x) => (x.rarityScore ?? 100) < 35)
    .slice(0, 4)
    .map(
      (x) =>
        `${x.label}: ${String(x.value)} (common mining outcome)`
    );
  if (strengths.length === 0) {
    strengths.push("No unusually rare HIP-5 mining outcomes detected.");
  }
  if (weaknesses.length === 0) {
    weaknesses.push("No especially common weak traits among scored dimensions.");
  }

  const category = getCategory(rarityScore);
  const verdict = buildVerdict(
    diamond,
    rarityScore,
    category,
    percentile,
    literalValue
  );
  const explanation = buildExplanation(
    diamond,
    rarityScore,
    category,
    percentile,
    breakdown,
    weights,
    { shapeF, colorF, styleF, patternF, comboFreq }
  );

  return {
    diamond,
    rarityScore,
    rarityPercentage: percentile,
    percentile,
    category,
    rank,
    totalAnalyzed,
    confidenceScore,
    confidenceNote,
    isEstimate,
    breakdown,
    traits,
    strengths,
    weaknesses,
    verdict,
    explanation,
    weightsUsed: weights,
    lastSyncedAt: options?.lastSyncedAt ?? null,
    dataSource: options?.dataSource ?? "mock",
  };
}

function computeScoreOnly(diamond: HacdDiamond): number {
  const { breakdown } = miningComponents(diamond);
  const weights = redistributeWeights(breakdown);
  const score =
    (breakdown.shape ?? 0) * weights.shape +
    (breakdown.color ?? 0) * weights.color +
    (breakdown.style ?? 0) * weights.style +
    (breakdown.pattern ?? 0) * weights.pattern +
    (breakdown.combo ?? 0) * weights.combo;
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

function buildVerdict(
  diamond: HacdDiamond,
  score: number,
  category: string,
  percentile: number,
  pattern: string
): string {
  if (score >= 96) {
    return `Legendary mining-rarity profile. ${diamond.name} combines extremely scarce HIP-5 outcomes.`;
  }
  if (score >= 81) {
    return `Extremely rare by HIP-5 mining odds. Pattern “${pattern}” and trait mix beat ~${percentile.toFixed(1)}% of the indexed set.`;
  }
  if (score >= 61) {
    return `Very rare mining outcomes. Stronger-than-average HIP-5 traits for ${diamond.name}.`;
  }
  if (score >= 41) {
    return `Moderately rare. Some distinctive HIP-5 traits, but not ultra-scarce overall.`;
  }
  if (score >= 21) {
    return `Uncommon but still within common mining outcomes for several traits.`;
  }
  return `Common mining profile. Shape/color/style/pattern match frequently mined HACD characteristics (HIP-5).`;
}

function buildExplanation(
  diamond: HacdDiamond,
  score: number,
  category: string,
  percentile: number,
  breakdown: ScoreBreakdown,
  weights: Record<WeightKey, number>,
  detail: {
    shapeF: { frequency: number; source: string } | null;
    colorF: { frequency: number; source: string } | null;
    styleF: { frequency: number; source: string } | null;
    patternF: { frequency: number; source: string } | null;
    comboFreq: number | null;
  }
): string {
  const parts: string[] = [];
  parts.push(
    `${diamond.name} (#${diamond.number}) mining-rarity score ${score}/100 (${category}).`
  );
  parts.push(
    "Score is driven by how rare HIP-5 mining outcomes are (shape, color, style, letter pattern), not by market price."
  );
  if (detail.shapeF) {
    parts.push(
      `Shape chance ~${(detail.shapeF.frequency * 100).toFixed(3)}% (${detail.shapeF.source}).`
    );
  }
  if (detail.colorF) {
    parts.push(
      `Color chance ~${(detail.colorF.frequency * 100).toFixed(2)}% (${detail.colorF.source}).`
    );
  }
  if (detail.styleF) {
    parts.push(
      `Style rate ~${(detail.styleF.frequency * 100).toFixed(3)}% (${detail.styleF.source}).`
    );
  }
  if (detail.patternF) {
    parts.push(
      `Letter pattern rate ~${(detail.patternF.frequency * 100).toFixed(3)}% (${detail.patternF.source}).`
    );
  }
  if (detail.comboFreq != null) {
    parts.push(
      `Approx. joint rarity ~1 in ${Math.max(1, Math.round(1 / detail.comboFreq)).toLocaleString()}.`
    );
  }
  parts.push(
    `Percentile ${percentile.toFixed(1)}% is only vs the current local index, not full chain supply.`
  );
  const contrib = (Object.keys(breakdown) as WeightKey[])
    .filter((k) => breakdown[k] != null && weights[k] > 0)
    .map(
      (k) =>
        `${k}: ${breakdown[k]?.toFixed(0)}×${(weights[k] * 100).toFixed(0)}%`
    )
    .join(", ");
  parts.push(`Weights → ${contrib}.`);
  return parts.join(" ");
}

export function analyzeAll(
  diamonds: HacdDiamond[],
  options?: { lastSyncedAt?: string | null; dataSource?: string }
): RarityAnalysis[] {
  return diamonds.map((d) => analyzeDiamond(d, diamonds, options));
}

export function toTraitFrequencies(table: FrequencyTable): TraitFrequency[] {
  const out: TraitFrequency[] = [];
  for (const [traitType, map] of table.counts) {
    for (const [traitValue, count] of map) {
      out.push({
        traitType,
        traitValue,
        count,
        frequency: count / table.population,
        totalPopulation: table.population,
      });
    }
  }
  return out.sort((a, b) => a.frequency - b.frequency);
}
