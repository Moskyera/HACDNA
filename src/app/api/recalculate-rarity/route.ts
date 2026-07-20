import { NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";

export async function POST() {
  const provider = getProvider();
  const result = await provider.recalculateRarity();
  return NextResponse.json({
    ok: true,
    ...result,
    provider: provider.name,
    isDemo: provider.isDemo,
  });
}
