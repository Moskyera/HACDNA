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
  /** older field names */
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

export class HacashNodeClient {
  constructor(public readonly baseUrl: string = DEFAULT_BASE) {}

  private async getJson<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      // Next.js: avoid indefinite static cache of chain data
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Hacash node HTTP ${res.status} for ${path}`);
    }
    return (await res.json()) as T;
  }

  async latest(): Promise<NodeLatest> {
    return this.getJson<NodeLatest>("/query/latest");
  }

  async supply(): Promise<NodeSupply> {
    return this.getJson<NodeSupply>("/query/supply");
  }

  async diamondByName(name: string): Promise<NodeDiamondRaw | null> {
    const data = await this.getJson<NodeDiamondRaw>(
      `/query/diamond?name=${encodeURIComponent(name.toUpperCase())}`
    );
    if (data.ret !== 0 || !data.name) return null;
    return data;
  }

  async diamondByNumber(number: number): Promise<NodeDiamondRaw | null> {
    const data = await this.getJson<NodeDiamondRaw>(
      `/query/diamond?number=${number}`
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
    // Manual analysis ids
    if (raw.toUpperCase().startsWith("MANUAL-")) return null;
    return this.diamondByName(raw.replace(/^MANUAL-/, ""));
  }

  /**
   * Fetch many diamonds by number with limited concurrency.
   * Skips missing numbers silently.
   */
  async fetchByNumbers(
    numbers: number[],
    concurrency = 8
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
          /* skip transient errors */
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
