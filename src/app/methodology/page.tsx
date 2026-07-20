import { DemoBadge } from "@/components/ui/DemoBadge";
import {
  DEFAULT_WEIGHTS,
  RARITY_CATEGORIES,
  WEIGHT_LABELS,
} from "@/lib/config/rarity";
import { getProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const provider = getProvider();
  const sync = await provider.getSyncStatus();
  const stats = await provider.getStatistics();

  return (
    <div className="prose prose-invert mx-auto max-w-3xl space-y-8 prose-headings:text-white prose-p:text-slate-400 prose-li:text-slate-400">
      <div className="not-prose flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-white">Methodology</h1>
        <DemoBadge />
      </div>

      <section className="not-prose glass space-y-3 rounded-2xl p-6 text-sm text-slate-300">
        <h2 className="text-lg font-semibold text-white">Data status</h2>
        <ul className="space-y-1 text-slate-400">
          <li>Provider: {sync.source}</li>
          <li>Diamonds in dataset: {stats.totalDiamonds}</li>
          <li>Demo mode: {sync.isDemo ? "Yes" : "No"}</li>
          <li>
            Last sync:{" "}
            {sync.lastSyncedAt
              ? new Date(sync.lastSyncedAt).toLocaleString()
              : "n/a"}
          </li>
          <li>{sync.message}</li>
        </ul>
      </section>

      <section className="not-prose rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5 text-sm text-cyan-50">
        <h2 className="mb-2 text-lg font-semibold text-white">
          Does the score follow Hacash mining rarity?
        </h2>
        <p className="leading-relaxed text-cyan-100/90">
          <strong>Yes in substance.</strong> The score answers:{" "}
          <em>
            “How rare were the HIP-5 mining outcomes for this diamond (shape,
            color, style, letter pattern)?”
          </em>
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-cyan-100/90">
          <li>
            <strong>Shape</strong>: HIP-5 protocol (special shapes ~1/256 each,
            Standard ~248/256)
          </li>
          <li>
            <strong>Color</strong>: 16-letter alphabet / main color (~1/16)
          </li>
          <li>
            <strong>Style & letter patterns</strong>: published mainnet HIP-5
            rates (e.g. hacash.diamonds/types, Pure ~0.0285%, Big slam, etc.)
          </li>
          <li>
            <strong>Combo</strong>: product of those rates (joint mining rarity)
          </li>
        </ul>
        <p className="mt-3 leading-relaxed text-cyan-100/90">
          Hacash.org does <em>not</em> publish a single official 0-100 number.
          We turn the official rarity rates into one comparable score. This is{" "}
          <em>not</em> market price and not bid size.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">How the score works</h2>
        <p>
          Each HACD gets a composite <strong>mining-rarity score 0-100</strong>{" "}
          from HIP-5 mining frequencies:
        </p>
        <pre className="not-prose overflow-x-auto rounded-xl bg-black/40 p-4 text-xs text-cyan-100">
{`// chance to mine this trait (HIP-5 / chain stats)
freq_shape, freq_color, freq_style, freq_pattern

trait_score = normalize(-log10(freq))   // rarer → higher
combo_freq  = freq_shape × freq_color × freq_style × freq_pattern
final       = 0.28·shape + 0.22·color + 0.25·style + 0.20·pattern + 0.05·combo

percentile  = rank among local index only (not full supply unless indexed)`}
        </pre>
        <p>
          Missing traits are excluded from weights. Percentile is relative to
          the local mainnet index sample until more diamonds are synced.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Weights</h2>
        <div className="not-prose mt-3 space-y-2">
          {(Object.keys(DEFAULT_WEIGHTS) as Array<keyof typeof DEFAULT_WEIGHTS>).map(
            (k) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
              >
                <span className="text-slate-300">{WEIGHT_LABELS[k]}</span>
                <span className="font-mono text-cyan-200">
                  {(DEFAULT_WEIGHTS[k] * 100).toFixed(0)}%
                </span>
              </div>
            )
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Categories</h2>
        <div className="not-prose mt-3 grid gap-2 sm:grid-cols-2">
          {RARITY_CATEGORIES.map((c) => (
            <div
              key={c.category}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300"
            >
              <span className="font-semibold text-white">{c.category}</span>
              <span className="text-slate-500">
                {" "}
                · {c.min}–{c.max}
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm">
          Thresholds live in <code>src/lib/config/rarity.ts</code> and are easy
          to reconfigure.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Traits examined</h2>
        <ul>
          <li>Name & letter patterns (repeats, symmetry, unique chars)</li>
          <li>Diamond number / mint position</li>
          <li>Shape, color, style (HIP-5 inspired)</li>
          <li>Visual gene / life gene when present</li>
          <li>Born block height, bid amount</li>
          <li>Owner / miner / inscriptions when available</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Data sources</h2>
        <ul>
          <li>
            <strong>MainnetHacdProvider</strong> (default): live Hacash mainnet
            via node RPC
          </li>
          <li>
            <strong>MockHacdProvider</strong>: offline demo diamonds for UI
            tests
          </li>
          <li>
            <strong>HacdExplorerProvider</strong>: adapter for explorer APIs (
            <code>HACD_EXPLORER_API_URL</code>)
          </li>
          <li>
            <strong>HacashNodeProvider</strong>: adapter for fullnode RPC (
            <code>HACASH_NODE_RPC_URL</code>)
          </li>
          <li>
            HIP-5 public frequency priors used only as fallback when the local
            sample has zero observations for a trait value
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Limitations</h2>
        <ul>
          <li>Local index may not cover full mainnet supply (~100k+ diamonds).</li>
          <li>
            Market prices and full ownership history are not fully modeled.
          </li>
          <li>
            Rarity ≠ market value. Demand, aesthetics, and liquidity still
            matter.
          </li>
          <li>
            Confidence score drops when fields are missing or the sample is
            small.
          </li>
        </ul>
      </section>
    </div>
  );
}
