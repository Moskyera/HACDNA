import { promises as fs } from "node:fs";
import path from "node:path";
import type { HacdDiamond } from "@/lib/types/hacd";

/**
 * On Vercel / serverless the filesystem is read-only (except /tmp).
 * Keep index in memory and only attempt disk when not on Vercel.
 */
const isServerless =
  process.env.VERCEL === "1" ||
  process.env.AWS_LAMBDA_FUNCTION_NAME != null ||
  process.env.NEXT_RUNTIME === "edge";

const DATA_DIR = isServerless
  ? path.join("/tmp", "hacdna")
  : path.join(process.cwd(), "data");
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
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    /* ignore on read-only FS */
  }
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
  // Always keep in-memory (works on Vercel cold/warm instances for the process life)
  memory.index = index;
  try {
    await ensureDataDir();
    await fs.writeFile(INDEX_FILE, JSON.stringify(index), "utf8");
  } catch (e) {
    // Expected on some serverless environments — memory still has the data
    if (process.env.NODE_ENV === "development") {
      console.warn("[index-store] disk write skipped:", e);
    }
  }
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

export function isServerlessRuntime() {
  return isServerless;
}
