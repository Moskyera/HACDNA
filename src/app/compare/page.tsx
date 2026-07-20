"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CompareResult } from "@/lib/types/hacd";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { DiamondVisual } from "@/components/diamond/DiamondVisual";
import Link from "next/link";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Suspense } from "react";

function CompareInner() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("ids") ?? "WWWWWW,INMHKM,ABCCBA";
  const [input, setInput] = useState(initial);
  const [data, setData] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(ids: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/hacd/compare?ids=${encodeURIComponent(ids)}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Compare failed");
      setData(json as CompareResult);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void run(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radarData = useMemo(() => {
    if (!data) return [];
    const keys = [
      "shape",
      "color",
      "style",
      "pattern",
      "combo",
    ] as const;
    return keys.map((k) => {
      const row: Record<string, string | number> = { trait: k };
      for (const a of data.analyses) {
        row[a.diamond.name] = a.breakdown[k] ?? 0;
      }
      return row;
    });
  }, [data]);

  const colors = ["#22d3ee", "#a855f7", "#f59e0b", "#34d399", "#f472b6"];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-white">Compare HACD</h1>
        <DemoBadge />
      </div>
      <p className="max-w-2xl text-slate-400">
        Compare 2–5 diamonds side by side. Enter names or numbers separated by
        commas.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(input);
        }}
        className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-400/40"
          placeholder="WWWWWW, INMHKM, ABCCBA"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white"
        >
          {loading ? "Comparing…" : "Compare"}
        </button>
      </form>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      {loading && !data && (
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
            <div className="text-sm text-purple-200">Overall rarest</div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <Link
                href={`/analyze/${data.rarest.diamond.name}`}
                className="font-mono text-2xl font-bold text-white hover:text-cyan-200"
              >
                {data.rarest.diamond.name}
              </Link>
              <CategoryBadge category={data.rarest.category} />
              <span className="text-lg text-white">
                {data.rarest.rarityScore.toFixed(1)}/100
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.analyses.map((a) => (
              <Link
                key={a.diamond.id}
                href={`/analyze/${a.diamond.name}`}
                className="glass glass-hover rounded-2xl p-5"
              >
                <DiamondVisual
                  name={a.diamond.name}
                  number={a.diamond.number}
                  color={a.diamond.traits.color}
                  shape={a.diamond.traits.shape}
                  size="sm"
                />
                <div className="mt-3 flex items-center justify-between">
                  <CategoryBadge category={a.category} />
                  <span className="text-xl font-bold text-white">
                    {a.rarityScore.toFixed(1)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Percentile {a.percentile.toFixed(1)}% · Rank #{a.rank}
                </div>
              </Link>
            ))}
          </div>

          <div className="glass rounded-2xl p-5">
            <h2 className="mb-4 font-semibold text-white">
              Component radar
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="trait" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                  />
                  {data.analyses.map((a, i) => (
                    <Radar
                      key={a.diamond.name}
                      name={a.diamond.name}
                      dataKey={a.diamond.name}
                      stroke={colors[i % colors.length]}
                      fill={colors[i % colors.length]}
                      fillOpacity={0.15}
                    />
                  ))}
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <h3 className="mb-3 font-semibold text-white">Rarest traits</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {data.rarestTraits.slice(0, 8).map((t, i) => (
                  <li key={`${t.name}-${t.trait}-${i}`}>
                    <span className="font-mono text-cyan-200">{t.name}</span> ·{" "}
                    {t.trait}: {t.value}{" "}
                    <span className="text-slate-500">
                      ({t.score.toFixed(0)})
                    </span>
                  </li>
                ))}
                {data.rarestTraits.length === 0 && (
                  <li className="text-slate-500">No high-score traits flagged.</li>
                )}
              </ul>
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="mb-3 font-semibold text-white">Shared traits</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {data.commonTraits.map((t) => (
                  <li key={t.trait}>
                    {t.trait}: <span className="text-white">{t.value}</span>
                  </li>
                ))}
                {data.commonTraits.length === 0 && (
                  <li className="text-slate-500">
                    No identical trait values across all selected diamonds.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={<div className="skeleton h-40 w-full rounded-2xl" />}
    >
      <CompareInner />
    </Suspense>
  );
}
