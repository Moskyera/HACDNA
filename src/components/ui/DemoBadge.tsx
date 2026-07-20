export function DemoBadge({
  className = "",
  isDemo,
}: {
  className?: string;
  /** When false, shows Mainnet badge instead */
  isDemo?: boolean;
}) {
  const demo =
    isDemo ??
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_HACD_DATA_PROVIDER ??
        process.env.HACD_DATA_PROVIDER ??
        "mainnet") === "mock");

  if (!demo) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-200 ${className}`}
        title="Connected to Hacash mainnet node API for live HACD data."
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
        Mainnet
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-amber-200 ${className}`}
      title="Running on demo / mock data."
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
      Demo Data
    </span>
  );
}
