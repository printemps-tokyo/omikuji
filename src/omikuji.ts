import { makeRng, pick, pickWeighted } from "./rng.js";
import {
  ADVICE,
  CATEGORIES,
  CATEGORY_LABELS,
  EVENTS,
  LUCKY,
  RANKS,
  SEASON_ADVICE,
  SEASON_LABELS,
  SEASON_LUCKY,
  type Category,
  type Lang,
  type RankDef,
  type Season,
} from "./data.js";

/** One line of advice on the slip. */
export interface AdviceLine {
  category: Category;
  label: string;
  text: string;
}

/** The seasonal part of the slip. */
export interface SeasonLine {
  season: Season;
  label: string;
  text: string;
  /** A seasonal lucky item. */
  item: string;
}

/** A fixed-date seasonal event that falls on the drawn day. */
export interface EventLine {
  label: string;
  text: string;
}

/** A drawn fortune. */
export interface Fortune {
  rank: RankDef;
  advice: AdviceLine[];
  lucky: { number: number; color: string; item: string; direction: string };
  /** Present when the date is known (see `drawOmikuji`). */
  season?: SeasonLine;
  event?: EventLine;
}

/** The season of a `YYYY-MM-DD` date (Japan Meteorological Agency months). */
export function seasonOf(date: string): Season {
  const month = Number(date.slice(5, 7));
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/** The fixed-date seasonal event on a `YYYY-MM-DD` date, if any. */
export function eventOf(date: string, lang: Lang): EventLine | undefined {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const e = EVENTS.find((ev) => ev.month === month && day >= ev.from && day <= ev.to);
  return e ? { label: e.label[lang], text: e.text[lang] } : undefined;
}

/**
 * Draw a fortune deterministically from a seed. The same seed always yields the
 * same fortune; the rank is chosen by weight and the advice tone follows it.
 *
 * `date` (`YYYY-MM-DD`) adds the seasonal line and the day's event. When it is
 * omitted, a seed that starts with a valid date (as `dailySeed` builds it) is
 * used. The seasonal draws come after all the others, so adding them did not
 * change the rank, advice or lucky items any date already had.
 */
export function drawOmikuji(seed: string, lang: Lang, date?: string): Fortune {
  const rng = makeRng(seed);
  const rank = pickWeighted(
    rng,
    RANKS.map((r) => ({ item: r, weight: r.weight })),
  );
  const advice: AdviceLine[] = CATEGORIES.map((category: Category) => ({
    category,
    label: CATEGORY_LABELS[category][lang],
    text: pick(rng, ADVICE[category][rank.tone][lang]),
  }));
  const lucky = {
    number: 1 + Math.floor(rng() * 49),
    color: pick(rng, LUCKY.colors[lang]),
    item: pick(rng, LUCKY.items[lang]),
    direction: pick(rng, LUCKY.directions[lang]),
  };
  const fortune: Fortune = { rank, advice, lucky };
  const day = date ?? seed.slice(0, 10);
  if (isValidDate(day)) {
    const season = seasonOf(day);
    fortune.season = {
      season,
      label: SEASON_LABELS[season][lang],
      text: pick(rng, SEASON_ADVICE[season][rank.tone][lang]),
      item: pick(rng, SEASON_LUCKY[season][lang]),
    };
    const event = eventOf(day, lang);
    if (event) fortune.event = event;
  }
  return fortune;
}

/** The seed for a given local date (`YYYY-MM-DD`), optionally per name. */
export function dailySeed(date: string, name?: string): string {
  return name ? `${date}|${name}` : date;
}

/** Today's local date as `YYYY-MM-DD`. */
export function todayString(now: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whether `--once` should show the slip: only when the day (or name) changed. */
export function shouldShow(lastShown: string | undefined, todayKey: string): boolean {
  return lastShown !== todayKey;
}

/**
 * Detect the default slip language from locale environment variables.
 * Checks `LC_ALL`, then `LC_MESSAGES`, then `LANG` (empty values are skipped);
 * a locale starting with "ja" (e.g. `ja_JP.UTF-8`) yields "ja", anything else
 * (including no locale at all) yields "en". `--lang` always overrides this.
 */
export function detectLang(env: Readonly<Record<string, string | undefined>>): Lang {
  const locale = env["LC_ALL"] || env["LC_MESSAGES"] || env["LANG"] || "";
  return locale.toLowerCase().startsWith("ja") ? "ja" : "en";
}

/**
 * Whether `input` is a real calendar date written as `YYYY-MM-DD`.
 * The string must match the format and round-trip through the calendar,
 * so impossible dates like `2026-02-30` or `2026-99-99` are rejected while
 * leap days such as `2028-02-29` are accepted. Any four-digit year works,
 * including `0000`-`0099` (proleptic Gregorian; `Date.UTC` alone would map
 * those years into the 1900s and break the round-trip).
 */
export function isValidDate(input: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Start from a fixed epoch and set the full date explicitly: unlike
  // Date.UTC, setUTCFullYear does not remap years 0-99 to 1900-1999.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
