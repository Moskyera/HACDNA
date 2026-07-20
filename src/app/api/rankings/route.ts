import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";
import type { RankingFilters, RarityCategory } from "@/lib/types/hacd";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: RankingFilters = {
    search: sp.get("search") ?? undefined,
    category: (sp.get("category") as RarityCategory) || undefined,
    color: sp.get("color") ?? undefined,
    shape: sp.get("shape") ?? undefined,
    pattern: sp.get("pattern") ?? undefined,
    minScore: sp.get("minScore") ? Number(sp.get("minScore")) : undefined,
    maxScore: sp.get("maxScore") ? Number(sp.get("maxScore")) : undefined,
    sortBy: (sp.get("sortBy") as RankingFilters["sortBy"]) || "score",
    sortDir: (sp.get("sortDir") as RankingFilters["sortDir"]) || "desc",
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 12,
    top: (sp.get("top") as RankingFilters["top"]) || "all",
  };

  const provider = getProvider();
  const result = await provider.getRankings(filters);
  return NextResponse.json(result);
}
