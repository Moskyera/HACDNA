/** Core domain types for HACD rarity analysis */

export type DataAvailability = "available" | "unavailable";

export type RarityCategory =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Very Rare"
  | "Extremely Rare"
  | "Legendary";

export interface HacdTraits {
  name: string;
  number: number;
  visualGene: string | null;
  lifeGene: string | null;
  shape: string | null;
  color: string | null;
  style: string | null;
  literal: string | null;
  pattern: string | null;
  symmetry: boolean | null;
  uniqueChars: number | null;
  maxRepeat: number | null;
  bornBlockHeight: number | null;
  bornBlockHash: string | null;
  prevBlockHash: string | null;
  /** Raw bid string from node, e.g. "9213:245" */
  bidFeeRaw: string | null;
  bidAmountHac: number | null;
  averageBurnHac: number | null;
  ownerAddress: string | null;
  minerAddress: string | null;
  inscriptions: string | null;
  /** Relative mint position 0-1 (0 = earliest) when known */
  mintPosition: number | null;
}

export interface HacdDiamond {
  id: string;
  name: string;
  number: number;
  traits: HacdTraits;
  isDemo: boolean;
  createdAt: string;
  source: "mock" | "explorer" | "node" | "manual";
}

export interface TraitScore {
  key: string;
  label: string;
  value: string | number | boolean | null;
  frequency: number | null;
  frequencyPercent: number | null;
  rarityScore: number | null;
  weight: number;
  contribution: number;
  available: boolean;
  note?: string;
}

export interface ScoreBreakdown {
  shape: number | null;
  color: number | null;
  style: number | null;
  pattern: number | null;
  combo: number | null;
}

export interface RarityAnalysis {
  diamond: HacdDiamond;
  rarityScore: number;
  rarityPercentage: number;
  percentile: number;
  category: RarityCategory;
  rank: number;
  totalAnalyzed: number;
  confidenceScore: number;
  confidenceNote: string;
  isEstimate: boolean;
  breakdown: ScoreBreakdown;
  traits: TraitScore[];
  strengths: string[];
  weaknesses: string[];
  verdict: string;
  explanation: string;
  weightsUsed: Record<string, number>;
  lastSyncedAt: string | null;
  dataSource: string;
}

export interface TraitFrequency {
  traitType: string;
  traitValue: string;
  count: number;
  frequency: number;
  totalPopulation: number;
}

export interface DatasetStatistics {
  totalDiamonds: number;
  isDemo: boolean;
  lastSyncedAt: string | null;
  dataSource: string;
  categoryDistribution: Record<RarityCategory, number>;
  averageScore: number;
  topPercentileThreshold: number;
  traitFrequencies: TraitFrequency[];
}

export interface RankingFilters {
  category?: RarityCategory;
  color?: string;
  shape?: string;
  style?: string;
  pattern?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
  sortBy?: "score" | "number" | "name" | "percentile";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  top?: "10" | "100" | "1%" | "all";
}

export interface RankingResult {
  items: RarityAnalysis[];
  total: number;
  page: number;
  pageSize: number;
  isDemo: boolean;
}

export interface CompareResult {
  analyses: RarityAnalysis[];
  rarest: RarityAnalysis;
  rarestTraits: { name: string; trait: string; value: string; score: number }[];
  commonTraits: { trait: string; value: string }[];
  isDemo: boolean;
}

export interface SyncStatus {
  source: string;
  lastSyncedAt: string | null;
  diamondCount: number;
  isDemo: boolean;
  healthy: boolean;
  message: string;
}

export interface ManualHacdInput {
  name?: string;
  number?: number;
  shape?: string;
  color?: string;
  style?: string;
  literal?: string;
  visualGene?: string;
  bornBlockHeight?: number;
  bidAmountHac?: number;
  ownerAddress?: string;
}
