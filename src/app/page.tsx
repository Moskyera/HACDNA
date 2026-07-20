import { SearchPanel } from "@/components/home/SearchPanel";
import { TopScoredSection } from "@/components/home/TopScoredSection";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { mainnetProvider } from "@/lib/providers/mainnet-provider";
import type { DatasetStatistics, RarityAnalysis } from "@/lib/types/hacd";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const emptyStats: DatasetStatistics = {
  totalDiamonds: 0,
  isDemo: false,
  lastSyncedAt: null,
  dataSource: "mainnet (unavailable)",
  categoryDistribution: {
    Common: 0,
    Uncommon: 0,
    Rare: 0,
    "Very Rare": 0,
    "Extremely Rare": 0,
    Legendary: 0,
  },
  averageScore: 0,
  topPercentileThreshold: 0,
  traitFrequencies: [],
};

export default async function HomePage() {
  let stats = emptyStats;
  let top: RarityAnalysis[] = [];
  let exampleNames: string[] = [];
  let loadError: string | null = null;

  try {
    stats = await mainnetProvider.getStatistics();
    const rankings = await mainnetProvider.getRankings({
      sortBy: "score",
      sortDir: "desc",
      pageSize: 12,
      page: 1,
    });
    const mainnetItems = rankings.items.filter(
      (a) => !a.diamond.isDemo && a.diamond.source === "node"
    );
    top = mainnetItems.slice(0, 5);
    // Real indexed HACD names only (valid 6-letter chain names)
    exampleNames = [
      ...new Set(
        mainnetItems
          .map((a) => a.diamond.name.toUpperCase())
          .filter((n) => /^[WTYUIAHXVMEKBSZN]{6}$/.test(n))
      ),
    ].slice(0, 8);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load mainnet data";
    console.error("[home]", e);
  }

  return (
    <div className="space-y-12">
      <section className="relative pt-4 text-center md:pt-10">
        <div className="mb-4 flex justify-center">
          <DemoBadge isDemo={false} />
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
          Measure{" "}
          <span className="text-gradient">HACD diamond</span> rarity with
          transparent scores
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 md:text-lg">
          Live mainnet diamonds from Hacash. Explorer-style metadata cards plus
          an independent rarity score for collectors and analysts.
        </p>

        <div className="mx-auto mt-8 max-w-3xl">
          <SearchPanel examples={exampleNames} />
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50/90 md:px-6">
        <strong className="text-white">About Rarity Score:</strong> How rare
        HIP-5 mining outcomes are (shape, color, style, pattern). Not an
        official hacash.org number or a market price.{" "}
        <Link href="/methodology" className="underline hover:text-white">
          Methodology
        </Link>
      </section>

      {loadError && (
        <section className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Could not load rankings right now ({loadError}). Search still works
          for individual diamonds.
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chain supply (minted)"
          value={stats.totalDiamonds.toLocaleString()}
        />
        <StatCard
          label="Avg score (index)"
          value={stats.averageScore.toFixed(1)}
        />
        <StatCard
          label="Top 1% threshold"
          value={stats.topPercentileThreshold.toFixed(1)}
        />
        <StatCard label="Data source" value="Hacash mainnet" />
      </section>
      <p className="text-center text-xs text-slate-500">
        {stats.dataSource}
        {stats.lastSyncedAt
          ? ` · last index sync ${new Date(stats.lastSyncedAt).toLocaleString()}`
          : ""}
      </p>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Top scored (mainnet)
            </h2>
            <p className="text-sm text-slate-500">
              Real HACD diamonds with explorer-style metadata cards
            </p>
          </div>
          <Link
            href="/rankings"
            className="shrink-0 text-sm text-cyan-300 hover:underline"
          >
            Full rankings
          </Link>
        </div>

        <TopScoredSection items={top} />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
