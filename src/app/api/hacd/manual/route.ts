import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";
import type { ManualHacdInput } from "@/lib/types/hacd";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ManualHacdInput;
  const provider = getProvider();
  if (!provider.analyzeManual) {
    return NextResponse.json(
      { error: "Manual analysis not supported by current provider" },
      { status: 501 }
    );
  }
  const analysis = await provider.analyzeManual(body);
  return NextResponse.json(analysis);
}
