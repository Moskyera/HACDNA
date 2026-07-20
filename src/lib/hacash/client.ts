/**
 * Hacash mainnet fullnode RPC client.
 * Default public endpoint: http://nodeapi.hacash.org
 * Docs: https://github.com/hacash/doc/blob/main/server/fullnode_api_doc.md
 */

export interface NodeDiamondRaw {
  ret: number;
  err?: string;
  number: number;
  name: string;
  bid_fee?: string;
  average_bid_burn?: number;
  belong?: string;
  miner?: string;
  visual_gene?: string;
  life_gene?: string;
  prev_hash?: string;
  born?: { height?: number; hash?: string };
  mint_height?: number;
  inscriptions?: string[] | unknown[];
  inscription_items?: unknown[];
}

export interface NodeLatest {
  ret: number;
  height: number;
  diamond: number;
}

export interface NodeSupply {
  ret: number;
  minted_diamond: number;
  latest_height?: number;
  burned_diamond_bid?: number;
  current_circulation?: number;
}

const DEFAULT_BASE =
  process.env.HACASH_NODE_RPC_URL?.replace(/\/$/, "") ||
  "http://nodeapi.hacash.org";

async function fetchWithTimeout(
  url: string,
  ms = 12_000,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export class HacashNodeClient {
  constructor(public readonly baseUrl: string = DEFAULT_BASE) {}

  private async getJson<T>(path: string, timeoutMs = 12_000): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetchWithTimeout(url, timeoutMs);
    if (!res.ok) {
      throw new Error(`Hacash node HTTP ${res.status} for ${path}`);
    }
    return (await res.json()) as T;
  }

  async latest(): Promise<NodeLatest> {
    return this.getJson<NodeLatest>("/query/latest", 10_000);
  }

  async supply(): Promise<NodeSupply> {
    return this.getJson<NodeSupply>("/query/supply", 10_000);
  }

  async diamondByName(name: string): Promise<NodeDiamondRaw | null> {
    const data = await this.getJson<NodeDiamondRaw>(
      `/query/diamond?name=${encodeURIComponent(name.toUpperCase())}`,
      12_000
    );
    if (data.ret !== 0 || !data.name) return null;
    return data;
  }

  async diamondByNumber(number: number): Promise<NodeDiamondRaw | null> {
    const data = await this.getJson<NodeDiamondRaw>(
      `/query/diamond?number=${number}`,
      12_000
    );
    if (data.ret !== 0 || !data.name) return null;
    return data;
  }

  async diamond(idOrNameOrNumber: string): Promise<NodeDiamondRaw | null> {
    const raw = idOrNameOrNumber.trim();
    if (!raw) return null;
    const asNum = Number(raw.replace(/^#/, ""));
    if (!Number.isNaN(asNum) && /^\d+$/.test(raw.replace(/^#/, ""))) {
      return this.diamondByNumber(asNum);
    }
    if (raw.toUpperCase().startsWith("MANUAL-")) return null;
    return this.diamondByName(raw.replace(/^MANUAL-/, ""));
  }

  async fetchByNumbers(
    numbers: number[],
    concurrency = 6
  ): Promise<NodeDiamondRaw[]> {
    const out: NodeDiamondRaw[] = [];
    let i = 0;
    async function worker(this: HacashNodeClient) {
      while (i < numbers.length) {
        const n = numbers[i++];
        try {
          const d = await this.diamondByNumber(n);
          if (d) out.push(d);
        } catch {
          /* skip */
        }
      }
    }
    const workers = Array.from({ length: concurrency }, () =>
      worker.call(this)
    );
    await Promise.all(workers);
    return out;
  }
}

export const mainnetClient = new HacashNodeClient();
