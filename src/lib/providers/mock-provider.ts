import { MOCK_DIAMONDS, MOCK_SYNCED_AT } from "@/lib/data/mock-diamonds";
import {
  analyzeAll,
  analyzeDiamond,
  buildFrequencyTable,
  toTraitFrequencies,
} from "@/lib/scoring/engine";
import { analyzeNamePattern } from "@/lib/scoring/patterns";
import { FIRST_LETTER_COLOR, getCategory } from "@/lib/config/rarity";
import type {
  CompareResult,
  DatasetStatistics,
  HacdDiamond,
  ManualHacdInput,
  RankingFilters,
  RankingResult,
  RarityAnalysis,
  RarityCategory,
  SyncStatus,
} from "@/lib/types/hacd";
import type { HacdDataProvider } from "@/lib/providers/types";

let cache: RarityAnalysis[] | null = null;
let diamonds = [...MOCK_DIAMONDS];

function ensureCache(): RarityAnalysis[] {
  if (!cache) {
    cache = analyzeAll(diamonds, {
      lastSyncedAt: MOCK_SYNCED_AT,
      dataSource: "mock",
    });
  }
  return cache;
}

function resolveQuery(q: string): HacdDiamond | null {
  const raw = q.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const byName = diamonds.find(
    (d) => d.name === upper || d.id === upper || d.id === raw
  );
  if (byName) return byName;
  const num = Number(raw.replace(/^#/, ""));
  if (!Number.isNaN(num)) {
    return diamonds.find((d) => d.number === num) ?? null;
  }
  return null;
}

export class MockHacdProvider implements HacdDataProvider {
  readonly name = "MockHacdProvider";
  readonly isDemo = true;

  async getSyncStatus(): Promise<SyncStatus> {
    return {
      source: this.name,
      lastSyncedAt: MOCK_SYNCED_AT,
      diamondCount: diamonds.length,
      isDemo: true,
      healthy: true,
      message:
        "Serving in-memory demo dataset. Switch provider via HACD_DATA_PROVIDER.",
    };
  }

  async listDiamonds(): Promise<HacdDiamond[]> {
    return diamonds;
  }

  async getDiamond(idOrNameOrNumber: string): Promise<HacdDiamond | null> {
    return resolveQuery(idOrNameOrNumber);
  }

  async getRarity(idOrNameOrNumber: string): Promise<RarityAnalysis | null> {
    const d = resolveQuery(idOrNameOrNumber);
    if (!d) return null;
    return (
      ensureCache().find((a) => a.diamond.id === d.id) ??
      analyzeDiamond(d, diamonds, {
        lastSyncedAt: MOCK_SYNCED_AT,
        dataSource: "mock",
      })
    );
  }

  async getTraits(idOrNameOrNumber: string) {
    const d = resolveQuery(idOrNameOrNumber);
    return d?.traits ?? null;
  }

  async compare(ids: string[]): Promise<CompareResult> {
    const unique = [...new Set(ids.map((i) => i.trim()).filter(Boolean))].slice(
      0,
      5
    );
    const analyses: RarityAnalysis[] = [];
    for (const id of unique) {
      const a = await this.getRarity(id);
      if (a) analyses.push(a);
    }
    if (analyses.length < 2) {
      throw new Error("Provide 2–5 valid HACD identifiers to compare.");
    }
    const rarest = analyses.reduce((best, cur) =>
      cur.rarityScore > best.rarityScore ? cur : best
    );

    const rarestTraits = analyses.flatMap((a) =>
      a.traits
        .filter((t) => t.available && (t.rarityScore ?? 0) >= 65)
        .map((t) => ({
          name: a.diamond.name,
          trait: t.label,
          value: String(t.value),
          score: t.rarityScore ?? 0,
        }))
    );
    rarestTraits.sort((a, b) => b.score - a.score);

    // Common trait values across all compared
    const traitMaps = analyses.map((a) => {
      const m = new Map<string, string>();
      for (const t of a.traits) {
        if (t.available && t.value != null) m.set(t.key, String(t.value));
      }
      return m;
    });
    const keys = [...traitMaps[0].keys()];
    const commonTraits: { trait: string; value: string }[] = [];
    for (const key of keys) {
      const v0 = traitMaps[0].get(key);
      if (v0 == null) continue;
      if (traitMaps.every((m) => m.get(key) === v0)) {
        const label =
          analyses[0].traits.find((t) => t.key === key)?.label ?? key;
        commonTraits.push({ trait: label, value: v0 });
      }
    }

    return {
      analyses,
      rarest,
      rarestTraits: rarestTraits.slice(0, 12),
      commonTraits,
      isDemo: true,
    };
  }

  async getRankings(filters: RankingFilters = {}): Promise<RankingResult> {
    let items = [...ensureCache()];

    if (filters.search) {
      const s = filters.search.toUpperCase();
      items = items.filter(
        (a) =>
          a.diamond.name.includes(s) ||
          String(a.diamond.number).includes(filters.search!) ||
          a.category.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }
    if (filters.category) {
      items = items.filter((a) => a.category === filters.category);
    }
    if (filters.color) {
      items = items.filter((a) => a.diamond.traits.color === filters.color);
    }
    if (filters.shape) {
      items = items.filter((a) => a.diamond.traits.shape === filters.shape);
    }
    if (filters.pattern) {
      items = items.filter(
        (a) =>
          a.diamond.traits.pattern === filters.pattern ||
          a.diamond.traits.literal === filters.pattern
      );
    }
    if (filters.minScore != null) {
      items = items.filter((a) => a.rarityScore >= filters.minScore!);
    }
    if (filters.maxScore != null) {
      items = items.filter((a) => a.rarityScore <= filters.maxScore!);
    }

    if (filters.top === "10") items = items.slice().sort((a, b) => b.rarityScore - a.rarityScore).slice(0, 10);
    else if (filters.top === "100") items = items.slice().sort((a, b) => b.rarityScore - a.rarityScore).slice(0, 100);
    else if (filters.top === "1%") {
      const n = Math.max(1, Math.ceil(items.length * 0.01));
      items = items.slice().sort((a, b) => b.rarityScore - a.rarityScore).slice(0, n);
    }

    const sortBy = filters.sortBy ?? "score";
    const dir = filters.sortDir === "asc" ? 1 : -1;
    items.sort((a, b) => {
      switch (sortBy) {
        case "number":
          return (a.diamond.number - b.diamond.number) * dir;
        case "name":
          return a.diamond.name.localeCompare(b.diamond.name) * dir;
        case "percentile":
          return (a.percentile - b.percentile) * dir;
        default:
          return (a.rarityScore - b.rarityScore) * dir;
      }
    });

    // Default sort score desc already applied if dir -1
    if (sortBy === "score" && filters.sortDir !== "asc") {
      items.sort((a, b) => b.rarityScore - a.rarityScore);
    }

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    return {
      items: pageItems,
      total,
      page,
      pageSize,
      isDemo: true,
    };
  }

  async getStatistics(): Promise<DatasetStatistics> {
    const analyses = ensureCache();
    const categoryDistribution = {
      Common: 0,
      Uncommon: 0,
      Rare: 0,
      "Very Rare": 0,
      "Extremely Rare": 0,
      Legendary: 0,
    } as Record<RarityCategory, number>;
    let sum = 0;
    for (const a of analyses) {
      categoryDistribution[a.category] += 1;
      sum += a.rarityScore;
    }
    const sorted = [...analyses].sort((a, b) => b.rarityScore - a.rarityScore);
    const topIdx = Math.max(0, Math.ceil(sorted.length * 0.01) - 1);
    const table = buildFrequencyTable(diamonds);

    return {
      totalDiamonds: diamonds.length,
      isDemo: true,
      lastSyncedAt: MOCK_SYNCED_AT,
      dataSource: this.name,
      categoryDistribution,
      averageScore: analyses.length ? sum / analyses.length : 0,
      topPercentileThreshold: sorted[topIdx]?.rarityScore ?? 0,
      traitFrequencies: toTraitFrequencies(table),
    };
  }

  async recalculateRarity() {
    cache = null;
    const analyses = ensureCache();
    return { updated: analyses.length, at: new Date().toISOString() };
  }

  async analyzeManual(input: ManualHacdInput): Promise<RarityAnalysis> {
    const name = (input.name ?? "MANUAL").toUpperCase().slice(0, 6).padEnd(6, "X");
    const patternInfo = analyzeNamePattern(name);
    const number = input.number ?? 999999;
    const diamond: HacdDiamond = {
      id: `MANUAL-${name}`,
      name,
      number,
      isDemo: true,
      createdAt: new Date().toISOString(),
      source: "manual",
      traits: {
        name,
        number,
        visualGene: input.visualGene ?? null,
        lifeGene: null,
        shape: input.shape ?? null,
        color:
          input.color ??
          FIRST_LETTER_COLOR[name[0]] ??
          null,
        style: input.style ?? null,
        literal: input.literal ?? patternInfo.pattern,
        pattern: patternInfo.pattern,
        symmetry: patternInfo.symmetry,
        uniqueChars: patternInfo.uniqueChars,
        maxRepeat: patternInfo.maxRepeat,
        bornBlockHeight: input.bornBlockHeight ?? null,
        bornBlockHash: null,
        prevBlockHash: null,
        bidFeeRaw: null,
        bidAmountHac: input.bidAmountHac ?? null,
        averageBurnHac: null,
        ownerAddress: input.ownerAddress ?? null,
        minerAddress: null,
        inscriptions: null,
        mintPosition: number / Math.max(...diamonds.map((d) => d.number), number),
      },
    };
    const pool = [...diamonds, diamond];
    return analyzeDiamond(diamond, pool, {
      lastSyncedAt: MOCK_SYNCED_AT,
      dataSource: "manual+mock",
    });
  }
}

export const mockProvider = new MockHacdProvider();
