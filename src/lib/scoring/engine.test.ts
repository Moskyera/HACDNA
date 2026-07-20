import { describe, expect, it } from "vitest";
import { analyzeDiamond, analyzeAll } from "@/lib/scoring/engine";
import { analyzeNamePattern, frequencyToScore } from "@/lib/scoring/patterns";
import {
  getCategory,
  getOfficialMiningFrequency,
  HIP5_PROTOCOL_SHAPE_FREQ,
} from "@/lib/config/rarity";
import { MOCK_DIAMONDS } from "@/lib/data/mock-diamonds";

describe("name patterns", () => {
  it("detects big slam", () => {
    expect(analyzeNamePattern("WWWWWW").pattern).toBe("Big slam");
  });

  it("detects triple consecutive", () => {
    expect(analyzeNamePattern("KKKAMI").pattern).toBe("Triple repeat");
  });

  it("detects palindrome symmetry", () => {
    const p = analyzeNamePattern("ABCCBA");
    expect(p.isPalindrome).toBe(true);
    expect(p.symmetry).toBe(true);
  });

  it("scores common name INMHKM as low pattern rarity", () => {
    const p = analyzeNamePattern("INMHKM");
    expect(p.uniqueChars).toBeGreaterThanOrEqual(5);
    expect(p.pattern).toBe("None");
  });
});

describe("HIP-5 mining frequencies", () => {
  it("uses protocol rates for shapes", () => {
    const std = getOfficialMiningFrequency("shape", "Standard");
    const heart = getOfficialMiningFrequency("shape", "Heart");
    expect(std?.frequency).toBeCloseTo(HIP5_PROTOCOL_SHAPE_FREQ.Standard, 5);
    expect(heart?.frequency).toBeCloseTo(1 / 256, 5);
    expect(heart!.frequency).toBeLessThan(std!.frequency);
  });

  it("uses ~1/16 for colors", () => {
    const c = getOfficialMiningFrequency("color", "I Red");
    expect(c?.frequency).toBeCloseTo(1 / 16, 5);
  });

  it("maps lower mining frequency to higher score", () => {
    expect(frequencyToScore(1 / 256)).toBeGreaterThan(frequencyToScore(248 / 256));
    expect(frequencyToScore(0.000285)).toBeGreaterThan(frequencyToScore(0.05));
  });
});

describe("categories", () => {
  it("maps score bands", () => {
    expect(getCategory(10)).toBe("Common");
    expect(getCategory(30)).toBe("Uncommon");
    expect(getCategory(50)).toBe("Rare");
    expect(getCategory(70)).toBe("Very Rare");
    expect(getCategory(90)).toBe("Extremely Rare");
    expect(getCategory(98)).toBe("Legendary");
  });
});

describe("analyzeDiamond (mining rarity)", () => {
  it("ranks rare HIP-5 traits higher than common floor diamonds", () => {
    const rare = MOCK_DIAMONDS.find((d) => d.name === "WWWWWW")!;
    const common = MOCK_DIAMONDS.find((d) => d.name === "INMHKM")!;
    const rareA = analyzeDiamond(rare, MOCK_DIAMONDS, {
      lastSyncedAt: new Date().toISOString(),
      dataSource: "test",
    });
    const commonA = analyzeDiamond(common, MOCK_DIAMONDS, {
      lastSyncedAt: new Date().toISOString(),
      dataSource: "test",
    });

    expect(rareA.rarityScore).toBeGreaterThanOrEqual(0);
    expect(rareA.rarityScore).toBeLessThanOrEqual(100);
    expect(commonA.rarityScore).toBeGreaterThanOrEqual(0);
    expect(commonA.rarityScore).toBeLessThanOrEqual(100);
    expect(rareA.rarityScore).toBeGreaterThan(commonA.rarityScore);
    // breakdown keys are mining traits
    expect(rareA.breakdown.shape != null || rareA.breakdown.pattern != null).toBe(
      true
    );
  });

  it("analyzeAll covers full mock set", () => {
    const all = analyzeAll(MOCK_DIAMONDS);
    expect(all.length).toBe(MOCK_DIAMONDS.length);
    const scores = all.map((a) => a.rarityScore);
    expect(Math.min(...scores)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...scores)).toBeLessThanOrEqual(100);
  });
});
