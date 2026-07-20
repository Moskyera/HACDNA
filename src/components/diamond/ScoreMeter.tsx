"use client";

import { CATEGORY_COLORS } from "@/lib/config/rarity";
import type { RarityCategory } from "@/lib/types/hacd";

export function ScoreMeter({
  score,
  category,
}: {
  score: number;
  category: RarityCategory;
}) {
  const color = CATEGORY_COLORS[category];
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Rarity Score
          </div>
          <div className="text-3xl font-bold tabular-nums text-white md:text-4xl">
            {score.toFixed(1)}
            <span className="text-lg font-normal text-slate-500">/100</span>
          </div>
        </div>
        <div
          className="rounded-lg px-2 py-1 text-xs font-semibold"
          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
        >
          {category}
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 16px ${color}66`,
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
        <span>0 Common</span>
        <span>100 Legendary</span>
      </div>
    </div>
  );
}
