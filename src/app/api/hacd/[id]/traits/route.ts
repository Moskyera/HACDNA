import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const provider = getProvider();
  const traits = await provider.getTraits(decodeURIComponent(id));
  if (!traits) {
    return NextResponse.json(
      { error: "HACD not found", id },
      { status: 404 }
    );
  }
  return NextResponse.json({ traits, isDemo: provider.isDemo });
}
