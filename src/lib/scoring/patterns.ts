import { HACD_ALPHABET } from "@/lib/config/rarity";

export interface NamePatternAnalysis {
  pattern: string;
  symmetry: boolean;
  uniqueChars: number;
  maxRepeat: number;
  isPalindrome: boolean;
  isHalfRepeat: boolean;
  validAlphabet: boolean;
}

/**
 * Analyze HACD 6-letter name for literal / pattern traits.
 * Alphabet: WTYUIAHXVMEKBSZN
 */
export function analyzeNamePattern(name: string): NamePatternAnalysis {
  const upper = name.trim().toUpperCase();
  const chars = upper.split("");
  const validAlphabet = chars.every((c) => HACD_ALPHABET.includes(c));

  const counts = new Map<string, number>();
  for (const c of chars) counts.set(c, (counts.get(c) ?? 0) + 1);

  const uniqueChars = counts.size;
  const maxRepeat = Math.max(...counts.values(), 0);
  const reversed = chars.slice().reverse().join("");
  const isPalindrome = upper === reversed && upper.length === 6;
  const isHalfRepeat =
    upper.length === 6 && upper.slice(0, 3) === upper.slice(3);

  let pattern = "None";

  if (uniqueChars === 1 && maxRepeat === 6) {
    pattern = "Big slam";
  } else if (maxRepeat >= 5) {
    pattern = "Penta repeat";
  } else if (maxRepeat === 4) {
    pattern = "Quadro repeat";
  } else if (maxRepeat === 3) {
    // Check consecutive vs scattered
    if (/(.)\1\1/.test(upper)) {
      pattern = "Triple repeat";
    } else {
      pattern = "Repetition";
    }
  } else if (uniqueChars === 2) {
    pattern = "Two letters";
  } else if (uniqueChars === 3) {
    pattern = "Three letters";
  } else if (isHalfRepeat) {
    pattern = "Half repeat";
  } else if (isPalindrome) {
    pattern = "Symmetric letters";
  } else if (maxRepeat === 2 && uniqueChars <= 4) {
    pattern = "Repetition";
  }

  return {
    pattern,
    symmetry: isPalindrome || isHalfRepeat,
    uniqueChars,
    maxRepeat,
    isPalindrome,
    isHalfRepeat,
    validAlphabet,
  };
}

/** Map frequency (0–1) to a 0–100 rarity subscore via log scale */
export function frequencyToScore(frequency: number): number {
  if (frequency <= 0) return 100;
  if (frequency >= 1) return 0;
  // Inverse log: rarer (lower freq) → higher score
  // freq 0.5 → ~15, 0.05 → ~50, 0.001 → ~85, 0.00001 → ~99
  const raw = -Math.log10(frequency) * 28;
  return Math.max(0, Math.min(100, raw));
}

/** Soft rarity from inverse frequency, clamped */
export function inverseFrequencyScore(frequency: number): number {
  return frequencyToScore(frequency);
}
