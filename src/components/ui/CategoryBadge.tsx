import type { RarityCategory } from "@/lib/types/hacd";
import { CATEGORY_COLORS } from "@/lib/config/rarity";

export function CategoryBadge({ category }: { category: RarityCategory }) {
  const color = CATEGORY_COLORS[category];
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      {category}
    </span>
  );
}
