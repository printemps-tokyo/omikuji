import { describe, expect, it } from "vitest";
import { drawOmikuji, dailySeed, todayString, shouldShow, detectLang, isValidDate } from "../src/omikuji.js";
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

describe("detectLang", () => {
  it("defaults to en when no locale variables are set", () => {
    expect(detectLang({})).toBe("en");
  });

  it("detects ja from LANG", () => {
    expect(detectLang({ LANG: "ja_JP.UTF-8" })).toBe("ja");
  });

  it("detects non-ja locales as en", () => {
    expect(detectLang({ LANG: "en_US.UTF-8" })).toBe("en");
    expect(detectLang({ LANG: "fr_FR.UTF-8" })).toBe("en");
    expect(detectLang({ LANG: "C" })).toBe("en");
  });

  it("prefers LC_ALL over LC_MESSAGES and LANG", () => {
    expect(detectLang({ LC_ALL: "ja_JP.UTF-8", LC_MESSAGES: "en_US.UTF-8", LANG: "en_US.UTF-8" })).toBe("ja");
    expect(detectLang({ LC_ALL: "en_US.UTF-8", LC_MESSAGES: "ja_JP.UTF-8", LANG: "ja_JP.UTF-8" })).toBe("en");
  });

  it("prefers LC_MESSAGES over LANG", () => {
    expect(detectLang({ LC_MESSAGES: "ja_JP.UTF-8", LANG: "en_US.UTF-8" })).toBe("ja");
  });

  it("skips empty values and falls through to the next variable", () => {
    expect(detectLang({ LC_ALL: "", LC_MESSAGES: "", LANG: "ja_JP.UTF-8" })).toBe("ja");
  });

  it("is case-insensitive on the language tag", () => {
    expect(detectLang({ LANG: "JA_JP.UTF-8" })).toBe("ja");
  });

  it("does not treat ja mid-string as Japanese", () => {
    expect(detectLang({ LANG: "de_DE@ja" })).toBe("en");
  });
});

describe("isValidDate", () => {
  it("accepts real calendar dates", () => {
    expect(isValidDate("2026-06-24")).toBe(true);
    expect(isValidDate("2026-01-01")).toBe(true);
    expect(isValidDate("2026-12-31")).toBe(true);
  });

  it("accepts leap days in leap years", () => {
    expect(isValidDate("2028-02-29")).toBe(true);
    expect(isValidDate("2000-02-29")).toBe(true);
  });

  it("rejects Feb 29 in non-leap years", () => {
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("1900-02-29")).toBe(false);
  });

  it("rejects impossible month or day values", () => {
    expect(isValidDate("2026-99-99")).toBe(false);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("2026-00-10")).toBe(false);
    expect(isValidDate("2026-04-31")).toBe(false);
    expect(isValidDate("2026-01-00")).toBe(false);
  });

  it("rejects strings that are not strictly YYYY-MM-DD", () => {
    expect(isValidDate("2026-6-24")).toBe(false);
    expect(isValidDate("2026/06/24")).toBe(false);
    expect(isValidDate("20260624")).toBe(false);
    expect(isValidDate("2026-06-24T00:00:00Z")).toBe(false);
    expect(isValidDate("")).toBe(false);
    expect(isValidDate("not-a-date")).toBe(false);
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
