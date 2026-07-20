"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, SlidersHorizontal } from "lucide-react";

const EXAMPLES = ["INMHKM", "WWWWWW", "ABCCBA", "42", "MYTHIC"];
const RECENT_KEY = "hacd-recent-searches";

export function SearchPanel() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({
    name: "",
    number: "",
    shape: "",
    color: "",
    style: "",
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  function pushRecent(q: string) {
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function analyze(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setError(null);
    pushRecent(trimmed);
    router.push(`/analyze/${encodeURIComponent(trimmed)}`);
  }

  async function runManual(e: React.FormEvent) {
    e.preventDefault();
    setManualLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hacd/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manual.name || undefined,
          number: manual.number ? Number(manual.number) : undefined,
          shape: manual.shape || undefined,
          color: manual.color || undefined,
          style: manual.style || undefined,
        }),
      });
      if (!res.ok) throw new Error("Manual analysis failed");
      const data = await res.json();
      // Store transient result for analysis page via session
      sessionStorage.setItem(
        `hacd-manual-${data.diamond.id}`,
        JSON.stringify(data)
      );
      router.push(`/analyze/${encodeURIComponent(data.diamond.id)}?manual=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setManualLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyze(query);
        }}
        className="glass relative overflow-hidden rounded-3xl p-2 sm:p-3"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="HACD name, number, or ID (e.g. INMHKM or #133367)"
              className="w-full rounded-2xl border border-white/5 bg-black/30 py-3.5 pl-12 pr-4 text-sm text-white outline-none ring-cyan-400/0 transition placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400/40 sm:text-base"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
          >
            <Sparkles className="h-4 w-4" />
            Analyze HACD
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-3 text-sm text-rose-300">{error}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Examples:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => analyze(ex)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
          >
            {ex}
          </button>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Recent:</span>
          {recent.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => analyze(r)}
              className="rounded-full border border-white/5 bg-black/20 px-3 py-1 text-xs text-slate-300 hover:text-white"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowManual((v) => !v)}
        className="mt-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-200"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {showManual ? "Hide" : "Manual trait entry"}
      </button>

      {showManual && (
        <form
          onSubmit={runManual}
          className="glass mt-3 grid gap-3 rounded-2xl p-4 sm:grid-cols-2"
        >
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400/40"
            placeholder="Name (6 letters)"
            value={manual.name}
            onChange={(e) => setManual({ ...manual, name: e.target.value })}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400/40"
            placeholder="Number"
            value={manual.number}
            onChange={(e) => setManual({ ...manual, number: e.target.value })}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400/40"
            placeholder="Shape"
            value={manual.shape}
            onChange={(e) => setManual({ ...manual, shape: e.target.value })}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400/40"
            placeholder="Color"
            value={manual.color}
            onChange={(e) => setManual({ ...manual, color: e.target.value })}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400/40 sm:col-span-2"
            placeholder="Style"
            value={manual.style}
            onChange={(e) => setManual({ ...manual, style: e.target.value })}
          />
          <button
            type="submit"
            disabled={manualLoading}
            className="rounded-xl bg-purple-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 sm:col-span-2"
          >
            {manualLoading ? "Analyzing…" : "Analyze manual traits"}
          </button>
        </form>
      )}
    </div>
  );
}
