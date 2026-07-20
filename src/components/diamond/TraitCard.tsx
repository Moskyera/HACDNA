import type { TraitScore } from "@/lib/types/hacd";
import { formatPercent } from "@/lib/utils/format";

export function TraitCard({ trait }: { trait: TraitScore }) {
  return (
    <div className="glass glass-hover rounded-2xl p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {trait.label}
        </div>
        {!trait.available && (
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">
            N/A
          </span>
        )}
      </div>

      <div className="mb-3 font-mono text-sm font-semibold text-white break-all">
        {trait.available && trait.value != null && trait.value !== ""
          ? String(trait.value)
          : "Data unavailable"}
      </div>

      {trait.available ? (
        <div className="space-y-1.5 text-xs text-slate-400">
          {trait.frequencyPercent != null && (
            <div className="flex justify-between">
              <span>Frequency</span>
              <span className="text-cyan-200/90">
                {formatPercent(trait.frequencyPercent)}
              </span>
            </div>
          )}
          {trait.rarityScore != null && (
            <div className="flex justify-between">
              <span>Trait score</span>
              <span className="text-white">{trait.rarityScore.toFixed(1)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Contribution</span>
            <span className="text-purple-200">
              +{trait.contribution.toFixed(1)}
            </span>
          </div>
          {trait.note && (
            <p className="pt-1 text-[11px] leading-relaxed text-slate-500">
              {trait.note}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          {trait.note ?? "Data unavailable; excluded from weighted score."}
        </p>
      )}
    </div>
  );
}
