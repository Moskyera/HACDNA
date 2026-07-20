import type {
  CompareResult,
  DatasetStatistics,
  HacdDiamond,
  ManualHacdInput,
  RankingFilters,
  RankingResult,
  RarityAnalysis,
  SyncStatus,
} from "@/lib/types/hacd";

/**
 * Adapter interface: swap Mock / Explorer / Node without UI changes.
 */
export interface HacdDataProvider {
  readonly name: string;
  readonly isDemo: boolean;

  getSyncStatus(): Promise<SyncStatus>;
  listDiamonds(): Promise<HacdDiamond[]>;
  getDiamond(idOrNameOrNumber: string): Promise<HacdDiamond | null>;
  getRarity(idOrNameOrNumber: string): Promise<RarityAnalysis | null>;
  getTraits(idOrNameOrNumber: string): Promise<HacdDiamond["traits"] | null>;
  compare(ids: string[]): Promise<CompareResult>;
  getRankings(filters?: RankingFilters): Promise<RankingResult>;
  getStatistics(): Promise<DatasetStatistics>;
  recalculateRarity(): Promise<{ updated: number; at: string }>;
  analyzeManual?(input: ManualHacdInput): Promise<RarityAnalysis>;
}

export type ProviderKind = "mock" | "explorer" | "node" | "mainnet";
