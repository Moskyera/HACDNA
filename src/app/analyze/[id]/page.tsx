import { AnalysisView } from "@/components/diamond/AnalysisView";
import { getProvider } from "@/lib/providers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const provider = getProvider();
  const analysis = await provider.getRarity(decoded);

  if (!analysis) {
    return (
      <div className="glass mx-auto max-w-lg rounded-3xl p-8 text-center">
        <h1 className="text-xl font-semibold text-white">HACD not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          No diamond matched “{decoded}” in the current dataset. Try a demo
          name like INMHKM or WWWWWW.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-cyan-300 hover:underline"
        >
          ← Back to search
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-cyan-200">
          ← Search
        </Link>
      </div>
      <AnalysisView analysis={analysis} />
    </div>
  );
}
