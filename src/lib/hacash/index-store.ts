import { promises as fs } from "node:fs";
import path from "node:path";
import type { HacdDiamond } from "@/lib/types/hacd";

const DATA_DIR = path.join(process.cwd(), "data");
const INDEX_FILE = path.join(DATA_DIR, "mainnet-index.json");

export interface MainnetIndexFile {
  version: 1;
  source: string;
  lastSyncedAt: string | null;
  totalMinted: number;
  latestHeight: number;
  diamonds: HacdDiamond[];
}

const memory: { index: MainnetIndexFile | null } = { index: null };

export async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function loadIndex(): Promise<MainnetIndexFile | null> {
  if (memory.index) return memory.index;
  try {
    const raw = await fs.readFile(INDEX_FILE, "utf8");
    const parsed = JSON.parse(raw) as MainnetIndexFile;
    memory.index = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveIndex(index: MainnetIndexFile): Promise<void> {
  await ensureDataDir();
  memory.index = index;
  await fs.writeFile(INDEX_FILE, JSON.stringify(index), "utf8");
}

export function mergeDiamonds(
  existing: HacdDiamond[],
  incoming: HacdDiamond[]
): HacdDiamond[] {
  const map = new Map<string, HacdDiamond>();
  for (const d of existing) map.set(d.name, d);
  for (const d of incoming) map.set(d.name, d);
  return [...map.values()].sort((a, b) => a.number - b.number);
}

export function clearMemoryIndex() {
  memory.index = null;
}
