"use client";

import Link from "next/link";
import type { RarityAnalysis } from "@/lib/types/hacd";
import { MetadataCard } from "@/components/diamond/MetadataCard";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

export function TopScoredSection({ items }: { items: RarityAnalysis[] }) {
  if (items.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-sm text-slate-400">
        No mainnet diamonds indexed yet. Run{" "}
        <code className="text-cyan-200">pnpm seed:mainnet</code> or open any
        diamond to pull live chain data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {items.map((a, i) => (
        <article
          key={a.diamond.id}
          className="glass overflow-visible rounded-3xl p-4 md:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 font-mono text-sm text-cyan-200">
                #{i + 1}
              </span>
              <div>
                <Link
                  href={`/analyze/${a.diamond.name}`}
                  className="font-mono text-xl font-bold tracking-widest text-white hover:text-cyan-200"
                >
                  {a.diamond.name}
                </Link>
                <div className="text-xs text-slate-500">
                  Diamond #{a.diamond.number} · mainnet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CategoryBadge category={a.category} />
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  App rarity score
                </div>
                <div className="text-2xl font-bold tabular-nums text-white">
                  {a.rarityScore.toFixed(1)}
                  <span className="text-sm font-normal text-slate-500">
                    /100
                  </span>
                </div>
              </div>
              <Link
                href={`/analyze/${a.diamond.name}`}
                className="rounded-xl bg-cyan-500/15 px-3 py-2 text-xs font-medium text-cyan-200 ring-1 ring-cyan-400/30 hover:bg-cyan-500/25"
              >
                Analyze
              </Link>
            </div>
          </div>

          <MetadataCard
            diamond={a.diamond}
            compact
            showCaption={false}
          />
        </article>
      ))}
    </div>
  );
}
