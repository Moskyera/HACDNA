import type { HacdDiamond } from "@/lib/types/hacd";
import { FIRST_LETTER_COLOR } from "@/lib/config/rarity";
import { analyzeNamePattern } from "@/lib/scoring/patterns";

const SHAPES = [
  "Special Shape",
  "Square",
  "Ellipse",
  "Heart",
  "Triangle",
  "Teardrop",
  "Circle",
  "Rhombus",
  "Hexagon",
  "Standard",
] as const;

const STYLES = [
  "Pure",
  "Left three pure",
  "Left mix pure",
  "Right three pure",
  "Right mix pure",
  "Symmetry",
  "Half divide",
  "Double mix",
  "Center color",
  "Edge color",
  "Sum six color",
  "All 14 color",
  "All 15 color",
  "Standard",
] as const;

interface Seed {
  name: string;
  number: number;
  shape: (typeof SHAPES)[number];
  style: (typeof STYLES)[number];
  block: number;
  bid: number;
  visualGene?: string;
  lifeGene?: string;
  owner?: string;
  miner?: string;
  inscriptions?: string | null;
}

/**
 * 45 demo HACD records for UI / scoring.
 * Includes realistic rare/common mix and the real name INMHKM as a demo entry
 * (on-chain fields partly mirrored from explorer; still labeled isDemo).
 */
const SEEDS: Seed[] = [
  // Legendary / extremely rare demos
  { name: "WWWWWW", number: 7, shape: "Special Shape", style: "Pure", block: 1200, bid: 120, inscriptions: "genesis-art" },
  { name: "AAAAAA", number: 42, shape: "Heart", style: "Pure", block: 5400, bid: 95 },
  { name: "ZZZAAA", number: 108, shape: "Special Shape", style: "All 15 color", block: 8900, bid: 80 },
  { name: "ABCCBA", number: 256, shape: "Hexagon", style: "Symmetry", block: 15000, bid: 60 },
  { name: "NNNMMM", number: 512, shape: "Circle", style: "Left three pure", block: 22000, bid: 55 },
  { name: "HHHKKK", number: 777, shape: "Rhombus", style: "Right three pure", block: 30000, bid: 48 },
  { name: "SSSSTT", number: 1000, shape: "Special Shape", style: "Left three pure", block: 40000, bid: 40 },
  { name: "XYXYXY", number: 1337, shape: "Triangle", style: "Half divide", block: 50000, bid: 35 },
  { name: "MNMNMN", number: 2048, shape: "Ellipse", style: "Symmetry", block: 60000, bid: 30 },
  { name: "BBBBTY", number: 3000, shape: "Teardrop", style: "Right three pure", block: 70000, bid: 28 },
  // Very rare / rare
  { name: "KKKAMI", number: 5000, shape: "Square", style: "Left mix pure", block: 90000, bid: 25 },
  { name: "ZAZAZA", number: 8000, shape: "Heart", style: "Double mix", block: 110000, bid: 22 },
  { name: "IIIIWN", number: 12000, shape: "Special Shape", style: "Center color", block: 140000, bid: 20 },
  { name: "HUSHES", number: 15000, shape: "Circle", style: "Edge color", block: 160000, bid: 18 },
  { name: "TWINKS", number: 20000, shape: "Hexagon", style: "Standard", block: 190000, bid: 16 },
  { name: "NEXUSZ", number: 25000, shape: "Rhombus", style: "All 14 color", block: 220000, bid: 15 },
  { name: "MYTHIC", number: 30000, shape: "Triangle", style: "Sum six color", block: 250000, bid: 14 },
  { name: "VALHUT", number: 35000, shape: "Ellipse", style: "Right mix pure", block: 280000, bid: 14 },
  { name: "SHINYX", number: 40000, shape: "Teardrop", style: "Center color", block: 310000, bid: 13 },
  { name: "CRYSTL", number: 45000, shape: "Square", style: "Edge color", block: 340000, bid: 12 },
  // Mid / uncommon
  { name: "WTYUIA", number: 50000, shape: "Standard", style: "Standard", block: 380000, bid: 12 },
  { name: "HXVMEK", number: 55000, shape: "Circle", style: "Center color", block: 410000, bid: 11 },
  { name: "BSZNWT", number: 60000, shape: "Standard", style: "Edge color", block: 440000, bid: 11 },
  { name: "IAHXVM", number: 65000, shape: "Hexagon", style: "Standard", block: 470000, bid: 10 },
  { name: "EKBSZN", number: 70000, shape: "Standard", style: "Standard", block: 500000, bid: 10 },
  { name: "TWYUHX", number: 75000, shape: "Triangle", style: "Double mix", block: 530000, bid: 10 },
  { name: "VMKEBS", number: 80000, shape: "Standard", style: "Standard", block: 560000, bid: 9 },
  { name: "ZNWTIA", number: 85000, shape: "Square", style: "Center color", block: 590000, bid: 9 },
  { name: "HXBSKE", number: 90000, shape: "Standard", style: "Standard", block: 620000, bid: 9 },
  { name: "YUIMAZ", number: 95000, shape: "Heart", style: "Edge color", block: 650000, bid: 8 },
  // Common / floor
  { name: "WTHXBN", number: 100000, shape: "Standard", style: "Standard", block: 680000, bid: 8 },
  { name: "KEZVMS", number: 105000, shape: "Standard", style: "Standard", block: 700000, bid: 8 },
  { name: "UAIBYT", number: 110000, shape: "Circle", style: "Standard", block: 720000, bid: 7 },
  { name: "NSHWXK", number: 115000, shape: "Standard", style: "Center color", block: 730000, bid: 7 },
  { name: "MBTEZY", number: 120000, shape: "Standard", style: "Standard", block: 740000, bid: 7 },
  { name: "XKWNAS", number: 125000, shape: "Ellipse", style: "Standard", block: 750000, bid: 6 },
  { name: "HBTUME", number: 128000, shape: "Standard", style: "Edge color", block: 755000, bid: 6 },
  { name: "YSKWNE", number: 130000, shape: "Standard", style: "Standard", block: 760000, bid: 6 },
  { name: "VZAIHB", number: 131000, shape: "Rhombus", style: "Standard", block: 762000, bid: 6 },
  { name: "TEKSNW", number: 132000, shape: "Standard", style: "Standard", block: 764000, bid: 5 },
  // Real-ish late common (mirrors explorer INMHKM discussion)
  {
    name: "INMHKM",
    number: 133367,
    shape: "Standard",
    style: "Standard",
    block: 766040,
    bid: 15,
    visualGene: "1b4f96b91875784ee990",
    lifeGene: "18c260be745d3a63d77bbaf81959a8b7f68e151581e80705e718745e8eb9c91b",
    owner: "1Fp8S5oRKr4ayXW93GQa9vMLnYA5AUFjqS",
    miner: "1EaqdAi9FLCQwLYPLWVtoRM1fZwGezXLTi",
    inscriptions: null,
  },
  { name: "NWKSHE", number: 133400, shape: "Standard", style: "Standard", block: 766100, bid: 15 },
  { name: "BAYTUX", number: 133500, shape: "Teardrop", style: "Center color", block: 766200, bid: 16 },
  { name: "MKKIHH", number: 900, shape: "Special Shape", style: "Pure", block: 35000, bid: 50 },
  { name: "SSTTSS", number: 4000, shape: "Heart", style: "Symmetry", block: 85000, bid: 26 },
];

// Clean invalid styles from manual typos
const VALID_STYLES = new Set<string>(STYLES);

function fixStyle(style: string): string {
  if (VALID_STYLES.has(style)) return style;
  if (style.includes("Triple") || style.includes("Penta")) return "Left three pure";
  return "Standard";
}

const MAX_NUMBER = Math.max(...SEEDS.map((s) => s.number));

function buildDiamond(seed: Seed, index: number): HacdDiamond {
  const patternInfo = analyzeNamePattern(seed.name);
  const color =
    FIRST_LETTER_COLOR[seed.name[0]?.toUpperCase()] ?? "Mixed";
  const style = fixStyle(seed.style);
  const literal =
    patternInfo.pattern === "None" ? "None" : patternInfo.pattern;

  return {
    id: seed.name.toUpperCase(),
    name: seed.name.toUpperCase(),
    number: seed.number,
    isDemo: true,
    createdAt: new Date(Date.UTC(2019, 4, 16) + seed.number * 3600_000).toISOString(),
    source: "mock",
    traits: {
      name: seed.name.toUpperCase(),
      number: seed.number,
      visualGene: seed.visualGene ?? `demo${index.toString(16).padStart(12, "0")}`,
      lifeGene: seed.lifeGene ?? null,
      shape: seed.shape,
      color,
      style,
      literal,
      pattern: patternInfo.pattern,
      symmetry: patternInfo.symmetry,
      uniqueChars: patternInfo.uniqueChars,
      maxRepeat: patternInfo.maxRepeat,
      bornBlockHeight: seed.block,
      bornBlockHash: null,
      prevBlockHash: null,
      bidFeeRaw: null,
      bidAmountHac: seed.bid,
      averageBurnHac: Math.round(seed.bid * 0.9 * 10) / 10,
      ownerAddress: seed.owner ?? `1DemoOwner${seed.number.toString(16)}`,
      minerAddress: seed.miner ?? `1DemoMiner${seed.number.toString(16)}`,
      inscriptions: seed.inscriptions === undefined ? null : seed.inscriptions,
      mintPosition: seed.number / MAX_NUMBER,
    },
  };
}

export const MOCK_DIAMONDS: HacdDiamond[] = SEEDS.map(buildDiamond);

export const MOCK_SYNCED_AT = new Date().toISOString();
export const MOCK_TOTAL_SUPPLY_HINT = 133500;
