"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { DemoBadge } from "@/components/ui/DemoBadge";

const links = [
  { href: "/", label: "Search" },
  { href: "/rankings", label: "Rankings" },
  { href: "/compare", label: "Compare" },
  { href: "/methodology", label: "Methodology" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05060f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/30 to-purple-500/30 ring-1 ring-cyan-400/30">
            <Gem className="h-5 w-5 text-cyan-300" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-white">
              HACDNA
            </div>
            <div className="text-[11px] text-slate-400">HACD Mining Rarity</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-white/10 text-cyan-200"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <DemoBadge />
          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
