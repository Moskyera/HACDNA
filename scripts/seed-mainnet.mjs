/**
 * Pre-seed local mainnet index without starting Next.
 * Usage: node scripts/seed-mainnet.mjs
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.HACASH_NODE_RPC_URL || "http://nodeapi.hacash.org";
const DATA = path.join(process.cwd(), "data", "mainnet-index.json");

const LETTER_NIBBLE_COLOR = {
  0: "W Dark blue",
  1: "T Blue",
  2: "Y Red purple",
  3: "U Blue purple",
  4: "I Red",
  5: "A Red cyan",
  6: "H Pink",
  7: "X Grey",
  8: "V Light pink",
  9: "M Yellow secret",
  10: "E Secret",
  11: "K Pink cyan",
  12: "B Cyan",
  13: "S Green",
  14: "Z Gold",
  15: "N Yellow Cyan",
};
const SHAPES = [
  "Standard",
  "Square",
  "Ellipse",
  "Heart",
  "Triangle",
  "Teardrop",
  "Circle",
  "Rhombus",
  "Hexagon",
];

function decodeVisual(visualGene) {
  if (!visualGene || visualGene.length < 3) {
    return { shape: null, color: null, style: null };
  }
  const s = [...visualGene.toLowerCase()].map((c) => parseInt(c, 16));
  let shapeIndex = 16 * s[0] + s[1];
  if (shapeIndex > 8) shapeIndex = 0;
  const colorIndex = s[2] ?? 0;
  const facets = s.slice(2, Math.min(s.length, 18));
  const unique = new Set(facets).size;
  let style = "Standard";
  if (unique <= 1) style = "Pure";
  else if (unique === 2) style = "Double mix";
  else if (unique >= 6) style = "Center color";
  else style = "Edge color";
  return {
    shape: SHAPES[shapeIndex],
    color: LETTER_NIBBLE_COLOR[colorIndex] ?? null,
    style,
  };
}

function patternOf(name) {
  const counts = {};
  for (const c of name) counts[c] = (counts[c] || 0) + 1;
  const unique = Object.keys(counts).length;
  const maxRepeat = Math.max(...Object.values(counts));
  let pattern = "None";
  if (unique === 1) pattern = "Big slam";
  else if (maxRepeat >= 5) pattern = "Penta repeat";
  else if (maxRepeat === 4) pattern = "Quadro repeat";
  else if (maxRepeat === 3) pattern = "Triple repeat";
  else if (unique === 2) pattern = "Two letters";
  else if (unique === 3) pattern = "Three letters";
  else if (name === [...name].reverse().join("")) pattern = "Symmetric letters";
  return { pattern, uniqueChars: unique, maxRepeat, symmetry: pattern === "Symmetric letters" };
}

function mapRaw(raw, total) {
  const name = raw.name.toUpperCase();
  const hip = decodeVisual(raw.visual_gene);
  const pat = patternOf(name);
  return {
    id: name,
    name,
    number: raw.number,
    isDemo: false,
    createdAt: new Date().toISOString(),
    source: "node",
    traits: {
      name,
      number: raw.number,
      visualGene: raw.visual_gene ?? null,
      lifeGene: raw.life_gene ?? null,
      shape: hip.shape,
      color: hip.color,
      style: hip.style,
      literal: pat.pattern,
      pattern: pat.pattern,
      symmetry: pat.symmetry,
      uniqueChars: pat.uniqueChars,
      maxRepeat: pat.maxRepeat,
      bornBlockHeight: raw.born?.height ?? null,
      bornBlockHash: raw.born?.hash ?? null,
      prevBlockHash: raw.prev_hash ?? null,
      bidFeeRaw: raw.bid_fee ?? null,
      bidAmountHac: raw.average_bid_burn ?? null,
      averageBurnHac: raw.average_bid_burn ?? null,
      ownerAddress: raw.belong ?? null,
      minerAddress: raw.miner ?? null,
      inscriptions:
        Array.isArray(raw.inscriptions) && raw.inscriptions.length
          ? raw.inscriptions.join(" | ")
          : null,
      mintPosition: total > 0 ? raw.number / total : null,
    },
  };
}

async function fetchJson(p) {
  const r = await fetch(`${BASE}${p}`);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${p}`);
  return r.json();
}

async function main() {
  console.log("Mainnet base:", BASE);
  const latest = await fetchJson("/query/latest");
  const total = latest.diamond;
  console.log("Chain diamonds:", total, "height:", latest.height);

  const set = new Set();
  for (let n = 1; n <= Math.min(30, total); n++) set.add(n);
  for (const n of [100, 256, 512, 1000, 5000, 10000, 50000, 100000]) {
    if (n <= total) set.add(n);
  }
  const step = Math.max(1, Math.floor(total / 80));
  for (let n = 1; n <= total; n += step) set.add(n);
  for (let n = Math.max(1, total - 40); n <= total; n++) set.add(n);
  const numbers = [...set].sort((a, b) => a - b);
  console.log("Fetching", numbers.length, "diamonds...");

  const diamonds = [];
  let i = 0;
  const concurrency = 12;
  async function worker() {
    while (i < numbers.length) {
      const n = numbers[i++];
      try {
        const raw = await fetchJson(`/query/diamond?number=${n}`);
        if (raw.ret === 0 && raw.name) diamonds.push(mapRaw(raw, total));
      } catch (e) {
        console.warn("skip", n, e.message);
      }
      if (diamonds.length % 25 === 0) {
        process.stdout.write(`\r  got ${diamonds.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log("\nMapped", diamonds.length);

  // merge existing
  let existing = [];
  try {
    existing = JSON.parse(await readFile(DATA, "utf8")).diamonds || [];
  } catch {
    /* none */
  }
  const map = new Map();
  for (const d of existing) map.set(d.name, d);
  for (const d of diamonds) map.set(d.name, d);
  const merged = [...map.values()].sort((a, b) => a.number - b.number);

  await mkdir(path.dirname(DATA), { recursive: true });
  const index = {
    version: 1,
    source: BASE,
    lastSyncedAt: new Date().toISOString(),
    totalMinted: total,
    latestHeight: latest.height,
    diamonds: merged,
  };
  await writeFile(DATA, JSON.stringify(index));
  console.log("Wrote", DATA, "count=", merged.length);

  // sample print
  const inm = merged.find((d) => d.name === "INMHKM");
  if (inm) console.log("INMHKM sample:", JSON.stringify(inm.traits, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
