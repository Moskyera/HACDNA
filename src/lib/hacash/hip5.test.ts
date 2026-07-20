import { describe, expect, it } from "vitest";
import { decodeVisualGene } from "@/lib/hacash/hip5";
import { parseHacAmount } from "@/lib/hacash/mapper";

describe("HIP-5 visual gene", () => {
  it("maps first-byte shape (INMHKM visual gene ends as standard)", () => {
    // visual_gene from mainnet INMHKM
    const d = decodeVisualGene("1b4f96b91875784ee990");
    // first byte 0x1b = 27 > 8 → Standard
    expect(d.shape).toBe("Standard");
    expect(d.isSpecialShape).toBe(false);
    // third nibble = 4 → I Red
    expect(d.color).toBe("I Red");
  });

  it("detects special shape when first byte is 1–8", () => {
    // construct gene with first byte 0x03 (Heart)
    const d = decodeVisualGene("034f96b91875784ee990");
    expect(d.shapeIndex).toBe(3);
    expect(d.shape).toBe("Heart");
    expect(d.isSpecialShape).toBe(true);
  });
});

describe("parseHacAmount", () => {
  it("parses unit form", () => {
    const v = parseHacAmount("9213:245");
    expect(v).not.toBeNull();
    expect(v!).toBeCloseTo(9.213, 3);
  });

  it("parses plain number", () => {
    expect(parseHacAmount("15")).toBe(15);
  });
});
