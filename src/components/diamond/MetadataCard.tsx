"use client";

import { useEffect, useRef, useState } from "react";
import type { HacdDiamond } from "@/lib/types/hacd";
import "./metadata-card.css";

/**
 * Official explorer card population logic (diamond.js):
 * https://explorer.hacash.org/jscss/diamond.js
 */

declare global {
  interface Window {
    CreateDiamondImageTagSVG?: (visualGene: string, size: number) => string;
    GetDiamondMainColor?: (
      visualGene: string,
      count?: number
    ) => string[] | string[][];
    DiamondImageColorListDefs?: string[][];
    CreateDiamondBrillianceSVG?: (
      visualGene: string,
      size: number,
      color: string
    ) => string;
    CreateLifeGameInitialSVG?: (
      lifeGene: string,
      size: number,
      a: null,
      b: boolean,
      c: boolean
    ) => [string, ...unknown[]];
  }
}

const CARD_W = 800;
const CARD_H = 500;

const SCRIPTS = [
  "/explorer/diamondsvgimg.min.js",
  "/explorer/sha3.min.js",
  "/explorer/diamondbrilliance.min.js",
  "/explorer/diamondlifegame.min.js",
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-hacd-lib="${src}"]`
    ) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.dataset.hacdLib = src;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

/** Same helper as explorer diamond.js: insert sep after 1-based positions */
function insertAfterPositions(
  str: string,
  sep: string,
  positions: number[]
): string {
  const out: string[] = [];
  let pi = 0;
  for (let i = 0; i < str.length; i++) {
    out.push(str.charAt(i));
    if (pi < positions.length && i === positions[pi] - 1) {
      out.push(sep);
      pi++;
    }
  }
  return out.join("");
}

function formatBid(raw: string | null, hac: number | null): string {
  if (raw) return `ㄜ${raw.replace(/^ㄜ/, "")}`;
  if (hac != null) return `${hac} HAC`;
  return "n/a";
}

function shortMiner(addr: string | null): string {
  if (!addr) return "n/a";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 12)}···`;
}

function shortBornHash(hash: string | null): string {
  if (!hash) return "····················";
  return `···${hash.slice(-20)}`;
}

/**
 * Metadata card matching explorer.hacash.org/diamond/{NAME}
 * Uses official HIP-5/HIP-8/HIP-9 scripts + exact CSS positions.
 */
export function MetadataCard({
  diamond,
  compact = false,
  showCaption = true,
}: {
  diamond: HacdDiamond;
  /** Slightly smaller fit for lists (home top scored) */
  compact?: boolean;
  showCaption?: boolean;
}) {
  const t = diamond.traits;
  const stageRef = useRef<HTMLDivElement>(null);
  const cditRef = useRef<HTMLDivElement>(null);
  const cdconRef = useRef<HTMLDivElement>(null);
  const ibgRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const h8Ref = useRef<HTMLDivElement>(null);
  const h9Ref = useRef<HTMLDivElement>(null);
  const lgRef = useRef<HTMLParagraphElement>(null);
  const vgRef = useRef<HTMLDivElement>(null);
  const dnRef = useRef<HTMLDivElement>(null);
  const ldzRef = useRef<HTMLDivElement>(null);
  const clbRef = useRef<HTMLDivElement>(null);
  const cllRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // Responsive scale: full 800x500 card, shrink to fit width
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth || CARD_W;
      const maxScale = compact ? 0.92 : 1;
      setScale(Math.min(maxScale, w / CARD_W));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready, compact]);

  // Populate card with official explorer scripts (same as diamond.js)
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        for (const src of SCRIPTS) {
          await loadScript(src);
        }
        if (cancelled) return;

        const vgstr = (t.visualGene || "").toLowerCase();
        const lgene = (t.lifeGene || "").toLowerCase();
        const dianb = diamond.number;

        if (!vgstr || !window.CreateDiamondImageTagSVG) {
          setError("Visual gene or HIP-5 script unavailable");
          setReady(true);
          return;
        }

        const cardH = CARD_H;
        const mainColor = window.GetDiamondMainColor?.(vgstr) as string[];
        const svg = window.CreateDiamondImageTagSVG(vgstr, cardH);

        // Background gradient from main HIP-5 colors
        if (cdconRef.current && mainColor?.length >= 2) {
          cdconRef.current.style.backgroundImage = `linear-gradient(to right bottom, #${mainColor[0]}99, #${mainColor[1]})`;
        }

        // CSS vars for global color defs + per-diamond facet colors
        const styleBits: string[] = [];
        if (window.DiamondImageColorListDefs) {
          for (let e = 0; e < 16; e++) {
            const pair = window.DiamondImageColorListDefs[e];
            styleBits.push(`--dccr-${e + 1}:#${pair[0]}`);
            styleBits.push(`--dccr-${e + 17}:#${pair[1]}`);
          }
        }
        const facetColors = window.GetDiamondMainColor?.(vgstr, 16) as string[][];
        if (facetColors && Array.isArray(facetColors[0])) {
          for (let e = 0; e < 16; e++) {
            const pair = facetColors[e] || ["000000", "000000"];
            styleBits.push(`--diacl-${e + 1}:#${pair[0]}`);
            styleBits.push(`--diacl2-${e + 1}:#${pair[1]}`);
          }
        }
        // attach style once per diamond
        let styleEl = document.getElementById(
          "hacd-meta-card-vars"
        ) as HTMLStyleElement | null;
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = "hacd-meta-card-vars";
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = `:root{${styleBits.join(";")}}`;

        if (ibgRef.current) ibgRef.current.innerHTML = svg;
        if (imgRef.current) imgRef.current.innerHTML = svg;

        // HIP-8 brilliance (h8) — global from diamondbrilliance.min.js
        const createBrilliance =
          window.CreateDiamondBrillianceSVG ||
          (globalThis as unknown as { CreateDiamondBrillianceSVG?: typeof window.CreateDiamondBrillianceSVG })
            .CreateDiamondBrillianceSVG;
        if (h8Ref.current && createBrilliance) {
          try {
            h8Ref.current.innerHTML = createBrilliance(
              vgstr,
              cardH / 4,
              "#ffffff66"
            );
          } catch {
            h8Ref.current.innerHTML = "";
          }
        }

        // HIP-9 life game (h9) — global from diamondlifegame.min.js
        const createLife =
          window.CreateLifeGameInitialSVG ||
          (globalThis as unknown as { CreateLifeGameInitialSVG?: typeof window.CreateLifeGameInitialSVG })
            .CreateLifeGameInitialSVG;
        if (h9Ref.current && createLife && lgene) {
          try {
            const life = createLife(lgene, cardH / 5, null, true, true);
            h9Ref.current.innerHTML = life?.[0] || "";
          } catch {
            h9Ref.current.innerHTML = "";
          }
        }

        // Life gene text with <br> every 8 chars (explorer positions)
        if (lgRef.current && lgene) {
          lgRef.current.innerHTML = insertAfterPositions(
            lgene,
            "<br>",
            [8, 16, 24, 32, 40, 48, 56]
          );
          // diagonal color gradient like explorer
          const stops: string[] = [];
          for (let e = 0; e < 15; e++) {
            const pct = 6.25 * e;
            stops.push(
              `var(--diacl-${e + 1}) ${pct}%`,
              `transparent ${pct}%`,
              `transparent ${1 + pct}%`,
              `var(--diacl-${e + 2}) ${1 + pct}%`
            );
          }
          lgRef.current.style.backgroundImage = `linear-gradient(-21deg,${stops.join(",")})`;
          lgRef.current.style.webkitBackgroundClip = "text";
          lgRef.current.style.backgroundClip = "text";
          lgRef.current.style.color = "transparent";
        }

        // Visual gene: insert spaces at explorer positions [2,6,10,14,18]
        if (vgRef.current && vgstr) {
          const plain = vgstr.toUpperCase();
          // Build char array, color first two if special shape (0 + 1..8)
          const parts: string[] = plain.split("").map((ch, idx) => {
            if (
              mainColor &&
              idx === 0 &&
              plain[0] === "0" &&
              plain[1] >= "1" &&
              plain[1] <= "8"
            ) {
              return `<span style="color:#${mainColor[0]}">${ch}</span>`;
            }
            if (
              mainColor &&
              idx === 1 &&
              plain[0] === "0" &&
              plain[1] >= "1" &&
              plain[1] <= "8"
            ) {
              return `<span style="color:#${mainColor[1]}">${ch}</span>`;
            }
            if (idx >= 18) {
              return `<span style="color:#ffffff33">${ch}</span>`;
            }
            return ch;
          });
          // Insert spaces after 1-based positions 2,6,10,14,18
          const withSpaces: string[] = [];
          const cuts = new Set([2, 6, 10, 14, 18]);
          for (let i = 0; i < parts.length; i++) {
            withSpaces.push(parts[i]);
            if (cuts.has(i + 1) && i + 1 < parts.length) {
              withSpaces.push(" ");
            }
          }
          vgRef.current.innerHTML = withSpaces.join("");
        }

        // Diamond name gradient from facet CSS vars
        if (dnRef.current) {
          dnRef.current.style.backgroundImage = `linear-gradient(90deg,
            var(--diacl-1), var(--diacl2-1),
            var(--diacl-2), var(--diacl2-2),
            var(--diacl-3), var(--diacl2-3),
            var(--diacl-4), var(--diacl2-4),
            var(--diacl-5), var(--diacl2-5),
            var(--diacl-6), var(--diacl2-6)
          )`;
          dnRef.current.style.webkitBackgroundClip = "text";
          dnRef.current.style.backgroundClip = "text";
          dnRef.current.style.color = "transparent";
        }

        // Diagonal stripe size based on diamond number
        if (ldzRef.current) {
          const d = ((100001 - dianb) / 1e5) * 48;
          ldzRef.current.style.backgroundSize = `${d}px ${d}px`;
        }

        // Color bar clb
        if (clbRef.current) {
          const parts: string[] = [];
          for (let e = 0; e < 15; e++) {
            const pct = 6.25 * e + 6;
            parts.push(
              `var(--diacl2-${e + 1}) ${pct}%`,
              `transparent ${pct}%`,
              `transparent ${1 + pct}%`,
              `var(--diacl2-${e + 2}) ${1 + pct}%`
            );
          }
          clbRef.current.style.backgroundImage = `linear-gradient(135deg,${parts.join(",")})`;
        }

        // Color line cll
        if (cllRef.current) {
          cllRef.current.style.backgroundImage = `linear-gradient(0deg,
            var(--diacl-15), var(--diacl2-15),
            var(--diacl-13), var(--diacl2-13),
            var(--diacl-14), var(--diacl2-14),
            var(--diacl-16), var(--diacl2-16)
          )`;
        }

        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Card render failed");
          setReady(true);
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [
    diamond.name,
    diamond.number,
    t.visualGene,
    t.lifeGene,
  ]);

  const stageH = CARD_H * scale;

  return (
    <div className="hacd-meta-card-wrap">
      {!ready && (
        <div className="hacd-meta-card-loading">Loading metadata card...</div>
      )}

      <div
        ref={stageRef}
        className="hacd-meta-card"
        style={{
          height: ready ? stageH : 0,
          visibility: ready ? "visible" : "hidden",
          position: ready ? "relative" : "absolute",
        }}
        aria-label={`Metadata card ${diamond.name}`}
      >
        <div
          ref={cditRef}
          className="cdit"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          {/* Exact explorer DOM order */}
          <div ref={cdconRef} className="cdcon">
            <div ref={ibgRef} className="ibg" />
            <div ref={ldzRef} className="ldz" />
            <div ref={imgRef} className="img" />
            <div ref={h8Ref} className="oh h8" />
            <div ref={h9Ref} className="oh h9" />

            <div className="meta">
              <div className="blk">
                {shortBornHash(t.bornBlockHash)}
                <br />
                BORN BLOCK:{" "}
                <b>{t.bornBlockHeight != null ? t.bornBlockHeight : "n/a"}</b>
              </div>
              <div ref={clbRef} className="clb" />
              <div className="num">{diamond.number}</div>
              <div ref={dnRef} className="dn">
                {diamond.name}
              </div>
              <p className="lgn">LIFE GENES</p>
              <p ref={lgRef} className="lg" />
              <div ref={vgRef} className="vg" />
              <p className="gmn">LIFE GAME CODE</p>
              <p className="bid">
                BID: {formatBid(t.bidFeeRaw, t.bidAmountHac)}
                <br />
                {shortMiner(t.minerAddress)}
              </p>
              <div ref={cllRef} className="cll" />
            </div>
          </div>
        </div>
      </div>

      {ready && showCaption && (
        <p className="hacd-meta-card-caption">
          {error
            ? error
            : "Explorer-style metadata card (HIP-5 / HIP-8 / HIP-9 + on-chain fields)."}
        </p>
      )}
    </div>
  );
}
