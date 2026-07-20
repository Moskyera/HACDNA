import type { HacdDataProvider } from "@/lib/providers/types";
import { mockProvider } from "@/lib/providers/mock-provider";
import type {
  CompareResult,
  DatasetStatistics,
  HacdDiamond,
  RankingFilters,
  RankingResult,
  RarityAnalysis,
  SyncStatus,
} from "@/lib/types/hacd";

/**
 * Skeleton for Hacash fullnode RPC / local index integration.
 * Set HACASH_NODE_RPC_URL when a node is available.
 */
export class HacashNodeProvider implements HacdDataProvider {
  readonly name = "HacashNodeProvider";
  readonly isDemo = true;

  private rpcUrl: string;

  constructor(rpcUrl = process.env.HACASH_NODE_RPC_URL ?? "") {
    this.rpcUrl = rpcUrl.replace(/\/$/, "");
  }

  async getSyncStatus(): Promise<SyncStatus> {
    return {
      source: this.name,
      lastSyncedAt: null,
      diamondCount: 0,
      isDemo: true,
      healthy: Boolean(this.rpcUrl),
      message: this.rpcUrl
        ? "Node RPC configured; diamond index not yet implemented (mock fallback)."
        : "No HACASH_NODE_RPC_URL (mock fallback).",
    };
  }

  async listDiamonds(): Promise<HacdDiamond[]> {
    return mockProvider.listDiamonds();
  }

  async getDiamond(id: string): Promise<HacdDiamond | null> {
    return mockProvider.getDiamond(id);
  }

  async getRarity(id: string): Promise<RarityAnalysis | null> {
    return mockProvider.getRarity(id);
  }

  async getTraits(id: string) {
    return mockProvider.getTraits(id);
  }

  async compare(ids: string[]): Promise<CompareResult> {
    return mockProvider.compare(ids);
  }

  async getRankings(filters?: RankingFilters): Promise<RankingResult> {
    return mockProvider.getRankings(filters);
  }

  async getStatistics(): Promise<DatasetStatistics> {
    return mockProvider.getStatistics();
  }

  async recalculateRarity() {
    return mockProvider.recalculateRarity();
  }
}
