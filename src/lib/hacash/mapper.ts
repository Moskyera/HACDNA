import type { HacdDiamond } from "@/lib/types/hacd";
import type { NodeDiamondRaw } from "@/lib/hacash/client";
import { decodeVisualGene, colorFromName, nameTraits } from "@/lib/hacash/hip5";

/**
 * Parse Hacash amount strings like "9213:245" or "15.5" into approximate mei (HAC).
 * Unit suffix N means 10^(N-248) mei (common convention on Hacash).
 */
export function parseHacAmount(raw: string | number | undefined | null): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  const m = s.match(/^(\d+(?:\.\d+)?)[:：](\d+)$/);
  if (m) {
    const value = Number(m[1]);
    const unit = Number(m[2]);
    // unit 248 = 1 mei, each step -1 is /10
    return value * Math.pow(10, unit - 248);
  }
  return null;
}

export function mapNodeDiamond(
  raw: NodeDiamondRaw,
  totalMinted: number
): HacdDiamond {
  const name = (raw.name || "").toUpperCase();
  const number = raw.number;
  const visualGene = raw.visual_gene ?? null;
  const hip5 = visualGene ? decodeVisualGene(visualGene) : null;
  const pattern = nameTraits(name);
  const bidFromFee = parseHacAmount(raw.bid_fee);
  const bid =
    raw.average_bid_burn != null
      ? raw.average_bid_burn
      : bidFromFee;

  const bornHeight = raw.born?.height ?? raw.mint_height ?? null;
  const inscriptions =
    Array.isArray(raw.inscriptions) && raw.inscriptions.length
      ? raw.inscriptions.map(String).join(" | ")
      : Array.isArray(raw.inscription_items) && raw.inscription_items.length
        ? JSON.stringify(raw.inscription_items)
        : null;

  return {
    id: name,
    name,
    number,
    isDemo: false,
    createdAt: new Date().toISOString(),
    source: "node",
    traits: {
      name,
      number,
      visualGene,
      lifeGene: raw.life_gene ?? null,
      shape: hip5?.shape ?? null,
      color: hip5?.color ?? colorFromName(name),
      style: hip5?.style ?? null,
      literal: pattern.pattern,
      pattern: pattern.pattern,
      symmetry: pattern.symmetry,
      uniqueChars: pattern.uniqueChars,
      maxRepeat: pattern.maxRepeat,
      bornBlockHeight: bornHeight,
      bornBlockHash: raw.born?.hash ?? null,
      prevBlockHash: raw.prev_hash ?? null,
      bidFeeRaw: raw.bid_fee ?? null,
      bidAmountHac: bid,
      averageBurnHac:
        raw.average_bid_burn != null ? raw.average_bid_burn : bid,
      ownerAddress: raw.belong ?? null,
      minerAddress: raw.miner ?? null,
      inscriptions,
      mintPosition:
        totalMinted > 0 ? number / totalMinted : null,
    },
  };
}
