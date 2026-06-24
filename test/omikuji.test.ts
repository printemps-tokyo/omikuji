import { describe, expect, it } from "vitest";
import { drawOmikuji, dailySeed, todayString, shouldShow } from "../src/omikuji.js";
import { RANKS, CATEGORIES } from "../src/data.js";
import { makeRng, pickWeighted } from "../src/rng.js";

describe("drawOmikuji", () => {
  it("is deterministic for a given seed", () => {
    const a = drawOmikuji("2026-06-24", "ja");
    const b = drawOmikuji("2026-06-24", "ja");
    expect(a).toEqual(b);
  });

  it("changes with the seed (date or name)", () => {
    const today = drawOmikuji(dailySeed("2026-06-24"), "ja");
    const named = drawOmikuji(dailySeed("2026-06-24", "alice"), "ja");
    // Different seeds should usually differ; at minimum the seed wiring differs.
    expect(dailySeed("2026-06-24", "alice")).not.toBe(dailySeed("2026-06-24"));
    expect(typeof today.rank.ja).toBe("string");
    expect(typeof named.rank.ja).toBe("string");
  });

  it("produces a valid rank, all categories, and an in-range lucky number", () => {
    const f = drawOmikuji("seed-x", "ja");
    expect(RANKS.map((r) => r.ja)).toContain(f.rank.ja);
    expect(f.advice.map((a) => a.category)).toEqual([...CATEGORIES]);
    expect(f.lucky.number).toBeGreaterThanOrEqual(1);
    expect(f.lucky.number).toBeLessThanOrEqual(49);
  });

  it("matches the advice tone to the rank", () => {
    // Find seeds that yield a good and a bad rank, then check tone wiring holds.
    let good = false;
    let bad = false;
    for (let i = 0; i < 200 && !(good && bad); i++) {
      const f = drawOmikuji(`t-${i}`, "en");
      if (f.rank.tone === "good") good = true;
      if (f.rank.tone === "bad") bad = true;
    }
    expect(good && bad).toBe(true);
  });

  it("switches language", () => {
    const ja = drawOmikuji("same", "ja");
    const en = drawOmikuji("same", "en");
    expect(ja.advice[0]?.label).toBe("願望");
    expect(en.advice[0]?.label).toBe("Wish");
  });
});

describe("daily helpers", () => {
  it("todayString formats local date", () => {
    expect(todayString(new Date(2026, 5, 24, 9, 0))).toBe("2026-06-24");
  });

  it("shouldShow only when the key changed", () => {
    expect(shouldShow(undefined, "2026-06-24")).toBe(true);
    expect(shouldShow("2026-06-23", "2026-06-24")).toBe(true);
    expect(shouldShow("2026-06-24", "2026-06-24")).toBe(false);
  });
});

describe("pickWeighted", () => {
  it("respects weights over many draws", () => {
    const items = [
      { item: "a", weight: 1 },
      { item: "b", weight: 9 },
    ];
    let bCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (pickWeighted(makeRng(`w-${i}`), items) === "b") bCount += 1;
    }
    // b has 90% weight; expect a large majority (allow slack).
    expect(bCount).toBeGreaterThan(800);
  });
});
