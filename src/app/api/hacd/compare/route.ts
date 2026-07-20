import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length < 2 || ids.length > 5) {
    return NextResponse.json(
      { error: "Provide 2–5 HACD ids via ?ids=A,B,C" },
      { status: 400 }
    );
  }

  try {
    const provider = getProvider();
    const result = await provider.compare(ids);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Compare failed" },
      { status: 400 }
    );
  }
}
