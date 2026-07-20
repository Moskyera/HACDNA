import { NextRequest, NextResponse } from "next/server";
import { mainnetProvider } from "@/lib/providers/mainnet-provider";
import { getProvider } from "@/lib/providers";

/**
 * POST /api/sync
 * Pull more HACD records from mainnet into the local index.
 * Body optional: { "mode": "seed" | "expand" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      mode?: "seed" | "expand";
    };
    const result = await mainnetProvider.syncIndex({
      mode: body.mode ?? "expand",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Sync failed",
      },
      { status: 502 }
    );
  }
}

export async function GET() {
  const provider = getProvider();
  const status = await provider.getSyncStatus();
  return NextResponse.json(status);
}
