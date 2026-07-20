import { NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";

export async function GET() {
  const provider = getProvider();
  const stats = await provider.getStatistics();
  const sync = await provider.getSyncStatus();
  return NextResponse.json({ ...stats, sync });
}
