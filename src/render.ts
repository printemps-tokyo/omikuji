import type { Fortune } from "./omikuji.js";
import type { Lang } from "./data.js";

const COLORS: Record<string, string> = {
  reset: "\x1b[0m",
  gold: "\x1b[1;33m",
  green: "\x1b[1;32m",
  red: "\x1b[1;31m",
};

function colorize(text: string, color: keyof typeof COLORS, enabled: boolean): string {
  return enabled ? `${COLORS[color]}${text}${COLORS.reset}` : text;
}

const LABELS = {
  ja: { title: "おみくじ", rankNone: "", lucky: "ラッキー", number: "数字", color: "色", direction: "方角", item: "アイテム" },
  en: { title: "omikuji", rankNone: "", lucky: "Lucky", number: "number", color: "color", direction: "direction", item: "item" },
};

/** Render a fortune as a terminal slip. */
export function renderText(fortune: Fortune, date: string, lang: Lang, color: boolean): string {
  const L = LABELS[lang];
  const rankText = lang === "ja" ? fortune.rank.ja : `${fortune.rank.ja} (${fortune.rank.en})`;
  const rankColor = fortune.rank.tone === "bad" ? "red" : fortune.rank.weight <= 12 ? "gold" : "green";

  const lines: string[] = [];
  lines.push(`=== ${L.title}  ${date} ===`);
  lines.push("");
  lines.push(`  ${colorize(rankText, rankColor as keyof typeof COLORS, color)}`);
  lines.push("");
  const width = Math.max(...fortune.advice.map((a) => a.label.length));
  for (const a of fortune.advice) {
    lines.push(`  ${a.label.padEnd(width)}   ${a.text}`);
  }
  lines.push("");
  const { number, color: c, direction, item } = fortune.lucky;
  lines.push(
    `  ${L.lucky}   ${L.number} ${number} / ${L.color} ${c} / ${L.direction} ${direction} / ${L.item} ${item}`,
  );
  return lines.join("\n") + "\n";
}

/** Render a fortune as JSON. */
export function renderJson(fortune: Fortune, date: string): string {
  return (
    JSON.stringify(
      {
        date,
        rank: { ja: fortune.rank.ja, en: fortune.rank.en, tone: fortune.rank.tone },
        advice: fortune.advice.map((a) => ({ category: a.category, label: a.label, text: a.text })),
        lucky: fortune.lucky,
      },
      null,
      2,
    ) + "\n"
  );
}
