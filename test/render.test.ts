import { describe, expect, it } from "vitest";
import { drawOmikuji } from "../src/omikuji.js";
import { renderText, renderJson } from "../src/render.js";

const fortune = drawOmikuji("2026-06-24", "ja");

describe("renderText", () => {
  it("includes the title, date, rank, and lucky line (no color)", () => {
    const out = renderText(fortune, "2026-06-24", "ja", false);
    expect(out).toContain("=== おみくじ  2026-06-24 ===");
    expect(out).toContain(fortune.rank.ja);
    expect(out).toContain("ラッキー");
    expect(out).not.toContain("\x1b["); // no ANSI when color is off
  });

  it("adds ANSI color when enabled", () => {
    expect(renderText(fortune, "2026-06-24", "ja", true)).toContain("\x1b[");
  });

  it("shows English labels in en mode", () => {
    const en = drawOmikuji("2026-06-24", "en");
    const out = renderText(en, "2026-06-24", "en", false);
    expect(out).toContain("=== omikuji  2026-06-24 ===");
    expect(out).toContain("Lucky");
  });
});

describe("renderJson", () => {
  it("emits a structured fortune", () => {
    const parsed = JSON.parse(renderJson(fortune, "2026-06-24"));
    expect(parsed.date).toBe("2026-06-24");
    expect(parsed.rank.ja).toBe(fortune.rank.ja);
    expect(parsed.advice).toHaveLength(5);
    expect(parsed.lucky.number).toBe(fortune.lucky.number);
  });
});
