"use client";

import { cn } from "@/lib/utils/cn";

const COLOR_HEX: Record<string, string> = {
  "W Dark blue": "#1e3a8a",
  "T Blue": "#2563eb",
  "Y Red purple": "#9f1239",
  "U Blue purple": "#6d28d9",
  "I Red": "#dc2626",
  "A Red cyan": "#e11d48",
  "H Pink": "#ec4899",
  "X Grey": "#64748b",
  "V Light pink": "#f9a8d4",
  "M Yellow secret": "#ca8a04",
  "E Secret": "#7c3aed",
  "K Pink cyan": "#db2777",
  "B Cyan": "#06b6d4",
  "S Green": "#16a34a",
  "Z Gold": "#eab308",
  "N Yellow Cyan": "#84cc16",
  Mixed: "#475569",
};

interface Props {
  name: string;
  number: number;
  color?: string | null;
  shape?: string | null;
  style?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DiamondVisual({
  name,
  number,
  color,
  shape,
  style,
  size = "md",
  className,
}: Props) {
  const fill = COLOR_HEX[color ?? ""] ?? "#334155";
  const dims =
    size === "lg" ? "h-52 w-52" : size === "sm" ? "h-16 w-16" : "h-32 w-32";

  const clip =
    shape === "Heart"
      ? "polygon(50% 90%, 10% 45%, 25% 15%, 50% 30%, 75% 15%, 90% 45%)"
      : shape === "Square"
        ? "polygon(15% 15%, 85% 15%, 85% 85%, 15% 85%)"
        : shape === "Triangle"
          ? "polygon(50% 8%, 92% 88%, 8% 88%)"
          : shape === "Hexagon"
            ? "polygon(25% 8%, 75% 8%, 95% 50%, 75% 92%, 25% 92%, 5% 50%)"
            : shape === "Rhombus"
              ? "polygon(50% 5%, 92% 50%, 50% 95%, 8% 50%)"
              : shape === "Teardrop"
                ? "polygon(50% 5%, 85% 45%, 70% 90%, 30% 90%, 15% 45%)"
                : shape === "Ellipse"
                  ? "ellipse(42% 48% at 50% 50%)"
                  : "polygon(50% 4%, 78% 22%, 96% 50%, 78% 78%, 50% 96%, 22% 78%, 4% 50%, 22% 22%)";

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div
        className={cn(
          "float-soft relative flex items-center justify-center",
          dims
        )}
      >
        <div
          className="absolute inset-2 opacity-90 shadow-[0_0_40px_rgba(34,211,238,0.25)]"
          style={{
            background: `linear-gradient(145deg, ${fill}cc, #0f172a 70%)`,
            clipPath: clip.includes("ellipse") ? undefined : clip,
            borderRadius: clip.includes("ellipse") ? "50%" : undefined,
            boxShadow: `inset 0 0 30px ${fill}88`,
          }}
        />
        <div
          className="absolute inset-4 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, white, transparent 55%)",
            clipPath: clip.includes("ellipse") ? undefined : clip,
            borderRadius: clip.includes("ellipse") ? "50%" : undefined,
          }}
        />
        <div className="relative z-10 text-center">
          <div className="font-mono text-sm font-bold tracking-[0.2em] text-white drop-shadow md:text-base">
            {name}
          </div>
          <div className="text-[10px] text-cyan-100/80">#{number}</div>
        </div>
      </div>
      {style && (
        <div className="mt-2 max-w-[12rem] truncate text-center text-[11px] text-slate-400">
          {style}
          {shape ? ` · ${shape}` : ""}
        </div>
      )}
    </div>
  );
}
