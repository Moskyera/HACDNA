import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const provider = getProvider();
  const diamond = await provider.getDiamond(decodeURIComponent(id));
  if (!diamond) {
    return NextResponse.json(
      { error: "HACD not found", id },
      { status: 404 }
    );
  }
  return NextResponse.json({
    diamond,
    isDemo: diamond.isDemo || provider.isDemo,
    source: provider.name,
  });
}
