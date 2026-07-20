"use client";

import type { RarityAnalysis } from "@/lib/types/hacd";
import { MetadataCard } from "@/components/diamond/MetadataCard";
import { ScoreMeter } from "@/components/diamond/ScoreMeter";
import { TraitCard } from "@/components/diamond/TraitCard";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { formatNumber, formatPercent, shortAddress } from "@/lib/utils/format";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

export function AnalysisView({ analysis }: { analysis: RarityAnalysis }) {
  const d = analysis.diamond;
  const chartData = Object.entries(analysis.breakdown)
    .filter(([, v]) => v != null)
    .map(([k, v]) => ({
      name: k,
      score: v as number,
      weight: Math.round(
        (analysis.weightsUsed[k as keyof typeof analysis.weightsUsed] ?? 0) *
          100
      ),
    }));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="glass relative overflow-visible rounded-3xl p-6 md:p-8">
        <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative space-y-8">
          {/* Full-width metadata card (landscape, not clipped) */}
          <MetadataCard diamond={d} />

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <DemoBadge isDemo={d.isDemo} />
              <CategoryBadge category={analysis.category} />
              {analysis.isEstimate && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">
                  <AlertTriangle className="h-3 w-3" /> Relative estimate
                </span>
              )}
            </div>

            <div>
              <h1 className="font-mono text-3xl font-bold tracking-widest text-white md:text-4xl">
                {d.name}
              </h1>
              <p className="mt-1 text-slate-400">
                Diamond #{formatNumber(d.number)} · Rank{" "}
                <span className="text-cyan-200">
                  #{analysis.rank} of {formatNumber(analysis.totalAnalyzed)}
                </span>
              </p>
            </div>

            <ScoreMeter
              score={analysis.rarityScore}
              category={analysis.category}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat
                label="Rarity %"
                value={formatPercent(analysis.rarityPercentage)}
              />
              <Stat
                label="Percentile"
                value={`Top ${(100 - analysis.percentile).toFixed(1)}%`}
              />
              <Stat
                label="Confidence"
                value={`${analysis.confidenceScore}%`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-100/85">
        <strong className="text-cyan-50">About Rarity Score:</strong> How rare
        HIP-5 mining outcomes are (shape, color, style, pattern). Not official
        hacash.org scoring or market price.{" "}
        <Link href="/methodology" className="underline hover:text-white">
          Methodology
        </Link>
      </section>

      {/* Verdict banner */}
      <section className="rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-5 md:p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-200">
          Final verdict
        </h2>
        <p className="text-lg font-medium text-white md:text-xl">
          Rarity Score:{" "}
          <span className="text-gradient">{analysis.rarityScore}/100</span>
        </p>
        <p className="mt-1 text-slate-300">
          Rarity Percentage: {formatPercent(analysis.rarityPercentage)} ·
          Category: {analysis.category}
        </p>
        <p className="mt-3 text-slate-300 leading-relaxed">
          This HACD is rarer than{" "}
          <strong className="text-white">
            {formatPercent(analysis.percentile)}
          </strong>{" "}
          of analyzed HACD diamonds in the current dataset.
        </p>
        <p className="mt-2 text-sm text-slate-400">{analysis.verdict}</p>
      </section>

      {/* Confidence */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 text-cyan-300" />
          <div>
            <h3 className="font-semibold text-white">
              Data Confidence: {analysis.confidenceScore}%
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {analysis.confidenceNote}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Source: {analysis.dataSource}
              {analysis.lastSyncedAt
                ? ` · Synced ${new Date(analysis.lastSyncedAt).toLocaleString()}`
                : ""}
            </p>
          </div>
        </div>
      </section>

      {/* Strengths / weaknesses */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-300">
            <TrendingUp className="h-4 w-4" />
            <h3 className="font-semibold">Strengths</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            {analysis.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-rose-300">
            <TrendingDown className="h-4 w-4" />
            <h3 className="font-semibold">Weaknesses</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            {analysis.weaknesses.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/70" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Breakdown chart */}
      <section className="glass rounded-2xl p-5">
        <h3 className="mb-4 font-semibold text-white">Score breakdown</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 16 }}>
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                stroke="#94a3b8"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 12,
                }}
                formatter={(value) => [
                  `${Number(value).toFixed(1)}`,
                  "Component score",
                ]}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={
                      ["#22d3ee", "#3b82f6", "#a855f7", "#f59e0b", "#34d399", "#f472b6", "#94a3b8"][
                        i % 7
                      ]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {analysis.explanation}
        </p>
      </section>

      {/* Traits grid */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-white">
          Trait analysis
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analysis.traits.map((t) => (
            <TraitCard key={t.key} trait={t} />
          ))}
        </div>
      </section>

      {/* Meta */}
      <section className="glass rounded-2xl p-5 text-sm text-slate-400">
        <h3 className="mb-3 font-semibold text-white">On-chain / metadata</h3>
        <dl className="grid gap-2 sm:grid-cols-2">
          <Meta label="Owner" value={shortAddress(d.traits.ownerAddress, 8)} />
          <Meta label="Miner" value={shortAddress(d.traits.minerAddress, 8)} />
          <Meta
            label="Born block"
            value={
              d.traits.bornBlockHeight != null
                ? formatNumber(d.traits.bornBlockHeight)
                : "Data unavailable"
            }
          />
          <Meta
            label="Bid (HAC)"
            value={
              d.traits.bidAmountHac != null
                ? String(d.traits.bidAmountHac)
                : "Data unavailable"
            }
          />
          <Meta
            label="Visual gene"
            value={d.traits.visualGene ?? "Data unavailable"}
          />
          <Meta
            label="Inscriptions"
            value={d.traits.inscriptions ?? "Data unavailable"}
          />
        </dl>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/compare?ids=${d.name}`}
            className="text-cyan-300 hover:underline"
          >
            Compare with others →
          </Link>
          <Link href="/rankings" className="text-cyan-300 hover:underline">
            View rankings →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="font-mono text-slate-200 break-all">{value}</dd>
    </div>
  );
}
