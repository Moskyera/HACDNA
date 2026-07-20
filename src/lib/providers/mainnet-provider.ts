import {
  HacashNodeClient,
  mainnetClient,
} from "@/lib/hacash/client";
import { mapNodeDiamond } from "@/lib/hacash/mapper";
import {
  isServerlessRuntime,
  loadIndex,
  mergeDiamonds,
  saveIndex,
  type MainnetIndexFile,
} from "@/lib/hacash/index-store";
import {
  analyzeAll,
  analyzeDiamond,
  buildFrequencyTable,
  toTraitFrequencies,
} from "@/lib/scoring/engine";
import { analyzeNamePattern } from "@/lib/scoring/patterns";
import { FIRST_LETTER_COLOR } from "@/lib/config/rarity";
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

function buildSampleNumbers(totalMinted: number, target = 80): number[] {
  const set = new Set<number>();
  for (let n = 1; n <= Math.min(20, totalMinted); n++) set.add(n);
  for (const n of [100, 256, 512, 1000, 5000, 10000, 50000, 100000]) {
    if (n <= totalMinted) set.add(n);
  }
  const step = Math.max(1, Math.floor(totalMinted / Math.max(1, target)));
  for (let n = 1; n <= totalMinted; n += step) set.add(n);
  for (let n = Math.max(1, totalMinted - 30); n <= totalMinted; n++) set.add(n);
  return [...set].sort((a, b) => a - b);
}

export class MainnetHacdProvider implements HacdDataProvider {
  readonly name = "MainnetHacdProvider";
  readonly isDemo = false;

  private client: HacashNodeClient;
  private analysisCache: Map<string, RarityAnalysis> = new Map();
  private seedPromise: Promise<void> | null = null;

  constructor(client: HacashNodeClient = mainnetClient) {
    this.client = client;
  }

  private emptyIndex(
    totalMinted = 0,
    latestHeight = 0
  ): MainnetIndexFile {
    return {
      version: 1,
      source: this.client.baseUrl,
      lastSyncedAt: null,
      totalMinted,
      latestHeight,
      diamonds: [],
    };
  }

  private kickoffSeed(): void {
    if (this.seedPromise) return;
    // On serverless avoid huge background jobs that get killed mid-way
    if (isServerlessRuntime()) return;
    this.seedPromise = this.syncIndex({ mode: "seed" })
      .catch((e) => console.error("[mainnet] seed failed", e))
      .then(() => {
        this.seedPromise = null;
      });
  }

  private async getOrCreateIndex(): Promise<MainnetIndexFile> {
    let index = await loadIndex();
    if (index) {
      if (!isServerlessRuntime() && index.diamonds.length < 20) {
        this.kickoffSeed();
      }
      return index;
    }

    let totalMinted = 0;
    let latestHeight = 0;
    try {
      const latest = await this.client.latest();
      totalMinted = latest.diamond;
      latestHeight = latest.height;
    } catch {
      /* node down */
    }
    index = this.emptyIndex(totalMinted, latestHeight);
    await saveIndex(index);
    this.kickoffSeed();
    return index;
  }

  /**
   * Light seed suitable for Vercel: few parallel fetches, short runtime.
   */
  private async ensureSeeded(minCount = 8): Promise<MainnetIndexFile> {
    let index = await this.getOrCreateIndex();
    if (index.diamonds.length >= minCount) return index;

    // Quick fill so homepage/rankings don't hang
    try {
      await this.syncIndex({
        mode: "seed",
        maxFetch: isServerlessRuntime() ? 12 : 40,
      });
    } catch (e) {
      console.error("[mainnet] quick seed failed", e);
    }
    index = (await loadIndex()) ?? index;
    return index;
  }

  private async totalMinted(): Promise<number> {
    const index = await loadIndex();
    if (index?.totalMinted) return index.totalMinted;
    try {
      const s = await this.client.supply();
      return s.minted_diamond;
    } catch {
      try {
        const l = await this.client.latest();
        return l.diamond;
      } catch {
        return 0;
      }
    }
  }

  private poolWith(diamond: HacdDiamond, index: MainnetIndexFile): HacdDiamond[] {
    return mergeDiamonds(index.diamonds, [diamond]);
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const latest = await this.client.latest();
      const index = await loadIndex();
      return {
        source: `${this.name} @ ${this.client.baseUrl}`,
        lastSyncedAt: index?.lastSyncedAt ?? null,
        diamondCount: index?.diamonds.length ?? 0,
        isDemo: false,
        healthy: true,
        message: `Mainnet live. Chain diamonds: ${latest.diamond.toLocaleString()}, height ${latest.height.toLocaleString()}. Indexed: ${index?.diamonds.length ?? 0}.`,
      };
    } catch (e) {
      return {
        source: this.name,
        lastSyncedAt: null,
        diamondCount: 0,
        isDemo: false,
        healthy: false,
        message: e instanceof Error ? e.message : "Mainnet node unreachable",
      };
    }
  }

  async listDiamonds(): Promise<HacdDiamond[]> {
    const index = await this.ensureSeeded(1);
    return index.diamonds;
  }

  async getDiamond(idOrNameOrNumber: string): Promise<HacdDiamond | null> {
    const total = await this.totalMinted();
    const raw = await this.client.diamond(idOrNameOrNumber);
    if (!raw) return null;
    const diamond = mapNodeDiamond(raw, total || raw.number);

    const index = (await loadIndex()) ?? this.emptyIndex(total || raw.number);
    index.diamonds = mergeDiamonds(index.diamonds, [diamond]);
    index.totalMinted = Math.max(index.totalMinted, total, diamond.number);
    index.lastSyncedAt = new Date().toISOString();
    await saveIndex(index);
    this.analysisCache.delete(diamond.name);
    return diamond;
  }

  async getRarity(idOrNameOrNumber: string): Promise<RarityAnalysis | null> {
    const diamond = await this.getDiamond(idOrNameOrNumber);
    if (!diamond) return null;

    const cached = this.analysisCache.get(diamond.name);
    if (cached) return cached;

    const index = await this.getOrCreateIndex();
    const pool = this.poolWith(diamond, index);
    const analysis = analyzeDiamond(diamond, pool, {
      lastSyncedAt: index.lastSyncedAt,
      dataSource: `mainnet:${this.client.baseUrl}`,
    });
    this.analysisCache.set(diamond.name, analysis);
    return analysis;
  }

  async getTraits(idOrNameOrNumber: string) {
    const d = await this.getDiamond(idOrNameOrNumber);
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
      throw new Error("Provide 2–5 valid mainnet HACD names or numbers.");
    }
    const rarest = analyses.reduce((best, cur) =>
      cur.rarityScore > best.rarityScore ? cur : best
    );

    const rarestTraits = analyses
      .flatMap((a) =>
        a.traits
          .filter((t) => t.available && (t.rarityScore ?? 0) >= 65)
          .map((t) => ({
            name: a.diamond.name,
            trait: t.label,
            value: String(t.value),
            score: t.rarityScore ?? 0,
          }))
      )
      .sort((a, b) => b.score - a.score);

    const traitMaps = analyses.map((a) => {
      const m = new Map<string, string>();
      for (const t of a.traits) {
        if (t.available && t.value != null) m.set(t.key, String(t.value));
      }
      return m;
    });
    const commonTraits: { trait: string; value: string }[] = [];
    for (const key of traitMaps[0].keys()) {
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
      isDemo: false,
    };
  }

  async getRankings(filters: RankingFilters = {}): Promise<RankingResult> {
    const index = await this.ensureSeeded(1);
    const chainDiamonds = index.diamonds.filter(
      (d) => !d.isDemo && d.source === "node"
    );
    let items = analyzeAll(chainDiamonds, {
      lastSyncedAt: index.lastSyncedAt,
      dataSource: `mainnet:${this.client.baseUrl}`,
    });

    if (filters.search) {
      const s = filters.search.toUpperCase();
      items = items.filter(
        (a) =>
          a.diamond.name.includes(s) ||
          String(a.diamond.number).includes(filters.search!)
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

    items.sort((a, b) => b.rarityScore - a.rarityScore);

    if (filters.top === "10") items = items.slice(0, 10);
    else if (filters.top === "100") items = items.slice(0, 100);
    else if (filters.top === "1%") {
      items = items.slice(0, Math.max(1, Math.ceil(items.length * 0.01)));
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
          return (
            (a.rarityScore - b.rarityScore) *
            (filters.sortDir === "asc" ? 1 : -1)
          );
      }
    });

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
    const total = items.length;
    const start = (page - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      isDemo: false,
    };
  }

  async getStatistics(): Promise<DatasetStatistics> {
    const index = await this.ensureSeeded(1);
    const analyses = analyzeAll(index.diamonds, {
      lastSyncedAt: index.lastSyncedAt,
      dataSource: `mainnet:${this.client.baseUrl}`,
    });
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
    const table = buildFrequencyTable(index.diamonds);

    // Prefer live supply if we have it
    let totalDiamonds = index.totalMinted;
    if (!totalDiamonds) {
      try {
        totalDiamonds = (await this.client.latest()).diamond;
      } catch {
        totalDiamonds = index.diamonds.length;
      }
    }

    return {
      totalDiamonds,
      isDemo: false,
      lastSyncedAt: index.lastSyncedAt,
      dataSource: `${this.name} (indexed ${index.diamonds.length} / chain ${totalDiamonds})`,
      categoryDistribution,
      averageScore: analyses.length ? sum / analyses.length : 0,
      topPercentileThreshold: sorted[topIdx]?.rarityScore ?? 0,
      traitFrequencies: toTraitFrequencies(table),
    };
  }

  async recalculateRarity() {
    this.analysisCache.clear();
    const result = await this.syncIndex({
      mode: "expand",
      maxFetch: isServerlessRuntime() ? 20 : 100,
    });
    return {
      updated: result.indexed,
      at: result.lastSyncedAt,
    };
  }

  async syncIndex(opts: { mode?: "seed" | "expand"; maxFetch?: number } = {}) {
    const mode = opts.mode ?? "seed";
    const [latest, supply] = await Promise.all([
      this.client.latest(),
      this.client.supply().catch(() => null),
    ]);
    const totalMinted = supply?.minted_diamond ?? latest.diamond;
    const target = mode === "seed" ? 80 : 200;
    const numbers = buildSampleNumbers(totalMinted, target);

    const existing = await loadIndex();
    const already = new Set((existing?.diamonds ?? []).map((d) => d.number));
    const toFetch = numbers.filter((n) => !already.has(n));

    const defaultMax = isServerlessRuntime()
      ? mode === "seed"
        ? 12
        : 20
      : mode === "seed"
        ? 40
        : 100;
    const batch = toFetch.slice(0, opts.maxFetch ?? defaultMax);
    const raws = await this.client.fetchByNumbers(
      batch,
      isServerlessRuntime() ? 4 : 8
    );
    const mapped = raws.map((r) => mapNodeDiamond(r, totalMinted));

    const diamonds = mergeDiamonds(existing?.diamonds ?? [], mapped);
    const index: MainnetIndexFile = {
      version: 1,
      source: this.client.baseUrl,
      lastSyncedAt: new Date().toISOString(),
      totalMinted,
      latestHeight: latest.height,
      diamonds,
    };
    await saveIndex(index);
    this.analysisCache.clear();

    return {
      indexed: diamonds.length,
      fetched: mapped.length,
      totalMinted,
      latestHeight: latest.height,
      lastSyncedAt: index.lastSyncedAt!,
      source: this.client.baseUrl,
    };
  }

  async analyzeManual(input: ManualHacdInput): Promise<RarityAnalysis> {
    const name = (input.name ?? "MANUAL").toUpperCase().slice(0, 6).padEnd(6, "X");
    const patternInfo = analyzeNamePattern(name);
    const number = input.number ?? 999999999;
    const total = (await this.totalMinted()) || number;
    const diamond: HacdDiamond = {
      id: `MANUAL-${name}`,
      name,
      number,
      isDemo: false,
      createdAt: new Date().toISOString(),
      source: "manual",
      traits: {
        name,
        number,
        visualGene: input.visualGene ?? null,
        lifeGene: null,
        shape: input.shape ?? null,
        color: input.color ?? FIRST_LETTER_COLOR[name[0]] ?? null,
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
        mintPosition: number / Math.max(total, number),
      },
    };
    const index = await this.getOrCreateIndex();
    return analyzeDiamond(diamond, this.poolWith(diamond, index), {
      lastSyncedAt: index.lastSyncedAt,
      dataSource: "manual+mainnet-index",
    });
  }
}

export const mainnetProvider = new MainnetHacdProvider();
