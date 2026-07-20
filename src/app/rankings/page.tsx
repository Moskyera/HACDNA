"use client";

import { useCallback, useEffect, useState } from "react";
import type { RankingResult, RarityCategory } from "@/lib/types/hacd";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import Link from "next/link";

const CATEGORIES: Array<RarityCategory | ""> = [
  "",
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Extremely Rare",
  "Legendary",
];

export default function RankingsPage() {
  const [data, setData] = useState<RankingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [top, setTop] = useState<"all" | "10" | "100" | "1%">("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("score");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "12",
      sortBy,
      sortDir: "desc",
      top,
    });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const res = await fetch(`/api/rankings?${params}`);
    const json = (await res.json()) as RankingResult;
    setData(json);
    setLoading(false);
  }, [page, search, category, top, sortBy]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-white">Rankings</h1>
        <DemoBadge />
      </div>

      <div className="glass grid gap-3 rounded-2xl p-4 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search name / number"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400/40 md:col-span-2"
        />
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c || "all"} value={c}>
              {c || "All categories"}
            </option>
          ))}
        </select>
        <select
          value={top}
          onChange={(e) => {
            setPage(1);
            setTop(e.target.value as typeof top);
          }}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="10">Top 10</option>
          <option value="100">Top 100</option>
          <option value="1%">Top 1%</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm md:col-span-2"
        >
          <option value="score">Sort by score</option>
          <option value="percentile">Sort by percentile</option>
          <option value="number">Sort by number</option>
          <option value="name">Sort by name</option>
        </select>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          <p className="text-sm text-slate-500">
            Showing {data.items.length} of {data.total} diamonds
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Percentile</th>
                  <th className="px-4 py-3">Category</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((a, idx) => (
                  <tr
                    key={a.diamond.id}
                    className="border-t border-white/5 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 text-slate-500">
                      {(page - 1) * data.pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/analyze/${a.diamond.name}`}
                        className="font-mono font-semibold tracking-wider text-cyan-200 hover:underline"
                      >
                        {a.diamond.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {a.diamond.number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {a.rarityScore.toFixed(1)}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">
                      {a.percentile.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={a.category} />
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No diamonds match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
