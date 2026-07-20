import type { HacdDataProvider, ProviderKind } from "@/lib/providers/types";
import { mockProvider } from "@/lib/providers/mock-provider";
import { HacdExplorerProvider } from "@/lib/providers/explorer-provider";
import { HacashNodeProvider } from "@/lib/providers/node-provider";
import { mainnetProvider } from "@/lib/providers/mainnet-provider";

let singleton: HacdDataProvider | null = null;

/**
 * Default: mainnet (public nodeapi.hacash.org).
 * Override with HACD_DATA_PROVIDER=mock|explorer|node|mainnet
 */
export function getProvider(): HacdDataProvider {
  if (singleton) return singleton;

  const kind = (process.env.HACD_DATA_PROVIDER ?? "mainnet") as
    | ProviderKind
    | "mainnet";

  switch (kind) {
    case "mock":
      singleton = mockProvider;
      break;
    case "explorer":
      singleton = new HacdExplorerProvider();
      break;
    case "node":
      // Legacy thin wrapper: prefer mainnet
      singleton = mainnetProvider;
      break;
    case "mainnet":
    default:
      singleton = mainnetProvider;
      break;
  }

  return singleton;
}

export function resetProvider() {
  singleton = null;
}

export type { HacdDataProvider, ProviderKind };
export { mockProvider, mainnetProvider };
