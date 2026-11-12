import { describe, expect, it } from "vitest";
import { drawOmikuji } from "../src/omikuji.js";
import { renderText, renderJson, renderSvg, escapeXml, wrapLine } from "../src/render.js";

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

describe("seasonal lines", () => {
  it("shows the season, the event and the seasonal item", () => {
    const f = drawOmikuji("2026-07-07", "ja");
    const out = renderText(f, "2026-07-07", "ja", false);
    expect(out).toContain("季節");
    expect(out).toContain("夏：");
    expect(out).toContain("行事");
    expect(out).toContain("七夕：");
    expect(out).toContain("季節の品");
    const parsed = JSON.parse(renderJson(f, "2026-07-07"));
    expect(parsed.season.season).toBe("summer");
    expect(parsed.event.label).toBe("七夕");
  });

  it("has no event line on an ordinary day", () => {
    const f = drawOmikuji("2026-06-24", "en");
    expect(renderText(f, "2026-06-24", "en", false)).not.toContain("Event");
    expect(JSON.parse(renderJson(f, "2026-06-24")).event).toBeNull();
  });
});

describe("renderSvg", () => {
  it("is a standalone SVG with the rank, every line and the lucky items", () => {
    const f = drawOmikuji("2026-12-31", "en");
    const svg = renderSvg(f, "2026-12-31", "en", "alice");
    expect(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain(f.rank.ja);
    expect(svg).toContain(f.rank.en);
    expect(svg).toContain("for alice");
    expect(svg).toContain("New Year&apos;s Eve");
    expect(svg).toContain(f.season!.item);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    // The height follows the content and the frame follows the height.
    const height = Number(/height="(\d+)" viewBox/.exec(svg)![1]);
    expect(svg).toContain(`viewBox="0 0 600 ${height}"`);
    const ys = [...svg.matchAll(/ y="(\d+)"/g)].map((m) => Number(m[1]));
    expect(Math.max(...ys)).toBeLessThan(height - 40);
  });

  it("escapes the name so it cannot inject markup", () => {
    const f = drawOmikuji("2026-06-24", "ja");
    const svg = renderSvg(f, "2026-06-24", "ja", '<script>"x"&\u0001</script>');
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;&quot;x&quot;&amp;&lt;/script&gt; さん");
    expect(escapeXml("a\u0000b")).toBe("ab");
  });

  it("wraps long lines at spaces, or between characters", () => {
    expect(wrapLine("short", 20, 300)).toEqual(["short"]);
    const lines = wrapLine("New Year's Eve: Shake off the year and await the new one.", 19, 355);
    expect(lines.length).toBe(2);
    expect(lines.join(" ")).toBe("New Year's Eve: Shake off the year and await the new one.");
    expect(wrapLine("あ".repeat(30), 24, 240).every((l) => [...l].length <= 10)).toBe(true);
  });
});

describe("renderSvg layout", () => {
  it("keeps every word of a long lucky item and a long name", () => {
    const f = drawOmikuji("2026-03-07", "en");
    f.season!.item = "a light green handkerchief";
    const name = "あ".repeat(40);
    const svg = renderSvg(f, "2026-03-07", "en", name);
    const texts = [...svg.matchAll(/>([^<]*)<\/text>/g)].map((m) => m[1]);
    const joined = texts.join(" ");
    for (const word of ["a", "light", "green", "handkerchief"]) {
      expect(joined).toContain(word);
    }
    const nameLines = texts.filter((t): t is string => t !== undefined && t.includes("あ"));
    expect(nameLines.length).toBeGreaterThan(1);
    expect(nameLines.join("").replace(/^for /, "")).toBe(name);
    const height = Number(/height="(\d+)" viewBox/.exec(svg)![1]);
    const ys = [...svg.matchAll(/ y="(\d+)"/g)].map((m) => Number(m[1]));
    expect(Math.max(...ys)).toBeLessThan(height - 40);
  });
});
