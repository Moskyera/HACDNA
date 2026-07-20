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
 * Skeleton for live Hacash explorer integration.
 * Currently delegates to mock until EXPLORER_API_BASE is configured and
 * endpoints are implemented against explorer.hacash.org (or compatible API).
 *
 * Integration points:
 * - GET diamond by name → map to HacdDiamond
 * - Bulk index job → fill Prisma / cache
 * - Trait decode from visual gene (HIP-5)
 */
export class HacdExplorerProvider implements HacdDataProvider {
  readonly name = "HacdExplorerProvider";
  readonly isDemo = true; // flips to false when live fetch is wired

  private baseUrl: string;

  constructor(baseUrl = process.env.HACD_EXPLORER_API_URL ?? "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async tryLiveFetch(name: string): Promise<HacdDiamond | null> {
    if (!this.baseUrl) return null;
    try {
      // Placeholder contract: replace with real explorer route
      const res = await fetch(`${this.baseUrl}/diamond/${name}`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return null;
      // Mapping would happen here once the API schema is known
      return null;
    } catch {
      return null;
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    return {
      source: this.name,
      lastSyncedAt: null,
      diamondCount: 0,
      isDemo: true,
      healthy: Boolean(this.baseUrl),
      message: this.baseUrl
        ? "Explorer base URL set; live mapping not fully implemented (falling back to mock for reads)."
        : "No HACD_EXPLORER_API_URL (falling back to mock dataset).",
    };
  }

  async listDiamonds(): Promise<HacdDiamond[]> {
    return mockProvider.listDiamonds();
  }

  async getDiamond(id: string): Promise<HacdDiamond | null> {
    const live = await this.tryLiveFetch(id);
    return live ?? mockProvider.getDiamond(id);
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
