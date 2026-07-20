export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export function formatScore(value: number, digits = 1): string {
  return value.toFixed(digits);
}

export function shortAddress(addr: string | null | undefined, n = 6): string {
  if (!addr) return "n/a";
  if (addr.length <= n * 2 + 3) return addr;
  return `${addr.slice(0, n)}...${addr.slice(-n)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
