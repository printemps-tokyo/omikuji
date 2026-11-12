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
  ja: {
    title: "おみくじ",
    rankNone: "",
    lucky: "ラッキー",
    number: "数字",
    color: "色",
    direction: "方角",
    item: "アイテム",
    season: "季節",
    seasonItem: "季節の品",
    event: "行事",
  },
  en: {
    title: "omikuji",
    rankNone: "",
    lucky: "Lucky",
    number: "number",
    color: "color",
    direction: "direction",
    item: "item",
    season: "Season",
    seasonItem: "seasonal",
    event: "Event",
  },
};

/** "label: text", with a full-width colon in Japanese. */
function pair(lang: Lang, label: string, text: string): string {
  return lang === "ja" ? `${label}：${text}` : `${label}: ${text}`;
}

/** Which highlight a rank gets: red for bad, gold for the rare good ones. */
function rankColor(fortune: Fortune): "red" | "gold" | "green" {
  return fortune.rank.tone === "bad" ? "red" : fortune.rank.weight <= 12 ? "gold" : "green";
}

/** Render a fortune as a terminal slip. */
export function renderText(fortune: Fortune, date: string, lang: Lang, color: boolean): string {
  const L = LABELS[lang];
  const rankText = lang === "ja" ? fortune.rank.ja : `${fortune.rank.ja} (${fortune.rank.en})`;

  const lines: string[] = [];
  lines.push(`=== ${L.title}  ${date} ===`);
  lines.push("");
  lines.push(`  ${colorize(rankText, rankColor(fortune), color)}`);
  lines.push("");
  const rows: [string, string][] = fortune.advice.map((a) => [a.label, a.text]);
  if (fortune.season) {
    rows.push([L.season, pair(lang, fortune.season.label, fortune.season.text)]);
  }
  if (fortune.event) {
    rows.push([L.event, pair(lang, fortune.event.label, fortune.event.text)]);
  }
  const width = Math.max(...rows.map(([label]) => label.length));
  for (const [label, text] of rows) {
    lines.push(`  ${label.padEnd(width)}   ${text}`);
  }
  lines.push("");
  const { number, color: c, direction, item } = fortune.lucky;
  const seasonal = fortune.season ? ` / ${L.seasonItem} ${fortune.season.item}` : "";
  lines.push(
    `  ${L.lucky}   ${L.number} ${number} / ${L.color} ${c} / ${L.direction} ${direction} / ${L.item} ${item}${seasonal}`,
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
        season: fortune.season ?? null,
        event: fortune.event ?? null,
      },
      null,
      2,
    ) + "\n"
  );
}

/** Escape text for SVG character data and attribute values. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Characters XML 1.0 does not allow at all.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "");
}

const SVG_INK = { red: "#b3262e", gold: "#a8761a", green: "#2f6b3a" };

/** Rough advance width in em: full width for CJK and kana, about half for Latin. */
function emWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    w += cp >= 0x1100 ? 1 : /[A-Z]/.test(ch) ? 0.68 : 0.52;
  }
  return w;
}

/**
 * Break `text` into lines no wider than `max` pixels at `size`: at spaces for
 * Latin text, between characters otherwise.
 */
export function wrapLine(text: string, size: number, max: number): string[] {
  const fits = (t: string): boolean => emWidth(t) * size <= max;
  if (fits(text)) return [text];
  const lines: string[] = [];
  let current = "";
  // Split at spaces, and break any piece that alone is too wide (a long
  // name, or text without spaces) between characters.
  const pieces = /\s/.test(text) ? text.split(/(?<=\s)/) : [text];
  const words = pieces.flatMap((p) => (fits(p.trimEnd()) ? [p] : [...p]));
  for (const word of words) {
    if (current && !fits(current + word)) {
      lines.push(current.trimEnd());
      current = word.trimStart();
    } else {
      current += word;
    }
  }
  if (current) lines.push(current.trimEnd());
  return lines;
}

/**
 * Render a fortune as a standalone SVG slip, 600 pixels wide and as tall as
 * its content, to share. The image uses system fonts (Mincho first, then any
 * serif), so it needs no assets; convert it to PNG with any SVG renderer when
 * a site does not take SVG.
 */
export function renderSvg(fortune: Fortune, date: string, lang: Lang, name?: string): string {
  const L = LABELS[lang];
  const x = escapeXml;
  const ink = SVG_INK[rankColor(fortune)];
  const font =
    "'Hiragino Mincho ProN','Yu Mincho','YuMincho','Noto Serif JP','Noto Serif CJK JP',serif";
  const body: string[] = [];
  const spacing = lang === "ja" ? ' letter-spacing="12"' : ' letter-spacing="2"';
  body.push(
    `<text x="300" y="100" text-anchor="middle" font-size="42" fill="#b3262e"${spacing}>${x(L.title)}</text>`,
  );
  body.push(`<text x="300" y="142" text-anchor="middle" font-size="20" fill="#6b5b4b">${x(date)}</text>`);
  let y = 142;
  if (name) {
    const shown = [...name].slice(0, 40).join("");
    const line = lang === "ja" ? `${shown} さん` : `for ${shown}`;
    for (const part of wrapLine(line, 20, 480)) {
      y += 30;
      body.push(
        `<text x="300" y="${y}" text-anchor="middle" font-size="20" fill="#6b5b4b">${x(part)}</text>`,
      );
    }
  }
  y += 180;
  body.push(
    `<text x="300" y="${y}" text-anchor="middle" font-size="140" font-weight="bold" fill="${ink}">${x(fortune.rank.ja)}</text>`,
  );
  if (lang === "en") {
    y += 50;
    body.push(`<text x="300" y="${y}" text-anchor="middle" font-size="30" fill="${ink}">${x(fortune.rank.en)}</text>`);
  }
  y += 45;
  body.push(`<line x1="70" y1="${y}" x2="530" y2="${y}" stroke="#b3262e" stroke-width="1.5"/>`);

  const rows: [string, string][] = fortune.advice.map((a) => [a.label, a.text]);
  if (fortune.season) rows.push([L.season, pair(lang, fortune.season.label, fortune.season.text)]);
  if (fortune.event) rows.push([L.event, pair(lang, fortune.event.label, fortune.event.text)]);
  const textSize = lang === "ja" ? 24 : 19;
  const textX = lang === "ja" ? 160 : 175;
  const textMax = 530 - textX;
  y += 10;
  for (const [label, text] of rows) {
    y += 42;
    body.push(`<text x="70" y="${y}" font-size="22" font-weight="bold" fill="#b3262e">${x(label)}</text>`);
    wrapLine(text, textSize, textMax).forEach((line, i) => {
      if (i > 0) y += textSize + 8;
      body.push(`<text x="${textX}" y="${y}" font-size="${textSize}" fill="#2b2118">${x(line)}</text>`);
    });
  }
  y += 34;
  body.push(`<line x1="70" y1="${y}" x2="530" y2="${y}" stroke="#b3262e" stroke-width="1.5"/>`);

  const { number, color: c, direction, item } = fortune.lucky;
  const lucky: [string, string][] = [
    [L.number, String(number)],
    [L.color, c],
    [L.direction, direction],
    [L.item, item],
  ];
  if (fortune.season) lucky.push([L.seasonItem, fortune.season.item]);
  y += 42;
  body.push(`<text x="70" y="${y}" font-size="22" font-weight="bold" fill="#b3262e">${x(L.lucky)}</text>`);
  // Two columns: label above value, so long English items still fit; a
  // value that does not fit its column wraps, and the row grows with it.
  for (let i = 0; i < lucky.length; i += 2) {
    y += 34;
    let rowLines = 1;
    for (const [col, entry] of [lucky[i], lucky[i + 1]].entries()) {
      if (!entry) continue;
      const cx = col === 0 ? 70 : 310;
      const [label, value] = entry;
      body.push(`<text x="${cx}" y="${y}" font-size="16" fill="#6b5b4b">${x(label)}</text>`);
      const lines = wrapLine(value, 20, 220);
      lines.forEach((line, j) => {
        body.push(`<text x="${cx}" y="${y + 26 + j * 26}" font-size="20" fill="#2b2118">${x(line)}</text>`);
      });
      rowLines = Math.max(rowLines, lines.length);
    }
    y += 26 * rowLines;
  }
  const height = y + 60;

  const out: string[] = [];
  out.push('<?xml version="1.0" encoding="UTF-8"?>');
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}" font-family="${x(font)}">`,
  );
  out.push(`<title>${x(`${L.title} ${date} ${fortune.rank.ja} ${fortune.rank.en}`)}</title>`);
  out.push(`<rect width="600" height="${height}" fill="#fbf6ea"/>`);
  out.push(
    `<rect x="18" y="18" width="564" height="${height - 36}" fill="none" stroke="#b3262e" stroke-width="6"/>`,
  );
  out.push(
    `<rect x="32" y="32" width="536" height="${height - 64}" fill="none" stroke="#b3262e" stroke-width="1.5"/>`,
  );
  out.push(...body);
  out.push("</svg>");
  return out.join("\n") + "\n";
}
